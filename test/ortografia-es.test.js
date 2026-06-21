/*
 * ortografia-es.test.js – Regelbasierter Spanisch-Linter über ALLE spanischen
 * Felder der Lernkarten (data.CARDS: .es und .context.sentenceEs).
 *
 * Zweck: typische Fehlerklassen früh fangen, OHNE Muttersprachler-Review:
 *
 *   (a) Spanische Satzzeichen-Symmetrie: Fragen (enden auf „?") müssen ein
 *       öffnendes „¿" tragen, Ausrufe (enden auf „!") ein „¡". Im Spanischen
 *       darf das öffnende Zeichen MITTEN im Satz stehen ("Buenos días, ¿cómo
 *       está?"), darum prüfen wir je SATZ, ob VOR dem schließenden Zeichen
 *       irgendwo das passende öffnende auftaucht.
 *   (b) Keine doppelten Leerzeichen (Copy-&-Paste-Artefakte).
 *   (c) Spanien-spezifische Begriffe (das Projekt zielt auf Latam-Reise-
 *       Spanisch): vosotros-Konjugationen, „ordenador", „zumo", „patata",
 *       „móvil" (als Telefon), „coger" (ohne recoger-Kontext).
 *
 * --------------------------------------------------------------------------
 * BETRIEBSMODUS: REPORTING (Test bleibt GRÜN).
 *
 * (a) und (b) sind harte, objektive Regeln und werden strikt geprüft (Restmenge
 * muss 0 sein – sie ist es am aktuellen Korpus).
 *
 * (c) ist eine HEURISTIK mit bekannten False-Positives (z. B. „dieciséis"
 * endet auf „-éis" wie eine vosotros-Form; „datos móviles" ist Mobilfunk, kein
 * Telefon). Solche Treffer stehen in WHITELIST und werden abgezogen. Assertiert
 * wird nur auf der NICHT gewhitelisteten Restmenge (= 0). Neue, ungeklärte
 * Spanien-Begriffe lassen den Test also rot werden und erzwingen eine
 * Entscheidung (Karte korrigieren ODER bewusst whitelisten).
 *
 * STRIKT SCHALTEN (später): Die Whitelist leeren bzw. STRICT=true setzen, sobald
 * der Korpus muttersprachlich gegengelesen ist – dann sind (c)-Treffer Fehler
 * statt Warnungen. Bis dahin dient der ausgegebene Report als Arbeitsliste.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
const SRC = path.join(__dirname, "..");
require(path.join(SRC, "contextdata.js"));
require(path.join(SRC, "data.js"));
require(path.join(SRC, "numbers.js"));
require(path.join(SRC, "context.js"));
const { data } = globalThis.window.SC;

// Alle spanischen Strings einer Karte mit Herkunfts-Etikett (für lesbare Reports).
function esFields(c) {
  const out = [];
  if (typeof c.es === "string" && c.es.trim()) out.push(["es", c.es]);
  const x = c.context;
  if (x && typeof x.sentenceEs === "string" && x.sentenceEs.trim()) out.push(["context.sentenceEs", x.sentenceEs]);
  return out;
}
const CARDS = (data.CARDS || []).filter((c) => esFields(c).length);

const count = (s, re) => (String(s).match(re) || []).length;

// ---- (c) Spanien-Begriff-Heuristik + Whitelist bekannter False-Positives ----
const STRICT = false; // später true: (c)-Treffer werden zu harten Fehlern.
const SPAIN_TERMS = [
  // vosotros: die Form selbst sowie die typischen Präsens-Endungen -áis/-éis.
  { id: "vosotros", re: /\bvosotros\b/i, why: "vosotros (in Latam: ustedes)" },
  { id: "vos-conj", re: /\b\w*(?:áis|éis)\b/, why: "vosotros-Konjugation (-áis/-éis)" },
  { id: "ordenador", re: /\bordenador(?:es)?\b/i, why: "ordenador (in Latam: computadora)" },
  { id: "zumo", re: /\bzumo\b/i, why: "zumo (in Latam: jugo)" },
  { id: "patata", re: /\bpatatas?\b/i, why: "patata (in Latam: papa)" },
  { id: "movil", re: /\bm[oó]vil(?:es)?\b/i, why: "móvil als Telefon (in Latam: celular)" },
  // coger: in Spanien „nehmen", in vielen Latam-Ländern vulgär. recoger/escoger ausgenommen.
  { id: "coger", re: /(?<![a-záéíóúñ])cog(?:er|e|es|emos|en|í|iste|ió|imos|ieron|ía)\b/i, why: "coger (in Teilen Latams vulgär)" },
];

// Bekannte False-Positives der Heuristik (Karten-ID|Term-ID). Mit Begründung,
// damit klar ist, WARUM sie kein echter Spanien-Begriff sind.
const WHITELIST = new Set([
  "z16|vos-conj", // „dieciséis" endet auf -éis, ist aber das Zahlwort 16
  "z26|vos-conj", // „veintiséis" – Zahlwort 26
  "a08|movil",    // „datos móviles" = Mobilfunkdaten, nicht das Telefongerät
]);

// ============================ Regel (a) ============================
// Symmetrie über Zeichen-ANZAHL statt über fragiles Satz-Splitting: Im Spanischen
// öffnet „¿"/„¡" mitten im Satz ("Buenos días, ¿cómo está?"), und Platzhalter wie
// „..." dürfen einen Satz nicht künstlich zerteilen. Robust: pro Feld muss die
// Zahl der „?" zur Zahl der „¿" passen (analog „!"/„¡").
test("(a) Spanische Satzzeichen-Symmetrie: ¿…? und ¡…! sind vollständig", () => {
  const bad = [];
  for (const c of CARDS) {
    for (const [field, val] of esFields(c)) {
      const q = count(val, /\?/g), oq = count(val, /¿/g);
      const e = count(val, /!/g), oe = count(val, /¡/g);
      if (q !== oq) bad.push(`${c.id} (${field}): ${q}×„?" aber ${oq}×„¿" → ${val}`);
      if (e !== oe) bad.push(`${c.id} (${field}): ${e}×„!" aber ${oe}×„¡" → ${val}`);
    }
  }
  if (bad.length) console.log("  Satzzeichen-Treffer:\n   " + bad.join("\n   "));
  assert.equal(bad.length, 0, `${bad.length} Karte(n) mit unsymmetrischen ¿?/¡!`);
});

// ============================ Regel (b) ============================
test("(b) Keine doppelten Leerzeichen in spanischen Feldern", () => {
  const bad = [];
  for (const c of CARDS) {
    for (const [field, val] of esFields(c)) {
      if (/ {2,}/.test(val)) bad.push(`${c.id} (${field}): ${JSON.stringify(val)}`);
    }
  }
  if (bad.length) console.log("  Doppelte-Leerzeichen-Treffer:\n   " + bad.join("\n   "));
  assert.equal(bad.length, 0, `${bad.length} Feld(er) mit doppelten Leerzeichen`);
});

// ============================ Regel (c) ============================
test("(c) Spanien-Begriffe: Reporting; nicht-gewhitelistete Restmenge = 0", () => {
  const all = [];
  for (const c of CARDS) {
    for (const [field, val] of esFields(c)) {
      for (const term of SPAIN_TERMS) {
        if (term.re.test(val)) all.push({ key: `${c.id}|${term.id}`, line: `${c.id} (${field}) [${term.why}] → ${val}` });
      }
    }
  }
  const whitelisted = all.filter((h) => WHITELIST.has(h.key));
  const open = all.filter((h) => !WHITELIST.has(h.key));

  // REPORT (immer sichtbar – dient als Arbeitsliste fürs Muttersprachler-Review):
  console.log(`  Spanien-Begriff-Heuristik: ${all.length} Treffer, davon ${whitelisted.length} gewhitelistet (False-Positive), ${open.length} offen.`);
  if (whitelisted.length) console.log("  (whitelisted):\n   " + whitelisted.map((h) => h.line).join("\n   "));
  if (open.length) console.log("  (OFFEN – bitte prüfen):\n   " + open.map((h) => h.line).join("\n   "));

  // GRÜN solange die offene Restmenge leer ist. STRICT=true macht künftig jeden
  // (auch gewhitelisteten) Treffer zum Fehler.
  const fails = STRICT ? all : open;
  assert.equal(fails.length, 0, `${fails.length} offene Spanien-Begriff-Treffer (STRICT=${STRICT})`);
});
