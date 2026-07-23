/*
 * api-telemetry-routes.test.js – Tests der PRODUKTIONS-Ingest-Routen
 * (api/_v1/events.js + api/_v1/usage.js) mit gestubbter Infrastruktur
 * (require.cache-Stubs für _supabase/_ratelimit – kein Netz, keine Env-Vars):
 * Methoden-Gate, 400 bei kaputtem/zu großem Body, der serverseitige
 * props-Sanitizer (Flut-/Pollution-Schutz des auth-freien Endpunkts), 429,
 * 500 bei Insert-Fehler (Client behält Snapshot/Events) und die DSGVO-Löschung.
 * Diese Routen waren bislang nur manuell/live verifiziert (docs/TELEMETRIE.md §10).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// ---- Infrastruktur-Stubs (MÜSSEN vor dem Laden der Handler im Cache liegen) ----
const state = {
  allowNext: true,   // Antwort des Rate-Limiters
  insertError: null, // Fehler, den der Supabase-Insert melden soll
  inserted: [],      // { table, rows }
  deleted: [],       // { table, col, val }
};
const fakeDb = {
  from(table) {
    return {
      insert: async (rows) => { state.inserted.push({ table, rows }); return { error: state.insertError }; },
      delete() { return { eq: async (col, val) => { state.deleted.push({ table, col, val }); return {}; } }; },
    };
  },
};
function stub(rel, exportsObj) {
  const p = require.resolve(rel);
  require.cache[p] = { id: p, filename: p, loaded: true, exports: exportsObj };
}
stub("../api/_supabase.js", { service: () => fakeDb });
stub("../api/_ratelimit.js", { allow: async () => state.allowNext, clientIp: () => "203.0.113.7" });

const eventsHandler = require(path.join(__dirname, "..", "api", "_v1", "events.js"));
const usageHandler = require(path.join(__dirname, "..", "api", "_v1", "usage.js"));

// Minimales Vercel-req/res-Paar. body als Objekt -> _http.readJson nutzt es direkt.
function mkReq(method, body, query) {
  return { method, body: body === undefined ? {} : body, query: query || {}, headers: {}, socket: { remoteAddress: "203.0.113.7" } };
}
function mkRes() {
  const res = {
    statusCode: 0, headers: {}, body: undefined,
    status(n) { res.statusCode = n; return res; },
    setHeader(k, v) { res.headers[k] = v; return res; },
    end(b) { res.body = b ? JSON.parse(b) : undefined; },
  };
  return res;
}
function reset() { state.allowNext = true; state.insertError = null; state.inserted.length = 0; state.deleted.length = 0; }
const ENV = { v: 1, ts: 1750000000000, day: "2026-06-30", clientId: "cidA", sessionId: "sidA", seq: 0, appVersion: "1.120.0", locale: "de", track: "de-es", edition: "none", platform: "android" };

test("events: OPTIONS 204, falsche Methode 405, kaputter Body 400", async () => {
  reset();
  let res = mkRes();
  await eventsHandler(mkReq("OPTIONS"), res);
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers["Access-Control-Allow-Origin"], "*", "CORS für sendBeacon/file://-Origins");

  res = mkRes();
  await eventsHandler(mkReq("GET"), res);
  assert.equal(res.statusCode, 405);

  res = mkRes();
  await eventsHandler(mkReq("POST", { events: "kein array" }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(state.inserted.length, 0, "nichts geschrieben");
});

test("events: Body-Größenlimit 64 KB -> 400 (Client behält den Batch)", async () => {
  reset();
  const res = mkRes();
  await eventsHandler(mkReq("POST", { events: [Object.assign({}, ENV, { event: "error", props: { msg: "x".repeat(70000) } })] }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(state.inserted.length, 0);
});

test("events: gültiger Batch wird gemappt (camelCase -> snake_case) und geschrieben", async () => {
  reset();
  const res = mkRes();
  await eventsHandler(mkReq("POST", { events: [Object.assign({}, ENV, { event: "screen_view", props: { screen: "home" } })] }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(state.inserted.length, 1);
  assert.equal(state.inserted[0].table, "event");
  const row = state.inserted[0].rows[0];
  assert.equal(row.client_id, "cidA");
  assert.equal(row.session_id, "sidA");
  assert.equal(row.app_version, "1.120.0");
  assert.deepEqual(row.props, { screen: "home" });
});

test("events: props-Sanitizer deckelt den auth-freien Endpunkt (Flut-/Pollution-Schutz)", async () => {
  reset();
  const dirty = {
    ok_bool: true, ok_num: 3.5, ok_str: "a".repeat(200),          // String wird auf 80 gekappt
    nested: { deep: { blob: "x".repeat(500) } }, arr: [1, 2, 3],   // Objekte/Arrays fliegen raus
    bad_num: Infinity, fn: null,                                   // nicht-endlich/null fliegt raus
    "kein slug!": 1, "": 2,                                        // Schlüssel außerhalb des Musters
    __proto__: { polluted: true },                                 // Pollution-Versuch (Objekt -> raus)
  };
  // > 16 gültige Felder: nur die ersten 16 kommen durch.
  for (let i = 0; i < 20; i++) dirty["extra_" + i] = i;
  const res = mkRes();
  await eventsHandler(mkReq("POST", { events: [Object.assign({}, ENV, { event: "error", props: dirty })] }), res);
  assert.equal(res.statusCode, 200);
  const props = state.inserted[0].rows[0].props;
  assert.equal(props.ok_bool, true);
  assert.equal(props.ok_num, 3.5);
  assert.equal(props.ok_str.length, 80, "String hart gekappt");
  assert.ok(!("nested" in props) && !("arr" in props) && !("bad_num" in props) && !("fn" in props), "nur bool/endliche Zahl/String");
  assert.ok(!("kein slug!" in props) && !("" in props), "nur Slug-Schlüssel");
  assert.ok(Object.keys(props).length <= 16, "höchstens 16 Felder (war: beliebiges 64-KB-JSON)");
  assert.equal({}.polluted, undefined, "Object.prototype nicht verseucht");
  assert.equal(Object.getPrototypeOf(props), Object.prototype, "props-Prototyp unangetastet");
});

test("events: 429 wenn das Rate-Limit zuschlägt; 500 bei Insert-Fehler (kein stilles 200)", async () => {
  reset();
  state.allowNext = false;
  let res = mkRes();
  await eventsHandler(mkReq("POST", { events: [Object.assign({}, ENV, { event: "app_open" })] }), res);
  assert.equal(res.statusCode, 429);
  assert.equal(state.inserted.length, 0);

  reset();
  state.insertError = { message: "schema drift" };
  res = mkRes();
  await eventsHandler(mkReq("POST", { events: [Object.assign({}, ENV, { event: "app_open" })] }), res);
  assert.equal(res.statusCode, 500, "Client entfernt Events erst bei ok:true aus der Queue");
});

test("events: DSGVO-Löschung per clientId (DELETE)", async () => {
  reset();
  let res = mkRes();
  await eventsHandler(mkReq("DELETE", undefined, {}), res);
  assert.equal(res.statusCode, 400, "ohne clientId keine Löschung");

  res = mkRes();
  await eventsHandler(mkReq("DELETE", undefined, { clientId: "cidA" }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.deleted, true);
  assert.deepEqual(state.deleted, [{ table: "event", col: "client_id", val: "cidA" }]);
});

test("usage: Methoden-Gate, Snapshot-Mapping (Buckets/Features/trip_goal strikt boolesch)", async () => {
  reset();
  let res = mkRes();
  await usageHandler(mkReq("GET"), res);
  assert.equal(res.statusCode, 405);

  res = mkRes();
  await usageHandler(mkReq("POST", {
    app: "holaruta", schema: 1, day: "2026-06-30", appVersion: "1.120.0", locale: "de", track: "de-es",
    edition: "ecos", platform: "android", cardsToday: "11-30", streak: "8-30", reviews: "201-1000",
    mastered: "26-50", tripGoal: "ja", tripDaily: "11-20",
    features: { study: true, precios: 1, unbekannt: true }, extra: "weg",
  }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(state.inserted[0].table, "usage_snapshot");
  // usage.js schreibt EIN Objekt (kein Array wie events.js).
  const snap = Array.isArray(state.inserted[0].rows) ? state.inserted[0].rows[0] : state.inserted[0].rows;
  assert.equal(snap.day, "2026-06-30");
  assert.equal(snap.cards_bucket, "11-30");
  assert.equal(snap.mastered_bucket, "26-50");
  assert.equal(snap.trip_goal, false, "nur echtes true wird true (kein truthy-String)");
  assert.equal(snap.features.study, true);
  assert.equal(snap.features.precios, true, "truthy -> boolesch gezwungen");
  assert.ok(!("unbekannt" in snap.features), "nur bekannte Feature-Schlüssel");
  assert.ok(!("extra" in snap), "unbekannte Felder reisen nicht in die DB");
});

test("usage: 400 bei kaputtem/zu großem Body, 429 beim Rate-Limit, 500 bei Insert-Fehler", async () => {
  reset();
  let res = mkRes();
  await usageHandler(mkReq("POST", { day: "2026-06-30", note: "x".repeat(5000) }), res);
  assert.equal(res.statusCode, 400, "> 4 KB -> 400");

  reset();
  state.allowNext = false;
  res = mkRes();
  await usageHandler(mkReq("POST", { day: "2026-06-30" }), res);
  assert.equal(res.statusCode, 429);

  reset();
  state.insertError = { message: "unbekannte Spalte" };
  res = mkRes();
  await usageHandler(mkReq("POST", { day: "2026-06-30" }), res);
  assert.equal(res.statusCode, 500, "Client merkt sich den Tag erst bei ok:true");
});
