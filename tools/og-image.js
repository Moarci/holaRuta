"use strict";
/*
 * tools/og-image.js – Erzeugt die Social-Media-/OG-Vorschaubilder aus der Marke.
 *
 * HolaRuta (Reise-Spanisch, Standard-Marke):
 *   og-image.png                    1200×630  – Link-Vorschau (WhatsApp, Facebook, Instagram, LinkedIn, Signal …)
 *   og-image-square.png             1080×1080 – Instagram-Post / quadratische WhatsApp-Vorschau
 *
 * HelloAbroad (DE-EN-Reiseenglisch-Edition, siehe editions/registry.js):
 *   og-image-hello-abroad.png        1200×630 – Link-Vorschau der /hello-abroad/-URL
 *   og-image-square-hello-abroad.png 1080×1080 – quadratische Vorschau
 *
 * Quelle der Wahrheit ist DIESES Skript (kein KI-Bildgenerator): das Bild wird aus
 * denselben Tokens wie die App gebaut – Marken-Verlauf, Creme-Flächen, App-Icon-Motiv,
 * Bricolage Grotesque + Instrument Sans. Die PNGs unter / sind NUR Ergebnis und werden
 * nie von Hand bearbeitet. Beide Marken teilen sich Layout und Primitive; sie
 * unterscheiden sich nur in ihrer Theme-Tabelle (THEMES unten).
 *
 * Aufruf (Dev-Werkzeug, KEINE Runtime-Dependency der App):
 *   1) Renderer holen:        npm i -D @resvg/resvg-js
 *   2) Fonts als TTF bereitstellen (resvg liest kein woff2). Einmalig z. B. mit
 *      fonttools:  pip install fonttools brotli
 *        python3 - <<'PY'
 *        from fontTools.ttLib import TTFont
 *        for f in ["bricolage-grotesque-600-800-latin","instrument-sans-400-700-latin","instrument-sans-italic-400-latin"]:
 *            t=TTFont(f"fonts/{f}.woff2"); t.flavor=None; t.save(f"/tmp/og-fonts/{f}.ttf")
 *        PY
 *   3) Rendern:   OG_FONT_DIR=/tmp/og-fonts node tools/og-image.js
 *
 * Ohne installierten Renderer schreibt das Skript nur die SVG-Quellen nach docs/og/.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FONT_DIR = process.env.OG_FONT_DIR || path.join(ROOT, "fonts");
const FONTS = [
  "bricolage-grotesque-600-800-latin.ttf",
  "instrument-sans-400-700-latin.ttf",
  "instrument-sans-italic-400-latin.ttf",
].map((f) => path.join(FONT_DIR, f));

const DISPLAY = "Bricolage Grotesque";
const TEXT = "Instrument Sans";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- Marken-Themes ------------------------------------------------------
// Jedes Theme trägt seine Farbtokens (aus styles.css :root bzw. der Edition-Palette
// in editions/registry.js) UND seine Wortmarke/Beispielkarte. Die Zeichen-Primitive
// weiter unten lesen ausschließlich aus dem übergebenen Theme – so bleibt das Layout
// für beide Marken identisch und nur die Marke wechselt.

// App-Icon-Motive (im 512×512-Raum, deckungsgleich mit icon.svg / icon-hello-abroad.svg).
const MOTIF_PIN = "M256 86 C326 86 382 142 382 212 C382 296 296 360 256 446 C216 360 130 296 130 212 C130 142 186 86 256 86 Z";
const MOTIF_BUBBLE = "M96 150 h320 a40 40 0 0 1 40 40 v140 a40 40 0 0 1 -40 40 h-186 l-64 62 v-62 h-70 a40 40 0 0 1 -40 -40 v-140 a40 40 0 0 1 40 -40 Z";

const THEMES = {
  holaruta: {
    C: {
      pageDeep: "#1B0F0A", surface: "#F7EFE3", card: "#FFFDF6", cream: "#FBF3E4",
      brand: "#C2502E", brandInk: "#A23E20", ochre: "#E9A23B", ink: "#2D1B12",
      inkSoft: "#6E5A4C", muted: "#6E5848", ok: "#3F7355", warn: "#B97C24",
    },
    bg: ["#2E1B12", "#1B0F0A"],            // dunkler Marken-Hintergrund
    stripe: ["#C2502E", "#E9A23B"],        // Terrakotta → Ocker
    route: "#E9A23B",
    icon: { grad: ["#C2502E", "#E9A23B"], motif: MOTIF_PIN, motifFill: "#FBF3E4",
            text: "¿?", textFill: "#C2502E", textSize: 118, textY: 252 },
    wordmark: [{ t: "Hola", c: "#2D1B12" }, { t: "Ruta", c: "#C2502E" }],
    tagline: "Reise-Spanisch für echte Situationen",
    subline: "Karteikarten mit Spaced Repetition – lernt mit dir mit.",
    chips5: ["Bus", "Hotel", "Essen", "Geld", "Notfall"],
    chips6: ["Bus", "Hotel", "Essen", "Geld", "Notfall", "Smalltalk"],
    badge: "Offline · ohne Konto · kostenlos",
    stamp: "¡HOLA!",
    card: { tag: "Geld & Markt", tagW: 150, tagColor: "#B97C24",
            de: "Was kostet das?", es: "¿Cuánto cuesta?", ipa: "kuán-to kués-ta" },
    targets: {
      landscape: { svgFile: "docs/og/og-image.svg", png: "og-image.png" },
      square:    { svgFile: "docs/og/og-image-square.svg", png: "og-image-square.png" },
    },
  },

  "hello-abroad": {
    // Petrol-Palette der HelloAbroad-Edition (editions/registry.js accent + icon).
    // Warmes Ocker bleibt als Zweitakzent (Teal + Amber = ruhig, kontraststark –
    // bewusst für die Zielgruppe 50-60+ gut lesbar). Creme-Flächen wie HolaRuta.
    C: {
      pageDeep: "#0E2A2D", surface: "#F7EFE3", card: "#FFFDF6", cream: "#FBF3E4",
      brand: "#2F6B70", brandInk: "#1F4A4E", ochre: "#E9A23B", ink: "#22343A",
      inkSoft: "#5A6E6E", muted: "#6E7A78", ok: "#3F7355", warn: "#B97C24",
    },
    bg: ["#265257", "#123336"],            // dunkles Petrol
    stripe: ["#2F6B70", "#3E8388"],        // Petrol → helleres Teal (wie Icon-Verlauf)
    route: "#E9A23B",
    icon: { grad: ["#2F6B70", "#3E8388"], motif: MOTIF_BUBBLE, motifFill: "#FBF3E4",
            text: "Hi", textFill: "#1F4A4E", textSize: 150, textY: 258 },
    wordmark: [{ t: "Hello", c: "#22343A" }, { t: "Abroad", c: "#2F6B70" }],
    tagline: "Reiseenglisch für echte Situationen",
    subline: "Karteikarten mit Spaced Repetition – lernt mit dir mit.",
    chips5: ["Flughafen", "Hotel", "Restaurant", "Taxi", "Notfall"],
    chips6: ["Flughafen", "Hotel", "Restaurant", "Taxi", "Notfall", "Smalltalk"],
    badge: "Offline · ohne Konto · kostenlos",
    stamp: "HELLO!",
    card: { tag: "Einkaufen", tagW: 130, tagColor: "#B97C24",
            de: "Was kostet das?", es: "How much is it?", ipa: "hau matsch is it" },
    targets: {
      landscape: { svgFile: "docs/og/og-image-hello-abroad.svg", png: "og-image-hello-abroad.png" },
      square:    { svgFile: "docs/og/og-image-square-hello-abroad.svg", png: "og-image-square-hello-abroad.png" },
    },
  },
};

// App-Icon: gerundetes Quadrat, Marken-Verlauf, Creme-Motiv (Pin bzw. Sprechblase).
function appIcon(x, y, size, id, T) {
  const s = size / 512;
  const ic = T.icon;
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <defs>
      <linearGradient id="ic${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${ic.grad[0]}"/><stop offset="1" stop-color="${ic.grad[1]}"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="116" fill="url(#ic${id})"/>
    <path d="${ic.motif}" fill="${ic.motifFill}"/>
    <text x="256" y="${ic.textY}" font-family="${DISPLAY}" font-size="${ic.textSize}" font-weight="800" fill="${ic.textFill}" text-anchor="middle" dominant-baseline="middle">${esc(ic.text)}</text>
  </g>`;
}

function chip(x, y, label, w, T, h = 52) {
  const r = h / 2;
  const C = T.C;
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${C.brand}" fill-opacity="0.10" stroke="${C.brand}" stroke-opacity="0.30" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 1}" font-family="${TEXT}" font-weight="700" font-size="24" fill="${C.brandInk}" text-anchor="middle" dominant-baseline="middle">${esc(label)}</text>
  </g>`;
}
const chipW = (label) => Math.round(label.length * 13.2 + 40);

function chipRow(x, y, labels, T, gap = 14) {
  let cx = x, out = "";
  for (const l of labels) { const w = chipW(l); out += chip(cx, y, l, w, T); cx += w + gap; }
  return out;
}
function chipRowCentered(cx, y, labels, T, gap = 16) {
  const widths = labels.map(chipW);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1);
  let x = cx - total / 2, out = "";
  labels.forEach((l, i) => { out += chip(x, y, l, widths[i], T); x += widths[i] + gap; });
  return out;
}

const check = (x, y, s, color) =>
  `<path d="M${x} ${y + s * 0.55} l${s * 0.35} ${s * 0.4} l${s * 0.62} -${s * 0.9}" fill="none" stroke="${color}" stroke-width="${s * 0.18}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Passport-Stempel (Reise-Charme).
function stamp(cx, cy, r, label, color, rot) {
  return `<g transform="rotate(${rot} ${cx} ${cy})" opacity="0.85">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="4" stroke-opacity="0.7"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 9}" fill="none" stroke="${color}" stroke-width="2" stroke-opacity="0.55" stroke-dasharray="2 6"/>
    <text x="${cx}" y="${cy + 9}" font-family="${DISPLAY}" font-weight="800" font-size="26" fill="${color}" fill-opacity="0.8" text-anchor="middle" letter-spacing="1">${esc(label)}</text>
  </g>`;
}

// Lernkarte (DE-Frage → Antwort in der Lernsprache), leicht gekippt.
function flashcard(x, y, w, h, rot, o, T) {
  const C = T.C;
  const r = 30;
  return `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${C.card}" stroke="${C.brand}" stroke-opacity="0.16" stroke-width="2"/>
    <rect x="${x + 6}" y="${y + 18}" width="8" height="${h - 36}" rx="4" fill="${C.brand}"/>
    <rect x="${x + 40}" y="${y + 38}" width="${o.tagW}" height="44" rx="22" fill="${o.tagColor}" fill-opacity="0.14"/>
    <text x="${x + 40 + o.tagW / 2}" y="${y + 60}" font-family="${TEXT}" font-weight="700" font-size="20" fill="${o.tagColor}" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.5">${esc(o.tag)}</text>
    <text x="${x + 40}" y="${y + 132}" font-family="${TEXT}" font-weight="600" font-size="27" fill="${C.inkSoft}">${esc(o.de)}</text>
    <text x="${x + 40}" y="${y + 200}" font-family="${DISPLAY}" font-weight="800" font-size="${o.esSize}" fill="${C.brandInk}">${esc(o.es)}</text>
    <text x="${x + 40}" y="${y + 248}" font-family="${TEXT}" font-style="italic" font-weight="400" font-size="25" fill="${C.muted}">${esc(o.ipa)}</text>
  </g>`;
}

const routeLine = (d, op, color) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>`;

const DEFS = (T, extra = "") => `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="${T.bg[0]}"/><stop offset="1" stop-color="${T.bg[1]}"/></linearGradient>
  <linearGradient id="stripe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.stripe[0]}"/><stop offset="1" stop-color="${T.stripe[1]}"/></linearGradient>
  <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF4E8"/><stop offset="1" stop-color="${T.C.surface}"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000" flood-opacity="0.33"/></filter>
  <filter id="cardsh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="#1B0F0A" flood-opacity="0.28"/></filter>
  ${extra}</defs>`;

function wordmark(x, y, size, parts, anchor) {
  const spans = parts.map((p) => `<tspan fill="${p.c}">${esc(p.t)}</tspan>`).join("");
  const a = anchor ? ` text-anchor="${anchor}"` : "";
  return `<text x="${x}" y="${y}" font-family="${DISPLAY}" font-weight="800" font-size="${size}" letter-spacing="-2"${a}>${spans}</text>`;
}

function landscape(T) {
  const C = T.C;
  const W = 1200, H = 630, m = 40;
  const px = m, py = m + 8, pw = W - m * 2, ph = H - (m + 8) * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${DEFS(T)}
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${routeLine("M-20 540 C 240 470, 380 600, 640 470 S 1080 330, 1240 420", 0.16, T.route)}
  <circle cx="240" cy="487" r="7" fill="${C.ochre}" fill-opacity="0.22"/>
  <circle cx="640" cy="470" r="7" fill="${C.ochre}" fill-opacity="0.22"/>
  <circle cx="1040" cy="356" r="7" fill="${C.ochre}" fill-opacity="0.22"/>
  <g filter="url(#soft)"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="40" fill="url(#cream)"/></g>
  <rect x="${px}" y="${py}" width="${pw}" height="12" rx="6" fill="url(#stripe)"/>
  ${appIcon(px + 56, py + 70, 104, "L", T)}
  ${wordmark(px + 56, py + 270, 104, T.wordmark)}
  <text x="${px + 60}" y="${py + 322}" font-family="${TEXT}" font-weight="700" font-size="31" fill="${C.ink}">${esc(T.tagline)}</text>
  <text x="${px + 60}" y="${py + 362}" font-family="${TEXT}" font-weight="400" font-size="24" fill="${C.inkSoft}">${esc(T.subline)}</text>
  ${chipRow(px + 60, py + 392, T.chips5, T)}
  <rect x="${px + 60}" y="${py + 524}" width="412" height="48" rx="24" fill="${C.ok}" fill-opacity="0.12"/>
  ${check(px + 84, py + 537, 22, C.ok)}
  <text x="${px + 116}" y="${py + 555}" font-family="${TEXT}" font-weight="700" font-size="22" fill="${C.ok}">${esc(T.badge)}</text>
  <g filter="url(#cardsh)">${flashcard(px + 662, py + 92, 420, 300, 4, { ...T.card, esSize: 52 }, T)}</g>
  ${stamp(px + 1042, py + 360, 56, T.stamp, C.brand, -14)}
</svg>`;
}

function square(T) {
  const C = T.C;
  const W = 1080, H = 1080, m = 36;
  const px = m, py = m, pw = W - m * 2, ph = H - m * 2, cx = W / 2;
  const cardW = 640, cardH = 300, cardX = cx - cardW / 2, cardY = 470;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${DEFS(T)}
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${routeLine("M-20 250 C 220 180, 360 330, 560 240 S 960 120, 1120 210", 0.15, T.route)}
  ${routeLine("M-20 880 C 240 820, 400 940, 600 850 S 980 720, 1120 800", 0.13, T.route)}
  <circle cx="560" cy="240" r="7" fill="${C.ochre}" fill-opacity="0.22"/>
  <circle cx="600" cy="850" r="7" fill="${C.ochre}" fill-opacity="0.20"/>
  <g filter="url(#soft)"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="44" fill="url(#cream)"/></g>
  <rect x="${px}" y="${py}" width="${pw}" height="13" rx="6.5" fill="url(#stripe)"/>
  ${appIcon(cx - 66, py + 70, 132, "S", T)}
  ${wordmark(cx, py + 330, 120, T.wordmark, "middle")}
  <text x="${cx}" y="${py + 388}" font-family="${TEXT}" font-weight="700" font-size="34" fill="${C.ink}" text-anchor="middle">${esc(T.tagline)}</text>
  <g filter="url(#cardsh)">${flashcard(cardX, cardY, cardW, cardH, -3, { ...T.card, esSize: 58 }, T)}</g>
  ${stamp(cardX + cardW - 30, cardY + 28, 56, T.stamp, C.brand, -14)}
  ${chipRowCentered(cx, 840, T.chips6, T)}
  <rect x="${cx - 230}" y="930" width="460" height="54" rx="27" fill="${C.ok}" fill-opacity="0.12"/>
  ${check(cx - 196, 945, 24, C.ok)}
  <text x="${cx + 16}" y="959" font-family="${TEXT}" font-weight="700" font-size="25" fill="${C.ok}" text-anchor="middle">${esc(T.badge)}</text>
</svg>`;
}

// ---- Ausgabe ------------------------------------------------------------
const TARGETS = [];
for (const key of Object.keys(THEMES)) {
  const T = THEMES[key];
  TARGETS.push({ svg: landscape(T), svgFile: T.targets.landscape.svgFile, png: T.targets.landscape.png });
  TARGETS.push({ svg: square(T), svgFile: T.targets.square.svgFile, png: T.targets.square.png });
}

fs.mkdirSync(path.join(ROOT, "docs/og"), { recursive: true });
for (const t of TARGETS) {
  fs.writeFileSync(path.join(ROOT, t.svgFile), t.svg);
  console.log(`✓ ${t.svgFile}`);
}

let Resvg;
try { ({ Resvg } = require("@resvg/resvg-js")); }
catch { console.log("ℹ @resvg/resvg-js nicht installiert – nur SVG geschrieben. Siehe Datei-Kopf zum Rendern."); process.exit(0); }

const haveFonts = FONTS.every((f) => fs.existsSync(f));
if (!haveFonts) {
  console.log(`ℹ Keine TTF-Fonts in ${FONT_DIR} – nur SVG geschrieben. Siehe Datei-Kopf (OG_FONT_DIR).`);
  process.exit(0);
}

for (const t of TARGETS) {
  const r = new Resvg(t.svg, {
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: TEXT },
    shapeRendering: 2, textRendering: 2,
  });
  const png = r.render();
  fs.writeFileSync(path.join(ROOT, t.png), png.asPng());
  console.log(`✓ ${t.png}  ${png.width}×${png.height}`);
}
