/*
 * scripts/geo/config.mjs — zentrale Konstanten der GEO/SEO-Content-Pipeline.
 *
 * EINE Quelle der Wahrheit für Domain, Marke, Sprachen und Crawler-Politik.
 * Ein weiterer Domain-Umzug ist ein Einzeiler hier: BASE_URL ändern, neu
 * generieren (npm run geo:generate && npm run geo:prerender) – der Rest der
 * Pipeline zieht BASE_URL aus dieser Datei.
 *
 * WICHTIG: BASE_URL ohne abschließenden Slash. holaruta.com ist die primäre
 * Domain (Vercel-Hosting, IONOS als Registrar/DNS); holaruta.de leitet als
 * reine Domain-Weiterleitung auf holaruta.com um und hat keinen eigenen
 * Seitenbestand.
 */
"use strict";

export const BASE_URL = "https://holaruta.com";

export const BRAND = Object.freeze({
  name: "HolaRuta",
  tagline: {
    de: "Reise-Spanisch für echte Situationen",
    en: "Travel Spanish for real situations",
    es: "El inglés que tu trabajo necesita",
  },
  email: "hola@holaruta.com",
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

// "zuletzt überarbeitet"-Datum der generierten Inhalte (JSON-LD dateModified,
// Sitemap lastmod). Bewusst KEIN Date.now() als Default: sonst ändern sich
// committete Artefakte bei jedem Build. Bei inhaltlichen Updates den Default
// hochsetzen ODER pro Build über die Umgebungsvariable CONTENT_DATE stempeln
// (z. B. in CI: `CONTENT_DATE=$(date +%F) node build.js --dist`) – Freshness
// ist ein Ranking-/Antwort-Signal für Answer-Engines, ein statisches Datum auf
// allen Seiten wirkt weder aktuell noch differenziert.
const CONTENT_DATE_DEFAULT = "2026-07-09";

// Echte Kalendervalidierung, nicht nur die Ziffern-Form: der Wert wandert
// unverändert als schema.org-Date ins JSON-LD, deshalb darf ein syntaktisch
// passendes, aber unmögliches Datum (z. B. "2026-13-45" oder der 30. Februar)
// NICHT durchrutschen. Rekonstruktion über Date.UTC deckt genau diese
// Roll-over-Fälle auf (aus 2026-02-30 würde sonst still der 2. März).
export function isValidContentDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

// Env-Wert nur übernehmen, wenn er ein echtes YYYY-MM-DD-Datum ist; sonst
// sicher auf den Default zurückfallen (nie ein kaputtes Datum ins JSON-LD).
export function resolveContentDate(raw, fallback = CONTENT_DATE_DEFAULT) {
  return isValidContentDate(raw) ? raw : fallback;
}

export const CONTENT_DATE = resolveContentDate(process.env.CONTENT_DATE);

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
