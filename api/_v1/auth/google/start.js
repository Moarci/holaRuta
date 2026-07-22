/*
 * GET /v1/auth/google/start?redirect=<callback> -> 302 auf die Google-OAuth-URL.
 *
 * Der Client navigiert den Browser direkt hierher (kein JSON-Roundtrip). Wir bauen
 * serverseitig die Supabase-Google-URL (authClient/signInWithOAuth) und leiten mit
 * 302 dorthin weiter. `redirect` (die eigene Callback-Seite) wird gegen die
 * anfragende Origin geprüft, damit dieser Endpunkt KEIN offener Redirector ist.
 */
"use strict";
const { send } = require("../../../_http");
const { allow, clientIp } = require("../../../_ratelimit");
const { googleUrl } = require("../../../_auth");

// Erlaubt ist nur ein redirect auf dieselbe Host/Origin wie die Anfrage (Same-Origin
// PWA). Fehlt ein sauberes Ziel, auf "/auth-callback.html" der eigenen Origin fallen.
function safeRedirect(req) {
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const origin = host ? proto + "://" + host : "";
  const raw = req.query && req.query.redirect ? String(req.query.redirect) : "";
  if (raw && origin) {
    try {
      const u = new URL(raw, origin);
      if (u.origin === origin) return u.toString();
    } catch (e) { /* ungültig -> Default */ }
  }
  return origin ? origin + "/auth-callback.html" : "/auth-callback.html";
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "method not allowed" });
  if (!(await allow("authg:" + clientIp(req), 20, 600))) return send(res, 429, { error: "rate limited" });
  try {
    const url = await googleUrl(safeRedirect(req));
    res.statusCode = 302;
    res.setHeader("Location", url);
    res.setHeader("Cache-Control", "no-store");
    return res.end();
  } catch (e) {
    return send(res, 502, { error: "google start failed" });
  }
};
