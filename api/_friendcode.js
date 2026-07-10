/*
 * api/_friendcode.js – teilbarer Freundes-Code (HRF1.…), identisches Format wie
 * social.makeFriendCode/parseFriendCode und tools/mock-sync-server.js, damit der
 * echte Server end-to-end mit dem Client zusammenspielt.
 */
"use strict";

function makeFriendCode(id) {
  return "HRF1." + Buffer.from(JSON.stringify({ app: "holaruta-friend", v: 1, id: String(id) })).toString("base64");
}

function parseFriendCode(code) {
  let s = String(code || "").trim();
  if (s.indexOf("HRF1.") === 0) s = s.slice(5);
  try {
    const obj = JSON.parse(Buffer.from(s, "base64").toString("utf8"));
    return obj && obj.app === "holaruta-friend" && obj.id ? String(obj.id) : null;
  } catch (e) {
    return null;
  }
}

module.exports = { makeFriendCode, parseFriendCode };
