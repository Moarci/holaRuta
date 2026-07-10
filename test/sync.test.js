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
const FAVORITES = "spanischcard.favorites.v1";

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

test("mergeData: Favoriten (Mi lexico) werden ueber die Id vereint (kein Geraete-Verlust)", () => {
  // Regression: ohne Sonder-Routing fielen Array-Favoriten in deepUnion -> „lokal
  // gewinnt", und auf zwei Geräten gemerkte Favoriten löschten sich gegenseitig.
  const local = { data: { [FAVORITES]: [{ id: "alltag-hola", de: "Hallo", es: "Hola" }] } };
  const remote = { data: { [FAVORITES]: [{ id: "fav-abc", de: "Danke", es: "Gracias" }] } };
  const ab = sync.merge(local, remote).data[FAVORITES];
  const ba = sync.merge(remote, local).data[FAVORITES];
  assert.deepEqual(ab.map((f) => f.id).sort(), ["alltag-hola", "fav-abc"], "beide Geräte-Favoriten bleiben erhalten");
  assert.deepEqual(ba.map((f) => f.id).sort(), ["alltag-hola", "fav-abc"], "reihenfolgeunabhängig");
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

test("mergeProgress: ungültiges Zahlenfeld fällt auf 0 (nicht 1) – num()-Default", () => {
  // reps 0 (kein 1e15-Term, der den Bruch verschlucken würde); due einmal ungültig
  // (undefined -> num()=0) vs 0.5 -> der finite due gewinnt. Mit kaputtem Default 1
  // wäre num(undefined)=1 > 0.5 und a (due undefined) gewänne fälschlich.
  const a = { c1: { reps: 0, due: undefined } }; // score 0 + num(undefined)
  const b = { c1: { reps: 0, due: 0.5 } };        // score 0 + 0.5
  assert.equal(sync.mergeProgress(a, b).c1.due, 0.5, "num(undefined)=0 < 0.5 -> b gewinnt");
});

test("mergeGamestats: assessmentProgress ohne savedAt zählt als 0 (nicht 1) – beide Richtungen", () => {
  // b ohne savedAt -> qb=0; a mit 0.5 behält (qb 0 > qa 0.5 ist falsch).
  const a = { assessmentProgress: { savedAt: 0.5, id: "a" } };
  const b = { assessmentProgress: { id: "b" } };
  assert.equal(sync.mergeGamestats(a, b).assessmentProgress.id, "a", "fehlendes savedAt rechts -> 0");
  // a ohne savedAt -> qa=0; b mit 0.5 gewinnt.
  const a2 = { assessmentProgress: { id: "a" } };
  const b2 = { assessmentProgress: { savedAt: 0.5, id: "b" } };
  assert.equal(sync.mergeGamestats(a2, b2).assessmentProgress.id, "b", "fehlendes savedAt links -> 0");
});

test("mergeGamestats: String vs Nicht-String -> lokaler Wert bleibt (Typwächter ist UND, nicht ODER)", () => {
  // va String, vb Zahl: kein Typ-Zweig trifft -> finaler else behält va. Mit kaputtem
  // ODER würde fälschlich `va >= vb ? va : vb` (String vs Zahl) ausgewertet -> 5.
  assert.equal(sync.mergeGamestats({ foo: "x" }, { foo: 5 }).foo, "x");
});

test("mergeUsercards: gleiche Id, gleich lange Inhalte -> erste Variante bleibt (strikt >)", () => {
  // {id:"x",v:1} und {id:"x",v:2} haben dieselbe JSON-Länge: bei `>` bleibt die zuerst
  // gesehene, bei kaputtem `>=` würde die zweite sie überschreiben.
  assert.equal(sync.mergeUsercards([{ id: "x", v: 1 }], [{ id: "x", v: 2 }])[0].v, 1);
});

test("merge: format-Vorrang l über r, Default 1 wenn beide fehlen", () => {
  assert.equal(sync.merge({ format: 2, data: {} }, { format: 3, data: {} }).format, 2, "l.format gewinnt (erstes ||)");
  assert.equal(sync.merge({ data: {} }, { data: {} }).format, 1, "beide fehlen -> Default 1 (zweites ||)");
});

test("syncNow: fehlgeschlagener Pull (ok:false) mit payload wird NICHT übernommen", async () => {
  const GS = GAMESTATS;
  let pushed = null;
  await withStubs(
    {
      loggedIn: () => true,
      request: (_b, method, _p, body) => {
        // Pull schlägt fehl, trägt aber ein payload: das darf NICHT als remote gelten.
        if (method === "GET") return Promise.resolve({ ok: false, status: 500, body: { payload: { [GS]: { reviews: 99 } }, rev: 5 } });
        pushed = body; return Promise.resolve({ ok: true, status: 200, body: { rev: 1 } });
      },
    },
    { exportData: () => ({ data: { [GS]: { reviews: 5 } } }), importData: () => {} },
    {},
    () => sync.syncNow(),
  );
  assert.equal(pushed.payload[GS].reviews, 5, "ok:false -> remote ignoriert, nur lokaler Stand (5) gepusht");
  assert.equal(pushed.baseRev, 0, "ok:false -> baseRev fällt auf 0 zurück");
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

test("push: lehnt zu große Payloads vorab ab (2 MB, R1) – kein Request", async () => {
  let called = false;
  const big = { blob: "x".repeat(2 * 1024 * 1024 + 1024) }; // > 2 MB als JSON
  await withStubs(
    { request: () => { called = true; return Promise.resolve({ ok: true, body: {} }); } },
    {}, {},
    async () => { await assert.rejects(() => sync.push(big, 0), /payload too large/); },
  );
  assert.equal(called, false, "übergroßer Push erreicht das Netzwerk gar nicht");
});

test("push: Power-User-Payload geht durch (deutlich unter dem 2-MB-Limit)", async () => {
  let called = false;
  // ~300 KB: würde am alten 256-KB-Limit (R1) scheitern, unter 2 MB nun erlaubt –
  // verriegelt, dass ein Power-User (viele Karten + placementHistory) syncen kann.
  const ok = { blob: "x".repeat(300 * 1024) };
  await withStubs(
    { request: () => { called = true; return Promise.resolve({ ok: true, body: { rev: 1 } }); } },
    {}, {},
    async () => { const r = await sync.push(ok, 0); assert.equal(r.ok, true); },
  );
  assert.equal(called, true, "Power-User-Payload wird gesendet");
});

test("push: Payload exakt am Limit (2 MB) wird noch akzeptiert (Grenze ist exklusiv: >)", async () => {
  let called = false;
  // JSON {"blob":"x…x"} = N + 11 Bytes (ASCII). N so, dass es GENAU 2*1024*1024 Bytes sind.
  const exact = { blob: "x".repeat(2 * 1024 * 1024 - 11) };
  await withStubs(
    { request: () => { called = true; return Promise.resolve({ ok: true, body: { rev: 1 } }); } },
    {}, {},
    async () => { await sync.push(exact, 0); },
  );
  assert.equal(called, true, "genau am Limit -> akzeptiert (>, nicht >=)");
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

test("syncNow: Single-Flight – parallele Aufrufe teilen EINEN Sync (kein Doppel-Pull/-Push)", async () => {
  const GS = GAMESTATS;
  let pulls = 0, pushes = 0;
  let a, b;
  await withStubs(
    {
      loggedIn: () => true,
      request: (_b, method) => {
        if (method === "GET") {
          pulls++;
          // Pull bewusst verzögern, damit der zweite syncNow() WÄHREND des ersten kommt.
          return new Promise((r) => setTimeout(() => r({ ok: true, body: { payload: { [GS]: { reviews: 1 } }, rev: 1 } }), 5));
        }
        pushes++; return Promise.resolve({ ok: true, status: 200, body: { rev: 2 } });
      },
    },
    { exportData: () => ({ data: { [GS]: { reviews: 1 } } }), importData: () => {} },
    {},
    async () => {
      a = sync.syncNow();
      b = sync.syncNow(); // während a noch im Pull hängt
      assert.equal(a, b, "zweiter Aufruf liefert denselben in-flight Promise");
      await Promise.all([a, b]);
    },
  );
  assert.equal(pulls, 1, "nur EIN Pull trotz zwei syncNow-Aufrufen");
  assert.equal(pushes, 1, "nur EIN Push");
});

test("syncNow: nach Abschluss ist wieder ein neuer Sync möglich (Single-Flight gibt frei)", async () => {
  const GS = GAMESTATS;
  let pulls = 0;
  await withStubs(
    {
      loggedIn: () => true,
      request: (_b, method) => {
        if (method === "GET") { pulls++; return Promise.resolve({ ok: true, body: { payload: {}, rev: 1 } }); }
        return Promise.resolve({ ok: true, status: 200, body: { rev: 2 } });
      },
    },
    { exportData: () => ({ data: { [GS]: { reviews: 1 } } }), importData: () => {} },
    {},
    async () => {
      await sync.syncNow();
      await sync.syncNow(); // sequenziell: zweiter läuft, weil der erste fertig ist
    },
  );
  assert.equal(pulls, 2, "zwei nacheinander awaitete Syncs laufen beide (kein Verschlucken)");
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

// ---- Nachzug (Merge nach main-Merge): placement-ts ohne 'at', Adapter-Basis/rev ----
test("mergeGamestats: placement – späteres ts gewinnt auch OHNE 'at'-Feld", () => {
  // ts vorhanden, at fehlt: das spätere Ergebnis muss dennoch gewinnen (ts || at).
  const a = { placement: { ts: "2026-01-01T00:00:00Z", level: "A" } };
  const b = { placement: { ts: "2026-01-09T00:00:00Z", level: "B" } };
  assert.equal(sync.mergeGamestats(a, b).placement.level, "B");
  assert.equal(sync.mergeGamestats(b, a).placement.level, "B");
});

test("apiBase: req nutzt die slash-bereinigte Basis aus der Config (nicht leer)", async () => {
  let base = null;
  await withStubs(
    { loggedIn: () => true, request: (b) => { base = b; return Promise.resolve({ ok: true, body: {} }); } },
    {}, { apiBase: "http://test/" },
    () => sync.pull(),
  );
  assert.equal(base, "http://test", "Basis ohne Trailing-Slash, NICHT ''");
});

test("syncNow: push trägt den baseRev aus dem pull-rev (nicht 0)", async () => {
  const GS = GAMESTATS; const pushes = [];
  await withStubs(
    { loggedIn: () => true, request: (_b, method, _p, body) => {
        if (method === "GET") return Promise.resolve({ ok: true, body: { payload: { [GS]: { reviews: 1 } }, rev: 7 } });
        pushes.push(body); return Promise.resolve({ ok: true, status: 200, body: { rev: 8 } });
      } },
    { exportData: () => ({ data: { [GS]: { reviews: 5 } } }), importData: () => {} },
    {}, () => sync.syncNow(),
  );
  assert.equal(pushes[0].baseRev, 7, "baseRev = rev aus dem pull, nicht 0");
});

test("syncNow: 409-Retry pusht mit dem Konflikt-rev (Default greift nur als Fallback)", async () => {
  const GS = GAMESTATS; const pushes = [];
  await withStubs(
    { loggedIn: () => true, request: (_b, method, _p, body) => {
        if (method === "GET") return Promise.resolve({ ok: true, body: { payload: { [GS]: { reviews: 1 } }, rev: 7 } });
        pushes.push(body);
        if (pushes.length === 1) return Promise.resolve({ ok: false, status: 409, body: { payload: { [GS]: { reviews: 9 } }, rev: 8 } });
        return Promise.resolve({ ok: true, status: 200, body: { rev: 10 } });
      } },
    { exportData: () => ({ data: { [GS]: { reviews: 5 } } }), importData: () => {} },
    {}, () => sync.syncNow(),
  );
  assert.equal(pushes[1].baseRev, 8, "Retry nutzt den rev aus der 409-Antwort");
});

test("syncNow: 409 mit rev 0 -> Retry-baseRev bleibt 0 (nicht 1)", async () => {
  const GS = GAMESTATS; const pushes = [];
  await withStubs(
    { loggedIn: () => true, request: (_b, method, _p, body) => {
        if (method === "GET") return Promise.resolve({ ok: true, body: { payload: {}, rev: 0 } });
        pushes.push(body);
        if (pushes.length === 1) return Promise.resolve({ ok: false, status: 409, body: { payload: { [GS]: { reviews: 2 } }, rev: 0 } });
        return Promise.resolve({ ok: true, status: 200, body: { rev: 1 } });
      } },
    { exportData: () => ({ data: { [GS]: { reviews: 5 } } }), importData: () => {} },
    {}, () => sync.syncNow(),
  );
  assert.equal(pushes[1].baseRev, 0, "rev 0 bleibt 0, nicht 1");
});

// ============================================================================
// Gezielte Mutations-Killer (Engine-Gate No-Regression für sync.js). Jeder Test
// unten tötet exakt einen sonst überlebenden Mutanten.
// ============================================================================

test("mergeProgress: mehr reps gewinnt AUCH bei riesigem due der schwächeren Karte (progressScore: * nicht +)", () => {
  // Mutant sync.js progressScore `reps*1e15` -> `reps+1e15`: dann dominiert due die
  // reps-Differenz und die Karte mit WENIGER Wiederholungen (aber großem due) gewänne.
  const a = { c: { reps: 2, due: 0 } };
  const b = { c: { reps: 1, due: 5e14 } };
  assert.equal(sync.mergeProgress(a, b).c.reps, 2, "reps=2 gewinnt trotz kleinem due gegen reps=1 mit riesigem due");
});

test("mergeGamestats: boolean-Wert bleibt bei nicht-boolean Gegenwert erhalten (boolean-Zweig braucht &&, nicht ||)", () => {
  // Mutant `typeof va==="boolean" && typeof vb==="boolean"` -> `||`: dann liefe
  // out = va || vb auch, wenn nur EINER boolean ist -> false || 5 = 5 statt false.
  const m = sync.mergeGamestats({ someFlag: false }, { someFlag: 5 });
  assert.equal(m.someFlag, false, "va=false (boolean) bleibt, wird nicht durch vb=5 ersetzt");
});

test("mergeTasks: gleich lange Inhalte bei Id-Kollision -> erste Variante bleibt (strikt >, nicht >=)", () => {
  // Mutant `length > length` -> `>=`: bei Gleichstand überschriebe die zweite die erste.
  const m = sync.mergeTasks([{ code: "T", x: 1 }], [{ code: "T", y: 2 }]);
  assert.equal(m.length, 1);
  assert.equal(m[0].x, 1, "erste (x:1) bleibt bei gleicher JSON-Länge; nicht durch y:2 ersetzt");
});

test("logout: ruft den Server-Logout NUR bei enabled UND eingeloggt (Guard braucht &&, nicht ||)", async () => {
  // Mutant `enabled() && loggedIn()` -> `||`: dann würde req() schon feuern, wenn nur
  // eines zutrifft. Hier: enabled=true, aber NICHT eingeloggt -> kein Server-Call.
  let called = false;
  await withStubs(
    { loggedIn: () => false, logout: () => {}, request: () => { called = true; return Promise.resolve({ ok: true, body: {} }); } },
    {}, {},
    () => { sync.logout(); },
  );
  assert.equal(called, false, "nicht eingeloggt -> kein POST /v1/auth/logout");
  // Positivfall: enabled UND eingeloggt -> genau ein Logout-Request an den richtigen Pfad.
  let path = null;
  await withStubs(
    { loggedIn: () => true, logout: () => {}, request: (_b, m, p) => { path = m + " " + p; return Promise.resolve({ ok: true, body: {} }); } },
    {}, {},
    () => { sync.logout(); },
  );
  assert.equal(path, "POST /v1/auth/logout", "eingeloggt -> Server-Logout ausgelöst");
});

test("syncNow: 409-Retry ohne rev in der zweiten Antwort -> rev 0 (Fallback ist 0, nicht 1)", async () => {
  // Mutant `(pr2.body && pr2.body.rev) || 0` -> `|| 1`: dann käme fälschlich rev:1.
  const GS = GAMESTATS;
  const res = await withStubs(
    {
      loggedIn: () => true,
      request: (() => {
        let puts = 0;
        return (_b, method, _p, body) => {
          if (method === "GET") return Promise.resolve({ ok: true, body: { payload: { [GS]: { reviews: 1 } }, rev: 3 } });
          puts++;
          // 1. PUT -> 409 mit Serverstand; 2. PUT (pr2) -> ok, aber OHNE rev.
          if (puts === 1) return Promise.resolve({ ok: false, status: 409, body: { payload: { [GS]: { reviews: 2 } }, rev: 4 } });
          return Promise.resolve({ ok: true, status: 200, body: {} });
        };
      })(),
    },
    { exportData: () => ({ data: { [GS]: { reviews: 5 } } }), importData: () => {} },
    {},
    () => sync.syncNow(),
  );
  assert.equal(res.rev, 0, "fehlender rev in der Retry-Antwort -> 0, nicht 1");
});

test("syncNow: lehnt ab, wenn eingeloggt fehlt (Guard braucht ||, nicht &&)", async () => {
  // Mutant `!enabled() || !loggedIn()` -> `&&`: dann würde bei enabled=true &
  // loggedIn=false NICHT abgelehnt und ein Sync gestartet. Muss aber ablehnen.
  await withStubs(
    { loggedIn: () => false, request: () => { throw new Error("darf nicht syncen"); } },
    { exportData: () => ({ data: {} }), importData: () => {} },
    {},
    () => assert.rejects(() => sync.syncNow(), /not ready/),
  );
});
