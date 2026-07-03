/*
 * scripts/build-landing-preview.mjs – erzeugt landing-preview.html: eine
 * SELBSTTRAGENDE Einzeldatei-Momentaufnahme von landing.html (Styles inline,
 * Fonts & Bilder als data-URIs). Zum Teilen/Reviewen ohne Server gedacht.
 *
 * Muss nach jeder Änderung an landing.html / landing.css / styles.css /
 * docs/landing/* neu laufen, sonst zeigt die Vorschau einen veralteten Stand:
 *   node scripts/build-landing-preview.mjs
 *
 * Bewusste Abweichungen vom Original (wie beim bisherigen Snapshot):
 *  - CSP-Meta entfernt (blockierte data:-Fonts), ebenso Favicon-/Preload-Links.
 *  - Alle lokal referenzierten Assets sind eingebettet – die Datei ist groß,
 *    dafür offline und kontextfrei zu öffnen.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const read = (p) => readFileSync(path.join(ROOT, p));
const MIME = { ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
const dataUri = (p) => `data:${MIME[path.extname(p)]};base64,${read(p).toString("base64")}`;

let html = read("landing.html").toString("utf8");

// 1) Kopf-Zeilen entfernen, die im Einzeldatei-Kontext stören (CSP blockiert
//    data:-Fonts; Icon-/Preload-Links zeigen auf nicht eingebettete Dateien).
html = html
  .split("\n")
  .filter((l) => !/Content-Security-Policy|rel="icon"|rel="apple-touch-icon"|rel="preload"/.test(l))
  .join("\n");

// 2) Stylesheets inline: die beiden <link>-Zeilen durch EIN <style> ersetzen,
//    Font-URLs im CSS als data-URIs einbetten.
let css = read("styles.css").toString("utf8") + "\n" + read("landing.css").toString("utf8");
css = css.replace(/url\("(fonts\/[^"]+\.woff2)"\)/g, (_, p) => `url("${dataUri(p)}")`);
const linkRx = /  <link rel="stylesheet" href="styles\.css" \/>\n  <link rel="stylesheet" href="landing\.css" \/>\n/;
if (!linkRx.test(html)) throw new Error("Stylesheet-Links in landing.html nicht gefunden");
html = html.replace(linkRx, `  <style>\n${css}\n  </style>\n`);

// 3) Lokale Bilder (Hero-Phone, Schritt-Screenshots, JS-Phone-Wechsler) einbetten.
for (const asset of ["docs/landing/home-hero.webp", "docs/landing/home.webp",
  "docs/landing/study.webp", "docs/landing/stats.webp", "docs/landing/home.png"]) {
  html = html.split(asset).join(dataUri(asset));
}

// 4) Marker, damit niemand die Datei für Quellcode hält.
html = html.replace("<!DOCTYPE html>",
  "<!DOCTYPE html>\n<!-- GENERIERT aus landing.html – nicht von Hand bearbeiten.\n     Neu erzeugen mit: node scripts/build-landing-preview.mjs -->");

writeFileSync(path.join(ROOT, "landing-preview.html"), html);
console.log(`✓ landing-preview.html (${(html.length / 1024 / 1024).toFixed(1)} MB)`);
