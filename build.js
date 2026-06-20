/*
 * build.js – Erzeugt die eigenständige Versand-Datei HolaRuta.html
 * aus der modularen Quelle (index.html + styles.css + *.js) UND stempelt den
 * Service-Worker-Cache-Namen (siehe swversion.js).
 *
 * Aufruf:  node build.js
 *
 * Quelle der Wahrheit sind die Module. HolaRuta.html und CACHE_VERSION sind NUR
 * Ergebnisse dieses Skripts und sollten nie von Hand bearbeitet werden.
 *
 * Was passiert:
 *   - <link rel="stylesheet" href="styles.css"> -> Inhalt als <style> eingebettet
 *   - jedes <script src="x.js">                  -> Inhalt als <script> eingebettet
 *   - PWA-Verweise (manifest/icon)               -> entfernt (lösen offline/als Datei nicht auf)
 *   - service-worker.js: CACHE_VERSION           -> auf Inhalts-Hash der Assets gestempelt
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { stampServiceWorker, readAssets } = require("./swversion.js");

const DIR = __dirname;
const SOURCE = "index.html";

// dist/-Modus:  node build.js --dist
// Minifiziert alle Modul-.js + styles.css EINZELN (esbuild) nach dist/, kopiert
// index.html / service-worker.js / Manifeste / Icons / Fonts nach dist/ und
// stempelt den SW-Hash über die MINIFIZIERTEN dist-Assets. So entspricht der
// Live-Deploy (Multi-File) der gewünschten kleineren, gecachten Auslieferung –
// ohne das Verhalten zu ändern (gleiche Dateinamen, gleiche Reihenfolge).
const DIST_MODE = process.argv.includes("--dist");

// Optionaler Co-Branding-Build:  node build.js --edition=ecos  →  HolaRuta-ecos.html
// Die Edition-Datei (editions/<id>.js) wird vor config.js eingebettet; sonst
// identischer Build. Ohne Flag entsteht wie bisher das pure HolaRuta.html.
const editionArg = process.argv.find((a) => a.startsWith("--edition="));
const EDITION = editionArg ? editionArg.split("=")[1].trim() : null;
// Edition-Name validieren: leer oder ungültig (Path-Traversal/Sonderzeichen) bricht
// klar ab, statt still den Default-Build zu überschreiben.
if (editionArg && (!EDITION || !/^[a-z0-9_-]+$/.test(EDITION))) {
  console.error(`✗ Ungültiger Edition-Name: "${EDITION}". Erlaubt sind a–z, 0–9, _ und - (z. B. --edition=ecos).`);
  process.exit(1);
}
const OUTPUT = EDITION ? `HolaRuta-${EDITION}.html` : "HolaRuta.html";

function read(file) {
  return fs.readFileSync(path.join(DIR, file), "utf8");
}

function build() {
  let html = read(SOURCE);
  const inlined = [];

  // 1) PWA-Verweise entfernen (manifest, icon, apple-touch-icon) – inkl. evtl. Kommentarzeile.
  html = html.replace(/^[ \t]*<!--[\s\S]*?Als App installierbar[\s\S]*?-->[ \t]*\r?\n/m, "");
  html = html.replace(/^[ \t]*<link[^>]*rel="(?:manifest|icon|apple-touch-icon)"[^>]*>[ \t]*\r?\n?/gim, "");

  // 2) Lokales Stylesheet einbetten (externe, z.B. Google Fonts, bleiben als Link).
  html = html.replace(/[ \t]*<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi, (m, href) => {
    if (/^https?:\/\//i.test(href)) return m; // externer Link -> unverändert lassen
    inlined.push(href);
    return `<style>\n${read(href)}\n</style>`;
  });

  // 3) Alle externen Skripte einbetten (in Reihenfolge des Vorkommens).
  //    Ein im Code vorkommendes "</script>" würde sonst den eingebetteten Block
  //    vorzeitig schließen -> escapen, damit der HTML-Parser nicht stolpert.
  html = html.replace(/[ \t]*<script[^>]*src="([^"]+)"[^>]*><\/script>/gi, (m, src) => {
    inlined.push(src);
    const code = read(src).replace(/<\/script>/gi, "<\\/script>");
    // Edition-Build: die Edition-Config direkt vor config.js einbetten, damit
    // config.js sie beim Merge sieht (setzt window.SC.editionConfig).
    if (EDITION && src === "config.js") {
      const edFile = path.join("editions", `${EDITION}.js`);
      const edCode = read(edFile).replace(/<\/script>/gi, "<\\/script>");
      inlined.push(edFile);
      return `<script>\n${edCode}\n</script>\n<script>\n${code}\n</script>`;
    }
    return `<script>\n${code}\n</script>`;
  });

  // 4) Hinweis-Kommentar in den <head> setzen.
  const note = `  <!-- EINZELDATEI: CSS + alle Skripte eingebettet. Funktioniert offline per Doppeltipp,\n` +
               `       ohne Server. Erzeugt aus index.html/styles.css/*.js mit "node build.js" –\n` +
               `       nicht von Hand editieren. -->`;
  html = html.replace(/(<title>[^]*?<\/title>)/i, `$1\n${note}`);

  fs.writeFileSync(path.join(DIR, OUTPUT), html, "utf8");
  return inlined;
}

// ---------------------------------------------------------------------------
// dist/-Build (Multi-File, minifiziert) – Live-Auslieferungs-Pfad.
// ---------------------------------------------------------------------------

// esbuild graceful laden: fehlt es (kein Install möglich), kein harter Fehler –
// dann wird roh kopiert (wie E2E ohne Playwright). Gibt das Modul oder null.
function tryLoadEsbuild() {
  try { return require("esbuild"); } catch (e) { return null; }
}

// Eine Datei nach dist/ schreiben (Verzeichnis bei Bedarf anlegen).
function writeDist(distDir, rel, data) {
  const out = path.join(distDir, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, data);
}

function buildDist() {
  const DIST = path.join(DIR, "dist");
  // Sauberer Stand: dist/ leeren, damit gelöschte Quell-Dateien nicht zurückbleiben.
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const esbuild = tryLoadEsbuild();
  if (!esbuild) {
    console.warn("⚠ esbuild nicht verfügbar – dist/ wird ROH (unminifiziert) gebaut.");
  }

  // Asset-Liste aus dem Service Worker (eine Quelle der Wahrheit). Trennt JS/CSS
  // (minifizierbar) von Binär-/Sonstigem (roh kopieren). "./" ist kein File.
  const assets = [...new Set(readAssets())]; // relative Pfade ohne "./"
  const minified = [];
  const copied = [];

  for (const rel of assets) {
    if (!rel || rel === "" ) continue;
    const srcPath = path.join(DIR, rel);
    if (!fs.existsSync(srcPath)) continue; // sw-assets-Test wacht über Existenz
    if (esbuild && /\.js$/.test(rel)) {
      const code = fs.readFileSync(srcPath, "utf8");
      const res = esbuild.transformSync(code, { loader: "js", minify: true, legalComments: "none" });
      writeDist(DIST, rel, res.code);
      minified.push(rel);
    } else if (esbuild && /\.css$/.test(rel)) {
      const code = fs.readFileSync(srcPath, "utf8");
      const res = esbuild.transformSync(code, { loader: "css", minify: true, legalComments: "none" });
      writeDist(DIST, rel, res.code);
      minified.push(rel);
    } else {
      writeDist(DIST, rel, fs.readFileSync(srcPath)); // Binär/HTML/Manifest roh
      copied.push(rel);
    }
  }

  // index.html roh kopieren (referenziert dieselben Dateinamen wie im Root).
  writeDist(DIST, "index.html", fs.readFileSync(path.join(DIR, SOURCE)));
  // service-worker.js nach dist/ kopieren – wird gleich über die dist-Assets gestempelt.
  writeDist(DIST, "service-worker.js", fs.readFileSync(path.join(DIR, "service-worker.js")));
  // Zusätzliche Root-Assets, die nicht im Precache stehen, aber von index.html/Manifest
  // referenziert werden (Social-Vorschau-Bilder), best effort mitkopieren.
  for (const extra of ["og-image.png", "og-image-square.png"]) {
    const p = path.join(DIR, extra);
    if (fs.existsSync(p)) { writeDist(DIST, extra, fs.readFileSync(p)); copied.push(extra); }
  }

  // SW-Hash über die MINIFIZIERTEN dist-Assets stempeln (dist/service-worker.js).
  const sw = stampServiceWorker(DIST);

  return { dir: DIST, minified, copied, minify: !!esbuild, swVersion: sw.version };
}

if (DIST_MODE) {
  try {
    const r = buildDist();
    console.log(`✓ dist/ erzeugt${r.minify ? " (minifiziert)" : " (ROH – esbuild fehlte)"}.`);
    console.log(`  Minifiziert: ${r.minified.length} Dateien; kopiert: ${r.copied.length} Dateien.`);
    console.log(`✓ dist/service-worker.js: CACHE_VERSION = ${r.swVersion}`);
  } catch (err) {
    console.error("✗ dist-Build fehlgeschlagen:", err.message);
    process.exit(1);
  }
  return;
}

try {
  const files = build();
  console.log(`✓ ${OUTPUT} erzeugt.${EDITION ? `  (Edition: ${EDITION})` : ""}`);
  console.log(`  Eingebettet: ${files.join(", ")}`);
  // Service-Worker-Cache-Namen aus dem Inhalts-Hash der Assets stempeln, damit
  // ausgelieferte Änderungen immer einen frischen Cache bekommen (kein manuelles
  // Hochzählen mehr – das wurde sonst vergessen). Nur beim Default-Build – eine
  // Edition ist eine Einzeldatei ohne Service Worker und soll service-worker.js
  // nicht anfassen.
  if (!EDITION) {
    const sw = stampServiceWorker();
    console.log(`✓ service-worker.js: CACHE_VERSION = ${sw.version}${sw.changed ? " (aktualisiert)" : " (unverändert)"}`);
  }
} catch (err) {
  console.error("✗ Build fehlgeschlagen:", err.message);
  process.exit(1);
}
