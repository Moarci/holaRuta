/*
 * bundle.test.js – Sichert die Bundle-Funktion (Modo profe): ein teilbarer Code,
 * der beim Lernenden MEHRERE Aufgaben auf einmal abonniert.
 *
 *  - store.encodeBundle/decodeBundle: Round-Trip, Tag-Validierung, Item-Deckel
 *  - Abgrenzung zu Einzel-Aufgaben (HRT1 ≠ HRB1, keine Verwechslung)
 *  - JEDES vordefinierte data.BUNDLES-Item zeigt auf existierende Inhalte
 *    (sonst würde es beim Abonnieren kommentarlos übersprungen)
 *
 * Reine Daten/Logik – kein Browser, kein DOM nötig.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// window- und localStorage-Shim (Module sind Browser-IIFEs).
globalThis.window = globalThis.window || {};
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};
// btoa/atob für die UTF-8-sichere Base64-Kodierung in store.js.
globalThis.btoa = globalThis.btoa || ((s) => Buffer.from(s, "binary").toString("base64"));
globalThis.atob = globalThis.atob || ((b) => Buffer.from(b, "base64").toString("binary"));

const SRC = path.join(__dirname, "..");
require(path.join(SRC, "data.js"));
require(path.join(SRC, "store.js"));
const { store, data } = globalThis.window.SC;

// Verweist ein Bundle-Item auf existierende Inhalte? (1:1 zu app.js taskTargetExists)
function targetExists(it) {
  if (!it || !it.scope) return false;
  if (it.kind === "preset") return (data.PRESETS || []).some((p) => p.id === it.scope);
  if (it.kind === "pretrip") return (data.PRETRIP || []).some((p) => p.scope === it.scope);
  return (data.CATEGORIES || []).some((c) => c.id === it.scope);
}

test("encodeBundle/decodeBundle: Round-Trip mit Titel & Frist", () => {
  const code = store.encodeBundle({
    items: [{ kind: "pretrip", scope: "colombia" }, { kind: "preset", scope: "prearrival-co" }, { kind: "category", scope: "notfall" }],
    title: "Vorbereitung Kolumbien", due: "2026-07-01",
  });
  assert.equal(code.indexOf("HRB1."), 0, "Bundle-Code muss mit HRB1. beginnen");
  const dec = store.decodeBundle(code);
  assert.equal(dec.items.length, 3);
  assert.deepEqual(dec.items[0], { kind: "pretrip", scope: "colombia" });
  assert.equal(dec.title, "Vorbereitung Kolumbien");
  assert.equal(dec.due, "2026-07-01");
});

test("encodeBundle: ungültige Items werden verworfen, leeres Bundle -> ''", () => {
  const code = store.encodeBundle({ items: [{ kind: "bogus", scope: "x" }, { kind: "category", scope: "" }] });
  assert.equal(code, "", "nur ungültige Items -> kein Code");
  const ok = store.decodeBundle(store.encodeBundle({ items: [{ kind: "category", scope: "notfall" }, { kind: "bogus", scope: "x" }] }));
  assert.equal(ok.items.length, 1, "gültige Items bleiben, ungültige fallen raus");
});

test("Bundle und Einzel-Aufgabe sind nicht verwechselbar", () => {
  const taskCode = store.encodeTask({ kind: "category", scope: "notfall" });
  const bundleCode = store.encodeBundle({ items: [{ kind: "category", scope: "notfall" }] });
  assert.equal(store.decodeBundle(taskCode), null, "Einzel-Code ist kein Bundle");
  assert.equal(store.decodeTask(bundleCode), null, "Bundle-Code ist keine Einzel-Aufgabe");
});

test("decodeBundle: Müll/Fremdtext -> null", () => {
  assert.equal(store.decodeBundle(""), null);
  assert.equal(store.decodeBundle("kein-code"), null);
  assert.equal(store.decodeBundle("HRB1.@@@"), null);
});

test("data.BUNDLES: jedes Bundle ist gültig und zeigt auf existierende Inhalte", () => {
  assert.ok(Array.isArray(data.BUNDLES) && data.BUNDLES.length > 0, "BUNDLES fehlen");
  // Muss mit den Gruppen im Picker übereinstimmen (ui.js BUNDLE_GROUPS).
  const KNOWN_GROUPS = ["destino", "kurs", "situation", "orga"];
  const seen = new Set();
  for (const b of data.BUNDLES) {
    assert.ok(b.id && !seen.has(b.id), `Bundle-Id fehlt oder doppelt: ${b.id}`);
    seen.add(b.id);
    assert.ok(b.label && b.labelEn, `Bundle ${b.id}: label/labelEn fehlt`);
    assert.ok(KNOWN_GROUPS.indexOf(b.group) >= 0, `Bundle ${b.id}: unbekannte Gruppe „${b.group}"`);
    assert.ok(Array.isArray(b.items) && b.items.length >= 2, `Bundle ${b.id}: braucht ≥2 Ziele`);
    for (const it of b.items) {
      assert.ok(targetExists(it), `Bundle ${b.id}: Ziel ${it.kind}:${it.scope} existiert nicht`);
    }
    // Muss als Code kodierbar UND wieder dekodierbar sein.
    const dec = store.decodeBundle(store.encodeBundle({ items: b.items }));
    assert.equal(dec.items.length, b.items.length, `Bundle ${b.id}: Round-Trip verliert Items`);
  }
  // Jede Picker-Gruppe sollte auch tatsächlich Bundles enthalten (kein leerer Abschnitt).
  for (const g of KNOWN_GROUPS) {
    assert.ok(data.BUNDLES.some((b) => b.group === g), `Bundle-Gruppe „${g}" ist leer`);
  }
});
