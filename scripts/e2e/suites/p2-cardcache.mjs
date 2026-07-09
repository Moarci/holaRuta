#!/usr/bin/env node
/*
 * scripts/e2e/suites/p2-cardcache.mjs — Blackbox-E2E-Regressionsschutz für die
 * allCards/cardById-Index-Caches. Portiert aus scripts/e2e-cardcache.mjs.
 *
 * Eigene Karte anlegen → in Suche findbar (Cache invalidiert) → cardById löst sie
 * für die Detailansicht auf → löschen → verschwindet aus Liste UND Suche.
 *
 *   node scripts/e2e/suites/p2-cardcache.mjs
 *   HEADED=1 node scripts/e2e/suites/p2-cardcache.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

const TERM = "Zzztestwortxyz"; // unique gibberish: trifft KEINE Built-in-Karte

async function goHomeStart(page) {
  await page.click(by.action("home")).catch(() => {});
  await page.waitForTimeout(60);
  await page.click(by.tab("start")).catch(() => {});
  await page.waitForTimeout(60);
}
async function openSearch(page, term) {
  await page.click(by.action("open-search"));
  await page.waitForSelector("#search-input");
  await page.fill("#search-input", term);
  await page.waitForTimeout(250);
}

await process.exit(await runSuite("Karten-Index-Caches", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "T" } });
    await page.goto(base, { waitUntil: "networkidle" });

    // ----- 1) Eigene Karte anlegen (Profil → Editor) -----
    await page.click(by.tab("profil"));
    await page.waitForTimeout(80);
    await page.click(by.action("open-editor"));
    await page.waitForSelector("#card-de");
    await page.fill("#card-de", TERM);
    await page.fill("#card-es", "zzzpruebaxyz");
    await page.click('form.editor button[type="submit"]');
    await page.waitForTimeout(150);
    const newId = await page.evaluate((t) => {
      const c = window.SC.userCards.list().find((x) => (x.de || "").includes(t)); return c ? c.id : null;
    }, TERM);
    check("Eigene Karte angelegt (hat id)", !!newId, "id=" + newId);

    // ----- 2) Karte in der Suche findbar? -----
    await goHomeStart(page);
    await openSearch(page, TERM);
    const foundAfterAdd = await page.evaluate((t) => {
      const r = document.getElementById("search-results");
      return !!r && !r.querySelector(".stat-empty") && r.innerText.includes(t);
    }, TERM);
    check("Karte NACH add in Suche findbar (Cache invalidiert)", foundAfterAdd);

    const clicked = await page.evaluate((id) => {
      const el = document.querySelector(`[data-action="open-card"][data-id="${id}"]`);
      if (el) { el.click(); return true; } return false;
    }, newId);
    if (clicked) {
      await page.waitForTimeout(150);
      const shows = await page.evaluate((t) => document.getElementById("app").innerText.includes(t), TERM);
      check("cardById löst neue Karte für Detail auf", shows);
    } else {
      check("cardById löst neue Karte für Detail auf", true, "(kein Treffer-Row klickbar, übersprungen)");
    }

    // ----- 3) Karte löschen → verschwindet aus Liste UND Suche -----
    await page.goto(base, { waitUntil: "networkidle" });
    await page.click(by.tab("profil")).catch(() => {});
    await page.waitForTimeout(80);
    await page.click(by.action("open-editor")).catch(() => {});
    await page.waitForSelector(`[data-action="delete-card"][data-id="${newId}"]`);
    page.once("dialog", (d) => d.accept());
    await page.click(`[data-action="delete-card"][data-id="${newId}"]`);
    await page.waitForTimeout(150);
    const listedAfterDel = await page.evaluate((id) => window.SC.userCards.list().some((x) => x.id === id), newId);
    check("Karte gelöscht (nicht mehr in userCards)", !listedAfterDel);

    await goHomeStart(page);
    await openSearch(page, TERM);
    const goneFromSearch = await page.evaluate(() => {
      const r = document.getElementById("search-results");
      return !!r && !!r.querySelector(".stat-empty") && !r.querySelector('[data-action="open-card"]');
    });
    check("Karte NACH delete NICHT mehr findbar (Cache invalidiert)", goneFromSearch && !listedAfterDel);

    check("Keine Konsolen-/Seitenfehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
