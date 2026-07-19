/*
 * hello-abroad-de-en.test.js – HelloAbroad-Edition, Track de-en (DE-Muttersprachler
 * lernt Reiseenglisch). Sichert zwei Fixes gegen Spanisch-Reste ab, die entstehen,
 * WEIL de-en denselben data.js-Reise-Korpus wie de-es nutzt, aber card.en lernt.
 * Beide Reste tauchten erst mit dieser Edition auf (der bestehende Locals-Track es-en
 * zeigt nur den eigenen loc-Korpus, nie die Reise-Karten):
 *
 *   (1) Matcher/card.alt: die alt-Liste der Reise-Karten ist SPANISCH (alt überschreibt
 *       den es-Split, siehe data.js-Header). In de-en (learnLang="en") darf sie die
 *       englische Antwortmenge NICHT ersetzen – sonst würde die korrekte englische
 *       Eingabe abgelehnt und stattdessen Spanisch verlangt bzw. vorgelesen.
 *   (2) tipFor: der `tip` der Reise-Karten ist SPANISCHE Laien-Lautschrift ("Hello" →
 *       "OH-la (H ist stumm)"). In de-en muss er – wie im Locals-Track – unterdrückt
 *       werden, sonst lernt der Nutzer die Aussprache des spanischen Wortes.
 *
 * Fährt die App über den ECHTEN Laufzeit-Pfad hoch (?edition=hello-abroad), analog zu
 * endless.test.js / hostel-edition.test.js.
 *
 * Aufruf:  node --test test/hello-abroad-de-en.test.js   (oder: node --test)
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const stub = require("./_dom-stub.js");

// Frischer App-Boot mit optionalem edition-Param (registry.js liest ihn VOR config.js).
function freshApp(edition) {
  stub.install();
  if (globalThis.window.SC) globalThis.window.SC.editionConfig = null; // Edition nicht durchsickern lassen
  stub.seedOnboarded(); // Standard-Namespace (de-es)
  // HelloAbroad läuft im de-en-Track und speichert unter einem eigenen Namespace
  // (store.js: "spanischcard.de-en.settings.v1"); der Standard-Onboarded-Flag greift
  // dort nicht. Für den direkten Dashboard-Boot den de-en-Namespace mit-seeden.
  if (edition === "hello-abroad") {
    globalThis.window.localStorage.setItem(
      "spanischcard.de-en.settings.v1", JSON.stringify({ onboarded: true, mode: "flip" }));
  }
  globalThis.window.location.search = edition ? "?edition=" + edition : "";
  const SRC = path.join(__dirname, "..");
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${path.sep}test${path.sep}`)) delete require.cache[key];
  }
  stub.installModules();
  return document.getElementById("app");
}

function makeDriver(root) {
  function find(action, data) {
    let sel = `[data-action="${action}"]`;
    if (data) for (const k in data) sel += `[data-${k}="${data[k]}"]`;
    return root.querySelector(sel);
  }
  function click(action, data) {
    const el = find(action, data);
    if (!el) return false;
    el.dispatchEvent({ type: "click", target: el, bubbles: true });
    return true;
  }
  function setTab(tab) { if (!click("home")) click("set-tab", { tab: "start" }); return click("set-tab", { tab }); }
  function html() { return root.innerHTML; }
  return { find, click, setTab, html };
}

// ============================ (0) Track-Auflösung ============================
test("Edition hello-abroad aktiviert den de-en-Track (learnLang=en)", () => {
  freshApp("hello-abroad");
  const { track, config } = window.SC;
  assert.equal(config.edition, "hello-abroad");
  assert.equal(track.id(), "de-en");
  assert.equal(track.learnLang(), "en");
  assert.equal(track.ttsLocale(), "en-US");
});

// ============================ (1) Matcher / card.alt ============================
test("Matcher: spanisches card.alt einer Reise-Karte wird in de-en NICHT verlangt", () => {
  freshApp("hello-abroad");
  const { matcher, data } = window.SC;

  // dir30: de "Geh geradeaus", en "Go straight ahead", alt ["sigue derecho", …] (spanisch).
  const dir30 = data.CARDS.find((c) => c.id === "dir30");
  assert.ok(dir30 && Array.isArray(dir30.alt) && dir30.alt.length, "dir30 trägt ein spanisches alt");
  assert.ok(dir30.alt.every((a) => !/straight ahead/i.test(a)), "alt ist rein spanisch (Vorbedingung)");

  // Die korrekte englische Antwort zählt (vor dem Fix abgelehnt, weil nur das
  // spanische alt als Kandidatenmenge galt).
  assert.equal(matcher.check("Go straight ahead", dir30, "learn").correct, true, "englische Antwort akzeptiert");
  assert.equal(matcher.check("go straight ahead", dir30, "learn").correct, true, "case-insensitiv");
  // Die spanische alt-Form wird NICHT (mehr) als englische Antwort akzeptiert.
  assert.equal(matcher.check("sigue derecho", dir30, "learn").correct, false, "spanisches alt zählt nicht als en-Antwort");

  // Anzeige/TTS-Antwort ist Englisch, nicht Spanisch.
  const acc = matcher.acceptedAnswers(dir30, "learn");
  assert.ok(acc.some((a) => /straight ahead/i.test(a)), "Anzeige/TTS = englische Antwort");
  assert.ok(!acc.some((a) => /sigue|derecho/i.test(a)), "kein Spanisch in der Anzeige-Antwort");
});

test("Matcher: ENGLISCHES card.alt (loc-Karte) bleibt auch in de-en gültig", () => {
  freshApp("hello-abroad");
  const { matcher } = window.SC;
  // Beweist, dass der Fix nach der ANTWORTSPRACHE des alt unterscheidet (loc-=en) und
  // nicht pauschal jedes alt in de-en verwirft.
  const loc = { id: "loc-tst", es: "el baño", en: "the restroom", alt: ["the restroom", "the toilet"] };
  assert.equal(matcher.check("the toilet", loc, "learn").correct, true, "englisches alt-Synonym akzeptiert");
});

// ================= (2) Aussprache: englische Hilfe statt spanischem Tipp =============
// In de-en tragen die (Reise-)Karten von basics/talk eine ENGLISCHE Aussprachehilfe
// (card.enPron, z. B. "Hello" → "he-LOU"). Der spanische card.tip ("OH-la") darf NIE
// erscheinen. Der Study-Screen zeigt im de-en-Track also ausschließlich enPron-Werte.
function drainStudyTips(edition) {
  const root = freshApp(edition);
  const d = makeDriver(root);
  d.setTab("profil");
  if (d.find("set-mode", { mode: "flip" })) d.click("set-mode", { mode: "flip" });
  d.setTab("entdecken");
  assert.ok(d.click("open-endless"), "open-endless startet den Study-Screen");
  const texts = [];
  for (let i = 0; i < 60; i++) {
    if (d.find("flip")) d.click("flip"); // Antwortseite (mit Tipp) aufdecken
    if (/face__tip/.test(d.html())) {
      const m = d.html().match(/face__tip[^>]*>([\s\S]*?)<\/div>/);
      if (m) texts.push(m[1].replace(/<[^>]+>/g, "").trim());
    }
    if (!d.click("rate", { rating: "good" })) break;
  }
  return texts.filter(Boolean);
}
const normTip = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();

test("Aussprache: de-en zeigt die ENGLISCHE Aussprachehilfe, nie den spanischen Tipp", () => {
  const shown = drainStudyTips("hello-abroad").map(normTip);
  const { data } = window.SC;
  const enProns = new Set(data.CARDS.filter((c) => c.enPron).map((c) => normTip(c.enPron)));
  const esTips = new Set(data.CARDS.filter((c) => !/^loc-/.test(c.id) && c.tip).map((c) => normTip(c.tip)));
  assert.ok(shown.length >= 3, `genug Aussprachehilfen gesehen (${shown.length})`);
  for (const t of shown) {
    assert.ok(enProns.has(t), `gezeigter Tipp ist eine englische Aussprachehilfe: "${t}"`);
    assert.ok(!esTips.has(t), `spanischer Tipp durchgesickert: "${t}"`);
  }
});

test("Gegenprobe: de-es zeigt weiterhin die SPANISCHE Lautschrift", () => {
  const shown = drainStudyTips(null).map(normTip);
  const { data } = window.SC;
  const esTips = new Set(data.CARDS.filter((c) => !/^loc-/.test(c.id) && c.tip).map((c) => normTip(c.tip)));
  assert.ok(shown.length > 0, "es erscheinen Tipps im de-es-Track");
  assert.ok(shown.some((t) => esTips.has(t)), "mindestens ein gezeigter Tipp ist die spanische Lautschrift");
});

// ============================ (3) Geschlechts-Abfrage ============================
// Das Geschlecht löst nur spanische Anrede-Tokens ({o/a}) auf und wäre in de-en (Antwort
// Englisch) wirkungslos – der Hinweis verweist zudem auf Spanisch. In de-en darf daher
// KEINE Geschlechts-Auswahl erscheinen (Onboarding + Profil).
function settingsHtml(edition) {
  const root = freshApp(edition);
  const d = makeDriver(root);
  if (!d.click("home")) d.click("set-tab", { tab: "start" });
  d.click("set-tab", { tab: "profil" });
  return d.html();
}

test("Gender-Abfrage: de-en blendet die (spanisch begründete) Geschlechts-Auswahl aus", () => {
  const de_en = settingsHtml("hello-abroad");
  assert.doesNotMatch(de_en, /data-action="set-gender"/, "de-en darf keine Geschlechts-Auswahl zeigen");
});

test("Gegenprobe: de-es zeigt die Geschlechts-Auswahl weiterhin (spanische Anrede)", () => {
  const de_es = settingsHtml(null);
  assert.match(de_es, /data-action="set-gender"/, "de-es braucht die Geschlechts-Auswahl (perdido/perdida)");
});

// ===================== (3b) Reise-Kontext: englischer Beispielsatz ==================
// Das Kontext-Panel zeigt bei Reise-Karten sonst den SPANISCHEN Beispielsatz. In de-en
// (learnLang=en) muss stattdessen der englische Satz (sentenceEn) erscheinen, sonst ist
// der „Beispiel"-Satz Spanisch (Leck). Marker: die gelernte Zeile trägt lang="en".
function openContextPanel(edition) {
  const root = freshApp(edition);
  const d = makeDriver(root);
  d.setTab("profil");
  if (d.find("set-mode", { mode: "flip" })) d.click("set-mode", { mode: "flip" });
  d.setTab("entdecken");
  assert.ok(d.click("open-endless"), "open-endless startet den Study-Screen");
  for (let i = 0; i < 40; i++) {
    if (d.find("flip")) d.click("flip");            // Antwortseite (mit Kontext-Knopf)
    if (d.find("toggle-context")) {
      d.click("toggle-context");                    // Panel aufklappen
      const html = d.html();
      const m = html.match(/context-panel__es" lang="(\w+)"/);
      if (m) return m[1];                           // Sprache der Beispiel-Zeile
    }
    if (!d.click("rate", { rating: "good" })) break;
  }
  return null;
}

test("Reise-Kontext: de-en zeigt den ENGLISCHEN Beispielsatz (lang=en), nicht Spanisch", () => {
  assert.equal(openContextPanel("hello-abroad"), "en", "Kontext-Beispiel muss in de-en Englisch sein");
});

test("Gegenprobe: de-es zeigt weiterhin den spanischen Beispielsatz (lang=es)", () => {
  assert.equal(openContextPanel(null), "es", "Kontext-Beispiel bleibt in de-es Spanisch");
});

// ============================ (4) 50+-Abdeckung ============================
// Die 10 Reisebereiche wurden gezielt für die 50+-Zielgruppe ergänzt (Mobilität/
// Barrierefreiheit + chronische Gesundheit + Verständnis-Helfer). Sichert die
// Kernkarten samt en-US-Antwort ab (data-Ebene, track-unabhängig).
test("50+-Abdeckung: neue Mobilitäts-/Gesundheits-/Verständnis-Karten vorhanden", () => {
  freshApp("hello-abroad"); // lädt data.js + hello-abroad-Allowlist
  const { data } = window.SC;
  const byId = new Map(data.CARDS.map((c) => [c.id, c]));
  const expect = {
    h25: "Is there an elevator?",              // Mobilität Hotel
    h26: "I'd like a room on the ground floor",
    fh21: "I need wheelchair assistance",       // Barrierefreiheit Flughafen
    fh20: "Where is the baggage claim?",
    fa25: "I have high blood pressure",         // chronische Gesundheit
    fa26: "I have diabetes",
    fa27: "I take heart medication",
    n17: "I have chest pain",                   // Notfall
    n16: "Where is the nearest hospital?",
    b22: "Could you repeat that, please?",      // Verständnis-Helfer
    b23: "Could you write it down?",
  };
  const allow = window.SC.config.categoryAllowlist || [];
  for (const [id, en] of Object.entries(expect)) {
    const c = byId.get(id);
    assert.ok(c, `Karte ${id} fehlt`);
    assert.equal(c.en, en, `${id}: falsche englische Antwort`);
    assert.ok(allow.indexOf(c.cat) >= 0, `${id}: Kategorie ${c.cat} muss in HelloAbroad sichtbar sein`);
  }
});
