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
require(path.join(SRC, "contextdata.js")); // Kontext-Inhalte (vor data.js/context.js)
require(path.join(SRC, "data.js"));
require(path.join(SRC, "numbers.js"));     // Zahl→Wort & Preis-Generator (vor context.js)
require(path.join(SRC, "context.js"));     // hängt den Kontext an die Karten (nach data.js)
require(path.join(SRC, "srs.js"));
require(path.join(SRC, "matcher.js"));
require(path.join(SRC, "stats.js"));
require(path.join(SRC, "badges.js"));

const { data, srs, matcher, stats, badges } = globalThis.window.SC;
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ---------- matcher ----------
test("matcher.normalize: Akzente, Satzzeichen, Groß/Klein, Mehrfach-Spaces", () => {
  assert.equal(matcher.normalize("¿Cómo  estás?"), "como estas");
  assert.equal(matcher.normalize("  ñandú "), "nandu");
  assert.equal(matcher.normalize("¡Hólá!"), "hola");
});

test("matcher.normalize: beliebige Sonderzeichen/Tippmüll werden ignoriert", () => {
  // Nicht nur die altbekannten Satzzeichen, sondern ALLES außer Buchstaben/Ziffern.
  assert.equal(matcher.normalize("hola*"), "hola");
  assert.equal(matcher.normalize("hola…"), "hola");
  assert.equal(matcher.normalize("hola 👋"), "hola");
  assert.equal(matcher.normalize("¡hola! 50%"), "hola 50");
  assert.equal(matcher.normalize("@#hola&"), "hola");
  // Ziffern bleiben erhalten (Preis-/Zahlkarten).
  assert.equal(matcher.normalize("$45.000"), "45000");
});

test("matcher.check: versehentliche Sonderzeichen kosten nicht die Antwort", () => {
  const card = { es: "hola" };
  assert.equal(matcher.check("hola!", card).correct, true);
  assert.equal(matcher.check("hola.", card).correct, true);
  assert.equal(matcher.check("¡hola!", card).correct, true);
  assert.equal(matcher.check("hola;", card).correct, true);
});

test("matcher.check: exakt, akzent- und schreibungs-tolerant", () => {
  const card = { es: "médico" };
  assert.equal(matcher.check("médico", card).correct, true);
  assert.equal(matcher.check("medico", card).correct, true);   // ohne Akzent
  assert.equal(matcher.check("  MEDICO ", card).correct, true); // Case + Spaces
  assert.equal(matcher.check("medica", card).correct, false);
});

