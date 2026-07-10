#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-task-code.mjs — Blackbox-E2E des Lehrer-Aufgabencodes.
 *
 * Codes werden über das Aufgaben-Studio (features/composer.js) erzeugt, NICHT
 * mehr über das alte task-generate/#task-code-Formular (das PR #253 „Aufgaben-
 * Studio" ersetzt hat). Flow: Lehrer-Screen (ECOS) → open-composer → Vorlage
 * wählen (composer-bundle) → composer-next ×2 → Code-Box aufklappen
 * (.cmp-codebox summary) → Textarea .cmp-codebox .task-code (readonly, .value)
 * enthält den Code, Präfix „HRB1." für ein Paket. Ein Schüler öffnet ?task=<code>
 * und bekommt die enthaltenen Aufgaben abonniert (Tarea-Tab, .task-item).
 *
 *   node scripts/e2e/suites/p1-task-code.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

await process.exit(await runSuite("Aufgaben-Code (Task)", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;
  let code = null;

  try {
    // ----- Lehrer erzeugt über das Aufgaben-Studio ein Paket -----
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Prof" } });
      await page.goto(base + "?edition=ecos", { waitUntil: "networkidle" });
      await page.click(by.tab("tarea"));
      await page.click(by.action("open-teacher"));
      await page.waitForSelector(by.action("open-composer"), { timeout: 5000 });
      await page.click(by.action("open-composer"));
      await page.waitForSelector(".cmp-steps", { timeout: 5000 });

      // Schritt 1: eine Vorlage wählt automatisch mehrere Ziele. „restaurant" liegt
      // in einer standardmäßig OFFENEN Gruppe (composer.js: ui.groups.situation=true) —
      // anders als z. B. die Länder-Vorlagen unter „destino", die eingeklappt starten
      // (ui.groups.destino=false) und daher hier bewusst NICHT anklickbar sein sollen.
      const bundle = await page.$('[data-action="composer-bundle"][data-bundle="restaurant"]');
      check("Aufgaben-Studio: Vorlage im Katalog vorhanden", !!bundle);
      if (bundle) await bundle.click();
      await page.waitForTimeout(200);
      const nextEnabled = await page.evaluate(() => { const b = document.querySelector(".cmp-nextbtn"); return !!b && !b.disabled; });
      check("Vorlage wählt Ziele (Weiter freigeschaltet)", nextEnabled);

      // Schritt 2 → Schritt 3 (Teilen).
      await page.click(by.action("composer-next"));
      await page.waitForSelector(".cmp-sels", { timeout: 5000 });
      await page.click(by.action("composer-next"));
      await page.waitForSelector(".cmp-ready", { timeout: 5000 });

      await page.click(".cmp-codebox summary");
      code = await page.$eval(".cmp-codebox .task-code", (el) => el.value.trim()).catch(() => null);
      check("Aufgaben-Studio liefert einen Code (HRT1./HRB1.-Präfix)", !!code && /^HR[TB]\d\./.test(code), code || "kein Code");
      check("Aufgaben-Studio: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ----- Schüler öffnet ?task=<code> und bekommt die Aufgaben abonniert -----
    if (code) {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Schueler" } });
      await page.goto(base + "?edition=ecos&task=" + encodeURIComponent(code), { waitUntil: "networkidle" });
      await page.click(by.tab("tarea"));
      const hasTask = await page.waitForSelector(".task-item", { timeout: 5000 }).then(() => true).catch(() => false);
      check("?task=<code>: Aufgabe(n) im Tarea-Tab abonniert", hasTask);
      check("?task=<code>: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ----- Ungültiger Code: graceful, kein Crash -----
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Bad" } });
      await page.goto(base + "?task=INVALID-NOT-A-REAL-CODE", { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      check("Ungültiger Task-Code landet auf der Home (kein Crash)",
        await page.evaluate(() => !!document.querySelector('[data-action="study-all"]')));
      check("Ungültiger Task-Code: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
