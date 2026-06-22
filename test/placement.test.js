/*
 * placement.test.js – Tests für den REINEN Kern des Ruta-Checks (placement.js):
 * Antwort-Bewertung, Zeit-Sicherheit, Level-Formel und Gesamtauswertung.
 * Kein DOM, kein Server.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
// matcher.js zuerst laden – wie im App-Bundle. So testet der Freitext-Pfad die
// echte, geteilte Fuzzy-Logik (SC.matcher.matchFree) statt eines Duplikats.
require(path.join(__dirname, "..", "matcher.js"));
require(path.join(__dirname, "..", "placement.js"));
const { placement } = globalThis.window.SC;

test("Fragenkatalog: gültig, eindeutige IDs, alle Stufen für die Treppe vorhanden", () => {
  const Q = placement.QUESTIONS;
  assert.ok(Q.length >= 24, "genug Fragen für den adaptiven Test");
  const ids = {}, levels = {}, grammar = { n: 0 };
  for (const q of Q) {
    assert.ok(q.id && q.block && q.skill && q.level && q.type, "Pflichtfeld fehlt: " + q.id);
    assert.ok(!ids[q.id], "doppelte id: " + q.id); ids[q.id] = 1;
    assert.ok(placement.LEVEL_ORDER.includes(q.level), "gültige Stufe: " + q.id);
    assert.ok(typeof q.promptDe === "string" && q.promptDe.length > 0, "promptDe fehlt: " + q.id);
    assert.ok(typeof q.expectedTimeSec === "number" && q.expectedTimeSec > 0, "expectedTimeSec: " + q.id);
    if (q.type === "mc") {
      assert.ok(Array.isArray(q.options) && q.options.length === 4, "4 Optionen: " + q.id);
      assert.ok(q.correctIndex >= 0 && q.correctIndex < 4, "correctIndex im Bereich: " + q.id);
      if (placement.GRAMMAR_SKILLS[q.skill]) grammar.n++;
    } else {
      assert.ok(Array.isArray(q.accept) && q.accept.length > 0, "accept[] fehlt: " + q.id);
    }
    levels[q.level] = (levels[q.level] || 0) + 1;
  }
  // Jede Treppenstufe (A0..B1) muss bestückt sein, sonst kann der Test nicht adaptieren.
  for (const lvl of placement.LEVEL_ORDER) assert.ok(levels[lvl] > 0, "Stufe ohne Fragen: " + lvl);
  // Grammatik bleibt eine Diagnose-Dosis (nicht der Schwerpunkt).
  const mcCount = Q.filter((q) => q.type === "mc").length;
  assert.ok(grammar.n / mcCount >= 0.2 && grammar.n / mcCount <= 0.35, "Grammatik 20–35 % der MC");
  assert.ok(placement.freeQuestions(Q).length >= 1, "mind. eine freie Antwort");
});

test("nextDifficulty: richtig -> schwerer, falsch/unbekannt -> leichter (geklemmt)", () => {
  assert.equal(placement.nextDifficulty(1, "correct"), 2);
  assert.equal(placement.nextDifficulty(1, "wrong"), 0);
  assert.equal(placement.nextDifficulty(1, "unknown"), 0);
  assert.equal(placement.nextDifficulty(3, "correct"), 3); // Deckel oben (B1)
  assert.equal(placement.nextDifficulty(0, "wrong"), 0);   // Boden unten (A0)
});

test("pickNextMc: bevorzugt Zielstufe, hält den Grammatik-Deckel, nie schon Gefragtes", () => {
  const Q = placement.QUESTIONS;
  // Zielstufe A0 (index 0) -> eine A0-Frage zuerst.
  let q = placement.pickNextMc(Q, [], 0, 0, placement.GRAMMAR_CAP);
  assert.equal(q.level, "A0");
  // Zielstufe B1 (index 3) -> B1 (oder nächstgelegene), nie eine bereits gefragte.
  const askedIds = Q.filter((x) => x.level === "B1").map((x) => x.id);
  q = placement.pickNextMc(Q, askedIds, 3, 0, placement.GRAMMAR_CAP);
  assert.ok(q && askedIds.indexOf(q.id) < 0, "keine Wiederholung");
  // Grammatik-Deckel erreicht -> keine Grammatik-Frage mehr.
  const q2 = placement.pickNextMc(Q, [], 1, placement.GRAMMAR_CAP, placement.GRAMMAR_CAP);
  assert.ok(q2 && !placement.GRAMMAR_SKILLS[q2.skill], "Grammatik wird ausgeschlossen");
});

test("adaptiver Durchlauf: starker Lerner steigt auf, schwacher fällt ab", () => {
  const Q = placement.QUESTIONS;
  // Simuliere den Controller-Kern: immer richtig -> Schwierigkeit klettert nach oben.
  function run(answerCorrect) {
    let asked = [], difficulty = placement.START_DIFFICULTY, grammarAsked = 0, peak = difficulty, low = difficulty;
    for (let i = 0; i < placement.MC_TARGET; i++) {
      const q = placement.pickNextMc(Q, asked, difficulty, grammarAsked, placement.GRAMMAR_CAP);
      if (!q) break;
      asked.push(q.id);
      if (placement.GRAMMAR_SKILLS[q.skill]) grammarAsked++;
      const result = answerCorrect ? "correct" : "wrong";
      difficulty = placement.nextDifficulty(difficulty, result);
      peak = Math.max(peak, difficulty); low = Math.min(low, difficulty);
    }
    // Grammatik-Deckel eingehalten?
    assert.ok(grammarAsked <= placement.GRAMMAR_CAP, "Grammatik-Deckel");
    return { asked, peak, low };
  }
  const strong = run(true);
  const weak = run(false);
  assert.equal(strong.peak, placement.LEVEL_ORDER.length - 1, "starker Lerner erreicht B1-Stufe");
  assert.equal(weak.low, 0, "schwacher Lerner fällt auf A0");
  assert.ok(strong.asked.length > 0 && weak.asked.length > 0);
});

test("scoreAnswer: richtig/falsch/unbekannt + Zeit-Sicherheit nur bei richtig", () => {
  const mc = { type: "mc", correctIndex: 1, expectedTimeSec: 10 };
  // richtig + schnell -> volle Sicherheit
  let r = placement.scoreAnswer(mc, { selectedIndex: 1, responseTimeMs: 5000 });
  assert.equal(r.result, "correct"); assert.equal(r.isCorrect, true); assert.equal(r.timeConfidence, 1.0);
  // richtig + langsam -> geringere Sicherheit
  r = placement.scoreAnswer(mc, { selectedIndex: 1, responseTimeMs: 22000 });
  assert.equal(r.result, "correct"); assert.equal(r.timeConfidence, 0.4);
  // falsch -> kein Zeitbonus
  r = placement.scoreAnswer(mc, { selectedIndex: 0, responseTimeMs: 1000 });
  assert.equal(r.result, "wrong"); assert.equal(r.timeConfidence, 0);
  // unbekannt -> eigener Status, kein Bonus
  r = placement.scoreAnswer(mc, { isUnknown: true, responseTimeMs: 3000 });
  assert.equal(r.result, "unknown"); assert.equal(r.isCorrect, false); assert.equal(r.timeConfidence, 0);
});

test("scoreAnswer (free): akzent-/satzzeichentolerant über akzeptierte Varianten", () => {
  const q = { type: "free", accept: ["cuanto cuesta", "cuanto vale"], expectedTimeSec: 12 };
  assert.equal(placement.scoreAnswer(q, { text: "¿Cuánto cuesta?", responseTimeMs: 5000 }).isCorrect, true);
  assert.equal(placement.scoreAnswer(q, { text: "cuanto   vale", responseTimeMs: 5000 }).isCorrect, true);
  assert.equal(placement.scoreAnswer(q, { text: "no se", responseTimeMs: 5000 }).isCorrect, false);
  assert.equal(placement.scoreAnswer(q, { text: "", responseTimeMs: 5000 }).isCorrect, false);
});

test("scoreAnswer (free): klarer Tippfehler zählt als richtig, mit typo-Flag", () => {
  const q = { type: "free", accept: ["quiero un cafe", "un cafe por favor"], expectedTimeSec: 14 };
  // exakt (akzenttolerant) -> richtig, KEIN Tippfehler-Hinweis
  let r = placement.scoreAnswer(q, { text: "Quiero un café.", responseTimeMs: 5000 });
  assert.equal(r.isCorrect, true); assert.equal(r.typo, false);
  // ein Vertipper ("quiro" statt "quiero") -> richtig, aber als Tippfehler markiert
  r = placement.scoreAnswer(q, { text: "quiro un cafe", responseTimeMs: 5000 });
  assert.equal(r.isCorrect, true); assert.equal(r.typo, true);
  // optionales Pronomen davor ("yo quiero") -> richtig, KEIN Tippfehler-Hinweis
  r = placement.scoreAnswer(q, { text: "yo quiero un café", responseTimeMs: 5000 });
  assert.equal(r.isCorrect, true); assert.equal(r.typo, false);
  // Screenshot-Fall: Pronomen + Vertipper -> richtig, mit Tippfehler-Hinweis
  r = placement.scoreAnswer(q, { text: "yo quiro un café", responseTimeMs: 5000 });
  assert.equal(r.isCorrect, true); assert.equal(r.typo, true);
  // echt andere Antwort bleibt falsch (kein Durchrutschen über die Distanz)
  r = placement.scoreAnswer(q, { text: "no se", responseTimeMs: 5000 });
  assert.equal(r.isCorrect, false); assert.equal(r.typo, false);
  // leere Eingabe bleibt falsch
  r = placement.scoreAnswer(q, { text: "", responseTimeMs: 5000 });
  assert.equal(r.isCorrect, false); assert.equal(r.typo, false);
});

test("matchFree: kurze Antworten bleiben streng (kein gato↔pato)", () => {
  // 4 Buchstaben: Budget 0 -> nur exakt, eine echte Wortverwechslung zählt NICHT.
  assert.equal(placement.matchFree("pato", ["gato"]).correct, false);
  assert.equal(placement.matchFree("gato", ["gato"]).correct, true);
});

test("matchFree: Exact-Only-Fallback ohne matcher.js (graceful degradation)", () => {
  const saved = globalThis.window.SC.matcher;
  delete globalThis.window.SC.matcher;
  try {
    // ohne Matcher: exakt (akzent-/satzzeichentolerant) zählt weiterhin …
    assert.deepEqual(placement.matchFree("Quiero un café.", ["quiero un cafe"]), { correct: true, typo: false });
    // … aber ein Tippfehler wird NICHT mehr toleriert (bewusste Degradierung).
    assert.equal(placement.matchFree("quiro un cafe", ["quiero un cafe"]).correct, false);
  } finally {
    globalThis.window.SC.matcher = saved;
  }
});

test("matchFree: Wortend-Flexion ist falsch, Wortinneres-Vertipper bleibt richtig", () => {
  // Grammatisch falsche Form (Endung) zählt NICHT als Tippfehler -> sauberer Score.
  assert.equal(placement.matchFree("necesita", ["necesito"]).correct, false);
  assert.equal(placement.matchFree("soy vegetariano", ["soy vegetariana"]).correct, false);
  // Echter Vertipper im Wortinneren bleibt ein akzeptierter Tippfehler.
  assert.deepEqual(placement.matchFree("quiro un cafe", ["quiero un cafe"]), { correct: true, typo: true });
});

test("timeConfidence: Schwellen relativ zur erwarteten Zeit", () => {
  assert.equal(placement.timeConfidence(7000, 10), 1.0);   // <= 0.75x
  assert.equal(placement.timeConfidence(14000, 10), 0.7);  // <= 1.5x
  assert.equal(placement.timeConfidence(24000, 10), 0.4);  // <= 2.5x
  assert.equal(placement.timeConfidence(40000, 10), 0.2);  // darüber
});

test("levelFor: Schwellen + Unknown-Override auf A0", () => {
  assert.equal(placement.levelFor(0.20, 0.1), "A0");
  assert.equal(placement.levelFor(0.45, 0.1), "A1");
  assert.equal(placement.levelFor(0.70, 0.1), "A2");
  assert.equal(placement.levelFor(0.85, 0.1), "B1-");
  // viel „weiß nicht“ -> A0, egal wie der Score wäre
  assert.equal(placement.levelFor(0.90, 0.60), "A0");
});

test("summarize: Score 90/10, getrennte Zähler, Skill-Aufschlüsselung, Tempo", () => {
  const questions = [
    { id: "a", skill: "understanding", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "b", skill: "reaction", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "c", skill: "conjugation", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "d", skill: "tenses", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
  ];
  const answers = [
    { selectedIndex: 0, responseTimeMs: 5000 },   // richtig, schnell
    { selectedIndex: 1, responseTimeMs: 4000 },   // falsch
    { isUnknown: true, responseTimeMs: 3000 },     // weiß nicht
    { selectedIndex: 0, responseTimeMs: 9000 },   // richtig, normal
  ];
  const s = placement.summarize(questions, answers);
  assert.equal(s.correct, 2); assert.equal(s.wrong, 1); assert.equal(s.unknown, 1);
  assert.equal(s.total, 4);
  assert.ok(Math.abs(s.accuracy - 0.5) < 1e-9);
  // confidence = Mittel der Zeit-Sicherheit der RICHTIGEN: (1.0 + 0.7)/2 = 0.85
  assert.ok(Math.abs(s.confidence - 0.85) < 1e-9);
  // finalScore = 0.5*0.9 + 0.85*0.1 = 0.535
  assert.ok(Math.abs(s.finalScore - 0.535) < 1e-9);
  assert.ok(Math.abs(s.unknownRate - 0.25) < 1e-9);
  assert.ok(Math.abs(s.wrongRate - 0.25) < 1e-9);
  // Skill-Aufschlüsselung getrennt nach Kommunikation/Grammatik
  assert.equal(s.skillBreakdown.understanding.accuracy, 1);
  assert.equal(s.skillBreakdown.reaction.accuracy, 0);
  assert.ok(s.communicationAccuracy >= 0 && s.grammarAccuracy >= 0);
  assert.ok(["fast", "medium", "slow"].includes(s.tempo));
});

test("summarize: Empfehlungs-Notiz – kommunikativ stark, Grammatik schwach", () => {
  // 3 Kommunikationsfragen richtig, 2 Grammatikfragen falsch.
  const questions = [
    { id: "a", skill: "understanding", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "b", skill: "reaction", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "c", skill: "vocab", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "d", skill: "conjugation", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "e", skill: "tenses", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
  ];
  const answers = [
    { selectedIndex: 0, responseTimeMs: 5000 },
    { selectedIndex: 0, responseTimeMs: 5000 },
    { selectedIndex: 0, responseTimeMs: 5000 },
    { selectedIndex: 1, responseTimeMs: 5000 },
    { selectedIndex: 1, responseTimeMs: 5000 },
  ];
  const s = placement.summarize(questions, answers);
  assert.equal(s.communicationAccuracy, 1);
  assert.equal(s.grammarAccuracy, 0);
  assert.equal(s.note, "commStrong");
});

test("demonstratedIndex + levelBlended: schwere Items richtig -> höheres Level (IRT-artig)", () => {
  // Lerner beantwortet eine A2- und eine B1-Frage richtig, eine A1 falsch.
  const questions = [
    { id: "a1", skill: "understanding", level: "A1", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "a2", skill: "reaction", level: "A2", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "b1", skill: "vocab", level: "B1", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
  ];
  const answers = [
    { selectedIndex: 1, responseTimeMs: 9000 }, // A1 falsch
    { selectedIndex: 0, responseTimeMs: 9000 }, // A2 richtig
    { selectedIndex: 0, responseTimeMs: 9000 }, // B1 richtig
  ];
  // demonstriert: höchste Stufe mit richtig>=falsch und >=1 richtig -> B1 (Index 3)
  assert.equal(placement.demonstratedIndex(questions, answers), 3);
  // Blended hebt das (eher mittelmäßige) Score-Level aufs demonstrierte B1 an.
  const lvl = placement.levelBlended(0.6, 0.0, questions, answers);
  assert.equal(lvl, "B1-");
  // Aber viel „weiß nicht“ deckelt weiterhin auf A0.
  assert.equal(placement.levelBlended(0.9, 0.6, questions, answers), "A0");
});

test("reliabilityFor: erkennt Raten, Tempo und ehrliches Nichtwissen", () => {
  assert.equal(placement.reliabilityFor({ medianMs: 3000, wrongRate: 0.5, unknownRate: 0.0 }), "guessing");
  assert.equal(placement.reliabilityFor({ medianMs: 1500, wrongRate: 0.2, unknownRate: 0.1 }), "fast");
  assert.equal(placement.reliabilityFor({ medianMs: 9000, wrongRate: 0.1, unknownRate: 0.6 }), "manyUnknown");
  assert.equal(placement.reliabilityFor({ medianMs: 9000, wrongRate: 0.1, unknownRate: 0.1 }), "");
  // „guessing“ hat Vorrang vor „fast“.
  assert.equal(placement.reliabilityFor({ medianMs: 1500, wrongRate: 0.5, unknownRate: 0.0 }), "guessing");
});

test("summarize: liefert reliability-Feld + blended level", () => {
  const questions = placement.QUESTIONS.filter((q) => q.type === "mc").slice(0, 4);
  const answers = questions.map(() => ({ isUnknown: true, responseTimeMs: 1000 }));
  const s = placement.summarize(questions, answers);
  assert.ok("reliability" in s, "reliability vorhanden");
  assert.equal(s.level, "A0"); // alles unbekannt -> A0
});

test("summarize: leere/fehlende Antworten zählen als unbekannt (kein Crash)", () => {
  const questions = placement.QUESTIONS.slice(0, 3);
  const s = placement.summarize(questions, []);
  assert.equal(s.unknown, 3);
  assert.equal(s.correct, 0);
  assert.equal(s.level, "A0");
});

test("levelFor mit nicht-endlichem Score fällt sicher auf A0 (nie versehentlich Höchststufe)", () => {
  assert.equal(placement.levelFor(NaN, 0), "A0");
  assert.equal(placement.levelFor(undefined, 0), "A0");
});
