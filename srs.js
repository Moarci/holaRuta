/*
 * srs.js  (SC.srs) – Spaced Repetition, vereinfachtes SM-2. REINE FUNKTIONEN.
 * Kennt weder UI noch Speicher. Nimmt einen Zustand + Bewertung, gibt NEUEN
 * Zustand zurück (immutabel – nie das Original verändern).
 *
 * Karten-Lernzustand: { ease, interval(Tage), due(ms), reps }
 *
 * Robustheit: korrupte Eingaben (Strings, NaN, null aus manipuliertem
 * localStorage) werden auf Defaults gezogen, ease ist auf [1.3, 3.0]
 * geklemmt – auf ALLEN Pfaden. So kann nie NaN/0 persistiert werden.
 */
(function () {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const RATING = { AGAIN: "again", GOOD: "good", EASY: "easy" };
  const EASE_MIN = 1.3;
  const EASE_MAX = 3.0;

  // Endliche Zahl oder Default (Schutz vor NaN/Strings/null).
  function num(x, fallback) {
    return typeof x === "number" && isFinite(x) ? x : fallback;
  }

  function clampEase(e) {
    return Math.min(EASE_MAX, Math.max(EASE_MIN, e));
  }

  // Lokale Mitternacht des Tages "heute + days". Karten mit Intervall >= 1 Tag
  // sind so den GANZEN Zieltag fällig – sonst klebt die Fälligkeit an der
  // Uhrzeit der Bewertung (23:30 bewertet -> am Folgetag um 21:00 noch nicht
  // fällig). Über Date gerechnet, damit Sommer-/Winterzeit korrekt bleibt.
  function dueAtMidnight(now, days) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d.getTime();
  }

  function freshState() {
    return { ease: 2.5, interval: 0, due: 0, reps: 0 };
  }

  // now ist optional (Default: Date.now()) – macht die Funktion testbar und
  // hält alle Zeitrechnungen einer Bewertung auf demselben Zeitpunkt.
  function review(state, rating, now) {
    const t = typeof now === "number" && isFinite(now) ? now : Date.now();
    const s = state || freshState();
    let ease = clampEase(num(s.ease, 2.5));
    const reps = Math.max(0, num(s.reps, 0));
    const interval = Math.max(0, num(s.interval, 0));
    const due = num(s.due, 0);

    if (rating === RATING.AGAIN) {
      return {
        ease: clampEase(ease - 0.2),
        interval: 0,
        reps: 0,
        due: t + 60 * 1000, // ~1 Minute -> in derselben Sitzung nochmal
      };
    }

    if (rating === RATING.EASY) ease = clampEase(ease + 0.15);

    let nextInterval;
    if (reps === 0) nextInterval = rating === RATING.EASY ? 3 : 1;
    else if (reps === 1) nextInterval = rating === RATING.EASY ? 6 : 3;
    else {
      // Early-Review-Dämpfung: wird eine noch nicht fällige Karte bewertet
      // (freies Üben), zählt nur die tatsächlich verstrichene Zeit seit der
      // letzten Bewertung – sonst springt z.B. eine erst in 29 Tagen fällige
      // Karte bei GOOD sofort auf ~75 Tage (Intervall-Inflation).
      let base = interval || 1;
      if (due > t) {
        const elapsedDays = interval - (due - t) / DAY_MS;
        base = Math.max(1, Math.min(base, elapsedDays)); // Untergrenze 1 Tag
      }
      nextInterval = Math.max(1, Math.round(base * ease));
    }

    return {
      ease,
      interval: nextInterval,
      reps: reps + 1,
      due: dueAtMidnight(t, nextInterval),
    };
  }

  function isDue(state) {
    if (!state || !state.due) return true; // neu -> sofort fällig
    return state.due <= Date.now();
  }

  window.SC = window.SC || {};
  window.SC.srs = { RATING, freshState, review, isDue };
})();
