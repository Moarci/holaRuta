/*
 * scripts/geo/render-html.mjs — rendert ein Seiten-Objekt zu einer vollständig
 * statischen HTML-Datei (kein JS-Bundle, keine SPA-Hydration nötig).
 *
 * Bewusst EIN eigenes, schlankes Template statt die App-Hülle zu laden: die
 * Content-Seiten sind Lese-/Zitat-Seiten, keine Lernkarten-App. app.js (435 KB)
 * + ui.js (256 KB) mitzuladen wäre für eine reine Textseite unangemessen.
 * Kritisches CSS ist inline (kein Render-Blocking-Request), self-hosted Fonts
 * werden per <link rel=preload> vorgeladen wie in index.html/landing.html.
 *
 * CSP wie index.html: script-src 'self' OHNE 'unsafe-inline' (siehe unten,
 * der einzige <script>-Block ist JSON-LD und braucht das nicht); keine
 * externen Ressourcen.
 */
"use strict";

import { BASE_URL, BRAND, OG_LOCALE } from "./config.mjs";
import { buildJsonLd, toJsonLdScript } from "./jsonld.mjs";
import { escapeHtml } from "./text-utils.mjs";

// script-src 'self' OHNE 'unsafe-inline': der einzige <script>-Block auf diesen
// Seiten ist das JSON-LD (type="application/ld+json"), das als Nicht-JS-Typ
// laut HTML-Spec ohnehin nicht der script-src-Durchsetzung unterliegt (siehe
// index.html). 'unsafe-inline' wäre hier unnötig aufgeweichte Härtung.
const CSP =
  "default-src 'self'; script-src 'self'; img-src 'self' data:; " +
  "style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; " +
  "object-src 'none'; base-uri 'self'; form-action 'self'";

// Relative Tiefe eines Pfads wie "/de/reise-spanisch-mexiko/" → "../../" (zurück
// zum Site-Root), damit generierte Seiten unabhängig vom Deploy-Subpfad linken.
function rootPrefix(path) {
  const depth = path.split("/").filter(Boolean).length;
  return depth > 0 ? "../".repeat(depth) : "./";
}

function renderHreflangLinks(page) {
  const links = [];
  const locales = Object.keys(page.alternates || {});
  for (const loc of locales) {
    links.push(`  <link rel="alternate" hreflang="${loc}" href="${BASE_URL}${page.alternates[loc]}" />`);
  }
  if (locales.length > 1) {
    const def = page.alternates[page.locale] || page.path;
    links.push(`  <link rel="alternate" hreflang="x-default" href="${BASE_URL}${def}" />`);
  }
  return links.join("\n");
}

function renderHead(page, root) {
  const title = escapeHtml(page.meta.title);
  const desc = escapeHtml(page.meta.description);
  const ogLocale = OG_LOCALE[page.locale] || "de_DE";
  const jsonLd = toJsonLdScript(buildJsonLd(page));

  return `<!DOCTYPE html>
<html lang="${page.locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="${BRAND.themeColor}" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${page.canonical}" />
${renderHreflangLinks(page)}

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${BRAND.name}" />
  <meta property="og:locale" content="${ogLocale}" />
  <meta property="og:url" content="${page.canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${BRAND.ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${BRAND.ogImage}" />

  <link rel="icon" href="${root}icon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="${root}icon-180.png" />
  <link rel="preload" as="font" type="font/woff2" crossorigin href="${root}fonts/bricolage-grotesque-600-800-latin.woff2" />
  <link rel="preload" as="font" type="font/woff2" crossorigin href="${root}fonts/instrument-sans-400-700-latin.woff2" />

  <meta http-equiv="Content-Security-Policy" content="${CSP}" />
  <meta name="referrer" content="no-referrer" />

  <script type="application/ld+json">
${jsonLd}
  </script>

  <style>${renderCriticalCss(root)}</style>
</head>`;
}

