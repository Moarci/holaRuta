/*
 * hello-abroad-placement-assessment.test.js – Marken-/Sprach-Waechter fuer den
 * HolaRuta-Check (placement.js) und den HolaRuta Nivel-Test (assessment.js) im
 * de-en-Track (HelloAbroad). Beide Tests wurden fuer de-en mit einem eigenen
 * englischen Fragenkatalog nachgezogen (QUESTIONS_EN, siehe ad6a7d3), aber die
 * Chrome drumherum blieb an mehreren Stellen an de-es haengen:
 *
 *   (1) Branding: Titel/Profil-Kapitel/CTA-Button/Dashboard-Kachel sagten
 *       weiterhin "HolaRuta-Check" bzw. "Nivel-Test" (spanische Schreibweise
 *       "Nivel") statt eines HelloAbroad-passenden Namens.
 *   (2) Sprache: die Freitext-Placeholder sagten "Auf Spanisch schreiben"/
 *       "Write in Spanish" und JEDES lang-Attribut auf den Testfragen/-antworten
 *       (Frage-Satz, Multiple-Choice-Optionen, Freitext-Feld, Rueckblick) stand
 *       fest auf lang="es" – obwohl in de-en Englisch gelernt/beantwortet wird.
 *
 * Fix: <key>DeEn-Varianten in i18n.strings.js (analog zum bestehenden Muster in
 * i18n.js/t()) + dynamisches lang-Attribut ueber learnLangCode() (ui.js) statt
 * hartem "es".
 *
 * Faehrt die App ueber den ECHTEN Laufzeit-Pfad hoch (?edition=hello-abroad),
 * analog zu hello-abroad-de-en.test.js / hello-abroad-brand-messages.test.js.
 *
 * Aufruf:  node --test test/hello-abroad-placement-assessment.test.js
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const stub = require("./_dom-stub.js");

function freshApp(edition) {
  stub.install();
  if (globalThis.window.SC) globalThis.window.SC.editionConfig = null;
  stub.seedOnboarded();
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

// Textliche Marken-/Sprach-Keys, ueber i18n.t() direkt pruefbar (kein DOM noetig).
const NO_HOLARUTA_KEYS = [
  "home.placementOpenTitle",
  "home.assessmentResumeTitle",
  "placement.title",
  "placement.profileCap",
  "placement.takeNow",
  "assessment.title",
  "assessment.profileCap",
  "assessment.takeNow",
  "teacher.colLevel",
];
const NO_NIVEL_KEYS = [
  "home.assessmentResumeTitle",
  "assessment.title",
  "assessment.profileCap",
  "assessment.takeNow",
];

test("HelloAbroad Placement/Nivel-Test: Branding-Keys ohne HolaRuta/Nivel in de UND en", () => {
  freshApp("hello-abroad");
  const { i18n, track } = window.SC;
  assert.equal(track.id(), "de-en", "Vorbedingung: de-en-Track aktiv");

  for (const lang of ["de", "en"]) {
    i18n.setLang(lang);
    for (const key of NO_HOLARUTA_KEYS) {
      const s = i18n.t(key);
      assert.ok(!/HolaRuta/i.test(s), `[${lang}] ${key} enthaelt noch HolaRuta: ${JSON.stringify(s)}`);
    }
    for (const key of NO_NIVEL_KEYS) {
      const s = i18n.t(key);
      assert.ok(!/Nivel(?!au)/i.test(s), `[${lang}] ${key} enthaelt noch die spanische Schreibweise "Nivel": ${JSON.stringify(s)}`);
    }
  }
});

test("Gegenprobe: de-es behaelt HolaRuta-Check/Nivel-Test in denselben Keys", () => {
  freshApp(null);
  const { i18n, track } = window.SC;
  assert.ok(!(track && typeof track.id === "function" && track.id() === "de-en"));

  i18n.setLang("de");
  assert.match(i18n.t("placement.title"), /HolaRuta-Check/);
  assert.match(i18n.t("assessment.title"), /Nivel-Test/);
  assert.match(i18n.t("home.placementOpenTitle"), /HolaRuta-Check/);
  assert.match(i18n.t("home.assessmentResumeTitle"), /Nivel-Test/);
  assert.match(i18n.t("teacher.colLevel"), /HolaRuta-Check/);
});

test("HelloAbroad Placement: Freitext-Placeholder + lang-Attribute sind Englisch, nicht Spanisch", () => {
  const root = freshApp("hello-abroad");
  const d = makeDriver(root);
  assert.ok(d.click("open-placement"), "open-placement oeffnet den Test");
  assert.ok(d.click("placement-start"), "placement-start startet den adaptiven Lauf");

  let sawFree = false;
  for (let i = 0; i < 20; i++) {
    const html = d.html();
    assert.ok(!/HolaRuta/i.test(html), "Frage-Screen enthaelt kein HolaRuta");
    if (/id="placement-free"/.test(html)) {
      sawFree = true;
      assert.match(html, /placeholder="Auf Englisch schreiben/, "Freitext-Placeholder ist Englisch");
      assert.doesNotMatch(html, /placeholder="Auf Spanisch schreiben/, "kein spanischer Placeholder");
      const m = html.match(/id="placement-free"[^>]*lang="(\w+)"/);
      assert.ok(m && m[1] === "en", `Freitext-Feld traegt lang="en" (war: ${m && m[1]})`);
      break;
    }
    const optLang = html.match(/class="pl-option"[^>]*lang="(\w+)"/);
    if (optLang) assert.equal(optLang[1], "en", "MC-Optionen tragen lang=\"en\"");
    if (!d.click("placement-unknown")) break;
  }
  assert.ok(sawFree, "Freitext-Frage wurde im Testlauf erreicht (MC_TARGET durchlaufen)");
});

test("HelloAbroad Nivel-Test: Freitext-Placeholder + lang-Attribute sind Englisch, nicht Spanisch", () => {
  const root = freshApp("hello-abroad");
  const d = makeDriver(root);
  d.setTab("entdecken");
  assert.ok(d.click("open-assessment"), "open-assessment oeffnet den Test");
  assert.ok(d.click("assessment-start", { variant: "standard" }), "assessment-start startet den adaptiven Lauf");

  let sawFree = false;
  for (let i = 0; i < 40; i++) {
    const html = d.html();
    assert.ok(!/HolaRuta/i.test(html), "Frage-Screen enthaelt kein HolaRuta");
    if (/id="assessment-free"/.test(html)) {
      sawFree = true;
      assert.match(html, /placeholder="Auf Englisch schreiben/, "Freitext-Placeholder ist Englisch");
      const m = html.match(/id="assessment-free"[^>]*lang="(\w+)"/);
      assert.ok(m && m[1] === "en", `Freitext-Feld traegt lang="en" (war: ${m && m[1]})`);
      break;
    }
    const optLang = html.match(/class="pl-option"[^>]*lang="(\w+)"/);
    if (optLang) assert.equal(optLang[1], "en", "MC-Optionen tragen lang=\"en\"");
    if (!d.click("assessment-unknown")) break;
  }
  assert.ok(sawFree, "Freitext-Frage wurde im Testlauf erreicht (choiceTarget durchlaufen)");
});

test("Gegenprobe: de-es Placement zeigt weiterhin lang=\"es\" und den spanischen Placeholder", () => {
  const root = freshApp(null);
  const d = makeDriver(root);
  assert.ok(d.click("open-placement"));
  assert.ok(d.click("placement-start"));

  let sawFree = false;
  for (let i = 0; i < 20; i++) {
    const html = d.html();
    if (/id="placement-free"/.test(html)) {
      sawFree = true;
      assert.match(html, /placeholder="Auf Spanisch schreiben/);
      const m = html.match(/id="placement-free"[^>]*lang="(\w+)"/);
      assert.ok(m && m[1] === "es", `Freitext-Feld traegt weiterhin lang="es" (war: ${m && m[1]})`);
      break;
    }
    if (!d.click("placement-unknown")) break;
  }
  assert.ok(sawFree, "Freitext-Frage wurde im Testlauf erreicht");
});
