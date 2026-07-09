#!/usr/bin/env node
/*
 * scripts/e2e/suites/p0-edition-switch.mjs — Blackbox-E2E des Edition-Switch.
 *
 * Editionen werden per URL-Parameter ?edition=<id> aktiviert (nicht in localStorage
 * persistiert — sie sind URL-getrieben). Geprüft wird pro Edition:
 *   - eigenes Branding (window.SC.config.brandName trägt den Edition-Suffix)
 *   - Home rendert fehlerfrei (kein pageerror)
 *   - ohne Parameter greift die Default-Marke „HolaRuta" (kein Suffix)
 *
 *   node scripts/e2e/suites/p0-edition-switch.mjs
 */
import { startServer, newPage, appErrs, runSuite, targetRoot } from "../lib/harness.mjs";

// Edition-ID → erwarteter Marken-Suffix (aus editions/registry.js, beobachtbar via brandName).
const EDITIONS = [
  { id: "ecos", brand: /ECOS/, trait: "teacherTab" },
  { id: "hostel", brand: /Hostel/ },
  { id: "weroad", brand: /WeRoad/ },
  { id: "ingles-pro", brand: /Inglés/, track: "es-en" },
  { id: "medellin", brand: /Medellín/ },
];

await process.exit(await runSuite("Edition-Switch", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());

  try {
    // Default (ohne ?edition): reine Marke „HolaRuta", kein Suffix.
    {
      const { ctx, page, errs } = await newPage(browser, { seed: {} });
      await page.goto(srv.base, { waitUntil: "networkidle" });
      const brand = await page.evaluate(() => (window.SC && window.SC.config && window.SC.config.brandName) || "");
      check("Default: Marke ohne Edition-Suffix", /^HolaRuta\s*$/.test(brand) || brand === "HolaRuta", `brand="${brand}"`);
      check("Default: Home rendert (#app gefüllt)",
        await page.evaluate(() => { const a = document.getElementById("app"); return !!a && a.innerHTML.trim().length > 200; }));
      check("Default: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // Je Edition: Branding + Home + edition-spezifisches Merkmal.
    for (const ed of EDITIONS) {
      const { ctx, page, errs } = await newPage(browser, { seed: {} });
      await page.goto(srv.base + "?edition=" + ed.id, { waitUntil: "networkidle" });
      const cfg = await page.evaluate(() => ({
        brand: (window.SC && window.SC.config && window.SC.config.brandName) || "",
        teacherTab: !!(window.SC && window.SC.config && window.SC.config.teacherTab),
        track: (window.SC && window.SC.track && window.SC.track.id && window.SC.track.id()) || "",
      }));
      check(`${ed.id}: Branding trägt Edition-Marke`, ed.brand.test(cfg.brand), `brand="${cfg.brand}"`);
      check(`${ed.id}: Home rendert fehlerfrei`,
        await page.evaluate(() => { const a = document.getElementById("app"); return !!a && a.innerHTML.trim().length > 200; }));
      if (ed.trait === "teacherTab") check(`${ed.id}: teacherTab aktiv`, cfg.teacherTab, `teacherTab=${cfg.teacherTab}`);
      if (ed.track) check(`${ed.id}: Track = ${ed.track}`, cfg.track === ed.track, `track="${cfg.track}"`);
      check(`${ed.id}: keine App-Fehler`, appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
