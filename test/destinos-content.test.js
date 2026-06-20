/*
 * destinos-content.test.js – Schützt Vollständigkeit & Verdrahtung der
 * Destinations-/Stadt-Packs (z. B. Cartagena). Fängt zwei Fehlerklassen,
 * die der Review gefunden hat:
 *
 *  K1 – fehlende englische Übersetzung auf Kartenebene (en/Kontext-EN). Eine
 *       neue Pack-Karte ohne en/Kontext-EN würde sonst still im DE-only
 *       erscheinen (DE/EN-Parität ist sonst nur für UI-Strings erzwungen).
 *  K2 – Pre-Arrival-Preset ohne Dashboard-Verdrahtung. Genau so rutschte das
 *       Cartagena-Preset zunächst durch: Datenobjekt vorhanden, aber die
 *       i18n-Titel/Untertitel-Schlüssel fehlten -> Kachel nie sichtbar.
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
require(path.join(SRC, "contextdata.js"));
require(path.join(SRC, "data.js"));
require(path.join(SRC, "numbers.js"));
require(path.join(SRC, "context.js"));
const { data, i18n, contextData } = globalThis.window.SC;

// ---- K1: jede Karte hat eine englische Übersetzung + vollständigen EN-Kontext ----
test("data.CARDS: jede Karte hat eine englische Übersetzung (en)", () => {
  const without = data.CARDS.filter((c) => !c.en);
  assert.equal(without.length, 0, `ohne en: ${without.map((c) => c.id).join(", ")}`);
});

// Nur HANDGESCHRIEBENER Kontext (Schlüssel in contextdata.js) – reine Zahlen-Karten
// bekommen ihren Kontext generiert (inkl. EN, separat in sc.test.js geprüft).
test("data.CARDS: handgeschriebener Reise-Kontext hat vollständige englische Pendants", () => {
  const authored = new Set(Object.keys(contextData || {}));
  const bad = data.CARDS.filter((c) => authored.has(c.id)).filter((c) => {
    const x = c.context;
    return !x || !x.sentenceEn || !x.situationEn || !x.noteEn;
  });
  assert.equal(bad.length, 0, `Kontext ohne EN: ${bad.map((c) => c.id).join(", ")}`);
});

// ---- K2: jedes Pre-Arrival-Preset ist auf dem Dashboard verdrahtet (i18n) ----
// Die Startseite zeigt prearrival-*-Kacheln über home.preset<Suffix>Title/Sub.
// Suffix = ID nach "prearrival-", erster Buchstabe groß (co->Co, ctg->Ctg).
test("Pre-Arrival-Presets: i18n-Titel/Untertitel existieren (DE & EN)", () => {
  const prev = i18n.lang ? i18n.lang() : "de";
  const presets = data.PRESETS.filter((p) => /^prearrival-/.test(p.id));
  assert.ok(presets.length >= 9, "Pre-Arrival-Presets fehlen?");
  try {
    ["de", "en"].forEach((lang) => {
      i18n.setLang(lang);
      presets.forEach((p) => {
        const suf = p.id.slice("prearrival-".length);
        const cap = suf.charAt(0).toUpperCase() + suf.slice(1);
        ["Title", "Sub"].forEach((kind) => {
          const key = "home.preset" + cap + kind;
          const val = i18n.t(key);
          assert.notEqual(val, key, `[${lang}] ${p.id}: i18n-Schlüssel ${key} fehlt (Dashboard-Kachel würde nie erscheinen)`);
          assert.ok(val && val.trim().length, `[${lang}] ${p.id}: ${key} ist leer`);
        });
      });
    });
  } finally {
    i18n.setLang(prev);
  }
});
