#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-placement.mjs — Blackbox-E2E des Ruta-Checks (Placement).
 *
 * Der HolaRuta-Check (14 Fragen) verortet Neunutzer auf A0–B1. Flow (entdeckt):
 * open-placement → placement-start → je Frage placement-choose / placement-unknown
 * → Ergebnis-Screen mit Level. Geprüft:
 *   - Intro + Start, dann Fragezähler „Frage n von 14"
 *   - alle Fragen lassen sich beantworten (Loop bis Ergebnis)
 *   - Ergebnis nennt ein CEFR-Level (A0/A1/A2/B1)
 *   - das ermittelte Level wird persistiert (übersteht Reload)
 *
 *   node scripts/e2e/suites/p1-placement.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

const GAMESTATS_KEY = "spanischcard.gamestats.v1";
const appText = (page) => page.evaluate(() => ((document.getElementById("app") || {}).innerText || ""));
const LEVEL_RE = /\b(A0|A1|A2|B1)\b/;

// Placement-Level wird in gamestats.v1 unter .placement.level persistiert (store.js).
const persistedLevel = (page) => page.evaluate((k) => {
  try {
    const gs = JSON.parse(localStorage.getItem(k) || "{}");
    return (gs.placement && gs.placement.level) || "";
  } catch { return ""; }
}, GAMESTATS_KEY);

await process.exit(await runSuite("Ruta-Check (Placement)", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { mode: "flip", name: "Chk" } });
    await page.goto(base, { waitUntil: "networkidle" });

    await page.click(by.action("open-placement"));
    await page.waitForSelector(by.action("placement-start"), { timeout: 5000 });
    const introText = await appText(page);
    check("Ruta-Check-Intro sichtbar (14 Fragen)", /14/.test(introText), introText.slice(0, 80));

    await page.click(by.action("placement-start"));
    await page.waitForTimeout(300);
    const q1 = await appText(page);
    check("Erste Frage erscheint (Fragezähler)", /Frage\s*1\s*von\s*14|1\s*\/\s*14|1 von 14/i.test(q1), q1.slice(0, 60));

    // Fragen durchbeantworten: je Frage die erste Antwort wählen (placement-choose),
    // sonst „weiß nicht" (placement-unknown). Deckel großzügig über 14.
    let answered = 0, reachedResult = false;
    for (let i = 0; i < 20; i++) {
      const choose = await page.$(by.action("placement-choose"));
      const unknown = await page.$(by.action("placement-unknown"));
      if (!choose && !unknown) { reachedResult = true; break; }
      if (choose) await choose.click().catch(() => {});
      else await unknown.click().catch(() => {});
      answered++;
      await page.waitForTimeout(130);
    }
    check("Alle Fragen beantwortbar (Loop endet am Ergebnis)", reachedResult && answered >= 14, `beantwortet=${answered} ergebnis=${reachedResult}`);

    const resultText = await appText(page);
    check("Ergebnis nennt ein CEFR-Level (A0/A1/A2/B1)", LEVEL_RE.test(resultText), resultText.slice(0, 100));

    // Persistenz: Level übersteht Reload.
    const lvlLive = (resultText.match(LEVEL_RE) || [])[0] || "";
    await page.goto(base, { waitUntil: "networkidle" });
    const lvlPersist = await persistedLevel(page);
    check("Ermitteltes Level wird persistiert", !!lvlPersist, `live=${lvlLive} persist="${lvlPersist}"`);

    check("Placement: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
