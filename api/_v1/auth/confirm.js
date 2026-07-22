/* POST /v1/auth/confirm { email, token } -> { accessToken, account }. */
"use strict";
const { send, readJson } = require("../../_http");
const { allow, clientIp } = require("../../_ratelimit");
const { confirm } = require("../../_auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
  if (!(await allow("authc:" + clientIp(req), 20, 600))) return send(res, 429, { error: "rate limited" });
  const body = await readJson(req);
  const email = body && String(body.email || "").trim();
  const token = body && String(body.token || "").trim();
  if (!email || !token) return send(res, 400, { error: "missing email or token" });
  try {
    return send(res, 200, await confirm(email, token));
  } catch (e) {
    return send(res, 401, { error: "invalid code" });
  }
};
