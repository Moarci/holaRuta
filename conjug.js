/*
 * conjug.js  (SC.conjug) – Generator für den Konjugations-Drill (Conjugador).
 * REINE FUNKTIONEN, kein Browser nötig. Baut aus der vorhandenen
 * data.CONJUGATION (regelmäßige Muster + unregelmäßige Verben) zufällige
 * Übungs-Items: „Verb + Person → tippe die Form". Die Wörterbasis bleibt
 * unangetastet – hier wird nur additiv aus bestehenden Daten gezogen.
 *
 * Stufen:
 *   level 1 = nur die drei regelmäßigen Muster (-ar/-er/-ir)
 *   level 2 = zusätzlich die wichtigsten unregelmäßigen Reiseverben
 *
 * Ein Item: { verb, verbHint, personEs, personDe, answer }
 *   answer = die korrekte konjugierte Form (forms[personIndex]).
 */
(function () {
  "use strict";

  function randInt(lo, hi) {
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  // Aus dem title eines regelmäßigen Musters den Infinitiv ziehen.
  // "-ar · doblar (abbiegen)" -> "doblar".  Fällt sauber auf den ganzen
  // title zurück, falls das Format mal abweicht.
  function infinitiveFromTitle(title) {
    const m = String(title || "").match(/·\s*([a-zá-úñ]+)/i);
    return m ? m[1] : String(title || "").trim();
  }

  // Flache Verbliste je Stufe: { verb, hint, forms[] }.
  function verbPool(conjugation, level) {
    const pool = [];
    const reg = (conjugation && conjugation.regular) || [];
    reg.forEach((v) => {
      pool.push({ verb: infinitiveFromTitle(v.title), hint: v.title, forms: v.forms });
    });
    if ((Number(level) || 1) >= 2) {
      const irr = (conjugation && conjugation.irregular) || [];
      irr.forEach((v) => {
        pool.push({ verb: v.verb, hint: v.verb + " – " + v.verbDe, forms: v.forms });
      });
    }
    return pool;
  }

  // Wie viele distinkte Verb×Person-Items sind in dieser Stufe überhaupt möglich?
  function poolSize(conjugation, level) {
    const persons = (conjugation && conjugation.persons) || [];
    return verbPool(conjugation, level).length * persons.length;
  }

  function makeItem(v, persons, pi) {
    return {
      verb: v.verb,
      verbHint: v.hint,
      personEs: persons[pi].es,
      personDe: persons[pi].de,
      answer: v.forms[pi],
    };
  }

  // Eine Runde aus count Items bauen. Vermeidet exakte Verb×Person-Dubletten,
  // solange die Stufe genug Kombinationen hergibt (sonst mit Wiederholung füllen).
  function buildRound(conjugation, level, count) {
    const n = Math.max(1, Number(count) || 10);
    const persons = (conjugation && conjugation.persons) || [];
    const pool = verbPool(conjugation, level);
    const out = [];
    if (!pool.length || !persons.length) return out;

    const seen = new Set();
    let guard = 0;
    while (out.length < n && guard < n * 40) {
      guard += 1;
      const v = pool[randInt(0, pool.length - 1)];
      const pi = randInt(0, persons.length - 1);
      const key = v.verb + "#" + pi;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(makeItem(v, persons, pi));
    }
    // Spanne zu klein für lauter distinkte Items? Mit Wiederholungen auffüllen.
    while (out.length < n) {
      const v = pool[randInt(0, pool.length - 1)];
      const pi = randInt(0, persons.length - 1);
      out.push(makeItem(v, persons, pi));
    }
    return out;
  }

  window.SC = window.SC || {};
  window.SC.conjug = { buildRound, verbPool, poolSize, infinitiveFromTitle };
})();
