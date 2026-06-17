/*
 * task-progress.test.js – Schützt die Datengrundlage der Aufgaben-Fortschrittsanzeige
 * („12/40 gelernt“ bzw. „3/7 Etappen“ in der Tarea-Liste).
 *
 * Hintergrund: In der Liste erscheint die Fortschrittszeile nur, wenn
 *   !done && total > 0   (siehe ui.renderTask).
 * Wird `total` für ein Preset/Pre-Trip-Ziel 0 (z. B. leeres `pick`, falsche
 * Karten-IDs oder ein Plan ohne Tage), verschwindet der Teilfortschritt
 * KOMMENTARLOS. Dieser Test bildet die reine taskProgress-Logik aus app.js
 * nach und stellt sicher, dass JEDES per Aufgabe zuweisbare Ziel ein total > 0
 * liefert und Teilfortschritt korrekt zählt.
 *
 * Reine Daten/Logik – kein Browser, kein DOM nötig.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = {};
const SRC = path.join(__dirname, "..");
require(path.join(SRC, "data.js"));
const { data } = globalThis.window.SC;

// ---- Nachbau der reinen Helfer aus app.js (1:1 zur App-Logik) ----
const PRETRIP = () => data.PRETRIP || [];
const pretripPlan = (scope) => PRETRIP().find((p) => p.scope === scope) || PRETRIP()[0] || { scope: null, days: [] };
const cardById = (id) => (data.CARDS || []).find((c) => c.id === id);

function taskCardsFor(task) {
  if (!task) return [];
  if (task.kind === "preset") {
    const p = (data.PRESETS || []).find((x) => x.id === task.scope);
    return p ? p.pick.map(cardById).filter(Boolean) : [];
  }
  if (task.kind === "category") return (data.CARDS || []).filter((c) => c.cat === task.scope);
  return [];
}

// taskProgress mit injizierbarem Zustand (gamestats/progress), damit wir
// Teilfortschritt deterministisch prüfen können.
function taskProgress(task, gamestats, progress) {
  gamestats = gamestats || { pretripDays: {} };
  progress = progress || {};
  const pretripDone = (scope, day) => !!(gamestats.pretripDays && gamestats.pretripDays[scope] && gamestats.pretripDays[scope][day]);
  if (task && task.kind === "pretrip") {
    const plan = pretripPlan(task.scope);
    const total = plan.days.length;
    const seen = plan.days.filter((d) => pretripDone(plan.scope, d.day)).length;
    return { seen, total, kind: "stages" };
  }
  const cards = taskCardsFor(task);
  const seen = cards.reduce((n, c) => n + ((progress[c.id] && progress[c.id].seen > 0) ? 1 : 0), 0);
  return { seen, total: cards.length, kind: "cards" };
}

// ---- Tests ----

test("Jedes Preset-Ziel liefert total > 0 (sonst keine Fortschrittszeile)", () => {
  for (const p of data.PRESETS) {
    const prog = taskProgress({ kind: "preset", scope: p.id });
    assert.ok(prog.total > 0, `Preset ${p.id} hat total=0 – Teilfortschritt würde verschwinden`);
    assert.equal(prog.total, p.pick.length, `Preset ${p.id}: nicht alle pick-IDs lösen auf eine Karte auf`);
  }
});

test("Jeder Pre-Trip-Plan liefert total > 0 (Etappen vorhanden)", () => {
  for (const pl of data.PRETRIP) {
    const prog = taskProgress({ kind: "pretrip", scope: pl.scope });
    assert.equal(prog.kind, "stages");
    assert.ok(prog.total > 0, `Pre-Trip ${pl.scope} hat 0 Etappen`);
    assert.equal(prog.total, pl.days.length);
  }
});

test("Teilfortschritt zählt erledigte Etappen korrekt (1 von N)", () => {
  const scope = data.PRETRIP[0].scope;
  const gamestats = { pretripDays: { [scope]: { 1: true } } };
  const prog = taskProgress({ kind: "pretrip", scope }, gamestats);
  assert.equal(prog.seen, 1, "eine erledigte Etappe muss als 1 zählen");
  assert.ok(prog.total >= 1 && prog.seen < prog.total, "1/N => Aufgabe ist offen, Zeile sichtbar");
});

test("Teilfortschritt zählt gelernte Preset-Karten korrekt (offen vs. erledigt)", () => {
  const p = data.PRESETS[0];
  // Zwei Karten als „gesehen“ markieren -> seen = 2.
  const progress = { [p.pick[0]]: { seen: 3 }, [p.pick[1]]: { seen: 1 } };
  const prog = taskProgress({ kind: "preset", scope: p.id }, null, progress);
  assert.equal(prog.seen, 2);
  assert.equal(prog.total, p.pick.length);
  assert.ok(prog.seen < prog.total, "Teil-Fortschritt => Aufgabe bleibt offen");
});

test("renderTask-Bedingung: offene Aufgabe mit Fortschritt zeigt die Zeile", () => {
  // Bildet `!done && total > 0` aus ui.renderTask nach.
  const cases = [
    { kind: "pretrip", scope: data.PRETRIP[0].scope },
    { kind: "preset", scope: data.PRESETS[0].id },
  ];
  for (const task of cases) {
    const prog = taskProgress(task);
    const done = prog.total > 0 && prog.seen >= prog.total;
    const lineVisible = !done && prog.total > 0;
    assert.ok(lineVisible, `${task.kind}/${task.scope}: Fortschrittszeile muss sichtbar sein (total=${prog.total})`);
  }
});
