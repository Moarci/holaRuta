/*
 * matcher.js  (SC.matcher) – prüft getippte Antworten. REINE FUNKTIONEN.
 * Großzügig: ignoriert Groß-/Kleinschreibung, Akzente (á=a), Apostrophe und
 * Mehrfach-Leerzeichen und behandelt ß/ss als gleichwertig (Reise-Handys haben
 * oft keine ß-Taste). Slash und Gedankenstrich gelten als Wortgrenze.
 * Alles, was kein Buchstabe und keine Ziffer ist – Satzzeichen (¿¡?!.,;:),
 * Klammern, Währung ($/€), sonstige Symbole, Emojis, versehentlicher Tippmüll –
 * wird vor dem Vergleich entfernt. Antworten zählen also auch mit Fehleingaben.
 *
 * Bewusste Toleranz: die Akzent-Normalisierung (NFD) kollabiert auch ñ→n –
 * "ano" wird für "año" akzeptiert. Das ist gewollt: auf Tastaturen ohne ñ
 * wäre die Karte sonst unlösbar; die seltene echte Verwechslung (año/ano)
 * nehmen wir dafür in Kauf.
 *
 * Mehrere gültige Antworten: mit " / " getrennt (es UND de), explizit per
 * card.alt (nur Spanisch). Klammerzusätze sind OPTIONAL – siehe candidates().
 */
(function () {
  "use strict";

  function normalize(str) {
    return String(str)
      .toLowerCase()
      .replace(/ß/g, "ss")                   // ß ↔ ss gleichwertig
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")       // Akzente entfernen (á→a, ñ→n – bewusst, s.o.)
      .replace(/['’`´]/g, "")                // Apostrophe entfernen (geht's → gehts)
      .replace(/[\/\-–—]/g, " ")             // Slash, Binde-/Gedankenstrich als Wortgrenze
      .replace(/[^\p{L}\p{N} ]/gu, "")       // ALLES übrige (Satzzeichen, Währung, Symbole,
                                             // Emojis, Tippmüll) raus – siehe Kopfkommentar
      .replace(/\s+/g, " ")
      .trim();
  }

  // Wert des erwarteten Antwortfeldes einer Karte.
  // field: "es" (Spanisch) | "de" (Deutsch, Alias – hält Bestands-Tests grün)
  //        | "native" (Muttersprache = aktive UI-Sprache, via SC.i18n.nativeText).
  function fieldText(card, field) {
    if (field === "native") {
      const i18n = window.SC && window.SC.i18n;
      return i18n ? i18n.nativeText(card) : String(card.de);
    }
    return String(card[field]);
  }

  // Artikel-Toleranz fürs Englische: führendes the/a/an darf fehlen
  // ("the bus stop" == "bus stop"). Nur sinnvoll, wenn die Muttersprache gerade
  // Englisch ist – sonst (de/es) unverändert. Greift auf NORMALISIERTEN Text.
  function nativeIsEnglish(field) {
    const i18n = window.SC && window.SC.i18n;
    return field === "native" && i18n && i18n.getLang() === "en";
  }
  function stripArticle(norm) {
    return norm.replace(/^(?:the|a|an)\s+/, "");
  }

  // Anzeige-Antworten einer Karte (UNnormalisiert, z.B. fürs Vorlesen).
  // card.alt gilt nur für die spanische Antwort.
  function acceptedAnswers(card, field) {
    field = field || "es";
    if (field === "es" && Array.isArray(card.alt) && card.alt.length) return card.alt;
    return fieldText(card, field).split("/").map((s) => s.trim()).filter(Boolean);
  }

  // Kandidaten-Generierung: Liste akzeptierter NORMALISIERTER Eingaben.
  // Akzeptiert werden (für es ohne alt[] und für de gleichermaßen):
  //  - die wörtliche Volleingabe ("links / rechts" exakt wie angezeigt)
  //  - jede Slash-Alternative einzeln ("links", "rechts")
  //  - " – "/" — "-Teile (Preis-Karten: "$ 45.000 – Hostel-Nacht" → "45.000",
  //    "Hostel-Nacht")
  //  - Klammerzusätze sind optional: "1. (erster/erste)" → "1.", "erster",
  //    "erste" und die Volleingabe zählen alle.
  function candidates(card, field) {
    field = field || "es";
    const out = [];
    const stripEn = nativeIsEnglish(field);
    const add = (s) => {
      const n = normalize(s);
      if (n && out.indexOf(n) === -1) out.push(n);
      // Englische Muttersprache: zusätzlich die artikellose Form akzeptieren.
      if (stripEn && n) {
        const ns = stripArticle(n);
        if (ns && ns !== n && out.indexOf(ns) === -1) out.push(ns);
      }
    };

    // card.alt zählt nur für Spanisch und ersetzt dort die generierten Varianten.
    if (field === "es" && Array.isArray(card.alt) && card.alt.length) {
      card.alt.forEach(add);
      return out;
    }

    const raw = fieldText(card, field);
    // Varianten-Basis: Original, ohne Klammerzusätze, jeder Klammerinhalt einzeln.
    const variants = [raw, raw.replace(/\([^)]*\)/g, " ")];
    const parens = /\(([^)]*)\)/g;
    let m;
    while ((m = parens.exec(raw)) !== null) variants.push(m[1]);

    variants.forEach((v) => {
      add(v);                                 // Volleingabe der Variante
      v.split(/\/|\s[–—]\s/).forEach(add);    // jede Alternative einzeln
    });
    return out;
  }

  // Prüft Eingabe gegen eine Karte. -> { correct, answers }
  // field bestimmt die Zielsprache der erwarteten Antwort (siehe oben).
  function check(input, card, field) {
    const norm = normalize(input);
    const accepted = candidates(card, field);
    // Englische Muttersprache: auch die artikellose Eingabe gegen die Liste prüfen,
    // damit „the bus stop" und „bus stop" beidseitig passen.
    const tries = nativeIsEnglish(field) ? [norm, stripArticle(norm)] : [norm];
    const correct = tries.some((n) => n.length > 0 && accepted.indexOf(n) !== -1);
    return { correct, answers: acceptedAnswers(card, field) };
  }

  window.SC = window.SC || {};
  window.SC.matcher = { normalize, acceptedAnswers, candidates, check };
})();
