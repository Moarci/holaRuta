#!/usr/bin/env node
/*
 * scripts/e2e/suites/p2-yesto.mjs — Blackbox-E2E von „¿Y esto?" (Bild-RateN).
 * Flow: open-yesto → start-yesto → je Bild yesto-reveal (Countdown „1/8" …).
 *   node scripts/e2e/suites/p2-yesto.mjs
 */
import { startServer, newPage, appErrs, runSuite, targetRoot } from "../lib/harness.mjs";
import { openGame, readProgress, playByAction } from "../lib/games.mjs";

await process.exit(await runSuite("¿Y esto?", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Yes" } });
    await openGame(page, srv.base, { opener: "open-yesto", start: "start-yesto" });

    const p0 = await readProgress(page);
    check("Runde gestartet (Bild-Zähler sichtbar)", !!p0 && p0.total >= 2, JSON.stringify(p0));

    // yesto-reveal deckt auf → yesto-rate (Selbsteinschätzung) → nächstes Bild.
    const res = await playByAction(page, ["yesto-reveal", "yesto-rate"], { maxSteps: 30, settle: 180 });
    check("Runde schreitet voran (Bild-Zähler steigt)", res.progressed, JSON.stringify(res));
    check("Runde erreicht das Ende", res.reachedEnd, JSON.stringify(res));
    check("¿Y esto?: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
