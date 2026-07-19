/*
 * scripts/geo/generate.mjs — Orchestrierung: App-Daten laden -> Seiten-Manifest
 * bauen -> sitemap.xml / robots.txt / llms.txt aus dem Manifest schreiben.
 *
 * Läuft VOR dem eigentlichen dist-Build (siehe build.js), damit robots.txt und
 * sitemap.xml, die build.js in seiner festen Kopierliste nach dist/ überträgt,
 * bereits den vollen, aktuellen Seitenbestand widerspiegeln.
 *
 * Aufruf:  node scripts/geo/generate.mjs
 */
"use strict";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AI_CRAWLERS, BASE_URL, CONTENT_DATE, DEFAULT_LOCALE } from "./config.mjs";
import { buildAllPages } from "./content-model.mjs";
import { buildLocalsPages } from "./locals-content.mjs";
import { loadLocalsData, loadReiseData, REPO_ROOT } from "./load-sc-data.mjs";
import { escapeXml } from "./text-utils.mjs";

// Statische, handgepflegte Seiten (Marketing-Landings), die zusätzlich zu den
// generierten Content-Seiten in Sitemap/llms.txt auftauchen sollen.
const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/landing.html", priority: "0.9", changefreq: "weekly" },
  { loc: "/landing-schule.html", priority: "0.6", changefreq: "monthly" },
  { loc: "/landing-hostel.html", priority: "0.6", changefreq: "monthly" },
  { loc: "/landing-reiseanbieter.html", priority: "0.6", changefreq: "monthly" },
  { loc: "/landing-locals.html", priority: "0.6", changefreq: "monthly" },
  { loc: "/hello-abroad/", priority: "0.8", changefreq: "monthly" },
];

const PAGE_TYPE_PRIORITY = { hub: "0.8", country: "0.7", city: "0.7", situation: "0.6", theme: "0.6", pillar: "0.8" };

/**
 * Baut das volle Seiten-Manifest über BEIDE Tracks:
 *  - Reise (de/en): Länder/Städte/Situationen/Pillar aus data.js + countries.js
 *  - Locals (es):  eigenes Produkt "HolaRuta · Inglés" aus data.locals.js
 * `locales` steuert nur, WELCHE der drei Sprachen gebaut werden (z. B. für
 * schnelle lokale Iteration mit nur ["de"]).
 */
export function buildManifest(locales = ["de", "en", "es"]) {
  const pages = [];
  const reiseLocales = locales.filter((l) => l === "de" || l === "en");
  if (reiseLocales.length) {
    pages.push(...buildAllPages(loadReiseData(), reiseLocales));
  }
  if (locales.includes("es")) {
    pages.push(...buildLocalsPages(loadLocalsData().dataLocals));
  }
  return pages;
}

const MANIFEST_PATH = path.join(REPO_ROOT, "seo", "geo-manifest.json");

/**
 * Wie buildManifest(), liest das Manifest aber von der bereits geschriebenen
 * seo/geo-manifest.json, WENN sie existiert und exakt dieselben Locales
 * abdeckt - vermeidet, data.js (2800+ Zeilen) + countries.js + data.locals.js
 * innerhalb desselben `node build.js --dist`-Laufs drei separate Male (generate
 * -> prerender -> verify, je ein eigener Kindprozess) neu zu parsen und alle
 * 327 Seiten-Objekte neu zu bauen. Fällt bei fehlender/nicht passender/
 * kaputter Datei auf buildManifest() zurück (z. B. bei Tests, die nur ein
 * einzelnes Locale anfordern, oder wenn generate.mjs noch nicht lief).
 */
export function loadManifestPages(locales = ["de", "en", "es"]) {
  if (existsSync(MANIFEST_PATH)) {
    try {
      const pages = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
      const manifestLocales = new Set(pages.map((p) => p.locale));
      const requestedLocales = new Set(locales);
      const sameLocales = manifestLocales.size === requestedLocales.size
        && [...manifestLocales].every((l) => requestedLocales.has(l));
      if (sameLocales) return pages;
    } catch {
      // Kaputtes/unlesbares Manifest: einfach frisch bauen statt hart zu scheitern.
    }
  }
  return buildManifest(locales);
}

