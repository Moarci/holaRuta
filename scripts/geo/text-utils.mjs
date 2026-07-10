/*
 * scripts/geo/text-utils.mjs — kleine, reine String-Helfer für die GEO-Pipeline.
 * Kein DOM, keine Abhängigkeiten. Bewusst konservativ (Escaping!), weil die
 * Ausgaben roh in HTML/JSON-LD/XML landen.
 */
"use strict";

// Umlaute/Akzente → ASCII, für saubere, stabile URL-Slugs.
const SLUG_MAP = {
  á: "a", à: "a", ä: "ae", â: "a", ã: "a", å: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  í: "i", ì: "i", î: "i", ï: "i",
  ó: "o", ò: "o", ö: "oe", ô: "o", õ: "o",
  ú: "u", ù: "u", ü: "ue", û: "u",
  ñ: "n", ç: "c", ß: "ss",
};

/** Erzeugt einen URL-sicheren Slug ("Mérida" → "merida", "Torres del Paine" → "torres-del-paine"). */
export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[áàäâãåéèêëíìîïóòöôõúùüûñçß]/g, (ch) => SLUG_MAP[ch] || ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapet Text für sicheren Einsatz in HTML-Body UND -Attributen. */
export function escapeHtml(input) {
  return String(input == null ? "" : input).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** Escapet Text für XML (Sitemap). */
export function escapeXml(input) {
  return escapeHtml(input);
}

/**
 * Kürzt Text auf max. `max` Zeichen an einer Wortgrenze (für <title>/description).
 * Hängt kein "…" an, wenn ungekürzt.
 */
export function truncate(input, max = 158) {
  const s = String(input || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "") + "…";
}

/** Erster Satz eines Textes (für Direktantwort-Intros). */
export function firstSentence(input, fallbackMax = 220) {
  const s = String(input || "").replace(/\s+/g, " ").trim();
  const m = s.match(/^.*?[.!?](?:\s|$)/);
  const out = m ? m[0].trim() : s;
  return out.length > fallbackMax ? truncate(out, fallbackMax) : out;
}

/** Normalisiert Whitespace zu einfachem Text (für JSON-LD-Werte). */
export function plain(input) {
  return String(input == null ? "" : input).replace(/\s+/g, " ").trim();
}

/**
 * Entfernt eine erklärende Klammer-Anmerkung ("Was geht? (lockere Begrüßung)"
 * -> "Was geht?") für Stellen, an denen das Wort/die Phrase selbst zitiert
 * wird (z. B. FAQ-Fragen "Wie sagt man X auf Spanisch?"). Die Anmerkung bleibt
 * an anderer Stelle (Bullet-Listen) erhalten – nur hier stört sie, weil sie
 * sonst als Teil der zu übersetzenden Phrase erscheint.
 */
export function stripParenthetical(input) {
  return plain(String(input || "").replace(/\s*\([^)]*\)\s*$/, ""));
}

/**
 * Liest ein Feld lokalisiert aus den App-Datenobjekten (countries.js-Konvention):
 * en -> feldEn (Fallback auf das Basisfeld), de -> Basisfeld direkt.
 */
export function loc(obj, field, locale) {
  if (locale === "en") {
    const en = obj[`${field}En`];
    if (en != null && en !== "") return en;
  }
  return obj[field];
}
