/* POST /v1/auth/logout -> { ok:true }  (aktuellen Session-Token widerrufen). */
"use strict";
const { send } = require("../../_http");
const { revoke } = require("../../_auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
  await revoke(req);
  return send(res, 200, { ok: true });
};
