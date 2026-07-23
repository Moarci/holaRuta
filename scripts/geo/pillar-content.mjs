/*
 * scripts/geo/pillar-content.mjs — handverfasste Marken-/Positionierungs-Seiten
 * (Pillar-Seiten): Produktdefinition, Wettbewerbsvergleich, LatAm- vs.
 * Spanien-Spanisch, Spaced Repetition. Direkt als Seiten-Objekte statt über
 * Markdown-Quellen authoriert (nur 4 Seiten x 2 Sprachen – ein Markdown-Parser
 * wäre für diesen Umfang unnötige Komplexität).
 *
 * Fakten hier sind aus README.md/MARKT.md und dem echten Länderkunde-Korpus
 * (countries.js) gezogen, nicht erfunden: Wettbewerbsvergleich siehe MARKT.md
 * §1b, SM-2-Mechanik siehe srs.js.
 *
 * AEO-Prinzip (wie in content-model.mjs): JEDE FAQ-Antwort nennt "HolaRuta"
 * namentlich, damit eine Answer-Engine, die nur die Antwort zitiert, die Marke
 * mitträgt.
 */
"use strict";

import { APP_URL, absoluteUrl } from "./config.mjs";
import { loc, plain, truncate } from "./text-utils.mjs";

// pagePath/buildTitle sind in content-model.mjs nicht exportiert (nur intern) –
// hier lokal dupliziert, da beide nur 5 Zeilen reine String-Bausteine sind und
// ein gemeinsames Utility-Modul für so wenig Code keinen Mehrwert hätte.
function pagePath(locale, slug) {
  return `/${locale}/${slug}/`;
}
function buildTitle(base, max = 70) {
  const suffix = " | HolaRuta";
  if (`${base}${suffix}`.length <= max) return `${base}${suffix}`;
  return `${truncate(base, max - suffix.length)}${suffix}`;
}

const HUB_SLUGS = {
  de: { countries: "reise-spanisch-lateinamerika", situations: "spanisch-reisesituationen-lateinamerika" },
  en: { countries: "travel-spanish-latin-america", situations: "spanish-travel-situations-latin-america" },
};

const APP_LINK = {
  de: { url: `${APP_URL}/`, label: "HolaRuta-App öffnen" },
  en: { url: `${APP_URL}/`, label: "Open the HolaRuta app" },
};

