/*
 * POST /v1/classes/:id/join { code } -> { joined }
 * Schüler:in tritt einer Klasse per Code bei: enrollment + student-membership +
 * Seat-Belegung (soft, blockiert nie – offline-first, BACKEND.md §9).
 */
"use strict";
const { send, readJson } = require("../../../_http");
const { resolveUser } = require("../../../_auth");
const { service } = require("../../../_supabase");
const { allow } = require("../../../_ratelimit");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const classId = String((req.query && req.query.id) || "");
  // Rate-Limit gegen Code-Brute-Force (pro Klasse UND pro Nutzer).
  if (!(await allow("join:" + classId, 20, 600)) || !(await allow("joinu:" + userId, 20, 600))) {
    return send(res, 429, { error: "rate limited" });
  }
  const body = await readJson(req);
  const code = body && String(body.code || "").trim().toUpperCase();
  const db = service();

  const { data: cls } = await db.from("school_class").select("id, org_id, code").eq("id", classId).maybeSingle();
  if (!cls) return send(res, 404, { error: "class not found" });
  if (!code || code !== String(cls.code || "").toUpperCase()) return send(res, 403, { error: "bad code" });

  await db.from("enrollment").upsert({ class_id: classId, user_id: userId }, { onConflict: "class_id,user_id" });
  // student-Rolle nur setzen, wenn noch keine (owner/teacher nicht herabstufen).
  const { data: mem } = await db.from("membership").select("role").eq("org_id", cls.org_id).eq("user_id", userId).maybeSingle();
  if (!mem) await db.from("membership").insert({ org_id: cls.org_id, user_id: userId, role: "student" });
  await db.from("license_seat").upsert({ org_id: cls.org_id, user_id: userId }, { onConflict: "org_id,user_id" });

  return send(res, 200, { joined: classId });
};
