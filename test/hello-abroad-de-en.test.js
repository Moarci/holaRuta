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

// ============================ (2) tipFor / Aussprache-Tipp ============================
// Alle in de-en sichtbaren Karten sind Reise-Karten (kein loc-Korpus) und tragen einen
// SPANISCHEN Tipp. Nach dem Fix darf im Study-Screen daher NIE ein `face__tip` erscheinen.
function drainStudyForTips(edition) {
  const root = freshApp(edition);
  const d = makeDriver(root);
  // In den Karteikarten-Modus (flip), damit die Antwortseite mit dem Tipp rendert.
  d.setTab("profil");
  if (d.find("set-mode", { mode: "flip" })) d.click("set-mode", { mode: "flip" });
  d.setTab("entdecken");
  assert.ok(d.click("open-endless"), "open-endless startet den Study-Screen");
  const hits = [];
  let seen = 0;
  for (let i = 0; i < 40; i++) {
    if (d.find("flip")) d.click("flip"); // Antwortseite aufdecken
    if (/face__tip/.test(d.html())) {
      const m = d.html().match(/face__tip[^>]*>([\s\S]*?)<\/div>/);
      const favId = (root.querySelector('[data-action="fav-toggle"]') || { getAttribute: () => "?" }).getAttribute("data-id");
      hits.push(`${favId}: ${m ? m[1].replace(/<[^>]+>/g, "").trim().slice(0, 50) : ""}`);
    }
    if (!d.click("rate", { rating: "good" })) break;
    seen++;
  }
  return { hits, seen };
}

test("tipFor: de-en zeigt KEINEN (spanischen) Aussprache-Tipp im Study-Screen", () => {
  const { hits, seen } = drainStudyForTips("hello-abroad");
  assert.ok(seen >= 20, `Study-Runde lief wirklich (Karten bewertet: ${seen})`); // sonst wäre die Tipp-Prüfung leer
  assert.deepEqual(hits, [], `kein face__tip in de-en erwartet, gefunden: ${JSON.stringify(hits.slice(0, 6))}`);
});

test("Gegenprobe: de-es (Standard) zeigt den Tipp weiterhin – der Mechanismus rendert", () => {
  // Stellt sicher, dass (2) den Tipp wirklich UNTERDRÜCKT und nicht bloß nie rendert:
  // im Standard-Reise-Track ist der spanische Tipp korrekt und muss erscheinen.
  assert.ok(drainStudyForTips(null).hits.length > 0,
    "face__tip erscheint im de-es-Track (Aussprache des zu lernenden spanischen Wortes)");
});
