#!/usr/bin/env node
/*
 * scripts/mutation/run.mjs — Mutationstesting für HolaRuta (zero-dep, node:* only).
 *
 * Baut echte Bugs in den Quellcode, prüft ob die Tests rot werden. Zwei Teile:
 *   --catalog : kuratierte Invarianten (catalog.mjs) — 100 % müssen gefangen werden.
 *   --engine  : automatische Operatoren über die reinen Module (targets.mjs) →
 *               Mutation-Score gegen eine Schwelle (Ratsche).
 *
 * Weitere Flags:
 *   --diff               nur per git geänderte Module mutieren (PR-Gate); Katalog läuft immer.
 *   --module=<name>      nur dieses Engine-Modul.
 *   --budget=<n>         max. Mutanten je Modul (Default targets.BUDGET).
 *   --seed=<n>           Sampling-Seed (Default targets.SEED).
 *   --threshold=<pct>    Score-Schwelle überschreiben (Default targets.THRESHOLD).
 *
 *   node scripts/mutation/run.mjs --catalog
 *   node scripts/mutation/run.mjs --engine --module=srs
 *
 * Exit 0 = grün · 1 = Katalog-Lücke / Score unter Schwelle / Restore-Fehler.
 */
"use strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { ROOT, runMutant, recoverBackups } from "./runner.mjs";
import { CATALOG } from "./catalog.mjs";
import { MODULES, BUDGET, SEED, THRESHOLD, isIgnored } from "./targets.mjs";
import { generateMutants, sample } from "./operators.mjs";
import { formatReport } from "./report.mjs";

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (k, d) => { const a = argv.find((x) => x.startsWith(k + "=")); return a ? a.split("=")[1] : d; };

const wantCatalog = has("--catalog") || (!has("--engine"));
const wantEngine = has("--engine");
const budget = Number(val("--budget", BUDGET));
const seed = Number(val("--seed", SEED));
const threshold = Number(val("--threshold", THRESHOLD));
const onlyModule = val("--module", null);

const lineAt = (src, idx) => src.slice(0, idx).split("\n").length;

recoverBackups(); // evtl. liegengebliebene Backups eines Absturzes zuerst zurückspielen

// ----------------------------- Katalog ------------------------------
function runCatalog() {
  const results = [];
  for (const c of CATALOG) {
    const abs = path.join(ROOT, c.file);
    const src = fs.readFileSync(abs, "utf8");
    const n = src.split(c.find).length - 1;
    const line = n >= 1 ? lineAt(src, src.indexOf(c.find)) : 0;
    if (n !== 1) {
      results.push({ label: c.label, file: c.file, line, status: "error",
        detail: n === 0 ? `find nicht gefunden: «${c.find.slice(0, 50)}»` : `find ${n}× mehrdeutig` });
      continue;
    }
    const r = runMutant(c.file, (orig) => {
      if (orig.split(c.find).length - 1 !== 1) throw new Error("find nicht eindeutig");
      return orig.replace(c.find, c.replace);
    }, c.tests);
    const status = r.error ? "error" : r.discarded ? "error" : r.killed ? "killed" : "survived";
    results.push({ label: c.label, file: c.file, line, status,
      detail: r.error || (r.discarded ? "Mutant warf SyntaxError (unerwartet)" : status === "survived" ? `Tests blieben grün: ${c.tests.join(", ")}` : "") });
  }
  return results;
}

// ------------------------------ Engine ------------------------------
function changedModules() {
  let base = "HEAD~1";
  if (process.env.GITHUB_BASE_REF) base = `origin/${process.env.GITHUB_BASE_REF}`;
  let files = [];
  try {
    files = execSync(`git diff --name-only ${base}...HEAD`, { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
  } catch {
    try { files = execSync(`git diff --name-only ${base}`, { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean); }
    catch { return null; } // Basis nicht verfügbar
  }
  const set = new Set(files);
  return Object.keys(MODULES).filter((m) => set.has(MODULES[m].file));
}

function runEngine() {
  let names = Object.keys(MODULES);
  if (onlyModule) names = names.filter((m) => m === onlyModule);
  else if (has("--diff")) {
    const ch = changedModules();
    names = ch === null ? names : ch;
    if (ch && ch.length === 0) { console.error("  [engine] keine geänderten reinen Module → übersprungen"); return []; }
  }

  const out = [];
  for (const m of names) {
    const { file, tests } = MODULES[m];
    const src = fs.readFileSync(path.join(ROOT, file), "utf8");
    const mutants = sample(generateMutants(src), budget, seed);
    const r = { module: m, killed: 0, survived: 0, equivalent: 0, discarded: 0, survivors: [] };
    for (const mut of mutants) {
      if (isIgnored(file, mut.line, mut.op)) { r.equivalent++; continue; }
      const res = runMutant(file, (orig) => orig.slice(0, mut.index) + mut.replacement + orig.slice(mut.index + mut.length), tests);
      if (res.error) { r.discarded++; continue; }
      if (res.discarded) { r.discarded++; continue; }
      if (res.killed) { r.killed++; }
      else { r.survived++; r.survivors.push({ file, line: mut.line, op: mut.op, from: mut.from, to: mut.to }); }
    }
    out.push(r);
    process.stderr.write(`  [engine] ${m}: ${mutants.length} Mutanten geprüft\n`);
  }
  return out;
}

// ------------------------------ Lauf --------------------------------
const catalog = wantCatalog ? runCatalog() : null;
const engine = wantEngine ? runEngine() : null;
const { text, exitCode } = formatReport({ catalog, engine, threshold });
console.log(text);
process.exit(exitCode);
