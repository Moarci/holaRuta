/*
 * api/v1.js – EIN Vercel-Function-Einstiegspunkt für alle /v1/*-Routen.
 *
 * Grund: Vercel Hobby erlaubt max. 12 Serverless Functions; als jede Datei unter
 * api/v1/** noch ihre eigene Route war, kam die App allein damit auf 19 Functions
 * (+ 1 Cron = 20). Die einzelnen Handler liegen jetzt unverändert unter api/_v1/**
 * (Unterstrich-Präfix -> Vercel deployt sie NICHT als eigene Functions, siehe
 * https://vercel.com/docs/functions/functions-api-reference#excluding-files-and-folders)
 * und werden hier per Pfad-Tabelle dispatcht.
 *
 * WICHTIG: Ein Bracket-Dateiname (api/v1/[...path].js ODER als Ordner
 * api/v1/[...path]/index.js) wurde production-verifiziert NICHT als echter
 * Mehrsegment-Catch-all behandelt - das ist eine Next.js-Funktion, keine
 * generische Vercel-Serverless-Function-Konvention (siehe vercel.com/docs/
 * routing/rewrites: "Wildcard path forwarding" - Vercel selbst dokumentiert
 * Mehrsegment-Weiterleitung nur über einen Rewrite, der den Pfad in einen
 * QUERY-PARAMETER schreibt, NICHT über einen dynamischen Dateinamen).
 * Deshalb ist diese Datei bewusst ein GEWÖHNLICHER, statischer Dateiname ohne
 * jede Bracket-Syntax. vercel.json rewrited /v1/:path* -> /api/v1?path=:path*;
 * der komplette Rest-Pfad kommt hier als EIN String in req.query.path an
 * (von Vercel mit "/" wieder zusammengesetzt) und wird unten selbst gesplittet.
 *
 * Dynamische IDs (früher [id]-Ordner) werden manuell in req.query.id gespiegelt,
 * exakt wie die Handler es bisher von Vercel bekamen.
 */
"use strict";
const { send } = require("./_http");

const accountIndex = require("./_v1/account/index");
const accountExport = require("./_v1/account/export");
const assignmentsIndex = require("./_v1/assignments/index");
const assignmentsState = require("./_v1/assignments/id/state");
const authStart = require("./_v1/auth/start");
const authConfirm = require("./_v1/auth/confirm");
const authLogout = require("./_v1/auth/logout");
const classesIndex = require("./_v1/classes/index");
const classesJoin = require("./_v1/classes/id/join");
const classesRoster = require("./_v1/classes/id/roster");
const classesAssignments = require("./_v1/classes/id/assignments");
const events = require("./_v1/events");
const friendsIndex = require("./_v1/friends/index");
const friendsId = require("./_v1/friends/id");
const leaderboard = require("./_v1/leaderboard");
const meCode = require("./_v1/me/code");
const socialSnapshot = require("./_v1/social/snapshot");
const sync = require("./_v1/sync");
const usage = require("./_v1/usage");

module.exports = async (req, res) => {
  const raw = (req.query && req.query.path) || "";
  const segs = String(Array.isArray(raw) ? raw.join("/") : raw)
    .split("/")
    .filter(Boolean);
  const [a, b, c] = segs;

  if (segs.length === 1) {
    if (a === "events") return events(req, res);
    if (a === "leaderboard") return leaderboard(req, res);
    if (a === "sync") return sync(req, res);
    if (a === "usage") return usage(req, res);
    if (a === "account") return accountIndex(req, res);
    if (a === "assignments") return assignmentsIndex(req, res);
    if (a === "classes") return classesIndex(req, res);
    if (a === "friends") return friendsIndex(req, res);
  }

  if (segs.length === 2) {
    if (a === "account" && b === "export") return accountExport(req, res);
    if (a === "auth" && b === "start") return authStart(req, res);
    if (a === "auth" && b === "confirm") return authConfirm(req, res);
    if (a === "auth" && b === "logout") return authLogout(req, res);
    if (a === "me" && b === "code") return meCode(req, res);
    if (a === "social" && b === "snapshot") return socialSnapshot(req, res);
    if (a === "friends") { req.query.id = b; return friendsId(req, res); }
  }

  if (segs.length === 3) {
    if (a === "assignments" && c === "state") { req.query.id = b; return assignmentsState(req, res); }
    if (a === "classes" && c === "join") { req.query.id = b; return classesJoin(req, res); }
    if (a === "classes" && c === "roster") { req.query.id = b; return classesRoster(req, res); }
    if (a === "classes" && c === "assignments") { req.query.id = b; return classesAssignments(req, res); }
  }

  return send(res, 404, { error: "not found" });
};
