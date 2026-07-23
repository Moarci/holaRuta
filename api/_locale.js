/*
 * api/_locale.js – UI-Sprache aus dem Request-Body whitelisten.
 *
 * Der Client schickt beim Auth-Confirm optional seine UI-Sprache mit
 * (net.confirm / net.googleConfirm), damit sie in profile.locale landet und
 * Betreiber-Mails später in der Sprache der Nutzer:in rausgehen können
 * (Locals-Track: es). Bewusst dependency-frei (kein Supabase-Import), damit
 * Tests den Helfer ohne Env laden können – gleiches Muster wie
 * api/_v1/auth/google/_redirect.js.
 */
"use strict";

const LOCALES = ["de", "en", "es"];

// Ungültig/fehlend -> undefined: dann bleibt profile.locale beim Upsert
// unangetastet (der Upsert schreibt nur gelieferte Spalten).
function parseLocale(v) {
  const l = typeof v === "string" ? v.trim().toLowerCase() : "";
  return LOCALES.indexOf(l) >= 0 ? l : undefined;
}

module.exports = { parseLocale, LOCALES };
