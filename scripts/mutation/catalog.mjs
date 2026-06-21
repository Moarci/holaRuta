/*
 * scripts/mutation/catalog.mjs — Kuratierte Hochwert-Mutationen ("Invarianten-Wächter").
 *
 * Jeder Eintrag beschreibt EINEN echten, sinnvollen Bug. Das Gate verlangt, dass
 * JEDE dieser Mutationen von den genannten Tests gefangen wird (100 % hart) —
 * andernfalls ist der Test für diese Invariante bloße Zierde.
 *
 * Schema: { label, invariante, file, find, replace, tests:[...] }
 *   find MUSS exakt 1× in file vorkommen (Validierung in run.mjs) — kein No-Op.
 *
 * Pflege: bricht ein `find` nach einem Refactoring (Validierungsfehler), ist der
 * Eintrag bewusst nachzuziehen — der Katalog bleibt so ehrlich am Code.
 */
"use strict";

export const CATALOG = [
  {
    label: "store: ease-Clamp Untergrenze 1.3",
    invariante: "Korruptes/zu kleines ease wird beim Laden auf 1.3 geklemmt (SRS-Schutz).",
    file: "store.js",
    find: "Math.max(1.3, asNum(rec.ease, 2.5))",
    replace: "Math.max(99, asNum(rec.ease, 2.5))",
    tests: ["sc.test.js"],
  },
  {
    label: "store: ease-Clamp Obergrenze 3.0",
    invariante: "Zu großes ease wird beim Laden auf 3.0 geklemmt.",
    file: "store.js",
    find: "Math.min(3.0, Math.max(1.3, asNum(rec.ease, 2.5)))",
    replace: "Math.min(0.0, Math.max(1.3, asNum(rec.ease, 2.5)))",
    tests: ["sc.test.js"],
  },
  {
    label: "controller: set-mode wirkt",
    invariante: "set-mode wechselt den Lernmodus wirklich (type→Eingabe, flip→Aufdecken).",
    file: "app.js",
    find: '"set-mode": (el) => { setMode(el.dataset.mode); },',
    replace: '"set-mode": (el) => {},',
    tests: ["controller-smoke.test.js"],
  },
  {
    label: "srs: 'again' senkt ease",
    invariante: "Ein 'again' senkt den ease-Faktor (Karte wird schwieriger eingestuft).",
    file: "srs.js",
    find: "ease: clampEase(ease - 0.2),",
    replace: "ease: clampEase(ease - 0.0),",
    tests: ["sc.test.js"],
  },
  {
    label: "matcher: case-insensitiv",
    invariante: "Antwort-Abgleich ist case-insensitiv (normalize lowercased).",
    file: "matcher.js",
    find: ".toLowerCase()",
    replace: ".valueOf()",
    tests: ["matcher-de.test.js", "sc.test.js", "typo-corpus.test.js"],
  },
  {
    label: "net: Bearer-Präfix",
    invariante: "Auth-Header trägt das 'Bearer '-Präfix vor dem Token.",
    file: "net.js",
    find: 'headers.Authorization = "Bearer " + tok;',
    replace: "headers.Authorization = tok;",
    tests: ["net.test.js"],
  },
  {
    label: "sync: Zähler-Merge nimmt max",
    invariante: "Geräteübergreifende Zähler werden per max zusammengeführt (nie verkleinert).",
    file: "sync.js",
    find: "out[k] = Math.max(va, vb); // Zähler",
    replace: "out[k] = va; // Zähler",
    tests: ["sync.test.js"],
  },
];
