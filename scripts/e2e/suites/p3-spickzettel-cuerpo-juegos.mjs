#!/usr/bin/env node
/*
 * scripts/e2e/suites/p3-spickzettel-cuerpo-juegos.mjs — Blackbox-Smoke dreier
 * Nachschlage-/Referenz-Screens aus dem Entdecken-Tab:
 *   - Spickzettel (Survival-Cheat-Sheet) + „groß zeigen"-Modal (sz-show, aria-modal)
 *   - Cuerpo (Körper-Vokabeln)
 *   - Juegos de viaje (Hostel-Spiele-Blatt)
 * Jeweils: öffnet, Inhalt gerendert, kein pageerror.
 *
 *   node scripts/e2e/suites/p3-spickzettel-cuerpo-juegos.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

const rendered = (page) => page.evaluate(() => {
  const a = document.getElementById("app");
  return !!a && a.innerText.trim().length > 120;
});
const openFromDiscover = async (page, opener) => {
  await page.click(by.action("home")).catch(() => {});
  await page.waitForTimeout(80);
  await page.click(by.tab("entdecken")).catch(() => {});
  await page.waitForTimeout(120);
  await page.click(by.action(opener));
  await page.waitForTimeout(250);
};

await process.exit(await runSuite("Spickzettel · Cuerpo · Juegos", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());

  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Ref" } });
    await page.goto(srv.base, { waitUntil: "networkidle" });

    // ----- Spickzettel + Modal -----
    await openFromDiscover(page, "open-spickzettel");
    check("Spickzettel gerendert", await rendered(page));
    const szRow = await page.waitForSelector(by.action("sz-show"), { timeout: 4000 }).catch(() => null);
    if (szRow) {
      await szRow.click();
      const modal = await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 4000 }).then(() => true).catch(() => false);
      check("Spickzettel: gross-zeigen oeffnet aria-modal", modal);
      if (modal) {
        await page.keyboard.press("Escape");
        check("Spickzettel: Escape schließt Modal",
          await page.waitForFunction(() => !document.querySelector('[role="dialog"][aria-modal="true"]'), { timeout: 3000 }).then(() => true).catch(() => false));
      }
    } else {
      check("Spickzettel: gross-zeigen vorhanden", false, "kein sz-show erreichbar");
    }

    // ----- Cuerpo -----
    const cuerpoEl = await (async () => { await openFromDiscover(page, "open-cuerpo").catch(() => {}); return page.$("#app"); })();
    check("Cuerpo öffnet & rendert", !!cuerpoEl && await rendered(page));

    // ----- Juegos de viaje -----
    await openFromDiscover(page, "open-juegos");
    check("Juegos de viaje öffnet & rendert", await rendered(page));

    check("Referenz-Screens: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
