/* GET /v1/me/code -> { code }  (eigener teilbarer Freundes-Code). */
"use strict";
const { send } = require("../../_http");
const { resolveUser } = require("../../_auth");
const { makeFriendCode } = require("../../_friendcode");

module.exports = async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  return send(res, 200, { code: makeFriendCode(userId) });
};
