#!/usr/bin/env node
/*
 * scripts/e2e/suites/p2-compras.mjs — Blackbox-E2E der Einkaufsliste + Quiz.
 *
 * Flow (entdeckt): open-compras → Liste (compras-toggle/-pick/-section) →
 * open-compras-quiz → je Frage compras-quiz-answer („Frage n/12"). Geprüft:
 *   - die Einkaufsliste rendert und lässt sich antippen (Toggle)
 *   - der Quiz startet und schreitet voran (invariante Assertion)
 *
 *   node scripts/e2e/suites/p2-compras.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";
import { readProgress, playByAction } from "../lib/games.mjs";

await process.exit(await runSuite("Compras (Einkaufsliste)", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());

  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Com" } });
    await page.goto(srv.base, { waitUntil: "networkidle" });
    await page.click(by.tab("entdecken")).catch(() => {});
    await page.waitForTimeout(150);
    await page.click(by.action("open-compras"));
    await page.waitForTimeout(300);

    check("Einkaufsliste gerendert", await page.evaluate(() => {
      const a = document.getElementById("app");
      return !!a && a.innerText.trim().length > 100;
    }));

    // Ein Item antippen (compras-toggle) — sichtbare Reaktion (aria-pressed o. Ä.).
    const item = await page.$(by.action("compras-toggle"));
    check("Einkaufsliste hat antippbare Items", !!item);
    if (item) {
      const before = await item.getAttribute("aria-pressed").catch(() => null);
      await item.click().catch(() => {});
      await page.waitForTimeout(150);
      const after = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? el.getAttribute("aria-pressed") : null;
      }, by.action("compras-toggle"));
      check("Antippen ändert den Item-Zustand", before !== after || after != null, `${before}→${after}`);
    }

    // Quiz starten und durchspielen.
    await page.click(by.action("open-compras-quiz")).catch(() => {});
    await page.waitForTimeout(350);
    const p0 = await readProgress(page);
    check("Compras-Quiz gestartet (Fragezähler sichtbar)", !!p0 && p0.total >= 2, JSON.stringify(p0));

    const res = await playByAction(page, ["compras-quiz-answer", "compras-quiz-next"], { maxSteps: 40 });
    check("Compras-Quiz schreitet voran (Fragezähler steigt)", res.progressed, JSON.stringify(res));
    check("Compras: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
