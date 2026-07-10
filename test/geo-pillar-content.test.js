/*
 * geo-pillar-content.test.js – Tests für scripts/geo/pillar-content.mjs.
 * Prüft die 4 handverfassten Marken-/Positionierungs-Seiten (Produktdefinition,
 * Wettbewerb, LatAm- vs. Spanien-Spanisch, Spaced Repetition):
 *   - genau 8 Seiten (4 x DE+EN), eindeutige Slugs/Canonicals
 *   - AEO: jede FAQ-Antwort nennt "HolaRuta" namentlich
 *   - LatAm-vs-Spanien-Seite zieht echte Länder-Beispiele aus countries.js
 *   - Querverlinkung zwischen den Pillar-Seiten funktioniert
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");

async function loadPillars() {
  const { loadReiseData } = await import("../scripts/geo/load-sc-data.mjs");
  const { buildPillarPages } = await import("../scripts/geo/pillar-content.mjs");
  const { countries, data } = loadReiseData();
  return buildPillarPages(countries, data, ["de", "en"]);
}

test("buildPillarPages: erzeugt genau 8 Seiten (4 Themen x DE+EN)", async () => {
  const pages = await loadPillars();
  assert.equal(pages.length, 8);
  const keys = new Set(pages.map((p) => p.key));
  assert.equal(keys.size, 4, "4 eindeutige Pillar-Keys (je 2x für de/en)");
});

test("buildPillarPages: eindeutige Slugs/Canonicals, gültige Pfade", async () => {
  const pages = await loadPillars();
  const paths = new Set();
  const canonicals = new Set();
  for (const p of pages) {
    assert.ok(!paths.has(p.path), `doppelter Pfad: ${p.path}`);
    paths.add(p.path);
    assert.ok(!canonicals.has(p.canonical), `doppelte Canonical: ${p.canonical}`);
    canonicals.add(p.canonical);
    assert.ok(p.path.startsWith(`/${p.locale}/`) && p.path.endsWith("/"));
    assert.equal(p.pageType, "pillar");
  }
});

test("AEO: jede Pillar-FAQ-Antwort nennt die Marke HolaRuta namentlich", async () => {
  const pages = await loadPillars();
  const missing = [];
  for (const p of pages) {
    for (const f of p.faq) {
      if (!/HolaRuta/.test(f.answer)) missing.push(`${p.key} (${p.locale}): "${f.question}"`);
    }
  }
  assert.equal(missing.length, 0, `FAQ-Antworten ohne Markennennung:\n${missing.join("\n")}`);
});

test("buildPillarPages: LatAm-vs-Spanien-Seite zieht echte Länder-Beispiele aus countries.js", async () => {
  const pages = await loadPillars();
  const page = pages.find((p) => p.key === "pillar:spain-vs-latam" && p.locale === "de");
  assert.ok(page, "spain-vs-latam-Seite (de) vorhanden");
  const exampleSection = page.sections.find((s) => s.heading === "Länder-Beispiele");
  assert.ok(exampleSection, "Länder-Beispiele-Sektion vorhanden");
  assert.ok(exampleSection.bullets.length >= 2, "mindestens 2 Länder-Beispiele");
  assert.ok(exampleSection.bullets.some((b) => b.includes("Argentinien")), "Argentinien-Beispiel (Voseo) vorhanden");
});

test("buildPillarPages: Pillar-Seiten verlinken sich gegenseitig (related)", async () => {
  const pages = await loadPillars();
  const whatIs = pages.find((p) => p.key === "pillar:what-is" && p.locale === "de");
  assert.ok(whatIs.internalLinks.related.length >= 2, "was-ist-holaruta verlinkt auf andere Pillar-Seiten");
  assert.ok(whatIs.internalLinks.hub && whatIs.internalLinks.hub.path, "Pillar-Seite hat einen Hub-Link (Länder-Hub)");
});

test("buildPillarPages: jede Seite erfüllt das Anti-Thin-Content-Gate", async () => {
  const pages = await loadPillars();
  for (const p of pages) {
    assert.ok(p.h1 && p.h1.length > 3, `h1 fehlt/zu kurz: ${p.key}`);
    assert.ok(p.intro && p.intro.length > 20, `Intro fehlt/zu kurz: ${p.key}`);
    assert.ok(p.meta.title && p.meta.title.length <= 70, `Title zu lang: ${p.key}`);
    assert.ok(p.meta.description && p.meta.description.length <= 160, `Description zu lang: ${p.key}`);
    assert.ok(p.sections.length >= 2, `zu wenige Sektionen: ${p.key}`);
    assert.ok(p.faq.length >= 3, `zu wenige FAQ: ${p.key}`);
  }
});