test("matcher.check: fehlende Striche auf -ás/-ís/-ós zählen NICHT als Fehler", () => {
  // Reise-Tastaturen haben oft keine Akzenttaste. Wer die Striche auf den
  // Endungen weglässt, soll trotzdem als richtig gewertet werden.
  assert.equal(matcher.check("estas", { es: "estás" }).correct, true);
  assert.equal(matcher.check("comeras", { es: "comerás" }).correct, true);
  assert.equal(matcher.check("paris", { es: "París" }).correct, true);
  assert.equal(matcher.check("adios", { es: "adiós" }).correct, true);
  assert.equal(matcher.check("autobus", { es: "autobús" }).correct, true);
  // Umgekehrt: getippte Akzente bleiben natürlich ebenfalls richtig.
  assert.equal(matcher.check("estás", { es: "estás" }).correct, true);
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

test("stats.statusOf: interval>=5 'mastered', sonst 'learning', ohne seen 'new'", () => {
  assert.equal(stats.statusOf({ seen: 3, interval: 5 }), "mastered");
  assert.equal(stats.statusOf({ seen: 3, interval: 3 }), "learning");
  assert.equal(stats.statusOf({ seen: 0 }), "new");
});

test("stats.cardSummary: 'firming' = noch am Lernen, aber Intervall >= FIRMING_DAYS", () => {
  // interval 3: am Lernen, aber fast geschafft
  assert.equal(stats.cardSummary({ seen: 2, good: 2, interval: 3 }).firming, true);
  // interval 1: am Lernen, noch nicht fast geschafft
  assert.equal(stats.cardSummary({ seen: 1, good: 1, interval: 1 }).firming, false);
  // gemeistert ist kein "firming" mehr
  assert.equal(stats.cardSummary({ seen: 3, good: 3, interval: 8 }).firming, false);
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
    b: { seen: 2, good: 0, again: 2, firstRating: "again", interval: 3 },  // learning, hard, firming
    // c: ungesehen -> new
  };
  const ov = stats.overview(cards, progress);
  assert.equal(ov.total, 3);
  assert.equal(ov.neu, 1);
  assert.equal(ov.mastered, 1);
  assert.equal(ov.learning, 1);
  assert.equal(ov.firming, 1); // b: am Lernen, aber Intervall >= FIRMING_DAYS
  assert.equal(ov.seenCards, 2);
  assert.equal(ov.firstTry, 1);
  assert.equal(ov.hard, 1);
  assert.equal(ov.rate, 50); // 2 correct / 4 seen
});

test("stats.levelDistribution: zählt CEFR-Stufen, Nivel-Test schlägt Quick-Check", () => {
  const students = [
    { assessment: { level: "B1" }, placement: { level: "A2" } }, // Nivel-Test hat Vorrang -> B1
    { placement: { level: "A2" } },                              // nur Quick-Check -> A2
    { placement: { level: "A2" } },                              // A2
    { assessment: { level: "A0" } },                             // A0
    { },                                                          // ungetestet
  ];
  const d = stats.levelDistribution(students);
  assert.equal(d.total, 5);
  assert.equal(d.tested, 4);
  assert.equal(d.untested, 1);
  assert.equal(d.max, 2); // A2 ist die größte Gruppe
  // Belegte Stufen kommen in kanonischer CEFR-Reihenfolge (A0 < A2 < B1):
  assert.deepEqual(d.buckets, [
    { level: "A0", count: 1 },
    { level: "A2", count: 2 },
    { level: "B1", count: 1 },
  ]);
});

test("stats.levelDistribution: leere/kaputte Eingaben sind robust", () => {
  const empty = stats.levelDistribution([]);
  assert.deepEqual(empty.buckets, []);
  assert.equal(empty.total, 0);
  assert.equal(empty.untested, 0);
  assert.equal(empty.max, 0);
  // Nicht-Array -> wie leer; ungültige level-Werte zählen als ungetestet.
  assert.equal(stats.levelDistribution(null).total, 0);
  const junk = stats.levelDistribution([{ placement: { level: 42 } }, { assessment: {} }]);
  assert.equal(junk.tested, 0);
  assert.equal(junk.untested, 2);
});

test("stats.sortRoster: Name/Mastered/Level mit Richtung, stabiler Tie-Break, ohne Mutation", () => {
  const r = [
    { name: "Bea", cardsMastered: 5, assessment: { level: "A2" } },
    { name: "Ana", cardsMastered: 5, placement: { level: "B1" } },
    { name: "Cid", cardsMastered: 9 }, // ungetestet
  ];
  const names = (key, dir) => stats.sortRoster(r, key, dir).map((s) => s.name);
  assert.deepEqual(names("name", 1), ["Ana", "Bea", "Cid"]);
  assert.deepEqual(names("name", -1), ["Cid", "Bea", "Ana"]);
  // mastered absteigend: Cid(9) zuerst; Gleichstand 5 -> Tie-Break Name (Ana<Bea)
  assert.deepEqual(names("mastered", -1), ["Cid", "Ana", "Bea"]);
  // level aufsteigend: ungetestet(-1) < A2 < B1
  assert.deepEqual(names("level", 1), ["Cid", "Bea", "Ana"]);
  // unbekannter Schlüssel -> wie Name
  assert.deepEqual(names("xxx", 1), ["Ana", "Bea", "Cid"]);
  assert.equal(r[0].name, "Bea"); // Originalliste unverändert
});

test("stats.upsertStudent: ersetzt gleichnamigen Eintrag (case/whitespace-tolerant), sonst anhängen", () => {
  const r1 = stats.upsertStudent([], { name: "Ana", cardsMastered: 1 });
  assert.equal(r1.replaced, false);
  assert.equal(r1.roster.length, 1);
  const r2 = stats.upsertStudent(r1.roster, { name: " ana ", cardsMastered: 7 });
  assert.equal(r2.replaced, true);
  assert.equal(r2.roster.length, 1);
  assert.equal(r2.roster[0].cardsMastered, 7);
  const r3 = stats.upsertStudent(r2.roster, { name: "Bea" });
  assert.equal(r3.replaced, false);
  assert.equal(r3.roster.length, 2);
});

test("stats.rosterCSV: Header + Zeilen in fester Spaltenfolge, RFC-Quoting", () => {
  const students = [
    { name: "Ana, M.", assessment: { level: "B1", finalScore: 0.82 }, cardsMastered: 10, totalCards: 50, streak: 3, challenges: 2, pretripDays: 1, pretripMax: 7, masteredCats: ["Essen", "Taxi"] },
    { name: 'Bo "X"', placement: { level: "A2", finalScore: 0.4 }, cardsMastered: 2, totalCards: 50, streak: 0, challenges: 0, pretripDays: 0, pretripMax: 7, masteredCats: [] },
  ];
  const lines = stats.rosterCSV(students, ["Name", "Niveau", "Score", "Gem", "Ges", "Serie", "Ch", "Pre", "Pakete"]).split("\r\n");
  assert.equal(lines.length, 3);
  assert.equal(lines[0], "Name,Niveau,Score,Gem,Ges,Serie,Ch,Pre,Pakete");
  assert.equal(lines[1], '"Ana, M.",B1,82%,10,50,3,2,1/7,Essen; Taxi');
  assert.equal(lines[2], '"Bo ""X""",A2,40%,2,50,0,0,0/7,');
  assert.equal(stats.rosterCSV([], []), ""); // leer ohne Header
});

// ---------- badges ----------
test("badges.buildMetrics: zählt gelernte/gemeisterte Karten und Kategorie-Anteile", () => {
  const cards = [
    { id: "a", cat: "essen" }, { id: "b", cat: "essen" },
    { id: "c", cat: "essen" }, { id: "d", cat: "hotel" },
  ];
  const progress = {
    a: { seen: 3, interval: 10 }, // gemeistert (>=7)
    b: { seen: 2, interval: 12 }, // gemeistert
    c: { seen: 1, interval: 1 },  // gelernt, nicht gemeistert
    // d: ungesehen
  };
  const m = badges.buildMetrics(cards, progress, { reviews: 6 });
  assert.equal(m.cardsReviewed, 3);
  assert.equal(m.cardsMastered, 2);
  assert.equal(m.totalCards, 4);
  assert.equal(m.totalReviews, 6);
  assert.ok(close(m.categoryMastery.essen, 2 / 3));
  assert.equal(m.categoryMastery.hotel, 0);
});

test("badges.satisfiedIds: Lernmengen-Schwellen greifen", () => {
  const cards = Array.from({ length: 60 }, (_, i) => ({ id: "x" + i, cat: "essen" }));
  const progress = {};
  for (let i = 0; i < 55; i++) progress["x" + i] = { seen: 1, interval: 1 };
  const m = badges.buildMetrics(cards, progress, {});
  const ids = badges.satisfiedIds(m);
  assert.ok(ids.includes("first_steps"));
  assert.ok(ids.includes("ten_cards"));
  assert.ok(ids.includes("fifty_cards"));
  assert.ok(!ids.includes("hundred_cards")); // erst ab 100
});

test("badges: 'all_cards' erst wenn alle Karten gelernt", () => {
  const cards = [{ id: "a", cat: "essen" }, { id: "b", cat: "essen" }];
  const partial = badges.buildMetrics(cards, { a: { seen: 1, interval: 1 } }, {});
  assert.ok(!badges.satisfiedIds(partial).includes("all_cards"));
  const full = badges.buildMetrics(cards, { a: { seen: 1, interval: 1 }, b: { seen: 1, interval: 1 } }, {});
  assert.ok(badges.satisfiedIds(full).includes("all_cards"));
});

test("badges: Kategorie-Badge ab 80 % Meisterschaft", () => {
  const cards = Array.from({ length: 5 }, (_, i) => ({ id: "e" + i, cat: "essen" }));
  const prog = {};
  for (let i = 0; i < 4; i++) prog["e" + i] = { seen: 2, interval: 10 }; // 4/5 = 80 %
  const m = badges.buildMetrics(cards, prog, {});
  assert.ok(badges.satisfiedIds(m).includes("cat_essen"));
});

test("badges: Streak- und Spezial-Zähler über counters", () => {
  const cards = [{ id: "a", cat: "essen" }];
  const m = badges.buildMetrics(cards, {}, {
    longestStreak: 7, againPresses: 20, nightOwl: true, earlyBird: false,
  });
  const ids = badges.satisfiedIds(m);
  assert.ok(ids.includes("streak_3"));
  assert.ok(ids.includes("streak_7"));
  assert.ok(!ids.includes("streak_14"));
  assert.ok(ids.includes("many_again"));
  assert.ok(ids.includes("night_owl"));
  assert.ok(!ids.includes("early_bird"));
});

test("badges.evaluate: unlocked-Map hält Freischaltung, auch wenn Wert wieder sinkt", () => {
  const cards = [{ id: "a", cat: "essen" }];
  const m = badges.buildMetrics(cards, {}, {}); // nichts erfüllt
  const evald = badges.evaluate(m, { first_steps: 123 });
  const fs = evald.find((b) => b.id === "first_steps");
  assert.equal(fs.satisfied, false);
  assert.equal(fs.unlocked, true); // bleibt freigeschaltet
  assert.equal(fs.unlockedAt, 123);
});

test("badges.evaluate: Fortschritt 0..1 und Zielwerte stimmen", () => {
  const cards = Array.from({ length: 20 }, (_, i) => ({ id: "y" + i, cat: "essen" }));
  const prog = {};
  for (let i = 0; i < 5; i++) prog["y" + i] = { seen: 1, interval: 1 };
  const m = badges.buildMetrics(cards, prog, {});
  const ten = badges.evaluate(m, {}).find((b) => b.id === "ten_cards");
  assert.equal(ten.target, 10);
  assert.equal(ten.value, 5);
  assert.ok(close(ten.progress, 0.5));
});

// ---------- store: gamestats-Sanitisierung (Badge-Zähler) ----------
const storeMem = {};
globalThis.localStorage = {
  getItem: (k) => (k in storeMem ? storeMem[k] : null),
  setItem: (k, v) => { storeMem[k] = String(v); },
  removeItem: (k) => { delete storeMem[k]; },
};
require(path.join(SRC, "store.js"));
const store = globalThis.window.SC.store;
const GKEY = "spanischcard.gamestats.v1";

test("store.loadGameStats: korrupte Zähler werden typisiert (kein String-Concat)", () => {
  storeMem[GKEY] = JSON.stringify({
    reviews: "5", longestStreak: null, dailyStreak: 3, lastStudyDate: 42,
    nightOwl: 1, earlyBird: false, unlocked: ["x"],
  });
  const g = store.loadGameStats();
  assert.equal(g.reviews, 0);          // "5" (String) -> 0
  assert.equal(g.longestStreak, 0);    // null -> 0
  assert.equal(g.dailyStreak, 3);      // gültige Zahl bleibt
  assert.equal(g.lastStudyDate, null); // Zahl -> null
  assert.equal(g.nightOwl, true);      // truthy -> bool
  assert.equal(g.earlyBird, false);
  assert.deepEqual(g.unlocked, {});    // Array -> {}
});

test("store.loadGameStats: Nicht-Objekt liefert frische Defaults", () => {
  storeMem[GKEY] = JSON.stringify([1, 2, 3]);
  assert.deepEqual(store.loadGameStats(), store.freshGameStats());
});

test("store.loadGameStats: gültiger Stand bleibt erhalten", () => {
  const valid = {
    reviews: 12, againPresses: 4, dailyStreak: 2, longestStreak: 9, xp: 235,
    lastStudyDate: "2026-06-11", nightOwl: true, earlyBird: true,
    battlesPlayed: 5, battlesWon: 3, perfectBattles: 1, comebacks: 1,
    roleplaysSeen: { hr01: true }, challengesDone: { challenge01: true },
    quizzesPlayed: 7, quizzesPerfect: 2,
    frasesPlayed: 3, frasesPerfect: 1, frasesThemesDone: { transporte: true, comida: true },
    listenReviews: 30, preciosPlayed: 4, preciosPerfect: 2, preciosMillon: 1,
    conjugPlayed: 6, conjugPerfect: 3,
    dialogosPlayed: 5, dialogosPerfect: 2, dialogosScenesDone: { hotel: true, taxi: true },
    rutaDays: { "2026-06-11": true },
    pretripDays: { colombia: { 1: true, 2: true }, peru: { 1: true } },
    tripGoal: { destination: "Cusco", endDate: "2026-07-01", perDay: 15, startedAt: "2026-06-12" },
    dailyCounts: { "2026-06-11": 12 },
    contextCardsSeen: { hostel01: true },
    bodyPartsSeen: { bp_cabeza: true },
    shoppingSeen: { sl_agua: true },
    unlocked: { first_steps: 1700000000000 },
    placement: { level: "A2", finalScore: 0.62, accuracy: 0.6, unknownRate: 0.2, tempo: "medium", reliability: "", note: "commStrong", correct: 8, total: 14, skills: [{ skill: "understanding", accuracy: 75, unknownRate: 10 }, { skill: "grammar", accuracy: 40, unknownRate: 20 }], review: [{ status: "wrong", promptDe: "Wie heißt das Wort Wasser?", questionEs: "", yourText: "leche", correctText: "agua", explanationDe: "agua = Wasser." }], at: "2026-06-15", ts: "" },
    placementHistory: [
      { level: "A1", finalScore: 0.41, accuracy: 0.4, unknownRate: 0.3, tempo: "slow", reliability: "", note: "", correct: 5, total: 14, skills: [], review: [], at: "2026-06-10", ts: "2026-06-10T18:00:00.000Z" },
      { level: "A2", finalScore: 0.62, accuracy: 0.6, unknownRate: 0.2, tempo: "medium", reliability: "", note: "commStrong", correct: 8, total: 14, skills: [{ skill: "understanding", accuracy: 75, unknownRate: 10 }, { skill: "grammar", accuracy: 40, unknownRate: 20 }], review: [{ status: "wrong", promptDe: "Wie heißt das Wort Wasser?", questionEs: "", yourText: "leche", correctText: "agua", explanationDe: "agua = Wasser." }], at: "2026-06-15", ts: "2026-06-15T20:00:00.000Z" },
    ],
    assessment: { level: "B1", variant: "standard", finalScore: 0.7, accuracy: 0.68, unknownRate: 0.1, tempo: "medium", reliability: "", note: "", correct: 19, total: 28, skills: [{ skill: "reading", accuracy: 80, unknownRate: 0 }], review: [], at: "2026-06-16", ts: "" },
    assessmentHistory: [
      { level: "B1", variant: "standard", finalScore: 0.7, accuracy: 0.68, unknownRate: 0.1, tempo: "medium", reliability: "", note: "", correct: 19, total: 28, skills: [{ skill: "reading", accuracy: 80, unknownRate: 0 }], review: [], at: "2026-06-16", ts: "2026-06-16T20:00:00.000Z" },
    ],
    assessmentProgress: {
      variant: "extremo", asked: ["as_un_a0a", "as_vo_a0a"],
      answers: [
        { isUnknown: false, selectedIndex: 0, text: "", responseTimeMs: 4200 },
        { isUnknown: true, selectedIndex: null, text: "", responseTimeMs: 3000 },
      ],
      difficulty: 2, mcAsked: 2, grammarAsked: 0, freeIdx: 0, startedAt: 1700000000000, savedAt: 1700000005000,
    },
  };
  storeMem[GKEY] = JSON.stringify(valid);
  assert.deepEqual(store.loadGameStats(), valid);
});

test("store.loadGameStats: Bestands-placement ohne History wird als erster Verlaufseintrag übernommen", () => {
  // Altgerät: nur ein letztes Ruta-Check-Ergebnis, noch keine placementHistory.
  storeMem[GKEY] = JSON.stringify({
    reviews: 3,
    placement: { level: "A2", finalScore: 0.62, accuracy: 0.6, unknownRate: 0.2, tempo: "medium", at: "2026-06-15" },
  });
  const g = store.loadGameStats();
  assert.equal(g.placementHistory.length, 1, "letztes Ergebnis wird einmalig in den Verlauf übernommen");
  assert.equal(g.placementHistory[0].level, "A2");
  assert.equal(g.placementHistory[0].finalScore, 0.62);
  assert.equal(g.placementHistory[0].at, "2026-06-15");
  // Bereits vorhandene History wird NICHT überschrieben/dupliziert.
  storeMem[GKEY] = JSON.stringify({
    placement: { level: "B1-", finalScore: 0.8, at: "2026-06-18", ts: "2026-06-18T10:00:00.000Z" },
    placementHistory: [{ level: "A2", finalScore: 0.62, at: "2026-06-15", ts: "2026-06-15T20:00:00.000Z" }],
  });
  assert.equal(store.loadGameStats().placementHistory.length, 1, "vorhandene History bleibt unangetastet");
});

test("store.loadGameStats: Ruta-Check-Review bleibt erhalten, wird typisiert & gedeckelt", () => {
  // Frage-für-Frage-Rückblick wird mitgespeichert, damit man die einzelnen
  // Antworten/Fehler später im Profil abrufen kann. Korruptes/zu großes wird
  // sicher beschnitten (Anzahl ≤ 60), Nicht-Objekte fallen raus.
  const bigReview = [];
  for (let i = 0; i < 70; i++) bigReview.push({ status: "wrong", promptDe: "F" + i, correctText: "x" });
  bigReview.push("junk", 42, null);
  storeMem[GKEY] = JSON.stringify({
    placement: {
      level: "B1-", finalScore: 0.67, at: "2026-06-19", ts: "2026-06-19T10:00:00.000Z",
      review: [
        { status: "correct", promptDe: "Wie heißt das Wort danke?", questionEs: "", yourText: "gracias", correctText: "gracias", explanationDe: "", typo: false },
        { status: "wrong", promptDe: "Wie heißt das Wort Wasser?", yourText: "leche", correctText: "agua", explanationDe: "agua = Wasser." },
        { status: "unknown", promptDe: "Konjugiere ser (yo)", correctText: "soy" },
      ],
    },
    assessment: {
      level: "B1", variant: "standard", at: "2026-06-16",
      review: bigReview,
    },
  });
  const g = store.loadGameStats();
  // Letztes Ergebnis behält seinen vollen Rückblick (alle drei Einträge).
  assert.equal(g.placement.review.length, 3, "Ruta-Check-Review wird gesichert");
  assert.equal(g.placement.review[1].status, "wrong");
  assert.equal(g.placement.review[1].yourText, "leche");
  assert.equal(g.placement.review[1].correctText, "agua");
  // Auch der Verlaufseintrag (aus dem letzten Ergebnis übernommen) trägt den Rückblick.
  assert.equal(g.placementHistory[0].review.length, 3);
  // Übergroßer/korrupter Review wird auf 60 echte Objekte beschnitten.
  assert.equal(g.assessment.review.length, 60, "Review-Anzahl gedeckelt, Nicht-Objekte raus");
  assert.equal(g.assessment.review[0].promptDe, "F0");
});

test("store.loadGameStats: pretripDays – altes flaches Format wird nach { colombia: … } migriert", () => {
  // Bestandsgerät mit altem, flachem Kolumbien-Fortschritt.
  storeMem[GKEY] = JSON.stringify({ reviews: 1, pretripDays: { 1: true, 2: true, 3: true } });
  assert.deepEqual(store.loadGameStats().pretripDays, { colombia: { 1: true, 2: true, 3: true } });
  // Bereits verschachtelte Daten bleiben unverändert (kein erneutes Wrappen).
  const nested = { colombia: { 1: true }, peru: { 1: true, 2: true } };
  storeMem[GKEY] = JSON.stringify({ reviews: 1, pretripDays: nested });
  assert.deepEqual(store.loadGameStats().pretripDays, nested);
  // Kaputt/gemischt -> leer (defensiv).
  storeMem[GKEY] = JSON.stringify({ reviews: 1, pretripDays: { 1: true, peru: { 1: true } } });
  assert.deepEqual(store.loadGameStats().pretripDays, {});
});

test("store.readBackup: liest Backup ohne Schreiben, tolerant gegen Müll (Lehrer-Modus)", () => {
  const payload = { app: "holaruta", format: 1, data: {
    "spanischcard.progress.v2": { co01: { seen: 3, box: 5 } },
    "spanischcard.gamestats.v1": { reviews: 5, challengesDone: { challenge01: true } },
  } };
  const b = store.readBackup(payload);
  assert.deepEqual(b.progress, { co01: { seen: 3, box: 5 } });
  assert.deepEqual(b.gamestats, { reviews: 5, challengesDone: { challenge01: true } });
  // Fremde App / fehlendes data / null -> null (kein Crash).
  assert.equal(store.readBackup({ app: "other", data: {} }), null);
  assert.equal(store.readBackup({ app: "holaruta" }), null);
  assert.equal(store.readBackup(null), null);
  // Fehlende Keys -> leere Objekte statt Absturz.
  assert.deepEqual(store.readBackup({ data: {} }), { progress: {}, gamestats: {} });
  // Reiner Lesevorgang: schreibt NICHTS in den Speicher (eigener Fortschritt bleibt unangetastet).
  const before = JSON.stringify(storeMem);
  store.readBackup(payload);
  assert.equal(JSON.stringify(storeMem), before, "readBackup darf nicht in localStorage schreiben");
});

test("store.encodeTask/decodeTask: Round-Trip + Validierung (Aufgaben-Code)", () => {
  const task = { kind: "pretrip", scope: "peru", title: "Übung für Cusco", due: "2026-07-01" };
  const code = store.encodeTask(task);
  assert.ok(typeof code === "string" && code.indexOf("HRT1.") === 0, "Code hat Tag-Präfix");
  const back = store.decodeTask(code);
  assert.deepEqual(back, { kind: "pretrip", scope: "peru", title: "Übung für Cusco", due: "2026-07-01" });
  // Code ohne Präfix wird auch akzeptiert.
  assert.deepEqual(store.decodeTask(code.slice(5)).scope, "peru");
  // Optionale Felder weggelassen.
  assert.deepEqual(store.decodeTask(store.encodeTask({ kind: "preset", scope: "prearrival-co" })),
    { kind: "preset", scope: "prearrival-co", title: "", due: "" });
  // Müll / falsche app / kaputtes Datum.
  assert.equal(store.decodeTask("nonsense"), null);
  assert.equal(store.decodeTask(""), null);
  assert.equal(store.decodeTask(null), null);
  assert.equal(store.decodeTask(store.encodeTask({ kind: "weird", scope: "x" })), null);
  assert.equal(store.decodeTask(store.encodeTask({ kind: "category" })), null); // scope fehlt
  assert.equal(store.decodeTask("HRT1." + Buffer.from('{"app":"other","kind":"preset","scope":"x"}').toString("base64")), null);
  const badDue = store.decodeTask(store.encodeTask({ kind: "category", scope: "colombia", due: "01.07.2026" }));
  assert.equal(badDue.due, ""); // ungültiges Datum -> leer
});

test("store.loadTasks/saveTasks: abonnierte Aufgaben (mehrere, defensiv typisiert)", () => {
  const TKEY = "spanischcard.tasks.v1";
  // Round-Trip einer gültigen Liste.
  const list = [
    { code: "HRT1.aaa", kind: "pretrip", scope: "peru", title: "HA1", due: "2026-07-01", addedAt: "2026-06-15" },
    { code: "HRT1.bbb", kind: "preset", scope: "prearrival-co", title: "", due: "", addedAt: "2026-06-15" },
  ];
  store.saveTasks(list);
  assert.deepEqual(store.loadTasks(), list);
  // Müll-Einträge werden verworfen (kein Crash): fehlender code/kind/scope, falscher Typ.
  storeMem[TKEY] = JSON.stringify([
    { code: "HRT1.ok", kind: "category", scope: "colombia" }, // gültig (Optional-Felder ergänzt)
    { kind: "preset", scope: "x" },        // code fehlt
    { code: "x", kind: "weird", scope: "y" }, // kind ungültig
    "nonsense", 42, null,                  // keine Objekte
  ]);
  const loaded = store.loadTasks();
  assert.equal(loaded.length, 1);
  assert.deepEqual(loaded[0], { code: "HRT1.ok", kind: "category", scope: "colombia", title: "", due: "", addedAt: "" });
  // Kaputter Storage -> leere Liste.
  storeMem[TKEY] = "{not json";
  assert.deepEqual(store.loadTasks(), []);
});

test("store.loadGameStats: Trip-Ziel wird gesäubert (kaputtes Datum/perDay -> null)", () => {
  const base = (trip) => JSON.stringify(Object.assign({ reviews: 1 }, { tripGoal: trip }));
  // Gültig: bleibt erhalten, perDay wird gerundet/gedeckelt.
  storeMem[GKEY] = base({ destination: "Lima", endDate: "2026-08-01", perDay: 20.6, startedAt: "2026-06-12" });
  assert.deepEqual(store.loadGameStats().tripGoal,
    { destination: "Lima", endDate: "2026-08-01", perDay: 21, startedAt: "2026-06-12" });
  // Kaputtes Datum -> null.
  storeMem[GKEY] = base({ destination: "X", endDate: "01.08.2026", perDay: 10 });
  assert.equal(store.loadGameStats().tripGoal, null);
  // perDay nicht-numerisch/fehlt -> null.
  storeMem[GKEY] = base({ destination: "X", endDate: "2026-08-01", perDay: "viele" });
  assert.equal(store.loadGameStats().tripGoal, null);
  // numerisches perDay 0 wird defensiv auf 1 geklemmt (Ziel bleibt erhalten).
  storeMem[GKEY] = base({ destination: "X", endDate: "2026-08-01", perDay: 0 });
  assert.equal(store.loadGameStats().tripGoal.perDay, 1);
  // perDay über dem Limit wird gedeckelt (500).
  storeMem[GKEY] = base({ destination: "X", endDate: "2026-08-01", perDay: 9999 });
  assert.equal(store.loadGameStats().tripGoal.perDay, 500);
});

test("store.loadGameStats: Trip-Ziel – optionale Aufenthaltsdauer (Rückreise/Tage)", () => {
  const base = (trip) => JSON.stringify(Object.assign({ reviews: 1 }, { tripGoal: trip }));
  // Gültiges Rückreisedatum (>= Abreise) bleibt erhalten.
  storeMem[GKEY] = base({ destination: "Lima", endDate: "2026-08-01", perDay: 10, returnDate: "2026-08-15" });
  assert.equal(store.loadGameStats().tripGoal.returnDate, "2026-08-15");
  // Rückreise VOR der Abreise wird verworfen (kein negativer Aufenthalt).
  storeMem[GKEY] = base({ destination: "Lima", endDate: "2026-08-01", perDay: 10, returnDate: "2026-07-20" });
  assert.equal(store.loadGameStats().tripGoal.returnDate, undefined);
  // Grobe Tageszahl ohne Datum: gerundet & auf 400 gedeckelt.
  storeMem[GKEY] = base({ destination: "Lima", endDate: "2026-08-01", perDay: 10, stayDays: 999 });
  assert.equal(store.loadGameStats().tripGoal.stayDays, 400);
  // Rückreisedatum hat Vorrang: stayDays wird dann nicht zusätzlich gesetzt.
  storeMem[GKEY] = base({ destination: "Lima", endDate: "2026-08-01", perDay: 10, returnDate: "2026-08-10", stayDays: 30 });
  const g = store.loadGameStats().tripGoal;
  assert.equal(g.returnDate, "2026-08-10");
  assert.equal(g.stayDays, undefined);
});

// ---------- data-Integrität ----------
test("data.CARDS: alle IDs eindeutig (inkl. Hostel/Social)", () => {
  const ids = data.CARDS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("data.CATEGORIES: Hostel & Social vorhanden, jede Karte hat gültige cat", () => {
  const catIds = new Set(data.CATEGORIES.map((c) => c.id));
  assert.ok(catIds.has("hostel"));
  assert.ok(catIds.has("social"));
  data.CARDS.forEach((c) => assert.ok(catIds.has(c.cat), `unbekannte cat: ${c.cat} (${c.id})`));
});

test("data.BATTLES: Pflichtfelder, gültige scene, acceptable nicht leer, gültige Stufe", () => {
  const scenes = new Set(data.BATTLE_SCENES.map((s) => s.id));
  const lvlIds = new Set(data.LEVELS.map((l) => l.id));
  const ids = data.BATTLES.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length); // eindeutige IDs
  data.BATTLES.forEach((b) => {
    assert.ok(b.promptDe && b.answerEs, `Felder fehlen: ${b.id}`);
    assert.ok(scenes.has(b.scene), `unbekannte scene: ${b.scene} (${b.id})`);
    assert.ok(Array.isArray(b.acceptable) && b.acceptable.length > 0, `acceptable leer: ${b.id}`);
    assert.ok(lvlIds.has(b.level), `ungültige Stufe: ${b.level} (${b.id})`);
  });
});

test("data.BATTLES: jede Szene liefert genug für eine faire Mindest-Runde (≥ 4)", () => {
  data.BATTLE_SCENES.forEach((s) => {
    const n = data.BATTLES.filter((b) => b.scene === s.id).length;
    assert.ok(n >= 4, `Szene ${s.id} hat nur ${n} Aufgaben`);
  });
});

test("data.ROLEPLAYS: Rollen, Dialog mit Sprecher A/B, usefulPhrases gesetzt", () => {
  assert.ok(data.ROLEPLAYS.length >= 6);
  data.ROLEPLAYS.forEach((r) => {
    assert.ok(r.roles && r.roles.a && r.roles.b, `Rollen fehlen: ${r.id}`);
    assert.ok(Array.isArray(r.dialogue) && r.dialogue.length > 0, `Dialog leer: ${r.id}`);
    r.dialogue.forEach((d) => {
      assert.ok(d.speaker === "A" || d.speaker === "B", `ungültiger Sprecher: ${r.id}`);
      assert.ok(d.de && d.es, `Dialogzeile unvollständig: ${r.id}`);
    });
    assert.ok(Array.isArray(r.usefulPhrases) && r.usefulPhrases.length > 0, `usefulPhrases leer: ${r.id}`);
  });
});

test("data.CHALLENGES: textDe und phraseEs gesetzt", () => {
  assert.ok(data.CHALLENGES.length > 0);
  data.CHALLENGES.forEach((c) => {
    assert.ok(c.textDe && c.phraseEs, `Challenge unvollständig: ${c.id}`);
  });
});

// ---------- Definiciones (Zuordnen-Quiz) ----------
test("data.QUIZ_DEFS: eindeutige IDs, Pflichtfelder, gültiges set, je Liste ≥ 4 Optionen", () => {
  const setIds = new Set(data.QUIZ_SETS.map((s) => s.id));
  assert.ok(setIds.size > 0, "keine Quiz-Listen definiert");
  const ids = data.QUIZ_DEFS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length, "doppelte QUIZ_DEFS-IDs");
  data.QUIZ_DEFS.forEach((d) => {
    assert.ok(d.es && d.de && d.def && d.icon, `Felder fehlen: ${d.id}`);
    assert.ok(setIds.has(d.set), `unbekanntes set: ${d.set} (${d.id})`);
  });
  // Multiple-Choice braucht genug Ablenker: jede Liste mindestens 4 Einträge.
  data.QUIZ_SETS.forEach((s) => {
    const n = data.QUIZ_DEFS.filter((d) => d.set === s.id).length;
    assert.ok(n >= 4, `Liste ${s.id} hat nur ${n} Einträge (mind. 4 nötig)`);
  });
});

test("data.QUIZ_SETS: lvl verweist auf eine bekannte Stufe", () => {
  const lvlIds = new Set(data.LEVELS.map((l) => l.id));
  data.QUIZ_SETS.forEach((s) => {
    assert.ok(s.label && s.icon && s.intro, `Listen-Felder fehlen: ${s.id}`);
    assert.ok(lvlIds.has(s.lvl), `unbekannte Stufe in Liste ${s.id}: ${s.lvl}`);
  });
});

// ---------- data: El Cuerpo (Körperkarte) ----------
test("data.BODY_PARTS: eindeutige IDs, Pflichtfelder, Koordinaten im Rahmen", () => {
  const ids = data.BODY_PARTS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, "doppelte BODY_PARTS-IDs");
  data.BODY_PARTS.forEach((p) => {
    assert.ok(p.es && p.de && p.note, `Felder fehlen: ${p.id}`);
    assert.ok(typeof p.x === "number" && p.x >= 0 && p.x <= 100, `x außerhalb 0–100: ${p.id}`);
    assert.ok(typeof p.y === "number" && p.y >= 0 && p.y <= 100, `y außerhalb 0–100: ${p.id}`);
  });
});

