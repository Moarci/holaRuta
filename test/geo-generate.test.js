/*
 * geo-generate.test.js – Tests für scripts/geo/generate.mjs, insbesondere
 * loadManifestPages(): liest das bereits geschriebene seo/geo-manifest.json
 * statt es erneut zu bauen, WENN die Locale-Menge exakt passt - sonst
 * Fallback auf buildManifest(). Vermeidet, dass build.js's drei Kindprozesse
 * (generate/prerender/verify) data.js+countries.js+data.locals.js dreimal
 * neu parsen.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const MANIFEST_PATH = path.join(__dirname, "..", "seo", "geo-manifest.json");

test("loadManifestPages: liest das Manifest von der Platte, wenn Locales exakt passen", async () => {
  const { generateAll, loadManifestPages } = await import("../scripts/geo/generate.mjs");
  generateAll(["de", "en", "es"]);
  assert.ok(fs.existsSync(MANIFEST_PATH), "seo/geo-manifest.json sollte existieren");

  const fromDisk = loadManifestPages(["de", "en", "es"]);
  const onDiskRaw = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  assert.equal(fromDisk.length, onDiskRaw.length);
  assert.deepEqual(fromDisk, onDiskRaw, "loadManifestPages sollte exakt den Datei-Inhalt liefern (kein Neu-Bau)");
});

test("loadManifestPages: baut frisch, wenn die angeforderten Locales nicht zur Datei passen", async () => {
  const { buildManifest, loadManifestPages } = await import("../scripts/geo/generate.mjs");
  // Datei deckt de+en+es ab (voriger Test) - hier wird NUR "de" angefordert.
  const onlyDe = loadManifestPages(["de"]);
  const expected = buildManifest(["de"]);
  assert.equal(onlyDe.length, expected.length);
  assert.ok(onlyDe.every((p) => p.locale === "de"), "sollte ausschließlich DE-Seiten liefern, nicht das volle Datei-Manifest");
});

test("loadManifestPages: fällt bei fehlendem Manifest auf buildManifest() zurück", async () => {
  const { loadManifestPages, buildManifest } = await import("../scripts/geo/generate.mjs");
  // Direkt lesen statt existsSync-dann-read (vermeidet die TOCTOU-Race, die CodeQL
  // js/file-system-race meldet): fehlt die Datei, liefert der catch null.
  let backup = null;
  try { backup = fs.readFileSync(MANIFEST_PATH, "utf8"); } catch (e) { backup = null; }
  try {
    fs.rmSync(MANIFEST_PATH, { force: true });
    const pages = loadManifestPages(["de", "en", "es"]);
    const expected = buildManifest(["de", "en", "es"]);
    assert.equal(pages.length, expected.length);
  } finally {
    if (backup != null) fs.writeFileSync(MANIFEST_PATH, backup, "utf8");
  }
});
