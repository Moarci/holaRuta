/*
 * swversion.js – Single Source of Truth für den Service-Worker-Cache-Namen.
 *
 * Der Cache-Name (CACHE_VERSION) ist ein INHALTS-HASH über alle precachten
 * Assets. Dadurch ändert er sich AUTOMATISCH, sobald sich irgendeine
 * ausgelieferte Datei ändert – niemand muss mehr von Hand „hochzählen".
 * Genau dieses Hochzählen wurde vergessen, wodurch installierte PWAs alte,
 * gecachte Dateien weiter ausgespielt haben.
 *
 * - build.js stempelt den Wert via stampServiceWorker() in service-worker.js.
 * - test/sw-version.test.js wacht darüber, dass der Stempel zum Asset-Inhalt
 *   passt (sonst schlägt `npm test` fehl -> blockiert den Deploy).
 *
 * Reines Node-Build-/Test-Werkzeug: NICHT von index.html geladen, also auch
 * nicht selbst Teil des Precache.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const SW_FILE = path.join(ROOT, "service-worker.js");
const PREFIX = "holaruta-";

// ASSETS-Liste aus dem Service Worker selbst lesen (eine Quelle der Wahrheit).
// `swFile` erlaubt es, statt der Quell-Datei einen kopierten SW (z. B. in dist/)
// als Quelle der Asset-Liste zu nehmen.
function readAssets(swFile) {
  const sw = fs.readFileSync(swFile || SW_FILE, "utf8");
  const m = sw.match(/const ASSETS\s*=\s*\[([\s\S]*?)\]/);
  if (!m) throw new Error("service-worker.js: ASSETS-Liste nicht gefunden");
  return [...m[1].matchAll(/["']([^"']+)["']/g)]
    .map((x) => x[1].replace(/^\.\//, "")) // "./foo" und "foo" meinen dieselbe Datei
    .filter((p) => p && !/^(https?:)?\/\//i.test(p) && !/^data:/i.test(p));
}

// Inhalts-Hash über alle Asset-Dateien (Pfad + Bytes, stabil sortiert, damit der
// Hash reproduzierbar ist). service-worker.js steht nicht in ASSETS -> kein
// Rückkopplungs-Effekt durch das Stempeln. `baseDir`/`swFile` erlauben es, den
// Hash über die kopierten/minifizierten Assets eines anderen Verzeichnisses
// (z. B. dist/) zu rechnen statt über die Quell-Dateien im Repo-Root.
function computeCacheVersion(baseDir, swFile) {
  const root = baseDir || ROOT;
  const h = crypto.createHash("sha256");
  for (const rel of [...new Set(readAssets(swFile))].sort()) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) continue; // Existenz prüft der sw-assets-Test separat
    h.update(rel + "\0");
    h.update(fs.readFileSync(file)); // Buffer (auch Fonts/PNGs) -> binärsicher
    h.update("\0");
  }
  return PREFIX + h.digest("hex").slice(0, 12);
}

// CACHE_VERSION in service-worker.js auf den aktuellen Hash setzen.
// Ohne Argumente: Quell-SW im Repo-Root über die Quell-Assets stempeln.
// Mit `baseDir` (z. B. "dist"): den dort liegenden service-worker.js über die
// dort liegenden (minifizierten) Assets stempeln. Gibt { changed, version } zurück.
function stampServiceWorker(baseDir) {
  const swFile = baseDir ? path.join(baseDir, "service-worker.js") : SW_FILE;
  const before = fs.readFileSync(swFile, "utf8");
  const version = computeCacheVersion(baseDir, swFile);
  const after = before.replace(/(const CACHE_VERSION\s*=\s*")[^"]*(";)/, `$1${version}$2`);
  if (!/const CACHE_VERSION\s*=\s*"/.test(before)) {
    throw new Error("service-worker.js: CACHE_VERSION-Zeile nicht gefunden");
  }
  if (after !== before) fs.writeFileSync(swFile, after, "utf8");
  return { changed: after !== before, version };
}

module.exports = { computeCacheVersion, stampServiceWorker, readAssets, PREFIX };