test("data.SHOPPING: drei Rubriken, eindeutige Item-IDs, Pflichtfelder", () => {
  assert.ok(Array.isArray(data.SHOPPING) && data.SHOPPING.length === 3, "drei Rubriken erwartet");
  const allIds = [];
  data.SHOPPING.forEach((s) => {
    assert.ok(s.id && s.icon && s.label && s.de, `Rubrik-Felder fehlen: ${s.id}`);
    assert.ok(Array.isArray(s.grad) && s.grad.length === 2, `grad fehlt: ${s.id}`);
    assert.ok(Array.isArray(s.items) && s.items.length >= 4, `zu wenige Items: ${s.id}`);
    s.items.forEach((it) => {
      assert.ok(it.id && it.es && it.de && it.tip && it.note, `Item-Felder fehlen: ${it.id}`);
      allIds.push(it.id);
    });
  });
  assert.equal(new Set(allIds).size, allIds.length, "doppelte SHOPPING-Item-IDs");
});

// ---------- badges: El Cuerpo ----------
test("badges.buildMetrics: zählt distinkte erkundete Körperteile", () => {
  const m = badges.buildMetrics([{ id: "a", cat: "basics" }], {}, {
    bodyPartsSeen: { bp_cabeza: true, bp_mano: true, bp_pie: true },
  });
  assert.equal(m.bodyPartsExplored, 3);
});