// ---------------------------------------------------------------------------
// 1) Was ist HolaRuta?
// ---------------------------------------------------------------------------
const WHAT_IS = {
  de: {
    slug: "was-ist-holaruta",
    h1: "Was ist HolaRuta?",
    intro: "HolaRuta ist eine kostenlose Lernkarten-PWA für Reise-Spanisch beim Backpacking durch Lateinamerika: {{CARDS}} Karteikarten mit Spaced Repetition für Situationen wie Bus, Hotel, Essen, Geld, Notfall und Smalltalk, komplett offline nutzbar und ohne Konto.",
    sections: [
      { heading: "Für wen ist HolaRuta?", paragraphs: ["HolaRuta richtet sich an Backpacker und Reisende, die schnell die Spanisch-Sätze brauchen, die vor Ort wirklich vorkommen - nicht an Menschen, die eine komplette Sprache von Grund auf lernen wollen."] },
      { heading: "Was macht HolaRuta anders?", bullets: [
        "Situativ statt kursförmig: Karten sind nach echten Reise-Momenten sortiert (Bus, Hostel, Grenze, Notfall), nicht nach Grammatik-Lektionen.",
        "Lateinamerika-korrekt: regional richtige Wörter (colectivo, vuelto, plata, chévere, celular) statt kastilisches Lehrbuch-Spanisch.",
        "Offline & PWA-leicht: funktioniert ohne Netz, installierbar ohne App Store.",
        "Keine Werbung, kein Konto-Zwang: Fortschritt bleibt lokal auf dem Gerät gespeichert.",
      ] },
      { heading: "Wie funktioniert die App?", paragraphs: ["Karten werden mit einem vereinfachten SM-2-Algorithmus (Spaced Repetition) zur richtigen Zeit wiederholt: Du bewertest jede Karte ehrlich, die App passt das Intervall bis zur nächsten Wiederholung automatisch an."] },
    ],
    faq: [
      { question: "Ist HolaRuta kostenlos?", answer: "Ja. HolaRuta ist komplett kostenlos, ohne versteckte Kosten oder Abo-Zwang." },
      { question: "Braucht HolaRuta ein Konto?", answer: "Nein. HolaRuta funktioniert ohne Konto und ohne Login - der Lernfortschritt wird lokal auf dem Gerät gespeichert. Eine optionale Cloud-Synchronisierung ist opt-in." },
      { question: "Funktioniert HolaRuta offline?", answer: "Ja. HolaRuta ist eine installierbare Progressive Web App (PWA) und funktioniert nach der ersten Installation komplett ohne Internetverbindung." },
      { question: "Wie viele Karteikarten hat HolaRuta?", answer: "HolaRuta enthält {{CARDS}} Karteikarten in {{CATEGORIES}} Kategorien, sortiert nach vier Schwierigkeitsstufen (A1 bis B2)." },
    ],
    related: ["duolingo", "spain-vs-latam", "spaced-repetition"],
  },
  en: {
    slug: "what-is-holaruta",
    h1: "What is HolaRuta?",
    intro: "HolaRuta is a free flashcard PWA for travel Spanish while backpacking through Latin America: {{CARDS}} flashcards with spaced repetition for situations like buses, hotels, food, money, emergencies and small talk, fully usable offline and without an account.",
    sections: [
      { heading: "Who is HolaRuta for?", paragraphs: ["HolaRuta is built for backpackers and travellers who need the Spanish phrases that actually come up on the road - not for people who want to learn an entire language from scratch."] },
      { heading: "What makes HolaRuta different?", bullets: [
        "Situational, not course-shaped: cards are organised by real travel moments (bus, hostel, border, emergency), not grammar lessons.",
        "Latin-America-correct: regionally accurate words (colectivo, vuelto, plata, chévere, celular) instead of textbook Castilian Spanish.",
        "Offline & PWA-light: works without a network connection, installable without an app store.",
        "No ads, no account required: progress stays on the device.",
      ] },
      { heading: "How does the app work?", paragraphs: ["Cards resurface at the right time using a simplified SM-2 spaced-repetition algorithm: you rate each card honestly, and the app automatically adjusts the interval until the next review."] },
    ],
    faq: [
      { question: "Is HolaRuta free?", answer: "Yes. HolaRuta is completely free, with no hidden costs or subscription requirement." },
      { question: "Does HolaRuta require an account?", answer: "No. HolaRuta works without an account or login - learning progress is stored locally on the device. Optional cloud sync is opt-in." },
      { question: "Does HolaRuta work offline?", answer: "Yes. HolaRuta is an installable Progressive Web App (PWA) and works fully without an internet connection after the first install." },
      { question: "How many flashcards does HolaRuta have?", answer: "HolaRuta contains {{CARDS}} flashcards across {{CATEGORIES}} categories, sorted into four difficulty levels (A1 to B2)." },
    ],
    related: ["duolingo", "spain-vs-latam", "spaced-repetition"],
  },
};

