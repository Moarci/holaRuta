/*
 * frases.test.js – Integrität des Satzbaukasten-Datenmoduls + die neuen
 * Badge-Metriken (Hören, Precios, Frases, Ruta del día). KEINE Dependencies.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = {};
const SRC = path.join(__dirname, "..");
require(path.join(SRC, "contextdata.js"));
require(path.join(SRC, "data.js"));
require(path.join(SRC, "numbers.js"));
require(path.join(SRC, "context.js"));
require(path.join(SRC, "frases.js"));
require(path.join(SRC, "srs.js"));
require(path.join(SRC, "matcher.js"));
require(path.join(SRC, "stats.js"));
require(path.join(SRC, "badges.js"));

const { frases, badges, data, matcher } = globalThis.window.SC;

// ---------- frases-Datenbasis ----------
test("frases.FRASES: vorhanden, IDs eindeutig", () => {
  assert.ok(Array.isArray(frases.FRASES) && frases.FRASES.length >= 6);
  const ids = frases.FRASES.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("frases.FRASES: jedes Frame hat Lücke, Zielsatz, slot + ≥2 Ablenker", () => {
  frases.FRASES.forEach((f) => {
    assert.ok(/_{2,}/.test(f.frameEs), `frameEs ohne Lücke: ${f.id}`);
    assert.ok(f.targetDe && f.targetDe.length > 0, `targetDe fehlt: ${f.id}`);
    assert.ok(f.slot && f.slot.es && f.slot.de, `slot unvollständig: ${f.id}`);
    assert.ok(Array.isArray(f.distractors) && f.distractors.length >= 2, `zu wenige Ablenker: ${f.id}`);
    f.distractors.forEach((d) => assert.ok(d.es && d.de, `Ablenker unvollständig: ${f.id}`));
  });
});

test("frases.FRASES: Lösung ist innerhalb des Frames eindeutig (kein Ablenker = slot)", () => {
  frases.FRASES.forEach((f) => {
    const all = [f.slot].concat(f.distractors).map((o) => matcher.normalize(o.es));
    assert.equal(new Set(all).size, all.length, `doppelter Baustein in ${f.id}`);
  });
});

// ---------- Themen (FRASES_SETS) ----------
test("frases.FRASES_SETS: vorhanden, IDs eindeutig, Felder vollständig", () => {
  assert.ok(Array.isArray(frases.FRASES_SETS) && frases.FRASES_SETS.length >= 5);
  const ids = frases.FRASES_SETS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "doppelte Themen-Id");
  frases.FRASES_SETS.forEach((s) => {
    assert.ok(s.id && s.label && s.icon && s.intro, `Thema unvollständig: ${s.id}`);
    assert.ok(typeof s.lvl === "number", `lvl fehlt/keine Zahl: ${s.id}`);
  });
  // "all" ist eine virtuelle Controller-Id und darf KEIN echtes Thema sein.
  assert.ok(!ids.includes("all"), "Themen-Id 'all' kollidiert mit Gemischt-Modus");
});

test("frases.FRASES: jedes Frame verweist über cat auf ein bekanntes Thema", () => {
  const setIds = new Set(frases.FRASES_SETS.map((s) => s.id));
  frases.FRASES.forEach((f) => {
    assert.ok(f.cat && setIds.has(f.cat), `unbekanntes Thema in ${f.id}: ${f.cat}`);
  });
});

test("frases.FRASES: jedes Thema hat mindestens 3 Rahmen", () => {
  frases.FRASES_SETS.forEach((s) => {
    const n = frases.FRASES.filter((f) => f.cat === s.id).length;
    assert.ok(n >= 3, `Thema ${s.id} hat nur ${n} Rahmen`);
  });
});

// ---------- neue Badge-Metriken ----------
test("badges.buildMetrics: neue Zähler werden korrekt abgeleitet", () => {
  const counters = {
    listenReviews: 30, preciosPlayed: 4, preciosPerfect: 2,
    frasesPlayed: 3, frasesPerfect: 1,
    rutaDays: { "2026-06-11": true, "2026-06-12": true },
  };
  const m = badges.buildMetrics(data.CARDS, {}, counters);
  assert.equal(m.listenReviews, 30);
  assert.equal(m.preciosPlayed, 4);
  assert.equal(m.preciosPerfect, 2);
  assert.equal(m.frasesPlayed, 3);
  assert.equal(m.frasesPerfect, 1);
  assert.equal(m.rutaDays, 2); // distinkte Tage
});

test("badges.buildMetrics: distinkt abgeschlossene Frases-Themen", () => {
  const m = badges.buildMetrics(data.CARDS, {}, {
    frasesThemesDone: { transporte: true, comida: true, social: true },
  });
  assert.equal(m.frasesThemesCompleted, 3);
});

test("badges: frases_themes erfüllt, sobald jedes Thema gespielt wurde", () => {
  const done = {};
  frases.FRASES_SETS.forEach((s) => { done[s.id] = true; });
  const m = badges.buildMetrics(data.CARDS, {}, { frasesThemesDone: done });
  assert.ok(badges.satisfiedIds(m).includes("frases_themes"),
    "frases_themes muss bei allen gespielten Themen erfüllt sein");
  // Mit einem Thema weniger darf der Badge NICHT erfüllt sein.
  const less = badges.buildMetrics(data.CARDS, {}, { frasesThemesDone: { transporte: true } });
  assert.ok(!badges.satisfiedIds(less).includes("frases_themes"));
});

test("badges: neue Badges schalten an ihren Schwellen frei", () => {
  const m = badges.buildMetrics(data.CARDS, {}, {
    listenReviews: 25, preciosPlayed: 1, frasesPlayed: 1, rutaDays: { d: true },
  });
  const ids = badges.satisfiedIds(m);
  ["listen_first", "listen_25", "precios_first", "frases_first", "ruta_dia_first"].forEach((id) => {
    assert.ok(ids.includes(id), `Badge nicht erfüllt: ${id}`);
  });
  // Schwellen, die NICHT erreicht sind:
  assert.ok(!ids.includes("ruta_dia_7"), "ruta_dia_7 darf bei 1 Tag nicht erfüllt sein");
});
