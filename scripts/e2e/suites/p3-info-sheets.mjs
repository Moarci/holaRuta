#!/usr/bin/env node
/*
 * scripts/e2e/suites/p3-info-sheets.mjs — Blackbox-Smoke der Info-/Nachschlage-Sheets.
 *
 * Die Info-Themen (Historia, Regatear, Salud, Jerga …) liegen im Entdecken-Tab als
 * open-*-Öffner. Pro Thema: öffnet, Inhalt gerendert, kein pageerror. Öffner, die in
 * der aktuellen Edition fehlen, werden sauber übersprungen (nicht als Fehler gewertet).
 *
 *   node scripts/e2e/suites/p3-info-sheets.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

// Bekannte Info-Öffner im Default-Track (aus Discovery des Entdecken-Tabs).
const TOPICS = [
  "open-historia", "open-historia-centro", "open-regatear", "open-salud",
  "open-jerga", "open-derechos", "open-responsable", "open-flirt",
  "open-fotos", "open-bailar", "open-musica", "open-cafe",
  "open-knigge", "open-logistica",
];

await process.exit(await runSuite("Info-Sheets", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());

  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Info" } });
    await page.goto(srv.base, { waitUntil: "networkidle" });

    let opened = 0, skipped = 0;
    for (const opener of TOPICS) {
      await page.click(by.tab("entdecken")).catch(() => {});
      await page.waitForTimeout(120);
      const el = await page.$(by.action(opener));
      if (!el) { skipped++; check(`${opener}: Öffner vorhanden`, true, "(in Edition nicht vorhanden — übersprungen)"); continue; }
      await el.click().catch(() => {});
      await page.waitForTimeout(250);
      const rendered = await page.evaluate(() => {
        const a = document.getElementById("app");
        return !!a && a.innerText.trim().length > 120;
      });
      check(`${opener}: Inhalt gerendert`, rendered);
      if (rendered) opened++;
      await page.click(by.action("home")).catch(() => {});
      await page.waitForTimeout(100);
    }

    check("Mindestens 10 Info-Themen geöffnet", opened >= 10, `geöffnet=${opened} übersprungen=${skipped}`);
    check("Info-Sheets: keine App-Fehler über alle Themen", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
