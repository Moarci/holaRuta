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

// ---- deepUnion direkt mit ÜBERLAPPENDEN Keys (der bisher ungeprüfte Vergleichspfad) ----
test("deepUnion: Zahlen -> max (auch wenn a < b)", () => {
  assert.equal(sync.deepUnion(3, 5), 5);
  assert.equal(sync.deepUnion(5, 3), 5);
  assert.equal(sync.deepUnion(0, 7), 7);
});

test("deepUnion: Booleans -> ODER (true gewinnt)", () => {
  assert.equal(sync.deepUnion(true, false), true);
  assert.equal(sync.deepUnion(false, true), true);
  assert.equal(sync.deepUnion(false, false), false);
});

test("deepUnion: Objekte rekursiv, überlappende numerische Keys -> max", () => {
  assert.deepEqual(sync.deepUnion({ x: 1, y: 2 }, { x: 9, z: 3 }), { x: 9, y: 2, z: 3 });
  // tiefer verschachtelt
  assert.deepEqual(sync.deepUnion({ a: { n: 2 } }, { a: { n: 5, m: 1 } }), { a: { n: 5, m: 1 } });
});

test("deepUnion: gemischt Primitiv/Objekt -> lokales (a) gewinnt, nicht in Objekt-Zweig fallen", () => {
  assert.equal(sync.deepUnion(5, { x: 1 }), 5, "Zahl a bleibt, wird nicht zum Objekt b");
  assert.deepEqual(sync.deepUnion({ x: 1 }, 5), { x: 1 });
  // ungleiche Primitive: a (definiert) gewinnt vor b
  assert.equal(sync.deepUnion("ja", undefined), "ja");
  assert.equal(sync.deepUnion(undefined, "remote"), "remote");
});

test("mergeGamestats: überlappende numerische Map (unlocked) -> Tiefen-Max, nicht überschreiben", () => {
  const a = { unlocked: { first_steps: 111, ten_cards: 5 } };
  const b = { unlocked: { first_steps: 50, ten_cards: 9 } };
  const m = sync.mergeGamestats(a, b);
  assert.equal(m.unlocked.first_steps, 111, "höherer Zeitstempel/Wert gewinnt per max");
  assert.equal(m.unlocked.ten_cards, 9);
  // überlappende boolesche Map -> ODER
  const f = sync.mergeGamestats({ flags: { x: false, y: true } }, { flags: { x: true, y: false } });
  assert.deepEqual(f.flags, { x: true, y: true });
});

test("mergePlacementHistory: Einträge, die sich NUR in ts/Feldern unterscheiden, bleiben distinkt", () => {
  // gleich in allen Fingerabdruck-Feldern AUSSER ts -> zwei verschiedene Läufe.
  const a = { placementHistory: [{ ts: "2026-01-01T10:00:00.000Z", at: "2026-01-01", level: "A1", finalScore: 0.5 }] };
  const b = { placementHistory: [{ ts: "2026-01-01T18:00:00.000Z", at: "2026-01-01", level: "A1", finalScore: 0.5 }] };
  assert.equal(sync.mergeGamestats(a, b).placementHistory.length, 2, "unterschiedliches ts -> beide bleiben");
  // Unterschied nur in accuracy -> ebenfalls distinkt.
  const c = { placementHistory: [{ at: "2026-02-01", level: "A2", accuracy: 0.7 }] };
  const d = { placementHistory: [{ at: "2026-02-01", level: "A2", accuracy: 0.9 }] };
  assert.equal(sync.mergeGamestats(c, d).placementHistory.length, 2);
  // echtes Duplikat (alle Felder gleich) -> fällt zusammen.
  const e = { placementHistory: [{ ts: "t", at: "x", level: "A1", finalScore: 0.5 }] };
  assert.equal(sync.mergeGamestats(e, e).placementHistory.length, 1);
});

