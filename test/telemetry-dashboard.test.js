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
  vm.runInContext(pure, ctx);
  return vm.runInContext("({esc,fmtN,fmtDur,pct,empty,hbars,funnelChart,kpi,retEntry,retText,heatmap,editionTable,sortBuckets,stepLabel,seriesSummary,lineChart,vbars,niceMax,donut,execSummary,zoneOpen,panelHtml,SECTIONS,GLOSSAR})", ctx);
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

// --- Trichter-Beschriftung: Server liefert Schlüssel, Oberfläche ist deutsch ---

test("stepLabel: übersetzt bekannte Schlüssel", () => {
  assert.equal(H.stepLabel("onboarding_complete"), "Onboarding beendet");
  assert.equal(H.stepLabel("first_session"), "Erste Lernrunde");
  assert.equal(H.stepLabel("intro"), "Einstieg gesehen");
});

test("stepLabel: unbekannter Schlüssel bleibt sichtbar statt zu verschwinden", () => {
  // Eine neue Server-Stufe soll auffallen, nicht still als leere Zeile enden.
  assert.equal(H.stepLabel("brandneue_stufe"), "brandneue_stufe");
  assert.equal(H.stepLabel(undefined), "");
});

test("funnelChart: zeigt Klartext statt roher Event-Namen", () => {
  const html = H.funnelChart([{ step: "new", count: 40 }, { step: "onboarding_complete", count: 12 }]);
  assert.match(html, /Neu im Fenster/);
  assert.match(html, /Onboarding beendet/);
  assert.doesNotMatch(html, /onboarding_complete/);
});

// --- Diagramme: Kernaussage muss auch ohne Grafik existieren ----------------

test("seriesSummary: nennt Spanne, Höchst-, Tiefst- und letzten Wert", () => {
  const s = H.seriesSummary([{ day: "2026-07-01", count: 3 }, { day: "2026-07-02", count: 9 }, { day: "2026-07-03", count: 5 }]);
  assert.match(s, /3 Werte/);
  assert.match(s, /2026-07-01 bis 2026-07-03/);
  assert.match(s, /Höchstwert 9 am 2026-07-02/);
  assert.match(s, /niedrigster 3/);
  assert.match(s, /zuletzt 5/);
});

test("lineChart/vbars: Textfassung vorhanden, Grafik als dekorativ markiert", () => {
  const data = [{ day: "2026-07-01", count: 1 }, { day: "2026-07-02", count: 4 }];
  for (const html of [H.lineChart(data), H.vbars(data)]) {
    assert.match(html, /<p class="sr">/, "keine Textfassung für Screenreader");
    assert.match(html, /<svg[^>]*aria-hidden="true"/, "Grafik nicht als dekorativ markiert");
    assert.match(html, /focusable="false"/, "SVG sonst in der Tab-Reihenfolge (IE/Edge-Altlast)");
  }
});

test("empty: nennt immer, was Daten erzeugen würde", () => {
  const html = H.empty("Keine Kohorten", "entsteht ab dem ersten Nutzer mit ≥ 2 aktiven Tagen");
  assert.match(html, /Keine Kohorten/);
  assert.match(html, /entsteht ab/);
});

// --- Achsenskala: y-Achse zeigt runde Zahlen, nie den krummen Rohwert --------

test("niceMax: rundet auf 1/2/4/5/10 × 10^n auf", () => {
  assert.equal(H.niceMax(7), 10);
  assert.equal(H.niceMax(3), 4);
  assert.equal(H.niceMax(47), 50);
  assert.equal(H.niceMax(120), 200);
  assert.equal(H.niceMax(1000), 1000);
  assert.equal(H.niceMax(0), 1, "0/leer darf keine 0-Skala erzeugen (Division!)");
});

test("lineChart: Skala nutzt den geglätteten Deckenwert", () => {
  const html = H.lineChart([{ day: "2026-07-01", count: 1 }, { day: "2026-07-02", count: 47 }]);
  assert.match(html, />50</, "y-Achse soll 50 zeigen, nicht 47");
});

// --- Donut: Anteile stehen als Text, Kleinkram wird zusammengefasst ----------

test("donut: Legende trägt Anzahl UND Prozent als Text, sr-Fassung existiert", () => {
  const html = H.donut([{ label: "android", count: 3 }, { label: "ios", count: 1 }]);
  assert.match(html, /<p class="sr">/);
  assert.match(html, /<svg[^>]*aria-hidden="true"/);
  assert.match(html, /75 %/);
  assert.match(html, /25 %/);
  assert.match(html, /android/);
});

test("donut: ab der 7. Kategorie wird zu 'Andere' zusammengefasst", () => {
  const data = "abcdefgh".split("").map((k, i) => ({ label: k, count: 10 - i }));
  const html = H.donut(data);
  assert.match(html, /Andere \(3\)/);
  assert.doesNotMatch(html, />h</, "kleinste Kategorie darf nicht einzeln auftauchen");
});

test("donut: leere/nur-null-Daten -> Leer-Zustand, Fremdtext maskiert", () => {
  assert.match(H.donut([], { emptyWhat: "Keine Plattform-Daten" }), /class="empty"/);
  assert.match(H.donut([{ label: "a", count: 0 }]), /class="empty"/);
  const html = H.donut([{ label: '<img src=x>', count: 1 }]);
  assert.doesNotMatch(html, /<img/);
});

// --- Kurzfassung: behauptet nur Messbares ------------------------------------

test("execSummary: ohne aktive Personen keine Aussage", () => {
  assert.equal(H.execSummary({ users: { total: 0 }, totals: {} }), "");
});

test("execSummary: n/a-Retention wird als 'nicht messbar' benannt, nie als 0 %", () => {
  const s = {
    windowDays: 7,
    totals: { errors: 0 },
    users: { total: 5, retention: [{ day: 7, eligible: 0, pct: 0 }] },
    investor: { nsm: { wal: 3, trend: { deltaPct: 10 } }, activation: {}, growth: {} },
  };
  const html = H.execSummary(s);
  assert.match(html, /noch nicht messbar/);
  assert.doesNotMatch(html, /D7-Retention: <b>0 %/);
  assert.match(html, /Keine JS-Fehler/);
});

// --- Bereichs-Registry: Subnav und Sektionsköpfe aus EINER Quelle ------------

test("SECTIONS: acht Bereiche, ids eindeutig, jede mit Lesehilfe", () => {
  assert.equal(H.SECTIONS.length, 8);
  const ids = H.SECTIONS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const sec of H.SECTIONS) {
    assert.ok(sec.title && sec.q && sec.desc, sec.id + " unvollständig");
  }
});

test("zoneOpen: erzeugt Anker-id, Titel, Leitfrage und Beschreibung", () => {
  const html = H.zoneOpen(H.SECTIONS[0], 0);
  assert.match(html, /id="overview"/);
  assert.match(html, /Überblick/);
  assert.match(html, /zone__desc/);
});

test("panelHtml: Lesehilfe wird maskiert, Fuß bleibt HTML", () => {
  const html = H.panelHtml({ title: "T", desc: '<b>x</b>', body: "B", foot: "<b>ok</b>" });
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/, "desc ist Klartext und muss maskiert werden");
  assert.match(html, /<b>ok<\/b>/, "foot ist bewusst HTML (kommt nur aus eigenem Code)");
});
