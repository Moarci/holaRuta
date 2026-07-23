/*
 * scripts/geo/content-model.mjs — baut die Seiten-Objekte (das "Manifest") aus
 * den App-Daten. Rein funktional, keine I/O außer über den übergebenen Datensatz.
 *
 * Seiten-Objekt-Shape:
 *   { key, track, locale, slug, path, canonical, pageType, schemaType,
 *     meta:{title, description}, h1, question, intro,
 *     sections:[{heading, paragraphs[], bullets[]}], faq:[{question, answer}],
 *     internalLinks:{hub, related[], cities[]?, app}, translationGroup,
 *     alternates:{de?,en?,es?}, source }
 *
 * Cluster:
 *   - Länder-Guides (countries.js) + Hub          -> pageType "country"/"hub"
 *   - Städte-Guides (data.js CARDS, cat="destinos") + Hub -> pageType "city"/"hub"
 *     Jede Stadt ist an ihr Land verlinkt (Breadcrumb-Hub + Cross-Links).
 *   - Situations-Guides (data.js CATEGORIES, Reise-relevante Kategorien) + Hub
 *     -> pageType "situation"/"hub"
 *
 * AEO-Prinzip: JEDE FAQ-Antwort nennt "HolaRuta" namentlich (nicht nur die
 * Frage) – zitiert eine KI-Suche/Answer-Engine die Antwort, reist die Marke
 * automatisch mit statt verloren zu gehen. Weitere Cluster (Locals/ES) docken
 * über eigene build*-Funktionen an und laufen durch dieselbe
 * linkAlternates()-Nachbearbeitung.
 */
"use strict";

import { APP_URL, BASE_URL, BRAND, absoluteUrl } from "./config.mjs";
import { slugify, truncate, plain, firstSentence, loc, stripParenthetical } from "./text-utils.mjs";
import { buildPillarPages } from "./pillar-content.mjs";

