#!/usr/bin/env node
/*
 * scripts/e2e/suites/p0-onboarding.mjs — Blackbox-E2E des First-Run-Onboardings.
 *
 * Onboarding-Blocker sind P0: kommt ein Neunutzer nicht durch, ist alles andere egal.
 * Flow (entdeckt): Intro-Carousel (onboard-slide-next/go/skip) → Profil-Step
 * (#onboard-name, set-gender, Form-Submit) → Reiseziel-Step (save-trip/skip-onboarding)
 * → Ruta-Check (placement-start/placement-skip) → Home.
 * Geprüft:
 *   - First-Run zeigt das Carousel (nicht die Home)
 *   - Durchklicken bis Profil; Name+Gender werden akzeptiert → Reiseziel-Step
 *   - Reiseziel überspringen setzt onboarded=true und führt zum Ruta-Check
 *   - Ruta-Check überspringen landet auf der Home
 *   - nach Abschluss + Reload: Home (nicht erneut im Onboarding)
 *   - „Überspringen" im Carousel führt aus dem Carousel heraus
 *   - ?start=onboarding erzwingt den Flow erneut (auch wenn schon onboarded)
 *
 *   node scripts/e2e/suites/p0-onboarding.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot, SETTINGS_KEY } from "../lib/harness.mjs";

const isOnboarded = (page) => page.evaluate((k) => { try { return (JSON.parse(localStorage.getItem(k) || "{}")).onboarded === true; } catch { return false; } }, SETTINGS_KEY);
const onHome = (page) => page.evaluate(() => !!document.querySelector('[data-action="study-all"]'));
const inCarousel = (page) => page.evaluate(() => !!document.querySelector('[data-action="onboard-slide-next"], [data-action="onboard-slide-go"]'));

// Vom Carousel bis zum Profil-Step klicken (max. Slides begrenzt).
async function advanceToProfile(page) {
  for (let i = 0; i < 10; i++) {
    if (await page.$("#onboard-name")) return true;
    const next = await page.$('[data-action="onboard-slide-next"]');
    const go = await page.$('[data-action="onboard-slide-go"]');
    if (next) { await next.click().catch(() => {}); }
    else if (go) { await go.click().catch(() => {}); }
    else break;
    await page.waitForTimeout(200);
  }
  return !!(await page.$("#onboard-name"));
}

await process.exit(await runSuite("Onboarding (First-Run)", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    // ----- 1) Kompletter Durchlauf: Carousel → Profil → Reiseziel → Ruta-Check → Home -----
    {
      const { ctx, page, errs } = await newPage(browser, { seed: null }); // echter First-Run
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      check("First-Run zeigt Intro-Carousel", await inCarousel(page));
      check("First-Run: noch NICHT onboarded", !(await isOnboarded(page)));
      check("First-Run: Home-CTA noch nicht sichtbar", !(await onHome(page)));

      // Carousel → Profil-Step.
      const reachedProfile = await advanceToProfile(page);
      check("Carousel führt zum Profil-Step (#onboard-name)", reachedProfile);

      // Profil: Name + Gender, dann Form absenden (submit-Button, kein Klick auf die Form).
      await page.fill("#onboard-name", "Neu");
      await page.click(by.action("set-gender"));
      await page.click('form[data-action="onboard-profile-next"] button[type="submit"]');
      await page.waitForTimeout(400);
      const onTripStep = await page.evaluate(() => !!document.querySelector('[data-action="save-trip"], [data-action="skip-onboarding"]'));
      check("Profil akzeptiert (Name+Gender) → Reiseziel-Step", onTripStep);

      // Reiseziel überspringen → onboarded=true, Ruta-Check erscheint.
      await page.click(by.action("skip-onboarding"));
      await page.waitForTimeout(500);
      check("Reiseziel-Skip setzt onboarded=true", await isOnboarded(page));
      const onPlacement = await page.evaluate(() => !!document.querySelector('[data-action="placement-start"], [data-action="placement-skip"]'));
      check("Nach Onboarding: Ruta-Check angeboten", onPlacement);

      // Ruta-Check überspringen → Home.
      if (onPlacement) {
        await page.click(by.action("placement-skip")).catch(() => {});
        await page.waitForTimeout(400);
      }
      check("Ruta-Check-Skip landet auf der Home (study-all sichtbar)",
        await page.waitForSelector(by.action("study-all"), { timeout: 5000 }).then(() => true).catch(() => false));

      // Reload → bleibt auf Home (kein erneutes Onboarding).
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(200);
      check("Nach Reload: Home (kein erneutes Onboarding)", (await onHome(page)) && !(await inCarousel(page)));
      check("Onboarding: keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ----- 2) Skip-Pfad schließt das Onboarding ab -----
    {
      const { ctx, page } = await newPage(browser, { seed: null });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      const skip = await page.$(by.action("onboard-slide-skip"));
      check("Skip-Button im Carousel vorhanden", !!skip);
      if (skip) {
        await skip.click().catch(() => {});
        await page.waitForTimeout(400);
        // Skip kann direkt abschließen ODER zum Profil-Step springen — beides ist ok,
        // solange man ohne Carousel weiterkommt bzw. onboarded wird.
        const done = (await isOnboarded(page)) || (await onHome(page)) || !!(await page.$("#onboard-name"));
        check("Skip führt aus dem Carousel heraus", done);
      }
      await ctx.close();
    }

    // ----- 3) ?start=onboarding erzwingt den Flow erneut -----
    {
      const { ctx, page } = await newPage(browser, { seed: { name: "Alt" } }); // bereits onboarded
      await page.goto(base + "?start=onboarding", { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      check("?start=onboarding erzwingt Onboarding trotz onboarded", await inCarousel(page));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
