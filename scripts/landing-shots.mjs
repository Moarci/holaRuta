/*
 * scripts/landing-shots.mjs – erzeugt FRISCHE, konsistente App-Screenshots für
 * die Landing-Page (landing.html, Abschnitt „So funktioniert's").
 *
 * Fährt die echte App in einem sauberen Handy-Viewport an und nimmt drei Screens
 * auf -> docs/landing/{home,study,stats}.png. Navigations-Muster & Selektoren
 * stammen aus scripts/e2e/suites/p0-core-study.mjs (bewährt) und ui.js.
 *
 * Voraussetzungen (dev-only, wie die übrigen e2e-Skripte – Playwright ist KEINE
 * Repo-Dependency):
 *   npx --yes serve -l 3000 .        # statischer Server im Projektordner
 *   npm install --no-save playwright@1.56.1 && npx playwright install chromium
 *   node scripts/landing-shots.mjs   # optional: BASE=http://localhost:3000
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = path.join(process.cwd(), "docs", "landing");
mkdirSync(OUT, { recursive: true });

// Einstellungen vor dem ersten Paint setzen: Flip-Modus, DE→ES, Onboarding aus,
// helles Theme. So sieht die Karte deterministisch aus (terrakotta = spanische
// Antwort) und kein Onboarding-Overlay stört.
const SETTINGS = JSON.stringify({
  mode: "flip", dir: "de2es", onboarded: true, uiLang: "de", theme: "light", name: "",
});

async function newPhone(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    colorScheme: "light",
    reducedMotion: "reduce", // Splash/Flip instant -> stabile Aufnahmen
  });
  await ctx.addInitScript((s) => {
    try { localStorage.setItem("spanischcard.settings.v1", s); } catch (e) {}
  }, SETTINGS);
  return ctx;
}

// Wartet, bis der Boot-Splash weg ist (Muster aus p0-boot-verify.mjs).
async function bootGone(page) {
  await page.waitForFunction(() => {
    const b = document.getElementById("boot");
    return !b || b.classList.contains("is-done") || b.classList.contains("is-hiding")
      || getComputedStyle(b).display === "none";
  }, { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(350); // Fonts/Render setzen
}

async function run() {
  const browser = await chromium.launch();

  // 1) Themen-Kacheln (Lernen-Reiter)
  {
    const ctx = await newPhone(browser);
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });
    await bootGone(page);
    await page.click('[data-action="set-tab"][data-tab="lernen"]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, "home.png") });
    await ctx.close();
    console.log("✓ docs/landing/home.png");
  }

  // 2) Aufgedeckte Lernkarte (Flip-Modus)
  {
    const ctx = await newPhone(browser);
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });
    await bootGone(page);
    await page.click('[data-action="study-all"]');
    await page.waitForSelector("section.study", { timeout: 5000 });
    await page.click("#flip");
    await page.waitForSelector('.ratebar [data-action="rate"]', { state: "visible", timeout: 5000 });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, "study.png") });
    await ctx.close();
    console.log("✓ docs/landing/study.png");
  }

  // 3) Statistik mit echten Zahlen: erst ein paar Karten bewerten, dann öffnen.
  {
    const ctx = await newPhone(browser);
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });
    await bootGone(page);
    await page.click('[data-action="study-all"]');
    await page.waitForSelector("section.study", { timeout: 5000 });
    const ratings = ["good", "good", "easy", "again", "good", "easy", "good", "again", "good", "good"];
    for (const r of ratings) {
      const flip = await page.$("#flip");
      if (flip) {
        const open = await page.locator('.ratebar [data-action="rate"]').first().isVisible().catch(() => false);
        if (!open) { await flip.click().catch(() => {}); await page.waitForTimeout(120); }
      }
      const btn = await page.$(`.ratebar [data-action="rate"][data-rating="${r}"]`);
      if (btn) { await btn.click().catch(() => {}); await page.waitForTimeout(140); }
      else break; // Runde zu Ende
    }
    // In-App zurück nach Home (KEIN Reload – der Service Worker kann ein erneutes
    // goto stören), dann Profil-Reiter -> Statistik öffnen.
    const home = await page.$('[data-action="home"]');
    if (home) { await home.click().catch(() => {}); await page.waitForTimeout(250); }
    await page.click('[data-action="set-tab"][data-tab="profil"]');
    await page.waitForTimeout(200);
    await page.click('[data-action="open-stats"]');
    await page.waitForSelector(".kpis", { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, "stats.png") });
    await ctx.close();
    console.log("✓ docs/landing/stats.png");
  }

  // 4) WebP-Ableitungen: die Landing-Pages binden {home,study,stats}.webp ein
  //    (deutlich kleiner als PNG) plus home-hero.webp (612px, Hero-Phone auf
  //    Desktop). Kodierung dependency-frei über Chromiums Canvas-Encoder.
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const toWebp = async (srcName, outName, targetWidth) => {
      const { readFileSync, writeFileSync } = await import("node:fs");
      const b64 = readFileSync(path.join(OUT, srcName)).toString("base64");
      const dataUrl = await page.evaluate(async ({ b64, targetWidth }) => {
        const img = new Image();
        img.src = "data:image/png;base64," + b64;
        await img.decode();
        const w = targetWidth || img.naturalWidth;
        const h = Math.round(img.naturalHeight * w / img.naturalWidth);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        return canvas.toDataURL("image/webp", 0.82);
      }, { b64, targetWidth });
      writeFileSync(path.join(OUT, outName), Buffer.from(dataUrl.split(",")[1], "base64"));
      console.log(`✓ docs/landing/${outName}`);
    };
    await toWebp("home.png", "home.webp");
    await toWebp("study.png", "study.webp");
    await toWebp("stats.png", "stats.webp");
    await toWebp("home.png", "home-hero.webp", 612);
    await ctx.close();
  }

  await browser.close();
}

run().catch((e) => { console.error("✗ landing-shots fehlgeschlagen:", e.message); process.exit(1); });
