/*
 * telemetry-dashboard.test.js – Tests für die REINEN Render-Helfer des
 * Admin-Cockpits (tools/telemetry-dashboard.html, ausgeliefert als admin.html).
 *
 * Warum es diese Datei gibt: die Helfer entscheiden, ob eine Kennzahl als
 * gemessener Wert oder als „nicht messbar“ dargestellt wird. Genau dort lagen
 * die Fehler, die eine Zahl ERFANDEN (Retention 0 % statt n/a, Trichterquoten
 * über 100 %) – Fehler, die man einer Seite nicht ansieht, weil sie plausibel
 * aussehen. Jeder Fall hier hält einen davon fest.
 *
 * Ansatz: Das Dashboard ist eine Einzeldatei mit Inline-Skript. Der Teil
 * oberhalb der Marke „==== DOM-VERDRAHTUNG AB HIER ====“ ist bewusst frei von
 * document/window/fetch und wird hier ausgeschnitten und in Node ausgeführt.
 * Kein jsdom, keine Dependency – passend zum Rest des Projekts.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const HTML_PATH = path.join(__dirname, "..", "tools", "telemetry-dashboard.html");
const MARKER = "==== DOM-VERDRAHTUNG AB HIER ====";

// Inline-Skript herausschneiden und den DOM-freien Kopf in einem eigenen
// Kontext auswerten. Schlägt das fehl, ist die Marke verschwunden/umbenannt –
// dann soll der Test laut scheitern statt still nichts zu prüfen.
function loadHelpers() {
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const main = scripts.find((s) => s.includes(MARKER));
  assert.ok(main, "Inline-Skript mit der DOM-Marke nicht gefunden – Marke umbenannt?");
  const pure = main.slice(0, main.indexOf(MARKER));
  assert.ok(pure.includes("function funnelChart"), "Reiner Teil enthält die Render-Helfer nicht mehr");
  const ctx = { module: {}, exports: {} };
  vm.createContext(ctx);
  vm.runInContext(pure + "\n;({esc,fmtN,fmtDur,pct,empty,hbars,funnelChart,kpi,retEntry,retText,heatmap,editionTable,sortBuckets});", ctx);
  return vm.runInContext("({esc,fmtN,fmtDur,pct,empty,hbars,funnelChart,kpi,retEntry,retText,heatmap,editionTable,sortBuckets})", ctx);
}

const H = loadHelpers();

// --- Retention: nicht messbar vs. echt gemessene Null ------------------------
// Der Unterschied ist der ganze Punkt: `eligible === 0` heißt „im Fenster kann
// niemand so alt sein“, NICHT „0 % kamen zurück“.

test("retEntry/retText: eligible 0 ist n/a, nicht 0 %", () => {
  const u = { retention: [{ day: 7, eligible: 0, pct: 0 }] };
  assert.equal(H.retEntry(u, 7).na, true);
  assert.equal(H.retText(u, 7), "n/a");
});

test("retEntry/retText: echt gemessene 0 % bleibt 0 % (Regressionsschutz)", () => {
  const u = { retention: [{ day: 1, eligible: 42, pct: 0 }] };
  assert.equal(H.retEntry(u, 1).na, false);
  assert.equal(H.retText(u, 1), "0 %");
  assert.notEqual(H.retText(u, 1), "n/a");
});

test("retEntry: fehlender Eintrag ist ebenfalls n/a", () => {
  assert.equal(H.retText({ retention: [] }, 30), "n/a");
  assert.equal(H.retText({}, 30), "n/a");
});

// --- Trichter: Quoten dürfen nie über 100 % gehen ----------------------------
// Die Stufen kommen aus unabhängigen Event-Mengen; das Zeitfenster kann mitten
// durch eine Nutzerreise schneiden. Dann ist die Quote nicht definiert.

test("funnelChart: spätere Stufe größer als Einstieg -> n/a statt >100 %", () => {
  const html = H.funnelChart([{ label: "intro", count: 1 }, { label: "complete", count: 3 }]);
  assert.match(html, /n\/a/);
  assert.doesNotMatch(html, /300\s*%/);
  const widths = [...html.matchAll(/width:(\d+)%/g)].map((m) => Number(m[1]));
  assert.ok(Math.max(...widths) <= 100, "Balkenbreite über 100 %: " + widths.join(","));
});

test("funnelChart: leere Einstiegsstufe -> Quoten n/a, Balken am Maximum skaliert", () => {
  const html = H.funnelChart([{ label: "a", count: 0 }, { label: "b", count: 7 }, { label: "c", count: 2 }]);
  assert.match(html, /n\/a/);
  // Die Balken müssen sich noch unterscheiden – sonst tragen sie keine Information.
  const widths = [...html.matchAll(/width:(\d+)%/g)].map((m) => Number(m[1]));
  assert.equal(widths.length, 3);
  assert.ok(new Set(widths).size > 1, "alle Balken gleich breit – Balken ohne Aussage");
  assert.ok(Math.max(...widths) <= 100);
});

test("funnelChart: sauber absteigend -> echte Quoten und Drop-off", () => {
  const html = H.funnelChart([{ label: "a", count: 100 }, { label: "b", count: 40 }]);
  assert.match(html, /100 %/);
  assert.match(html, /40 %/);
  assert.match(html, /▼60 %/);
  assert.doesNotMatch(html, /n\/a/);
});

test("funnelChart: alles null -> Leer-Zustand statt Division durch null", () => {
  const html = H.funnelChart([{ label: "a", count: 0 }, { label: "b", count: 0 }], "weil X");
  assert.match(html, /class="empty"/);
  assert.match(html, /weil X/);
});

// --- KPI-Kachel: „nicht gemessen“ darf nie wie ein Messergebnis aussehen -----

test("kpi: empty zeigt Gedankenstrich statt Wert und bewertet das Ziel nicht", () => {
  const html = H.kpi({ tier: 1, empty: true, raw: "0 %", label: "Retention D1",
                       tone: "var(--ok)", target: { ok: false, text: "Ziel ≥ 25 %" } });
  assert.match(html, /—/);
  assert.doesNotMatch(html, /0 %/);
  assert.match(html, /chip--na/, "ohne Messwert darf das Ziel nicht als verfehlt (rot) gelten");
  assert.doesNotMatch(html, /chip--bad/);
  assert.doesNotMatch(html, /style="color:var\(--ok\)"/, "Tönung gehört zu einem Messwert");
});

test("kpi: erreichtes und verfehltes Ziel werden unterschieden", () => {
  assert.match(H.kpi({ raw: "30 %", label: "x", target: { ok: true, text: "Ziel ≥ 25 %" } }), /chip--ok/);
  assert.match(H.kpi({ raw: "10 %", label: "x", target: { ok: false, text: "Ziel ≥ 25 %" } }), /chip--bad/);
});

test("kpi: Zielwert steht als TEXT in der Kachel, nicht nur als Farbe", () => {
  // Redundante Kodierung – sonst ist die Aussage für Farbfehlsichtige verloren.
  assert.match(H.kpi({ raw: "10 %", label: "x", target: { ok: false, text: "Ziel ≥ 25 %" } }), /Ziel ≥ 25 %/);
});

// --- Escaping: Event-/Kategorienamen kommen aus unauthentifiziertem Ingest ----

test("esc: maskiert alle vier Sonderzeichen korrekt", () => {
  assert.equal(H.esc('&<>"'), "&amp;&lt;&gt;&quot;");
});

test("hbars/heatmap: Fremdtext aus den Daten landet maskiert im Markup", () => {
  const html = H.hbars([{ label: '<img src=x onerror=alert(1)>', count: 1 }]);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
});

// --- Zahlenformat: eine Kennzahl darf nicht zweimal verschieden aussehen -----

test("fmtN: Tausendertrennung deutsch, Nicht-Zahlen unverändert", () => {
  assert.equal(H.fmtN(12345), "12.345");
  assert.equal(H.fmtN(3.4), "3,4");
  assert.equal(H.fmtN("n/a"), "n/a");
  assert.equal(H.fmtN(undefined), undefined);
});

test("empty: nennt immer, was Daten erzeugen würde", () => {
  const html = H.empty("Keine Kohorten", "entsteht ab dem ersten Nutzer mit ≥ 2 aktiven Tagen");
  assert.match(html, /Keine Kohorten/);
  assert.match(html, /entsteht ab/);
});