test("mergePlacementHistory: chronologisch sortiert und auf 50 gedeckelt", () => {
  const big = Array.from({ length: 60 }, (_, i) => ({ ts: "2026-01-" + String(i + 1).padStart(2, "0"), level: "L" + i }));
  const m = sync.mergeGamestats({ placementHistory: big.slice(0, 30) }, { placementHistory: big.slice(30) });
  assert.equal(m.placementHistory.length, 50, "auf die jüngsten 50 gedeckelt");
  // chronologisch: erstes älter als letztes
  const hist = m.placementHistory;
  assert.ok(hist[0].ts < hist[hist.length - 1].ts, "aufsteigend nach ts sortiert");
  assert.equal(hist[hist.length - 1].ts, "2026-01-60", "jüngster Eintrag bleibt");
});

test("mergeProgress: nicht-endliches reps (Infinity) darf nicht gewinnen (num-Schutz)", () => {
  const m = sync.mergeProgress({ x: { reps: Infinity, due: 0 } }, { x: { reps: 5, due: 0 } });
  assert.equal(m.x.reps, 5, "Infinity wird zu 0 normalisiert, der echte Datensatz gewinnt");
});

test("mergePlacementHistory: JEDES Fingerabdruck-Feld hält Einträge distinkt", () => {
  const base = { ts: "t", at: "a", level: "L", finalScore: 0.1, accuracy: 0.2, unknownRate: 0.3, tempo: "slow" };
  for (const f of ["ts", "at", "level", "finalScore", "accuracy", "unknownRate", "tempo"]) {
    const e2 = Object.assign({}, base);
    e2[f] = typeof base[f] === "number" ? base[f] + 1 : base[f] + "X";
    const m = sync.mergeGamestats({ placementHistory: [base] }, { placementHistory: [e2] });
    assert.equal(m.placementHistory.length, 2, `Unterschied nur in ${f} -> beide Läufe bleiben`);
  }
});

test("mergePlacementHistory: sortiert per (ts || at)-Fallback, wenn ts fehlt", () => {
  // Eingabe absichtlich verkehrt herum; nur `at` vorhanden (keine ts).
  const m = sync.mergeGamestats(
    { placementHistory: [{ at: "2026-03-02", level: "spät" }] },
    { placementHistory: [{ at: "2026-03-01", level: "früh" }] },
  );
  assert.deepEqual(m.placementHistory.map((e) => e.level), ["früh", "spät"], "nach at aufsteigend sortiert");
});

test("mergeGamestats: assessmentProgress – späteres savedAt gewinnt, Gleichstand -> lokal (a)", () => {
  const a = { assessmentProgress: { savedAt: 5, id: "a" } };
  const b = { assessmentProgress: { savedAt: 9, id: "b" } };
  assert.equal(sync.mergeGamestats(a, b).assessmentProgress.id, "b", "höheres savedAt gewinnt");
  assert.equal(sync.mergeGamestats(b, a).assessmentProgress.id, "b");
  // Gleichstand savedAt: a (lokal) bleibt, kein Frankenstein-Merge.
  const eqA = { assessmentProgress: { savedAt: 7, id: "lokal" } };
  const eqB = { assessmentProgress: { savedAt: 7, id: "remote" } };
  assert.equal(sync.mergeGamestats(eqA, eqB).assessmentProgress.id, "lokal", "Gleichstand -> a");
});

test("mergeGamestats: überlappendes boolesches Top-Level-Flag -> ODER", () => {
  assert.equal(sync.mergeGamestats({ nightOwl: true }, { nightOwl: false }).nightOwl, true);
  assert.equal(sync.mergeGamestats({ nightOwl: false }, { nightOwl: true }).nightOwl, true);
  assert.equal(sync.mergeGamestats({ earlyBird: false }, { earlyBird: false }).earlyBird, false);
});