test("badges: Cuerpo-Badges schalten über die Schwelle frei", () => {
  const seen = {};
  data.BODY_PARTS.forEach((p) => { seen[p.id] = true; }); // alle erkundet
  const ids = badges.satisfiedIds(badges.buildMetrics([{ id: "a", cat: "basics" }], {}, { bodyPartsSeen: seen }));
  assert.ok(ids.includes("cuerpo_first"));
  assert.ok(ids.includes("cuerpo_10"));
  assert.ok(ids.includes("cuerpo_all"));
});

test("badges: ohne erkundete Körperteile bleiben Cuerpo-Badges gesperrt", () => {
  const ids = badges.satisfiedIds(badges.buildMetrics([{ id: "a", cat: "basics" }], {}, {}));
  assert.ok(!ids.includes("cuerpo_first"));
});

// ---------- badges: Definiciones ----------
test("badges.buildMetrics: Quiz-Zähler übernommen", () => {
  const m = badges.buildMetrics([{ id: "a", cat: "basics" }], {}, {
    quizzesPlayed: 4, quizzesPerfect: 1,
  });
  assert.equal(m.quizzesPlayed, 4);
  assert.equal(m.quizzesPerfect, 1);
});

test("badges: Quiz-Badges schalten über Zähler frei", () => {
  const m = badges.buildMetrics([{ id: "a", cat: "basics" }], {}, {
    quizzesPlayed: 10, quizzesPerfect: 1,
  });
  const ids = badges.satisfiedIds(m);
  assert.ok(ids.includes("quiz_first"));
  assert.ok(ids.includes("quiz_10"));
  assert.ok(ids.includes("quiz_perfect"));
});

