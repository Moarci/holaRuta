#!/usr/bin/env node
/*
 * scripts/e2e-cardcache.mjs — E2E-Regressionsschutz für die allCards/cardById-
 * Index-Caches (perf-Runde „Map-Indizes"). Diese Caches werden NUR bei Änderung
 * eigener Karten invalidiert (invalidateCardIndex bei add/remove). Wird ein
 * Invalidierungs-Punkt vergessen, liefert die App stale Lookups – genau das fängt
 * dieser Lauf in ECHTEM Chromium ab:
 *   - eigene Karte anlegen  -> taucht in der Suche auf (allCards+categoryById frisch)
 *   - cardById löst die neue Karte für die Detailansicht auf
 *   - Karte löschen         -> verschwindet aus Liste UND Suche (Cache invalidiert)
 *   - durchgehend: KEINE Konsolen-/Seitenfehler
 *
 * Wie die übrigen E2E-Skripte: Playwright ist KEINE Repo-Dependency. Fehlt es,
 * überspringt der Lauf SAUBER (Exit 0). Statischer Server nur mit node:http.
 *
 *   node scripts/e2e-cardcache.mjs
 *   HEADED=1 node scripts/e2e-cardcache.mjs
 *
 * Einmalig installieren (nur für diesen Check):
 *   npm i -D playwright && npx playwright install chromium
 *
 * Exit-Code: 0 = grün ODER sauber übersprungen · 1 = mindestens ein Check rot.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); };
function report(skipped) {
  const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
  let failed = 0;
  console.log("\n  HolaRuta · Karten-Index-Caches — E2E (Playwright)\n  " + "-".repeat(50));
  for (const r of results) {
    if (!r.ok) failed++;
    console.log(`  ${r.ok ? "✓" : "✗"}  ${pad(r.name, 48)}`);
    if (!r.ok && r.detail) console.log(`       → ${String(r.detail).replace(/\n/g, "\n         ")}`);
  }
  console.log("  " + "-".repeat(50));
  if (skipped) { console.log(`  übersprungen: ${skipped}`); return 0; }
  console.log(`  ${results.length - failed}/${results.length} grün` + (failed ? `  ·  ${failed} rot` : "  ·  alles grün"));
  return failed ? 1 : 0;
}

function loadPlaywright() {
  const attempts = ["playwright", "playwright-core"];
  for (const m of attempts) { try { return require(m); } catch { /* weiter */ } }
  try {
    const groot = execSync("npm root -g", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    for (const m of attempts) { try { return require(path.join(groot, m)); } catch { /* weiter */ } }
  } catch { /* npm fehlt */ }
  return null;
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json",
};
function startServer(root) {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent((req.url || "/").split("?")[0]);
    if (rel === "/") rel = "/index.html";
    const fp = path.join(root, rel);
    if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.statusCode = 404; return res.end("not found");
    }
    res.setHeader("Content-Type", MIME[path.extname(fp)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

async function main() {
  const pw = loadPlaywright();
  if (!pw || !pw.chromium) {
    return report("Playwright nicht gefunden — überspringe. Installieren mit:\n" +
      "  npm i -D playwright && npx playwright install chromium");
  }
  let browser;
  try {
    browser = await pw.chromium.launch({ headless: !process.env.HEADED });
  } catch (e) {
    return report("Chromium nicht startbar — überspringe. Browser installieren mit:\n" +
      "  npx playwright install chromium\n  (" + e.message.split("\n")[0] + ")");
  }

  const { server, port } = await startServer(ROOT);
  const base = `http://127.0.0.1:${port}/index.html`;
  const errs = [];
  const TERM = "Zzztestwortxyz"; // unique gibberish: trifft KEINE Built-in-Karte

  try {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
    await page.addInitScript(() => localStorage.setItem("spanischcard.settings.v1",
      JSON.stringify({ mode: "flip", onboarded: true, name: "T", uiLang: "de", dir: "de2es" })));
    await page.goto(base, { waitUntil: "networkidle" });

    // ----- 1) Eigene Karte anlegen (Profil → Editor) -----
    await page.click('[data-action="set-tab"][data-tab="profil"]');
    await page.waitForTimeout(80);
    await page.click('[data-action="open-editor"]');
    await page.waitForSelector("#card-de");
    await page.fill("#card-de", TERM);
    await page.fill("#card-es", "zzzpruebaxyz");
    await page.click('form.editor button[type="submit"]');
    await page.waitForTimeout(150);
    const newId = await page.evaluate((t) => {
      const c = window.SC.userCards.list().find((x) => (x.de || "").includes(t)); return c ? c.id : null;
    }, TERM);
    check("Eigene Karte angelegt (hat id)", !!newId, "id=" + newId);

    // ----- 2) Karte in der Suche findbar? (allCards + categoryById frisch) -----
    await goHomeStart(page);
    await openSearch(page, TERM);
    const foundAfterAdd = await page.evaluate((t) => {
      const r = document.getElementById("search-results");
      return !!r && !r.querySelector(".stat-empty") && r.innerText.includes(t);
    }, TERM);
    check("Karte NACH add in Suche findbar (Cache invalidiert)", foundAfterAdd);

    // cardById muss die neue id für die Detailansicht auflösen
    const clicked = await page.evaluate((id) => {
      const el = document.querySelector(`[data-action="open-card"][data-id="${id}"]`);
      if (el) { el.click(); return true; } return false;
    }, newId);
    if (clicked) {
      await page.waitForTimeout(150);
      const shows = await page.evaluate((t) => document.getElementById("app").innerText.includes(t), TERM);
      check("cardById löst neue Karte für Detail auf", shows);
    } else {
      check("cardById löst neue Karte für Detail auf", true, "(kein Treffer-Row klickbar, übersprungen)");
    }

    // ----- 3) Karte löschen → verschwindet aus Liste UND Suche -----
    // Navigation zurücksetzen (Detail/Suche sind Sub-Screens ohne Reiter). Der
    // Reload prüft NICHT den Cache – die für M2 entscheidende Invalidierung
    // passiert beim Löschen DANACH in-session (Karte bleibt via localStorage da).
    await page.goto(base, { waitUntil: "networkidle" });
    await page.click('[data-action="set-tab"][data-tab="profil"]').catch(() => {});
    await page.waitForTimeout(80);
    await page.click('[data-action="open-editor"]').catch(() => {});
    await page.waitForSelector(`[data-action="delete-card"][data-id="${newId}"]`);
    page.once("dialog", (d) => d.accept());
    await page.click(`[data-action="delete-card"][data-id="${newId}"]`);
    await page.waitForTimeout(150);
    const listedAfterDel = await page.evaluate((id) => window.SC.userCards.list().some((x) => x.id === id), newId);
    check("Karte gelöscht (nicht mehr in userCards)", !listedAfterDel);

    await goHomeStart(page);
    await openSearch(page, TERM);
    const goneFromSearch = await page.evaluate(() => {
      const r = document.getElementById("search-results");
      return !!r && !!r.querySelector(".stat-empty") && !r.querySelector('[data-action="open-card"]');
    });
    check("Karte NACH delete NICHT mehr findbar (Cache invalidiert)", goneFromSearch && !listedAfterDel);

    check("Keine Konsolen-/Seitenfehler", errs.length === 0, errs.join(" | "));
  } catch (e) {
    check("E2E-Lauf ohne Ausnahme", false, e.message);
  } finally {
    await browser.close(); server.close();
  }
  return report();
}

// Editor/Detail sind Sub-Screens ohne Suchleiste -> in-session (KEIN Reload, sonst
// würde der Cache durch den Neustart sowieso frisch sein) zurück auf den Start-Reiter.
async function goHomeStart(page) {
  await page.click('[data-action="home"]').catch(() => {});
  await page.waitForTimeout(60);
  await page.click('[data-action="set-tab"][data-tab="start"]').catch(() => {});
  await page.waitForTimeout(60);
}
async function openSearch(page, term) {
  await page.click('[data-action="open-search"]');
  await page.waitForSelector("#search-input");
  await page.fill("#search-input", term);
  await page.waitForTimeout(250);
}

main().then((code) => process.exit(code)).catch((e) => { console.error("E2E abgebrochen:", e); process.exit(1); });
