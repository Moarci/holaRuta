/*
 * api/_roles.js – Org-/Rollen-Scoping für die B2B-Endpunkte. Ein Schüler sieht nie
 * fremde Schüler; nur owner/teacher sehen Roster/legen Zuweisungen an.
 */
"use strict";
const { service } = require("./_supabase");

// Rolle eines Users in der Org einer Klasse (oder null).
async function roleInClass(userId, classId) {
  const db = service();
  const { data: cls } = await db.from("school_class").select("org_id").eq("id", classId).maybeSingle();
  if (!cls) return { role: null, orgId: null };
  const { data: mem } = await db
    .from("membership")
    .select("role")
    .eq("org_id", cls.org_id)
    .eq("user_id", userId)
    .maybeSingle();
  return { role: mem ? mem.role : null, orgId: cls.org_id };
}

function isTeacher(role) {
  return role === "owner" || role === "teacher";
}

module.exports = { roleInClass, isTeacher };
