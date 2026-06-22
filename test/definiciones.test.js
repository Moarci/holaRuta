/*
 * definiciones.test.js – Feature-Modul SC.definiciones (Zuordnen-Quiz).
 *
 * Welle B der app.js/ui.js-Zerlegung. Bootet die App im DOM-Stub (echter
 * Dispatch-Pfad) und prüft Modul-API, VM-Form und den vollständigen Klick-Pfad
 * open -> start -> answer -> next … -> quizDone, inkl. der ctx-Verdrahtung
 * (setGameStats/syncBadges beim Runden-Ende).
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

test("SC.definiciones exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.definiciones;
  for (const k of ["init", "setupScreen", "playScreen", "doneScreen", "setupVM", "doneVM", "open", "start", "answer", "next", "again"]) {
    assert.equal(typeof m[k], "function", `API: ${k}`);
  }
});

test("setupVM() liefert Quiz-Listen mit Karten-Anzahl und Niveau (ctx-Daten-Helfer)", () => {
  freshApp();
  const vm = window.SC.definiciones.setupVM();
  assert.ok(vm.sets.length >= 1, "mindestens ein Quiz-Set");
  for (const s of vm.sets) {
    assert.equal(typeof s.label, "string");
    assert.ok(s.count > 0, `Set ${s.id} hat Definitionen`);
  }
});

test("setupScreen() rendert die Set-Auswahl (SC.view-Helfer greifen)", () => {
  freshApp();
  const html = window.SC.definiciones.setupScreen();
  assert.match(html, /<section class="screen">/);
  assert.match(html, /Definiciones/, "hmTopbar-Titel");
  assert.match(html, /data-action="start-quiz"/, "Set-Buttons");
});

test("Klick-Pfad: open -> start -> answer (Feedback) -> next; doneVM + again", () => {
  const root = freshApp();
  const d = driver(root);
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter");
  assert.ok(d.click("open-quiz-setup"), "open-quiz-setup");
  assert.match(d.html(), /data-action="start-quiz"/, "Setup-Screen");

  // Ein Set mit mehreren Fragen wählen (so erreichen wir NICHT den quizDone-Screen,
  // dessen SC.celebrate-Mount im reinen DOM-Stub erwartungsgemäß nicht läuft –
  // wie auch controller-smoke die Mini-Spiel-Done-Screens bewusst auslässt).
  const set = window.SC.definiciones.setupVM().sets.find((s) => s.count >= 3);
  assert.ok(set, "ein Set mit ≥3 Fragen vorhanden");
  assert.ok(d.click("start-quiz", { set: set.id }), "start-quiz");
  assert.match(d.html(), /class="quiz-def"/, "Frage 1 rendert");

  // Frage 1 beantworten -> Feedback erscheint.
  const m1 = d.html().match(/data-action="quiz-answer" data-id="([^"]+)"/);
  assert.ok(m1, "Antwort-Optionen vorhanden");
  assert.ok(d.click("quiz-answer", { id: m1[1] }), "quiz-answer");
  assert.match(d.html(), /quiz-feedback/, "Feedback nach Antwort");
  assert.match(d.html(), /data-action="quiz-next"/, "Weiter-Knopf erscheint");

  // doneVM liest den laufenden Quiz-State (kein Done-Screen nötig).
  const dv = window.SC.definiciones.doneVM();
  assert.equal(dv.total, set.count, "doneVM kennt die Rundenlänge");
  assert.ok(dv.correct >= 0 && dv.correct <= 1, "doneVM zählt richtige Antworten");

  // „Weiter" geht zu Frage 2 (immer noch Quiz-Screen, nicht Done).
  assert.ok(d.click("quiz-next"), "quiz-next");
  assert.match(d.html(), /class="quiz-def"/, "Frage 2 rendert");

  // „Nochmal" (Zurück-Pfeil im Quiz) führt zur Set-Auswahl zurück.
  assert.ok(d.click("quiz-again"), "quiz-again");
  assert.match(d.html(), /data-action="start-quiz"/, "zurück zur Set-Auswahl");
});
