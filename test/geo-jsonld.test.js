/*
 * geo-jsonld.test.js – Tests für scripts/geo/jsonld.mjs (buildJsonLd).
 * Prüft die schema.org-Grundstruktur, die Google/AI-Engines zum Parsen brauchen:
 * @context/@type auf jedem Knoten, Organization+WebSite immer dabei, FAQPage nur
 * wenn FAQ vorhanden, BreadcrumbList korrekt verkettet.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");

async function samplePage() {
  const { loadReiseData } = await import("../scripts/geo/load-sc-data.mjs");
  const { buildAllPages } = await import("../scripts/geo/content-model.mjs");
  const pages = buildAllPages(loadReiseData(), ["de"]);
  return pages.find((p) => p.pageType === "country");
}

test("buildJsonLd: liefert ein Array mit Organization + WebSite + Haupt-Entity + Breadcrumb", async () => {
  const { buildJsonLd } = await import("../scripts/geo/jsonld.mjs");
  const page = await samplePage();
  const nodes = buildJsonLd(page);

  assert.ok(Array.isArray(nodes) && nodes.length >= 4);
  assert.ok(nodes.some((n) => n["@type"] === "Organization"));
  assert.ok(nodes.some((n) => n["@type"] === "WebSite"));
  assert.ok(nodes.some((n) => n["@type"] === "Article"));
  assert.ok(nodes.some((n) => n["@type"] === "BreadcrumbList"));
  // FAQ separat, weil die Haupt-Entity (Article) keine FAQPage ist.
  assert.ok(nodes.some((n) => n["@type"] === "FAQPage"));
});

test("buildJsonLd: FAQPage-Knoten spiegelt page.faq als Question/Answer", async () => {
  const { buildJsonLd } = await import("../scripts/geo/jsonld.mjs");
  const page = await samplePage();
  const nodes = buildJsonLd(page);
  const faqNode = nodes.find((n) => n["@type"] === "FAQPage");
  assert.equal(faqNode.mainEntity.length, page.faq.length);
  assert.equal(faqNode.mainEntity[0]["@type"], "Question");
  assert.equal(faqNode.mainEntity[0].acceptedAnswer["@type"], "Answer");
  assert.ok(faqNode.mainEntity[0].name.length > 0);
  assert.ok(faqNode.mainEntity[0].acceptedAnswer.text.length > 0);
});

test("buildJsonLd: BreadcrumbList referenziert Hub + Seite in aufsteigender Position", async () => {
  const { buildJsonLd } = await import("../scripts/geo/jsonld.mjs");
  const page = await samplePage();
  const nodes = buildJsonLd(page);
  const bc = nodes.find((n) => n["@type"] === "BreadcrumbList");
  const positions = bc.itemListElement.map((it) => it.position);
  assert.deepEqual(positions, [1, 2, 3]);
  assert.equal(bc.itemListElement.at(-1).item, page.canonical);
});

test("buildJsonLd: wirft bei fehlendem schemaType/meta", async () => {
  const { buildJsonLd } = await import("../scripts/geo/jsonld.mjs");
  assert.throws(() => buildJsonLd({}), /ungültiges Seiten-Objekt/);
});

// HTML-Endtag-Matching ist ASCII-case-insensitive (HTML-Spec) - </SCRIPT> oder
// </ScRiPt> schliessen ein <script>-Element GENAUSO wie </script>. Ein rein
// case-sensitives split/join (frühere Implementierung) würde nur die exakte
// Kleinschreibung neutralisieren und Grossschreib-Varianten durchlassen.
test("toJsonLdScript: neutralisiert </script UNABHÄNGIG von Gross-/Kleinschreibung", async () => {
  const { toJsonLdScript } = await import("../scripts/geo/jsonld.mjs");
  const variants = ["</script", "</SCRIPT", "</Script", "</ScRiPt"];
  for (const variant of variants) {
    const out = toJsonLdScript([{ name: `Evil${variant}><script>alert(1)</script>` }]);
    assert.ok(!out.includes(`${variant}>`), `rohes "${variant}>" darf nicht im Output landen`);
  }
});

test("buildJsonLd: JSON.stringify() liefert gültiges, parsbares JSON", async () => {
  const { buildJsonLd } = await import("../scripts/geo/jsonld.mjs");
  const page = await samplePage();
  const nodes = buildJsonLd(page);
  const roundTrip = JSON.parse(JSON.stringify(nodes));
  assert.equal(roundTrip.length, nodes.length);
});

// Ein Array von JSON-LD-Knoten OHNE @context pro Knoten ist für Parser
// mehrdeutig (Google/Bing/KI-Crawler können "@type": "Article" ohne Vokabular
// nicht sicher als schema.org auflösen). Jeder Knoten muss daher selbstständig
// gültiges JSON-LD sein.
test("buildJsonLd: jeder Knoten trägt @context (self-contained, auch ohne umschließendes @graph)", async () => {
  const { buildJsonLd } = await import("../scripts/geo/jsonld.mjs");
  const page = await samplePage();
  const nodes = buildJsonLd(page);
  for (const n of nodes) {
    assert.equal(n["@context"], "https://schema.org", `Knoten ohne @context: ${n["@type"]}`);
  }
});

// AEO-Entitätsgraph: die Haupt-Entity referenziert die Marke explizit (nicht
// nur im Fließtext) UND – bei Länder-/Städte-Seiten – das reale geografische
// Entity, damit Answer-Engines Seite <-> Ort korrekt zuordnen können.
test("buildJsonLd: Haupt-Entity referenziert die Marke via 'mentions' und das Land via 'about'", async () => {
  const { buildJsonLd } = await import("../scripts/geo/jsonld.mjs");
  const page = await samplePage();
  const nodes = buildJsonLd(page);
  const main = nodes.find((n) => n["@type"] === "Article");
  assert.ok(Array.isArray(main.mentions) && main.mentions.some((m) => m["@id"] === "https://holaruta.com/#organization"));
  assert.equal(main.about["@type"], "Country");
  assert.ok(main.about.name && main.about.name.length > 0);
});
