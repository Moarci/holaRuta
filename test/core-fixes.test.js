/*
 * core-fixes.test.js – Tests der Risiko-Fixes aus RISIKO.md:
 *  R6: store-Record-Sanitizer + srs-Ease-Klemme/NaN-Schutz
 *  R8: due auf lokale Mitternacht des Zieltags
 *  R9: Early-Review-Dämpfung (freies Üben bläht Intervalle nicht auf)
 *  R4: writeJson-Erfolgsmeldung, Corrupt-Rescue, Export/Import
 *  LOW: usercards-Validierung
 *
 * Bewusst NUR synthetische Daten – keine IDs aus data.js.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// window- und localStorage-Shim (Module sind Browser-IIFEs).
globalThis.window = globalThis.window || {};
const mem = {};
let failWrites = false; // simuliert QuotaExceededError
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    if (failWrites) {
      const e = new Error("Quota voll");
      e.name = "QuotaExceededError";
      throw e;
    }
    mem[k] = String(v);
  },
  removeItem: (k) => { delete mem[k]; },
};

const SRC = path.join(__dirname, "..");
require(path.join(SRC, "srs.js"));
require(path.join(SRC, "store.js"));
const { srs, store } = globalThis.window.SC;

const DAY_MS = 24 * 60 * 60 * 1000;
const PKEY = "spanischcard.progress.v2";
const UKEY = "spanischcard.usercards.v1";

// Lokale Mitternacht von (ms + plusDays Tage), wie srs sie rechnen soll.
const midnight = (ms, plusDays) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + plusDays);
  return d.getTime();
};

// Fester Bezugszeitpunkt: 12.06.2026, 23:30 lokal (Abend-Lerner, R8-Szenario).
const NOW = new Date(2026, 5, 12, 23, 30, 0, 0).getTime();

// ---------- R8: due auf lokale Mitternacht ----------
test("srs.review: Intervall >= 1 Tag -> due = lokale Mitternacht des Zieltags", () => {
  const good = srs.review(srs.freshState(), srs.RATING.GOOD, NOW);
  assert.equal(good.interval, 1);
  assert.equal(good.due, midnight(NOW, 1)); // ganzer Folgetag fällig, nicht erst 23:30

  const easy = srs.review(srs.freshState(), srs.RATING.EASY, NOW);
  assert.equal(easy.interval, 3);
  assert.equal(easy.due, midnight(NOW, 3));
});

test("srs.review: AGAIN-Pfad bleibt bei ~60 Sekunden (kein Mitternachts-Schnitt)", () => {
  const r = srs.review({ ease: 2.5, interval: 10, due: 0, reps: 3 }, srs.RATING.AGAIN, NOW);
  assert.equal(r.due, NOW + 60 * 1000);
  assert.equal(r.interval, 0);
  assert.equal(r.reps, 0);
});

// ---------- R9: Early-Review-Dämpfung ----------
test("srs.review: fällige Karte nutzt das volle Intervall", () => {
  const r = srs.review({ ease: 2.5, interval: 10, due: NOW - 1000, reps: 3 }, srs.RATING.GOOD, NOW);
  assert.equal(r.interval, 25); // round(10 * 2.5)
});

test("srs.review: noch nicht fällige Karte zählt nur die verstrichene Zeit", () => {
  // Intervall 10 Tage, davon erst 2 verstrichen (due in 8 Tagen):
  const r = srs.review({ ease: 2.5, interval: 10, due: NOW + 8 * DAY_MS, reps: 3 }, srs.RATING.GOOD, NOW);
  assert.equal(r.interval, 5); // round(2 * 2.5) statt round(10 * 2.5) = 25
});

test("srs.review: Early-Review-Untergrenze ist 1 Tag", () => {
  // Quasi sofort nach der letzten Bewertung nochmal GOOD:
  const r = srs.review({ ease: 2.5, interval: 10, due: NOW + 10 * DAY_MS - 60000, reps: 3 }, srs.RATING.GOOD, NOW);
  assert.equal(r.interval, 3); // round(max(1, ~0) * 2.5)
  assert.equal(r.due, midnight(NOW, 3));
});

// ---------- R6: Ease-Klemme + NaN-Schutz in srs ----------
test("srs.review: Ease-Boden 1.3 greift auch auf dem GOOD-Pfad", () => {
  const r = srs.review({ ease: 0.5, interval: 4, due: 0, reps: 2 }, srs.RATING.GOOD, NOW);
  assert.equal(r.ease, 1.3);
  assert.equal(r.interval, Math.round(4 * 1.3));
});

test("srs.review: Ease-Decke 3.0 greift auf dem EASY-Pfad", () => {
  const r = srs.review({ ease: 9, interval: 5, due: 0, reps: 3 }, srs.RATING.EASY, NOW);
  assert.equal(r.ease, 3.0);
});

test("srs.review: korrupte Eingaben (Strings/NaN/null) erzeugen nie NaN", () => {
  const r = srs.review({ ease: "kaputt", interval: null, due: "x", reps: NaN }, srs.RATING.GOOD, NOW);
  assert.equal(r.ease, 2.5);     // Default statt NaN
  assert.equal(r.reps, 1);       // reps-Default 0 -> Erstbewertung
  assert.equal(r.interval, 1);
  assert.ok(isFinite(r.due));
  const e = srs.review({ ease: NaN, interval: NaN, due: NaN, reps: NaN }, srs.RATING.EASY, NOW);
  [e.ease, e.interval, e.due, e.reps].forEach((x) => assert.ok(isFinite(x), "kein NaN persistieren"));
});

// ---------- R6: store.loadProgress-Sanitizer ----------
test("store.loadProgress: Zahlenfelder werden koerziert, ease geklemmt, history gefiltert", () => {
  mem[PKEY] = JSON.stringify({
    a: { ease: "2.5", interval: "4", due: "123456", reps: "2", seen: "3",
         history: ["a", "g", "x", 5, "e", "__proto__"] },
    b: "kaputt",                                              // kein Objekt -> raus
    c: { ease: null, interval: 2, due: 99, reps: 1, seen: 1 },// ease null -> Default
    d: { ease: 9, interval: 1, due: 1, reps: 1, seen: 1 },    // ease > 3 -> 3.0
    e: { ease: 0.2, interval: 1, due: 1, reps: 1, seen: 1 },  // ease < 1.3 -> 1.3
  });
  const p = store.loadProgress();
  assert.equal(p.a.ease, 2.5);
  assert.equal(p.a.interval, 4);
  assert.equal(p.a.due, 123456);
  assert.equal(p.a.reps, 2);
  assert.equal(p.a.seen, 3);
  assert.deepEqual(p.a.history, ["a", "g", "e"]);
  assert.equal("b" in p, false);
  assert.equal(p.c.ease, 2.5);
  assert.equal(p.d.ease, 3.0);
  assert.equal(p.e.ease, 1.3);
  delete mem[PKEY];
});

// ---------- R4: Corrupt-Rescue + writeJson-Rückgabe ----------
test("store: korruptes JSON wird unter <key>.corrupt gerettet, Fallback greift", () => {
  mem[PKEY] = "{kaputt";
  const p = store.loadProgress();
  assert.deepEqual(p, {});
  assert.equal(mem[PKEY + ".corrupt"], "{kaputt"); // Roh-String gesichert
  delete mem[PKEY];
  delete mem[PKEY + ".corrupt"];
});

test("store.saveProgress: meldet Erfolg/Misserfolg (Quota)", () => {
  assert.equal(store.saveProgress({ x: { ease: 2.5 } }), true);
  failWrites = true;
  assert.equal(store.saveProgress({ x: { ease: 2.5 } }), false);
  failWrites = false;
  delete mem[PKEY];
});

// ---------- R4: Export/Import ----------
test("store.exportData/importData: Roundtrip über bekannte Keys", () => {
  mem[PKEY] = JSON.stringify({ a: { ease: 2.5, interval: 1, due: 1, reps: 1, seen: 1 } });
  mem["spanischcard.settings.v1"] = JSON.stringify({ mode: "type" });
  const dump = store.exportData();
  assert.equal(dump.app, "holaruta");
  assert.equal(dump.format, 1);
  assert.deepEqual(dump.data[PKEY], { a: { ease: 2.5, interval: 1, due: 1, reps: 1, seen: 1 } });
  assert.deepEqual(dump.data["spanischcard.settings.v1"], { mode: "type" });

  // "Gerätewechsel": Speicher leeren, Import einspielen.
  Object.keys(mem).forEach((k) => delete mem[k]);
  const n = store.importData(dump);
  assert.equal(n, 2);
  assert.deepEqual(JSON.parse(mem[PKEY]).a.seen, 1);
  Object.keys(mem).forEach((k) => delete mem[k]);
});

test("store.importData: ungültiges Format -> 0, fremde Keys werden ignoriert", () => {
  assert.equal(store.importData(null), 0);
  assert.equal(store.importData("x"), 0);
  assert.equal(store.importData({}), 0);
  assert.equal(store.importData({ data: "kaputt" }), 0);
  const n = store.importData({ data: { "evil.other.key": { a: 1 }, [PKEY]: {} } });
  assert.equal(n, 1); // nur der bekannte Key
  assert.equal("evil.other.key" in mem, false);
  Object.keys(mem).forEach((k) => delete mem[k]);
});

// ---------- LOW: usercards-Validierung ----------
test("store.loadUserCards: nur plausible Karten (de/es/cat Strings, max. Länge)", () => {
  const valid = { id: "u1", de: "Hallo", es: "Hola", cat: "alltag", lvl: 1, custom: true };
  mem[UKEY] = JSON.stringify([
    valid,
    { id: "u2", de: 42, es: "x", cat: "alltag" },          // de keine Zeichenkette
    { id: "u3", de: "x", cat: "alltag" },                  // es fehlt
    { id: "u4", de: "x".repeat(501), es: "y", cat: "a" },  // de zu lang
    { id: "u5", de: "x", es: "y", cat: { evil: 1 } },      // cat kein String
    { id: "", de: "x", es: "y", cat: "a" },                // leere id
    "kaputt", null,
  ]);
  const cards = store.loadUserCards();
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0], valid);
  delete mem[UKEY];
});

test("store.loadUserCards: Nicht-Array liefert leere Liste", () => {
  mem[UKEY] = JSON.stringify({ evil: true });
  assert.deepEqual(store.loadUserCards(), []);
  delete mem[UKEY];
});
