#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-install-prompt.mjs — Blackbox-E2E des Install-to-Homescreen.
 *
 * Chromium feuert `beforeinstallprompt` in Playwright nicht nativ — das Event wird
 * synthetisch dispatcht (mit gemocktem `.prompt()`), wie ein echter Android-Browser
 * es täte. iOS bekommt stattdessen Instruktionen (kein natives Prompt-Event dort).
 *   node scripts/e2e/suites/p1-install-prompt.mjs
 */
import { startServer, newPage, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

await process.exit(await runSuite("Install-Prompt", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base;

  try {
    // ----- Android-artig: synthetisches beforeinstallprompt -----
    {
      const { ctx, page, errs } = await newPage(browser, { seed: { name: "Ins" } });
      await page.addInitScript(() => {
        window.__installPromptCalls = 0;
        const ev = new Event("beforeinstallprompt", { cancelable: true });
        ev.prompt = () => { window.__installPromptCalls++; return Promise.resolve(); };
        ev.userChoice = Promise.resolve({ outcome: "accepted" });
        window.addEventListener("load", () => window.dispatchEvent(ev), { once: true });
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      // Der Install-Button lebt im Profil-Tab (installcard), nicht auf der Home.
      await page.click(by.tab("profil")).catch(() => {});
      await page.waitForTimeout(200);

      const installBtn = await page.$(by.action("install-app"));
      check("Install-Button erscheint nach beforeinstallprompt (Profil-Tab)", !!installBtn);
      if (installBtn) {
        await installBtn.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(200);
        const calls = await page.evaluate(() => window.__installPromptCalls || 0);
        check("Install-Button ruft prompt() auf", calls >= 1, `calls=${calls}`);
      }
      check("Install-Prompt (Android): keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ----- iOS-artig: UA-Spoof, kein natives Event → Instruktionen statt Button -----
    {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      });
      const page = await ctx.newPage();
      const errs = [];
      page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
      await page.addInitScript(() => localStorage.setItem("spanischcard.settings.v1",
        JSON.stringify({ mode: "flip", onboarded: true, name: "Ins", uiLang: "de", dir: "de2es" })));
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);

      const iosInfo = await page.evaluate(() => {
        const txt = (document.getElementById("app") || {}).innerText || "";
        return { hasInstallBtn: !!document.querySelector('[data-action="install-app"]'), mentionsShare: /teilen|share|start.?bildschirm|home.?screen/i.test(txt) };
      });
      check("iOS: kein natives Install-Prompt-Button ohne Event", !iosInfo.hasInstallBtn);
      check("Install-Prompt (iOS): keine App-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
