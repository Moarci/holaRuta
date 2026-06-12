/*
 * sw-assets.test.js – Drift-Wächter für den Service-Worker-Precache (R2/R12).
 * Nutzt den in Node eingebauten Test-Runner – KEINE Dependencies.
 *
 * Aufruf:  node --test
 *
 * Prüft, dass jede lokal referenzierte Datei (index.html: script/link,
 * styles.css: url(), manifest.webmanifest: icons) in der ASSETS-Liste des
 * Service Workers steht – und dass jedes ASSETS-Element auch wirklich
 * existiert. So kann der Precache nie wieder unbemerkt driften.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

// "./foo" und "foo" meinen dieselbe Datei relativ zur App-Wurzel.
const normalize = (p) => p.replace(/^\.\//, "");
// Externe URLs (https://, http://, protokoll-relativ, data:) sind nicht Sache des Precache.
const isLocal = (p) => !/^(https?:)?\/\//i.test(p) && !/^data:/i.test(p);

// ---------- ASSETS aus service-worker.js ziehen ----------
function swAssets() {
  const sw = read("service-worker.js");
  const m = sw.match(/const ASSETS\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(m, "service-worker.js: ASSETS-Liste nicht gefunden");
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => normalize(x[1]));
}

// ---------- lokale Referenzen aus index.html ziehen ----------
function htmlRefs() {
  const html = read("index.html");
  const refs = [];
  for (const m of html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/g)) refs.push(m[1]);
  for (const m of html.matchAll(/<link\b[^>]*>/g)) {
    const tag = m[0];
    const rel = (tag.match(/\brel=["']([^"']+)["']/) || [])[1] || "";
    const href = (tag.match(/\bhref=["']([^"']+)["']/) || [])[1];
    if (href && /stylesheet|manifest|icon/.test(rel)) refs.push(href);
  }
  return refs.filter(isLocal).map(normalize);
}

// ---------- lokale url()-Referenzen aus styles.css (Fonts) ----------
function cssRefs() {
  const css = read("styles.css");
  return [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]
    .map((m) => m[1])
    .filter(isLocal)
    .map(normalize);
}

// ---------- Icon-Referenzen aus manifest.webmanifest ----------
function manifestRefs() {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  return (manifest.icons || []).map((i) => i.src).filter(isLocal).map(normalize);
}

const assets = swAssets();
const assetSet = new Set(assets);

test("SW-Precache: jede lokale Referenz aus index.html steht in ASSETS", () => {
  const refs = htmlRefs();
  assert.ok(refs.length >= 15, `unplausibel wenige Referenzen geparst (${refs.length})`);
  for (const ref of refs) {
    assert.ok(assetSet.has(ref), `index.html referenziert "${ref}", fehlt in service-worker.js ASSETS`);
  }
});

test("SW-Precache: jede lokale url()-Referenz aus styles.css steht in ASSETS", () => {
  for (const ref of cssRefs()) {
    assert.ok(assetSet.has(ref), `styles.css referenziert "${ref}", fehlt in service-worker.js ASSETS`);
  }
});

test("SW-Precache: jedes Manifest-Icon steht in ASSETS", () => {
  for (const ref of manifestRefs()) {
    assert.ok(assetSet.has(ref), `manifest.webmanifest referenziert "${ref}", fehlt in service-worker.js ASSETS`);
  }
});

test("SW-Precache: jedes ASSETS-Element existiert als Datei (keine Tippfehler)", () => {
  for (const a of assets) {
    if (a === "") continue; // "./" = App-Shell-Navigation, keine Datei
    assert.ok(fs.existsSync(path.join(SRC, a)), `ASSETS-Eintrag "${a}" existiert nicht im Repo`);
  }
});

test("index.html: keine externen Font-/Style-Quellen mehr (Fonts self-hosted)", () => {
  const html = read("index.html");
  assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html), "index.html lädt noch Google Fonts");
});
