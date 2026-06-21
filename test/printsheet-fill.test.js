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

const SRC = path.join(__dirname, "..");
function clearAppCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${path.sep}test${path.sep}`)) delete require.cache[key];
  }
}
// Frischer Boot: neues DOM + leeres localStorage.
function freshApp() {
  stub.install();
  stub.seedOnboarded();
  clearAppCache();
  stub.installModules();
  return document.getElementById("app");
}
// „Reload": App-Module neu starten, ABER DOM + localStorage behalten – simuliert
// das erneute Öffnen der Seite. So lässt sich die gerätelokale Persistenz prüfen.
function reboot() {
  clearAppCache();
  stub.installModules();
  return document.getElementById("app");
}

// Helfer-Fabrik auf einem gerenderten #app (Klicks, Eingaben, Tasten).
function driver(root) {
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
  const gotoFill = () => {
    const trigger = global.document.createElement("button");
    trigger.setAttribute("data-action", "set-tab");
    trigger.setAttribute("data-tab", "teacher");
    root.appendChild(trigger);
    clickEl(trigger);
    assert.ok(clickAction("open-printsheet"), "Arbeitsblatt öffnen");
    assert.ok(clickAction("sheet-mode", { mode: "fill" }), "Variante „Am Handy ausfüllen“");
  };
  const fields = () => root.querySelectorAll('.sheet-fill[data-answer]');
  const score = () => (root.querySelector(".sheet-score") || { textContent: "" }).textContent;
  const type = (el, val) => { el.value = val; el.dispatchEvent({ type: "input", target: el, bubbles: true }); };
  // keydown hängt an document (siehe Kopf) – mit target + preventDefault zustellen.
  const press = (el, key) => global.document.dispatchEvent({ type: "keydown", key: key, target: el, preventDefault() {}, stopPropagation() {} });
  return { root, clickAction, gotoFill, fields, score, type, press };
}

// Treibt den Fill-Modus: frischer Boot + Navigation bis ins Arbeitsblatt.
function openFillSheet() {
  const d = driver(freshApp());
  d.gotoFill();
  return d;
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

test("Fill: getippte Antworten überleben einen Reload (gerätelokal gespeichert)", () => {
  // 1) Frisch booten, ins Blatt, eine Antwort tippen -> wird gerätelokal gesichert.
  const d1 = openFillSheet();
  const typed = "bleibt-nach-reload";
  d1.type(d1.fields()[0], typed);
  assert.ok(global.window.localStorage.getItem("spanischcard.sheetfill.v1"), "Eingabe wurde in localStorage gesichert");
  // 2) „Reload": Module neu starten, DOM + localStorage behalten – erneut ins Blatt.
  const d2 = driver(reboot());
  d2.gotoFill();
  const restored = Array.prototype.slice.call(d2.fields());
  assert.ok(restored.some((f) => f.value === typed), "die getippte Antwort ist nach dem Reload wieder da");
});

test("Fill: Zurücksetzen entfernt den Stand auch dauerhaft (kein Wiederauferstehen nach Reload)", () => {
  const d1 = openFillSheet();
  d1.type(d1.fields()[0], "wird-geloescht");
  d1.clickAction("sheet-reset");
  const d2 = driver(reboot());
  d2.gotoFill();
  const after = Array.prototype.slice.call(d2.fields());
  assert.ok(after.every((f) => !f.value), "nach Reset bleibt auch über den Reload alles leer");
});
