/*
 * api/_auth.js – passwortloser Login + eigener Opaque-Session-Token.
 *
 * Warum ein EIGENER Token statt des rohen Supabase-JWT: net.js speichert genau
 * EINEN Bearer-Token und kennt kein Refresh. Ein 1-h-JWT erzwänge stündliches
 * Neu-Login. Der hier geminte Opaque-Token liegt in der session-Tabelle, ist
 * langlebig und per logout widerrufbar (BACKEND.md §7).
 */
"use strict";
const crypto = require("crypto");
const { service, authClient } = require("./_supabase");

function mintToken() {
  return "hr_" + crypto.randomBytes(32).toString("hex");
}

// POST /v1/auth/start – OTP/Magic-Link per E-Mail anstoßen. Kein Token zurück:
// net.js interpretiert die Abwesenheit von devToken als { pending:true }.
async function start(email) {
  const { error } = await authClient().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw new Error("auth start failed");
  return { pending: true };
}

// profile upserten + neuen Opaque-Session-Token minten. Geteilt von ALLEN
// Login-Wegen (E-Mail-OTP wie Google-OAuth), damit Identität/Token an genau
// EINER Stelle entstehen (BACKEND.md §7). `extra` ergänzt optionale
// Profil-Felder (z. B. display_name aus der Google-Identity); nur bekannte
// Spalten – das Schema hat keine Avatar-Spalte.
async function mintSession(uid, email, extra) {
  const db = service();
  await db.from("profile").upsert(
    Object.assign({ id: uid, email: email || null }, extra || {}),
    { onConflict: "id" }
  );
  const access = mintToken();
  await db.from("session").insert({ token: access, user_id: uid });
  return { accessToken: access, account: { email: email || null } };
}

// POST /v1/auth/confirm – OTP verifizieren, profile upserten, Session-Token minten.
// `locale` (optional, bereits via parseLocale validiert) landet in profile.locale.
async function confirm(email, token, locale) {
  const { data, error } = await authClient().auth.verifyOtp({ email, token, type: "email" });
  if (error || !data || !data.user) throw new Error("confirm failed");
  return mintSession(data.user.id, data.user.email || email, locale ? { locale } : undefined);
}

// GET /v1/auth/google/start – die serverseitig gebaute Google-OAuth-URL liefern.
// redirectTo = eigene Callback-Seite (auth-callback.html); der Aufrufer validiert
// sie vorher gegen die eigene Origin (kein offener Redirector).
async function googleUrl(redirectTo) {
  const { data, error } = await authClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data || !data.url) throw new Error("google url failed");
  return data.url;
}

// POST /v1/auth/google/confirm – das aus dem Implicit-Redirect stammende
// Supabase-Access-Token validieren, profile upserten (E-Mail + display_name aus
// der Google-Identity, optional locale wie beim OTP-Weg) und unseren eigenen
// Session-Token minten.
async function googleConfirm(supabaseToken, locale) {
  const { data, error } = await authClient().auth.getUser(supabaseToken);
  if (error || !data || !data.user) throw new Error("google confirm failed");
  const u = data.user;
  const meta = u.user_metadata || {};
  const name = meta.full_name || meta.name || null;
  const extra = {};
  if (name) extra.display_name = name;
  if (locale) extra.locale = locale;
  return mintSession(u.id, u.email || null, Object.keys(extra).length ? extra : undefined);
}

// Bearer-Token -> user_id (oder null). Aktualisiert last_seen_at best-effort.
async function resolveUser(req) {
  const auth = req.headers.authorization || "";
  const token = auth.indexOf("Bearer ") === 0 ? auth.slice(7) : "";
  if (!token) return null;
  const db = service();
  const { data, error } = await db
    .from("session")
    .select("user_id, revoked_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data || data.revoked_at) return null;
  db.from("session").update({ last_seen_at: new Date().toISOString() }).eq("token", token).then(() => {}, () => {});
  return data.user_id;
}

// Aktuellen Bearer-Token widerrufen (logout).
async function revoke(req) {
  const auth = req.headers.authorization || "";
  const token = auth.indexOf("Bearer ") === 0 ? auth.slice(7) : "";
  if (!token) return;
  await service().from("session").update({ revoked_at: new Date().toISOString() }).eq("token", token);
}

module.exports = { start, confirm, resolveUser, revoke, mintToken, mintSession, googleUrl, googleConfirm };
