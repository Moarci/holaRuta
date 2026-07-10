/*
 * api/_shred.js – Übersetzung zwischen dem Client-Backup-Payload (store.exportData().data,
 * keyed nach spanischcard.*) und den normalisierten Postgres-Tabellen. REINE FUNKTIONEN,
 * ohne DB-/Netz-Abhängigkeit -> in test/shred.test.js per Roundtrip abgesichert
 * (data -> Zeilen -> data == data).
 *
 * Merge-Semantik (BACKEND.md §8) liegt in der Persistenz: alle Tabellen werden per
 * Upsert (INSERT … ON CONFLICT DO UPDATE) OHNE DELETE geschrieben -> Union/Overwrite,
 * idempotent + kommutativ. Der Client hat vor dem Push bereits pull+merge gemacht
 * (sync.js runSync), der gepushte Stand ist also ein Superset im Merge-Verband.
 */
"use strict";

const KEY = {
  PROGRESS: "spanischcard.progress.v2",
  SETTINGS: "spanischcard.settings.v1",
  USERCARDS: "spanischcard.usercards.v1",
  GAMESTATS: "spanischcard.gamestats.v1",
  TASKS: "spanischcard.tasks.v1",
  FAVORITES: "spanischcard.favorites.v1",
};

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);

// data (payload.data) -> { table: rows } für die Persistenz. Nur vorhandene Keys
// werden zu Tabellen; fehlt ein Key, wird die Tabelle nicht angefasst (kein Löschen).
function shred(userId, data) {
  const d = isObj(data) ? data : {};
  const out = {};

  if (isObj(d[KEY.PROGRESS])) {
    out.card_progress = Object.keys(d[KEY.PROGRESS]).map((cardId) => {
      const r = isObj(d[KEY.PROGRESS][cardId]) ? d[KEY.PROGRESS][cardId] : {};
      return {
        user_id: userId,
        card_id: cardId,
        ease: num(r.ease, 2.5),
        interval_days: num(r.interval, 0),
        due: num(r.due, 0),
        reps: num(r.reps, 0),
        seen: num(r.seen, 0),
        history: Array.isArray(r.history) ? r.history : [],
      };
    });
  }

  if (Array.isArray(d[KEY.USERCARDS])) {
    out.user_card = d[KEY.USERCARDS]
      .filter((c) => c && c.id)
      .map((c) => ({
        user_id: userId,
        id: String(c.id),
        cat: c.cat != null ? String(c.cat) : null,
        lvl: num(c.lvl, null),
        de: c.de != null ? String(c.de) : null,
        es: c.es != null ? String(c.es) : null,
        tip: c.tip != null ? String(c.tip) : null,
        custom: c.custom !== false,
      }));
  }

  if (Array.isArray(d[KEY.FAVORITES])) {
    out.favorite = d[KEY.FAVORITES]
      .filter((f) => f && f.id)
      .map((f) => ({
        user_id: userId,
        id: String(f.id),
        de: f.de != null ? String(f.de) : null,
        es: f.es != null ? String(f.es) : null,
        tip: f.tip != null ? String(f.tip) : null,
        cat: f.cat != null ? String(f.cat) : null,
        added_at: f.addedAt != null ? String(f.addedAt) : null,
      }));
  }

  if (Array.isArray(d[KEY.TASKS])) {
    out.task = d[KEY.TASKS]
      .filter((t) => t && t.code)
      .map((t) => ({
        user_id: userId,
        code: String(t.code),
        kind: t.kind != null ? String(t.kind) : null,
        scope: t.scope != null ? String(t.scope) : null,
        title: t.title != null ? String(t.title) : null,
        due: t.due != null ? String(t.due) : null,
        added_at: t.addedAt != null ? String(t.addedAt) : null,
      }));
  }

  if (KEY.GAMESTATS in d) {
    out.game_stats = { user_id: userId, data: isObj(d[KEY.GAMESTATS]) ? d[KEY.GAMESTATS] : {} };
  }
  if (KEY.SETTINGS in d) {
    out.user_settings = { user_id: userId, data: isObj(d[KEY.SETTINGS]) ? d[KEY.SETTINGS] : {} };
  }

  return out;
}

// Normalisierte Zeilen -> payload.data (keyed nach spanischcard.*). Baut GET /v1/sync.
// rows: { card_progress, user_card, favorite, task, game_stats, user_settings }.
function rebuild(rows) {
  const r = rows || {};
  const data = {};

  if (Array.isArray(r.card_progress)) {
    const prog = {};
    for (const row of r.card_progress) {
      prog[row.card_id] = {
        ease: num(row.ease, 2.5),
        interval: num(row.interval_days, 0),
        due: num(row.due, 0),
        reps: num(row.reps, 0),
        seen: num(row.seen, 0),
        history: Array.isArray(row.history) ? row.history : [],
      };
    }
    data[KEY.PROGRESS] = prog;
  }

  if (Array.isArray(r.user_card)) {
    data[KEY.USERCARDS] = r.user_card.map((c) => {
      const card = { id: c.id, cat: c.cat, lvl: c.lvl, de: c.de, es: c.es, custom: c.custom !== false };
      if (c.tip != null) card.tip = c.tip;
      return card;
    });
  }

  if (Array.isArray(r.favorite)) {
    data[KEY.FAVORITES] = r.favorite.map((f) => ({
      id: f.id, de: f.de, es: f.es, tip: f.tip != null ? f.tip : "", cat: f.cat != null ? f.cat : "",
      addedAt: f.added_at != null ? f.added_at : "",
    }));
  }

  if (Array.isArray(r.task)) {
    data[KEY.TASKS] = r.task.map((t) => ({
      code: t.code, kind: t.kind, scope: t.scope,
      title: t.title != null ? t.title : "", due: t.due != null ? t.due : "",
      addedAt: t.added_at != null ? t.added_at : "",
    }));
  }

  if (r.game_stats && isObj(r.game_stats.data)) data[KEY.GAMESTATS] = r.game_stats.data;
  if (r.user_settings && isObj(r.user_settings.data)) data[KEY.SETTINGS] = r.user_settings.data;

  return data;
}

module.exports = { shred, rebuild, KEY };
