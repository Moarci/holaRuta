/*
 * shred.test.js – Roundtrip-Absicherung des Server-Shred/Rebuild (api/_shred.js):
 * data (Client-Backup-Payload) -> normalisierte Zeilen -> data == data.
 * REINE Funktionen, kein DB/Netz. Kern-Beleg, dass die Normalisierung verlustfrei ist.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { shred, rebuild, KEY } = require(path.join(__dirname, "..", "api", "_shred.js"));

const UID = "00000000-0000-0000-0000-000000000001";

// Vollständig befülltes, repräsentatives data-Objekt (alle sechs KNOWN_KEYS).
function sampleData() {
  return {
    [KEY.PROGRESS]: {
      b01: { ease: 2.5, interval: 3, due: 1720000000000, reps: 4, seen: 6, history: ["g", "g", "e"] },
      "u1a2": { ease: 1.7, interval: 0, due: 1710000000000, reps: 0, seen: 2, history: ["a"] },
    },
    [KEY.SETTINGS]: { mode: "flip", uiLang: "de", speechRate: 0.95, levels: [1, 2, 3] },
    [KEY.USERCARDS]: [
      { id: "u1a2", cat: "eigene", lvl: 2, de: "Hallo", es: "Hola", tip: "OH-lah", custom: true },
    ],
    [KEY.GAMESTATS]: {
      reviews: 120, xp: 340, dailyStreak: 7, longestStreak: 9, lastStudyDate: "2026-07-10",
      challengesDone: { c1: true, c2: true }, unlocked: { first_steps: 111 },
      placementHistory: [{ level: "A2", finalScore: 72, accuracy: 80, review: [], skills: [], at: "2026-07-01", ts: "2026-07-01T10:00:00Z" }],
    },
    [KEY.TASKS]: [
      { code: "HRT1.abc", kind: "preset", scope: "basics", title: "Grundlagen", due: "2026-07-20", addedAt: "2026-07-05" },
    ],
    [KEY.FAVORITES]: [
      { id: "fav1", de: "Danke", es: "Gracias", tip: "GRAH-syas", cat: "hoeflich", addedAt: "2026-07-03" },
    ],
  };
}

// shred() -> die von der Persistenz zurückgelesene Zeilenform nachbilden.
function toRows(shredded) {
  return {
    card_progress: shredded.card_progress || [],
    user_card: shredded.user_card || [],
    favorite: shredded.favorite || [],
    task: shredded.task || [],
    game_stats: shredded.game_stats || null,        // { user_id, data }
    user_settings: shredded.user_settings || null,  // { user_id, data }
  };
}

test("Roundtrip: data -> shred -> rebuild == data (verlustfrei)", () => {
  const data = sampleData();
  const back = rebuild(toRows(shred(UID, data)));
  assert.deepEqual(back, data);
});

test("shred: card_progress trägt user_id + card_id und alle SRS-Felder", () => {
  const s = shred(UID, sampleData());
  const row = s.card_progress.find((r) => r.card_id === "b01");
  assert.equal(row.user_id, UID);
  assert.equal(row.reps, 4);
  assert.equal(row.interval_days, 3);
  assert.deepEqual(row.history, ["g", "g", "e"]);
});

test("shred: game_stats/user_settings landen als JSONB-Kern (verlustfrei, future-proof)", () => {
  const data = sampleData();
  // Ein künftiger, hier unbekannter Zähler muss den Roundtrip überleben.
  data[KEY.GAMESTATS].futureCounterXYZ = 42;
  const back = rebuild(toRows(shred(UID, data)));
  assert.equal(back[KEY.GAMESTATS].futureCounterXYZ, 42);
});

test("shred: fehlende Keys erzeugen keine Tabellen-Writes (kein Löschen)", () => {
  const partial = { [KEY.PROGRESS]: { x: { ease: 2.5, interval: 1, due: 1, reps: 1, seen: 1, history: [] } } };
  const s = shred(UID, partial);
  assert.ok(s.card_progress && s.card_progress.length === 1);
  // Nicht gelieferte Keys -> keine Row-Sets -> die Persistenz fasst diese Tabellen
  // gar nicht an (Union/kein Delete).
  assert.equal(s.user_card, undefined);
  assert.equal(s.favorite, undefined);
  assert.equal(s.task, undefined);
  assert.equal(s.game_stats, undefined);
  assert.equal(s.user_settings, undefined);
});

test("rebuild: leere Zeilenmengen sind harmlos (mergeData bewahrt lokal)", () => {
  // loadRows liefert immer Arrays (ggf. leer) und null für game_stats/user_settings.
  // rebuild emittiert leere Sammlungen; das ist unkritisch, weil runSync IMMER
  // mergeData(local, remote) fährt, bevor importData greift (Union bewahrt lokal).
  const rows = { card_progress: [], user_card: [], favorite: [], task: [], game_stats: null, user_settings: null };
  const back = rebuild(rows);
  assert.deepEqual(back[KEY.PROGRESS], {});
  assert.deepEqual(back[KEY.USERCARDS], []);
  assert.ok(!(KEY.GAMESTATS in back), "kein leeres gamestats -> überschreibt nie den lokalen Stand");
  assert.ok(!(KEY.SETTINGS in back), "kein leeres settings");
});
