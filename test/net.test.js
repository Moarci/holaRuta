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

test("login: Serverfehler (429/400/502) -> lehnt ab, NICHT pending (kein falsches Mail-pruefen)", async () => {
  reset();
  stubFetch(() => res(429, JSON.stringify({ error: "rate limited" })));
  await assert.rejects(() => net.login("http://api", "x@y"), /login failed/);
  assert.equal(net.getToken(), null, "bei Fehler kein Token gespeichert");
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

// ---- Timeout + opt-in Retry/Backoff (Härtung) ----

test("request: opts.timeout bricht einen hängenden fetch ab (AbortController)", async () => {
  reset();
  // fetch, das nie antwortet, aber auf das Abort-Signal hört.
  globalThis.fetch = (url, opts) => new Promise((_resolve, reject) => {
    const sig = opts && opts.signal;
    if (sig) sig.addEventListener("abort", () => reject(new Error("aborted")));
  });
  await assert.rejects(
    () => net.request("http://api", "GET", "/slow", null, { timeout: 5, retries: 0 }),
    /aborted/,
    "kurzer Timeout bricht den Request ab",
  );
});

test("request: ohne opts.retries wird ein 503 NICHT wiederholt (unverändertes Verhalten)", async () => {
  reset();
  let calls = 0;
  globalThis.fetch = () => { calls++; return Promise.resolve(res(503, "{}")); };
  const r = await net.request("http://api", "GET", "/x");
  assert.equal(calls, 1, "genau ein Versuch ohne Retry-Budget");
  assert.equal(r.ok, false);
  assert.equal(r.status, 503, "transienter Status wird unverändert durchgereicht");
});

test("request: opts.retries wiederholt transiente Fehler (503) mit Backoff bis zum Erfolg", async () => {
  reset();
  let calls = 0;
  globalThis.fetch = (url, opts) => {
    calls++; last = { url, opts: opts || {} };
    return Promise.resolve(calls < 3 ? res(503, "{}") : res(200, JSON.stringify({ ok: 1 })));
  };
  const r = await net.request("http://api", "GET", "/v1/sync", null, { retries: 3, backoff: 1 });
  assert.equal(calls, 3, "zwei Wiederholungen nach 503, dann Erfolg");
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: 1 });
});

test("request: opts.retries wiederholt auch Netzwerkfehler (fetch rejectet)", async () => {
  reset();
  let calls = 0;
  globalThis.fetch = () => {
    calls++;
    return calls === 1 ? Promise.reject(new Error("network down")) : Promise.resolve(res(200, JSON.stringify({ ok: 1 })));
  };
  const r = await net.request("http://api", "GET", "/x", null, { retries: 2, backoff: 1 });
  assert.equal(calls, 2, "ein Netzwerkfehler, dann Erfolg");
  assert.equal(r.status, 200);
});

test("request: erschöpftes Retry-Budget bei Dauer-Netzwerkfehler wirft am Ende", async () => {
  reset();
  let calls = 0;
  globalThis.fetch = () => { calls++; return Promise.reject(new Error("network down")); };
  await assert.rejects(
    () => net.request("http://api", "GET", "/x", null, { retries: 2, backoff: 1 }),
    /network down/,
  );
  assert.equal(calls, 3, "Erstversuch + 2 Wiederholungen, dann Aufgabe");
});

test("request: 4xx wird trotz Retry-Budget NICHT wiederholt (kein transienter Fehler)", async () => {
  reset();
  let calls = 0;
  globalThis.fetch = () => { calls++; return Promise.resolve(res(401, JSON.stringify({ error: "nope" }))); };
  const r = await net.request("http://api", "GET", "/x", null, { retries: 3, backoff: 1 });
  assert.equal(calls, 1, "401 ist dauerhaft -> kein Retry");
  assert.equal(r.status, 401);
});

