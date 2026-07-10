/*
 * scripts/geo/locals-content.mjs — Locals-Track (es-en): spanischsprachige
 * Hotel-/Guide-/Taxi-Mitarbeiter lernen Englisch fürs Arbeiten ("HolaRuta ·
 * Inglés" / "English at Work"). EIGENES Produkt mit eigenem Korpus
 * (data.locals.js, SC.dataLocals) - nicht die Kehrseite des Reise-Tracks.
 *
 * Nur ES: die Zielgruppe ist spanischsprachig, es gibt keine DE/EN-Spiegelung
 * dieser Seiten (anders als der Reise-Cluster). Jede Übersetzungsgruppe hat
 * daher genau 1 Mitglied - linkAlternates() setzt hreflang="es" (self), ohne
 * x-default (kein zweites Locale zum Vergleichen).
 *
 * AEO-Prinzip wie im Reise-Cluster: jede FAQ-Antwort nennt "HolaRuta" namentlich.
 */
"use strict";

import { BASE_URL, absoluteUrl } from "./config.mjs";
import { plain, truncate, slugify, stripParenthetical } from "./text-utils.mjs";

const LOCALE = "es";
const APP_LINK = { url: `${BASE_URL}/?edition=ingles-pro`, label: "Abrir HolaRuta · Inglés" };
const HUB_SLUG = "ingles-para-hosteleria-y-turismo";
const HUB_LABEL = "Inglés para hostelería y turismo";
const PILLAR_SLUG = "que-es-holaruta-ingles";

function pagePath(slug) {
  return `/${LOCALE}/${slug}/`;
}

function buildTitle(base, max = 70) {
  const suffix = " | HolaRuta";
  if (`${base}${suffix}`.length <= max) return `${base}${suffix}`;
  return `${truncate(base, max - suffix.length)}${suffix}`;
}

function categorySlug(cat) {
  return slugify(`Ingles para ${cat.label}`);
}

// Manche Kategorien teilen sich denselben Label-Text (z. B. "El clima" als
// Einsteiger- UND als Vokabel-Kategorie mit unterschiedlicher cat.id) -> ohne
// Entschärfung würden zwei Seiten denselben Slug/Canonical bekommen. Bei
// Kollision wird die (garantiert eindeutige) cat.id an den Slug angehängt.
function dedupeSlug(baseSlug, cat, seen) {
  if (!seen.has(baseSlug)) {
    seen.add(baseSlug);
    return baseSlug;
  }
  const disambiguated = `${baseSlug}-${slugify(cat.id)}`;
  seen.add(disambiguated);
  return disambiguated;
}

function cardLine(card) {
  return `"${plain(card.es)}" - "${plain(card.en)}"${card.tip ? ` (${plain(card.tip)})` : ""}`;
}

// Menschlich lesbare Namen für die 9 Themen-Gruppen (Sektions-Überschriften des Hubs).
const GROUP_LABEL = {
  "loc-hosp": "Hostelería y restauración",
  "loc-dia": "Diálogos y trato con clientes",
  "loc-trab": "En el trabajo",
  "loc-esc": "Gramática e inglés básico",
  "loc-voc": "Vocabulario esencial",
  "loc-b2": "Inglés avanzado (B2)",
  "loc-med": "Cultura y entorno",
  "loc-cult": "Estilo de vida",
  "loc-nino": "Vocabulario cotidiano",
};

