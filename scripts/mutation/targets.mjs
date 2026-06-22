/*
 * scripts/mutation/targets.mjs — Single Source of Truth fürs Engine-Targeting.
 *
 * MODULES: reine Logikmodule → Testdateien, die ihr Verhalten WIRKLICH abdecken.
 *   (Nur abdeckende Tests mappen — sonst überleben Mutanten mangels Prüfung und
 *    der Score wäre fälschlich niedrig.)
 *
 * BEWUSST NICHT in der Engine:
 *   - data.js / contextdata.js: fast reine Datenliterale → Massen trivialer/
 *     äquivalenter Mutanten. Stattdessen Katalog (catalog.mjs).
 *   - app.js / ui.js: DOM-gekoppelt → punktuell über Katalog + controller-smoke.
 */
"use strict";

// pattern (optional): --test-name-pattern, um in der großen sc.test.js NUR die
// modul-relevanten Tests zu fahren (Geschwindigkeit + sauberer Pro-Modul-Score).
export const MODULES = {
  srs:     { file: "srs.js",     tests: ["sc.test.js"], pattern: "^srs" },
  store:   { file: "store.js",   tests: ["sc.test.js", "favorites.test.js", "store-backup.test.js"] },
  stats:   { file: "stats.js",   tests: ["sc.test.js"], pattern: "^stats" },
  badges:  { file: "badges.js",  tests: ["badges.test.js"] },
  matcher: { file: "matcher.js", tests: ["matcher-de.test.js", "typo-corpus.test.js"] },
  net:     { file: "net.js",     tests: ["net.test.js"] },
  sync:    { file: "sync.js",    tests: ["sync.test.js"] },
  numbers: { file: "numbers.js", tests: ["numbers.test.js"] },
  // context.js: Abdeckung über sc.test.js/frases.test.js unklar → vorerst nur
  // Katalog-fähig, nicht in der Engine (vermeidet rauschenden Pro-Modul-Score).
};

// Engine-Konfiguration. Sampling ist deterministisch (SEED+BUDGET fix → exakt
// reproduzierbare Scores bei unverändertem Quellcode).
export const BUDGET = 30;     // max. Mutanten je Modul (deterministisch gesampelt)
export const SEED = 1;        // Sampling-Seed (reproduzierbar)

/*
 * Pro-Modul-No-Regression-Ratchet (statt globalem Schwellwert): Jedes Modul darf
 * seinen gemessenen Baseline-Score nicht um mehr als TOLERANCE unterschreiten.
 * Vorteil ggü. globalem Schwellwert: ein PR an einem schwach getesteten Modul
 * (z. B. schwach getestetes Modul) wird NICHT rot, solange er den Score nicht
 * VERSCHLECHTERT — und Verbesserungen heben den Baseline (Ratsche). Werte =
 * Messung vom 2026-06-20 (BUDGET=30, SEED=1); danach ALLE Engine-Module durch
 * gezielte Tests auf 100 % gehoben (verbleibende Survivor als äquivalent in IGNORE
 * dokumentiert). Bei Änderung von BUDGET/SEED neu kalibrieren.
 */
export const TOLERANCE = 5;   // erlaubter Score-Rückgang in %-Punkten (absorbiert Mutantenmengen-Drift bei Quelländerungen)
export const BASELINE = {
  srs: 100, store: 100, stats: 100, badges: 100, matcher: 100, net: 100, sync: 100, numbers: 100,
};
export const floorFor = (m) => Math.max(0, (BASELINE[m] ?? 0) - TOLERANCE);

/*
 * Äquivalente Mutanten: Mutationen, die das Verhalten nachweislich NICHT ändern
 * (legitim überlebend). Zählen weder als überlebt noch im Score-Nenner.
 * Schema: { file, line, op, grund }. grund ist Pflicht.
 */
