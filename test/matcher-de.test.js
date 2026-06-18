/*
 * matcher-de.test.js – R1: Matcher-Fixes, vor allem für die Richtung ES→DE
 * (Klammerzusätze optional, ß/ss, Volleingabe "A / B", Preis-Karten) plus
 * Regressionen der bestehenden es-Richtung.
 *
 * Bewusst NUR synthetische Kartenobjekte ({de, es, alt}) – keine IDs aus
 * data.js, weil die Datenbasis parallel umgebaut wird.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "matcher.js"));
const { matcher } = globalThis.window.SC;

const ok = (input, card, field) =>
  assert.equal(matcher.check(input, card, field).correct, true, `sollte akzeptiert werden: "${input}"`);
const no = (input, card, field) =>
  assert.equal(matcher.check(input, card, field).correct, false, `sollte abgelehnt werden: "${input}"`);

// ---------- normalize: neue Zeichen-Toleranzen ----------
test("normalize: ß wird zu ss", () => {
  assert.equal(matcher.normalize("Wie heißt du?"), "wie heisst du");
  assert.equal(matcher.normalize("Straße"), "strasse");
});

test("normalize: $, –, — und Apostrophe verschwinden, Striche sind Wortgrenzen", () => {
  assert.equal(matcher.normalize("$ 45.000"), "45000");
  assert.equal(matcher.normalize("links – rechts"), "links rechts");
  assert.equal(matcher.normalize("links — rechts"), "links rechts");
  assert.equal(matcher.normalize("Wie geht's?"), "wie gehts");
  assert.equal(matcher.normalize("l’agua"), "lagua");
  assert.equal(matcher.normalize("Hostel-Nacht"), "hostel nacht");
});

test("normalize: Klammern werden entfernt", () => {
  assert.equal(matcher.normalize("1. (erster/erste)"), "1 erster erste");
});

test("normalize: bisherige Toleranzen bleiben (Akzente, Satzzeichen, Spaces)", () => {
  assert.equal(matcher.normalize("¿Cómo  estás?"), "como estas");
  assert.equal(matcher.normalize("  ñandú "), "nandu");
  assert.equal(matcher.normalize("¡Hólá!"), "hola");
});

// ---------- ES→DE: Klammerzusätze sind optional ----------
test("de-Richtung: Ordinalzahl '1. (erster/erste)' – alle sinnvollen Eingaben zählen", () => {
  const card = { de: "1. (erster/erste)", es: "primero/a" };
  ok("1.", card, "de");
  ok("1", card, "de");
  ok("erster", card, "de");
  ok("erste", card, "de");
  ok("1. (erster/erste)", card, "de"); // wörtliche Volleingabe
  no("zweite", card, "de");
  no("", card, "de"); // leere Eingabe bleibt falsch
  no("   ", card, "de");
});

test("de-Richtung: Klammerzusatz ohne Slash ist optional", () => {
  const card = { de: "der Geldautomat (ATM)", es: "el cajero automático" };
  ok("der Geldautomat", card, "de");
  ok("atm", card, "de");
  ok("der Geldautomat (ATM)", card, "de");
  no("der Schalter", card, "de");
});

// ---------- ES→DE: ß/ss ----------
test("de-Richtung: ß-Antworten akzeptieren die ss-Schreibweise", () => {
  const card = { de: "Wie heißt du?", es: "¿Cómo te llamas?" };
  ok("Wie heisst du?", card, "de");
  ok("wie heißt du", card, "de");
  no("wie alt bist du", card, "de");
});

// ---------- ES→DE: Slash-Alternativen + Volleingabe ----------
test("de-Richtung: 'links / rechts' – Alternativen UND Volleingabe zählen", () => {
  const card = { de: "links / rechts", es: "izquierda / derecha" };
  ok("links", card, "de");
  ok("rechts", card, "de");
  ok("links / rechts", card, "de"); // exakt wie angezeigt
  ok("links rechts", card, "de");
  no("geradeaus", card, "de");
});

// ---------- ES→DE: Preis-Karten ----------
test("de-Richtung: Preis-Karte '$ 45.000 – Hostel-Nacht' ist lösbar", () => {
  const card = { de: "$ 45.000 – Hostel-Nacht", es: "cuarenta y cinco mil" };
  ok("45.000", card, "de");
  ok("45000", card, "de");
  ok("Hostel-Nacht", card, "de");
  ok("hostel nacht", card, "de");
  ok("$ 45.000 – Hostel-Nacht", card, "de"); // wörtliche Volleingabe
  no("50.000", card, "de");
});

// ---------- ES→DE: das richtige Feld wird geprüft ----------
test("de-Richtung: spanische Antwort zählt nicht als deutsche", () => {
  const card = { de: "Arzt", es: "médico" };
  ok("arzt", card, "de");
  no("medico", card, "de");
});

// ---------- es-Richtung: keine Regressionen ----------
test("es-Richtung: Klammerzusätze sind auch hier optional", () => {
  const card = { de: "Wasser", es: "el agua (sin gas)" };
  ok("el agua", card);
  ok("sin gas", card);
  ok("el agua (sin gas)", card);
});

test("es-Richtung: Slash-Alternativen + Volleingabe", () => {
  const card = { es: "el bus / el colectivo" };
  ok("el bus", card);
  ok("el colectivo", card);
  ok("el bus / el colectivo", card); // exakt wie angezeigt – jetzt auch ok
  no("el taxi", card);
});

test("es-Richtung: card.alt hat weiterhin Vorrang", () => {
  const card = { es: "Soy vegetariano/a", alt: ["soy vegetariano", "soy vegetariana"] };
  ok("soy vegetariano", card);
  ok("soy vegetariana", card);
  no("soy carnívoro", card);
});

test("es-Richtung: bewusste n/ñ-Toleranz (año/ano, Tastatur ohne ñ)", () => {
  const card = { es: "el año" };
  ok("el año", card);
  ok("el ano", card); // dokumentierte Toleranz, siehe matcher.js-Kommentar
});

// ---------- Tippfehler-Toleranz ----------
test("Tippfehler: klarer Vertipper zählt, wird aber als typo markiert", () => {
  const card = { es: "quiero un café" };
  // exakt -> correct, kein typo
  let r = matcher.check("quiero un cafe", card);
  assert.equal(r.correct, true); assert.equal(r.typo, false);
  // ein fehlender Buchstabe -> correct mit typo-Flag
  r = matcher.check("quiro un cafe", card);
  assert.equal(r.correct, true); assert.equal(r.typo, true);
  // optionales Pronomen davor -> correct, kein typo
  r = matcher.check("yo quiero un café", card);
  assert.equal(r.correct, true); assert.equal(r.typo, false);
  // Pronomen + Vertipper -> correct mit typo
  r = matcher.check("yo quiro un café", card);
  assert.equal(r.correct, true); assert.equal(r.typo, true);
});

test("Tippfehler: kurze Wörter bleiben streng (gato ≠ pato), echte Fehler bleiben falsch", () => {
  assert.equal(matcher.check("pato", { es: "gato" }).correct, false);   // 4 Buchstaben: nur exakt
  assert.equal(matcher.check("gato", { es: "gato" }).correct, true);
  no("geradeaus", { de: "links / rechts", es: "izquierda / derecha" }, "de"); // weit weg bleibt weit weg
});

test("matchFree: bequemer Freitext-Check liefert correct + typo", () => {
  const acc = ["quiero un cafe", "un cafe por favor"];
  assert.deepEqual(matcher.matchFree("quiero un café", acc), { correct: true, typo: false });
  assert.deepEqual(matcher.matchFree("quiro un cafe", acc), { correct: true, typo: true });
  assert.deepEqual(matcher.matchFree("no se", acc), { correct: false, typo: false });
});

test("check: answers bleibt die unnormalisierte Anzeige-Liste", () => {
  const card = { es: "el bus / el colectivo" };
  assert.deepEqual(matcher.check("x", card).answers, ["el bus", "el colectivo"]);
  const withAlt = { es: "Soy vegetariano/a", alt: ["soy vegetariano", "soy vegetariana"] };
  assert.deepEqual(matcher.check("x", withAlt).answers, withAlt.alt);
});
