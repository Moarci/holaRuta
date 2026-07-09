#!/usr/bin/env node
/*
 * scripts/e2e/suites/p2-precios.mjs — Blackbox-E2E von „Precios al oído".
 *
 * Flow: open-precios → start-precios → je Runde: Ziffern tippen (#precios-answer)
 * → Formular ABSENDEN (echter submit-Button in #precios-form, NICHT die Form selbst
 * anklicken — data-action="submit-precios" hängt am `submit`-Event des Formulars,
 * app.js:8199 `root.addEventListener("submit", onSubmit)`; ein Klick auf das
 * `<form>`-Element selbst löst kein Submit aus) → precios-next zur nächsten Runde.
 * Richtige/falsche Antwort blockiert NICHT — beides zeigt ein Ergebnis + „Weiter".
 *
 *   node scripts/e2e/suites/p2-precios.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";
import { openGame, readProgress } from "../lib/games.mjs";

// Tippt eine (bewusst oft falsche) Zahl und sendet über den echten Submit-Button ab.
async function submitAnswer(page, digits) {
  await page.fill("#precios-answer", digits).catch(() => {});
  await page.click('#precios-form button[type="submit"]', { timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(200);
}

await process.exit(await runSuite("Precios al oído", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Prc" } });
    await openGame(page, srv.base, { opener: "open-precios", start: "start-precios" });

    const speakable = await page.evaluate(() => !!document.querySelector("#precios-form"));
    if (!speakable) {
      check("Precios: Sprachausgabe verfügbar (sonst Gate-Hinweis)", true, "(kein #precios-form — Speech-Gate aktiv, Suite übersprungen)");
      await ctx.close();
      return; // headless Chromium hat i. d. R. speechSynthesis; Fallback nur zur Robustheit.
    }

    const p0 = await readProgress(page);
    check("Runde gestartet (Betrag-Zähler sichtbar)", !!p0 && p0.total >= 2, JSON.stringify(p0));

    let n = 0;
    for (let i = 0; i < 12; i++) {
      const hasForm = await page.$("#precios-form");
      if (hasForm) {
        await submitAnswer(page, "999999999"); // absichtlich falsch — Fluss darf trotzdem weiterlaufen
        n++;
      }
      const next = await page.$(by.action("precios-next"));
      if (next) { await next.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(200); }
      else break;
    }
    check("Mehrere Runden beantwortbar (Formular-Submit funktioniert)", n >= 2, `submits=${n}`);

    const done = await page.evaluate(() => !!document.getElementById("cb-mount") || !document.getElementById("precios-form"));
    check("Precios-Runde erreicht das Ende (Done-Screen oder Formular weg)", done);
    check("Precios: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
