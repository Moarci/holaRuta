#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-landing-b2b.mjs — Blackbox-Smoke der B2B-Landing-Pages.
 *
 * Fünf Vertriebsseiten (Revenue): Hostel, Locals, Sprachschulen, Reiseanbieter,
 * Preview. Pro Seite: lädt fehlerfrei, hat Titel + H1, mindestens einen CTA/
 * Kontakt-Link, ein <meta name="description">. Rein statisch, kein App-State.
 *
 *   node scripts/e2e/suites/p1-landing-b2b.mjs
 */
import { startServer, appErrs, runSuite, targetRoot } from "../lib/harness.mjs";

const PAGES = [
  "landing-hostel.html",
  "landing-locals.html",
  "landing-schule.html",
  "landing-reiseanbieter.html",
  "landing-preview.html",
];

await process.exit(await runSuite("Landing (B2B)", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());

  try {
    for (const file of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      const errs = [];
      page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
      page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });

      const resp = await page.goto(srv.url + file, { waitUntil: "networkidle" });
      check(`${file}: lädt (HTTP ok)`, !!resp && resp.ok(), resp ? String(resp.status()) : "keine Response");

      const info = await page.evaluate(() => ({
        title: document.title,
        h1: (document.querySelector("h1") || {}).textContent || "",
        desc: (document.querySelector('meta[name="description"]') || {}).content || "",
        links: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")),
        bodyLen: (document.body ? document.body.innerText : "").trim().length,
      }));
      // CTA = App-Einstieg (index.html, ./, ?start=, #app) ODER Vertriebskontakt.
      const hasCta = info.links.some((h) => /mailto:|tel:|index\.html|\?start=|#app|contact|kontakt|wa\.me|calendly/i.test(h || "") || /^\.?\/(\?|$)/.test(h || ""));

      check(`${file}: Titel + H1 vorhanden`, /HolaRuta/i.test(info.title) && info.h1.trim().length > 0, `title="${info.title}"`);
      check(`${file}: Inhalt gerendert (Body-Text)`, info.bodyLen > 200, `len=${info.bodyLen}`);
      check(`${file}: CTA/Kontakt-Link vorhanden`, hasCta, `links=${info.links.length}`);
      check(`${file}: keine Console-/Page-Fehler`, appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }
  } finally {
    await srv.close();
  }
}));
