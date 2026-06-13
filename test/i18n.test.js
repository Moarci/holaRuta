/*
 * i18n.test.js – Mehrsprachigkeit (SC.i18n) + Matcher im native/Englisch-Fall.
 * Prüft: t()-Fallback-Kette, Pluralfunktionen, nativeText-Rückfall auf de,
 * locale(), Key-Parität DE⟷EN im UI-Wörterbuch und die englische Artikel-Toleranz
 * des Matchers (the/a/an).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "i18n.js"));
require(path.join(__dirname, "..", "i18n.strings.js"));
require(path.join(__dirname, "..", "matcher.js"));
require(path.join(__dirname, "..", "data.js"));
const { i18n, matcher, data } = globalThis.window.SC;

test("nativeText: liefert das Feld der aktiven Sprache, sonst Rückfall auf de", () => {
  i18n.setLang("de");
  assert.equal(i18n.nativeText({ de: "Bus", en: "bus" }), "Bus");
  i18n.setLang("en");
  assert.equal(i18n.nativeText({ de: "Bus", en: "bus" }), "bus");
  // Fehlendes/leeres en -> Rückfall auf de (Nutzer-Karten, noch nicht übersetzt).
  assert.equal(i18n.nativeText({ de: "nur-de" }), "nur-de");
  assert.equal(i18n.nativeText({ de: "nur-de", en: "" }), "nur-de");
  assert.equal(i18n.nativeText(null), "");
});

test("setLang: nicht unterstützte Sprache fällt auf Default (de) zurück", () => {
  assert.equal(i18n.setLang("fr"), "de");
  assert.equal(i18n.setLang("en"), "en");
});

test("t: Fallback-Kette lang -> de -> key", () => {
  i18n.setLang("en");
  assert.equal(i18n.t("common.dueNow"), "due");
  i18n.setLang("de");
  assert.equal(i18n.t("common.dueNow"), "fällig");
  // Unbekannter Key bleibt sichtbar (statt leer/Crash).
  assert.equal(i18n.t("does.not.exist"), "does.not.exist");
});

test("t: Pluralfunktionen mit Parametern", () => {
  i18n.setLang("de");
  assert.equal(i18n.t("common.inNDays", { n: 3 }), "in 3 Tagen");
  assert.equal(i18n.t("common.dayStreak", { n: 1 }), "1 Tag");
  assert.equal(i18n.t("common.dayStreak", { n: 2 }), "2 Tage");
  i18n.setLang("en");
  assert.equal(i18n.t("common.inNDays", { n: 3 }), "in 3 days");
  assert.equal(i18n.t("common.dayStreak", { n: 1 }), "1 day");
  assert.equal(i18n.t("common.dayStreak", { n: 2 }), "2 days");
});

test("locale: en -> en-GB, de -> de-DE", () => {
  i18n.setLang("en");
  assert.equal(i18n.locale(), "en-GB");
  i18n.setLang("de");
  assert.equal(i18n.locale(), "de-DE");
});

test("Matcher native/Englisch: nativeText wird geprüft, Artikel sind tolerant", () => {
  const card = { de: "die Haltestelle", en: "the bus stop", es: "la parada" };
  i18n.setLang("en");
  assert.equal(matcher.check("the bus stop", card, "native").correct, true);
  assert.equal(matcher.check("bus stop", card, "native").correct, true); // Artikel darf fehlen
  assert.equal(matcher.check("the wrong thing", card, "native").correct, false);
  // de-Alias bleibt unangetastet: prüft weiter gegen das deutsche Feld.
  assert.equal(matcher.check("die Haltestelle", card, "de").correct, true);
});

test("Coverage: CATEGORIES/LEVELS/BATTLE_SCENES haben labelEn", () => {
  // Strukturelle Labels (nicht im de/es-Muster) müssen ein englisches Pendant haben,
  // sonst zeigen Themen-Kacheln/Stufen/Battle-Szenen im EN-Modus Deutsch.
  const lacks = (arr, name) => {
    const m = arr.filter((o) => o.label != null && (o.labelEn == null || o.labelEn === ""));
    assert.equal(m.length, 0, `${name} ohne labelEn: ${m.map((o) => o.id).join(", ")}`);
  };
  lacks(data.CATEGORIES, "CATEGORIES");
  lacks(data.LEVELS, "LEVELS");
  lacks(data.BATTLE_SCENES, "BATTLE_SCENES");
});

test("Coverage: jede Karte mit de: hat ein nicht-leeres en:", () => {
  // Schützt davor, dass eine Karte ohne englische Übersetzung still auf Deutsch
  // zurückfällt. localizeDeep/nativeText fangen das ab, aber Lücken sollen auffallen.
  const missing = data.CARDS.filter((c) => c.de != null && (c.en == null || c.en === ""));
  assert.equal(missing.length, 0, `Karten ohne en: ${missing.map((c) => c.id).join(", ")}`);
});

test("localizeDeep: überlagert …En-Felder, lässt es/Spanisch unangetastet", () => {
  const obj = { de: "Bus", en: "bus", es: "autobús", situationDe: "am Bahnhof", situationEn: "at the station" };
  i18n.setLang("en");
  const en = i18n.localizeDeep(obj);
  assert.equal(en.de, "bus");
  assert.equal(en.situationDe, "at the station");
  assert.equal(en.es, "autobús"); // Spanisch bleibt
  assert.equal(en.en, undefined);  // En-Hilfsfeld wird nicht durchgereicht
  i18n.setLang("de");
  assert.equal(i18n.localizeDeep(obj), obj); // de: unveränderte Referenz (kein Overhead)
});

test("Matcher native/Deutsch: prüft gegen das deutsche Feld, keine Artikel-Toleranz", () => {
  const card = { de: "die Haltestelle", en: "the bus stop", es: "la parada" };
  i18n.setLang("de");
  assert.equal(matcher.check("die Haltestelle", card, "native").correct, true);
  // ohne en-Sonderfall keine englische Artikel-Logik – „Haltestelle" allein passt nicht
  assert.equal(matcher.check("Haltestelle", card, "native").correct, false);
});