// ---------------------------------------------------------------------------
// Lokalisierte Vorlagen-Bausteine (nur die getemplateten Rahmentexte; die
// eigentliche Substanz kommt aus den Daten).
// ---------------------------------------------------------------------------
const T = {
  de: {
    hubSlug: "reise-spanisch-lateinamerika",
    hubLabel: "Reise-Spanisch für Lateinamerika",
    countryPrefix: "Reise-Spanisch für",
    titleSuffix: "Wörter, Slang & Kultur",
    citySuffix: "nützliche Sätze für unterwegs",
    cityHubSlug: "spanisch-staedte-guides-lateinamerika",
    cityHubLabel: "Städte-Guides für Lateinamerika",
    situationSuffix: "Spanisch-Sätze für unterwegs",
    situationHubSlug: "spanisch-reisesituationen-lateinamerika",
    situationHubLabel: "Spanisch für Reisesituationen",
    sec: { language: "Welches Spanisch spricht man hier?", about: "Land & Kultur", history: "Geschichte in Kürze", facts: "Land & Leute", food: "Essen & Trinken", words: "Nützliche Wörter & Slang", examples: "Beispielsätze aus der App", tip: "Reisetipp", cities: "Städte-Guides in diesem Land", phrases: "Wörter & Sätze" },
    openApp: "HolaRuta-App öffnen",
    related: "Weitere Länder",
    allCitiesLabel: "Alle Städte-Guides",
    allSituationsLabel: "Alle Situations-Guides",
    cityRelatedLabel: "Städte-Guides in diesem Land",
    citySiblingLabel: "Weitere Städte in der Region",
    situationSiblingLabel: "Weitere Reisesituationen",
    faq: {
      whichSpanish: (n) => `Welches Spanisch spricht man in ${n}?`,
      whichSpanishA: (s) => `${s} Die HolaRuta-App übt genau diesen Klang und Wortschatz mit dir, bevor du landest.`,
      slang: (n) => `Welche Slang-Wörter sollte ich in ${n} kennen?`,
      slangA: (list) => `Typisch sind zum Beispiel: ${list}. HolaRuta sammelt diese Ausdrücke als Karteikarten, damit du sie unterwegs sofort parat hast.`,
      howSay: (phrase, n) => `Wie sagt man „${phrase}" in ${n}?`,
      howSayA: (es) => `Auf lokalem Spanisch: „${es}". Diesen Satz übst du als Karteikarte direkt in der HolaRuta-App, inklusive Aussprache-Tipp.`,
      tryFood: (n) => `Was sollte ich in ${n} unbedingt probieren?`,
      tryFoodA: (line) => `${line} HolaRuta liefert dir dazu auch die passenden Bestell-Sätze auf Spanisch.`,
      hard: (n) => `Ist Reise-Spanisch für ${n} schwer zu lernen?`,
      hardA: (n) => `Nein. Mit HolaRuta lernst du gezielt die Situations-Phrasen, die du in ${n} wirklich brauchst – am Busterminal, im Hostel, auf dem Markt –, statt Grammatik fürs Klassenzimmer.`,
    },
    hubIntro: "Jedes spanischsprachige Land in Lateinamerika hat seinen eigenen Klang, sein eigenes Slang und seine eigenen Reisesituationen. Diese Guides fassen pro Land zusammen, welches Spanisch dich erwartet, welche Wörter du kennen solltest und was kulturell wichtig ist.",
    hubQuestion: "Wie unterscheidet sich das Spanisch in Lateinamerika von Land zu Land?",
    cityHubIntro: "Von Cartagena bis Bariloche: Diese Städte-Guides sammeln den Spanisch-Wortschatz, den Backpacker in den beliebtesten Reisezielen Lateinamerikas wirklich brauchen – von der Ankunft bis zum letzten Abend.",
    cityHubQuestion: "Welche Spanisch-Guides gibt es für einzelne Städte in Lateinamerika?",
    situationHubIntro: "Notfall, Bank, Apotheke, Busreise oder Smalltalk: Diese Guides bündeln den Spanisch-Wortschatz für konkrete Reisesituationen in Lateinamerika, direkt aus dem echten HolaRuta-Kartenkorpus.",
    situationHubQuestion: "Welche Spanisch-Guides gibt es für einzelne Reisesituationen?",
    hubFaqA: (s) => `${s} HolaRuta bündelt all diese Guides an einem Ort, direkt neben den passenden Lernkarten.`,
    cityHubFaqA: (s) => `${s} Jede Stadt ist mit ihrem Länder-Guide UND ihren Lernkarten in der HolaRuta-App verlinkt.`,
    situationHubFaqA: (s) => `${s} Alle Sätze sind eins zu eins die Karteikarten aus der HolaRuta-App.`,
    langNote: "Deutsch",
    citySituationsFaq: {
      cityWhat: (n) => `Welche Themen deckt der Spanisch-Guide für ${n} ab?`,
      cityWhatA: (n, count) => `Der Guide für ${n} bündelt ${count} reisetaugliche Sätze und Wörter – von der Ankunft über Unterkunft und Essen bis zum Ausgehen. Du kannst sie alle direkt in der HolaRuta-App als Karteikarten lernen.`,
      situNeed: (n) => `Welche Spanisch-Sätze brauche ich für ${n} auf Reisen?`,
      situNeedA: (n, count) => `Für „${n}" hat HolaRuta ${count} praxisnahe Sätze und Wörter zusammengestellt, mit denen du dich in echten Situationen unterwegs verständigst.`,
      situWhy: (n) => `Warum sollte ich ${n}-Vokabeln vor der Reise lernen?`,
      // 3 Varianten (rotiert per Kategorie-Index) statt einer einzigen Antwort
      // für alle 37+151 Situations-/Locals-Seiten – sonst liest sich der FAQ-
      // Abschluss über viele Seiten hinweg wie copy-paste (Doorway-Page-Risiko).
      situWhyA: [
        (n) => `Weil dich genau diese Sätze im Alltag erwarten. HolaRuta nutzt Spaced Repetition, damit „${n}"-Vokabeln vor der Abreise wirklich sitzen, statt nach der ersten Anwendung wieder zu verschwinden.`,
        (n) => `Weil du sie garantiert brauchst, sobald du unterwegs bist. HolaRuta plant „${n}"-Vokabeln mit Spaced Repetition genau so ein, dass sie zur Abreise wirklich sitzen.`,
        (n) => `Weil einmal Lesen nicht reicht: HolaRuta wiederholt „${n}"-Vokabeln mit Spaced Repetition automatisch im richtigen Abstand, bis sie auch unter Reisestress abrufbar sind.`,
      ],
    },
    // Intro-Varianten für Städte-/Situations-Seiten (rotiert per Index): eine
    // einzige Vorlage über 24 Städte bzw. 37 Situationen hinweg – nur Name/
    // Land/Zahl unterscheiden sich – liest sich für Quality-Rater/Crawler wie
    // eine formelhafte Doorway-Page. Der zugrundeliegende Wortschatz je Seite
    // ist echt und einzigartig; nur der Rahmensatz wird jetzt variiert.
    cityIntro: [
      (name, countryName, n) => `In ${name} (${countryName}) hilft dir dieser Spanisch-Wortschatz für ${n} typische Reisesituationen – von der Ankunft bis zum Ausgehen.`,
      (name, countryName, n) => `${name} auf Spanisch meistern: Diese ${n} Sätze aus dem HolaRuta-Kartenkorpus decken alles ab, was in ${countryName} vor Ort wirklich vorkommt.`,
      (name, countryName, n) => `Wer nach ${name} (${countryName}) reist, kommt mit diesen ${n} Spanisch-Sätzen durch Taxi, Unterkunft, Essen und Ausgehen.`,
    ],
    situationIntro: [
      (name, n) => `Diese ${n} Sätze und Wörter brauchst du auf Spanisch für „${name}" unterwegs in Lateinamerika – direkt aus dem echten HolaRuta-Kartenkorpus.`,
      (name, n) => `„${name}" auf Spanisch: ${n} praxiserprobte Sätze und Wörter aus dem HolaRuta-Kartenkorpus, gezielt für unterwegs in Lateinamerika.`,
      (name, n) => `Für „${name}" unterwegs in Lateinamerika reichen diese ${n} Sätze und Wörter – reales Vokabular aus dem HolaRuta-Kartenkorpus, keine Lehrbuch-Floskeln.`,
    ],
  },
  en: {
    hubSlug: "travel-spanish-latin-america",
    hubLabel: "Travel Spanish for Latin America",
    countryPrefix: "Travel Spanish for",
    titleSuffix: "words, slang & culture",
    citySuffix: "useful phrases for travel",
    cityHubSlug: "spanish-city-guides-latin-america",
    cityHubLabel: "City guides for Latin America",
    situationSuffix: "Spanish phrases for travel",
    situationHubSlug: "spanish-travel-situations-latin-america",
    situationHubLabel: "Spanish for travel situations",
    sec: { language: "What Spanish is spoken here?", about: "Country & culture", history: "History in brief", facts: "Country & people", food: "Food & drink", words: "Useful words & slang", examples: "Example sentences from the app", tip: "Travel tip", cities: "City guides in this country", phrases: "Words & phrases" },
    openApp: "Open the HolaRuta app",
    related: "More countries",
    allCitiesLabel: "All city guides",
    allSituationsLabel: "All situation guides",
    cityRelatedLabel: "City guides in this country",
    citySiblingLabel: "More cities in the region",
    situationSiblingLabel: "More travel situations",
    faq: {
      whichSpanish: (n) => `What kind of Spanish is spoken in ${n}?`,
      whichSpanishA: (s) => `${s} The HolaRuta app drills exactly this accent and vocabulary before you land.`,
      slang: (n) => `What slang should I know in ${n}?`,
      slangA: (list) => `Common examples include: ${list}. HolaRuta turns these into flashcards so you have them ready on the road.`,
      howSay: (phrase, n) => `How do you say "${phrase}" in ${n}?`,
      howSayA: (es) => `In local Spanish: "${es}". You can practise this exact phrase as a flashcard in the HolaRuta app, pronunciation tip included.`,
      tryFood: (n) => `What should I try in ${n}?`,
      tryFoodA: (line) => `${line} HolaRuta also teaches you the matching Spanish phrases to order it.`,
      hard: (n) => `Is travel Spanish for ${n} hard to learn?`,
      hardA: (n) => `No. With HolaRuta you learn the situational phrases you actually need in ${n} — at the bus terminal, in the hostel, at the market — instead of classroom grammar.`,
    },
    hubIntro: "Every Spanish-speaking country in Latin America has its own sound, its own slang and its own travel situations. These guides summarise, country by country, what Spanish to expect, which words to know and what matters culturally.",
    hubQuestion: "How does Spanish differ from country to country in Latin America?",
    cityHubIntro: "From Cartagena to Bariloche: these city guides collect the Spanish vocabulary backpackers actually need in Latin America's most popular destinations — from arrival to the last night out.",
    cityHubQuestion: "Which Spanish guides exist for individual cities in Latin America?",
    situationHubIntro: "Emergencies, banking, the pharmacy, bus travel or small talk: these guides bundle the Spanish vocabulary for concrete travel situations in Latin America, sourced straight from HolaRuta's real flashcard corpus.",
    situationHubQuestion: "Which Spanish guides exist for individual travel situations?",
    hubFaqA: (s) => `${s} HolaRuta bundles all these guides in one place, right next to the matching flashcards.`,
    cityHubFaqA: (s) => `${s} Every city is linked to its country guide AND its flashcards in the HolaRuta app.`,
    situationHubFaqA: (s) => `${s} Every phrase here is, one to one, a flashcard from the HolaRuta app.`,
    langNote: "English",
    citySituationsFaq: {
      cityWhat: (n) => `What topics does the Spanish guide for ${n} cover?`,
      cityWhatA: (n, count) => `The guide for ${n} bundles ${count} travel-ready words and phrases — from arrival through accommodation and food to going out. You can learn all of them as flashcards in the HolaRuta app.`,
      situNeed: (n) => `What Spanish phrases do I need for ${n} while travelling?`,
      situNeedA: (n, count) => `For "${n}", HolaRuta has put together ${count} practical words and phrases so you can communicate in real situations on the road.`,
      situWhy: (n) => `Why should I learn ${n} vocabulary before the trip?`,
      situWhyA: [
        (n) => `Because these are exactly the phrases you'll run into. HolaRuta uses spaced repetition so "${n}" vocabulary actually sticks before departure, instead of fading after the first use.`,
        (n) => `Because you'll need it the moment you land. HolaRuta schedules "${n}" vocabulary with spaced repetition so it's actually ready before you leave, not just skimmed once.`,
        (n) => `Because reading a list once doesn't stick. HolaRuta reviews "${n}" vocabulary at increasing intervals until it's recallable even under travel stress.`,
      ],
    },
    cityIntro: [
      (name, countryName, n) => `In ${name} (${countryName}), this Spanish phrase set covers ${n} everyday travel situations — from arrival to going out.`,
      (name, countryName, n) => `Heading to ${name}? These ${n} Spanish phrases from the HolaRuta flashcard corpus cover what actually comes up in ${countryName}.`,
      (name, countryName, n) => `${n} real Spanish phrases for ${name} (${countryName}) — taxis, accommodation, food and going out, all in one list.`,
    ],
    situationIntro: [
      (name, n) => `These ${n} words and phrases cover "${name}" in Spanish for travel across Latin America — real, situation-tested vocabulary from the HolaRuta flashcard corpus.`,
      (name, n) => `"${name}" in Spanish, for real travel situations: ${n} words and phrases from the HolaRuta flashcard corpus, built for getting around Latin America.`,
      (name, n) => `${n} field-tested Spanish words and phrases for "${name}" — no textbook filler, just what you'll actually need on the road in Latin America.`,
    ],
  },
};

