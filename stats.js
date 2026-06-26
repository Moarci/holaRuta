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
  // Ab diesem Intervall (Tage) gilt eine Karte als "gemeistert" (kommt erst in ~1 Woche wieder).
  const MASTERED_DAYS = 5;
  // Ab diesem Intervall (Tage), aber noch unter MASTERED_DAYS, gilt eine Karte als
  // "fast geschafft" (in Festigung) – eine Zwischenstufe von "am Lernen", damit der
  // Fortschritt zur Meisterung sichtbar wird und "0 gemeistert" am Anfang nicht entmutigt.
  const FIRMING_DAYS = 3;
  // Unter dieser Trefferquote (%) bei >=2 Wiederholungen gilt eine Karte als "schwierig".
  const HARD_BELOW = 60;
  // Grobe Schätzung: so viele Bewertungen ("Touches") braucht eine neue Karte im
  // Schnitt, bis sie "gemeistert" ist (interval >= MASTERED_DAYS). KEINE exakte
  // SRS-Simulation – bewusst konservativ. Die Reise-Prognose (tripForecast) rechnet
  // damit das geplante Tages-Budget in "voraussichtlich gemeistert" um; die UI sagt
  // deshalb immer "rund/etwa", nie eine exakte Zahl.
  const REVIEWS_PER_CARD = 3;
  // Pace-Schwellen: tatsächliches Tempo / Tagesziel. Ab 0.9 "auf Kurs",
  // ab 0.5 "etwas zu langsam", darunter "im Rückstand".
  const PACE_ON_TRACK = 0.9;
  const PACE_SLIGHTLY = 0.5;

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
      // Fast geschafft: noch "am Lernen", aber Intervall schon nahe an der Meisterung.
      // Teilmenge von status === "learning" (verändert die Drei-Stufen-Verteilung nicht).
      firming: status === "learning" && (r.interval || 0) >= FIRMING_DAYS,
    };
  }

  // Gesamtauswertung über eine Kartenliste + progress-Map.
  function overview(cards, progress) {
    let neu = 0, learning = 0, mastered = 0, firming = 0;
    let totalSeen = 0, totalCorrect = 0;
    let firstTry = 0, needPractice = 0, hard = 0;

    cards.forEach((c) => {
      const s = cardSummary(progress[c.id]);
      if (s.status === "new") neu++;
      else if (s.status === "mastered") mastered++;
      else learning++;
      if (s.firming) firming++; // Teilmenge von "learning"

      totalSeen += s.seen;
      totalCorrect += s.correct;
      if (s.seen > 0) (s.firstTry ? firstTry++ : needPractice++);
      if (s.hard) hard++;
    });

    return {
      total: cards.length,
      neu, learning, mastered, firming,
      seenCards: learning + mastered,
      rate: totalSeen ? Math.round((totalCorrect / totalSeen) * 100) : null,
      firstTry, needPractice, hard,
      totalSeen,
    };
  }

  // Reise-Prognose: verrechnet das Tagesziel (perDay) und die Tage bis zur Abreise
  // (daysLeft) mit dem echten Fortschritt (mastered/total) und dem zuletzt tatsächlich
  // gelernten Schnitt (recentAvg). Liefert eine ehrliche, bewusst grobe Schätzung
  // "voraussichtlich X % gemeistert bis zur Abreise" plus einen Pace-Check gegen das
  // reale Tempo. REIN, wirft nie. null nur, wenn die Eckdaten unbrauchbar sind.
  //
  //   p = { total, mastered, perDay, daysLeft, recentAvg }
  //
  // Annahme: pro neuer Karte ~REVIEWS_PER_CARD Bewertungen bis "gemeistert". Daraus:
  //   budget          = max(0, daysLeft) * perDay   (geplante Bewertungen bis Abreise)
  //   projectedNew    = floor(budget / REVIEWS_PER_CARD)   (neu gemeisterte Karten)
  //   projectedMaster = min(total, mastered + projectedNew)
  function tripForecast(p) {
    const o = p || {};
    const total = Math.max(0, Math.round(o.total || 0));
    if (total <= 0) return null;
    const perDay = Math.max(0, Math.round(o.perDay || 0));
    if (perDay <= 0) return null;

    const mastered = Math.min(total, Math.max(0, Math.round(o.mastered || 0)));
    const daysLeft = Math.max(0, Math.round(o.daysLeft || 0));
    const recentAvg = Math.max(0, Number(o.recentAvg) || 0);
    const hasHistory = !!o.hasHistory;

    const nowPct = Math.round((mastered / total) * 100);

    // Schon alles gemeistert -> feierlicher "fertig"-Zustand, keine Empfehlung.
    if (mastered >= total) {
      return {
        done: true,
        nowPct: 100,
        projectedMastered: total,
        projectedNew: 0,
        projectedPct: 100,
        budget: daysLeft * perDay,
        remaining: 0,
        pace: { recentAvg: Math.round(recentAvg * 10) / 10, ratio: null, verdict: "done", recommendedPerDay: 0 },
      };
    }

    const remaining = total - mastered; // noch nicht gemeisterte Karten
    const budget = daysLeft * perDay;
    const projectedNew = Math.floor(budget / REVIEWS_PER_CARD);
    const projectedMastered = Math.min(total, mastered + projectedNew);
    const projectedPct = Math.round((projectedMastered / total) * 100);

    // Pace-Check: realer Schnitt vs. Tagesziel. Ohne jede Lernhistorie ermutigen
    // (noHistory) statt tadeln. recommendedPerDay = was nötig wäre, um den Rest bis
    // zur Abreise zu schaffen – nur sinnvoll, wenn noch Tage übrig sind.
    // perDay ist hier garantiert >= 1 (frühe Rückgabe oben), daher kein Guard nötig.
    const ratio = recentAvg / perDay;
    let verdict;
    if (!hasHistory && recentAvg <= 0) verdict = "noHistory";
    else if (ratio >= PACE_ON_TRACK) verdict = "onTrack";
    else if (ratio >= PACE_SLIGHTLY) verdict = "slightlyBehind";
    else verdict = "behind";

    let recommendedPerDay = 0;
    if (daysLeft > 0) {
      recommendedPerDay = Math.ceil((remaining * REVIEWS_PER_CARD) / daysLeft);
    }

    return {
      done: false,
      nowPct,
      projectedMastered,
      projectedNew,
      projectedPct,
      budget,
      remaining,
      pace: {
        recentAvg: Math.round(recentAvg * 10) / 10,
        ratio: Math.round(ratio * 100) / 100,
        verdict,
        recommendedPerDay,
      },
    };
  }

  // Reise-„Startklar"-Meilensteine: Mastery-Schwellen (% gemeistert) bis zur Abreise.
  const TRIP_MILESTONES = [25, 50, 75, 100];
  // Welche Schwellen sind bei einem Mastery-Stand pct (%) erreicht? REIN.
  function reachedTripMilestones(pct) {
    const p = Number(pct);
    if (!isFinite(p)) return [];
    return TRIP_MILESTONES.filter((m) => p >= m);
  }
  // Davon die noch nicht „gesehenen" (seen = Map Schwelle->Zeitstempel) – also die,
  // die gerade frisch zum Feiern anstehen. REIN. (seen-Keys sind nach JSON Strings;
  // der Zugriff seen[m] mit numerischem m greift dank Coercion trotzdem.)
  function freshTripMilestones(pct, seen) {
    const s = seen || {};
    return reachedTripMilestones(pct).filter((m) => !s[m]);
  }

  // Kanonische CEFR-Reihenfolge der angezeigten Niveaus (Quick-Check kennt "B1-"
  // als „nahe B1", der ausführliche Nivel-Test die echten B1/B2/C1). Unbekannte
  // Strings landen – alphabetisch – hinter den bekannten.
  const CEFR_ORDER = ["A0", "A1", "A2", "B1-", "B1", "B2", "C1"];

  // Das anzuzeigende Niveau eines Schülers: der ausführliche Nivel-Test hat Vorrang
  // vor dem Quick-Check (genauer). Ohne beides -> null (= noch nicht getestet).
  function studentLevel(student) {
    const r = (student && (student.assessment || student.placement)) || null;
    return r && typeof r.level === "string" && r.level ? r.level : null;
  }

  // Niveau-Verteilung einer Klasse: zählt die importierten Schüler je CEFR-Stufe,
  // gibt die belegten Stufen in kanonischer Reihenfolge zurück (für Gruppenbildung)
  // plus die Zahl der noch nicht getesteten. REIN – kein Speicher/UI.
  function levelDistribution(students) {
    const list = Array.isArray(students) ? students : [];
    const counts = Object.create(null);
    let tested = 0;
    list.forEach((s) => {
      const lv = studentLevel(s);
      if (lv) { counts[lv] = (counts[lv] || 0) + 1; tested++; }
    });
    const known = CEFR_ORDER.filter((lv) => counts[lv]);
    const extra = Object.keys(counts).filter((lv) => CEFR_ORDER.indexOf(lv) < 0).sort();
    const buckets = known.concat(extra).map((lv) => ({ level: lv, count: counts[lv] }));
    const max = buckets.reduce((m, b) => Math.max(m, b.count), 0);
    return { buckets, max, tested, untested: list.length - tested, total: list.length };
  }

  // Rang eines Niveaus für die Sortierung; „noch nicht getestet" (null/unbekannt)
  // sortiert unter A0 (-1), damit ungetestete Schüler beim Aufsteigend-Sortieren oben
  // als „kümmern" sichtbar werden.
  function levelRank(level) {
    const i = CEFR_ORDER.indexOf(level);
    return i < 0 ? -1 : i;
  }

  // Sortier-Schlüssel der Klassentabelle -> Wert-Extraktor. Reine Lese-Funktionen.
  const SORT_KEYS = {
    name:       (s) => String((s && s.name) || "").toLowerCase(),
    level:      (s) => levelRank(studentLevel(s)),
    mastered:   (s) => (s && s.cardsMastered) || 0,
    streak:     (s) => (s && s.streak) || 0,
    challenges: (s) => (s && s.challenges) || 0,
    pretrip:    (s) => (s && s.pretripDays) || 0,
  };

  // Klassenliste sortieren (neue Liste). dir: 1 aufsteigend, -1 absteigend.
  // Stabiler Tie-Break über den Namen, damit gleiche Werte deterministisch stehen.
  function sortRoster(students, key, dir) {
    const list = Array.isArray(students) ? students.slice() : [];
    const get = SORT_KEYS[key] || SORT_KEYS.name;
    const d = dir < 0 ? -1 : 1;
    return list.sort((a, b) => {
      const va = get(a), vb = get(b);
      if (va < vb) return -1 * d;
      if (va > vb) return 1 * d;
      const na = SORT_KEYS.name(a), nb = SORT_KEYS.name(b);
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
  }

  // Einen Schüler in die Liste einfügen ODER einen gleichnamigen ersetzen (Re-Import
  // eines aktualisierten Backups soll keine Dublette erzeugen). Vergleich case-/
  // whitespace-tolerant. Gibt die neue Liste + ob ersetzt wurde zurück. REIN.
  function upsertStudent(roster, summary) {
    const list = Array.isArray(roster) ? roster.slice() : [];
    if (!summary) return { roster: list, replaced: false };
    const norm = (n) => String(n || "").trim().toLowerCase();
    const key = norm(summary.name);
    const at = key ? list.findIndex((s) => norm(s.name) === key) : -1;
    if (at >= 0) { list[at] = summary; return { roster: list, replaced: true }; }
    list.push(summary);
    return { roster: list, replaced: false };
  }

  // Eine CSV-Zelle quoten (RFC-4180-nah): Felder mit Komma/Quote/Zeilenumbruch
  // werden in Anführungszeichen gesetzt, interne Quotes verdoppelt.
  function csvCell(v) {
    const s = String(v == null ? "" : v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // Eine Schüler-Zeile in fester Spaltenreihenfolge (passend zu rosterCSV-Header).
  function rosterRow(s) {
    const res = (s && (s.assessment || s.placement)) || null;
    const score = res && typeof res.finalScore === "number" ? Math.round(res.finalScore * 100) + "%" : "";
    const packs = Array.isArray(s && s.masteredCats) ? s.masteredCats.join("; ") : "";
    return [
      (s && s.name) || "", studentLevel(s) || "", score,
      (s && s.cardsMastered) || 0, (s && s.totalCards) || 0,
      (s && s.streak) || 0, (s && s.challenges) || 0,
      ((s && s.pretripDays) || 0) + "/" + ((s && s.pretripMax) || 0), packs,
    ];
  }

  // Klassenliste als CSV (CRLF, Excel-freundlich). headerRow = lokalisierte
  // Spaltenüberschriften in derselben Reihenfolge wie rosterRow (9 Spalten). REIN.
  function rosterCSV(students, headerRow) {
    const list = Array.isArray(students) ? students : [];
    const rows = [];
    if (Array.isArray(headerRow) && headerRow.length) rows.push(headerRow);
    list.forEach((s) => rows.push(rosterRow(s)));
    return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  }

  window.SC = window.SC || {};
  window.SC.stats = {
    record, statusOf, cardSummary, overview, tripForecast,
    reachedTripMilestones, freshTripMilestones,
    levelDistribution, studentLevel, levelRank, sortRoster, upsertStudent, rosterCSV,
    CEFR_ORDER, HARD_BELOW, MASTERED_DAYS, FIRMING_DAYS, REVIEWS_PER_CARD, TRIP_MILESTONES,
  };
})();
