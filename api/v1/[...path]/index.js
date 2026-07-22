/*
 * api/v1/[...path]/index.js – EIN Vercel-Function-Einstiegspunkt für alle /v1/*-Routen.
 *
 * Grund: Vercel Hobby erlaubt max. 12 Serverless Functions; als jede Datei unter
 * api/v1/** noch ihre eigene Route war, kam die App allein damit auf 19 Functions
 * (+ 1 Cron = 20). Die einzelnen Handler liegen jetzt unverändert unter api/_v1/**
 * (Unterstrich-Präfix -> Vercel deployt sie NICHT als eigene Functions, siehe
 * https://vercel.com/docs/functions/functions-api-reference#excluding-files-and-folders)
 * und werden hier per Pfad-Tabelle dispatcht. Jeder Handler exportiert weiterhin
 * dieselbe `async (req, res) => {…}`-Funktion wie vorher, inkl. eigener
 * Methoden-/Auth-Prüfung – nur der Aufrufweg ist neu, kein Verhalten geändert.
 *
 * WICHTIG: Als Dateiname api/v1/[...path].js registrierte Vercel den Catch-all
 * nachweislich nur für GENAU EIN Pfadsegment hinter /v1/ (production-verifiziert:
 * /v1/events funktionierte, /v1/auth/start & alle tieferen Pfade lieferten
 * Vercels eigenes Platform-404, die Function wurde nie aufgerufen). Als ORDNER
 * mit index.js darin greift der Catch-all zuverlässig für beliebige Tiefe.
 *
 * req.query.path ist das Segment-Array HINTER /v1/ (von Vercels Catch-all-Routing
 * gefüllt). Dynamische IDs (früher [id]-Ordner) werden hier manuell wieder in
 * req.query.id gespiegelt, exakt wie die Handler es bisher von Vercel bekamen.
 */
"use strict";
const { send } = require("../../_http");

const accountIndex = require("../../_v1/account/index");
const accountExport = require("../../_v1/account/export");
const assignmentsIndex = require("../../_v1/assignments/index");
const assignmentsState = require("../../_v1/assignments/id/state");
const authStart = require("../../_v1/auth/start");
const authConfirm = require("../../_v1/auth/confirm");
const authLogout = require("../../_v1/auth/logout");
const classesIndex = require("../../_v1/classes/index");
const classesJoin = require("../../_v1/classes/id/join");
const classesRoster = require("../../_v1/classes/id/roster");
const classesAssignments = require("../../_v1/classes/id/assignments");
const events = require("../../_v1/events");
const friendsIndex = require("../../_v1/friends/index");
const friendsId = require("../../_v1/friends/id");
const leaderboard = require("../../_v1/leaderboard");
const meCode = require("../../_v1/me/code");
const socialSnapshot = require("../../_v1/social/snapshot");
const sync = require("../../_v1/sync");
const usage = require("../../_v1/usage");

module.exports = async (req, res) => {
  const segs = Array.isArray(req.query && req.query.path) ? req.query.path : [];
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