// 3 Formulierungsvarianten für Intro + FAQ-Abschluss (rotiert per Kategorie-
// Index): eine einzige Vorlage über 151 Kategorie-Seiten - nur Name/Zahl
// unterscheiden sich - liest sich für Quality-Rater/Crawler wie eine
// formelhafte Doorway-Page. Das zugrundeliegende Vokabular je Seite ist echt
// und einzigartig; nur der Rahmensatz wird jetzt variiert.
const INTRO_VARIANTS = [
  (label, count) => `Estas ${count} palabras y frases de inglés para "${label}" te ayudan a atender a huéspedes y turistas en tu trabajo - vocabulario real, extraído del corpus de tarjetas de HolaRuta · Inglés.`,
  (label, count) => `Para "${label}" en el trabajo necesitas estas ${count} palabras y frases de inglés - vocabulario real del corpus de tarjetas de HolaRuta · Inglés, listo para practicar.`,
  (label, count) => `${count} palabras y frases de inglés para dominar "${label}" con huéspedes y turistas - directo del corpus real de HolaRuta · Inglés, sin relleno de manual.`,
];
const CLOSER_FAQ_VARIANTS = [
  (label, count) => `HolaRuta · Inglés reúne ${count} palabras y frases reales para "${label}", listas para practicar con repetición espaciada antes de tu turno de trabajo.`,
  (label, count) => `Para "${label}" necesitas justo estas ${count} palabras y frases - HolaRuta · Inglés las organiza con repetición espaciada para que las tengas listas antes de tu turno.`,
  (label, count) => `HolaRuta · Inglés convierte estas ${count} palabras y frases de "${label}" en tarjetas con repetición espaciada, para que las recuerdes justo cuando las necesites en el trabajo.`,
];

function buildCategoryPage(cat, cards, slug, index) {
  const path = pagePath(slug);
  const h1 = `${cat.label}: vocabulario de inglés para el trabajo`;

  // Sektionen ZUERST bauen: cards.length wäre irreführend, sobald eine
  // Kategorie mehr als 28 Karten hat - Intro/FAQ nennen nur, was tatsächlich
  // angezeigt wird.
  const basics = cards.filter((c) => c.lvl <= 1).slice(0, 14);
  const advanced = cards.filter((c) => c.lvl > 1).slice(0, 14);
  const sections = [];
  if (basics.length) sections.push({ heading: "Frases esenciales", bullets: basics.map(cardLine) });
  if (advanced.length) sections.push({ heading: "Más vocabulario útil", bullets: advanced.map(cardLine) });
  if (!sections.length) sections.push({ heading: "Vocabulario", bullets: cards.slice(0, 20).map(cardLine) });
  const shownCount = sections.reduce((n, s) => n + (s.bullets?.length || 0), 0);

  const intro = truncate(INTRO_VARIANTS[index % INTRO_VARIANTS.length](cat.label, shownCount), 300);

  const faq = [];
  for (const c of cards.slice(0, 3)) {
    faq.push({
      question: `¿Cómo se dice "${stripParenthetical(c.es)}" en inglés?`,
      answer: `En inglés: "${plain(c.en)}"${c.tip ? ` (pronunciación: ${plain(c.tip)})` : ""}. Puedes practicar esta frase como tarjeta en la app HolaRuta · Inglés.`,
    });
  }
  faq.push({
    question: `¿Qué necesito saber de inglés para "${cat.label}"?`,
    answer: CLOSER_FAQ_VARIANTS[index % CLOSER_FAQ_VARIANTS.length](cat.label, shownCount),
  });

  return {
    key: `locals:${cat.id}`,
    track: "locals",
    locale: LOCALE,
    slug,
    path,
    canonical: absoluteUrl(path),
    pageType: "situation",
    schemaType: "LearningResource",
    meta: { title: buildTitle(h1), description: truncate(intro, 155) },
    h1,
    question: `¿Qué necesito saber de inglés para "${cat.label}"?`,
    intro,
    sections,
    faq,
    internalLinks: {
      hub: { path: pagePath(HUB_SLUG), label: HUB_LABEL },
      related: [],
      app: APP_LINK,
    },
    translationGroup: `locals:${cat.id}`,
    alternates: {},
    source: "data:locals",
    _group: cat.group || "",
    _index: index,
  };
}

