/*
 * store.js  (SC.store) – Persistenz. Kapselt localStorage komplett weg.
 * Speichert Lernfortschritt (pro Karte) und Einstellungen (z.B. Modus).
 * Wenn localStorage fehlt/fehlschlägt, läuft die App trotzdem (nur ohne Speichern).
 */
(function () {
  "use strict";

  const PROGRESS_KEY = "spanischcard.progress.v2";
  const SETTINGS_KEY = "spanischcard.settings.v1";
  const USERCARDS_KEY = "spanischcard.usercards.v1";
  const GAMESTATS_KEY = "spanischcard.gamestats.v1";

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn("store: lesen fehlgeschlagen", key, err);
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn("store: schreiben fehlgeschlagen", key, err);
    }
  }

  // Strukturwächter: externes/korrumpiertes localStorage darf die App nicht crashen.
  const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

  function loadProgress() {
    const v = readJson(PROGRESS_KEY, {});
    return isPlainObject(v) ? v : {};
  }
  function loadSettings() {
    const v = readJson(SETTINGS_KEY, { mode: "flip" });
    return isPlainObject(v) ? v : { mode: "flip" };
  }
  function loadUserCards() {
    const v = readJson(USERCARDS_KEY, []);
    if (!Array.isArray(v)) return [];
    // Nur Einträge mit gültiger id behalten (verhindert "undefined"-Karten & Crashes).
    return v.filter((c) => c && typeof c === "object" && typeof c.id === "string" && c.id);
  }

  // Spiel-Zähler fürs Badge-System ("Ruta-Pass"): Streak, Tageszeit, "Nochmal"-
  // Drücke und die Map freigeschalteter Badges. Defaults für alte/leere Stände.
  function freshGameStats() {
    return {
      reviews: 0,           // Gesamtzahl Bewertungen
      againPresses: 0,      // wie oft "Otra vez" gedrückt
      dailyStreak: 0,       // aktuelle Tage-in-Folge-Serie
      longestStreak: 0,     // längste je erreichte Serie
      lastStudyDate: null,  // letztes Lern-Datum als "YYYY-MM-DD" (lokal)
      nightOwl: false,      // schon mal nach 22 Uhr gelernt
      earlyBird: false,     // schon mal vor 9 Uhr gelernt
      // ----- Hostel Mode (Üben zu zweit) -----
      battlesPlayed: 0,     // abgeschlossene Battles
      battlesWon: 0,        // Battles mit klarem Sieger (kein Unentschieden)
      perfectBattles: 0,    // Battles, in denen ein Spieler volle Punkte holte
      comebacks: 0,         // Battles nach Rückstand gewonnen
      roleplaysSeen: {},    // Map roleplayId -> true (distinkt gespielte Rollenspiele)
      challengesDone: {},   // Map challengeId -> true (erledigte Real-Life-Challenges)
      // ----- Definiciones (Zuordnen-Quiz) -----
      quizzesPlayed: 0,     // abgeschlossene Quiz-Runden
      quizzesPerfect: 0,    // Quiz-Runden ohne Fehler
      // ----- Reise-Kontext (🧭 Kontext-Button) -----
      contextCardsSeen: {}, // Map cardId -> true (distinkt geöffnete Kontexte)
      // ----- El Cuerpo (interaktive Körperkarte) -----
      bodyPartsSeen: {},    // Map bodyPartId -> true (distinkt erkundete Körperteile)
      unlocked: {},         // Map badgeId -> Zeitstempel der Freischaltung
    };
  }
  function loadGameStats() {
    const v = readJson(GAMESTATS_KEY, null);
    if (!isPlainObject(v)) return freshGameStats();
    // Strukturwächter: jedes Feld typisieren. Korruptes/manipuliertes localStorage
    // (z.B. "5" statt 5) darf sonst Streak-/Badge-Logik verfälschen (Streichketten
    // wie "5"+1 = "51"). unlocked muss ein Objekt sein (sonst Crash beim Diffen).
    const num = (x) => (typeof x === "number" && isFinite(x) ? x : 0);
    return {
      reviews: num(v.reviews),
      againPresses: num(v.againPresses),
      dailyStreak: num(v.dailyStreak),
      longestStreak: num(v.longestStreak),
      lastStudyDate: typeof v.lastStudyDate === "string" ? v.lastStudyDate : null,
      nightOwl: !!v.nightOwl,
      earlyBird: !!v.earlyBird,
      battlesPlayed: num(v.battlesPlayed),
      battlesWon: num(v.battlesWon),
      perfectBattles: num(v.perfectBattles),
      comebacks: num(v.comebacks),
      roleplaysSeen: isPlainObject(v.roleplaysSeen) ? v.roleplaysSeen : {},
      challengesDone: isPlainObject(v.challengesDone) ? v.challengesDone : {},
      quizzesPlayed: num(v.quizzesPlayed),
      quizzesPerfect: num(v.quizzesPerfect),
      contextCardsSeen: isPlainObject(v.contextCardsSeen) ? v.contextCardsSeen : {},
      bodyPartsSeen: isPlainObject(v.bodyPartsSeen) ? v.bodyPartsSeen : {},
      unlocked: isPlainObject(v.unlocked) ? v.unlocked : {},
    };
  }

  window.SC = window.SC || {};
  window.SC.store = {
    loadProgress,
    saveProgress: (p) => writeJson(PROGRESS_KEY, p),
    resetProgress: () => {
      try { localStorage.removeItem(PROGRESS_KEY); } catch (e) { /* egal */ }
    },
    loadSettings,
    saveSettings: (s) => writeJson(SETTINGS_KEY, s),
    loadUserCards,
    saveUserCards: (c) => writeJson(USERCARDS_KEY, c),
    freshGameStats,
    loadGameStats,
    saveGameStats: (g) => writeJson(GAMESTATS_KEY, g),
    resetGameStats: () => {
      try { localStorage.removeItem(GAMESTATS_KEY); } catch (e) { /* egal */ }
    },
  };
})();
