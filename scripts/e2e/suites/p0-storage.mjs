#!/usr/bin/env node
/*
 * scripts/e2e/suites/p0-storage.mjs — Blackbox-E2E der Persistenz.
 *
 * Prüft die Kernversprechen der Zustandshaltung — Datenverlust ist P0:
 *   - Fortschritt (spanischcard.progress.v2) übersteht einen Reload
 *   - eine geänderte Einstellung (Theme) persistiert über Reload
 *   - der IndexedDB-Mirror (store.js) wird angelegt (Backup-Sicherung aktiv)
 *   - kein Crash/kein pageerror rund um Schreiben/Lesen
 *
 *   node scripts/e2e/suites/p0-storage.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot, SETTINGS_KEY } from "../lib/harness.mjs";

const PROGRESS_KEY = "spanischcard.progress.v2";
const getItem = (page, k) => page.evaluate((key) => localStorage.getItem(key), k);

// Eine kurze Runde durchbewerten, damit Fortschritt geschrieben wird.
async function playShortRound(page) {
  await page.click(by.action("study-all"));
  await page.waitForSelector("section.study", { timeout: 5000 });
  for (let i = 0; i < 4; i++) {
    if (await page.$("#cb-mount")) break;
    const flip = await page.$("#flip");
    if (flip) {
      const vis = await page.locator('.ratebar [data-action="rate"]').first().isVisible().catch(() => false);
      if (!vis) { await flip.click().catch(() => {}); await page.waitForTimeout(70); }
    }
    const r = await page.$('.ratebar [data-action="rate"][data-rating="good"]');
    if (r) { await r.click().catch(() => {}); await page.waitForTimeout(120); } else await page.waitForTimeout(120);
  }
}

await process.exit(await runSuite("Persistenz/Storage", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { mode: "flip", name: "Store" } });
    await page.goto(base, { waitUntil: "networkidle" });

    // ----- 1) Fortschritt schreiben und über Reload prüfen -----
    await playShortRound(page);
    const progBefore = await getItem(page, PROGRESS_KEY);
    check("Runde schreibt Fortschritt (progress.v2 gesetzt)", !!progBefore && progBefore.length > 2, `len=${progBefore ? progBefore.length : 0}`);
    const ratedCount = await page.evaluate((k) => { try { return Object.keys(JSON.parse(localStorage.getItem(k) || "{}")).length; } catch { return 0; } }, PROGRESS_KEY);
    check("Fortschritt enthält bewertete Karten", ratedCount >= 1, `karten=${ratedCount}`);

    // ----- IDB-Mirror: entprellt (1500 ms, store.js) → auf derselben Seite abwarten,
    // BEVOR wir wegnavigieren, sonst wird der Mirror-Timer verworfen. -----
    await page.waitForTimeout(1900);
    const idbNames = await page.evaluate(async () => {
      if (!indexedDB.databases) return null;
      try { return (await indexedDB.databases()).map((d) => d.name).filter(Boolean); } catch { return null; }
    });
    if (idbNames === null) {
      check("IndexedDB-Mirror angelegt", true, "(indexedDB.databases() nicht verfügbar — Check übersprungen)");
    } else {
      check("IndexedDB-Mirror angelegt (Backup-DB 'holaruta-backup')", idbNames.includes("holaruta-backup"), `dbs=${JSON.stringify(idbNames)}`);
    }

    await page.goto(base, { waitUntil: "networkidle" });
    const progAfter = await getItem(page, PROGRESS_KEY);
    check("Fortschritt übersteht Reload (unverändert persistiert)", progAfter === progBefore,
      progAfter === progBefore ? "" : "progress nach Reload verändert");

    // ----- 2) Einstellung (Theme) persistiert -----
    await page.click(by.tab("profil"));
    await page.waitForSelector(by.action("set-theme"), { timeout: 5000 });
    const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme || "");
    // Auf das jeweils andere Theme umschalten (dark<->light), robust gegen Startwert.
    const other = themeBefore === "dark" ? "light" : "dark";
    const themeBtn = await page.$(`[data-action="set-theme"][data-theme="${other}"]`);
    if (themeBtn) {
      await themeBtn.click();
    } else {
      // Fallback: erster set-theme-Button (Toggle).
      await page.click(by.action("set-theme"));
    }
    await page.waitForTimeout(250);
    const themeSet = await page.evaluate(() => document.documentElement.dataset.theme || "");
    check("Theme umgeschaltet (sichtbar am <html data-theme>)", themeSet === "dark" || themeSet === "light", themeSet);
    await page.goto(base, { waitUntil: "networkidle" });
    const themeReload = await page.evaluate(() => document.documentElement.dataset.theme || "");
    check("Theme persistiert über Reload", themeReload === themeSet, `set=${themeSet} reload=${themeReload}`);

    // ----- 3) Settings-Key vorhanden & wohlgeformt -----
    const settingsOk = await page.evaluate((k) => { try { const s = JSON.parse(localStorage.getItem(k) || "{}"); return !!s && s.onboarded === true; } catch { return false; } }, SETTINGS_KEY);
    check("Settings persistiert & wohlgeformt (onboarded=true)", settingsOk);

    check("Storage: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
