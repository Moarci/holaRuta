#!/usr/bin/env node
/*
 * scripts/e2e-modo-profe.mjs — Browser-gestützte UI/UX-Prüfung des „Modo profe"
 * (Lehrer-/Coordinator-Modus) mit Playwright.
 *
 * Treibt die ECHTE App in echtem Chromium: ECOS-Edition laden → Tarea → Modo profe →
 * Schüler-Backups importieren und Niveau-Verteilung, Standard-Sortierung, Spalten-
 * Sortierung, CSV-Export (inkl. Akzent-Namen), Re-Import-Dedupe und das Druck-Layout
 * (A4, keine geklippten Spalten) prüfen. Fängt nebenbei Konsolen-/Seitenfehler ab.
 *
 * WICHTIG: Playwright ist KEINE Repo-Dependency — das Projekt bleibt laufzeit-
 * dependency-frei und `npm test` (node --test) braucht weiterhin nichts. Dieses Skript
 * ist optional: fehlt Playwright oder der Browser, überspringt es SAUBER (Exit 0).
 * Der statische Webserver nutzt nur Node-Bordmittel (node:http), kein http-server.
 *
 *   node scripts/e2e-modo-profe.mjs
 *   HEADED=1 node scripts/e2e-modo-profe.mjs       # sichtbarer Browser
 *   E2E_SHOTS=/pfad node scripts/e2e-modo-profe.mjs # Screenshot-Ordner (Default: scripts/.e2e-out)
 *
 * Installieren (einmalig, nur für diesen Check):
 *   npm i -D playwright && npx playwright install chromium
 *
 * Exit-Code: 0 = alle Checks grün ODER sauber übersprungen · 1 = mindestens ein Check rot.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = process.env.E2E_SHOTS || path.join(ROOT, "scripts", ".e2e-out");

// ---------- Check-Sammler (Stil wie scripts/verify-celebrate.mjs) ----------
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); };

function report(skipped) {
  const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
  let failed = 0;
  console.log("\n  HolaRuta · Modo profe — E2E (Playwright)\n  " + "-".repeat(50));
  for (const r of results) {
    if (!r.ok) failed++;
    console.log(`  ${r.ok ? "✓" : "✗"}  ${pad(r.name, 48)}`);
    if (!r.ok && r.detail) console.log(`       → ${String(r.detail).replace(/\n/g, "\n         ")}`);
  }
  console.log("  " + "-".repeat(50));
  if (skipped) { console.log(`  übersprungen: ${skipped}`); return 0; }
  console.log(`  ${results.length - failed}/${results.length} grün` + (failed ? `  ·  ${failed} rot` : "  ·  alles grün"));
  if (results.length) console.log(`  Screenshots: ${SHOTS}`);
  return failed ? 1 : 0;
}

// ---------- Playwright optional laden (lokal, NODE_PATH oder global) ----------
function loadPlaywright() {
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

// ---------- Beispiel-Schüler-Backups (echte Card-IDs aus data.js) ----------
function sampleBackups() {
  globalThis.window = {};
  require(path.join(ROOT, "contextdata.js"));
  require(path.join(ROOT, "data.js"));
  require(path.join(ROOT, "numbers.js"));
  require(path.join(ROOT, "context.js"));
  const CARDS = globalThis.window.SC.data.CARDS;
  const byCat = {};
  CARDS.forEach((c) => { (byCat[c.cat] = byCat[c.cat] || []).push(c.id); });
  const smallCat = Object.keys(byCat).sort((a, b) => byCat[a].length - byCat[b].length)[0];
  const REC = { seen: 5, reps: 4, interval: 14, ease: 2.5, good: 4, again: 0, firstRating: "good" };
  const progress = (n, fullCat) => {
    const p = {};
    if (fullCat) byCat[fullCat].forEach((id) => { p[id] = Object.assign({}, REC); });
    for (let i = 0; Object.keys(p).length < n && i < CARDS.length; i++) p[CARDS[i].id] = Object.assign({}, REC);
    return p;
  };
  const pre = (d) => ({ Cartagena: Object.fromEntries(Array.from({ length: d }, (_, i) => [i + 1, true])) });
  const ch = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => ["c" + i, true]));
  const mk = (gs, n, full) => ({
    app: "holaruta", format: 1, exportedAt: new Date().toISOString(),
    data: { "spanischcard.progress.v2": progress(n, full ? smallCat : null), "spanischcard.gamestats.v1": gs },
  });
  // Akzentuierte Namen bewusst dabei (realistischer Schul-/Latam-Kontext).
  const defs = [
    ["Ana López",    { dailyStreak: 6, longestStreak: 9,  challengesDone: ch(4), pretripDays: pre(3), assessment: { level: "B2", finalScore: 0.78 } }, 80],
    ["Bruno Díaz",   { dailyStreak: 2, longestStreak: 4,  challengesDone: ch(1), pretripDays: pre(1), assessment: { level: "A2", finalScore: 0.50 } }, 25],
    ["Carla Méndez", { dailyStreak: 3, longestStreak: 5,  challengesDone: ch(2), pretripDays: pre(2), placement: { level: "B1-", finalScore: 0.62 } }, 40],
    ["Diego Ramos",  { dailyStreak: 0, longestStreak: 1,  challengesDone: ch(0), pretripDays: pre(0), placement: { level: "A1", finalScore: 0.32 } }, 8],
    ["Elena Soto",   { dailyStreak: 12, longestStreak: 18, challengesDone: ch(9), pretripDays: pre(5), assessment: { level: "C1", finalScore: 0.91 } }, 140, true],
    ["Frank Weber",  { dailyStreak: 1, longestStreak: 2,  challengesDone: ch(0), pretripDays: pre(0) }, 3],
    ["Gina Torres",  { dailyStreak: 4, longestStreak: 4,  challengesDone: ch(3), pretripDays: pre(2), placement: { level: "A2", finalScore: 0.45 } }, 18],
  ];
  return defs.map(([name, gs, n, full]) => ({
    name: name + ".json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(mk(gs, n, full))),
  }));
}

// ---------- Hauptlauf ----------
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

  fs.mkdirSync(SHOTS, { recursive: true });
  const { server, port } = await startServer(ROOT);
  const base = `http://127.0.0.1:${port}/index.html?edition=ecos`;
  const files = sampleBackups();
  const errs = [];

  try {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
    // Onboarding überspringen.
    await page.addInitScript(() => localStorage.setItem("spanischcard.settings.v1",
      JSON.stringify({ mode: "flip", onboarded: true, name: "Profe", uiLang: "de", dir: "de2es" })));

    await page.goto(base, { waitUntil: "networkidle" });
    const cfg = await page.evaluate(() => ({
      brand: (window.SC && window.SC.config && window.SC.config.brandName) || "",
      teacherTab: !!(window.SC && window.SC.config && window.SC.config.teacherTab),
    }));
    check("Edition ECOS aktiv", /ECOS/.test(cfg.brand), `brandName="${cfg.brand}"`);
    check("teacherTab aktiv", cfg.teacherTab);

    // In den Modo profe.
    await page.click('[data-action="set-tab"][data-tab="tarea"]');
    await page.click('[data-action="open-teacher"]');
    await page.waitForSelector('[data-action="teacher-import"]');
    check("Modo profe öffnet (Import-Button da)", true);
    await page.screenshot({ path: path.join(SHOTS, "01-empty.png"), fullPage: true });

    // Schüler importieren (verstecktes File-Input mit In-Memory-Dateien füllen).
    await page.setInputFiles("#teacher-file", files);
    await page.waitForSelector(".teacher-table tbody tr");
    await page.waitForTimeout(300);
    const names = () => page.$$eval(".teacher-table tbody tr td.teacher-name", (t) => t.map((x) => x.textContent.trim()));
    const imported = await names();
    check("Alle 7 Schüler importiert (inkl. Akzent-Namen)", imported.length === 7, JSON.stringify(imported));
    check("Akzent-Namen erhalten", imported.includes("Ana López") && imported.includes("Bruno Díaz") && imported.includes("Carla Méndez"));
    await page.screenshot({ path: path.join(SHOTS, "02-imported.png"), fullPage: true });

    // Niveau-Verteilung.
    const dist = await page.$$eval(".leveldist-row", (rs) => rs.map((r) =>
      r.querySelector(".leveldist-label").textContent.trim() + ":" + r.querySelector(".leveldist-count").textContent.trim()));
    check("Niveau-Verteilung korrekt (A1:1·A2:2·B1-:1·B2:1·C1:1)",
      JSON.stringify(dist) === JSON.stringify(["A1:1", "A2:2", "B1-:1", "B2:1", "C1:1"]), JSON.stringify(dist));
    const foot = await page.locator(".leveldist-foot").textContent().catch(() => "");
    check("„Noch nicht getestet: 1“ ausgewiesen", /:\s*1\b/.test(foot), foot);

    // Standard-Sortierung = Niveau absteigend (stärkster zuerst, ungetestet zuletzt).
    check("Standard-Sortierung nach Niveau (C1 zuerst, ungetestet zuletzt)",
      imported[0] === "Elena Soto" && imported[imported.length - 1] === "Frank Weber", JSON.stringify(imported));

    // Spalten-Sortierung nach Name.
    await page.click('.teacher-sortbtn[data-key="name"]');
    await page.waitForTimeout(120);
    const byName = await names();
    const sortedCopy = byName.slice().sort((a, b) => a.localeCompare(b, "de"));
    check("Sortierung nach Name (alphabetisch)", JSON.stringify(byName) === JSON.stringify(sortedCopy), JSON.stringify(byName));

    // CSV-Export.
    await page.fill("#teacher-classname", "Grupo A · Junio");
    const dl = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-action="teacher-csv"]'),
    ]).then((r) => r[0]).catch(() => null);
    if (dl) {
      const csvPath = path.join(SHOTS, dl.suggestedFilename());
      await dl.saveAs(csvPath);
      const csv = fs.readFileSync(csvPath, "utf8");
      const lines = csv.split("\r\n");
      check("CSV-Dateiname nutzt Klassennamen", /klasse-grupo-a-junio-/.test(dl.suggestedFilename()), dl.suggestedFilename());
      check("CSV hat Kopf + 7 Datenzeilen", lines.length === 8, lines.length + " Zeilen");
      check("CSV erhält Akzent-Namen (UTF-8)", /López|Díaz|Méndez/.test(csv));
    } else {
      check("CSV-Export löst Download aus", false, "kein download-Event");
    }

    // Re-Import desselben Backups → Dedupe (keine Dublette).
    await page.setInputFiles("#teacher-file", [files[0]]);
    await page.waitForTimeout(300);
    const afterRe = await page.$$eval(".teacher-table tbody tr", (r) => r.length);
    check("Re-Import ersetzt statt dupliziert (bleibt 7)", afterRe === 7, afterRe + " Zeilen");

    // Druck: Kopf sichtbar, App-Chrome/Buttons aus, Tabelle passt auf A4 (keine geklippten Spalten).
    const wide = await browser.newContext({ viewport: { width: 703, height: 1000 } }); // ≈ A4-Inhaltsbreite @96dpi
    const pp = await wide.newPage();
    await pp.addInitScript(() => localStorage.setItem("spanischcard.settings.v1",
      JSON.stringify({ mode: "flip", onboarded: true, name: "Profe", uiLang: "de" })));
    await pp.goto(base, { waitUntil: "networkidle" });
    await pp.click('[data-action="set-tab"][data-tab="tarea"]');
    await pp.click('[data-action="open-teacher"]');
    await pp.setInputFiles("#teacher-file", files);
    await pp.waitForSelector(".teacher-table tbody tr");
    await pp.fill("#teacher-classname", "Grupo A");
    await pp.emulateMedia({ media: "print" });
    await pp.waitForTimeout(150);
    const printInfo = await pp.evaluate(() => {
      const head = document.querySelector(".teacher-printhead");
      const actions = document.querySelector(".teacher-actions");
      const table = document.querySelector(".teacher-table");
      const niveauTh = document.querySelector(".teacher-table thead th:nth-child(6)");
      return {
        headVisible: head ? getComputedStyle(head).display !== "none" : false,
        actionsHidden: actions ? getComputedStyle(actions).display === "none" : true,
        tableScroll: table.scrollWidth, win: window.innerWidth,
        niveauText: niveauTh ? niveauTh.textContent.replace(/\s+/g, " ").trim() : "",
      };
    });
    check("Druck: Druck-Kopf (Klassenname+Datum) sichtbar", printInfo.headVisible);
    check("Druck: Aktions-Buttons ausgeblendet", printInfo.actionsHidden);
    check("Druck: Tabelle klippt auf A4 NICHT (alle Spalten passen)",
      printInfo.tableScroll <= printInfo.win + 2, `Tabelle ${printInfo.tableScroll}px > ${printInfo.win}px`);
    check("Druck: Niveau-Spalte vorhanden", /Level|Niveau|HolaRuta-Check/i.test(printInfo.niveauText), printInfo.niveauText);
    await pp.screenshot({ path: path.join(SHOTS, "03-print-a4.png"), fullPage: true });

    check("Keine Konsolen-/Seitenfehler", errs.length === 0, errs.join(" | "));
  } finally {
    await browser.close();
    server.close();
  }
  return report(null);
}

main().then((code) => process.exit(code)).catch((e) => {
  console.error("E2E-Lauf abgebrochen:", e);
  process.exit(1);
});