function renderSitemap(pages) {
  const urls = [];

  for (const s of STATIC_PAGES) {
    urls.push(`  <url>\n    <loc>${escapeXml(BASE_URL + s.loc)}</loc>\n    <lastmod>${CONTENT_DATE}</lastmod>\n    <changefreq>${s.changefreq}</changefreq>\n    <priority>${s.priority}</priority>\n  </url>`);
  }

  for (const p of pages) {
    const alt = Object.entries(p.alternates || {})
      .map(([loc, altPath]) => `    <xhtml:link rel="alternate" hreflang="${loc}" href="${escapeXml(BASE_URL + altPath)}" />`)
      .join("\n");
    // x-default nur bei >=2 Alternates (echte Sprachauswahl) - Seiten mit nur
    // EINER Sprache (z. B. der ES-only Locals-Track) haben nichts, wozwischen
    // ein x-default entscheiden müsste; ein selbstreferenzierendes x-default
    // wäre irreführend. Muss zu render-html.mjs's renderHreflangLinks()
    // passen (dort `locales.length > 1`), sonst weichen sitemap.xml und die
    // ausgelieferte HTML-Seite für dieselbe URL widersprüchlich voneinander ab.
    const altLocales = Object.keys(p.alternates || {});
    const xDefault = altLocales.length > 1 ? (p.alternates[DEFAULT_LOCALE] || p.alternates[altLocales[0]]) : null;
    const xDefaultLink = xDefault
      ? `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(BASE_URL + xDefault)}" />`
      : "";
    const priority = PAGE_TYPE_PRIORITY[p.pageType] || "0.5";
    urls.push(
      `  <url>\n    <loc>${escapeXml(p.canonical)}</loc>\n    <lastmod>${CONTENT_DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n${alt}\n${xDefaultLink}\n  </url>`
        .replace(/\n\s*\n/g, "\n")
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}

// Kein Disallow nötig: HolaRuta ist eine reine Client-SPA ohne Server-Backend –
// App-Zustand lebt in Query-Parametern auf index.html, es gibt keine separaten
// serverseitigen Pfade (wie /api, /settings bei einer echten Backend-App), die
// vor Crawlern verborgen werden müssten.
function renderRobots() {
  const genericBlock = `User-agent: *\nAllow: /\n`;
  const aiBlocks = AI_CRAWLERS.map((bot) => `User-agent: ${bot}\nAllow: /\n`).join("\n");
  return `${genericBlock}\n${aiBlocks}\nSitemap: ${BASE_URL}/sitemap.xml\n`.replace(/\n{3,}/g, "\n\n");
}

// Grobe Kategorisierung fürs llms.txt (Bot-lesbarer Seitenindex).
function categorize(page) {
  if (page.track === "locals") return page.pageType === "hub" ? "HolaRuta · Inglés (Übersicht)" : "HolaRuta · Inglés (Guides)";
  if (page.pageType === "hub") return "Übersichten";
  if (page.pageType === "pillar") return "Produkt & Positionierung";
  if (page.pageType === "country") return "Länder-Guides";
  if (page.pageType === "city") return "Städte-Guides";
  if (page.pageType === "situation") return "Reisesituationen";
  if (page.pageType === "theme") return "Themen-Guides";
  return "Weitere Seiten";
}

// Eine Sprache vollständig als "## Sprache" -> "### Kategorie" -> Links
// rendern. Wird für DE/EN/ES gleich aufgerufen - vorher deckte nur Deutsch
// die volle Kategorien-Aufschlüsselung ab, Englisch/Spanisch bekamen nur die
// Hub-Seiten (84 von 87 EN-Seiten bzw. 151 von 153 ES-Seiten fehlten in
// llms.txt, obwohl sie in sitemap.xml/robots.txt/dist/ vollständig vorhanden
// sind - für ein System, das llms.txt als primären Seitenindex liest, wären
// diese Seiten faktisch unsichtbar gewesen).
function renderLlmsLocaleSection(pages, headingLabel) {
  if (!pages.length) return [];
  const byCategory = new Map();
  for (const p of pages) {
    const cat = categorize(p);
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(p);
  }
  const lines = [`## ${headingLabel}`, ""];
  for (const [cat, list] of byCategory) {
    lines.push(`### ${cat}`);
    for (const p of list) {
      lines.push(`- [${p.h1}](${p.canonical}): ${p.meta.description}`);
    }
    lines.push("");
  }
  return lines;
}

function renderLlmsTxt(pages) {
  const de = pages.filter((p) => p.locale === "de");
  const en = pages.filter((p) => p.locale === "en");
  const es = pages.filter((p) => p.locale === "es");

  const lines = [
    "# HolaRuta",
    "",
    "> HolaRuta ist eine kostenlose Vanilla-JS-PWA für Reise-Spanisch beim Backpacking durch Lateinamerika: Karteikarten mit Spaced Repetition für echte Situationen (Bus, Hotel, Essen, Geld, Notfall, Smalltalk), Länder- und Städteguides, komplett offline nutzbar, ohne Konto. Zweiter Lernpfad 'HolaRuta · Inglés': spanischsprachiges Hostelería-/Tourismus-Personal lernt Englisch fürs Arbeiten.",
    "",
    `- App: ${BASE_URL}/`,
    `- Über HolaRuta: ${BASE_URL}/landing.html`,
    `- HolaRuta · Inglés (Locals): ${BASE_URL}/landing-locals.html`,
    `- HelloAbroad · Reiseenglisch (DE→EN): ${BASE_URL}/hello-abroad/`,
    "",
    ...renderLlmsLocaleSection(de, "Deutsch"),
    ...renderLlmsLocaleSection(en, "English"),
    ...renderLlmsLocaleSection(es, "Español (HolaRuta · Inglés)"),
  ];

  lines.push(`Seiten insgesamt: ${pages.length} (de: ${de.length}, en: ${en.length}, es: ${es.length}). Sprachen: Deutsch, English, Español.`);
  lines.push("Alle KI-Crawler (GPTBot, ClaudeBot, PerplexityBot, Google-Extended u.a.) sind in robots.txt ausdrücklich willkommen.");
  return lines.join("\n") + "\n";
}

/** Baut Manifest + sitemap.xml + robots.txt + llms.txt und schreibt sie ins Repo. */
export function generateAll(locales = ["de", "en", "es"]) {
  const pages = buildManifest(locales);

  const seoDir = path.join(REPO_ROOT, "seo");
  mkdirSync(seoDir, { recursive: true });
  writeFileSync(path.join(seoDir, "geo-manifest.json"), JSON.stringify(pages, null, 2) + "\n", "utf8");
  writeFileSync(path.join(REPO_ROOT, "sitemap.xml"), renderSitemap(pages), "utf8");
  writeFileSync(path.join(REPO_ROOT, "robots.txt"), renderRobots(), "utf8");
  writeFileSync(path.join(REPO_ROOT, "llms.txt"), renderLlmsTxt(pages), "utf8");

  return pages;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const pages = generateAll();
  console.log(`✓ GEO-Manifest: ${pages.length} Seiten (${new Set(pages.map((p) => p.locale)).size} Sprachen).`);
  console.log("✓ sitemap.xml, robots.txt, llms.txt geschrieben.");
}
