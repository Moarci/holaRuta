/*
 * etiqueta.test.js – Feature-Modul SC.etiqueta (Etiqueta de viaje / Reise-Knigge).
 *
 * Teil der app.js/ui.js-Zerlegung (Welle E – vormals „blockierter" Screen): VM und
 * Render leben in features/etiqueta.js; Controller-Dienste kommen per init(ctx).
 * Die „Blockade" war die geteilte Länder-Auswahl – sie bleibt bewusst controller-
 * seitig: countryPicker (SC.view) emittiert data-action="select-country", der
 * Controller-Handler setzt state.countryId und rendert neu (Länderkunde/Bebidas
 * hängen am selben Zustand). Dieser Test bootet die App im DOM-Stub und prüft:
 *   - die öffentliche Modul-API (vm + screen),
 *   - die VM-Form (gewähltes Land, Regionen-Gruppen fürs Dropdown, Themenblöcke
 *     mit DOs/Don'ts),
 *   - den Render (Topbar, Länder-Dropdown, Themen, geteilter tipsShareBtn),
 *   - den Screen-Einstieg per echtem open-knigge-Klick,
 *   - dass die GETEILTE Länder-Auswahl greift: ein change-Event auf das Dropdown
 *     (select-country) wechselt state.countryId und rendert die Knigge-Tafel neu.
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

test("SC.etiqueta exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.etiqueta;
  assert.equal(typeof m.init, "function");
  assert.equal(typeof m.vm, "function");
  assert.equal(typeof m.screen, "function");
});

test("vm() liefert Land, Regionen-Gruppen und Themenblöcke", () => {
  freshApp();
  const vm = window.SC.etiqueta.vm();
  assert.ok(vm.country && typeof vm.country.name === "string", "ein Land ist gewählt (Default = erstes)");
  assert.ok(Array.isArray(vm.groups) && vm.groups.length > 0, "Regionen-Gruppen fürs Dropdown");
  assert.ok(vm.groups.every((g) => Array.isArray(g.countries) && g.countries.length > 0), "jede Gruppe hat Länder");
  assert.ok(Array.isArray(vm.topics) && vm.topics.length > 0, "Themenblöcke vorhanden");
  assert.ok(vm.topics.every((tp) => "dos" in tp && "donts" in tp), "Themen tragen DOs/Don'ts");
});

test("screen() baut die Knigge-Tafel (Topbar, Länder-Dropdown, Themen, tipsShareBtn)", () => {
  freshApp();
  const html = window.SC.etiqueta.screen();
  assert.match(html, /Etiqueta de viaje/, "lokale Topbar");
  assert.match(html, /data-action="select-country"/, "geteiltes Länder-Dropdown (countryPicker)");
  assert.match(html, /class="knigge-topic"/, "aufklappbare Themenblöcke");
  assert.match(html, /data-action="share-tips" data-cat="knigge"/, "geteilter Tipp-Teilen-Knopf (SC.view)");
});

test("Klick open-knigge öffnet die Tafel", () => {
  const root = freshApp();
  const d = driver(root);
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter erreichbar");
  assert.ok(d.click("open-knigge"), "open-knigge anklickbar");
  assert.match(d.html(), /Etiqueta de viaje/, "Knigge-Tafel sichtbar");
});

test("Geteilte Länder-Auswahl: select-country wechselt das Land und rendert neu", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  d.click("open-knigge");

  // Ein anderes Land als das aktuell gewählte aus dem VM bestimmen.
  const before = window.SC.etiqueta.vm().country;
  const ids = [];
  window.SC.etiqueta.vm().groups.forEach((g) => g.countries.forEach((c) => ids.push(c.id)));
  const otherId = ids.find((id) => id !== before.id);
  assert.ok(otherId, "es gibt ein zweites Land zum Umschalten");

  // change-Event auf dem Dropdown auslösen (so wie der Browser bei Auswahl).
  const select = root.querySelector('[data-action="select-country"]');
  assert.ok(select, "Länder-Dropdown im DOM");
  select.value = otherId;
  select.dispatchEvent({ type: "change", target: select, bubbles: true });

  assert.equal(window.SC.etiqueta.vm().country.id, otherId, "state.countryId ist umgeschaltet");
  assert.match(d.html(), /Etiqueta de viaje/, "Knigge-Tafel nach dem Wechsel neu gerendert");
});
