/*
 * conjugador.test.js – Feature-Modul SC.conjugDrill (Conjugador, Konjugations-Drill).
 *
 * Welle C der app.js/ui.js-Zerlegung. Eigener Namespace SC.conjugDrill, da SC.conjug
 * das Generator-Datenmodul ist. Bootet die App im DOM-Stub und prüft Modul-API,
 * Setup (Stufen), Level-Persistenz (ctx.setSettings) und den Tipp-/Prüf-Pfad
 * (akzentnachsichtig via ctx.matcher). conjug.buildRound wird für den Korrekt-Pfad
 * deterministisch gemockt; der conjugDone-Screen (celebrate) wird gemieden.
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

// Deterministische Runde mocken (am gemeinsamen SC.conjug-Objekt, das der ctx hält).
function mockRound(queue) {
  window.SC.conjug.buildRound = () => queue.slice();
}

test("SC.conjugDrill exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.conjugDrill;
  for (const k of ["init", "setupScreen", "playScreen", "doneScreen", "doneVM",
    "open", "setLevel", "start", "submit", "next", "again"]) {
    assert.equal(typeof m[k], "function", `API: ${k}`);
  }
});

test("setupScreen() rendert die Stufen-Auswahl (Modul verfügbar)", () => {
  freshApp();
  const html = window.SC.conjugDrill.setupScreen();
  assert.match(html, /Conjugador/, "hmTopbar-Titel");
  assert.doesNotMatch(html, /stat-empty/, "Drill ist verfügbar (conjug + CONJUGATION geladen)");
  assert.match(html, /data-action="conjug-level"/, "Stufen-Buttons");
  assert.match(html, /data-action="start-conjug"/, "Start-Knopf");
});

test("setLevel merkt die Stufe (ctx.setSettings) und markiert sie aktiv", () => {
  freshApp();
  window.SC.conjugDrill.setLevel(2);
  const html = window.SC.conjugDrill.setupScreen();
  // Stufe 2 ist aktiv (is-active am Button mit data-level="2").
  assert.match(html, /data-level="2" aria-pressed="true"/, "Stufe 2 aktiv");
  window.SC.conjugDrill.setLevel(1);
  assert.match(window.SC.conjugDrill.setupScreen(), /data-level="1" aria-pressed="true"/, "Stufe 1 aktiv");
});

test("Spielfluss: start -> richtige Form (zählt) -> weiter -> falsche Form; doneVM", () => {
  freshApp();
  mockRound([
    { verb: "ir", verbHint: { de: "gehen" }, personEs: "nosotros", personDe: { de: "wir" }, answer: "vamos" },
    { verb: "estar", verbHint: { de: "sein" }, personEs: "yo", personDe: { de: "ich" }, answer: "estoy" },
  ]);
  const g = window.SC.conjugDrill;
  g.start();
  let html = g.playScreen();
  assert.match(html, /cj-prompt/, "Verb-Prompt rendert");
  assert.match(html, /id="conjug-answer"/, "Eingabe-Form");
  assert.match(html, /1\/2/, "2-Runden-Queue");

  // Richtige Form (akzentnachsichtig – hier exakt).
  g.submit("vamos");
  html = g.playScreen();
  assert.match(html, /verdict--ok/, "richtige Form korrekt gewertet");
  assert.match(html, /data-action="conjug-next"/, "Weiter-Knopf");

  // Weiter zu Item 2, falsche Form.
  g.next();
  assert.match(g.playScreen(), /2\/2/, "zweites Item");
  g.submit("xxx");
  assert.match(g.playScreen(), /verdict--no/, "falsche Form als falsch gewertet");

  const dv = g.doneVM();
  assert.equal(dv.total, 2, "doneVM kennt die Rundenlänge");
  assert.equal(dv.correct, 1, "genau eine richtige Form gezählt");
});

test("Akzent-Nachsicht: esta zaehlt fuer esta-mit-Akzent (ctx.matcher.normalize)", () => {
  freshApp();
  mockRound([{ verb: "estar", verbHint: { de: "sein" }, personEs: "él", personDe: { de: "er" }, answer: "está" }]);
  const g = window.SC.conjugDrill;
  g.start();
  g.submit("esta"); // ohne Akzent
  assert.match(g.playScreen(), /verdict--ok/, "akzentlose Eingabe wird akzeptiert");
  assert.equal(g.doneVM().correct, 1, "als richtig gezählt");
});
