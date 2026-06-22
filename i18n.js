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
  // SICHERHEITS-INVARIANTE: t()/interpolate escapen NICHT. Params werden roh
  // eingesetzt. Jede Aufrufstelle, die ein t()-Ergebnis mit nutzer-/ferngespeisten
  // Werten (Profilname, Reisename, Ranglisten-Name, Eingaben) in HTML schreibt, MUSS
  // das Gesamtergebnis durch esc() schicken (so wie es heute überall geschieht). Hier
  // NICHT zu escapen ist Absicht: sonst würde am Sink doppelt escapt (& -> &amp;amp;).
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

  // Wie nativeText, aber für Felder mit Suffix-Konvention (base + "En"), z.B.
  // { situationDe, situationEn } oder { title, titleEn } oder { d, dEn }.
  // base ist der deutsche Feldname (mit oder ohne "De"-Suffix). lang==="en" nimmt
  // base+"En", sonst (oder wenn leer/fehlend) den deutschen Wert. Sicher: fehlt
  // das En-Pendant, kommt automatisch der deutsche Text (Rückfall).
  function natKey(obj, base) {
    if (!obj) return "";
    const de = obj[base];
    if (lang === "en") {
      // "situationDe" -> "situationEn"; "title" -> "titleEn"
      const enKey = /De$/.test(base) ? base.slice(0, -2) + "En" : base + "En";
      const en = obj[enKey];
      if (en != null && en !== "") return en;
    }
    return de != null ? de : "";
  }

  // Den zu einem deutschen Feldnamen passenden En-Schlüssel bilden:
  //   "de" -> "en", "situationDe" -> "situationEn", "title" -> "titleEn",
  //   "d" -> "dEn". (Spiegelt die Konvention der Inhaltsdateien.)
  function enKeyFor(base) {
    if (base === "de") return "en";
    if (/De$/.test(base)) return base.slice(0, -2) + "En";
    return base + "En";
  }

  // Tiefe Lokalisierung: liefert für lang==="en" eine Kopie, in der jedes deutsche
  // Feld durch sein englisches Pendant (base+"En") ersetzt ist – rekursiv durch
  // Objekte und Arrays. Die …En-Hilfsfelder selbst werden im Ergebnis weggelassen.
  // Für lang==="de" wird der Wert unverändert zurückgegeben (kein Overhead).
  // So leuchten alle von den Inhaltsdateien ergänzten …En-Felder auf, ohne dass
  // jede einzelne Render-Stelle umgebaut werden muss (Pass-Through-Ansichten).
  function localizeDeep(value) {
    if (lang !== "en") return value;
    return _loc(value);
  }
  function _loc(value) {
    if (Array.isArray(value)) return value.map(_loc);
    if (value && typeof value === "object") {
      const out = {};
      for (const k in value) {
        if (!Object.prototype.hasOwnProperty.call(value, k)) continue;
        if (/(?:^en$|[a-z]En$)/.test(k)) continue; // En-Hilfsfelder nicht direkt kopieren
        const ek = enKeyFor(k);
        const en = value[ek];
        out[k] = (en != null && en !== "") ? _loc(en) : _loc(value[k]);
      }
      return out;
    }
    return value;
  }

  // Locale-Tag für Datums-/Zahlformatierung (toLocaleDateString u.ä.).
  function locale() {
    return lang === "en" ? "en-GB" : "de-DE";
  }

  // Schlüsselmengen der zusammengeführten UI-Wörterbücher – für den Paritäts-Test
  // (DE⟷EN) und Debugging. Read-only.
  function dictKeys() { return { de: Object.keys(DICT.de), en: Object.keys(DICT.en) }; }

  window.SC.i18n = {
    SUPPORTED,
    register,
    dictKeys,
    t,
    getLang,
    setLang,
    init,
    nativeText,
    natKey,
    localizeDeep,
    locale,
  };
  // Bequemer globaler Helfer – im selben Stil wie window.SC, damit ui.js/app.js
  // in Template-Strings schlicht t("…") schreiben können.
  window.t = t;
})();
