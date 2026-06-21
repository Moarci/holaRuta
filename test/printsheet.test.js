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

// ---------- Arbeitsheft: zusätzliche Übungsabschnitte ----------
// Hand-gebautes sections-Array (keine Zufälligkeit – analog zu stages).
function withSections(over) {
  return baseVM(Object.assign({
    sections: [
      { type: "matching", left: [{ n: 1, es: "la playa", l: "b" }, { n: 2, es: "el agua", l: "a" }],
        right: [{ l: "a", de: "das Wasser" }, { l: "b", de: "der Strand" }] },
      { type: "gapfill", wordbank: ["el boleto", "la cuenta"],
        items: [{ frameEs: "¿Cuánto cuesta ___?", targetDe: "Wie viel kostet das Ticket?", answer: "el boleto" }] },
      { type: "translate", lines: [{ de: "Wo ist das Taxi?", es: "¿Dónde está el taxi?" }] },
      { type: "conjug", rows: [{ verb: "hablar", person: "ich (yo)", answer: "hablo" }] },
      { type: "numbers", items: [{ digits: "1.250", symbol: "$", words: "mil doscientos cincuenta" }] },
      { type: "dialogue", title: "En el hotel",
        turns: [{ who: "npc", es: "¡Buenas!", de: "Hallo!" }, { who: "user", de: "(check-in)", answer: "Quisiera el check-in." }] },
      { type: "culture", title: "", facts: ["Anrede oft mit usted."] },
      { type: "writing", prompt: "" },
    ],
    sectionToggles: [
      { type: "matching", label: "Zuordnen", on: true },
      { type: "conjug", label: "Konjugation", on: false },
    ],
  }, over || {}));
}

test("renderPrintSheet: Lösungsblatt rendert alle Übungsabschnitte mit Antworten", () => {
  const html = ui.renderPrintSheet(withSections());
  // Abschnitts-Wrapper je Typ (Überschriften via i18n können „&" enthalten → esc).
  ["matching", "gapfill", "translate", "conjug", "numbers", "dialogue", "culture", "writing"]
    .forEach((ty) => assert.ok(html.includes("sheet-section--" + ty), "Abschnitt fehlt: " + ty));
  assert.ok(html.includes(i18n.t("sheet.instrMatching")) && html.includes(i18n.t("sheet.instrConjug")), "Anweisungen fehlen");
  // Inline-Antworten im Lösungsblatt sichtbar:
  assert.ok(html.includes("hablo"), "Konjug-Form fehlt");
  assert.ok(html.includes("mil doscientos cincuenta"), "Zahlwort fehlt");
  assert.ok(html.includes("Quisiera el check-in."), "Dialog-Musterantwort fehlt");
  assert.ok(html.includes("¿Dónde está el taxi?"), "Übersetzungslösung fehlt");
  assert.ok(html.includes("1 → b") && html.includes("2 → a"), "Zuordnungsraster mit Lösungen fehlt");
  assert.ok(html.includes("Anrede oft mit usted."), "Landeskunde-Fakt fehlt");
  // Kein separater Lösungsschlüssel im Lösungsblatt (Antworten stehen inline):
  assert.ok(!html.includes("sheet-answerkey"), "Lösungsblatt braucht keinen separaten Schlüssel");
});

test("renderPrintSheet: Übungsmodus verdeckt Antworten und hängt Lösungsschlüssel an", () => {
  const html = ui.renderPrintSheet(withSections({ exercise: true }));
  const ak = html.indexOf("sheet-answerkey");
  assert.ok(ak !== -1, "Lösungsschlüssel fehlt im Übungsmodus");
  const body = html.slice(0, ak), key = html.slice(ak);
  // Im Übungsteil keine Lösungen:
  ["hablo", "mil doscientos cincuenta", "Quisiera el check-in.", "¿Dónde está el taxi?"]
    .forEach((a) => assert.ok(!body.includes(a), "Lösung sickert in den Übungsteil: " + a));
  // …aber im Schlüssel vorhanden:
  ["hablo", "mil doscientos cincuenta", "Quisiera el check-in.", "¿Dónde está el taxi?"]
    .forEach((a) => assert.ok(key.includes(a), "Lösung fehlt im Schlüssel: " + a));
  assert.ok(body.includes("sheet-write-line") || body.includes("sheet-blank-inline"), "Schreiblinien/Lücken fehlen");
});

