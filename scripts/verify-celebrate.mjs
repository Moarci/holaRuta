#!/usr/bin/env node
/*
 * scripts/verify-celebrate.mjs — Verifikations-Gate für die celebrate.js-Integration.
 *
 * Plattformneutral (nur Node, keine Dependencies) — läuft unter Windows/PowerShell
 * genauso wie auf den GitHub-Runnern. Gedacht als Abschluss-Check für einen
 * Claude-Code-Agenten ODER als zusätzlicher CI-Schritt.
 *
 *   node scripts/verify-celebrate.mjs
 *
 * Exit-Code 0 = alles grün, 1 = mindestens ein Check rot (für Automatisierung).
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const read = (f) => { try { return fs.readFileSync(path.join(ROOT, f), "utf8"); } catch { return null; } };
const results = [];
function check(name, ok, hint) { results.push({ name, ok: !!ok, hint }); }
function run(cmd) { try { execSync(cmd, { cwd: ROOT, stdio: "pipe" }); return { ok: true }; } catch (e) { return { ok: false, out: (e.stdout || "") + (e.stderr || "") }; } }

// --- 1) Modul & Tests vorhanden/syntaktisch ok ---
const cel = read("celebrate.js");
check("celebrate.js existiert", cel !== null, "Modul fehlt im Repo-Root");
if (cel !== null) check("celebrate.js: node --check", run("node --check celebrate.js").ok);
check("test/celebrate.test.js existiert", read("test/celebrate.test.js") !== null);

// --- 2) Verdrahtung: index.html lädt das Skript ---
const html = read("index.html") || "";
check("index.html lädt celebrate.js", /<script[^>]+src=["']celebrate\.js["']/.test(html),
  'Zeile  <script src="celebrate.js"></script>  vor ui.js ergänzen');
// Auf die ECHTEN <script src="…">-Tags abstellen, nicht auf bloße Datei-
// erwähnungen im Fließtext/Kommentar (sonst Falsch-Negativ, wenn ein Kommentar
// "ui.js" vor dem celebrate.js-Tag nennt).
const posCeleb = html.search(/<script[^>]+src=["']celebrate\.js["']/);
const posUi = html.search(/<script[^>]+src=["']ui\.js["']/);
check("index.html: celebrate.js VOR ui.js", posCeleb > -1 && posUi > -1 &&
  posCeleb < posUi, "Ladereihenfolge: erst celebrate.js, dann ui.js");

// --- 3) SW-Precache kennt das neue Asset (sonst Drift-Test rot) ---
const sw = read("service-worker.js") || "";
check("service-worker.js ASSETS enthält ./celebrate.js", /["']\.\/celebrate\.js["']/.test(sw),
  '"./celebrate.js" in die ASSETS-Liste aufnehmen (nach "./badges.js")');

// --- 4) CSS angehängt ---
const css = read("styles.css") || "";
check("styles.css enthält .cb-mount (celebrate.css angehängt)", /\.cb-mount\b/.test(css),
  "Inhalt von celebrate.css ans Ende von styles.css hängen");
check("styles.css: kein url(#…) (Drift-Test-Falle vermieden)", !/url\(\s*#/.test(css),
  "Filter NICHT per CSS referenzieren — celebrate.js stellt ihn selbst bereit");

// --- 5) App-Verdrahtung ---
const app = read("app.js") || "";
check("app.js ruft SC.celebrate auf", /SC\.celebrate/.test(app), "Render-Dispatch des 'done'-Screens umstellen (BAUPLAN §3e)");
check("app.js: Session-Zähler (state.session)", /state\.session/.test(app), "Richtig/Falsch pro Runde zählen (BAUPLAN §3b/3c)");

// --- 6) UI: renderDone ist die Bühne ---
const ui = read("ui.js") || "";
check("ui.js: renderDone liefert cb-mount", /cb-mount/.test(ui), "renderDone() auf <div id=\"cb-mount\"> umstellen (BAUPLAN §4)");

// --- 7) badges.js: Lookup vorhanden ---
const badges = read("badges.js") || "";
check("badges.js: badgeMeta-Reader exportiert", /badgeMeta/.test(badges),
  "Kleinen Reader id -> {id,icon,name} ergänzen & auf SC.badges exportieren (BAUPLAN §3d)");

// --- 8) Volle Testsuite grün ---
const tests = run("node --test");
check("node --test grün", tests.ok, tests.out ? tests.out.split("\n").slice(-12).join("\n") : "");

// --- 9) Single-File-Build läuft & enthält das Modul ---
const build = run("node build.js");
check("node build.js läuft", build.ok, build.out);
const single = read("HolaRuta.html") || "";
check("HolaRuta.html enthält SC.celebrate (eingebettet)", /SC\.celebrate/.test(single),
  "build.js inlinet das Modul automatisch, sobald index.html es referenziert");

// --- Report ---
const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
let failed = 0;
console.log("\n  HolaRuta · celebrate.js — Verifikation\n  " + "-".repeat(48));
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`  ${r.ok ? "✓" : "✗"}  ${pad(r.name, 46)}`);
  if (!r.ok && r.hint) console.log(`       → ${r.hint.replace(/\n/g, "\n         ")}`);
}
console.log("  " + "-".repeat(48));
console.log(`  ${results.length - failed}/${results.length} grün` + (failed ? `  ·  ${failed} offen` : "  ·  alles bereit"));
process.exit(failed ? 1 : 0);
