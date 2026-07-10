/*
 * locals-lazy.test.js – Drift-Wächter für das Track-basierte Laden des
 * Locals-Korpus (locals-loader.js). Nutzt den in Node eingebauten Test-Runner.
 *
 * Aufruf:  node --test
 *
 * Abgesichert wird die Verdrahtung, nicht die Laufzeit (die prüft
 * scripts/e2e/suites/p0-boot-verify.mjs im echten Browser):
 *   1. index.html lädt die drei Korpus-Dateien NICHT mehr statisch – nur noch
 *      der Loader-Tag (ohne defer) steht zwischen data.js und context.js.
 *   2. registry.js/config.js laufen ohne defer (der Loader braucht SC.track
 *      bereits zur Parse-Zeit).
 *   3. Loader und build.js-Special-Case nennen exakt dieselben Dateien
 *      (sonst driftet der Single-File-Build still auseinander).
 *   4. Alle drei Dateien + der Loader bleiben im SW-Precache (Offline-Wechsel
 *      per ?edition=ingles-pro muss funktionieren).
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

const LOCALS_FILES = ["i18n.strings.es.js", "data.locals.js", "contextdata.locals.js"];

// Alle <script>-Tags aus index.html mit src + defer-Flag.
function scriptTags() {
  const html = read("index.html");
  return [...html.matchAll(/<script([^>]*)\bsrc=["']([^"']+)["']([^>]*)>/g)]
    .map((m) => ({ src: m[2].replace(/^\.\//, ""), defer: /\bdefer\b/.test(m[1] + m[3]) }));
}

test("locals-lazy: index.html lädt den Locals-Korpus nicht mehr statisch", () => {
  const srcs = scriptTags().map((t) => t.src);
  for (const f of LOCALS_FILES) {
    assert.ok(!srcs.includes(f), `index.html lädt "${f}" noch als <script>-Tag – gehört in locals-loader.js`);
  }
});

test("locals-lazy: Loader-Tag vorhanden, ohne defer, zwischen data.js und context.js", () => {
  const tags = scriptTags();
  const idx = (src) => tags.findIndex((t) => t.src === src);
  const loader = tags[idx("locals-loader.js")];
  assert.ok(loader, "index.html: <script src=\"locals-loader.js\"> fehlt");
  assert.ok(!loader.defer, "locals-loader.js darf KEIN defer tragen (muss parser-blockend schreiben)");
  assert.ok(idx("data.js") < idx("locals-loader.js"), "locals-loader.js muss NACH data.js stehen");
  assert.ok(idx("locals-loader.js") < idx("context.js"), "locals-loader.js muss VOR context.js stehen (attach braucht den Locals-Kontext)");
});

test("locals-lazy: registry.js/config.js ohne defer (SC.track zur Parse-Zeit)", () => {
  const tags = scriptTags();
  for (const src of ["editions/registry.js", "config.js"]) {
    const tag = tags.find((t) => t.src === src);
    assert.ok(tag, `index.html: <script src="${src}"> fehlt`);
    assert.ok(!tag.defer, `"${src}" darf KEIN defer tragen – locals-loader.js braucht SC.track beim Parsen`);
  }
});

test("locals-lazy: Loader und build.js-Special-Case nennen dieselben Dateien", () => {
  // Loader: document.write('<script defer src="…">…')
  const loader = read("locals-loader.js");
  const written = [...loader.matchAll(/document\.write\('<script defer src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(written, LOCALS_FILES, "locals-loader.js schreibt andere Dateien als erwartet");

  // build.js: das Array im locals-loader-Special-Case.
  const build = read("build.js");
  const m = build.match(/locals-loader\\\.js[^]*?\[([^\]]+)\]/);
  assert.ok(m, "build.js: locals-loader-Special-Case (Datei-Array) nicht gefunden");
  const embedded = [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
  assert.deepEqual(embedded, written, "build.js bettet andere Dateien ein als der Loader schreibt");
});

test("locals-lazy: Loader + Korpus-Dateien bleiben im SW-Precache (Offline)", () => {
  const sw = read("service-worker.js");
  const m = sw.match(/const ASSETS\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(m, "service-worker.js: ASSETS-Liste nicht gefunden");
  const assets = [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1].replace(/^\.\//, ""));
  for (const f of ["locals-loader.js", ...LOCALS_FILES]) {
    assert.ok(assets.includes(f), `service-worker.js ASSETS: "${f}" fehlt`);
  }
});
