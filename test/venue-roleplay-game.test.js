/*
 * venue-roleplay-game.test.js – Feature-Modul SC.venueRoleplayGame (Zwei-Seiten-Venue-
 * Rollenspiel, WETTBEWERB-EN.md §4 P1). Gast (übt Spanisch) und Personal (übt Englisch)
 * spielen eine Szene im Wechsel auf einem Gerät (Pass-and-play, MC). Inhalt liegt im
 * additiven Daten-Modul SC.venueRoleplay; VMs/Render/Handler in features/venue-roleplay-
 * game.js; State controller-eigen (ctx.state.venueRoleplay). Geprüft:
 *   - die öffentliche Modul-API,
 *   - die Zwei-Richtungs-Invariante des Inhalts (jede Szene hat Gast- UND Personal-Züge,
 *     target passt zur Rolle, genau eine richtige Option, say == richtige Option),
 *   - der komplette Spiel-Fluss über den echten Dispatch-Pfad bis zum Done-Screen,
 *   - Robustheit ohne aktiven State und ohne TTS.
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

test("SC.venueRoleplayGame exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.venueRoleplayGame;
  for (const k of ["init", "setupScreen", "playScreen", "doneScreen", "setupVM", "doneVM",
    "open", "start", "begin", "answerMc", "advance", "again", "speakLine"]) {
    assert.equal(typeof m[k], "function", `${k} ist eine Funktion`);
  }
});

test("Inhalt SC.venueRoleplay: Zwei-Richtungs-Invariante je Szene", () => {
  freshApp();
  const scenes = window.SC.venueRoleplay.SCENES;
  assert.ok(Array.isArray(scenes) && scenes.length >= 2, "mehrere Szenen");
  for (const s of scenes) {
    assert.equal(typeof s.id, "string");
    assert.ok(s.turns.length >= 4, `Szene ${s.id} hat genug Züge`);
    const roles = new Set(s.turns.map((t) => t.role));
    assert.ok(roles.has("guest") && roles.has("staff"), `Szene ${s.id} ist zwei-seitig (Gast UND Personal)`);
    for (const tn of s.turns) {
      assert.ok(tn.role === "guest" || tn.role === "staff", "Rolle gültig");
      // Gast übt Spanisch, Personal übt Englisch – das ist der Wedge.
      assert.equal(tn.target, tn.role === "guest" ? "es" : "en", `${s.id}: target passt zur Rolle`);
      assert.ok(tn.instr && tn.instr.es && tn.instr.en && tn.instr.de, `${s.id}: Anweisung in allen drei Sprachen (kein leeres Instruktionsfeld)`);
      const oks = tn.options.filter((o) => o.ok);
      assert.equal(oks.length, 1, `${s.id}: genau eine richtige Option`);
      assert.equal(tn.say, oks[0].t, `${s.id}: say == richtige Option`);
    }
  }
});

test("setupScreen() baut die Szenen-Auswahl", () => {
  freshApp();
  const html = window.SC.venueRoleplayGame.setupScreen();
  assert.match(html, /data-action="start-venue-roleplay"/, "Szenen-Knöpfe");
});

test("Voller Spiel-Fluss: open -> start -> Pass/Antwort/Weiter -> Done-Screen", () => {
  const root = freshApp();
  const d = driver(root);
  window.SC.venueRoleplayGame.open();
  assert.match(d.html(), /data-action="start-venue-roleplay"/, "Setup sichtbar");
  assert.ok(d.click("start-venue-roleplay"), "eine Szene ist startbar");
  assert.match(d.html(), /class="dlg-thread"/, "aktives Rollenspiel gerendert");

  let reachedDone = false;
  for (let i = 0; i < 120; i++) {
    if (d.find("venue-roleplay-again")) { reachedDone = true; break; }
    if (d.find("venue-roleplay-begin")) { d.click("venue-roleplay-begin"); continue; }
    if (d.find("venue-roleplay-answer")) { d.click("venue-roleplay-answer", { idx: 0 }); continue; }
    if (d.find("venue-roleplay-next")) { d.click("venue-roleplay-next"); continue; }
    break;
  }
  assert.ok(reachedDone, "das Rollenspiel erreicht den Done-Screen");
  const done = window.SC.venueRoleplayGame.doneVM();
  assert.ok(done.total > 0, "es gab Züge zu beantworten");
  assert.ok(done.correct >= 0 && done.correct <= done.total, "Trefferzahl im gültigen Bereich");
});

test("Pass-and-play: vor dem ersten Zug erscheint die Weiterreich-Schleuse", () => {
  const root = freshApp();
  const d = driver(root);
  window.SC.venueRoleplayGame.open();
  d.click("start-venue-roleplay");
  // Direkt nach Start: awaitingPass -> „Bereit"-Knopf, noch keine Antwortoptionen.
  assert.ok(d.find("venue-roleplay-begin"), "Weiterreich-Schleuse aktiv");
  assert.ok(!d.find("venue-roleplay-answer"), "Optionen erst nach dem Weiterreichen");
  d.click("venue-roleplay-begin");
  assert.ok(d.find("venue-roleplay-answer"), "nach Bereit erscheinen die Optionen");
});

test("Gast-Instruktion steht bei spanischer UI nie in der Lernsprache (kein Antwort-Verrat)", () => {
  const root = freshApp();
  const d = driver(root);
  // venue-en-Edition läuft mit spanischer UI – die Gast-Optionen sind Spanisch.
  window.SC.i18n.setLang("es");
  const scene = window.SC.venueRoleplay.SCENES.find((s) => s.id === "checkin");
  const guestTurn = scene.turns.find((t) => t.role === "guest"); // checkin: turn1
  window.SC.venueRoleplayGame.open();
  d.click("start-venue-roleplay", { id: "checkin" });
  const instrOf = () => { const m = d.html().match(/class="dlg-instr">([^<]*)</); return m ? m[1] : ""; };
  // bis zum ersten Gast-Zug spielen
  let reachedGuest = false;
  for (let i = 0; i < 12; i++) {
    if (d.find("venue-roleplay-begin")) { d.click("venue-roleplay-begin"); }
    const instr = instrOf();
    if (instr && instr === guestTurn.instr.en) { reachedGuest = true; break; } // EN, nicht ES
    if (instr && instr === guestTurn.instr.es) { reachedGuest = false; break; }  // Bug: ES verrät die Antwort
    if (d.find("venue-roleplay-answer")) { d.click("venue-roleplay-answer", { idx: 0 }); }
    if (d.find("venue-roleplay-next")) { d.click("venue-roleplay-next"); }
  }
  assert.ok(reachedGuest, "Gast-Instruktion erscheint auf Englisch (nicht in der gelernten Sprache Spanisch)");
});

test("speakLine wirft nicht (ohne TTS ein No-Op)", () => {
  const root = freshApp();
  const d = driver(root);
  window.SC.venueRoleplayGame.open();
  d.click("start-venue-roleplay");
  d.click("venue-roleplay-begin");
  assert.doesNotThrow(() => window.SC.venueRoleplayGame.speakLine());
});

test("playScreen/doneVM überleben einen fehlenden State ohne Crash", () => {
  freshApp(); // kein Rollenspiel gestartet
  let html, done;
  assert.doesNotThrow(() => { html = window.SC.venueRoleplayGame.playScreen(); });
  assert.doesNotThrow(() => { done = window.SC.venueRoleplayGame.doneVM(); });
  assert.equal(typeof html, "string");
  assert.equal(done.total, 0);
  assert.equal(done.perfect, false);
});
