/* DELETE /v1/friends/:id -> { removed }  (beidseitig lösen). */
"use strict";
const { send } = require("../../_http");
const { resolveUser } = require("../../_auth");
const { service } = require("../../_supabase");

module.exports = async (req, res) => {
  if (req.method !== "DELETE") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const other = String((req.query && req.query.id) || "");
  if (!other) return send(res, 400, { error: "missing id" });
  const db = service();
  await db.from("friendship").delete().eq("user_id", userId).eq("friend_id", other);
  await db.from("friendship").delete().eq("user_id", other).eq("friend_id", userId);
  return send(res, 200, { removed: other });
};
