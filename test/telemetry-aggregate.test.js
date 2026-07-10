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
const { aggregate, dayUTC, durationBucket, toKpiCsv } = require(path.join(__dirname, "..", "tools", "telemetry-server.js"));

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

test("aggregate: Zeitfenster — Grenze inklusive (letzte 30 Tage inkl. heute)", () => {
  const ev = fixtureEvents();
  const inDay = dayUTC(NOW - 29 * 86400000);   // jüngste Grenze -> NOCH im 30-Tage-Fenster
  const outDay = dayUTC(NOW - 30 * 86400000);  // einen Tag zu alt -> raus
  ev.push({ event: "app_open", day: inDay, clientId: "IN", sessionId: "in", ts: NOW - 29 * 86400000, props: {} });
  ev.push({ event: "app_open", day: outDay, clientId: "OUT", sessionId: "out", ts: NOW - 30 * 86400000, props: {} });
  ev.push({ event: "app_open", day: "2020-01-01", clientId: "Z", sessionId: "old", ts: Date.UTC(2020, 0, 1), props: {} });
  const s = aggregate(ev, USAGE, { now: NOW, windowDays: 30 });
  assert.equal(s.totals.events, 11, "nur das Grenz-Event (now-29) zählt mit; now-30/2020 nicht");
  assert.equal(s.totals.users, 3, "A,B + IN; OUT und Z außerhalb");
  // dauSeries deckt exakt dieselben 30 Tage ab wie der Filter (Grenze = ältester Balken).
  assert.equal(s.users.dauSeries[0].day, inDay);
});

test("aggregate: leere Eingaben -> Nullwerte, kein Crash", () => {
  const s = aggregate([], [], { now: NOW });
  assert.equal(s.totals.users, 0);
  assert.equal(s.sessions.avgDurationSec, 0);
  assert.equal(s.users.dauSeries.length, 30);
  assert.deepEqual(s.errors, []);
  assert.deepEqual(s.learning.difficult, []);
  assert.equal(s.users.retention[0].day, 1);
});

test("aggregate: Themen-Schwierigkeit / Modus / Suche / Fehler-je-Version / Segmente", () => {
  const E = []; let q = 0;
  const mk = (event, props) => E.push(Object.assign(
    { v: 1, seq: q++, day: TODAY, clientId: "A", sessionId: "s1", ts: T0, appVersion: "1.120.0", edition: "ecos", platform: "android" },
    { event, props }
  ));
  for (let i = 0; i < 3; i++) mk("card_rated", { rating: "again", cat: "comida" }); // 3x Nochmal
  for (let i = 0; i < 3; i++) mk("card_rated", { rating: "good", cat: "comida" });  // 3x Gut -> 50 %
  mk("session_start", { mode: "listen", scope: "all" });
  mk("session_start", { mode: "flip", scope: "comida" });
  mk("search", { qlen: "3-6", results: "0" });
  mk("search", { qlen: "3-6", results: "1-5" });
  mk("search", { qlen: "3-6", results: "5-20" });
  mk("error", { type: "error", msg: "boom" });
  const s = aggregate(E, [], { now: NOW });
  assert.deepEqual(s.learning.difficult[0], { cat: "comida", total: 6, againPct: 50 });
  const modes = {}; s.learning.modes.forEach((m) => { modes[m.key] = m.count; });
  assert.equal(modes.listen, 1); assert.equal(modes.flip, 1);
  assert.equal(s.search.total, 3); assert.equal(s.search.zero, 1); assert.equal(s.search.noResultPct, 33);
  assert.deepEqual(s.errorsByVersion, [{ key: "1.120.0", count: 1 }]);
  assert.deepEqual(s.segments.editions, [{ key: "ecos", count: 1 }]);
  assert.deepEqual(s.segments.platforms, [{ key: "android", count: 1 }]);
});

