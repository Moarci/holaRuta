/*
 * tiempos.test.js – Feature-Modul SC.tiempos (Zeitformen-Erklärseite).
 *
 * Teil der app.js/ui.js-Zerlegung (Welle D, Info-Screens): VM (loc(data.TENSES) +
 * Kartenzahl) und Render leben in features/tiempos.js und bekommen Controller-
 * Dienste per init(ctx). Dieser Test bootet die App im DOM-Stub (echter Dispatch-
 * Pfad) und prüft:
 *   - die öffentliche Modul-API + VM-Form (guide aus data.TENSES, Kartenzahl),
 *   - dass der Render die Erklärseite baut (Topbar, Sprungleiste, Themenblöcke
 *     via geteiltem SC.view.sect, Übungs-CTA),
 *   - den Screen-Einstieg über einen echten Klick (open-tiempos im Entdecken-Reiter).
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

test("SC.tiempos exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.tiempos;
  assert.equal(typeof m.init, "function");
  assert.equal(typeof m.vm, "function");
  assert.equal(typeof m.screen, "function");
});

test("vm() liefert die Erklär-Struktur (data.TENSES) und die Kartenzahl", () => {
  freshApp();
  const vm = window.SC.tiempos.vm();
  assert.ok(vm.guide && typeof vm.guide === "object", "guide aus data.TENSES");
  assert.ok(vm.guide.timeline && Array.isArray(vm.guide.tenses), "Zeitstrahl + Zeitformen vorhanden");
  assert.equal(typeof vm.cardCount, "number");
  assert.ok(vm.cardCount > 0, "es gibt Übungskarten der Kategorie tiempos");
});

test("screen() baut die Erklärseite (Topbar, Sprungleiste, sect-Blöcke, Übungs-CTA)", () => {
  freshApp();
  const html = window.SC.tiempos.screen();
  assert.match(html, /<section class="screen">/);
  assert.match(html, /Tiempos/, "hmTopbar-Titel");
  assert.match(html, /class="ti-nav"/, "Sprungmarken-Leiste");
  assert.match(html, /class="cinfo-sect"/, "Themenblöcke via geteiltem SC.view.sect");
  assert.match(html, /data-action="open-category" data-id="tiempos"/, "Übungs-CTA in die Kategorie");
});

test("Klick open-tiempos öffnet die Erklärseite (ctx-Verdrahtung greift)", () => {
  const root = freshApp();
  const d = driver(root);
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter erreichbar");
  assert.ok(d.click("open-tiempos"), "open-tiempos ist erreichbar/anklickbar");
  assert.match(d.html(), /class="ti-nav"/, "Tiempos-Screen rendert die Sprungleiste");
  assert.match(d.html(), /Tiempos/, "Tiempos-Topbar sichtbar");
});
