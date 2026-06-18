/*
 * printsheet.test.js – Sichert das druckbare Aktivitätsblatt (ui.renderPrintSheet)
 * gegen Render-Regressionen ab. Die Controller-Logik (sheetVM in app.js) ist
 * DOM-gekoppelt; hier wird der View-Pfad mit realitätsnahen VMs geprüft:
 *  - Pre-Trip-Form (mehrere Etappen, je mit Challenge)
 *  - Preset/Kategorie-Form (eine Sektion, keine Etappen-Überschrift, keine Challenge)
 *  - Randfälle: 0 Karten, genau 1 Karte (Niveau), fehlender Code (keine Abo-Sektion)
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const SRC = path.join(__dirname, "..");
globalThis.window = {};
require(path.join(SRC, "i18n.js"));
require(path.join(SRC, "i18n.strings.js"));
// renderPrintSheet nutzt das globale t() (vom Controller gesetzt) – hier nachstellen.
globalThis.t = (k, p) => globalThis.window.SC.i18n.t(k, p);
globalThis.window.t = globalThis.t;
require(path.join(SRC, "ui.js"));
const { ui, i18n } = globalThis.window.SC;

function baseVM(over) {
  return Object.assign({
    targets: [{ value: "pretrip:cartagena", label: "Pre-Trip: Cartagena", group: "pretrip" }],
    sheetTarget: "pretrip:cartagena",
    stageOpts: [{ value: "all", label: "Ganzes Ziel" }, { value: "1", label: "Etappe 1" }],
    sheetStage: "all",
    title: "Pre-Trip-Plan: Cartagena",
    levelRange: "A1–B1",
    cardCount: 4,
    stages: [
      { heading: "Etappe 1: Ankunft", cards: [
        { es: "¿Dónde está el taxi?", de: "Wo ist das Taxi?", note: "carrera = Fahrt" },
        { es: "Gracias.", de: "Danke.", note: "" },
      ], challenge: { text: "Frag nach dem Weg.", phrase: "¿Por dónde se va?" } },
      { heading: "Etappe 2: Essen", cards: [
        { es: "La cuenta, por favor.", de: "Die Rechnung, bitte.", note: "" },
        { es: "Muy rico.", de: "Sehr lecker.", note: "rico = lecker" },
      ], challenge: null },
    ],
    code: "HRT1.abc", link: "https://example.com/?task=HRT1.abc",
    edition: null, date: "2026-06-15",
  }, over || {});
}

test("renderPrintSheet: Pre-Trip-Form rendert alle Sektionen + Etappen", () => {
  const html = ui.renderPrintSheet(baseVM());
  assert.ok(html.includes("Pre-Trip-Plan: Cartagena"), "Titel fehlt");
  assert.ok(html.includes("A1–B1"), "Niveau-Spanne fehlt");
  assert.ok(html.includes(i18n.t("sheet.recipeHeading")), "Stundenrezept fehlt");
  assert.ok(html.includes(i18n.t("sheet.audioHint")), "Aussprache-Hinweis fehlt");
  assert.ok(html.includes(i18n.t("sheet.notesHeading")), "Notizen-Sektion fehlt");
  assert.equal((html.match(/class="sheet-stage"/g) || []).length, 2, "es müssen 2 Etappen-Überschriften sein");
  assert.equal((html.match(/sheet-challenge/g) || []).length, 1, "genau 1 Etappe hat eine Challenge");
  assert.ok(html.includes("HRT1.abc") && html.includes("example.com"), "Code/Link fehlen");
  assert.equal((html.match(/<li>/g) || []).length, 4 + 4, "4 Karten + 4 Rezept-Schritte");
});

test("renderPrintSheet: Preset/Kategorie-Form – eine Sektion ohne Etappen-Überschrift/Challenge", () => {
  const html = ui.renderPrintSheet(baseVM({
    sheetTarget: "preset:prearrival-ctg", title: "Pre-Arrival: Cartagena", levelRange: "A1–A2",
    stageOpts: null, cardCount: 2,
    stages: [{ heading: null, cards: [
      { es: "Hola.", de: "Hallo.", note: "" }, { es: "Adiós.", de: "Tschüss.", note: "" },
    ], challenge: null }],
  }));
  assert.ok(!html.includes('class="sheet-stage"'), "kein Etappen-Heading bei Preset");
  assert.ok(!html.includes("sheet-challenge"), "keine Challenge bei Preset");
  assert.ok(!html.includes('id="sheet-stage"'), "kein Etappen-Picker ohne stageOpts");
  assert.ok(html.includes("Pre-Arrival: Cartagena"));
});

test("renderPrintSheet: fehlender Code -> keine Abo-Sektion", () => {
  const html = ui.renderPrintSheet(baseVM({ code: "", link: "" }));
  assert.ok(!html.includes(i18n.t("sheet.subscribeHeading")), "Abo-Sektion darf ohne Code nicht erscheinen");
});

test("renderPrintSheet: 0 Karten rendert ohne Fehler", () => {
  const html = ui.renderPrintSheet(baseVM({ cardCount: 0, levelRange: "", stages: [{ heading: null, cards: [], challenge: null }] }));
  assert.ok(html.includes("Wortschatz"), "Wortschatz-Überschrift trotzdem da");
  assert.ok(!/<li>\s*<span class="sheet-es"/.test(html), "keine Karten-Einträge bei 0 Karten");
});

test("renderPrintSheet: genau 1 Karte zeigt einzelnes Niveau", () => {
  const html = ui.renderPrintSheet(baseVM({ levelRange: "A2", cardCount: 1,
    stages: [{ heading: null, cards: [{ es: "Sí.", de: "Ja.", note: "" }], challenge: null }] }));
  assert.ok(html.includes(">A2 ·") || html.includes("A2 · "), "einzelnes Niveau A2 muss erscheinen");
});

test("renderPrintSheet: stageScoped zeigt den „ganzer Plan“-Hinweis am Abo-Code", () => {
  const withHint = ui.renderPrintSheet(baseVM({ sheetStage: "1", stageScoped: true }));
  assert.ok(withHint.includes(i18n.t("sheet.subscribeWholeHint")), "Hinweis fehlt bei einzelner Etappe");
  const whole = ui.renderPrintSheet(baseVM());
  assert.ok(!whole.includes(i18n.t("sheet.subscribeWholeHint")), "Hinweis darf beim ganzen Ziel nicht erscheinen");
});

test("renderPrintSheet: Übungsmodus verdeckt ES + Notiz + Challenge-Phrase, setzt Tag", () => {
  const html = ui.renderPrintSheet(baseVM({ exercise: true }));
  assert.ok(html.includes("sheet--exercise"), "Übungs-Klasse fehlt");
  assert.ok(html.includes("sheet-es--blank"), "ES muss zur Schreiblinie werden");
  assert.ok(!html.includes("¿Dónde está el taxi?"), "spanische Antwort darf im Übungsblatt nicht erscheinen");
  assert.ok(!html.includes("carrera = Fahrt"), "Notiz (verrät Lösung) darf nicht erscheinen");
  assert.ok(!html.includes("¿Por dónde se va?"), "Challenge-Phrase (Lösung) darf nicht erscheinen");
  assert.ok(html.includes(i18n.t("sheet.exerciseHint")), "Übungs-Hinweis fehlt");
  // Lösungsblatt (Default) zeigt ES + Phrase weiterhin.
  const full = ui.renderPrintSheet(baseVM());
  assert.ok(full.includes("¿Dónde está el taxi?") && full.includes("¿Por dónde se va?"), "Lösungsblatt muss Antworten zeigen");
});

test("renderPrintSheet: Akzentfarbe + Ziel-Icon landen im Kopf", () => {
  const html = ui.renderPrintSheet(baseVM({ accent: "#E0743C", icon: "🏖️" }));
  assert.ok(html.includes("--sheet-accent:#E0743C"), "Akzent-Variable fehlt");
  assert.ok(html.includes("🏖️"), "Ziel-Icon fehlt");
  assert.ok(html.includes("sheet-accent-bar"), "Akzentstreifen fehlt");
});

test("renderPrintSheet: unsichere Akzentfarbe wird verworfen (Fallback statt Injection)", () => {
  const html = ui.renderPrintSheet(baseVM({ accent: 'red" onload="x' }));
  assert.ok(!html.includes("onload"), "ungültiger Akzent darf nicht ins Markup sickern");
  assert.ok(html.includes("--sheet-accent:#a23e20"), "Fallback-Akzent erwartet");
});

test("renderPrintSheet: QR-SVG wird eingebettet, wenn vorhanden", () => {
  const fakeSvg = '<svg id="qr-test"></svg>';
  const html = ui.renderPrintSheet(baseVM({ qrSvg: fakeSvg }));
  assert.ok(html.includes(fakeSvg), "QR-SVG fehlt");
  assert.ok(html.includes(i18n.t("sheet.scanHint")), "Scan-Hinweis fehlt");
  assert.ok(!ui.renderPrintSheet(baseVM()).includes("sheet-qr-img"), "ohne qrSvg keine QR-Figur");
});

test("renderPrintSheet: Editions-Credit erscheint, wenn gesetzt", () => {
  const html = ui.renderPrintSheet(baseVM({ edition: { name: "ECOS Cartagena" } }));
  assert.ok(html.includes("ECOS Cartagena"), "Editions-Name fehlt im Credit");
  assert.ok(html.includes(i18n.t("profile.poweredBy")), "„mit HolaRuta“-Credit fehlt");
});
