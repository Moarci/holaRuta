/*
 * tools/mock-sync-server.js — REFERENZ-/DEMO-Mock des HolaRuta-Sync-Backends.
 *
 * Zweck: das optionale Stufe-3-Cloud-Sync (BACKEND.md, Phase 1/2) lokal und
 * end-to-end demonstrieren – z. B. für eine ECOS-/WeRoad-Edition. KEIN
 * Produktionscode: alles im RAM, kein echtes Auth, keine Persistenz, keine
 * Sicherheit. Genau das, was eine reale API (BACKEND.md §6) ersetzen würde.
 *
 * Zero-Dependency: nur Node-Builtins (http). Starten:
 *   node tools/mock-sync-server.js            # Port 8788
 *   PORT=9000 node tools/mock-sync-server.js
 *
 * Dann in einer Edition (z. B. editions/ecos.js) setzen:
 *   sync: { enabled: true, apiBase: "http://localhost:8788", orgLabel: "ECOS" }
 * und mit  `node build.js --edition=ecos`  bauen + öffnen.
 */
"use strict";
const http = require("http");

const PORT = Number(process.env.PORT) || 8788;
// In-RAM: token -> userId, userId -> { rev, payload }
const tokens = new Map();
const states = new Map();
// Sozial-Schicht (BACKEND.md §16): userId -> Set(friendIds), userId -> Snapshot.
const friendships = new Map(); // userId -> Set<userId>
const snapshots = new Map();   // userId -> { day, name, cards, streak, reviews }

// Freundes-Code (HRF1.) – identisches Format wie social.makeFriendCode/parseFriendCode,
// damit der Mock end-to-end mit dem Client zusammenspielt.
function makeFriendCode(id) {
  return "HRF1." + Buffer.from(JSON.stringify({ app: "holaruta-friend", v: 1, id: String(id) })).toString("base64");
}
function parseFriendCode(code) {
  let s = String(code || "").trim();
  if (s.indexOf("HRF1.") === 0) s = s.slice(5);
  try {
    const obj = JSON.parse(Buffer.from(s, "base64").toString("utf8"));
    return obj && obj.app === "holaruta-friend" && obj.id ? String(obj.id) : null;
  } catch (e) { return null; }
}
function friendSet(user) {
  if (!friendships.has(user)) friendships.set(user, new Set());
  return friendships.get(user);
}

function send(res, status, body) {
  const json = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { resolve(null); } });
  });
}

