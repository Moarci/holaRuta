/*
 * compras.test.js – Feature-Modul SC.compras (Lista de compras: Liste + Quiz).
 *
 * Teil der app.js/ui.js-Zerlegung (Welle D): VMs, Render (Liste/Quiz/Done) und alle
 * Handler leben in features/compras.js; der State (state.compras/state.comprasQuiz)
 * bleibt controller-eigen und wird über ctx.state gelesen/geschrieben. Dieser Test
 * bootet die App im DOM-Stub (echter Dispatch-Pfad) und prüft:
 *   - die öffentliche Modul-API (3 SCREENS-Render + VMs + alle Handler),
 *   - die VM-Form der Liste (Rubriken, Items, Fortschritt),
 *   - den Screen-Einstieg per echtem Klick (open-compras),
 *   - dass Abhaken (compras-toggle) persistent zählt (doneCount steigt),
 *   - dass ein Item-Tipp (compras-pick) das Detail aufklappt,
 *   - den Quiz-Fluss: open-compras-quiz -> Antwort -> Feedback, und backToList
 *     zurück zur Liste – so ist die Dependency-Injection-Verdrahtung abgesichert.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const stub = require("./_dom-stub.js");

function freshApp() {
  stub.install();
  stub.seedOnboarded();
  const path = require("path");
  const SRC = path.join(__dirname, "..");
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${path.sep}test${path.sep}`)) {
      delete require.cache[key];
    }
  }
  stub.installModules();
  return document.getElementById("app");
}

function driver(root) {
  function find(action, data) {
    let sel = `[data-action="${action}"]`;
    if (data) for (const k in data) sel += `[data-${k}="${data[k]}"]`;
    return root.querySelector(sel);
  }
  function click(action, data) {
    const el = find(action, data);
    if (!el) return false;
    el.dispatchEvent({ type: "click", target: el, bubbles: true });
    return true;
  }
  return { find, click, html: () => root.innerHTML };
}

test("SC.compras exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.compras;
  for (const k of ["init", "listScreen", "quizScreen", "doneScreen", "vm", "quizDoneVM",
    "open", "section", "pick", "toggle", "speak", "speakPhrase",
    "openQuiz", "quizAnswer", "quizNext", "quizAgain", "backToList"]) {
    assert.equal(typeof m[k], "function", `${k} ist eine Funktion`);
  }
});

test("vm() liefert Rubriken, Items und Fortschritt aus data.SHOPPING", () => {
  freshApp();
  const vm = window.SC.compras.vm();
  assert.ok(Array.isArray(vm.sections) && vm.sections.length > 0, "Rubriken vorhanden");
  assert.ok(Array.isArray(vm.items) && vm.items.length > 0, "Items der aktiven Rubrik");
  assert.ok(vm.section && typeof vm.section.label === "string", "aktive Rubrik");
  assert.equal(typeof vm.total, "number");
  assert.equal(typeof vm.doneCount, "number");
  assert.equal(typeof vm.speakable, "boolean");
});

test("listScreen() baut die Einkaufsliste (Topbar, Rubrik-Chips, Items, Quiz-CTA)", () => {
  freshApp();
  const html = window.SC.compras.listScreen();
  assert.match(html, /class="screen sl-screen"/);
  assert.match(html, /🛒 Lista de compras/, "Topbar-Titel");
  assert.match(html, /data-action="compras-section"/, "Rubrik-Chips");
  assert.match(html, /data-action="compras-toggle"/, "Abhak-Checkboxen");
  assert.match(html, /data-action="compras-pick"/, "antippbare Items");
  assert.match(html, /data-action="open-compras-quiz"/, "Quiz-CTA (Rubrik hat ≥2 Items)");
});

test("Klick open-compras öffnet die Liste; compras-toggle zählt persistent", () => {
  const root = freshApp();
  const d = driver(root);
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter erreichbar");
  assert.ok(d.click("open-compras"), "open-compras anklickbar");
  assert.match(d.html(), /🛒 Lista de compras/, "Liste sichtbar");
  assert.equal(window.SC.compras.vm().doneCount, 0, "anfangs nichts abgehakt");
  assert.ok(d.click("compras-toggle"), "eine Checkbox ist anklickbar");
  assert.equal(window.SC.compras.vm().doneCount, 1, "das abgehakte Item wird gezählt");
});

test("compras-pick klappt das Item-Detail auf (Wort/Tipp/Markt-Fragen)", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  d.click("open-compras");
  assert.ok(d.click("compras-pick"), "ein Item ist antippbar");
  assert.match(d.html(), /class="sl-item__detail"/, "Detail-Bereich aufgeklappt");
  assert.match(d.html(), /class="sl-ask"/, "gebrauchsfertige Markt-Fragen sichtbar");
});

test("Quiz-Fluss: open-compras-quiz -> Antwort -> Feedback; backToList zurück zur Liste", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  d.click("open-compras");
  assert.ok(d.click("open-compras-quiz"), "Quiz startbar");
  assert.match(d.html(), /data-action="compras-quiz-answer"/, "Antwort-Optionen gerendert");
  assert.ok(d.click("compras-quiz-answer", { idx: 0 }), "eine Option ist wählbar");
  assert.match(d.html(), /class="quiz-feedback/, "Feedback nach der Antwort");
  assert.match(d.html(), /data-action="compras-quiz-next"/, "Weiter-Knopf erscheint");
  assert.ok(d.click("compras-back-list"), "zurück zur Liste");
  assert.match(d.html(), /class="screen sl-screen"/, "wieder auf der Einkaufsliste");
});