test("request: JEDER transiente Status (408/425/429/500/502/503/504) löst genau einen Retry aus", async () => {
  // Verriegelt die komplette TRANSIENT_STATUS-Tabelle (jeder Schlüssel + Wert) und
  // dass retries:1 GENAU einen erneuten Versuch bedeutet (> 0, nicht > 1).
  for (const status of [408, 425, 429, 500, 502, 503, 504]) {
    reset();
    let calls = 0;
    globalThis.fetch = () => { calls++; return Promise.resolve(calls < 2 ? res(status, "{}") : res(200, JSON.stringify({ ok: 1 }))); };
    const r = await net.request("http://api", "GET", "/x", null, { retries: 1, backoff: 1 });
    assert.equal(calls, 2, `Status ${status} muss GENAU einen Retry auslösen`);
    assert.equal(r.status, 200, `Status ${status} -> nach Retry Erfolg`);
  }
});

test("request: timeout 0 schaltet den Timeout ab (kein AbortController, kein Abbruch)", async () => {
  reset();
  // fetch hört aufs Abort-Signal UND antwortet sonst nach 10ms normal.
  globalThis.fetch = (url, opts) => new Promise((resolve, reject) => {
    const sig = opts && opts.signal;
    if (sig) sig.addEventListener("abort", () => reject(new Error("aborted")));
    setTimeout(() => resolve(res(200, JSON.stringify({ ok: 1 }))), 10);
  });
  // timeout 0 -> es darf KEIN AbortController/Timer entstehen (sonst setTimeout(0) -> sofort abort).
  const r = await net.request("http://api", "GET", "/x", null, { timeout: 0, retries: 0 });
  assert.equal(r.status, 200, "timeout 0 -> keine Abort-Verdrahtung -> normale Antwort");
});

test("request: kleiner opts.timeout wird benutzt (bricht VOR einer langsamen Antwort ab, nicht der 12s-Default)", async () => {
  reset();
  globalThis.fetch = (url, opts) => new Promise((resolve, reject) => {
    const sig = opts && opts.signal;
    if (sig) sig.addEventListener("abort", () => reject(new Error("aborted")));
    setTimeout(() => resolve(res(200, "{}")), 200); // „langsame" Antwort erst nach 200ms
  });
  // Mit dem gemeldeten Timeout (10ms) bricht der Request VOR der 200ms-Antwort ab.
  // Würde fälschlich der Default (12s) greifen, käme die 200ms-Antwort zuerst -> kein Abbruch.
  await assert.rejects(
    () => net.request("http://api", "GET", "/x", null, { timeout: 10, retries: 0 }),
    /aborted/,
  );
});

// ---- Google-OAuth (net.googleStart / net.googleConfirm) ----------------------

test("googleConfirm: tauscht Supabase-Token gegen Session-Token und speichert es", async () => {
  reset();
  stubFetch(() => res(200, JSON.stringify({ accessToken: "hr-google-1", account: { email: "g@x" } })));
  const r = await net.googleConfirm("http://api", "supabase-jwt");
  assert.equal(last.url, "http://api/v1/auth/google/confirm", "richtiger Pfad");
  assert.equal(last.opts.method, "POST");
  assert.deepEqual(JSON.parse(last.opts.body), { supabaseToken: "supabase-jwt" }, "sendet supabaseToken");
  assert.equal(r.accessToken, "hr-google-1");
  assert.equal(net.getToken(), "hr-google-1", "Token landet in localStorage");
  assert.equal(net.loggedIn(), true);
});

test("googleConfirm: ohne accessToken -> wirft, kein Token (kein stilles Anmelden)", async () => {
  reset();
  stubFetch(() => res(401, JSON.stringify({ error: "invalid token" })));
  await assert.rejects(() => net.googleConfirm("http://api", "bad"), /google confirm failed/);
  assert.equal(net.getToken(), null);
});

test("googleConfirm: accessToken im Body, aber HTTP-Fehler -> wirft, kein Token", async () => {
  reset();
  stubFetch(() => res(400, JSON.stringify({ accessToken: "sneaky" })));
  await assert.rejects(() => net.googleConfirm("http://api", "x"), /google confirm failed/);
  assert.equal(net.getToken(), null, "r.ok zählt, nicht nur das Feld");
});

test("googleStart: baut die Start-URL mit encodetem redirect (kein window -> No-op)", () => {
  reset();
  // In der Testumgebung gibt es kein echtes window.location.href-Setter -> googleStart
  // faengt das ab und liefert die URL trotzdem als Rueckgabe zurück.
  const url = net.googleStart("http://api", "https://app.example/auth-callback.html");
  assert.equal(
    url,
    "http://api/v1/auth/google/start?redirect=" + encodeURIComponent("https://app.example/auth-callback.html"),
    "redirect ist URL-encodet und haengt an /v1/auth/google/start",
  );
});

