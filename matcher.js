/*
 * matcher.js  (SC.matcher) – prüft getippte Antworten. REINE FUNKTIONEN.
 * Großzügig: ignoriert Groß-/Kleinschreibung, Akzente (á=a), Satzzeichen
 * (¿¡?!.,;:), Klammern, Währungszeichen ($/€), Apostrophe, Mehrfach-Leerzeichen
 * und behandelt ß/ss als gleichwertig (Reise-Handys haben oft keine ß-Taste).
 * Slash und Gedankenstrich gelten als Wortgrenze.
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
      .replace(/[¿?¡!.,;:()$€"„“”«»]/g, "")  // Satzzeichen, Klammern, Währung entfernen
      .replace(/[\/\-–—]/g, " ")             // Slash, Binde-/Gedankenstrich als Wortgrenze
      .replace(/\s+/g, " ")
      .trim();
  }

  // Anzeige-Antworten einer Karte (UNnormalisiert, z.B. fürs Vorlesen).
  // field: "es" (Standard, Spanisch) | "de" (Deutsch, für Richtung ES→DE).
  // card.alt gilt nur für die spanische Antwort.
  function acceptedAnswers(card, field) {
    field = field || "es";
    if (field === "es" && Array.isArray(card.alt) && card.alt.length) return card.alt;
    return String(card[field]).split("/").map((s) => s.trim()).filter(Boolean);
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
    const add = (s) => {
      const n = normalize(s);
      if (n && out.indexOf(n) === -1) out.push(n);
    };

    // card.alt zählt nur für Spanisch und ersetzt dort die generierten Varianten.
    if (field === "es" && Array.isArray(card.alt) && card.alt.length) {
      card.alt.forEach(add);
      return out;
    }

    const raw = String(card[field]);
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
    const correct = norm.length > 0 && accepted.indexOf(norm) !== -1;
    return { correct, answers: acceptedAnswers(card, field) };
  }

  window.SC = window.SC || {};
  window.SC.matcher = { normalize, acceptedAnswers, candidates, check };
})();
