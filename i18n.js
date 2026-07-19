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
  const SUPPORTED = ["de", "en", "es"];
  const DEFAULT_LANG = "de";

  // Zusammengeführte Wörterbücher (aus register-Aufrufen von i18n.strings.js und
  // i18n.strings.es.js). Spanisch (es) ist die Muttersprache des Locals-Tracks.
  const DICT = { de: {}, en: {}, es: {} };
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

  // i18n.strings.js trägt seine Bereiche bei: register("home", {de…}, {en…}[, {es…}]).
  // esObj ist optional – fehlt es, fällt t() für Spanisch über die Kette es→en→de.
  function register(area, deObj, enObj, esObj) {
    Object.assign(DICT.de, prefixKeys(area, deObj));
    Object.assign(DICT.en, prefixKeys(area, enObj));
    if (esObj) Object.assign(DICT.es, prefixKeys(area, esObj));
  }

  // Ergänzende Strings für EINE Sprache (z. B. i18n.strings.es.js trägt nachträglich
  // spanische Bereiche bei, ohne die große de/en-Datei umzubauen).
  function registerLang(l, area, obj) {
    if (DICT[l]) Object.assign(DICT[l], prefixKeys(area, obj));
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

  // Locals-Track (Edition „es-en", Spanisch lernt Englisch) aktiv? Dann kehren
  // einzelne UI-Strings die Sprachrichtung um (siehe t()).
  function localsTrack() {
    const tr = window.SC && window.SC.track;
    return !!(tr && typeof tr.id === "function" && tr.id() === "es-en");
  }

  // HelloAbroad-Track (Edition „de-en", Deutsch lernt Reiseenglisch) aktiv?
  // Analog zu localsTrack(): einzelne UI-Strings tragen eine <key>DeEn-Variante,
  // die das reise-spanische Basiswording (Marken-/Modulnamen „Supervivencia",
  // „auf Spanisch"-Hinweise …) durch ein deutsch-englisches Pendant ersetzt.
  // Beide Tracks schließen sich aus (unterschiedliche id), daher keine Kollision.
  function deEnTrack() {
    const tr = window.SC && window.SC.track;
    return !!(tr && typeof tr.id === "function" && tr.id() === "de-en");
  }

  // UI-String holen. Fallback-Kette: aktive Sprache -> Deutsch -> der Key selbst
  // (sichtbar, aber crashfrei). Werte dürfen Funktionen sein (Pluralformen):
  //   inNDays: (p) => p.n === 1 ? "morgen" : `in ${p.n} Tagen`
  // langOverride (optional): eine FESTE Zielsprache statt der aktiven UI-Sprache.
  // Genutzt, wo ein String unabhängig von der UI-Chrome in einer bestimmten Sprache
  // stehen muss – z. B. die Kontext-Erklärung im Locals-Track, die immer in der L1
  // (Spanisch) der Lernenden bleibt. Ungültige/leere Werte fallen auf die aktive
  // Sprache zurück. Die Rückfall-Kette bleibt identisch, nur an L statt lang gehängt.
  function t(key, params, langOverride) {
    const L = (langOverride && DICT[langOverride]) ? langOverride : lang;
    let s;
    // Locals-Track: bevorzugt – falls vorhanden – die <key>Locals-Variante eines
    // Strings (z. B. „auf Englisch" statt „auf Spanisch"). BEWUSST ohne Sprach-
    // Rückfall: eine nur englische Variante darf die bereits korrekte spanische
    // Basiszeile der ES-UI nicht überschreiben. Fehlt die Variante in der aktiven
    // Sprache, greift unverändert der Basis-Key (Reise-Track bleibt unberührt).
    if (localsTrack()) s = DICT[L][key + "Locals"];
    // HelloAbroad-Track: bevorzugt die <key>DeEn-Variante (z. B. „Notfall-Sätze"
    // statt „Supervivencia", „auf Englisch" statt „auf Spanisch"). Gleiches Muster
    // wie Locals, gleiche bewusste Nicht-Rückfall-Semantik: fehlt die Variante,
    // greift unverändert der Basis-Key (Reise-Wording), nichts bricht.
    else if (deEnTrack()) s = DICT[L][key + "DeEn"];
    if (s == null) {
      s = DICT[L][key];
      // Fallback-Kette: aktive Sprache -> (für es: Englisch) -> Deutsch -> der Key.
      // Für ein spanischsprachiges Publikum ist Englisch der bessere Zwischen-Rückfall
      // als Deutsch (der Locals-Track ist ohnehin ES/EN); fehlt auch das, bleibt de.
      if (s == null && L === "es") s = DICT.en[key];
      if (s == null) s = DICT.de[key];
    }
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
    if (lang === "de") return de != null ? de : "";
    // "situationDe" -> Stamm "situation"; "title" -> "title".
    const stem = /De$/.test(base) ? base.slice(0, -2) : base;
    // Spanisch bevorzugt das …Es-Feld (z.B. labelEs). Fehlt es, ist das …En-Feld der
    // bessere Zwischenrückfall als der deutsche Basiswert (Inhalte ohne …Es-Pendant).
    if (lang === "es") {
      const es = obj[stem + "Es"];
      if (es != null && es !== "") return es;
    }
    const en = obj[stem + "En"];
    if (en != null && en !== "") return en;
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
        if (/(?:^en$|[A-Za-z]En$)/.test(k)) continue; // En-Hilfsfelder (auch roleAEn/goalBEn) nicht direkt kopieren
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
    if (lang === "en") return "en-GB";
    if (lang === "es") return "es-CO";
    return "de-DE";
  }

  // Schlüsselmengen der zusammengeführten UI-Wörterbücher – für den Paritäts-Test
  // (DE⟷EN) und Debugging. Read-only.
  function dictKeys() { return { de: Object.keys(DICT.de), en: Object.keys(DICT.en), es: Object.keys(DICT.es) }; }

  window.SC.i18n = {
    SUPPORTED,
    register,
    registerLang,
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
