"use strict";
/*
 * tools/audit-locals.js – Content-Audit für den LOCALS-Track (Spanisch lernt
 * Englisch, Edition „ingles-pro"). Zwei Aufgaben:
 *
 *   1. SYNONYM-KANDIDATEN (advisory): findet Karten, deren englische Antwort ein
 *      Wort mit einer gebräuchlichen Variante trägt (AmE↔BrE oder echtes Synonym,
 *      z. B. the bill/the check, restroom/toilet, elevator/lift) und die noch KEIN
 *      `alt` dafür akzeptieren. Solche Karten werten ein korrektes Synonym aktuell
 *      als falsch – Arbeitsliste für das `alt`-Feature.
 *
 *   2. HARTE PRÜFUNGEN (gate-fähig, `--strict`):
 *      (a) `alt`-Struktur: jeder Eintrag nicht leer, normalisierbar und untereinander
 *          distinkt. WICHTIG: Bei nicht-leerem `alt` MUSS die Haupt-`en` enthalten
 *          sein – der Matcher (matcher.js: acceptedAnswers) lässt `alt` die
 *          Antwortmenge ERSETZEN, d. h. ohne die Haupt-`en` würde die eigene,
 *          angezeigte Antwort als falsch gewertet (früher der „besides"-Bug).
 *      (b) Ambiguität: ein `alt`-Synonym darf nicht der Haupt-`en` einer ANDEREN
 *          Karte im selben Lern-Set (Kategorie / Preset / Kurs-Etappe) entsprechen
 *          (sonst zwei „richtige" Karten mit kollidierender Antwort). Artikel-los
 *          verglichen, weil der Matcher „the X" == „X" akzeptiert.
 *
 * Aufruf (Dev-Werkzeug, KEINE Runtime-Dependency):
 *   node tools/audit-locals.js               – Bericht (Markdown): Fehler + Kandidaten-Zahl
 *   node tools/audit-locals.js --candidates   – zusätzlich die volle Kandidatenliste
 *   node tools/audit-locals.js --json         – maschinenlesbar { errors, candidates }
 *   node tools/audit-locals.js --strict       – Exit-Code 1, wenn HARTE Fehler (1) gefunden
 *
 * Reine Lese-/Analyse-Logik, ändert keine Daten.
 */
const path = require("path");

globalThis.window = globalThis.window || {};
const SRC = path.join(__dirname, "..");
require(path.join(SRC, "editions", "registry.js"));
globalThis.window.SC.editionConfig = globalThis.window.SC.editions["ingles-pro"];
require(path.join(SRC, "config.js"));
require(path.join(SRC, "data.js"));
require(path.join(SRC, "data.locals.js"));
const { data, dataLocals } = globalThis.window.SC;

// Locals-Karten aus dem aktiven Korpus (data.locals hat sie an SC.data angehängt).
const LOC = (data.CARDS || []).filter((c) => /^loc-/.test(c.id));
const byId = Object.fromEntries(LOC.map((c) => [c.id, c]));

