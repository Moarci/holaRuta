/*
 * sync-tasks.test.js – R2: `tasks` müssen über Geräte konvergieren (Union per code),
 * nicht mehr per deepUnion „local wins" verloren gehen.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "sync.js"));
const { sync } = globalThis.window.SC;

const TASKS = "spanischcard.tasks.v1";

test("mergeTasks: Union per code, reihenfolgeunabhängig", () => {
  const a = [{ code: "T1", kind: "preset", scope: "basics" }];
  const b = [{ code: "T2", kind: "pretrip", scope: "colombia" }];
  const m = sync.mergeTasks(a, b);
  const codes = m.map((t) => t.code).sort();
  assert.deepEqual(codes, ["T1", "T2"]);
  // Kollision: inhaltsreichere Variante gewinnt, deterministisch.
  const richer = sync.mergeTasks(
    [{ code: "T1", scope: "basics" }],
    [{ code: "T1", scope: "basics", title: "Mehr Inhalt hier" }]
  );
  assert.equal(richer.length, 1);
  assert.equal(richer[0].title, "Mehr Inhalt hier");
});

test("mergeData: tasks konvergieren (früher: deepUnion local-wins -> Verlust)", () => {
  const local = { data: { [TASKS]: [{ code: "T1", scope: "a" }] } };
  const remote = { data: { [TASKS]: [{ code: "T2", scope: "b" }] } };
  const merged = sync.merge(local, remote);
  const codes = (merged.data[TASKS] || []).map((t) => t.code).sort();
  assert.deepEqual(codes, ["T1", "T2"], "beide Aufgaben bleiben erhalten");
});
