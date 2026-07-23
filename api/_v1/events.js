/*
 * POST   /v1/events { events:[envelope,…] }  (auth-frei, sendBeacon-tauglich) – Event-Strom.
 * DELETE /v1/events?clientId=…               – Löschung per pseudonymer clientId (DSGVO Art. 17).
 * Server spiegelt die Allowlist, cappt Batch-Größe/-Anzahl, rate-limitet pro clientId/IP.
 */
"use strict";
const { send, readJson, jsonBytes, telemetryCors } = require("../_http");
const { allow, clientIp } = require("../_ratelimit");
const { service } = require("../_supabase");

const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : null);
const int = (v) => (typeof v === "number" && isFinite(v) ? Math.trunc(v) : null);
const MAX_BATCH = 50;

// props hart deckeln (≤16 Felder, nur bool/endliche Zahl/kurzer String): der echte
// Client sendet ohnehin nur die Allowlist (analytics.js:EVENTS), aber der Endpunkt
// ist auth-frei – ohne diese Schranke könnte JEDER bis zu 64 KB beliebig
// verschachteltes JSON pro Event in den append-only Store schreiben.
// Object.fromEntries DEFINIERT eigene Properties (kein Setter-Aufruf), daher ist
// auch ein "__proto__"-Schlüssel hier keine Prototype-Pollution-Senke.
const PROP_KEY = /^[a-z0-9_]{1,32}$/i;
function cleanProps(p) {
  if (!p || typeof p !== "object" || Array.isArray(p)) return {};
  const pairs = [];
  for (const k of Object.keys(p)) {
    if (pairs.length >= 16) break;
    if (!PROP_KEY.test(k)) continue;
    const v = p[k];
    if (typeof v === "boolean") pairs.push([k, v]);
    else if (typeof v === "number" && isFinite(v)) pairs.push([k, v]);
    else if (typeof v === "string") pairs.push([k, v.slice(0, 80)]);
  }
  return Object.fromEntries(pairs);
}

function mapEvent(e) {
  if (!e || typeof e !== "object") return null;
  return {
    v: int(e.v),
    ts: int(e.ts),
    day: str(e.day, 10),
    client_id: str(e.clientId, 64),
    session_id: str(e.sessionId, 64),
    seq: int(e.seq),
    app_version: str(e.appVersion, 20),
    locale: str(e.locale, 8),
    track: str(e.track, 8),
    edition: str(e.edition, 40),
    platform: str(e.platform, 24),
    event: str(e.event, 40),
    props: cleanProps(e.props),
  };
}

module.exports = async (req, res) => {
  telemetryCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  const db = service();

  if (req.method === "DELETE") {
    if (!(await allow("events-del:" + clientIp(req), 30, 3600))) return send(res, 429, { error: "rate limited" });
    const clientId = String((req.query && req.query.clientId) || "");
    if (!clientId) return send(res, 400, { error: "missing clientId" });
    await db.from("event").delete().eq("client_id", clientId);
    return send(res, 200, { deleted: true });
  }

  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });

  const body = await readJson(req);
  if (!body || !Array.isArray(body.events) || jsonBytes(body) > 64 * 1024) {
    return send(res, 400, { error: "bad body" });
  }
  const rows = body.events.slice(0, MAX_BATCH).map(mapEvent).filter(Boolean);
  if (!rows.length) return send(res, 200, { ok: true });

  // Rate-Limit auf der SERVER-beobachteten IP (nicht auf der client-gelieferten
  // clientId – die kann ein Angreifer pro Request rotieren und so das Limit
  // umgehen und den append-only event-Store fluten).
  if (!(await allow("events:" + clientIp(req), 120, 60))) return send(res, 429, { error: "rate limited" });

  const { error } = await db.from("event").insert(rows);
  // Fehler NICHT als 200 quittieren: der Client markiert Events erst nach `ok:true`
  // als gesendet (analytics.js:flush) — ein stiller 200 bei DB-Fehler (z. B. Schema-
  // Drift nach unvollständigem Migrations-Rollout) würde die Events unwiederbringlich
  // aus der lokalen Retry-Queue entfernen, ohne dass sie je gespeichert wurden.
  if (error) return send(res, 500, { error: "insert failed" });
  return send(res, 200, { ok: true });
};
