#!/usr/bin/env node
/*
 * scripts/e2e/suites/p2-frases.mjs — Blackbox-E2E von „Frases flexibles".
 * Flow: open-frases → start-frases → je Satz frases-answer (Wort-Chips, „Satz n/m").
 *   node scripts/e2e/suites/p2-frases.mjs
 */
import { startServer, newPage, appErrs, runSuite, targetRoot } from "../lib/harness.mjs";
import { openGame, readProgress, playByAction } from "../lib/games.mjs";

await process.exit(await runSuite("Frases flexibles", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Fra" } });
    await openGame(page, srv.base, { opener: "open-frases", start: "start-frases" });

    const p0 = await readProgress(page);
    check("Runde gestartet (Satz-Zähler sichtbar)", !!p0 && p0.total >= 2, JSON.stringify(p0));

    // Wort-Chips (frases-answer) füllen die Lücke; danach nächster Satz.
    const res = await playByAction(page, ["frases-answer", "frases-next", "frases-continue"], { maxSteps: 40, settle: 140 });
    check("Runde schreitet voran (Satz-Zähler steigt)", res.progressed, JSON.stringify(res));
    check("Frases: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
