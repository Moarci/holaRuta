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
  var catStats = {};                   // cat -> { total, again } (schwierigste Themen)
  var errorsByVersion = {};            // appVersion -> Fehleranzahl (Regressionen)
  var searchTotal = 0, searchZero = 0; // Suchen gesamt / ohne Treffer
  var modeCount = {};                  // Lernmodus je Session (flip/type/listen)
  var hourCount = []; for (var hi = 0; hi < 24; hi++) hourCount.push(0); // Aktivität je UTC-Stunde
  var weekdayCount = []; for (var wi = 0; wi < 7; wi++) weekdayCount.push(0); // je Wochentag (0=So)
  var onboardSteps = {};               // step -> { clientId: 1 }
  var onboardComplete = {};            // clientId -> 1
  var editionClients = {};             // edition -> { clientId: 1 }
  var platformClients = {};            // platform -> { clientId: 1 }
  var acquisition = {};                // src -> distinkte Nutzer (nach erster Quelle)
  var clientFirstOpen = {};            // clientId -> { ts, src } (früheste Quelle je Nutzer)

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
      var edi = String(e.edition || "none"); (editionClients[edi] || (editionClients[edi] = {}))[cid] = 1;
      var plt = String(e.platform || "other"); (platformClients[plt] || (platformClients[plt] = {}))[cid] = 1;
    }
    if (ts) { var dt = new Date(ts); hourCount[dt.getUTCHours()]++; weekdayCount[dt.getUTCDay()]++; }

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
      case "app_open":
        (p.returning ? openReturning++ : openNew++);
        if (p.src && cid) { var fo = clientFirstOpen[cid]; if (!fo || ts < fo.ts) clientFirstOpen[cid] = { ts: ts, src: p.src }; }
        break;
      case "screen_view": if (p.screen) screenCounts[p.screen] = (screenCounts[p.screen] || 0) + 1; break;
      case "action": if (p.action) actionCounts[p.action] = (actionCounts[p.action] || 0) + 1; break;
      case "card_rated":
        if (ratingCounts[p.rating] != null) ratingCounts[p.rating]++;
        if (p.cat) { var cs = catStats[p.cat] || (catStats[p.cat] = { total: 0, again: 0 }); cs.total++; if (p.rating === "again") cs.again++; }
        break;
      case "session_start": if (p.mode) modeCount[p.mode] = (modeCount[p.mode] || 0) + 1; break;
      case "session_complete": if (p.accuracy) accuracyDist[p.accuracy] = (accuracyDist[p.accuracy] || 0) + 1; break;
      case "feature_complete":
        if (p.feature) {
          var f = featureCompletes[p.feature] || (featureCompletes[p.feature] = { count: 0, perfect: 0 });
          f.count++; if (p.perfect) f.perfect++;
        }
        break;
      case "search": searchTotal++; if (p.results === "0") searchZero++; break;
      case "onboarding_step": if (p.step && cid) { (onboardSteps[p.step] || (onboardSteps[p.step] = {}))[cid] = 1; } break;
      case "onboarding_complete": if (cid) onboardComplete[cid] = 1; break;
      case "error": {
        var key = (p.type || "error") + ": " + (p.msg || "?"); errorCounts[key] = (errorCounts[key] || 0) + 1;
        if (e.appVersion) errorsByVersion[e.appVersion] = (errorsByVersion[e.appVersion] || 0) + 1;
        break;
      }
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

  // --- Tages-Snapshots (anonym, ohne clientId): Adoption, Mastery, Trip, Streak ---
  var snapFeatureAdoption = {};
  var snapCardsToday = {};
  var snapStreak = {};
  var snapReviews = {};
  var masteryDist = {};
  var tripDailyDist = {};
  var tripGoalYes = 0;
  us.forEach(function (s) {
    var feats = isObj(s.features) ? s.features : {};
    Object.keys(feats).forEach(function (k) { if (feats[k]) snapFeatureAdoption[k] = (snapFeatureAdoption[k] || 0) + 1; });
    if (s.cardsToday) snapCardsToday[s.cardsToday] = (snapCardsToday[s.cardsToday] || 0) + 1;
    if (s.streak) snapStreak[s.streak] = (snapStreak[s.streak] || 0) + 1;
    if (s.reviews) snapReviews[s.reviews] = (snapReviews[s.reviews] || 0) + 1;
    if (s.mastered) masteryDist[s.mastered] = (masteryDist[s.mastered] || 0) + 1;
    if (s.tripGoal) tripGoalYes++;
    if (s.tripDaily) tripDailyDist[s.tripDaily] = (tripDailyDist[s.tripDaily] || 0) + 1;
  });

  // --- Teilen-Aktivität (share-*) aus den Aktionen ---
  var shareActions = topCounts(Object.keys(actionCounts).filter(function (k) { return k.indexOf("share") === 0; })
    .reduce(function (o, k) { o[k] = actionCounts[k]; return o; }, {}));

  // --- Trend vs. Vorperiode: aktive Nutzer der letzten 7 Tage vs. der 7 davor ---
  // Scannt ALLE Events (nicht die Fenster-gefilterten), da die Vorperiode sonst bei
  // kleinen Fenstern (z. B. days=7) herausfiele.
  function activeUsersWindow(offset, len) {
    var hi = dayUTC(now - offset * DAY_MS);
    var lo = dayUTC(now - (offset + len - 1) * DAY_MS);
    var set = {};
    evAll.forEach(function (e) { if (!isObj(e)) return; var day = String(e.day || ""), cid = String(e.clientId || ""); if (cid && day >= lo && day <= hi) set[cid] = 1; });
    return Object.keys(set).length;
  }
  function trend(cur, prev) { return { cur: cur, prev: prev, deltaPct: prev ? Math.round(((cur - prev) / prev) * 100) : (cur ? 100 : 0) }; }
  var wau7Cur = activeUsersWindow(0, 7), wau7Prev = activeUsersWindow(7, 7);

  // --- Schwierigste Themen: „Nochmal"-Quote je Kategorie (ab Mindestvolumen 5) ---
  var difficult = Object.keys(catStats).filter(function (c) { return catStats[c].total >= 5; })
    .map(function (c) { return { cat: c, total: catStats[c].total, againPct: Math.round((catStats[c].again / catStats[c].total) * 100) }; })
    .sort(function (a, b) { return b.againPct - a.againPct || b.total - a.total; }).slice(0, 12);

  // --- Aktive Tage je Nutzer + Erst-Tag (für Retention) ---
  var activeDaysHist = { "1": 0, "2": 0, "3-4": 0, "5-7": 0, "8+": 0 };
  var clientFirstDay = {};
  Object.keys(clientsAll).forEach(function (c) {
    var days = Object.keys(clientsAll[c]).sort();
    var n = days.length;
    activeDaysHist[n === 1 ? "1" : n === 2 ? "2" : n <= 4 ? "3-4" : n <= 7 ? "5-7" : "8+"]++;
    clientFirstDay[c] = days[0];
  });
  function addDays(dayStr, k) { var pp = String(dayStr).split("-"); return dayUTC(Date.UTC(+pp[0], +pp[1] - 1, +pp[2]) + k * DAY_MS); }
  // N-Tage-Retention: von den Nutzern, deren Erst-Tag+N noch im Bereich liegt, wie
  // viele waren an genau Tag (Erst-Tag+N) wieder aktiv?
  function retentionDay(k) {
    var elig = 0, ret = 0;
    Object.keys(clientFirstDay).forEach(function (c) {
      var target = addDays(clientFirstDay[c], k);
      if (target <= today) { elig++; if (clientsAll[c][target]) ret++; }
    });
    return { day: k, eligible: elig, pct: elig ? Math.round((ret / elig) * 100) : 0 };
  }
  var avgDAU = dauSeries.length ? Math.round(dauSeries.reduce(function (a, r) { return a + r.count; }, 0) / dauSeries.length) : 0;

  // --- Onboarding-Funnel (distinkte Nutzer je Schritt) ---
  var funnel = ["intro", "profile", "trip"].map(function (st) {
    return { step: st, count: onboardSteps[st] ? Object.keys(onboardSteps[st]).length : 0 };
  });
  funnel.push({ step: "complete", count: Object.keys(onboardComplete).length });

  function clientsByKey(map) { return topCounts(Object.keys(map).reduce(function (o, k) { o[k] = Object.keys(map[k]).length; return o; }, {})); }

  // Akquise: distinkte Nutzer nach ihrer ERSTEN Quelle (nicht Opens – sonst würden
  // wiederkehrende „direct"-Starts die Kanäle verzerren).
  Object.keys(clientFirstOpen).forEach(function (c) { var s = clientFirstOpen[c].src; acquisition[s] = (acquisition[s] || 0) + 1; });

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
      share: shareActions,
      acquisition: topCounts(acquisition),
    },
    learning: {
      ratings: ratingCounts,
      accuracy: topCounts(accuracyDist),
      modes: topCounts(modeCount),
      difficult: difficult,
      mastery: topCounts(masteryDist),
      features: Object.keys(featureCompletes).map(function (f) {
        var c = featureCompletes[f];
        return { feature: f, count: c.count, perfectPct: c.count ? Math.round((c.perfect / c.count) * 100) : 0 };
      }).sort(function (a, b) { return b.count - a.count; }),
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
  function query(req) {
    var q = {}; var qs = (req.url || "").split("?")[1] || "";
    qs.split("&").forEach(function (kv) { if (!kv) return; var i = kv.indexOf("="); var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i)); q[k] = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1)); });
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
