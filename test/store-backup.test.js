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
function makeFakeIndexedDB(initialData, opts) {
  const data = initialData || {}; // storeName -> { key: value }
  const getErrors = !!(opts && opts.getErrors); // erzwingt onerror beim Lesen (Restore-GET schlägt fehl)
  let openFails = Number((opts && opts.openFailsTimes) || 0); // die ersten N open() schlagen fehl (reject)
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
              queueMicrotask(() => {
                if (getErrors) { r.error = new Error("get failed"); if (r.onerror) r.onerror(); return; }
                r.result = (data[n] || {})[key]; if (r.onsuccess) r.onsuccess();
              });
              return r;
            },
          }),
        }),
      };
      const fail = openFails > 0; if (fail) openFails -= 1; // transienter Open-Fehler (erst danach wieder ok)
      queueMicrotask(() => {
        if (fail) { req.error = new Error("open failed"); if (req.onerror) req.onerror(); return; }
        req.result = db;
        if (!db.objectStoreNames.contains("kv") && req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    },
  };
}

// Frische Umgebung aufsetzen und store.js neu laden (Restore läuft beim Init).
function freshStore({ local, idbData, throwOnGet, idbGetErrors, idbOpenFailsTimes }) {
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
  const fakeIdb = makeFakeIndexedDB(idbData, { getErrors: !!idbGetErrors, openFailsTimes: Number(idbOpenFailsTimes || 0) });
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

test("Spiegelung: nach IDB-Restore ist sie freigegeben (restoreSettled im onsuccess)", async () => {
  // Leeres localStorage + IDB-Snapshot -> Restore läuft async und MUSS restoreSettled
  // setzen; sonst blockiert mirrorToIdb dauerhaft und es gäbe nie wieder ein Backup.
  const snapshot = {
    app: "holaruta", format: 1, exportedAt: "x",
    data: { [PROGRESS_KEY]: { a: { ease: 2.5, interval: 0, due: 0, reps: 1, seen: 1, history: ["g"] } } },
  };
  const env = freshStore({ local: {}, idbData: { kv: { snapshot } } });
  try {
    await flush(); // Restore -> restoreSettled = true
    env.store.saveProgress({ b: { ease: 2.5, interval: 0, due: 0, reps: 2, seen: 1, history: ["g"] } });
    await flush(); // Spiegelung des neuen Stands
    const snap = env.fakeIdb._data.kv && env.fakeIdb._data.kv.snapshot;
    assert.ok(snap && snap.data[PROGRESS_KEY] && snap.data[PROGRESS_KEY].b, "neuer Stand wurde gespiegelt (Spiegelung war freigegeben)");
  } finally { env.restore(); }
});

test("Spiegelung: auch nach einem GET-Fehler freigegeben (restoreSettled im onerror)", async () => {
  // Schlägt der Restore-GET fehl, MUSS restoreSettled trotzdem gesetzt werden –
  // sonst bliebe die Spiegelung für den Rest der Sitzung blockiert.
  const env = freshStore({ local: {}, idbData: { kv: {} }, idbGetErrors: true });
  try {
    await flush(); // Restore-GET -> onerror -> restoreSettled = true
    env.store.saveProgress({ b: { ease: 2.5, interval: 0, due: 0, reps: 2, seen: 1, history: ["g"] } });
    await flush(); // Spiegelung
    const snap = env.fakeIdb._data.kv && env.fakeIdb._data.kv.snapshot;
    assert.ok(snap && snap.data[PROGRESS_KEY] && snap.data[PROGRESS_KEY].b, "Spiegelung läuft trotz vorherigem GET-Fehler");
  } finally { env.restore(); }
});

test("Spiegelung: auch nach einem fehlgeschlagenen IDB-Open freigegeben (restoreSettled im .catch)", async () => {
  // Schlägt das erste openIdb() fehl (Restore), MUSS restoreSettled über den .catch
  // gesetzt werden – sonst bliebe die Spiegelung dauerhaft blockiert, obwohl ein
  // späterer Open (Spiegelung) wieder klappt.
  const env = freshStore({ local: {}, idbData: { kv: {} }, idbOpenFailsTimes: 1 });
  try {
    await flush(); // 1. open scheitert -> .catch -> restoreSettled = true
    env.store.saveProgress({ b: { ease: 2.5, interval: 0, due: 0, reps: 2, seen: 1, history: ["g"] } });
    await flush(); // 2. open klappt -> Spiegelung
    const snap = env.fakeIdb._data.kv && env.fakeIdb._data.kv.snapshot;
    assert.ok(snap && snap.data[PROGRESS_KEY] && snap.data[PROGRESS_KEY].b, "Spiegelung läuft nach transientem Open-Fehler");
  } finally { env.restore(); }
});

// ---------- Arbeitsheft-Eingaben (Handy-Modus): gerätelokale Persistenz ----------
const SHEETFILL_KEY = "spanischcard.sheetfill.v1";

test("SheetFill: Speichern/Laden ist verlustfrei (Round-Trip)", () => {
  const env = freshStore({ local: {} });
  try {
    const data = { "pretrip:cartagena|all": { "a:Gracias.#1": "Gracias.", "area#1": "mi texto" } };
    env.store.saveSheetFill(data);
    assert.deepEqual(env.store.loadSheetFill(), data, "gespeicherte Eingaben kommen identisch zurück");
  } finally { env.restore(); }
});

test("SheetFill: leer/fehlend -> {}", () => {
  const env = freshStore({ local: {} });
  try {
    assert.deepEqual(env.store.loadSheetFill(), {}, "ohne Eintrag ein leeres Objekt");
  } finally { env.restore(); }
});

test("SheetFill: Strukturwächter wirft Müll raus und deckelt die Größe", () => {
  const env = freshStore({ local: {} });
  try {
    const bucket = {};
    for (let i = 0; i < 500; i++) bucket["k" + i] = "v" + i; // > 400 Felder
    bucket.leer = "";            // leere Werte fliegen raus
    bucket.zahl = 42;            // Nicht-String fliegt raus
    const dirty = {
      "ziel|all": bucket,
      "kaputt": "kein-objekt",   // Bucket muss ein Objekt sein
      "leeresBlatt": {},         // ohne Felder -> kein Eintrag
    };
    env.store.saveSheetFill(dirty);
    const got = env.store.loadSheetFill();
    assert.ok(got["ziel|all"], "gültiges Blatt bleibt");
    assert.ok(!("kaputt" in got), "Nicht-Objekt-Bucket verworfen");
    assert.ok(!("leeresBlatt" in got), "leeres Blatt verworfen");
    assert.ok(!("leer" in got["ziel|all"]) && !("zahl" in got["ziel|all"]), "leere/Nicht-String-Werte verworfen");
    assert.ok(Object.keys(got["ziel|all"]).length <= 400, "Felder pro Blatt gedeckelt");
  } finally { env.restore(); }
});

test("SheetFill: leere oder überlange Blatt-ID wird verworfen (nicht nur ein Nicht-Objekt-Bucket)", () => {
  const env = freshStore({ local: {} });
  try {
    const dirty = {
      "": { "a:x#1": "y" },                    // leere ID -> raus
      [("x").repeat(201)]: { "a:x#1": "y" },   // ID > 200 Zeichen -> raus
      "gueltig|all": { "a:x#1": "y" },         // gültige ID -> bleibt
    };
    env.store.saveSheetFill(dirty);
    const got = env.store.loadSheetFill();
    assert.deepEqual(Object.keys(got), ["gueltig|all"], "nur die gültige ID bleibt");
  } finally { env.restore(); }
});

test("SheetFill: gehört NICHT ins Backup (gerätelokal, kein Export)", () => {
  const env = freshStore({ local: {} });
  try {
    env.store.saveSheetFill({ "ziel|all": { "a:x#1": "y" } });
    const dump = env.store.exportData();
    assert.ok(!(SHEETFILL_KEY in dump), "Arbeitsheft-Eingaben dürfen nicht im Backup landen");
  } finally { env.restore(); }
});
