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

// Zählt Vorkommen in einer Map und gibt eine nach Anzahl absteigend sortierte
// Liste [{ key, count }] zurück (optional gekürzt).
function topCounts(map, limit) {
  var rows = Object.keys(map).map(function (k) { return { key: k, count: map[k] }; });
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

  // --- Nutzer / DAU ---
  var clientsAll = {};                 // clientId -> Set(Tage aktiv)
  var dauMap = {};                     // day -> Set(clientId)
  var perDaySessions = {};             // day -> Set(sessionId)
  var sessions = {};                   // sessionId -> { min, max, count, client }
  var eventCounts = {};
  var screenCounts = {};
  var actionCounts = {};
  var ratingCounts = { again: 0, good: 0, easy: 0 };
  var accuracyDist = {};
  var featureCompletes = {};           // feature -> { count, perfect }
  var errorCounts = {};
  var appVersions = {};
  var locales = {};
  var tracks = {};
  var openNew = 0, openReturning = 0;

  ev.forEach(function (e) {
    var day = String(e.day || "");
    var cid = String(e.clientId || "");
    var sid = String(e.sessionId || "");
    var ts = num(e.ts);
    var name = String(e.event || "?");
    var p = isObj(e.props) ? e.props : {};

    eventCounts[name] = (eventCounts[name] || 0) + 1;
    if (e.appVersion) appVersions[e.appVersion] = (appVersions[e.appVersion] || 0) + 1;
    if (e.locale) locales[e.locale] = (locales[e.locale] || 0) + 1;
    if (e.track) tracks[e.track] = (tracks[e.track] || 0) + 1;

    if (cid) {
      if (!clientsAll[cid]) clientsAll[cid] = {};
      if (day) clientsAll[cid][day] = 1;
    }
    if (day) {
      if (!dauMap[day]) dauMap[day] = {};
      if (cid) dauMap[day][cid] = 1;
      if (!perDaySessions[day]) perDaySessions[day] = {};
      if (sid) perDaySessions[day][sid] = 1;
    }
    if (sid) {
      var s = sessions[sid] || (sessions[sid] = { min: ts, max: ts, count: 0, client: cid });
      if (ts < s.min) s.min = ts;
      if (ts > s.max) s.max = ts;
      s.count++;
    }

    switch (name) {
      case "app_open": (p.returning ? openReturning++ : openNew++); break;
      case "screen_view": if (p.screen) screenCounts[p.screen] = (screenCounts[p.screen] || 0) + 1; break;
      case "action": if (p.action) actionCounts[p.action] = (actionCounts[p.action] || 0) + 1; break;
      case "card_rated": if (ratingCounts[p.rating] != null) ratingCounts[p.rating]++; break;
      case "session_complete": if (p.accuracy) accuracyDist[p.accuracy] = (accuracyDist[p.accuracy] || 0) + 1; break;
      case "feature_complete":
        if (p.feature) {
          var f = featureCompletes[p.feature] || (featureCompletes[p.feature] = { count: 0, perfect: 0 });
          f.count++; if (p.perfect) f.perfect++;
        }
        break;
      case "error": { var key = (p.type || "error") + ": " + (p.msg || "?"); errorCounts[key] = (errorCounts[key] || 0) + 1; break; }
      default: break;
    }
  });

  // --- DAU-Reihe (letzte windowDays Tage, lückenlos) ---
  var dauSeries = [];
  for (var i = windowDays - 1; i >= 0; i--) {
    var d = dayUTC(now - i * DAY_MS);
    dauSeries.push({ day: d, count: dauMap[d] ? Object.keys(dauMap[d]).length : 0 });
  }
  var sessionsPerDay = dauSeries.map(function (row) {
    return { day: row.day, count: perDaySessions[row.day] ? Object.keys(perDaySessions[row.day]).length : 0 };
  });

  // --- Sitzungsdauer ---
  var durations = []; // Sekunden
  var durHist = {};
  DURATION_ORDER.forEach(function (k) { durHist[k] = 0; });
  Object.keys(sessions).forEach(function (sid) {
    var s = sessions[sid];
    var sec = Math.max(0, Math.round((s.max - s.min) / 1000));
    durations.push(sec);
    durHist[durationBucket(sec)]++;
  });
  var avgDuration = durations.length ? Math.round(durations.reduce(function (a, b) { return a + b; }, 0) / durations.length) : 0;

  // --- Nutzer-Kennzahlen ---
  var clientIds = Object.keys(clientsAll);
  var totalUsers = clientIds.length;
  var returningUsers = clientIds.filter(function (c) { return Object.keys(clientsAll[c]).length >= 2; }).length;
  function activeSince(daysBack) {
    var since = dayUTC(now - (daysBack - 1) * DAY_MS); // letzte daysBack Tage inkl. heute
    var set = {};
    Object.keys(dauMap).forEach(function (day) { if (day >= since) Object.keys(dauMap[day]).forEach(function (c) { set[c] = 1; }); });
    return Object.keys(set).length;
  }

  // --- Tages-Snapshots (anonym, ohne clientId) ---
  var snapFeatureAdoption = {};
  var snapCardsToday = {};
  us.forEach(function (s) {
    var feats = isObj(s.features) ? s.features : {};
    Object.keys(feats).forEach(function (k) { if (feats[k]) snapFeatureAdoption[k] = (snapFeatureAdoption[k] || 0) + 1; });
    if (s.cardsToday) snapCardsToday[s.cardsToday] = (snapCardsToday[s.cardsToday] || 0) + 1;
  });

  return {
    generatedAt: now,
    windowDays: windowDays,
    today: today,
    totals: {
      events: ev.length,
      users: totalUsers,
      sessions: Object.keys(sessions).length,
      snapshots: us.length,
      errors: Object.keys(errorCounts).reduce(function (a, k) { return a + errorCounts[k]; }, 0),
    },
    users: {
      total: totalUsers,
      returning: returningUsers,
      returnRatePct: totalUsers ? Math.round((returningUsers / totalUsers) * 100) : 0,
      dauToday: dauMap[today] ? Object.keys(dauMap[today]).length : 0,
      wau: activeSince(7),
      mau: activeSince(30),
      newOpens: openNew,
      returningOpens: openReturning,
      dauSeries: dauSeries,
    },
    sessions: {
      count: Object.keys(sessions).length,
      avgDurationSec: avgDuration,
      medianDurationSec: median(durations),
      durationHistogram: DURATION_ORDER.map(function (k) { return { bucket: k, count: durHist[k] }; }),
      perDay: sessionsPerDay,
      avgEventsPerSession: Object.keys(sessions).length
        ? Math.round((ev.length / Object.keys(sessions).length) * 10) / 10 : 0,
    },
    engagement: {
      events: topCounts(eventCounts),
      screens: topCounts(screenCounts, 12),
      actions: topCounts(actionCounts, 15),
    },
    learning: {
      ratings: ratingCounts,
      accuracy: topCounts(accuracyDist),
      features: Object.keys(featureCompletes).map(function (f) {
        var c = featureCompletes[f];
        return { feature: f, count: c.count, perfectPct: c.count ? Math.round((c.perfect / c.count) * 100) : 0 };
      }).sort(function (a, b) { return b.count - a.count; }),
    },
    errors: topCounts(errorCounts, 15),
    meta: {
      appVersions: topCounts(appVersions, 8),
      locales: topCounts(locales),
      tracks: topCounts(tracks),
      snapshotFeatureAdoption: topCounts(snapFeatureAdoption),
      snapshotCardsToday: topCounts(snapCardsToday),
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

  var server = http.createServer(function (req, res) {
    if (req.method === "OPTIONS") return send(res, 204);
    var url = (req.url || "").split("?")[0];

    if (req.method === "POST" && url === "/v1/usage") {
      return readBody(req).then(function (body) {
        if (isObj(body)) { usage.push(body); append(USAGE_FILE, body); }
        send(res, 200, { ok: true });
      });
    }
    if (req.method === "POST" && url === "/v1/events") {
      return readBody(req).then(function (body) {
        var list = body && Array.isArray(body.events) ? body.events : [];
        list.forEach(function (e) { if (isObj(e)) { events.push(e); append(EVENTS_FILE, e); } });
        console.log("[events] +" + list.length + " (gesamt " + events.length + ")");
        send(res, 200, { ok: true, accepted: list.length });
      });
    }
    if (req.method === "GET" && url === "/api/stats") {
      return send(res, 200, aggregate(events, usage, { now: Date.now(), windowDays: 30 }));
    }
    if (req.method === "GET" && (url === "/" || url === "/dashboard")) {
      try { return send(res, 200, fs.readFileSync(DASH_FILE, "utf8"), "text/html; charset=utf-8"); }
      catch (e) { return send(res, 500, { error: "dashboard html fehlt: " + DASH_FILE }); }
    }
    send(res, 404, { error: "not found" });
  });

  server.listen(PORT, function () {
    console.log("HolaRuta Telemetrie-Server auf http://localhost:" + PORT);
    console.log("  Dashboard:   http://localhost:" + PORT + "/");
    console.log("  Daten:       " + DATA_DIR + " (events=" + events.length + ", usage=" + usage.length + ")");
    console.log("  Edition:     analytics: { enabled: true, endpoint: \"http://localhost:" + PORT + "\" }");
  });
}
