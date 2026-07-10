#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-landing-consumer.mjs — Blackbox-E2E der Consumer-Landing.
 *
 * landing.html ist die Haupt-Marketing-Seite (Revenue/Akquise). Geprüft wird der
 * statische Auftritt in echtem Chromium — ohne App-State:
 *   - Seite lädt, Titel + H1 vorhanden, keine Console-/Page-Fehler
 *   - hreflang-Alternates (SEO: de/en/x-default)
 *   - Demo-Carousel im DOM
 *   - mindestens ein Einstieg in die App (Link zu index.html oder App-CTA)
 *
 *   node scripts/e2e/suites/p1-landing-consumer.mjs
 */
import { startServer, appErrs, runSuite, targetRoot, ensureShots } from "../lib/harness.mjs";

await process.exit(await runSuite("Landing (Consumer)", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  ensureShots();

  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });

    const resp = await page.goto(srv.url + "landing.html", { waitUntil: "networkidle" });
    check("landing.html lädt (HTTP ok)", !!resp && resp.ok(), resp ? String(resp.status()) : "keine Response");

    const info = await page.evaluate(() => ({
      title: document.title,
      h1: (document.querySelector("h1") || {}).textContent || "",
      hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute("hreflang")),
      hasCarousel: !!document.querySelector('[class*="carousel"], [data-carousel], .landing-carousel'),
      appLinks: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))
        .filter((h) => /index\.html|\/app|holaruta/i.test(h || "")).length,
      canonical: !!document.querySelector('link[rel="canonical"]'),
    }));

    check("Titel gesetzt", /HolaRuta/i.test(info.title), info.title);
    check("H1 vorhanden", info.h1.trim().length > 0, info.h1);
    check("hreflang-Alternates (de/en/x-default)",
      info.hreflang.includes("de") && info.hreflang.includes("en"), JSON.stringify(info.hreflang));
    check("canonical-Link vorhanden", info.canonical);
    check("Demo-Carousel im DOM", info.hasCarousel);
    check("Einstieg in die App vorhanden (Link zu index/app)", info.appLinks >= 1, `appLinks=${info.appLinks}`);
    check("Consumer-Landing: keine Console-/Page-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await ctx.close();
  } finally {
    await srv.close();
  }
}));
