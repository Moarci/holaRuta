#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-deeplinks.mjs — Blackbox-E2E der URL-Deep-Links.
 *
 * Die Homescreen-Shortcuts aus manifest.webmanifest verlinken feste ?a=/?m=-Query-
 * Parameter. Geprüft: jeder Shortcut-Link lädt die App fehlerfrei; ?start=onboarding
 * erzwingt den Onboarding-Flow. Die Shortcut-Liste wird zur Laufzeit aus dem
 * Manifest gelesen (kein Hardcoding) — driftet die App, driftet der Test mit.
 *
 *   node scripts/e2e/suites/p1-deeplinks.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { startServer, newPage, appErrs, runSuite, targetRoot, ROOT, DIST } from "../lib/harness.mjs";

function readShortcuts(root) {
  const fp = path.join(root, "manifest.webmanifest");
  if (!fs.existsSync(fp)) return [];
  const m = JSON.parse(fs.readFileSync(fp, "utf8"));
  return m.shortcuts || [];
}

await process.exit(await runSuite("Deep-Links (Shortcuts)", async ({ browser, suite }) => {
  const { check } = suite;
  const root = targetRoot();
  const srv = await startServer(root);
  const base = srv.base;
  const manifestRoot = root === DIST ? DIST : ROOT;
  const shortcuts = readShortcuts(manifestRoot);

  try {
    check("manifest.webmanifest listet Homescreen-Shortcuts", shortcuts.length >= 3, `count=${shortcuts.length}`);

    for (const s of shortcuts) {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Dl" } });
      // Shortcut-URLs sind relativ zum Manifest ("./?a=…"); an unseren Server binden.
      const rel = (s.url || "").replace(/^\.?\//, "");
      const resp = await page.goto(srv.url + rel, { waitUntil: "networkidle" }).catch(() => null);
      const scOk = await page.evaluate(() => !!(window.SC && window.SC.app));
      check(`Shortcut "${s.name}" (${s.url}) lädt fehlerfrei`, !!resp && resp.ok() && scOk, `status=${resp ? resp.status() : "?"}`);
      check(`Shortcut "${s.name}": keine App-Fehler`, appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ?start=onboarding erzwingt den Carousel-Flow, auch onboarded.
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Dl" } });
      await page.goto(base + "?start=onboarding", { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      check("?start=onboarding zeigt den Onboarding-Flow",
        await page.evaluate(() => !!document.querySelector('[data-action="onboard-slide-next"], [data-action="onboard-slide-go"]')));
      check("?start=onboarding: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
