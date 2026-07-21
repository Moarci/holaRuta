/*
 * hello-abroad-brand-messages.test.js – Marken-Waechter fuer die HelloAbroad-Edition
 * (Track de-en). Die Update-Nachricht (Banner + "Was ist neu?"-Fenster) und der
 * PWA-Installations-Hinweis trugen den fest verdrahteten Markennamen "HolaRuta".
 * Ziel der Edition ist aber bewusst KEINE HolaRuta-Referenz (siehe editions/
 * registry.js: eigenstaendige Marke "HelloAbroad"). Ueber <key>DeEn-Varianten
 * (i18n.strings.js) muss in de-en ueberall "HelloAbroad" statt "HolaRuta" stehen –
 * in beiden UI-Sprachen (de UND en, denn HelloAbroad ist DE/EN umschaltbar).
 *
 * Fährt die App über den ECHTEN Laufzeit-Pfad hoch (?edition=hello-abroad), analog
 * zu hello-abroad-de-en.test.js.
 *
 * Aufruf:  node --test test/hello-abroad-brand-messages.test.js   (oder: node --test)
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

// Die Update-Nachricht (mit "Jetzt laden"-Button) und der PWA-Installations-Hinweis.
// Jeder Wert erschien vor dem Fix mit "HolaRuta" (siehe ui.js updateBanner/updateNotice/
// installBlock und app.js installVM).
const BRAND_KEYS = [
  "profile.updTitle",        // "Was ist neu?"-Fenster: Titel
  "profile.updHowText",      // "Was ist neu?"-Fenster: "So bleibst du aktuell"
  "profile.installText",     // Install-Karte: Android-Ein-Tipp-Text
  "profile.installHintLead", // Install-Karte: generische Menue-Anleitung
  "profile.installStep3",    // Install-Karte: letzter Schritt
  "profile.installedText",   // Install-Karte: "schon installiert"-Bestaetigung
  "profile.installedIosNote",// Install-Karte: iOS-Konsequenz-Hinweis (installiert)
  "profile.installIosReaddWarn", // Install-Karte: iOS-Warnung "nicht erneut hinzufuegen"
  "app.installHintIos",      // iOS-Schritt-fuer-Schritt (installVM.hint)
  "share.captionModuleHead", // Modul-Sharepic: Begleittext-Kopfzeile ("... aus HolaRuta")
  "share.captionModule",     // Modul-Sharepic: Begleittext-Tagline ("Reise-Spanisch fuer Lateinamerika ...")
];

test("HelloAbroad-Update/Install: keine HolaRuta-Referenz, in de UND en", () => {
  freshApp("hello-abroad");
  const { i18n, track } = window.SC;
  assert.equal(track.id(), "de-en", "Vorbedingung: de-en-Track aktiv");

  for (const lang of ["de", "en"]) {
    i18n.setLang(lang);
    for (const key of BRAND_KEYS) {
      const s = i18n.t(key);
      assert.ok(!/HolaRuta/.test(s), `[${lang}] ${key} enthaelt noch HolaRuta: ${JSON.stringify(s)}`);
      assert.ok(/HelloAbroad/.test(s), `[${lang}] ${key} nennt HelloAbroad nicht: ${JSON.stringify(s)}`);
    }
  }
});

test("Gegenprobe: de-es behaelt den Markennamen HolaRuta in denselben Texten", () => {
  freshApp(null); // Standard-Edition (Reise-Spanisch, kein Track-Override)
  const { i18n, track } = window.SC;
  assert.ok(!(track && typeof track.id === "function" && track.id() === "de-en"),
    "Vorbedingung: kein de-en-Track");

  i18n.setLang("de");
  for (const key of BRAND_KEYS) {
    const s = i18n.t(key);
    assert.ok(/HolaRuta/.test(s), `${key} sollte in de-es weiterhin HolaRuta nennen: ${JSON.stringify(s)}`);
    assert.ok(!/HelloAbroad/.test(s), `${key} darf in de-es kein HelloAbroad zeigen: ${JSON.stringify(s)}`);
  }
});
