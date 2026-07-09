#!/usr/bin/env node
/*
 * scripts/e2e/suites/p2-banderas.mjs — Blackbox-E2E des Banderas-Flaggenquiz.
 * Flow: open-banderas → start-banderas → je Flagge banderas-answer („Flagge n/m").
 * Zusätzlich: Galería- und Info-Screen öffnen (die vier Banderas-Screens).
 *   node scripts/e2e/suites/p2-banderas.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";
import { openGame, readProgress, playByAction } from "../lib/games.mjs";

await process.exit(await runSuite("Banderas", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  try {
    // Quiz-Runde.
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Ban" } });
      await openGame(page, srv.base, { opener: "open-banderas", start: "start-banderas" });
      const p0 = await readProgress(page);
      check("Flaggenquiz gestartet (Zähler sichtbar)", !!p0 && p0.total >= 2, JSON.stringify(p0));
      const res = await playByAction(page, ["banderas-answer", "banderas-next"], { maxSteps: 30 });
      check("Flaggenquiz schreitet voran (Zähler steigt)", res.progressed, JSON.stringify(res));
      check("Flaggenquiz erreicht das Ende", res.reachedEnd, JSON.stringify(res));
      check("Banderas-Quiz: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
    // Galería + Info (weitere Banderas-Screens).
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Ban" } });
      await page.goto(srv.base, { waitUntil: "networkidle" });
      await page.click(by.tab("entdecken")).catch(() => {});
      await page.waitForTimeout(150);
      await page.click(by.action("open-banderas"));
      await page.waitForSelector(by.action("open-banderas-galeria"), { timeout: 5000 });
      await page.click(by.action("open-banderas-galeria"));
      await page.waitForTimeout(300);
      check("Galería öffnet (Inhalt gerendert)",
        await page.evaluate(() => { const a = document.getElementById("app"); return !!a && a.innerText.length > 100; }));
      // Zurück und Info öffnen.
      await page.click(by.action("home")).catch(() => {});
      await page.click(by.tab("entdecken")).catch(() => {});
      await page.click(by.action("open-banderas"));
      await page.waitForSelector(by.action("open-banderas-info"), { timeout: 5000 });
      await page.click(by.action("open-banderas-info"));
      await page.waitForTimeout(300);
      check("Info-Screen öffnet (Inhalt gerendert)",
        await page.evaluate(() => { const a = document.getElementById("app"); return !!a && a.innerText.length > 100; }));
      check("Banderas-Screens: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
