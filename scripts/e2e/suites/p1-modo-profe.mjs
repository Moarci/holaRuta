#!/usr/bin/env node
/*
 * scripts/e2e/suites/p1-modo-profe.mjs — Blackbox-E2E des „Modo profe"
 * (Lehrer-/Coordinator-Modus). Portiert aus scripts/e2e-modo-profe.mjs.
 *
 * Treibt die ECHTE App in echtem Chromium: ECOS-Edition → Tarea → Modo profe →
 * Schüler-Backups importieren, Niveau-Verteilung, Standard- & Spalten-Sortierung,
 * CSV-Export (inkl. Akzent-Namen), Re-Import-Dedupe, A4-Druck-Layout prüfen.
 *
 * BLACKBOX: die Schüler-Backups kommen als Fixture (scripts/e2e/fixtures/
 * seed-teacher-ecos.json, erzeugt via gen-teacher-ecos.mjs) — KEIN Modul-Import
 * mehr im Testlauf. Fehlt Playwright/Chromium, überspringt der Lauf sauber (Exit 0).
 *
 *   node scripts/e2e/suites/p1-modo-profe.mjs
 *   HEADED=1 node scripts/e2e/suites/p1-modo-profe.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { startServer, newPage, fixtures, SHOTS, appErrs, by, runSuite, targetRoot } from "../lib/harness.mjs";

// Fixture → In-Memory-Dateien für page.setInputFiles.
function loadTeacherFiles() {
  const fx = fixtures.load("seed-teacher-ecos");
  return fx.files.map((f) => ({ name: f.name, mimeType: f.mimeType, buffer: Buffer.from(f.contentBase64, "base64") }));
}

await process.exit(await runSuite("Modo profe", async ({ browser, suite }) => {
  const { check } = suite;
  const srv = await startServer(targetRoot());
  const base = srv.base + "?edition=ecos";
  const files = loadTeacherFiles();

  try {
    const { ctx, page, errs } = await newPage(browser, { deviceScaleFactor: 2, seed: { name: "Profe" } });

    await page.goto(base, { waitUntil: "networkidle" });
    const cfg = await page.evaluate(() => ({
      brand: (window.SC && window.SC.config && window.SC.config.brandName) || "",
      teacherTab: !!(window.SC && window.SC.config && window.SC.config.teacherTab),
    }));
    check("Edition ECOS aktiv", /ECOS/.test(cfg.brand), `brandName="${cfg.brand}"`);
    check("teacherTab aktiv", cfg.teacherTab);

    // In den Modo profe.
    await page.click(by.tab("tarea"));
    await page.click(by.action("open-teacher"));
    await page.waitForSelector(by.action("teacher-import"));
    check("Modo profe öffnet (Import-Button da)", true);
    await page.screenshot({ path: path.join(SHOTS, "modo-profe-01-empty.png"), fullPage: true }).catch(() => {});

    // Schüler importieren (verstecktes File-Input mit In-Memory-Dateien füllen).
    await page.setInputFiles("#teacher-file", files);
    await page.waitForSelector(".teacher-table tbody tr");
    await page.waitForTimeout(300);
    const names = () => page.$$eval(".teacher-table tbody tr td.teacher-name", (t) => t.map((x) => x.textContent.trim()));
    const imported = await names();
    check("Alle 7 Schüler importiert (inkl. Akzent-Namen)", imported.length === 7, JSON.stringify(imported));
    check("Akzent-Namen erhalten", imported.includes("Ana López") && imported.includes("Bruno Díaz") && imported.includes("Carla Méndez"));
    await page.screenshot({ path: path.join(SHOTS, "modo-profe-02-imported.png"), fullPage: true }).catch(() => {});

    // Niveau-Verteilung.
    const dist = await page.$$eval(".leveldist-row", (rs) => rs.map((r) =>
      r.querySelector(".leveldist-label").textContent.trim() + ":" + r.querySelector(".leveldist-count").textContent.trim()));
    check("Niveau-Verteilung korrekt (A1:1·A2:2·B1-:1·B2:1·C1:1)",
      JSON.stringify(dist) === JSON.stringify(["A1:1", "A2:2", "B1-:1", "B2:1", "C1:1"]), JSON.stringify(dist));
    const foot = await page.locator(".leveldist-foot").textContent().catch(() => "");
    check("„Noch nicht getestet: 1“ ausgewiesen", /:\s*1\b/.test(foot), foot);

    // Standard-Sortierung = Niveau absteigend.
    check("Standard-Sortierung nach Niveau (C1 zuerst, ungetestet zuletzt)",
      imported[0] === "Elena Soto" && imported[imported.length - 1] === "Frank Weber", JSON.stringify(imported));

    // Spalten-Sortierung nach Name.
    await page.click('.teacher-sortbtn[data-key="name"]');
    await page.waitForTimeout(120);
    const byName = await names();
    const sortedCopy = byName.slice().sort((a, b) => a.localeCompare(b, "de"));
    check("Sortierung nach Name (alphabetisch)", JSON.stringify(byName) === JSON.stringify(sortedCopy), JSON.stringify(byName));

    // CSV-Export.
    await page.fill("#teacher-classname", "Grupo A · Junio");
    const dl = await Promise.all([
      page.waitForEvent("download"),
      page.click(by.action("teacher-csv")),
    ]).then((r) => r[0]).catch(() => null);
    if (dl) {
      const csvPath = path.join(SHOTS, dl.suggestedFilename());
      await dl.saveAs(csvPath);
      const csv = fs.readFileSync(csvPath, "utf8");
      const lines = csv.split("\r\n");
      check("CSV-Dateiname nutzt Klassennamen", /klasse-grupo-a-junio-/.test(dl.suggestedFilename()), dl.suggestedFilename());
      check("CSV hat Kopf + 7 Datenzeilen", lines.length === 8, lines.length + " Zeilen");
      check("CSV erhält Akzent-Namen (UTF-8)", /López|Díaz|Méndez/.test(csv));
    } else {
      check("CSV-Export löst Download aus", false, "kein download-Event");
    }

    // Re-Import desselben Backups → Dedupe.
    await page.setInputFiles("#teacher-file", [files[0]]);
    await page.waitForTimeout(300);
    const afterRe = await page.$$eval(".teacher-table tbody tr", (r) => r.length);
    check("Re-Import ersetzt statt dupliziert (bleibt 7)", afterRe === 7, afterRe + " Zeilen");
    await ctx.close();

    // Druck: A4-Layout, Kopf sichtbar, Buttons aus, keine geklippten Spalten.
    const wide = await newPage(browser, { viewport: { width: 703, height: 1000 }, seed: { name: "Profe" } });
    const pp = wide.page;
    await pp.goto(base, { waitUntil: "networkidle" });
    await pp.click(by.tab("tarea"));
    await pp.click(by.action("open-teacher"));
    await pp.setInputFiles("#teacher-file", files);
    await pp.waitForSelector(".teacher-table tbody tr");
    await pp.fill("#teacher-classname", "Grupo A");
    await pp.emulateMedia({ media: "print" });
    await pp.waitForTimeout(150);
    const printInfo = await pp.evaluate(() => {
      const head = document.querySelector(".teacher-printhead");
      const actions = document.querySelector(".teacher-actions");
      const table = document.querySelector(".teacher-table");
      const niveauTh = document.querySelector(".teacher-table thead th:nth-child(6)");
      return {
        headVisible: head ? getComputedStyle(head).display !== "none" : false,
        actionsHidden: actions ? getComputedStyle(actions).display === "none" : true,
        tableScroll: table.scrollWidth, win: window.innerWidth,
        niveauText: niveauTh ? niveauTh.textContent.replace(/\s+/g, " ").trim() : "",
      };
    });
    check("Druck: Druck-Kopf (Klassenname+Datum) sichtbar", printInfo.headVisible);
    check("Druck: Aktions-Buttons ausgeblendet", printInfo.actionsHidden);
    check("Druck: Tabelle klippt auf A4 NICHT (alle Spalten passen)",
      printInfo.tableScroll <= printInfo.win + 2, `Tabelle ${printInfo.tableScroll}px > ${printInfo.win}px`);
    check("Druck: Niveau-Spalte vorhanden", /Level|Niveau|HolaRuta-Check/i.test(printInfo.niveauText), printInfo.niveauText);
    await pp.screenshot({ path: path.join(SHOTS, "modo-profe-03-print-a4.png"), fullPage: true }).catch(() => {});

    check("Keine Konsolen-/Seitenfehler", appErrs(errs).length === 0, appErrs(errs).join(" | "));
    await wide.ctx.close();
  } finally {
    await srv.close();
  }
}));
