#!/usr/bin/env node
/*
 * scripts/e2e/run.mjs — Blackbox-E2E-Aggregator.
 *
 * Findet Suiten unter scripts/e2e/suites/<tier>-*.mjs, führt sie seriell als
 * isolierte Child-Prozesse aus, sammelt Ergebnisse zu einem JSON-Report unter
 * scripts/.e2e-out/report.json und gibt eine Konsolen-Tabelle aus.
 *
 * Jede Suite meldet ihr Ergebnis über den Exit-Code: 0 = grün ODER sauber
 * übersprungen (kein Playwright), 1 = mindestens ein Check rot. Der Aggregator
 * unterscheidet grün/rot; „übersprungen" erkennt er am Text „übersprungen" in
 * der Ausgabe (die Suite bleibt bei Exit 0).
 *
 * Flags:
 *   --tier=P0[,P1,...]   welche Tiers laufen (Default P0)
 *   --suite=<name>       nur eine Suite (Dateiname ohne .mjs, z. B. p0-core-study)
 *   --retries=N          erfolglose Suiten bis zu N-mal wiederholen (Default 1)
 *   --dist               gegen dist/ testen (setzt E2E_DIST=1 für die Kinder)
 *   --shard=i/n          nur Shard i von n (1-basiert) laufen
 *
 * Exit-Code: 0 = alle gelaufenen Suiten grün/übersprungen · 1 = eine rot ODER
 * keine Suite zum gewählten Tier gefunden.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SUITES_DIR = path.join(HERE, "suites");
const ROOT = path.resolve(HERE, "..", "..");
const OUT_DIR = process.env.E2E_SHOTS || path.join(ROOT, "scripts", ".e2e-out");
const REPORT = path.join(OUT_DIR, "report.json");

// Backward-Compat-Aliase: alte npm-Scripts zeigen auf einzelne Suiten.
const ALIASES = {
  study: "p0-core-study",
  verify: "p0-boot-verify",
  cards: "p2-cardcache",
  "modo-profe": "p1-modo-profe",
};

function parseArgs(argv) {
  const a = { tiers: ["P0"], suite: null, retries: 1, dist: false, shard: null };
  for (const arg of argv) {
    if (arg.startsWith("--tier=")) a.tiers = arg.slice(7).split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    else if (arg.startsWith("--suite=")) a.suite = arg.slice(8).trim();
    else if (arg.startsWith("--alias=")) a.suite = ALIASES[arg.slice(8).trim()] || arg.slice(8).trim();
    else if (arg.startsWith("--retries=")) a.retries = Math.max(1, Number(arg.slice(10)) || 1);
    else if (arg === "--dist") a.dist = true;
    else if (arg.startsWith("--shard=")) { const [i, n] = arg.slice(8).split("/").map(Number); if (i && n) a.shard = { i, n }; }
  }
  return a;
}

function tierOf(file) { const m = /^(p\d)-/.exec(file); return m ? m[1].toUpperCase() : "P?"; }

function discover(args) {
  if (!fs.existsSync(SUITES_DIR)) return [];
  let files = fs.readdirSync(SUITES_DIR).filter((f) => f.endsWith(".mjs")).sort();
  if (args.suite) files = files.filter((f) => f === args.suite + ".mjs" || f === args.suite);
  else files = files.filter((f) => args.tiers.includes(tierOf(f)));
  if (args.shard) files = files.filter((_, idx) => (idx % args.shard.n) === (args.shard.i - 1));
  return files;
}

function runOnce(file, env) {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn(process.execPath, [path.join(SUITES_DIR, file)], {
      cwd: ROOT, env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    child.stdout.on("data", (d) => { const s = d.toString(); out += s; process.stdout.write(s); });
    child.stderr.on("data", (d) => { const s = d.toString(); out += s; process.stderr.write(s); });
    child.on("close", (code) => {
      const skipped = /übersprungen/.test(out) && code === 0;
      // Grün-Zahlen aus der Report-Zeile „N/M grün" ziehen (best effort).
      const m = /(\d+)\/(\d+)\s+grün/.exec(out);
      resolve({
        file, tier: tierOf(file), exitCode: code, skipped,
        pass: m ? Number(m[1]) : (code === 0 && !skipped ? null : 0),
        total: m ? Number(m[2]) : null,
        wallMs: Date.now() - start,
      });
    });
  });
}

async function main() {
  // Date.now() ist im Aggregator (normaler Node-Prozess) erlaubt — nur Workflow-
  // Skripte verbieten es. Startzeit für Report-Metadaten.
  const args = parseArgs(process.argv.slice(2));
  const files = discover(args);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (files.length === 0) {
    console.error(`\n  Keine E2E-Suite gefunden für ${args.suite ? "suite=" + args.suite : "tier=" + args.tiers.join(",")}.`);
    fs.writeFileSync(REPORT, JSON.stringify({ error: "no-suites", tiers: args.tiers, suite: args.suite, results: [] }, null, 2));
    process.exit(1);
  }

  console.log(`\n  HolaRuta · E2E-Aggregator — ${files.length} Suite(n)` +
    (args.dist ? " · gegen dist/" : "") + (args.retries > 1 ? ` · retries=${args.retries}` : ""));
  const env = args.dist ? { E2E_DIST: "1" } : {};
  const results = [];
  for (const file of files) {
    let res = await runOnce(file, env);
    let attempts = 1, flaky = false;
    while (res.exitCode !== 0 && !res.skipped && attempts < args.retries) {
      console.log(`\n  ↻ Retry ${attempts}/${args.retries - 1}: ${file}`);
      res = await runOnce(file, env); attempts++;
      if (res.exitCode === 0) flaky = true;
    }
    results.push({ ...res, attempts, flaky });
  }

  // ---------- Zusammenfassung ----------
  const pad = (s, n) => (String(s) + " ".repeat(n)).slice(0, n);
  console.log("\n  " + "=".repeat(64));
  console.log(`  E2E-Zusammenfassung${args.dist ? " (dist/)" : ""}`);
  console.log("  " + "-".repeat(64));
  let failed = 0, flakyCount = 0, skipped = 0;
  for (const r of results) {
    const state = r.skipped ? "SKIP" : r.exitCode === 0 ? (r.flaky ? "FLAKY" : "OK") : "FAIL";
    if (r.skipped) skipped++; else if (r.exitCode !== 0) failed++; if (r.flaky) flakyCount++;
    const score = r.total != null ? `${r.pass}/${r.total}` : "";
    console.log(`  ${pad(state, 6)} ${pad(r.file, 30)} ${pad(score, 8)} ${(r.wallMs / 1000).toFixed(1)}s`);
  }
  console.log("  " + "-".repeat(64));
  console.log(`  ${results.length - failed}/${results.length} Suiten grün` +
    (failed ? `  ·  ${failed} ROT` : "") + (flakyCount ? `  ·  ${flakyCount} flaky` : "") +
    (skipped ? `  ·  ${skipped} übersprungen` : ""));
  console.log(`  Report: ${path.relative(ROOT, REPORT)}`);
  console.log("  " + "=".repeat(64));

  fs.writeFileSync(REPORT, JSON.stringify({
    tiers: args.tiers, suite: args.suite, dist: args.dist, retries: args.retries,
    totals: { suites: results.length, failed, flaky: flakyCount, skipped },
    results: results.map((r) => ({ suite: r.file, tier: r.tier, state: r.skipped ? "skipped" : r.exitCode === 0 ? "pass" : "fail", flaky: r.flaky, pass: r.pass, total: r.total, wallMs: r.wallMs, attempts: r.attempts })),
  }, null, 2) + "\n");

  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error("Aggregator abgebrochen:", e); process.exit(1); });
