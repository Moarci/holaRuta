/*
 * geo-content-model.test.js – Tests für scripts/geo/content-model.mjs.
 * Prüft die Manifest-Invarianten, die verhindern, dass die GEO-Seiten zu
 * dünnem/duplikathaftem Content oder kaputten Cross-Links führen, über ALLE
 * drei Cluster (Länder, Städte, Situationen):
 *   - eindeutige Slugs/Canonicals je Locale
 *   - jede Seite hat Mindest-Content (Intro, >=1 Sektion, >=1 FAQ)
 *   - hreflang-Alternates sind reziprok innerhalb einer Übersetzungsgruppe
 *   - jede Land-/Stadt-Seite hat >=2 interne verwandte Links + einen Hub-Link
 *   - Städte sind bidirektional mit ihrem Land verlinkt
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");

async function loadPages() {
  const { loadReiseData } = await import("../scripts/geo/load-sc-data.mjs");
  const { buildAllPages } = await import("../scripts/geo/content-model.mjs");
  const dataset = loadReiseData();
  return buildAllPages(dataset, ["de", "en"]);
}

test("buildAllPages: erzeugt DE+EN-Seiten für jedes Land + drei Hubs pro Locale", async () => {
  const pages = await loadPages();
  const countryPages = pages.filter((p) => p.pageType === "country");
  const cityPages = pages.filter((p) => p.pageType === "city");
  const situationPages = pages.filter((p) => p.pageType === "situation");
  const hubs = pages.filter((p) => p.pageType === "hub");

  assert.ok(countryPages.length >= 30, `erwartet >=30 Länderseiten (19 Länder x 2 Sprachen), war ${countryPages.length}`);
  assert.ok(cityPages.length >= 40, `erwartet >=40 Städteseiten (20 Städte x 2 Sprachen), war ${cityPages.length}`);
  assert.ok(situationPages.length >= 60, `erwartet >=60 Situationsseiten (30 Kategorien x 2 Sprachen), war ${situationPages.length}`);
  // 3 Cluster (Länder/Städte/Situationen) x 2 Locales = 6 Hubs.
  assert.equal(hubs.length, 6, "drei Hubs (Länder/Städte/Situationen) pro Locale (de, en)");
  assert.ok(pages.every((p) => p.locale === "de" || p.locale === "en"));
});

test("buildAllPages: Städte sind bidirektional mit ihrem Land verlinkt", async () => {
  const pages = await loadPages();
  const cartagena = pages.find((p) => p.key === "city:cartagena" && p.locale === "de");
  const colombia = pages.find((p) => p.key === "country:colombia" && p.locale === "de");
  assert.ok(cartagena, "Cartagena-Seite (de) vorhanden");
  assert.ok(colombia, "Kolumbien-Seite (de) vorhanden");
  assert.equal(cartagena.internalLinks.hub.path, colombia.path, "Cartagena verlinkt als Hub auf Kolumbien");
  assert.ok(
    colombia.internalLinks.cities.some((c) => c.path === cartagena.path),
    "Kolumbien listet Cartagena unter internalLinks.cities"
  );
});

test("buildAllPages: Situations-Seiten schließen Grammatik-/Destinos-Kategorien aus", async () => {
  const pages = await loadPages();
  const situationKeys = pages.filter((p) => p.pageType === "situation").map((p) => p.key);
  assert.ok(!situationKeys.includes("situation:verbos"), "Konjugieren (Grammatik) darf keine Situationsseite sein");
  assert.ok(!situationKeys.includes("situation:tiempos"), "Zeiten (Grammatik) darf keine Situationsseite sein");
  assert.ok(!situationKeys.includes("situation:cartagena"), "Städte-Kategorien dürfen keine Situationsseite sein");
});

test("buildAllPages: Slugs und Canonicals sind je Locale eindeutig", async () => {
  const pages = await loadPages();
  const seenPaths = new Set();
  const seenCanonicals = new Set();
  for (const p of pages) {
    assert.ok(!seenPaths.has(p.path), `doppelter Pfad: ${p.path}`);
    seenPaths.add(p.path);
    assert.ok(!seenCanonicals.has(p.canonical), `doppelte Canonical: ${p.canonical}`);
    seenCanonicals.add(p.canonical);
    assert.ok(p.canonical.startsWith("https://moarci.github.io/holaRuta/"));
    assert.ok(p.path.startsWith(`/${p.locale}/`) && p.path.endsWith("/"));
  }
});

test("buildAllPages: jede Seite hat Mindest-Content (Anti-Thin-Content-Gate)", async () => {
  const pages = await loadPages();
  for (const p of pages) {
    assert.ok(p.h1 && p.h1.length > 3, `h1 fehlt/zu kurz: ${p.key}`);
    assert.ok(p.intro && p.intro.length > 20, `Intro fehlt/zu kurz: ${p.key}`);
    assert.ok(p.meta.title && p.meta.title.length <= 70, `Title fehlt/zu lang: ${p.key} (${p.meta.title?.length})`);
    assert.ok(p.meta.description && p.meta.description.length <= 160, `Description zu lang: ${p.key}`);
    assert.ok(Array.isArray(p.sections) && p.sections.length >= 1, `zu wenige Sektionen: ${p.key}`);
    assert.ok(Array.isArray(p.faq) && p.faq.length >= 1, `keine FAQ: ${p.key}`);
    for (const f of p.faq) {
      assert.ok(f.question && f.answer, `FAQ-Eintrag unvollständig: ${p.key}`);
    }
  }
});

test("buildAllPages: Länder-Seiten haben Hub-Link + genug interne verwandte Links", async () => {
  const pages = await loadPages();
  const countryPages = pages.filter((p) => p.pageType === "country");
  for (const p of countryPages) {
    assert.ok(p.internalLinks.hub && p.internalLinks.hub.path, `Hub-Link fehlt: ${p.key}`);
    assert.ok(p.internalLinks.related.length >= 2, `zu wenige related Links: ${p.key} (${p.internalLinks.related.length})`);
    assert.ok(p.internalLinks.app && p.internalLinks.app.url, `App-Rücklink fehlt: ${p.key}`);
  }
});

test("linkAlternates: hreflang-Alternates sind innerhalb der Übersetzungsgruppe reziprok", async () => {
  const pages = await loadPages();
  const byGroup = new Map();
  for (const p of pages) {
    if (!byGroup.has(p.translationGroup)) byGroup.set(p.translationGroup, []);
    byGroup.get(p.translationGroup).push(p);
  }
  for (const [group, members] of byGroup) {
    assert.equal(members.length, 2, `Übersetzungsgruppe ${group} sollte de+en enthalten`);
    for (const p of members) {
      for (const other of members) {
        assert.equal(p.alternates[other.locale], other.path, `${p.key}: alternates.${other.locale} zeigt nicht auf ${other.path}`);
      }
    }
  }
});

test("buildAllPages: Länder-FAQ enthält eine echte Phrase aus den Daten (zitierbar)", async () => {
  const pages = await loadPages();
  const mx = pages.find((p) => p.key === "country:mexico" && p.locale === "de");
  assert.ok(mx, "Mexiko-Seite (de) vorhanden");
  const hasPhraseFaq = mx.faq.some((f) => /Wie sagt man/.test(f.question));
  assert.ok(hasPhraseFaq, "mindestens ein 'Wie sagt man …'-FAQ-Eintrag");
});

// AEO: zitiert eine Answer-Engine (ChatGPT/Perplexity/Google AI Overviews) nur
// die FAQ-Antwort ohne die restliche Seite, muss die Marke trotzdem mitreisen.
// Deshalb MUSS jede einzelne FAQ-Antwort "HolaRuta" namentlich nennen – über
// alle Cluster (Länder/Städte/Situationen/Hubs) hinweg, nicht nur punktuell.
test("AEO: jede FAQ-Antwort nennt die Marke HolaRuta namentlich", async () => {
  const pages = await loadPages();
  const missing = [];
  for (const p of pages) {
    for (const f of p.faq) {
      if (!/HolaRuta/.test(f.answer)) missing.push(`${p.key} (${p.locale}): "${f.question}"`);
    }
  }
  assert.equal(missing.length, 0, `FAQ-Antworten ohne Markennennung:\n${missing.join("\n")}`);
});

test("buildAllPages: Städte-Seiten haben Hub-Link (Land) + genug interne verwandte Links", async () => {
  const pages = await loadPages();
  const cityPages = pages.filter((p) => p.pageType === "city");
  assert.ok(cityPages.length > 0, "mindestens eine Stadt-Seite vorhanden");
  for (const p of cityPages) {
    assert.ok(p.internalLinks.hub && p.internalLinks.hub.path, `Hub-Link fehlt: ${p.key}`);
    assert.ok(p.internalLinks.related.length >= 2, `zu wenige related Links: ${p.key} (${p.internalLinks.related.length})`);
  }
});

test("buildAllPages: Situations-Seiten haben Hub-Link + genug interne verwandte Links", async () => {
  const pages = await loadPages();
  const situationPages = pages.filter((p) => p.pageType === "situation");
  assert.ok(situationPages.length > 0, "mindestens eine Situations-Seite vorhanden");
  for (const p of situationPages) {
    assert.ok(p.internalLinks.hub && p.internalLinks.hub.path, `Hub-Link fehlt: ${p.key}`);
    assert.ok(p.internalLinks.related.length >= 2, `zu wenige related Links: ${p.key} (${p.internalLinks.related.length})`);
  }
});

// Regressionstest: Intro/FAQ dürfen nur Zahlen nennen, die auch tatsächlich
// als Sätze/Wörter auf der Seite erscheinen (nicht die volle Kartenzahl der
// Kategorie, die bei Kategorien mit vielen Karten - z. B. "Zahlen" mit 110 -
// gekappt wird). Prüft konkret den Extremfall.
test("buildAllPages: genannte Sätze-/Wörter-Zahl in Intro entspricht der Anzahl gezeigter Bullets (kein Zahlen-Overclaim)", async () => {
  const pages = await loadPages();
  const zahlen = pages.find((p) => p.key === "situation:zahlen" && p.locale === "de");
  assert.ok(zahlen, "Situations-Seite 'Zahlen' (de) vorhanden");
  const shownBullets = zahlen.sections.reduce((n, s) => n + (s.bullets?.length || 0), 0);
  // Intro rotiert über mehrere Formulierungsvarianten (siehe T.de.situationIntro
  // in content-model.mjs) - die exakte Phrase ist daher NICHT fixiert, nur die
  // genannte Zahl muss stimmen.
  const m = zahlen.intro.match(/(\d+)/);
  assert.ok(m, "Intro nennt eine Zahl");
  assert.equal(Number(m[1]), shownBullets, `Intro behauptet ${m[1]} Sätze, gezeigt werden aber ${shownBullets}`);

  for (const p of pages.filter((p) => p.pageType === "city" || p.pageType === "situation")) {
    const shown = p.sections.reduce((n, s) => n + (s.bullets?.length || 0), 0);
    const introNum = p.intro.match(/(\d+)/);
    if (introNum) {
      assert.ok(Number(introNum[1]) <= shown, `${p.key}: Intro nennt ${introNum[1]}, aber nur ${shown} Bullets gezeigt`);
    }
  }
});

// Doorway-Page-Regression: Städte-/Situations-Seiten teilten sich früher EINE
// Intro-Vorlage (nur Name/Land/Zahl unterschieden sich) - über 24 bzw. 37
// Seiten liest sich das wie automatisiertes copy-paste. Prüft, dass die
// rotierenden Varianten (content-model.mjs: T.*.cityIntro/situationIntro)
// tatsächlich mehrere unterschiedliche Rahmensätze erzeugen, nicht nur einen.
test("AEO/Content-Qualität: Städte-/Situations-Intros rotieren über mehrere Formulierungen (kein Doorway-Page-Muster)", async () => {
  const pages = await loadPages();
  for (const pageType of ["city", "situation"]) {
    for (const locale of ["de", "en"]) {
      const introSkeletons = new Set(
        pages
          .filter((p) => p.pageType === pageType && p.locale === locale)
          .map((p) => p.intro.replace(/\d+/g, "N").replace(/["„“][^"„“]*["“]|\([^)]*\)|\b[A-ZÄÖÜ][\wÀ-ÿ' -]*\b/g, "X"))
      );
      assert.ok(
        introSkeletons.size >= 2,
        `${pageType}/${locale}: alle Intros folgen demselben Rahmensatz (nur ${introSkeletons.size} Variante(n) gefunden)`
      );
    }
  }
});
