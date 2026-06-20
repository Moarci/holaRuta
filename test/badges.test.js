/*
 * badges.test.js – Tests für den REINEN Ruta-Pass-Kern (badges.js): die
 * Metrik-Ableitung (buildMetrics) und die Freischalt-Logik (evaluate). Kein DOM,
 * kein Speicher. Der `window.SC.stats`-Zugriff von isMastered wird im Test
 * kontrolliert (gesetzt/entfernt), um Fallback UND Vorrang zu prüfen.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "badges.js"));
const { badges } = globalThis.window.SC;

// Alle Badges samt type/metric/category (evaluate liefert sie angereichert). Der
// metric/type ist eine Zeichenkette (mutiert nicht); die Schwelle (Zahl) dagegen
// MUTIERT — daher werden die erwarteten Schwellen UNTEN hartkodiert (sonst wäre
// der Test selbstreferenziell und könnte Schwellwert-Mutationen nicht fangen).
const ALL = badges.evaluate({});
const find = (list, id) => list.find((b) => b.id === id);

// Erwartete Schwelle JE counter-Badge (extern festgehalten, Quelle: badges.js).
const EXPECT = {
  first_steps: 1, ten_cards: 10, fifty_cards: 50, hundred_cards: 100, twohundred_cards: 200,
  master_10: 10, master_50: 50,
  streak_3: 3, streak_7: 7, streak_14: 14, streak_30: 30,
  ruta_dia_first: 1, pretrip_done: 7, ruta_dia_7: 7,
  context_first: 1, context_10: 10, context_25: 25,
  battle_first: 1, battle_win: 1, battle_10: 10, battle_perfect: 1, battle_comeback: 1,
  roleplay_first: 1, roleplay_5: 5,
  quiz_first: 1, quiz_10: 10, quiz_perfect: 1,
  yesto_first: 1, yesto_10: 10, yesto_perfect: 1,
  frases_first: 1, frases_10: 10, frases_perfect: 1, frases_themes: 7,
  listen_first: 1, listen_25: 25, precios_first: 1, precios_perfect: 1, precios_millon: 1,
  challenge_first: 1, challenge_5: 5, challenge_10: 10,
  cuerpo_first: 1, cuerpo_10: 10, cuerpo_all: 20,
  many_again: 20, persistent: 500,
};

// ---------------------------- Freischalt-Logik (evaluate) ----------------------------

test("evaluate: jedes counter-Badge schaltet GENAU an seiner (hartkodierten) Schwelle frei (>=)", () => {
  for (const b of ALL) {
    if (b.type !== "counter") continue;
    const t = EXPECT[b.id];
    assert.ok(t !== undefined, `${b.id} fehlt in EXPECT – Schwelle hier pflegen`);
    const below = find(badges.evaluate({ [b.metric]: t - 1 }), b.id);
    const at = find(badges.evaluate({ [b.metric]: t }), b.id);
    assert.equal(below.satisfied, false, `${b.id}: bei ${t - 1} noch nicht erfüllt`);
    assert.equal(at.satisfied, true, `${b.id}: bei ${t} erfüllt`);
  }
});

test("evaluate: flag-Badges brauchen das Flag (nightOwl/earlyBird)", () => {
  const on = badges.evaluate({ nightOwl: true, earlyBird: true });
  const off = badges.evaluate({ nightOwl: false, earlyBird: false });
  assert.equal(find(on, "night_owl").satisfied, true);
  assert.equal(find(off, "night_owl").satisfied, false);
  assert.equal(find(on, "early_bird").satisfied, true);
  assert.equal(find(off, "early_bird").satisfied, false);
});

test("evaluate: allReviewed schaltet erst frei, wenn ALLE Karten gesehen", () => {
  assert.equal(find(badges.evaluate({ cardsReviewed: 4, totalCards: 5 }), "all_cards").satisfied, false);
  assert.equal(find(badges.evaluate({ cardsReviewed: 5, totalCards: 5 }), "all_cards").satisfied, true);
  // ohne Karten (totalCards 0) niemals erfüllt
  assert.equal(find(badges.evaluate({ cardsReviewed: 0, totalCards: 0 }), "all_cards").satisfied, false);
});

test("evaluate: categoryMastery braucht Kategorie-Karten UND >= 0.8", () => {
  const m = (frac, tot) => ({ categoryMastery: { basics: frac }, categoryTotals: { basics: tot } });
  assert.equal(find(badges.evaluate(m(0.79, 10)), "cat_basics").satisfied, false);
  assert.equal(find(badges.evaluate(m(0.8, 10)), "cat_basics").satisfied, true);
  // keine Karten der Kategorie -> nie erfüllt, auch bei 100 %
  assert.equal(find(badges.evaluate(m(1, 0)), "cat_basics").satisfied, false);
});

test("evaluate: progress-Balken 0..1 und unlocked bleibt über die unlocked-Map erhalten", () => {
  const at50 = find(badges.evaluate({ cardsMastered: 25 }), "master_50"); // Schwelle 50
  assert.equal(at50.progress, 0.5);
  assert.equal(at50.unlocked, false);
  // bereits freigeschaltet (Map), obwohl der Wert jetzt 0 ist
  const u = find(badges.evaluate({ cardsMastered: 0 }, { master_50: 123 }), "master_50");
  assert.equal(u.unlocked, true);
  assert.equal(u.unlockedAt, 123);
});

test("satisfiedIds: liefert die Ids aller aktuell erfüllten Badges", () => {
  const ids = badges.satisfiedIds({ cardsReviewed: 1 });
  assert.ok(ids.includes("first_steps"), "first_steps (Schwelle 1) erfüllt");
  assert.ok(!ids.includes("ten_cards"), "ten_cards (Schwelle 10) noch nicht");
});

// ---------------------------- Metrik-Ableitung (buildMetrics) ----------------------------

test("buildMetrics: jeder Zähler wird durchgereicht (kein Default-Kurzschluss)", () => {
  const counters = {
    reviews: 500, dailyStreak: 4, longestStreak: 9, againPresses: 20,
    nightOwl: true, earlyBird: false,
    battlesPlayed: 11, battlesWon: 6, perfectBattles: 2, comebacks: 1,
    quizzesPlayed: 7, quizzesPerfect: 3,
    yestoPlayed: 8, yestoPerfect: 4,
    frasesPlayed: 12, frasesPerfect: 5,
    listenReviews: 25, preciosPlayed: 3, preciosPerfect: 2, preciosMillon: 1,
    roleplaysSeen: { a: 1, b: 1, c: 1 },
    challengesDone: { x: 1, y: 1 },
    frasesThemesDone: { t1: 1 },
    rutaDays: { d1: 1, d2: 1 },
    contextCardsSeen: { c1: 1 },
    bodyPartsSeen: { p1: 1, p2: 1, p3: 1, p4: 1 },
    pretripDays: { colombia: { 1: true, 2: true, 3: true } },
  };
  const m = badges.buildMetrics([], {}, counters);
  assert.equal(m.totalReviews, 500);
  assert.equal(m.dailyStreak, 4);
  assert.equal(m.longestStreak, 9);
  assert.equal(m.againPresses, 20);
  assert.equal(m.nightOwl, true);
  assert.equal(m.earlyBird, false);
  assert.equal(m.battlesPlayed, 11);
  assert.equal(m.battlesWon, 6);
  assert.equal(m.perfectBattles, 2);
  assert.equal(m.comebacks, 1);
  assert.equal(m.quizzesPlayed, 7);
  assert.equal(m.quizzesPerfect, 3);
  assert.equal(m.yestoPlayed, 8);
  assert.equal(m.yestoPerfect, 4);
  assert.equal(m.frasesPlayed, 12);
  assert.equal(m.frasesPerfect, 5);
  assert.equal(m.listenReviews, 25);
  assert.equal(m.preciosPlayed, 3);
  assert.equal(m.preciosPerfect, 2);
  assert.equal(m.preciosMillon, 1);
  // Distinkt-Zählungen über Maps:
  assert.equal(m.roleplaysCompleted, 3);
  assert.equal(m.challengesCompleted, 2);
  assert.equal(m.frasesThemesCompleted, 1);
  assert.equal(m.rutaDays, 2);
  assert.equal(m.contextCardsViewed, 1);
  assert.equal(m.bodyPartsExplored, 4);
  assert.equal(m.pretripDaysDone, 3);
});

test("buildMetrics: leere Zähler -> JEDE Metrik 0/false (kein Default-Kurzschluss auf 1)", () => {
  const m = badges.buildMetrics([], {}, {});
  // alle „c.X || 0"-Zähler müssen bei fehlendem X exakt 0 sein (tötet 0->1)
  for (const k of [
    "totalReviews", "dailyStreak", "longestStreak", "againPresses",
    "battlesPlayed", "battlesWon", "perfectBattles", "comebacks",
    "quizzesPlayed", "quizzesPerfect", "yestoPlayed", "yestoPerfect",
    "frasesPlayed", "frasesPerfect", "listenReviews", "preciosPlayed",
    "preciosPerfect", "preciosMillon",
    // alle „X ? Object.keys(X).length : 0"-Distinkt-Zähler:
    "roleplaysCompleted", "challengesCompleted", "frasesThemesCompleted",
    "rutaDays", "contextCardsViewed", "bodyPartsExplored", "pretripDaysDone",
  ]) {
    assert.equal(m[k], 0, `${k} muss bei leeren Zählern 0 sein`);
  }
  assert.equal(m.nightOwl, false);
  assert.equal(m.earlyBird, false);
  // counters ganz weglassen ist ebenfalls erlaubt
  assert.equal(badges.buildMetrics([], {}).totalReviews, 0);
});

test("buildMetrics: pretripDays null/kaputt -> 0 (kein Crash; tötet !pt-Aufweichung)", () => {
  assert.equal(badges.buildMetrics([], {}, { pretripDays: null }).pretripDaysDone, 0);
  assert.equal(badges.buildMetrics([], {}, { pretripDays: 5 }).pretripDaysDone, 0);
});

test("buildMetrics/isMastered: Fallback ohne stats (seen>0 UND interval>=5)", () => {
  const saved = window.SC.stats;
  window.SC.stats = undefined;
  try {
    const cards = [{ id: "a", cat: "basics" }, { id: "b", cat: "basics" }, { id: "c", cat: "basics" }, { id: "d", cat: "basics" }];
    const progress = {
      a: { seen: 1, interval: 5 }, // gemeistert
      b: { seen: 2, interval: 4 }, // interval < 5 -> nein
      c: { seen: 0, interval: 9 }, // nie gesehen -> nein
      d: { seen: 1, interval: 0 }, // interval 0 -> nein (tötet seen-ODER-interval-Aufweichung)
    };
    const m = badges.buildMetrics(cards, progress, {});
    assert.equal(m.cardsReviewed, 3, "a, b, d gesehen (seen>0)");
    assert.equal(m.cardsMastered, 1, "nur a gemeistert (seen>0 && interval>=5)");
  } finally {
    window.SC.stats = saved;
  }
});

test("buildMetrics/isMastered: stats.statusOf hat Vorrang vor dem Fallback", () => {
  const saved = window.SC.stats;
  window.SC.stats = { statusOf: (r) => (r.interval >= 99 ? "mastered" : "new") };
  try {
    const cards = [{ id: "a", cat: "x" }, { id: "b", cat: "x" }];
    // b hätte nach Fallback (interval 5) gemeistert -> der Stub (Schwelle 99) verhindert das.
    const m = badges.buildMetrics(cards, { a: { seen: 1, interval: 100 }, b: { seen: 1, interval: 5 } }, {});
    assert.equal(m.cardsMastered, 1, "nur a laut stats.statusOf; Fallback-Schwelle 5 wird ignoriert");
  } finally {
    window.SC.stats = saved;
  }
});

test("buildMetrics: categoryMastery = Anteil gemeisterter Karten je Kategorie", () => {
  const saved = window.SC.stats;
  window.SC.stats = undefined;
  try {
    const cards = [
      { id: "a", cat: "basics" }, { id: "b", cat: "basics" },
      { id: "c", cat: "zahlen" },
      { id: "d", cat: "essen" }, // gar nicht gemeistert -> Anteil muss 0 sein (nicht 1)
    ];
    const progress = { a: { seen: 1, interval: 9 }, b: { seen: 1, interval: 1 }, c: { seen: 1, interval: 9 }, d: { seen: 1, interval: 1 } };
    const m = badges.buildMetrics(cards, progress, {});
    assert.equal(m.categoryMastery.basics, 0.5, "1 von 2 in basics gemeistert");
    assert.equal(m.categoryMastery.zahlen, 1);
    assert.equal(m.categoryMastery.essen, 0, "0 gemeistert -> 0 (kein ||1-Kurzschluss)");
    assert.equal(m.categoryTotals.basics, 2);
  } finally {
    window.SC.stats = saved;
  }
});

test("buildMetrics: pretripMaxDays verträgt beide Formate (verschachtelt = max je Plan, flach = ein Plan)", () => {
  assert.equal(badges.buildMetrics([], {}, { pretripDays: { colombia: { 1: true, 2: true }, peru: { 1: true, 2: true, 3: true } } }).pretripDaysDone, 3);
  assert.equal(badges.buildMetrics([], {}, { pretripDays: { 1: true, 2: true } }).pretripDaysDone, 2);
  assert.equal(badges.buildMetrics([], {}, { pretripDays: {} }).pretripDaysDone, 0);
});

test("byId/badgeMeta: bekannte Id liefert Daten, unbekannte null", () => {
  assert.equal(badges.byId("first_steps").id, "first_steps");
  assert.equal(badges.byId("gibtsnicht"), null);
  const meta = badges.badgeMeta("night_owl");
  assert.equal(meta.icon, "🌙");
  assert.equal(meta.nameEn, "Midnight Español");
  assert.equal(badges.badgeMeta("nope"), null);
});
