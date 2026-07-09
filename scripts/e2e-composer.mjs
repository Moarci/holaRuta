#!/usr/bin/env node
/*
 * scripts/e2e-composer.mjs — Browser-gestützte UI/UX-Prüfung des „Aufgaben-Studios"
 * (Aufgaben & Pakete erstellen, features/composer.js) mit Playwright.
 *
 * Treibt die ECHTE App in echtem Chromium: ECOS-Edition laden → Tarea → Modo profe →
 * Aufgaben-Studio öffnen → Vorlage + Einzelziel wählen (inkl. Katalog-Suche) →
 * Details (Titel/Frist) → Teilen (QR, Link, Code) → Code dekodieren und als
 * LERNENDER über den geteilten Link abonnieren (?task=…). Prüft außerdem die
 * Anleitung, die Schritt-Navigation und fängt Konsolen-/Seitenfehler ab.
 *
 * WICHTIG: Playwright ist KEINE Repo-Dependency — fehlt es (oder der Browser),
 * überspringt das Skript SAUBER (Exit 0). Muster wie scripts/e2e-modo-profe.mjs.
 *
 *   node scripts/e2e-composer.mjs
 *   HEADED=1 node scripts/e2e-composer.mjs
 *   E2E_SHOTS=/pfad node scripts/e2e-composer.mjs   # Screenshot-Ordner (Default: scripts/.e2e-out)
 *
 * Exit-Code: 0 = alle Checks grün ODER sauber übersprungen · 1 = mindestens ein Check rot.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = process.env.E2E_SHOTS || path.join(ROOT, "scripts", ".e2e-out");

// ---------- Check-Sammler ----------
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); };

function report(skipped) {
  const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
  let failed = 0;
  console.log("\n  HolaRuta · Aufgaben-Studio — E2E (Playwright)\n  " + "-".repeat(50));
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

// ---------- Playwright optional laden ----------
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
    res.setHeader("content-type", MIME[path.extname(fp)] || "application/octet-stream");
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
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

    // In den Modo profe → Aufgaben-Studio.
    await page.click('[data-action="set-tab"][data-tab="tarea"]');
    await page.click('[data-action="open-teacher"]');
    await page.waitForSelector('[data-action="open-composer"]');
    check("Einstiegskarte „Aufgaben-Studio“ im Modo profe", true);
    await page.click('[data-action="open-composer"]');
    await page.waitForSelector(".cmp-steps");
    check("Studio öffnet mit Schritt-Anzeige", await page.$eval(".cmp-step--current .cmp-step__label", (el) => el.textContent.trim()) === "Inhalte");

    // Schritt 1: Reiter + Vorlagen sichtbar; „Weiter" ohne Auswahl gesperrt.
    const tabCount = await page.$$eval(".cmp-tab", (t) => t.length);
    check("Katalog-Reiter vorhanden (Vorlagen/Pläne/Sets/Themen)", tabCount === 4, `tabs=${tabCount}`);
    check("„Weiter“ ohne Auswahl gesperrt", await page.$eval(".cmp-nextbtn", (b) => b.disabled));
    await page.screenshot({ path: path.join(SHOTS, "composer-step1.png"), fullPage: true });

    // Vorlage „Restaurant & Essen gehen" antippen → 3 Ziele gewählt.
    await page.click('[data-action="composer-bundle"][data-bundle="restaurant"]');
    let footer = await page.$eval(".cmp-foot__count", (el) => el.textContent);
    check("Vorlage wählt ihre Ziele (3 Ziele im Zähler)", /3 Ziele/.test(footer), footer);
    check("Vorlagen-Karte als gewählt markiert",
      await page.$eval('[data-action="composer-bundle"][data-bundle="restaurant"]', (el) => el.classList.contains("is-active")));

    // Katalog-Suche: „notfall" finden und als Einzelziel dazunehmen.
    await page.fill("#cmp-search", "Notfall");
    await page.waitForSelector('#cmp-catalog [data-action="composer-toggle"]');
    await page.click('#cmp-catalog [data-action="composer-toggle"][data-value="category:notfall"]');
    footer = await page.$eval(".cmp-foot__count", (el) => el.textContent);
    check("Suche + Einzelziel ergänzt Auswahl (4 Ziele)", /4 Ziele/.test(footer), footer);
    check("Zähler zeigt Kartensumme", /\d+ Karten/.test(footer), footer);

    // Schritt 2: Zusammenfassung mit 4 Zeilen, eine entfernen, Titel + Frist setzen.
    await page.click('[data-action="composer-next"]');
    await page.waitForSelector(".cmp-sels");
    let rows = await page.$$eval(".cmp-sel", (r) => r.length);
    check("Schritt 2 listet alle 4 Ziele", rows === 4, `rows=${rows}`);
    await page.click('.cmp-sel [data-action="composer-toggle"][data-value="category:dieta"]');
    rows = await page.$$eval(".cmp-sel", (r) => r.length);
    check("Ziel per ✕ entfernbar (3 bleiben)", rows === 3, `rows=${rows}`);
    await page.fill("#cmp-title", "Woche 1: Ankommen");
    await page.fill("#cmp-due", "2026-08-01");
    await page.screenshot({ path: path.join(SHOTS, "composer-step2.png"), fullPage: true });

    // Schritt 3: Teilen — QR, Teilen-Knöpfe, Code (HRB1 = Paket).
    await page.click('[data-action="composer-next"]');
    await page.waitForSelector(".cmp-ready");
    check("QR-Code gerendert", !!(await page.$(".cmp-qr svg")));
    check("Link-kopieren- & WhatsApp-Knopf vorhanden",
      !!(await page.$('[data-action="composer-copy-link"]')) && !!(await page.$('[data-action="composer-whatsapp"]')));
    await page.click(".cmp-codebox summary");
    const code = (await page.$eval(".cmp-codebox .task-code", (el) => el.value)).trim();
    check("Paket-Code erzeugt (HRB1.…)", code.startsWith("HRB1."), code.slice(0, 12));
    const decoded = await page.evaluate((c) => window.SC.store.decodeBundle(c), code);
    check("Code dekodiert: 3 Ziele + Titel + Frist",
      !!decoded && decoded.items.length === 3 && decoded.title === "Woche 1: Ankommen" && decoded.due === "2026-08-01",
      JSON.stringify(decoded));
    await page.screenshot({ path: path.join(SHOTS, "composer-step3.png"), fullPage: true });

    // Anleitung öffnen/schließen.
    await page.click('[data-action="composer-guide"]');
    await page.waitForSelector(".cmp-guide");
    const guideSecs = await page.$$eval(".cmp-guide__sec", (s) => s.length);
    check("Anleitung mit 5 Abschnitten (Lehrkraft/Reiseleitung)", guideSecs === 5, `secs=${guideSecs}`);
    await page.screenshot({ path: path.join(SHOTS, "composer-guide.png"), fullPage: true });
    await page.click('.cmp-guide .tgt-modal__x');
    check("Anleitung schließt wieder", !(await page.$(".cmp-guide")));

    // Schritt-Navigation: über die Schritt-Anzeige zurück zu Schritt 1.
    await page.click('[data-action="composer-step"][data-step="1"]');
    await page.waitForSelector("#cmp-search");
    check("Schritt-Anzeige springt zurück zu Schritt 1", true);
    // Topbar-Zurück führt aus Schritt 1 zum Modo profe.
    await page.click('[data-action="composer-back"]');
    await page.waitForSelector('[data-action="open-composer"]');
    check("Zurück aus Schritt 1 → Modo profe", true);

    // ---------- Lernenden-Seite: geteilter Link abonniert das Paket ----------
    const learner = await ctx.newPage();
    learner.on("pageerror", (e) => errs.push("learner pageerror: " + e.message));
    learner.on("console", (m) => { if (m.type() === "error") errs.push("learner console: " + m.text()); });
    await learner.goto(base + "&task=" + encodeURIComponent(code), { waitUntil: "networkidle" });
    await learner.click('[data-action="set-tab"][data-tab="tarea"]');
    await learner.waitForSelector(".task-item");
    const taskRows = await learner.$$eval(".task-item", (r) => r.length);
    check("Geteilter Link abonniert alle 3 Aufgaben (Tarea)", taskRows === 3, `tasks=${taskRows}`);
    const firstTitle = await learner.$eval(".task-item", (el) => el.textContent);
    check("Aufgaben tragen den Paket-Titel", /Woche 1: Ankommen/.test(firstTitle), firstTitle.slice(0, 80));
    await learner.screenshot({ path: path.join(SHOTS, "composer-learner.png"), fullPage: true });

    check("Keine Konsolen-/Seitenfehler", errs.length === 0, errs.join("\n"));
  } catch (e) {
    check("Lauf ohne Ausnahme", false, e && e.message);
  } finally {
    await browser.close();
    server.close();
  }
  return report();
}

process.exit(await main());
