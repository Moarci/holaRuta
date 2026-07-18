/*
 * store.test.js – Storage-Key-Namensraum je Lern-Track. Node hat kein
 * localStorage: minimaler In-Memory-Stub reicht, store.js ruft ihn nur
 * innerhalb von Funktionen auf (kein Top-Level-Zugriff außer den neuen
 * TRACK_ID/TRACK_NS-Konstanten, die window.SC.track lesen, nicht localStorage).
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

function freshLocalStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    _map: map,
  };
}

function loadStoreWithTrack(trackId) {
  delete require.cache[require.resolve(path.join(__dirname, "..", "store.js"))];
  globalThis.window = { SC: { track: { id: () => trackId } } };
  globalThis.localStorage = freshLocalStorage();
  require(path.join(__dirname, "..", "store.js"));
  return { store: globalThis.window.SC.store, localStorage: globalThis.localStorage };
}

test("store: de-es (Standard) nutzt unpräfixierte Legacy-Keys, unverändert", () => {
  const { store, localStorage } = loadStoreWithTrack("de-es");
  store.saveProgress({ x: 1 });
  assert.equal(localStorage.getItem("spanischcard.progress.v2"), JSON.stringify({ x: 1 }));
});

test("store: de-en (HelloAbroad) nutzt einen eigenen, namensraum-getrennten Key", () => {
  const { store, localStorage } = loadStoreWithTrack("de-en");
  store.saveProgress({ x: 2 });
  assert.equal(localStorage.getItem("spanischcard.de-en.progress.v2"), JSON.stringify({ x: 2 }));
  assert.equal(localStorage.getItem("spanischcard.progress.v2"), null); // kein Bluten in den de-es-Key
});

test("store: es-en migriert einmalig bestehende Legacy-Daten (bestehende ingles-pro/venue-en-Nutzer verlieren keinen Fortschritt)", () => {
  const preSeeded = freshLocalStorage();
  preSeeded.setItem("spanischcard.progress.v2", JSON.stringify({ legacy: true }));
  globalThis.localStorage = preSeeded;
  globalThis.window = { SC: { track: { id: () => "es-en" } } };
  delete require.cache[require.resolve(path.join(__dirname, "..", "store.js"))];
  require(path.join(__dirname, "..", "store.js"));
  assert.equal(globalThis.localStorage.getItem("spanischcard.es-en.progress.v2"), JSON.stringify({ legacy: true }));
});
