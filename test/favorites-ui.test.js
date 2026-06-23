/*
 * favorites-ui.test.js – „Mi léxico" im echten Dispatch-Pfad (DOM-Stub).
 *
 * Deckt die Komfort-Funktionen rund um die Favoriten-Liste ab, die NICHT auf
 * Store-Ebene testbar sind, weil sie im Controller (app.js) + Render (ui.js)
 * leben:
 *   - eigener Eintrag: anlegen, Duplikat (gleiches de+es) freundlich abweisen
 *   - Validierungsfehler erhält den getippten Entwurf (kein Datenverlust)
 *   - Schnellsuche filtert die Liste live (nur #fav-results, Feld behält Fokus)
 *   - eigenen Eintrag inline bearbeiten
 *   - Entfernen zeigt „Rückgängig" und stellt den Eintrag wieder her
 *   - Modul-Satz-Favorit landet in seiner Modulgruppe, NICHT als „eigener Eintrag"
 *
 * Bootet die App im DOM-Stub (echte Listener, echtes render()).
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

function dispatch(el, type) { el.dispatchEvent({ type, target: el, bubbles: true }); }
function clickSel(root, sel) { const el = root.querySelector(sel); if (!el) return false; dispatch(el, "click"); return true; }

// Auf „Mi léxico" navigieren: zurück aufs Dashboard, Entdecken-Reiter, dann das Modul.
function openFavorites(root) {
  clickSel(root, '[data-action="home"]');
  const tab = root.querySelector('[data-action="set-tab"][data-tab="entdecken"]');
  if (tab) dispatch(tab, "click");
  assert.ok(clickSel(root, '[data-action="open-favorites"]'), "Mi léxico im Entdecken-Reiter erreichbar");
}

// Eigenen Eintrag über das „＋"-Formular anlegen (Felder füllen + submit). Der
// Stub synchronisiert value-Attribut nicht auf die value-Property, darum hier
// explizit el.value setzen (im Browser macht das der Parser).
function addCustom(root, de, es, tip) {
  root.querySelector("#fav-de").value = de;
  root.querySelector("#fav-es").value = es;
  root.querySelector("#fav-tip").value = tip || "";
  dispatch(root.querySelector('[data-action="fav-add"]'), "submit");
}

const favs = () => window.SC.store.loadFavorites();

test("eigener Eintrag: anlegen klappt, Duplikat (gleiches de+es) wird abgewiesen", () => {
  const root = freshApp();
  openFavorites(root);

  addCustom(root, "Hallo", "Hola");
  assert.equal(favs().length, 1, "ein Eintrag nach dem Hinzufügen");

  // Gleicher Eintrag in anderer Schreibweise/Whitespace -> kein zweiter Eintrag.
  addCustom(root, "  hallo ", "HOLA ");
  assert.equal(favs().length, 1, "Duplikat nicht angelegt");
  assert.ok(root.querySelector(".fav-add__msg--error"), "Fehlermeldung zum Duplikat sichtbar");
});

test("Validierungsfehler erhält den getippten Entwurf im Feld", () => {
  const root = freshApp();
  openFavorites(root);

  // Nur Deutsch, Español fehlt -> Fehler, aber der Entwurf bleibt erhalten.
  root.querySelector("#fav-de").value = "Wo ist der Bus?";
  root.querySelector("#fav-es").value = "";
  dispatch(root.querySelector('[data-action="fav-add"]'), "submit");

  assert.equal(favs().length, 0, "nichts gespeichert");
  assert.equal(root.querySelector("#fav-de").getAttribute("value"), "Wo ist der Bus?",
    "getippter Text steht nach dem Re-Render wieder im Feld");
});

test("Schnellsuche filtert die Liste live (nur #fav-results)", () => {
  const root = freshApp();
  openFavorites(root);
  addCustom(root, "Hallo", "Hola");
  addCustom(root, "Tschüss", "Adiós");

  const input = root.querySelector("#fav-filter");
  assert.ok(input, "Filterfeld vorhanden");
  input.value = "adi";
  dispatch(input, "input");

  const box = root.querySelector("#fav-results");
  assert.ok(box.innerHTML.indexOf("Adiós") !== -1, "Treffer bleibt sichtbar");
  assert.ok(box.innerHTML.indexOf("Hola") === -1, "Nicht-Treffer ausgeblendet");
});

test("eigenen Eintrag inline bearbeiten aktualisiert ihn", () => {
  const root = freshApp();
  openFavorites(root);
  addCustom(root, "Hallo", "Hola");

  assert.ok(clickSel(root, ".fav-row__edit"), "Bearbeiten-Knopf am eigenen Eintrag");
  // Edit-Formular füllen (Stub: value-Property setzen) und speichern.
  root.querySelector("#fav-edit-de").value = "Hallo";
  root.querySelector("#fav-edit-es").value = "Buenas";
  root.querySelector("#fav-edit-tip").value = "";
  dispatch(root.querySelector('[data-action="fav-edit-save"]'), "submit");

  const list = favs();
  assert.equal(list.length, 1, "kein neuer Eintrag, nur aktualisiert");
  assert.equal(list[0].es, "Buenas", "Español aktualisiert");
});

test("Entfernen zeigt Undo und stellt den Eintrag wieder her", () => {
  const root = freshApp();
  openFavorites(root);
  addCustom(root, "Hallo", "Hola");

  assert.ok(clickSel(root, ".fav-row__rm"), "Entfernen-Knopf vorhanden");
  assert.equal(favs().length, 0, "Eintrag entfernt");
  assert.ok(root.querySelector(".fav-undo"), "Undo-Leiste sichtbar");

  assert.ok(clickSel(root, '[data-action="fav-undo"]'), "Rückgängig-Knopf vorhanden");
  assert.equal(favs().length, 1, "Eintrag wiederhergestellt");
  assert.equal(favs()[0].es, "Hola");
});

test("Modul-Satz-Favorit landet in seiner Modulgruppe (nicht als eigener Eintrag)", () => {
  const root = freshApp();
  // Im Modul „Viaja responsable" den ersten Satz sternen.
  clickSel(root, '[data-action="home"]');
  const tab = root.querySelector('[data-action="set-tab"][data-tab="entdecken"]');
  if (tab) dispatch(tab, "click");
  assert.ok(clickSel(root, '[data-action="open-responsable"]'), "Modul erreichbar");
  const star = root.querySelector('[data-action="fav-toggle"][data-cat="responsable"][data-es]');
  assert.ok(star, "Satz-Stern vorhanden");
  dispatch(star, "click");

  openFavorites(root);
  // Gruppenüberschrift trägt den Modultitel; der Satz hat KEINEN Edit-Knopf
  // (nur eigene, getippte Einträge sind bearbeitbar).
  const label = root.querySelector(".fav-group__label");
  assert.ok(label && label.textContent.indexOf("Viaja responsable") !== -1,
    "nach Modul (Viaja responsable) gruppiert");
  assert.ok(!root.querySelector(".fav-row__edit"), "Modul-Satz ist kein 'eigener Eintrag'");
});
