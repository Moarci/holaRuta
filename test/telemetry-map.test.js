/*
 * telemetry-map.test.js – Tests für die reinen Mapper, die Supabase-Zeilen
 * (snake_case, `event`/`usage_snapshot`) zurück auf das aggregate()-Envelope
 * (camelCase, tools/telemetry-server.js) abbilden.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { mapEventRow, mapUsageRow } = require(path.join(__dirname, "..", "tools", "telemetry-map.js"));

test("mapEventRow: bildet eine volle Supabase-event-Zeile auf das Envelope ab", () => {
  const row = {
    id: 42, v: 1, ts: 1753100000000, day: "2026-07-22",
    client_id: "c1", session_id: "s1", seq: 3,
    app_version: "1.120.0", locale: "de", track: "de-es",
    edition: "launch", platform: "desktop",
    event: "session_complete", props: { answered_n: 10 },
    received_at: "2026-07-22T12:00:00Z",
  };
  assert.deepEqual(mapEventRow(row), {
    v: 1, ts: 1753100000000, day: "2026-07-22",
    clientId: "c1", sessionId: "s1", seq: 3,
    appVersion: "1.120.0", locale: "de", track: "de-es",
    edition: "launch", platform: "desktop",
    event: "session_complete", props: { answered_n: 10 },
  });
});

test("mapEventRow: fehlende/kaputte Felder -> null statt undefined, props default {}", () => {
  const row = { day: "2026-07-22", client_id: "c1", event: "app_open", props: null };
  const out = mapEventRow(row);
  assert.equal(out.v, null);
  assert.equal(out.ts, null);
  assert.equal(out.sessionId, null);
  assert.deepEqual(out.props, {});
});

test("mapEventRow: props als Array wird verworfen (Envelope erwartet ein Objekt)", () => {
  const out = mapEventRow({ day: "2026-07-22", event: "app_open", props: ["x"] });
  assert.deepEqual(out.props, {});
});

test("mapEventRow: kein Objekt -> null (kein Crash)", () => {
  assert.equal(mapEventRow(null), null);
  assert.equal(mapEventRow("nope"), null);
});

test("mapUsageRow: bildet eine volle usage_snapshot-Zeile ab (inkl. mastered/tripGoal/tripDaily)", () => {
  const row = {
    id: 7, day: "2026-07-22", app_version: "1.120.0", locale: "de", track: "de-es",
    edition: "launch", platform: "desktop",
    cards_bucket: "11-30", streak_bucket: "1-3", reviews_bucket: "51-200",
    mastered_bucket: "50-75", trip_goal: true, trip_daily_bucket: "11-20",
    features: { study: true, listen: false },
    received_at: "2026-07-22T12:00:00Z",
  };
  assert.deepEqual(mapUsageRow(row), {
    day: "2026-07-22", appVersion: "1.120.0", locale: "de", track: "de-es",
    edition: "launch", platform: "desktop",
    cardsToday: "11-30", streak: "1-3", reviews: "51-200",
    mastered: "50-75", tripGoal: true, tripDaily: "11-20",
    features: { study: true, listen: false },
  });
});

test("mapUsageRow: trip_goal ist strikt boolesch (nur true -> true), features default {}", () => {
  const out = mapUsageRow({ day: "2026-07-22", trip_goal: null, features: null });
  assert.equal(out.tripGoal, false);
  assert.deepEqual(out.features, {});
});

test("mapUsageRow: kein Objekt -> null (kein Crash)", () => {
  assert.equal(mapUsageRow(undefined), null);
  assert.equal(mapUsageRow(5), null);
});
