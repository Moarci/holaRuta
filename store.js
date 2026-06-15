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
  // Zuletzt gesehene App-Version (für den „Was ist neu?"-Hinweis nach Updates).
  // Bewusst NICHT in KNOWN_KEYS: das ist gerätelokaler Anzeige-Status, kein
  // Nutzer-Inhalt – ein Backup-Import von einem anderen Gerät soll ihn nicht
  // überschreiben und so einen falschen Update-Hinweis auslösen.
  const SEENVERSION_KEY = "spanischcard.seenVersion.v1";
  // Alle Keys, die zu HolaRuta gehören – Basis für Export/Import (Backup).
  const KNOWN_KEYS = [PROGRESS_KEY, SETTINGS_KEY, USERCARDS_KEY, GAMESTATS_KEY];

  function readJson(key, fallback) {
    let raw = null;
    try {
      raw = localStorage.getItem(key);
    } catch (err) {
      console.warn("store: lesen fehlgeschlagen", key, err);
      return fallback;
    }
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (err) {
      // Korruptes JSON: Roh-String unter <key>.corrupt retten, BEVOR der
      // Fallback greift – sonst wäre der Stand unwiederbringlich verloren.
      console.warn("store: korruptes JSON, sichere Rohdaten", key, err);
      try { localStorage.setItem(key + ".corrupt", raw); } catch (e) { /* egal */ }
      return fallback;
    }
  }

  // Gibt zurück, ob das Schreiben geklappt hat (false z.B. bei vollem
  // Speicher/Private Mode – der Aufrufer kann den Nutzer warnen, R4).
  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn("store: schreiben fehlgeschlagen", key, err);
      return false;
    }
  }

  // ----- Schema-Migration -----
  // Die KEYS oben tragen Versionssuffixe (z.B. progress.v2). Wird eine Version
  // erhöht, MUSS hier die passende Migration ergänzt werden – sonst verliert
  // der Nutzer beim Update stillschweigend seinen gesamten Fortschritt.
  // migrate() läuft einmal beim Laden des Moduls. Schablone für einen
  // künftigen Bump (v2 -> v3):
  //   const old = readJson("spanischcard.progress.v2", null);
  //   if (old && !localStorage.getItem(PROGRESS_KEY)) {
  //     writeJson(PROGRESS_KEY, transformV2toV3(old));
  //   }
  function migrate() {
    // Aktuell keine ausstehenden Migrationen (no-op).
  }

  // Strukturwächter: externes/korrumpiertes localStorage darf die App nicht crashen.
  const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

  // Endliche Zahl (auch als String, z.B. "2.5" aus manipuliertem Storage)
  // oder Default. null/true/Objekte zählen NICHT als Zahl.
  function asNum(x, fallback) {
    const n = typeof x === "number" ? x
      : typeof x === "string" && x.trim() !== "" ? Number(x)
      : NaN;
    return isFinite(n) ? n : fallback;
  }

  // Einzel-Record des Lernfortschritts heilen: Zahlenfelder koerzieren,
  // ease auf [1.3, 3.0] klemmen, history auf gültige Zeichen filtern.
  // Ohne das macht ein korrupter Record die Karte "für immer fällig"
  // (due als String) oder "nie wieder lernbar" (ease -> NaN -> 0).
  function sanitizeRecord(rec) {
    if (!isPlainObject(rec)) return null;
    const history = Array.isArray(rec.history)
      ? rec.history.filter((ch) => ch === "a" || ch === "g" || ch === "e")
      : [];
    return Object.assign({}, rec, {
      ease: Math.min(3.0, Math.max(1.3, asNum(rec.ease, 2.5))),
      interval: asNum(rec.interval, 0),
      due: asNum(rec.due, 0),
      reps: asNum(rec.reps, 0),
      seen: asNum(rec.seen, 0),
      history,
    });
  }

  function loadProgress() {
    const v = readJson(PROGRESS_KEY, {});
    if (!isPlainObject(v)) return {};
    const out = {};
    Object.keys(v).forEach((id) => {
      const rec = sanitizeRecord(v[id]);
      if (rec) out[id] = rec;
    });
    return out;
  }
  function loadSettings() {
    const v = readJson(SETTINGS_KEY, { mode: "flip" });
    return isPlainObject(v) ? v : { mode: "flip" };
  }
  function loadUserCards() {
    const v = readJson(USERCARDS_KEY, []);
    if (!Array.isArray(v)) return [];
    // Nur plausible Karten behalten: gültige id, de/es/cat als nicht-leere
    // Strings mit vernünftiger Länge (verhindert "undefined"-Karten, Crashes
    // und absurde Einträge aus fremdem/manipuliertem Storage).
    const okStr = (s, max) => typeof s === "string" && s.length > 0 && s.length <= max;
    return v.filter((c) =>
      c && typeof c === "object" &&
      okStr(c.id, 100) &&
      okStr(c.de, 500) &&
      okStr(c.es, 500) &&
      okStr(c.cat, 100));
  }

  // ----- Backup: Export/Import aller HolaRuta-Daten (R4) -----
  // Export: alle bekannten spanischcard.*-Keys als ein Objekt (für eine
  // JSON-Datei). Korrupte Einzel-Keys werden ausgelassen statt zu crashen.
  function exportData() {
    const data = {};
    KNOWN_KEYS.forEach((key) => {
      let raw = null;
      try { raw = localStorage.getItem(key); } catch (e) { /* egal */ }
      if (!raw) return;
      try { data[key] = JSON.parse(raw); } catch (e) { /* korrupt -> auslassen */ }
    });
    return {
      app: "holaruta",
      format: 1,
      exportedAt: new Date().toISOString(),
      data,
    };
  }

  // Import: nur bekannte spanischcard.*-Keys übernehmen (fremde Keys werden
  // ignoriert). Gibt die Anzahl übernommener Keys zurück (0 = ungültig/leer).
  function importData(payload) {
    if (!isPlainObject(payload) || !isPlainObject(payload.data)) return 0;
    let imported = 0;
    KNOWN_KEYS.forEach((key) => {
      if (!(key in payload.data)) return;
      if (writeJson(key, payload.data[key])) imported++;
    });
    return imported;
  }

  // Lehrer-/Coordinator-Modus: ein Backup-Payload (von exportData) NUR LESEN,
  // ohne irgendetwas in den eigenen localStorage zu schreiben. Liefert die für
  // eine Fortschritts-Auswertung nötigen Rohdaten (Karten-Fortschritt + Spiel-
  // Zähler) oder null, wenn es kein gültiges HolaRuta-Backup ist. Rein, ohne
  // Seiteneffekt – damit eine Lehrkraft Schüler-Stände einsehen kann, ohne den
  // eigenen Fortschritt zu überschreiben.
  function readBackup(payload) {
    if (!isPlainObject(payload) || !isPlainObject(payload.data)) return null;
    if (payload.app && payload.app !== "holaruta") return null;
    const d = payload.data;
    return {
      progress: isPlainObject(d[PROGRESS_KEY]) ? d[PROGRESS_KEY] : {},
      gamestats: isPlainObject(d[GAMESTATS_KEY]) ? d[GAMESTATS_KEY] : {},
    };
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
      // ----- Frases flexibles (Satzbaukasten) -----
      frasesPlayed: 0,      // abgeschlossene Satzbaukasten-Runden
      frasesPerfect: 0,     // Runden ohne Fehler
      frasesThemesDone: {}, // Map themaId -> true (distinkt abgeschlossene Themen, ohne "Gemischt")
      // ----- Hören: Escuchar (Dictado) & Precios (Preis-Hörtrainer) -----
      listenReviews: 0,     // im Hör-Modus bewertete Karten
      preciosPlayed: 0,     // abgeschlossene Preis-Hörrunden
      preciosPerfect: 0,    // Preis-Hörrunden ohne Fehler
      preciosMillon: 0,     // fehlerfreie Runden auf der „Große Beträge"-Stufe (L3)
      // ----- Conjugador (Konjugations-Drill) -----
      conjugPlayed: 0,      // abgeschlossene Konjugations-Runden
      conjugPerfect: 0,     // Konjugations-Runden ohne Fehler
      // ----- Diálogos (Gesprächs-Simulationen) -----
      dialogosPlayed: 0,    // abgeschlossene Dialog-Runden
      dialogosPerfect: 0,   // Dialog-Runden ohne Fehler
      dialogosScenesDone: {}, // Map scenarioId -> true (distinkt gespielte Szenarien)
      // ----- Ruta del día (tägliche Mini-Runde) -----
      rutaDays: {},         // Map "YYYY-MM-DD" -> true (Tage mit gestarteter Ruta del día)
      // ----- Pre-Trip-Plan (mehrtägiger Onboarding-Pfad) -----
      pretripDays: {},      // Map Tagesnummer (1..N) -> true (abgeschlossene Pre-Trip-Tage)
      // ----- Trip-Ziel (Countdown + Tagesziel) -----
      tripGoal: null,       // { destination, endDate:"YYYY-MM-DD", perDay, startedAt } | null
      dailyCounts: {},      // Map "YYYY-MM-DD" -> Anzahl Bewertungen an dem Tag
      // ----- Reise-Kontext (🧭 Kontext-Button) -----
      contextCardsSeen: {}, // Map cardId -> true (distinkt geöffnete Kontexte)
      // ----- El Cuerpo (interaktive Körperkarte) -----
      bodyPartsSeen: {},    // Map bodyPartId -> true (distinkt erkundete Körperteile)
      // ----- Einkaufszettel (interaktive Einkaufsliste) -----
      shoppingSeen: {},     // Map shoppingItemId -> true (distinkt abgehakte Einkaufs-Items)
      unlocked: {},         // Map badgeId -> Zeitstempel der Freischaltung
    };
  }
  // Trip-Ziel aus (evtl. fremdem/manipuliertem) Storage säubern. Ungültiges ->
  // null (kein Ziel). endDate muss "YYYY-MM-DD" sein, perDay eine sinnvolle Zahl.
  // Pre-Trip-Fortschritt: neues Format ist verschachtelt { scope: { day: true } }.
  // Altes flaches Format ({ day: true }) wird einmalig nach { colombia: … } migriert,
  // damit bestehende Geräte ihren Kolumbien-Fortschritt behalten.
  function sanitizePretripDays(v) {
    if (!isPlainObject(v)) return {};
    const keys = Object.keys(v);
    if (!keys.length) return {};
    if (keys.every((k) => isPlainObject(v[k]))) {
      const out = {};
      keys.forEach((k) => { out[k] = v[k]; });
      return out; // bereits verschachtelt (je Destination)
    }
    if (keys.every((k) => /^\d+$/.test(k))) return { colombia: v }; // Migration alt-flach
    return {};
  }

  function sanitizeTripGoal(t) {
    if (!isPlainObject(t)) return null;
    const str = (s, max) => (typeof s === "string" && s.length > 0 && s.length <= max ? s : "");
    const destination = str(t.destination, 80);
    const endDate = /^\d{4}-\d{2}-\d{2}$/.test(t.endDate) ? t.endDate : "";
    const perDay = typeof t.perDay === "number" && isFinite(t.perDay) ? Math.max(1, Math.min(500, Math.round(t.perDay))) : 0;
    if (!endDate || !perDay) return null;
    return {
      destination,
      endDate,
      perDay,
      startedAt: /^\d{4}-\d{2}-\d{2}$/.test(t.startedAt) ? t.startedAt : "",
    };
  }

  function loadGameStats() {
    const v = readJson(GAMESTATS_KEY, null);
    if (!isPlainObject(v)) return freshGameStats();
    // Strukturwächter: jedes Feld typisieren. Korruptes/manipuliertes localStorage
    // (z.B. "5" statt 5) darf sonst Streak-/Badge-Logik verfälschen (String-Verkettungen
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
      frasesPlayed: num(v.frasesPlayed),
      frasesPerfect: num(v.frasesPerfect),
      frasesThemesDone: isPlainObject(v.frasesThemesDone) ? v.frasesThemesDone : {},
      listenReviews: num(v.listenReviews),
      preciosPlayed: num(v.preciosPlayed),
      preciosPerfect: num(v.preciosPerfect),
      preciosMillon: num(v.preciosMillon),
      conjugPlayed: num(v.conjugPlayed),
      conjugPerfect: num(v.conjugPerfect),
      dialogosPlayed: num(v.dialogosPlayed),
      dialogosPerfect: num(v.dialogosPerfect),
      dialogosScenesDone: isPlainObject(v.dialogosScenesDone) ? v.dialogosScenesDone : {},
      rutaDays: isPlainObject(v.rutaDays) ? v.rutaDays : {},
      pretripDays: sanitizePretripDays(v.pretripDays),
      tripGoal: sanitizeTripGoal(v.tripGoal),
      dailyCounts: isPlainObject(v.dailyCounts) ? v.dailyCounts : {},
      contextCardsSeen: isPlainObject(v.contextCardsSeen) ? v.contextCardsSeen : {},
      bodyPartsSeen: isPlainObject(v.bodyPartsSeen) ? v.bodyPartsSeen : {},
      shoppingSeen: isPlainObject(v.shoppingSeen) ? v.shoppingSeen : {},
      unlocked: isPlainObject(v.unlocked) ? v.unlocked : {},
    };
  }

  migrate();

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
    exportData,
    importData,
    readBackup,
    freshGameStats,
    loadGameStats,
    saveGameStats: (g) => writeJson(GAMESTATS_KEY, g),
    resetGameStats: () => {
      try { localStorage.removeItem(GAMESTATS_KEY); } catch (e) { /* egal */ }
    },
    // Zuletzt gesehene App-Version. null = noch nie vermerkt (frische Installation
    // oder Bestandsnutzer vor diesem Feature) -> dann KEIN Update-Hinweis, nur
    // still nachtragen.
    loadSeenVersion() {
      const v = readJson(SEENVERSION_KEY, null);
      return typeof v === "string" ? v : null;
    },
    saveSeenVersion: (v) => writeJson(SEENVERSION_KEY, String(v)),
  };
})();