// ---------------------------------------------------------------------------
// 2) HolaRuta vs. Duolingo & Babbel
// ---------------------------------------------------------------------------
const VS_DUOLINGO = {
  de: {
    slug: "holaruta-vs-duolingo-babbel",
    h1: "HolaRuta vs. Duolingo & Babbel: Was ist der Unterschied?",
    intro: "HolaRuta tritt nicht als bessere Allzweck-Sprachschule gegen Duolingo oder Babbel an, sondern besetzt eine Nische, die beide bewusst nicht bedienen: situatives, regional korrektes Reise-Spanisch für Lateinamerika, offline und ohne Werbung.",
    sections: [
      { heading: "Duolingo: Stärke und Lücke", paragraphs: ['Duolingo punktet mit Gamification, riesiger Reichweite und einer kostenlosen Basisversion. Die Lücke: generisches "Schul-Spanisch" (oft kastilisches/neutrales Spanisch), gamifiziert statt situativ, mit viel Tracking und Werbung - konkrete Reise-Notfall-Situationen kommen kaum vor.'] },
      { heading: "Babbel: Stärke und Lücke", paragraphs: ['Babbel bietet strukturierte Kurse und gute Dialoge. Die Lücke: Abo-Pflicht, kursförmiger Aufbau statt "schnell die richtige Karte am Busbahnhof", und lateinamerikanische Varianten nur teilweise abgedeckt.'] },
      { heading: "Wo HolaRuta gewinnt", bullets: [
        "LatAm-korrekt statt kastilisches Lehrbuch-Spanisch (colectivo, vuelto, plata, chévere, celular).",
        "Situativ statt kursförmig: kuratiert nach echten Reise-Momenten (Taxi, Hostel, Grenze, Notfall, Smalltalk).",
        "Offline & PWA-leicht, installierbar ohne App Store.",
        "Keine Werbung, kein Konto-Zwang, Fortschritt bleibt lokal.",
      ] },
    ],
    faq: [
      { question: "Ist HolaRuta besser als Duolingo?", answer: "HolaRuta und Duolingo lösen unterschiedliche Probleme: Duolingo eignet sich für langfristigen, gamifizierten Sprachaufbau; HolaRuta ist auf schnelles, situatives Reise-Spanisch für Lateinamerika spezialisiert - inklusive Wörtern, die Duolingo oft gar nicht abdeckt." },
      { question: "Was kostet HolaRuta im Vergleich zu Babbel?", answer: "HolaRuta ist komplett kostenlos und ohne Abo, während Babbel ein kostenpflichtiges Abonnement voraussetzt." },
      { question: "Deckt Duolingo lateinamerikanisches Spanisch ab?", answer: "Duolingo nutzt überwiegend generisches bzw. kastilisches Spanisch. HolaRuta ist durchgängig auf regional korrektes lateinamerikanisches Spanisch ausgelegt." },
    ],
    related: ["what-is", "spain-vs-latam"],
  },
  en: {
    slug: "holaruta-vs-duolingo-babbel",
    h1: "HolaRuta vs. Duolingo & Babbel: what's the difference?",
    intro: "HolaRuta doesn't try to out-compete Duolingo or Babbel as a better general-purpose language school - it occupies a niche both deliberately don't serve: situational, regionally accurate travel Spanish for Latin America, offline and ad-free.",
    sections: [
      { heading: "Duolingo: strength and gap", paragraphs: ["Duolingo wins on gamification, huge reach and a free tier. The gap: generic, often Castilian/neutral Spanish, gamified rather than situational, with heavy tracking and ads - concrete travel-emergency situations barely appear."] },
      { heading: "Babbel: strength and gap", paragraphs: ['Babbel offers structured courses and solid dialogues. The gap: a subscription requirement, a course-shaped structure rather than "quickly find the right card at the bus terminal", and only partial coverage of Latin American variants.'] },
      { heading: "Where HolaRuta wins", bullets: [
        "Latin-America-correct instead of textbook Castilian Spanish (colectivo, vuelto, plata, chévere, celular).",
        "Situational, not course-shaped: curated around real travel moments (taxi, hostel, border, emergency, small talk).",
        "Offline & PWA-light, installable without an app store.",
        "No ads, no account required, progress stays local.",
      ] },
    ],
    faq: [
      { question: "Is HolaRuta better than Duolingo?", answer: "HolaRuta and Duolingo solve different problems: Duolingo suits long-term, gamified language building; HolaRuta specialises in fast, situational travel Spanish for Latin America - including words Duolingo often doesn't cover at all." },
      { question: "How much does HolaRuta cost compared to Babbel?", answer: "HolaRuta is completely free with no subscription, while Babbel requires a paid subscription." },
      { question: "Does Duolingo cover Latin American Spanish?", answer: "Duolingo mostly uses generic or Castilian Spanish. HolaRuta is built throughout around regionally accurate Latin American Spanish." },
    ],
    related: ["what-is", "spain-vs-latam"],
  },
};

