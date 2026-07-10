#!/usr/bin/env node
/*
 * scripts/e2e/suites/p3-celebrate.mjs — Blackbox-E2E der Belohnungs-Inszenierung.
 *
 * celebrate.js rendert nach einer abgeschlossenen Runde in den Done-Screen (kein
 * eigener data-action-Trigger — reine Anzeige). Blackbox-prüfbar sind:
 *   - set-celebrate-sound (Profil) schaltet um und persistiert
 *   - eine abgeschlossene Runde rendert den Done-Screen fehlerfrei (celebrate läuft
 *     mit), auch unter reduced-motion (celebrate.js respektiert prefersReducedMotion)
 *
 *   node scripts/e2e/suites/p3-celebrate.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot, SETTINGS_KEY } from "../lib/harness.mjs";

const soundSetting = (page) => page.evaluate((k) => {
  try { return (JSON.parse(localStorage.getItem(k) || "{}")).celebrateSound; } catch { return undefined; }
}, SETTINGS_KEY);

async function finishRound(page) {
  await page.click(by.action("study-all"));
  await page.waitForSelector("section.study", { timeout: 5000 });
  const counter = (await page.locator(".topbar__counter").textContent().catch(() => "") || "").trim();
  const total = Number((counter || "1/1").split("/")[1]) || 1;
  let done = false;
  for (let i = 0; i < total + 6; i++) {
    if (await page.$("#cb-mount")) { done = true; break; }
    const flip = await page.$("#flip");
    if (flip) {
      const vis = await page.locator('.ratebar [data-action="rate"]').first().isVisible().catch(() => false);
      if (!vis) { await flip.click().catch(() => {}); await page.waitForTimeout(70); }
    }
    const r = await page.$('.ratebar [data-action="rate"][data-rating="good"]');
    if (r) { await r.click().catch(() => {}); await page.waitForTimeout(110); } else await page.waitForTimeout(110);
  }
  return done;
}

await process.exit(await runSuite("Belohnungs-Inszenierung (Celebrate)", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    // ----- Sound-Toggle -----
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Cel" } });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.tab("profil"));
      await page.waitForSelector(by.action("set-celebrate-sound"), { timeout: 5000 });
      const btns = await page.$$eval(by.action("set-celebrate-sound"), (bs) => bs.map((b) => b.getAttribute("aria-pressed")));
      check("Belohnungs-Sound-Umschalter vorhanden", btns.length >= 2, JSON.stringify(btns));
      const before = await soundSetting(page);
      // Zweite Option klicken (den jeweils inaktiven Zustand togglen).
      const target = await page.$$(by.action("set-celebrate-sound"));
      if (target[1]) await target[1].click();
      await page.waitForTimeout(200);
      const after = await soundSetting(page);
      check("Umschalten ändert & persistiert celebrateSound", after !== before, `${before}→${after}`);
      await page.goto(base, { waitUntil: "networkidle" });
      check("Einstellung übersteht Reload", (await soundSetting(page)) === after, `nach Reload=${await soundSetting(page)}`);
      check("Celebrate-Toggle: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ----- Runde abschließen → Done-Screen (celebrate) fehlerfrei, normal motion -----
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Cel", mode: "flip" } });
      await page.goto(base, { waitUntil: "networkidle" });
      const done = await finishRound(page);
      check("Runde abgeschlossen → Done-Screen erreicht", done);
      check("Done-Screen/Celebrate: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ----- reduced-motion: Done-Screen bleibt fehlerfrei -----
    {
      const { ctx, page, errs } = await newPage(browser, { reducedMotion: "reduce", seed: { name: "Cel", mode: "flip" } });
      await page.goto(base, { waitUntil: "networkidle" });
      const done = await finishRound(page);
      check("reduced-motion: Done-Screen erreicht", done);
      check("reduced-motion: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
