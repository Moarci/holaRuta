/* POST /v1/auth/start { email } -> { pending:true }  (OTP/Magic-Link per Mail). */
"use strict";
const { send, readJson } = require("../../_http");
const { allow, clientIp } = require("../../_ratelimit");
const { start } = require("../../_auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
  if (!(await allow("auth:" + clientIp(req), 10, 600))) return send(res, 429, { error: "rate limited" });
  const body = await readJson(req);
  const email = body && String(body.email || "").trim();
  if (!email || email.indexOf("@") < 1) return send(res, 400, { error: "bad email" });
  try {
    return send(res, 200, await start(email));
  } catch (e) {
    return send(res, 502, { error: "auth start failed" });
  }
};
