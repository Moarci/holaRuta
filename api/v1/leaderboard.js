/*
 * GET /v1/leaderboard?day=YYYY-MM-DD -> { meId, entries:[{id,name,cards,streak,reviews,day}] }
 * Eigener + Freundes-Snapshots des Tages; Sortierung macht der Client (social.js) deterministisch.
 */
"use strict";
const { send } = require("../_http");
const { resolveUser } = require("../_auth");
const { service } = require("../_supabase");

module.exports = async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const db = service();
  const day = String((req.query && req.query.day) || "");

  const { data: links } = await db.from("friendship").select("friend_id").eq("user_id", userId);
  const ids = [userId, ...(links || []).map((l) => l.friend_id)];

  let query = db.from("daily_snapshot").select("user_id, name, cards, streak, reviews, day").in("user_id", ids);
  if (day) query = query.eq("day", day);
  const { data: snaps } = await query;

  const entries = (snaps || []).map((s) => ({
    id: s.user_id, name: s.name || s.user_id, cards: s.cards, streak: s.streak, reviews: s.reviews, day: s.day,
  }));
  return send(res, 200, { meId: userId, entries });
};
