/*
 * regateo.test.js – Feature-Modul SC.regateo (Regatear-Erklärseite).
 *
 * Teil der app.js/ui.js-Zerlegung (Welle D, Info-Screens): VM (Pass-Through des
 * Content-Moduls SC.regatear, Stufen-Kurzlabel an Rollenspiele, {name}-Auflösung)
 * und Render leben in features/regateo.js und bekommen Controller-Dienste per
 * init(ctx). Dieser Test bootet die App im DOM-Stub (echter Dispatch-Pfad) und
 * prüft:
 *   - die öffentliche Modul-API + VM-Form (Tipps/Glossar/Sätze/Einheiten/Regional/
 *     Rollenspiele; Rollenspiele tragen lvlShort),
 *   - dass der Render die Seite baut (Topbar, Modul-Teilen, Taktik-Blöcke mit dem
 *     geteilten tipsShareBtn aus SC.view, Rollenspiel-Abschnitt),
 *   - den Screen-Einstieg über einen echten Klick (open-regatear im Entdecken-
 *     Reiter) – so ist die Dependency-Injection-Verdrahtung (ctx) abgesichert.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const stub = require("./_dom-stub.js");

// Frischer App-Boot pro Test: localStorage neu, als "onboarded" geseedet, App-
// Modul-Caches leeren, neu laden (analog tiempos/controller-smoke).
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

test("SC.regateo exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.regateo;
  assert.equal(typeof m.init, "function");
  assert.equal(typeof m.vm, "function");
  assert.equal(typeof m.screen, "function");
});

test("vm() reicht das Regatear-Modul durch und hängt lvlShort an die Rollenspiele", () => {
  freshApp();
  const vm = window.SC.regateo.vm();
  assert.ok(Array.isArray(vm.tips) && vm.tips.length > 0, "Taktik-Tipps vorhanden");
  assert.ok(Array.isArray(vm.glossary), "Glossar");
  assert.ok(Array.isArray(vm.phrases), "Sätze nach Phase");
  assert.ok(Array.isArray(vm.units), "Einheiten");
  assert.ok(Array.isArray(vm.regional), "regionale Unterschiede");
  assert.ok(Array.isArray(vm.roleplays), "Rollenspiele");
  for (const r of vm.roleplays) {
    assert.equal(typeof r.lvlShort, "string", "jedes Rollenspiel trägt ein Stufen-Kurzlabel");
  }
});

test("screen() baut die Erklärseite (Topbar, Modul-Teilen, Taktik via tipsShareBtn, Rollenspiele)", () => {
  freshApp();
  const html = window.SC.regateo.screen();
  assert.match(html, /<section class="screen">/);
  assert.match(html, /🤝 Regatear/, "Topbar-Titel");
  assert.match(html, /class="knigge-topic"/, "aufklappbare Taktik-Blöcke");
  assert.match(html, /data-action="share-tips" data-cat="regatear"/, "geteilter Tipp-Teilen-Knopf (SC.view)");
  assert.match(html, /rg-rp/, "Rollenspiel-Abschnitt");
});

test("Klick open-regatear öffnet die Erklärseite (ctx-Verdrahtung greift)", () => {
  const root = freshApp();
  const d = driver(root);
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter erreichbar");
  assert.ok(d.click("open-regatear"), "open-regatear ist erreichbar/anklickbar");
  assert.match(d.html(), /🤝 Regatear/, "Regatear-Topbar sichtbar");
  assert.match(d.html(), /class="rg-head"/, "Regatear-Abschnittsüberschriften gerendert");
});