function renderCriticalCss(root) {
  return `
    @font-face{font-family:"Bricolage Grotesque";font-weight:200 800;font-display:swap;src:url("${root}fonts/bricolage-grotesque-600-800-latin.woff2") format("woff2");}
    @font-face{font-family:"Instrument Sans";font-weight:400 700;font-display:swap;src:url("${root}fonts/instrument-sans-400-700-latin.woff2") format("woff2");}
    :root{--page:#241510;--surface:#F7EFE3;--card:#FFFDF6;--ink:#2D1B12;--ink-soft:#6E5A4C;--brand:#C2502E;--brand-ink:#A23E20;}
    @media (prefers-color-scheme:dark){:root{--page:#0E0907;--surface:#241510;--card:#2D1B12;--ink:#F7EFE3;--ink-soft:#C9B8A8;--brand:#E06A40;--brand-ink:#F0996B;}}
    *{box-sizing:border-box;}
    body{margin:0;background:var(--page);color:var(--ink);font-family:"Instrument Sans",system-ui,sans-serif;line-height:1.55;}
    a{color:var(--brand-ink);}
    .geo-skip{position:absolute;left:-999px;top:0;background:var(--card);color:var(--ink);padding:.5rem 1rem;z-index:10;}
    .geo-skip:focus{left:.5rem;top:.5rem;}
    .geo-shell{max-width:720px;margin:0 auto;padding:1.5rem 1.25rem 4rem;background:var(--surface);min-height:100vh;}
    .geo-nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem 0 1.5rem;font-weight:700;}
    .geo-nav a{text-decoration:none;color:var(--ink);}
    .geo-crumbs{font-size:.85rem;color:var(--ink-soft);margin-bottom:1rem;}
    .geo-crumbs a{color:var(--ink-soft);}
    h1{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.15;margin:0 0 .75rem;}
    h2{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:700;font-size:1.3rem;margin:2rem 0 .75rem;}
    .geo-lede-q{font-size:1.15rem;margin:.25rem 0 .5rem;color:var(--ink);}
    h3{font-size:1.05rem;margin:1.25rem 0 .4rem;}
    p{margin:0 0 1rem;}
    .geo-intro{font-size:1.1rem;color:var(--ink-soft);}
    ul{padding-left:1.2rem;margin:0 0 1rem;}
    li{margin-bottom:.4rem;}
    section{margin-bottom:1.5rem;}
    .geo-faq article{margin-bottom:1.1rem;}
    .geo-cta{display:inline-block;margin-top:1rem;padding:.75rem 1.5rem;background:var(--brand);color:#fff;border-radius:999px;text-decoration:none;font-weight:700;box-shadow:0 2px 0 rgba(45,27,18,.14);}
    .geo-related a,.geo-cities a{display:inline-block;margin:0 .5rem .5rem 0;padding:.35rem .8rem;background:var(--card);border-radius:999px;text-decoration:none;color:var(--ink);font-size:.9rem;}
    footer{margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid rgba(45,27,18,.12);font-size:.85rem;color:var(--ink-soft);}
    footer a{color:var(--ink-soft);}
  `.replace(/\n\s+/g, "");
}

function renderSection(sec) {
  const paras = (sec.paragraphs || []).map((p) => `      <p>${escapeHtml(p)}</p>`).join("\n");
  const bullets = sec.bullets && sec.bullets.length
    ? `      <ul>\n${sec.bullets.map((b) => `        <li>${escapeHtml(b)}</li>`).join("\n")}\n      </ul>`
    : "";
  return `    <section>
      <h2>${escapeHtml(sec.heading)}</h2>
${[paras, bullets].filter(Boolean).join("\n")}
    </section>`;
}

function renderFaq(faq, faqLabel) {
  if (!faq || !faq.length) return "";
  const items = faq
    .map((f) => `      <article>\n        <h3>${escapeHtml(f.question)}</h3>\n        <p>${escapeHtml(f.answer)}</p>\n      </article>`)
    .join("\n");
  return `    <section class="geo-faq">
      <h2>${escapeHtml(faqLabel)}</h2>
${items}
    </section>`;
}

function renderLinkList(links, label, root, className) {
  if (!links || !links.length) return "";
  const items = links
    .map((r) => `<a href="${root}${r.path.replace(/^\//, "")}">${escapeHtml(r.label)}</a>`)
    .join("\n        ");
  return `    <section class="${className}">
      <h2>${escapeHtml(label)}</h2>
      <p>${items}</p>
    </section>`;
}

function renderRelated(page, relatedLabel, root) {
  return renderLinkList(page.internalLinks?.related, relatedLabel, root, "geo-related");
}

