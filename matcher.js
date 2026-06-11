/*
 * matcher.js  (SC.matcher) – prüft getippte Antworten. REINE FUNKTIONEN.
 * Großzügig: ignoriert Groß-/Kleinschreibung, Akzente (á=a), Satzzeichen (¿¡?!.,)
 * und Mehrfach-Leerzeichen. Mehrere gültige Antworten werden mit " / " getrennt
 * oder explizit per card.alt angegeben.
 */
(function () {
  "use strict";

  function normalize(str) {
    return String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // Akzente entfernen (á→a)
      .replace(/[¿?¡!.,;:]/g, "")      // Satzzeichen entfernen
      .replace(/\s+/g, " ")
      .trim();
  }

  // Liste der akzeptierten Antworten einer Karte.
  // field: "es" (Standard, Spanisch) | "de" (Deutsch, für Richtung ES→DE).
  // card.alt gilt nur für die spanische Antwort.
  function acceptedAnswers(card, field) {
    field = field || "es";
    if (field === "es" && Array.isArray(card.alt) && card.alt.length) return card.alt;
    return String(card[field]).split("/").map((s) => s.trim()).filter(Boolean);
  }

  // Prüft Eingabe gegen eine Karte. -> { correct, answers }
  // field bestimmt die Zielsprache der erwarteten Antwort (siehe acceptedAnswers).
  function check(input, card, field) {
    const norm = normalize(input);
    const answers = acceptedAnswers(card, field);
    const correct = norm.length > 0 && answers.some((a) => normalize(a) === norm);
    return { correct, answers };
  }

  window.SC = window.SC || {};
  window.SC.matcher = { normalize, acceptedAnswers, check };
})();
