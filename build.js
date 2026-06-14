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
const { stampServiceWorker } = require("./swversion.js");

const DIR = __dirname;
const SOURCE = "index.html";

// Optionaler Co-Branding-Build:  node build.js --edition=ecos  →  HolaRuta-ecos.html
// Die Edition-Datei (editions/<id>.js) wird vor config.js eingebettet; sonst
// identischer Build. Ohne Flag entsteht wie bisher das pure HolaRuta.html.
const editionArg = process.argv.find((a) => a.startsWith("--edition="));
const EDITION = editionArg ? editionArg.split("=")[1].trim() : null;
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