function pagePath(locale, slug) {
  return `/${locale}/${slug}/`;
}

// <title> auf <=70 Zeichen halten: Marken-Suffix hat Vorrang, der Rest wird
// wortgrenzen-sicher gekürzt (statt lange Namen einfach abzuschneiden).
function buildTitle(base, max = 70) {
  const suffix = ` | ${BRAND.name}`;
  if (`${base}${suffix}`.length <= max) return `${base}${suffix}`;
  return `${truncate(base, max - suffix.length)}${suffix}`;
}

function appLink(t) {
  return { url: `${APP_URL}/`, label: t.openApp };
}

// ---------------------------------------------------------------------------
// Länder-Guides
// ---------------------------------------------------------------------------
function countrySlug(country, locale) {
  const name = loc(country, "name", locale) || country.name;
  return slugify(`${T[locale].countryPrefix} ${name}`);
}

function buildCountryPage(country, locale, index, extraCards = []) {
  const t = T[locale];
  const name = loc(country, "name", locale) || country.name;
  const slug = countrySlug(country, locale);
  const path = pagePath(locale, slug);
  const words = Array.isArray(country.words) ? country.words : [];
  const wordGloss = (w) => (locale === "en" ? w.en || w.de : w.de);

  // Intro = Direktantwort auf „welches Spanisch?" (Sprachfeld, gekürzt).
  const language = plain(loc(country, "language", locale));
  const intro = truncate(language, 300) || plain(loc(country, "about", locale));

  // Sektionen aus echten Daten.
  const sections = [];
  if (language) sections.push({ heading: t.sec.language, paragraphs: [language] });
  const about = plain(loc(country, "about", locale));
  if (about) sections.push({ heading: t.sec.about, paragraphs: [about] });
  const history = plain(loc(country, "history", locale));
  if (history) sections.push({ heading: t.sec.history, paragraphs: [history] });

  // Land & Leute als Bullets (nur vorhandene Felder).
  const facts = ["population", "government", "economy", "livelihood"]
    .map((f) => plain(loc(country, f, locale)))
    .filter(Boolean);
  if (facts.length) sections.push({ heading: t.sec.facts, bullets: facts });

  // Essen & Trinken.
  const foodBullets = []
    .concat((country.food || []).slice(0, 4).map((f) => `${plain(f.name)} — ${plain(loc(f, "desc", locale))}`))
    .concat((country.drink || []).slice(0, 3).map((d) => `${plain(d.name)} — ${plain(loc(d, "desc", locale))}`))
    .filter((b) => b && !b.endsWith("— "));
  if (foodBullets.length) sections.push({ heading: t.sec.food, bullets: foodBullets });

  // Nützliche Wörter & Slang.
  const wordBullets = words.slice(0, 10).map((w) => `„${plain(w.es)}" — ${plain(wordGloss(w))}`);
  if (wordBullets.length) sections.push({ heading: t.sec.words, bullets: wordBullets });

  // Beispielsätze aus dem echten Kartenkorpus (data.js-Kategorie mit derselben
  // id wie das Land, z. B. "colombia": 89 Karten) - ZUSÄTZLICH zu den 6
  // kuratierten Slang-Wörtern aus countries.js. Ohne diese Sektion blieben die
  // größten Länder-Kartensätze des Korpus komplett unverlinkt.
  const exampleCards = extraCards.slice(0, 14);
  if (exampleCards.length) sections.push({ heading: t.sec.examples, bullets: exampleCards.map((c) => cardLine(c, locale)) });

  const tip = plain(loc(country, "tip", locale));
  if (tip) sections.push({ heading: t.sec.tip, paragraphs: [tip] });

  // FAQ (zitierbare Q&A – GEO-Kern). JEDE Antwort nennt "HolaRuta" namentlich,
  // damit eine Answer-Engine, die nur die Antwort zitiert, die Marke mitträgt.
  const faq = [];
  if (language) faq.push({ question: t.faq.whichSpanish(name), answer: t.faq.whichSpanishA(firstSentence(language, 220)) });
  if (words.length >= 2) {
    const list = words.slice(0, 4).map((w) => `„${plain(w.es)}" (${plain(wordGloss(w))})`).join(", ");
    faq.push({ question: t.faq.slang(name), answer: t.faq.slangA(list) });
  }
  for (const w of words.slice(0, 2)) {
    faq.push({ question: t.faq.howSay(stripParenthetical(plain(wordGloss(w))), name), answer: t.faq.howSayA(plain(w.es)) });
  }
  for (const c of extraCards.slice(0, 2)) {
    faq.push({ question: t.faq.howSay(stripParenthetical(plain(cardGloss(c, locale))), name), answer: t.faq.howSayA(plain(c.es)) });
  }
  const firstFood = (country.food || [])[0];
  if (firstFood) {
    const line = `${plain(firstFood.name)} — ${plain(loc(firstFood, "desc", locale))}`;
    faq.push({ question: t.faq.tryFood(name), answer: t.faq.tryFoodA(line) });
  }
  faq.push({ question: t.faq.hard(name), answer: t.faq.hardA(name) });

  return {
    key: `country:${country.id}`,
    track: "reise",
    locale,
    slug,
    path,
    canonical: absoluteUrl(path),
    pageType: "country",
    schemaType: "Article",
    meta: {
      title: buildTitle(`${t.countryPrefix} ${name}: ${t.titleSuffix}`),
      description: truncate(intro, 155),
    },
    h1: `${t.countryPrefix} ${name}`,
    question: t.faq.whichSpanish(name),
    intro,
    sections,
    faq,
    internalLinks: {
      hub: { path: pagePath(locale, t.hubSlug), label: t.hubLabel },
      related: [], // wird nach dem Sammeln aller Länder gefüllt
      cities: [], // wird gefüllt, falls das Land Städte-Guides hat
      app: appLink(t),
    },
    translationGroup: `country:${country.id}`,
    alternates: {},
    source: "data:countries",
    _region: country.region || "",
    _countryId: country.id,
    _index: index,
  };
}

