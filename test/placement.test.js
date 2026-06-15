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
require(path.join(__dirname, "..", "placement.js"));
const { placement } = globalThis.window.SC;

test("Fragenkatalog: 24 Fragen, jede mit Pflichtfeldern + gültigem correctIndex", () => {
  const Q = placement.QUESTIONS;
  assert.equal(Q.length, 24);
  const blocks = {};
  for (const q of Q) {
    assert.ok(q.id && q.block && q.skill && q.level && q.type, "Pflichtfeld fehlt: " + q.id);
    assert.ok(typeof q.promptDe === "string" && q.promptDe.length > 0, "promptDe fehlt: " + q.id);
    assert.ok(typeof q.expectedTimeSec === "number" && q.expectedTimeSec > 0, "expectedTimeSec: " + q.id);
    if (q.type === "mc") {
      assert.ok(Array.isArray(q.options) && q.options.length === 4, "4 Optionen: " + q.id);
      assert.ok(q.correctIndex >= 0 && q.correctIndex < 4, "correctIndex im Bereich: " + q.id);
    } else {
      assert.ok(Array.isArray(q.accept) && q.accept.length > 0, "accept[] fehlt: " + q.id);
    }
    blocks[q.block] = (blocks[q.block] || 0) + 1;
  }
  // Gewichtung: Kommunikation (Verstehen/Reagieren/Wortschatz/frei) ~70 %, Grammatik ~30 %.
  assert.deepEqual(blocks, { understanding: 6, reaction: 5, vocab: 4, conjugation: 4, tenses: 3, free: 2 });
  const grammar = blocks.conjugation + blocks.tenses; // 7
  assert.ok(grammar / Q.length >= 0.25 && grammar / Q.length <= 0.35, "Grammatik 25–35 %");
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

test("summarize: leere/fehlende Antworten zählen als unbekannt (kein Crash)", () => {
  const questions = placement.QUESTIONS.slice(0, 3);
  const s = placement.summarize(questions, []);
  assert.equal(s.unknown, 3);
  assert.equal(s.correct, 0);
  assert.equal(s.level, "A0");
});
