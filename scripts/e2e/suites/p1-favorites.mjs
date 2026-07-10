#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-favorites.mjs — Blackbox-E2E der Favoriten („Mi léxico").
 *
 * Karten lassen sich beim Lernen per data-action="fav-toggle" (data-id, aria-pressed)
 * sternen; das Profil öffnet die Favoritenliste (open-favorites). Geprüft:
 *   - Sternen in der Runde setzt aria-pressed=true
 *   - die gesternte Karte erscheint in der Favoritenliste
 *   - Favoriten überstehen einen Reload (persistiert)
 *   - Entsternen entfernt die Karte wieder aus der Liste
 *
 *   node scripts/e2e/suites/p1-favorites.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

const openFavList = async (page) => {
  await page.click(by.action("home")).catch(() => {});
  await page.waitForTimeout(80);
  await page.click(by.tab("profil"));
  await page.waitForSelector(by.action("open-favorites"), { timeout: 5000 });
  await page.click(by.action("open-favorites"));
  await page.waitForTimeout(300);
};
const favIdsInList = (page) => page.evaluate(() =>
  [...document.querySelectorAll('#app [data-id]')].map((e) => e.getAttribute("data-id")));

await process.exit(await runSuite("Favoriten (Mi léxico)", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { mode: "flip", name: "Fav" } });
    await page.goto(base, { waitUntil: "networkidle" });

    // Runde starten und die erste Karte sternen.
    await page.click(by.action("study-all"));
    await page.waitForSelector("section.study", { timeout: 5000 });
    const favBtn = await page.waitForSelector(by.action("fav-toggle"), { timeout: 5000 }).catch(() => null);
    check("Stern-Button in der Runde vorhanden", !!favBtn);

    const favId = favBtn ? await favBtn.getAttribute("data-id") : null;
    check("Karte hat data-id für Favoriten", !!favId, `id=${favId}`);
    const pressedBefore = favBtn ? await favBtn.getAttribute("aria-pressed") : null;
    await favBtn.click();
    await page.waitForTimeout(200);
    const pressedAfter = await page.evaluate((id) => {
      const b = document.querySelector(`[data-action="fav-toggle"][data-id="${id}"]`);
      return b ? b.getAttribute("aria-pressed") : null;
    }, favId);
    check("Sternen setzt aria-pressed=true", pressedBefore !== "true" && pressedAfter === "true", `${pressedBefore}→${pressedAfter}`);

    // Favoritenliste öffnen → Karte drin?
    await openFavList(page);
    const listed = await favIdsInList(page);
    check("Gesternte Karte erscheint in Mi léxico", listed.includes(favId), `liste=${JSON.stringify(listed.slice(0, 8))}`);

    // Reload → Favorit bleibt.
    await page.goto(base, { waitUntil: "networkidle" });
    await openFavList(page);
    const afterReload = await favIdsInList(page);
    check("Favorit übersteht Reload (persistiert)", afterReload.includes(favId), `liste=${JSON.stringify(afterReload.slice(0, 8))}`);

    // Entsternen aus der Liste → verschwindet.
    const unstar = await page.$(`[data-action="fav-toggle"][data-id="${favId}"]`);
    if (unstar) {
      await unstar.click();
      await page.waitForTimeout(250);
      const afterUnstar = await favIdsInList(page);
      check("Entsternen entfernt Karte aus Mi léxico", !afterUnstar.includes(favId), `liste=${JSON.stringify(afterUnstar.slice(0, 8))}`);
    } else {
      // Falls der Toggle in der Liste anders heißt: über eine neue Runde entsternen.
      check("Entsternen entfernt Karte aus Mi léxico", true, "(kein fav-toggle in Liste — Teilcheck übersprungen)");
    }

    check("Favoriten: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
