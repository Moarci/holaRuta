/*
 * scripts/geo/prerender.mjs — schreibt für jede Manifest-Seite eine vollständig
 * statische HTML-Datei nach dist/<locale>/<slug>/index.html.
 *
 * Läuft NACH build.js' Haupt-dist-Kopie (index.html, Fonts, Icons, sitemap.xml,
 * robots.txt liegen dann bereits in dist/), damit die relativen Root-Prefix-
 * Links (../../icon.svg etc.) im Prerender auf existierende Dateien zeigen.
 *
 * GitHub Pages liefert für ein Verzeichnis automatisch dessen index.html aus –
 * kein Server, keine Rewrite-Regeln nötig.
 *
 * Aufruf:  node scripts/geo/prerender.mjs [--dist=<pfad>]
 */
"use strict";

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadManifestPages } from "./generate.mjs";
import { REPO_ROOT } from "./load-sc-data.mjs";
import { renderPage } from "./render-html.mjs";

function distDirFromArgs(argv) {
  const flag = argv.find((a) => a.startsWith("--dist="));
  return flag ? path.resolve(REPO_ROOT, flag.slice("--dist=".length)) : path.join(REPO_ROOT, "dist");
}

/**
 * Rendert alle Manifest-Seiten nach `<distDir>/<locale>/<slug>/index.html`.
 * @returns {{ written: string[] }}
 */
export function prerenderAll(distDir, locales = ["de", "en", "es"]) {
  if (!existsSync(distDir)) {
    throw new Error(`prerenderAll: dist-Verzeichnis fehlt (${distDir}) – erst "node build.js --dist" ausführen.`);
  }
  const pages = loadManifestPages(locales);
  const written = [];

  for (const page of pages) {
    const outDir = path.join(distDir, page.path.replace(/^\//, "").replace(/\/$/, ""));
    mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, "index.html");
    writeFileSync(outFile, renderPage(page), "utf8");
    written.push(outFile);
  }

  return { written, pages };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const distDir = distDirFromArgs(process.argv.slice(2));
  const { written } = prerenderAll(distDir);
  console.log(`✓ ${written.length} GEO-Seiten nach ${path.relative(REPO_ROOT, distDir)}/ prerendert.`);
}
