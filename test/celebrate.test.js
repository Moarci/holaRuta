/*
 * test/celebrate.test.js – prüft die REINE Entscheidungs-Engine (SC.celebrate.decide)
 * und die Hilfsfunktionen. Kein DOM nötig: wir laden celebrate.js in einen
 * minimalen window-Stub (wie die übrigen SC-Modul-Tests).
 */
"use strict";
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// celebrate.js in einen Sandbox-Context mit window/navigator-Stub laden.
function loadCelebrate() {
  const code = fs.readFileSync(path.join(__dirname, "..", "celebrate.js"), "utf8");
  const sandbox = {
    window: {},
    navigator: {},
    document: undefined,
    performance: { now: () => 0 },
    requestAnimationFrame: () => {},
    setTimeout: () => {},
  };
  sandbox.window.matchMedia = undefined;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.SC.celebrate;
}

const C = loadCelebrate();

function base(over) {
  return Object.assign({
    scope: "Hotel", mode: "flash", total: 10, right: 8, wrong: 2, accuracy: 80,
    streakBefore: 4, streak: 5, streakIsNew: true, newBadges: [],
    destinationComplete: null, isFirstEver: false, seed: 1,
    xpBefore: 0, xpGained: 0, xpAfter: 0, levelBefore: 1, levelAfter: 1,
  }, over || {});
}

test("levelForXp: Grenzwerte ergeben den richtigen Rang", () => {
  assert.equal(C.levelForXp(0).key, "turista");
  assert.equal(C.levelForXp(99).key, "turista");
  assert.equal(C.levelForXp(100).key, "mochilero");
  assert.equal(C.levelForXp(699).key, "explorador");
  assert.equal(C.levelForXp(700).key, "trotamundos");
  assert.equal(C.levelForXp(99999).key, "leyenda");
  assert.equal(C.levelForXp("kaputt").key, "turista"); // robust gegen Müll
});

test("accuracyBand: Bänder schneiden korrekt", () => {
  assert.equal(C.accuracyBand(100), "perfect");
  assert.equal(C.accuracyBand(99), "great");
  assert.equal(C.accuracyBand(80), "great");
  assert.equal(C.accuracyBand(79), "good");
  assert.equal(C.accuracyBand(55), "good");
  assert.equal(C.accuracyBand(54), "practice");
  assert.equal(C.accuracyBand(0), "practice");
});

test("Priorität: Level-Up schlägt alles andere", () => {
  const s = C.decide(base({
    levelBefore: 1, levelAfter: 2, xpAfter: 300,
    newBadges: [{ id: "x", icon: "🧭", name: "Test" }],
    destinationComplete: { name: "Cartagena", country: "Colombia" },
    accuracy: 100, total: 8, streak: 7,
  }));
  assert.equal(s.id, "levelup");
  assert.equal(s.staging, "levelup");
  assert.equal(s.level.to, 2);
});

test("Priorität: Ziel-Pack schlägt Badge & Streak & Perfekt", () => {
  const s = C.decide(base({
    destinationComplete: { name: "Cusco", country: "Perú" },
    newBadges: [{ id: "x", icon: "🧭", name: "Test" }],
    accuracy: 100, total: 8, streak: 7,
  }));
  assert.equal(s.id, "destination");
  assert.equal(s.staging, "stamp");
  assert.equal(s.destination.name, "Cusco");
});

test("Priorität: neuer Badge schlägt Streak-Meilenstein & Perfekt", () => {
  const s = C.decide(base({
    newBadges: [{ id: "b1", icon: "🏅", name: "Hostel-Held" }, { id: "b2", icon: "⭐", name: "Zweiter" }],
    accuracy: 100, total: 8, streak: 7,
  }));
  assert.equal(s.id, "badge");
  assert.equal(s.staging, "badge");
  assert.equal(s.badge.id, "b1");
  assert.match(s.sub, /\+1 weitere/); // Hinweis auf weitere Stempel
});

test("Streak-Meilenstein nur auf definierten Werten", () => {
  const mile = C.decide(base({ streak: 7, streakIsNew: true, accuracy: 60, total: 10 }));
  assert.equal(mile.id, "streakMilestone");
  assert.equal(mile.milestone, 7);

  const noMile = C.decide(base({ streak: 6, streakIsNew: true, accuracy: 60, total: 10 }));
  assert.notEqual(noMile.id, "streakMilestone");
});

