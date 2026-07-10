/*
 * GET /api/cron/purge-events – Retention-Job (Vercel Cron, siehe vercel.json).
 * Löscht Roh-Events älter als RETENTION_DAYS (Default 90). DSGVO §17.6.3: danach
 * nur noch Aggregate. Durch CRON_SECRET geschützt (Vercel setzt den Bearer-Header).
 */
"use strict";
const { send } = require("../_http");
const { service } = require("../_supabase");

const RETENTION_DAYS = Number(process.env.EVENT_RETENTION_DAYS) || 90;

module.exports = async (req, res) => {
  // Fail-CLOSED: ohne konfiguriertes CRON_SECRET ist der Endpunkt gesperrt (statt
  // öffentlich). Vercel Cron sendet das Secret als Bearer-Header.
  const secret = process.env.CRON_SECRET;
  if (!secret) return send(res, 500, { error: "cron not configured" });
  const auth = req.headers.authorization || "";
  if (auth !== "Bearer " + secret) return send(res, 401, { error: "unauthorized" });

  const db = service();
  const now = Date.now();
  const cutoff = new Date(now - RETENTION_DAYS * 86400 * 1000).toISOString();
  // rate_limit-Fenster verfallen schnell; alte Zeilen (>2 Tage) sind nur Ballast.
  const rlCutoff = Math.floor((now - 2 * 86400 * 1000) / 1000);

  const [ev, us, rl] = await Promise.all([
    db.from("event").delete().lt("received_at", cutoff),
    db.from("usage_snapshot").delete().lt("received_at", cutoff),
    db.from("rate_limit").delete().lt("window_start", rlCutoff),
  ]);
  const failed = [ev, us, rl].find((r) => r && r.error);
  if (failed) return send(res, 500, { error: "purge failed" });
  return send(res, 200, { ok: true, cutoff });
};
