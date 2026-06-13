/*
 * i18n.strings.js – UI-Wörterbuch (Deutsch + Englisch). Trägt alle Oberflächen-
 * Strings über SC.i18n.register("bereich", {de…}, {en…}) bei. Lädt nach i18n.js,
 * vor ui.js/app.js. (Lerninhalte stehen NICHT hier – die tragen en:/de: direkt
 * in data.js, countries.js usw.)
 *
 * NAMESPACE-REGISTER (eine Datei, klare Bereiche – beim Erweitern Bereich treffen):
 *   common   – geteilt: Buttons, Datum/Plural, Toasts, Fehler
 *   home     – Reiter „Lernen": Heute-Karte, Einstellungs-Panel, Themen, Trip-Ziel
 *   study    – Lernen/Karte: Vorder-/Rückseite, Bewerten, Tippen, Hören, Fertig
 *   discover – Reiter „Entdecken": Feature-Untertitel, Dialoge/Regatear/Knigge-Chrome
 *   profile  – Reiter „Profil": Fortschritt, Statistik, Badges-Chrome, Eigene Karten
 *
 * Key-Konvention: bereich.beschreibenderCamelCase (z. B. common.save, home.settings).
 * NICHT übersetzen: Marke „HolaRuta" und bewusst spanische Feature-/Modus-Namen
 *   (Diálogos, Regatear, Supervivencia, Definiciones, Precios al oído, El Cuerpo,
 *    Conjugación, Ruta del día …). Übersetzt wird nur deutscher Begleittext.
 */
(function () {
  "use strict";
  const i18n = window.SC && window.SC.i18n;
  if (!i18n) return; // i18n.js muss zuerst geladen sein.

  // ---------- common: geteilte Bausteine (von Phase 0 / app.js genutzt) ----------
  // Relative Fälligkeit (app.js fmtDue) und allgemeine Wörter. Pluralformen als
  // Funktionswerte, damit DE/EN je eigene Beugung liefern können.
  i18n.register("common", {
    dueNow: "fällig",
    today: "heute",
    tomorrow: "morgen",
    inNDays: (p) => `in ${p.n} Tagen`,
    // Tage-Serie (Streak): „1 Tag" / „N Tage"
    dayStreak: (p) => `${p.n} ${p.n === 1 ? "Tag" : "Tage"}`,
    // Einkaufszettel: muttersprachliche Nachfrage-Sätze (Spanisch bleibt generiert).
    askHave: "Haben Sie das?",
    askFind: "Wo finde ich das?",
  }, {
    dueNow: "due",
    today: "today",
    tomorrow: "tomorrow",
    inNDays: (p) => `in ${p.n} days`,
    dayStreak: (p) => `${p.n} ${p.n === 1 ? "day" : "days"}`,
    askHave: "Do you have this?",
    askFind: "Where can I find this?",
  });

  // ---------- home: Sprach-/Richtungs-Umschalter (von Phase 0 genutzt) ----------
  // Die übrigen home-Strings (CTAs, Themen, Trip-Ziel) ergänzt der UI-String-Pass.
  i18n.register("home", {
    uiLanguage: "Sprache",
  }, {
    uiLanguage: "Language",
  });

  // ---------- home/study/discover/profile: vom UI-String-Pass zu füllen ----------
  // (Agent B trägt hier die ~300 Oberflächen-Strings aus ui.js/app.js ein.)
})();
