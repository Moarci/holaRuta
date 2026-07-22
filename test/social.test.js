/*
 * social.test.js – Tests für den REINEN Kern der optionalen Sozial-/Wettbewerbs-
 * Schicht (social.js): Snapshot bauen, Tages-Rangliste sortieren/markieren,
 * Freundes-Code kodieren/parsen. Kein Server, kein fetch – genau der Teil, der
 * laut BACKEND.md §16 zuerst gebaut & getestet wird, sodass nur der Server fehlt.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// btoa/atob in Node bereitstellen (social.js nutzt sie wie store.js im Browser).
globalThis.window = globalThis.window || {};
globalThis.btoa = globalThis.btoa || ((s) => Buffer.from(s, "binary").toString("base64"));
globalThis.atob = globalThis.atob || ((b) => Buffer.from(b, "base64").toString("binary"));
require(path.join(__dirname, "..", "social.js"));
const { social } = globalThis.window.SC;

test("buildSnapshot: liest Karten HEUTE aus dailyCounts + minimale Felder", () => {
  const gamestats = {
    dailyCounts: { "2026-06-18": 23, "2026-06-17": 9 },
    dailyStreak: 5,
    reviews: 412,
    // Felder, die NICHT im Snapshot landen sollen (Datenminimierung):
    longestStreak: 9, placement: { level: "B1" },
  };
  const snap = social.buildSnapshot(gamestats, { day: "2026-06-18", name: "Marcel" });
  assert.deepEqual(snap, { day: "2026-06-18", name: "Marcel", cards: 23, streak: 5, reviews: 412 });
  // Anderer Tag -> anderer Zähler.
  assert.equal(social.buildSnapshot(gamestats, { day: "2026-06-17" }).cards, 9);
  // Fehlender Tag -> 0 (kein Crash).
  assert.equal(social.buildSnapshot(gamestats, { day: "2099-01-01" }).cards, 0);
});

test("buildSnapshot: leere/kaputte Eingaben ergeben Null-Snapshot", () => {
  const snap = social.buildSnapshot(null, { day: "2026-06-18" });
  assert.deepEqual(snap, { day: "2026-06-18", name: "", cards: 0, streak: 0, reviews: 0 });
});

test("buildSnapshot: Name wird auf 40 Zeichen gedeckelt", () => {
  const snap = social.buildSnapshot({}, { day: "2026-06-18", name: "x".repeat(80) });
  assert.equal(snap.name.length, 40);
});

test("buildLeaderboard: sortiert nach Karten desc, dann Streak/Reviews/Name", () => {
  const entries = [
    { id: "a", name: "Ana", cards: 10, streak: 2, reviews: 100, day: "2026-06-18" },
    { id: "b", name: "Beto", cards: 25, streak: 1, reviews: 50, day: "2026-06-18" },
    { id: "c", name: "Cris", cards: 10, streak: 7, reviews: 80, day: "2026-06-18" },
  ];
  const board = social.buildLeaderboard(entries, { meId: "a", day: "2026-06-18" });
  assert.deepEqual(board.entries.map((e) => e.name), ["Beto", "Cris", "Ana"], "mehr Karten zuerst; bei Gleichstand höherer Streak");
  assert.equal(board.entries[0].pos, 1);
  assert.equal(board.me && board.me.name, "Ana", "eigener Eintrag markiert");
  assert.equal(board.entries[2].me, true);
});

test("buildLeaderboard: geteilter Wettbewerbsrang bei Gleichstand (1224)", () => {
  const entries = [
    { id: "a", name: "Ana", cards: 30, streak: 5, reviews: 5, day: "d" },
    { id: "b", name: "Beto", cards: 20, streak: 5, reviews: 5, day: "d" },
    { id: "c", name: "Cris", cards: 20, streak: 5, reviews: 5, day: "d" },
    { id: "d", name: "Dani", cards: 10, streak: 5, reviews: 5, day: "d" },
  ];
  const board = social.buildLeaderboard(entries, { day: "d" });
  assert.deepEqual(board.entries.map((e) => e.rank), [1, 2, 2, 4], "Gleichstand teilt Rang, danach Lücke");
  assert.deepEqual(board.entries.map((e) => e.pos), [1, 2, 3, 4], "Listenposition bleibt fortlaufend");
});

test("buildLeaderboard: filtert auf den gewünschten Tag", () => {
  const entries = [
    { id: "a", name: "Ana", cards: 5, day: "2026-06-18" },
    { id: "b", name: "Beto", cards: 9, day: "2026-06-17" },
  ];
  const board = social.buildLeaderboard(entries, { day: "2026-06-18" });
  assert.equal(board.entries.length, 1);
  assert.equal(board.entries[0].name, "Ana");
});

test("buildLeaderboard: deterministisch (gleiche Reihenfolge egal wie der Server liefert)", () => {
  const a = [
    { id: "a", name: "Ana", cards: 10, streak: 1, reviews: 1, day: "d" },
    { id: "b", name: "Beto", cards: 10, streak: 1, reviews: 1, day: "d" },
  ];
  const b = [a[1], a[0]];
  assert.deepEqual(
    social.buildLeaderboard(a, { day: "d" }).entries.map((e) => e.id),
    social.buildLeaderboard(b, { day: "d" }).entries.map((e) => e.id),
    "bei totalem Gleichstand entscheidet der Name -> stabile Reihenfolge"
  );
});

test("buildLeaderboard: id entscheidet bei identischem Namen+Stats (geräteübergreifend stabil)", () => {
  // Zwei verschiedene Nutzer mit GLEICHEM Anzeigenamen und gleichen Werten:
  // ohne id-Tiebreaker hinge die Reihenfolge an der Server-/Set-Reihenfolge.
  const x = [
    { id: "u2", name: "Ana", cards: 10, streak: 1, reviews: 1, day: "d" },
    { id: "u1", name: "Ana", cards: 10, streak: 1, reviews: 1, day: "d" },
  ];
  const y = [x[1], x[0]];
  const ids = (arr) => social.buildLeaderboard(arr, { day: "d" }).entries.map((e) => e.id);
  assert.deepEqual(ids(x), ["u1", "u2"], "id bricht den Gleichstand deterministisch");
  assert.deepEqual(ids(x), ids(y), "Reihenfolge unabhängig von der Eingabe-Reihenfolge");
});

test("buildLeaderboard: leere/kaputte Eingabe -> leere Liste, kein Crash", () => {
  assert.deepEqual(social.buildLeaderboard(null, null).entries, []);
  assert.deepEqual(social.buildLeaderboard("x", {}).entries, []);
});

test("makeFriendCode/parseFriendCode: Round-Trip mit Tag-Validierung", () => {
  const code = social.makeFriendCode("user-123");
  assert.ok(code.indexOf("HRF1.") === 0, "trägt das HRF1.-Tag");
  assert.deepEqual(social.parseFriendCode(code), { id: "user-123" });
  // Mit Leerzeichen drumherum (aus Copy&Paste) bleibt parsbar.
  assert.deepEqual(social.parseFriendCode("  " + code + "  "), { id: "user-123" });
});

test("parseFriendCode: lehnt Fremd-/Müll-Codes ab", () => {
  assert.equal(social.parseFriendCode(""), null);
  assert.equal(social.parseFriendCode("HRT1.abc"), null, "Aufgaben-Code ist kein Freundes-Code");
  assert.equal(social.parseFriendCode("HRF1.@@@"), null, "kaputtes base64");
  assert.equal(social.parseFriendCode(42), null);
});

test("makeFriendCode: leere id -> leerer Code", () => {
  assert.equal(social.makeFriendCode(""), "");
  assert.equal(social.makeFriendCode(null), "");
});

test("dayKey: lokales YYYY-MM-DD (zweistellig)", () => {
  const k = social.dayKey(new Date(2026, 0, 5, 12, 0, 0).getTime()); // 5. Jan
  assert.equal(k, "2026-01-05");
});

/*
 * Einladungslink (?amigo=…): der Freundes-Code ist base64 und enthält regelmäßig
 * "+" und "/". In einer Query decodiert URLSearchParams ein rohes "+" als
 * LEERZEICHEN – der Code wäre kaputt. Deshalb MUSS die App beim Bauen des Links
 * encodeURIComponent nutzen. Dieser Test hält genau das fest (app.js baut den
 * Link identisch in socialInviteUrl()).
 */