test("aggregate: Retention D1, Onboarding-Funnel, Zeit-Verteilung", () => {
  const E = []; let q = 0;
  const mk = (event, props, day, ts, cid) => E.push({ v: 1, seq: q++, event, props, day, ts, clientId: cid, sessionId: "x" + q });
  mk("app_open", {}, YEST, T0 - 86400000, "R"); // R: Erst-Tag gestern …
  mk("app_open", {}, TODAY, T0, "R");           // … und Tag+1 zurück -> retained
  mk("app_open", {}, YEST, T0 - 86400000, "N"); // N: nur Erst-Tag -> nicht retained
  mk("onboarding_step", { step: "intro", n: 0 }, TODAY, T0, "R");
  mk("onboarding_step", { step: "profile", n: 1 }, TODAY, T0, "R");
  mk("onboarding_complete", {}, TODAY, T0, "R");
  const s = aggregate(E, [], { now: NOW });
  const d1 = s.users.retention.find((r) => r.day === 1);
  assert.equal(d1.eligible, 2);
  assert.equal(d1.pct, 50, "nur R kam an Tag+1 zurück");
  const f = {}; s.funnel.forEach((x) => { f[x.step] = x.count; });
  assert.equal(f.intro, 1); assert.equal(f.profile, 1); assert.equal(f.trip, 0); assert.equal(f.complete, 1);
  assert.equal(s.time.byHour.length, 24);
  assert.equal(s.time.byWeekday.length, 7);
  assert.ok(s.time.byHour.reduce((a, b) => a + b.count, 0) > 0);
});

test("aggregate: Akquise, Teilen, Snapshot-Streak/Reviews, WAU-Trend", () => {
  const E = []; let q = 0;
  const mk = (event, props, day, cid) => E.push({ v: 1, seq: q++, event, props, day, ts: T0, clientId: cid, sessionId: "s" + q });
  mk("app_open", { src: "task" }, TODAY, "A");
  mk("app_open", { src: "direct" }, TODAY, "B");
  // Teilen läuft jetzt über das dedizierte share-Event (content), nicht mehr über action:share-*.
  mk("share", { content: "stats" }, TODAY, "A");
  mk("share", { content: "card" }, TODAY, "A");
  mk("action", { action: "open-search" }, TODAY, "A");
  mk("app_open", {}, dayUTC(NOW - 10 * 86400000), "C"); // C nur in der Vorwoche aktiv
  const U = [{ day: TODAY, streak: "4-7", reviews: "51-200" }, { day: TODAY, streak: "4-7", reviews: "11-50" }];
  const s = aggregate(E, U, { now: NOW });
  const acq = {}; s.engagement.acquisition.forEach((a) => { acq[a.key] = a.count; });
  assert.equal(acq.task, 1); assert.equal(acq.direct, 1);
  const sh = s.engagement.share.map((x) => x.key);
  assert.ok(sh.indexOf("stats") >= 0 && sh.indexOf("card") >= 0);
  assert.ok(sh.indexOf("open-search") < 0, "nur geteilte Inhalte (share-Event)");
  const streak = {}; s.meta.snapshotStreak.forEach((x) => { streak[x.key] = x.count; });
  assert.equal(streak["4-7"], 2);
  assert.equal(s.meta.snapshotReviews.length, 2);
  assert.equal(s.users.trendWau7.cur, 2, "A,B in den letzten 7 Tagen");
  assert.equal(s.users.trendWau7.prev, 1, "C in den 7 Tagen davor");
  assert.equal(s.users.trendWau7.deltaPct, 100);
});

test("aggregate: bösartige __proto__-Schlüssel -> keine Prototype-Pollution, kein Crash", () => {
  const E = [
    { v: 1, seq: 0, event: "__proto__", clientId: "__proto__", sessionId: "s1", ts: T0, day: TODAY, edition: "__proto__", platform: "__proto__", props: { cat: "__proto__", rating: "again", action: "__proto__", screen: "__proto__", mode: "__proto__" } },
    { v: 1, seq: 1, event: "action", clientId: "a", sessionId: "s2", ts: T0, day: TODAY, props: { action: "open-search" } },
  ];
  // Snapshot mit echtem eigenen "__proto__"-Property (wie JSON.parse es liefert):
  const U = [JSON.parse('{"day":"' + TODAY + '","streak":"__proto__","reviews":"__proto__","features":{"__proto__":true,"study":true}}')];
  const s = aggregate(E, U, { now: NOW });
  // Global unversehrt (Map schreibt __proto__ NICHT in den Prototyp):
  assert.equal(({}).polluted, undefined);
  assert.equal(Object.prototype.study, undefined);
  // Kein Crash, plausible Aggregate; __proto__ als NORMALER Datenschlüssel gezählt:
  assert.equal(s.totals.events, 2);
  assert.equal(s.totals.users, 2);
  assert.ok(s.engagement.events.map((x) => x.key).indexOf("__proto__") >= 0);
  assert.ok(s.segments.platforms.map((x) => x.key).indexOf("__proto__") >= 0);
});

