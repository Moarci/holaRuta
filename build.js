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
const { execFileSync } = require("child_process");

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

// Lazy-geladene Module: stehen im SW-ASSETS-Precache (Offline), sind aber NICHT
// (mehr) als <script>-Tag in index.html verdrahtet – sie werden zur Laufzeit per
// loadModule() nachgeladen. Für den Single-File-Build müssen sie trotzdem
// eingebettet werden. Ableitung aus der Differenz „SW-ASSETS .js" minus „in
// index.html getaggte .js" – keine zweite Pflegeliste, die driften könnte.
function lazyModules() {
  const html = read(SOURCE);
  const tagged = new Set(
    [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script[^>]*>/gi)]
      .map((m) => m[1].replace(/^\.\//, ""))
  );
  return readAssets()
    .filter((rel) => /\.js$/.test(rel) && !tagged.has(rel));
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
  //    vorzeitig schließen -> escapen. Bewusst OHNE festes ">", damit auch
  //    "</script >"/"</script\n>" erfasst werden (HTML beendet den Block auch bei
  //    Whitespace vor ">"; CodeQL js/bad-tag-filter).
  const inlineCode = (src) => read(src).replace(/<\/script/gi, "<\\/script");
  // End-Tag-Match maximal tolerant ([^>]* deckt "</script >", "</script/>",
  // "</script\n>" etc. ab) – sonst feuert js/bad-tag-filter.
  html = html.replace(/[ \t]*<script[^>]*src="([^"]+)"[^>]*><\/script[^>]*>/gi, (m, src) => {
    // Locals-Loader: im Single-File gibt es kein Nachladen per document.write –
    // die drei Korpus-Dateien werden an GENAU dieser Position eingebettet
    // (nach i18n.strings.js/data.js, vor context.js/dialogos.js); der Loader
    // selbst entfällt (NICHT in `inlined` – er wird ersetzt, nicht eingebettet).
    // Ihre eigenen Track-Guards greifen dann wie bei der früheren statischen
    // Verdrahtung. Reihenfolge ist wichtig: attach() (context.js) braucht den
    // Locals-Kontext, und data.locals.js muss SC.dialogos VOR dialogos.js
    // vorbelegen können. Vor push/inlineCode(src), damit die Build-Ausgabe nicht
    // fälschlich „locals-loader.js" als eingebettet meldet und der Loader-Code
    // nicht vergeblich gelesen wird.
    if (/(?:^|\/)locals-loader\.js$/i.test(src)) {
      return ["i18n.strings.es.js", "data.locals.js", "contextdata.locals.js"]
        .map((f) => { inlined.push(f); return `<script>\n${inlineCode(f)}\n</script>`; })
        .join("\n");
    }
    inlined.push(src);
    const code = inlineCode(src);
    // Edition-Build: die Edition-Config direkt vor config.js einbetten, damit
    // config.js sie beim Merge sieht (setzt window.SC.editionConfig).
    if (EDITION && src === "config.js") {
      const edFile = path.join("editions", `${EDITION}.js`);
      const edCode = read(edFile).replace(/<\/script/gi, "<\\/script");
      inlined.push(edFile);
      return `<script>\n${edCode}\n</script>\n<script>\n${code}\n</script>`;
    }
    // Lazy-Module (im SW-ASSETS-Precache, aber NICHT mehr als <script>-Tag in
    // index.html, weil sie zur Laufzeit per loadModule() nachgeladen werden) müssen
    // im Single-File trotzdem eingebettet sein – sonst kann loadModule() sie dort
    // nicht finden (kein qr.js o.ä. neben der einen HTML-Datei). Sie werden direkt
    // VOR app.js eingebettet (app.js ist der letzte Tag und nutzt sie nur on-demand).
    if (/(?:^|\/)app\.js$/i.test(src)) {
      const tagged = new Set(inlined.map((p) => p.replace(/^\.\//, "")));
      const lazyBlocks = lazyModules()
        .filter((rel) => !tagged.has(rel) && fs.existsSync(path.join(DIR, rel)))
        .map((rel) => { inlined.push(rel); return `<script>\n${inlineCode(rel)}\n</script>`; });
      return `${lazyBlocks.join("\n")}${lazyBlocks.length ? "\n" : ""}<script>\n${code}\n</script>`;
    }
    return `<script>\n${code}\n</script>`;
  });

  // 4) CSP für die Einzeldatei lockern: die Multi-File-CSP ist bewusst streng
  //    (script-src 'self', siehe index.html) – hier sind aber ~50 Skripte inline
  //    eingebettet, die sonst komplett geblockt würden (stumm weiße Seite).
  //    Bewusst NUR die script-src-Direktive INNERHALB des CSP-Meta-Tags patchen
  //    (Anker auf content="…"): so kann ein zufällig identischer String in einem
  //    eingebetteten Kommentar (z. B. boot.js erwähnt "script-src 'self'") den
  //    Patch nicht fehlleiten. Harter Fehler bei 0 Treffern (Direktive/Meta
  //    umformuliert) – kein stiller Drift zur stummen weißen Seite.
  const CSP_META = /(<meta http-equiv="Content-Security-Policy" content="[^"]*?)script-src 'self';/;
  const patched = html.replace(CSP_META, "$1script-src 'self' 'unsafe-inline';");
  if (patched === html) {
    throw new Error("CSP-Patch griff nicht – script-src 'self' in der CSP-Meta von index.html nicht gefunden?");
  }
  html = patched;

  // 5) Hinweis-Kommentar in den <head> setzen.
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

  // GEO-Manifest + sitemap.xml/robots.txt/llms.txt an der Repo-Wurzel neu
  // schreiben, BEVOR irgendetwas aus ihnen gelesen wird (siehe die extra-
  // Kopierschleife weiter unten).
  generateGeo();

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

  // index.html nach dist/ schreiben. Edition-Dist (`--dist --edition=<id>`):
  // die Edition-Config VOR config.js einhängen (setzt window.SC.editionConfig),
  // damit config.js sie beim Merge sieht – analog zum Single-File-Build (Zeile 109).
  // Ohne EDITION bleibt index.html unverändert (Default = HolaRuta pur, offline).
  let indexHtml = fs.readFileSync(path.join(DIR, SOURCE), "utf8");
  if (EDITION) {
    const edRel = `editions/${EDITION}.js`;
    const edSrc = path.join(DIR, edRel);
    // Direkt lesen statt existsSync-dann-read (vermeidet die TOCTOU-Race): fehlt die
    // Edition-Datei, wird der Lesefehler als klare Build-Meldung weitergereicht.
    // Edition-Modul nach dist/ (minifiziert, falls esbuild da) – nicht im SW-Precache,
    // aber offline unkritisch: fehlt es offline, läuft die App ohne Sync (graceful).
    let edCode;
    try { edCode = fs.readFileSync(edSrc, "utf8"); }
    catch (e) { throw new Error(`Edition-Datei fehlt/unlesbar: ${edRel} (${e.code || e.message})`); }
    writeDist(DIST, edRel, esbuild
      ? esbuild.transformSync(edCode, { loader: "js", minify: true, legalComments: "none" }).code
      : edCode);
    // Script-Tag direkt vor config.js einfügen.
    const before = indexHtml;
    indexHtml = indexHtml.replace(
      /(<script src="config\.js"><\/script>)/,
      `<script src="${edRel}"></script>\n  $1`
    );
    if (indexHtml === before) throw new Error("Edition-Einbettung: <script src=\"config.js\"> in index.html nicht gefunden.");
  }
  writeDist(DIST, "index.html", Buffer.from(indexHtml));
  // service-worker.js nach dist/ kopieren – wird gleich über die dist-Assets gestempelt.
  writeDist(DIST, "service-worker.js", fs.readFileSync(path.join(DIR, "service-worker.js")));
  // Zusätzliche Root-Assets, die nicht im Precache stehen, aber von index.html/Manifest
  // referenziert werden (Social-Vorschau-Bilder), best effort mitkopieren.
  // Dazu die separate Marketing-Landing-Page (landing.html/.css) plus die wenigen
  // Screenshots, die sie zeigt. Bewusst NICHT im Service-Worker-Precache, damit der
  // PWA-Offline-Cache der App schlank bleibt (Marketing muss nicht offline laufen).
  for (const extra of [
    "og-image.png",
    "og-image-square.png",
    // HelloAbroad-Edition (DE-EN): eigene Social-Vorschau, von hello-abroad/index.html
    // (Redirect) als absolute og:image-URL referenziert – muss in dist/ liegen.
    "og-image-hello-abroad.png",
    "og-image-square-hello-abroad.png",
    "landing.html",
    "landing.css",
    "docs/landing/home.png",
    "docs/landing/study.png",
    "docs/landing/stats.png",
    // WebP-Varianten: die Landing-Seiten binden primär .webp ein (kleiner);
    // fehlen sie in dist/, zeigen alle Screenshots in Produktion nur Alt-Text.
    "docs/landing/home.webp",
    "docs/landing/study.webp",
    "docs/landing/stats.webp",
    "docs/landing/home-hero.webp",
    // Spanische Locals-App-Screenshots (Home/Study/Stats) NUR für landing-locals.html
    // – track es-en (Frage ES → Antwort EN), damit die Seite die echte Locals-UI zeigt.
    "docs/landing/locals-home.webp",
    "docs/landing/locals-study.webp",
    "docs/landing/locals-stats.webp",
    // Zielgruppenspezifische B2B-Landings (DE/EN/ES) – teilen sich styles.css/
    // landing.css und das Beispielkarten-Karussell (landing-carousel.js).
    "landing-schule.html",
    "landing-hostel.html",
    "landing-reiseanbieter.html",
    "landing-locals.html",
    "landing-carousel.js",
    // Beleg-Material, das die B2B-Landings verlinken (+ deren Abhängigkeiten), damit die
    // Links auch in Produktion (dist/) auflösen statt 404 zu liefern.
    "docs/anleitungen/lehrer.html",
    "docs/anleitungen/hostel.html",
    "docs/anleitungen/handout.css",
    "docs/anleitungen/handout.js",
    "docs/anleitungen/qr-holaruta.svg",
    // HelloAbroad-Installationsanleitung (DE-EN, ?edition=hello-abroad) + eigener QR,
    // vom Anleitungs-Index verlinkt – sonst 404 in Produktion.
    "docs/anleitungen/hello-abroad.html",
    "docs/anleitungen/qr-hello-abroad.svg",
    "docs/pitch/weroad-colombia.html",
    // Shareable Redirect-URLs (?edition=… fest verdrahtet, per README/Poster
    // verlinkt): fehlten bisher hier und landeten dadurch NIE in dist/ – die
    // Links gaben in Produktion 404, obwohl sie lokal (Datei direkt geöffnet)
    // funktionierten. en/ = ingles-pro (Locals-Schule), hello-abroad/ = die
    // HelloAbroad-Edition (siehe editions/registry.js appUrl).
    "en/index.html",
    "hello-abroad/index.html",
    // SEO/GEO: Sitemap + robots + llms.txt (von Landing/Suche/KI-Crawlern
    // referenziert, bewusst nicht im Precache). Werden von generateGeo() (oben
    // in buildDist()) VOR dieser Schleife frisch aus dem GEO-Manifest
    // geschrieben – hier landet also immer der aktuelle Stand in dist/.
    "sitemap.xml",
    "robots.txt",
    "llms.txt",
  ]) {
    const p = path.join(DIR, extra);
    if (fs.existsSync(p)) { writeDist(DIST, extra, fs.readFileSync(p)); copied.push(extra); }
  }

  // GEO-Content-Seiten (Länder-/Städte-/Situationsguides) prerendern: erst JETZT,
  // weil dist/ bereits index.html + Icons + Fonts enthält (die relativen
  // Root-Prefix-Links der generierten Seiten, z. B. "../../icon.svg", zeigen
  // sonst ins Leere). Danach das Verify-Gate – bricht der dist-Build ab, wenn
  // eine Manifest-Seite nicht prerendert wurde oder Canonicals/hreflang
  // inkonsistent sind (wirft, was der äußere try/catch unten fängt).
  prerenderGeo(DIST);
  verifyGeo(DIST);

  // SW-Hash über die MINIFIZIERTEN dist-Assets stempeln (dist/service-worker.js).
  const sw = stampServiceWorker(DIST);

  return { dir: DIST, minified, copied, minify: !!esbuild, swVersion: sw.version };
}