test("badges: ohne Quiz-Runden bleiben Quiz-Badges gesperrt", () => {
  const ids = badges.satisfiedIds(badges.buildMetrics([{ id: "a", cat: "basics" }], {}, {}));
  assert.ok(!ids.includes("quiz_first"));
  assert.ok(!ids.includes("quiz_perfect"));
});

// ---------- Reise-Kontext (🧭) ----------
test("data.CARDS: ALLE Karten haben vollständigen Kontext", () => {
  const without = data.CARDS.filter((c) => !c.context);
  assert.equal(without.length, 0, `ohne Kontext: ${without.map((c) => c.id).join(", ")}`);
  data.CARDS.forEach((c) => {
    const ctx = c.context;
    assert.ok(ctx.sentenceEs && ctx.sentenceDe, `Beispielsatz fehlt: ${c.id}`);
    assert.ok(ctx.situation, `situation fehlt: ${c.id}`);
    assert.ok(ctx.note, `note (Reisetipp) fehlt: ${c.id}`);
  });
});

test("data.CARDS: Kontext-Beispielsätze haben ausgeglichene ¿? und ¡!", () => {
  data.CARDS.forEach((c) => {
    const e = c.context.sentenceEs;
    const cnt = (re) => (e.match(re) || []).length;
    assert.equal(cnt(/¿/g), cnt(/\?/g), `¿?-Mismatch: ${c.id} (${e})`);
    assert.equal(cnt(/¡/g), cnt(/!/g), `¡!-Mismatch: ${c.id} (${e})`);
  });
});