test("aggregate: Mastery & Trip aus Snapshots", () => {
  const U = [
    { day: TODAY, mastered: "26-50", tripGoal: true, tripDaily: "11-20" },
    { day: TODAY, mastered: "0", tripGoal: false, tripDaily: "0" },
  ];
  const s = aggregate([], U, { now: NOW });
  const m = {}; s.learning.mastery.forEach((x) => { m[x.key] = x.count; });
  assert.equal(m["26-50"], 1);
  assert.equal(s.trip.snapshots, 2);
  assert.equal(s.trip.withGoalPct, 50);
});

// ===== Investor-Cockpit (investor-Block) ================================
function investorFixture() {
  var DAY = 86400000;
  var D = function (o) { return dayUTC(NOW - o * DAY); };
  var t = function (o, sec) { return Date.UTC(2026, 5, 30, 10, 0, 0) - o * DAY + (sec || 0) * 1000; };
  return [
    // A: Erst-Kontakt vor 6 Tagen via module-link, zwei Lernrunden (6d, 1d) -> WAL, aktiviert, wiederkehrend
    { event: "app_open", day: D(6), clientId: "A", sessionId: "a6", ts: t(6), props: { returning: false, src: "module-link" } },
    { event: "session_complete", day: D(6), clientId: "A", sessionId: "a6", ts: t(6, 300), props: { answered_n: 12, correct_n: 9, xp_n: 60, secs: 300, accuracy: "75-90" } },
    { event: "activation", day: D(6), clientId: "A", sessionId: "a6", ts: t(6, 301), props: { milestone: "first_session" } },
    { event: "feature_start", day: D(6), clientId: "A", sessionId: "a6", ts: t(6, 10), props: { feature: "precios" } },
    { event: "feature_complete", day: D(6), clientId: "A", sessionId: "a6", ts: t(6, 200), props: { feature: "precios", perfect: true } },
    { event: "share", day: D(5), clientId: "A", sessionId: "a5", ts: t(5), props: { content: "stats" } },
    { event: "session_complete", day: D(1), clientId: "A", sessionId: "a1", ts: t(1, 180), props: { answered_n: 8, correct_n: 6, xp_n: 30, secs: 180 } },
    // B: heute neu via task, Onboarding fertig, eine Lernrunde, Edition "school"
    { event: "app_open", day: D(0), clientId: "B", sessionId: "b0", ts: t(0), edition: "school", props: { returning: false, src: "task" } },
    { event: "onboarding_complete", day: D(0), clientId: "B", sessionId: "b0", ts: t(0, 5), edition: "school", props: {} },
    { event: "session_complete", day: D(0), clientId: "B", sessionId: "b0", ts: t(0, 120), edition: "school", props: { answered_n: 5, correct_n: 5, xp_n: 20, secs: 120 } },
    { event: "feature_start", day: D(0), clientId: "B", sessionId: "b0", ts: t(0, 3), edition: "school", props: { feature: "dialogos" } },
    // C: nur vor 10 Tagen aktiv -> in dieser Woche abgewandert (churned), Vorwochen-WAL
    { event: "app_open", day: D(10), clientId: "C", sessionId: "c10", ts: t(10), props: { returning: false, src: "direct" } },
    { event: "session_complete", day: D(10), clientId: "C", sessionId: "c10", ts: t(10, 60), props: { answered_n: 3, correct_n: 1, xp_n: 10, secs: 60 } },
  ];
}

