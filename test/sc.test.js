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
    reviews: 12, againPresses: 4, dailyStreak: 2, longestStreak: 9,
    lastStudyDate: "2026-06-11", nightOwl: true, earlyBird: true,
    battlesPlayed: 5, battlesWon: 3, perfectBattles: 1, comebacks: 1,
    roleplaysSeen: { hr01: true }, challengesDone: { challenge01: true },
    contextCardsSeen: { hostel01: true },
    quizzesPlayed: 7, quizzesPerfect: 2,
    unlocked: { first_steps: 1700000000000 },
  };
  storeMem[GKEY] = JSON.stringify(valid);
  assert.deepEqual(store.loadGameStats(), valid);
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

test("data.BATTLES: Pflichtfelder, gültige scene, acceptable nicht leer", () => {
  const scenes = new Set(data.BATTLE_SCENES.map((s) => s.id));
  const ids = data.BATTLES.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length); // eindeutige IDs
  data.BATTLES.forEach((b) => {
    assert.ok(b.promptDe && b.answerEs, `Felder fehlen: ${b.id}`);
    assert.ok(scenes.has(b.scene), `unbekannte scene: ${b.scene} (${b.id})`);
    assert.ok(Array.isArray(b.acceptable) && b.acceptable.length > 0, `acceptable leer: ${b.id}`);
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
  // "de pesos" nur bei reinem Millionenbetrag, nicht mit Tausender-Rest
  assert.equal(es("z1000000"), "Son un millón de pesos.");
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
