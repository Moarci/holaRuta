/*
 * GET  /v1/sync            -> { rev, payload }   (Server-Stand rekonstruieren)
 * PUT  /v1/sync {baseRev,payload} -> { rev }  oder 409 { rev, payload }
 *
 * Konsistenz: atomarer rev-CAS (sync_bump) ZUERST. Gewinnt der CAS, werden die
 * normalisierten Tabellen per Upsert (ohne Delete) geschrieben – idempotent +
 * kommutativ, daher auch bei Teil-Fehler verlustfrei (Client retryt). Verliert der
 * CAS (anderes Gerät war schneller), 409 mit aktuellem Stand -> Client merged neu.
 */
"use strict";
const { send, readJson, jsonBytes } = require("../_http");
const { resolveUser } = require("../_auth");
const { allow } = require("../_ratelimit");
const { service } = require("../_supabase");
const { shred, rebuild } = require("../_shred");

// Serverseitiges Payload-Limit (synchron zu sync.js MAX_PAYLOAD_BYTES, R1).
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024;

const ONCONFLICT = {
  card_progress: "user_id,card_id",
  user_card: "user_id,id",
  favorite: "user_id,id",
  task: "user_id,code",
  game_stats: "user_id",
  user_settings: "user_id",
};

async function loadRows(db, userId) {
  const q = (t, cols) => db.from(t).select(cols).eq("user_id", userId);
  const [cp, uc, fav, tk, gs, us] = await Promise.all([
    q("card_progress", "card_id, ease, interval_days, due, reps, seen, history"),
    q("user_card", "id, cat, lvl, de, es, tip, custom"),
    q("favorite", "id, de, es, tip, cat, added_at"),
    q("task", "code, kind, scope, title, due, added_at"),
    db.from("game_stats").select("data").eq("user_id", userId).maybeSingle(),
    db.from("user_settings").select("data").eq("user_id", userId).maybeSingle(),
  ]);
  return {
    card_progress: cp.data || [],
    user_card: uc.data || [],
    favorite: fav.data || [],
    task: tk.data || [],
    game_stats: gs.data || null,
    user_settings: us.data || null,
  };
}

async function currentRev(db, userId) {
  const { data } = await db.rpc("sync_rev", { p_user: userId });
  return typeof data === "number" ? data : 0;
}

async function persist(db, shredded) {
  const now = new Date().toISOString();
  const jobs = [];
  for (const table of ["card_progress", "user_card", "favorite", "task"]) {
    const rows = shredded[table];
    if (Array.isArray(rows) && rows.length) {
      jobs.push(db.from(table).upsert(rows, { onConflict: ONCONFLICT[table] }));
    }
  }
  for (const table of ["game_stats", "user_settings"]) {
    if (shredded[table]) {
      jobs.push(db.from(table).upsert({ ...shredded[table], updated_at: now }, { onConflict: ONCONFLICT[table] }));
    }
  }
  const results = await Promise.all(jobs);
  const failed = results.find((r) => r && r.error);
  if (failed) throw new Error("persist failed: " + failed.error.message);
}

module.exports = async (req, res) => {
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const db = service();

  if (req.method === "GET") {
    const rows = await loadRows(db, userId);
    const rev = await currentRev(db, userId);
    return send(res, 200, { rev, payload: rebuild(rows) });
  }

  if (req.method === "PUT") {
    if (!(await allow("sync:" + userId, 60, 60))) return send(res, 429, { error: "rate limited" });
    const body = await readJson(req);
    if (!body || typeof body.payload !== "object" || body.payload === null) {
      return send(res, 400, { error: "bad payload" });
    }
    if (jsonBytes(body.payload) > MAX_PAYLOAD_BYTES) return send(res, 413, { error: "payload too large" });

    const baseRev = typeof body.baseRev === "number" ? body.baseRev : 0;
    const { data: newRev } = await db.rpc("sync_bump", { p_user: userId, p_base_rev: baseRev });
    if (newRev == null) {
      // Konflikt: aktuellen Stand zurückgeben, Client merged + retry (sync.js 409-Pfad).
      const rows = await loadRows(db, userId);
      const rev = await currentRev(db, userId);
      return send(res, 409, { rev, payload: rebuild(rows) });
    }
    try {
      await persist(db, shred(userId, body.payload));
    } catch (e) {
      return send(res, 500, { error: "persist failed" });
    }
    return send(res, 200, { rev: newRev });
  }

  return send(res, 405, { error: "method not allowed" });
};
