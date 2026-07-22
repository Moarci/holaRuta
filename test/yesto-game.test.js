/*
 * yesto-game.test.js – Feature-Modul SC.yestoGame (¿Y esto?, Bild-Vokabel-Spiel).
 *
 * Welle B der app.js/ui.js-Zerlegung. Eigener Namespace SC.yestoGame, da SC.yesto
 * das Datenmodul ist. Bootet die App im DOM-Stub und prüft Modul-API, VMs (Themen
 * aus SC.yesto, Labels via ctx.i18n) und den Spielfluss über reveal()/rate() –
 * der Sekunden-Countdown-Timer wird per disarm() abgeschaltet (Test-Hygiene) und
 * mit reveal() übersprungen, statt auf echte Ticks zu warten. Der quizDone-artige
 * Done-Screen (SC.celebrate-Mount) wird wie bei den anderen Mini-Spielen gemieden.
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

test("SC.yestoGame exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.yestoGame;
  for (const k of ["init", "setupScreen", "playScreen", "doneScreen", "setupVM", "doneVM",
    "arm", "disarm", "open", "start", "reveal", "rate", "again", "autoSpeakItem"]) {
    assert.equal(typeof m[k], "function", `API: ${k}`);
  }
});

test("setupVM() liefert Themen aus dem Datenmodul SC.yesto (Labels via ctx.i18n)", () => {
  freshApp();
  const vm = window.SC.yestoGame.setupVM();
  assert.equal(vm.available, true, "Datenmodul verfügbar");
  assert.ok(vm.themes.length >= 1, "mindestens ein Thema");
  for (const th of vm.themes) {
    assert.equal(typeof th.label, "string");
    assert.ok(th.count > 0, `Thema ${th.id} hat Motive`);
  }
});

test("setupScreen() rendert die Themen-Auswahl (SC.view-Helfer greifen)", () => {
  freshApp();
  const html = window.SC.yestoGame.setupScreen();
  assert.match(html, /¿Y esto\?/, "hmTopbar-Titel");
  assert.match(html, /data-action="start-yesto"/, "Themen-Buttons");
});

test("Spielfluss: start (Countdown) -> reveal -> rate; doneVM zählt", () => {
  freshApp();
  const g = window.SC.yestoGame;
  const themeId = g.setupVM().themes[0].id;

  g.start(themeId);
  g.disarm(); // den gerade scharf geschalteten Sekunden-Tick abschalten
  let html = g.playScreen();
  assert.match(html, /ye-count__num/, "Countdown-Phase rendert das Motiv");
  assert.match(html, /data-action="yesto-reveal"/, "Auflösen-Knopf");

  // Auflösen (Countdown überspringen) -> Wort + Bewerten.
  g.reveal();
  html = g.playScreen();
  assert.match(html, /is-reveal/, "Auflösungs-Phase");
  assert.match(html, /data-action="yesto-rate"/, "Selbstbewertung");

  // „Wusste ich" -> nächstes Motiv (wieder Countdown), correct zählt.
  g.rate(true);
  g.disarm();
  assert.match(g.playScreen(), /ye-count__num/, "nächstes Motiv im Countdown");
  assert.equal(g.doneVM().correct, 1, "eine richtige Selbstbewertung gezählt");
  assert.ok(g.doneVM().total >= 1, "doneVM kennt die Rundenlänge");
});

test("autoSpeakItem: liefert das Lösungswort nur in der Auflösungs-Phase", () => {
  freshApp();
  const g = window.SC.yestoGame;
  const themeId = g.setupVM().themes[0].id;

  g.start(themeId);
  g.disarm();
  // Countdown-Phase: noch nichts vorlesen (Wort ist verdeckt).
  assert.equal(g.autoSpeakItem(), null, "Countdown-Phase spricht nicht");

  // Auflösung: {key,text} mit dem angezeigten Lösungswort.
  g.reveal();
  const item = g.autoSpeakItem();
  assert.ok(item && typeof item.text === "string" && item.text, "Auflösung liefert ein Wort");
  assert.match(item.key, /^yesto:/, "eindeutiger Key pro Motiv");
  // Das gesprochene Wort ist exakt das im Screen gezeigte Lösungswort.
  assert.match(g.playScreen(), new RegExp(item.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "Wort steht auch im Screen");
});

test("Klick open-yesto öffnet die Themen-Auswahl", () => {
  const root = freshApp();
  const d = driver(root);
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter");
  assert.ok(d.click("open-yesto"), "open-yesto anklickbar");
  assert.match(d.html(), /data-action="start-yesto"/, "Themen-Auswahl rendert");
  window.SC.yestoGame.disarm();
});