function buildHubPage(countryPages, locale) {
  const t = T[locale];
  const path = pagePath(locale, t.hubSlug);
  const related = countryPages.map((p) => ({ path: p.path, label: p.h1 }));
  const bullets = countryPages.map((p) => p.h1);
  return {
    key: `hub:countries`,
    track: "reise",
    locale,
    slug: t.hubSlug,
    path,
    canonical: absoluteUrl(path),
    pageType: "hub",
    schemaType: "Article",
    meta: {
      title: buildTitle(`${t.hubLabel}: Länder-Guides & Slang`),
      description: truncate(t.hubIntro, 155),
    },
    h1: t.hubLabel,
    question: t.hubQuestion,
    intro: t.hubIntro,
    sections: [{ heading: t.related, bullets }],
    faq: [
      { question: t.hubQuestion, answer: t.hubFaqA(firstSentence(t.hubIntro, 220)) },
    ],
    internalLinks: {
      hub: null,
      related: related.slice(0, 24),
      app: appLink(t),
    },
    translationGroup: "hub:countries",
    alternates: {},
    source: "generated:hub",
  };
}

// „related" der Länder mit Nachbarn derselben Region füllen (max 3).
function fillCountryRelated(countryPages) {
  const byRegion = new Map();
  for (const p of countryPages) {
    const key = `${p.locale}|${p._region}`;
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key).push(p);
  }
  for (const p of countryPages) {
    const peers = (byRegion.get(`${p.locale}|${p._region}`) || []).filter((q) => q.key !== p.key);
    p.internalLinks.related = peers.slice(0, 3).map((q) => ({ path: q.path, label: q.h1 }));
    // Fallback: falls Region einsam ist, mit dem Hub-nahen Nachbarn auffüllen.
    if (p.internalLinks.related.length < 2) {
      const others = countryPages.filter((q) => q.locale === p.locale && q.key !== p.key).slice(0, 3);
      p.internalLinks.related = others.map((q) => ({ path: q.path, label: q.h1 }));
    }
  }
}

