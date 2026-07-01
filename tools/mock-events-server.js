/*
 * tools/mock-events-server.js — REFERENZ-/DEMO-Collector der HolaRuta-Telemetrie.
 *
 * Zweck: die optionale, opt-in Telemetrie (BACKEND.md §17) lokal end-to-end
 * sichtbar machen — der anonyme Tages-Snapshot (`POST /v1/usage`) UND der
 * pseudonyme Interaktions-Event-Strom (`POST /v1/events`, auch via sendBeacon).
 * KEIN Produktionscode: alles im RAM, kein Auth, keine Persistenz, keine
 * Sicherheit. Ein echter Collector (§17.6.3) hätte einen append-only Event-Store,
 * Rate-Limiting, Größenlimits und befristete Aufbewahrung.
 *
 * Zero-Dependency: nur Node-Builtins (http). Starten:
 *   node tools/mock-events-server.js            # Port 8789
 *   PORT=9000 node tools/mock-events-server.js
 *
 * Dann in einer Edition (z. B. editions/<id>.js) setzen:
 *   analytics: { enabled: true, endpoint: "http://localhost:8789" }
 * und mit  `node build.js --edition=<id>`  bauen + öffnen. In den Einstellungen
 * „Nutzungsstatistik teilen" auf An — der Server loggt eintreffende Events.
 */
"use strict";
const http = require("http");

const PORT = Number(process.env.PORT) || 8789;

// In-RAM-„Store": nur Aggregate, damit man im Terminal sofort etwas sieht.
let snapshots = 0;                 // empfangene Tages-Snapshots
// Echte Map: der Schlüssel (event-Name) kommt aus ungeprüften POST-Daten – ein
// Objekt-Property-Write damit wäre eine Injection-/Prototype-Pollution-Senke.
const eventCounts = new Map();     // event-Name -> Anzahl
const clients = new Set();         // distinkte pseudonyme clientIds (nur zum Zählen)
let totalEvents = 0;

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let buf = "";
    req.on("data", (c) => { buf += c; if (buf.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : null); } catch (e) { resolve(null); } });
    req.on("error", () => resolve(null));
  });
}

function summary() {
  const parts = [...eventCounts.keys()].sort().map((k) => `${k}=${eventCounts.get(k)}`);
  return `snapshots=${snapshots} · events=${totalEvents} · clients=${clients.size}` +
    (parts.length ? `\n   ${parts.join("  ")}` : "");
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204);
  const url = (req.url || "").split("?")[0];

  if (req.method === "POST" && url === "/v1/usage") {
    const body = await readBody(req);
    snapshots++;
    console.log(`[usage] Tages-Snapshot #${snapshots}:`, JSON.stringify(body));
    console.log("  →", summary());
    return send(res, 200, { ok: true });
  }

  if (req.method === "POST" && url === "/v1/events") {
    const body = await readBody(req);
    const events = body && Array.isArray(body.events) ? body.events : [];
    events.forEach((e) => {
      if (!e || typeof e !== "object") return;
      totalEvents++;
      const name = String(e.event || "?");
      eventCounts.set(name, (eventCounts.get(name) || 0) + 1);
      if (e.clientId) clients.add(String(e.clientId));
    });
    console.log(`[events] +${events.length} (${events.map((e) => e && e.event).join(", ")})`);
    console.log("  →", summary());
    return send(res, 200, { ok: true, accepted: events.length });
  }

  return send(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`HolaRuta Mock-Telemetrie-Collector läuft auf http://localhost:${PORT}`);
  console.log("  POST /v1/usage   – anonymer Tages-Snapshot (§17.2)");
  console.log("  POST /v1/events  – pseudonyme Interaktions-Events (§17.6)");
  console.log("  Edition-Config:  analytics: { enabled: true, endpoint: \"http://localhost:" + PORT + "\" }");
});
