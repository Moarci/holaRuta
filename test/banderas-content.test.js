/*
 * banderas-content.test.js – schützt Vollständigkeit & Verdrahtung des Moduls
 * „Banderas" (banderas.js: Flaggen-Daten + Info-Sheet). Prüft das Datenschema,
 * die Zweisprachigkeit (DE/EN) und dass alle vom Spiel genutzten i18n-Schlüssel
 * in beiden Sprachen existieren. Nutzt den Node-Test-Runner – keine Dependencies.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
const SRC = path.join(__dirname, "..");
require(path.join(SRC, "i18n.js"));
require(path.join(SRC, "i18n.strings.js"));
require(path.join(SRC, "banderas.js"));
const { banderas, i18n } = globalThis.window.SC;

test("banderas: lädt und exportiert COUNTRIES + Info-Modul-Schema", () => {
  assert.ok(banderas, "window.SC.banderas fehlt");
  assert.ok(typeof banderas.INTRO === "string" && banderas.INTRO.trim().length, "INTRO fehlt");
  assert.ok(typeof banderas.INTRO_EN === "string" && banderas.INTRO_EN.trim().length, "INTRO_EN fehlt");
  for (const k of ["COUNTRIES", "TOPICS", "PHRASES", "GLOSSARY", "CHECKLIST"]) {
    assert.ok(Array.isArray(banderas[k]) && banderas[k].length, `${k} fehlt oder leer`);
  }
});

test("banderas.COUNTRIES: jedes Land ist vollständig & zweisprachig", () => {
  const REGIONS = new Set(["sur", "centro", "europa", "mundo"]);
  banderas.COUNTRIES.forEach((c, i) => {
    for (const f of ["id", "flag", "es", "de", "en", "capital", "colors", "colorsEn", "sym", "symEn", "fact", "factEn"]) {
      assert.ok(typeof c[f] === "string" && c[f].trim().length, `COUNTRIES[${i}] (${c.id || "?"}): Feld ${f} fehlt`);
    }
    assert.ok(REGIONS.has(c.region), `COUNTRIES[${i}] (${c.id}): region „${c.region}" unbekannt`);
    // Flaggen-Emoji = genau zwei Regional-Indicator-Symbole.
    assert.equal([...c.flag].length, 2, `COUNTRIES[${i}] (${c.id}): flag „${c.flag}" ist keine 2-Zeichen-Flaggen-Emoji`);
  });
});

test("banderas.COUNTRIES: ids und Flaggen sind eindeutig", () => {
  const ids = banderas.COUNTRIES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "doppelte id");
  const flags = banderas.COUNTRIES.map((c) => c.flag);
  assert.equal(new Set(flags).size, flags.length, "doppelte Flagge");
});

test("banderas.COUNTRIES: jede Quiz-Region hat genug Länder (≥4) für 4 Optionen", () => {
  const byRegion = (r) => banderas.COUNTRIES.filter((c) => c.region === r).length;
  assert.ok(byRegion("sur") >= 4, "Sudamérica hat < 4 Länder");
  assert.ok(byRegion("centro") >= 4, "Centroamérica/Caribe hat < 4 Länder");
  assert.ok(banderas.COUNTRIES.length >= 4, "Gesamtmenge < 4 Länder");
});

test("banderas.TOPICS: jedes Thema ist zweisprachig & längensynchron", () => {
  banderas.TOPICS.forEach((tp, i) => {
    assert.ok(tp.icon && tp.title && tp.titleEn, `TOPIC ${i}: icon/title/titleEn fehlt`);
    assert.ok(tp.intro && tp.introEn, `TOPIC ${i}: intro/introEn fehlt`);
    assert.ok(Array.isArray(tp.dos) && tp.dos.length, `TOPIC ${i}: dos leer`);
    assert.equal((tp.dosEn || []).length, tp.dos.length, `TOPIC ${i}: dosEn-Länge ≠ dos`);
    assert.ok(Array.isArray(tp.tips) && tp.tips.length, `TOPIC ${i}: tips leer`);
    assert.equal((tp.tipsEn || []).length, tp.tips.length, `TOPIC ${i}: tipsEn-Länge ≠ tips`);
    // Optionales Lesetraining: wenn es:[…] da ist, muss vocab passen.
    if (tp.es) {
      assert.ok(Array.isArray(tp.es) && tp.es.length, `TOPIC ${i}: es leer`);
      assert.ok(Array.isArray(tp.vocab) && tp.vocab.length, `TOPIC ${i}: vocab zu es fehlt`);
    }
  });
});

test("banderas.PHRASES/GLOSSARY/CHECKLIST: vollständig (es/de/en bzw. …En)", () => {
  banderas.PHRASES.forEach((g, i) => {
    assert.ok(g.id && g.icon && g.title && g.titleEn, `PHRASES ${i}: Metadaten fehlt`);
    g.items.forEach((p, j) => assert.ok(p.es && p.de && p.en, `PHRASES ${g.id}[${j}]: es/de/en unvollständig`));
  });
  banderas.GLOSSARY.forEach((w, i) => assert.ok(w.es && w.de && w.en, `GLOSSARY ${i}: es/de/en fehlt`));
  banderas.CHECKLIST.forEach((c, i) => {
    assert.ok(c.icon && c.item && c.itemEn, `CHECKLIST ${i}: item/itemEn fehlt`);
    assert.ok(c.why && c.whyEn, `CHECKLIST ${i}: why/whyEn fehlt`);
  });
});

test("banderas: alle genutzten i18n-Schlüssel existieren in DE & EN", () => {
  const prev = i18n.getLang();
  const keys = [
    "discover.subBanderas", "discover.bndSetupIntro", "discover.bndPlayHead", "discover.bndLearnHead",
    "discover.bnd_sur", "discover.bnd_sur_icon", "discover.bnd_sur_desc",
    "discover.bnd_centro", "discover.bnd_centro_icon", "discover.bnd_centro_desc",
    "discover.bnd_mundo", "discover.bnd_mundo_icon", "discover.bnd_mundo_desc",
    "discover.bnd_todas", "discover.bnd_todas_icon", "discover.bnd_todas_desc",
    "discover.bndGaleria", "discover.bndGaleriaDesc", "discover.bndGaleriaIntro",
    "discover.bndSaberMas", "discover.bndSaberMasDesc", "discover.bndQuestion",
    "discover.bndRegSur", "discover.bndRegCentro", "discover.bndRegEuropa", "discover.bndRegMundo", "discover.bndOtherRound",
    "discover.bnTips", "discover.bnPhrases", "discover.bnWords", "discover.bnChecklist", "discover.bnChecklistHint",
  ];
  try {
    ["de", "en"].forEach((lang) => {
      i18n.setLang(lang);
      keys.forEach((key) => {
        const val = i18n.t(key);
        assert.notEqual(val, key, `[${lang}] ${key} fehlt`);
        assert.ok(val && String(val).trim().length, `[${lang}] ${key} ist leer`);
      });
      // Zähl-Schlüssel ist eine Funktion (pos/total).
      const count = i18n.t("discover.bndCount", { pos: 1, total: 5 });
      assert.match(String(count), /1.*5/, `[${lang}] bndCount rendert pos/total nicht`);
    });
  } finally {
    i18n.setLang(prev);
  }
});
