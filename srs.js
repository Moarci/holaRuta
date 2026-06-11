/*
 * srs.js  (SC.srs) – Spaced Repetition, vereinfachtes SM-2. REINE FUNKTIONEN.
 * Kennt weder UI noch Speicher. Nimmt einen Zustand + Bewertung, gibt NEUEN
 * Zustand zurück (immutabel – nie das Original verändern).
 *
 * Karten-Lernzustand: { ease, interval(Tage), due(ms), reps }
 */
(function () {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const RATING = { AGAIN: "again", GOOD: "good", EASY: "easy" };

  function freshState() {
    return { ease: 2.5, interval: 0, due: 0, reps: 0 };
  }

  function review(state, rating) {
    const s = state || freshState();
    let ease = s.ease;
    const reps = s.reps;
    const interval = s.interval;

    if (rating === RATING.AGAIN) {
      return {
        ease: Math.max(1.3, ease - 0.2),
        interval: 0,
        reps: 0,
        due: Date.now() + 60 * 1000, // ~1 Minute -> in derselben Sitzung nochmal
      };
    }

    if (rating === RATING.EASY) ease += 0.15;

    let nextInterval;
    if (reps === 0) nextInterval = rating === RATING.EASY ? 3 : 1;
    else if (reps === 1) nextInterval = rating === RATING.EASY ? 6 : 3;
    else nextInterval = Math.round((interval || 1) * ease);

    return {
      ease: Math.min(3.0, ease),
      interval: nextInterval,
      reps: reps + 1,
      due: Date.now() + nextInterval * DAY_MS,
    };
  }

  function isDue(state) {
    if (!state || !state.due) return true; // neu -> sofort fällig
    return state.due <= Date.now();
  }

  window.SC = window.SC || {};
  window.SC.srs = { RATING, freshState, review, isDue };
})();