// ---------------------------------------------------------------------------
// Städte-Guides (aus data.js CARDS/CATEGORIES, group="destinos"). Jede Stadt
// gehört zu genau einem Land (CITY_COUNTRY) – Breadcrumb-Hub ist die
// Länderseite, nicht der Städte-Hub, damit die Hierarchie Home > Land > Stadt
// stimmt UND das Land als starkes internes Linkziel profitiert.
// ---------------------------------------------------------------------------
const CITY_COUNTRY = Object.freeze({
  cartagena: "colombia",
  medellin: "colombia",
  cusco: "peru",
  lima: "peru",
  arequipa: "peru",
  cdmx: "mexico",
  oaxaca: "mexico",
  merida: "mexico",
  antigua: "guatemala",
  buenosaires: "argentina",
  mendoza: "argentina",
  bariloche: "argentina",
  quito: "ecuador",
  santiago: "chile",
  valparaiso: "chile",
  atacama: "chile",
  puertonatales: "chile",
  pucon: "chile",
  lapaz: "bolivia",
  uyuni: "bolivia",
  copacabana: "bolivia",
  sucre: "bolivia",
  arenal: "costarica",
  monteverde: "costarica",
});

function cardGloss(card, locale) {
  return locale === "en" ? card.en || card.de : card.de;
}

function cardLine(card, locale) {
  return `„${plain(card.es)}" — ${plain(cardGloss(card, locale))}`;
}

function citySlug(cityCat, locale) {
  const name = loc(cityCat, "label", locale) || cityCat.label;
  return slugify(`${T[locale].countryPrefix} ${name}`);
}

