/*
 * search.test.js – Tests für den Such-Kern (SC.search). REINE FUNKTIONEN, kein DOM.
 *  - normalize/haystack: Akzent- & Schreibweisen-Toleranz, verschachtelte Teile
 *  - tokenize/score: UND-Verknüpfung, Titel-Anfangstreffer-Bonus, „nicht gefunden"
 *  - rank: beste zuerst, stabil bei Gleichstand, leerer Query -> keine Treffer
 *
 * Regressions-Wache: ein Titel-Anfangstreffer liefert bewusst eine NEGATIVE
 * Punktzahl. Würde man „nicht gefunden" mit 0/negativ statt Infinity signalisieren
 * (oder Treffer mit `score >= 0` filtern), fielen genau die besten Treffer raus
 * (z. B. „hola" → „Hola"). Diese Tests halten das fest.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "search.js"));
const { search } = globalThis.window.SC;

// ---------- normalize ----------
test("search.normalize: klein + akzentfrei (nino=niño, mexico=México)", () => {
  assert.equal(search.normalize("Niño"), "nino");
  assert.equal(search.normalize("México"), "mexico");
  assert.equal(search.normalize("ESpañol"), "espanol");
  assert.equal(search.normalize(null), "");
  assert.equal(search.normalize(undefined), "");
});

// ---------- haystack ----------
test("search.haystack: verschachtelte Teile zusammenziehen, Leeres fällt weg", () => {
  const hay = search.haystack(["Hola", null, ["", "Adiós", ["Buenos días"]], undefined]);
  assert.equal(hay, "hola adios buenos dias");
});

test("search.haystack: normalisiert das Ergebnis (Akzente weg)", () => {
  assert.ok(search.haystack(["Café con leche"]).includes("cafe con leche"));
});

// ---------- tokenize ----------
test("search.tokenize: Leerzeichen-getrennt, normalisiert, leer wird gefiltert", () => {
  assert.deepEqual(search.tokenize("  Hóla   Múndo "), ["hola", "mundo"]);
  assert.deepEqual(search.tokenize(""), []);
  assert.deepEqual(search.tokenize("   "), []);
});

// ---------- score ----------
test("search.score: alle Tokens müssen vorkommen (UND), sonst Infinity", () => {
  const item = { hay: "hola hallo hello", title: "Hola" };
  assert.ok(Number.isFinite(search.score(item, ["hola"])));
  assert.equal(search.score(item, ["hola", "fehlt"]), Infinity);
  assert.equal(search.score({ hay: "x", title: "x" }, []), Infinity);
});

test("search.score: Titel-Anfangstreffer bekommt NEGATIVEN Bonus (beste Treffer)", () => {
  const startsWith = { hay: "hola hallo", title: "Hola" };
  const contains = { hay: "digo hola al final", title: "Frase" };
  assert.ok(search.score(startsWith, ["hola"]) < 0, "Anfangstreffer ist negativ");
  assert.ok(search.score(contains, ["hola"]) >= 0, "reiner Teiltreffer ist >= 0");
  assert.ok(search.score(startsWith, ["hola"]) < search.score(contains, ["hola"]));
});

// ---------- rank ----------
test("search.rank: matchende Einträge, beste zuerst", () => {
  const items = [
    { id: "a", hay: "muy caro gracias", title: "Muy caro" },
    { id: "b", hay: "gracias", title: "Gracias" },         // Titel-Anfangstreffer
    { id: "c", hay: "buenos dias", title: "Buenos días" }, // kein Treffer
  ];
  const out = search.rank(items, "gracias");
  assert.deepEqual(out.map((x) => x.id), ["b", "a"]);
});

test("search.rank: leerer Query -> keine Treffer", () => {
  const items = [{ id: "a", hay: "hola", title: "Hola" }];
  assert.deepEqual(search.rank(items, ""), []);
  assert.deepEqual(search.rank(items, "   "), []);
});

test("search.rank: stabil bei Gleichstand (Eingabe-Reihenfolge bleibt)", () => {
  const items = [
    { id: "1", hay: "bus uno", title: "uno" },
    { id: "2", hay: "bus dos", title: "dos" },
    { id: "3", hay: "bus tres", title: "tres" },
  ];
  // alle enthalten "bus" an Position 0, keiner als Titel-Anfang -> gleiche Punktzahl
  assert.deepEqual(search.rank(items, "bus").map((x) => x.id), ["1", "2", "3"]);
});

test("search.rank: akzent-/schreibweisentolerant (mexico findet México)", () => {
  const items = [{ id: "mx", hay: search.haystack(["México", "Tacos"]), title: "México" }];
  assert.equal(search.rank(items, "mexico").length, 1);
  assert.equal(search.rank(items, "MEXICO").length, 1);
});
