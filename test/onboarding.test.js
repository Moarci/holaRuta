/*
 * onboarding.test.js – Sichert die Onboarding-Erklär-Slides (ui.renderOnboarding,
 * Schritt 'intro') gegen Render-Regressionen ab. Die Controller-Logik (Navigation,
 * Slide-Wechsel) lebt DOM-gekoppelt in app.js; hier wird der reine View-Pfad mit
 * realitätsnahen VMs geprüft:
 *  - jede Slide rendert in DE und EN ohne durchgesickerte i18n-Schlüssel
 *  - erster Slide bietet „Überspringen", letzter „Los geht's" (kein Skip)
 *  - genau ein aktiver Punkt, passend zum aktuellen Slide-Index
 *  - Out-of-range-Index (zu groß/negativ) klemmt, statt zu crashen
 *  - der Profil-Schritt rendert weiterhin (keine Regression durch den neuen Schritt)
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
// renderOnboarding nutzt das globale t() (vom Controller gesetzt) – hier nachstellen.
globalThis.t = (k, p) => globalThis.window.SC.i18n.t(k, p);
globalThis.window.t = globalThis.t;
require(path.join(SRC, "ui.js"));
const { ui, i18n } = globalThis.window.SC;

// Minimaler View-Model-Rumpf: keine Edition (HolaRuta-Begrüßung), kein Trip.
function introVM(slide) {
  return { edition: null, userName: "", userGender: "", trip: null, onboardStep: "intro", onboardSlide: slide };
}
const COUNT = ui.ONBOARD_SLIDE_COUNT;

test("ONBOARD_SLIDE_COUNT: exportiert und plausibel (≥1)", () => {
  assert.equal(typeof COUNT, "number");
  assert.ok(COUNT >= 1, `unerwartete Slide-Anzahl: ${COUNT}`);
});

test("Intro-Slides: rendern in DE und EN ohne Leck/Lücke", () => {
  for (const lang of ["de", "en"]) {
    i18n.setLang(lang);
    for (let s = 0; s < COUNT; s++) {
      const html = ui.renderOnboarding(introVM(s));
      assert.match(html, /onboarding--intro/, `${lang}/${s}: Intro-Markup fehlt`);
      assert.doesNotMatch(html, /home\.onboardSlide/, `${lang}/${s}: untranslated i18n-Key durchgesickert`);
      assert.doesNotMatch(html, /undefined/, `${lang}/${s}: "undefined" im Output`);
      // Genau COUNT Punkte (Navigation, je ein data-action), einer davon aktiv.
      assert.equal((html.match(/data-action="onboard-slide-go"/g) || []).length, COUNT, `${lang}/${s}: falsche Punktzahl`);
      assert.equal((html.match(/onboarding__dot--on/g) || []).length, 1, `${lang}/${s}: nicht genau 1 aktiver Punkt`);
    }
  }
  i18n.setLang("de");
});

test("Intro-Slides: erster Slide bietet Skip, letzter den Start-Text statt Skip", () => {
  i18n.setLang("de");
  const first = ui.renderOnboarding(introVM(0));
  const last = ui.renderOnboarding(introVM(COUNT - 1));
  // Erster Slide (sofern es mehr als einen gibt): Skip-Knopf vorhanden.
  if (COUNT > 1) assert.match(first, /onboard-slide-skip/, "erster Slide ohne Überspringen-Knopf");
  // Letzter Slide: Start-Text (HTML-escaped wie im Output), KEIN Skip-Knopf.
  assert.equal(last.includes(ui.esc(i18n.t("home.onboardSlideStart"))), true, "letzter Slide ohne Start-Text");
  assert.doesNotMatch(last, /onboard-slide-skip/, "letzter Slide zeigt fälschlich Überspringen");
});

test("Intro-Slides: Out-of-range-Index klemmt auf gültigen Slide (kein Crash)", () => {
  i18n.setLang("de");
  const over = ui.renderOnboarding(introVM(999));
  const neg = ui.renderOnboarding(introVM(-7));
  for (const html of [over, neg]) {
    assert.match(html, /onboarding--intro/);
    assert.equal((html.match(/onboarding__dot--on/g) || []).length, 1, "geklemmt: weiterhin genau 1 aktiver Punkt");
  }
  // Zu großer Index landet auf dem letzten Slide (Start-Text), negativer auf dem ersten.
  assert.equal(over.includes(ui.esc(i18n.t("home.onboardSlideStart"))), true, "über-Index nicht auf letztem Slide");
});

test("Intro-Slides: aktiver Punkt folgt dem Slide-Index (data-idx)", () => {
  i18n.setLang("de");
  for (let s = 0; s < COUNT; s++) {
    const html = ui.renderOnboarding(introVM(s));
    // Der aktive Punkt trägt data-idx == s (aria-current markiert dieselbe Stelle).
    const re = new RegExp(`onboarding__dot--on[^>]*data-idx="${s}"`);
    assert.match(html, re, `Slide ${s}: aktiver Punkt zeigt nicht auf data-idx ${s}`);
  }
});

test("Onboarding: Profil-Schritt rendert weiterhin (keine Regression)", () => {
  i18n.setLang("de");
  const html = ui.renderOnboarding({ edition: null, userName: "", userGender: "", trip: null, onboardStep: "profile" });
  assert.match(html, /onboard-profile-next/, "Profil-Formular fehlt");
  assert.doesNotMatch(html, /onboarding--intro/, "Profil-Schritt zeigt fälschlich Intro-Markup");
});