function buildCityPage(cityCat, cards, countryPage, country, locale, index) {
  const t = T[locale];
  const name = loc(cityCat, "label", locale) || cityCat.label;
  const countryName = loc(country, "name", locale) || country.name;
  const slug = citySlug(cityCat, locale);
  const path = pagePath(locale, slug);

  // Sektionen ZUERST bauen: die im Intro/FAQ genannte Zahl muss der Zahl der
  // tatsächlich angezeigten Sätze entsprechen (cards.length wäre bei Städten
  // mit >28 Karten irreführend, da nur die ersten 14+14 gerendert werden).
  const basics = cards.filter((c) => c.lvl <= 1).slice(0, 14);
  const advanced = cards.filter((c) => c.lvl > 1).slice(0, 14);
  const sections = [];
  if (basics.length) sections.push({ heading: t.sec.phrases, bullets: basics.map((c) => cardLine(c, locale)) });
  if (advanced.length) sections.push({ heading: locale === "en" ? "More useful phrases" : "Weitere nützliche Sätze", bullets: advanced.map((c) => cardLine(c, locale)) });
  if (!sections.length) sections.push({ heading: t.sec.phrases, bullets: cards.slice(0, 20).map((c) => cardLine(c, locale)) });
  const shownCount = sections.reduce((n, s) => n + (s.bullets?.length || 0), 0);

  const introVariant = t.cityIntro[index % t.cityIntro.length];
  const intro = truncate(introVariant(name, countryName, shownCount), 300);

  const language = plain(loc(country, "language", locale));
  const faq = [];
  if (language) faq.push({ question: t.faq.whichSpanish(name), answer: t.faq.whichSpanishA(firstSentence(language, 220)) });
  for (const c of cards.slice(0, 2)) {
    faq.push({ question: t.faq.howSay(stripParenthetical(plain(cardGloss(c, locale))), name), answer: t.faq.howSayA(plain(c.es)) });
  }
  faq.push({
    question: t.citySituationsFaq.cityWhat(name),
    answer: t.citySituationsFaq.cityWhatA(name, shownCount),
  });

  return {
    key: `city:${cityCat.id}`,
    track: "reise",
    locale,
    slug,
    path,
    canonical: absoluteUrl(path),
    pageType: "city",
    schemaType: "LearningResource",
    meta: {
      title: buildTitle(`${t.countryPrefix} ${name}: ${t.citySuffix}`),
      description: truncate(intro, 155),
    },
    h1: `${t.countryPrefix} ${name}`,
    // Direktantwort-Frage der Seite: bewusst die Deckungs-/Themenfrage, NICHT
    // "welches Spanisch?" – das Intro der Städte-Seite beschreibt den Umfang des
    // Guides ("... Wortschatz für N Situationen"), nicht die Sprachvariante. Nur
    // so bilden question (H2) + intro (Antwort) im Lede ein kohärentes Q&A-Paar.
    question: t.citySituationsFaq.cityWhat(name),
    intro,
    sections,
    faq,
    internalLinks: {
      hub: countryPage ? { path: countryPage.path, label: countryPage.h1 } : { path: pagePath(locale, t.cityHubSlug), label: t.cityHubLabel },
      related: [], // wird nach dem Sammeln aller Städte gefüllt (Geschwister im selben Land)
      app: appLink(t),
    },
    translationGroup: `city:${cityCat.id}`,
    alternates: {},
    source: "data:cards",
    _countryId: CITY_COUNTRY[cityCat.id] || "",
    _index: index,
  };
}

function buildCitiesHub(cityPages, locale) {
  const t = T[locale];
  const path = pagePath(locale, t.cityHubSlug);
  const related = cityPages.map((p) => ({ path: p.path, label: p.h1 }));
  return {
    key: `hub:cities`,
    track: "reise",
    locale,
    slug: t.cityHubSlug,
    path,
    canonical: absoluteUrl(path),
    pageType: "hub",
    schemaType: "Article",
    meta: {
      title: buildTitle(`${t.cityHubLabel}: Reise-Wortschatz pro Stadt`),
      description: truncate(t.cityHubIntro, 155),
    },
    h1: t.cityHubLabel,
    question: t.cityHubQuestion,
    intro: t.cityHubIntro,
    sections: [{ heading: t.allCitiesLabel, bullets: cityPages.map((p) => p.h1) }],
    faq: [
      { question: t.cityHubQuestion, answer: t.cityHubFaqA(firstSentence(t.cityHubIntro, 220)) },
    ],
    internalLinks: {
      hub: null,
      related: related.slice(0, 30),
      app: appLink(t),
    },
    translationGroup: "hub:cities",
    alternates: {},
    source: "generated:hub",
  };
}

// Geschwister-Städte im selben Land verlinken (max 3), Fallback auf beliebige andere Städte.
function fillCityRelated(cityPages) {
  const byCountry = new Map();
  for (const p of cityPages) {
    const key = `${p.locale}|${p._countryId}`;
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key).push(p);
  }
  for (const p of cityPages) {
    const peers = (byCountry.get(`${p.locale}|${p._countryId}`) || []).filter((q) => q.key !== p.key);
    p.internalLinks.related = peers.slice(0, 3).map((q) => ({ path: q.path, label: q.h1 }));
    if (p.internalLinks.related.length < 2) {
      const others = cityPages.filter((q) => q.locale === p.locale && q.key !== p.key).slice(0, 3);
      p.internalLinks.related = others.map((q) => ({ path: q.path, label: q.h1 }));
    }
  }
}