test("Einladungslink: Round-Trip Code -> ?amigo= -> parseFriendCode", () => {
  // Echte Konto-Ids (UUID) und Grenzfälle mit Zeichen, die eine Query zerlegen
  // würden, wenn nicht kodiert wird.
  const ids = ["user-123", "3f1b2c44-9a0e-4b77-8c31-0d5e6f7a8b90", "a?b&c=d", "ÿÿÿ-ø-плюс"];
  for (const id of ids) {
    const code = social.makeFriendCode(id);
    const url = "https://holaruta.com/?amigo=" + encodeURIComponent(code);
    const back = new URLSearchParams(new URL(url).search).get("amigo");
    assert.equal(back, code, "Code übersteht den Query-Roundtrip unverändert");
    assert.deepEqual(social.parseFriendCode(back), { id: id });
  }
});

test("Einladungslink: rohes (nicht kodiertes) Anhängen wäre kaputt", () => {
  // Negativprobe: base64 darf "+" enthalten, und ein rohes "+" in der Query
  // decodiert URLSearchParams als LEERZEICHEN. Deshalb ist encodeURIComponent
  // in socialInviteUrl() Pflicht, nicht Kosmetik.
  const code = "HRF1.ab+cd/ef=";
  const naive = new URLSearchParams(new URL("https://holaruta.com/?amigo=" + code).search).get("amigo");
  assert.notEqual(naive, code, "ohne encodeURIComponent wird '+' zum Leerzeichen");
  const safe = new URLSearchParams(new URL("https://holaruta.com/?amigo=" + encodeURIComponent(code)).search).get("amigo");
  assert.equal(safe, code);
});
