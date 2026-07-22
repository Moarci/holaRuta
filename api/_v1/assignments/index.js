/*
 * GET /v1/assignments?class=… -> { assignments:[…] }
 * Zugriff für Mitglieder der Org der Klasse (Lehrkraft sieht alle, Schüler ihre).
 */
"use strict";
const { send } = require("../../_http");
const { resolveUser } = require("../../_auth");
const { service } = require("../../_supabase");
const { roleInClass, isTeacher } = require("../../_roles");

module.exports = async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const classId = String((req.query && req.query.class) || "");
  if (!classId) return send(res, 400, { error: "missing class" });

  const { role } = await roleInClass(userId, classId);
  if (!role) return send(res, 403, { error: "forbidden" });
  // Lehrkraft/Owner sehen die Klasse; ein bloßes Org-Mitglied (student in EINER
  // anderen Klasse derselben Org) darf NICHT die Assignments einer fremden Klasse
  // lesen -> für Nicht-Lehrkräfte zusätzlich Einschreibung in GENAU dieser Klasse
  // verlangen (verhindert Cross-Class-IDOR).
  if (!isTeacher(role)) {
    const { data: enr } = await service()
      .from("enrollment").select("user_id").eq("class_id", classId).eq("user_id", userId).maybeSingle();
    if (!enr) return send(res, 403, { error: "forbidden" });
  }

  const db = service();
  const { data } = await db
    .from("assignment")
    .select("id, class_id, kind, scope, title, due, created_by, created_at")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  return send(res, 200, { assignments: data || [] });
};
