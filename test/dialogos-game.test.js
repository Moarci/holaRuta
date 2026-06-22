/*
 * dialogos-game.test.js – Feature-Modul SC.dialogosGame (Diálogos, Gesprächs-Simulator).
 *
 * Abschluss der app.js/ui.js-Zerlegung (Welle D) – das komplexeste Feature: eine
 * State-Maschine (state.dialogos) mit npc-Zügen, Multiple-Choice- und Frei-Tipp-
 * Zügen, Scroll-Post-Render-Hook und optionalem TTS. VMs, Render und alle Handler
 * liegen in features/dialogos-game.js; der State bleibt controller-eigen (ctx.state).
 * (Die Integrität des Content-Moduls SC.dialogos prüft dialogos.test.js separat.)
 * Dieser Test bootet die App im DOM-Stub (echter Dispatch-Pfad) und prüft:
 *   - die öffentliche Modul-API (3 SCREENS, VMs, Hooks autoSpeakItem/scrollActive,
 *     alle Handler),
 *   - die Setup-VM (Szenarien aus dem Content-Modul SC.dialogos),
 *   - den Screen-Einstieg per echtem open-dialogos-Klick (delegiertes loadModule),
 *   - den kompletten Gesprächs-Fluss bis zum Done-Screen, indem npc-Züge (Weiter),
 *     MC-Züge (Antwort) und Frei-Tipp-Züge (submitType) automatisch abgespielt
 *     werden – so ist die ganze DI-Verdrahtung (state, render, badges, matcher,
 *     withName, Scroll-Hook) gegen Regressionen abgesichert.
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
  return { root, find, click, html: () => root.innerHTML };
}

test("SC.dialogosGame exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.dialogosGame;
  for (const k of ["init", "setupScreen", "playScreen", "doneScreen", "setupVM", "doneVM",
    "autoSpeakItem", "scrollActive", "open", "start", "answerMc", "submitType",
    "advance", "hint", "again", "speakNpc"]) {
    assert.equal(typeof m[k], "function", `${k} ist eine Funktion`);
  }
});

test("setupVM() liefert die Szenarien aus dem Content-Modul SC.dialogos", () => {
  freshApp();
  const vm = window.SC.dialogosGame.setupVM();
  assert.equal(vm.available, true, "Content-Modul ist im Test geladen");
  assert.ok(Array.isArray(vm.scenarios) && vm.scenarios.length > 0, "Szenarien vorhanden");
  for (const s of vm.scenarios) {
    assert.equal(typeof s.id, "string");
    assert.equal(typeof s.title, "string");
  }
  assert.equal(typeof vm.hasSpeech, "boolean");
});

test("setupScreen() baut die Szenario-Auswahl", () => {
  freshApp();
  const html = window.SC.dialogosGame.setupScreen();
  assert.match(html, /💬 Diálogos/, "Topbar-Titel");
  assert.match(html, /data-action="start-dialogos"/, "Szenario-Knöpfe");
});

test("Klick open-dialogos öffnet die Auswahl (delegiertes loadModule)", () => {
  const root = freshApp();
  const d = driver(root);
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter erreichbar");
  assert.ok(d.click("open-dialogos"), "open-dialogos anklickbar");
  assert.match(d.html(), /💬 Diálogos/, "Setup sichtbar");
  assert.match(d.html(), /data-action="start-dialogos"/, "Szenarien gerendert");
});

test("Voller Gesprächs-Fluss: start -> Züge abspielen -> Done-Screen", () => {
  const root = freshApp();
  // Confetti-Mount der Mini-Done-Bühne neutralisieren (DOM-Stub kennt kein Canvas) –
  // hier zählt nur die State-Maschine bis zum Done-Übergang, nicht die Animation.
  window.SC.celebrate = { celebrate() {} };
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  d.click("open-dialogos");
  assert.ok(d.click("start-dialogos"), "ein Szenario ist startbar");
  assert.match(d.html(), /class="dlg-thread"/, "aktiver Dialog gerendert");
  assert.match(d.html(), /id="dlg-active"/, "aktiver Zug-Anker (Ziel des Scroll-Hooks)");

  // npc-Züge (Weiter), MC-Züge (Antwort) und Frei-Tipp-Züge (submitType) bis Done.
  let reachedDone = false;
  for (let i = 0; i < 80; i++) {
    if (/id="cb-mount"/.test(d.html())) { reachedDone = true; break; }
    if (d.find("dialogos-answer")) { d.click("dialogos-answer", { idx: 0 }); continue; }
    if (root.querySelector("#dialogos-answer")) { window.SC.dialogosGame.submitType("respuesta"); continue; }
    if (d.find("dialogos-next")) { d.click("dialogos-next"); continue; }
    break;
  }
  assert.ok(reachedDone, "der Dialog erreicht den Done-Screen (cb-mount)");
  // Am Done-Screen ist das Ergebnis konsistent eingebucht (state.dialogos lebt noch).
  const done = window.SC.dialogosGame.doneVM();
  assert.ok(done.total > 0, "es gab user-Züge zu beantworten");
  assert.ok(done.correct >= 0 && done.correct <= done.total, "Trefferzahl im gültigen Bereich");
});

test("dialogos-hint deckt auf einem Frei-Tipp-Zug die Musterantwort auf", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  d.click("open-dialogos");
  d.click("start-dialogos");

  // Bis zum ersten Frei-Tipp-Zug spielen (jeder Dialog hat welche): npc -> Weiter,
  // MC -> Antwort. Stoppen, sobald Eingabefeld + Tipp-Knopf aktiv sind.
  let reachedType = false;
  for (let i = 0; i < 40; i++) {
    if (root.querySelector("#dialogos-answer") && d.find("dialogos-hint")) { reachedType = true; break; }
    if (d.find("dialogos-answer")) { d.click("dialogos-answer", { idx: 0 }); continue; }
    if (d.find("dialogos-next")) { d.click("dialogos-next"); continue; }
    break;
  }
  assert.ok(reachedType, "ein Frei-Tipp-Zug mit Tipp-Knopf wird erreicht");
  assert.ok(!/class="dlg-tip"/.test(d.html()), "vor dem Tipp ist die Musterantwort verdeckt");
  assert.ok(d.click("dialogos-hint"), "Tipp-Knopf anklickbar");
  assert.match(d.html(), /class="dlg-tip"/, "Musterantwort nach dem Tipp aufgedeckt");
});

test("dialogosGame.again startet dieselbe Szene neu (Zug 1)", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  d.click("open-dialogos");
  d.click("start-dialogos");
  if (d.find("dialogos-next")) d.click("dialogos-next"); // mind. einen Zug vorrücken
  window.SC.dialogosGame.again();
  assert.match(d.html(), /class="dlg-thread"/, "wieder im aktiven Dialog");
  assert.match(d.html(), new RegExp(`dlg-step[^>]*>[^<]*1[^<]`), "Schrittzähler zurück auf Zug 1");
});

test("dialogosGame.speakNpc wirft nicht (ohne TTS ein No-Op)", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  d.click("open-dialogos");
  d.click("start-dialogos");
  assert.doesNotThrow(() => window.SC.dialogosGame.speakNpc());
});

test("playScreen/doneVM überleben einen fehlenden Dialog-State ohne Crash", () => {
  freshApp(); // kein Dialog gestartet -> state.dialogos ist nicht gesetzt
  let html, done;
  assert.doesNotThrow(() => { html = window.SC.dialogosGame.playScreen(); });
  assert.doesNotThrow(() => { done = window.SC.dialogosGame.doneVM(); });
  assert.equal(typeof html, "string");
  assert.equal(done.total, 0);
  assert.equal(done.perfect, false);
});