// ---------------------------------------------------------------------------
// 3) Lateinamerikanisches vs. Spanien-Spanisch (mit echten Länder-Beispielen)
// ---------------------------------------------------------------------------
function buildSpainVsLatam(countries, locale) {
  const t = locale === "en"
    ? {
      slug: "latin-american-spanish-vs-spain-spanish",
      h1: "Latin American Spanish vs. Spain Spanish: the real differences",
      intro: 'Latin American Spanish differs from Spain\'s in three big ways: pronunciation (seseo instead of the Castilian "th" sound), grammar (voseo - "vos" instead of "tú" in many countries), and everyday vocabulary (celular, plata, chévere instead of móvil, dinero, guay).',
    }
    : {
      slug: "latinamerikanisches-spanisch-vs-spanien-spanisch",
      h1: "Lateinamerikanisches Spanisch vs. Spanien-Spanisch: die echten Unterschiede",
      intro: 'Lateinamerikanisches Spanisch unterscheidet sich in drei großen Punkten vom Spanisch Spaniens: Aussprache (Seseo statt des kastilischen "th"-Lauts), Grammatik (Voseo - "vos" statt "tú" in vielen Ländern) und Alltagswortschatz (celular, plata, chévere statt móvil, dinero, guay).',
    };

  const findCountry = (id) => countries.LIST.find((c) => c.id === id);
  const examples = [
    { id: "argentina", label: locale === "en" ? "Argentina (Rioplatense voseo)" : "Argentinien (Rioplatense-Voseo)" },
    { id: "mexico", label: locale === "en" ? "Mexico (no voseo, uses tú)" : "Mexiko (kein Voseo, nutzt tú)" },
    { id: "colombia", label: locale === "en" ? "Colombia (widespread polite usted)" : "Kolumbien (verbreitetes höfliches usted)" },
  ]
    .map((e) => ({ ...e, country: findCountry(e.id) }))
    .filter((e) => e.country && plain(loc(e.country, "language", locale)));

  const sections = [
    {
      heading: locale === "en" ? "Pronunciation: seseo" : "Aussprache: Seseo",
      paragraphs: [
        locale === "en"
          ? 'In Spain, "c" (before e/i) and "z" are pronounced like the English "th" in "think" (distinción). Almost all of Latin America uses seseo instead: these letters are pronounced like "s" - "cielo" and "sierra" rhyme.'
          : 'In Spanien werden "c" (vor e/i) und "z" wie das englische "th" in "think" ausgesprochen (Distinción). Fast ganz Lateinamerika nutzt stattdessen Seseo: Diese Buchstaben klingen wie "s" - "cielo" und "sierra" reimen sich.',
      ],
    },
    {
      heading: locale === "en" ? "Grammar: voseo vs. tú" : "Grammatik: Voseo vs. Tú",
      paragraphs: [
        locale === "en"
          ? 'Spain uses "tú" for informal "you". Many Latin American countries (especially Argentina, Uruguay, and parts of Central America) use "vos" instead, with its own verb forms ("vos tenés" instead of "tú tienes"). Other countries, like Mexico, use "tú" just like Spain.'
          : 'Spanien nutzt "tú" für die informelle Anrede. Viele lateinamerikanische Länder (besonders Argentinien, Uruguay und Teile Zentralamerikas) nutzen stattdessen "vos" mit eigenen Verbformen ("vos tenés" statt "tú tienes"). Andere Länder wie Mexiko nutzen "tú" genau wie Spanien.',
      ],
    },
    {
      heading: locale === "en" ? "Vocabulary: everyday words differ" : "Wortschatz: Alltagswörter unterscheiden sich",
      bullets: [
        locale === "en" ? '"celular" (Latin America) vs. "móvil" (Spain) - mobile phone' : '"celular" (Lateinamerika) vs. "móvil" (Spanien) - Handy',
        locale === "en" ? '"plata" (Latin America) vs. "dinero"/"pasta" (Spain) - money' : '"plata" (Lateinamerika) vs. "dinero"/"pasta" (Spanien) - Geld',
        locale === "en" ? '"chévere" (many LatAm countries) vs. "guay" (Spain) - cool/great' : '"chévere" (viele LatAm-Länder) vs. "guay" (Spanien) - cool/super',
        locale === "en" ? '"carro"/"auto" (Latin America) vs. "coche" (Spain) - car' : '"carro"/"auto" (Lateinamerika) vs. "coche" (Spanien) - Auto',
      ],
    },
  ];

  if (examples.length) {
    sections.push({
      heading: locale === "en" ? "Country examples" : "Länder-Beispiele",
      bullets: examples.map((e) => `${e.label}: ${truncate(plain(loc(e.country, "language", locale)), 160)}`),
    });
  }

  const faq = [
    {
      question: locale === "en" ? "Is Latin American Spanish the same in every country?" : "Ist lateinamerikanisches Spanisch in jedem Land gleich?",
      answer: locale === "en"
        ? "No. Each country has its own accent, slang and, in some cases, grammar (like voseo). HolaRuta's country guides show what's specific to each destination."
        : "Nein. Jedes Land hat seinen eigenen Akzent, Slang und teilweise eigene Grammatik (wie das Voseo). Die Länder-Guides von HolaRuta zeigen, was für jedes Reiseziel spezifisch ist.",
    },
    {
      question: locale === "en" ? "Will Spain Spanish be understood in Latin America?" : "Wird Spanien-Spanisch in Lateinamerika verstanden?",
      answer: locale === "en"
        ? 'Yes, Spain Spanish is understood everywhere in Latin America - but sounding and vocabulary will clearly mark you as a foreigner, and some words differ enough to cause confusion (e.g. "coger" is neutral in Spain but vulgar in several Latin American countries). HolaRuta teaches the Latin American versions so you avoid exactly these mix-ups.'
        : 'Ja, Spanien-Spanisch wird in ganz Lateinamerika verstanden - aber Klang und Wortschatz markieren dich klar als Ausländer, und manche Wörter unterscheiden sich genug, um Verwirrung zu stiften (z. B. ist "coger" in Spanien neutral, in mehreren lateinamerikanischen Ländern aber vulgär). HolaRuta lehrt gezielt die lateinamerikanischen Varianten, damit dir genau das nicht passiert.',
    },
    {
      question: locale === "en" ? "Does HolaRuta teach Spain Spanish or Latin American Spanish?" : "Lehrt HolaRuta Spanien-Spanisch oder lateinamerikanisches Spanisch?",
      answer: locale === "en"
        ? "HolaRuta teaches Latin-America-correct Spanish throughout - the words and phrases travellers actually hear on the ground, not textbook Castilian Spanish."
        : "HolaRuta lehrt durchgängig lateinamerika-korrektes Spanisch - die Wörter und Sätze, die Reisende vor Ort wirklich hören, nicht kastilisches Lehrbuch-Spanisch.",
    },
  ];

  return { slug: t.slug, h1: t.h1, intro: t.intro, sections, faq, related: ["what-is", "duolingo"] };
}

