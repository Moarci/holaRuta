/*
 * geo-config.test.js – Tests für scripts/geo/config.mjs.
 * Absichert wird die Kalendervalidierung des CONTENT_DATE (JSON-LD
 * dateModified / Sitemap lastmod): syntaktisch passende, aber unmögliche Daten
 * dürfen NICHT durchrutschen, und ein fehlender/kaputter Env-Wert muss sicher
 * auf den Default zurückfallen – sonst landet ein ungültiges schema.org-Date
 * auf allen 327 Seiten.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");

test("isValidContentDate: akzeptiert echte YYYY-MM-DD-Daten, lehnt Form- und Kalenderfehler ab", async () => {
  const { isValidContentDate } = await import("../scripts/geo/config.mjs");
  // gültig
  assert.equal(isValidContentDate("2026-07-09"), true);
  assert.equal(isValidContentDate("2024-02-29"), true, "Schaltjahr-29.-Februar ist gültig");
  // ungültige Form
  for (const bad of ["", null, undefined, "2026-7-9", "2026/07/09", "09-07-2026", "2026-07-09T00:00", "heute"]) {
    assert.equal(isValidContentDate(bad), false, `Form-Fehler nicht abgelehnt: ${bad}`);
  }
  // syntaktisch ok, aber unmöglicher Kalendertag (Roll-over-Fallen)
  for (const bad of ["2026-13-45", "2026-00-10", "2026-02-30", "2025-02-29", "2026-04-31"]) {
    assert.equal(isValidContentDate(bad), false, `unmögliches Datum nicht abgelehnt: ${bad}`);
  }
});

test("resolveContentDate: übernimmt gültigen Wert, fällt sonst auf den Default zurück", async () => {
  const { resolveContentDate, CONTENT_DATE } = await import("../scripts/geo/config.mjs");
  assert.equal(resolveContentDate("2030-01-15"), "2030-01-15");
  assert.equal(resolveContentDate("2026-02-30", "2026-07-09"), "2026-07-09", "unmögliches Datum -> Fallback");
  assert.equal(resolveContentDate(undefined, "2026-07-09"), "2026-07-09", "fehlender Wert -> Fallback");
  // Der exportierte CONTENT_DATE ist selbst immer ein gültiges Datum.
  const { isValidContentDate } = await import("../scripts/geo/config.mjs");
  assert.equal(isValidContentDate(CONTENT_DATE), true, "exportiertes CONTENT_DATE muss gültig sein");
});
