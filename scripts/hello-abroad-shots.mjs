/*
 * scripts/hello-abroad-shots.mjs – erzeugt die PWA-Manifest-Screenshots für die
 * HelloAbroad-Edition (DE-EN-Reiseenglisch), analog zu scripts/landing-shots.mjs.
 *
 * Fährt die ECHTE App in der Edition ?edition=hello-abroad (Track de-en: Frage
 * Deutsch, Antwort Englisch) in einem sauberen Handy-Viewport an und nimmt drei
 * Screens auf -> docs/screenshots/hello-abroad-{study,home,stats}.png. Exakt
 * 440×956 (deviceScaleFactor 1), damit sie den in manifest-hello-abroad.webmanifest
 * deklarierten sizes 1:1 entsprechen.
 *
 * Voraussetzung (dev-only, wie die übrigen e2e-Skripte – Playwright ist KEINE
 * Repo-Dependency): Chromium via Playwright verfügbar. Der Server wird über die
 * dependency-freie e2e-Harness (Node http) selbst gestartet.
 *
 *   node scripts/hello-abroad-shots.mjs
 *
 * Der Track de-en namespaced seine Storage-Keys (store.js): die App liest
 * spanischcard.de-en.settings.v1 – darum wird BEIDES geseedet (der unpräfixierte
 * Key nur für boot.js' Theme-Lesung vor config.js).
 */
import path from "node:path";
import { mkdirSync } from "node:fs";
import { startServer, loadPlaywright, ROOT } from "./e2e/lib/harness.mjs";

const OUT = path.join(ROOT, "docs", "screenshots");
mkdirSync(OUT, { recursive: true });

const SETTINGS = JSON.stringify({
  mode: "flip", onboarded: true, uiLang: "de", theme: "light", name: "",
});

async function newPhone(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 440, height: 956 },
    deviceScaleFactor: 1,          // Output-Pixel == Viewport == deklarierte size
    colorScheme: "light",
    reducedMotion: "reduce",       // Splash/Flip instant -> stabile Aufnahmen
  });
  await ctx.addInitScript((s) => {
    try {
      localStorage.setItem("spanischcard.settings.v1", s);         // boot.js (Theme)
      localStorage.setItem("spanischcard.de-en.settings.v1", s);   // App (Track de-en)
    } catch (e) {}
  }, SETTINGS);
  return ctx;
}

async function bootGone(page) {
  await page.waitForFunction(() => {
    const b = document.getElementById("boot");
    return !b || b.classList.contains("is-done") || b.classList.contains("is-hiding")
      || getComputedStyle(b).display === "none";
  }, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

const EDITION = "?edition=hello-abroad";

async function run() {
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch();
  const srv = await startServer(ROOT);

  try {
    // 1) Aufgedeckte Lernkarte: Frage Deutsch → Antwort Englisch.
    {
      const ctx = await newPhone(browser);
      const page = await ctx.newPage();
      await page.goto(srv.url + "index.html" + EDITION, { waitUntil: "domcontentloaded" });
      await bootGone(page);
      await page.click('[data-action="study-all"]');
      await page.waitForSelector("section.study", { timeout: 6000 });
      await page.click("#flip");
      await page.waitForSelector('.ratebar [data-action="rate"]', { state: "visible", timeout: 6000 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, "hello-abroad-study.png") });
      await ctx.close();
      console.log("✓ docs/screenshots/hello-abroad-study.png");
    }

    // 2) Themen-Kacheln (Lernen-Reiter): die 10 MVP-Reisebereiche.
    {
      const ctx = await newPhone(browser);
      const page = await ctx.newPage();
      await page.goto(srv.url + "index.html" + EDITION, { waitUntil: "domcontentloaded" });
      await bootGone(page);
      await page.click('[data-action="set-tab"][data-tab="lernen"]');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, "hello-abroad-home.png") });
      await ctx.close();
      console.log("✓ docs/screenshots/hello-abroad-home.png");
    }

    // 3) Statistik mit echten Zahlen: erst ein paar Karten bewerten, dann öffnen.
    {
      const ctx = await newPhone(browser);
      const page = await ctx.newPage();
      await page.goto(srv.url + "index.html" + EDITION, { waitUntil: "domcontentloaded" });
      await bootGone(page);
      await page.click('[data-action="study-all"]');
      await page.waitForSelector("section.study", { timeout: 6000 });
      const ratings = ["good", "good", "easy", "again", "good", "easy", "good", "again", "good", "good"];
      for (const r of ratings) {
        const flip = await page.$("#flip");
        if (flip) {
          const open = await page.locator('.ratebar [data-action="rate"]').first().isVisible().catch(() => false);
          if (!open) { await flip.click().catch(() => {}); await page.waitForTimeout(140); }
        }
        const btn = await page.$(`.ratebar [data-action="rate"][data-rating="${r}"]`);
        if (btn) { await btn.click().catch(() => {}); await page.waitForTimeout(150); }
        else break;
      }
      const home = await page.$('[data-action="home"]');
      if (home) { await home.click().catch(() => {}); await page.waitForTimeout(250); }
      await page.click('[data-action="set-tab"][data-tab="profil"]');
      await page.waitForTimeout(250);
      await page.click('[data-action="open-stats"]');
      await page.waitForSelector(".kpis", { timeout: 6000 });
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(OUT, "hello-abroad-stats.png") });
      await ctx.close();
      console.log("✓ docs/screenshots/hello-abroad-stats.png");
    }
  } finally {
    await srv.close();
    await browser.close();
  }
}

run().catch((e) => { console.error("✗ hello-abroad-shots fehlgeschlagen:", e.message); process.exit(1); });
