/*
 * usercards.test.js – Sichert SC.userCards (eigene, vom Nutzer angelegte Karten).
 *
 * Schwerpunkt: add() kappt die Feldlängen (de/es/tip ≤ 500, cat ≤ 100) GENAU wie
 * store.loadUserCards beim nächsten Start validiert. Ohne diesen add-seitigen
 * Deckel würde eine zu lange Karte gespeichert + in der Sitzung gezeigt, beim
 * Reload aber still vom Loader verworfen (Daten-/Vertrauensverlust). Dieser Test
 * verriegelt, dass add-Zeitpunkt und Lade-Zeitpunkt deckungsgleich kappen.
 *
 * Reine Daten/Logik – kein Browser, kein DOM nötig.  Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};

const SRC = path.join(__dirname, "..");
require(path.join(SRC, "store.js"));
// usercards.js liest beim Laden window.SC.store -> erst store.js, dann das Modul.
require(path.join(SRC, "usercards.js"));
const { store, userCards } = globalThis.window.SC;

function reset() { for (const k of Object.keys(mem)) delete mem[k]; }

test("add(): kappt de/es/tip auf 500 und cat auf 100 Zeichen", () => {
  reset();
  const card = userCards.add({
    de: "d".repeat(600), es: "e".repeat(600), tip: "t".repeat(600),
    cat: "c".repeat(200), lvl: 2,
  });
  assert.equal(card.de.length, 500, "de auf 500 gekappt");
  assert.equal(card.es.length, 500, "es auf 500 gekappt");
  assert.equal(card.tip.length, 500, "tip auf 500 gekappt");
  assert.equal(card.cat.length, 100, "cat auf 100 gekappt");
  assert.equal(card.lvl, 2);
  assert.equal(card.custom, true);
});

test("add(): trimmt Whitespace vor dem Kappen", () => {
  reset();
  const card = userCards.add({ de: "  Hallo  ", es: "\tHola\n", cat: "alltag" });
  assert.equal(card.de, "Hallo");
  assert.equal(card.es, "Hola");
});

test("add(): eine zu lange Karte überlebt den loadUserCards-Round-Trip unverändert", () => {
  reset();
  const added = userCards.add({ de: "x".repeat(900), es: "y".repeat(900), cat: "alltag" });
  // Genau das, was add gespeichert hat, muss der Loader wieder akzeptieren –
  // sonst klafft eine Lücke zwischen „in der Sitzung gezeigt" und „nach Reload da".
  const reloaded = store.loadUserCards();
  const match = reloaded.find((c) => c.id === added.id);
  assert.ok(match, "gekappte Karte übersteht den Reload (wird NICHT verworfen)");
  assert.equal(match.de, added.de);
  assert.equal(match.es, added.es);
});

test("remove(): entfernt die Karte aus list() und Persistenz", () => {
  reset();
  const a = userCards.add({ de: "Auto", es: "coche", cat: "alltag" });
  const b = userCards.add({ de: "Haus", es: "casa", cat: "alltag" });
  userCards.remove(a.id);
  const ids = userCards.list().map((c) => c.id);
  assert.ok(!ids.includes(a.id), "entfernte Karte weg");
  assert.ok(ids.includes(b.id), "andere Karte bleibt");
  assert.ok(!store.loadUserCards().some((c) => c.id === a.id), "auch aus Persistenz weg");
});

test("validate(): leere Pflichtfelder ergeben Fehler (leeres Array = gültig)", () => {
  reset();
  assert.ok(userCards.validate({ de: "", es: "x" }).length > 0, "leeres de -> Fehler");
  assert.ok(userCards.validate({ de: "x", es: "" }).length > 0, "leeres es -> Fehler");
  assert.equal(userCards.validate({ de: "Hallo", es: "Hola" }).length, 0, "beide gefüllt -> keine Fehler");
});
