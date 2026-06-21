#!/usr/bin/env node
/*
 * scripts/e2e-study.mjs — Browser-gestützte E2E-Prüfung des KERN-LERNPFADS
 * („Eine Runde lernen"): Runde starten → Karte aufdecken (Flip) bzw. tippen →
 * bewerten → bis zum Fertig-Screen.
 *
 * Treibt die ECHTE App in echtem Chromium gegen einen lokalen node:http-Server.
 * Geprüft wird der Pfad, den JEDER Nutzer als Erstes geht:
 *   - „Lernen"-CTA startet eine Runde (Study-Screen mit Karte erscheint)
 *   - Flip-Modus: Karte dreht (Bewertungs-Buttons werden sichtbar), „Vale" bewertet
 *   - Type-Modus: Antwort tippen → prüfen → bewerten
 *   - Durchbewerten leert die Queue → Fertig-Screen (#cb-mount)
 *   - Nebenbei: KEINE Konsolen-/Seitenfehler
 *
 * WICHTIG (wie scripts/e2e-modo-profe.mjs): Playwright ist KEINE Repo-Dependency
 * — das Projekt bleibt laufzeit-dependency-frei und `npm test` braucht nichts.
 * Fehlt Playwright oder der Browser, überspringt das Skript SAUBER (Exit 0).
 * Der statische Webserver nutzt nur Node-Bordmittel (node:http).
 *
 *   node scripts/e2e-study.mjs
 *   HEADED=1 node scripts/e2e-study.mjs        # sichtbarer Browser
 *   E2E_SHOTS=/pfad node scripts/e2e-study.mjs # Screenshot-Ordner
 *
 * Installieren (einmalig, nur für diesen Check):
 *   npm i -D playwright && npx playwright install chromium
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

// ---------- Check-Sammler (Stil wie e2e-modo-profe.mjs) ----------
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); };

function report(skipped) {
  const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
  let failed = 0;
  console.log("\n  HolaRuta · Kern-Lernpfad — E2E (Playwright)\n  " + "-".repeat(50));
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
  const base = `http://127.0.0.1:${port}/index.html`;
  const errs = [];

  try {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });

    // ----- 1) FLIP-Modus: Onboarding überspringen, Karteikarten-Modus erzwingen -----
    await page.addInitScript(() => localStorage.setItem("spanischcard.settings.v1",
      JSON.stringify({ mode: "flip", onboarded: true, name: "Tester", uiLang: "de", dir: "de2es" })));
    await page.goto(base, { waitUntil: "networkidle" });
    check("App geladen (window.SC.app da)", await page.evaluate(() => !!(window.SC && window.SC.app)));

    // Runde starten (Lernen-CTA). study-all liefert immer eine Runde (fällig
    // ODER freies Üben), darum verlässlicher Einstieg.
    await page.click('[data-action="study-all"]');
    await page.waitForSelector("section.study", { timeout: 5000 });
    check("Runde gestartet (Study-Screen erscheint)", true);
    const counter0 = await page.locator(".topbar__counter").textContent().catch(() => "");
    check("Karten-Zähler zeigt Fortschritt (n/total)", /^\d+\/\d+$/.test((counter0 || "").trim()), counter0);
    await page.screenshot({ path: path.join(SHOTS, "study-01-card.png"), fullPage: true });

    // Eine Karte aufdecken (Flip): danach werden die Bewertungs-Buttons sichtbar.
    await page.click("#flip");
    await page.waitForSelector('.ratebar [data-action="rate"]', { state: "visible", timeout: 5000 });
    check("Karte aufgedeckt (Flip → Bewertungs-Buttons sichtbar)", true);
    await page.screenshot({ path: path.join(SHOTS, "study-02-flipped.png"), fullPage: true });

    // Bewerten → nächste Karte (oder Fertig). „Vale" = good.
    const totalText = (counter0 || "1/1").split("/")[1];
    const total = Number(totalText) || 1;
    await page.click('.ratebar [data-action="rate"][data-rating="good"]');
    await page.waitForTimeout(150);
    check("Karte bewertet (good/Vale akzeptiert)", true);

    // Durchbewerten bis zum Fertig-Screen (Queue leeren). Deckel großzügig über total.
    let done = false;
    for (let i = 0; i < total + 5; i++) {
      const onDone = await page.$("#cb-mount");
      if (onDone) { done = true; break; }
      // Falls noch eine Karte da ist: aufdecken (Flip-Modus) und bewerten.
      const flip = await page.$("#flip");
      if (flip) {
        const flipped = await page.locator('.ratebar [data-action="rate"]').first().isVisible().catch(() => false);
        if (!flipped) { await flip.click().catch(() => {}); await page.waitForTimeout(80); }
      }
      const rate = await page.$('.ratebar [data-action="rate"][data-rating="good"]');
      if (rate) { await rate.click().catch(() => {}); await page.waitForTimeout(120); }
      else { await page.waitForTimeout(120); }
    }
    check("Runde abgeschlossen (Fertig-Screen #cb-mount erscheint)", done,
      done ? "" : "kein #cb-mount nach Durchbewerten");
    await page.screenshot({ path: path.join(SHOTS, "study-03-done.png"), fullPage: true });

    // ----- 2) TYPE-Modus: Flip → Type austauschen, kurzer Tipp-Flow -----
    const tctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
    const tp = await tctx.newPage();
    tp.on("pageerror", (e) => errs.push("pageerror(type): " + e.message));
    tp.on("console", (m) => { if (m.type() === "error") errs.push("console(type): " + m.text()); });
    await tp.addInitScript(() => localStorage.setItem("spanischcard.settings.v1",
      JSON.stringify({ mode: "type", onboarded: true, name: "Tester", uiLang: "de", dir: "de2es" })));
    await tp.goto(base, { waitUntil: "networkidle" });
    await tp.click('[data-action="study-all"]');
    await tp.waitForSelector("section.study", { timeout: 5000 });
    const hasTyper = await tp.$("#typer");
    check("Type-Modus: Eingabe-Formular (#typer) vorhanden", !!hasTyper);
    if (hasTyper) {
      // Bewusst „falsch" tippen: der Flow muss trotzdem aufdecken + bewerten lassen.
      await tp.fill("#answer", "respuesta");
      await tp.click('#typer button[type="submit"]');
      await tp.waitForSelector('.ratebar [data-action="rate"]', { state: "visible", timeout: 5000 });
      check("Type-Modus: Prüfen deckt auf (Bewertungs-Buttons sichtbar)", true);
      await tp.click('.ratebar [data-action="rate"][data-rating="again"]');
      await tp.waitForTimeout(150);
      const advanced = await tp.$("#cb-mount") || await tp.$("section.study");
      check("Type-Modus: Bewerten geht weiter (nächste Karte oder Fertig)", !!advanced);
      await tp.screenshot({ path: path.join(SHOTS, "study-04-type.png"), fullPage: true });
    }

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