// ---------------------------------------------------------------------------
// 4) Wie funktioniert Spaced Repetition? (SM-2, siehe srs.js)
// ---------------------------------------------------------------------------
const SRS = {
  de: {
    slug: "wie-funktioniert-spaced-repetition",
    h1: "Wie funktioniert Spaced Repetition in HolaRuta?",
    schemaType: "HowTo",
    intro: "HolaRuta nutzt einen vereinfachten SM-2-Algorithmus: Nach jeder Bewertung berechnet die App neu, wann eine Karte am effizientesten wieder auftauchen sollte - Karten, die du gut kannst, werden seltener wiederholt; Karten, die du vergisst, kommen schneller zurück.",
    sections: [
      {
        heading: "So läuft eine Wiederholung in HolaRuta ab",
        bullets: [
          "HolaRuta zeigt dir eine fällige Karteikarte (Frage auf Deutsch, Antwort auf Spanisch).",
          'Du bewertest ehrlich: "Nochmal" (falsch/vergessen), "Gut" (richtig, aber Mühe) oder "Leicht" (sofort gewusst).',
          'Der HolaRuta-Algorithmus passt das Intervall bis zur nächsten Wiederholung an: "Nochmal" setzt es zurück, "Gut"/"Leicht" verlängern es.',
          "Die Karte taucht automatisch am berechneten Tag wieder auf - nie zu früh, nie zu spät.",
        ],
      },
      { heading: "Was steckt technisch dahinter?", paragraphs: ["In HolaRuta trägt jede Karte einen Lernzustand aus Ease-Faktor, Intervall (in Tagen), Fälligkeitsdatum und Wiederholungszähler. Der Ease-Faktor ist auf einen sinnvollen Bereich begrenzt, damit Karten nie endlos leicht oder endlos schwer werden."] },
    ],
    faq: [
      { question: "Was ist Spaced Repetition?", answer: "Spaced Repetition ist eine Lerntechnik, bei der Wiederholungen in wachsenden Abständen stattfinden, statt stumpf immer wieder alles zu wiederholen. HolaRuta setzt das mit einem vereinfachten SM-2-Algorithmus um." },
      { question: "Warum vergesse ich Vokabeln, wenn ich nicht mit Spaced Repetition lerne?", answer: 'Ohne geplante Wiederholung verblasst neu Gelerntes schnell (die "Vergessenskurve"). HolaRuta wiederholt eine Karte genau dann, wenn du kurz davor bist, sie zu vergessen - das festigt sie langfristig, statt sie verpuffen zu lassen.' },
      { question: "Muss ich in HolaRuta jeden Tag lernen?", answer: "Nein, aber regelmäßiges, kurzes Lernen funktioniert mit Spaced Repetition am besten - HolaRuta zeigt dir jeden Tag nur die Karten, die gerade wirklich fällig sind." },
    ],
    related: ["what-is"],
  },
  en: {
    slug: "how-does-spaced-repetition-work",
    h1: "How does spaced repetition work in HolaRuta?",
    schemaType: "HowTo",
    intro: "HolaRuta uses a simplified SM-2 algorithm: after every rating, the app recalculates when a card should resurface most efficiently - cards you know well repeat less often; cards you forget come back sooner.",
    sections: [
      {
        heading: "How a review works in HolaRuta",
        bullets: [
          "HolaRuta shows you a due flashcard (question in German/English, answer in Spanish).",
          'You rate it honestly: "Again" (wrong/forgotten), "Good" (correct but effortful), or "Easy" (knew it instantly).',
          'HolaRuta\'s algorithm adjusts the interval until the next review: "Again" resets it, "Good"/"Easy" extend it.',
          "The card automatically resurfaces on the calculated day - never too early, never too late.",
        ],
      },
      { heading: "What's happening under the hood?", paragraphs: ["In HolaRuta, every card carries a learning state made of an ease factor, an interval (in days), a due date and a repetition count. The ease factor is clamped to a sensible range so cards never become endlessly easy or endlessly hard."] },
    ],
    faq: [
      { question: "What is spaced repetition?", answer: "Spaced repetition is a learning technique where reviews happen at growing intervals instead of bluntly repeating everything over and over. HolaRuta implements this with a simplified SM-2 algorithm." },
      { question: "Why do I forget vocabulary if I don't use spaced repetition?", answer: 'Without scheduled review, newly learned material fades quickly (the "forgetting curve"). HolaRuta reviews a card right when you\'re about to forget it, which cements it long-term instead of letting it fade.' },
      { question: "Do I have to study in HolaRuta every day?", answer: "No, but regular, short sessions work best with spaced repetition - HolaRuta only shows you the cards that are actually due each day." },
    ],
    related: ["what-is"],
  },
};

