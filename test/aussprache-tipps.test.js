/*
 * aussprache-tipps.test.js – Validiert die Aussprache-Tipps (`tip`) der Locals-
 * Karten (Spanisch lernt Englisch). Konvention (data.locals.js-Header):
 * Laien-Lautschrift FÜR SPANISCHSPRECHER – /θ/→„z", /ð/→„d", betonte Silbe in
 * GROSSBUCHSTABEN, Silben mit „-" getrennt. KEIN IPA, keine Ziffern.
 *
 *   (a) Abdeckung: JEDE loc-Karte hat einen nicht-leeren `tip`. HART.
 *   (b) Keine doppelten Leerzeichen / kein Rand-Whitespace. HART.
 *   (c) Nur erlaubter Zeichensatz (Buchstaben inkl. Akzente, Silben-/Satz-Trenner).
 *       IPA-Symbole, geschweifte Klammern, Ziffern etc. werden gemeldet.
 *       HEURISTIK mit Whitelist (bewusste Ausnahmen: Minimalpaar-Drills der
 *       Kategorie „pronunciacion-en" zeigen /ɪ/ vs /iː/ ABSICHTLICH).
 *
 * BETRIEBSMODUS: (a),(b) strikt. (c) Reporting + Whitelist; nicht-gewhitelistete
 * Restmenge muss 0 sein. STRICT=true (später) macht jeden (c)-Treffer zum Fehler.
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
require(path.join(SRC, "data.js"));
require(path.join(SRC, "data.locals.js"));
const { data } = window.SC;
const LOC = (data.CARDS || []).filter((c) => /^loc-/.test(c.id));

const STRICT = false; // später true: (c)-Treffer werden zu harten Fehlern.

// Erlaubte Zeichen im tip: Laien-Lautschrift + Silben-/Satz-Trenner. Bewusst OHNE
// Ziffern und OHNE IPA-Sonderzeichen.
const ALLOWED_CHAR = /[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ,.\-;:/'()…—]/;

// Bewusste (c)-Ausnahmen je Karten-Id:
//  - pronunciacion-en: Minimalpaar-Drills zeigen das IPA-Symbol absichtlich.
//  - loc-del11: „Are you {name}?" – der Platzhalter steht konsistent in en & tip.
const WHITELIST = new Set([
  "loc-pron01", "loc-pron02", "loc-pron03", "loc-pron04", "loc-pron05",
  "loc-pron06", "loc-pron07", "loc-pron08", "loc-pron09", "loc-pron10",
  "loc-pron11", "loc-pron13",
  "loc-del11",
]);

// ============================ Regel (a) ============================
test("(a) Abdeckung: jede loc-Karte hat einen nicht-leeren tip", () => {
  const missing = LOC.filter((c) => !(typeof c.tip === "string" && c.tip.trim()));
  if (missing.length) console.log("  Ohne tip:\n   " + missing.map((c) => `${c.id} (${c.cat}) en=${JSON.stringify(c.en)}`).join("\n   "));
  assert.equal(missing.length, 0, `${missing.length} loc-Karte(n) ohne Aussprache-Tipp`);
});

// ============================ Regel (b) ============================
test("(b) tip: keine doppelten Leerzeichen / kein Rand-Whitespace", () => {
  const bad = [];
  for (const c of LOC) {
    if (typeof c.tip !== "string") continue;
    if (/ {2,}/.test(c.tip)) bad.push(`${c.id}: Doppel-Leerzeichen → ${JSON.stringify(c.tip)}`);
    if (c.tip !== c.tip.trim()) bad.push(`${c.id}: Rand-Whitespace → ${JSON.stringify(c.tip)}`);
  }
  if (bad.length) console.log("  Whitespace-Treffer:\n   " + bad.join("\n   "));
  assert.equal(bad.length, 0, `${bad.length} tip(s) mit Whitespace-Problem`);
});

// ============================ Regel (c) ============================
test("(c) tip: nur erlaubter Zeichensatz (kein IPA/Ziffern), Restmenge = 0", () => {
  const all = [];
  for (const c of LOC) {
    if (typeof c.tip !== "string" || !c.tip) continue;
    const bad = [...c.tip].filter((ch) => !ALLOWED_CHAR.test(ch));
    if (bad.length) all.push({ key: c.id, line: `${c.id} (${c.cat}) [${[...new Set(bad)].join(" ")}] → ${c.tip}` });
  }
  const open = all.filter((h) => !WHITELIST.has(h.key));
  console.log(`  Zeichensatz-Treffer: ${all.length} gesamt, ${all.length - open.length} gewhitelistet, ${open.length} offen.`);
  if (open.length) console.log("  (OFFEN – bitte prüfen):\n   " + open.map((h) => h.line).join("\n   "));
  const fails = STRICT ? all : open;
  assert.equal(fails.length, 0, `${fails.length} offene Zeichensatz-Treffer im tip (STRICT=${STRICT})`);
});
