/*
 * i18n.js  (SC.i18n) – Mehrsprachigkeit (Deutsch/Englisch). REINE ENGINE.
 * Lädt VOR allen Inhalten und vor ui.js/app.js, damit das globale t() überall
 * bereitsteht. Hält KEINE Strings selbst – die UI-Wörterbücher kommen aus
 * i18n.strings.js (register), die Lerninhalte tragen en:/de:-Felder direkt.
 *
 * Zwei Aufgaben:
 *   1) t(key, params)      – UI-Strings je aktiver Sprache (Fallback: lang→de→key).
 *   2) nativeText(obj)     – das muttersprachliche Feld eines Inhaltsobjekts
 *                            (obj[lang] || obj.de). "Muttersprache" = gewählte
 *                            UI-Sprache; obj.de bleibt der sichere Rückfall, damit
 *                            Nutzer-eigene Karten (nur de/es) und noch nicht
 *                            übersetzte Inhalte nie leer/kaputt sind.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};

  // Unterstützte UI-Sprachen. Deutsch ist die Quelle/Referenz, Englisch die
  // erste Übersetzung. Neue Sprachen brauchen nur einen weiteren Schlüssel hier
  // plus die passenden en-Pendants in i18n.strings.js / den Inhaltsobjekten.
  const SUPPORTED = ["de", "en"];
  const DEFAULT_LANG = "de";

  // Zusammengeführte Wörterbücher (aus register-Aufrufen von i18n.strings.js).
  const DICT = { de: {}, en: {} };
  let lang = DEFAULT_LANG;

  function isSupported(l) {
    return SUPPORTED.indexOf(l) !== -1;
  }
  function normLang(l) {
    return isSupported(l) ? l : DEFAULT_LANG;
  }

  // Keys eines Bereichs namespacen ("home" + "todayTitle" -> "home.todayTitle"),
  // damit die Wörterbuch-Datei nur ihren eigenen Präfix beschreibt (kollisionsfrei).
  function prefixKeys(area, obj) {
    const out = {};
    if (!obj) return out;
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) out[area + "." + k] = obj[k];
    }
    return out;
  }

  // i18n.strings.js trägt seine Bereiche bei: register("home", {de…}, {en…}).
  function register(area, deObj, enObj) {
    Object.assign(DICT.de, prefixKeys(area, deObj));
    Object.assign(DICT.en, prefixKeys(area, enObj));
  }

  // Platzhalter {name} aus params füllen. Fehlt ein Platzhalter, bleibt er stehen
  // (sichtbar statt still verschluckt – erleichtert das Finden von Lücken).
  function interpolate(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (m, p) => (params[p] != null ? params[p] : m));
  }

  // UI-String holen. Fallback-Kette: aktive Sprache -> Deutsch -> der Key selbst
  // (sichtbar, aber crashfrei). Werte dürfen Funktionen sein (Pluralformen):
  //   inNDays: (p) => p.n === 1 ? "morgen" : `in ${p.n} Tagen`
  function t(key, params) {
    let s = DICT[lang][key];
    if (s == null) s = DICT.de[key];
    if (s == null) return key;
    if (typeof s === "function") return s(params || {});
    return interpolate(s, params);
  }

  function getLang() { return lang; }
  function setLang(l) { lang = normLang(l); return lang; }
  function init(l) { return setLang(l); }

  // Muttersprachliches Feld eines Inhaltsobjekts. Leerer/fehlender Wert -> obj.de.
  function nativeText(obj) {
    if (!obj) return "";
    const v = obj[lang];
    return (v != null && v !== "") ? v : (obj.de != null ? obj.de : "");
  }

  // Locale-Tag für Datums-/Zahlformatierung (toLocaleDateString u.ä.).
  function locale() {
    return lang === "en" ? "en-GB" : "de-DE";
  }

  window.SC.i18n = {
    SUPPORTED,
    register,
    t,
    getLang,
    setLang,
    init,
    nativeText,
    locale,
  };
  // Bequemer globaler Helfer – im selben Stil wie window.SC, damit ui.js/app.js
  // in Template-Strings schlicht t("…") schreiben können.
  window.t = t;
})();