export const IGNORE = [
  // numbers.js
  { file: "numbers.js", line: 42, op: "relational", grund:
    "below1000: `if (n < 100)` vs `<= 100`. n===100 ist eine Zeile zuvor abgefangen " +
    "(return \"cien\") und n===0 ebenfalls; die Grenze 100 erreicht diese Bedingung also nie. " +
    "Beide Operatoren liefern für jede erreichbare Eingabe dasselbe → äquivalent." },
  { file: "numbers.js", line: 201, op: "number", grund:
    "tierFor: `(Number(level) || 1) - 1` (der ||-Default 1→0). Greift nur bei falschem/0-level: ||1 → 1-1=0, " +
    "||0 → 0-1=-1, danach Math.max(0,…) → ebenfalls 0. Für gültige Stufen ist der Default irrelevant. Die " +
    "(level-1)-Indizierung selbst ist per Test verriegelt → diese Default-Mutation ist äquivalent." },
  { file: "numbers.js", line: 241, op: "number", grund:
    "buildRound: `const n = Math.max(1, Number(count) || 10)` (1→0). count||10 ist für jede erreichbare " +
    "Eingabe ≥1 (count fehlt/0 → 10, sonst die positive Aufgabenzahl); max(1,x)==max(0,x) für x≥1. Nur ein " +
    "Bruch 0<count<1 würde abweichen – den liefert kein Aufrufer (immer ganzzahlig, real =6) → äquivalent." },
  { file: "numbers.js", line: 246, op: "number", grund:
    "buildRound: `guard += 1` (1→0) ist die Endlosschleifen-Sicherung der Distinkt-Sammelschleife. Der einzige " +
    "Aufrufer nutzt count=6 ≪ kleinste Spannen-Distinktzahl (30), daher endet die Schleife stets über " +
    "`out.length < n` – guard ist nie die reale Abbruchbedingung. Für alle erreichbaren Eingaben identisch → äquivalent." },
  // stats.js
  { file: "stats.js", line: 52, op: "number", grund:
    "statusOf: `(r.interval || 0) >= MASTERED_DAYS` mit MASTERED_DAYS=5. Der Fallback greift nur, wenn " +
    "interval fehlt/0 ist; 0 und 1 liegen beide unter 5 → der Status bleibt in jedem Fall \"learning\". " +
    "Die Mutation 0→1 ändert kein Ergebnis → äquivalent." },
  // srs.js
  { file: "srs.js", line: 51, op: "number", grund:
    "review: `Math.max(0, num(s.interval, 0))`. interval fließt nur über `base = interval || 1` ein; " +
    "0 und 1 kollabieren dort beide zu base=1, und im Early-Review-Pfad klemmt min(base,…)/max(1,…) " +
    "ohnehin auf 1. Die Mutation 0→1 ändert kein beobachtbares Ergebnis → äquivalent." },
  // matcher.js (Zeilen = engine-lineAt; nach der Runde-3-Erweiterung neu ausgerichtet)
  { file: "matcher.js", line: 130, op: "number", grund:
    "levenshtein: `prev = new Array(bl + 1)` ist nur ein Kapazitäts-Hinweis. Die Schleife befüllt prev[0..bl] " +
    "vollständig (JS erweitert das Array beim Setzen von Index bl). `new Array(bl)` liefert identische Inhalte → äquivalent." },
  { file: "matcher.js", line: 133, op: "number", grund:
    "levenshtein: dieselbe Kapazitäts-Mutation für `cur = new Array(bl + 1)`. cur[0..bl] wird je Zeile komplett gesetzt → äquivalent." },
  { file: "matcher.js", line: 137, op: "number", grund:
    "levenshtein: `caPrev = i > 1 ? a.charCodeAt(i-2) : -1` (1→0). caPrev wird NUR im Transpositions-Zweig gelesen, " +
    "der selbst mit `i > 1 &&` bewacht ist → bei i===1 unerreichbar; für i>1 liefern `i>1` und `i>0` identisch " +
    "a.charCodeAt(i-2). In jedem erreichbaren Fall gleich → äquivalent." },
  { file: "matcher.js", line: 227, op: "relational", grund:
    "check: `i < tries.length` vs `i <= tries.length`. Die Extra-Iteration greift auf tries[length]=undefined zu; " +
    "classifyNorm(undefined,…) gibt sofort \"\" zurück und lässt cls unverändert → kein Effekt → äquivalent." },
  { file: "matcher.js", line: 229, op: "relational", grund:
    "classifyNorm: `d > 0` vs `d >= 0` im Tippfehler-Pfad. Ein exakter Treffer (d===0) wird bereits in Schritt 1 " +
    "mit return \"exact\" abgefangen; Schritt 2 sieht daher ausschließlich d>=1 → die 0-Grenze ist unerreichbar → äquivalent." },
  // sync.js (nach dem main-Merge resampelt – nachweislich äquivalent)
  { file: "sync.js", line: 84, op: "relational", grund:
    "mergePlacementHistory: `for (… i < lb.length …)` vs `<=`. Die Extra-Iteration übergibt lb[lb.length]=undefined " +
    "an add(), das mit `if (!isObj(e)) return;` sofort aussteigt → kein Eintrag, identisches Ergebnis → äquivalent." },
  { file: "sync.js", line: 97, op: "number", grund:
    "mergeGamestats: `for (k in b) keys[k] = 1` vs `= 0`. keys dient NUR als Schlüsselmenge (`for (k in keys)`); " +
    "der Wert (0/1) wird nie gelesen, der Schlüssel bleibt enumerierbar → identische Iteration → äquivalent." },
  { file: "sync.js", line: 128, op: "logical", grund:
    "mergeGamestats: `else if (isObj(va) && isObj(vb))` vs `||`. Die per || zusätzlich erreichten Fälle (genau einer " +
    "ist ein Objekt) liefern über deepUnion(va,vb) denselben Wert wie der else-Zweig (a!==undefined ? a : b = va) → äquivalent." },
  // store.js
  { file: "store.js", line: 493, op: "relational", grund:
    "sanitizeAssessmentHistory: `for (… i < v.length …)` vs `<=`. Die Extra-Iteration ruft sanitizeAssessmentEntry(v[v.length]=undefined) " +
    "auf, das mit `if (!isPlainObject(e)) return null;` null liefert; `if (e) out.push(e)` überspringt es → identisches Ergebnis → äquivalent." },
];

export const isIgnored = (file, line, op) =>
  IGNORE.some((g) => g.file === file && g.line === line && g.op === op);
