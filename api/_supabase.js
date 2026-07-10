/*
 * api/_supabase.js – Supabase-Clients für die Vercel-Functions.
 *  - service():  Service-Role (bypasst RLS) für DB-Zugriff. Nur serverseitig!
 *  - authClient(): Anon-Key nur für den passwortlosen Auth-Flow (signInWithOtp/verifyOtp).
 * Secrets kommen ausschließlich aus Env-Vars (nie im Client).
 */
"use strict";
const { createClient } = require("@supabase/supabase-js");

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error("missing env " + name);
  return v;
}

let _service = null;
function service() {
  if (!_service) {
    _service = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _service;
}

let _auth = null;
function authClient() {
  if (!_auth) {
    _auth = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _auth;
}

module.exports = { service, authClient };
