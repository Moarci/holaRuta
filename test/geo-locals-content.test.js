/*
 * geo-locals-content.test.js – Tests für scripts/geo/locals-content.mjs
 * (Locals-Track "HolaRuta · Inglés"): eigenes Produkt, eigener Korpus
 * (data.locals.js), rein ES. Prüft dieselben Invarianten wie der Reise-Cluster:
 *   - eindeutige Slugs/Canonicals, Mindest-Content, AEO-Markennennung
 *   - Kategorie-Seiten haben Hub-Link + genug interne verwandte Links
 *   - Pillar-Seite + Hub sind vorhanden und verlinkt
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");

async function loadLocalsPages() {
  const { loadLocalsData } = await import("../scripts/geo/load-sc-data.mjs");
  const { buildLocalsPages } = await import("../scripts/geo/locals-content.mjs");
  const { dataLocals } = loadLocalsData();
  return buildLocalsPages(dataLocals);
}

test("buildLocalsPages: erzeugt >100 Kategorie-Seiten + 1 Hub + 1 Pillar, alle ES", async () => {
  const pages = await loadLocalsPages();
  const situationPages = pages.filter((p) => p.pageType === "situation");
  const hubs = pages.filter((p) => p.pageType === "hub");
  const pillars = pages.filter((p) => p.pageType === "pillar");

  assert.ok(situationPages.length > 100, `erwartet >100 Kategorie-Seiten, war ${situationPages.length}`);
  assert.equal(hubs.length, 1, "genau ein Locals-Hub");
  assert.equal(pillars.length, 1, "genau eine Locals-Pillar-Seite");
  assert.ok(pages.every((p) => p.locale === "es"), "alle Locals-Seiten sind ES");
  assert.ok(pages.every((p) => p.track === "locals"), "alle Seiten tragen track=locals");
});

test("buildLocalsPages: eindeutige Slugs/Canonicals unter /es/", async () => {
  const pages = await loadLocalsPages();
  const paths = new Set();
  const canonicals = new Set();
  for (const p of pages) {
    assert.ok(!paths.has(p.path), `doppelter Pfad: ${p.path}`);
    paths.add(p.path);
    assert.ok(!canonicals.has(p.canonical), `doppelte Canonical: ${p.canonical}`);
    canonicals.add(p.canonical);
    assert.ok(p.path.startsWith("/es/") && p.path.endsWith("/"));
  }
});

test("buildLocalsPages: Kategorie-Seiten haben Hub-Link + genug interne verwandte Links", async () => {
  const pages = await loadLocalsPages();
  const situationPages = pages.filter((p) => p.pageType === "situation");
  for (const p of situationPages) {
    assert.ok(p.internalLinks.hub && p.internalLinks.hub.path, `Hub-Link fehlt: ${p.key}`);
    assert.ok(p.internalLinks.related.length >= 2, `zu wenige related Links: ${p.key}`);
    assert.ok(p.internalLinks.app && p.internalLinks.app.url, `App-Link fehlt: ${p.key}`);
  }
});

test("buildLocalsPages: jede Seite erfüllt das Anti-Thin-Content-Gate", async () => {
  const pages = await loadLocalsPages();
  for (const p of pages) {
    assert.ok(p.h1 && p.h1.length > 3, `h1 fehlt/zu kurz: ${p.key}`);
    assert.ok(p.intro && p.intro.length > 20, `Intro fehlt/zu kurz: ${p.key}`);
    assert.ok(p.meta.title && p.meta.title.length <= 70, `Title zu lang: ${p.key} (${p.meta.title?.length})`);
    assert.ok(p.meta.description && p.meta.description.length <= 160, `Description zu lang: ${p.key}`);
    assert.ok(p.sections.length >= 1, `zu wenige Sektionen: ${p.key}`);
    assert.ok(p.faq.length >= 1, `keine FAQ: ${p.key}`);
  }
});

test("AEO: jede Locals-FAQ-Antwort nennt die Marke HolaRuta namentlich", async () => {
  const pages = await loadLocalsPages();
  const missing = [];
  for (const p of pages) {
    for (const f of p.faq) {
      if (!/HolaRuta/.test(f.answer)) missing.push(`${p.key}: "${f.question}"`);
    }
  }
  assert.equal(missing.length, 0, `FAQ-Antworten ohne Markennennung:\n${missing.slice(0, 10).join("\n")}`);
});

test("buildLocalsPages: FAQ enthält echte es->en Phrase aus dem Korpus (zitierbar)", async () => {
  const pages = await loadLocalsPages();
  const withPhraseFaq = pages.filter((p) => p.pageType === "situation" && p.faq.some((f) => /¿Cómo se dice/.test(f.question)));
  assert.ok(withPhraseFaq.length > 100, `erwartet >100 Seiten mit Phrase-FAQ, war ${withPhraseFaq.length}`);
});

test("buildLocalsPages: hreflang ist self-only (kein x-default ohne zweites Locale)", async () => {
  const pages = await loadLocalsPages();
  for (const p of pages) {
    assert.deepEqual(Object.keys(p.alternates), ["es"], `${p.key}: alternates sollte nur "es" enthalten`);
    assert.equal(p.alternates.es, p.path);
  }
});

// Regressionstest: Intro darf keine höhere Zahl behaupten, als tatsächlich als
// Sätze/Wörter angezeigt wird (Kategorien mit >28 Karten werden gekappt).
// Intro rotiert über mehrere Formulierungsvarianten (siehe INTRO_VARIANTS in
// locals-content.mjs) - die exakte Phrase ist daher NICHT fixiert.
test("buildLocalsPages: genannte Wörter-Zahl in Intro übersteigt nie die Anzahl gezeigter Bullets", async () => {
  const pages = await loadLocalsPages();
  for (const p of pages.filter((p) => p.pageType === "situation")) {
    const shown = p.sections.reduce((n, s) => n + (s.bullets?.length || 0), 0);
    const m = p.intro.match(/(\d+)/);
    assert.ok(m, `${p.key}: Intro nennt keine Zahl`);
    assert.ok(Number(m[1]) <= shown, `${p.key}: Intro behauptet ${m[1]}, gezeigt werden aber nur ${shown}`);
  }
});

// Doorway-Page-Regression: 151 Kategorie-Seiten teilten sich früher EINE
// Intro-Vorlage (nur Name/Zahl unterschieden sich). Prüft, dass die
// rotierenden Varianten (INTRO_VARIANTS in locals-content.mjs) tatsächlich
// mehrere unterschiedliche Rahmensätze erzeugen, nicht nur einen.
test("AEO/Content-Qualität: Locals-Intros rotieren über mehrere Formulierungen (kein Doorway-Page-Muster)", async () => {
  const pages = await loadLocalsPages();
  const introSkeletons = new Set(
    pages
      .filter((p) => p.pageType === "situation")
      .map((p) => p.intro.replace(/\d+/g, "N").replace(/"[^"]*"/g, "X"))
  );
  assert.ok(introSkeletons.size >= 2, `Locals-Intros folgen demselben Rahmensatz (nur ${introSkeletons.size} Variante(n) gefunden)`);
});
