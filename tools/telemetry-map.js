/*
 * tools/telemetry-map.js — reine Mapper Supabase-Zeile (snake_case, aus
 * `event`/`usage_snapshot`) -> aggregate()-Envelope (camelCase, siehe
 * tools/telemetry-server.js). Genutzt von api/_v1/admin/stats.js, damit das
 * bestehende Investor-Cockpit auch gegen die echten Produktionsdaten läuft
 * (nicht nur gegen die lokale JSONL-Demo). Kein I/O, unit-getestet
 * (test/telemetry-map.test.js).
 */
"use strict";

function str(v) { return typeof v === "string" ? v : null; }
function num(v) { return typeof v === "number" && isFinite(v) ? v : null; }
function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }

function mapEventRow(row) {
  if (!isObj(row)) return null;
  return {
    v: num(row.v),
    ts: num(row.ts),
    day: str(row.day),
    clientId: str(row.client_id),
    sessionId: str(row.session_id),
    seq: num(row.seq),
    appVersion: str(row.app_version),
    locale: str(row.locale),
    track: str(row.track),
    edition: str(row.edition),
    platform: str(row.platform),
    event: str(row.event),
    props: isObj(row.props) ? row.props : {},
  };
}

function mapUsageRow(row) {
  if (!isObj(row)) return null;
  return {
    day: str(row.day),
    appVersion: str(row.app_version),
    locale: str(row.locale),
    track: str(row.track),
    edition: str(row.edition),
    platform: str(row.platform),
    cardsToday: str(row.cards_bucket),
    streak: str(row.streak_bucket),
    reviews: str(row.reviews_bucket),
    mastered: str(row.mastered_bucket),
    tripGoal: row.trip_goal === true,
    tripDaily: str(row.trip_daily_bucket),
    features: isObj(row.features) ? row.features : {},
  };
}

module.exports = { mapEventRow, mapUsageRow };
