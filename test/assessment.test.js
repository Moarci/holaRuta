/*
 * assessment.test.js – Tests für den REINEN Kern des ausführlichen Nivel-Tests
 * (assessment.js): Fragenkatalog, adaptive Treppe über SECHS Stufen,
 * Antwort-Bewertung, Level-Formel und Gesamtauswertung. Kein DOM, kein Server.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "assessment.js"));
const { assessment } = globalThis.window.SC;

test("Fragenkatalog: gültig, eindeutige IDs, alle sechs Stufen bestückt", () => {
  const Q = assessment.QUESTIONS;
  assert.ok(Q.length >= 50, "deutlich mehr Fragen als der kurze Check");
  const ids = {}, levels = {}, grammar = { n: 0 };
  for (const q of Q) {
    assert.ok(q.id && q.block && q.skill && q.level && q.type, "Pflichtfeld fehlt: " + q.id);
    assert.ok(!ids[q.id], "doppelte id: " + q.id); ids[q.id] = 1;
    assert.ok(assessment.LEVEL_ORDER.includes(q.level), "gültige Stufe: " + q.id);
    assert.ok(typeof q.promptDe === "string" && q.promptDe.length > 0, "promptDe fehlt: " + q.id);
    assert.ok(typeof q.expectedTimeSec === "number" && q.expectedTimeSec > 0, "expectedTimeSec: " + q.id);
    if (q.type === "mc") {
      assert.ok(Array.isArray(q.options) && q.options.length === 4, "4 Optionen: " + q.id);
      assert.ok(q.correctIndex >= 0 && q.correctIndex < 4, "correctIndex im Bereich: " + q.id);
      if (assessment.GRAMMAR_SKILLS[q.skill]) grammar.n++;
    } else {
      assert.ok(Array.isArray(q.accept) && q.accept.length > 0, "accept[] fehlt: " + q.id);
    }
    levels[q.level] = (levels[q.level] || 0) + 1;
  }
  // Jede Treppenstufe (A0..C1) muss bestückt sein, sonst kann der Test nicht adaptieren.
  for (const lvl of assessment.LEVEL_ORDER) assert.ok(levels[lvl] > 0, "Stufe ohne Fragen: " + lvl);
  // Grammatik ist hier eine ernstzunehmende, aber nicht dominierende Dosis.
  const mcCount = Q.filter((q) => q.type === "mc").length;
  assert.ok(grammar.n / mcCount >= 0.25 && grammar.n / mcCount <= 0.5, "Grammatik 25–50 % der MC");
  assert.ok(assessment.freeQuestions(Q).length >= 3, "mehrere freie Antworten");
  // Genug MC, um den geplanten adaptiven Durchlauf zu füllen.
  assert.ok(mcCount >= assessment.MC_TARGET + 4, "genug MC-Fragen für den Durchlauf");
});

test("nextDifficulty: richtig -> schwerer, falsch/unbekannt -> leichter (über 6 Stufen geklemmt)", () => {
  assert.equal(assessment.nextDifficulty(2, "correct"), 3);
  assert.equal(assessment.nextDifficulty(2, "wrong"), 1);
  assert.equal(assessment.nextDifficulty(2, "unknown"), 1);
  assert.equal(assessment.nextDifficulty(5, "correct"), 5); // Deckel oben (C1)
  assert.equal(assessment.nextDifficulty(0, "wrong"), 0);   // Boden unten (A0)
});

test("pickNextMc: bevorzugt Zielstufe, hält den Grammatik-Deckel, nie schon Gefragtes", () => {
  const Q = assessment.QUESTIONS;
  // Zielstufe A0 -> eine A0-Frage zuerst.
  let q = assessment.pickNextMc(Q, [], 0, 0, assessment.GRAMMAR_CAP);
  assert.equal(q.level, "A0");
  // Zielstufe C1 -> C1 (oder nächstgelegene), nie eine bereits gefragte.
  const askedIds = Q.filter((x) => x.level === "C1").map((x) => x.id);
  q = assessment.pickNextMc(Q, askedIds, 5, 0, assessment.GRAMMAR_CAP);
  assert.ok(q && askedIds.indexOf(q.id) < 0, "keine Wiederholung");
  // Grammatik-Deckel erreicht -> keine Grammatik-Frage mehr.
  const q2 = assessment.pickNextMc(Q, [], 3, assessment.GRAMMAR_CAP, assessment.GRAMMAR_CAP);
  assert.ok(q2 && !assessment.GRAMMAR_SKILLS[q2.skill], "Grammatik wird ausgeschlossen");
});

test("adaptiver Durchlauf: starker Lerner steigt bis C1, schwacher fällt auf A0", () => {
  const Q = assessment.QUESTIONS;
  function run(answerCorrect) {
    let asked = [], difficulty = assessment.START_DIFFICULTY, grammarAsked = 0,
        peak = difficulty, low = difficulty;
    for (let i = 0; i < assessment.MC_TARGET; i++) {
      const q = assessment.pickNextMc(Q, asked, difficulty, grammarAsked, assessment.GRAMMAR_CAP);
      assert.ok(q, "es geht dem Test nicht die Frage aus (Schritt " + i + ")");
      asked.push(q.id);
      if (assessment.GRAMMAR_SKILLS[q.skill]) grammarAsked++;
      difficulty = assessment.nextDifficulty(difficulty, answerCorrect ? "correct" : "wrong");
      peak = Math.max(peak, difficulty); low = Math.min(low, difficulty);
    }
    assert.ok(grammarAsked <= assessment.GRAMMAR_CAP, "Grammatik-Deckel eingehalten");
    return { asked, peak, low };
  }
  const strong = run(true);
  const weak = run(false);
  assert.equal(strong.peak, assessment.LEVEL_ORDER.length - 1, "starker Lerner erreicht C1-Stufe");
  assert.equal(weak.low, 0, "schwacher Lerner fällt auf A0");
  assert.equal(strong.asked.length, assessment.MC_TARGET, "voller MC-Durchlauf");
});

test("scoreAnswer: richtig/falsch/unbekannt + Zeit-Sicherheit nur bei richtig", () => {
  const mc = { type: "mc", correctIndex: 1, expectedTimeSec: 10 };
  let r = assessment.scoreAnswer(mc, { selectedIndex: 1, responseTimeMs: 5000 });
  assert.equal(r.result, "correct"); assert.equal(r.timeConfidence, 1.0);
  r = assessment.scoreAnswer(mc, { selectedIndex: 0, responseTimeMs: 1000 });
  assert.equal(r.result, "wrong"); assert.equal(r.timeConfidence, 0);
  r = assessment.scoreAnswer(mc, { isUnknown: true, responseTimeMs: 3000 });
  assert.equal(r.result, "unknown"); assert.equal(r.isCorrect, false);
});

test("scoreAnswer (free): exakte Varianten und prefix-Modus", () => {
  const exact = { type: "free", accept: ["cuanto cuesta", "cuanto vale"], expectedTimeSec: 12 };
  assert.equal(assessment.scoreAnswer(exact, { text: "¿Cuánto cuesta?", responseTimeMs: 5000 }).isCorrect, true);
  assert.equal(assessment.scoreAnswer(exact, { text: "no se", responseTimeMs: 5000 }).isCorrect, false);
  // prefix: der Anfang muss passen, der Rest (Name) ist frei.
  const pref = { type: "free", accept: ["me llamo"], matchMode: "prefix", expectedTimeSec: 12 };
  assert.equal(assessment.scoreAnswer(pref, { text: "Me llamo Marcel", responseTimeMs: 5000 }).isCorrect, true);
  assert.equal(assessment.scoreAnswer(pref, { text: "Soy Marcel", responseTimeMs: 5000 }).isCorrect, false);
});

test("levelFor: feinere Schwellen über sechs Stufen + Unknown-Override", () => {
  assert.equal(assessment.levelFor(0.20, 0.1), "A0");
  assert.equal(assessment.levelFor(0.35, 0.1), "A1");
  assert.equal(assessment.levelFor(0.50, 0.1), "A2");
  assert.equal(assessment.levelFor(0.65, 0.1), "B1");
  assert.equal(assessment.levelFor(0.80, 0.1), "B2");
  assert.equal(assessment.levelFor(0.95, 0.1), "C1");
  // viel „weiß nicht“ -> A0, egal wie der Score wäre
  assert.equal(assessment.levelFor(0.95, 0.60), "A0");
});

test("demonstratedIndex + levelBlended: schwere Items richtig -> höheres Level (IRT-artig)", () => {
  const questions = [
    { id: "a", skill: "understanding", level: "A2", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "b", skill: "grammar", level: "B2", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "c", skill: "grammar", level: "C1", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
  ];
  const answers = [
    { selectedIndex: 1, responseTimeMs: 9000 }, // A2 falsch
    { selectedIndex: 0, responseTimeMs: 9000 }, // B2 richtig
    { selectedIndex: 0, responseTimeMs: 9000 }, // C1 richtig
  ];
  assert.equal(assessment.demonstratedIndex(questions, answers), 5); // C1
  assert.equal(assessment.levelBlended(0.6, 0.0, questions, answers), "C1");
  // Aber viel „weiß nicht“ deckelt weiterhin auf A0.
  assert.equal(assessment.levelBlended(0.9, 0.6, questions, answers), "A0");
});

test("summarize: Score 90/10, getrennte Zähler, Skill-Aufschlüsselung, reliability + level", () => {
  const questions = [
    { id: "a", skill: "understanding", level: "A2", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "b", skill: "reading", level: "B1", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "c", skill: "grammar", level: "B1", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
    { id: "d", skill: "tenses", level: "A2", type: "mc", correctIndex: 0, expectedTimeSec: 10 },
  ];
  const answers = [
    { selectedIndex: 0, responseTimeMs: 5000 },   // richtig, schnell
    { selectedIndex: 1, responseTimeMs: 4000 },   // falsch
    { isUnknown: true, responseTimeMs: 3000 },     // weiß nicht
    { selectedIndex: 0, responseTimeMs: 9000 },   // richtig, normal
  ];
  const s = assessment.summarize(questions, answers);
  assert.equal(s.correct, 2); assert.equal(s.wrong, 1); assert.equal(s.unknown, 1);
  assert.ok(Math.abs(s.accuracy - 0.5) < 1e-9);
  assert.ok("reliability" in s, "reliability vorhanden");
  assert.ok(s.skillBreakdown.understanding && s.skillBreakdown.grammar, "Skill-Aufschlüsselung");
  assert.ok(["fast", "medium", "slow"].includes(s.tempo));
});

test("summarize: alles unbekannt -> A0, kein Crash bei fehlenden Antworten", () => {
  const questions = assessment.QUESTIONS.slice(0, 5);
  const s = assessment.summarize(questions, []);
  assert.equal(s.unknown, 5);
  assert.equal(s.correct, 0);
  assert.equal(s.level, "A0");
});
