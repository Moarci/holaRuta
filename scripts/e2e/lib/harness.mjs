/*
 * scripts/e2e/lib/harness.mjs — Geteilte Blackbox-E2E-Infrastruktur.
 *
 * Dedupliziert die vierfach kopierten Bausteine aus den alten scripts/e2e-*.mjs:
 *   - loadPlaywright()   Playwright optional laden (lokal, NODE_PATH oder global)
 *   - startServer(root)  statischer node:http-Server auf ephemerem Port (Cache-Control: no-store)
 *   - createSuite(name)  Check-Sammler + Report (einfach ODER gruppiert)
 *   - newContext(...)     frischer Browser-Context mit Onboarding-Seed + Fehler-Spies
 *   - by / SETTINGS       Selektor-Helfer + Standard-Settings-Seed
 *
 * Design: KEINE Repo-Dependency. Fehlt Playwright/Chromium, meldet loadPlaywright()
 * null und der Aufrufer überspringt SAUBER (Exit 0). Der Server nutzt nur Node-Bordmittel.
 *
 * Blackbox-Doktrin: Suiten importieren KEINE App-Module. Zustand kommt ausschließlich
 * über localStorage-Seeds (Fixtures) und Interaktion läuft über sichtbare Handles.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const DIST = path.join(ROOT, "dist");
export const FIXTURES = path.join(ROOT, "scripts", "e2e", "fixtures");
export const SHOTS = process.env.E2E_SHOTS || path.join(ROOT, "scripts", ".e2e-out");

// ---------- Playwright optional laden (lokal, NODE_PATH oder global) ----------
export function loadPlaywright() {
  const attempts = ["playwright", "playwright-core"];
  for (const m of attempts) { try { return require(m); } catch { /* weiter */ } }
  try {
    const groot = execSync("npm root -g", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    for (const m of attempts) { try { return require(path.join(groot, m)); } catch { /* weiter */ } }
  } catch { /* npm fehlt */ }
  return null;
}

// ---------- Statischer Webserver (nur node:http) ----------
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

/**
 * Startet einen statischen Server für `root` auf einem ephemeren Port (127.0.0.1:0).
 * Der zufällige Port gibt Origin-Isolation gratis (SW/Cache/IDB pro Suite getrennt).
 * @returns {Promise<{server, port, url, base, close}>}
 */
export function startServer(root, { cacheControl = "no-store" } = {}) {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent((req.url || "/").split("?")[0]);
    if (rel === "/") rel = "/index.html";
    const fp = path.join(root, rel);
    if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.statusCode = 404; return res.end("not found");
    }
    res.setHeader("Content-Type", MIME[path.extname(fp)] || "application/octet-stream");
    if (cacheControl) res.setHeader("Cache-Control", cacheControl);
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => {
    const port = server.address().port;
    const url = `http://127.0.0.1:${port}/`;
    resolve({
      server, port, url, base: url + "index.html",
      close: () => new Promise((r) => server.close(r)),
    });
  }));
}

// ---------- Check-Sammler + Report (einfach ODER gruppiert) ----------
/**
 * Eine Suite sammelt Checks — optional in benannten Gruppen (wie das alte e2e-verify).
 * `check(name, ok, detail)` schreibt in die aktuelle Gruppe; `group(label)` beginnt eine neue.
 * `report()` gibt eine Tabelle aus und liefert `{ total, failed, exitCode, groups }`.
 */
export function createSuite(title) {
  const groups = [];
  let current = null;
  const ensure = () => { if (!current) { current = { label: "", results: [] }; groups.push(current); } return current; };

  const group = (label) => { current = { label, results: [] }; groups.push(current); };
  const check = (name, ok, detail) => { ensure().results.push({ name, ok: !!ok, detail }); };

  function report(skipped) {
    const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
    let failed = 0, total = 0;
    console.log(`\n  HolaRuta · ${title} — E2E (Playwright)\n  ` + "=".repeat(58));
    if (skipped) { console.log(`  übersprungen: ${skipped}`); return { total: 0, failed: 0, skipped, exitCode: 0, groups }; }
    for (const g of groups) {
      if (g.label) console.log(`\n  [${g.label}]  ` + "-".repeat(Math.max(0, 50 - g.label.length)));
      for (const r of g.results) {
        total++; if (!r.ok) failed++;
        console.log(`  ${r.ok ? "✓" : "✗"}  ${pad(r.name, 50)}`);
        if (!r.ok && r.detail) console.log(`       → ${String(r.detail).slice(0, 300).replace(/\n/g, "\n         ")}`);
      }
    }
    console.log("\n  " + "=".repeat(58));
    console.log(`  ${total - failed}/${total} grün` + (failed ? `  ·  ${failed} ROT` : "  ·  alles grün"));
    console.log(`  Screenshots/Logs: ${SHOTS}`);
    return { total, failed, skipped: null, exitCode: failed ? 1 : 0, groups };
  }

  return { group, check, report, groups };
}

