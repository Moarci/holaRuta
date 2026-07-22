/* PUT /v1/social/snapshot { snapshot:{day,name,cards,streak,reviews} } -> { ok }. */
"use strict";
const { send, readJson } = require("../../_http");
const { resolveUser } = require("../../_auth");
const { allow } = require("../../_ratelimit");
const { service } = require("../../_supabase");

const clampInt = (v) => Math.max(0, Math.min(1e9, Math.round(Number(v) || 0)));

module.exports = async (req, res) => {
  if (req.method !== "PUT") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  if (!(await allow("snap:" + userId, 60, 60))) return send(res, 429, { error: "rate limited" });

  const body = await readJson(req);
  const s = body && body.snapshot;
  if (!s || typeof s !== "object") return send(res, 400, { error: "bad snapshot" });
  const day = String(s.day || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return send(res, 400, { error: "bad day" });

  await service().from("daily_snapshot").upsert(
    {
      user_id: userId,
      day,
      name: String(s.name || "").slice(0, 40),
      cards: clampInt(s.cards),
      streak: clampInt(s.streak),
      reviews: clampInt(s.reviews),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,day" }
  );
  return send(res, 200, { ok: true });
};
