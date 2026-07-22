/* DELETE /v1/account -> harte Löschung (Konto + alle Daten, DSGVO Art. 17). */
"use strict";
const { send } = require("../../_http");
const { resolveUser } = require("../../_auth");
const { service } = require("../../_supabase");

module.exports = async (req, res) => {
  if (req.method !== "DELETE") return send(res, 405, { error: "method not allowed" });
  const userId = await resolveUser(req);
  if (!userId) return send(res, 401, { error: "unauthorized" });
  const db = service();

  // Freundschaften, in denen der User als friend_id auftaucht, explizit lösen
  // (die user_id-Seite hängt am profile-FK und cascadet mit).
  await db.from("friendship").delete().eq("friend_id", userId);
  // profile löschen -> ON DELETE CASCADE räumt device/session/sync_meta/progress/
  // usercards/favorites/tasks/game_stats/settings/friendship/snapshots/memberships/
  // enrollments/assignment_state/license_seat mit ab.
  await db.from("profile").delete().eq("id", userId);
  // Auth-User in Supabase entfernen (vollständige Löschung der Identität). Scheitert
  // das (PII in auth.users überlebt sonst still), einen distinkten Audit-Eintrag
  // schreiben, damit eine Reconciliation die Waise findet (DSGVO Art. 17).
  let authDeleted = true;
  try { const { error } = await db.auth.admin.deleteUser(userId); if (error) authDeleted = false; }
  catch (e) { authDeleted = false; }

  await db.from("audit_log").insert({
    actor: userId,
    action: authDeleted ? "account_delete" : "account_delete_auth_failed",
    target: userId,
  });
  return send(res, 200, { deleted: true, authDeleted });
};
