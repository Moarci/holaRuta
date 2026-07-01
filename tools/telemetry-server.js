/*
 * tools/telemetry-server.js — Collector + Dashboard für die HolaRuta-Telemetrie.
 *
 * Nimmt die opt-in Telemetrie (BACKEND.md §17, docs/TELEMETRIE.md) entgegen,
 * PERSISTIERT sie als JSONL und zeigt unter „/" ein Dashboard:
 *   - wie viele Leute die App nutzen (DAU/WAU/MAU, distinkte clientId),
 *   - wie lange (Sitzungsdauer aus den ts-Spannen je sessionId),
 *   - Wiederkehrrate, Feature-Nutzung, Screens/Aktionen, Genauigkeit, Fehler.
 *
 * Bewusst Zero-Dependency (nur Node-Builtins) und self-host-tauglich. KEIN
 * gehärteter Produktionsdienst: das Dashboard ist ungeschützt, Storage ist eine
 * JSONL-Datei. Für echten Betrieb gehört davor Auth + ein richtiger Event-Store
 * (siehe BACKEND.md §17.6.3). Die reine aggregate()-Funktion ist exportiert und
 * unit-getestet (test/telemetry-aggregate.test.js).
 *
 * Starten:
 *   node tools/telemetry-server.js                 # Port 8789, Daten in tools/telemetry-data/
 *   PORT=9000 TELEMETRY_DIR=/var/holaruta node tools/telemetry-server.js
 * Dashboard:  http://localhost:8789/
 * Edition:    analytics: { enabled: true, endpoint: "http://localhost:8789" }
 */
"use strict";

// ===================== Reiner Kern: Aggregation (testbar) =====================

var DAY_MS = 86400000;

function pad(n) { return String(n).padStart(2, "0"); }
// UTC-Tagesschlüssel (deterministisch, unabhängig von der Server-Zeitzone).
function dayUTC(ts) {
  var d = new Date(ts);
  return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
}
function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
function num(v) { return typeof v === "number" && isFinite(v) ? v : 0; }

// Zähl-Maps sind bewusst echte `Map`s (nicht Objekte): Schlüssel stammen aus
// EMPFANGENEN, ungeprüften Event-Daten. Ein Objekt-Property-Write mit solchem
// Schlüssel wäre eine „remote property injection"/Prototype-Pollution-Senke
// (z. B. event="__proto__"). Map.set/.get sind Methodenaufrufe -> keine Senke.
function inc(map, key, n) { map.set(key, (map.get(key) || 0) + (typeof n === "number" ? n : 1)); }
function addToSet(map, key, member) { var s = map.get(key); if (!s) { s = new Set(); map.set(key, s); } s.add(member); }

// Nimmt eine `Map<string, number>` und gibt eine nach Anzahl absteigend sortierte
// Liste [{ key, count }] zurück (optional gekürzt).
function topCounts(map, limit) {
  var rows = [];
  map.forEach(function (v, k) { rows.push({ key: k, count: v }); });
  rows.sort(function (a, b) { return b.count - a.count || (a.key < b.key ? -1 : 1); });
  return limit ? rows.slice(0, limit) : rows;
}

// Sitzungsdauer-Buckets (Sekunden -> Label).
function durationBucket(sec) {
  if (sec < 60) return "0–1 min";
  if (sec < 300) return "1–5 min";
  if (sec < 900) return "5–15 min";
  if (sec < 1800) return "15–30 min";
  return "30+ min";
}
var DURATION_ORDER = ["0–1 min", "1–5 min", "5–15 min", "15–30 min", "30+ min"];