// Ersetzt {{CARDS}}/{{CATEGORIES}} durch die ECHTEN, zur Buildzeit geladenen
// Zahlen (statt sie als Literal im Text zu pflegen, das bei jeder Korpus-
// Änderung stillschweigend veraltet - siehe loadReiseData()).
function interpolate(str, vars) {
  return str.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in vars ? String(vars[key]) : m));
}

function toPage(entry, locale, key, schemaType, vars) {
  const path = pagePath(locale, entry.slug);
  const intro = interpolate(entry.intro, vars);
  const faq = entry.faq.map((f) => ({ question: f.question, answer: interpolate(f.answer, vars) }));
  return {
    key: `pillar:${key}`,
    track: "reise",
    locale,
    slug: entry.slug,
    path,
    canonical: absoluteUrl(path),
    pageType: "pillar",
    schemaType: entry.schemaType || schemaType,
    meta: { title: buildTitle(entry.h1), description: truncate(intro, 155) },
    h1: entry.h1,
    question: entry.h1,
    intro,
    sections: entry.sections,
    faq,
    internalLinks: { hub: null, related: [], app: APP_LINK[locale] },
    translationGroup: `pillar:${key}`,
    alternates: {},
    source: "pillar",
    _relatedKeys: entry.related || [],
  };
}

