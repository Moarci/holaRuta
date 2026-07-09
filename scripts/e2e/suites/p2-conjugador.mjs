#!/usr/bin/env node
/*
 * scripts/e2e/suites/p2-conjugador.mjs — Blackbox-E2E des Konjugations-Drills.
 *
 * Flow: open-conjugacion → open-conjug-drill → start-conjug → je Verb Form tippen
 * (#conjug-answer) → Formular ABSENDEN (echter submit-Button in #conjug-form,
 * gleiches Form-Submit-Muster wie precios — Klick auf die Form selbst löst KEIN
 * Submit aus). Falsche Eingabe blockiert nicht — Ergebnis + „Weiter" folgen.
 *
 *   node scripts/e2e/suites/p2-conjugador.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";
import { readProgress } from "../lib/games.mjs";

async function submitAnswer(page, text) {
  await page.fill("#conjug-answer", text).catch(() => {});
  await page.click('#conjug-form button[type="submit"]', { timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(200);
}

await process.exit(await runSuite("Conjugador", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Cnj" } });
    await page.goto(srv.base, { waitUntil: "networkidle" });
    await page.click(by.tab("entdecken")).catch(() => {});
    await page.waitForTimeout(150);
    await page.click(by.action("open-conjugacion"));
    await page.waitForSelector(by.action("open-conjug-drill"), { timeout: 5000 });
    await page.click(by.action("open-conjug-drill"));
    await page.waitForSelector(by.action("start-conjug"), { timeout: 5000 });
    await page.click(by.action("start-conjug"));
    await page.waitForTimeout(350);

    const p0 = await readProgress(page);
    check("Drill gestartet (Verb-Zähler sichtbar)", !!p0 && p0.total >= 2, JSON.stringify(p0));

    let n = 0;
    for (let i = 0; i < 14; i++) {
      const hasForm = await page.$("#conjug-form");
      if (hasForm) {
        await submitAnswer(page, "xxxfalschxxx"); // absichtlich falsch
        n++;
      }
      const next = await page.$(by.action("conjug-next"));
      if (next) { await next.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(200); }
      else break;
    }
    check("Mehrere Verben beantwortbar (Formular-Submit funktioniert)", n >= 3, `submits=${n}`);
    check("Conjugador: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
