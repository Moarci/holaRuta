/*
 * changelog.test.js – Tests für den „Was ist neu?"-Update-Hinweis.
 *  - changelog.since() liefert genau die neueren Einträge (NEUESTE zuerst)
 *  - store.loadSeenVersion()/saveSeenVersion() runden sauber (Persistenz)
 *  - seenVersion ist KEIN Backup-Schlüssel (Import von anderem Gerät löst
 *    keinen falschen Update-Hinweis aus)
 *
 * Bewusst nur das öffentliche Modul-API; keine UI/DOM nötig.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// window- und localStorage-Shim (Module sind Browser-IIFEs).
globalThis.window = globalThis.window || {};
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};

const SRC = path.join(__dirname, "..");
require(path.join(SRC, "store.js"));
require(path.join(SRC, "changelog.js"));
const { store, changelog } = globalThis.window.SC;

test("changelog: VERSION ist der neueste Eintrag", () => {
  assert.equal(changelog.VERSION, changelog.entries[0].version);
});

test("changelog: entries sind streng absteigend nach Datum sortiert (NEUESTE zuerst)", () => {
  for (let i = 1; i < changelog.entries.length; i++) {
    assert.ok(
      changelog.entries[i - 1].date >= changelog.entries[i].date,
      `Eintrag ${i} (${changelog.entries[i].version}) ist neuer als sein Vorgänger`
    );
  }
});

test("changelog: jeder Eintrag hat version, title und nicht-leere items", () => {
  for (const e of changelog.entries) {
    assert.ok(typeof e.version === "string" && e.version, "version fehlt");
    assert.ok(typeof e.title === "string" && e.title, "title fehlt");
    assert.ok(Array.isArray(e.items) && e.items.length > 0, "items leer");
  }
});

test("since(null) -> [] (frische Installation: kein Hinweis)", () => {
  assert.deepEqual(changelog.since(null), []);
});

test("since(aktuelle Version) -> [] (nichts Neues)", () => {
  assert.deepEqual(changelog.since(changelog.VERSION), []);
});

test("since(ältere Version) -> nur die neueren Einträge, NEUESTE zuerst", () => {
  if (changelog.entries.length < 2) return; // erst ab zwei Einträgen prüfbar
  const older = changelog.entries[1].version;
  const news = changelog.since(older);
  assert.equal(news.length, 1);
  assert.equal(news[0].version, changelog.entries[0].version);
});

test("since(unbekannte Vorversion) -> nur das Neueste (nie leer, nie überfrachtet)", () => {
  const news = changelog.since("0.0.1-nie-veroeffentlicht");
  assert.equal(news.length, 1);
  assert.equal(news[0].version, changelog.entries[0].version);
});

test("store: seenVersion rundet sauber (null -> speichern -> lesen)", () => {
  assert.equal(store.loadSeenVersion(), null);
  store.saveSeenVersion("1.4.0");
  assert.equal(store.loadSeenVersion(), "1.4.0");
});

test("store: seenVersion reist NICHT im Backup mit (kein KNOWN_KEY)", () => {
  store.saveSeenVersion("9.9.9");
  const dump = store.exportData();
  const keys = Object.keys(dump.data);
  assert.ok(
    !keys.some((k) => k.includes("seenVersion")),
    "seenVersion darf nicht im Export auftauchen"
  );
});