// Länder-Seiten mit ihren Städte-Guides verlinken (echte <a>-Links, kein reiner Text):
// stärkt die interne Verlinkung Land<->Stadt in beide Richtungen.
function linkCountryCities(countryPages, cityPages) {
  const byCountryLocale = new Map();
  for (const c of cityPages) {
    const key = `${c.locale}|${c._countryId}`;
    if (!byCountryLocale.has(key)) byCountryLocale.set(key, []);
    byCountryLocale.get(key).push(c);
  }
  for (const p of countryPages) {
    const cities = byCountryLocale.get(`${p.locale}|${p._countryId}`) || [];
    p.internalLinks.cities = cities.map((c) => ({ path: c.path, label: c.h1 }));
  }
}

// Verlinkt die übergebenen Hub-Seiten (Länder-/Städte-/Situations-Hub)
// gegenseitig: jede referenziert die jeweils anderen als related-Link, VOR der
// vollständigen Auflistung ihrer eigenen Unterseiten. Ohne dies haben Städte-
// und Situations-Hub keine eingehenden Links im Graphen (Städte verlinken als
// Hub auf ihr LAND, nicht auf den Städte-Hub) und wären nur über die Sitemap
// erreichbar, nicht über Navigation/Crawling.
function crossLinkHubs(hubs) {
  for (const hub of hubs) {
    const siblings = hubs.filter((h) => h.key !== hub.key).map((h) => ({ path: h.path, label: h.h1 }));
    hub.internalLinks.related = [...siblings, ...(hub.internalLinks.related || [])];
  }
}

// ---------------------------------------------------------------------------
// Situations-Guides (aus data.js CATEGORIES): Reise-relevante Kategorien
// (ohne Grammatik-Drills wie Konjugieren/Zeiten und ohne die Städte/Länder-
// Kategorien, die bereits eigene Cluster haben).
// ---------------------------------------------------------------------------
const EXCLUDED_SITUATION_GROUPS = new Set(["destinos", "grammar"]);

function situationSlug(cat, locale) {
  const name = loc(cat, "label", locale) || cat.label;
  return locale === "en" ? slugify(`Spanish ${name} travel phrases`) : slugify(`Spanisch ${name} unterwegs`);
}

function buildSituationPage(cat, cards, locale, index) {
  const t = T[locale];
  const name = loc(cat, "label", locale) || cat.label;
  const slug = situationSlug(cat, locale);
  const path = pagePath(locale, slug);

  // Sektion ZUERST bauen: cards.length wäre irreführend, sobald eine Kategorie
  // mehr als 24 Karten hat (z. B. "Zahlen" mit 110) - im Intro/FAQ zählt nur,
  // was tatsächlich angezeigt wird.
  const shownCards = cards.slice(0, 24);
  const sections = [{ heading: t.sec.phrases, bullets: shownCards.map((c) => cardLine(c, locale)) }];

  const introVariant = t.situationIntro[index % t.situationIntro.length];
  const intro = truncate(introVariant(name, shownCards.length), 300);

  const faq = [];
  for (const c of cards.slice(0, 2)) {
    faq.push({ question: t.faq.howSay(stripParenthetical(plain(cardGloss(c, locale))), locale === "en" ? "Spanish" : "Spanisch"), answer: t.faq.howSayA(plain(c.es)) });
  }
  faq.push({ question: t.citySituationsFaq.situNeed(name), answer: t.citySituationsFaq.situNeedA(name, shownCards.length) });
  const situWhyAVariant = t.citySituationsFaq.situWhyA[index % t.citySituationsFaq.situWhyA.length];
  faq.push({ question: t.citySituationsFaq.situWhy(name), answer: situWhyAVariant(name) });

  return {
    key: `situation:${cat.id}`,
    track: "reise",
    locale,
    slug,
    path,
    canonical: absoluteUrl(path),
    pageType: "situation",
    schemaType: "LearningResource",
    meta: {
      title: buildTitle(`${name}: ${t.situationSuffix}`),
      description: truncate(intro, 155),
    },
    h1: `${name}: ${t.situationSuffix}`,
    question: t.citySituationsFaq.situNeed(name),
    intro,
    sections,
    faq,
    internalLinks: {
      hub: { path: pagePath(locale, t.situationHubSlug), label: t.situationHubLabel },
      related: [], // wird nach dem Sammeln aller Situationen gefüllt (gleiche Kategorie-Gruppe)
      app: appLink(t),
    },
    translationGroup: `situation:${cat.id}`,
    alternates: {},
    source: "data:cards",
    _group: cat.group || "",
    _index: index,
  };
}

function buildSituationsHub(situationPages, locale) {
  const t = T[locale];
  const path = pagePath(locale, t.situationHubSlug);
  const related = situationPages.map((p) => ({ path: p.path, label: p.h1 }));
  return {
    key: `hub:situations`,
    track: "reise",
    locale,
    slug: t.situationHubSlug,
    path,
    canonical: absoluteUrl(path),
    pageType: "hub",
    schemaType: "Article",
    meta: {
      title: buildTitle(`${t.situationHubLabel}: Wortschatz nach Thema`),
      description: truncate(t.situationHubIntro, 155),
    },
    h1: t.situationHubLabel,
    question: t.situationHubQuestion,
    intro: t.situationHubIntro,
    sections: [{ heading: t.allSituationsLabel, bullets: situationPages.map((p) => p.h1) }],
    faq: [
      { question: t.situationHubQuestion, answer: t.situationHubFaqA(firstSentence(t.situationHubIntro, 220)) },
    ],
    internalLinks: {
      hub: null,
      related: related.slice(0, 40),
      app: appLink(t),
    },
    translationGroup: "hub:situations",
    alternates: {},
    source: "generated:hub",
  };
}

