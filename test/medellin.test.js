/*
 * medellin.test.js – die zwei Medellín-Discover-Info-Module (SC.medellin, es-en).
 * Prüft die Datenstruktur und dass jedes Thema auf eine echte loc-med-Kategorie mit
 * Karten zeigt (damit die live aus den Karten gebauten „wichtigen Sätze" nie leer sind).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// Locals-Track aktiv (loc-med-Karten im Korpus).
globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "editions", "registry.js"));
window.SC.editionConfig = window.SC.editions["ingles-pro"];
require(path.join(__dirname, "..", "config.js"));
require(path.join(__dirname, "..", "data.js"));
require(path.join(__dirname, "..", "data.locals.js"));
require(path.join(__dirname, "..", "medellin.js"));
const { medellin, data } = window.SC;

test("Struktur: SC.medellin hat ciudad & paisa mit Intro/Topics/Glossar", () => {
  assert.ok(medellin && medellin.ciudad && medellin.paisa, "beide Sektionen vorhanden");
  for (const key of ["ciudad", "paisa"]) {
    const s = medellin[key];
    assert.ok(s.INTRO && s.INTRO_EN, `${key}: INTRO + INTRO_EN`);
    assert.ok(Array.isArray(s.TOPICS) && s.TOPICS.length === 4, `${key}: 4 Themen`);
    assert.ok(Array.isArray(s.GLOSSARY) && s.GLOSSARY.length >= 5, `${key}: Glossar gefüllt`);
    for (const g of s.GLOSSARY) assert.ok(g.es && g.de, `${key}: Glossar-Eintrag hat es+de`);
    for (const tp of s.TOPICS) {
      assert.ok(tp.cat && tp.title && tp.titleEn, `${key}/${tp.cat}: cat+title+titleEn`);
      assert.ok(tp.intro && tp.introEn, `${tp.cat}: intro + introEn`);
      assert.ok(/^lc:/.test(tp.icon), `${tp.cat}: lc-Icon (${tp.icon})`);
    }
  }
});

test("Abdeckung: die 8 Themen decken genau die 8 loc-med-Kategorien ab", () => {
  const wanted = ["comuna13-en", "metro-med-en", "ambiente-med-en", "nomadas-en",
                  "paisa-en", "comida-paisa-en", "eventos-med-en", "guatape-en"];
  const cats = [...medellin.ciudad.TOPICS, ...medellin.paisa.TOPICS].map((t) => t.cat);
  assert.deepEqual(cats.slice().sort(), wanted.slice().sort());
});

test("Phrasen-Quelle: jede Themen-Kategorie hat Karten (Live-Sätze nie leer)", () => {
  const topics = [...medellin.ciudad.TOPICS, ...medellin.paisa.TOPICS];
  for (const tp of topics) {
    const cards = data.CARDS.filter((c) => c.cat === tp.cat);
    assert.ok(cards.length >= 8, `${tp.cat}: genug Karten für die Übersicht (${cards.length})`);
    for (const c of cards.slice(0, 8)) assert.ok(c.en && c.es, `${c.id}: en+es für die Phrase`);
  }
});