test("renderPrintSheet: Lösungsschlüssel nummeriert Zuordnung nicht doppelt", () => {
  const html = ui.renderPrintSheet(withSections({ exercise: true }));
  const key = html.slice(html.indexOf("sheet-answerkey"));
  // Die <ol> liefert die Paar-Nummer; das Item enthält nur den Buchstaben (keine „1 → b“-Dopplung).
  assert.ok(/<li>b<\/li>/.test(key) && /<li>a<\/li>/.test(key), "Matching-Lösung als reiner Buchstabe fehlt");
  assert.ok(!key.includes("1 → b"), "doppelte Nummerierung im Lösungsschlüssel");
});

test("renderPrintSheet: Bausteinauswahl-Chips spiegeln den An/Aus-Status", () => {
  const html = ui.renderPrintSheet(withSections());
  assert.ok(html.includes('data-action="toggle-section"'), "Toggle-Action fehlt");
  assert.ok(html.includes('data-type="matching"') && html.includes('aria-pressed="true"'), "aktiver Baustein fehlt");
  assert.ok(html.includes('data-type="conjug"') && html.includes('aria-pressed="false"'), "abgewählter Baustein fehlt");
});

test("renderPrintSheet: leere sections rendern ohne Abschnitte/Schlüssel", () => {
  const html = ui.renderPrintSheet(baseVM({ sections: [], exercise: true }));
  assert.ok(!html.includes('class="sheet-section'), "keine Übungsabschnitte erwartet");
  assert.ok(!html.includes("sheet-answerkey"), "ohne Abschnitte kein Lösungsschlüssel");
  assert.ok(html.includes("Wortschatz"), "Wortschatz bleibt erhalten");
});

// ---------- Fill-Modus: am Handy ausfüllbar ----------
test("renderPrintSheet: Modus-Umschalter bietet die Handy-Variante an", () => {
  const html = ui.renderPrintSheet(baseVM());
  assert.ok(html.includes('data-mode="fill"'), "Fill-Modus-Knopf fehlt");
  assert.ok(html.includes(i18n.t("sheet.modeFill")), "Fill-Modus-Label fehlt");
});

test("renderPrintSheet: Fill-Modus rendert Eingabefelder mit hinterlegter Lösung", () => {
  const html = ui.renderPrintSheet(withSections({ fill: true }));
  assert.ok(html.includes("sheet-fill"), "Eingabefelder fehlen");
  // Lösungen stecken zur Selbstkontrolle in data-answer:
  assert.ok(html.includes('data-answer="hablo"'), "Konjug-Lösung nicht im Feld hinterlegt");
  assert.ok(html.includes('data-answer="mil doscientos cincuenta"'), "Zahlwort nicht im Feld hinterlegt");
  // Übersetzung wird zum Feld (nicht zur Schreiblinie):
  assert.ok(html.includes('data-answer="¿Dónde está el taxi?"'), "Übersetzungslösung nicht im Feld hinterlegt");
  // Freies Schreiben + Notizen als Textfeld statt Linien-Box:
  assert.ok(html.includes("sheet-fill-area"), "Schreib-Textfeld fehlt");
  assert.ok(!html.includes("sheet-write-line"), "keine Druck-Schreiblinien im Fill-Modus");
  assert.ok(!html.includes("sheet-notes-lines"), "Notizen werden zum Textfeld");
});

test("renderPrintSheet: Fill-Modus zeigt Prüf-Steuerung statt Drucken, keinen Lösungsschlüssel", () => {
  const html = ui.renderPrintSheet(withSections({ fill: true }));
  assert.ok(html.includes('data-action="sheet-check"'), "Prüfen-Knopf fehlt");
  assert.ok(html.includes('data-action="sheet-reveal"'), "Lösungen-zeigen-Knopf fehlt");
  assert.ok(html.includes('data-action="sheet-reset"'), "Zurücksetzen-Knopf fehlt");
  assert.ok(html.includes("sheet-score"), "Ergebnis-Anzeige fehlt");
  assert.ok(html.includes("sheet-fillbar"), "Fill-Hinweis fehlt");
  assert.ok(!html.includes('data-action="printsheet-print"'), "kein Drucken-Knopf im Fill-Modus");
  assert.ok(!html.includes("sheet-answerkey"), "Fill-Modus braucht keinen separaten Schlüssel");
});

test("renderPrintSheet: Fill-Modus hält die Vokabel-Sektion als Referenz sichtbar", () => {
  const html = ui.renderPrintSheet(baseVM({ fill: true }));
  assert.ok(html.includes("¿Dónde está el taxi?"), "Vokabeln bleiben im Fill-Modus sichtbar");
  assert.ok(!html.includes("sheet-es--blank"), "keine verdeckten Vokabel-Linien im Fill-Modus");
});
