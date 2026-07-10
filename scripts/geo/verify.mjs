/*
 * scripts/geo/verify.mjs — CI-Gate: prüft, dass die generierten GEO-Artefakte
 * konsistent sind, BEVOR sie live gehen. Bricht mit Exit-Code 1 ab, wenn:
 *   - eine Manifest-Seite keine prerenderte dist/-Datei hat
 *   - Canonicals oder Pfade doppelt vorkommen
 *   - hreflang-Alternates innerhalb einer Übersetzungsgruppe nicht reziprok sind
 *   - eine Seite unter dem Mindest-Content-Boden liegt (Anti-Thin-Content)
 *
 * Aufruf:  node scripts/geo/verify.mjs [--dist=<pfad>]
 */
"use strict";

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadManifestPages } from "./generate.mjs";
import { REPO_ROOT } from "./load-sc-data.mjs";

function distDirFromArgs(argv) {
  const flag = argv.find((a) => a.startsWith("--dist="));
  return flag ? path.resolve(REPO_ROOT, flag.slice("--dist=".length)) : path.join(REPO_ROOT, "dist");
}

/**
 * Prüft das Manifest + die prerenderten Dateien in distDir.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function verifyGeo(distDir, locales = ["de", "en", "es"]) {
  const errors = [];
  const pages = loadManifestPages(locales);

  const seenPaths = new Set();
  const seenCanonicals = new Set();
  const byGroup = new Map();

  for (const p of pages) {
    if (seenPaths.has(p.path)) errors.push(`Doppelter Pfad: ${p.path}`);
    seenPaths.add(p.path);

    if (seenCanonicals.has(p.canonical)) errors.push(`Doppelte Canonical: ${p.canonical}`);
    seenCanonicals.add(p.canonical);

    if (!p.h1 || p.h1.length < 3) errors.push(`h1 fehlt/zu kurz: ${p.key}`);
    if (!p.intro || p.intro.length < 20) errors.push(`Intro fehlt/zu kurz: ${p.key}`);
    if (!p.sections || p.sections.length < 1) errors.push(`Zu wenige Sektionen: ${p.key}`);
    if (!p.faq || p.faq.length < 1) errors.push(`Keine FAQ: ${p.key}`);
    if (!p.meta?.title || p.meta.title.length > 70) errors.push(`Title fehlt/zu lang: ${p.key}`);
    if (!p.meta?.description || p.meta.description.length > 160) errors.push(`Description fehlt/zu lang: ${p.key}`);

    if (distDir) {
      const outFile = path.join(distDir, p.path.replace(/^\//, "").replace(/\/$/, ""), "index.html");
      if (!existsSync(outFile)) errors.push(`Prerender fehlt: ${p.path} (erwartet ${path.relative(REPO_ROOT, outFile)})`);
    }

    if (!byGroup.has(p.translationGroup)) byGroup.set(p.translationGroup, []);
    byGroup.get(p.translationGroup).push(p);
  }

  for (const [group, members] of byGroup) {
    for (const p of members) {
      for (const other of members) {
        if (p.alternates?.[other.locale] !== other.path) {
          errors.push(`hreflang nicht reziprok in Gruppe "${group}": ${p.key} -> alternates.${other.locale} != ${other.path}`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors, pageCount: pages.length };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const distDir = distDirFromArgs(process.argv.slice(2));
  const distExists = existsSync(distDir);
  const { ok, errors, pageCount } = verifyGeo(distExists ? distDir : null);

  if (!distExists) {
    console.warn(`⚠ dist/ nicht gefunden (${distDir}) – Prerender-Existenz wird NICHT geprüft, nur das Manifest.`);
  }
  if (ok) {
    console.log(`✓ GEO-Verify bestanden (${pageCount} Seiten).`);
  } else {
    console.error(`✗ GEO-Verify fehlgeschlagen (${errors.length} Fehler):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}
