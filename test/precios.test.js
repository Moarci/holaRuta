/*
 * precios.test.js – Feature-Modul SC.precios (Precios al oído, Preis-Hörtrainer).
 *
 * Welle B der app.js/ui.js-Zerlegung. Bootet die App im DOM-Stub. Der Stub hat
 * keine Sprachausgabe (speechSynthesis: null) → ohne Mock rendert die degradierte
 * „kein TTS"-Ansicht (auch getestet). Für den Spielfluss werden speech-Support und
 * numbers.buildRound (deterministische Runde) gemockt – beide hängen am selben
 * Objekt, das der ctx injiziert, sodass die Overrides greifen. Geprüft werden
 * Modul-API, VMs (numbers-Daten), Persistenz von Währung/Stufe (ctx.setSettings)
 * und der Antwort-/Weiter-Pfad inkl. ctx-Verdrahtung.
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

// Sprachausgabe + deterministische Runde mocken (am gemeinsamen SC-Objekt, das der
// ctx hält). Liefert die bekannte Queue zurück, damit der Test die richtigen Werte kennt.
function enablePlay(queue) {
  window.SC.speech.isSupported = () => true;
  window.SC.speech.speak = () => {};
  window.SC.numbers.buildRound = () => queue.slice();
}

test("SC.precios exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.precios;
  for (const k of ["init", "setupScreen", "playScreen", "doneScreen", "setupVM", "doneVM",
    "open", "setCurrency", "setLevel", "start", "submit", "next", "again", "speak"]) {
    assert.equal(typeof m[k], "function", `API: ${k}`);
  }
});

test("setupVM() liefert Währungen + Stufen aus SC.numbers", () => {
  freshApp();
  const vm = window.SC.precios.setupVM();
  assert.ok(vm.currencies.length >= 3, "mehrere Währungen");
  assert.equal(vm.levels.length, 3, "drei Schwierigkeitsstufen");
  assert.ok(vm.currencies.some((c) => c.selected), "eine Währung ist vorgewählt");
  assert.ok(vm.levels.some((l) => l.active), "eine Stufe ist aktiv");
});

test("Ohne Sprachausgabe rendert setupScreen die degradierte Ansicht", () => {
  freshApp();
  // Stub-Default: speech.isSupported() === false.
  const html = window.SC.precios.setupScreen();
  assert.match(html, /Precios al oído/, "hmTopbar bleibt");
  assert.match(html, /stat-empty/, "Hinweis statt Spielaufbau");
  assert.doesNotMatch(html, /data-action="start-precios"/, "kein Start ohne TTS");
});

test("setCurrency/setLevel merken die Wahl (ctx.setSettings) und der Aufbau erscheint", () => {
  freshApp();
  enablePlay([{ value: 1250, digits: "1.250", es: "mil doscientos cincuenta pesos" }]);
  const vm = window.SC.precios.setupVM();
  const otherCur = vm.currencies.find((c) => !c.selected).key;
  window.SC.precios.setCurrency(otherCur);
  window.SC.precios.setLevel(3);
  const vm2 = window.SC.precios.setupVM();
  assert.equal(vm2.currencies.find((c) => c.selected).key, otherCur, "Währung gemerkt");
  assert.equal(vm2.levels.find((l) => l.active).id, 3, "Stufe gemerkt");
  // Mit TTS-Mock zeigt der Setup-Screen jetzt den echten Aufbau.
  assert.match(window.SC.precios.setupScreen(), /data-action="start-precios"/, "Start-Knopf da");
});

test("Spielfluss: start -> richtige Antwort (zählt) -> weiter; doneVM-Form", () => {
  freshApp();
  enablePlay([
    { value: 1250, digits: "1.250", es: "mil doscientos cincuenta" },
    { value: 50, digits: "50", es: "cincuenta" },
  ]);
  window.SC.precios.start();
  let html = window.SC.precios.playScreen();
  assert.match(html, /id="precios-answer"/, "Eingabe-Form rendert");
  assert.match(html, /1\/2/, "Fortschritt zeigt 2-Runden-Queue");

  // Richtige Antwort auf Betrag 1 (Ziffern aus dem bekannten Mock).
  window.SC.precios.submit("1.250");
  html = window.SC.precios.playScreen();
  assert.match(html, /verdict--ok/, "richtige Antwort wird als korrekt gewertet");
  assert.match(html, /data-action="precios-next"/, "Weiter-Knopf erscheint");

  // Weiter zu Betrag 2.
  window.SC.precios.next();
  html = window.SC.precios.playScreen();
  assert.match(html, /2\/2/, "zweiter Betrag");
  assert.match(html, /id="precios-answer"/, "frische Eingabe-Form");

  // Falsche Antwort auf Betrag 2.
  window.SC.precios.submit("999");
  assert.match(window.SC.precios.playScreen(), /verdict--no/, "falsche Antwort als falsch gewertet");

  const dv = window.SC.precios.doneVM();
  assert.equal(dv.total, 2, "doneVM kennt die Rundenlänge");
  assert.equal(dv.correct, 1, "genau eine richtige Antwort gezählt");
});
