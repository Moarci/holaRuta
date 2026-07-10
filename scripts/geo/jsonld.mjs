/*
 * scripts/geo/jsonld.mjs — EINE Quelle für schema.org-JSON-LD (buildJsonLd).
 *
 * Anders als der Referenz-Blueprint (der JSON-LD an zwei Stellen baut, die
 * bereits divergiert sind) gibt es hier genau eine Funktion, die sowohl der
 * Prerender-Schritt als auch die Tests nutzen. Rückgabe ist immer ein ARRAY von
 * Knoten, das der Renderer in ein einzelnes <script type="application/ld+json">
 * schreibt.
 *
 * Belegte Typen: Organization, WebSite, SoftwareApplication, Article, FAQPage,
 * HowTo (+HowToStep), Course, LearningResource, BreadcrumbList, +SpeakableSpecification.
 */
"use strict";

import { BASE_URL, BRAND, CONTENT_DATE, OG_LOCALE } from "./config.mjs";
import { plain } from "./text-utils.mjs";

const ORG_ID = `${BASE_URL}/#organization`;
const SITE_ID = `${BASE_URL}/#website`;
const SCHEMA_CONTEXT = "https://schema.org";

/** Organization-Knoten (Publisher/Autor aller Seiten). */
export function organizationNode() {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    "@id": ORG_ID,
    name: BRAND.name,
    url: `${BASE_URL}/`,
    email: BRAND.email,
    logo: `${BASE_URL}/icon-512.png`,
    sameAs: [BRAND.github],
  };
}

/** WebSite-Knoten. Bewusst OHNE SearchAction (kein echter Server-Such-Endpunkt). */
export function webSiteNode(locale = "de") {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    "@id": SITE_ID,
    name: BRAND.name,
    url: `${BASE_URL}/`,
    inLanguage: OG_LOCALE[locale] || "de_DE",
    publisher: { "@id": ORG_ID },
  };
}

/**
 * SoftwareApplication-Knoten (kostenlose Lern-Web-App). Optional `page`: wenn
 * dieser Knoten als Haupt-Entity EINER bestimmten Content-Seite dient (z. B.
 * der "Was ist HolaRuta?"-Pillar-Seite), verankert `description` +
 * `mainEntityOfPage` ihn an dieser Seite – sonst wäre er (anders als
 * Article/LearningResource/HowTo) die einzige Haupt-Entity ohne Seitenbezug.
 */
export function softwareAppNode(locale = "de", page = null) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "SoftwareApplication",
    "@id": `${BASE_URL}/#app`,
    name: BRAND.name,
    url: `${BASE_URL}/`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, Android, iOS",
    inLanguage: OG_LOCALE[locale] || "de_DE",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: { "@id": ORG_ID },
    ...(page ? { description: plain(page.meta.description), mainEntityOfPage: page.canonical } : {}),
  };
}

// Speakable-Selektoren (GEO/Voice): gezielt die zitierbaren Teile – Titel, die
// Direktantwort-Frage + ihre Antwort (Intro) und die FAQ-Q&A. BEWUSST NICHT
// "h2" pauschal: das würde auch Navigations-Überschriften wie "Weiterlesen"
// oder "Städte-Guides in diesem Land" als vorlesbare Antwort markieren.
function speakable() {
  return {
    "@type": "SpeakableSpecification",
    cssSelector: ["h1", ".geo-lede-q", ".geo-intro", ".geo-faq h3", ".geo-faq p"],
  };
}

function breadcrumbNode(page) {
  const items = [{ name: BRAND.name, url: `${BASE_URL}/` }];
  if (page.internalLinks?.hub && page.internalLinks.hub.path) {
    items.push({ name: page.internalLinks.hub.label, url: `${BASE_URL}${page.internalLinks.hub.path}` });
  }
  items.push({ name: page.h1, url: page.canonical });
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: plain(it.name),
      item: it.url,
    })),
  };
}

function faqNode(page) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    mainEntity: (page.faq || []).map((f) => ({
      "@type": "Question",
      name: plain(f.question),
      acceptedAnswer: { "@type": "Answer", text: plain(f.answer) },
    })),
  };
}

// "about"-Entity für Länder-/Städte-Seiten: verankert die Seite an einem
// realen geografischen Entity (Country/City), statt nur an einem Freitext-
// Titel – hilft Answer-Engines, Seite <-> Ort korrekt zuzuordnen.
function aboutEntity(page) {
  if (page.pageType === "country") return { "@type": "Country", name: plain(page.h1.replace(/^.*(für|for)\s+/i, "")) };
  if (page.pageType === "city") return { "@type": "City", name: plain(page.h1.replace(/^.*(für|for)\s+/i, "")) };
  return undefined;
}

// Die Marke wird in JEDER FAQ-Antwort namentlich genannt (siehe content-model.mjs)
// – "mentions" macht diese reale Ko-Referenz für Crawler/Answer-Engines explizit,
// statt sie nur implizit im Fließtext zu belassen.
function mentionsOrg() {
  return [{ "@id": ORG_ID }];
}

