/*
 * analytics.test.js – Tests für den REINEN Kern + das Consent-Gate der optionalen,
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

test("buildUsageSnapshot: Lernfortschritt/Trip/Edition/Plattform gebucketet", () => {
  const snap = analytics.buildUsageSnapshot({}, { day: "2026-06-30", masteredPct: 42, hasTripGoal: true, tripPerDay: 15, edition: "ecos", platform: "android" });
  assert.equal(snap.mastered, "26-50", "42 % gemeistert -> Bucket");
  assert.equal(snap.tripGoal, true);
  assert.equal(snap.tripDaily, "11-20");
  assert.equal(snap.edition, "ecos");
  assert.equal(snap.platform, "android");
  // Defaults ohne Angabe:
  const def = analytics.buildUsageSnapshot({}, { day: "2026-06-30" });
  assert.equal(def.edition, "none");
  assert.equal(def.platform, "other");
  assert.equal(def.mastered, "0");
  assert.equal(def.tripGoal, false);
});

test("buildUsageSnapshot: Datenminimierung – feste Allowlist, keine PII/IDs/exakten Zähler", () => {
  const g = {
    dailyCounts: { "2026-06-30": 12 }, dailyStreak: 9, reviews: 412,
    placement: { level: "B1" }, progress: { card123: {} }, userName: "Marcel",
  };
  const snap = analytics.buildUsageSnapshot(g, { day: "2026-06-30" });
  assert.deepEqual(
    Object.keys(snap).sort(),
    ["app", "appVersion", "cardsToday", "day", "edition", "features", "locale", "mastered", "platform", "reviews", "schema", "streak", "track", "tripDaily", "tripGoal"]
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

// Der Default lebt NICHT in analytics.js (das Modul verlangt immer strikt
// consent === true), sondern im Controller app.js. Seit dem Wechsel auf OPT-OUT muss
// dort ausnahmslos `!== false` stehen: ein `=== true` würde still auf Opt-in
// zurückfallen und damit Bestandsprofile ohne gespeicherte Wahl ausschließen.
test("app.js leitet den Consent als OPT-OUT ab (!== false, nirgends === true)", () => {
  const src = require("fs").readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const optOut = src.match(/settings\.analyticsConsent !== false/g) || [];
  const optIn = src.match(/settings\.analyticsConsent === true/g) || [];
  assert.equal(optIn.length, 0, "kein Opt-in-Rest (=== true) in app.js");
  assert.equal(optOut.length, 2, "Consent wird an beiden Stellen (View-Model + analyticsCtx) als Opt-out abgeleitet");
});

test("dayKey: lokales YYYY-MM-DD (zweistellig)", () => {
  const k = analytics.dayKey(new Date(2026, 0, 5, 12, 0, 0).getTime()); // 5. Jan
  assert.equal(k, "2026-01-05");
});

// ===== Event-Pipeline (Interaktions-Tracking) ============================

test("sanitizeProps: behält nur die Allowlist, verwirft Freitext & unbekannte Keys", () => {
  assert.deepEqual(
    analytics.sanitizeProps("action", { action: "open-search", mode: "flip", note: "geheim", scope: "transporte" }),
    { action: "open-search", mode: "flip", scope: "transporte" }
  );
  // Freitext (Leerzeichen) fällt strukturell durch den Slug-Filter.
  assert.deepEqual(analytics.sanitizeProps("action", { action: "hola que tal" }), {});
  // search trägt NIE den Suchtext – nur Buckets.
  assert.deepEqual(analytics.sanitizeProps("search", { qlen: "1-10", results: "1-5", q: "border crossing" }), { qlen: "1-10", results: "1-5" });
  // feature_complete: nur Feature-Slug + perfect-Bool.
  assert.deepEqual(analytics.sanitizeProps("feature_complete", { feature: "precios", perfect: true, score: 42 }), { feature: "precios", perfect: true });
  // onboarding_step: Schritt-Slug + Index, sonst nichts.
  assert.deepEqual(analytics.sanitizeProps("onboarding_step", { step: "profile", n: 1, name: "Marcel" }), { step: "profile", n: 1 });
  // app_open: returning/load_ms/src – keine URL o. Ä.
  assert.deepEqual(analytics.sanitizeProps("app_open", { returning: true, load_ms: "1-200", src: "task", url: "x?y=1" }), { returning: true, load_ms: "1-200", src: "task" });
  // unbekanntes Event -> keine Props.
  assert.deepEqual(analytics.sanitizeProps("whatever", { a: 1 }), {});
});

test("sanitizeProps: error-Text wird PII-bereinigt und gekappt", () => {
  const out = analytics.sanitizeProps("error", { type: "promise", msg: "fail for user a@b.com card po12345 ok", src: "app.js", line: 42 });
  assert.equal(out.type, "promise");
  assert.equal(out.line, 42);
  assert.ok(out.msg.indexOf("a@b.com") < 0, "E-Mail entfernt");
  assert.ok(out.msg.indexOf("12345") < 0, "lange Ziffernfolge entfernt");
  assert.ok(out.msg.length <= 80);
});

test("sanitizeProps: neue Investor-Events (feature_start/share/activation) + granulares session_complete", () => {
  // feature_start: nur Feature-Slug + Modus (Gegenstück zu feature_complete).
  assert.deepEqual(analytics.sanitizeProps("feature_start", { feature: "precios", mode: "flip", id: "card9" }), { feature: "precios", mode: "flip" });
  // share: nur WAS geteilt wird (content), NIE Empfänger/Freitext/unbekannte Felder (channel nicht gelistet).
  assert.deepEqual(analytics.sanitizeProps("share", { content: "stats", channel: "native", to: "a@b.com" }), { content: "stats" });
  assert.deepEqual(analytics.sanitizeProps("share", { content: "eine ganze karte" }), {}, "Freitext fällt strukturell durch den Slug-Filter");
  // activation: milestone-Slug + day_n (Time-to-Value, exakter Int) – sonst nichts.
  assert.deepEqual(analytics.sanitizeProps("activation", { milestone: "first_session", day_n: 3, name: "x" }), { milestone: "first_session", day_n: 3 });
  // pwa_prompt: nur der Ausgang des nativen Install-Dialogs (Enum), keine URL o. Ä.
  assert.deepEqual(analytics.sanitizeProps("pwa_prompt", { outcome: "accepted", url: "x y=1" }), { outcome: "accepted" });
  // session_complete: Buckets bleiben, exakte Ints kommen als int durch, Fremdfelder (Karteninhalt) raus.
  assert.deepEqual(
    analytics.sanitizeProps("session_complete", { answered: "5-10", accuracy: "75-90", xp: "30-60", again: "1-3", answered_n: 8, correct_n: 6, xp_n: 30, secs: 180, cardText: "hola" }),
    { answered: "5-10", accuracy: "75-90", xp: "30-60", again: "1-3", answered_n: 8, correct_n: 6, xp_n: 30, secs: 180 }
  );
});

test("buildEvent: vollständiger, deterministischer Envelope (Props sanitisiert)", () => {
  const now = 1750000000000;
  const ev = analytics.buildEvent("screen_view", { screen: "home", tab: "start", secret: "x y" }, {
    now, clientId: "cid1", sessionId: "sid1", seq: 3, appVersion: "1.120.0", locale: "de", track: "de-es", edition: "ecos", platform: "ios",
  });
  assert.equal(ev.event, "screen_view");
  assert.equal(ev.clientId, "cid1");
  assert.equal(ev.sessionId, "sid1");
  assert.equal(ev.seq, 3);
  assert.equal(ev.day, analytics.dayKey(now));
  assert.equal(ev.edition, "ecos");
  assert.equal(ev.platform, "ios");
  assert.deepEqual(ev.props, { screen: "home", tab: "start" });
});

test("track/flush: puffert nur mit Endpunkt UND Zustimmung; ein Batch an /v1/events; Queue leert", async () => {
  analytics.resetClientId();
  const calls = [];
  globalThis.window.SC.net = { request: (base, m, p, body) => { calls.push({ base, m, p, body }); return Promise.resolve({ ok: true, status: 200, body: null }); } };

  // (a) ohne Config: track puffert nicht, flush sendet nichts.
  globalThis.window.SC.config = {};
  analytics.configure({ consent: true, appVersion: "1.120.0", locale: "de", track: "de-es" });
  analytics.track("screen_view", { screen: "home", tab: "start" });
  let r = await analytics.flush();
  assert.equal(r.sent, 0); assert.equal(calls.length, 0);

  // (b) mit Endpunkt, aber ohne Zustimmung: nichts.
  globalThis.window.SC.config = { analytics: { enabled: true, endpoint: "https://x.test/" } };
  analytics.configure({ consent: false });
  analytics.track("action", { action: "open-search" });
  r = await analytics.flush();
  assert.equal(r.sent, 0); assert.equal(calls.length, 0);

  // (c) mit beidem: track puffert, flush sendet genau einen Batch.
  analytics.configure({ consent: true });
  analytics.track("action", { action: "open-search", mode: "flip" });
  analytics.track("card_rated", { rating: "good", cat: "transporte", level: "1" });
  r = await analytics.flush();
  assert.equal(r.sent, 2);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].m, "POST");
  assert.equal(calls[0].p, "/v1/events");
  assert.equal(calls[0].base, "https://x.test");
  assert.equal(calls[0].body.events.length, 2);
  const e0 = calls[0].body.events[0];
  assert.ok(e0.clientId && e0.sessionId, "pseudonyme IDs gesetzt");
  assert.deepEqual(e0.props, { action: "open-search", mode: "flip" });

  // (d) nach erfolgreichem Flush ist die Queue leer.
  r = await analytics.flush();
  assert.equal(r.sent, 0);
  assert.equal(calls.length, 1);
});

test("Queue-Ring: deckelt auf 200, Batches <= 50", async () => {
  analytics.resetClientId();
  globalThis.window.SC.config = { analytics: { enabled: true, endpoint: "https://x.test/" } };
  let total = 0, maxBatch = 0;
  globalThis.window.SC.net = { request: (b, m, p, body) => { maxBatch = Math.max(maxBatch, body.events.length); return Promise.resolve({ ok: true }); } };
  analytics.configure({ consent: true });
  for (let i = 0; i < 250; i++) analytics.track("action", { action: "x" });
  let r; do { r = await analytics.flush(); total += r.sent; } while (r.sent > 0);
  assert.equal(total, 200, "Ring deckelt auf QUEUE_CAP=200 (älteste 50 verworfen)");
  assert.ok(maxBatch <= 50, "Batch <= BATCH_MAX=50");
});

test("sessionId via track: gleich in der Sitzung, neu nach >30 min; clientId bleibt", async () => {
  analytics.resetClientId();
  globalThis.window.SC.config = { analytics: { enabled: true, endpoint: "https://x.test/" } };
  let captured = [];
  globalThis.window.SC.net = { request: (b, m, p, body) => { captured = captured.concat(body.events); return Promise.resolve({ ok: true }); } };
  analytics.configure({ consent: true });
  const t0 = 1750000000000;
  analytics.track("action", { action: "a" }, { now: t0 });
  analytics.track("action", { action: "b" }, { now: t0 + 60 * 1000 });       // +1 min
  analytics.track("action", { action: "c" }, { now: t0 + 60 * 60 * 1000 });  // +60 min -> neue Session
  let r; do { r = await analytics.flush(); } while (r.sent > 0);
  assert.equal(captured.length, 3);
  assert.equal(captured[0].sessionId, captured[1].sessionId, "selbe Session innerhalb der Lücke");
  assert.notEqual(captured[2].sessionId, captured[0].sessionId, "neue Session nach Inaktivität");
  assert.equal(captured[0].clientId, captured[2].clientId, "clientId bleibt konstant");
});

test("flush({beacon}): nutzt navigator.sendBeacon und leert die Queue", async () => {
  if (typeof Blob === "undefined") return; // Umgebung ohne Blob -> nichts zu testen
  if (typeof globalThis.navigator === "undefined") { try { globalThis.navigator = {}; } catch (e) { return; } }
  const beacons = [];
  try { globalThis.navigator.sendBeacon = (url, blob) => { beacons.push({ url, blob }); return true; }; }
  catch (e) { return; }
  if (typeof globalThis.navigator.sendBeacon !== "function") return;

  analytics.resetClientId();
  globalThis.window.SC.config = { analytics: { enabled: true, endpoint: "https://x.test/" } };
  globalThis.window.SC.net = { request: () => { throw new Error("beacon path darf net.request nicht nutzen"); } };
  analytics.configure({ consent: true });
  analytics.track("app_open", { returning: true, load_ms: "200-500" });
  const r = await analytics.flush({ beacon: true });
  assert.equal(r.beacon, true);
  assert.ok(r.sent >= 1);
  assert.equal(beacons.length, 1);
  assert.ok(beacons[0].url.indexOf("/v1/events") >= 0);
});

test("flush({beacon}): leert die GANZE Queue in mehreren Batches (kein Restverlust beim Schließen)", async () => {
  if (typeof Blob === "undefined") return;
  if (typeof globalThis.navigator === "undefined") { try { globalThis.navigator = {}; } catch (e) { return; } }
  const beacons = [];
  try { globalThis.navigator.sendBeacon = () => { beacons.push(1); return true; }; }
  catch (e) { return; }
  if (typeof globalThis.navigator.sendBeacon !== "function") return;

  analytics.resetClientId();
  globalThis.window.SC.config = { analytics: { enabled: true, endpoint: "https://x.test/" } };
  globalThis.window.SC.net = { request: () => { throw new Error("beacon path darf net.request nicht nutzen"); } };
  analytics.configure({ consent: true });
  for (let i = 0; i < 120; i++) analytics.track("action", { action: "x" }); // > 2 Batches
  const r = await analytics.flush({ beacon: true });
  assert.equal(r.beacon, true);
  assert.equal(r.sent, 120, "beim Schließen geht der GESAMTE Puffer raus (vorher nur 1 Batch = 50)");
  assert.equal(beacons.length, 3, "3 Batches à <= 50");
  const r2 = await analytics.flush({ beacon: true });
  assert.equal(r2.sent, 0, "Queue ist danach leer");
});

test("flush({beacon}): abgelehnter Beacon lässt den Rest gepuffert (kein Verlust)", async () => {
  if (typeof Blob === "undefined" || typeof globalThis.navigator === "undefined") return;
  let calls = 0;
  try { globalThis.navigator.sendBeacon = () => { calls++; return calls <= 1; }; } // nur der 1. Beacon geht durch
  catch (e) { return; }
  analytics.resetClientId();
  globalThis.window.SC.config = { analytics: { enabled: true, endpoint: "https://x.test/" } };
  globalThis.window.SC.net = { request: () => Promise.resolve({ ok: true }) };
  analytics.configure({ consent: true });
  for (let i = 0; i < 80; i++) analytics.track("action", { action: "x" });
  const r = await analytics.flush({ beacon: true });
  assert.equal(r.sent, 50, "erster Batch gesendet, zweiter abgelehnt");
  // Rest bleibt in der Queue und geht über den regulären Pfad raus.
  let rest = 0, rr; do { rr = await analytics.flush(); rest += rr.sent; } while (rr.sent > 0);
  assert.equal(rest, 30);
});

test("flush: nebenläufiger Beacon-Flush während eines Netz-Flushes verliert keine Events", async () => {
  if (typeof Blob === "undefined" || typeof globalThis.navigator === "undefined" || typeof globalThis.navigator.sendBeacon !== "function") return;
  analytics.resetClientId();
  globalThis.window.SC.config = { analytics: { enabled: true, endpoint: "https://x.test/" } };
  globalThis.navigator.sendBeacon = () => true;
  // Netz-Flush mit manuell auflösbarem Promise -> Überlappung erzwingen.
  let resolveNet = null;
  globalThis.window.SC.net = { request: () => new Promise((res) => { resolveNet = () => res({ ok: true }); }) };
  analytics.configure({ consent: true });
  for (let i = 0; i < 60; i++) analytics.track("action", { action: "x" }); // > 1 Batch (>50)

  const netP = analytics.flush();                      // nimmt die ersten 50 (seq 0..49), Promise hängt
  const rb = await analytics.flush({ beacon: true });  // sendet die GANZE Queue (50+10) und entfernt per seq
  resolveNet();                                        // Netz-Flush löst auf -> removeSent ist No-op (schon weg)
  await netP;

  // ALLE 60 Events sind über den Beacon raus (schlimmstenfalls 50 doppelt, nie verloren);
  // die Queue ist leer – nichts geht beim Überlappen verloren (removeSent per seq, nicht slice).
  assert.equal(rb.sent, 60);
  globalThis.window.SC.net = { request: () => Promise.resolve({ ok: true }) };
  let rest = 0, r; do { r = await analytics.flush(); rest += r.sent; } while (r.sent > 0);
  assert.equal(rest, 0, "kein Rest übrig und kein Verlust – alles reiste im Beacon-Flush");
});

// ===== Sampling + Time-to-Value ==========================================

test("Sampling: sampleRate steuert deterministisch pro Geraet, ob gesendet wird", async () => {
  analytics.resetClientId();
  globalThis.window.SC.net = { request: () => Promise.resolve({ ok: true }) };
  globalThis.window.SC.config = { analytics: { enabled: true, endpoint: "https://x.test/", sampleRate: 0 } };
  analytics.configure({ consent: true });

  // sampleRate 0: nichts wird gepuffert (auch kein Snapshot).
  analytics.track("action", { action: "x" });
  let r = await analytics.flush();
  assert.equal(r.sent, 0, "sampleRate 0 -> track puffert nichts");
  globalThis.localStorage.removeItem(analytics.SENT_KEY);
  r = await analytics.maybeSend({}, { day: "2027-01-01", consent: true });
  assert.equal(r.sent, false, "sampleRate 0 -> auch kein Tages-Snapshot");

  // sampleRate 1 (bzw. fehlend): alles wie bisher.
  globalThis.window.SC.config.analytics.sampleRate = 1;
  analytics.track("action", { action: "x" });
  r = await analytics.flush();
  assert.equal(r.sent, 1, "sampleRate 1 -> sendet");

  // Zwischenwert: die Entscheidung folgt exakt samplePct(clientId) – deterministisch,
  // ein Geraet ist stabil drin oder draussen (keine zerrissenen Funnels).
  globalThis.window.SC.config.analytics.sampleRate = 0.5;
  const cid = globalThis.localStorage.getItem(analytics.CLIENT_KEY);
  const inSample = analytics.samplePct(cid) < 50;
  analytics.track("action", { action: "x" });
  r = await analytics.flush();
  assert.equal(r.sent, inSample ? 1 : 0, "Entscheidung == samplePct(clientId) < rate*100");

  // Ungueltige Werte fallen auf 1 (alle senden) zurueck.
  globalThis.window.SC.config.analytics.sampleRate = "0.5";
  analytics.track("action", { action: "x" });
  r = await analytics.flush();
  assert.equal(r.sent, 1, "ungueltiger sampleRate -> wie 1 (alle)");
  delete globalThis.window.SC.config.analytics.sampleRate;
});

test("samplePct: rein, stabil, in [0,100)", () => {
  assert.equal(analytics.samplePct("abc"), analytics.samplePct("abc"), "deterministisch");
  assert.notEqual(analytics.samplePct("abc"), analytics.samplePct("abd"), "verschiedene Ids streuen");
  ["", "abc", "x1y2z3", "ffffffffffffffffff"].forEach((id) => {
    const p = analytics.samplePct(id);
    assert.ok(p >= 0 && p < 100, id + " -> " + p);
  });
});

test("daysSinceFirstUse: erstes getracktes Event stempelt den Tag; Differenz gedeckelt; Reset loescht", async () => {
  analytics.resetClientId(); // loescht auch FIRST_KEY
  globalThis.window.SC.config = { analytics: { enabled: true, endpoint: "https://x.test/" } };
  globalThis.window.SC.net = { request: () => Promise.resolve({ ok: true }) };
  analytics.configure({ consent: true });
  assert.equal(analytics.daysSinceFirstUse(), undefined, "vor dem ersten Event unbekannt -> Feld bleibt weg");

  const t0 = new Date(2026, 5, 1, 12, 0, 0).getTime(); // 1. Juni, lokal
  analytics.track("app_open", { returning: false }, { now: t0 });
  assert.equal(analytics.daysSinceFirstUse(t0), 0, "gleicher Tag -> 0 (Aktivierung am Erst-Tag)");
  assert.equal(analytics.daysSinceFirstUse(t0 + 3 * 86400000), 3);
  assert.equal(analytics.daysSinceFirstUse(t0 + 1000 * 86400000), 365, "gegen Ausreisser/Fingerprints gedeckelt");

  // Consent-aus/Reset verwirft den Stempel (nichts Wiedererkennbares bleibt).
  analytics.resetClientId();
  assert.equal(globalThis.localStorage.getItem(analytics.FIRST_KEY), null);
  assert.equal(analytics.daysSinceFirstUse(), undefined);
});