test("data.numberContext: reine Zahlen-Karten bekommen praktischen Preis-Kontext", () => {
  const z = data.CARDS.find((c) => c.id === "z58");
  assert.match(z.context.sentenceEs, /pesos/);
  assert.match(z.context.sentenceDe, /Pesos/);
});

test("data.numberContext: spanische Grammatik korrekt (un peso / un / de pesos)", () => {
  const es = (id) => data.CARDS.find((c) => c.id === id).context.sentenceEs;
  // genau 1: Singular "un peso", kein "uno pesos"
  assert.equal(es("z01"), "Es un peso.");
  // Apokope vor dem Nomen: veintiún / ...un, nie "uno pesos"
  assert.equal(es("z21"), "Son veintiún pesos.");
  assert.equal(es("z31"), "Son treinta y un pesos.");
  assert.equal(es("z101"), "Son ciento un pesos.");
  data.CARDS.forEach((c) => {
    if (/^z\d+$/.test(c.id)) assert.doesNotMatch(c.context.sentenceEs, /uno pesos/, `falsches "uno pesos": ${c.id}`);
  });
  // "de pesos" nur bei reinem Millionenbetrag, nicht mit Tausender-Rest;
  // genau eine Million ist ein Singular-Subjekt -> "Es", ab zwei Millionen "Son"
  assert.equal(es("z1000000"), "Es un millón de pesos.");
  assert.equal(es("z2000000"), "Son dos millones de pesos.");
  assert.equal(es("z1500000"), "Son un millón quinientos mil pesos.");
  assert.equal(es("z3500000"), "Son tres millones quinientos mil pesos.");
  // 0 ergibt keinen erfundenen Preis
  assert.doesNotMatch(es("z00"), /cero pesos\.$/);
});

