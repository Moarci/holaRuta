/*
 * hostel-edition.test.js – White-Label-Hostel-Edition (Lane L0).
 *
 * Prüft die Hostel-Edition über den ECHTEN Laufzeit-Pfad: location.search wird auf
 * "?edition=hostel" gesetzt, registry.js wählt daraufhin den hostel-Eintrag, config.js
 * merged ihn (SC.config.hostel). Danach wird – wie im Browser – über echte render()-
 * und Klick-Dispatches geprüft, dass:
 *   1) der Start-Reiter den Quick-Start-Banner (hist-banner → open-hostel) zeigt,
 *   2) der Entdecken-Reiter den kuratierten Abschnitt „Im Hostel" oben führt,
 *   3) OHNE Edition weder Banner noch Abschnitt erscheinen (graceful Default).
 *
 * Aufruf:  node --test test/hostel-edition.test.js   (oder: node --test)
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const stub = require("./_dom-stub.js");

// Frischer App-Boot wie im controller-smoke-Netz, aber mit optionalem edition-Param
// in der URL. registry.js liest diesen beim Laden (vor config.js), daher muss er VOR
// installModules() gesetzt sein. App-Modul-Caches werden geleert, damit der IIFE-Boot
// (inkl. render()) erneut läuft.
function bootApp(editionId) {
  stub.install();
  // install() verwendet dasselbe window-Objekt wieder und setzt SC nicht zurück –
  // eine zuvor gewählte Edition (SC.editionConfig) würde sonst in den nächsten Boot
  // durchsickern. Vor jedem Boot zurücksetzen, damit registry.js sauber neu wählt.
  if (globalThis.window.SC) globalThis.window.SC.editionConfig = null;
  stub.seedOnboarded();
  if (editionId) globalThis.window.location.search = "?edition=" + editionId;
  const SRC = path.join(__dirname, "..");
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${path.sep}test${path.sep}`)) {
      delete require.cache[key];
    }
  }
  stub.installModules();
  return document.getElementById("app");
}

function click(root, action, data) {
  let sel = `[data-action="${action}"]`;
  if (data) for (const k in data) sel += `[data-${k}="${data[k]}"]`;
  const el = root.querySelector(sel);
  if (!el) return false;
  el.dispatchEvent({ type: "click", target: el, bubbles: true });
  return true;
}

// ---------------------------------------------------------------------------
// 1) Mit ?edition=hostel: Branding aktiv, Banner + Abschnitt erscheinen
// ---------------------------------------------------------------------------
test("hostel-Edition wird aus der URL gewählt und gemerged", () => {
  bootApp("hostel");
  assert.equal(window.SC.config.edition, "hostel", "Edition aktiv");
  assert.ok(window.SC.config.hostel && window.SC.config.hostel.banner,
    "hostel-Block (banner) liegt in der Config");
  assert.ok(Array.isArray(window.SC.config.hostel.featured),
    "featured-Liste vorhanden");
});

test("Start-Reiter zeigt den Hostel-Quick-Start-Banner (→ open-hostel)", () => {
  const root = bootApp("hostel");
  const banner = root.querySelector('.hist-banner[data-action="open-hostel"]');
  assert.ok(banner, "hist-banner mit open-hostel sichtbar");
  assert.match(root.innerHTML, /Heute Abend im Hostel\?/, "Banner-Titel (DE) gerendert");
});

test("Entdecken-Reiter führt den kuratierten Abschnitt „Im Hostel“ oben", () => {
  const root = bootApp("hostel");
  assert.ok(click(root, "set-tab", { tab: "entdecken" }), "Entdecken-Reiter anklickbar");
  const html = root.innerHTML;
  // Präzise auf die Abschnitts-Überschriften (sectioncap) zielen – „Spielen" kommt
  // auch im Intro-Text vor, deshalb nicht das blanke Wort vergleichen.
  const hostelCap = html.indexOf('sectioncap">Im Hostel');
  const playCap = html.indexOf('sectioncap">Spielen');
  assert.ok(hostelCap >= 0, "Abschnittsüberschrift „Im Hostel“ vorhanden");
  assert.ok(playCap >= 0, "reguläre Gruppe „Spielen“ vorhanden");
  assert.ok(hostelCap < playCap, "Hostel-Abschnitt erscheint oberhalb der Standard-Gruppen");
  // Die kuratierten Module sind vertreten (Modo hostal & Juegos liegen im Abschnitt).
  assert.match(html, /data-action="open-hostel"/, "Modo hostal als Kachel vorhanden");
  assert.match(html, /data-action="open-juegos"/, "Juegos als Kachel vorhanden");
});

// ---------------------------------------------------------------------------
// 2) Ohne Edition: exakt wie heute – kein Banner, kein Hostel-Abschnitt
// ---------------------------------------------------------------------------
test("ohne Edition: kein Hostel-Banner auf der Startseite", () => {
  const root = bootApp(null);
  // Bewusst boolesch prüfen: bei einer Regression würde assert sonst das riesige,
  // zirkuläre DOM-Element formatieren (langsam/hängt) statt klar fehlzuschlagen.
  assert.equal(!!root.querySelector('.hist-banner[data-action="open-hostel"]'), false,
    "kein Hostel-Banner ohne Edition");
});

test("ohne Edition: kein „Im Hostel“-Abschnitt unter Entdecken", () => {
  const root = bootApp(null);
  click(root, "set-tab", { tab: "entdecken" });
  assert.doesNotMatch(root.innerHTML, /Im Hostel/, "kein Hostel-Abschnitt ohne Edition");
});
