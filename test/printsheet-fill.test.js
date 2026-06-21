/*
 * printsheet-fill.test.js – Interaktions-Netz für den Handy-Ausfüll-Modus des
 * Arbeitshefts. Anders als printsheet.test.js (das nur das gerenderte HTML
 * prüft) BOOTET hier die echte App im DOM-Stub und treibt den Fill-Flow über
 * echte Event-Dispatches:
 *   - Navigation: Modo-profe-Reiter -> Arbeitsblatt öffnen -> Variante „fill"
 *   - Tippen (input) -> Prüfen (click) -> richtig/falsch + Ergebnis
 *   - Enter springt ins nächste Feld / prüft im letzten
 *   - getippte Antworten überleben ein Re-Render (Länge/Bausteine umschalten)
 *   - Zurücksetzen leert Felder, Markierung & Ergebnis
 *
 * Hinweis zum Stub: Element-Events bubblen bis <html>, nicht bis document.
 * keydown hängt (wie im Browser) an document – im Test wird es daher direkt auf
 * document mit gesetztem target zugestellt (genau die Sicht des Handlers).
 *
 * Aufruf:  node --test test/printsheet-fill.test.js   (oder: node --test)
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const stub = require("./_dom-stub.js");

function freshApp() {
  stub.install();
  stub.seedOnboarded();
  const SRC = path.join(__dirname, "..");
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${path.sep}test${path.sep}`)) delete require.cache[key];
  }
  stub.installModules();
  return document.getElementById("app");
}

// Treibt den Fill-Modus: navigiert bis ins Arbeitsblatt und stellt Helfer bereit.
function openFillSheet() {
  const root = freshApp();
  const doc = global.document;
  const clickEl = (el) => el.dispatchEvent({ type: "click", target: el, bubbles: true });
  const clickAction = (action, data) => {
    let sel = `[data-action="${action}"]`;
    if (data) for (const k in data) sel += `[data-${k}="${data[k]}"]`;
    const el = root.querySelector(sel);
    if (!el) return false;
    clickEl(el);
    return true;
  };
  // Modo profe ist im Default-Dashboard nicht als Knopf sichtbar; den Reiter-
  // Wechsel (set-tab teacher) über einen eingehängten Auslöser anstoßen – genau
  // den Pfad, den die Reiter-Navigation in Editionen nimmt.
  const trigger = doc.createElement("button");
  trigger.setAttribute("data-action", "set-tab");
  trigger.setAttribute("data-tab", "teacher");
  root.appendChild(trigger);
  clickEl(trigger);
  assert.ok(clickAction("open-printsheet"), "Arbeitsblatt öffnen");
  assert.ok(clickAction("sheet-mode", { mode: "fill" }), "Variante „Am Handy ausfüllen“");
  const fields = () => root.querySelectorAll('.sheet-fill[data-answer]');
  const score = () => (root.querySelector(".sheet-score") || { textContent: "" }).textContent;
  const type = (el, val) => { el.value = val; el.dispatchEvent({ type: "input", target: el, bubbles: true }); };
  // keydown hängt an document (siehe Kopf) – mit target + preventDefault zustellen.
  const press = (el, key) => global.document.dispatchEvent({ type: "keydown", key: key, target: el, preventDefault() {}, stopPropagation() {} });
  return { root, clickAction, fields, score, type, press };
}

test("Fill: Prüfen markiert richtig/falsch und meldet das Ergebnis", () => {
  const d = openFillSheet();
  const fs = d.fields();
  assert.ok(fs.length >= 2, "es gibt mehrere Eingabefelder");
  d.type(fs[0], fs[0].getAttribute("data-answer")); // korrekt
  d.type(fs[1], "definitiv-falsch");                 // falsch
  assert.ok(d.clickAction("sheet-check"), "Prüfen klickbar");
  assert.ok(fs[0].classList.contains("is-correct"), "richtiges Feld grün markiert");
  assert.ok(fs[1].classList.contains("is-wrong"), "falsches Feld rot markiert");
  assert.match(d.score(), /1 von \d+ richtig/, "Ergebnis zählt genau eine richtige Antwort");
});

test("Fill: Prüfen ohne Eingabe zeigt einen Hinweis statt „0 von n“", () => {
  const d = openFillSheet();
  assert.ok(d.clickAction("sheet-check"), "Prüfen klickbar");
  assert.equal(d.score(), global.window.SC.i18n.t("sheet.fillEmpty"), "leerer Stand -> Hinweis");
  assert.doesNotMatch(d.score(), /von/, "kein „0 von n richtig“ bei leerem Blatt");
});

test("Fill: Tippen löst eine frühere Markierung und das Ergebnis", () => {
  const d = openFillSheet();
  const fs = d.fields();
  d.type(fs[0], "falsch");
  d.clickAction("sheet-check");
  assert.ok(fs[0].classList.contains("is-wrong"), "zunächst falsch markiert");
  assert.ok(d.score().length > 0, "Ergebnis steht");
  d.type(fs[0], "neu");
  assert.ok(!fs[0].classList.contains("is-wrong") && !fs[0].classList.contains("is-correct"), "Markierung beim Tippen gelöst");
  assert.equal(d.score(), "", "Ergebnis beim Tippen geleert");
});

test("Fill: Enter springt ins nächste Feld, im letzten prüft es", () => {
  const d = openFillSheet();
  const fs = d.fields();
  d.press(fs[0], "Enter");
  assert.equal(fs[1]._focused, true, "Enter fokussiert das nächste Feld");
  const last = fs[fs.length - 1];
  last.value = last.getAttribute("data-answer");
  last.dispatchEvent({ type: "input", target: last, bubbles: true });
  d.press(last, "Enter");
  assert.match(d.score(), /von .* richtig/, "Enter im letzten Feld prüft das Blatt");
});

test("Fill: getippte Antworten überleben ein Re-Render (Länge umschalten)", () => {
  const d = openFillSheet();
  const fs = d.fields();
  const typed = "meine-antwort-bleibt";
  d.type(fs[0], typed);
  assert.ok(d.clickAction("sheet-length", { len: "xxl" }), "Heftlänge umschaltbar");
  const after = Array.prototype.slice.call(d.fields());
  assert.ok(after.length > 0, "nach dem Re-Render gibt es Felder");
  assert.ok(after.some((f) => f.value === typed), "die getippte Antwort ist erhalten geblieben");
});

test("Fill: Zurücksetzen leert Felder, Markierung und Ergebnis", () => {
  const d = openFillSheet();
  const fs = d.fields();
  d.type(fs[0], fs[0].getAttribute("data-answer"));
  d.clickAction("sheet-check");
  assert.ok(d.clickAction("sheet-reset"), "Zurücksetzen klickbar");
  const after = Array.prototype.slice.call(d.fields());
  assert.ok(after.every((f) => !f.value), "alle Felder leer");
  assert.ok(after.every((f) => !f.classList.contains("is-correct") && !f.classList.contains("is-wrong")), "keine Markierung mehr");
  assert.equal(d.score(), "", "Ergebnis geleert");
});
