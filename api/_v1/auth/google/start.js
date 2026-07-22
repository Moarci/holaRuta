/*
 * GET /v1/auth/google/start?redirect=<callback>&s=<state> -> 302 auf die Google-OAuth-URL.
 *
 * Der Client navigiert den Browser direkt hierher (kein JSON-Roundtrip). Wir bauen
 * serverseitig die Supabase-Google-URL (authClient/signInWithOAuth) und leiten mit
 * 302 dorthin weiter.
 *
 * Redirect-Härtung: Das `redirect`-Ziel wird gegen eine FESTE Allowlist geprüft
 * (Env AUTH_REDIRECT_ORIGINS, kommagetrennt) und muss auf /auth-callback.html zeigen
 * -> kein offener Redirector, kein Vertrauen allein auf gefälschte Host-Header. Ohne
 * gesetzte Env fällt es auf die anfragende (Vercel-gesetzte) Origin zurück; zweite,
 * unabhängige Schranke bleibt Supabases eigene Redirect-URL-Allowlist. Fehlerfälle
 * leiten (Browser-Navigation!) zurück zur App statt rohes JSON zu zeigen.
 */
"use strict";
const { send } = require("../../../_http");
const { allow, clientIp } = require("../../../_ratelimit");
const { googleUrl } = require("../../../_auth");

// Erlaubte App-Origins. Primär die feste Env-Allowlist; ohne sie die anfragende
// Origin (Vercel setzt x-forwarded-* selbst und verwirft eingehende Fälschungen).
function allowedOrigins(req) {
  const env = String(process.env.AUTH_REDIRECT_ORIGINS || "").trim();
  if (env) return env.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  return host ? [proto + "://" + host] : [];
}

// Nur ein Ziel auf einer erlaubten Origin UND mit Pfad /auth-callback.html ist gültig
// (Query wie ?s=<state> bleibt erhalten). Sonst Default-Callback der ersten Origin.
function safeRedirect(req) {
  const origins = allowedOrigins(req);
  const raw = req.query && req.query.redirect ? String(req.query.redirect) : "";
  for (const origin of origins) {
    try {
      const u = new URL(raw, origin);
      if (u.origin === origin && u.pathname === "/auth-callback.html") return u.toString();
    } catch (e) { /* ungültig -> nächste Origin / Default */ }
  }
  return origins.length ? origins[0] + "/auth-callback.html" : "";
}

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