function articleNode(page) {
  const about = aboutEntity(page);
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    headline: plain(page.h1),
    description: plain(page.meta.description),
    inLanguage: OG_LOCALE[page.locale] || "de_DE",
    mainEntityOfPage: page.canonical,
    datePublished: CONTENT_DATE,
    dateModified: CONTENT_DATE,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    image: BRAND.ogImage,
    mentions: mentionsOrg(),
    ...(about ? { about } : {}),
    speakable: speakable(),
  };
}

function howToNode(page) {
  // Schritte aus den Bullets der ersten inhaltstragenden Sektion.
  const stepSection = (page.sections || []).find((s) => Array.isArray(s.bullets) && s.bullets.length >= 2);
  const steps = (stepSection ? stepSection.bullets : []).slice(0, 12).map((b, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    text: plain(b),
  }));
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "HowTo",
    name: plain(page.h1),
    description: plain(page.meta.description),
    inLanguage: OG_LOCALE[page.locale] || "de_DE",
    ...(steps.length ? { step: steps } : {}),
    mentions: mentionsOrg(),
    speakable: speakable(),
  };
}

function learningResourceNode(page) {
  const about = aboutEntity(page);
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "LearningResource",
    name: plain(page.h1),
    description: plain(page.meta.description),
    inLanguage: OG_LOCALE[page.locale] || "de_DE",
    learningResourceType: "Vocabulary and phrase guide",
    educationalLevel: "A1-B2",
    teaches: "Spanish for travel in Latin America",
    isAccessibleForFree: true,
    provider: { "@id": ORG_ID },
    mentions: mentionsOrg(),
    ...(about ? { about } : {}),
    speakable: speakable(),
  };
}

/**
 * Course-Knoten (Lernpfad A1–B2) – für eine künftige Kurs-/Lernpfad-Pillar-
 * Seite. HolaRuta ist ein kostenloses, unakkreditiertes Karteikarten-Tool
 * ohne Abschlussprüfung – daher bewusst OHNE "educationalCredentialAwarded"
 * (dieses Property behauptet laut schema.org einen ausgestellten Abschluss/
 * ein Zertifikat, was hier schlicht nicht zutrifft, selbst mit "(Selbst-
 * einschätzung)"-Zusatz im Wert). "competencyRequired"/"teaches" wären
 * ehrlichere Signale, falls dieser Knoten künftig genutzt wird.
 */
export function courseNode(page) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Course",
    name: plain(page.h1),
    description: plain(page.meta.description),
    inLanguage: OG_LOCALE[page.locale] || "de_DE",
    provider: { "@id": ORG_ID },
    isAccessibleForFree: true,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      inLanguage: OG_LOCALE[page.locale] || "de_DE",
    },
  };
}

const MAIN_BUILDERS = {
  Article: articleNode,
  HowTo: howToNode,
  LearningResource: learningResourceNode,
  Course: courseNode,
  FAQPage: (page) => faqNode(page),
  SoftwareApplication: (page) => softwareAppNode(page.locale, page),
};

/**
 * Baut das JSON-LD-Knotenarray für eine Content-Seite.
 * - Haupt-Entity nach page.schemaType
 * - immer Organization + WebSite (Kontext)
 * - BreadcrumbList (außer wenn Hub fehlt)
 * - separater FAQPage-Knoten, wenn FAQ vorhanden und Haupt-Entity keine FAQPage ist
 * @returns {object[]}
 */
export function buildJsonLd(page) {
  if (!page || !page.schemaType || !page.meta) {
    throw new Error("buildJsonLd: ungültiges Seiten-Objekt.");
  }
  const nodes = [organizationNode(), webSiteNode(page.locale)];
  const build = MAIN_BUILDERS[page.schemaType] || articleNode;
  nodes.push(build(page));

  if (Array.isArray(page.faq) && page.faq.length > 0 && page.schemaType !== "FAQPage") {
    nodes.push(faqNode(page));
  }
  nodes.push(breadcrumbNode(page));
  return nodes;
}

/**
 * Serialisiert JSON-LD-Knoten sicher fuer die Einbettung in ein
 * <script type="application/ld+json">-Tag.
 *
 * Wrapping: ein nackter Top-Level-Array von Knoten, die sich per "@id"
 * gegenseitig referenzieren (Article.author -> Organization etc.), ist
 * mehrdeutig zu parsen, wenn jeder Knoten nur seinen EIGENEN "@context"
 * trägt (kein gemeinsamer Geltungsbereich). Der eindeutige, spec-konforme
 * Weg für "diese Knoten gehören zu einem Graphen" ist ein umschließendes
 * {"@context":…, "@graph":[…]}. Die einzelnen Knoten behalten ihren eigenen
 * "@context" zusätzlich (redundant, aber harmlos) – so bleibt jeder Knoten
 * auch für sich genommen gültiges JSON-LD, falls er isoliert extrahiert wird.
 *
 * Danach: neutralisiert "</script" aus den Daten (z. B. ein Landesname),
 * damit es den umgebenden Script-Block nicht vorzeitig schliesst.
 * Case-insensitive (/gi), weil der HTML-Parser End-Tag-Namen
 * ASCII-case-insensitiv matcht ("</SCRIPT" schliesst genauso).
 */
export function toJsonLdScript(nodes) {
  const json = JSON.stringify({ "@context": SCHEMA_CONTEXT, "@graph": nodes }, null, 2);
  return json.replace(/<\/script/gi, "<\\/script");
}
