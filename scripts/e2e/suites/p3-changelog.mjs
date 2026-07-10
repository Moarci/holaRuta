#!/usr/bin/env node
/*
 * scripts/e2e/suites/p3-changelog.mjs — Blackbox-E2E des „Was ist neu?"-Banners.
 *
 * checkForUpdate() (app.js:2714, aufgerufen VOR dem ersten Render — app.js:8230)
 * vergleicht die laufende Version mit `store.loadSeenVersion()`. Der Storage-Wert
 * ist JSON-kodiert (store.js readJson→JSON.parse) — ein roher, unquotierter String
 * wie "0.0.1" ist KEIN valides JSON und fällt beim Parse-Fehler still auf den
 * Fallback (null) zurück, wodurch das Banner nie erscheint. Seed daher zwingend
 * über JSON.stringify (harness settingsSeed-Pattern), sonst bleibt die Suite
 * fälschlich grün-ohne-Aussage.
 *
 *   node scripts/e2e/suites/p3-changelog.mjs
 */
import { startServer, newPage, appErrs, runSuite, targetRoot, SETTINGS_KEY, settingsSeed } from "../lib/harness.mjs";

const SEENVERSION_KEY = "spanischcard.seenVersion.v1";
// Bewusst eine unbekannte alte Version: changelog.since() liefert dann [entries[0]]
// (Safe-Fallback, siehe changelog.js:859-864) — Banner erscheint auf jeden Fall,
// unabhängig vom aktuellen VERSION-Wert (kein Hardcoding der echten Version nötig).
const OLD_VERSION = "0.0.1-e2e-fixture";

await process.exit(await runSuite("Was ist neu? (Changelog)", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    // ----- Banner erscheint bei abweichender gesehener Version -----
    {
      const { ctx, page, errs } = await newPage(browser, {
        seedRaw: [
          { key: SETTINGS_KEY, value: settingsSeed({ name: "Upd" }) },
          { key: SEENVERSION_KEY, value: JSON.stringify(OLD_VERSION) },
        ],
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);

      check("Update-Banner erscheint bei abweichender seenVersion",
        await page.evaluate(() => !!document.querySelector(".upd-scrim")));
      check("Update-Banner nennt Änderungen (Inhalt gerendert)",
        await page.evaluate(() => { const s = document.querySelector(".upd-scrim"); return !!s && s.innerText.trim().length > 20; }));

      // Schließen aktualisiert seenVersion auf die aktuelle → Banner bleibt weg.
      // Zwei Elemente tragen data-action="dismiss-update" (Scrim-Div + Button,
      // ui.js:2006/2017) — Playwrights Strict-Mode verlangt einen eindeutigen
      // Selektor, darum gezielt den Button treffen.
      await page.click('.upd__ok[data-action="dismiss-update"]', { timeout: 3000 });
      await page.waitForTimeout(200);
      check("dismiss-update schließt das Banner",
        await page.evaluate(() => !document.querySelector(".upd-scrim")));

      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(250);
      check("Nach Reload: Banner bleibt weg (seenVersion aktualisiert)",
        await page.evaluate(() => !document.querySelector(".upd-scrim")));

      check("Changelog: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ----- Erste je gesehene Version (First-Run): KEIN Banner, nur still nachgetragen -----
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Fresh" } }); // kein seenVersion-Key gesetzt
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      check("Frische Installation: kein Update-Banner (nur stiller Eintrag)",
        await page.evaluate(() => !document.querySelector(".upd-scrim")));
      check("First-Run-Changelog: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