// ---------- Standard-Onboarding-Seed + Context-Fabrik ----------
export const SETTINGS_KEY = "spanischcard.settings.v1";
export const settingsSeed = (over = {}) =>
  JSON.stringify(Object.assign({ mode: "flip", onboarded: true, name: "E2E", uiLang: "de", dir: "de2es" }, over));

const cspErr = (s) => /refused to (load|execute|apply|connect)/i.test(s);
// Externe/Umgebungs-Fehler (Proxy-Zert, offline Bilder) sind KEINE App-Fehler.
const extErr = (s) => /failed to load resource|err_cert|net::err|err_connection|err_name_not_resolved/i.test(s);
export const appErrs = (errs) => errs.filter((e) => !extErr(e));

/**
 * Frischer Browser-Context + Page mit Onboarding-Seed und Fehler-Spies.
 * @returns {Promise<{ctx, page, errs, csp}>}
 *   errs  gesammelte pageerror/console.error-Meldungen
 *   csp   Teilmenge davon, die wie CSP-Verstöße aussehen
 */
export async function newPage(browser, {
  viewport = { width: 412, height: 915 },
  deviceScaleFactor,
  reducedMotion,
  seed = {},           // Objekt → Standard-Settings-Seed mit Overrides; oder { key, value } / [{key,value}]
  seedRaw = null,      // rohe [{key, value}] localStorage-Paare (Fixtures)
} = {}) {
  const opts = { viewport };
  if (deviceScaleFactor) opts.deviceScaleFactor = deviceScaleFactor;
  if (reducedMotion) opts.reducedMotion = reducedMotion;
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errs = [], csp = [];
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") { const t = m.text(); errs.push("console: " + t); if (cspErr(t)) csp.push(t); } });

  // localStorage-Seeds VOR dem ersten Skript setzen.
  const pairs = [];
  if (seedRaw) pairs.push(...seedRaw);
  else if (seed) pairs.push({ key: SETTINGS_KEY, value: settingsSeed(seed) });
  if (pairs.length) {
    await page.addInitScript((ps) => { for (const p of ps) localStorage.setItem(p.key, p.value); }, pairs);
  }
  return { ctx, page, errs, csp };
}

// ---------- Selektor-Helfer (Blackbox: nur sichtbare Handles) ----------
export const by = {
  action: (name) => `[data-action="${name}"]`,
  tab: (tab) => `[data-action="set-tab"][data-tab="${tab}"]`,
  testId: (id) => `[data-testid="${id}"]`,
  role: (role, { name } = {}) => name ? `[role="${role}"][aria-label="${name}"]` : `[role="${role}"]`,
};

// ---------- Fixtures ----------
export const fixtures = {
  load: (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, name.endsWith(".json") ? name : name + ".json"), "utf8")),
  path: (name) => path.join(FIXTURES, name.endsWith(".json") ? name : name + ".json"),
  exists: (name) => fs.existsSync(path.join(FIXTURES, name.endsWith(".json") ? name : name + ".json")),
};

export function ensureShots() { fs.mkdirSync(SHOTS, { recursive: true }); return SHOTS; }

/**
 * Ziel-Wurzel für den Server: Repo-Root (Default) oder dist/ (wenn E2E_DIST=1
 * gesetzt ist und dist/index.html existiert). Der Aggregator run.mjs setzt E2E_DIST.
 */
export function targetRoot() {
  if (process.env.E2E_DIST === "1" && fs.existsSync(path.join(DIST, "index.html"))) return DIST;
  return ROOT;
}

/**
 * Standard-Runner für eine Suite: lädt Playwright (oder skippt sauber), startet den
 * Browser, ruft `body({ browser, pw })` auf, gibt einen Exit-Code zurück.
 * `body` erhält den Browser und muss selbst Server/Contexts verwalten.
 */
export async function runSuite(title, body, { headed = !!process.env.HEADED } = {}) {
  const suite = createSuite(title);
  const pw = loadPlaywright();
  if (!pw || !pw.chromium) {
    suite.report("Playwright nicht gefunden — überspringe. Installieren mit:\n" +
      "  npm i -D playwright && npx playwright install chromium");
    return 0;
  }
  let browser;
  try { browser = await pw.chromium.launch({ headless: !headed }); }
  catch (e) {
    suite.report("Chromium nicht startbar — überspringe (" + e.message.split("\n")[0] + ")");
    return 0;
  }
  ensureShots();
  try {
    await body({ browser, pw, suite });
  } catch (e) {
    suite.check("Suite-Lauf ohne Abbruch", false, e && e.message);
  } finally {
    await browser.close();
  }
  const res = suite.report(null);
  return res.exitCode;
}
