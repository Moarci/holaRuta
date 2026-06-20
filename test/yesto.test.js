/*
 * yesto.test.js – Tests des „¿Y esto?“-Bild-Vokabel-Moduls (SC.yesto).
 * Reine Daten + reine Funktionen, kein Browser nötig – window-Shim wie conjug.test.js.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = {};
require(path.join(__dirname, "..", "yesto.js"));
const { yesto } = globalThis.window.SC;

test("themeList: liefert jedes Thema mit Icon, Label und Motiv-Anzahl", () => {
  const list = yesto.themeList();
  assert.equal(list.length, yesto.THEMES.length);
  list.forEach((th) => {
    assert.ok(th.id && th.icon && th.label, `Themen-Felder fehlen: ${th.id}`);
    assert.equal(th.count, yesto.themeById(th.id).items.length);
  });
});

test("themeById: bekanntes Thema kommt, unbekanntes ist null", () => {
  assert.ok(yesto.themeById("comida"));
  assert.equal(yesto.themeById("gibtsnicht"), null);
});

test("THEMES: eindeutige Theme-IDs, je Thema ≥ 8 Motive", () => {
  const ids = yesto.THEMES.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, "doppelte Theme-IDs");
  yesto.THEMES.forEach((t) => {
    assert.ok(t.items.length >= 8, `Thema ${t.id} hat nur ${t.items.length} Motive (mind. 8)`);
  });
});

test("THEMES: jedes Motiv hat Emoji, es (mit Artikel), de und en", () => {
  yesto.THEMES.forEach((t) => {
    const seen = new Set();
    t.items.forEach((it) => {
      assert.ok(it.emoji && it.es && it.de && it.en, `Motiv-Felder fehlen in ${t.id}: ${JSON.stringify(it)}`);
      assert.match(it.es, /^(el|la|los|las) /, `es ohne Artikel in ${t.id}: ${it.es}`);
      assert.ok(!seen.has(it.es), `Dublette in ${t.id}: ${it.es}`);
      seen.add(it.es);
    });
  });
});

test("buildRound: genau count Items, ohne Wiederholung, mit vollständigen Feldern", () => {
  const round = yesto.buildRound("comida", 8);
  assert.equal(round.length, 8);
  const seen = new Set();
  round.forEach((it) => {
    assert.ok(it.emoji && it.es && it.de && it.en);
    assert.ok(!seen.has(it.es), `Wiederholung: ${it.es}`);
    seen.add(it.es);
  });
});

test("buildRound: count über Themengröße wird auf die vorhandenen Motive begrenzt", () => {
  const th = yesto.themeById("bebidas");
  const round = yesto.buildRound("bebidas", 999);
  assert.equal(round.length, th.items.length);
  assert.equal(new Set(round.map((it) => it.es)).size, th.items.length, "keine Wiederholung trotz großer Anforderung");
});

test("buildRound: nur Motive des gewählten Themas erscheinen", () => {
  const allowed = new Set(yesto.themeById("animales").items.map((it) => it.es));
  yesto.buildRound("animales", 8).forEach((it) => assert.ok(allowed.has(it.es), `fremdes Motiv: ${it.es}`));
});

test("buildRound: unbekanntes/leeres Thema ergibt eine leere Runde (kein Crash)", () => {
  assert.deepEqual(yesto.buildRound("gibtsnicht", 8), []);
  assert.deepEqual(yesto.buildRound(null, 8), []);
});

test("shuffle: liefert eine Kopie mit denselben Elementen (Quelle unberührt)", () => {
  const src = [1, 2, 3, 4, 5];
  const out = yesto.shuffle(src);
  assert.notEqual(out, src, "soll eine neue Liste sein");
  assert.deepEqual(out.slice().sort(), src.slice().sort());
  assert.deepEqual(src, [1, 2, 3, 4, 5], "Quelle bleibt unverändert");
});