test("badges.buildMetrics: zählt distinkte Kontext-Karten", () => {
  const counters = { contextCardsSeen: { hostel01: true, social01: true } };
  const m = badges.buildMetrics(data.CARDS, {}, counters);
  assert.equal(m.contextCardsViewed, 2);
});

test("badges.evaluate: Kontext-Badge schaltet bei Schwelle frei", () => {
  const seen = {};
  for (let i = 0; i < 10; i++) seen["c" + i] = true; // 10 distinkte Kontexte
  const m = badges.buildMetrics(data.CARDS, {}, { contextCardsSeen: seen });
  const list = badges.evaluate(m, {});
  const byId = (id) => list.find((b) => b.id === id);
  assert.equal(byId("context_first").unlocked, true);
  assert.equal(byId("context_10").unlocked, true);
  assert.equal(byId("context_25").unlocked, false);
});

// ---------- badges: Hostel Mode ----------
test("badges.buildMetrics: Hostel-Mode-Zähler übernommen (Rollenspiele distinkt)", () => {
  const m = badges.buildMetrics([{ id: "a", cat: "hostel" }], {}, {
    battlesPlayed: 3, battlesWon: 2, perfectBattles: 1,
    roleplaysSeen: { hr01: true, hr02: true },
  });
  assert.equal(m.battlesPlayed, 3);
  assert.equal(m.battlesWon, 2);
  assert.equal(m.perfectBattles, 1);
  assert.equal(m.roleplaysCompleted, 2);
});

test("badges: Hostel-Mode-Badges schalten über Zähler frei", () => {
  const m = badges.buildMetrics([{ id: "a", cat: "hostel" }], {}, {
    battlesPlayed: 1, battlesWon: 1, perfectBattles: 1,
    roleplaysSeen: { a: true, b: true, c: true, d: true, e: true },
  });
  const ids = badges.satisfiedIds(m);
  assert.ok(ids.includes("battle_first"));
  assert.ok(ids.includes("battle_win"));
  assert.ok(ids.includes("battle_perfect"));
  assert.ok(!ids.includes("battle_10")); // erst ab 10
  assert.ok(ids.includes("roleplay_first"));
  assert.ok(ids.includes("roleplay_5"));
});

test("badges: Kategorie-Badges für Hostel & Social greifen ab 80 %", () => {
  const cards = Array.from({ length: 5 }, (_, i) => ({ id: "h" + i, cat: "hostel" }))
    .concat(Array.from({ length: 5 }, (_, i) => ({ id: "s" + i, cat: "social" })));
  const prog = {};
  for (let i = 0; i < 4; i++) prog["h" + i] = { seen: 2, interval: 10 }; // 4/5 hostel = 80 %
  const ids = badges.satisfiedIds(badges.buildMetrics(cards, prog, {}));
  assert.ok(ids.includes("cat_hostel"));
  assert.ok(!ids.includes("cat_social")); // social 0 %
});

// ---------- badges: Comeback & Real-Life Challenges ----------
test("badges: Comeback Kid & Challenge-Badges schalten über Zähler frei", () => {
  const m = badges.buildMetrics([{ id: "a", cat: "hostel" }], {}, {
    comebacks: 1, challengesDone: { challenge01: true },
  });
  assert.equal(m.comebacks, 1);
  assert.equal(m.challengesCompleted, 1);
  const ids = badges.satisfiedIds(m);
  assert.ok(ids.includes("battle_comeback"));
  assert.ok(ids.includes("challenge_first"));
  assert.ok(!ids.includes("challenge_5")); // erst ab 5
});

