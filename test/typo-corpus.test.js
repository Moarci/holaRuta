/*
 * typo-corpus.test.js – Realitäts-Check für die Tippfehler-Toleranz des Matchers
 * an ECHTEN App-Daten (Antworten aus placement.js und Karten-Antworten aus
 * frases.js), gegen typische Eingaben:
 *   - klare Vertipper im Wortinneren        -> richtig, mit typo-Hinweis
 *   - exakte/akzentlose/Pronomen-Varianten  -> richtig, OHNE Hinweis
 *   - falsche Grammatikformen (Genus/Person/Plural am Wortende) -> falsch
 *   - kurze Minimalpaare / weit entfernte Eingaben -> falsch
 *
 * Zweck: die konservativen Schwellen an realistischen Strings absichern, nicht
 * nur an synthetischen Beispielen. Bricht ein Tuning die Balance, fällt es hier auf.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "matcher.js"));
const { matcher } = globalThis.window.SC;

// Jeder Fall: [Eingabe, erwartete Antwort (echt aus der App), correct?, typo?, Notiz].
// Die "target"-Strings stammen aus placement.js (Freitext-solutionEs) und
// frases.js (Karten-es); die Eingaben sind realistische Tipp-/Grammatikfehler.
const CASES = [
  // --- klare Vertipper im Wortinneren: zählen, mit Hinweis ---
  ["qiero un cafe",  "quiero un cafe", true,  true,  "fehlendes u (mitten im Wort)"],
  ["la habitacon",   "la habitación",  true,  true,  "fehlendes i (Hotelzimmer)"],
  ["la termimal",    "la terminal",    true,  true,  "n→m (Busbahnhof)"],
  ["el almuezo",     "el almuerzo",    true,  true,  "fehlendes r (Mittagessen)"],

  // --- exakt / akzent- / pronomen-tolerant: richtig, KEIN Hinweis ---
  ["Quiero un café.",    "quiero un cafe", true, false, "Akzente + Satzzeichen"],
  ["yo quiero un cafe",  "quiero un cafe", true, false, "optionales Subjektpronomen"],

  // --- falsche Grammatikform (Wortend-Flexion): FALSCH, kein Tippfehler ---
  ["el boleta",     "el boleto",     false, false, "Genus -o/-a (Fahrkarte)"],
  ["un colectiva",  "un colectivo",  false, false, "Genus -o/-a (Sammeltaxi)"],
  ["el almuerza",   "el almuerzo",   false, false, "Genus -o/-a (Mittagessen)"],

  // --- kurze Wörter (<8 Zeichen, Budget 0): nur exakt ---
  ["el trin",  "el tren", false, false, "kurzer String, echte Verwechslung"],
  ["pato",     "gato",    false, false, "Minimalpaar, 4 Buchstaben"],
];

test("Korpus: Vertipper, exakte Varianten und Grammatikformen werden korrekt getrennt", () => {
  for (const [input, target, wantCorrect, wantTypo, note] of CASES) {
    const r = matcher.check(input, { es: target });
    assert.equal(r.correct, wantCorrect, `correct für "${input}" vs "${target}" (${note})`);
    if (wantCorrect) assert.equal(r.typo, wantTypo, `typo für "${input}" vs "${target}" (${note})`);
  }
});

// Mehrere akzeptierte Musterlösungen (echte accept[]-Liste aus placement.js,
// Frage pt_fr_002 „¿Cuánto cuesta?"): Tippfehler zählt, Plural-/Distanzfehler nicht.
test("Korpus: matchFree gegen echte accept[]-Liste (Preisfrage)", () => {
  const accept = ["cuanto cuesta", "cuanto vale", "cuanto sale", "que precio tiene"];
  assert.deepEqual(matcher.matchFree("cuanto cueta", accept), { correct: true, typo: true },  "fehlendes s (mitten im Wort)");
  assert.deepEqual(matcher.matchFree("¿Cuánto cuesta?", accept), { correct: true, typo: false }, "exakt mit Akzent/Satzzeichen");
  assert.deepEqual(matcher.matchFree("cuanto cuestas", accept), { correct: false, typo: false }, "Plural-s am Wortende = falsche Form");
  assert.deepEqual(matcher.matchFree("donde esta", accept),     { correct: false, typo: false }, "ganz andere Frage");
});
