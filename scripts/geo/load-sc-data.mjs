/*
 * scripts/geo/load-sc-data.mjs — lädt die reinen Datenmodule der App (data.js,
 * countries.js, …) im Node-Kontext, OHNE die Daten zu duplizieren.
 *
 * Die App-Module sind Browser-IIFEs, die an `window.SC.*` hängen (z. B.
 *   window.SC = window.SC || {};
 *   window.SC.data = { CATEGORIES, LEVELS, CARDS, … };
 * ). Node kennt kein `window`. Wir bauen daher eine minimale vm-Sandbox mit einem
 * Stub-`window` (+ neutrale Stubs für document/navigator/localStorage, falls ein
 * Modul sie flüchtig berührt) und lassen die Skripte sich EINE gemeinsame
 * `window`-Instanz teilen – exakt wie mehrere <script>-Tags im Browser.
 *
 * So bleibt die generierte GEO-Seite automatisch synchron zur App: ändert sich
 * eine Karte in data.js, ändert sich die Content-Seite beim nächsten Build mit.
 */
"use strict";

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Neutrale No-Op-Stubs: reine Datenmodule brauchen sie nicht, aber falls ein
// Modul beim Laden flüchtig darauf zugreift, soll es nicht hart crashen.
function makeSandbox() {
  const noop = () => {};
  const stubStorage = { getItem: () => null, setItem: noop, removeItem: noop };
  const window = { SC: {} };
  const sandbox = {
    window,
    self: window,
    document: { documentElement: {}, createElement: () => ({ style: {} }), querySelector: () => null },
    navigator: { language: "de", languages: ["de"] },
    localStorage: stubStorage,
    sessionStorage: stubStorage,
    location: { href: "", search: "", pathname: "/" },
    matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop }),
    console,
  };
  sandbox.globalThis = sandbox;
  window.matchMedia = sandbox.matchMedia;
  return sandbox;
}

/**
 * Lädt die angegebenen App-Datendateien (relativ zum Repo-Root) in Reihenfolge
 * und gibt das aufgebaute `window.SC`-Objekt zurück.
 * @param {string[]} files z. B. ["data.js", "countries.js"]
 * @returns {object} das SC-Namespace-Objekt
 */
export function loadSC(files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("loadSC: mindestens eine Datei angeben.");
  }
  const sandbox = makeSandbox();
  const context = vm.createContext(sandbox);
  for (const rel of files) {
    const abs = path.join(REPO_ROOT, rel);
    let code;
    try {
      code = readFileSync(abs, "utf8");
    } catch (err) {
      throw new Error(`loadSC: Datei nicht lesbar: ${rel} (${err.message})`);
    }
    try {
      vm.runInContext(code, context, { filename: rel });
    } catch (err) {
      throw new Error(`loadSC: Fehler beim Ausführen von ${rel}: ${err.message}`);
    }
  }
  return sandbox.window.SC;
}

/**
 * Bequemer Loader für den Reise-Track: Karten-Daten + Länderkunde.
 * @returns {{ data: object, countries: object }}
 */
export function loadReiseData() {
  const SC = loadSC(["data.js", "countries.js"]);
  if (!SC.data || !Array.isArray(SC.data.CARDS)) {
    throw new Error("loadReiseData: SC.data.CARDS fehlt – Ladepfad prüfen.");
  }
  if (!SC.countries || !Array.isArray(SC.countries.LIST)) {
    throw new Error("loadReiseData: SC.countries.LIST fehlt – Ladepfad prüfen.");
  }
  return { data: SC.data, countries: SC.countries };
}

/**
 * Bequemer Loader für den Locals-Track (es-en): Spanischsprachige
 * Hotel-/Guide-/Taxi-Mitarbeiter lernen Englisch fürs Arbeiten. data.locals.js
 * hängt an SC.dataLocals (NICHT an SC.data) und muss NACH data.js geladen
 * werden (gleiche Reihenfolge wie in index.html/build.js).
 * @returns {{ dataLocals: object }}
 */
export function loadLocalsData() {
  const SC = loadSC(["data.js", "data.locals.js"]);
  if (!SC.dataLocals || !Array.isArray(SC.dataLocals.CARDS)) {
    throw new Error("loadLocalsData: SC.dataLocals.CARDS fehlt – Ladepfad prüfen.");
  }
  if (!Array.isArray(SC.dataLocals.CATEGORIES)) {
    throw new Error("loadLocalsData: SC.dataLocals.CATEGORIES fehlt – Ladepfad prüfen.");
  }
  return { dataLocals: SC.dataLocals };
}

export { REPO_ROOT };
