/*
 * store-backup.test.js – IndexedDB-Spiegelbild + Auto-Restore (iOS-Schutz, R4).
 *
 * Hintergrund: localStorage wird auf iOS nach ~7 Tagen ohne Nutzung von WebKit
 * geräumt (ITP). store.js spiegelt darum alle bekannten Keys zusätzlich in
 * IndexedDB und stellt sie beim Start wieder her, falls localStorage leer ist.
 *
 * Diese Tests ziehen store.js JEWEILS FRISCH (require-Cache leeren), weil die
 * Restore-Logik beim Modul-Init läuft – mit einem minimalen Fake-IndexedDB.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const STORE_PATH = path.join(__dirname, "..", "store.js");
const PROGRESS_KEY = "spanischcard.progress.v2";

// Minimaler, deterministischer Fake von IndexedDB. Event-Handler werden per
// Microtask gefeuert (wie echtes IDB: erst nach dem synchronen Zuweisen der
// onsuccess/onerror-Handler durch den Aufrufer).
function makeFakeIndexedDB(initialData) {
  const data = initialData || {}; // storeName -> { key: value }
  return {
    _data: data,
    open() {
      const req = {};
      const db = {
        objectStoreNames: { contains: (n) => Object.prototype.hasOwnProperty.call(data, n) },
        createObjectStore: (n) => { data[n] = data[n] || {}; return {}; },
        transaction: () => ({
          objectStore: (n) => ({
            put: (val, key) => {
              const r = {};
              queueMicrotask(() => { data[n] = data[n] || {}; data[n][key] = val; if (r.onsuccess) r.onsuccess(); });
              return r;
            },
            get: (key) => {
              const r = {};
              queueMicrotask(() => { r.result = (data[n] || {})[key]; if (r.onsuccess) r.onsuccess(); });
              return r;
            },
          }),
        }),
      };
      queueMicrotask(() => {
        req.result = db;
        if (!db.objectStoreNames.contains("kv") && req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    },
  };
}

// Frische Umgebung aufsetzen und store.js neu laden (Restore läuft beim Init).
function freshStore({ local, idbData, throwOnGet }) {
  const mem = Object.assign({}, local || {});
  globalThis.window = {};
  globalThis.localStorage = {
    // throwOnGet simuliert den iOS-/Privatmodus, in dem getItem wirft.
    getItem: (k) => { if (throwOnGet) throw new Error("localStorage blocked"); return (k in mem ? mem[k] : null); },
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  };
  globalThis.sessionStorage = {
    _m: {},
    getItem(k) { return k in this._m ? this._m[k] : null; },
    setItem(k, v) { this._m[k] = String(v); },
  };
  let reloadCount = 0;
  globalThis.location = { reload: () => { reloadCount += 1; } };
  const fakeIdb = makeFakeIndexedDB(idbData);
  globalThis.indexedDB = fakeIdb;
  // Debounce-Timer synchron ausführen, damit die Spiegelung sofort startet.
  // Bleibt für die gesamte Testdauer aktiv (auch im Test-Body) und wird über
  // restore() zurückgesetzt, damit andere Test-Dateien nicht betroffen sind.
  const realSetTimeout = globalThis.setTimeout;
  const realClearTimeout = globalThis.clearTimeout;
  globalThis.setTimeout = (fn) => { if (typeof fn === "function") fn(); return 0; };
  globalThis.clearTimeout = () => {};

  delete require.cache[require.resolve(STORE_PATH)];
  require(STORE_PATH);
  const store = globalThis.window.SC.store;

  function restore() {
    globalThis.setTimeout = realSetTimeout;
    globalThis.clearTimeout = realClearTimeout;
  }
  return { store, mem, fakeIdb, reloads: () => reloadCount, restore };
}

// Microtasks abfließen lassen (mehrere IDB-Hops: open -> get/put).
async function flush() {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
}

test("Spiegelung: saveProgress schreibt einen Snapshot in IndexedDB", async () => {
  // localStorage hat bereits Daten -> Restore ist no-op, Spiegelung ist sofort frei.
  const env = freshStore({ local: { [PROGRESS_KEY]: JSON.stringify({ seed: { reps: 1 } }) } });
  try {
    env.store.saveProgress({ casa: { ease: 2.5, interval: 0, due: 0, reps: 3, seen: 1, history: ["g"] } });
    await flush();
    const snap = env.fakeIdb._data.kv && env.fakeIdb._data.kv.snapshot;
    assert.ok(snap, "Snapshot muss in IndexedDB liegen");
    assert.equal(snap.app, "holaruta");
    assert.equal(snap.data[PROGRESS_KEY].casa.reps, 3);
  } finally { env.restore(); }
});

test("Restore: leeres localStorage wird beim Start aus IndexedDB wiederhergestellt", async () => {
  const snapshot = {
    app: "holaruta", format: 1, exportedAt: "x",
    data: { [PROGRESS_KEY]: { mercado: { ease: 2.5, interval: 0, due: 0, reps: 7, seen: 2, history: ["g"] } } },
  };
  const env = freshStore({ local: {}, idbData: { kv: { snapshot } } });
  try {
    await flush();
    // In localStorage zurückgeschrieben?
    assert.ok(env.mem[PROGRESS_KEY], "Progress-Key muss nach Restore in localStorage liegen");
    const prog = env.store.loadProgress();
    assert.equal(prog.mercado.reps, 7);
    // Genau ein Reload, damit die App den Stand frisch einliest.
    assert.equal(env.reloads(), 1);
  } finally { env.restore(); }
});

test("Restore: kein Reload, wenn IndexedDB leer ist (frischer Nutzer)", async () => {
  const env = freshStore({ local: {}, idbData: {} });
  try {
    await flush();
    assert.equal(env.reloads(), 0);
    assert.deepEqual(env.store.loadProgress(), {});
  } finally { env.restore(); }
});

test("Restore: getItem wirft (Privatmodus) -> gilt als leer, Restore läuft trotzdem", async () => {
  // Wirft localStorage.getItem (iOS-Privatmodus), MUSS hasLocalData() als „leer"
  // gelten (catch -> false), damit der IndexedDB-Restore greift – nicht als „voll".
  const snapshot = {
    app: "holaruta", format: 1, exportedAt: "x",
    data: { [PROGRESS_KEY]: { x: { ease: 2.5, interval: 0, due: 0, reps: 4, seen: 1, history: ["g"] } } },
  };
  const env = freshStore({ local: {}, idbData: { kv: { snapshot } }, throwOnGet: true });
  try {
    await flush();
    assert.equal(env.reloads(), 1, "Restore (mit Reload) muss laufen, wenn getItem wirft");
    assert.ok(env.mem[PROGRESS_KEY], "Snapshot wurde trotz werfendem getItem zurückgeschrieben");
  } finally { env.restore(); }
});
