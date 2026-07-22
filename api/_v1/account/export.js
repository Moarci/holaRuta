/* GET /v1/account/export -> vollständiger Daten-Download (DSGVO Auskunft). */
"use strict";
const { send } = require("../../_http");
const { resolveUser } = require("../../_auth");
const { service } = require("../../_supabase");
const { rebuild } = require("../../_shred");

module.exports = async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const db = service();

  const q = (t, cols) => db.from(t).select(cols).eq("user_id", userId);
  const [profile, cp, uc, fav, tk, gs, us, friends, snaps] = await Promise.all([
    db.from("profile").select("id, email, locale, display_name, created_at").eq("id", userId).maybeSingle(),
    q("card_progress", "card_id, ease, interval_days, due, reps, seen, history"),
    q("user_card", "id, cat, lvl, de, es, tip, custom"),
    q("favorite", "id, de, es, tip, cat, added_at"),
    q("task", "code, kind, scope, title, due, added_at"),
    db.from("game_stats").select("data").eq("user_id", userId).maybeSingle(),
    db.from("user_settings").select("data").eq("user_id", userId).maybeSingle(),
    q("friendship", "friend_id, created_at"),
    q("daily_snapshot", "day, name, cards, streak, reviews"),
  ]);

  const payload = rebuild({
    card_progress: cp.data || [], user_card: uc.data || [], favorite: fav.data || [],
    task: tk.data || [], game_stats: gs.data || null, user_settings: us.data || null,
  });

  return send(res, 200, {
    app: "holaruta",
    exportedAt: new Date().toISOString(),
    account: profile.data || { id: userId },
    sync: { payload },
    social: { friends: friends.data || [], snapshots: snaps.data || [] },
  });
};
