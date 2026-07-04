/*
 * scripts/gen-curso-espanol.mjs – generiert die „Ruta del español" in data.js.
 *
 *   node scripts/gen-curso-espanol.mjs
 *
 * Was: ein wochenstrukturierter Spanisch-Kurs (4 Wochen × 5 Teile à 12 Karten)
 * als zusätzlicher PRETRIP-Plan (scope "ruta-espanol") – dieselbe Etappen-/
 * Study-Engine und derselbe Lernpfad-Renderer wie der Englisch-Kurs "curso-en"
 * (Wochen-Meilensteine über die Felder week/part/weekTitle*, siehe ui.js
 * renderPretrip). Je Teil eine Kategorie; die Karten kommen deterministisch
 * nach Level (dann Korpus-Reihenfolge) aus data.js CATEGORIES/CARDS.
 *
 * Wohin: idempotent zwischen die Marker
 *   // GENERIERT (scripts/gen-curso-espanol.mjs) – BEGIN ruta-espanol
 *   // GENERIERT – END ruta-espanol
 * direkt HINTER dem PRETRIP-Array (als PRETRIP.push(…)) – bewusst ans Ende:
 * defaultPretripScope() fällt auf PRETRIP[0] zurück ("colombia"), das muss so
 * bleiben. Der scope beginnt bewusst NICHT mit "curso": pretripPool() filtert
 * den Locals-Track auf /^curso/, der Spanisch-Kurs darf dort nicht auftauchen.
 *
 * Nach Korpus-Änderungen einfach erneut laufen lassen und den Diff prüfen.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data.js");

// ---------- Kursplan: 4 Wochen × 5 Kategorien (alle in data.js vorhanden) ----------
const CARDS_PER_PART = 12;
const WEEKS = [
  { titleDe: "Erste Schritte", titleEn: "First steps",
    cats: ["basics", "frases", "zahlen", "zeit", "colores"] },
  { titleDe: "Essen & Einkaufen", titleEn: "Food & shopping",
    cats: ["essen", "trinken", "compras", "dinero", "banco"] },
  { titleDe: "Unterwegs", titleEn: "On the road",
    cats: ["verkehr", "hotel", "rumbo", "notfall", "farmacia"] },
  { titleDe: "Menschen & Small Talk", titleEn: "People & small talk",
    cats: ["social", "talk", "alltag", "familia", "clima"] },
];

// ---------- data.js im window-Shim ausführen (wie in den Tests) ----------
const src = readFileSync(DATA, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: "data.js" });
const { CATEGORIES, CARDS } = sandbox.window.SC.data;
const catById = new Map(CATEGORIES.map((c) => [c.id, c]));

// Deterministische Auswahl: nach Level aufsteigend, bei Gleichstand Korpus-
// Reihenfolge – so beginnt jeder Teil mit den leichtesten Karten des Themas.
function pickCards(catId) {
  const pool = CARDS.map((c, i) => ({ c, i })).filter((x) => x.c.cat === catId);
  if (pool.length < CARDS_PER_PART) {
    throw new Error(`Kategorie ${catId}: nur ${pool.length} Karten (< ${CARDS_PER_PART})`);
  }
  pool.sort((a, b) => (a.c.lvl || 0) - (b.c.lvl || 0) || a.i - b.i);
  return pool.slice(0, CARDS_PER_PART).map((x) => x.c.id);
}

// ---------- Tage bauen & als Quelltext-Block formatieren ----------
const days = [];
WEEKS.forEach((w, wi) => {
  w.cats.forEach((catId, pi) => {
    const cat = catById.get(catId);
    if (!cat) throw new Error(`Unbekannte Kategorie: ${catId}`);
    days.push({
      day: wi * w.cats.length + pi + 1,
      week: wi + 1,
      part: pi + 1,
      weekTitleDe: pi === 0 ? w.titleDe : undefined,
      weekTitleEn: pi === 0 ? w.titleEn : undefined,
      titleDe: cat.label,
      titleEn: cat.labelEn || cat.label,
      cardIds: pickCards(catId),
    });
  });
});

const dayLines = days.map((d) => {
  const head = [`day: ${d.day}`, `week: ${d.week}`, `part: ${d.part}`];
  if (d.weekTitleDe) head.push(`weekTitleDe: ${JSON.stringify(d.weekTitleDe)}`, `weekTitleEn: ${JSON.stringify(d.weekTitleEn)}`);
  head.push(`titleDe: ${JSON.stringify(d.titleDe)}`, `titleEn: ${JSON.stringify(d.titleEn)}`);
  const ids = d.cardIds.map((id) => JSON.stringify(id)).join(", ");
  return `      { ${head.join(", ")},\n        cardIds: [${ids}] },`;
}).join("\n");

const BEGIN = "  // GENERIERT (scripts/gen-curso-espanol.mjs) – BEGIN ruta-espanol";
const END = "  // GENERIERT – END ruta-espanol";
const block = `${BEGIN}
  // „Ruta del español": wochenstrukturierter Kurs (Lernpfad) für den Reise-Track –
  // dieselbe Kurs-Mechanik wie der Englisch-Kurs. NICHT von Hand editieren,
  // stattdessen das Skript erneut ausführen. scope beginnt bewusst nicht mit
  // "curso" (Locals-Kurswähler filtert auf /^curso/).
  PRETRIP.push({
    scope: "ruta-espanol",
    label: "Ruta del español", labelEn: "Spanish course",
    days: [
${dayLines}
    ],
  });
${END}`;

// ---------- Idempotent in data.js spleißen ----------
let out;
const markerRe = new RegExp(`${escapeRe(BEGIN)}[\\s\\S]*?${escapeRe(END)}`);
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

if (markerRe.test(src)) {
  out = src.replace(markerRe, block);
} else {
  // Schließende Klammer des PRETRIP-Arrays per Klammer-Zählung finden und den
  // Block direkt dahinter einfügen (PRETRIP.push nach der Array-Definition).
  const start = src.indexOf("const PRETRIP = [");
  if (start < 0) throw new Error("const PRETRIP = [ nicht gefunden");
  let depth = 0, end = -1;
  for (let i = src.indexOf("[", start); i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) throw new Error("PRETRIP-Array-Ende nicht gefunden");
  const insertAt = src.indexOf("\n", end) + 1; // hinter „];"
  out = src.slice(0, insertAt) + "\n" + block + "\n" + src.slice(insertAt);
}

if (out !== src) {
  writeFileSync(DATA, out);
  console.log(`ruta-espanol: ${days.length} Teile in ${WEEKS.length} Wochen → data.js aktualisiert`);
} else {
  console.log("ruta-espanol: keine Änderung (Block identisch)");
}
