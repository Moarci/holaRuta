/*
 * cuerpo.test.js – Feature-Modul SC.cuerpo (El Cuerpo, interaktive 3D-Körperkarte).
 *
 * Teil der app.js/ui.js-Zerlegung (Welle D) – der erste interaktive Screen mit
 * Post-Render-Hook. VM, Render, die 3D-Geometrie und die Dreh-/Auswahl-Logik leben
 * in features/cuerpo.js und bekommen Controller-Dienste (inkl. root + gameStats/
 * setGameStats + syncBadges) per init(ctx). Dieser Test bootet die App im DOM-Stub
 * (echter Dispatch-Pfad) und prüft:
 *   - die öffentliche Modul-API (screen + Post-Render-Hook init3D + select/rotate/speak),
 *   - die VM-Form (Hotspots aus data.BODY_PARTS, total, anfangs nichts gewählt),
 *   - dass der Render die 3D-Bühne baut (Topbar, Fortschritt, Dreh-Knöpfe, Hotspots),
 *   - den Screen-Einstieg per echtem Klick (open-cuerpo) – das löst den Post-Render-
 *     Hook init3D() aus und darf nicht werfen (DI-Verdrahtung inkl. root),
 *   - dass ein Hotspot-Klick (cuerpo-select) das Wort-Panel füllt und das Körperteil
 *     einmalig für den Ruta-Pass einbucht (Fortschritt steigt).
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

test("SC.cuerpo exportiert API inkl. Post-Render-Hook und Action-Handlern", () => {
  freshApp();
  const m = window.SC.cuerpo;
  for (const k of ["init", "vm", "screen", "init3D", "select", "rotate", "speak"]) {
    assert.equal(typeof m[k], "function", `${k} ist eine Funktion`);
  }
});

test("vm() liefert die Hotspots aus data.BODY_PARTS (anfangs nichts gewählt)", () => {
  freshApp();
  const vm = window.SC.cuerpo.vm();
  assert.ok(Array.isArray(vm.parts) && vm.parts.length > 0, "Körperteile vorhanden");
  assert.equal(vm.total, vm.parts.length);
  assert.equal(vm.selected, null, "vor dem ersten Antippen ist nichts gewählt");
  assert.equal(typeof vm.speakable, "boolean");
});

test("screen() baut die 3D-Bühne (Topbar, Fortschritt, Dreh-Knöpfe, Hotspots)", () => {
  freshApp();
  const html = window.SC.cuerpo.screen();
  assert.match(html, /class="screen bp-screen"/);
  assert.match(html, /🧍 El Cuerpo/, "Topbar-Titel");
  assert.match(html, /class="bp-progress"/, "Fortschrittsbalken");
  assert.match(html, /data-bp-stage/, "3D-Bühne");
  assert.match(html, /data-bp-fig/, "Figur-Container (Ziel des Post-Render-Hooks)");
  assert.match(html, /data-action="cuerpo-rotate" data-dir="-1"/, "Dreh-Knopf links");
  assert.match(html, /data-action="cuerpo-select"/, "antippbare Hotspots");
});

test("Klick open-cuerpo öffnet die Bühne und löst den Post-Render-Hook init3D aus (wirft nicht)", () => {
  const root = freshApp();
  const d = driver(root);
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter erreichbar");
  assert.ok(d.click("open-cuerpo"), "open-cuerpo ist erreichbar/anklickbar");
  // Das Rendern hat den Post-Render-Hook cuerpo.init3D() durchlaufen (root.querySelector
  // der Figur) – ohne Wurf landet die Bühne im DOM.
  assert.match(d.html(), /🧍 El Cuerpo/, "Cuerpo-Topbar sichtbar");
  assert.match(d.html(), /data-bp-stage/, "3D-Bühne gerendert");
});

test("Hotspot-Klick (cuerpo-select) füllt das Wort-Panel und bucht den Ruta-Pass ein", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  d.click("open-cuerpo");
  assert.equal(window.SC.cuerpo.vm().exploredCount, 0, "anfangs nichts erkundet");
  assert.ok(d.click("cuerpo-select"), "ein Hotspot ist anklickbar");
  assert.match(d.html(), /bp-panel--filled/, "Wort-Panel ist nach der Auswahl gefüllt");
  assert.equal(window.SC.cuerpo.vm().exploredCount, 1, "das erkundete Körperteil wurde eingebucht");
});

test("cuerpo-rotate dreht die Figur in-place (bpApplyRot wirft nicht nach init3D)", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  d.click("open-cuerpo");
  // Dreh-Knopf nach dem Post-Render-Hook: schreibt nur Transforms in-place (kein
  // Re-Render) – darf nicht werfen, und die Bühne bleibt bestehen.
  assert.ok(d.click("cuerpo-rotate", { dir: "1" }), "Dreh-Knopf rechts anklickbar");
  assert.ok(d.click("cuerpo-rotate", { dir: "-1" }), "Dreh-Knopf links anklickbar");
  assert.match(d.html(), /data-bp-stage/, "3D-Bühne nach dem Drehen unverändert vorhanden");
});
