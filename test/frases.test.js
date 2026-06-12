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