// ---- dünner fetch-Adapter (push / syncNow): SC.net & SC.store gestubbt ----
function withStubs(net, store, cfg, fn) {
  const orig = { net: window.SC.net, store: window.SC.store, config: window.SC.config };
  window.SC.net = net; window.SC.store = store;
  window.SC.config = { sync: Object.assign({ enabled: true, apiBase: "http://test" }, cfg || {}) };
  return Promise.resolve().then(fn).finally(() => {
    window.SC.net = orig.net; window.SC.store = orig.store; window.SC.config = orig.config;
  });
}

test("push: baseRev wird durchgereicht (Default 0, nicht verschluckt)", async () => {
  const bodies = [];
  await withStubs(
    { request: (_b, _m, _p, body) => { bodies.push(body); return Promise.resolve({ ok: true, body: { rev: 1 } }); } },
    {}, {},
    async () => {
      await sync.push({ foo: 1 }, 5);
      await sync.push({ foo: 1 }, 0);
    },
  );
  assert.equal(bodies[0].baseRev, 5, "expliziter baseRev bleibt erhalten");
  assert.equal(bodies[1].baseRev, 0, "fehlender/0 baseRev -> 0");
  assert.equal(bodies[0].payload.foo, 1);
});

test("syncNow: ohne Konflikt -> genau ein Push, rev/status aus der Antwort", async () => {
  const GS = GAMESTATS;
  const pushes = [];
  let imported = null;
  const res = await withStubs(
    {
      loggedIn: () => true,
      request: (_b, method, _p, body) => {
        if (method === "GET") return Promise.resolve({ ok: true, body: { payload: { [GS]: { reviews: 7 } }, rev: 4 } });
        pushes.push(body);
        // Erfolgsantwort trägt absichtlich ein payload: ein 200 darf TROTZDEM
        // keinen 409-Retry auslösen (Schutz gegen status===409-&&-Aufweichung).
        return Promise.resolve({ ok: true, status: 200, body: { rev: 8, payload: { [GS]: { reviews: 7 } } } });
      },
    },
    { exportData: () => ({ data: { [GS]: { reviews: 5 } } }), importData: (m) => { imported = m; } },
    {},
    () => sync.syncNow(),
  );
  assert.equal(pushes.length, 1, "kein überflüssiger zweiter Push ohne 409");
  assert.equal(res.ok, true);
  assert.equal(res.rev, 8, "rev kommt aus pr.body.rev (kein Objekt/Fallback)");
  assert.equal(res.status, 200);
  assert.equal(imported.data[GS].reviews, 7, "gemergter Stand (max) lokal angewendet");
});

test("syncNow: 409-Konflikt -> mit fremdem Stand neu mergen und GENAU einmal erneut pushen", async () => {
  const GS = GAMESTATS;
  const pushes = [];
  let lastImport = null;
  const res = await withStubs(
    {
      loggedIn: () => true,
      request: (_b, method, _p, body) => {
        if (method === "GET") return Promise.resolve({ ok: true, body: { payload: { [GS]: { reviews: 1 } }, rev: 7 } });
        pushes.push(body);
        if (pushes.length === 1) return Promise.resolve({ ok: false, status: 409, body: { payload: { [GS]: { reviews: 99 } }, rev: 8 } });
        return Promise.resolve({ ok: true, status: 200, body: { rev: 9 } });
      },
    },
    { exportData: () => ({ data: { [GS]: { reviews: 5 } } }), importData: (m) => { lastImport = m; } },
    {},
    () => sync.syncNow(),
  );
  assert.equal(pushes.length, 2, "genau ein Retry nach 409");
  assert.equal(res.ok, true);
  assert.equal(res.rev, 9);
  assert.equal(res.status, 200);
  assert.equal(res.changedLocal, true, "Retry hat lokal etwas geändert (changedLocal || changed2)");
  assert.equal(lastImport.data[GS].reviews, 99, "remerge mit dem fremden Stand (max=99) lokal angewendet");
});
