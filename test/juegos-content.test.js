/*
 * juegos-content.test.js – Schützt Vollständigkeit & Verdrahtung des Moduls
 * „Juegos de viaje" (juegos.js). Fängt dieselben Fehlerklassen wie die übrigen
 * Info-Module (Salud/Logística/Flirt):
 *
 *  - Schema: das Modul exportiert INTRO(+EN), TOPICS, PHRASES, GLOSSARY,
 *    CHECKLIST – sonst rendert ui.renderJuegos eine leere Seite.
 *  - DE/EN-Parität: jedes …En-Pendant ist da (sonst fiele der Englisch-Modus
 *    still auf Deutsch zurück); Sätze/Glossar tragen es/de/en.
 *  - Lesetraining: jedes mit *…* markierte Wort hat einen Vokabel-Eintrag.
 *  - Dashboard-Verdrahtung: die i18n-Schlüssel (Kachel-Untertitel + Abschnitts-
 *    überschriften) existieren in BEIDEN Sprachen.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = {};
const SRC = path.join(__dirname, "..");
require(path.join(SRC, "i18n.js"));
require(path.join(SRC, "i18n.strings.js"));
require(path.join(SRC, "juegos.js"));
const { juegos, i18n } = globalThis.window.SC;

test("juegos: lädt und exportiert das Info-Modul-Schema", () => {
  assert.ok(juegos, "window.SC.juegos fehlt (vor app.js geladen?)");
  assert.ok(typeof juegos.INTRO === "string" && juegos.INTRO.trim().length, "INTRO fehlt");
  assert.ok(typeof juegos.INTRO_EN === "string" && juegos.INTRO_EN.trim().length, "INTRO_EN fehlt");
  for (const k of ["TOPICS", "PHRASES", "GLOSSARY", "CHECKLIST"]) {
    assert.ok(Array.isArray(juegos[k]) && juegos[k].length, `${k} fehlt oder leer`);
  }
});

test("juegos.TOPICS: jedes Spiel ist zweisprachig & ausgewogen", () => {
  assert.ok(juegos.TOPICS.length >= 8, `zu wenige Spiele (${juegos.TOPICS.length})`);
  juegos.TOPICS.forEach((tp, i) => {
    assert.ok(tp.icon && tp.title && tp.titleEn, `TOPIC ${i}: icon/title/titleEn fehlt`);
    assert.ok(tp.intro && tp.introEn, `TOPIC ${i} (${tp.title}): intro/introEn fehlt`);
    assert.ok(Array.isArray(tp.dos) && tp.dos.length, `TOPIC ${i} (${tp.title}): dos leer`);
    assert.ok(Array.isArray(tp.donts) && tp.donts.length, `TOPIC ${i} (${tp.title}): donts leer`);
    assert.equal(tp.dosEn.length, tp.dos.length, `TOPIC ${i} (${tp.title}): dosEn-Länge ≠ dos`);
    assert.equal(tp.dontsEn.length, tp.donts.length, `TOPIC ${i} (${tp.title}): dontsEn-Länge ≠ donts`);
    // Strategie-/Profi-Tipps (💡): jeder Vorteil-Tipp ist zweisprachig hinterlegt.
    assert.ok(Array.isArray(tp.tips) && tp.tips.length, `TOPIC ${i} (${tp.title}): tips leer`);
    assert.equal(tp.tipsEn.length, tp.tips.length, `TOPIC ${i} (${tp.title}): tipsEn-Länge ≠ tips`);
  });
});

test("juegos.PHRASES: jede Satzgruppe & jeder Satz ist vollständig (es/de/en)", () => {
  const ids = new Set();
  juegos.PHRASES.forEach((g, i) => {
    assert.ok(g.id && g.icon && g.title && g.titleEn, `PHRASES ${i}: id/icon/title/titleEn fehlt`);
    assert.ok(!ids.has(g.id), `PHRASES: doppelte id ${g.id}`);
    ids.add(g.id);
    assert.ok(Array.isArray(g.items) && g.items.length, `PHRASES ${g.id}: keine items`);
    g.items.forEach((p, j) => {
      assert.ok(p.es && p.de && p.en, `PHRASES ${g.id}[${j}]: es/de/en unvollständig`);
    });
  });
});

test("juegos.GLOSSARY & CHECKLIST: vollständige DE/EN-Felder", () => {
  juegos.GLOSSARY.forEach((w, i) => {
    assert.ok(w.es && w.de && w.en, `GLOSSARY ${i}: es/de/en unvollständig`);
  });
  juegos.CHECKLIST.forEach((c, i) => {
    assert.ok(c.icon && c.item && c.itemEn, `CHECKLIST ${i}: icon/item/itemEn fehlt`);
    assert.ok(c.why && c.whyEn, `CHECKLIST ${i} (${c.item}): why/whyEn fehlt`);
  });
});

test("juegos.TOPICS: Lesetraining ist vollständig & kohärent (es/vocab/level)", () => {
  const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
  let withReading = 0;
  juegos.TOPICS.forEach((tp, i) => {
    if (!(tp.es && tp.es.length)) return; // Lesetraining ist optional pro Spiel
    withReading++;
    assert.ok(LEVELS.includes(tp.level), `TOPIC ${i} (${tp.title}): ungültiges level „${tp.level}"`);
    assert.ok(Array.isArray(tp.vocab) && tp.vocab.length, `TOPIC ${i}: es vorhanden, aber vocab leer`);
    tp.vocab.forEach((v, j) => {
      assert.ok(v.es && v.de && v.en, `TOPIC ${i} vocab[${j}]: es/de/en unvollständig`);
      assert.equal(typeof v.take, "boolean", `TOPIC ${i} vocab[${j}] (${v.es}): take ist nicht boolean`);
    });
    const vset = new Set(tp.vocab.map((v) => v.es.toLowerCase().trim()));
    tp.es.forEach((para) => {
      (para.match(/\*([^*]+)\*/g) || []).forEach((m) => {
        const w = m.slice(1, -1).toLowerCase().trim();
        assert.ok(vset.has(w), `TOPIC ${i}: markiertes Wort „${w}" fehlt im vocab`);
      });
    });
  });
  assert.ok(withReading >= 2, "weniger als 2 Spiele mit Lesetraining gefunden");
});

test("juegos: i18n-Schlüssel (Kachel + Überschriften) existieren in DE & EN", () => {
  const prev = i18n.getLang();
  const keys = [
    "discover.subJuegos",
    "discover.jgTips", "discover.jgPhrases", "discover.jgWords",
    "discover.jgChecklist", "discover.jgChecklistHint",
  ];
  try {
    ["de", "en"].forEach((lang) => {
      i18n.setLang(lang);
      keys.forEach((key) => {
        const val = i18n.t(key);
        assert.notEqual(val, key, `[${lang}] i18n-Schlüssel ${key} fehlt`);
        assert.ok(val && val.trim().length, `[${lang}] ${key} ist leer`);
      });
    });
  } finally {
    i18n.setLang(prev);
  }
});
