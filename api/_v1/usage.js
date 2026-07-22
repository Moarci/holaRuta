/*
 * POST /v1/usage  (auth-frei, BACKEND.md §17) – anonymer, gebucketeter Tages-Snapshot.
 * Keine PII, keine Karten-IDs, keine stabile ID. Server spiegelt Allowlist/Buckets,
 * cappt Größe, rate-limitet pro IP.
 */
"use strict";
const { send, readJson, jsonBytes, telemetryCors } = require("../_http");
const { allow, clientIp } = require("../_ratelimit");
const { service } = require("../_supabase");

const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : null);
const FEATURE_KEYS = ["study","listen","precios","dialogos","definiciones","yesto","frases","conjug","battles","roleplay","challenges","ruta","pretrip"];

module.exports = async (req, res) => {
  telemetryCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
  if (!(await allow("usage:" + clientIp(req), 30, 86400))) return send(res, 429, { error: "rate limited" });

  const body = await readJson(req);
  if (!body || typeof body !== "object" || jsonBytes(body) > 4 * 1024) return send(res, 400, { error: "bad body" });

  const features = {};
  if (body.features && typeof body.features === "object") {
    for (const k of FEATURE_KEYS) features[k] = !!body.features[k];
  }

  const { error } = await service().from("usage_snapshot").insert({
    day: str(body.day, 10),
    app_version: str(body.appVersion, 20),
    locale: str(body.locale, 8),
    track: str(body.track, 8),
    edition: str(body.edition, 40),
    platform: str(body.platform, 24),
    cards_bucket: str(body.cardsToday, 24),
    streak_bucket: str(body.streak, 24),
    reviews_bucket: str(body.reviews, 24),
    // mastered/tripGoal/tripDaily: Client sendet sie seit TELEMETRIE.md §2, bis
    // 2026-07-22 aber ohne Server-Spalte verworfen -> Mastery-/Reiseziel-Panels
    // im Investor-Cockpit blieben leer (supabase/migrations/0003_telemetry_admin.sql).
    mastered_bucket: str(body.mastered, 24),
    trip_goal: body.tripGoal === true,
    trip_daily_bucket: str(body.tripDaily, 24),
    features,
  });
  // Fehler NICHT als 200 quittieren: der Client merkt sich den Tag erst nach
  // `ok:true` als gesendet (analytics.js:maybeSend) — ein stiller 200 bei DB-
  // Fehler (z. B. Migration 0003 noch nicht angewendet -> unbekannte Spalte)
  // würde den Snapshot für den ganzen Tag unwiederbringlich verschlucken.
  if (error) return send(res, 500, { error: "insert failed" });
  return send(res, 200, { ok: true });
};
