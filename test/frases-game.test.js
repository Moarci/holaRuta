/*
 * frases-game.test.js – Feature-Modul SC.frasesGame (Frases flexibles, Satzbaukasten).
 *
 * Welle C der app.js/ui.js-Zerlegung. Eigener Namespace SC.frasesGame, da SC.frases
 * das Datenmodul ist. Bootet die App im DOM-Stub und prüft Modul-API, VM-Form
 * (Themen + „Gemischt" aus ctx.frases) und den Antwort-/Weiter-Pfad – ohne den
 * frasesDone-Screen (SC.celebrate-Mount) zu erreichen, wie bei den anderen Mini-Spielen.
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
  function click(action, data) {
    let sel = `[data-action="${action}"]`;
    if (data) for (const k in data) sel += `[data-${k}="${data[k]}"]`;
    const el = root.querySelector(sel);
    if (!el) return false;
    el.dispatchEvent({ type: "click", target: el, bubbles: true });
    return true;
  }
  return { click, html: () => root.innerHTML };
}

test("SC.frasesGame exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.frasesGame;
  for (const k of ["init", "setupScreen", "playScreen", "doneScreen", "setupVM", "doneVM",
    "open", "start", "answer", "next", "again"]) {
    assert.equal(typeof m[k], "function", `API: ${k}`);
  }
});

test("setupVM() liefert Themen + Gemischt-Kachel aus ctx.frases", () => {
  freshApp();
  const vm = window.SC.frasesGame.setupVM();
  assert.ok(vm.sets.length >= 1, "mindestens ein Thema");
  assert.equal(vm.mixed.id, "all", "Gemischt-Kachel vorhanden");
  assert.ok(vm.mixed.count >= vm.sets[0].count, "Gemischt deckt alle Rahmen ab");
  for (const s of vm.sets) {
    assert.equal(typeof s.label, "string");
    assert.ok(s.count > 0, `Thema ${s.id} hat Rahmen`);
  }
});

test("setupScreen() rendert Themen-Auswahl inkl. Gemischt (SC.view-Helfer)", () => {
  freshApp();
  const html = window.SC.frasesGame.setupScreen();
  assert.match(html, /Frases flexibles/, "hmTopbar-Titel");
  assert.match(html, /hm-scene--mixed/, "Gemischt-Kachel");
  assert.match(html, /data-action="start-frases"/, "Themen-Buttons");
});

test("Klick-Pfad: open -> start -> answer (Feedback) -> next; doneVM zählt", () => {
  const root = freshApp();
  const d = driver(root);
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter");
  assert.ok(d.click("open-frases"), "open-frases");
  assert.match(d.html(), /data-action="start-frases"/, "Setup-Screen");

  const set = window.SC.frasesGame.setupVM().sets.find((s) => s.count >= 2);
  assert.ok(set, "ein Thema mit ≥2 Rahmen");
  assert.ok(d.click("start-frases", { set: set.id }), "start-frases");
  assert.match(d.html(), /frases-frame/, "Satzrahmen rendert");

  const m1 = d.html().match(/data-action="frases-answer" data-idx="(\d+)"/);
  assert.ok(m1, "Antwort-Optionen vorhanden");
  assert.ok(d.click("frases-answer", { idx: m1[1] }), "frases-answer");
  assert.match(d.html(), /quiz-feedback/, "Feedback nach Antwort");

  const dv = window.SC.frasesGame.doneVM();
  assert.equal(dv.total, set.count, "doneVM kennt die Rundenlänge");
  assert.ok(dv.correct >= 0 && dv.correct <= 1, "doneVM zählt richtige Antworten");

  assert.ok(d.click("frases-next"), "frases-next");
  assert.match(d.html(), /frases-frame/, "nächster Rahmen rendert");

  assert.ok(d.click("open-frases"), "Zurück-Pfeil (open-frases) führt zur Auswahl");
  assert.match(d.html(), /data-action="start-frases"/, "zurück zur Themen-Auswahl");
});
