/*
 * migration-banner.test.js – Tests für den Domain-Umzug-Hinweisbanner
 * (github.io -> holaruta.com, siehe app.js shouldShowMigrationBanner).
 *  - store.loadMigrationBannerDismissed()/dismissMigrationBanner() runden sauber
 *  - der Dismissed-Status ist KEIN Backup-Schlüssel (Import auf einem anderen
 *    Gerät darf den Hinweis dort nicht unterdrücken)
 *
 * Bewusst nur das öffentliche store-API; keine UI/DOM nötig (die Hostname-
 * Gate-Logik selbst lebt in app.js und ist dort nicht isoliert testbar ohne
 * volles DOM-Setup – abgedeckt über die e2e-Suite/manuelle Prüfung).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};

require(path.join(__dirname, "..", "store.js"));
const { store } = globalThis.window.SC;

test("store: migrationBannerDismissed rundet sauber (false -> speichern -> true)", () => {
  assert.equal(store.loadMigrationBannerDismissed(), false);
  store.dismissMigrationBanner();
  assert.equal(store.loadMigrationBannerDismissed(), true);
});

test("store: migrationBannerDismissed reist NICHT im Backup mit (kein KNOWN_KEY)", () => {
  store.dismissMigrationBanner();
  const dump = store.exportData();
  const keys = Object.keys(dump.data);
  assert.ok(
    !keys.some((k) => k.includes("migrationBanner")),
    "migrationBannerDismissed darf nicht im Export auftauchen"
  );
});
