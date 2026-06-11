/*
 * badges.js  (SC.badges) – "Mein Ruta-Pass": Stempel/Erfolge fürs Reise-Lernen.
 * REINE FUNKTIONEN + REINE DATEN, kennt weder UI noch Speicher.
 *
 * Idee: Badges fühlen sich an wie kleine Reisestempel im Pass. Sie belohnen
 * nicht nur "viel gelernt", sondern verschiedene Arten von Fortschritt:
 * Lernmenge, Regelmäßigkeit (Streak), Kategorien-Meisterschaft und Spezielles.
 *
 * Datenfluss:  progress + counters --buildMetrics--> metrics --evaluate--> Liste
 *
 * Ein Badge ist reine Beschreibung. Ob es freigeschaltet ist, ergibt sich aus
 * einer Metrik (metric) und einer Schwelle (threshold) – so bleibt die Logik
 * generisch und neue Badges sind nur ein Eintrag im Array.
 *
 * type:
 *   "counter"         – metrics[metric] >= threshold (z.B. cardsReviewed >= 50)
 *   "flag"            – metrics[metric] === true (z.B. nightOwl)
 *   "categoryMastery" – Anteil gemeisterter Karten einer Kategorie >= threshold
 *   "allReviewed"     – alle Karten mindestens einmal gelernt (Schwelle = Gesamt)
 *
 * Optionale Felder:
 *   secret  – Badge wird als "???" angezeigt, solange es nicht freigeschaltet ist.
 */