test("aggregate: Investor-Block – NSM, Aktivierung, Growth, Virality, Interaktionen, Kohorten, Editionen", () => {
  const s = aggregate(investorFixture(), [], { now: NOW, windowDays: 30 });
  const inv = s.investor;
  // North Star: A+B mit session_complete in letzten 7 T (C ist 10 T alt) -> WAL 2; Vorwoche nur C.
  assert.equal(inv.nsm.wal, 2);
  assert.equal(inv.nsm.trend.prev, 1);
  // Aktivierung: 3 neue Nutzer (Erst-Kontakt im 30-T-Fenster), alle mit Lernrunde -> 100 %.
  assert.equal(inv.activation.newUsers, 3);
  assert.equal(inv.activation.activated, 3);
  assert.equal(inv.activation.ratePct, 100);
  // Growth Accounting: C war letzte Woche aktiv, diese nicht -> 1 abgewandert.
  assert.equal(inv.growth.churned, 1);
  assert.equal(inv.growth.newUsers, 2);
  // Virality: 1 Sharer; 2 im Fenster aktive Share-Installs (A=module-link, B=task).
  assert.equal(inv.virality.sharers, 1);
  assert.equal(inv.virality.sharedInstalls, 2);
  // K-Faktor (7-T-Periode): virale Neuzugänge letzte 7 T (A,B) / aktive Basis Vorwoche (C) = 2/1.
  assert.equal(inv.virality.viralNew7, 2);
  assert.equal(inv.virality.base7, 1);
  assert.equal(inv.virality.kFactor, 2);
  // Interaktionen pro Person: Histogramm summiert auf die Nutzerzahl.
  const perUserTotal = inv.interactions.perUser.histogram.reduce((a, b) => a + b.count, 0);
  assert.equal(perUserTotal, s.totals.users);
  // Time-on-Task: exakte secs gemittelt (300,180,120,60 -> Ø 165, Median 150, 4 Runden).
  assert.equal(inv.timeOnTask.rounds, 4);
  assert.equal(inv.timeOnTask.avgSec, 165);
  assert.equal(inv.timeOnTask.medianSec, 150);
  // Start->Abschluss: precios 1 Start / 1 Abschluss = 100 %.
  const precios = inv.featureFunnel.filter((f) => f.feature === "precios")[0];
  assert.ok(precios && precios.completionPct === 100);
  // Kohorten-Heatmap: der Anker (Tag-0) ist immer 100 %.
  assert.ok(inv.cohorts.length >= 1);
  const anchor = inv.cohorts[0].cells.filter((c) => c.dayN === 0)[0];
  assert.equal(anchor.pct, 100);
  // B2B: Edition "school" mit 1 Nutzer, 100 % aktiviert.
  const school = inv.editions.filter((e) => e.edition === "school")[0];
  assert.ok(school && school.users === 1 && school.activationPct === 100);
  // engagement.share stammt jetzt aus dem share-Event (content), nicht mehr aus dem action-Präfix.
  assert.deepEqual(s.engagement.share, [{ key: "stats", count: 1 }]);
  // WAL/MAU: 2 Wochen-Learner / 3 Monatsnutzer (A,B,C alle im 30-T-Fenster) = 67 %.
  assert.equal(inv.nsm.walMauPct, 67);
  // Runden-Abschlussquote (separater Mini-Datensatz): 2 begonnene, 1 abgeschlossene Runde = 50 %.
  const r = aggregate([
    { event: "session_start", day: TODAY, clientId: "Z", sessionId: "z1", ts: T0, props: {} },
    { event: "session_start", day: TODAY, clientId: "Z", sessionId: "z1", ts: T0 + 1000, props: {} },
    { event: "session_complete", day: TODAY, clientId: "Z", sessionId: "z1", ts: T0 + 2000, props: { secs: 60 } },
  ], [], { now: NOW }).investor.rounds;
  assert.deepEqual(r, { started: 2, completed: 1, completionPct: 50 });
  // Qualität: keine Fehler im Fixture -> 0/Sitzung; Bounce = 2 von 3 Nutzern nur 1 Tag aktiv (B,C) = 67 %.
  assert.equal(inv.quality.errors, 0);
  assert.equal(inv.quality.errorsPerSession, 0);
  assert.equal(inv.quality.bouncePct, 67);
  // KPI-CSV-Export: Kopfzeile + einzelne Kennzahlen (Data-Room/Pitch-Deck).
  const csv = toKpiCsv(s);
  assert.match(csv, /^kpi,wert\n/);
  assert.match(csv, /\nNorth Star WAL,2\n/);
  assert.match(csv, /\nBounce %,67\n/);
  // Ohne Fehler kein Alarm.
  assert.deepEqual(inv.alerts, []);
  // Regressions-Alarm: Version mit >=20 Events und >=5% Fehlerquote wird gemeldet.
  const withErrs = [];
  for (let k = 0; k < 18; k++) withErrs.push({ event: "screen_view", day: TODAY, clientId: "E", sessionId: "e", ts: T0, appVersion: "9.9.9", props: { screen: "home" } });
  withErrs.push({ event: "error", day: TODAY, clientId: "E", sessionId: "e", ts: T0, appVersion: "9.9.9", props: { type: "error", msg: "x" } });
  withErrs.push({ event: "error", day: TODAY, clientId: "E", sessionId: "e", ts: T0, appVersion: "9.9.9", props: { type: "error", msg: "y" } });
  const al = aggregate(withErrs, [], { now: NOW }).investor.alerts;
  assert.equal(al.length, 1);
  assert.deepEqual(al[0], { version: "9.9.9", errors: 2, events: 20, ratePct: 10 });
});
