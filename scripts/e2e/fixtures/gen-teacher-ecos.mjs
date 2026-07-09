/*
 * scripts/e2e/fixtures/gen-teacher-ecos.mjs — EINMALIGER Generator für die
 * Modo-Profe-E2E-Fixture. Erntet echte Card-IDs aus data.js (nur HIER erlaubt,
 * bewusst außerhalb des Blackbox-Testlaufs) und materialisiert 7 Schüler-Backups
 * nach seed-teacher-ecos.json. Die Suite p1-modo-profe.mjs lädt danach nur noch
 * das JSON — der Testlauf bleibt blackbox-rein.
 *
 *   node scripts/e2e/fixtures/gen-teacher-ecos.mjs
 *
 * Nur neu ausführen, wenn sich das Kartenkorpus so ändert, dass die Fixture
 * veraltet (die IDs müssen weiterhin existieren, sonst assertiert die Suite falsch).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const OUT = path.join(HERE, "seed-teacher-ecos.json");

// Feste Zeitstempel: die Fixture muss reproduzierbar sein (kein Date.now()).
const EXPORTED_AT = "2026-01-01T00:00:00.000Z";

function harvestCards() {
  globalThis.window = {};
  require(path.join(ROOT, "contextdata.js"));
  require(path.join(ROOT, "data.js"));
  require(path.join(ROOT, "numbers.js"));
  require(path.join(ROOT, "context.js"));
  return globalThis.window.SC.data.CARDS;
}

function build() {
  const CARDS = harvestCards();
  const byCat = {};
  CARDS.forEach((c) => { (byCat[c.cat] = byCat[c.cat] || []).push(c.id); });
  const smallCat = Object.keys(byCat).sort((a, b) => byCat[a].length - byCat[b].length)[0];
  const REC = { seen: 5, reps: 4, interval: 14, ease: 2.5, good: 4, again: 0, firstRating: "good" };
  const progress = (n, fullCat) => {
    const p = {};
    if (fullCat) byCat[fullCat].forEach((id) => { p[id] = Object.assign({}, REC); });
    for (let i = 0; Object.keys(p).length < n && i < CARDS.length; i++) p[CARDS[i].id] = Object.assign({}, REC);
    return p;
  };
  const pre = (d) => ({ Cartagena: Object.fromEntries(Array.from({ length: d }, (_, i) => [i + 1, true])) });
  const ch = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => ["c" + i, true]));
  const mk = (gs, n, full) => ({
    app: "holaruta", format: 1, exportedAt: EXPORTED_AT,
    data: { "spanischcard.progress.v2": progress(n, full ? smallCat : null), "spanischcard.gamestats.v1": gs },
  });
  // Akzentuierte Namen bewusst dabei (realistischer Schul-/Latam-Kontext).
  const defs = [
    ["Ana López",    { dailyStreak: 6, longestStreak: 9,  challengesDone: ch(4), pretripDays: pre(3), assessment: { level: "B2", finalScore: 0.78 } }, 80],
    ["Bruno Díaz",   { dailyStreak: 2, longestStreak: 4,  challengesDone: ch(1), pretripDays: pre(1), assessment: { level: "A2", finalScore: 0.50 } }, 25],
    ["Carla Méndez", { dailyStreak: 3, longestStreak: 5,  challengesDone: ch(2), pretripDays: pre(2), placement: { level: "B1-", finalScore: 0.62 } }, 40],
    ["Diego Ramos",  { dailyStreak: 0, longestStreak: 1,  challengesDone: ch(0), pretripDays: pre(0), placement: { level: "A1", finalScore: 0.32 } }, 8],
    ["Elena Soto",   { dailyStreak: 12, longestStreak: 18, challengesDone: ch(9), pretripDays: pre(5), assessment: { level: "C1", finalScore: 0.91 } }, 140, true],
    ["Frank Weber",  { dailyStreak: 1, longestStreak: 2,  challengesDone: ch(0), pretripDays: pre(0) }, 3],
    ["Gina Torres",  { dailyStreak: 4, longestStreak: 4,  challengesDone: ch(3), pretripDays: pre(2), placement: { level: "A2", finalScore: 0.45 } }, 18],
  ];
  // Als serialisierbare Fixture: { name, contentBase64 } — die Suite baut daraus
  // In-Memory-Dateien für setInputFiles (mimeType application/json).
  return defs.map(([name, gs, n, full]) => ({
    name: name + ".json",
    mimeType: "application/json",
    contentBase64: Buffer.from(JSON.stringify(mk(gs, n, full))).toString("base64"),
  }));
}

const files = build();
fs.writeFileSync(OUT, JSON.stringify({ generatedFrom: "data.js", exportedAt: EXPORTED_AT, files }, null, 2) + "\n");
console.log(`seed-teacher-ecos.json geschrieben: ${files.length} Schüler-Backups → ${path.relative(ROOT, OUT)}`);