// Normalisierung wie der Matcher sie fürs Englische sieht: lowercase, Satzzeichen
// weg, Mehrfach-Spaces zu einem, führendes the/a/an optional (Artikel-Toleranz).
function norm(s) {
  return String(s || "").toLowerCase().replace(/[.,!?¿¡;:"'()]/g, "").replace(/\s+/g, " ").trim();
}
function stripArticle(n) {
  return n.replace(/^(?:the|a|an)\s+/, "");
}
function key(s) {
  return stripArticle(norm(s));
}

// Akzeptierte Antworten einer Karte (Haupt-`en` + `alt`), normalisiert & artikel-los.
function acceptedKeys(card) {
  const arr = Array.isArray(card.alt) && card.alt.length ? card.alt : [card.en];
  return arr.map(key);
}

// ---- Variantentabelle: Gruppen austauschbarer EN-Formen (AmE↔BrE + Synonyme) ----
// Wort-genaue Treffer (Wortgrenzen). BEWUSST KONSERVATIV: nur eindeutige Nomen-
// Synonyme und Schreibvarianten. Hochpolyseme Wörter, die häufiger als VERB
// auftreten (check, return, store, line, tap, fall, chips …), sind ABSICHTLICH
// NICHT enthalten – sonst feuert „One moment while I check" als Restaurant-„check".
// Mehrwort-Nomenphrasen statt nackter Polysem-Wörter, wo nötig.
const VARIANT_GROUPS = [
  ["the bill", "the check"], ["the restroom", "the bathroom", "the toilet"],
  ["restroom", "bathroom", "toilet"],
  ["elevator", "lift"], ["apartment", "flat"],
  ["subway", "underground"],
  ["vacation", "holiday"], ["garbage", "rubbish"],
  ["gas station", "petrol station"],
  ["cellphone", "cell phone", "mobile phone"],
  ["sneakers", "trainers"], ["sweater", "jumper"], ["trousers", "pants"],
  ["soccer", "football"], ["candy", "sweets"],
  ["cookie", "biscuit"], ["truck", "lorry"], ["highway", "motorway"],
  ["driver's license", "driving licence", "driving license"],
  ["zip code", "postcode", "postal code"],
  ["movie", "film"], ["couch", "sofa"], ["napkin", "serviette"],
  ["flashlight", "torch"], ["diaper", "nappy"], ["eraser", "rubber"],
  ["french fries", "fries"], ["parking lot", "car park"],
  ["round-trip ticket", "return ticket"], ["one-way ticket", "single ticket"],
  ["downtown", "city centre", "city center"],
  // reine Schreibvarianten (Matcher-Tippfehlertoleranz greift oft, aber sicherheitshalber):
  ["color", "colour"], ["favorite", "favourite"], ["center", "centre"],
  ["meter", "metre"], ["liter", "litre"], ["traveler", "traveller"],
  ["neighbor", "neighbour"], ["theater", "theatre"], ["gray", "grey"],
  ["organize", "organise"], ["realize", "realise"], ["apologize", "apologise"],
];

function hasWord(haystack, needle) {
  const re = new RegExp("(^|\\W)" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\W|$)", "i");
  return re.test(haystack);
}

// Kandidaten: Karte enthält ein Gruppenwort, akzeptiert aber (noch) keine andere
// Variante derselben Gruppe.
function synonymCandidates() {
  const out = [];
  for (const c of LOC) {
    if (!c.en) continue;
    const enLow = " " + norm(c.en) + " ";
    const accepted = " " + acceptedKeys(c).join(" || ") + " ";
    for (const group of VARIANT_GROUPS) {
      const present = group.filter((w) => hasWord(enLow, w));
      if (!present.length) continue;
      // Welche Gruppenformen sind weder im en-Feld noch in einem alt vorhanden?
      const missing = group.filter((w) => !present.includes(w) && !hasWord(accepted, w));
      if (missing.length) out.push({ id: c.id, cat: c.cat, en: c.en, present, missing });
    }
  }
  return out.sort((a, b) => String(a.cat).localeCompare(b.cat) || a.id.localeCompare(b.id));
}

// Harte Fehler: alt-Struktur + Ambiguität.
function altErrors() {
  const errors = [];

  // (a) Struktur
  for (const c of LOC) {
    if (!Array.isArray(c.alt)) continue;
    if (!c.alt.length) { errors.push({ id: c.id, kind: "alt-leer", detail: "alt ist []" }); continue; }
    const seen = new Set();
    for (const a of c.alt) {
      if (typeof a !== "string" || !a.trim()) { errors.push({ id: c.id, kind: "alt-leer", detail: "leerer Eintrag" }); continue; }
      const k = key(a);
      if (!k) { errors.push({ id: c.id, kind: "alt-leer", detail: `nicht normalisierbar: ${JSON.stringify(a)}` }); continue; }
      if (seen.has(k)) errors.push({ id: c.id, kind: "alt-dublette", detail: `doppelt: ${JSON.stringify(a)}` });
      seen.add(k);
    }
    // Der Matcher ersetzt bei nicht-leerem alt die Antwortmenge (matcher.js:
    // acceptedAnswers). Die Haupt-en MUSS daher in alt stehen, sonst wird die
    // angezeigte Antwort selbst abgelehnt.
    if (c.en && !seen.has(key(c.en))) {
      errors.push({ id: c.id, kind: "en-fehlt-in-alt", detail: `Haupt-en nicht in alt (alt ersetzt die Antwortmenge): ${JSON.stringify(c.en)}` });
    }
  }

  // (b) Ambiguität je Lern-Set: ein alt-Key darf nicht die Haupt-en eines ANDEREN
  //     Karten im selben Set sein.
  const sets = [];
  const cats = {};
  for (const c of LOC) (cats[c.cat] = cats[c.cat] || []).push(c.id);
  for (const [cat, ids] of Object.entries(cats)) sets.push([`Kategorie ${cat}`, ids]);
  for (const p of dataLocals.PRESETS || []) sets.push([`Preset ${p.id}`, p.pick]);
  for (const plan of dataLocals.PLANS || []) for (const d of plan.days) sets.push([`${plan.scope} Etappe ${d.day}`, d.cardIds]);

  for (const [where, ids] of sets) {
    const mainKey = {}; // key -> id der Karte mit dieser Haupt-en
    for (const id of ids) { const c = byId[id]; if (c && c.en) mainKey[key(c.en)] = id; }
    for (const id of ids) {
      const c = byId[id];
      if (!c || !Array.isArray(c.alt)) continue;
      for (const a of c.alt) {
        const k = key(a);
        if (mainKey[k] && mainKey[k] !== id) {
          errors.push({ id: c.id, kind: "ambig", detail: `alt „${a}" == Haupt-en von ${mainKey[k]} in ${where}` });
        }
      }
    }
  }
  return errors;
}

function report(errors, candidates, withCandidates) {
  const lines = [];
  lines.push("# Locals-Content-Audit");
  lines.push("");
  lines.push(`Geprüft: ${LOC.length} loc-Karten. Harte Fehler: **${errors.length}**. Synonym-Kandidaten: **${candidates.length}**.`);
  lines.push("");
  if (errors.length) {
    lines.push("## ❌ Harte Fehler (`alt`-Struktur / Ambiguität)");
    lines.push("| id | art | detail |");
    lines.push("| --- | --- | --- |");
    for (const e of errors) lines.push(`| \`${e.id}\` | ${e.kind} | ${e.detail} |`);
    lines.push("");
  } else {
    lines.push("_Keine harten Fehler._");
    lines.push("");
  }
  lines.push("## 💡 Synonym-Kandidaten (Karten ohne `alt` für eine geläufige Variante)");
  lines.push("Beratend – ein korrektes Synonym würde hier aktuell als falsch gewertet.");
  lines.push("");
  if (withCandidates) {
    lines.push("| id | cat | en | hat | fehlt (als alt sinnvoll) |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const c of candidates) lines.push(`| \`${c.id}\` | ${c.cat} | ${c.en} | ${c.present.join(", ")} | ${c.missing.join(", ")} |`);
  } else {
    lines.push(`(${candidates.length} Kandidaten – mit \`--candidates\` anzeigen.)`);
  }
  lines.push("");
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const errors = altErrors();
  const candidates = synonymCandidates();
  if (args.includes("--json")) {
    process.stdout.write(JSON.stringify({ errors, candidates }, null, 2) + "\n");
  } else {
    process.stdout.write(report(errors, candidates, args.includes("--candidates")) + "\n");
  }
  if (args.includes("--strict") && errors.length) process.exit(1);
}

if (require.main === module) main();

module.exports = { synonymCandidates, altErrors, VARIANT_GROUPS };
