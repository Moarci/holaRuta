/*
 * flyer-modules-content.test.js – Schützt Vollständigkeit & Verdrahtung der drei
 * Info-Module aus dem Hostel-Flyer: „Jerga colombiana" (jerga.js), „Conoce tus
 * derechos" (derechos.js) und „Viaja responsable" (responsable.js). Fängt
 * dieselben Fehlerklassen wie flirt-content.test.js:
 *
 *  - Schema: INTRO(+EN), TOPICS, PHRASES, GLOSSARY (und CHECKLIST, wo genutzt) –
 *    sonst rendert das jeweilige ui.renderX eine leere Seite.
 *  - DE/EN-Parität: jedes …En-Pendant ist da; Sätze/Glossar tragen es/de/en.
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
require(path.join(SRC, "jerga.js"));
require(path.join(SRC, "derechos.js"));
require(path.join(SRC, "responsable.js"));
const { jerga, derechos, responsable, i18n } = globalThis.window.SC;

// Gemeinsame Prüfungen: ein Info-Modul mit Schema {INTRO(+EN), TOPICS, PHRASES,
// GLOSSARY, optional CHECKLIST}. hasChecklist steuert die CHECKLIST-Pflicht.
function checkModule(name, mod, { hasChecklist }) {
  test(`${name}: lädt und exportiert das Info-Modul-Schema`, () => {
    assert.ok(mod, `window.SC.${name} fehlt (vor app.js geladen?)`);
    assert.ok(typeof mod.INTRO === "string" && mod.INTRO.trim().length, "INTRO fehlt");
    assert.ok(typeof mod.INTRO_EN === "string" && mod.INTRO_EN.trim().length, "INTRO_EN fehlt");
    const keys = ["TOPICS", "PHRASES", "GLOSSARY"].concat(hasChecklist ? ["CHECKLIST"] : []);
    for (const k of keys) {
      assert.ok(Array.isArray(mod[k]) && mod[k].length, `${k} fehlt oder leer`);
    }
  });

  test(`${name}.TOPICS: jedes Thema ist zweisprachig & ausgewogen`, () => {
    mod.TOPICS.forEach((tp, i) => {
      assert.ok(tp.icon && tp.title && tp.titleEn, `TOPIC ${i}: icon/title/titleEn fehlt`);
      assert.ok(tp.intro && tp.introEn, `TOPIC ${i} (${tp.title}): intro/introEn fehlt`);
      assert.ok(Array.isArray(tp.dos) && tp.dos.length, `TOPIC ${i} (${tp.title}): dos leer`);
      assert.ok(Array.isArray(tp.donts) && tp.donts.length, `TOPIC ${i} (${tp.title}): donts leer`);
      assert.equal(tp.dosEn.length, tp.dos.length, `TOPIC ${i} (${tp.title}): dosEn-Länge ≠ dos`);
      assert.equal(tp.dontsEn.length, tp.donts.length, `TOPIC ${i} (${tp.title}): dontsEn-Länge ≠ donts`);
    });
  });

  test(`${name}.PHRASES: jede Satzgruppe & jeder Satz ist vollständig (es/de/en)`, () => {
    const ids = new Set();
    mod.PHRASES.forEach((g, i) => {
      assert.ok(g.id && g.icon && g.title && g.titleEn, `PHRASES ${i}: id/icon/title/titleEn fehlt`);
      assert.ok(!ids.has(g.id), `PHRASES: doppelte id ${g.id}`);
      ids.add(g.id);
      assert.ok(Array.isArray(g.items) && g.items.length, `PHRASES ${g.id}: keine items`);
      g.items.forEach((p, j) => {
        assert.ok(p.es && p.de && p.en, `PHRASES ${g.id}[${j}]: es/de/en unvollständig`);
      });
    });
  });

  test(`${name}.GLOSSARY: vollständige es/de/en-Felder`, () => {
    mod.GLOSSARY.forEach((w, i) => {
      assert.ok(w.es && w.de && w.en, `GLOSSARY ${i}: es/de/en unvollständig`);
    });
  });

  test(`${name}.TOPICS: Lesetraining ist vollständig & kohärent (es/vocab/level)`, () => {
    const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
    let withReading = 0;
    mod.TOPICS.forEach((tp, i) => {
      if (!(tp.es && tp.es.length)) return; // Lesetraining ist optional pro Thema
      withReading++;
      assert.ok(LEVELS.includes(tp.level), `TOPIC ${i} (${tp.title}): ungültiges level „${tp.level}"`);
      assert.ok(Array.isArray(tp.vocab) && tp.vocab.length, `TOPIC ${i} (${tp.title}): es vorhanden, aber vocab leer`);
      tp.vocab.forEach((v, j) => {
        assert.ok(v.es && v.de && v.en, `TOPIC ${i} vocab[${j}]: es/de/en unvollständig`);
        assert.equal(typeof v.take, "boolean", `TOPIC ${i} vocab[${j}] (${v.es}): take ist nicht boolean`);
      });
      // Jedes im Text mit *…* markierte Wort braucht einen passenden Vokabel-Eintrag
      // (sonst bliebe es im Lesetext untippbar / ohne Übersetzung).
      const vset = new Set(tp.vocab.map((v) => v.es.toLowerCase().trim()));
      tp.es.forEach((para) => {
        (para.match(/\*([^*]+)\*/g) || []).forEach((m) => {
          const w = m.slice(1, -1).toLowerCase().trim();
          assert.ok(vset.has(w), `TOPIC ${i} (${tp.title}): markiertes Wort „${w}" fehlt im vocab`);
        });
      });
    });
    assert.ok(withReading >= 1, `${name}: kein einziges Thema mit Lesetraining gefunden`);
  });

  if (hasChecklist) {
    test(`${name}.CHECKLIST: vollständige DE/EN-Felder`, () => {
      mod.CHECKLIST.forEach((c, i) => {
        assert.ok(c.icon && c.item && c.itemEn, `CHECKLIST ${i}: icon/item/itemEn fehlt`);
        assert.ok(c.why && c.whyEn, `CHECKLIST ${i} (${c.item}): why/whyEn fehlt`);
      });
    });
  }
}

checkModule("jerga", jerga, { hasChecklist: false });
checkModule("derechos", derechos, { hasChecklist: true });
checkModule("responsable", responsable, { hasChecklist: true });

test("Flyer-Module: i18n-Schlüssel (Kachel + Überschriften) existieren in DE & EN", () => {
  const prev = i18n.getLang();
  const keys = [
    "discover.subJerga", "discover.jgTips", "discover.jgPhrases", "discover.jgWords",
    "discover.subDerechos", "discover.drTips", "discover.drPhrases", "discover.drWords",
    "discover.drChecklist", "discover.drChecklistHint",
    "discover.subResponsable", "discover.rpTips", "discover.rpPhrases", "discover.rpWords",
    "discover.rpChecklist", "discover.rpChecklistHint",
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