// ---------------------------------------------------------------------------
// GEO/SEO-Pipeline (scripts/geo/*.mjs) – als Kindprozess aufgerufen, weil diese
// Skripte ES-Module sind (build.js selbst ist CommonJS). Siehe scripts/geo/
// für die Einzelschritte (Manifest bauen, Sitemap/robots/llms.txt schreiben,
// pro Seite statisches HTML prerendern, Konsistenz verifizieren).
// ---------------------------------------------------------------------------
function runGeoScript(relScript, args) {
  execFileSync(process.execPath, [path.join(DIR, relScript), ...args], { stdio: "inherit" });
}

// Manifest + sitemap.xml/robots.txt/llms.txt an der Repo-Wurzel neu schreiben –
// MUSS vor der obigen extra-Kopierschleife laufen (die liest sitemap.xml/
// robots.txt/llms.txt synchron von dort), deshalb Aufruf ganz am Anfang von
// buildDist() (siehe unten).
function generateGeo() {
  runGeoScript("scripts/geo/generate.mjs", []);
}

function prerenderGeo(distDir) {
  runGeoScript("scripts/geo/prerender.mjs", [`--dist=${distDir}`]);
}

function verifyGeo(distDir) {
  runGeoScript("scripts/geo/verify.mjs", [`--dist=${distDir}`]);
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
