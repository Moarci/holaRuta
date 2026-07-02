/*
 * typo-corpus-en.test.js – Realitäts-Check für die Tippfehler-Toleranz des
 * Matchers auf der ENGLISCHEN Lernseite (Locals-Track "es-en", Edition
 * "ingles-pro"), analog zum spanischen typo-corpus.test.js. Prüft an ECHTEN
 * Locals-Antworten (data.locals.js), dass die englische Toleranz sinnvoll greift:
 *   - interne Vertipper / BrE-Schreibvarianten     -> richtig, mit typo-Hinweis
 *   - Groß-/Kleinschreibung, Satzzeichen, Apostrophe -> richtig, OHNE Hinweis
 *   - führender Artikel the/a/an optional            -> richtig, OHNE Hinweis
 *   - fehlendes finales „s"                          -> Vertipper (KEINE spanische
 *       Flexions-Strenge – im ES-Track wäre das ein harter Fehler)
 *   - falsche Inhaltswörter / kurze Minimalpaare / zu viele Abweichungen -> falsch
 *
 * Gegenstück zur spanischen Flexions-Strenge: der Matcher löst das Feld "learn"
 * über SC.track auf learnLang="en" auf; die Artikel-Toleranz greift nur bei
 * learnLang==="en", die spanischen Flexionsregeln nur bei "es".
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// Edition VOR config.js setzen, damit der es-en-Track (Englisch = Lernsprache) aktiv ist.
globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "editions", "registry.js"));
window.SC.editionConfig = window.SC.editions["ingles-pro"];
require(path.join(__dirname, "..", "config.js"));
require(path.join(__dirname, "..", "matcher.js"));
require(path.join(__dirname, "..", "data.js"));
require(path.join(__dirname, "..", "data.locals.js"));
const { matcher, track, data } = window.SC;

// Jeder Fall: [Eingabe, echte Locals-Antwort (card.en), correct?, typo?, Notiz].
// Die "en"-Strings stammen 1:1 aus data.locals.js (Karten-Id in der Notiz).
const CASES = [
  // --- interne Vertipper / BrE-Schreibung: zählen, mit Hinweis ---
  ["I apologze", "I apologize.", true, true, "interner Vertipper (loc-cli11)"],
  ["I apologise.", "I apologize.", true, true, "BrE-Schreibung apologise (loc-cli11)"],
  ["Thank you for caling, how can I help you?", "Thank you for calling, how can I help you?", true, true, "fehlendes l in calling (loc-bpo01)"],
  ["Where is the restroon?", "Where is the restroom?", true, true, "m→n Vertipper (loc-prg09)"],
  ["vacaton", "vacation", true, true, "fehlendes i (loc-vvia10)"],
  ["few option", "few options", true, true, "fehlendes finales s = Vertipper, keine ES-Flexionsstrenge (loc-cant06)"],

  // --- Groß-/Kleinschreibung, Satzzeichen, Apostrophe, führender Artikel: richtig, KEIN Hinweis ---
  ["thank you for calling, how can i help you", "Thank you for calling, how can I help you?", true, false, "Klein-/Satzzeichen egal (loc-bpo01)"],
  ["Where is the restroom", "Where is the restroom?", true, false, "fehlendes Fragezeichen (loc-prg09)"],
  ["Ive noted that youd prefer a quiet room away from the elevator.", "I've noted that you'd prefer a quiet room away from the elevator.", true, false, "Apostrophe/Satzzeichen (loc-rec18)"],
  ["restroom is in the back", "The restroom is in the back.", true, false, "führender Artikel optional (loc-mes12)"],

  // --- falsche Inhaltswörter / zu viele Abweichungen / kurze Minimalpaare: FALSCH ---
  ["I am blocked by a cat.", "I'm blocked by a bug.", false, false, "falsches Inhaltswort (loc-tech01)"],
  ["I am blocked by a bugg.", "I'm blocked by a bug.", false, false, "mehrere Abweichungen über Budget (loc-tech01)"],
  ["soccer", "vacation", false, false, "völlig anderes Wort"],
  ["gray", "grey", false, false, "kurzes Minimalpaar, Budget 0 (loc-vcol10)"],
];

test("EN-Korpus: englische Toleranz trennt Vertipper, exakte Varianten und Fehler korrekt", () => {
  assert.equal(track.learnLang(), "en", "Setup: Lernsprache ist Englisch");
  for (const [input, en, wantCorrect, wantTypo, note] of CASES) {
    const r = matcher.check(input, { es: "x", en }, "learn");
    assert.equal(r.correct, wantCorrect, `correct für "${input}" vs "${en}" (${note})`);
    if (wantCorrect) assert.equal(r.typo, wantTypo, `typo für "${input}" vs "${en}" (${note})`);
  }
});

test("EN-Korpus: die verwendeten Antworten existieren unverändert in data.locals.js", () => {
  // Verankert den Korpus an echten Daten: ändert sich eine zitierte Karte, fällt es hier auf.
  const ens = new Set(data.CARDS.filter((c) => /^loc-/.test(c.id)).map((c) => c.en));
  const cited = ["I apologize.", "Thank you for calling, how can I help you?", "Where is the restroom?",
    "vacation", "few options", "I've noted that you'd prefer a quiet room away from the elevator.",
    "The restroom is in the back.", "I'm blocked by a bug."];
  for (const en of cited) assert.ok(ens.has(en), `Locals-Antwort fehlt (Karte umbenannt?): ${JSON.stringify(en)}`);
});
