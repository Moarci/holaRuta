/*
 * placement-profile.test.js – Sichert die Profil-Karten von Ruta-Check & Nivel-
 * Test (ui.placementCard / ui.assessmentCard) gegen Render-Regressionen ab.
 * Schwerpunkt ist der nachgerüstete, frage-für-frage aufklappbare Verlauf:
 *  - das letzte Ergebnis zeigt seinen Rückblick im Hauptblock (oben)
 *  - jede ÄLTERE Verlaufszeile mit gespeichertem Rückblick ist aufklappbar
 *  - die NEUESTE Zeile bleibt flach (kein doppelter Rückblick – steht schon oben)
 *  - Altergebnisse OHNE Rückblick-Daten bleiben flache Zeilen
 *  - rendert in DE/EN ohne durchgesickerte i18n-Schlüssel
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const SRC = path.join(__dirname, "..");
globalThis.window = {};
require(path.join(SRC, "i18n.js"));
require(path.join(SRC, "i18n.strings.js"));
// Die Karten nutzen das globale t() (vom Controller gesetzt) – hier nachstellen.
globalThis.t = (k, p) => globalThis.window.SC.i18n.t(k, p);
globalThis.window.t = globalThis.t;
require(path.join(SRC, "view-helpers.js")); // geteilte Render-Primitive (SC.view), vor ui.js
require(path.join(SRC, "ui.js"));
const { ui, i18n } = globalThis.window.SC;

const count = (hay, needle) => hay.split(needle).length - 1;

// Ein anzeigefertiger Ergebnis-Eintrag (wie placementProfileVM ihn formatiert).
function entry(over) {
  return Object.assign({
    level: "A2", scorePct: 59, accuracyPct: 55, unknownPct: 20, tempoLabel: "ruhig",
    correct: 7, total: 14, note: "", reliability: "", skills: [], review: [], at: "2026-06-18",
  }, over);
}
function reviewItem(status, promptDe, correctText, over) {
  return Object.assign({ status, promptDe, questionEs: "", yourText: "", correctText, explanationDe: "" }, over || {});
}

// Profil-VM mit drei Durchläufen: neuestes (mit Rückblick), ein älterer (mit
// Rückblick) und ein Altergebnis (ohne Rückblick-Daten).
function placementVM() {
  const latest = entry({
    level: "B1-", scorePct: 67, accuracyPct: 64, at: "2026-06-19",
    review: [reviewItem("wrong", "PROMPT_LATEST", "agua", { yourText: "leche" })],
  });
  const older = entry({
    level: "A2", scorePct: 59, at: "2026-06-18",
    review: [reviewItem("correct", "PROMPT_OLDER_OK", "hola"),
             reviewItem("wrong", "PROMPT_OLDER_BAD", "gracias", { yourText: "adios" })],
  });
  const oldest = entry({ level: "A1", scorePct: 40, at: "2026-06-10", review: [] });
  return { taken: true, last: latest, history: [latest, older, oldest], attempts: 3, canShare: false };
}

test("placementCard: letztes Ergebnis zeigt seinen Rückblick im Hauptblock", () => {
  i18n.setLang("de");
  const html = ui.placementCard(placementVM(), "1:1");
  // Oben ein „Antworten ansehen"-Block mit der Antwort des neuesten Durchlaufs.
  assert.match(html, /pl-reviewbox/, "Rückblick-Block fehlt");
  assert.ok(html.includes(i18n.t("placement.reviewCap")), "reviewCap-Beschriftung fehlt");
  assert.ok(html.includes("PROMPT_LATEST"), "neueste Antwort fehlt im Hauptblock");
});

test("placementCard: nur ältere Durchläufe mit Rückblick sind aufklappbar", () => {
  i18n.setLang("de");
  const html = ui.placementCard(placementVM(), "1:1");
  // Genau EINE aufklappbare Verlaufszeile: der ältere Lauf mit Rückblick.
  // Der neueste (Index 0) bleibt flach, das Altergebnis ohne Daten ebenfalls.
  assert.equal(count(html, "plprof__histbox"), 1, "genau eine aufklappbare Verlaufszeile erwartet");
  assert.equal(count(html, "plprof__histrow--open"), 1, "genau eine offene Zeile erwartet");
  // Der Rückblick des älteren Laufs ist enthalten …
  assert.ok(html.includes("PROMPT_OLDER_BAD"), "älterer Rückblick fehlt im Verlauf");
  // … die neueste Antwort steht NUR oben, nicht zusätzlich im Verlauf (keine Dopplung).
  assert.equal(count(html, "PROMPT_LATEST"), 1, "neueste Antwort darf sich nicht im Verlauf doppeln");
});

test("placementCard: Altergebnis ohne Rückblick bleibt eine flache Verlaufszeile", () => {
  i18n.setLang("de");
  const vm = { taken: true, last: entry({ level: "B1-", at: "2026-06-19", review: [] }),
               history: [entry({ level: "B1-", at: "2026-06-19", review: [] }),
                         entry({ level: "A1", at: "2026-06-10", review: [] })],
               attempts: 2, canShare: false };
  const html = ui.placementCard(vm, "1:1");
  // Kein einziger aufklappbarer Block, aber die Verlaufsliste existiert.
  assert.equal(count(html, "plprof__histbox"), 0, "ohne Rückblick-Daten nichts aufklappbar");
  assert.match(html, /plprof__hist\b/, "Verlaufsliste fehlt trotz mehrerer Durchläufe");
});

test("placementCard: rendert in DE und EN ohne durchgesickerte i18n-Schlüssel", () => {
  for (const lang of ["de", "en"]) {
    i18n.setLang(lang);
    const html = ui.placementCard(placementVM(), "9:16");
    assert.doesNotMatch(html, /placement\.[a-zA-Z]/, `${lang}: roher i18n-Schlüssel durchgesickert`);
  }
  i18n.setLang("de");
});

test("assessmentCard: aufklappbarer Verlauf funktioniert baugleich (anderer Namespace)", () => {
  i18n.setLang("de");
  const a = (over) => entry(Object.assign({ variantLabel: "Standard" }, over));
  const vm = {
    taken: true,
    last: a({ level: "B1", at: "2026-06-19", review: [reviewItem("wrong", "AS_LATEST", "soy", { level: "B1" })] }),
    history: [
      a({ level: "B1", at: "2026-06-19", review: [reviewItem("wrong", "AS_LATEST", "soy", { level: "B1" })] }),
      a({ level: "A2", at: "2026-06-18", review: [reviewItem("wrong", "AS_OLDER", "tengo", { level: "A2" })] }),
    ],
    attempts: 2, canShare: false,
  };
  const html = ui.assessmentCard(vm, "1:1");
  assert.equal(count(html, "plprof__histbox"), 1, "ältere Nivel-Test-Zeile sollte aufklappbar sein");
  assert.ok(html.includes("AS_OLDER"), "älterer Nivel-Test-Rückblick fehlt");
  assert.doesNotMatch(html, /assessment\.[a-zA-Z]/, "roher i18n-Schlüssel durchgesickert");
});
