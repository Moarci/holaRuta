/*
 * POST /v1/assignments/:id/state { status, progress } -> { ok }
 * Schüler:in meldet den eigenen Fortschritt zu einer Zuweisung (nur eigene Zeile).
 */
"use strict";
const { send, readJson } = require("../../../_http");
const { resolveUser } = require("../../../_auth");
const { service } = require("../../../_supabase");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const assignmentId = String((req.query && req.query.id) || "");
  const body = await readJson(req);

  const db = service();
  // Zuweisung muss existieren und der User in der Klasse eingeschrieben sein.
  const { data: a } = await db.from("assignment").select("class_id").eq("id", assignmentId).maybeSingle();
  if (!a) return send(res, 404, { error: "not found" });
  const { data: enr } = await db.from("enrollment").select("user_id").eq("class_id", a.class_id).eq("user_id", userId).maybeSingle();
  if (!enr) return send(res, 403, { error: "not enrolled" });

  const status = typeof (body && body.status) === "string" ? body.status.slice(0, 20) : "open";
  const progress = Math.max(0, Math.min(100, Math.round(Number(body && body.progress) || 0)));
  await db.from("assignment_state").upsert(
    { assignment_id: assignmentId, user_id: userId, status, progress, updated_at: new Date().toISOString() },
    { onConflict: "assignment_id,user_id" }
  );
  return send(res, 200, { ok: true });
};
