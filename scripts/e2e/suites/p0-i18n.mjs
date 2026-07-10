#!/usr/bin/env node
/*
 * scripts/e2e/suites/p0-i18n.mjs — Blackbox-E2E des UI-Sprachwechsels.
 *
 * Die UI-Sprache (Bediensprache, NICHT die Lernzielsprache Spanisch) ist im
 * Default-Track DE/EN und wird auf dem Profil-Tab über data-action="set-ui-lang"
 * mit data-lang umgeschaltet. Geprüft:
 *   - Umschalten DE→EN ändert sichtbare UI-Labels
 *   - Auswahl persistiert in localStorage (spanischcard.settings.v1 .uiLang)
 *   - nach Reload bleibt die Sprache erhalten
 *   - Zurückschalten EN→DE funktioniert ebenfalls
 *
 *   node scripts/e2e/suites/p0-i18n.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot, SETTINGS_KEY } from "../lib/harness.mjs";

const uiLangOf = (page) => page.evaluate((k) => { try { return (JSON.parse(localStorage.getItem(k) || "{}")).uiLang || ""; } catch { return ""; } }, SETTINGS_KEY);
const appText = (page) => page.evaluate(() => ((document.getElementById("app") || {}).innerText || ""));

async function gotoProfil(page, base) {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.click(by.tab("profil"));
  await page.waitForSelector(by.action("set-ui-lang"), { timeout: 5000 });
}

await process.exit(await runSuite("i18n UI-Sprache", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { uiLang: "de" } });
    await gotoProfil(page, base);

    const langButtons = await page.$$eval(by.action("set-ui-lang"), (bs) => bs.map((b) => b.getAttribute("data-lang")));
    check("Profil: UI-Sprach-Umschalter vorhanden (DE/EN)", langButtons.includes("de") && langButtons.includes("en"), JSON.stringify(langButtons));

    const textDE = await appText(page);
    check("Start-Sprache DE aktiv (localStorage)", (await uiLangOf(page)) === "de");

    // DE → EN
    await page.click('[data-action="set-ui-lang"][data-lang="en"]');
    await page.waitForTimeout(300);
    check("Umschalten auf EN persistiert (uiLang=en)", (await uiLangOf(page)) === "en");
    const textEN = await appText(page);
    check("Umschalten auf EN ändert sichtbare Labels", textEN !== textDE && textEN.length > 50,
      `gleich? ${textEN === textDE}`);
    check("EN-Button ist aria-pressed",
      await page.evaluate(() => { const b = document.querySelector('[data-action="set-ui-lang"][data-lang="en"]'); return b && b.getAttribute("aria-pressed") === "true"; }));

    // Reload → EN bleibt.
    await page.reload({ waitUntil: "networkidle" });
    check("Nach Reload: Sprache bleibt EN (persistiert)", (await uiLangOf(page)) === "en");

    // EN → DE zurück.
    await page.click(by.tab("profil"));
    await page.waitForSelector('[data-action="set-ui-lang"][data-lang="de"]', { timeout: 5000 });
    await page.click('[data-action="set-ui-lang"][data-lang="de"]');
    await page.waitForTimeout(300);
    check("Zurückschalten auf DE persistiert (uiLang=de)", (await uiLangOf(page)) === "de");
    const textDE2 = await appText(page);
    check("Zurückschalten auf DE stellt DE-Labels wieder her", textDE2 !== textEN);

    check("i18n: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
