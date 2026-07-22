/*
 * POST /v1/classes { name, orgName? } -> { id, code }
 * Lehrkraft legt eine Klasse an. Hat die Lehrkraft noch keine Org, wird eine
 * persönliche Org (owner) angelegt. Beitritt der Schüler:innen per Code (join.js).
 */
"use strict";
const crypto = require("crypto");
const { send, readJson } = require("../../_http");
const { resolveUser } = require("../../_auth");
const { service } = require("../../_supabase");

function genCode() {
  // 8 Hex-Zeichen (32 Bit) statt 6 (24 Bit) -> deutlich brute-force-resistenter,
  // zusammen mit dem Rate-Limit in join.js.
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const db = service();
  const body = await readJson(req);
  const name = body && String(body.name || "").trim().slice(0, 80);
  if (!name) return send(res, 400, { error: "missing name" });

  // Org der Lehrkraft finden (owner/teacher) oder anlegen.
  const { data: mem } = await db
    .from("membership")
    .select("org_id, role")
    .eq("user_id", userId)
    .in("role", ["owner", "teacher"])
    .limit(1)
    .maybeSingle();

  let orgId = mem && mem.org_id;
  if (!orgId) {
    const orgName = (body && String(body.orgName || "").trim().slice(0, 80)) || name;
    const { data: org, error } = await db.from("org").insert({ name: orgName, plan: "free", seats_total: 0 }).select("id").single();
    if (error) return send(res, 500, { error: "org create failed" });
    orgId = org.id;
    await db.from("membership").insert({ org_id: orgId, user_id: userId, role: "owner" });
  }

  const code = genCode();
  const { data: cls, error: cerr } = await db
    .from("school_class")
    .insert({ org_id: orgId, name, code })
    .select("id, code")
    .single();
  if (cerr) return send(res, 500, { error: "class create failed" });

  await db.from("audit_log").insert({ actor: userId, action: "class_create", target: cls.id });
  return send(res, 200, { id: cls.id, code: cls.code });
};
