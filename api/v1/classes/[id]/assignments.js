/*
 * POST /v1/classes/:id/assignments { kind, scope, title, due } -> { id }
 * Nur owner/teacher. Serverseitige Zuweisung (erweitert das encodeTask-Schema).
 */
"use strict";
const { send, readJson } = require("../../../_http");
const { resolveUser } = require("../../../_auth");
const { service } = require("../../../_supabase");
const { roleInClass, isTeacher } = require("../../../_roles");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const classId = String((req.query && req.query.id) || "");

  const { role } = await roleInClass(userId, classId);
  if (!isTeacher(role)) return send(res, 403, { error: "forbidden" });

  const body = await readJson(req);
  const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : null);
  const scope = str(body && body.scope, 100);
  if (!scope) return send(res, 400, { error: "missing scope" });

  const db = service();
  const { data: a, error } = await db
    .from("assignment")
    .insert({
      class_id: classId,
      kind: str(body.kind, 20),
      scope,
      title: str(body.title, 200),
      due: str(body.due, 20),
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) return send(res, 500, { error: "create failed" });
  await db.from("audit_log").insert({ actor: userId, action: "assignment_create", target: a.id });
  return send(res, 200, { id: a.id });
};
