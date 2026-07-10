/*
 * scripts/geo/config.mjs — zentrale Konstanten der GEO/SEO-Content-Pipeline.
 *
 * EINE Quelle der Wahrheit für Domain, Marke, Sprachen und Crawler-Politik.
 * Der Umstieg auf eine eigene Domain (holaruta.app) ist ein Einzeiler hier:
 * BASE_URL ändern, CNAME ergänzen, neu generieren – der Rest der Pipeline zieht
 * BASE_URL aus dieser Datei.
 *
 * WICHTIG: BASE_URL ohne abschließenden Slash. Der Pfad "/holaRuta" trägt ein
 * großes R – exakt so wie GitHub Pages die Seite ausliefert.
 */
"use strict";

export const BASE_URL = "https://moarci.github.io/holaRuta";

export const BRAND = Object.freeze({
  name: "HolaRuta",
  tagline: {
    de: "Reise-Spanisch für echte Situationen",
    en: "Travel Spanish for real situations",
    es: "El inglés que tu trabajo necesita",
  },
  email: "hola@holaruta.app",
  github: "https://github.com/Moarci/holaRuta",
  ogImage: `${BASE_URL}/og-image.png`,
  themeColor: "#241510",
  accent: "#C2502E",
  accentSoft: "#E9A23B",
});

// Sprachen der Content-Seiten. de/en bedienen den Reise-Track, es den Locals-Track.
export const LOCALES = Object.freeze(["de", "en", "es"]);
export const DEFAULT_LOCALE = "de";

// Menschlich lesbare Sprachnamen (für llms.txt / Hinweise).
export const LOCALE_LABEL = Object.freeze({ de: "Deutsch", en: "English", es: "Español" });

// Deterministisches "zuletzt überarbeitet"-Datum der generierten Inhalte
// (JSON-LD dateModified, Sitemap lastmod). Bewusst KEIN Date.now(): sonst
// ändern sich committete Artefakte bei jedem Build. Bei inhaltlichen Updates
// hier hochsetzen.
export const CONTENT_DATE = "2026-07-09";

// og:locale-Werte pro Sprache.
export const OG_LOCALE = Object.freeze({ de: "de_DE", en: "en_US", es: "es_ES" });

// KI-Crawler, die wir ausdrücklich willkommen heißen (GEO-Kernabsicht). Die Seite
// ist vollständig öffentlich und statisch – es gibt nichts zu sperren; die
// expliziten Stanzas signalisieren Zustimmung und überschreiben restriktive
// Defaults einzelner Bots.
export const AI_CRAWLERS = Object.freeze([
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
  "Amazonbot",
  "Meta-ExternalAgent",
  "DuckAssistBot",
  "cohere-ai",
  "YouBot",
  "Timpibot",
]);

// Track-Metadaten. Reise = Spanisch lernen (DE/EN-Publikum), Locals = Englisch
// fürs Arbeiten lernen (ES-Publikum). Getrennte Hreflang-/Verlinkungsräume.
export const TRACKS = Object.freeze({
  reise: { locales: ["de", "en"], appParam: "" },
  locals: { locales: ["es"], appParam: "?edition=ingles-pro" },
});

// Absolute URL für einen Content-Pfad ("/de/slug/" → "https://…/holaRuta/de/slug/").
export function absoluteUrl(pathname) {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${BASE_URL}${p}`;
}
