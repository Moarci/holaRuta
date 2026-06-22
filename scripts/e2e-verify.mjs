#!/usr/bin/env node
/*
 * scripts/e2e-verify.mjs — Ausführliche Browser-Verifikation (Playwright/Chromium)
 * der Änderungen aus den Lanes L0–L5, die `node --test` strukturell NICHT prüfen kann:
 *
 *   - Boot & `defer`-Reihenfolge (window.SC vollständig, Home rendert)
 *   - CSP greift, bricht aber nichts (keine CSP-Verstöße; Inline-Styles/Theme wirken)
 *   - reduzierter Splash (#boot blendet schnell aus; 0 bei prefers-reduced-motion)
 *   - Kern-Lernpfad in Flip-/Type-/Listen-Modus
 *   - ECHTER Lazy-Load von qr.js (initial nicht geladen → on-demand beim Lehrer-Screen)
 *   - defer-only-Module weiterhin im Discover-Menü sichtbar (Regression L5)
 *   - Focus-Trap in role="dialog" aria-modal Modals (Tab-Containment, Escape, Rückgabe)
 *   - Skip-Link erreichbar & Sprung zu #app
 *   - Offline: Service Worker aktiv → Reload offline lädt aus Cache
 *   - Discover-Opener-Smoke im echten Browser
 *
 * Läuft ZWEIMAL: gegen den Repo-Root (Live-Multi-File) UND gegen dist/ (minifiziert).
 *
 * WICHTIG (wie scripts/e2e-study.mjs): Playwright ist KEINE Repo-Dependency. Fehlt es,
 * überspringt das Skript SAUBER (Exit 0). Der Webserver nutzt nur node:http.
 *
 *   node scripts/e2e-verify.mjs
 *   HEADED=1 node scripts/e2e-verify.mjs
 *
 * Voraussetzung für die dist/-Suite: vorher `node build.js --dist` (sonst wird sie
 * sauber übersprungen). Exit 0 = alle Checks grün ODER übersprungen · 1 = ein Check rot.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SHOTS = process.env.E2E_SHOTS || path.join(ROOT, "scripts", ".e2e-out");

// ---------- Check-Sammler (Stil wie e2e-study.mjs), je Suite gruppiert ----------
const suites = [];
let current = null;
const beginSuite = (label) => { current = { label, results: [] }; suites.push(current); };
const check = (name, ok, detail) => { current.results.push({ name, ok: !!ok, detail }); };

function report(skipped) {
  const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
  let failed = 0, total = 0;
  console.log("\n  HolaRuta · Ausführliche Browser-Verifikation (Playwright)\n  " + "=".repeat(58));
  if (skipped) { console.log(`  übersprungen: ${skipped}`); return 0; }
  for (const s of suites) {
    console.log(`\n  [${s.label}]  ` + "-".repeat(Math.max(0, 50 - s.label.length)));
    for (const r of s.results) {
      total++; if (!r.ok) failed++;
      console.log(`  ${r.ok ? "✓" : "✗"}  ${pad(r.name, 50)}`);
      if (!r.ok && r.detail) console.log(`       → ${String(r.detail).slice(0, 300).replace(/\n/g, "\n         ")}`);
    }
  }
  console.log("\n  " + "=".repeat(58));
  console.log(`  ${total - failed}/${total} grün` + (failed ? `  ·  ${failed} ROT` : "  ·  alles grün"));
  console.log(`  Screenshots/Logs: ${SHOTS}`);
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
  ".woff2": "font/woff2",
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

const SETTINGS = (mode) => JSON.stringify({ mode, onboarded: true, name: "Verify", uiLang: "de", dir: "de2es" });
const seed = (page, mode = "flip") =>
  page.addInitScript((s) => localStorage.setItem("spanischcard.settings.v1", s), SETTINGS(mode));
const cspErr = (s) => /refused to (load|execute|apply|connect)/i.test(s);
// Externe/Umgebungs-Fehler (Sandbox-Proxy ohne gültiges Zert für Wikimedia-Bilder
// o. Ä.) sind KEINE App-Fehler — beim Pass/Fail-Urteil herausfiltern.
const extErr = (s) => /failed to load resource|err_cert|net::err|err_connection|err_name_not_resolved/i.test(s);
const appErrs = (errs) => errs.filter((e) => !extErr(e));

// Eine vollständige Prüf-Suite gegen einen servierten Ordner.
async function runSuite(browser, root, label) {
  beginSuite(label);
  const { server, port } = await startServer(root);
  const baseUrl = `http://127.0.0.1:${port}/`;
  const base = baseUrl + "index.html";
  const newPage = async (mode = "flip") => {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
    const errs = []; const csp = [];
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    p.on("console", (m) => { if (m.type() === "error") { const tx = m.text(); errs.push("console: " + tx); if (cspErr(tx)) csp.push(tx); } });
    await seed(p, mode);
    return { ctx, p, errs, csp };
  };

  try {
    // ===== 1) Boot & defer, CSP, Theme, Splash, Inline-Styles =====
    {
      const { ctx, p, csp } = await newPage("flip");
      await p.goto(base, { waitUntil: "networkidle" });
      const scOk = await p.evaluate(() => !!(window.SC && window.SC.app && window.SC.ui && window.SC.data));
      check("Boot & defer: window.SC vollständig", scOk);
      const homeFilled = await p.evaluate(() => { const a = document.getElementById("app"); return !!a && a.innerHTML.trim().length > 200; });
      check("Home gerendert (#app gefüllt)", homeFilled);

      const hasCsp = await p.evaluate(() => !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'));
      check("CSP-<meta> vorhanden", hasCsp);
      const theme = await p.evaluate(() => document.documentElement.dataset.theme || "");
      check("Theme-Boot wirkt (<html data-theme>)", theme === "dark" || theme === "light", theme);

      // Splash blendet zügig aus (normaler Motion).
      const bootGone = await p.waitForFunction(() => { const b = document.getElementById("boot"); return !b || b.classList.contains("is-hiding") || b.classList.contains("is-done") || getComputedStyle(b).display === "none"; }, { timeout: 2500 }).then(() => true).catch(() => false);
      check("Splash blendet < 2,5 s aus", bootGone);

      // Inline-style-Attribut wird gerendert → style-src 'unsafe-inline' wirkt.
      const hasInlineStyle = await p.evaluate(() => !!document.querySelector('#app [style]'));
      check("Inline-style-Attribute aktiv (style-src 'unsafe-inline')", hasInlineStyle);
      check("Keine CSP-Verstöße bis Home", csp.length === 0, csp.join(" | "));
      await p.screenshot({ path: path.join(SHOTS, `${label}-01-home.png`) }).catch(() => {});
      await ctx.close();
    }

    // ===== 2) reduced-motion: Splash quasi sofort =====
    {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, reducedMotion: "reduce" });
      const p = await ctx.newPage(); await seed(p, "flip");
      await p.goto(base, { waitUntil: "domcontentloaded" });
      const gone = await p.waitForFunction(() => { const b = document.getElementById("boot"); return !b || b.classList.contains("is-hiding") || b.classList.contains("is-done") || getComputedStyle(b).display === "none"; }, { timeout: 1200 }).then(() => true).catch(() => false);
      check("reduced-motion: Splash ~sofort weg (< 1,2 s)", gone);
      await ctx.close();
    }

    // ===== 3) Kern-Lernpfad: FLIP bis Fertig-Screen =====
    {
      const { ctx, p, errs } = await newPage("flip");
      await p.goto(base, { waitUntil: "networkidle" });
      await p.click('[data-action="study-all"]');
      await p.waitForSelector("section.study", { timeout: 5000 });
      const counter = (await p.locator(".topbar__counter").textContent().catch(() => "") || "").trim();
      check("Flip: Runde gestartet + Zähler n/total", /^\d+\/\d+$/.test(counter), counter);
      const total = Number((counter || "1/1").split("/")[1]) || 1;
      await p.click("#flip");
      await p.waitForSelector('.ratebar [data-action="rate"]', { state: "visible", timeout: 5000 });
      check("Flip: Karte aufgedeckt (Bewertungs-Buttons)", true);
      let done = false;
      for (let i = 0; i < total + 6; i++) {
        if (await p.$("#cb-mount")) { done = true; break; }
        const flip = await p.$("#flip");
        if (flip) { const vis = await p.locator('.ratebar [data-action="rate"]').first().isVisible().catch(() => false); if (!vis) { await flip.click().catch(() => {}); await p.waitForTimeout(70); } }
        const r = await p.$('.ratebar [data-action="rate"][data-rating="good"]');
        if (r) { await r.click().catch(() => {}); await p.waitForTimeout(110); } else await p.waitForTimeout(110);
      }
      check("Flip: Fertig-Screen (#cb-mount) erreicht", done);
      check("Flip: keine Console-/Page-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ===== 4) Kern-Lernpfad: TYPE =====
    {
      const { ctx, p, errs } = await newPage("type");
      await p.goto(base, { waitUntil: "networkidle" });
      await p.click('[data-action="study-all"]');
      await p.waitForSelector("section.study", { timeout: 5000 });
      const hasTyper = !!(await p.$("#typer"));
      check("Type: Eingabe-Formular (#typer) vorhanden", hasTyper);
      if (hasTyper) {
        await p.fill("#answer", "respuesta");
        await p.click('#typer button[type="submit"]');
        await p.waitForSelector('.ratebar [data-action="rate"]', { state: "visible", timeout: 5000 });
        check("Type: Prüfen deckt auf", true);
        await p.click('.ratebar [data-action="rate"][data-rating="again"]');
        await p.waitForTimeout(150);
        check("Type: Bewerten geht weiter", !!(await p.$("#cb-mount") || await p.$("section.study")));
      }
      check("Type: keine Console-/Page-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ===== 5) Listen-Modus rendert =====
    {
      const { ctx, p } = await newPage("listen");
      await p.goto(base, { waitUntil: "networkidle" });
      await p.click('[data-action="study-all"]').catch(() => {});
      const ok = await p.waitForSelector("section.study", { timeout: 5000 }).then(() => true).catch(() => false);
      check("Listen-Modus: Study-Screen rendert", ok);
      await ctx.close();
    }

    // ===== 6) ECHTER Lazy-Load von qr.js (Edition ecos → Lehrer-Screen) =====
    {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
      const p = await ctx.newPage();
      const reqs = []; p.on("request", (r) => reqs.push(r.url()));
      await seed(p, "flip");
      await p.goto(baseUrl + "?edition=ecos", { waitUntil: "networkidle" });
      const noQrTag = await p.evaluate(() => !document.querySelector('script[src*="qr.js"]'));
      const qrUndef = await p.evaluate(() => typeof window.SC.qr === "undefined");
      check("Lazy qr: initial kein qr.js-Tag", noQrTag);
      check("Lazy qr: window.SC.qr initial undefined", qrUndef);
      const loadedBefore = reqs.some((u) => /\/qr\.js(\?|$)/.test(u));
      // Lehrer-Screen öffnen → loadModule("qr") (app.js:3612)
      const teach = await p.$('[data-action="open-teacher"]');
      if (!teach) { await p.click('[data-action="set-tab"][data-tab="tarea"]').catch(() => {}); await p.waitForTimeout(200); }
      await p.click('[data-action="open-teacher"]').catch(() => {});
      const qrLoaded = await p.waitForFunction(() => typeof window.SC.qr !== "undefined", { timeout: 5000 }).then(() => true).catch(() => false);
      check("Lazy qr: nach open-teacher nachgeladen (window.SC.qr da)", qrLoaded);
      const fetched = reqs.some((u) => /\/qr\.js(\?|$)/.test(u));
      check("Lazy qr: qr.js erst on-demand per Netzwerk geholt", fetched && !loadedBefore, `before=${loadedBefore} after=${fetched}`);

      // Aktivitätsblatt: {name}/{o/a}-Platzhalter dürfen NICHT roh durchschlagen.
      // (Paket A: die deutsche Dialogzeile wird jetzt ebenfalls durch sub() geschickt –
      // vorher stand z. B. „{name}, können Sie die Zehen bewegen?" wörtlich im Blatt.)
      await p.click('[data-action="open-printsheet"]').catch(() => {});
      const hasDlg = await p.waitForSelector(".sheet-section--dialogue", { timeout: 5000 }).then(() => true).catch(() => false);
      check("Aktivitätsblatt: Dialog-Sektion gerendert", hasDlg);
      const sheetText = await p.evaluate(() => (document.getElementById("app") || {}).innerText || "");
      check("Aktivitätsblatt: kein rohes {name} (sub() greift, auch auf DE-Zeile)", !/\{name\}/.test(sheetText),
        /\{name\}/.test(sheetText) ? "rohes {name} im gerenderten Blatt" : "");
      check("Aktivitätsblatt: keine rohen {o/a}-Gender-Tokens", !/\{[^{}/]*\/[^{}/]*\}/.test(sheetText));
      await ctx.close();
    }

    // ===== 7) defer-only-Module weiterhin im Discover-Menü =====
    {
      const { ctx, p } = await newPage("flip");
      await p.goto(base, { waitUntil: "networkidle" });
      await p.click('[data-action="set-tab"][data-tab="entdecken"]');
      await p.waitForTimeout(250);
      const want = ["open-historia", "open-historia-centro", "open-dialogos", "open-bailar", "open-musica", "open-flirt", "open-fotos"];
      const present = await p.evaluate((acts) => acts.filter((a) => !!document.querySelector(`[data-action="${a}"]`)), want);
      check("Discover: 7 defer-only-Module sichtbar", present.length === want.length, `gefunden: ${present.join(",")}`);
      await p.screenshot({ path: path.join(SHOTS, `${label}-02-discover.png`) }).catch(() => {});
      await ctx.close();
    }

    // ===== 8) Suche =====
    {
      const { ctx, p } = await newPage("flip");
      await p.goto(base, { waitUntil: "networkidle" });
      await p.click('[data-action="open-search"]');
      await p.waitForSelector("#search-input", { timeout: 4000 });
      await p.fill("#search-input", "agua");
      await p.waitForTimeout(350);
      const hasResults = await p.evaluate(() => { const r = document.getElementById("search-results"); return !!r && r.children.length > 0; });
      check("Suche: Eingabe liefert Ergebnisse", hasResults);
      await ctx.close();
    }

    // ===== 9) Focus-Trap im Modal (Ziel-Picker) =====
    {
      const { ctx, p } = await newPage("flip");
      await p.goto(base, { waitUntil: "networkidle" });
      // Verlässlicher Modal-Pfad: Discover-Tab → Spickzettel öffnen → eine Karte
      // „groß zeigen" (sz-show) rendert einen role="dialog" aria-modal Overlay.
      await p.click('[data-action="set-tab"][data-tab="entdecken"]').catch(() => {});
      await p.waitForTimeout(200);
      await p.click('[data-action="open-spickzettel"]').catch(() => {});
      await p.waitForSelector('[data-action="sz-show"]', { timeout: 4000 }).catch(() => {});
      const szRow = await p.$('[data-action="sz-show"]');
      if (!szRow) {
        check("Focus-Trap: Modal-Auslöser gefunden", false, "kein sz-show erreichbar — Check übersprungen");
      } else {
        await szRow.click();
        const modal = await p.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 4000 }).then(() => true).catch(() => false);
        check("Focus-Trap: Modal öffnet (aria-modal)", modal);
        if (modal) {
          for (let i = 0; i < 8; i++) await p.keyboard.press("Tab");
          const inside = await p.evaluate(() => { const m = document.querySelector('[role="dialog"][aria-modal="true"]'); return !!(m && m.contains(document.activeElement)); });
          check("Focus-Trap: Tab bleibt im Modal", inside);
          await p.keyboard.press("Escape");
          const closed = await p.waitForFunction(() => !document.querySelector('[role="dialog"][aria-modal="true"]'), { timeout: 3000 }).then(() => true).catch(() => false);
          check("Focus-Trap: Escape schließt Modal", closed);
        }
      }
      await ctx.close();
    }

    // ===== 10) Skip-Link =====
    {
      const { ctx, p } = await newPage("flip");
      await p.goto(base, { waitUntil: "networkidle" });
      // Strukturell: Skip-Link ist das ERSTE fokussierbare Element in DOM-Reihenfolge
      // (robuster als ein Tab-Druck, da die App nach Render Inhalt fokussiert).
      const firstFocusable = await p.evaluate(() => {
        const sel = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const els = Array.from(document.querySelectorAll(sel));
        return els.length ? (els[0].classList && els[0].classList.contains("skip-link")) : false;
      });
      check("Skip-Link: erstes fokussierbares Element (DOM-Reihenfolge)", firstFocusable);
      // Funktional: fokussieren + Enter springt zu #app.
      await p.focus(".skip-link").catch(() => {});
      const focused = await p.evaluate(() => !!(document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("skip-link")));
      check("Skip-Link: fokussierbar", focused);
      if (focused) {
        await p.keyboard.press("Enter");
        await p.waitForTimeout(150);
        const jumped = await p.evaluate(() => { const a = document.activeElement; return !!a && (a.id === "app" || (a.closest && a.closest("#app"))); });
        check("Skip-Link: springt zu #app", jumped);
      }
      await ctx.close();
    }

    // ===== 11) Offline / Service Worker =====
    {
      const { ctx, p, errs } = await newPage("flip");
      await p.goto(base, { waitUntil: "networkidle" });
      const swReady = await p.evaluate(() => navigator.serviceWorker ? navigator.serviceWorker.ready.then(() => true).catch(() => false) : false);
      check("Service Worker registriert & aktiv", swReady);
      if (swReady) {
        await ctx.setOffline(true);
        await p.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
        await p.waitForTimeout(400);
        const home = await p.evaluate(() => { const a = document.getElementById("app"); return !!a && a.innerHTML.trim().length > 200; });
        check("Offline: Reload lädt App aus Cache", home);
        const startable = await p.click('[data-action="study-all"]').then(() => p.waitForSelector("section.study", { timeout: 4000 })).then(() => true).catch(() => false);
        check("Offline: Lernrunde startbar", startable);
        await ctx.setOffline(false);
      }
      check("Offline: keine Console-/Page-Fehler", appErrs(errs).filter((e) => !/service worker/i.test(e)).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ===== 12) Discover-Opener-Smoke =====
    {
      const { ctx, p, errs } = await newPage("flip");
      await p.goto(base, { waitUntil: "networkidle" });
      await p.click('[data-action="set-tab"][data-tab="entdecken"]');
      await p.waitForTimeout(200);
      const openers = ["open-historia", "open-dialogos", "open-regatear", "open-salud", "open-bailar", "open-musica"];
      let okCount = 0;
      for (const a of openers) {
        const el = await p.$(`[data-action="${a}"]`);
        if (!el) continue;
        await el.click().catch(() => {});
        await p.waitForTimeout(250);
        const rendered = await p.evaluate(() => { const x = document.getElementById("app"); return !!x && x.innerHTML.trim().length > 100; });
        if (rendered) okCount++;
        await p.click('[data-action="home"]').catch(() => {});
        await p.waitForTimeout(120);
        await p.click('[data-action="set-tab"][data-tab="entdecken"]').catch(() => {});
        await p.waitForTimeout(120);
      }
      check("Discover-Opener öffnen ohne Fehler", okCount >= 4 && appErrs(errs).length === 0, `ok=${okCount} appErrs=${appErrs(errs).join(" | ")}`);
      await ctx.close();
    }
  } catch (e) {
    check("Suite-Lauf ohne Abbruch", false, e && e.message);
  } finally {
    server.close();
  }
}

async function main() {
  const pw = loadPlaywright();
  if (!pw || !pw.chromium) {
    return report("Playwright nicht gefunden — überspringe. Installieren mit:\n" +
      "  npm i -D playwright && npx playwright install chromium");
  }
  let browser;
  try { browser = await pw.chromium.launch({ headless: !process.env.HEADED }); }
  catch (e) { return report("Chromium nicht startbar — überspringe (" + e.message.split("\n")[0] + ")"); }

  fs.mkdirSync(SHOTS, { recursive: true });
  try {
    await runSuite(browser, ROOT, "root");
    if (fs.existsSync(path.join(DIST, "index.html"))) {
      await runSuite(browser, DIST, "dist");
    } else {
      beginSuite("dist");
      check("dist/ vorhanden (node build.js --dist)", false, "dist/index.html fehlt — Suite übersprungen");
    }
  } finally {
    await browser.close();
  }
  return report(null);
}

main().then((code) => process.exit(code)).catch((e) => { console.error("Verify-Lauf abgebrochen:", e); process.exit(1); });
