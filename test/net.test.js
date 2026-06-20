/*
 * net.test.js – Unit-Tests für die geteilte Netz-/Auth-Schicht (net.js / SC.net).
 *
 * net.js ist das gemeinsame Fundament der OPTIONALEN Cloud-Module (sync.js,
 * social.js): EIN fetch-Wrapper, EIN passwortloser Login, EIN Bearer-Token in
 * localStorage. Bricht hier etwas, brechen beide Adapter still – darum sichern
 * wir die Bausteine isoliert ab (kein DOM, kein echtes Netz):
 *
 *   - Token-Roundtrip get/set/loggedIn/logout (TOKEN_KEY)
 *   - request(): hängt Authorization NUR bei Token an, stringifiziert den Body,
 *     parst die JSON-Antwort, liefert {ok,status,body} und überlebt 4xx/5xx
 *     sowie kaputtes JSON (body:null)
 *   - login()/confirm(): richtige POST-Pfade + Token-Speicherung, Shapes
 *     identisch zum Referenz-Mock (tools/mock-sync-server.js)
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// window- und In-Memory-localStorage-Shim (Muster aus bundle.test.js): net.js
// ist eine Browser-IIFE und greift auf window + localStorage zu.
globalThis.window = globalThis.window || {};
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};

require(path.join(__dirname, "..", "net.js"));
const { net } = globalThis.window.SC;

// fetch-Mock: jeder Test setzt mit stubFetch() seine Antwort + greift die
// zuletzt gesehene Anfrage über `last` ab.
let last = null;
function stubFetch(impl) {
  globalThis.fetch = (url, opts) => {
    last = { url, opts: opts || {} };
    return Promise.resolve(impl(url, opts || {}));
  };
}
// Bequemer fetch-Response-Shim: text() liefert den Roh-Body (wie net.js ihn liest).
function res(status, text) {
  return { ok: status >= 200 && status < 300, status, text: () => Promise.resolve(text) };
}

function reset() {
  for (const k of Object.keys(mem)) delete mem[k];
  last = null;
}

test("TOKEN_KEY ist stabil und reist NICHT im Backup mit (Konstante)", () => {
  assert.equal(net.TOKEN_KEY, "spanischcard.synctoken.v1");
});

test("Token-Roundtrip: set/get/loggedIn/logout", () => {
  reset();
  assert.equal(net.getToken(), null, "frisch: kein Token");
  assert.equal(net.loggedIn(), false);

  net.setToken("abc123");
  assert.equal(net.getToken(), "abc123");
  assert.equal(net.loggedIn(), true);
  assert.equal(mem[net.TOKEN_KEY], "abc123", "landet unter TOKEN_KEY");

  net.logout();
  assert.equal(net.getToken(), null, "logout entfernt das Token");
  assert.equal(net.loggedIn(), false);
  assert.ok(!(net.TOKEN_KEY in mem), "Schlüssel ist wirklich gelöscht");

  // setToken(null/leer) = ebenfalls löschen.
  net.setToken("x");
  net.setToken(null);
  assert.equal(net.getToken(), null);
  net.setToken("y");
  net.setToken("");
  assert.equal(net.getToken(), null, "leerer String löscht ebenfalls");
});

test("request: OHNE Token kein Authorization-Header, Content-Type immer JSON", async () => {
  reset();
  stubFetch(() => res(200, JSON.stringify({ hi: true })));
  const r = await net.request("http://api", "GET", "/v1/ping");

  assert.equal(last.url, "http://api/v1/ping", "base + path");
  assert.equal(last.opts.method, "GET");
  assert.equal(last.opts.headers["Content-Type"], "application/json");
  assert.ok(!("Authorization" in last.opts.headers), "ohne Token KEIN Authorization");
  assert.equal(last.opts.body, undefined, "GET ohne Body -> kein body");
  assert.deepEqual(r, { ok: true, status: 200, body: { hi: true } });
});

test("request: MIT Token Authorization: Bearer <token>", async () => {
  reset();
  net.setToken("tok-42");
  stubFetch(() => res(200, "{}"));
  await net.request("http://api", "GET", "/v1/sync");
  assert.equal(last.opts.headers.Authorization, "Bearer tok-42");
});

test("request: stringifiziert den Body, parst die JSON-Antwort", async () => {
  reset();
  stubFetch(() => res(200, JSON.stringify({ rev: 7 })));
  const r = await net.request("http://api", "PUT", "/v1/sync", { payload: { a: 1 }, baseRev: 3 });

  assert.equal(last.opts.method, "PUT");
  assert.equal(typeof last.opts.body, "string", "Body ist JSON-String, nicht Objekt");
  assert.deepEqual(JSON.parse(last.opts.body), { payload: { a: 1 }, baseRev: 3 });
  assert.deepEqual(r.body, { rev: 7 });
});

test("request: 4xx -> {ok:false} mit Status und Fehler-Body", async () => {
  reset();
  stubFetch(() => res(401, JSON.stringify({ error: "unauthorized" })));
  const r = await net.request("http://api", "GET", "/v1/sync");
  assert.equal(r.ok, false);
  assert.equal(r.status, 401);
  assert.deepEqual(r.body, { error: "unauthorized" });
});

test("request: 5xx -> {ok:false} (Server-Fehler durchgereicht, nicht geworfen)", async () => {
  reset();
  stubFetch(() => res(500, JSON.stringify({ error: "boom" })));
  const r = await net.request("http://api", "POST", "/v1/sync", { x: 1 });
  assert.equal(r.ok, false);
  assert.equal(r.status, 500);
  assert.deepEqual(r.body, { error: "boom" });
});

test("request: kaputtes/leeres JSON -> body:null (tolerantes Parsen)", async () => {
  reset();
  stubFetch(() => res(200, "<html>nope</html>"));
  const bad = await net.request("http://api", "GET", "/x");
  assert.equal(bad.ok, true);
  assert.equal(bad.body, null, "unparsbarer Text -> body null, kein Throw");

  stubFetch(() => res(204, ""));
  const empty = await net.request("http://api", "GET", "/y");
  assert.equal(empty.body, null, "leerer Body -> null");
});

test("login: POST /v1/auth/start, devToken wird gespeichert (Mock-Demo-Kurzschluss)", async () => {
  reset();
  // Shape exakt wie tools/mock-sync-server.js /v1/auth/start.
  stubFetch(() => res(200, JSON.stringify({ devToken: "dev-xyz", account: { email: "a@b" } })));
  const r = await net.login("http://api", "  a@b  ");

  assert.equal(last.url, "http://api/v1/auth/start");
  assert.equal(last.opts.method, "POST");
  assert.deepEqual(JSON.parse(last.opts.body), { email: "a@b" }, "E-Mail getrimmt");
  assert.equal(net.getToken(), "dev-xyz", "devToken sofort gespeichert");
  assert.deepEqual(r, { account: { email: "a@b" } });
});

test("login: ohne devToken (echter Magic-Link/OTP-Flow) -> {pending:true}, kein Token", async () => {
  reset();
  stubFetch(() => res(200, JSON.stringify({ ok: true })));
  const r = await net.login("http://api", "x@y");
  assert.deepEqual(r, { pending: true });
  assert.equal(net.getToken(), null, "ohne devToken bleibt man abgemeldet");
});

test("confirm: POST /v1/auth/confirm, accessToken wird gespeichert", async () => {
  reset();
  // Shape exakt wie tools/mock-sync-server.js /v1/auth/confirm.
  stubFetch(() => res(200, JSON.stringify({ accessToken: "acc-xyz", account: { email: "a@b" } })));
  const r = await net.confirm("http://api", "a@b", "123456");

  assert.equal(last.url, "http://api/v1/auth/confirm");
  assert.equal(last.opts.method, "POST");
  assert.deepEqual(JSON.parse(last.opts.body), { email: "a@b", token: "123456" });
  assert.equal(net.getToken(), "acc-xyz");
  assert.equal(r.accessToken, "acc-xyz");
});

test("confirm: ohne accessToken -> wirft (kein stilles Anmelden)", async () => {
  reset();
  stubFetch(() => res(400, JSON.stringify({ error: "bad token" })));
  await assert.rejects(() => net.confirm("http://api", "a@b", "wrong"), /confirm failed/);
  assert.equal(net.getToken(), null, "fehlgeschlagenes confirm setzt kein Token");
});

test("confirm: accessToken im Body, aber HTTP-Fehler -> wirft, kein Token (r.ok zählt)", async () => {
  reset();
  // Body trägt zwar ein accessToken, der Status ist aber 4xx -> NICHT anmelden.
  stubFetch(() => res(400, JSON.stringify({ accessToken: "sneaky" })));
  await assert.rejects(() => net.confirm("http://api", "a@b", "x"), /confirm failed/);
  assert.equal(net.getToken(), null, "ok=false darf trotz Token-Feld nicht anmelden");
});

test("confirm: ok, aber Body ohne accessToken-Feld -> wirft, kein Token", async () => {
  reset();
  stubFetch(() => res(200, JSON.stringify({ account: { email: "a@b" } })));
  await assert.rejects(() => net.confirm("http://api", "a@b", "x"), /confirm failed/);
  assert.equal(net.getToken(), null, "ohne accessToken-Feld kein stilles Anmelden");
});