/**
 * Baut die 4 Pillar-Seiten (Produktdefinition, Wettbewerb, LatAm- vs.
 * Spanien-Spanisch, Spaced Repetition) für die angegebenen Locales, inkl.
 * Querverlinkung untereinander + zu den Länder-/Situations-Hubs.
 * @param {object} countries SC.countries ({ LIST })
 * @param {object} data SC.data ({ CARDS, CATEGORIES }) - liefert die echten
 *   Zahlen für {{CARDS}}/{{CATEGORIES}}-Platzhalter in Intro/FAQ.
 * @param {string[]} locales
 * @returns {object[]}
 */
export function buildPillarPages(countries, data, locales) {
  const vars = { CARDS: data.CARDS.length, CATEGORIES: data.CATEGORIES.length };
  const pages = [];
  for (const locale of locales) {
    if (!HUB_SLUGS[locale]) continue;
    const spainVsLatam = buildSpainVsLatam(countries, locale);
    pages.push(
      toPage(WHAT_IS[locale], locale, "what-is", "SoftwareApplication", vars),
      toPage(VS_DUOLINGO[locale], locale, "duolingo", "Article", vars),
      toPage(spainVsLatam, locale, "spain-vs-latam", "Article", vars),
      toPage(SRS[locale], locale, "spaced-repetition", "HowTo", vars)
    );
  }

  const byKey = new Map(pages.map((p) => [`${p.locale}|${p.key.replace("pillar:", "")}`, p]));
  for (const p of pages) {
    const relKeys = p._relatedKeys || [];
    p.internalLinks.related = relKeys
      .map((k) => byKey.get(`${p.locale}|${k}`))
      .filter(Boolean)
      .map((q) => ({ path: q.path, label: q.h1 }));
    p.internalLinks.hub = {
      path: pagePath(p.locale, HUB_SLUGS[p.locale].countries),
      label: p.locale === "en" ? "Travel Spanish for Latin America" : "Reise-Spanisch für Lateinamerika",
    };
  }

  return pages.map(({ _relatedKeys, ...clean }) => clean);
}
