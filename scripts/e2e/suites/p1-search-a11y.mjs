#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-search-a11y.mjs — Blackbox-E2E von Suche + A11y-Chrome.
 * Geprüft: Such-Eingabe liefert Ergebnisse; Skip-Link ist erstes fokussierbares
 * Element und springt zu #app; Fokus-Trap in einem aria-modal (Tab bleibt drin,
 * Escape schließt); Discover-Menü öffnet.
 *   node scripts/e2e/suites/p1-search-a11y.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

await process.exit(await runSuite("Suche & A11y", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    // ----- Suche -----
    {
      const { ctx, page } = await newPage(browser, { seed: { name: "A11y" } });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.action("open-search"));
      await page.waitForSelector("#search-input", { timeout: 4000 });
      await page.fill("#search-input", "agua");
      await page.waitForTimeout(350);
      check("Suche: Eingabe liefert Ergebnisse",
        await page.evaluate(() => { const r = document.getElementById("search-results"); return !!r && r.children.length > 0; }));
      await ctx.close();
    }

    // ----- Skip-Link -----
    {
      const { ctx, page } = await newPage(browser, { seed: { name: "A11y" } });
      await page.goto(base, { waitUntil: "networkidle" });
      const firstFocusable = await page.evaluate(() => {
        const sel = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const els = Array.from(document.querySelectorAll(sel));
        return els.length ? (els[0].classList && els[0].classList.contains("skip-link")) : false;
      });
      check("Skip-Link: erstes fokussierbares Element (DOM-Reihenfolge)", firstFocusable);
      await page.focus(".skip-link").catch(() => {});
      const focused = await page.evaluate(() => !!(document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("skip-link")));
      check("Skip-Link: fokussierbar", focused);
      if (focused) {
        await page.keyboard.press("Enter");
        await page.waitForTimeout(150);
        check("Skip-Link: springt zu #app",
          await page.evaluate(() => { const a = document.activeElement; return !!a && (a.id === "app" || (a.closest && a.closest("#app"))); }));
      }
      await ctx.close();
    }

    // ----- Fokus-Trap im Modal (Spickzettel „groß zeigen") -----
    {
      const { ctx, page } = await newPage(browser, { seed: { name: "A11y" } });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.tab("entdecken")).catch(() => {});
      await page.waitForTimeout(200);
      await page.click(by.action("open-spickzettel")).catch(() => {});
      const szRow = await page.waitForSelector('[data-action="sz-show"]', { timeout: 4000 }).catch(() => null);
      if (szRow) {
        await szRow.click();
        const modal = await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 4000 }).then(() => true).catch(() => false);
        check("Fokus-Trap: Modal öffnet (aria-modal)", modal);
        if (modal) {
          for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
          check("Fokus-Trap: Tab bleibt im Modal",
            await page.evaluate(() => { const m = document.querySelector('[role="dialog"][aria-modal="true"]'); return !!(m && m.contains(document.activeElement)); }));
          await page.keyboard.press("Escape");
          check("Fokus-Trap: Escape schließt Modal",
            await page.waitForFunction(() => !document.querySelector('[role="dialog"][aria-modal="true"]'), { timeout: 3000 }).then(() => true).catch(() => false));
        }
      } else {
        check("Fokus-Trap: Modal-Auslöser gefunden", false, "kein sz-show erreichbar");
      }
      await ctx.close();
    }

    // ----- Discover-Menü -----
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "A11y" } });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.tab("entdecken"));
      await page.waitForTimeout(200);
      check("Discover-Menü öffnet (Öffner sichtbar)",
        await page.evaluate(() => document.querySelectorAll('[data-action^="open-"]').length >= 5));
      check("Suche/A11y: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
