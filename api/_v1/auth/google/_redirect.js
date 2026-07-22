/*
 * api/_v1/auth/google/_redirect.js – reine Redirect-Härtung für den Google-Login.
 *
 * Bewusst OHNE Abhängigkeiten (kein Supabase-Import): so sind allowedOrigins() und
 * safeRedirect() ohne Env unit-testbar (test/auth-google-start.test.js) und start.js
 * bleibt der dünne HTTP-Handler. Der Unterstrich-Präfix hält die Datei aus dem
 * Vercel-Function-Deploy heraus.
 */
"use strict";

// Erlaubte App-Origins. Primär die feste Env-Allowlist (AUTH_REDIRECT_ORIGINS,
// kommagetrennt); ohne sie die anfragende Origin (Vercel setzt x-forwarded-* selbst
// und verwirft eingehende Fälschungen). Zweite, unabhängige Schranke bleibt
// Supabases eigene Redirect-URL-Allowlist.
function allowedOrigins(req) {
  const env = String(process.env.AUTH_REDIRECT_ORIGINS || "").trim();
  if (env) return env.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  return host ? [proto + "://" + host] : [];
}

// Nur ein Ziel auf einer erlaubten Origin UND mit Pfad /auth-callback.html ist gültig
// (Query wie ?s=<state> bleibt erhalten). Sonst Default-Callback der ersten Origin
// (bzw. "" ohne erlaubte Origin) -> kein offener Redirector.
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

module.exports = { allowedOrigins, safeRedirect };
