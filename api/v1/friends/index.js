/*
 * GET  /v1/friends            -> { friends: [{ id, name }] }
 * POST /v1/friends { code }    -> { added }   (beidseitige Freundschaft)
 */
"use strict";
const { send, readJson } = require("../../_http");
const { resolveUser } = require("../../_auth");
const { service } = require("../../_supabase");
const { parseFriendCode } = require("../../_friendcode");

module.exports = async (req, res) => {
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const db = service();

  if (req.method === "GET") {
    const { data: links } = await db.from("friendship").select("friend_id").eq("user_id", userId);
    const ids = (links || []).map((l) => l.friend_id);
    if (!ids.length) return send(res, 200, { friends: [] });
    // Anzeigename bevorzugt aus dem letzten Tages-Snapshot, sonst profile.display_name.
    const [{ data: snaps }, { data: profs }] = await Promise.all([
      db.from("daily_snapshot").select("user_id, name, day").in("user_id", ids),
      db.from("profile").select("id, display_name").in("id", ids),
    ]);
    const nameByLatestSnap = {};
    for (const s of snaps || []) {
      const cur = nameByLatestSnap[s.user_id];
      if (!cur || (s.day || "") > cur.day) nameByLatestSnap[s.user_id] = { name: s.name, day: s.day || "" };
    }
    const dispById = {};
    for (const p of profs || []) dispById[p.id] = p.display_name;
    const friends = ids.map((id) => ({
      id,
      name: (nameByLatestSnap[id] && nameByLatestSnap[id].name) || dispById[id] || id,
    }));
    return send(res, 200, { friends });
  }

  if (req.method === "POST") {
    const body = await readJson(req);
    const other = parseFriendCode(body && body.code);
    if (!other) return send(res, 400, { error: "bad code" });
    if (other === userId) return send(res, 400, { error: "self" });
    // Zielkonto muss existieren.
    const { data: exists } = await db.from("profile").select("id").eq("id", other).maybeSingle();
    if (!exists) return send(res, 400, { error: "unknown code" });
    // Beidseitig anlegen (symmetrisch), idempotent.
    await db.from("friendship").upsert(
      [{ user_id: userId, friend_id: other }, { user_id: other, friend_id: userId }],
      { onConflict: "user_id,friend_id" }
    );
    return send(res, 200, { added: other });
  }

  return send(res, 405, { error: "method not allowed" });
};
