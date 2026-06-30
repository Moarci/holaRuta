/*
 * analytics.test.js – Tests für den REINEN Kern + das Opt-in-Gate der optionalen,
 * anonymen Nutzungs-Telemetrie (analytics.js): Snapshot aus den vorhandenen
 * gamestats bauen, grob bucketen, Datenminimierung, und „ohne Config/ohne
 * Zustimmung wird NICHTS gesendet". Kein echter Server – genau der Teil, der laut
 * BACKEND.md §17 zuerst gebaut & getestet wird, sodass nur der Server fehlt.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// Minimal-Browser-Shims: analytics.js nutzt localStorage für den „sent"-Tag und im
// Adapter SC.net.request + fetch. Der reine Kern braucht nichts davon.
globalThis.window = globalThis.window || {};
const lsStore = {};
globalThis.localStorage = globalThis.localStorage || {
  getItem: (k) => (k in lsStore ? lsStore[k] : null),
  setItem: (k, v) => { lsStore[k] = String(v); },
  removeItem: (k) => { delete lsStore[k]; },
};
globalThis.fetch = globalThis.fetch || (() => Promise.resolve({ ok: true }));
require(path.join(__dirname, "..", "analytics.js"));
const { analytics } = globalThis.window.SC;

test("bucket: grobe, server-stabile Bereiche statt exakter Werte", () => {
  const e = [10, 30, 60];
  assert.equal(analytics.bucket(0, e), "0");
  assert.equal(analytics.bucket(-5, e), "0");
  assert.equal(analytics.bucket(1, e), "1-10");
  assert.equal(analytics.bucket(10, e), "1-10");
  assert.equal(analytics.bucket(11, e), "11-30");
  assert.equal(analytics.bucket(60, e), "31-60");
  assert.equal(analytics.bucket(61, e), "61+");
  assert.equal(analytics.bucket("nonsense", e), "0", "kaputte Eingabe -> 0, kein Crash");
});

test("featuresUsed: boolesche je-benutzt-Flags aus gamestats, ohne Haeufigkeiten", () => {
  const f = analytics.featuresUsed({
    reviews: 5, preciosPlayed: 2, roleplaysSeen: { r1: true }, rutaDays: {},
  });
  assert.equal(f.study, true);
  assert.equal(f.precios, true);
  assert.equal(f.roleplay, true, "nicht-leere Map -> true");
  assert.equal(f.ruta, false, "leere Map -> false");
  assert.equal(f.dialogos, false);
  // Werte sind reine Booleans (keine Zählerstände, die fingerprinten könnten).
  Object.values(f).forEach((v) => assert.equal(typeof v, "boolean"));
});

test("buildUsageSnapshot: anonym, gebucketet, liest Aktivität aus dailyCounts", () => {
  const g = {
    dailyCounts: { "2026-06-30": 12, "2026-06-29": 3 },
    dailyStreak: 9, reviews: 412, preciosPlayed: 1,
    // Felder, die NICHT im Snapshot landen dürfen (Datenminimierung):
    longestStreak: 50, placement: { level: "B1" }, progress: { card123: { ease: 2.5 } },
  };
  const snap = analytics.buildUsageSnapshot(g, {
    day: "2026-06-30", appVersion: "1.120.0", locale: "de", track: "de-es",
  });
  assert.equal(snap.day, "2026-06-30");
  assert.equal(snap.cardsToday, "11-30");
  assert.equal(snap.streak, "8-30");
  assert.equal(snap.reviews, "201-1000");
  assert.equal(snap.appVersion, "1.120.0");
  assert.equal(snap.locale, "de");
  assert.equal(snap.track, "de-es");
  assert.equal(snap.features.precios, true);
  assert.equal(snap.features.dialogos, false);
});

test("buildUsageSnapshot: Datenminimierung – feste Allowlist, keine PII/IDs/exakten Zähler", () => {
  const g = {
    dailyCounts: { "2026-06-30": 12 }, dailyStreak: 9, reviews: 412,
    placement: { level: "B1" }, progress: { card123: {} }, userName: "Marcel",
  };
  const snap = analytics.buildUsageSnapshot(g, { day: "2026-06-30" });
  assert.deepEqual(
    Object.keys(snap).sort(),
    ["app", "appVersion", "cardsToday", "day", "features", "locale", "reviews", "schema", "streak", "track"]
  );
  const json = JSON.stringify(snap);
  assert.ok(json.indexOf("B1") < 0, "kein Placement-Level");
  assert.ok(json.indexOf("card123") < 0, "keine Karten-ID");
  assert.ok(json.indexOf("Marcel") < 0, "kein Name/PII");
  assert.ok(json.indexOf("412") < 0, "kein exakter Review-Zähler (nur Bucket)");
});

test("buildUsageSnapshot: leere Eingaben -> Null-anonym, kein Crash", () => {
  const snap = analytics.buildUsageSnapshot(null, { day: "2026-06-30" });
  assert.equal(snap.cardsToday, "0");
  assert.equal(snap.streak, "0");
  assert.equal(snap.reviews, "0");
  assert.equal(snap.features.study, false);
  assert.equal(snap.appVersion, "");
});

test("maybeSend: sendet NUR mit Endpunkt UND Zustimmung; max 1x/Tag; anonymer Body", async () => {
  const calls = [];
  globalThis.window.SC.net = {
    request: (base, method, p, body) => { calls.push({ base, method, p, body }); return Promise.resolve({ ok: true, status: 200, body: null }); },
  };
  const g = { dailyCounts: { "2026-06-30": 12 }, reviews: 300, dailyStreak: 4, preciosPlayed: 2, placement: { level: "B1" } };

  // (a) ohne Config: 0 Netzwerk-Calls (entspricht „ohne Config 0 Netzwerk").
  globalThis.window.SC.config = {};
  let r = await analytics.maybeSend(g, { day: "2026-06-30", consent: true });
  assert.equal(r.sent, false);
  assert.equal(calls.length, 0);

  // (b) mit Endpunkt, aber OHNE Zustimmung: weiterhin nichts.
  globalThis.window.SC.config = { analytics: { enabled: true, endpoint: "https://x.test/" } };
  r = await analytics.maybeSend(g, { day: "2026-06-30", consent: false });
  assert.equal(r.sent, false);
  assert.equal(calls.length, 0);

  // (c) mit Endpunkt UND Zustimmung: genau ein POST /v1/usage mit anonymem Body.
  r = await analytics.maybeSend(g, { day: "2026-06-30", consent: true, appVersion: "1.120.0", locale: "de", track: "de-es" });
  assert.equal(r.sent, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].p, "/v1/usage");
  assert.equal(calls[0].base, "https://x.test", "Endpunkt ohne Trailing-Slash");
  assert.ok(!("name" in calls[0].body) && !("placement" in calls[0].body) && !("id" in calls[0].body));

  // (d) zweiter Aufruf am selben Tag: kein weiterer Send (Tages-Dedupe).
  r = await analytics.maybeSend(g, { day: "2026-06-30", consent: true });
  assert.equal(r.sent, false);
  assert.equal(calls.length, 1);

  // (e) neuer Tag: wieder genau ein Send.
  r = await analytics.maybeSend(g, { day: "2026-07-01", consent: true });
  assert.equal(r.sent, true);
  assert.equal(calls.length, 2);
});

test("dayKey: lokales YYYY-MM-DD (zweistellig)", () => {
  const k = analytics.dayKey(new Date(2026, 0, 5, 12, 0, 0).getTime()); // 5. Jan
  assert.equal(k, "2026-01-05");
});
