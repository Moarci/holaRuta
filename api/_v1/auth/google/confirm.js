/* POST /v1/auth/google/confirm { supabaseToken } -> { accessToken, account }.
 *
 * Die Callback-Seite (auth-callback.html) liest das aus dem Implicit-Redirect
 * stammende Supabase-Access-Token aus dem URL-Fragment und schickt es hierher.
 * googleConfirm() validiert es (getUser), upsertet das profile und mintet unseren
 * eigenen Opaque-Session-Token – exakt wie der E-Mail-OTP-Weg.
 */
"use strict";
const { send, readJson } = require("../../../_http");
const { allow, clientIp } = require("../../../_ratelimit");
const { googleConfirm } = require("../../../_auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
  if (!(await allow("authgc:" + clientIp(req), 20, 600))) return send(res, 429, { error: "rate limited" });
  const body = await readJson(req);
  const token = body && String(body.supabaseToken || "").trim();
  if (!token) return send(res, 400, { error: "missing token" });
  try {
    return send(res, 200, await googleConfirm(token));
  } catch (e) {
    return send(res, 401, { error: "invalid token" });
  }
};