test("request: timeout-Grenze ist strikt > 0 (timeout:1 verdrahtet noch einen AbortController und bricht ab)", async () => {
  reset();
  // Langsame Antwort (120ms); der 1ms-Abort-Timer feuert zuverlässig davor.
  globalThis.fetch = (url, opts) => new Promise((resolve, reject) => {
    const sig = opts && opts.signal;
    if (sig) sig.addEventListener("abort", () => reject(new Error("aborted")));
    setTimeout(() => resolve(res(200, "{}")), 120);
  });
  // timeout:1 -> `timeout > 0` ist wahr -> AbortController + 1ms-Timer -> Abbruch.
  // Tötet die Mutante `timeout > 1` (die bei timeout:1 KEINEN Controller verdrahtete
  // und die 120ms-Antwort normal durchließe, statt abzubrechen).
  await assert.rejects(
    () => net.request("http://api", "GET", "/x", null, { timeout: 1, retries: 0 }),
    /aborted/,
  );
});

// ---- Login-CSRF-state (net.oauthStateStart / net.oauthStateCheck) -------------
// sessionStorage- + crypto-Shim (net.js liest beide als globale Browser-APIs).
const smem = {};
globalThis.sessionStorage = {
  getItem: (k) => (k in smem ? smem[k] : null),
  setItem: (k, v) => { smem[k] = String(v); },
  removeItem: (k) => { delete smem[k]; },
};
function sreset() { for (const k of Object.keys(smem)) delete smem[k]; }
// Deterministische Zufallsquelle: buf[i] = i -> vorhersagbarer Hex-String. `crypto`
// ist auf globalThis nur ein Getter -> per defineProperty (writable) überschreiben,
// damit einzelne Tests es kurzfristig weiter anpassen können.
const DETERMINISTIC_CRYPTO = { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = i; return a; } };
Object.defineProperty(globalThis, "crypto", { value: DETERMINISTIC_CRYPTO, configurable: true, writable: true });
const STATE_KEY = "spanischcard.oauthstate.v1";

test("oauthStateStart: erzeugt 32-stelligen Hex-state und legt ihn im sessionStorage ab", () => {
  sreset();
  const st = net.oauthStateStart();
  assert.match(st, /^[0-9a-f]{32}$/, "16 Bytes -> 32 Hex-Zeichen");
  assert.equal(st, "000102030405060708090a0b0c0d0e0f", "deterministischer Shim (buf[i]=i)");
  assert.equal(smem[STATE_KEY], st, "unter dem state-Key gespeichert");
});

test("oauthStateStart: ohne crypto.getRandomValues -> '' und nichts gespeichert (fail closed)", () => {
  sreset();
  const saved = globalThis.crypto;
  globalThis.crypto = {};
  try {
    assert.equal(net.oauthStateStart(), "");
    assert.equal(STATE_KEY in smem, false, "kein state abgelegt");
  } finally { globalThis.crypto = saved; }
});

test("oauthStateCheck: exakte Übereinstimmung -> true UND state wird einmalig gelöscht (kein Replay)", () => {
  sreset();
  const st = net.oauthStateStart();
  assert.equal(net.oauthStateCheck(st), true, "gleicher state -> ok");
  assert.equal(STATE_KEY in smem, false, "nach der Prüfung gelöscht (Single-Use)");
  assert.equal(net.oauthStateCheck(st), false, "zweiter Versuch (Replay) -> false");
});

test("oauthStateCheck: falscher state -> false (untergeschobener Angreifer-Link)", () => {
  sreset();
  net.oauthStateStart();
  assert.equal(net.oauthStateCheck("deadbeefdeadbeefdeadbeefdeadbeef"), false);
});

test("oauthStateCheck: kein gespeicherter state (Flow nie in diesem Browser gestartet) -> false", () => {
  sreset();
  assert.equal(net.oauthStateCheck("000102030405060708090a0b0c0d0e0f"), false);
});

test("oauthStateCheck: leerer got -> false, selbst wenn ein state gespeichert ist", () => {
  sreset();
  net.oauthStateStart();
  assert.equal(net.oauthStateCheck(""), false);
});
