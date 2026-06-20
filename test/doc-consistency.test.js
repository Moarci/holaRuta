/*
 * doc-consistency.test.js – Wächter gegen Doku-Drift.
 *
 * Hält die in CONTRIBUTING.md dokumentierte Invariante maschinell aufrecht:
 *   - package.json-Version == changelog.VERSION (= entries[0].version)
 *   - README-Headerversion == changelog.VERSION
 *   - die in der README genannten Test-Zahlen (Badge, Beispiel-Ausgabe,
 *     Projektstatus-Tabelle) == tatsächliche Zahl der test()-Fälle
 *   - die in der README genannte Test-Datei-Anzahl == tatsächliche *.test.js
 *
 * So kann die README nie wieder still gegenüber dem Code veralten (genau der
 * Drift, der package=1.96 / README=v1.89 / Badge=215 verursacht hatte).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

// changelog.js als Browser-IIFE laden (Quelle der Wahrheit für die Version).
globalThis.window = globalThis.window || {};
const SRC = path.join(__dirname, "..");
require(path.join(SRC, "changelog.js"));
const { VERSION } = globalThis.window.SC.changelog;

// data.js als Browser-IIFE laden (Quelle der Wahrheit für Karten-/Kategorienzahl).
require(path.join(SRC, "data.js"));
const DATA = globalThis.window.SC.data;

const readme = fs.readFileSync(path.join(SRC, "README.md"), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(SRC, "package.json"), "utf8"));

// Zählt alle test()-Fälle (eine Aufruf-Zeile = ein Fall; keine Subtests/describe
// im Projekt) über alle Test-Dateien – inkl. dieser hier.
function listTestFiles() {
  return fs.readdirSync(path.join(SRC, "test")).filter((f) => f.endsWith(".test.js"));
}
function countTests() {
  let n = 0;
  for (const f of listTestFiles()) {
    const src = fs.readFileSync(path.join(SRC, "test", f), "utf8");
    for (const line of src.split("\n")) if (/^\s*test\(/.test(line)) n++;
  }
  return n;
}

test("Version: package.json == changelog.VERSION", () => {
  assert.equal(pkg.version, VERSION, "package.json-Version weicht von changelog.VERSION ab");
});

test("Version: README-Header == changelog.VERSION", () => {
  const m = readme.match(/\*\*v(\d+\.\d+\.\d+)\*\*/);
  assert.ok(m, "README: Headerversion (**vX.Y.Z**) nicht gefunden");
  assert.equal(m[1], VERSION, "README-Headerversion weicht von changelog.VERSION ab");
});

test("Test-Zahlen: README-Badge/Beispiel/Tabelle == echte Anzahl test()", () => {
  const n = countTests();
  const nums = {
    Badge: readme.match(/Tests-(\d+)_passing/),
    "tests-Beispiel": readme.match(/ℹ tests (\d+)/),
    "pass-Beispiel": readme.match(/ℹ pass (\d+)/),
    "Projektstatus-Tabelle": readme.match(/\|\s*Tests\s*\|\s*(\d+)/),
  };
  for (const [label, m] of Object.entries(nums)) {
    assert.ok(m, `README: Test-Zahl (${label}) nicht gefunden`);
    assert.equal(Number(m[1]), n, `README ${label} (${m[1]}) ≠ echte Test-Anzahl (${n})`);
  }
});

test("Karten-Anzahl: README-Projektstatus == data.CARDS.length", () => {
  assert.ok(Array.isArray(DATA && DATA.CARDS), "data.js: SC.data.CARDS nicht als Array gefunden");
  const real = DATA.CARDS.length;
  const m = readme.match(/\|\s*Karten\s*\|\s*(\d+)\s*\|/);
  assert.ok(m, "README: Projektstatus-Zeile (| Karten | N |) nicht gefunden");
  assert.equal(Number(m[1]), real, `README Karten (${m[1]}) ≠ echte data.CARDS.length (${real})`);
});

test("Kategorien-Anzahl: README == data.CATEGORIES.length", () => {
  assert.ok(Array.isArray(DATA && DATA.CATEGORIES), "data.js: SC.data.CATEGORIES nicht als Array gefunden");
  const real = DATA.CATEGORIES.length;
  // (a) Projektstatus-Tabelle: | Bereiche / Kategorien | N |
  const mTab = readme.match(/\|\s*Bereiche\s*\/\s*Kategorien\s*\|\s*(\d+)\s*\|/);
  assert.ok(mTab, "README: Projektstatus-Zeile (| Bereiche / Kategorien | N |) nicht gefunden");
  assert.equal(Number(mTab[1]), real, `README Bereiche/Kategorien (${mTab[1]}) ≠ echte data.CATEGORIES.length (${real})`);
  // (b) Datenmodell-Tabelle: Kategorie-Id (eine von N)  → verhindert den 71/72-Drift
  const mInline = readme.match(/Kategorie-Id \(eine von (\d+)\)/);
  assert.ok(mInline, "README: „Kategorie-Id (eine von N)\" nicht gefunden");
  assert.equal(Number(mInline[1]), real, `README „eine von ${mInline[1]}\" ≠ echte data.CATEGORIES.length (${real})`);
});

test("Test-Datei-Anzahl: README == echte *.test.js", () => {
  const files = listTestFiles().length;
  const m = readme.match(/Tests in (\d+) Dateien/);
  assert.ok(m, "README: Test-Datei-Anzahl (… Tests in N Dateien) nicht gefunden");
  assert.equal(Number(m[1]), files, `README (${m[1]}) ≠ echte Test-Dateien (${files})`);
});