// Geschwister-Situationen derselben Kategorie-Gruppe verlinken (max 3).
function fillSituationRelated(situationPages) {
  const byGroup = new Map();
  for (const p of situationPages) {
    const key = `${p.locale}|${p._group}`;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(p);
  }
  for (const p of situationPages) {
    const peers = (byGroup.get(`${p.locale}|${p._group}`) || []).filter((q) => q.key !== p.key);
    p.internalLinks.related = peers.slice(0, 3).map((q) => ({ path: q.path, label: q.h1 }));
    if (p.internalLinks.related.length < 2) {
      const others = situationPages.filter((q) => q.locale === p.locale && q.key !== p.key).slice(0, 3);
      p.internalLinks.related = others.map((q) => ({ path: q.path, label: q.h1 }));
    }
  }
}

// ---------------------------------------------------------------------------
// Alternates (hreflang) nach Übersetzungsgruppe verdrahten.
// ---------------------------------------------------------------------------
export function linkAlternates(pages) {
  const groups = new Map();
  for (const p of pages) {
    if (!groups.has(p.translationGroup)) groups.set(p.translationGroup, {});
    groups.get(p.translationGroup)[p.locale] = p.path;
  }
  for (const p of pages) {
    p.alternates = { ...groups.get(p.translationGroup) };
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Öffentliche API: alle Seiten bauen.
// ---------------------------------------------------------------------------
export function buildAllPages(dataset, locales = ["de", "en"]) {
  const { countries, data } = dataset;
  const cards = (data && Array.isArray(data.CARDS)) ? data.CARDS : [];
  const categories = (data && Array.isArray(data.CATEGORIES)) ? data.CATEGORIES : [];
  const pages = [];

  const cardsByCat = new Map();
  for (const c of cards) {
    if (!cardsByCat.has(c.cat)) cardsByCat.set(c.cat, []);
    cardsByCat.get(c.cat).push(c);
  }

  const cityCats = categories.filter((c) => c.group === "destinos" && CITY_COUNTRY[c.id]);
  const situationCats = categories.filter((c) => !EXCLUDED_SITUATION_GROUPS.has(c.group));

  for (const locale of locales) {
    if (!T[locale]) continue;

    const countryPages = countries.LIST.map((c, i) => buildCountryPage(c, locale, i, cardsByCat.get(c.id) || []));
    fillCountryRelated(countryPages);
    const countryById = new Map(countryPages.map((p) => [p._countryId, p]));
    const countryDataById = new Map(countries.LIST.map((c) => [c.id, c]));

    const cityPages = cityCats
      .filter((cat) => (cardsByCat.get(cat.id) || []).length > 0)
      .map((cat, i) => {
        const countryId = CITY_COUNTRY[cat.id];
        return buildCityPage(cat, cardsByCat.get(cat.id) || [], countryById.get(countryId) || null, countryDataById.get(countryId) || {}, locale, i);
      });
    fillCityRelated(cityPages);
    linkCountryCities(countryPages, cityPages);

    const situationPages = situationCats
      .filter((cat) => (cardsByCat.get(cat.id) || []).length > 0)
      .map((cat, i) => buildSituationPage(cat, cardsByCat.get(cat.id) || [], locale, i));
    fillSituationRelated(situationPages);

    const countriesHub = buildHubPage(countryPages, locale);
    const citiesHub = cityPages.length ? buildCitiesHub(cityPages, locale) : null;
    const situationsHub = situationPages.length ? buildSituationsHub(situationPages, locale) : null;
    // Die 3 Reise-Hubs gegenseitig verlinken: city-/situations-Hub haben sonst
    // KEINE eingehenden Links (Städte verlinken als Hub auf ihr LAND, nicht
    // auf den Städte-Hub; ebenso landen Situationsseiten nie im related-Feld
    // einer anderen Seite als Hub) und wären ohne dies nur über die Sitemap
    // erreichbar, nicht über den Link-Graphen.
    crossLinkHubs([countriesHub, citiesHub, situationsHub].filter(Boolean));

    pages.push(countriesHub);
    pages.push(...countryPages);
    if (citiesHub) {
      pages.push(citiesHub);
      pages.push(...cityPages);
    }
    if (situationsHub) {
      pages.push(situationsHub);
      pages.push(...situationPages);
    }
  }

  // Pillar-Seiten (Produktdefinition, Wettbewerb, LatAm- vs. Spanien-Spanisch,
  // Spaced Repetition) einmal für alle unterstützten Reise-Locales bauen.
  pages.push(...buildPillarPages(countries, data, locales.filter((l) => T[l])));

  linkAlternates(pages);
  // interne Hilfsfelder (_region/_index/_countryId/_group) aus dem
  // Ausgabe-Manifest entfernen.
  return pages.map(({ _region, _index, _countryId, _group, ...clean }) => clean);
}

export { buildCountryPage, buildHubPage, buildCityPage, buildCitiesHub, buildSituationPage, buildSituationsHub };
