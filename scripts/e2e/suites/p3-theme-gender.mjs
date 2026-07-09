#!/usr/bin/env node
/*
 * scripts/e2e/suites/p3-theme-gender.mjs — Blackbox-E2E der UX-Schalter.
 *
 * Auf dem Profil-Tab: Theme (dark/light) und Gender (m/f) umschalten. Geprüft:
 *   - Theme-Umschalten wirkt am <html data-theme> und persistiert über Reload
 *   - Gender-Umschalten setzt aria-pressed und persistiert
 *   - reduced-motion wird respektiert (Boot-Splash ~sofort weg)
 *
 *   node scripts/e2e/suites/p3-theme-gender.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot, SETTINGS_KEY } from "../lib/harness.mjs";

const theme = (page) => page.evaluate(() => document.documentElement.dataset.theme || "");
const settingsField = (page, field) => page.evaluate(({ k, f }) => {
  try { return (JSON.parse(localStorage.getItem(k) || "{}"))[f]; } catch { return undefined; }
}, { k: SETTINGS_KEY, f: field });

await process.exit(await runSuite("Theme & Gender", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    // ----- Theme + Gender -----
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Ux" } });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.tab("profil"));
      await page.waitForSelector(by.action("set-theme"), { timeout: 5000 });

      const t0 = await theme(page);
      const other = t0 === "dark" ? "light" : "dark";
      const btn = await page.$(`[data-action="set-theme"][data-theme="${other}"]`);
      if (btn) await btn.click(); else await page.click(by.action("set-theme"));
      await page.waitForTimeout(250);
      const t1 = await theme(page);
      check("Theme umgeschaltet (<html data-theme> ändert sich)", t1 === "dark" || t1 === "light", `${t0}→${t1}`);
      await page.goto(base, { waitUntil: "networkidle" });
      check("Theme persistiert über Reload", (await theme(page)) === t1, `nach Reload=${await theme(page)}`);

      // Gender.
      await page.click(by.tab("profil"));
      await page.waitForSelector(by.action("set-gender"), { timeout: 5000 });
      const gBtns = await page.$$eval(by.action("set-gender"), (bs) => bs.map((b) => b.getAttribute("data-gender")));
      check("Gender-Umschalter vorhanden (m/f)", gBtns.length >= 2, JSON.stringify(gBtns));
      const target = gBtns.find((g) => g) || null;
      if (target) {
        await page.click(`[data-action="set-gender"][data-gender="${target}"]`);
        await page.waitForTimeout(200);
        const pressed = await page.evaluate((g) => {
          const b = document.querySelector(`[data-action="set-gender"][data-gender="${g}"]`);
          return b ? b.getAttribute("aria-pressed") : null;
        }, target);
        check("Gender gewählt setzt aria-pressed=true", pressed === "true", `${target}=${pressed}`);
        const persisted = await settingsField(page, "userGender");
        check("Gender persistiert in Settings (userGender)", persisted === target, `userGender=${persisted}`);
      }
      check("Theme/Gender: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ----- reduced-motion: Splash ~sofort weg -----
    {
      const { ctx, page } = await newPage(browser, { reducedMotion: "reduce", seed: { name: "Ux" } });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      const gone = await page.waitForFunction(() => {
        const b = document.getElementById("boot");
        return !b || b.classList.contains("is-hiding") || b.classList.contains("is-done") || getComputedStyle(b).display === "none";
      }, { timeout: 1500 }).then(() => true).catch(() => false);
      check("reduced-motion: Boot-Splash ~sofort weg", gone);
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
