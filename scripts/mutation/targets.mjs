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

export const MODULES = {
  srs:     { file: "srs.js",     tests: ["sc.test.js"] },
  matcher: { file: "matcher.js", tests: ["matcher-de.test.js", "typo-corpus.test.js", "sc.test.js"] },
  store:   { file: "store.js",   tests: ["sc.test.js"] },
  stats:   { file: "stats.js",   tests: ["sc.test.js"] },
  net:     { file: "net.js",     tests: ["net.test.js"] },
  sync:    { file: "sync.js",    tests: ["sync.test.js"] },
  numbers: { file: "numbers.js", tests: ["numbers.test.js"] },
  context: { file: "context.js", tests: ["frases.test.js", "sc.test.js"] },
  badges:  { file: "badges.js",  tests: ["celebrate.test.js", "sc.test.js"] },
};

// Engine-Konfiguration.
export const BUDGET = 30;     // max. Mutanten je Modul (deterministisch gesampelt)
export const SEED = 1;        // Sampling-Seed (reproduzierbar)
export const THRESHOLD = 70;  // Mutation-Score-Schwelle in % (Ratsche; nach Baseline kalibriert)

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
