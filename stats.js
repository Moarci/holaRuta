/*
 * stats.js  (SC.stats) – Auswertung pro Karte. REINE FUNKTIONEN, kein Speicher/UI.
 *
 * Der Lern-Datensatz einer Karte (in progress[id]) trägt zusätzlich zu den
 * SRS-Feldern (ease, interval, due, reps) folgende Statistik-Felder:
 *   seen        – wie oft insgesamt bewertet
 *   again/good/easy – Zähler je Bewertung
 *   lapses      – wie oft eine bereits gelernte Karte wieder vergessen wurde
 *   firstAt/lastAt  – Zeitstempel (ms) erste/letzte Bewertung
 *   firstRating – allererste Bewertung ('again' | 'good' | 'easy')
 *   history     – kompakter Verlauf, je Bewertung ein Zeichen: a|g|e (max. 50)
 *
 * Alte Datensätze (nur SRS-Felder) werden überall als 0/leer behandelt.
 */
(function () {
  "use strict";

  const HISTORY_MAX = 50;
  // Ab diesem Intervall (Tage) gilt eine Karte als "gemeistert" (kommt erst in 1 Woche+ wieder).
  const MASTERED_DAYS = 7;
  // Unter dieser Trefferquote (%) bei >=2 Wiederholungen gilt eine Karte als "schwierig".
  const HARD_BELOW = 60;

  // Verbucht eine Bewertung. srsNext = bereits berechneter SRS-Zustand.
  // Gibt einen NEUEN, zusammengeführten Datensatz zurück (immutabel).
  function record(prev, srsNext, rating, now) {
    const p = prev || {};
    const hadReps = (p.reps || 0) > 0; // war schon gelernt -> 'again' = Rückfall
    const history = (Array.isArray(p.history) ? p.history : []).slice(-(HISTORY_MAX - 1));
    history.push(rating.charAt(0)); // 'a' | 'g' | 'e'

    return Object.assign({}, srsNext, {
      seen: (p.seen || 0) + 1,
      again: (p.again || 0) + (rating === "again" ? 1 : 0),
      good: (p.good || 0) + (rating === "good" ? 1 : 0),
      easy: (p.easy || 0) + (rating === "easy" ? 1 : 0),
      lapses: (p.lapses || 0) + (rating === "again" && hadReps ? 1 : 0),
      firstAt: p.firstAt || now,
      lastAt: now,
      firstRating: p.firstRating || rating,
      history,
    });
  }

  // Status einer Karte: 'new' | 'learning' | 'mastered'.
  function statusOf(r) {
    if (!r || !r.seen) return "new";
    if ((r.interval || 0) >= MASTERED_DAYS) return "mastered";
    return "learning";
  }

  // Einheitliche Auswertung eines Karten-Datensatzes (auch für unbekannte/alte).
  function cardSummary(rec) {
    const r = rec || {};
    const seen = r.seen || 0;
    const again = r.again || 0;
    const good = r.good || 0;
    const easy = r.easy || 0;
    const correct = good + easy;
    const rate = seen ? Math.round((correct / seen) * 100) : null;
    const status = statusOf(r);
    return {
      seen, again, good, easy,
      correct,
      lapses: r.lapses || 0,
      rate,                              // Trefferquote in % oder null (nie gesehen)
      status,
      firstAt: r.firstAt || null,
      lastAt: r.lastAt || null,
      firstRating: r.firstRating || null,
      reps: r.reps || 0,
      ease: r.ease || null,
      interval: r.interval || 0,
      due: r.due || 0,
      history: Array.isArray(r.history) ? r.history : [],
      // Auf Anhieb gewusst: erste Bewertung Gut/Einfach und nie "Nochmal".
      firstTry: seen > 0 && r.firstRating && r.firstRating !== "again" && again === 0,
      // Schwierig: mehrfach gesehen, aber niedrige Trefferquote.
      hard: seen >= 2 && rate !== null && rate < HARD_BELOW,
    };
  }

  // Gesamtauswertung über eine Kartenliste + progress-Map.
  function overview(cards, progress) {
    let neu = 0, learning = 0, mastered = 0;
    let totalSeen = 0, totalCorrect = 0;
    let firstTry = 0, needPractice = 0, hard = 0;

    cards.forEach((c) => {
      const s = cardSummary(progress[c.id]);
      if (s.status === "new") neu++;
      else if (s.status === "mastered") mastered++;
      else learning++;

      totalSeen += s.seen;
      totalCorrect += s.correct;
      if (s.seen > 0) (s.firstTry ? firstTry++ : needPractice++);
      if (s.hard) hard++;
    });

    return {
      total: cards.length,
      neu, learning, mastered,
      seenCards: learning + mastered,
      rate: totalSeen ? Math.round((totalCorrect / totalSeen) * 100) : null,
      firstTry, needPractice, hard,
      totalSeen,
    };
  }

  window.SC = window.SC || {};
  window.SC.stats = { record, statusOf, cardSummary, overview, HARD_BELOW, MASTERED_DAYS };
})();
