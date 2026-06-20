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
  store:   { file: "store.js",   tests: ["sc.test.js"], pattern: "^store" },
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
 * Messung vom 2026-06-20 (BUDGET=30, SEED=1); sync, badges sowie numbers, matcher,
 * store & srs danach durch gezielte Tests auf 100 % gehoben (verbleibende Survivor
 * als äquivalent in IGNORE dokumentiert). Bei Änderung von BUDGET/SEED neu kalibrieren.
 */
export const TOLERANCE = 5;   // erlaubter Score-Rückgang in %-Punkten (absorbiert Mutantenmengen-Drift bei Quelländerungen)
export const BASELINE = {
  srs: 100, store: 100, stats: 70, badges: 100, matcher: 100, net: 81, sync: 100, numbers: 100,
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
  { file: "numbers.js", line: 228, op: "relational", grund:
    "randomPrice: `Math.random() < 0.5` vs `<= 0.5` (50/50-Aufteilung fein/grob). Differenz nur " +
    "beim Maß-Null-Ereignis random()===0.5; die beiden Zweige erzeugen statistisch identische " +
    "Verteilungen und für 0.5 denselben Betrag (Spanne skaliert proportional zu step/fine) → äquivalent." },
  // srs.js
  { file: "srs.js", line: 51, op: "number", grund:
    "review: `Math.max(0, num(s.interval, 0))`. interval fließt nur über `base = interval || 1` ein; " +
    "0 und 1 kollabieren dort beide zu base=1, und im Early-Review-Pfad klemmt min(base,…)/max(1,…) " +
    "ohnehin auf 1. Die Mutation 0→1 ändert kein beobachtbares Ergebnis → äquivalent." },
  // matcher.js
  { file: "matcher.js", line: 130, op: "number", grund:
    "levenshtein: `new Array(bl + 1)` ist nur ein Kapazitäts-Hinweis. Die Schleife befüllt prev[0..bl] " +
    "vollständig (JS erweitert das Array beim Setzen von Index bl). `new Array(bl)` liefert identische " +
    "Inhalte → äquivalent." },
  { file: "matcher.js", line: 133, op: "number", grund:
    "levenshtein: dieselbe Kapazitäts-Mutation für `cur = new Array(bl + 1)`. cur[0..bl] wird je Zeile " +
    "komplett gesetzt → äquivalent." },
  { file: "matcher.js", line: 211, op: "relational", grund:
    "classifyNorm: `d > 0` vs `d >= 0` im Tippfehler-Pfad. Ein exakter Treffer (d===0) wird bereits in " +
    "Schritt 1 mit return \"exact\" abgefangen; Schritt 2 sieht daher ausschließlich d>=1 → die 0-Grenze " +
    "ist unerreichbar → äquivalent." },
  { file: "matcher.js", line: 227, op: "relational", grund:
    "check: `i < tries.length` vs `i <= tries.length`. Die Extra-Iteration greift auf tries[length]=undefined " +
    "zu; classifyNorm(undefined,…) gibt sofort \"\" zurück und lässt cls unverändert → kein Effekt → äquivalent." },
];

export const isIgnored = (file, line, op) =>
  IGNORE.some((g) => g.file === file && g.line === line && g.op === op);
