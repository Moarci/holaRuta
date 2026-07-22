/*
 * GET /v1/classes/:id/roster -> { students:[{ id, name, xp, reviews, dailyStreak, lastStudyDate }] }
 * Nur owner/teacher. Kennzahlen kommen aus den generierten game_stats-Spalten
 * (dieselben Werte wie „Modo profe" heute, nur serverseitig aggregiert).
 */
"use strict";
const { send } = require("../../../_http");
const { resolveUser } = require("../../../_auth");
const { service } = require("../../../_supabase");
const { roleInClass, isTeacher } = require("../../../_roles");

module.exports = async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const classId = String((req.query && req.query.id) || "");

  const { role } = await roleInClass(userId, classId);
  if (!isTeacher(role)) return send(res, 403, { error: "forbidden" });

  const db = service();
  const { data: enr } = await db.from("enrollment").select("user_id").eq("class_id", classId);
  const ids = (enr || []).map((e) => e.user_id);
  if (!ids.length) return send(res, 200, { students: [] });

  const [{ data: profs }, { data: stats }] = await Promise.all([
    db.from("profile").select("id, display_name, email").in("id", ids),
    db.from("game_stats").select("user_id, xp, reviews, daily_streak, last_study_date").in("user_id", ids),
  ]);
  const nameById = {};
  for (const p of profs || []) nameById[p.id] = p.display_name || p.email || p.id;
  const statById = {};
  for (const s of stats || []) statById[s.user_id] = s;

  const students = ids.map((id) => {
    const s = statById[id] || {};
    return {
      id,
      name: nameById[id] || id,
      xp: s.xp || 0,
      reviews: s.reviews || 0,
      dailyStreak: s.daily_streak || 0,
      lastStudyDate: s.last_study_date || null,
    };
  });
  return send(res, 200, { students });
};
