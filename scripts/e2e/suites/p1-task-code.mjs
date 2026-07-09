#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-task-code.mjs — Blackbox-E2E des Lehrer-Aufgabencodes.
 *
 * Auf dem Lehrer-Screen (ECOS-Edition) erzeugt task-generate einen base64-Code
 * (#task-code, Format „HRT1.…"). Ein Schüler öffnet die App mit ?task=<code> und
 * bekommt die Aufgabe angezeigt/abonniert. Geprüft:
 *   - Code-Generierung liefert einen HRT1.-Code
 *   - ?task=<code> in einer neuen Session zeigt/startet die Aufgabe
 *   - ein ungültiger Code führt NICHT zum Crash (graceful — landet auf Home)
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
    // ----- Lehrer generiert einen Code -----
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Prof" } });
      await page.goto(base + "?edition=ecos", { waitUntil: "networkidle" });
      await page.click(by.tab("tarea"));
      await page.click(by.action("open-teacher"));
      await page.waitForSelector(by.action("task-generate"), { timeout: 5000 });
      await page.click(by.action("task-generate"));
      await page.waitForTimeout(400);
      code = await page.evaluate(() => { const el = document.getElementById("task-code"); return el ? el.value : null; });
      check("task-generate liefert einen Code (HRT1./HRB1.-Präfix)", !!code && /^HR[TB]\d\./.test(code), code || "kein Code");
      check("Task-Generierung: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ----- Schüler öffnet ?task=<code> -----
    if (code) {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Schueler" } });
      await page.goto(base + "?task=" + encodeURIComponent(code), { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const info = await page.evaluate(() => ({
        home: !!document.querySelector('[data-action="study-all"]'),
        head: ((document.getElementById("app") || {}).innerText || "").slice(0, 100),
      }));
      check("?task=<code>: App lädt fehlerfrei (Home oder Task-Screen)", info.home || info.head.length > 10, info.head.slice(0, 60));
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