function userOf(req) {
  const auth = req.headers.authorization || "";
  const tok = auth.indexOf("Bearer ") === 0 ? auth.slice(7) : "";
  return tokens.get(tok) || null;
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || "").split("?")[0];
  if (req.method === "OPTIONS") return send(res, 204);

  // Passwortloser Login – im Mock direkt ein devToken (BACKEND.md §7, Demo-Kurzschluss).
  if (req.method === "POST" && url === "/v1/auth/start") {
    const body = await readBody(req);
    const email = (body && String(body.email || "").trim()) || "demo@holaruta";
    const token = "dev-" + Buffer.from(email).toString("base64").replace(/=/g, "");
    tokens.set(token, email);
    if (!states.has(email)) states.set(email, { rev: 0, payload: {} });
    return send(res, 200, { devToken: token, account: { email } });
  }
  if (req.method === "POST" && url === "/v1/auth/confirm") {
    const body = await readBody(req);
    const email = (body && String(body.email || "").trim()) || "demo@holaruta";
    const token = "acc-" + Buffer.from(email).toString("base64").replace(/=/g, "");
    tokens.set(token, email);
    if (!states.has(email)) states.set(email, { rev: 0, payload: {} });
    return send(res, 200, { accessToken: token, account: { email } });
  }

  const user = userOf(req);

  if (url === "/v1/sync") {
    if (!user) return send(res, 401, { error: "unauthorized" });
    const st = states.get(user) || { rev: 0, payload: {} };
    if (req.method === "GET") return send(res, 200, { rev: st.rev, payload: st.payload });
    if (req.method === "PUT") {
      const body = await readBody(req);
      if (!body || typeof body.payload !== "object") return send(res, 400, { error: "bad payload" });
      // Optimistic concurrency: bei veralteter baseRev 409 mit aktuellem Stand.
      if (typeof body.baseRev === "number" && body.baseRev < st.rev) {
        return send(res, 409, { rev: st.rev, payload: st.payload });
      }
      const next = { rev: st.rev + 1, payload: body.payload };
      states.set(user, next);
      return send(res, 200, { rev: next.rev });
    }
  }

  // ----- Sozial-Schicht (Freunde + Tages-Rangliste, BACKEND.md §16) -----
  if (url === "/v1/me/code" && req.method === "GET") {
    if (!user) return send(res, 401, { error: "unauthorized" });
    return send(res, 200, { code: makeFriendCode(user) });
  }
  if (url === "/v1/friends") {
    if (!user) return send(res, 401, { error: "unauthorized" });
    if (req.method === "GET") {
      const list = [...friendSet(user)].map((id) => ({ id, name: (snapshots.get(id) || {}).name || id }));
      return send(res, 200, { friends: list });
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      const other = parseFriendCode(body && body.code);
      if (!other) return send(res, 400, { error: "bad code" });
      if (other === user) return send(res, 400, { error: "self" });
      friendSet(user).add(other);
      friendSet(other).add(user); // im Mock beidseitig (Demo)
      return send(res, 200, { added: other });
    }
    return send(res, 405, { error: "method not allowed" });
  }
  if (url.indexOf("/v1/friends/") === 0 && req.method === "DELETE") {
    if (!user) return send(res, 401, { error: "unauthorized" });
    const other = decodeURIComponent(url.slice("/v1/friends/".length));
    if (!other) return send(res, 400, { error: "missing id" });
    friendSet(user).delete(other);
    if (friendships.has(other)) friendships.get(other).delete(user); // keinen Leer-Eintrag anlegen
    return send(res, 200, { removed: other });
  }
  if (url === "/v1/social/snapshot" && req.method === "PUT") {
    if (!user) return send(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    const s = body && body.snapshot;
    if (!s || typeof s !== "object") return send(res, 400, { error: "bad snapshot" });
    snapshots.set(user, { day: String(s.day || ""), name: String(s.name || ""), cards: Number(s.cards) || 0, streak: Number(s.streak) || 0, reviews: Number(s.reviews) || 0 });
    return send(res, 200, { ok: true });
  }
  if (url === "/v1/leaderboard" && req.method === "GET") {
    if (!user) return send(res, 401, { error: "unauthorized" });
    const q = req.url.indexOf("?") >= 0 ? req.url.slice(req.url.indexOf("?") + 1) : "";
    const day = new URLSearchParams(q).get("day") || ""; // robust: Reihenfolge/Encoding egal
    const ids = new Set([user, ...friendSet(user)]);
    const entries = [];
    for (const id of ids) {
      const s = snapshots.get(id);
      if (!s) continue;
      if (day && s.day !== day) continue;
      entries.push({ id, name: s.name || id, cards: s.cards, streak: s.streak, reviews: s.reviews, day: s.day });
    }
    return send(res, 200, { meId: user, entries });
  }

  if (url === "/v1/account/export" && req.method === "GET") {
    if (!user) return send(res, 401, { error: "unauthorized" });
    return send(res, 200, { account: { email: user }, sync: states.get(user) || null });
  }
  if (url === "/v1/account" && req.method === "DELETE") {
    if (!user) return send(res, 401, { error: "unauthorized" });
    states.delete(user);
    snapshots.delete(user);
    friendSet(user).forEach((other) => friendSet(other).delete(user));
    friendships.delete(user);
    for (const [t, u] of tokens) if (u === user) tokens.delete(t);
    return send(res, 200, { deleted: true });
  }

  return send(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log("HolaRuta MOCK sync server (RAM-only, kein Produktionscode) auf http://localhost:" + PORT);
  console.log("Endpoints: POST /v1/auth/start|confirm · GET/PUT /v1/sync · GET /v1/account/export · DELETE /v1/account");
  console.log("Sozial:    GET /v1/me/code · GET/POST /v1/friends · DELETE /v1/friends/:id · PUT /v1/social/snapshot · GET /v1/leaderboard");
});