test("Perfekt nur ab genügend Karten", () => {
  const perfect = C.decide(base({ accuracy: 100, right: 8, wrong: 0, total: 8, streakIsNew: false }));
  assert.equal(perfect.id, "perfect");
  assert.equal(perfect.tone, "gold");

  const tooFew = C.decide(base({ accuracy: 100, right: 3, wrong: 0, total: 3, streakIsNew: false }));
  assert.notEqual(tooFew.id, "perfect"); // 3 Karten -> kein „Perfecto“-Tamtam
});

test("Mini-Spiel perfekt -> Pokal-Hero (trophy); Hauptlernen-Perfekt bleibt Ring", () => {
  // Spiel (isGame) + 100% + genug Karten -> eigener Pokal-Hero.
  const game = C.decide(base({ isGame: true, accuracy: 100, right: 8, wrong: 0, total: 8, streakIsNew: false }));
  assert.equal(game.id, "gameperfect");
  assert.equal(game.staging, "trophy");
  assert.equal(game.tone, "gold");
  // Ohne isGame bleibt es die ruhige Ring-Perfekt-Szene (Showcase-Treue).
  const study = C.decide(base({ accuracy: 100, right: 8, wrong: 0, total: 8, streakIsNew: false }));
  assert.equal(study.id, "perfect");
  assert.equal(study.staging, "ring");
  // Zu wenige Karten -> kein Pokal, auch nicht im Spiel.
  const few = C.decide(base({ isGame: true, accuracy: 100, right: 3, wrong: 0, total: 3, streakIsNew: false }));
  assert.notEqual(few.staging, "trophy");
});

test("Erste Runde gewinnt vor Comeback/Standard", () => {
  const s = C.decide(base({ isFirstEver: true, accuracy: 70, total: 8, streakIsNew: true, streakBefore: 0, streak: 1 }));
  assert.equal(s.id, "first");
});

test("Comeback: Streak war 0, jetzt Tag 1, nicht erste Runde je", () => {
  const s = C.decide(base({ isFirstEver: false, streakBefore: 0, streak: 1, streakIsNew: true, accuracy: 70, total: 8 }));
  assert.equal(s.id, "comeback");
  assert.equal(s.tone, "ok");
});

test("Standard: Ton & Konfetti folgen dem Genauigkeitsband", () => {
  const great = C.decide(base({ accuracy: 90, total: 10, streakIsNew: false, streakBefore: 5, streak: 5 }));
  assert.equal(great.id, "standard");
  assert.equal(great.tone, "ok");
  const practice = C.decide(base({ accuracy: 40, right: 4, wrong: 6, total: 10, streakIsNew: false, streakBefore: 5, streak: 5 }));
  assert.equal(practice.tone, "easy");
  assert.ok(great.confetti > practice.confetti); // mehr Konfetti bei besserer Runde
});

test("decide ist rein: gleiches Input -> gleicher Deskriptor (seedbar)", () => {
  const a = C.decide(base({ seed: 42 }));
  const b = C.decide(base({ seed: 42 }));
  assert.deepEqual(a, b);
  // anderer Seed darf andere Headline wählen (Pool > 1)
  const heads = new Set();
  for (let i = 0; i < 6; i++) heads.add(C.decide(base({ seed: i, accuracy: 70, total: 8, streakIsNew: false, streakBefore: 5, streak: 5 })).headline);
  assert.ok(heads.size > 1, "Seed variiert die Textauswahl");
});

test("Robustheit: leeres/kaputtes result crasht nicht", () => {
  assert.doesNotThrow(() => C.decide(undefined));
  assert.doesNotThrow(() => C.decide({}));
  assert.doesNotThrow(() => C.decide({ right: "x", wrong: null, accuracy: NaN, newBadges: "nope" }));
  const s = C.decide({});
  assert.ok(s.id && s.staging && s.stats);
});

test("stats-Strip-Daten: accuracy aus right/wrong abgeleitet, wenn nicht gesetzt", () => {
  const s = C.decide({ right: 9, wrong: 1, total: 10, scope: "Test" });
  assert.equal(s.stats.accuracy, 90);
});
