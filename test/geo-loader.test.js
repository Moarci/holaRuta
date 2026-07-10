/*
 * geo-loader.test.js – Tests für den Node-Loader der App-Datenmodule
 * (scripts/geo/load-sc-data.mjs). Prüft, dass die Browser-IIFEs (data.js,
 * countries.js) im vm-Sandbox-Kontext sauber an window.SC.* hängen und die
 * erwartete Struktur/Menge liefern – die Grundlage der datengetriebenen Seiten.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");

test("loadReiseData: liefert Karten + Länderkunde aus den App-Modulen", async () => {
  const { loadReiseData } = await import("../scripts/geo/load-sc-data.mjs");
  const { data, countries } = loadReiseData();

  // Karten-Korpus: laut README ~2293 Karten. Untergrenze großzügig, damit der
  // Test bei Wachstum nicht bricht, aber ein leerer/kaputter Load auffällt.
  assert.ok(Array.isArray(data.CARDS), "data.CARDS ist ein Array");
  assert.ok(data.CARDS.length > 1500, `erwartet >1500 Karten, war ${data.CARDS.length}`);
  assert.ok(Array.isArray(data.CATEGORIES) && data.CATEGORIES.length > 40, "genug Kategorien");

  // Karten tragen die erwarteten Felder (cat/es/de) – Basis der Phrase-FAQs.
  const sample = data.CARDS.find((c) => c && c.es && c.de && c.cat);
  assert.ok(sample, "mindestens eine Karte mit cat/es/de");

  // Länderkunde: 19 Länder mit Prosa (about/history/language) + Phrasen (words).
  assert.ok(Array.isArray(countries.LIST), "countries.LIST ist ein Array");
  assert.ok(countries.LIST.length >= 15, `erwartet >=15 Länder, war ${countries.LIST.length}`);
  const mx = countries.LIST.find((c) => c.id === "mexico");
  assert.ok(mx, "Mexiko vorhanden");
  assert.ok(mx.about && mx.history && mx.language, "Land trägt Prosa-Felder");
  assert.ok(Array.isArray(mx.words) && mx.words.length > 0, "Land trägt Phrasen (words)");
  assert.ok(mx.words[0].es && mx.words[0].de, "Phrase trägt es/de");
});

test("loadSC: leere Dateiliste wirft klaren Fehler", async () => {
  const { loadSC } = await import("../scripts/geo/load-sc-data.mjs");
  assert.throws(() => loadSC([]), /mindestens eine Datei/);
});

test("loadSC: unbekannte Datei wirft lesbaren Fehler", async () => {
  const { loadSC } = await import("../scripts/geo/load-sc-data.mjs");
  assert.throws(() => loadSC(["gibtsnicht-xyz.js"]), /nicht lesbar/);
});

test("loadLocalsData: liefert Karten + Kategorien für den Locals-Track (es-en)", async () => {
  const { loadLocalsData } = await import("../scripts/geo/load-sc-data.mjs");
  const { dataLocals } = loadLocalsData();

  assert.ok(Array.isArray(dataLocals.CARDS), "dataLocals.CARDS ist ein Array");
  assert.ok(dataLocals.CARDS.length > 2000, `erwartet >2000 Karten, war ${dataLocals.CARDS.length}`);
  assert.ok(Array.isArray(dataLocals.CATEGORIES) && dataLocals.CATEGORIES.length > 100, "genug Kategorien");

  const sample = dataLocals.CARDS.find((c) => c && c.es && c.en && c.cat);
  assert.ok(sample, "mindestens eine Karte mit cat/es/en");
});