(function () {
  "use strict";

  // "Gemeistert" ist die Wahrheit aus stats.js (SC.stats.statusOf). Wir greifen
  // darauf zu, statt die Regel (interval >= 7) zu duplizieren – so können
  // Statistik und Ruta-Pass nie auseinanderlaufen. Der Fallback greift nur, falls
  // stats (noch) nicht geladen ist (Graceful Degradation, eigenständig testbar).
  const MASTERED_DAYS_FALLBACK = 7;
  function isMastered(r) {
    const st = window.SC && window.SC.stats;
    if (st && st.statusOf) return st.statusOf(r) === "mastered";
    return (r.seen || 0) > 0 && (r.interval || 0) >= MASTERED_DAYS_FALLBACK;
  }

  // Gruppen für die Anzeige im Ruta-Pass.
  const GROUPS = [
    { id: "learning", label: "Lernreise",   icon: "🧭" },
    { id: "streak",   label: "Dranbleiben", icon: "🔥" },
    { id: "category", label: "Bereiche",    icon: "🗂️" },
    { id: "special",  label: "Spezial",     icon: "✨" },
  ];

  // Kategorie-Badges (80 % einer Kategorie gemeistert). Reise-/Hostel-Namen im
  // HolaRuta-Stil. Die category-Id muss einer Kategorie in data.js entsprechen.
  const CATEGORY_BADGES = [
    { category: "basics",  icon: "💬", name: "Erste Worte",         description: "Meistere 80 % der Grundlagen-Karten." },
    { category: "zahlen",  icon: "🔢", name: "Zahlen-Zähmer",       description: "Meistere 80 % der Zahlen-Karten." },
    { category: "essen",   icon: "🌮", name: "Taco Tactician",      description: "Meistere 80 % der Essen-Karten." },
    { category: "trinken", icon: "🥤", name: "Agua, por favor",     description: "Meistere 80 % der Trinken-Karten." },
    { category: "hotel",   icon: "🛏️", name: "Dorm Diplomat",       description: "Meistere 80 % der Hotel-Karten." },
    { category: "verkehr", icon: "🚌", name: "Busbahnhof-Boss",     description: "Meistere 80 % der Verkehr-Karten." },
    { category: "compras", icon: "🛍️", name: "Markt-Meister",       description: "Meistere 80 % der Einkaufen-Karten." },
    { category: "dinero",  icon: "💵", name: "Peso-Profi",          description: "Meistere 80 % der Geld-Karten." },
    { category: "notfall", icon: "🆘", name: "Calm in Chaos",       description: "Meistere 80 % der Notfall-Karten." },
    { category: "zeit",    icon: "⏰", name: "Pünktlich auf Ruta",   description: "Meistere 80 % der Zeit-Karten." },
    { category: "talk",    icon: "🤝", name: "Conversation Starter", description: "Meistere 80 % der Smalltalk-Karten." },
    { category: "alltag",  icon: "🏙️", name: "Alltags-Held",        description: "Meistere 80 % der Alltag-Karten." },
    { category: "frases",  icon: "🙋", name: "Satz-Sammler",        description: "Meistere 80 % der Sätze-Karten." },
    { category: "grenze",  icon: "🛂", name: "Grenzgänger",         description: "Meistere 80 % der Behörden-Karten." },
    { category: "reise",   icon: "🚐", name: "Roadtrip-Ready",      description: "Meistere 80 % der Busreise-Karten." },
  ].map((b) => Object.assign({
    id: "cat_" + b.category,
    group: "category",
    type: "categoryMastery",
    threshold: 0.8,
    unlockedText: "Du kommst in diesem Bereich sprachlich klar. 🎒",
  }, b));

  const BADGES = [
    // ---------- Lernreise (Lernmenge) ----------
    { id: "first_steps",     group: "learning", icon: "👣", name: "Erste Schritte",        type: "counter", metric: "cardsReviewed", threshold: 1,
      description: "Lerne deine erste Karte.",            unlockedText: "Dein erster Schritt auf der Ruta ist gemacht." },
    { id: "ten_cards",       group: "learning", icon: "🎒", name: "10 Wörter im Rucksack",  type: "counter", metric: "cardsReviewed", threshold: 10,
      description: "Lerne 10 verschiedene Karten.",       unlockedText: "Dein Reise-Spanisch kommt in Fahrt." },
    { id: "fifty_cards",     group: "learning", icon: "📘", name: "Halber Reiseführer",     type: "counter", metric: "cardsReviewed", threshold: 50,
      description: "Lerne 50 verschiedene Karten.",       unlockedText: "Genug Spanisch für viele Alltagssituationen." },
    { id: "hundred_cards",   group: "learning", icon: "🧭", name: "Ruta Rookie",            type: "counter", metric: "cardsReviewed", threshold: 100,
      description: "Lerne 100 verschiedene Karten.",      unlockedText: "Du findest dich sprachlich unterwegs zurecht." },
    { id: "twohundred_cards",group: "learning", icon: "🧠", name: "Backpack Brain",         type: "counter", metric: "cardsReviewed", threshold: 200,
      description: "Lerne 200 verschiedene Karten.",      unlockedText: "Dein Kopf ist offiziell reisefertig gepackt." },
    { id: "all_cards",       group: "learning", icon: "🌎", name: "HolaRuta Legend",        type: "allReviewed",
      description: "Lerne alle Karten mindestens einmal.", unlockedText: "Du hast das komplette Reise-Deck durchgespielt." },
    { id: "master_10",       group: "learning", icon: "🏅", name: "Erste Meisterschaft",    type: "counter", metric: "cardsMastered", threshold: 10,
      description: "Meistere 10 Karten (Intervall ≥ 7 Tage).", unlockedText: "Zehn Karten sitzen langfristig. Stark!" },
    { id: "master_50",       group: "learning", icon: "🏆", name: "Routinier",              type: "counter", metric: "cardsMastered", threshold: 50,
      description: "Meistere 50 Karten.",                 unlockedText: "Ein halbes Hundert Karten sitzt fest." },

    // ---------- Dranbleiben (Streak) ----------
    { id: "streak_3",  group: "streak", icon: "🗓️", name: "Drei-Tage-Trip",     type: "counter", metric: "longestStreak", threshold: 3,
      description: "Lerne 3 Tage in Folge.",   unlockedText: "Drei Tage am Stück auf Ruta geblieben." },
    { id: "streak_7",  group: "streak", icon: "🚐", name: "Eine Woche unterwegs", type: "counter", metric: "longestStreak", threshold: 7,
      description: "Lerne 7 Tage in Folge.",   unlockedText: "Eine Woche Reise-Spanisch durchgezogen." },
    { id: "streak_14", group: "streak", icon: "🛏️", name: "Reise-Routine",       type: "counter", metric: "longestStreak", threshold: 14,
      description: "Lerne 14 Tage in Folge.",  unlockedText: "Spanisch ist Teil deiner Reiseroutine." },
    { id: "streak_30", group: "streak", icon: "🔥", name: "Ruta Ritual",         type: "counter", metric: "longestStreak", threshold: 30,
      description: "Lerne 30 Tage in Folge.",  unlockedText: "Aus Lernen ist eine echte Gewohnheit geworden." },

    // ---------- Bereiche (Kategorie-Meisterschaft) ----------
    ...CATEGORY_BADGES,

    // ---------- Spezial ----------
    { id: "night_owl",  group: "special", icon: "🌙", name: "Midnight Español",         type: "flag", metric: "nightOwl", secret: true,
      description: "Lerne nach 22 Uhr.",        unlockedText: "Noch schnell ein bisschen Spanisch vor dem Schlafen." },
    { id: "early_bird", group: "special", icon: "☕", name: "Café con Vocabulario",     type: "flag", metric: "earlyBird", secret: true,
      description: "Lerne vor 9 Uhr.",          unlockedText: "Spanisch gelernt, bevor der Tag richtig losging." },
    { id: "many_again", group: "special", icon: "🔁", name: "Nochmal ist kein Scheitern", type: "counter", metric: "againPresses", threshold: 20,
      description: "Drücke 20× „Otra vez“.",    unlockedText: "Du hast weitergemacht, obwohl es nicht sofort saß." },
    { id: "persistent", group: "special", icon: "💪", name: "Drangeblieben",            type: "counter", metric: "totalReviews", threshold: 500,
      description: "Sammle 500 Bewertungen.",   unlockedText: "Fünfhundert Bewertungen – das ist Ausdauer." },
  ];

  const BY_ID = BADGES.reduce((acc, b) => { acc[b.id] = b; return acc; }, {});
  const byId = (id) => BY_ID[id] || null;

  // ----- Metriken aus Lernfortschritt + Zählern ableiten (rein) -----
  // cards    : vollständige Kartenliste (eingebaut + eigene)
  // progress : Map cardId -> Lern-Datensatz
  // counters : persistierte Spiel-Zähler (Streak, Tageszeit, "Nochmal", …)
  function buildMetrics(cards, progress, counters) {
    const prog = progress || {};
    const c = counters || {};
    let cardsReviewed = 0, cardsMastered = 0;
    const catTotal = {}, catMastered = {};

    cards.forEach((card) => {
      const r = prog[card.id] || {};
      const seen = r.seen || 0;
      const mastered = isMastered(r);
      catTotal[card.cat] = (catTotal[card.cat] || 0) + 1;
      if (seen > 0) cardsReviewed++;
      if (mastered) { cardsMastered++; catMastered[card.cat] = (catMastered[card.cat] || 0) + 1; }
    });

    const categoryMastery = {};
    Object.keys(catTotal).forEach((cat) => {
      categoryMastery[cat] = catTotal[cat] ? (catMastered[cat] || 0) / catTotal[cat] : 0;
    });

    return {
      cardsReviewed,
      cardsMastered,
      totalCards: cards.length,
      totalReviews: c.reviews || 0,
      dailyStreak: c.dailyStreak || 0,
      longestStreak: c.longestStreak || 0,
      againPresses: c.againPresses || 0,
      nightOwl: !!c.nightOwl,
      earlyBird: !!c.earlyBird,
      categoryMastery,
      categoryTotals: catTotal,
    };
  }

  // Aktueller Wert einer Badge-Metrik (für Fortschrittsanzeige).
  function valueOf(badge, m) {
    switch (badge.type) {
      case "counter":         return m[badge.metric] || 0;
      case "flag":            return m[badge.metric] ? 1 : 0;
      case "categoryMastery": return (m.categoryMastery && m.categoryMastery[badge.category]) || 0;
      case "allReviewed":     return m.cardsReviewed || 0;
      default:                return 0;
    }
  }

  // Zielwert/Schwelle einer Badge-Metrik.
  function targetOf(badge, m) {
    switch (badge.type) {
      case "flag":            return 1;
      case "categoryMastery": return badge.threshold;
      case "allReviewed":     return m.totalCards || 0;
      default:                return badge.threshold;
    }
  }

  // Ist das Badge erreicht?
  function isSatisfied(badge, m) {
    if (badge.type === "categoryMastery") {
      const tot = m.categoryTotals ? m.categoryTotals[badge.category] : 0;
      return !!tot && valueOf(badge, m) >= badge.threshold;
    }
    if (badge.type === "allReviewed") {
      const t = targetOf(badge, m);
      return t > 0 && valueOf(badge, m) >= t;
    }
    return valueOf(badge, m) >= targetOf(badge, m);
  }

  // Fortschritt 0..1 (für den Balken bei noch nicht erreichten Badges).
  function progressOf(badge, m) {
    const t = targetOf(badge, m);
    if (!t) return 0;
    return Math.max(0, Math.min(1, valueOf(badge, m) / t));
  }

  // Ids aller aktuell erfüllten Badges (für die Freischalt-Erkennung).
  function satisfiedIds(m) {
    return BADGES.filter((b) => isSatisfied(b, m)).map((b) => b.id);
  }

  // Vollständige Auswertung für die UI. unlocked = Map id -> Zeitstempel.
  // Ein Badge gilt als freigeschaltet, sobald es erfüllt ist ODER bereits in der
  // unlocked-Map steht (Freischaltung bleibt erhalten, auch wenn sich Werte ändern).
  function evaluate(m, unlocked) {
    const u = unlocked || {};
    return BADGES.map((b) => {
      const satisfied = isSatisfied(b, m);
      const value = valueOf(b, m);
      const target = targetOf(b, m);
      return Object.assign({}, b, {
        satisfied,
        unlocked: satisfied || !!u[b.id],
        value,
        target,
        progress: progressOf(b, m),
        unlockedAt: u[b.id] || null,
      });
    });
  }

  window.SC = window.SC || {};
  // Schlanke öffentliche API – die Auswertungs-Helfer (valueOf/targetOf/…) bleiben
  // modul-intern.
  window.SC.badges = {
    GROUPS,
    byId,
    buildMetrics,
    evaluate,
    satisfiedIds,
  };
})();
