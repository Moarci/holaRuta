/*
 * spickzettel.test.js – Feature-Modul SC.spickzettel (Survival-Schnellzugriff).
 *
 * Erstes Modul der app.js/ui.js-Zerlegung: Daten, View-Modell, Handler und Render
 * leben in features/spickzettel.js und bekommen Controller-Dienste per init(ctx).
 * Dieser Test bootet die App im DOM-Stub (echter Dispatch-Pfad) und prüft:
 *   - die öffentliche Modul-API + VM-Form (Gruppen/Karten, deutsche Labels via ctx),
 *   - den Screen-Einstieg über einen echten Klick (open-spickzettel),
 *   - die Großanzeige-Schleife sz-show -> sz-close über data-action-Dispatches.
 * So sichert er die Dependency-Injection-Verdrahtung (ctx) gegen Regressionen.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const stub = require("./_dom-stub.js");

// Frischer App-Boot pro Test (analog controller-smoke): localStorage neu, als
// "onboarded" geseedet (Boot ins Dashboard), App-Modul-Caches leeren, neu laden.
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

test("SC.spickzettel exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.spickzettel;
  assert.equal(typeof m.init, "function");
  assert.equal(typeof m.screen, "function");
  assert.equal(typeof m.vm, "function");
  assert.equal(typeof m.open, "function");
  assert.equal(typeof m.szShow, "function");
  assert.equal(typeof m.szClose, "function");
});

test("vm() liefert Gruppen mit Karten und deutschen Labels (ctx-Daten-Helfer)", () => {
  freshApp();
  const vm = window.SC.spickzettel.vm();
  assert.ok(vm.groups.length >= 3, "mehrere Survival-Gruppen");
  for (const g of vm.groups) {
    assert.ok(g.cards.length > 0, `Gruppe ${g.id} hat Karten`);
    assert.ok(Array.isArray(g.grad) && g.grad.length === 2, "Farbverlauf [from,to]");
    for (const c of g.cards) {
      assert.equal(typeof c.es, "string");
      assert.equal(typeof c.de, "string");
      assert.equal(typeof c.fav, "boolean");
    }
  }
  // Notfall-Gruppe trägt ihr lokalisiertes Kategorie-Label (nicht die rohe Id).
  const notfall = vm.groups.find((g) => g.id === "notfall");
  assert.ok(notfall && notfall.label && notfall.label !== "notfall", "lokalisiertes Label");
});

test("render() baut den Survival-Screen (SC.view-Helfer + favStar greifen)", () => {
  freshApp();
  const html = window.SC.spickzettel.screen();
  assert.match(html, /<section class="screen">/);
  assert.match(html, /Supervivencia/, "hmTopbar-Titel");
  assert.match(html, /data-action="sz-show"/, "antippbare Sätze");
  assert.match(html, /class="favstar/, "geteilter Favoriten-Stern (SC.view)");
});

test("Klick open-spickzettel öffnet den Screen, sz-show/sz-close steuern die Großanzeige", () => {
  const root = freshApp();
  const d = driver(root);
  // Aus dem Entdecken-Reiter den Survival-Schnellzugriff öffnen.
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter erreichbar");
  assert.ok(d.click("open-spickzettel"), "open-spickzettel ist erreichbar/anklickbar");
  assert.match(d.html(), /class="sz-group"/, "Spickzettel-Screen rendert Gruppen");
  assert.equal(window.SC.spickzettel.vm().show, null, "anfangs keine Großanzeige");

  // Eine Karten-Id aus der ersten Gruppe in die Großanzeige heben.
  const id = window.SC.spickzettel.vm().groups[0].cards[0].id;
  assert.ok(d.click("sz-show", { id }), "sz-show anklickbar");
  assert.ok(window.SC.spickzettel.vm().show, "Großanzeige ist offen (State via ctx mutiert)");
  assert.match(d.html(), /class="sz-show"/, "Großanzeige-Overlay sichtbar");

  // Schließen räumt den State wieder.
  assert.ok(d.click("sz-close"), "sz-close anklickbar");
  assert.equal(window.SC.spickzettel.vm().show, null, "Großanzeige geschlossen");
});
