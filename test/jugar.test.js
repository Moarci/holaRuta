/*
 * jugar.test.js – „¡A jugar en inglés!" (SC.jugar): die kindgerechten Zwei-Spieler-
 * Spiele für das lokale, offline Pass-and-play (kein Netz, keine Fremden).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "jugar.js"));
const { jugar } = window.SC;

test("Inhalt: SC.jugar hat mehrere Spiele mit sauberen Zügen", () => {
  assert.ok(jugar && Array.isArray(jugar.GAMES) && jugar.GAMES.length >= 3, "genug Spiele");
  const ids = new Set();
  for (const g of jugar.GAMES) {
    assert.ok(g.id && !ids.has(g.id), `Spiel-Id eindeutig: ${g.id}`);
    ids.add(g.id);
    assert.ok(g.title && g.title.es && g.title.en, `${g.id}: title es/en`);
    assert.ok(g.howto && g.howto.es && g.howto.en, `${g.id}: howto es/en`);
    assert.ok(Array.isArray(g.turns) && g.turns.length >= 2, `${g.id}: hat Züge`);
    for (const tn of g.turns) {
      assert.ok(tn.who === "A" || tn.who === "B", `${g.id}: who ist A|B`);
      assert.ok(tn.prompt && tn.prompt.es, `${g.id}: prompt.es (Anweisung Muttersprache)`);
      assert.ok(tn.say && tn.say.length, `${g.id}: say (englischer Modellsatz)`);
    }
  }
});

test("Pass-and-play: die Züge wechseln zwischen zwei Spielern", () => {
  for (const g of jugar.GAMES) {
    const whos = new Set(g.turns.map((t) => t.who));
    assert.ok(whos.has("A") && whos.has("B"), `${g.id}: beide Spieler kommen dran`);
  }
});
