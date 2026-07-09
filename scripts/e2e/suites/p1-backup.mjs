#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-backup.mjs — Blackbox-E2E des Backup-Export/Imports.
 *
 * Auf dem Profil-Tab sichern export-data / import-data den kompletten Fortschritt
 * als JSON (Datenverlust-Schutz — P1). Cloud-Sync ist im Default nicht per UI
 * exponiert; dieser Roundtrip prüft das tatsächlich vorhandene Backup-Feature:
 *   - eine Lernrunde erzeugt Fortschritt
 *   - export-data lädt eine JSON-Datei mit „holaruta" + progress herunter
 *   - nach Löschen des Fortschritts stellt import-derselben-Datei ihn wieder her
 *
 *   node scripts/e2e/suites/p1-backup.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { startServer, newPage, appErrs, by, runSuite, targetRoot, SHOTS } from "../lib/harness.mjs";

const PROGRESS_KEY = "spanischcard.progress.v2";

async function playShortRound(page) {
  await page.click(by.action("study-all"));
  await page.waitForSelector("section.study", { timeout: 5000 });
  for (let i = 0; i < 3; i++) {
    if (await page.$("#cb-mount")) break;
    const flip = await page.$("#flip");
    if (flip) {
      const vis = await page.locator('.ratebar [data-action="rate"]').first().isVisible().catch(() => false);
      if (!vis) { await flip.click().catch(() => {}); await page.waitForTimeout(70); }
    }
    const r = await page.$('.ratebar [data-action="rate"][data-rating="good"]');
    if (r) { await r.click().catch(() => {}); await page.waitForTimeout(120); } else await page.waitForTimeout(120);
  }
  await page.click(by.action("home")).catch(() => {});
}

await process.exit(await runSuite("Backup Export/Import", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Bkp", mode: "flip" } });
    await page.goto(base, { waitUntil: "networkidle" });

    await playShortRound(page);
    const progLen = await page.evaluate((k) => (localStorage.getItem(k) || "").length, PROGRESS_KEY);
    check("Runde erzeugt Fortschritt", progLen > 2, `len=${progLen}`);

    // Export → Download.
    await page.click(by.tab("profil"));
    await page.waitForSelector(by.action("export-data"), { timeout: 5000 });
    const dl = await Promise.all([
      page.waitForEvent("download", { timeout: 8000 }),
      page.click(by.action("export-data")),
    ]).then((r) => r[0]).catch(() => null);
    let backupPath = null;
    if (dl) {
      backupPath = path.join(SHOTS, dl.suggestedFilename());
      await dl.saveAs(backupPath);
      const raw = fs.readFileSync(backupPath, "utf8");
      check("Export lädt JSON-Backup herunter", /holaruta/i.test(raw) && /progress/i.test(raw), dl.suggestedFilename());
    } else {
      check("Export löst Download aus", false, "kein download-Event");
    }

    // Fortschritt löschen, dann importieren → Wiederherstellung.
    if (backupPath) {
      await page.evaluate((k) => localStorage.removeItem(k), PROGRESS_KEY);
      const gone = await page.evaluate((k) => localStorage.getItem(k), PROGRESS_KEY);
      check("Fortschritt vor Import gelöscht", gone === null);

      // import-data triggert ein verstecktes File-Input; setInputFiles füllt es.
      page.once("dialog", (d) => d.accept().catch(() => {}));
      const chooserP = page.waitForEvent("filechooser", { timeout: 4000 }).catch(() => null);
      await page.click(by.action("import-data")).catch(() => {});
      const chooser = await chooserP;
      if (chooser) {
        await chooser.setFiles(backupPath);
      } else {
        // Fallback: sichtbares/verstecktes File-Input direkt befüllen.
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) await fileInput.setInputFiles(backupPath);
      }
      await page.waitForTimeout(500);
      const restored = await page.evaluate((k) => (localStorage.getItem(k) || "").length, PROGRESS_KEY);
      check("Import stellt Fortschritt wieder her", restored > 2, `restored len=${restored}`);
    }

    check("Backup: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
