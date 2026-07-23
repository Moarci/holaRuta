/*
 * telemetry-server-routes.test.js – INTEGRATIONSTEST der Self-Host-Collector-Routen:
 * tools/telemetry-server.js wird als ECHTER Prozess auf einem ephemeren Port
 * (PORT=0, OS vergibt frei -> kollisionsfrei) gestartet und über HTTP geprüft:
 * Ingest (POST /v1/usage + /v1/events), 400 bei kaputtem POST (Client behält den
 * Batch), Token-Gate (401), ?days-Whitelist und die CSV-Exporte. Diese Routen
 * waren bislang nur manuell verifiziert (docs/TELEMETRIE.md §10).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

const SERVER = path.join(__dirname, "..", "tools", "telemetry-server.js");
const TOKEN = "test-geheim";
const TODAY = new Date().toISOString().slice(0, 10); // UTC-Tag, wie aggregate() ihn fenstert

test("Self-Host-Collector: Routen end-to-end (echter Prozess, ephemerer Port)", async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "holaruta-telemetry-"));
  const child = spawn(process.execPath, [SERVER], {
    env: Object.assign({}, process.env, { PORT: "0", TELEMETRY_DIR: dataDir, TELEMETRY_TOKEN: TOKEN }),
    stdio: ["ignore", "pipe", "inherit"],
  });
  try {
    // Adresse aus der ersten Log-Zeile lesen (der Server loggt den TATSÄCHLICHEN Port).
    const base = await new Promise((resolve, reject) => {
      let out = "";
      const timer = setTimeout(() => reject(new Error("Server-Start-Timeout; stdout: " + out)), 10000);
      child.stdout.on("data", (c) => {
        out += c;
        const m = out.match(/http:\/\/localhost:(\d+)/);
        if (m) { clearTimeout(timer); resolve("http://localhost:" + m[1]); }
      });
      child.on("exit", (code) => { clearTimeout(timer); reject(new Error("Server endete vorzeitig (code " + code + "); stdout: " + out)); });
    });
    const post = (p, body) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/json" }, body });

    await t.test("Ingest: POST /v1/events + /v1/usage werden angenommen und persistiert", async () => {
      const ts = Date.now();
      const events = [
        { v: 1, ts, day: TODAY, clientId: "itA", sessionId: "itS1", seq: 0, event: "app_open", props: { returning: false, src: "task" } },
        { v: 1, ts: ts + 1000, day: TODAY, clientId: "itA", sessionId: "itS1", seq: 1, event: "session_complete", props: { accuracy: "75-90" } },
      ];
      let r = await post("/v1/events", JSON.stringify({ events }));
      assert.equal(r.status, 200);
      assert.equal((await r.json()).accepted, 2);
      r = await post("/v1/usage", JSON.stringify({ app: "holaruta", schema: 1, day: TODAY, cardsToday: "1-10", features: { study: true } }));
      assert.equal(r.status, 200);
      // JSONL liegt auf der Platte (Persistenz, überlebt einen Neustart).
      assert.ok(fs.readFileSync(path.join(dataDir, "events.jsonl"), "utf8").includes("itA"));
      assert.ok(fs.readFileSync(path.join(dataDir, "usage.jsonl"), "utf8").includes("1-10"));
    });

    await t.test("400 bei kaputtem POST-Body (Client behält den Batch, kein Datenverlust)", async () => {
      const r = await post("/v1/events", "kein json {{");
      assert.equal(r.status, 400);
    });

    await t.test("Token-Gate: Lese-Routen ohne/mit falschem Token -> 401; Ingest bleibt offen", async () => {
      for (const p of ["/api/stats", "/api/stats.csv", "/api/kpis.csv", "/"]) {
        assert.equal((await fetch(base + p)).status, 401, p + " ohne Token");
      }
      assert.equal((await fetch(base + "/api/stats?token=falsch")).status, 401);
      assert.equal((await fetch(base + "/api/stats", { headers: { Authorization: "Bearer " + TOKEN } })).status, 200, "Bearer-Header geht auch");
    });

    await t.test("GET /api/stats: Aggregation über die ingestierten Daten; ?days-Whitelist", async () => {
      const s = await (await fetch(base + "/api/stats?token=" + TOKEN)).json();
      assert.equal(s.totals.users, 1, "clientId itA");
      assert.equal(s.totals.events, 2);
      assert.equal(s.totals.snapshots, 1);
      assert.equal(s.windowDays, 30, "Default-Fenster");
      const s90 = await (await fetch(base + "/api/stats?token=" + TOKEN + "&days=90")).json();
      assert.equal(s90.windowDays, 90);
      const s13 = await (await fetch(base + "/api/stats?token=" + TOKEN + "&days=13")).json();
      assert.equal(s13.windowDays, 30, "nicht gelistete days-Werte fallen auf 30 zurück");
    });

    await t.test("CSV-Exporte: Tagesreihe + Investor-KPI-Zeilen", async () => {
      const csv = await (await fetch(base + "/api/stats.csv?token=" + TOKEN)).text();
      assert.ok(csv.startsWith("day,dau,sessions\n"), "Kopfzeile der Tagesreihe");
      assert.ok(csv.includes(TODAY + ",1,1"), "heutige Zeile: 1 Person, 1 Sitzung");
      const kpis = await (await fetch(base + "/api/kpis.csv?token=" + TOKEN)).text();
      assert.ok(kpis.startsWith("kpi,wert\n"));
      assert.ok(kpis.includes("North Star WAL,1"), "itA hat eine Runde abgeschlossen");
      assert.ok(kpis.includes("PWA-Install-Akzeptanz %,n/a"), "ohne Prompts ehrliches n/a");
    });

    await t.test("404 für unbekannte Routen", async () => {
      assert.equal((await fetch(base + "/gibtsnicht?token=" + TOKEN)).status, 404);
    });
  } finally {
    child.kill();
    try { fs.rmSync(dataDir, { recursive: true, force: true }); } catch (e) { /* egal */ }
  }
});
