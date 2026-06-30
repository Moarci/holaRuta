/*
 * telemetry-aggregate.test.js – Tests für die REINE Aggregations-Funktion des
 * Telemetrie-Dashboards (tools/telemetry-server.js). Kein Server/I/O – nur die
 * Auswertung der empfangenen Events/Snapshots zu Dashboard-Kennzahlen.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { aggregate, dayUTC, durationBucket } = require(path.join(__dirname, "..", "tools", "telemetry-server.js"));

const NOW = Date.UTC(2026, 5, 30, 12, 0, 0); // 2026-06-30
const TODAY = "2026-06-30";
const YEST = "2026-06-29";
const T0 = Date.UTC(2026, 5, 30, 10, 0, 0);

function fixtureEvents() {
  return [
    // clientA, Sitzung s1 (heute), Spanne 0..+300s
    { event: "app_open", day: TODAY, clientId: "A", sessionId: "s1", ts: T0, appVersion: "1.120.0", locale: "de", track: "de-es", props: { returning: true } },
    { event: "screen_view", day: TODAY, clientId: "A", sessionId: "s1", ts: T0 + 1000, props: { screen: "home" } },
    { event: "card_rated", day: TODAY, clientId: "A", sessionId: "s1", ts: T0 + 60000, props: { rating: "good" } },
    { event: "session_complete", day: TODAY, clientId: "A", sessionId: "s1", ts: T0 + 120000, props: { accuracy: "75-90" } },
    { event: "feature_complete", day: TODAY, clientId: "A", sessionId: "s1", ts: T0 + 200000, props: { feature: "precios", perfect: true } },
    { event: "action", day: TODAY, clientId: "A", sessionId: "s1", ts: T0 + 300000, props: { action: "open-search" } },
    // clientB, Sitzung s2 (heute), Einzel-Zeitpunkt -> Dauer 0
    { event: "app_open", day: TODAY, clientId: "B", sessionId: "s2", ts: T0, props: { returning: false } },
    { event: "error", day: TODAY, clientId: "B", sessionId: "s2", ts: T0, props: { type: "error", msg: "boom" } },
    // clientA gestern, Sitzung s3, Spanne 120s -> A ist „returning"
    { event: "app_open", day: YEST, clientId: "A", sessionId: "s3", ts: T0 - 86400000, props: { returning: true } },
    { event: "action", day: YEST, clientId: "A", sessionId: "s3", ts: T0 - 86400000 + 120000, props: { action: "flip-skip" } },
  ];
}
const USAGE = [
  { day: TODAY, cardsToday: "11-30", features: { study: true, precios: true, listen: false } },
  { day: TODAY, cardsToday: "1-10", features: { study: true } },
];

test("dayUTC / durationBucket: Grundbausteine", () => {
  assert.equal(dayUTC(NOW), "2026-06-30");
  assert.equal(durationBucket(0), "0–1 min");
  assert.equal(durationBucket(59), "0–1 min");
  assert.equal(durationBucket(60), "1–5 min");
  assert.equal(durationBucket(899), "5–15 min");
  assert.equal(durationBucket(900), "15–30 min");
  assert.equal(durationBucket(1800), "30+ min");
});

test("aggregate: Nutzer-/Sitzungs-Totalwerte", () => {
  const s = aggregate(fixtureEvents(), USAGE, { now: NOW });
  assert.equal(s.totals.users, 2, "distinkte clientId A,B");
  assert.equal(s.totals.sessions, 3, "s1,s2,s3");
  assert.equal(s.totals.events, 10);
  assert.equal(s.totals.errors, 1);
  assert.equal(s.totals.snapshots, 2);
});

test("aggregate: DAU, WAU, Wiederkehr", () => {
  const s = aggregate(fixtureEvents(), USAGE, { now: NOW });
  assert.equal(s.users.total, 2);
  assert.equal(s.users.returning, 1, "nur A war an 2 Tagen aktiv");
  assert.equal(s.users.returnRatePct, 50);
  assert.equal(s.users.dauToday, 2, "A,B heute aktiv");
  assert.equal(s.users.wau, 2);
  assert.equal(s.users.newOpens, 1, "B: app_open returning=false");
  assert.equal(s.users.returningOpens, 2, "A heute + gestern");
  // lückenlose 30-Tage-Reihe, jüngster Tag zuletzt
  assert.equal(s.users.dauSeries.length, 30);
  assert.equal(s.users.dauSeries[29].day, TODAY);
  assert.equal(s.users.dauSeries[29].count, 2);
  assert.equal(s.users.dauSeries[28].count, 1, "gestern 1 (A)");
});

test("aggregate: Sitzungsdauer (wie lange)", () => {
  const s = aggregate(fixtureEvents(), USAGE, { now: NOW });
  // Dauern: s1=300s, s2=0s, s3=120s -> Ø 140, Median 120
  assert.equal(s.sessions.avgDurationSec, 140);
  assert.equal(s.sessions.medianDurationSec, 120);
  const hist = {};
  s.sessions.durationHistogram.forEach((d) => { hist[d.bucket] = d.count; });
  assert.equal(hist["0–1 min"], 1);
  assert.equal(hist["1–5 min"], 1);
  assert.equal(hist["5–15 min"], 1);
  // Sitzungen/Tag: heute 2 (s1,s2), gestern 1 (s3)
  assert.equal(s.sessions.perDay[29].count, 2);
  assert.equal(s.sessions.perDay[28].count, 1);
});

test("aggregate: Lernen, Engagement, Fehler, Snapshots", () => {
  const s = aggregate(fixtureEvents(), USAGE, { now: NOW });
  assert.equal(s.learning.ratings.good, 1);
  assert.equal(s.learning.ratings.again, 0);
  assert.deepEqual(s.learning.accuracy, [{ key: "75-90", count: 1 }]);
  assert.deepEqual(s.learning.features, [{ feature: "precios", count: 1, perfectPct: 100 }]);
  assert.deepEqual(s.engagement.screens, [{ key: "home", count: 1 }]);
  // zwei Aktionen, je 1x -> alphabetisch stabil
  assert.deepEqual(s.engagement.actions.map((a) => a.key), ["flip-skip", "open-search"]);
  assert.deepEqual(s.errors, [{ key: "error: boom", count: 1 }]);
  // Snapshot-Adoption (anonym): study 2x, precios 1x
  const adopt = {};
  s.meta.snapshotFeatureAdoption.forEach((r) => { adopt[r.key] = r.count; });
  assert.equal(adopt.study, 2);
  assert.equal(adopt.precios, 1);
  assert.equal(adopt.listen, undefined, "false-Features zählen nicht");
});

test("aggregate: Zeitfenster filtert alte Events weg", () => {
  const ev = fixtureEvents();
  ev.push({ event: "app_open", day: "2020-01-01", clientId: "Z", sessionId: "old", ts: Date.UTC(2020, 0, 1), props: {} });
  const s = aggregate(ev, USAGE, { now: NOW, windowDays: 30 });
  assert.equal(s.totals.events, 10, "das alte Event ist außerhalb des Fensters");
  assert.equal(s.totals.users, 2, "Z zählt nicht");
});

test("aggregate: leere Eingaben -> Nullwerte, kein Crash", () => {
  const s = aggregate([], [], { now: NOW });
  assert.equal(s.totals.users, 0);
  assert.equal(s.sessions.avgDurationSec, 0);
  assert.equal(s.users.dauSeries.length, 30);
  assert.deepEqual(s.errors, []);
});
