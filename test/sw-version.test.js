/*
 * sw-version.test.js – Wächter gegen einen veralteten Service-Worker-Cache.
 * Nutzt den in Node eingebauten Test-Runner – KEINE Dependencies.
 *
 * Aufruf:  node --test
 *
 * Die CACHE_VERSION in service-worker.js MUSS dem Inhalts-Hash aller precachten
 * Assets entsprechen (siehe swversion.js). Ändert sich eine ausgelieferte Datei,
 * ohne dass neu gestempelt wurde, schlägt dieser Test fehl – und damit der
 * Deploy-Gate (`npm test`). So kann nie wieder ein alter Cache live gehen, der
 * installierten PWAs veraltete Dateien ausspielt.
 *
 * Fix bei Fehlschlag:  node build.js  (stempelt automatisch) und committen.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { computeCacheVersion } = require("../swversion.js");

const SRC = path.join(__dirname, "..");

test("SW-Cache: CACHE_VERSION passt zum Inhalts-Hash der Assets", () => {
  const sw = fs.readFileSync(path.join(SRC, "service-worker.js"), "utf8");
  const m = sw.match(/const CACHE_VERSION\s*=\s*"([^"]+)"/);
  assert.ok(m, "service-worker.js: CACHE_VERSION nicht gefunden");
  assert.equal(
    m[1],
    computeCacheVersion(),
    'CACHE_VERSION ist veraltet — bitte "node build.js" ausführen und committen.'
  );
});