// Ring-Auswahl statt "immer die ersten 3 der Gruppe": bei .slice(0,3) auf
// einer für alle Seiten GLEICHEN Gruppen-Reihenfolge verlinken in großen
// Gruppen (bis zu 20+ Kategorien) praktisch alle Seiten auf dieselben 3-4
// Geschwister, während der Rest NIE als "related" gewählt wird - also nie ein
// eingehendes Sibling-Link bekommt. Mit fester Verschiebung (+1/+2/+3 Position
// im Ring) bekommt jede Seite g garantiert bis zu 3 eingehende Links, von den
// Seiten an Position g-1/g-2/g-3.
function fillRelated(pages) {
  const byGroup = new Map();
  for (const p of pages) {
    if (!byGroup.has(p._group)) byGroup.set(p._group, []);
    byGroup.get(p._group).push(p);
  }
  for (const p of pages) {
    const ring = byGroup.get(p._group) || [];
    const selfIdx = ring.indexOf(p);
    const peers = [1, 2, 3]
      .map((offset) => ring[(selfIdx + offset) % ring.length])
      .filter((q) => q && q.key !== p.key);
    p.internalLinks.related = peers.map((q) => ({ path: q.path, label: q.h1 }));
    if (p.internalLinks.related.length < 2) {
      const others = pages.filter((q) => q.key !== p.key).slice(0, 3);
      p.internalLinks.related = others.map((q) => ({ path: q.path, label: q.h1 }));
    }
  }
}

function buildHubPage(categoryPages, pillarPage) {
  const path = pagePath(HUB_SLUG);
  const byGroup = new Map();
  for (const p of categoryPages) {
    if (!byGroup.has(p._group)) byGroup.set(p._group, []);
    byGroup.get(p._group).push(p);
  }
  const sections = [...byGroup.entries()].map(([group, pages]) => ({
    heading: GROUP_LABEL[group] || group,
    bullets: pages.map((p) => p.h1),
  }));
  const intro = "HolaRuta · Inglés organiza el inglés para el trabajo en turismo y hostelería por temas reales: recepción, restaurante, quejas de huéspedes, entrevistas de trabajo. Cada guía trae el vocabulario exacto que necesitas en ese momento.";

  return {
    key: "hub:locals",
    track: "locals",
    locale: LOCALE,
    slug: HUB_SLUG,
    path,
    canonical: absoluteUrl(path),
    pageType: "hub",
    schemaType: "Article",
    meta: { title: buildTitle(`${HUB_LABEL}: todas las guías`), description: truncate(intro, 155) },
    h1: HUB_LABEL,
    question: "¿Qué guías de inglés para el trabajo ofrece HolaRuta?",
    intro,
    sections,
    faq: [
      {
        question: "¿Qué guías de inglés para el trabajo ofrece HolaRuta?",
        answer: `HolaRuta · Inglés ofrece ${categoryPages.length} guías temáticas de inglés para hostelería y turismo, cada una con frases reales listas para practicar como tarjetas.`,
      },
    ],
    internalLinks: {
      // ALLE Kategorie-Seiten + die Pillar-Seite verlinken (kein .slice-
      // Deckel): der Hub ist die einzige zuverlässige Quelle für eingehende
      // Links auf Seiten, deren Gruppe im Ring (fillRelated) nicht jede Seite
      // abdeckt. Ohne das waren 71 von 151 ES-Seiten UND die Pillar-Seite
      // ("¿Qué es HolaRuta · Inglés?") von nirgendwo aus erreichbar.
      hub: null,
      related: [
        ...(pillarPage ? [{ path: pillarPage.path, label: pillarPage.h1 }] : []),
        ...categoryPages.map((p) => ({ path: p.path, label: p.h1 })),
      ],
      app: APP_LINK,
    },
    translationGroup: "hub:locals",
    alternates: {},
    source: "generated:hub",
  };
}

