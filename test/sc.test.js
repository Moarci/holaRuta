/*
 * sc.test.js – Tests der reinen Kernlogik (srs / matcher / stats).
 * Nutzt den in Node eingebauten Test-Runner – KEINE Dependencies.
 *
 * Aufruf:  node --test
 *
 * Die App-Module sind Browser-IIFEs, die sich an window.SC hängen. Wir stellen
 * vor dem Laden ein minimales window-Shim bereit und ziehen die Module hinein.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// window-Shim: die Module referenzieren `window`, das hier auf globalThis.window zeigt.
globalThis.window = {};
const SRC = path.join(__dirname, "..");
require(path.join(SRC, "srs.js"));
require(path.join(SRC, "matcher.js"));
require(path.join(SRC, "stats.js"));

const { srs, matcher, stats } = globalThis.window.SC;
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ---------- matcher ----------
test("matcher.normalize: Akzente, Satzzeichen, Groß/Klein, Mehrfach-Spaces", () => {
  assert.equal(matcher.normalize("¿Cómo  estás?"), "como estas");
  assert.equal(matcher.normalize("  ñandú "), "nandu");
  assert.equal(matcher.normalize("¡Hólá!"), "hola");
});

test("matcher.check: exakt, akzent- und schreibungs-tolerant", () => {
  const card = { es: "médico" };
  assert.equal(matcher.check("médico", card).correct, true);
  assert.equal(matcher.check("medico", card).correct, true);   // ohne Akzent
  assert.equal(matcher.check("  MEDICO ", card).correct, true); // Case + Spaces
  assert.equal(matcher.check("medica", card).correct, false);
});

test("matcher.check: Slash-Alternativen werden alle akzeptiert", () => {
  const card = { es: "el bus / el colectivo" };
  assert.equal(matcher.check("el bus", card).correct, true);
  assert.equal(matcher.check("el colectivo", card).correct, true);
  assert.equal(matcher.check("el taxi", card).correct, false);
});

test("matcher.check: card.alt hat Vorrang (Genus-Varianten)", () => {
  const card = { es: "Soy vegetariano/a", alt: ["soy vegetariano", "soy vegetariana"] };
  assert.equal(matcher.check("soy vegetariana", card).correct, true);
  assert.equal(matcher.check("soy vegetariano", card).correct, true);
});

test("matcher.check: leere/whitespace Eingabe ist nie korrekt", () => {
  const card = { es: "hola" };
  assert.equal(matcher.check("", card).correct, false);
  assert.equal(matcher.check("   ", card).correct, false);
});

test("matcher.check: Richtung 'de' prüft das deutsche Feld", () => {
  const card = { de: "Arzt", es: "médico" };
  assert.equal(matcher.check("arzt", card, "de").correct, true);
  assert.equal(matcher.check("médico", card, "de").correct, false);
});

// ---------- srs ----------
test("srs.freshState: Startwerte", () => {
  assert.deepEqual(srs.freshState(), { ease: 2.5, interval: 0, due: 0, reps: 0 });
});

test("srs.review GOOD von neu: interval 1, reps 1, ease unverändert", () => {
  const r = srs.review(srs.freshState(), srs.RATING.GOOD);
  assert.equal(r.interval, 1);
  assert.equal(r.reps, 1);
  assert.ok(close(r.ease, 2.5));
  assert.ok(r.due > Date.now());
});

test("srs.review EASY von neu: interval 3, ease +0.15", () => {
  const r = srs.review(srs.freshState(), srs.RATING.EASY);
  assert.equal(r.interval, 3);
  assert.ok(close(r.ease, 2.65));
});

test("srs.review zweite Wdh. (reps 1): GOOD→3, EASY→6", () => {
  const base = { ease: 2.5, interval: 1, due: 0, reps: 1 };
  assert.equal(srs.review(base, srs.RATING.GOOD).interval, 3);
  assert.equal(srs.review(base, srs.RATING.EASY).interval, 6);
});

test("srs.review ab reps 2: interval = round(interval * ease)", () => {
  const base = { ease: 2.5, interval: 3, due: 0, reps: 2 };
  assert.equal(srs.review(base, srs.RATING.GOOD).interval, 8); // round(7.5)
});

test("srs.review AGAIN: interval/reps zurück, ease -0.2 (Boden 1.3), bald fällig", () => {
  const r = srs.review({ ease: 2.5, interval: 10, due: 0, reps: 3 }, srs.RATING.AGAIN);
  assert.equal(r.interval, 0);
  assert.equal(r.reps, 0);
  assert.ok(close(r.ease, 2.3));
  assert.ok(r.due > Date.now() && r.due < Date.now() + 5 * 60 * 1000);
  // Boden 1.3 wird nicht unterschritten
  const low = srs.review({ ease: 1.3, interval: 1, due: 0, reps: 1 }, srs.RATING.AGAIN);
  assert.ok(close(low.ease, 1.3));
});

test("srs.review EASY-Decke: ease übersteigt 3.0 nicht", () => {
  let s = { ease: 2.95, interval: 5, due: 0, reps: 3 };
  s = srs.review(s, srs.RATING.EASY);
  assert.ok(s.ease <= 3.0 + 1e-9);
});

test("srs.isDue: neu/0 → fällig, Vergangenheit → fällig, Zukunft → nicht", () => {
  assert.equal(srs.isDue(null), true);
  assert.equal(srs.isDue({ due: 0 }), true);
  assert.equal(srs.isDue({ due: Date.now() - 1000 }), true);
  assert.equal(srs.isDue({ due: Date.now() + 60 * 60 * 1000 }), false);
});

// ---------- stats ----------
test("stats.record: erste Bewertung setzt seen/firstRating/history/Zeiten", () => {
  const now = 1000;
  const srsNext = srs.review(srs.freshState(), srs.RATING.GOOD);
  const rec = stats.record(undefined, srsNext, "good", now);
  assert.equal(rec.seen, 1);
  assert.equal(rec.good, 1);
  assert.equal(rec.firstRating, "good");
  assert.equal(rec.firstAt, now);
  assert.equal(rec.lastAt, now);
  assert.deepEqual(rec.history, ["g"]);
});

test("stats.record: AGAIN nach gelernter Karte zählt als lapse, bei neuer nicht", () => {
  const srsAgain = srs.review({ ease: 2.5, interval: 4, due: 0, reps: 2 }, srs.RATING.AGAIN);
  const learned = { seen: 2, reps: 2, again: 0, good: 2, history: ["g", "g"] };
  assert.equal(stats.record(learned, srsAgain, "again", 5).lapses, 1);
  // neue Karte (reps 0) -> kein lapse
  assert.equal(stats.record(undefined, srsAgain, "again", 5).lapses, 0);
});

test("stats.record: history wird bei 50 gedeckelt", () => {
  const long = { history: Array(50).fill("g"), seen: 50 };
  const rec = stats.record(long, srs.freshState(), "easy", 1);
  assert.equal(rec.history.length, 50);
  assert.equal(rec.history[49], "e");
});

test("stats.cardSummary: unbekannte Karte ist 'new' mit rate null", () => {
  const s = stats.cardSummary(undefined);
  assert.equal(s.status, "new");
  assert.equal(s.rate, null);
  assert.equal(s.firstTry, false);
});

test("stats.cardSummary: Trefferquote = (good+easy)/seen", () => {
  const s = stats.cardSummary({ seen: 4, good: 2, easy: 1, again: 1, firstRating: "good", interval: 1 });
  assert.equal(s.rate, 75);
  assert.equal(s.status, "learning");
});

test("stats.statusOf: interval>=7 'mastered', sonst 'learning', ohne seen 'new'", () => {
  assert.equal(stats.statusOf({ seen: 3, interval: 7 }), "mastered");
  assert.equal(stats.statusOf({ seen: 3, interval: 3 }), "learning");
  assert.equal(stats.statusOf({ seen: 0 }), "new");
});

test("stats.cardSummary: firstTry nur ohne jedes 'Nochmal'", () => {
  assert.equal(stats.cardSummary({ seen: 1, good: 1, again: 0, firstRating: "good", interval: 1 }).firstTry, true);
  assert.equal(stats.cardSummary({ seen: 2, good: 1, again: 1, firstRating: "good", interval: 1 }).firstTry, false);
});

test("stats.cardSummary: 'hard' bei >=2 gesehen und rate < 60", () => {
  assert.equal(stats.cardSummary({ seen: 3, good: 1, again: 2, firstRating: "again", interval: 1 }).hard, true);
  assert.equal(stats.cardSummary({ seen: 3, good: 3, again: 0, firstRating: "good", interval: 1 }).hard, false);
});

test("stats.overview: aggregiert Status, Quote und Zähler", () => {
  const cards = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const progress = {
    a: { seen: 2, good: 2, again: 0, firstRating: "good", interval: 10 }, // mastered, firstTry
    b: { seen: 2, good: 0, again: 2, firstRating: "again", interval: 1 },  // learning, hard
    // c: ungesehen -> new
  };
  const ov = stats.overview(cards, progress);
  assert.equal(ov.total, 3);
  assert.equal(ov.neu, 1);
  assert.equal(ov.mastered, 1);
  assert.equal(ov.learning, 1);
  assert.equal(ov.seenCards, 2);
  assert.equal(ov.firstTry, 1);
  assert.equal(ov.hard, 1);
  assert.equal(ov.rate, 50); // 2 correct / 4 seen
});
