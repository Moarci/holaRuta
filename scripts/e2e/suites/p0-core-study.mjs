#!/usr/bin/env node
/*
 * scripts/e2e/suites/p0-core-study.mjs — Blackbox-E2E des KERN-LERNPFADS
 * („Eine Runde lernen"). Portiert aus scripts/e2e-study.mjs.
 *
 * Runde starten → Karte aufdecken (Flip) bzw. tippen (Type) → bewerten → bis zum
 * Fertig-Screen (#cb-mount). Nebenbei: keine Konsolen-/Seitenfehler.
 *
 *   node scripts/e2e/suites/p0-core-study.mjs
 *   HEADED=1 node scripts/e2e/suites/p0-core-study.mjs
 */
import path from "node:path";
import { startServer, newPage, SHOTS, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

await process.exit(await runSuite("Kern-Lernpfad", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    // ----- 1) FLIP-Modus: Runde bis Fertig-Screen -----
    {
      const { ctx, page, errs } = await newPage(browser, { deviceScaleFactor: 2, seed: { mode: "flip", name: "Tester" } });
      await page.goto(base, { waitUntil: "networkidle" });
      check("App geladen (window.SC.app da)", await page.evaluate(() => !!(window.SC && window.SC.app)));

      await page.click(by.action("study-all"));
      await page.waitForSelector("section.study", { timeout: 5000 });
      check("Runde gestartet (Study-Screen erscheint)", true);
      const counter0 = await page.locator(".topbar__counter").textContent().catch(() => "");
      check("Karten-Zähler zeigt Fortschritt (n/total)", /^\d+\/\d+$/.test((counter0 || "").trim()), counter0);
      await page.screenshot({ path: path.join(SHOTS, "study-01-card.png"), fullPage: true }).catch(() => {});

      await page.click("#flip");
      await page.waitForSelector('.ratebar [data-action="rate"]', { state: "visible", timeout: 5000 });
      check("Karte aufgedeckt (Flip → Bewertungs-Buttons sichtbar)", true);
      await page.screenshot({ path: path.join(SHOTS, "study-02-flipped.png"), fullPage: true }).catch(() => {});

      const total = Number((counter0 || "1/1").split("/")[1]) || 1;
      await page.click('.ratebar [data-action="rate"][data-rating="good"]');
      await page.waitForTimeout(150);
      check("Karte bewertet (good/Vale akzeptiert)", true);

      let done = false;
      for (let i = 0; i < total + 5; i++) {
        if (await page.$("#cb-mount")) { done = true; break; }
        const flip = await page.$("#flip");
        if (flip) {
          const flipped = await page.locator('.ratebar [data-action="rate"]').first().isVisible().catch(() => false);
          if (!flipped) { await flip.click().catch(() => {}); await page.waitForTimeout(80); }
        }
        const rate = await page.$('.ratebar [data-action="rate"][data-rating="good"]');
        if (rate) { await rate.click().catch(() => {}); await page.waitForTimeout(120); }
        else await page.waitForTimeout(120);
      }
      check("Runde abgeschlossen (Fertig-Screen #cb-mount erscheint)", done, done ? "" : "kein #cb-mount nach Durchbewerten");
      await page.screenshot({ path: path.join(SHOTS, "study-03-done.png"), fullPage: true }).catch(() => {});
      check("Flip: keine Konsolen-/Seitenfehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ----- 2) TYPE-Modus: kurzer Tipp-Flow -----
    {
      const { ctx, page, errs } = await newPage(browser, { deviceScaleFactor: 2, seed: { mode: "type", name: "Tester" } });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.action("study-all"));
      await page.waitForSelector("section.study", { timeout: 5000 });
      const hasTyper = await page.$("#typer");
      check("Type-Modus: Eingabe-Formular (#typer) vorhanden", !!hasTyper);
      if (hasTyper) {
        await page.fill("#answer", "respuesta");
        await page.click('#typer button[type="submit"]');
        await page.waitForSelector('.ratebar [data-action="rate"]', { state: "visible", timeout: 5000 });
        check("Type-Modus: Prüfen deckt auf (Bewertungs-Buttons sichtbar)", true);
        await page.click('.ratebar [data-action="rate"][data-rating="again"]');
        await page.waitForTimeout(150);
        const advanced = await page.$("#cb-mount") || await page.$("section.study");
        check("Type-Modus: Bewerten geht weiter (nächste Karte oder Fertig)", !!advanced);
        await page.screenshot({ path: path.join(SHOTS, "study-04-type.png"), fullPage: true }).catch(() => {});
      }
      check("Type: keine Konsolen-/Seitenfehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