function buildPillarPage(cardCount) {
  const path = pagePath(PILLAR_SLUG);
  const intro = "HolaRuta · Inglés es la versión invertida de HolaRuta: en vez de turistas aprendiendo español, es para trabajadores de hostelería y turismo en Latinoamérica que necesitan inglés para atender a huéspedes extranjeros - recepcionistas, meseros, guías turísticos y taxistas.";
  return {
    key: "pillar:locals-what-is",
    track: "locals",
    locale: LOCALE,
    slug: PILLAR_SLUG,
    path,
    canonical: absoluteUrl(path),
    pageType: "pillar",
    schemaType: "SoftwareApplication",
    meta: { title: buildTitle("¿Qué es HolaRuta · Inglés?"), description: truncate(intro, 155) },
    h1: "¿Qué es HolaRuta · Inglés?",
    question: "¿Qué es HolaRuta · Inglés?",
    intro,
    sections: [
      {
        heading: "¿Para quién es HolaRuta · Inglés?",
        paragraphs: ["HolaRuta · Inglés está pensado para personal de hostelería y turismo: recepción, meseros, guías, taxistas y cualquier persona que atienda turistas extranjeros y necesite inglés práctico para el trabajo, no inglés de salón de clases."],
      },
      {
        heading: "¿Qué incluye?",
        bullets: [
          `${cardCount} tarjetas de inglés organizadas por situación real de trabajo (recepción, restaurante, quejas, entrevistas de trabajo).`,
          "Pronunciación adaptada para hispanohablantes (ej. 'de NIÚS-pei-per' para 'the newspaper').",
          "Repetición espaciada: HolaRuta programa cada tarjeta para repetirse justo antes de que la olvides.",
          "Gratis, sin cuenta obligatoria, funciona sin conexión a internet.",
        ],
      },
    ],
    faq: [
      { question: "¿HolaRuta · Inglés es gratis?", answer: "Sí. HolaRuta · Inglés es completamente gratuito, sin suscripción ni costos ocultos." },
      { question: "¿Necesito una cuenta para usar HolaRuta · Inglés?", answer: "No. HolaRuta · Inglés funciona sin cuenta ni inicio de sesión; tu progreso se guarda localmente en tu dispositivo." },
      { question: "¿HolaRuta · Inglés funciona sin internet?", answer: "Sí. HolaRuta · Inglés es una aplicación web instalable (PWA) que funciona completamente sin conexión después de la primera instalación." },
    ],
    internalLinks: { hub: { path: pagePath(HUB_SLUG), label: HUB_LABEL }, related: [], app: APP_LINK },
    translationGroup: "pillar:locals-what-is",
    alternates: {},
    source: "pillar",
  };
}

/**
 * Baut den Locals-Cluster (Kategorie-Guides + Hub + 1 Pillar-Seite), rein ES.
 * @param {object} dataLocals SC.dataLocals ({ CATEGORIES, CARDS })
 * @returns {object[]}
 */
export function buildLocalsPages(dataLocals) {
  const cardsByCat = new Map();
  for (const c of dataLocals.CARDS) {
    if (!cardsByCat.has(c.cat)) cardsByCat.set(c.cat, []);
    cardsByCat.get(c.cat).push(c);
  }

  const seenSlugs = new Set();
  const categoryPages = dataLocals.CATEGORIES
    .filter((cat) => (cardsByCat.get(cat.id) || []).length > 0)
    .map((cat, i) => {
      const slug = dedupeSlug(categorySlug(cat), cat, seenSlugs);
      return buildCategoryPage(cat, cardsByCat.get(cat.id) || [], slug, i);
    });
  fillRelated(categoryPages);

  const pillarPage = buildPillarPage(dataLocals.CARDS.length);
  const pages = [pillarPage, buildHubPage(categoryPages, pillarPage), ...categoryPages];

  // Locals-Track ist ES-only: jede Übersetzungsgruppe hat 1 Mitglied -> hreflang="es" (self).
  for (const p of pages) p.alternates = { [p.locale]: p.path };

  return pages.map(({ _group, _index, ...clean }) => clean);
}
