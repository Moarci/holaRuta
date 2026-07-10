/*
 * geo-render-html.test.js – Tests für scripts/geo/render-html.mjs (renderPage).
 * Prüft, dass jede prerenderte Seite OHNE JavaScript alles Wesentliche zeigt:
 * h1, Intro, Sektionen, FAQ, ein valides <script type=application/ld+json>,
 * canonical + hreflang, und dass Nutzerdaten (Karten-/Länder-Texte) sauber
 * HTML-escaped werden (keine Injection über Datenfelder).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");

async function samplePage(overrides = {}) {
  const { loadReiseData } = await import("../scripts/geo/load-sc-data.mjs");
  const { buildAllPages } = await import("../scripts/geo/content-model.mjs");
  const pages = buildAllPages(loadReiseData(), ["de"]);
  const page = pages.find((p) => p.pageType === "country");
  return { ...page, ...overrides };
}

test("renderPage: enthält h1, Intro, canonical, hreflang und JSON-LD-Script", async () => {
  const { renderPage } = await import("../scripts/geo/render-html.mjs");
  const page = await samplePage();
  const html = renderPage(page);

  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, new RegExp(`<html lang="${page.locale}">`));
  assert.ok(html.includes(`<h1>${page.h1}</h1>`) || html.includes(page.h1));
  assert.ok(html.includes(`<link rel="canonical" href="${page.canonical}" />`));
  assert.match(html, /<script type="application\/ld\+json">/);
  assert.match(html, /<meta name="robots" content="index, follow" \/>/);
});

// Der Script-Block ist EIN {"@context","@graph":[…]}-Objekt (eindeutig für
// per "@id" querverweisende Knoten), nicht ein nackter Array – siehe
// toJsonLdScript() in jsonld.mjs.
test("renderPage: JSON-LD-Block ist gültiges, parsbares JSON (@context + @graph)", async () => {
  const { renderPage } = await import("../scripts/geo/render-html.mjs");
  const page = await samplePage();
  const html = renderPage(page);
  const match = html.match(/<script type="application\/ld\+json">\n([\s\S]*?)\n\s*<\/script>/);
  assert.ok(match, "JSON-LD-Block gefunden");
  const parsed = JSON.parse(match[1]);
  assert.equal(parsed["@context"], "https://schema.org");
  assert.ok(Array.isArray(parsed["@graph"]) && parsed["@graph"].length > 0);
});

// Direktantwort-Block (AEO): die primäre Frage der Seite steht als eigene
// Überschrift oben, direkt gefolgt vom Intro als Antwort – das Q->A-Muster für
// Featured Snippets / AI Overviews, nicht erst im FAQ-Block am Seitenende.
test("renderPage: rendert die Seiten-Frage als geo-lede-q-Überschrift über dem Intro", async () => {
  const { renderPage } = await import("../scripts/geo/render-html.mjs");
  const { escapeHtml } = await import("../scripts/geo/text-utils.mjs");
  const page = await samplePage();
  assert.ok(page.question && page.question.toLowerCase() !== page.h1.toLowerCase(), "Länder-Seite hat eine vom H1 abweichende Frage");
  const html = renderPage(page);
  assert.ok(html.includes(`<h2 class="geo-lede-q">${escapeHtml(page.question)}</h2>`), "Frage fehlt als geo-lede-q");
  // Die Frage steht VOR dem Intro (Q->A-Reihenfolge).
  assert.ok(html.indexOf("geo-lede-q") < html.indexOf('class="geo-intro"'), "Frage muss vor dem Intro stehen");

  // Kohärenz Q->A: die Lede-Frage der Städte-Seite muss zum Coverage-Intro
  // passen (Deckungs-/Themenfrage), NICHT "welches Spanisch?" – deren Intro
  // beschreibt den Umfang des Guides, nicht die Sprachvariante.
  const { loadReiseData } = await import("../scripts/geo/load-sc-data.mjs");
  const { buildAllPages } = await import("../scripts/geo/content-model.mjs");
  const city = buildAllPages(loadReiseData(), ["de"]).find((p) => p.pageType === "city");
  assert.ok(/deckt|Themen/i.test(city.question), `Städte-Frage sollte Deckungsfrage sein, war: ${city.question}`);
  assert.ok(!/Welches Spanisch/i.test(city.question), "Städte-Lede-Frage darf nicht die Sprachvarianten-Frage sein");
});

// Pillar-Seiten setzen question === h1 (ihr H1 IST bereits die Frage) – dann
// darf die Frage NICHT ein zweites Mal als geo-lede-q darüber erscheinen.
test("renderPage: kein doppelter Frage-Block, wenn question === h1 (z. B. Pillar-Seiten)", async () => {
  const { renderPage } = await import("../scripts/geo/render-html.mjs");
  const page = await samplePage();
  const html = renderPage({ ...page, question: page.h1 });
  assert.ok(!html.includes('class="geo-lede-q"'), "geo-lede-q darf bei question === h1 nicht gerendert werden");
  assert.ok(html.includes('class="geo-intro"'), "das Intro muss trotzdem gerendert werden");
});

test("renderPage: FAQ-Fragen und -Antworten erscheinen im Body", async () => {
  const { renderPage } = await import("../scripts/geo/render-html.mjs");
  const { escapeHtml } = await import("../scripts/geo/text-utils.mjs");
  const page = await samplePage();
  const html = renderPage(page);
  for (const f of page.faq) {
    assert.ok(html.includes(escapeHtml(f.question)), `FAQ-Frage fehlt im HTML: ${f.question}`);
  }
});

test("renderPage: escaped HTML-Sonderzeichen in Datenfeldern (keine Injection)", async () => {
  const { renderPage } = await import("../scripts/geo/render-html.mjs");
  const page = await samplePage({
    h1: 'Titel mit <script>alert(1)</script> & "Anführung"',
    intro: "Intro & <b>Test</b>",
  });
  const html = renderPage(page);
  assert.ok(!html.includes("<script>alert(1)</script>"), "rohes <script> darf nicht im Body landen");
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(html.includes("Intro &amp; &lt;b&gt;Test&lt;/b&gt;"));
});

test("renderPage: hreflang-Links für jede Alternate-Sprache", async () => {
  const { loadReiseData } = await import("../scripts/geo/load-sc-data.mjs");
  const { buildAllPages } = await import("../scripts/geo/content-model.mjs");
  const { renderPage } = await import("../scripts/geo/render-html.mjs");
  const pages = buildAllPages(loadReiseData(), ["de", "en"]);
  const page = pages.find((p) => p.pageType === "country" && p.locale === "de");
  const html = renderPage(page);
  assert.match(html, /hreflang="de"/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /hreflang="x-default"/);
});

test("renderPage: relative Root-Prefix-Links passen zur Pfadtiefe", async () => {
  const { renderPage } = await import("../scripts/geo/render-html.mjs");
  const page = await samplePage();
  const html = renderPage(page);
  // Pfad "/de/<slug>/" hat Tiefe 2 -> Root-Prefix "../../"
  assert.ok(html.includes('href="../../icon.svg"'));
  assert.ok(html.includes('href="../../fonts/bricolage-grotesque-600-800-latin.woff2"'));
});

// Länder mit Städte-Guides (z. B. Kolumbien -> Cartagena/Medellín) müssen
// echte <a href>-Links auf ihre Städte im HTML tragen, nicht nur im Manifest.
test("renderPage: Länder-Seite mit Städten verlinkt diese als eigenen <a>-Block", async () => {
  const { loadReiseData } = await import("../scripts/geo/load-sc-data.mjs");
  const { buildAllPages } = await import("../scripts/geo/content-model.mjs");
  const { renderPage } = await import("../scripts/geo/render-html.mjs");
  const pages = buildAllPages(loadReiseData(), ["de"]);
  const colombia = pages.find((p) => p.key === "country:colombia" && p.locale === "de");
  assert.ok(colombia.internalLinks.cities.length > 0, "Kolumbien sollte Städte-Guides haben");
  const html = renderPage(colombia);
  for (const c of colombia.internalLinks.cities) {
    assert.ok(html.includes(`href="../../${c.path.replace(/^\//, "")}"`), `Stadt-Link fehlt im HTML: ${c.path}`);
  }
});

// Der Locals-Track ("HolaRuta · Inglés") hat eine EIGENE Marketing-Landing
// (landing-locals.html) - der Footer-Link darf nicht auf die Reise-Spanisch-
// Landing (landing.html) zeigen, die zum falschen Produkt gehört.
test("renderPage: Footer verlinkt track-abhängig auf landing.html bzw. landing-locals.html", async () => {
  const { loadReiseData, loadLocalsData } = await import("../scripts/geo/load-sc-data.mjs");
  const { buildAllPages } = await import("../scripts/geo/content-model.mjs");
  const { buildLocalsPages } = await import("../scripts/geo/locals-content.mjs");
  const { renderPage } = await import("../scripts/geo/render-html.mjs");

  const reisePage = buildAllPages(loadReiseData(), ["de"]).find((p) => p.pageType === "country");
  const reiseHtml = renderPage(reisePage);
  assert.ok(reiseHtml.includes('href="../../landing.html"'), "Reise-Seite verlinkt landing.html im Footer");
  assert.ok(!reiseHtml.includes("landing-locals.html"), "Reise-Seite darf NICHT auf landing-locals.html verlinken");

  const localsPage = buildLocalsPages(loadLocalsData().dataLocals).find((p) => p.pageType === "situation");
  const localsHtml = renderPage(localsPage);
  assert.ok(localsHtml.includes('href="../../landing-locals.html"'), "Locals-Seite verlinkt landing-locals.html im Footer");
});
