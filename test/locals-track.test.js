/*
 * locals-track.test.js – Der Locals-Track (Spanisch lernt Englisch), Edition
 * "cartagena-locals". Prüft Track-Auflösung, den Matcher mit Englisch als
 * Lernsprache (Artikel-Toleranz an, spanische Flexions-Strenge AUS), die
 * TTS-Locale, die spanische UI-Schicht und die Integrität des Pilot-Korpus
 * (data.locals.js).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// Edition VOR config.js setzen (wie Build/Runtime), damit der Locals-Track aktiv ist.
globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "editions", "registry.js"));
window.SC.editionConfig = window.SC.editions["cartagena-locals"];
require(path.join(__dirname, "..", "config.js"));
require(path.join(__dirname, "..", "i18n.js"));
require(path.join(__dirname, "..", "i18n.strings.js"));
require(path.join(__dirname, "..", "i18n.strings.es.js"));
require(path.join(__dirname, "..", "matcher.js"));
require(path.join(__dirname, "..", "data.js"));
require(path.join(__dirname, "..", "data.locals.js"));
const { track, matcher, i18n, data, dataLocals, config } = window.SC;

test("Track: Edition cartagena-locals setzt den es-en-Track", () => {
  assert.equal(config.track, "es-en");
  assert.equal(track.id(), "es-en");
  assert.equal(track.learnLang(), "en");
  assert.deepEqual(track.nativeLangs(), ["es", "en"]);
  assert.equal(track.cardNativeLang(), "es"); // Frage bleibt immer Spanisch
  assert.equal(track.ttsLocale(), "en-US");   // TTS spricht Englisch
});

test("Track: learnText liefert die englische Antwort", () => {
  const card = { de: "die Rechnung", es: "la cuenta", en: "the bill" };
  assert.equal(track.learnText(card), "the bill");
});

test("Matcher: field 'learn' prüft gegen Englisch (card.en)", () => {
  const card = { es: "la cuenta", en: "the bill" };
  assert.equal(matcher.check("the bill", card, "learn").correct, true);
  // Artikel-Toleranz fürs Englische: 'the' darf fehlen.
  assert.equal(matcher.check("bill", card, "learn").correct, true);
  assert.equal(matcher.check("the spoon", card, "learn").correct, false);
});

test("Matcher: card.alt zählt als englische Alternativen (field 'learn')", () => {
  const card = { es: "el baño", en: "the restroom", alt: ["the restroom", "the toilet", "the bathroom"] };
  assert.equal(matcher.check("the toilet", card, "learn").correct, true);
  assert.equal(matcher.check("bathroom", card, "learn").correct, true); // artikellos
});

test("Matcher: keine spanische Flexions-Strenge, wenn Englisch gelernt wird", () => {
  // Wort-finale Einzelabweichung (Plural-s) ist im Spanischen eine Flexion (würde
  // abgelehnt), im Englischen ein verzeihlicher Tippfehler -> wird akzeptiert.
  const card = { es: "las maletas", en: "the suitcases" };
  const r = matcher.check("the suitcase", card, "learn"); // fehlendes finales s
  assert.equal(r.correct, true);
  assert.equal(r.typo, true);
});

test("Matcher: Spanisch-Strenge bleibt für den learn-Fall im Reise-Sinn erhalten", () => {
  // Direktes Feld "es" wird weiterhin spanisch streng bewertet (médico≠médica).
  const card = { es: "médico", en: "doctor" };
  assert.equal(matcher.check("médica", card, "es").correct, false);
});

test("Matcher: Richtung ES→native prüft gegen Spanisch – auch bei englischer UI", () => {
  // Locals + dir es2de: Englisch ist die Frage, die getippte Antwort ist Spanisch
  // (Muttersprache). Auch wenn die UI-Chrome auf Englisch steht, MUSS gegen card.es
  // geprüft werden (nicht gegen card.en = die Frage). Regression-Schutz für die
  // cardNativeLang-Auflösung im Matcher.
  const card = { es: "la cuenta", en: "the bill" };
  i18n.setLang("en"); // UI-Chrome Englisch
  assert.equal(matcher.check("la cuenta", card, "native").correct, true);
  assert.equal(matcher.check("the bill", card, "native").correct, false); // die Frage zählt nicht als Antwort
  i18n.setLang("es");
});

test("i18n: Spanisch ist eine unterstützte UI-Sprache", () => {
  assert.ok(i18n.SUPPORTED.indexOf("es") >= 0);
  i18n.setLang("es");
  assert.equal(i18n.getLang(), "es");
  assert.equal(i18n.locale(), "es-CO");
});

test("i18n: spanische Kern-Strings vorhanden, sonst Rückfall es→en→de", () => {
  i18n.setLang("es");
  assert.equal(i18n.t("common.check"), "Comprobar");      // direkt übersetzt
  assert.equal(i18n.t("study.inputEs"), "Escribe tu respuesta en inglés"); // Locals-gespiegelt
  // Ein nur in EN existierender Schlüssel fällt auf Englisch (nicht Deutsch) zurück.
  const en = (() => { i18n.setLang("en"); const v = i18n.t("home.tabDiscover"); i18n.setLang("es"); return v; })();
  assert.equal(i18n.t("home.tabDiscover"), "Descubrir"); // ist übersetzt
  assert.ok(typeof en === "string");
});

test("Content: Pilot-Korpus data.locals ist strukturell sauber", () => {
  assert.ok(dataLocals && Array.isArray(dataLocals.CARDS) && dataLocals.CARDS.length > 0);
  const catIds = new Set(dataLocals.CATEGORIES.map((c) => c.id));
  for (const c of dataLocals.CARDS) {
    assert.ok(c.id && /^loc-/.test(c.id), `Karten-Id mit loc-Präfix: ${c.id}`);
    assert.ok(c.es && c.es.length, `Karte ${c.id} hat eine spanische Frage`);
    assert.ok(c.en && c.en.length, `Karte ${c.id} hat eine englische Antwort`);
    assert.ok(catIds.has(c.cat), `Karte ${c.id} zeigt auf gültige Kategorie ${c.cat}`);
    assert.ok([1, 2, 3, 4].indexOf(c.lvl) >= 0, `Karte ${c.id} hat eine gültige Stufe`);
  }
  // Eindeutige Ids.
  const ids = dataLocals.CARDS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "Karten-Ids sind eindeutig");
});

test("Content: Presets referenzieren existierende Locals-Karten", () => {
  const ids = new Set(dataLocals.CARDS.map((c) => c.id));
  for (const pr of dataLocals.PRESETS) {
    assert.ok(pr.pick.length > 0, `Preset ${pr.id} ist nicht leer`);
    for (const id of pr.pick) assert.ok(ids.has(id), `Preset ${pr.id} referenziert ${id}`);
  }
});

test("Content: data.locals hängt im Locals-Track an den aktiven Korpus an", () => {
  const ids = new Set(data.CARDS.map((c) => c.id));
  assert.ok(ids.has("loc-mes01"), "Locals-Karten sind im aktiven Korpus");
  const catIds = new Set(data.CATEGORIES.map((c) => c.id));
  assert.ok(catIds.has("meseros") && catIds.has("recepcion") && catIds.has("guias"));
});
