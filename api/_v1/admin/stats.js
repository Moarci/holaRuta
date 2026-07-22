/*
 * GET /v1/admin/stats | /v1/admin/stats.csv | /v1/admin/kpis.csv
 * Investor-Cockpit (docs/INVESTOR-KPIS.md) gegen die ECHTEN Produktionsdaten
 * (Supabase `event`/`usage_snapshot`) — nicht die lokale JSONL-Demo
 * (tools/telemetry-server.js). Nutzt dieselbe reine, unit-getestete
 * aggregate()/toCsv()/toKpiCsv()-Funktion; der Dispatcher (api/v1.js) setzt
 * req.query.__adminFormat je nach angefragtem Pfad-Segment.
 *
 * Auth: fail-CLOSED ohne ADMIN_TELEMETRY_TOKEN (wie api/cron/purge-events.js) —
 * mit Env-Var per `Authorization: Bearer <token>` ODER `?token=…`.
 */
"use strict";
const { allow, clientIp } = require("../../_ratelimit");
const { service } = require("../../_supabase");
const { mapEventRow, mapUsageRow } = require("../../../tools/telemetry-map");
const { aggregate, toCsv, toKpiCsv, dayUTC } = require("../../../tools/telemetry-server");

const ALLOWED_DAYS = { 7: 1, 14: 1, 30: 1, 90: 1 };
const PAGE_SIZE = 1000;
const MAX_PAGES = 30; // Deckel (~30k Zeilen/Tabelle) gegen die 15s-Function-Laufzeit (vercel.json)
const DAY_MS = 86400000;
// Deckungsgleich mit api/cron/purge-events.js: alles Ältere ist ohnehin (bald) purged.
const RETENTION_DAYS = Number(process.env.EVENT_RETENTION_DAYS) || 90;

const EVENT_COLUMNS = "id,v,ts,day,client_id,session_id,seq,app_version,locale,track,edition,platform,event,props";
const USAGE_COLUMNS = "id,day,app_version,locale,track,edition,platform,cards_bucket,streak_bucket,reviews_bucket,mastered_bucket,trip_goal,trip_daily_bucket,features";

// cutoffDay grenzt auf die Retention-Periode ein (weniger Zeilen, kein Datum
// außerhalb ohnehin gepurgter Historie). ORDER BY id DESC ist bewusst: greift
// der MAX_PAGES-Deckel, sollen die NEUESTEN Zeilen überleben (die das Dashboard
// tatsächlich zeigt), nicht die ältesten — aggregate() selbst ist reihenfolge-
// unabhängig, iteriert nur über das Array.
async function fetchAll(db, table, columns, cutoffDay) {
  const rows = [];
  let from = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await db.from(table).select(columns).gte("day", cutoffDay).order("id", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(table + ": " + error.message);
    if (!data || !data.length) break;
    rows.push.apply(rows, data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
function csv(res, body) {
  res.status(200).setHeader("Content-Type", "text/csv; charset=utf-8");
  res.end(body);
}

module.exports = async (req, res) => {
  // Offene CORS: das Dashboard ist eine statische Datei (file:// oder beliebig
  // gehostet), der Token gate't den Zugriff, nicht die Origin.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const token = process.env.ADMIN_TELEMETRY_TOKEN;
  if (!token) return json(res, 500, { error: "admin telemetry not configured" });
  if (req.method !== "GET") return json(res, 405, { error: "method not allowed" });

  const auth = req.headers.authorization || "";
  const qToken = (req.query && req.query.token) || "";
  if (auth !== "Bearer " + token && qToken !== token) return json(res, 401, { error: "unauthorized" });

  if (!(await allow("admin-stats:" + clientIp(req), 30, 60))) return json(res, 429, { error: "rate limited" });

  const days = Number(req.query && req.query.days);
  const windowDays = ALLOWED_DAYS[days] ? days : 30;
  const format = (req.query && req.query.__adminFormat) || "json";

  const db = service();
  const cutoffDay = dayUTC(Date.now() - (RETENTION_DAYS - 1) * DAY_MS);
  let eventRows, usageRows;
  try {
    [eventRows, usageRows] = await Promise.all([
      fetchAll(db, "event", EVENT_COLUMNS, cutoffDay),
      fetchAll(db, "usage_snapshot", USAGE_COLUMNS, cutoffDay),
    ]);
  } catch (e) {
    return json(res, 500, { error: "fetch failed" });
  }

  const events = eventRows.map(mapEventRow).filter(Boolean);
  const usage = usageRows.map(mapUsageRow).filter(Boolean);
  const stats = aggregate(events, usage, { now: Date.now(), windowDays });

  if (format === "csv") return csv(res, toCsv(stats));
  if (format === "kpicsv") return csv(res, toKpiCsv(stats));
  return json(res, 200, stats);
};