function median(arr) {
  if (!arr.length) return 0;
  var s = arr.slice().sort(function (a, b) { return a - b; });
  var m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

// Kernauswertung. events/usage = Arrays der empfangenen Envelopes/Snapshots.
// opts = { now, windowDays }. REIN (kein I/O), deterministisch über now.
function aggregate(events, usage, opts) {
  var o = isObj(opts) ? opts : {};
  var now = typeof o.now === "number" ? o.now : Date.now();
  var windowDays = num(o.windowDays) || 30;
  var evAll = Array.isArray(events) ? events : [];
  var usAll = Array.isArray(usage) ? usage : [];

  // Fenster = die LETZTEN windowDays Kalendertage INKLUSIVE heute (now-(N-1) … now),
  // deckungsgleich mit der dauSeries unten. (Tagesschlüssel sind UTC; e.day ist die
  // lokale Tagesangabe des Clients – „heute" meint hier den UTC-Tag des Servers.)
  var cutoff = dayUTC(now - (windowDays - 1) * DAY_MS);
  var ev = evAll.filter(function (e) { return isObj(e) && String(e.day || "") >= cutoff; });
  var us = usAll.filter(function (s) { return isObj(s) && String(s.day || "") >= cutoff; });
  var today = dayUTC(now);

  // --- Nutzer / DAU (Schlüssel = ungeprüfte Event-Daten -> Map/Set, keine Objekt-Writes) ---
  var clientsAll = new Map();          // clientId -> Set(Tage aktiv)
  var dauMap = new Map();              // day -> Set(clientId)
  var perDaySessions = new Map();      // day -> Set(sessionId)
  var sessions = new Map();            // sessionId -> { min, max, count, client }
  var eventCounts = new Map();
  var screenCounts = new Map();
  var actionCounts = new Map();
  var ratingCounts = { again: 0, good: 0, easy: 0 }; // feste Schlüssel -> Objekt unbedenklich
  var accuracyDist = new Map();
  var featureCompletes = new Map();    // feature -> { count, perfect }
  var errorCounts = new Map();
  var appVersions = new Map();
  var locales = new Map();
  var tracks = new Map();
  var openNew = 0, openReturning = 0;
  var catStats = new Map();            // cat -> { total, again } (schwierigste Themen)
  var errorsByVersion = new Map();     // appVersion -> Fehleranzahl (Regressionen)
  var searchTotal = 0, searchZero = 0; // Suchen gesamt / ohne Treffer
  var modeCount = new Map();           // Lernmodus je Session (flip/type/listen)
  var hourCount = []; for (var hi = 0; hi < 24; hi++) hourCount.push(0); // Aktivität je UTC-Stunde
  var weekdayCount = []; for (var wi = 0; wi < 7; wi++) weekdayCount.push(0); // je Wochentag (0=So)
  var onboardSteps = new Map();        // step -> Set(clientId)
  var onboardComplete = new Set();     // clientId
  var editionClients = new Map();      // edition -> Set(clientId)
  var platformClients = new Map();     // platform -> Set(clientId)
  var acquisition = new Map();         // src -> distinkte Nutzer (nach erster Quelle)
  var clientFirstOpen = new Map();     // clientId -> { ts, src } (früheste Quelle je Nutzer)

  ev.forEach(function (e) {
    var day = String(e.day || "");
    var cid = String(e.clientId || "");
    var sid = String(e.sessionId || "");
    var ts = num(e.ts);
    var name = String(e.event || "?");
    var p = isObj(e.props) ? e.props : {};

    inc(eventCounts, name);
    if (e.appVersion) inc(appVersions, String(e.appVersion));
    if (e.locale) inc(locales, String(e.locale));
    if (e.track) inc(tracks, String(e.track));
    if (cid) {
      addToSet(editionClients, String(e.edition || "none"), cid);
      addToSet(platformClients, String(e.platform || "other"), cid);
    }
    if (ts) { var dt = new Date(ts); hourCount[dt.getUTCHours()]++; weekdayCount[dt.getUTCDay()]++; }

    if (cid && day) addToSet(clientsAll, cid, day);
    if (day) {
      if (cid) addToSet(dauMap, day, cid);
      if (sid) addToSet(perDaySessions, day, sid);
    }
    if (sid) {
      var s = sessions.get(sid);
      if (!s) { s = { min: ts, max: ts, count: 0, client: cid }; sessions.set(sid, s); }
      if (ts < s.min) s.min = ts;
      if (ts > s.max) s.max = ts;
      s.count++;
    }

    switch (name) {
      case "app_open":
        (p.returning ? openReturning++ : openNew++);
        if (p.src && cid) { var fo = clientFirstOpen.get(cid); if (!fo || ts < fo.ts) clientFirstOpen.set(cid, { ts: ts, src: String(p.src) }); }
        break;
      case "screen_view": if (p.screen) inc(screenCounts, String(p.screen)); break;
      case "action": if (p.action) inc(actionCounts, String(p.action)); break;
      case "card_rated":
        if (p.rating === "again") ratingCounts.again++;
        else if (p.rating === "good") ratingCounts.good++;
        else if (p.rating === "easy") ratingCounts.easy++;
        if (p.cat) { var cat = String(p.cat); var cs = catStats.get(cat); if (!cs) { cs = { total: 0, again: 0 }; catStats.set(cat, cs); } cs.total++; if (p.rating === "again") cs.again++; }
        break;
      case "session_start": if (p.mode) inc(modeCount, String(p.mode)); break;
      case "session_complete": if (p.accuracy) inc(accuracyDist, String(p.accuracy)); break;
      case "feature_complete":
        if (p.feature) { var ft = String(p.feature); var f = featureCompletes.get(ft); if (!f) { f = { count: 0, perfect: 0 }; featureCompletes.set(ft, f); } f.count++; if (p.perfect) f.perfect++; }
        break;
      case "search": searchTotal++; if (p.results === "0") searchZero++; break;
      case "onboarding_step": if (p.step && cid) addToSet(onboardSteps, String(p.step), cid); break;
      case "onboarding_complete": if (cid) onboardComplete.add(cid); break;
      case "error":
        inc(errorCounts, (p.type || "error") + ": " + (p.msg || "?"));
        if (e.appVersion) inc(errorsByVersion, String(e.appVersion));
        break;
      default: break;
    }
  });

  // --- DAU-Reihe (letzte windowDays Tage, lückenlos) ---
  var dauSeries = [];
  for (var i = windowDays - 1; i >= 0; i--) {
    var d = dayUTC(now - i * DAY_MS);
    dauSeries.push({ day: d, count: dauMap.has(d) ? dauMap.get(d).size : 0 });
  }
  var sessionsPerDay = dauSeries.map(function (row) {
    return { day: row.day, count: perDaySessions.has(row.day) ? perDaySessions.get(row.day).size : 0 };
  });

  // --- Sitzungsdauer ---
  var durations = []; // Sekunden
  var durHist = new Map();
  DURATION_ORDER.forEach(function (k) { durHist.set(k, 0); });
  sessions.forEach(function (s) {
    var sec = Math.max(0, Math.round((s.max - s.min) / 1000));
    durations.push(sec);
    inc(durHist, durationBucket(sec));
  });
  var avgDuration = durations.length ? Math.round(durations.reduce(function (a, b) { return a + b; }, 0) / durations.length) : 0;

  // --- Nutzer-Kennzahlen ---
  var totalUsers = clientsAll.size;
  var returningUsers = 0;
  clientsAll.forEach(function (daysSet) { if (daysSet.size >= 2) returningUsers++; });
  function activeSince(daysBack) {
    var since = dayUTC(now - (daysBack - 1) * DAY_MS); // letzte daysBack Tage inkl. heute
    var set = new Set();
    dauMap.forEach(function (cids, day) { if (day >= since) cids.forEach(function (c) { set.add(c); }); });
    return set.size;
  }

  // --- Tages-Snapshots (anonym, ohne clientId): Adoption, Mastery, Trip, Streak ---
  var snapFeatureAdoption = new Map();
  var snapCardsToday = new Map();
  var snapStreak = new Map();
  var snapReviews = new Map();
  var masteryDist = new Map();
  var tripDailyDist = new Map();
  var tripGoalYes = 0;
  us.forEach(function (s) {
    var feats = isObj(s.features) ? s.features : {};
    Object.keys(feats).forEach(function (k) { if (feats[k]) inc(snapFeatureAdoption, String(k)); });
    if (s.cardsToday) inc(snapCardsToday, String(s.cardsToday));
    if (s.streak) inc(snapStreak, String(s.streak));
    if (s.reviews) inc(snapReviews, String(s.reviews));
    if (s.mastered) inc(masteryDist, String(s.mastered));
    if (s.tripGoal) tripGoalYes++;
    if (s.tripDaily) inc(tripDailyDist, String(s.tripDaily));
  });

  // --- Teilen-Aktivität (share-*) aus den Aktionen ---
  var shareMap = new Map();
  actionCounts.forEach(function (v, k) { if (k.indexOf("share") === 0) shareMap.set(k, v); });
  var shareActions = topCounts(shareMap);

  // --- Trend vs. Vorperiode: aktive Nutzer der letzten 7 Tage vs. der 7 davor ---
  // Scannt ALLE Events (nicht die Fenster-gefilterten), da die Vorperiode sonst bei
  // kleinen Fenstern (z. B. days=7) herausfiele.
  function activeUsersWindow(offset, len) {
    var hi = dayUTC(now - offset * DAY_MS);
    var lo = dayUTC(now - (offset + len - 1) * DAY_MS);
    var set = new Set();
    evAll.forEach(function (e) { if (!isObj(e)) return; var day = String(e.day || ""), cid = String(e.clientId || ""); if (cid && day >= lo && day <= hi) set.add(cid); });
    return set.size;
  }
  function trend(cur, prev) { return { cur: cur, prev: prev, deltaPct: prev ? Math.round(((cur - prev) / prev) * 100) : (cur ? 100 : 0) }; }
  var wau7Cur = activeUsersWindow(0, 7), wau7Prev = activeUsersWindow(7, 7);

  // --- Schwierigste Themen: „Nochmal"-Quote je Kategorie (ab Mindestvolumen 5) ---
  var difficult = [];
  catStats.forEach(function (v, cat) { if (v.total >= 5) difficult.push({ cat: cat, total: v.total, againPct: Math.round((v.again / v.total) * 100) }); });
  difficult.sort(function (a, b) { return b.againPct - a.againPct || b.total - a.total; });
  difficult = difficult.slice(0, 12);

  // --- Aktive Tage je Nutzer + Erst-Tag (für Retention) ---
  var activeDaysHist = { "1": 0, "2": 0, "3-4": 0, "5-7": 0, "8+": 0 };
  var clientFirstDay = new Map();
  clientsAll.forEach(function (daysSet, c) {
    var days = Array.from(daysSet).sort();
    var n = days.length;
    activeDaysHist[n === 1 ? "1" : n === 2 ? "2" : n <= 4 ? "3-4" : n <= 7 ? "5-7" : "8+"]++;
    clientFirstDay.set(c, days[0]);
  });
  function addDays(dayStr, k) { var pp = String(dayStr).split("-"); return dayUTC(Date.UTC(+pp[0], +pp[1] - 1, +pp[2]) + k * DAY_MS); }
  // N-Tage-Retention: von den Nutzern, deren Erst-Tag+N noch im Bereich liegt, wie
  // viele waren an genau Tag (Erst-Tag+N) wieder aktiv?
  function retentionDay(k) {
    var elig = 0, ret = 0;
    clientFirstDay.forEach(function (first, c) {
      var target = addDays(first, k);
      if (target <= today) { elig++; var ds = clientsAll.get(c); if (ds && ds.has(target)) ret++; }
    });
    return { day: k, eligible: elig, pct: elig ? Math.round((ret / elig) * 100) : 0 };
  }
  var avgDAU = dauSeries.length ? Math.round(dauSeries.reduce(function (a, r) { return a + r.count; }, 0) / dauSeries.length) : 0;

  // --- Onboarding-Funnel (distinkte Nutzer je Schritt) ---
  var funnel = ["intro", "profile", "trip"].map(function (st) {
    return { step: st, count: onboardSteps.has(st) ? onboardSteps.get(st).size : 0 };
  });
  funnel.push({ step: "complete", count: onboardComplete.size });

  function clientsByKey(map) { var m = new Map(); map.forEach(function (set, k) { m.set(k, set.size); }); return topCounts(m); }

  // Akquise: distinkte Nutzer nach ihrer ERSTEN Quelle (nicht Opens – sonst würden
  // wiederkehrende „direct"-Starts die Kanäle verzerren).
  clientFirstOpen.forEach(function (fo) { inc(acquisition, fo.src); });

  return {
    generatedAt: now,
    windowDays: windowDays,
    today: today,
    totals: {
      events: ev.length,
      users: totalUsers,
      sessions: sessions.size,
      snapshots: us.length,
      errors: (function () { var t = 0; errorCounts.forEach(function (v) { t += v; }); return t; })(),
    },
    users: {
      total: totalUsers,
      returning: returningUsers,
      returnRatePct: totalUsers ? Math.round((returningUsers / totalUsers) * 100) : 0,
      dauToday: dauMap.has(today) ? dauMap.get(today).size : 0,
      avgDau: avgDAU,
      wau: activeSince(7),
      mau: activeSince(30),
      stickinessPct: activeSince(30) ? Math.round((avgDAU / activeSince(30)) * 100) : 0,
      newOpens: openNew,
      returningOpens: openReturning,
      dauSeries: dauSeries,
      activeDaysHistogram: ["1", "2", "3-4", "5-7", "8+"].map(function (k) { return { bucket: k, count: activeDaysHist[k] }; }),
      retention: [retentionDay(1), retentionDay(7), retentionDay(30)],
      trendWau7: trend(wau7Cur, wau7Prev),
    },
    sessions: {
      count: sessions.size,
      avgDurationSec: avgDuration,
      medianDurationSec: median(durations),
      durationHistogram: DURATION_ORDER.map(function (k) { return { bucket: k, count: durHist.get(k) || 0 }; }),
      perDay: sessionsPerDay,
      avgEventsPerSession: sessions.size ? Math.round((ev.length / sessions.size) * 10) / 10 : 0,
    },
    engagement: {
      events: topCounts(eventCounts),
      screens: topCounts(screenCounts, 12),
      actions: topCounts(actionCounts, 15),
      share: shareActions,
      acquisition: topCounts(acquisition),
    },
    learning: {
      ratings: ratingCounts,
      accuracy: topCounts(accuracyDist),
      modes: topCounts(modeCount),
      difficult: difficult,
      mastery: topCounts(masteryDist),
      features: (function () {
        var arr = [];
        featureCompletes.forEach(function (c, f) { arr.push({ feature: f, count: c.count, perfectPct: c.count ? Math.round((c.perfect / c.count) * 100) : 0 }); });
        arr.sort(function (a, b) { return b.count - a.count; });
        return arr;
      })(),
    },
    funnel: funnel,
    search: { total: searchTotal, zero: searchZero, noResultPct: searchTotal ? Math.round((searchZero / searchTotal) * 100) : 0 },
    trip: { snapshots: us.length, withGoalPct: us.length ? Math.round((tripGoalYes / us.length) * 100) : 0, daily: topCounts(tripDailyDist) },
    time: {
      byHour: hourCount.map(function (c, h) { return { hour: h, count: c }; }),
      byWeekday: weekdayCount.map(function (c, w) { return { weekday: w, count: c }; }),
    },
    errors: topCounts(errorCounts, 15),
    errorsByVersion: topCounts(errorsByVersion, 8),
    segments: { editions: clientsByKey(editionClients), platforms: clientsByKey(platformClients) },
    meta: {
      appVersions: topCounts(appVersions, 8),
      locales: topCounts(locales),
      tracks: topCounts(tracks),
      snapshotFeatureAdoption: topCounts(snapFeatureAdoption),
      snapshotCardsToday: topCounts(snapCardsToday),
      snapshotStreak: topCounts(snapStreak),
      snapshotReviews: topCounts(snapReviews),
    },
  };
}

module.exports = { aggregate: aggregate, dayUTC: dayUTC, durationBucket: durationBucket };

// ===================== Server (nur beim Direktstart) =========================

if (require.main === module) {
  var http = require("http");
  var fs = require("fs");
  var path = require("path");

  var PORT = Number(process.env.PORT) || 8789;
  var DATA_DIR = process.env.TELEMETRY_DIR || path.join(__dirname, "telemetry-data");
  var EVENTS_FILE = path.join(DATA_DIR, "events.jsonl");
  var USAGE_FILE = path.join(DATA_DIR, "usage.jsonl");
  var DASH_FILE = path.join(__dirname, "telemetry-dashboard.html");
  var MAX_BODY = 256 * 1024; // 256 KB/Request
  var TOKEN = process.env.TELEMETRY_TOKEN || "";                             // optionaler Zugriffsschutz (Dashboard/API)
  var RETENTION_DAYS = Number(process.env.TELEMETRY_RETENTION_DAYS) || 120;  // Aufbewahrung, danach verworfen

  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) { /* egal */ }

  function loadJsonl(file) {
    try {
      return fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map(function (l) {
        try { return JSON.parse(l); } catch (e) { return null; }
      }).filter(Boolean);
    } catch (e) { return []; }
  }
  var events = loadJsonl(EVENTS_FILE);
  var usage = loadJsonl(USAGE_FILE);
  function append(file, obj) { try { fs.appendFileSync(file, JSON.stringify(obj) + "\n"); } catch (e) { /* egal */ } }

  // Aufbewahrung: beim Start Einträge älter als RETENTION_DAYS verwerfen und die
  // JSONL-Dateien kompaktieren -> begrenztes Wachstum, Datensparsamkeit.
  (function prune() {
    var cutoff = dayUTC(Date.now() - (RETENTION_DAYS - 1) * DAY_MS);
    function keep(arr) { return arr.filter(function (o) { return o && String(o.day || "") >= cutoff; }); }
    var e2 = keep(events), u2 = keep(usage);
    if (e2.length !== events.length) { events = e2; try { fs.writeFileSync(EVENTS_FILE, events.map(function (x) { return JSON.stringify(x); }).join("\n") + (events.length ? "\n" : "")); } catch (e) { /* egal */ } }
    if (u2.length !== usage.length) { usage = u2; try { fs.writeFileSync(USAGE_FILE, usage.map(function (x) { return JSON.stringify(x); }).join("\n") + (usage.length ? "\n" : "")); } catch (e) { /* egal */ } }
  })();

  function send(res, status, body, type) {
    res.writeHead(status, {
      "Content-Type": type || "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end(body === undefined ? "" : (typeof body === "string" ? body : JSON.stringify(body)));
  }
  function readBody(req) {
    return new Promise(function (resolve) {
      var buf = ""; var tooBig = false;
      req.on("data", function (c) { buf += c; if (buf.length > MAX_BODY) { tooBig = true; req.destroy(); } });
      req.on("end", function () { if (tooBig) return resolve(null); try { resolve(buf ? JSON.parse(buf) : null); } catch (e) { resolve(null); } });
      req.on("error", function () { resolve(null); });
    });
  }
  // Nur bekannte Query-Parameter übernehmen (Whitelist) – der Parametername kommt
  // aus der URL (ungeprüft); ein dynamischer Objekt-Write damit wäre eine Injection-Senke.
  function query(req) {
    var q = { token: "", days: "" };
    var qs = (req.url || "").split("?")[1] || "";
    qs.split("&").forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf("="); var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i));
      var v = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1));
      if (k === "token") q.token = v; else if (k === "days") q.days = v;
    });
    return q;
  }
  function authed(q, req) { return !TOKEN || q.token === TOKEN || (req.headers && req.headers.authorization === "Bearer " + TOKEN); }
  var ALLOWED_DAYS = { 7: 1, 14: 1, 30: 1, 90: 1 };
  function windowDaysOf(q) { var d = Number(q.days); return ALLOWED_DAYS[d] ? d : 30; }
  function toCsv(stats) {
    var sByDay = {}; stats.sessions.perDay.forEach(function (r) { sByDay[r.day] = r.count; });
    var rows = [["day", "dau", "sessions"]];
    stats.users.dauSeries.forEach(function (r) { rows.push([r.day, r.count, sByDay[r.day] || 0]); });
    return rows.map(function (r) { return r.join(","); }).join("\n") + "\n";
  }

  var server = http.createServer(function (req, res) {
    if (req.method === "OPTIONS") return send(res, 204);
    var url = (req.url || "").split("?")[0];
    var q = query(req);

    // POST-Endpunkte bleiben offen (Clients senden keinen Token). Ungültiger/zu
    // großer Body -> 400, damit ein echter Client den Batch behält und erneut sendet.
    if (req.method === "POST" && url === "/v1/usage") {
      return readBody(req).then(function (body) {
        if (body === null) return send(res, 400, { error: "invalid body" });
        if (isObj(body)) { usage.push(body); append(USAGE_FILE, body); }
        send(res, 200, { ok: true });
      });
    }
    if (req.method === "POST" && url === "/v1/events") {
      return readBody(req).then(function (body) {
        if (body === null) return send(res, 400, { error: "invalid body" });
        var list = Array.isArray(body.events) ? body.events : [];
        list.forEach(function (e) { if (isObj(e)) { events.push(e); append(EVENTS_FILE, e); } });
        console.log("[events] +" + list.length + " (gesamt " + events.length + ")");
        send(res, 200, { ok: true, accepted: list.length });
      });
    }

    // Lese-Endpunkte optional per Token geschützt (TELEMETRY_TOKEN).
    if (req.method === "GET" && (url === "/api/stats" || url === "/api/stats.csv" || url === "/" || url === "/dashboard")) {
      if (!authed(q, req)) return send(res, 401, { error: "Token erforderlich (?token=… oder Authorization: Bearer …)" });
    }
    if (req.method === "GET" && url === "/api/stats") {
      return send(res, 200, aggregate(events, usage, { now: Date.now(), windowDays: windowDaysOf(q) }));
    }
    if (req.method === "GET" && url === "/api/stats.csv") {
      return send(res, 200, toCsv(aggregate(events, usage, { now: Date.now(), windowDays: windowDaysOf(q) })), "text/csv; charset=utf-8");
    }
    if (req.method === "GET" && (url === "/" || url === "/dashboard")) {
      try { return send(res, 200, fs.readFileSync(DASH_FILE, "utf8"), "text/html; charset=utf-8"); }
      catch (e) { return send(res, 500, { error: "dashboard html fehlt: " + DASH_FILE }); }
    }
    send(res, 404, { error: "not found" });
  });

  server.listen(PORT, function () {
    console.log("HolaRuta Telemetrie-Server auf http://localhost:" + PORT);
    console.log("  Dashboard:   http://localhost:" + PORT + "/" + (TOKEN ? "?token=…" : "") + (TOKEN ? "  (TELEMETRY_TOKEN gesetzt)" : ""));
    console.log("  API:         /api/stats?days=7|30|90 · /api/stats.csv");
    console.log("  Daten:       " + DATA_DIR + " (events=" + events.length + ", usage=" + usage.length + ", Aufbewahrung " + RETENTION_DAYS + " Tage)");
    console.log("  Edition:     analytics: { enabled: true, endpoint: \"http://localhost:" + PORT + "\" }");
  });
}
