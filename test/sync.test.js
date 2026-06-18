/*
 * sync.test.js – Tests für den REINEN Kern der optionalen Cloud-Sync (sync.js):
 * die verlustarmen Merge-Funktionen aus BACKEND.md §8. Kein Server, kein fetch –
 * genau der Teil, der laut Spec zuerst gebaut & getestet wird.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "sync.js"));
const { sync } = globalThis.window.SC;

const PROGRESS = "spanischcard.progress.v2";
const GAMESTATS = "spanischcard.gamestats.v1";
const SETTINGS = "spanischcard.settings.v1";
const USERCARDS = "spanischcard.usercards.v1";

test("mergeProgress: mehr reps gewinnt, Gleichstand -> spätere due", () => {
  const a = { co01: { reps: 3, due: 100 }, co02: { reps: 1, due: 50 } };
  const b = { co01: { reps: 5, due: 200 }, co03: { reps: 2, due: 70 } };
  const m = sync.mergeProgress(a, b);
  assert.equal(m.co01.reps, 5, "höhere reps gewinnt");
  assert.equal(m.co02.reps, 1, "nur lokal vorhanden bleibt");
  assert.equal(m.co03.reps, 2, "nur remote vorhanden kommt dazu");
  // Gleichstand reps -> spätere due gewinnt.
  const t = sync.mergeProgress({ x: { reps: 4, due: 10 } }, { x: { reps: 4, due: 999 } });
  assert.equal(t.x.due, 999);
});

test("mergeGamestats: Zähler -> max, Mengen -> Union, pretripDays -> Tiefen-Union", () => {
  const a = {
    reviews: 120, dailyStreak: 4, nightOwl: true,
    challengesDone: { challenge01: true, challenge02: true },
    pretripDays: { colombia: { 1: true, 2: true } },
    rutaDays: { "2026-06-10": true },
    lastStudyDate: "2026-06-10",
    unlocked: { first_steps: 111 },
  };
  const b = {
    reviews: 90, dailyStreak: 7, earlyBird: true,
    challengesDone: { challenge02: true, challenge03: true },
    pretripDays: { colombia: { 2: true, 3: true }, peru: { 1: true } },
    rutaDays: { "2026-06-12": true },
    lastStudyDate: "2026-06-12",
    unlocked: { trip_ready: 222 },
  };
  const m = sync.mergeGamestats(a, b);
  assert.equal(m.reviews, 120, "Zähler = max (kein Aufblähen durch Summe)");
  assert.equal(m.dailyStreak, 7);
  assert.equal(m.nightOwl, true);
  assert.equal(m.earlyBird, true);
  assert.deepEqual(Object.keys(m.challengesDone).sort(), ["challenge01", "challenge02", "challenge03"]);
  assert.deepEqual(m.pretripDays, { colombia: { 1: true, 2: true, 3: true }, peru: { 1: true } });
  assert.deepEqual(Object.keys(m.rutaDays).sort(), ["2026-06-10", "2026-06-12"]);
  assert.equal(m.lastStudyDate, "2026-06-12", "spätere Datums-Zeichenkette gewinnt");
  assert.deepEqual(m.unlocked, { first_steps: 111, trip_ready: 222 });
});

test("mergeGamestats: tripGoal – späteres startedAt gewinnt", () => {
  const a = { tripGoal: { destination: "Cartagena", startedAt: "2026-06-01", endDate: "2026-07-01", perDay: 10 } };
  const b = { tripGoal: { destination: "Cusco", startedAt: "2026-06-12", endDate: "2026-08-01", perDay: 15 } };
  assert.equal(sync.mergeGamestats(a, b).tripGoal.destination, "Cusco");
  assert.equal(sync.mergeGamestats(b, a).tripGoal.destination, "Cusco");
  // null-Fall: vorhandenes Ziel bleibt.
  assert.equal(sync.mergeGamestats({ tripGoal: null }, b).tripGoal.destination, "Cusco");
});

test("mergeGamestats: placementHistory wird vereint (dedupe, chronologisch), letztes Ergebnis = späteres", () => {
  const a = {
    placement: { level: "A2", finalScore: 0.62, tempo: "medium", at: "2026-06-15", ts: "2026-06-15T20:00:00.000Z" },
    placementHistory: [
      { level: "A1", finalScore: 0.41, at: "2026-06-10", ts: "2026-06-10T18:00:00.000Z" },
      { level: "A2", finalScore: 0.62, at: "2026-06-15", ts: "2026-06-15T20:00:00.000Z" },
    ],
  };
  const b = {
    placement: { level: "B1-", finalScore: 0.78, tempo: "fast", at: "2026-06-17", ts: "2026-06-17T09:00:00.000Z" },
    placementHistory: [
      { level: "A2", finalScore: 0.62, at: "2026-06-15", ts: "2026-06-15T20:00:00.000Z" }, // Duplikat zu a
      { level: "B1-", finalScore: 0.78, at: "2026-06-17", ts: "2026-06-17T09:00:00.000Z" },
    ],
  };
  const m = sync.mergeGamestats(a, b);
  // Union ohne Duplikat (2 + 2 - 1 gemeinsam = 3), chronologisch sortiert.
  assert.equal(m.placementHistory.length, 3);
  assert.deepEqual(m.placementHistory.map((e) => e.level), ["A1", "A2", "B1-"]);
  // Letztes Ergebnis: das spätere (per ts) gewinnt – reihenfolgeunabhängig.
  assert.equal(m.placement.level, "B1-");
  assert.equal(sync.mergeGamestats(b, a).placement.level, "B1-");
});

test("mergeData: Einstellungen bleiben gerätelokal, Karten werden vereint", () => {
  const local = {
    data: {
      [SETTINGS]: { mode: "type", dir: "de2es" },
      [USERCARDS]: [{ id: "u1", es: "hola" }],
      [PROGRESS]: { co01: { reps: 2, due: 5 } },
      [GAMESTATS]: { reviews: 10 },
    },
  };
  const remote = {
    data: {
      [SETTINGS]: { mode: "flip", dir: "es2de" },
      [USERCARDS]: [{ id: "u2", es: "chau" }],
      [PROGRESS]: { co01: { reps: 9, due: 99 } },
      [GAMESTATS]: { reviews: 30 },
    },
  };
  const m = sync.merge(local, remote);
  assert.deepEqual(m.data[SETTINGS], { mode: "type", dir: "de2es" }, "Einstellungen = lokal");
  assert.equal(m.data[PROGRESS].co01.reps, 9, "Karten-Fortschritt gemerged");
  assert.equal(m.data[GAMESTATS].reviews, 30, "Zähler = max");
  const ids = m.data[USERCARDS].map((c) => c.id).sort();
  assert.deepEqual(ids, ["u1", "u2"], "eigene Karten vereint");
  assert.equal(m.app, "holaruta");
});

test("merge ist kommutativ im Ergebnis (gleiche Mengen/Maxima, egal welche Reihenfolge)", () => {
  const A = { data: { [GAMESTATS]: { reviews: 5, challengesDone: { a: true } }, [PROGRESS]: { c: { reps: 1, due: 1 } } } };
  const B = { data: { [GAMESTATS]: { reviews: 9, challengesDone: { b: true } }, [PROGRESS]: { c: { reps: 3, due: 2 } } } };
  const ab = sync.merge(A, B).data, ba = sync.merge(B, A).data;
  assert.equal(ab[GAMESTATS].reviews, ba[GAMESTATS].reviews);
  assert.deepEqual(Object.keys(ab[GAMESTATS].challengesDone).sort(), Object.keys(ba[GAMESTATS].challengesDone).sort());
  assert.equal(ab[PROGRESS].c.reps, ba[PROGRESS].c.reps);
});

test("mergeUsercards: id-Kollision deterministisch (inhaltsreichere gewinnt, reihenfolgeunabhängig)", () => {
  const a = [{ id: "u1", es: "hola" }];
  const b = [{ id: "u1", es: "hola", de: "hallo", note: "Begrüßung" }]; // reicher
  const ab = sync.mergeUsercards(a, b);
  const ba = sync.mergeUsercards(b, a);
  assert.equal(ab.length, 1);
  assert.deepEqual(ab[0], b[0], "reicheres Objekt gewinnt");
  assert.deepEqual(ba[0], b[0], "auch in umgekehrter Reihenfolge -> gleiches Ergebnis");
});

test("mergeData: unbekannte/künftige Keys werden konservativ vereint (kein Verlust)", () => {
  const local = { data: { "spanischcard.future.v3": { a: 1 } } };
  const remote = { data: { "spanischcard.future.v3": { b: 2 } } };
  const m = sync.merge(local, remote);
  assert.deepEqual(m.data["spanischcard.future.v3"], { a: 1, b: 2 }, "Tiefen-Union statt lokal-gewinnt");
  // nur remote vorhanden -> bleibt erhalten
  assert.deepEqual(sync.merge({ data: {} }, { data: { "x.v1": { k: true } } }).data["x.v1"], { k: true });
});

test("merge toleriert leere/kaputte Eingaben (kein Crash)", () => {
  assert.deepEqual(sync.mergeProgress(null, undefined), {});
  assert.deepEqual(sync.mergeGamestats(null, null), {});
  assert.deepEqual(sync.mergeUsercards(null, "x"), []);
  const m = sync.merge(null, null);
  assert.equal(m.app, "holaruta");
  assert.deepEqual(m.data, {});
});
