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

// POST /v1/auth/confirm – OTP verifizieren, profile upserten, Session-Token minten.
async function confirm(email, token) {
  const { data, error } = await authClient().auth.verifyOtp({ email, token, type: "email" });
  if (error || !data || !data.user) throw new Error("confirm failed");
  const uid = data.user.id;
  const db = service();
  await db.from("profile").upsert(
    { id: uid, email: data.user.email || email },
    { onConflict: "id" }
  );
  const access = mintToken();
  await db.from("session").insert({ token: access, user_id: uid });
  return { accessToken: access, account: { email: data.user.email || email } };
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

module.exports = { start, confirm, resolveUser, revoke, mintToken };
