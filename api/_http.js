/*
 * api/_http.js – kleine, abhängigkeitsfreie HTTP-Helfer für die Vercel-Functions.
 * Same-Origin ist der Normalfall (API unter derselben Domain wie die PWA) -> kein
 * CORS nötig. Nur die auth-freien Telemetrie-Endpunkte setzen explizite CORS-Header,
 * damit sie auch von einer file://- oder Editions-Origin erreichbar bleiben.
 */
"use strict";

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(body === undefined ? "" : JSON.stringify(body));
}

// Body robust lesen (Vercel parst JSON meist schon in req.body; sonst Stream).
// Wichtig: bei Overlong-Body NICHT nur req.destroy() (das feuert weder `end` noch
// zwingend `error`, das Promise bliebe für immer hängen -> Function-Timeout). Statt
// dessen das Promise sofort mit null auflösen, damit der Aufrufer sauber 400/413 sendet.
function readJson(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let raw = "";
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    req.on("data", (c) => { raw += c; if (raw.length > 4e6) { try { req.destroy(); } catch (e) {} finish(null); } });
    req.on("end", () => { try { finish(raw ? JSON.parse(raw) : {}); } catch (e) { finish(null); } });
    req.on("error", () => finish(null));
    req.on("close", () => finish(null));
    req.on("aborted", () => finish(null));
  });
}

// Byte-Länge einer JSON-serialisierbaren Struktur (UTF-8) – fürs Payload-Limit.
function jsonBytes(obj) {
  try { return Buffer.byteLength(JSON.stringify(obj), "utf8"); } catch (e) { return Infinity; }
}

// Offene CORS-Header nur für die auth-freien Telemetrie-Endpunkte.
function telemetryCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = { send, readJson, jsonBytes, telemetryCors };
