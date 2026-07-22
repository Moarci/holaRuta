/*
 * GET /v1/auth/google/start?redirect=<callback>&s=<state> -> 302 auf die Google-OAuth-URL.
 *
 * Der Client navigiert den Browser direkt hierher (kein JSON-Roundtrip). Wir bauen
 * serverseitig die Supabase-Google-URL (authClient/signInWithOAuth) und leiten mit
 * 302 dorthin weiter.
 *
 * Redirect-Härtung liegt in ./_redirect.js (dependency-frei, unit-getestet):
 * safeRedirect() prüft das Ziel gegen eine feste Allowlist (Env AUTH_REDIRECT_ORIGINS)
 * und erzwingt den Pfad /auth-callback.html -> kein offener Redirector, kein blindes
 * Vertrauen auf Host-Header. Zweite Schranke bleibt Supabases eigene Redirect-Allowlist.
 * Fehlerfälle leiten (Browser-Navigation!) zurück zur App statt rohes JSON zu zeigen.
 */
"use strict";
const { send } = require("../../../_http");
const { allow, clientIp } = require("../../../_ratelimit");
const { googleUrl } = require("../../../_auth");
const { allowedOrigins, safeRedirect } = require("./_redirect");

// Bei Fehlern (Rate-Limit, Google-Start scheitert) zurück zur App mit Fehlerflag –
// der Aufruf kommt per Top-Level-Navigation, rohes JSON wäre eine Sackgasse.
function redirectToApp(req, res, reason) {
  const origins = allowedOrigins(req);
  const base = origins.length ? origins[0] : "";
  res.statusCode = 302;
  res.setHeader("Location", base + "/?auth_error=" + encodeURIComponent(reason));
  res.setHeader("Cache-Control", "no-store");
  return res.end();
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "method not allowed" });
  if (!(await allow("authg:" + clientIp(req), 20, 600))) return redirectToApp(req, res, "ratelimited");
  const target = safeRedirect(req);
  if (!target) return redirectToApp(req, res, "config");
  try {
    const url = await googleUrl(target);
    res.statusCode = 302;
    res.setHeader("Location", url);
    res.setHeader("Cache-Control", "no-store");
    return res.end();
  } catch (e) {
    return redirectToApp(req, res, "google");
  }
};
