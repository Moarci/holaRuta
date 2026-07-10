#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-assessment.mjs — Blackbox-E2E des Nivel-Tests (Assessment).
 *
 * Der ausführliche HolaRuta Nivel-Test (34 Fragen, A0–C1) ist adaptiv und lässt sich
 * unterbrechen/fortsetzen. Flow: open-assessment → assessment-start → je Frage
 * assessment-choose / assessment-unknown. Geprüft (ohne die vollen 34 Fragen):
 *   - Intro + Start, Fragezähler „Frage n von 34"
 *   - mehrere Fragen schreiten voran
 *   - Verlassen + Wiederöffnen setzt den Test fort (Resume statt Neustart)
 *
 *   node scripts/e2e/suites/p1-assessment.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

const appText = (page) => page.evaluate(() => ((document.getElementById("app") || {}).innerText || ""));
const progress = (page) => page.evaluate(() => {
  const m = ((document.getElementById("app") || {}).innerText || "").match(/(\d+)\s*(?:\/|von)\s*(\d+)/i);
  return m ? { n: Number(m[1]), total: Number(m[2]) } : null;
});
const openAssessment = async (page) => {
  await page.click(by.tab("entdecken")).catch(() => {});
  await page.waitForTimeout(120);
  await page.click(by.action("open-assessment"));
  await page.waitForTimeout(300);
};
// Beantwortet bis zu `n` Fragen (erste Option bzw. „weiß nicht").
async function answer(page, n) {
  let done = 0;
  for (let i = 0; i < n; i++) {
    const el = await page.$('[data-action="assessment-choose"], [data-action="assessment-unknown"]');
    if (!el) break;
    await el.click().catch(() => {});
    done++;
    await page.waitForTimeout(160);
  }
  return done;
}

await process.exit(await runSuite("Nivel-Test (Assessment)", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Niv" } });
    await page.goto(base, { waitUntil: "networkidle" });

    await openAssessment(page);
    await page.waitForSelector(by.action("assessment-start"), { timeout: 5000 });
    check("Nivel-Test-Intro sichtbar (34 Fragen)", /34/.test(await appText(page)));

    await page.click(by.action("assessment-start"));
    await page.waitForTimeout(300);
    const p1 = await progress(page);
    check("Erste Frage erscheint (Fragezähler von 34)", !!p1 && p1.total === 34, JSON.stringify(p1));

    const answered = await answer(page, 5);
    const pMid = await progress(page);
    check("Mehrere Fragen beantwortbar (Fortschritt steigt)", answered >= 4 && !!pMid && pMid.n > (p1 ? p1.n : 1), `beantwortet=${answered} ${JSON.stringify(pMid)}`);

    // Verlassen und wiederöffnen → Resume mitten im Test.
    const nBefore = pMid ? pMid.n : 0;
    await page.click(by.action("home")).catch(() => {});
    await page.waitForTimeout(150);
    await openAssessment(page);
    const stillInTest = await page.evaluate(() => !!document.querySelector('[data-action="assessment-choose"], [data-action="assessment-unknown"]'));
    check("Wiederöffnen setzt den Test fort (Resume)", stillInTest);
    const pResume = await progress(page);
    check("Resume behält den Fortschritt (nicht zurück auf Frage 1)", !!pResume && pResume.n >= nBefore, `vorher=${nBefore} resume=${JSON.stringify(pResume)}`);

    check("Assessment: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
