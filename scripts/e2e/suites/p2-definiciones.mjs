#!/usr/bin/env node
/*
 * scripts/e2e/suites/p2-definiciones.mjs — Blackbox-E2E des Definiciones-Quiz.
 * Flow: open-quiz-setup → start-quiz → je Frage quiz-answer („Frage n/m").
 *   node scripts/e2e/suites/p2-definiciones.mjs
 */
import { startServer, newPage, appErrs, runSuite, targetRoot } from "../lib/harness.mjs";
import { openGame, readProgress, playByAction } from "../lib/games.mjs";

await process.exit(await runSuite("Definiciones", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Def" } });
    await openGame(page, srv.base, { opener: "open-quiz-setup", start: "start-quiz" });

    const p0 = await readProgress(page);
    check("Quiz gestartet (Fragezähler sichtbar)", !!p0 && p0.total >= 2, JSON.stringify(p0));

    const res = await playByAction(page, ["quiz-answer", "quiz-next"], { maxSteps: 40 });
    check("Quiz schreitet voran (Fragezähler steigt)", res.progressed, JSON.stringify(res));
    check("Quiz erreicht das Ende", res.reachedEnd, JSON.stringify(res));
    check("Definiciones: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
