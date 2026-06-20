/*
 * favorites.test.js – Sichert „Mi léxico" (Favoriten – persönliches Lexikon):
 *
 *  - store.loadFavorites/saveFavorites: Round-Trip, Strukturwächter gegen
 *    fremdes/manipuliertes localStorage (Doppel-Ids, fehlende de/es, Deckel)
 *  - Backup: Favoriten sind Teil von export/import (KNOWN_KEYS)
 *  - Manifest: der „Mi léxico"-Homescreen-Shortcut zeigt auf ?a=favoritos und
 *    ist für beide Manifeste (hell/dunkel) vorhanden + lokalisiert
 *  - app.js verdrahtet die Aktion (open-favorites) und den Deep-Link-Opener
 *
 * Reine Daten/Logik – kein Browser, kein DOM nötig.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

// window- und localStorage-Shim (Module sind Browser-IIFEs).
globalThis.window = globalThis.window || {};
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};

const SRC = path.join(__dirname, "..");
require(path.join(SRC, "store.js"));
const { store } = globalThis.window.SC;

function reset() { for (const k of Object.keys(mem)) delete mem[k]; }

test("loadFavorites: leerer/fehlender Speicher -> []", () => {
  reset();
  assert.deepEqual(store.loadFavorites(), []);
});

test("saveFavorites/loadFavorites: Round-Trip behält Felder", () => {
  reset();
  const ok = store.saveFavorites([
    { id: "alltag-hola", de: "Hallo", es: "Hola", tip: "OH-la", cat: "alltag", addedAt: "2026-06-20T10:00:00.000Z" },
  ]);
  assert.equal(ok, true);
  const list = store.loadFavorites();
  assert.equal(list.length, 1);
  assert.deepEqual(list[0], {
    id: "alltag-hola", de: "Hallo", es: "Hola", tip: "OH-la", cat: "alltag", addedAt: "2026-06-20T10:00:00.000Z",
  });
});

test("loadFavorites: eigene (getippte) Einträge ohne Karte bleiben erhalten", () => {
  reset();
  store.saveFavorites([{ id: "fav-abc123", de: "Wo ist die Bushaltestelle?", es: "¿Dónde está la parada?", tip: "", cat: "", addedAt: "" }]);
  const list = store.loadFavorites();
  assert.equal(list.length, 1);
  assert.equal(list[0].es, "¿Dónde está la parada?");
  assert.equal(list[0].tip, ""); // optionale Felder bleiben leer, nicht undefined
});

test("loadFavorites: verwirft Müll (fehlende id/de/es, kein Objekt)", () => {
  reset();
  store.saveFavorites([
    { id: "ok", de: "A", es: "B" },          // gültig
    { id: "", de: "x", es: "y" },             // leere id
    { id: "noes", de: "x" },                  // kein es
    { id: "node", es: "y" },                  // kein de
    null, 42, "string",                       // keine Objekte
  ]);
  const list = store.loadFavorites();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, "ok");
});

test("loadFavorites: doppelte Ids werden entdoppelt (erste gewinnt)", () => {
  reset();
  store.saveFavorites([
    { id: "dup", de: "erste", es: "uno" },
    { id: "dup", de: "zweite", es: "dos" },
  ]);
  const list = store.loadFavorites();
  assert.equal(list.length, 1);
  assert.equal(list[0].de, "erste");
});

test("loadFavorites: Liste ist gegen Wucherung gedeckelt (<= 500)", () => {
  reset();
  const many = [];
  for (let i = 0; i < 600; i++) many.push({ id: "f" + i, de: "d" + i, es: "e" + i });
  store.saveFavorites(many);
  assert.equal(store.loadFavorites().length, 500);
});

test("Backup: Favoriten reisen mit export/import (KNOWN_KEYS)", () => {
  reset();
  store.saveFavorites([{ id: "alltag-hola", de: "Hallo", es: "Hola" }]);
  const payload = store.exportData();
  assert.ok(payload.data["spanischcard.favorites.v1"], "Favoriten fehlen im Export");
  reset();
  assert.deepEqual(store.loadFavorites(), []);
  const n = store.importData(payload);
  assert.ok(n >= 1);
  assert.equal(store.loadFavorites().length, 1);
});

// ---------- Manifest-Shortcut + app.js-Verdrahtung ----------
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

test("Manifest (hell & dunkel): Mi-lexico-Shortcut zeigt auf ?a=favoritos", () => {
  for (const file of ["manifest.webmanifest", "manifest-dark.webmanifest"]) {
    const m = JSON.parse(read(file));
    const sc = (m.shortcuts || []).find((s) => s.url && s.url.indexOf("a=favoritos") !== -1);
    assert.ok(sc, `${file}: Shortcut mit ?a=favoritos fehlt`);
    // Für de UND en lokalisiert (sonst zeigt der Shortcut Spanisch).
    for (const lang of ["de", "en"]) {
      assert.ok(sc.name_localized && sc.name_localized[lang], `${file}: name_localized.${lang} fehlt`);
    }
  }
});

test("app.js: open-favorites-Aktion und ?a=favoritos-Opener sind verdrahtet", () => {
  const appjs = read("app.js");
  // Aktions-Dispatch läuft über die ACTIONS-Lookup-Tabelle (Refactor der früheren
  // if/else-Kette): die Verdrahtung steht als Tabellen-Eintrag "open-favorites" -> openFavorites.
  assert.ok(/"open-favorites":[^\n]*openFavorites\(/.test(appjs), "open-favorites-Aktion fehlt in app.js");
  assert.ok(/favoritos:\s*openFavorites/.test(appjs), "?a=favoritos-Opener fehlt in app.js");
  assert.ok(/function openFavorites\(/.test(appjs), "openFavorites() fehlt in app.js");
});
