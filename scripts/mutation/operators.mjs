/*
 * scripts/mutation/operators.mjs — Automatische Mutationsoperatoren (zero-dep, kein AST).
 *
 * generateMutants(source) → [{ index, length, replacement, op, from, to, line }]
 *
 * Robustheit ohne Parser:
 *   - maskCode() blendet Strings, Template-Literale, Kommentare und Regex-Literale aus
 *     (durch Leerzeichen, Zeilen erhalten), sodass Operatoren NUR in echtem Code matchen.
 *   - Konservativ: +/-/* nur als " x " (von Leerzeichen umgeben → klar binär), niemals
 *     ++/--/+=/unär. "/" wird bewusst NICHT mutiert (Regex/Division-Mehrdeutigkeit,
 *     Div-by-0). Im Zweifel lieber eine Mutation verpassen als eine falsche erzeugen.
 */
"use strict";

// Quelle in eine gleichlange "Code-Maske" überführen: Nicht-Code → Leerzeichen.
export function maskCode(src) {
  const out = src.split("");
  const n = src.length;
  const blank = (a, b) => { for (let k = a; k < b && k < n; k++) if (out[k] !== "\n") out[k] = " "; };
  let prev = ""; // letztes signifikantes Code-Zeichen (für Regex-Erkennung)
  let i = 0;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") { let j = src.indexOf("\n", i); if (j < 0) j = n; blank(i, j); i = j; continue; }
    if (c === "/" && d === "*") { let j = src.indexOf("*/", i + 2); j = j < 0 ? n : j + 2; blank(i, j); i = j; continue; }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n) { if (src[j] === "\\") { j += 2; continue; } if (src[j] === c) break; j++; }
      blank(i, j + 1); i = j + 1; prev = c; continue;
    }
    if (c === "/") {
      // Regex vs. Division: Regex, wenn das letzte signifikante Zeichen einen
      // Ausdruck-Anfang erlaubt (kein Wert/Bezeichner davor).
      const regexCtx = prev === "" || "(,=:[!&|?{};+-*%<>~^".includes(prev);
      if (regexCtx) {
        let j = i + 1, inClass = false;
        while (j < n) {
          const ch = src[j];
          if (ch === "\\") { j += 2; continue; }
          if (ch === "[") inClass = true;
          else if (ch === "]") inClass = false;
          else if (ch === "/" && !inClass) break;
          else if (ch === "\n") break;
          j++;
        }
        while (j + 1 < n && /[a-z]/i.test(src[j + 1])) j++; // Flags
        blank(i, j + 1); i = j + 1; prev = "/"; continue;
      }
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out.join("");
}

const lineAt = (src, idx) => src.slice(0, idx).split("\n").length;

// Ein Treffer im maskierten Text entspricht 1:1 derselben Position im Original.
function* scan(mask, re) {
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(mask))) { yield { index: m.index, text: m[0] }; if (m[0].length === 0) re.lastIndex++; }
}

// Operator-Definitionen: [Name, Regex (auf Maske), Funktion text→ersatz|null]
const REL = { "===": "!==", "!==": "===", "==": "!=", "!=": "==", "<=": ">", ">=": "<", "<": "<=", ">": ">=" };

export function generateMutants(src) {
  const mask = maskCode(src);
  const muts = [];
  const seen = new Set(); // pro Position nur eine Mutation je Operatorklasse
  const add = (index, length, replacement, op, from) => {
    const key = op + "@" + index;
    if (seen.has(key)) return;
    seen.add(key);
    muts.push({ index, length, replacement, op, from, to: replacement, line: lineAt(src, index) });
  };

  // Vergleich/Gleichheit (längste zuerst, Überlappung vermeiden)
  const relTaken = new Set();
  for (const tok of ["===", "!==", "==", "!=", "<=", ">=", "<", ">"]) {
    const re = new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    for (const { index } of scan(mask, re)) {
      let overlap = false;
      for (let k = index; k < index + tok.length; k++) if (relTaken.has(k)) overlap = true;
      if (overlap) continue;
      if (tok === ">" && mask[index - 1] === "=") continue; // Arrow => nicht als Vergleich mutieren
      for (let k = index; k < index + tok.length; k++) relTaken.add(k);
      add(index, tok.length, REL[tok], "relational", tok);
    }
  }

  // Logisch &&/||
  for (const [tok, rep] of [["&&", "||"], ["||", "&&"]]) {
    const re = new RegExp(tok.replace(/[\\|&]/g, "\\$&"), "g");
    for (const { index } of scan(mask, re)) add(index, 2, rep, "logical", tok);
  }

  // Arithmetik: nur " + " / " - " / " * " (klar binär), Position des Operatorzeichens.
  for (const [tok, rep] of [["+", "-"], ["-", "+"], ["*", "+"]]) {
    const re = new RegExp(" \\" + tok + " ", "g");
    for (const { index } of scan(mask, re)) add(index + 1, 1, rep, "arithmetic", tok);
  }

  // Boolean-Literale
  for (const [tok, rep] of [["true", "false"], ["false", "true"]]) {
    const re = new RegExp("\\b" + tok + "\\b", "g");
    for (const { index } of scan(mask, re)) add(index, tok.length, rep, "boolean", tok);
  }

  // Zahl-Literale → 0 / 1 / value+1 (begrenzt, keine Versionsnummern in Strings: Maske schützt)
  for (const { index, text } of scan(mask, /\b\d+(?:\.\d+)?\b/g)) {
    const v = Number(text);
    const cands = v === 0 ? ["1"] : v === 1 ? ["0", "2"] : ["0", String(v + 1)];
    add(index, text.length, cands[0], "number", text);
  }

  return muts.sort((a, b) => a.index - b.index);
}

// Deterministisches Sampling (seeded), damit das Gate reproduzierbar ist.
export function sample(arr, budget, seed) {
  if (!budget || arr.length <= budget) return arr;
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, budget).sort((x, y) => x.index - y.index);
}
