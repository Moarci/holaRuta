/*
 * cronologia.test.js – Feature-Modul SC.cronologia (Historia, Geschichts-Zeitstrahl).
 *
 * Teil der app.js/ui.js-Zerlegung (Welle E – vormals „blockiert" durch den geteilten
 * readingBlock). VM und Render leben in features/cronologia.js; die Lesetraining-
 * Bausteine (readingBlock/levelMeta) sind nach SC.view gewandert (auch Logística/
 * Salud/Bebidas/Bailar nutzen sie). Dieser Test bootet die App im DOM-Stub (echter
 * Dispatch-Pfad) und prüft:
 *   - die öffentliche Modul-API (vm + screen + histMod),
 *   - die VM-Form (Titel, Einleitung, Epochen/Protagonisten/Spannungen/Fakten),
 *   - den Render (Topbar, Sprungleiste, Zeitstrahl, geteiltes readingBlock mit
 *     antippbaren Vokabel-Chips + Teilen-Knopf),
 *   - den Screen-Einstieg per echtem open-historia-Klick (delegiertes loadModule),
 *   - dass open-historia-centro die Region umschaltet (Mittelamerika-Titel).
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

test("SC.cronologia exportiert die erwartete Modul-API", () => {
  freshApp();
  const m = window.SC.cronologia;
  assert.equal(typeof m.init, "function");
  assert.equal(typeof m.vm, "function");
  assert.equal(typeof m.screen, "function");
  assert.equal(typeof m.histMod, "function", "histMod für die Controller-Sharepics");
});

test("vm() liefert Titel, Einleitung und die Geschichts-Abschnitte (Default = Sudamérica)", () => {
  freshApp();
  const vm = window.SC.cronologia.vm();
  assert.match(vm.topTitle, /Sudamérica/, "ohne Region-Wahl ist Südamerika aktiv");
  assert.equal(typeof vm.intro, "string");
  assert.ok(Array.isArray(vm.eras) && vm.eras.length > 0, "Epochen (Zeitstrahl)");
  assert.ok(Array.isArray(vm.figures), "Protagonisten");
  assert.ok(Array.isArray(vm.tensions), "aktuelle Spannungen");
  assert.ok(Array.isArray(vm.facts), "¿Sabías que…?-Fakten");
});

test("screen() baut den Zeitstrahl mit geteiltem readingBlock (Vokabel-Chips, Teilen)", () => {
  freshApp();
  const html = window.SC.cronologia.screen();
  assert.match(html, /Historia de Sudamérica/, "Topbar-Titel");
  assert.match(html, /class="hist-nav"/, "Sprungmarken-Leiste");
  assert.match(html, /id="hist-zeitstrahl"/, "Zeitstrahl-Abschnitt");
  assert.match(html, /class="hist-era"/, "aufklappbare Epochen");
  assert.match(html, /data-action="hist-word"/, "antippbare Vokabel-Chips (readingBlock aus SC.view)");
  assert.match(html, /data-action="share-historia"/, "Lesetext-Teilen-Knopf (readingBlock aus SC.view)");
});

test("Klick open-historia öffnet den Zeitstrahl (delegiertes loadModule)", () => {
  const root = freshApp();
  const d = driver(root);
  assert.ok(d.click("set-tab", { tab: "entdecken" }), "Entdecken-Reiter erreichbar");
  assert.ok(d.click("open-historia"), "open-historia anklickbar");
  assert.match(d.html(), /Historia de Sudamérica/, "Südamerika-Zeitstrahl sichtbar");
  assert.match(d.html(), /id="hist-zeitstrahl"/, "Zeitstrahl gerendert");
});

test("open-historia-centro schaltet die Region auf Mittelamerika um", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  assert.ok(d.click("open-historia-centro"), "open-historia-centro anklickbar");
  assert.match(d.html(), /Historia de Centroamérica/, "Mittelamerika-Zeitstrahl aktiv");
  assert.match(window.SC.cronologia.vm().topTitle, /Centroamérica/, "VM folgt der Region");
});
