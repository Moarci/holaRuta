/*
 * sw-v1-bypass.test.js – R3: der Service-Worker darf Backend-Aufrufe (/v1/, /api/)
 * NIE cachen oder über den Navigations-Fallback abfangen. Prüft die Bypass-Logik
 * funktional (die im fetch-Handler verwendete Bedingung) sowie deren Präsenz.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const sw = fs.readFileSync(path.join(__dirname, "..", "service-worker.js"), "utf8");

// Die Bypass-Bedingung aus dem fetch-Handler nachbilden.
function bypass(url) {
  let p = "";
  try { p = new URL(url).pathname; } catch (e) { p = ""; }
  return p.indexOf("/v1/") === 0 || p.indexOf("/api/") === 0;
}

test("Bypass greift für Backend-Pfade, nicht für App-Assets", () => {
  assert.equal(bypass("https://holaruta.app/v1/sync"), true);
  assert.equal(bypass("https://holaruta.app/v1/leaderboard?day=2026-07-10"), true);
  assert.equal(bypass("https://holaruta.app/api/cron/purge-events"), true);
  assert.equal(bypass("https://holaruta.app/index.html"), false);
  assert.equal(bypass("https://holaruta.app/data.js"), false);
  assert.equal(bypass("https://holaruta.app/"), false);
});

test("fetch-Handler enthält den /v1-Bypass VOR respondWith (Drift-Wächter)", () => {
  const fetchIdx = sw.indexOf('addEventListener("fetch"');
  const guardIdx = sw.indexOf('"/v1/"');
  const respondIdx = sw.indexOf("event.respondWith");
  assert.ok(fetchIdx >= 0, "fetch-Handler vorhanden");
  assert.ok(guardIdx > fetchIdx, "Bypass-Guard im fetch-Handler");
  assert.ok(guardIdx < respondIdx, "Bypass steht VOR respondWith (network-only)");
});