// Direktantwort-Block (AEO): die primäre beantwortbare Frage der Seite als
// Überschrift, unmittelbar gefolgt von der prägnanten Antwort (Intro). Genau
// das Q->A-Muster, aus dem Answer-Engines Featured Snippets / AI Overviews
// ziehen – und zwar oben auf der Seite, nicht erst im FAQ-Block ganz unten.
// Übersprungen, wenn die Frage ohnehin schon dem H1 entspricht (Pillar-Seiten
// setzen question === h1, deren H1 IST bereits die Frage) – sonst stünde die
// identische Zeile doppelt untereinander.
function renderLede(page) {
  const intro = `      <p class="geo-intro">${escapeHtml(page.intro)}</p>`;
  const q = (page.question || "").trim();
  if (q && q.toLowerCase() !== (page.h1 || "").trim().toLowerCase()) {
    return `      <h2 class="geo-lede-q">${escapeHtml(q)}</h2>\n${intro}`;
  }
  return intro;
}

// Länder-Seiten verlinken zusätzlich auf ihre Städte-Guides: eigener Block mit
// eigener Überschrift statt in "Weiterlesen" vermischt (klarere Ankertexte für
// Crawler + Nutzer).
function renderCityLinks(page, citiesLabel, root) {
  return renderLinkList(page.internalLinks?.cities, citiesLabel, root, "geo-cities");
}

const NAV_LABEL = { de: "Zum Inhalt springen", en: "Skip to content", es: "Saltar al contenido" };
const RELATED_LABEL = { de: "Weiterlesen", en: "Keep reading", es: "Seguir leyendo" };
const CITIES_LABEL = { de: "Städte-Guides in diesem Land", en: "City guides in this country", es: "Guías de ciudades en este país" };
const FAQ_LABEL = { de: "Häufige Fragen", en: "Frequently asked questions", es: "Preguntas frecuentes" };

/**
 * Rendert die vollständige HTML-Seite für ein Seiten-Objekt aus dem Manifest.
 * @param {object} page
 * @returns {string} HTML-Dokument
 */
export function renderPage(page) {
  const root = rootPrefix(page.path);
  const head = renderHead(page, root);
  const hubLink = page.internalLinks?.hub;
  const appUrl = page.internalLinks?.app?.url || `${BASE_URL}/`;
  const appLabel = page.internalLinks?.app?.label || BRAND.name;

  const crumbs = hubLink
    ? `      <p class="geo-crumbs"><a href="${root}">${escapeHtml(BRAND.name)}</a> / <a href="${root}${hubLink.path.replace(/^\//, "")}">${escapeHtml(hubLink.label)}</a></p>`
    : `      <p class="geo-crumbs"><a href="${root}">${escapeHtml(BRAND.name)}</a></p>`;

  // Locals-Track ("HolaRuta · Inglés") ist ein eigenes Produkt mit eigener
  // Marketing-Landing – der Footer-Link muss dorthin zeigen, nicht auf die
  // Reise-Spanisch-Landing.
  const landingFile = page.track === "locals" ? "landing-locals.html" : "landing.html";

  const body = `<body>
  <a href="#geo-main" class="geo-skip">${escapeHtml(NAV_LABEL[page.locale] || NAV_LABEL.de)}</a>
  <div class="geo-shell">
    <nav class="geo-nav">
      <a href="${root}">${escapeHtml(BRAND.name)}</a>
      <a class="geo-cta" href="${appUrl}">${escapeHtml(appLabel)}</a>
    </nav>
    <main id="geo-main">
${crumbs}
      <h1>${escapeHtml(page.h1)}</h1>
${renderLede(page)}
${page.sections.map(renderSection).join("\n")}
${renderFaq(page.faq, FAQ_LABEL[page.locale] || FAQ_LABEL.de)}
${renderCityLinks(page, CITIES_LABEL[page.locale] || CITIES_LABEL.de, root)}
${renderRelated(page, RELATED_LABEL[page.locale] || RELATED_LABEL.de, root)}
      <a class="geo-cta" href="${appUrl}">${escapeHtml(appLabel)}</a>
    </main>
    <footer>
      <p>&copy; ${escapeHtml(BRAND.name)} — <a href="${root}${landingFile}">${escapeHtml(BRAND.tagline[page.locale] || BRAND.tagline.de)}</a></p>
    </footer>
  </div>
</body>
</html>
`;

  return `${head}\n${body}`;
}
