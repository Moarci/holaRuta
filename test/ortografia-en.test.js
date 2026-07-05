/*
 * ortografia-en.test.js – Regelbasierter ENGLISCH-Linter über alle englischen
 * Felder des Locals-Tracks (Spanisch lernt Englisch, Edition „ingles-pro"):
 *   card.en, card.alt[], context.egLearn, context.situationEn, context.noteEn.
 *
 * Gegenstück zu ortografia-es.test.js. Fängt typische Fehlerklassen früh, OHNE
 * Muttersprachler-Review zu ersetzen:
 *
 *   (a) Keine doppelten Leerzeichen (Copy-&-Paste-Artefakte). HART.
 *   (b) Ausgewogene Klammern () und []. HART.
 *   (c) Keine spanienspezifischen Zeichen ¿ ¡ ñ in EN-Feldern (Sprachvermischung).
 *       HEURISTIK mit Whitelist (Lehnwörter/Eigennamen wie „jalapeño").
 *   (d) Satzinitiale Großschreibung bei vollständigen Sätzen (Feld endet auf .?!).
 *       HEURISTIK mit Whitelist (z. B. „iPhone").
 *
 * BETRIEBSMODUS: (a),(b) strikt (Restmenge 0). (c),(d) Reporting + Whitelist;
 * nicht-gewhitelistete Restmenge muss 0 sein → neue Treffer erzwingen eine
 * Entscheidung (Karte korrigieren ODER bewusst whitelisten). STRICT=true (später,
 * nach Muttersprachler-Sign-off) macht jeden Treffer zum Fehler.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
const SRC = path.join(__dirname, "..");
require(path.join(SRC, "editions", "registry.js"));
window.SC.editionConfig = window.SC.editions["ingles-pro"];
require(path.join(SRC, "config.js"));
require(path.join(SRC, "i18n.js"));
require(path.join(SRC, "i18n.strings.js"));
require(path.join(SRC, "i18n.strings.es.js"));
require(path.join(SRC, "matcher.js"));
require(path.join(SRC, "data.js"));
require(path.join(SRC, "data.locals.js"));
require(path.join(SRC, "contextdata.locals.js"));
require(path.join(SRC, "numbers.js"));
require(path.join(SRC, "context.js"));
const { data } = window.SC;

// Alle englischen Strings einer loc-Karte mit Herkunfts-Etikett (für lesbare Reports).
function enFields(c) {
  const out = [];
  if (typeof c.en === "string" && c.en.trim()) out.push(["en", c.en]);
  if (Array.isArray(c.alt)) c.alt.forEach((a, i) => { if (typeof a === "string" && a.trim()) out.push([`alt[${i}]`, a]); });
  const x = c.context;
  if (x) {
    if (typeof x.egLearn === "string" && x.egLearn.trim()) out.push(["context.egLearn", x.egLearn]);
    if (typeof x.situationEn === "string" && x.situationEn.trim()) out.push(["context.situationEn", x.situationEn]);
    if (typeof x.noteEn === "string" && x.noteEn.trim()) out.push(["context.noteEn", x.noteEn]);
  }
  return out;
}
const LOC = (data.CARDS || []).filter((c) => /^loc-/.test(c.id) && enFields(c).length);

// ---- (c)/(d) Whitelist bekannter, bewusst akzeptierter Treffer (id|field|rule) ----
const STRICT = false; // später true: alle Treffer werden zu harten Fehlern.
const WHITELIST = new Set([
  // hier landen geprüfte Lehnwörter/Eigennamen (¿¡ñ) bzw. Marken (iPhone) –
  // wird beim Sign-off pro Kategorie gepflegt.
  // Medellín (loc-med): Eigennamen/Speisen mit ñ bleiben korrekt so geschrieben.
  "loc-cpais11|en|c", "loc-cpais11|context.egLearn|c",   // buñuelo
  "loc-guat05|en|c", "loc-guat05|context.egLearn|c",     // La Piedra del Peñol
  "loc-guat15|en|c", "loc-guat15|context.egLearn|c",     // El Peñol
]);

// ============================ Regel (a) ============================
test("(a) Keine doppelten Leerzeichen in englischen Feldern", () => {
  const bad = [];
  for (const c of LOC) for (const [field, val] of enFields(c)) {
    if (/ {2,}/.test(val)) bad.push(`${c.id} (${field}): ${JSON.stringify(val)}`);
  }
  if (bad.length) console.log("  Doppelte-Leerzeichen-Treffer:\n   " + bad.join("\n   "));
  assert.equal(bad.length, 0, `${bad.length} EN-Feld(er) mit doppelten Leerzeichen`);
});

// ============================ Regel (b) ============================
test("(b) Ausgewogene Klammern () und [] in englischen Feldern", () => {
  const bad = [];
  const cnt = (s, ch) => (s.split(ch).length - 1);
  for (const c of LOC) for (const [field, val] of enFields(c)) {
    if (cnt(val, "(") !== cnt(val, ")")) bad.push(`${c.id} (${field}): unbalancierte () → ${val}`);
    if (cnt(val, "[") !== cnt(val, "]")) bad.push(`${c.id} (${field}): unbalancierte [] → ${val}`);
  }
  if (bad.length) console.log("  Klammer-Treffer:\n   " + bad.join("\n   "));
  assert.equal(bad.length, 0, `${bad.length} EN-Feld(er) mit unbalancierten Klammern`);
});

// ============================ Regel (c) ============================
test("(c) Keine spanischen Zeichen ¿ ¡ ñ in EN-Feldern: Restmenge = 0", () => {
  const RE = /[¿¡ñ]/;
  const all = [];
  for (const c of LOC) for (const [field, val] of enFields(c)) {
    if (RE.test(val)) all.push({ key: `${c.id}|${field}|c`, line: `${c.id} (${field}) → ${val}` });
  }
  const open = all.filter((h) => !WHITELIST.has(h.key));
  console.log(`  Spanisch-Zeichen-in-EN: ${all.length} Treffer, ${all.length - open.length} gewhitelistet, ${open.length} offen.`);
  if (open.length) console.log("  (OFFEN – bitte prüfen):\n   " + open.map((h) => h.line).join("\n   "));
  const fails = STRICT ? all : open;
  assert.equal(fails.length, 0, `${fails.length} offene Spanisch-Zeichen-Treffer (STRICT=${STRICT})`);
});

// ============================ Regel (d) ============================
test("(d) Vollständige EN-Sätze beginnen groß: Restmenge = 0", () => {
  const all = [];
  for (const c of LOC) for (const [field, val] of enFields(c)) {
    if (/^alt\[/.test(field)) continue;     // alt = nur Matching, nie angezeigt (Kleinschr. ok)
    const t = val.trim();
    if (!/[.?!]$/.test(t)) continue;        // nur vollständige Sätze
    // Erstes Zeichen muss Großbuchstabe/Ziffer/Zitat sein. Beginnt der Satz bewusst
    // mit einem klein gesetzten Zitat ("cc" …), ist das erste Zeichen ein " → ok.
    if (/^[a-z]/.test(t)) all.push({ key: `${c.id}|${field}|d`, line: `${c.id} (${field}) → ${val}` });
  }
  const open = all.filter((h) => !WHITELIST.has(h.key));
  console.log(`  Klein-Satzanfang-in-EN: ${all.length} Treffer, ${all.length - open.length} gewhitelistet, ${open.length} offen.`);
  if (open.length) console.log("  (OFFEN – bitte prüfen):\n   " + open.map((h) => h.line).join("\n   "));
  const fails = STRICT ? all : open;
  assert.equal(fails.length, 0, `${fails.length} offene Klein-Satzanfang-Treffer (STRICT=${STRICT})`);
});
