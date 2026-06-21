/*
 * scripts/mutation/runner.mjs — Mutant-Isolation für das Mutationstesting.
 *
 * Kernprimitiv runMutant(file, mutate, tests):
 *   1. Original der Datei snapshotten (in-memory + Backup nach .bak/ für Crash-Fälle).
 *   2. mutate(original) → mutierte Quelle in-place schreiben.
 *   3. `node --check` (Syntax-Gegenprobe) → bei SyntaxError "discarded".
 *   4. `node --test <tests>` in frischem Prozess → Exit≠0 = Mutation GEFANGEN.
 *   5. finally: Original IMMER aus dem In-memory-Snapshot zurückschreiben.
 *
 * Restore-Sicherheit: KEIN `git checkout` (würde uncommittete Änderungen löschen).
 * Signal-Handler (SIGINT/SIGTERM/uncaughtException) restaurieren alle offenen
 * Dateien. recoverBackups() spielt beim Start evtl. liegengebliebene .bak/-Dateien
 * zurück (Crash im vorigen Lauf), bevor irgendetwas mutiert wird.
 */
"use strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BAK = path.join(ROOT, "scripts", "mutation", ".bak");

// Datei (repo-relativ) → Original-Inhalt, solange sie mutiert ist.
const originals = new Map();
const bakName = (file) => path.join(BAK, file.replace(/[/\\]/g, "__"));

function ensureBak() { if (!fs.existsSync(BAK)) fs.mkdirSync(BAK, { recursive: true }); }

function snapshot(file) {
  if (originals.has(file)) return originals.get(file);
  const abs = path.join(ROOT, file);
  const orig = fs.readFileSync(abs, "utf8");
  originals.set(file, orig);
  ensureBak();
  fs.writeFileSync(bakName(file), orig); // Crash-Backup
  return orig;
}

function restore(file) {
  if (!originals.has(file)) return;
  fs.writeFileSync(path.join(ROOT, file), originals.get(file));
  try { fs.unlinkSync(bakName(file)); } catch { /* egal */ }
  originals.delete(file);
}

function restoreAll() { for (const f of [...originals.keys()]) restore(f); }

// Beim Start: liegengebliebene Backups eines abgestürzten Laufs zurückspielen.
export function recoverBackups() {
  if (!fs.existsSync(BAK)) return;
  for (const entry of fs.readdirSync(BAK)) {
    const file = entry.replace(/__/g, path.sep);
    const abs = path.join(ROOT, file);
    try {
      fs.writeFileSync(abs, fs.readFileSync(path.join(BAK, entry), "utf8"));
      fs.unlinkSync(path.join(BAK, entry));
      console.error(`  [recovery] ${file} aus .bak/ wiederhergestellt`);
    } catch { /* egal */ }
  }
}

// Sicherheitsnetz: bei Absturz/Abbruch alle offenen Dateien restaurieren.
let installed = false;
function installGuards() {
  if (installed) return; installed = true;
  const onExit = () => restoreAll();
  process.on("exit", onExit);
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(sig, () => { restoreAll(); process.exit(130); });
  }
  process.on("uncaughtException", (e) => { restoreAll(); console.error(e); process.exit(1); });
}

const node = process.execPath;
const run = (args) => spawnSync(node, args, { cwd: ROOT, encoding: "utf8" }).status;

const testArgs = (tests, opts = {}) => {
  const a = ["--test"];
  if (opts.namePattern) a.push("--test-name-pattern", opts.namePattern);
  a.push(...tests.map((t) => path.join("test", t)));
  return a;
};

/*
 * Vorcheck gegen UNMUTIERTEN Code: Sind die gemappten Tests grün und wählt das
 * (optionale) namePattern überhaupt Tests aus? Verhindert stille Falsch-Scores
 * (z. B. wenn ein Pattern auf 0 Tests passt → node --test endet mit Exit 0).
 * Rückgabe: { pass:boolean, count:number }.
 */
export function probeTests(tests, opts = {}) {
  const r = spawnSync(node, testArgs(tests, opts), { cwd: ROOT, encoding: "utf8" });
  const out = (r.stdout || "") + (r.stderr || "");
  const m = out.match(/# tests (\d+)/);
  return { pass: r.status === 0, count: m ? Number(m[1]) : 0 };
}

/*
 * Wendet eine Mutation an und meldet das Ergebnis.
 *   mutate: (original:string) => mutated:string   (wirft bei Validierungsfehler)
 * Rückgabe: { killed } | { discarded:true } | { error:string }
 */
export function runMutant(file, mutate, tests, opts = {}) {
  installGuards();
  const abs = path.join(ROOT, file);
  const orig = snapshot(file);
  try {
    let mutated;
    try { mutated = mutate(orig); }
    catch (e) { return { error: e.message }; }
    if (mutated === orig) return { error: "Mutation ohne Effekt (mutated === original)" };

    fs.writeFileSync(abs, mutated);

    // Syntax-Gegenprobe: kaputte Mutanten zählen als verworfen, nicht als gefangen.
    if (run(["--check", abs]) !== 0) return { discarded: true };

    return { killed: run(testArgs(tests, opts)) !== 0 };
  } finally {
    restore(file);
  }
}
