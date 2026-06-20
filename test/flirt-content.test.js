/*
 * flirt-content.test.js – Schützt Vollständigkeit & Verdrahtung des Moduls
 * „Coqueteo y romance" (flirt.js). Fängt dieselben Fehlerklassen wie die
 * übrigen Info-Module (Salud/Logística):
 *
 *  - Schema: das Modul exportiert INTRO(+EN), TOPICS, PHRASES, GLOSSARY,
 *    CHECKLIST – sonst rendert ui.renderFlirt eine leere Seite.
 *  - DE/EN-Parität: jedes …En-Pendant ist da (sonst fiele der Englisch-Modus
 *    still auf Deutsch zurück); Sätze/Glossar tragen es/de/en.
 *  - Dashboard-Verdrahtung: die i18n-Schlüssel (Kachel-Untertitel + Abschnitts-
 *    überschriften) existieren in BEIDEN Sprachen – fehlen sie, wäre die Kachel
 *    bzw. eine Überschrift unsichtbar/roh.
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
require(path.join(SRC, "flirt.js"));
const { flirt, i18n } = globalThis.window.SC;

test("flirt: lädt und exportiert das Info-Modul-Schema", () => {
  assert.ok(flirt, "window.SC.flirt fehlt (vor app.js geladen?)");
  assert.ok(typeof flirt.INTRO === "string" && flirt.INTRO.trim().length, "INTRO fehlt");
  assert.ok(typeof flirt.INTRO_EN === "string" && flirt.INTRO_EN.trim().length, "INTRO_EN fehlt");
  for (const k of ["TOPICS", "PHRASES", "GLOSSARY", "CHECKLIST"]) {
    assert.ok(Array.isArray(flirt[k]) && flirt[k].length, `${k} fehlt oder leer`);
  }
});

test("flirt.TOPICS: jedes Thema ist zweisprachig & ausgewogen", () => {
  flirt.TOPICS.forEach((tp, i) => {
    assert.ok(tp.icon && tp.title && tp.titleEn, `TOPIC ${i}: icon/title/titleEn fehlt`);
    assert.ok(tp.intro && tp.introEn, `TOPIC ${i} (${tp.title}): intro/introEn fehlt`);
    assert.ok(Array.isArray(tp.dos) && tp.dos.length, `TOPIC ${i} (${tp.title}): dos leer`);
    assert.ok(Array.isArray(tp.donts) && tp.donts.length, `TOPIC ${i} (${tp.title}): donts leer`);
    assert.equal(tp.dosEn.length, tp.dos.length, `TOPIC ${i} (${tp.title}): dosEn-Länge ≠ dos`);
    assert.equal(tp.dontsEn.length, tp.donts.length, `TOPIC ${i} (${tp.title}): dontsEn-Länge ≠ donts`);
  });
});

test("flirt.PHRASES: jede Satzgruppe & jeder Satz ist vollständig (es/de/en)", () => {
  const ids = new Set();
  flirt.PHRASES.forEach((g, i) => {
    assert.ok(g.id && g.icon && g.title && g.titleEn, `PHRASES ${i}: id/icon/title/titleEn fehlt`);
    assert.ok(!ids.has(g.id), `PHRASES: doppelte id ${g.id}`);
    ids.add(g.id);
    assert.ok(Array.isArray(g.items) && g.items.length, `PHRASES ${g.id}: keine items`);
    g.items.forEach((p, j) => {
      assert.ok(p.es && p.de && p.en, `PHRASES ${g.id}[${j}]: es/de/en unvollständig`);
    });
  });
});

test("flirt.GLOSSARY & CHECKLIST: vollständige DE/EN-Felder", () => {
  flirt.GLOSSARY.forEach((w, i) => {
    assert.ok(w.es && w.de && w.en, `GLOSSARY ${i}: es/de/en unvollständig`);
  });
  flirt.CHECKLIST.forEach((c, i) => {
    assert.ok(c.icon && c.item && c.itemEn, `CHECKLIST ${i}: icon/item/itemEn fehlt`);
    assert.ok(c.why && c.whyEn, `CHECKLIST ${i} (${c.item}): why/whyEn fehlt`);
  });
});

test("flirt: i18n-Schlüssel (Kachel + Überschriften) existieren in DE & EN", () => {
  const prev = i18n.getLang();
  const keys = [
    "discover.subFlirt",
    "discover.flTips", "discover.flPhrases", "discover.flWords",
    "discover.flChecklist", "discover.flChecklistHint",
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
