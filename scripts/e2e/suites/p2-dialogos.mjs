#!/usr/bin/env node
/*
 * scripts/e2e/suites/p2-dialogos.mjs — Blackbox-E2E des Diálogos-Spiels.
 * Flow (entdeckt): open-dialogos → start-dialogos → je Schritt dialogos-next
 * („Schritt n von m"). Invariante Assertions (nicht-deterministisch).
 *   node scripts/e2e/suites/p2-dialogos.mjs
 */
import { startServer, newPage, appErrs, runSuite, targetRoot } from "../lib/harness.mjs";
import { openGame, readProgress, playByAction } from "../lib/games.mjs";

await process.exit(await runSuite("Diálogos", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  try {
    const { ctx, page, errs } = await newPage(browser, { seed: { name: "Dia" } });
    await openGame(page, srv.base, { opener: "open-dialogos", start: "start-dialogos" });

    const p0 = await readProgress(page);
    check("Runde gestartet (Schritt-Zähler sichtbar)", !!p0 && p0.total >= 2, JSON.stringify(p0));

    const res = await playByAction(page, ["dialogos-next"], { maxSteps: 30 });
    check("Gespräch schreitet voran (Schrittzähler steigt)", res.progressed, JSON.stringify(res));
    check("Gespräch erreicht das Ende (keine weitere Aktion)", res.reachedEnd, JSON.stringify(res));
    check("Diálogos: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
