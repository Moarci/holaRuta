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
  badges:  { file: "badges.js",  tests: ["sc.test.js"], pattern: "^badges" },
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
 * (z. B. sync 30 %) wird NICHT rot, solange er den Score nicht VERSCHLECHTERT —
 * und Verbesserungen heben den Baseline (Ratsche). Werte = Messung vom 2026-06-20
 * (BUDGET=30, SEED=1); bei Änderung von BUDGET/SEED neu kalibrieren.
 */
export const TOLERANCE = 5;   // erlaubter Score-Rückgang in %-Punkten (absorbiert Mutantenmengen-Drift bei Quelländerungen)
export const BASELINE = {
  srs: 66, store: 60, stats: 70, badges: 43, matcher: 56, net: 81, sync: 30, numbers: 53,
};
export const floorFor = (m) => Math.max(0, (BASELINE[m] ?? 0) - TOLERANCE);

/*
 * Äquivalente Mutanten: Mutationen, die das Verhalten nachweislich NICHT ändern
 * (legitim überlebend). Zählen weder als überlebt noch im Score-Nenner.
 * Schema: { file, line, op, grund }. grund ist Pflicht.
 */
export const IGNORE = [
  // { file: "srs.js", line: 0, op: "number", grund: "…" },
];

export const isIgnored = (file, line, op) =>
  IGNORE.some((g) => g.file === file && g.line === line && g.op === op);
