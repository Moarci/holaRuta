#!/usr/bin/env node
/*
 * scripts/e2e/suites/p0-boot-verify.mjs — Ausführliche Blackbox-Browser-Verifikation.
 * Portiert aus scripts/e2e-verify.mjs (Verhalten identisch).
 *
 * Prüft strukturell, was `node --test` NICHT abdeckt:
 *   Boot & defer, CSP, Splash, reduced-motion, Kern-Lernpfad (Flip/Type/Listen),
 *   echter Lazy-Load von qr.js, Discover-Menü, Suche, Focus-Trap, Skip-Link,
 *   Offline/Service-Worker, Discover-Opener, Locals-Korpus-Splitting.
 *
 * Läuft ZWEIMAL: gegen Repo-Root (Live-Multi-File) UND gegen dist/ (minifiziert),
 * um Build-Drift zu erkennen. Fehlt dist/, wird die dist-Gruppe sauber gemeldet.
 *
 *   node scripts/e2e/suites/p0-boot-verify.mjs
 *   HEADED=1 node scripts/e2e/suites/p0-boot-verify.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { startServer, newPage, SHOTS, appErrs, by, runSuite, ROOT, DIST } from "../lib/harness.mjs";

async function runGroup(browser, suite, root, label) {
  const { check, group } = suite;
  group(label);
  const srv = await startServer(root);
  const baseUrl = srv.url;
  const base = srv.base;
  const mk = (over = {}) => newPage(browser, { deviceScaleFactor: 2, seed: over });

  try {
    // ===== 1) Boot & defer, CSP, Theme, Splash, Inline-Styles =====
    {
      const { ctx, page, csp } = await mk({ mode: "flip" });
      await page.goto(base, { waitUntil: "networkidle" });
      check("Boot & defer: window.SC vollständig",
        await page.evaluate(() => !!(window.SC && window.SC.app && window.SC.ui && window.SC.data)));
      check("Home gerendert (#app gefüllt)",
        await page.evaluate(() => { const a = document.getElementById("app"); return !!a && a.innerHTML.trim().length > 200; }));
      check("CSP-<meta> vorhanden",
        await page.evaluate(() => !!document.querySelector('meta[http-equiv="Content-Security-Policy"]')));
      const theme = await page.evaluate(() => document.documentElement.dataset.theme || "");
      check("Theme-Boot wirkt (<html data-theme>)", theme === "dark" || theme === "light", theme);
      const bootGone = await page.waitForFunction(() => { const b = document.getElementById("boot"); return !b || b.classList.contains("is-hiding") || b.classList.contains("is-done") || getComputedStyle(b).display === "none"; }, { timeout: 2500 }).then(() => true).catch(() => false);
      check("Splash blendet < 2,5 s aus", bootGone);
      check("Inline-style-Attribute aktiv (style-src 'unsafe-inline')",
        await page.evaluate(() => !!document.querySelector('#app [style]')));
      check("Keine CSP-Verstöße bis Home", csp.length === 0, csp.join(" | "));
      await page.screenshot({ path: path.join(SHOTS, `verify-${label}-01-home.png`) }).catch(() => {});
      await ctx.close();
    }

    // ===== 2) reduced-motion: Splash quasi sofort =====
    {
      const { ctx, page } = await newPage(browser, { reducedMotion: "reduce", seed: { mode: "flip" } });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      const gone = await page.waitForFunction(() => { const b = document.getElementById("boot"); return !b || b.classList.contains("is-hiding") || b.classList.contains("is-done") || getComputedStyle(b).display === "none"; }, { timeout: 1200 }).then(() => true).catch(() => false);
      check("reduced-motion: Splash ~sofort weg (< 1,2 s)", gone);
      await ctx.close();
    }

    // ===== 3) Kern-Lernpfad: FLIP bis Fertig-Screen =====
    {
      const { ctx, page, errs } = await mk({ mode: "flip" });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.action("study-all"));
      await page.waitForSelector("section.study", { timeout: 5000 });
      const counter = (await page.locator(".topbar__counter").textContent().catch(() => "") || "").trim();
      check("Flip: Runde gestartet + Zähler n/total", /^\d+\/\d+$/.test(counter), counter);
      const total = Number((counter || "1/1").split("/")[1]) || 1;
      await page.click("#flip");
      await page.waitForSelector('.ratebar [data-action="rate"]', { state: "visible", timeout: 5000 });
      check("Flip: Karte aufgedeckt (Bewertungs-Buttons)", true);
      let done = false;
      for (let i = 0; i < total + 6; i++) {
        if (await page.$("#cb-mount")) { done = true; break; }
        const flip = await page.$("#flip");
        if (flip) { const vis = await page.locator('.ratebar [data-action="rate"]').first().isVisible().catch(() => false); if (!vis) { await flip.click().catch(() => {}); await page.waitForTimeout(70); } }
        const r = await page.$('.ratebar [data-action="rate"][data-rating="good"]');
        if (r) { await r.click().catch(() => {}); await page.waitForTimeout(110); } else await page.waitForTimeout(110);
      }
      check("Flip: Fertig-Screen (#cb-mount) erreicht", done);
      check("Flip: keine Console-/Page-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ===== 4) Kern-Lernpfad: TYPE =====
    {
      const { ctx, page, errs } = await mk({ mode: "type" });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.action("study-all"));
      await page.waitForSelector("section.study", { timeout: 5000 });
      const hasTyper = !!(await page.$("#typer"));
      check("Type: Eingabe-Formular (#typer) vorhanden", hasTyper);
      if (hasTyper) {
        await page.fill("#answer", "respuesta");
        await page.click('#typer button[type="submit"]');
        await page.waitForSelector('.ratebar [data-action="rate"]', { state: "visible", timeout: 5000 });
        check("Type: Prüfen deckt auf", true);
        await page.click('.ratebar [data-action="rate"][data-rating="again"]');
        await page.waitForTimeout(150);
        check("Type: Bewerten geht weiter", !!(await page.$("#cb-mount") || await page.$("section.study")));
      }
      check("Type: keine Console-/Page-Fehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ===== 5) Listen-Modus rendert =====
    {
      const { ctx, page } = await mk({ mode: "listen" });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.action("study-all")).catch(() => {});
      const ok = await page.waitForSelector("section.study", { timeout: 5000 }).then(() => true).catch(() => false);
      check("Listen-Modus: Study-Screen rendert", ok);
      await ctx.close();
    }

    // ===== 6) ECHTER Lazy-Load von qr.js (Edition ecos → Lehrer-Screen) =====
    {
      const { ctx, page } = await newPage(browser, { seed: { mode: "flip" } });
      const reqs = []; page.on("request", (r) => reqs.push(r.url()));
      await page.goto(baseUrl + "?edition=ecos", { waitUntil: "networkidle" });
      check("Lazy qr: initial kein qr.js-Tag", await page.evaluate(() => !document.querySelector('script[src*="qr.js"]')));
      check("Lazy qr: window.SC.qr initial undefined", await page.evaluate(() => typeof window.SC.qr === "undefined"));
      const loadedBefore = reqs.some((u) => /\/qr\.js(\?|$)/.test(u));
      const teach = await page.$(by.action("open-teacher"));
      if (!teach) { await page.click(by.tab("tarea")).catch(() => {}); await page.waitForTimeout(200); }
      await page.click(by.action("open-teacher")).catch(() => {});
      const qrLoaded = await page.waitForFunction(() => typeof window.SC.qr !== "undefined", { timeout: 5000 }).then(() => true).catch(() => false);
      check("Lazy qr: nach open-teacher nachgeladen (window.SC.qr da)", qrLoaded);
      const fetched = reqs.some((u) => /\/qr\.js(\?|$)/.test(u));
      check("Lazy qr: qr.js erst on-demand per Netzwerk geholt", fetched && !loadedBefore, `before=${loadedBefore} after=${fetched}`);

      await page.click(by.action("open-printsheet")).catch(() => {});
      const hasDlg = await page.waitForSelector(".sheet-section--dialogue", { timeout: 5000 }).then(() => true).catch(() => false);
      check("Aktivitätsblatt: Dialog-Sektion gerendert", hasDlg);
      const sheetText = await page.evaluate(() => (document.getElementById("app") || {}).innerText || "");
      check("Aktivitätsblatt: kein rohes {name} (sub() greift, auch auf DE-Zeile)", !/\{name\}/.test(sheetText),
        /\{name\}/.test(sheetText) ? "rohes {name} im gerenderten Blatt" : "");
      check("Aktivitätsblatt: keine rohen {o/a}-Gender-Tokens", !/\{[^{}/]*\/[^{}/]*\}/.test(sheetText));
      await ctx.close();
    }

    // ===== 7) defer-only-Module weiterhin im Discover-Menü =====
    {
      const { ctx, page } = await mk({ mode: "flip" });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.tab("entdecken"));
      await page.waitForTimeout(250);
      const want = ["open-historia", "open-historia-centro", "open-dialogos", "open-bailar", "open-musica", "open-flirt", "open-fotos"];
      const present = await page.evaluate((acts) => acts.filter((a) => !!document.querySelector(`[data-action="${a}"]`)), want);
      check("Discover: 7 defer-only-Module sichtbar", present.length === want.length, `gefunden: ${present.join(",")}`);
      await page.screenshot({ path: path.join(SHOTS, `verify-${label}-02-discover.png`) }).catch(() => {});
      await ctx.close();
    }

    // ===== 8) Suche =====
    {
      const { ctx, page } = await mk({ mode: "flip" });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.action("open-search"));
      await page.waitForSelector("#search-input", { timeout: 4000 });
      await page.fill("#search-input", "agua");
      await page.waitForTimeout(350);
      check("Suche: Eingabe liefert Ergebnisse",
        await page.evaluate(() => { const r = document.getElementById("search-results"); return !!r && r.children.length > 0; }));
      await ctx.close();
    }

    // ===== 9) Focus-Trap im Modal =====
    {
      const { ctx, page } = await mk({ mode: "flip" });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.tab("entdecken")).catch(() => {});
      await page.waitForTimeout(200);
      await page.click(by.action("open-spickzettel")).catch(() => {});
      await page.waitForSelector('[data-action="sz-show"]', { timeout: 4000 }).catch(() => {});
      const szRow = await page.$('[data-action="sz-show"]');
      if (!szRow) {
        check("Focus-Trap: Modal-Auslöser gefunden", false, "kein sz-show erreichbar — Check übersprungen");
      } else {
        await szRow.click();
        const modal = await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 4000 }).then(() => true).catch(() => false);
        check("Focus-Trap: Modal öffnet (aria-modal)", modal);
        if (modal) {
          for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
          check("Focus-Trap: Tab bleibt im Modal",
            await page.evaluate(() => { const m = document.querySelector('[role="dialog"][aria-modal="true"]'); return !!(m && m.contains(document.activeElement)); }));
          await page.keyboard.press("Escape");
          check("Focus-Trap: Escape schließt Modal",
            await page.waitForFunction(() => !document.querySelector('[role="dialog"][aria-modal="true"]'), { timeout: 3000 }).then(() => true).catch(() => false));
        }
      }
      await ctx.close();
    }

    // ===== 10) Skip-Link =====
    {
      const { ctx, page } = await mk({ mode: "flip" });
      await page.goto(base, { waitUntil: "networkidle" });
      const firstFocusable = await page.evaluate(() => {
        const sel = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const els = Array.from(document.querySelectorAll(sel));
        return els.length ? (els[0].classList && els[0].classList.contains("skip-link")) : false;
      });
      check("Skip-Link: erstes fokussierbares Element (DOM-Reihenfolge)", firstFocusable);
      await page.focus(".skip-link").catch(() => {});
      const focused = await page.evaluate(() => !!(document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("skip-link")));
      check("Skip-Link: fokussierbar", focused);
      if (focused) {
        await page.keyboard.press("Enter");
        await page.waitForTimeout(150);
        check("Skip-Link: springt zu #app",
          await page.evaluate(() => { const a = document.activeElement; return !!a && (a.id === "app" || (a.closest && a.closest("#app"))); }));
      }
      await ctx.close();
    }

    // ===== 11) Offline / Service Worker =====
    {
      const { ctx, page, errs } = await mk({ mode: "flip" });
      await page.goto(base, { waitUntil: "networkidle" });
      const swReady = await page.evaluate(() => navigator.serviceWorker ? navigator.serviceWorker.ready.then(() => true).catch(() => false) : false);
      check("Service Worker registriert & aktiv", swReady);
      if (swReady) {
        await ctx.setOffline(true);
        await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
        await page.waitForTimeout(400);
        check("Offline: Reload lädt App aus Cache",
          await page.evaluate(() => { const a = document.getElementById("app"); return !!a && a.innerHTML.trim().length > 200; }));
        check("Offline: Lernrunde startbar",
          await page.click(by.action("study-all")).then(() => page.waitForSelector("section.study", { timeout: 4000 })).then(() => true).catch(() => false));
        await ctx.setOffline(false);
      }
      check("Offline: keine Console-/Page-Fehler",
        appErrs(errs).filter((e) => !/service worker/i.test(e)).length === 0, appErrs(errs).join(" | "));
      await ctx.close();
    }

    // ===== 12) Discover-Opener-Smoke =====
    {
      const { ctx, page, errs } = await mk({ mode: "flip" });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click(by.tab("entdecken"));
      await page.waitForTimeout(200);
      const openers = ["open-historia", "open-dialogos", "open-regatear", "open-salud", "open-bailar", "open-musica"];
      let okCount = 0;
      for (const a of openers) {
        const el = await page.$(`[data-action="${a}"]`);
        if (!el) continue;
        await el.click().catch(() => {});
        await page.waitForTimeout(250);
        if (await page.evaluate(() => { const x = document.getElementById("app"); return !!x && x.innerHTML.trim().length > 100; })) okCount++;
        await page.click(by.action("home")).catch(() => {});
        await page.waitForTimeout(120);
        await page.click(by.tab("entdecken")).catch(() => {});
        await page.waitForTimeout(120);
      }
      check("Discover-Opener öffnen ohne Fehler", okCount >= 4 && appErrs(errs).length === 0, `ok=${okCount} appErrs=${appErrs(errs).join(" | ")}`);
      await ctx.close();
    }

    // ===== 13) Locals-Splitting: Korpus lädt NUR im es-en-Track =====
    {
      const LOCALS_RE = /\/(data\.locals\.js|contextdata\.locals\.js|i18n\.strings\.es\.js)(\?|$)/;
      {
        const { ctx, page } = await mk({ mode: "flip" });
        const reqs = []; page.on("request", (r) => reqs.push(r.url()));
        await page.goto(base, { waitUntil: "networkidle" });
        const hit = reqs.filter((u) => LOCALS_RE.test(u));
        check("Locals-Split: Reise-Track lädt keinen Locals-Korpus (~1,76 MB gespart)", hit.length === 0, hit.join(" | "));
        check("Locals-Split: SC.dataLocals/contextDataLocals im Reise-Track undefined",
          await page.evaluate(() => typeof window.SC.dataLocals === "undefined" && typeof window.SC.contextDataLocals === "undefined"));
        await ctx.close();
      }
      {
        const { ctx, page, errs, csp } = await mk({ mode: "flip" });
        await page.goto(baseUrl + "?edition=ingles-pro", { waitUntil: "networkidle" });
        check("Locals-Split: ?edition=ingles-pro aktiviert es-en-Track",
          await page.evaluate(() => window.SC.track && window.SC.track.id() === "es-en"));
        check("Locals-Split: Locals-Korpus in SC.data eingehängt (loc-mes01)",
          await page.evaluate(() => !!(window.SC.data && window.SC.data.CARDS && window.SC.data.CARDS.some((c) => c.id === "loc-mes01"))));
        check("Locals-Split: attach() hängt Locals-Kontext an (loc-Karte mit context)",
          await page.evaluate(() => { const c = (window.SC.data.CARDS || []).find((x) => /^loc-/.test(x.id || "") && x.context); return !!(c && c.context && c.context.loc && c.context.egLearn); }));
        check("Locals-Split: Home rendert im Locals-Track",
          await page.evaluate(() => { const a = document.getElementById("app"); return !!a && a.innerHTML.trim().length > 200; }));
        check("Locals-Split: keine CSP-/App-Fehler im Locals-Track",
          csp.length === 0 && appErrs(errs).length === 0, [...csp, ...appErrs(errs)].join(" | "));
        await ctx.close();
      }
    }
  } finally {
    await srv.close();
  }
}

await process.exit(await runSuite("Ausführliche Browser-Verifikation", async ({ browser, suite }) => {
  await runGroup(browser, suite, ROOT, "root");
  if (fs.existsSync(path.join(DIST, "index.html"))) {
    await runGroup(browser, suite, DIST, "dist");
  } else {
    suite.group("dist");
    suite.check("dist/ vorhanden (node build.js --dist)", false, "dist/index.html fehlt — Gruppe übersprungen");
  }
}));