test("badges: challenge_5 ab 5 distinkten Challenges", () => {
  const done = {};
  for (let i = 1; i <= 5; i++) done["challenge0" + i] = true;
  const m = badges.buildMetrics([{ id: "a", cat: "hostel" }], {}, { challengesDone: done });
  assert.equal(m.challengesCompleted, 5);
  assert.ok(badges.satisfiedIds(m).includes("challenge_5"));
});

// ---------- Kuratierte Presets ----------
test("data.PRESETS: jede Preset-ID existiert, scope gültig, keine Dubletten", () => {
  const cardIds = new Set(data.CARDS.map((c) => c.id));
  const scopes = new Set(data.CATEGORIES.map((c) => c.id).concat("all"));
  assert.ok(Array.isArray(data.PRESETS) && data.PRESETS.length, "PRESETS fehlt/leer");
  data.PRESETS.forEach((p) => {
    assert.ok(p.id && typeof p.id === "string", "Preset ohne id");
    assert.ok(scopes.has(p.scope), `Preset ${p.id}: unbekannter scope ${p.scope}`);
    assert.ok(Array.isArray(p.pick) && p.pick.length, `Preset ${p.id}: pick leer`);
    const seen = new Set();
    p.pick.forEach((cid) => {
      assert.ok(cardIds.has(cid), `Preset ${p.id}: unbekannte Karte ${cid}`);
      assert.ok(!seen.has(cid), `Preset ${p.id}: Dublette ${cid}`);
      seen.add(cid);
    });
  });
});

// ---------- Editionen (Co-Branding) ----------
test("editions: Registry-Configs valide + Anker-Dateien zeigen darauf", () => {
  const fs = require("fs");
  const dir = path.join(SRC, "editions");
  // 1) registry.js = Quelle der Wahrheit für alle Editionen.
  const w = {};
  new Function("window", fs.readFileSync(path.join(dir, "registry.js"), "utf8"))(w);
  const editions = w.SC && w.SC.editions;
  assert.ok(editions && Object.keys(editions).length > 0, "keine Editionen in der Registry");
  Object.keys(editions).forEach((id) => {
    const c = editions[id];
    assert.equal(c && c.edition, id, `${id}: edition-Feld stimmt nicht mit Schlüssel überein`);
    assert.ok(c.brandName, `${id}: brandName fehlt`);
    if (c.accent) {
      ["brand", "brandInk"].forEach((k) =>
        assert.match(String(c.accent[k] || ""), /^#[0-9a-fA-F]{6}$/, `${id}: accent.${k} kein Hex`));
    }
    if (c.partner) assert.ok(c.partner.name, `${id}: partner.name fehlt`);
    if (c.logo) assert.match(String(c.logo), /^(https:\/\/|data:image\/)/, `${id}: logo nur https:/data:image erlaubt`);
  });
  // 2) Anker-Dateien (ecos.js/weroad.js) setzen editionConfig aus der Registry.
  fs.readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "registry.js").forEach((f) => {
    const w2 = { SC: { editions } }; // Registry ist im Build VOR dem Anker geladen
    new Function("window", fs.readFileSync(path.join(dir, f), "utf8"))(w2);
    const c = w2.SC.editionConfig;
    assert.ok(c && c.edition, `${f}: editionConfig nicht aus Registry gesetzt`);
    assert.ok(editions[c.edition], `${f}: zeigt auf unbekannte Edition ${c.edition}`);
  });
});

test("config.js: Default = HolaRuta pur (ohne Edition)", () => {
  const fs = require("fs");
  const w = {};
  new Function("window", fs.readFileSync(path.join(SRC, "config.js"), "utf8"))(w);
  assert.equal(w.SC.config.edition, null);
  assert.equal(w.SC.config.brandName, "HolaRuta");
});

// ---------- Pre-Trip-Plan ----------
test("data.PRETRIP: Pläne je Destination, Tage sequenziell, Karten/Challenges existieren, Badge passt", () => {
  const cardIds = new Set(data.CARDS.map((c) => c.id));
  const challengeIds = new Set(data.CHALLENGES.map((c) => c.id));
  const scopes = new Set(data.CATEGORIES.map((c) => c.id));
  assert.ok(Array.isArray(data.PRETRIP) && data.PRETRIP.length, "PRETRIP fehlt/leer");
  data.PRETRIP.forEach((plan) => {
    assert.ok(scopes.has(plan.scope), `Plan: unbekannter scope ${plan.scope}`);
    assert.ok(Array.isArray(plan.days) && plan.days.length, `Plan ${plan.scope}: days leer`);
    plan.days.forEach((d, i) => {
      assert.equal(d.day, i + 1, `${plan.scope} Tag ${i + 1}: day-Nummer nicht sequenziell`);
      assert.ok(d.titleDe && d.titleEn, `${plan.scope} Tag ${d.day}: Titel fehlt`);
      assert.ok(Array.isArray(d.cardIds) && d.cardIds.length, `${plan.scope} Tag ${d.day}: cardIds leer`);
      d.cardIds.forEach((id) => assert.ok(cardIds.has(id), `${plan.scope} Tag ${d.day}: unbekannte Karte ${id}`));
      if (d.challengeId) assert.ok(challengeIds.has(d.challengeId), `${plan.scope} Tag ${d.day}: unbekannte Challenge ${d.challengeId}`);
    });
    // Keine Karte doppelt innerhalb eines Plans (sauberer, abwechslungsreicher Pfad).
    const seen = new Set();
    plan.days.forEach((d) => d.cardIds.forEach((id) => {
      assert.ok(!seen.has(id), `${plan.scope}: Karte ${id} in mehreren Etappen`);
      seen.add(id);
    }));
  });
  // „Reisefertig"-Badge schaltet frei, wenn EIN ganzer Plan geschafft ist; alle Pläne gleich lang.
  const badge = badges.byId("pretrip_done");
  assert.ok(badge, "pretrip_done-Badge fehlt");
  const lengths = new Set(data.PRETRIP.map((p) => p.days.length));
  assert.equal(lengths.size, 1, "Pläne haben unterschiedliche Etappenzahl");
  assert.equal(badge.threshold, data.PRETRIP[0].days.length, "Badge-Schwelle != Etappen pro Plan");
});

test("badges: pretrip_done erst ab einem vollständigen Plan", () => {
  const cards = [{ id: "a", cat: "hostel" }];
  const N = data.PRETRIP[0].days.length;
  // verschachteltes Format, ein Plan teilweise -> kein Badge
  const partial = { colombia: {} }; for (let i = 1; i <= N - 1; i++) partial.colombia[i] = true;
  assert.ok(!badges.satisfiedIds(badges.buildMetrics(cards, {}, { pretripDays: partial })).includes("pretrip_done"));
  // ein Plan vollständig -> Badge
  const full = { peru: {} }; for (let i = 1; i <= N; i++) full.peru[i] = true;
  assert.ok(badges.satisfiedIds(badges.buildMetrics(cards, {}, { pretripDays: full })).includes("pretrip_done"));
});
