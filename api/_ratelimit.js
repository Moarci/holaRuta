/*
 * api/_ratelimit.js – geteiltes, atomares Rate-Limit über die rate_limit-Tabelle
 * (Vercel-Functions sind zustandslos). Fenster = feste Sekundenbreite; ein Treffer
 * zählt count hoch und liefert true, solange count <= limit.
 *
 * Fällt der DB-Aufruf aus, wird bewusst „erlaubt" zurückgegeben (fail-open) – das
 * Rate-Limit ist Missbrauchs-Dämpfung, kein Sicherheits-Primärschutz, und darf den
 * Dienst bei DB-Hickup nicht komplett blockieren.
 */
"use strict";
const { service } = require("./_supabase");

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf) return xf.split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

// key: logischer Bucket-Name (z.B. "auth", "sync:<uid>", "usage"); limit: erlaubte
// Treffer je windowSec-Fenster. Gibt true = erlaubt, false = überschritten.
async function allow(key, limit, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const window = now - (now % windowSec);
  try {
    const { data, error } = await service().rpc("rl_hit", {
      p_bucket: key,
      p_window: window,
      p_limit: limit,
    });
    if (error) return true; // fail-open
    return data === true;
  } catch (e) {
    return true;
  }
}

module.exports = { allow, clientIp };
