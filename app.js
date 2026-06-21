/*
 * app.js  (SC.app) – Controller. Hält den Zustand, verbindet Module und
 * verdrahtet Events. Datenfluss: data → srs/matcher → hier → ui.
 * UI-Buttons tragen data-action; hier wird zentral darauf reagiert (Delegation).
 */
(function () {
  "use strict";

  const { data, srs, matcher, store, ui, stats } = window.SC;
  const i18n = window.SC.i18n; // Mehrsprachigkeit (UI-Sprache + nativeText)
  const numbers = window.SC.numbers || null; // Zahl→Wort & Preis-Generator (Precios al oído)
  const badges = window.SC.badges || null; // optional – Badge-System ("Ruta-Pass")
  const speech = window.SC.speech || null; // optional – Browser kann Ausgabe ggf. nicht
  const share = window.SC.share || null;   // optional – Sharepic teilen/herunterladen
  const userCards = window.SC.userCards || null; // eigene Karten (optional)
  const countries = window.SC.countries || null; // Länderkunde-Infoseite (optional)
  const historia = window.SC.historia || null;   // Geschichte Südamerikas (Erklärseite, optional)
  const historiaCentro = window.SC.historiaCentro || null; // Geschichte Mittelamerikas (Erklärseite, optional)
  const knigge = window.SC.knigge || null;       // Reise-Knigge (Verhalten unterwegs, optional)
  const frases = window.SC.frases || null;       // Satzbaukasten-Daten (optional)
  const dialogos = window.SC.dialogos || null;   // Gesprächs-Simulationen (optional)
  const conjug = window.SC.conjug || null;       // Konjugations-Drill-Generator (optional)
  const regatear = window.SC.regatear || null;   // Verhandeln/Feilschen-Modul (optional)
  const logistica = window.SC.logistica || null; // Reise-Logistik: SIM, Geld, Gepäck (optional)
  const salud = window.SC.salud || null;         // Gesund & fit: Essen, Trinken, Bewegung (optional)
  const fotografia = window.SC.fotografia || null; // Fotos & Videos: tolle Reisebilder (optional)
  const flirt = window.SC.flirt || null;         // Coqueteo y romance: flirten & daten unterwegs (optional)
  const bailar = window.SC.bailar || null;       // Bailar: Tanzen in LatAm (Schritt-Diagramme, optional)
  const musica = window.SC.musica || null;       // Música: Genres LatAm + Spotify/Apple-Deep-Links (optional)
  const bebidas = window.SC.bebidas || null;     // Bebidas AM/PM: Tag-/Abendgetränk pro Land (optional)
  const yesto = window.SC.yesto || null;         // „¿Y esto?“: Bild-Vokabel-Modus mit Countdown (optional)
  const placement = window.SC.placement || null; // Ruta-Check (Einstufungstest, optional)
  const assessment = window.SC.assessment || null; // HolaRuta Nivel-Test (ausführlich, optional)
  const changelog = window.SC.changelog || null; // Versionsstand & „Was ist neu?" (optional)
  const DEFAULT_ACCENT = ["#C2502E", "#E9A23B"]; // Terrakotta→Ocker (markenkonform, statt kühlem Indigo)
  // Eine Lernrunde bleibt bewusst klein: höchstens so viele Karten pro Sitzung.
  // Sonst startet ein Neueinsteiger mit "561 fällig" in eine erschlagende
  // Pflicht-Session – der Rest bleibt fällig und kommt in der nächsten Runde.
  const SESSION_CAP = 20;

  // ----- Lazy-Loader (Single-File-fest) ------------------------------------
  // Lädt ein optionales Feature-Modul bei Bedarf nach. WICHTIG: existiert
  // window.SC[name] bereits (Single-File-Build, wo alles inlined ist, oder das
  // Modul wurde schon per <script> geladen), wird `cb` SOFORT und SYNCHRON
  // aufgerufen – das Verhalten ist dann identisch zum bisherigen direkten Öffnen.
  // Andernfalls (Modul noch nicht da, z. B. nachdem L5 die <script>-Tags
  // entfernt) wird ein <script src="name.js"> injiziert und `cb` erst nach
  // onload ausgeführt. Mehrfach-Anfragen während des Ladens teilen sich dasselbe
  // Script-Element (kein Doppel-Laden). Schlägt das Laden fehl, läuft `cb`
  // trotzdem (die *VM/*Ready-Guards fangen ein fehlendes Modul ohnehin ab).
  const _moduleLoading = {}; // name -> Array<cb>, solange das Script lädt
  function loadModule(name, cb) {
    if (window.SC && window.SC[name]) { if (cb) cb(window.SC[name]); return; }
    if (_moduleLoading[name]) { if (cb) _moduleLoading[name].push(cb); return; }
    const waiters = _moduleLoading[name] = [];
    if (cb) waiters.push(cb);
    const done = () => {
      delete _moduleLoading[name];
      const mod = window.SC && window.SC[name];
      waiters.forEach((fn) => { try { fn(mod); } catch (e) { /* einzelner cb-Fehler */ } });
    };
    try {
      if (typeof document === "undefined" || !document.createElement) { done(); return; }
      const s = document.createElement("script");
      s.src = name + ".js";
      s.async = false; // Reihenfolge/Abhängigkeiten wie bei statischen <script>
      s.onload = done;
      s.onerror = done; // Guards greifen; nicht hängen bleiben
      (document.head || document.body || document.documentElement).appendChild(s);
    } catch (e) { done(); }
  }

  // ----- Zustand (eine einzige Quelle der Wahrheit) -----
  let progress = store.loadProgress();
  let settings = store.loadSettings();
  let gamestats = store.loadGameStats(); // Spiel-Zähler fürs Badge-System
  let subscribedTasks = store.loadTasks(); // abonnierte Aufgaben (mehrere parallel, persistent)
  const MAX_SUBSCRIBED_TASKS = 50;          // Deckel gegen Speicher-Überlauf
  const MAX_TASK_ITEMS = 20;                // max. Ziele je Bundle (muss store.MAX_BUNDLE_ITEMS spiegeln)

  // Erst-Start ohne gespeicherte Sprache: UI-/Muttersprache nach Betriebssystem-/
  // Browser-Sprache vorbelegen. Unterstützt werden nur DE und EN – Deutsch nur bei
  // deutschsprachigem System, sonst die internationale Variante Englisch.
  function detectUiLang() {
    try {
      const langs = (navigator.languages && navigator.languages.length)
        ? navigator.languages
        : [navigator.language || ""];
      for (const l of langs) {
        if (typeof l === "string" && /^de(-|$)/i.test(l)) return "de";
      }
    } catch (e) { /* kein navigator (z.B. Test) -> Standard unten */ }
    return "en";
  }

  const state = {
    screen: "home",          // 'home' | 'study' | 'done' | 'stats' | 'card' | 'hostel' | 'battleSetup' | 'battle' | 'battleDone' | 'roleplaySetup' | 'roleplay' | 'quizSetup' | 'quiz' | 'quizDone' | 'cuerpo' | 'conjugacion' | 'tiempos' | 'spickzettel' | 'preciosSetup' | 'precios' | 'preciosDone' | 'frasesSetup' | 'frases' | 'frasesDone' | 'compras' | 'comprasQuiz' | 'comprasQuizDone' | 'knigge' | 'regatear' | 'logistica' | 'salud' | 'fotos' | 'flirt' | 'bailar' | 'historia' | 'search' | 'pretrip' | 'teacher' | 'task'
    homeTab: "start",        // Start-Reiter hat Vorrang: jeder App-Start landet auf „Start"; Reiter-Wechsel gilt nur für die laufende Sitzung
    // 'flip' | 'type' | 'listen'. Hör-Modus nur, wenn der Browser TTS kann –
    // sonst (z.B. aus fremdem Gerät importiert) zurück auf Sprechen.
    mode: (settings.mode === "listen" && !(speech && speech.isSupported())) ? "flip" : (settings.mode || "flip"),
    // UI-/Muttersprache: "de" | "en". Gespeicherte Wahl gewinnt; beim ersten
    // Öffnen (noch nichts gespeichert) nach Betriebssystem-Sprache vorbelegen.
    uiLang: settings.uiLang === "en" ? "en" : settings.uiLang === "de" ? "de" : detectUiLang(),
    dir: settings.dir === "es2de" ? "es2de" : "de2es", // Lernrichtung: native→ES (Standard) | ES→native
    levels: Array.isArray(settings.levels) ? settings.levels : [], // [] = alle Stufen, sonst Teilmenge von [1,2,3]
    scopeId: "all",          // 'all' | Kategorie-Id
    pretripDay: null,        // läuft gerade ein Pre-Trip-Tag? (Tagesnummer | null) – markiert ihn bei Abschluss
    pretripScope: null,      // gewählte Pre-Trip-Destination (= Kategorie-Id, null = noch nicht gesetzt)
    pretripLock: null,       // per zugewiesener Aufgabe festgelegtes Reiseziel (nur dieses zeigen, nicht wechselbar) | null
    teacherStudents: [],     // Lehrer-Modus: importierte Schüler-Auswertungen (transient, nie gespeichert)
    teacherSort: { key: "level", dir: -1 }, // Sortierung der Klassentabelle: Standard nach Niveau (höchstes zuerst, ungetestete zuletzt)
    teacherClassName: "",    // optionaler Klassenname (Druck-Kopf + CSV-Dateiname; transient)
    teacherTaskCode: "",     // zuletzt erzeugter Aufgaben-Code (transient)
    taskItems: [],           // gewählte Aufgaben-Ziele im Formular: [{kind,scope}] – 1 = Einzelaufgabe, ≥2 = Bundle (überlebt Re-Render)
    targetPicker: null,      // offenes Ziel-Picker-Modal: 'task' | 'sheet' | null (Modo profe / Blatt)
    teacherTaskCodeLabel: "", // lesbare Beschriftung des erzeugten Codes (Einzelziel oder „Bundle … · N Aufgaben")
    taskTitle: "",           // optionaler Aufgaben-Titel (überlebt Re-Render)
    taskDue: "",             // optionale Frist (überlebt Re-Render)
    placement: null,         // Ruta-Check (Einstufungstest): { phase, idx, answers:[], startedAt, qStartedAt, result } | null
    assessment: null,        // HolaRuta Nivel-Test (ausführlich): { phase, asked, answers, difficulty, … } | null
    onboardStep: "intro",    // Onboarding-Teilschritt: 'intro' (Erklär-Slides) → 'profile' (Name+Geschlecht) → 'trip' (Reiseziel)
    onboardSlide: 0,         // aktuelle Erklär-Slide im Intro-Schritt (0-basiert)
    queue: [],               // verbleibende Karten-Ids dieser Sitzung
    total: 0,                // Kartenzahl zu Sitzungsbeginn
    revealed: false,         // Karteikarte-Modus: Rückseite sichtbar?
    contextOpen: false,      // 🧭 Reise-Kontext-Panel aufgeklappt? (Single Source of Truth)
    typeResult: null,        // Schreiben-Modus: { correct, answers, input } | null
    statsFilter: "answered", // Statistik-Liste: 'answered'|'hard'|'mastered'|'new'|'all'
    cardId: null,            // Detailseite: welche Karte
    backTo: "home",          // wohin der Zurück-Knopf der Detailseite führt
    studyOrigin: null,       // Herkunft der laufenden Runde: 'pretrip' | 'task' | null (=Dashboard) – steuert, wohin der Fertig-Screen zurückführt
    session: null,           // { seen:Set<id>, right, wrong } – Richtig/Falsch-Zähler PRO Lern-Runde (null außerhalb); füttert die Belohnungs-Inszenierung
    roundSnapshot: null,     // { unlocked, streak, everStudied } – Stand bei Rundenbeginn, für Diffs (neue Badges / Streak / erste Runde) am Rundenende
    countryId: null,         // Länderkunde: welches Land ist gewählt (null = erstes)
    bebMode: null,           // Bebidas AM/PM-Tafel: 'am'|'pm' (null = nach Uhrzeit)
    badgeToast: null,        // frisch freigeschaltete Badges (kurze Einblendung)
    updateNotice: null,      // „Was ist neu?"-Einträge nach einem Update (null = keiner)
    swUpdate: false,         // wartet eine neue SW-Version? -> "jetzt laden"-Banner
    swWaiting: null,         // Referenz auf den wartenden Service Worker (für SKIP_WAITING)
    // ----- Hostel Mode (transient, keine Persistenz) -----
    battle: null,            // { sceneId, poolIds, queue:[battleId…], round, totalRounds, current:'A'|'B', names:{A,B}, scores:{A,B}, revealed, recorded, suddenDeath, challenge }
    battleLength: 10,        // gewünschte Battle-Länge in Runden (vor dem Start wählbar)
    battleNames: { A: "", B: "" }, // optionale Spielernamen (sonst „Spieler A/B")
    battleNameEdited: false,  // hat der Nutzer ein Battle-Namensfeld angefasst? (dann Profil-Namen nicht mehr vorbelegen)
    battleSeen: [],          // zuletzt verwendete Battle-Ids – vermeidet sofortige Wiederholungen
    roleplayId: null,        // aktuell geöffnetes Rollenspiel
    roleplaySwapped: false,  // Rollen A/B getauscht?
    // ----- Freunde & Tages-Rangliste (opt-in, transient; Server = source of truth) -----
    social: { loading: false, error: false, board: null, code: "" },
    // ----- Definiciones (Zuordnen-Quiz, transient, keine Persistenz) -----
    quiz: null,              // { setId, queue:[defId…], idx, total, options:[{id,es,de,icon}…], selected:defId|null, correct }
    // ----- Precios al oído (Preis-Hörtrainer, transient) -----
    // Beträge werden pro Runde frisch erzeugt (SC.numbers) – nicht mehr aus den
    // festen Zahlen-Karten gezogen. So sind beliebig große/krumme Preise möglich
    // (z. B. kolumbianische Pesos in Millionenhöhe). queue: generierte Preis-Objekte.
    precios: null,           // { currencyKey, level, queue:[{value,digits,es,…}…], idx, total, result:{correct,input}|null, correct }
    preciosCurrency: numbers && numbers.CURRENCIES[settings.preciosCurrency] ? settings.preciosCurrency : "CO", // zuletzt gewählte Währung
    preciosLevel: [1, 2, 3].includes(settings.preciosLevel) ? settings.preciosLevel : 2,                        // zuletzt gewählte Stufe
    // ----- Frases flexibles (Satzbaukasten, transient) -----
    frases: null,            // { setId, queue:[frameId…], idx, total, options:[{es,de,correct}…], selected:idx|null, correct }
    // ----- Diálogos (Gesprächs-Simulationen, transient) -----
    dialogos: null,          // { scenarioId, dialogueId, turnIdx, result:{correct,given}|null, correct, totalUser }
    // ----- Conjugador (generativer Konjugations-Drill, transient) -----
    // Items werden pro Runde frisch erzeugt (SC.conjug) aus data.CONJUGATION.
    conjug: null,            // { level, queue:[{verb,verbHint,personEs,personDe,answer}…], idx, total, result:{correct,input,answer}|null, correct }
    conjugLevel: [1, 2].includes(settings.conjugLevel) ? settings.conjugLevel : 2, // zuletzt gewählte Stufe
    // „¿Y esto?“ Bild-Vokabel-Runde (transient, pro Runde frisch gemischt aus SC.yesto):
    yesto: null,             // { themeId, queue:[{emoji,es,de,en}…], idx, total, phase:"count"|"reveal", count, correct }
    // ----- Spickzettel (Survival-Schnellzugriff, transient) -----
    szShow: null,            // Großanzeige: Karten-Id des bildschirmfüllend gezeigten Satzes | null
    // ----- El Cuerpo (drehbares 3D-Körpermodell) -----
    bodyPartId: null,        // aktuell angetipptes Körperteil (Id) | null
    bodyYaw: -22,            // Drehung der Figur um die Hochachse (Grad)
    bodyPitch: -6,           // Neigung der Figur (Grad), begrenzt ±32
    // ----- Einkaufszettel (interaktive Einkaufsliste) -----
    compras: { section: "super", open: null }, // aktuelle Rubrik + aufgeklapptes Item (Id|null)
    comprasQuiz: null,       // { section, queue:[itemId…], idx, total, options:[{es,correct}…], selected:idx|null, correct }
    // ----- Trip-Ziel (Countdown + Tagesziel) -----
    tripEdit: false,         // Trip-Ziel-Formular auf der Startseite aufgeklappt?
    tripRouteOpen: true,     // Route-Zeitleiste im Profil aufgeklappt? (Standard offen – Drag sichtbar)
    tripSwitchOpen: false,   // Schnellwechsel-Länderchips im Profil aufgeklappt? (Standard eingeklappt – kompakter)
    // ----- Suche (gezielt nach Karten/Übungen & Informationen suchen) -----
    searchQuery: "",         // aktueller Suchbegriff (lebt nur in der Sitzung)
  };

  // Zentrale Zustands-Mutation: schreibt das Patch in `state` und rendert EINMAL neu.
  // Vereinheitlicht das verbreitete Muster „state.x = …; render();" zu einem Aufruf,
  // damit es genau eine Stelle gibt, an der UI-State geändert wird und neu gezeichnet
  // wird. Persistenz (gamestats/settings/progress/tasks) bleibt bewusst getrennt –
  // sie folgt eigenen Speicher-Pfaden und wird hier nicht angefasst. Mit
  // `{ render: false }` als zweitem Argument kann das Neuzeichnen unterdrückt werden
  // (z. B. wenn der Aufrufer ohnehin gleich selbst rendert oder navigiert).
  function setState(patch, opts) {
    if (patch) Object.assign(state, patch);
    if (!opts || opts.render !== false) render();
  }

  let badgeToastTimer = null; // Aufräum-Timer der Badge-Einblendung

  // Fisher–Yates – liefert eine neue, gemischte Kopie (mutiert das Original nicht).
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const root = document.getElementById("app");

  // ----- Helfer -----
  // Eingebaute + eigene Karten als eine Liste. Eigene Karten erscheinen dadurch
  // überall (Kategorien, Lernen, Zähler) ohne Sonderbehandlung.
  // Muttersprachlicher Text eines Inhaltsobjekts (obj[uiLang] || obj.de). Kapselt
  // den i18n-Zugriff für alle VM-Builder; ohne i18n-Modul Rückfall auf Deutsch.
  const nat = (o) => (i18n ? i18n.nativeText(o) : (o && o.de));
  // Suffix-Felder (base+"En"), z. B. situationDe/situationEn oder title/titleEn.
  const natk = (o, base) => (i18n ? i18n.natKey(o, base) : (o && o[base]));
  // Tiefe Lokalisierung für Pass-Through-Daten (überlagert alle …En-Felder).
  const loc = (v) => (i18n ? i18n.localizeDeep(v) : v);
  const allCards = () => userCards ? data.CARDS.concat(userCards.list()) : data.CARDS;
  const cardById = (id) => allCards().find((c) => c.id === id) || null;
  const categoryById = (id) => data.CATEGORIES.find((c) => c.id === id) || null;
  const levelById = (lvl) => data.LEVELS.find((l) => l.id === lvl) || null;
  // Stufen-Filter: leere Auswahl = alle. Greift bei "Alle lernen" und je Kategorie.
  const matchesLevel = (c) => state.levels.length === 0 || state.levels.includes(c.lvl);
  const scopeCards = (scopeId) =>
    allCards().filter((c) => (scopeId === "all" || c.cat === scopeId) && matchesLevel(c));
  const dueIn = (cards) => cards.filter((c) => srs.isDue(progress[c.id]));

  // ----- Datums-/Zeit-Helfer (für die Statistik-Anzeige) -----
  const DAY_MS = 24 * 60 * 60 * 1000;
  // Absolutes Datum, z.B. "3. Juni 2026" (oder "—" wenn unbekannt).
  function fmtDate(ms) {
    if (!ms) return "—";
    try {
      const loc = i18n ? i18n.locale() : "de-DE";
      return new Date(ms).toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return "—"; }
  }
  // Nächste Fälligkeit relativ zu jetzt: "fällig", "heute", "morgen", "in N Tagen"
  // (bzw. die englischen Pendants – Texte/Plural kommen aus i18n.strings.js).
  function fmtDue(ms) {
    if (!ms) return t("common.dueNow");
    const diff = ms - Date.now();
    if (diff <= 0) return t("common.dueNow");
    const days = Math.round(diff / DAY_MS);
    if (days <= 0) return t("common.today");
    if (days === 1) return t("common.tomorrow");
    return t("common.inNDays", { n: days });
  }

  // ----- View-Modelle (Zustand -> einfache Objekte für die UI) -----
  // Ruta-Check fürs Profil: letztes Ergebnis + Verlauf (neueste zuerst), damit man
  // den Test wiederholen und seinen Fortschritt sehen kann. null = Modul nicht geladen.
  function placementProfileVM() {
    if (!placement) return null;
    const history = Array.isArray(gamestats.placementHistory) ? gamestats.placementHistory : [];
    const last = gamestats.placement || null;
    if (!last && !history.length) return { taken: false };
    const fmt = (e) => ({
      level: e.level || "–",
      scorePct: Math.round((e.finalScore || 0) * 100),
      accuracyPct: Math.round((e.accuracy || 0) * 100),
      unknownPct: Math.round((e.unknownRate || 0) * 100),
      tempoLabel: e.tempo ? t("placement.tempo_" + e.tempo) : "",
      // Ausführliche Details fürs Profil (Ergebnis „wie nach dem Abschluss").
      correct: e.correct || 0, total: e.total || 0,
      note: e.note || "",
      reliability: e.reliability || "",
      skills: Array.isArray(e.skills) ? e.skills : [],
      // Frage-für-Frage-Rückblick (einzelne Antworten/Fehler) – leer bei Altergebnissen.
      review: Array.isArray(e.review) ? e.review : [],
      at: e.at || (typeof e.ts === "string" ? e.ts.slice(0, 10) : ""),
    });
    // Verlauf neueste zuerst. Altgeräte ohne History, aber mit letztem Ergebnis:
    // das eine Ergebnis als einzigen Eintrag zählen (sonst „0 Durchläufe").
    const past = history.length ? history.slice().reverse().map(fmt) : (last ? [fmt(last)] : []);
    return {
      taken: true,
      last: last ? fmt(last) : (past[0] || null),
      history: past,
      attempts: past.length,
      canShare: !!share,
    };
  }

  // Nivel-Test fürs Profil: letztes Ergebnis + Verlauf (neueste zuerst). Analog
  // zu placementProfileVM, aber aus gamestats.assessment(History). null = Modul fehlt.
  function assessmentProfileVM() {
    if (!assessment) return null;
    const history = Array.isArray(gamestats.assessmentHistory) ? gamestats.assessmentHistory : [];
    const last = gamestats.assessment || null;
    if (!last && !history.length) return { taken: false };
    const fmt = (e) => ({
      level: e.level || "–",
      variantLabel: t("assessment.variant_" + (e.variant === "extremo" ? "extremo" : "standard")),
      scorePct: Math.round((e.finalScore || 0) * 100),
      accuracyPct: Math.round((e.accuracy || 0) * 100),
      unknownPct: Math.round((e.unknownRate || 0) * 100),
      tempoLabel: e.tempo ? t("assessment.tempo_" + e.tempo) : "",
      // Ausführliche Details fürs Profil (Ergebnis „wie nach dem Abschluss").
      correct: e.correct || 0, total: e.total || 0,
      note: e.note || "",
      reliability: e.reliability || "",
      skills: Array.isArray(e.skills) ? e.skills : [],
      // Frage-für-Frage-Rückblick (einzelne Antworten/Fehler) – leer bei Altergebnissen.
      review: Array.isArray(e.review) ? e.review : [],
      at: e.at || (typeof e.ts === "string" ? e.ts.slice(0, 10) : ""),
    });
    const past = history.length ? history.slice().reverse().map(fmt) : (last ? [fmt(last)] : []);
    return {
      taken: true,
      last: last ? fmt(last) : (past[0] || null),
      history: past,
      attempts: past.length,
      canShare: !!share,
    };
  }

  // Laufender, noch nicht abgeschlossener Nivel-Test fürs Dashboard – damit ein
  // versehentliches Zurück/Reload nicht verloren geht (Wiederaufnahme-Kachel).
  // null, wenn kein Test offen ist (oder die offene Frage nicht mehr im Katalog).
  // Der gültige, fortsetzbare Test-Fortschritt – oder null. Ungültig ist er, wenn
  // nichts begonnen wurde, die offene Frage nicht mehr im Katalog existiert (App-
  // Version gewechselt) ODER der Test inzwischen abgeschlossen wurde – auch auf
  // einem anderen Gerät (Cloud-Sync: ein neueres Ergebnis entwertet einen alten
  // Zwischenstand). REIN lesend (kein Speichern) – fürs Rendern unbedenklich.
  function liveAssessmentProgress() {
    if (!assessment) return null;
    const prog = gamestats.assessmentProgress;
    if (!prog || !Array.isArray(prog.asked) || !prog.asked.length) return null;
    if (!assessment.questionById(prog.asked[prog.asked.length - 1])) return null;
    const done = gamestats.assessment;
    if (done && typeof done.ts === "string") {
      const doneMs = Date.parse(done.ts);
      if (isFinite(doneMs) && prog.savedAt && doneMs >= prog.savedAt) return null;
    }
    return prog;
  }

  function assessmentResumeVM() {
    const prog = liveAssessmentProgress();
    if (!prog) return null;
    const variant = prog.variant === "extremo" ? "extremo" : "standard";
    return {
      variant: variant,
      variantLabel: t("assessment.variant_" + variant),
      index: prog.asked.length,                    // aktuelle Fragennummer (1-basiert)
      total: assessmentTotalPlanned(variant),
    };
  }

  function homeVM() {
    const everyCard = allCards();
    const categories = data.CATEGORIES.map((c) => {
      const allInCat = everyCard.filter((card) => card.cat === c.id);
      const cards = scopeCards(c.id); // nach Stufenfilter
      // Kartenzahl je Stufe in dieser Kategorie (nur Stufen mit >0).
      const byLevel = data.LEVELS
        .map((l) => ({
          id: l.id, short: l.short, color: l.color,
          count: allInCat.filter((card) => card.lvl === l.id).length,
          active: state.levels.length === 0 || state.levels.includes(l.id),
        }))
        .filter((b) => b.count > 0);
      return { id: c.id, label: natk(c, "label"), icon: c.icon, grad: c.grad, group: c.group,
               total: cards.length, due: dueIn(cards).length, byLevel };
    });
    // Kategorien mit fälligen Karten zuerst (meiste zuerst); der Rest behält
    // seine Originalreihenfolge – so steht das Dringende oben, ohne dass die
    // Kacheln bei jedem Besuch wild durcheinanderwürfeln.
    const sortedCategories = categories
      .map((c, i) => ({ c, i }))
      .sort((a, b) => (b.c.due - a.c.due) || (a.i - b.i))
      .map((x) => x.c);
    const all = scopeCards("all");
    // Stufen inkl. Kartenzahl je Stufe (über alle Kategorien) + Auswahl-Status.
    // Stufen ohne Karten (z. B. B2, das nur in Rollenspielen vorkommt) im
    // Karten-Filter ausblenden – sie würden sonst als leere 0-Stufe erscheinen.
    const levels = data.LEVELS.map((l) => ({
      id: l.id, label: natk(l, "label"), short: l.short, color: l.color,
      count: everyCard.filter((c) => c.lvl === l.id).length,
      active: state.levels.includes(l.id),
    })).filter((l) => l.count > 0);
    // Gesamtfortschritt für die "Heute"-Karte – über ALLE Karten, unabhängig
    // vom Stufenfilter, damit der Balken eine stabile Bezugsgröße hat.
    const overall = stats.overview(everyCard, progress);
    // Quick-Resume: zuletzt gelernte Kategorie, nur wenn dort noch etwas fällig ist.
    let lastCat = null;
    if (settings.lastScope) {
      const c = categoryById(settings.lastScope);
      const due = c ? dueIn(scopeCards(c.id)).length : 0;
      if (c && due > 0) lastCat = { id: c.id, label: natk(c, "label"), icon: c.icon, due };
    }
    return {
      mode: state.mode,
      dir: state.dir,
      uiLang: state.uiLang,                                   // gewählte UI-/Muttersprache (de/en)
      nativeFlag: state.uiLang === "en" ? "🇬🇧" : "🇩🇪",         // Flagge der Muttersprache (für Richtungs-Labels)
      nativeLabel: state.uiLang === "en" ? "English" : "Deutsch", // Klartext der Muttersprache
      theme: effectiveTheme(),
      allLevels: state.levels.length === 0,
      levels,
      categories: sortedCategories,
      totalDue: dueIn(all).length,
      sessionCap: SESSION_CAP,
      totalCards: all.length,
      hasBadges: !!badges,       // Offline-Guard: Nav-Eintrag nur mit geladenem Modul
      syncEnabled: !!(window.SC.sync && window.SC.sync.enabled()), // optionale Cloud-Sync (nur per Edition)
      syncLoggedIn: !!(window.SC.sync && window.SC.sync.loggedIn && window.SC.sync.loggedIn()),
      syncOrg: (window.SC.config && window.SC.config.sync && window.SC.config.sync.orgLabel) || "",
      socialEnabled: !!(window.SC.social && window.SC.social.enabled()), // opt-in Freunde/Rangliste (nur per Edition)
      socialLoggedIn: !!(window.SC.social && window.SC.social.loggedIn && window.SC.social.loggedIn()),
      hasCountries: !!countries, // dito für die Länderkunde
      hasHistoria: !!historia,   // dito für die Geschichte Südamerikas
      hasHistoriaCentro: !!historiaCentro, // dito für die Geschichte Mittelamerikas
      hasKnigge: !!knigge,       // dito für den Reise-Knigge
      hasSpeech: !!(speech && speech.isSupported()), // Precios braucht Sprachausgabe
      hasFrases: !!frases,       // Satzbaukasten braucht das frases-Modul
      hasDialogos: !!(dialogos && dialogos.DIALOGOS_SCENARIOS && dialogos.DIALOGOS_SCENARIOS.length), // Gesprächs-Simulationen
      hasRegatear: !!regatear,   // Verhandeln-Modul (Regatear)
      hasLogistica: !!logistica, // Reise-Logistik (SIM, Geld, Gepäck)
      hasSalud: !!salud,         // Gesund & fit (Essen, Trinken, Bewegung)
      hasFotos: !!fotografia,    // Fotos & Videos (tolle Reisebilder)
      hasFlirt: !!flirt,         // Coqueteo y romance (flirten & daten unterwegs)
      hasBailar: !!bailar,       // Bailar (Tanzen in LatAm, Schritt-Diagramme)
      hasMusica: !!musica,       // Música (Genres LatAm + Spotify/Apple-Links)
      hasBebidas: !!(bebidas && countries), // Bebidas AM/PM (braucht Länderliste)
      hasYesto: !!(yesto && yesto.THEMES && yesto.THEMES.length), // „¿Y esto?“ Bild-Vokabel-Modus

      hasPlacement: !!placement, // Ruta-Check (Einstufungstest)
      placement: placementProfileVM(), // Ruta-Check-Ergebnis + Verlauf fürs Profil (null = Modul fehlt)
      hasAssessment: !!assessment, // HolaRuta Nivel-Test (ausführlicher Einstufungstest)
      assessment: assessmentProfileVM(), // Nivel-Test-Ergebnis + Verlauf fürs Profil (null = Modul fehlt)
      assessmentResume: assessmentResumeVM(), // laufender, unabgeschlossener Nivel-Test fürs Dashboard (oder null)
      badgeCount: badges ? Object.keys(gamestats.unlocked || {}).length : 0,
      favCount: favorites.length, // ⭐ „Mi léxico"-Zähler für den Profil-Nav-Eintrag
      favLast: favorites.length ? { es: favorites[0].es, de: favorites[0].de } : null, // jüngster Favorit für die Dashboard-Vorschau
      streak: currentStreak(),
      xp: xpVM(),
      overall: {
        mastered: overall.mastered,
        learning: overall.learning,
        neu: overall.neu,
        total: overall.total,
        pct: overall.total ? Math.round((overall.mastered / overall.total) * 100) : 0,
      },
      lastCat,
      userName: profileName(),                  // Reise-Name normalisiert (konsistent mit Diálogos/Battle/Share)
      userGender: settings.userGender === "female" || settings.userGender === "male" ? settings.userGender : "", // ♀/♂ (für Anrede)
      onboardStep: state.onboardStep || "intro", // Onboarding-Teilschritt (Erklär-Slides → Name+Geschlecht → Reiseziel)
      onboardSlide: state.onboardSlide || 0,     // aktuelle Erklär-Slide im Intro-Schritt
      placementDone: !!gamestats.placement,     // Ruta-Check schon absolviert?
      placementPending: settings.placementPending === true, // beim Onboarding übersprungen → als offen anzeigen
      speechRate: settings.speechRate || 0.95, // gewähltes Sprechtempo (Default normal)
      celebrateSound: !!settings.celebrateSound, // Belohnungs-Sound an/aus (Default aus)
      rutaDone: !!(gamestats.rutaDays && gamestats.rutaDays[dayKey(Date.now())]), // Ruta del día heute schon gelaufen?
      trip: tripGoalVM(),       // Trip-Ziel-Karte (null = kein Ziel gesetzt)
      tripEdit: state.tripEdit, // Formular aufgeklappt?
      tripRouteOpen: state.tripRouteOpen !== false, // Route-Zeitleiste auf-/eingeklappt
      tripSwitchOpen: !!state.tripSwitchOpen,        // Schnellwechsel-Chips auf-/eingeklappt
      tripRouteIds: (gamestats.tripGoal && Array.isArray(gamestats.tripGoal.route) ? gamestats.tripGoal.route : []).map((s) => s.id), // Länder schon in der Route (Chip-Markierung)
      tripCountryBev: tripCountryBev(), // Tag-/Abendgetränk + Akzent + Gruß fürs Erscheinungsbild-Schild (oder null)
      showColombiaPreset: tripMentions("colombia"), // Pre-Arrival-Kachel nur bei Kolumbien-Bezug
      showCartagenaPreset: tripMentions("cartagena"), // Stadt-Pack-Kachel nur bei Cartagena-Bezug
      showMedellinPreset: tripMentions("medellin"), // Stadt-Pack-Kachel nur bei Medellín-Bezug
      showCuscoPreset: tripMentions("cusco"),       // Stadt-Pack-Kachel nur bei Cusco-Bezug
      showCdmxPreset: tripMentions("cdmx"),         // Stadt-Pack-Kachel nur bei CDMX-Bezug
      showAntiguaPreset: tripMentions("antigua"),   // Stadt-Pack-Kachel nur bei Antigua-Bezug
      showBuenosAiresPreset: tripMentions("buenosaires"), // Stadt-Pack-Kachel nur bei BA-Bezug
      showQuitoPreset: tripMentions("quito"),       // Stadt-Pack-Kachel nur bei Quito-Bezug
      showLimaPreset: tripMentions("lima"),
      showArequipaPreset: tripMentions("arequipa"),
      showMendozaPreset: tripMentions("mendoza"),
      showBarilochePreset: tripMentions("bariloche"),
      showOaxacaPreset: tripMentions("oaxaca"),
      showMeridaPreset: tripMentions("merida"),
      showArenalPreset: tripMentions("arenal"),
      showMonteverdePreset: tripMentions("monteverde"),
      showSantiagoPreset: tripMentions("santiago"),
      showValparaisoPreset: tripMentions("valparaiso"),
      showAtacamaPreset: tripMentions("atacama"),
      showLapazPreset: tripMentions("lapaz"),
      showUyuniPreset: tripMentions("uyuni"),
      showPuertonatalesPreset: tripMentions("puertonatales"),
      showPuconPreset: tripMentions("pucon"),
      showCopacabanaPreset: tripMentions("copacabana"),
      showSucrePreset: tripMentions("sucre"),
      showPeruPreset: tripMentions("peru"),         // Pre-Arrival-Kachel nur bei Peru-Bezug
      showMexicoPreset: tripMentions("mexico"),     // Pre-Arrival-Kachel nur bei Mexiko-Bezug
      showCostaRicaPreset: tripMentions("costarica"), // Pre-Arrival-Kachel nur bei Costa-Rica-Bezug
      showEcuadorPreset: tripMentions("ecuador"),   // Pre-Arrival-Kachel nur bei Ecuador-Bezug
      showGuatemalaPreset: tripMentions("guatemala"), // Pre-Arrival-Kachel nur bei Guatemala-Bezug
      showArgentinaPreset: tripMentions("argentina"), // Pre-Arrival-Kachel nur bei Argentinien-Bezug
      showChilePreset: tripMentions("chile"),       // Pre-Arrival-Kachel nur bei Chile-Bezug
      showBoliviaPreset: tripMentions("bolivia"),   // Pre-Arrival-Kachel nur bei Bolivien-Bezug
      // Status der Pre-Arrival-Pakete (Häkchen + „12/40"-Fortschritt). Nur für die
      // tatsächlich SICHTBAREN Kacheln rechnen (spart Arbeit pro Render).
      presetStatus: (function () {
        const m = {};
        const shown = {
          "prearrival-co": tripMentions("colombia"), "prearrival-ctg": tripMentions("cartagena"),
          "prearrival-med": tripMentions("medellin"), "prearrival-cus": tripMentions("cusco"),
          "prearrival-cdmx": tripMentions("cdmx"), "prearrival-ant": tripMentions("antigua"),
          "prearrival-bue": tripMentions("buenosaires"), "prearrival-qui": tripMentions("quito"),
          "prearrival-lima": tripMentions("lima"),
          "prearrival-arequipa": tripMentions("arequipa"),
          "prearrival-mendoza": tripMentions("mendoza"),
          "prearrival-bariloche": tripMentions("bariloche"),
          "prearrival-oaxaca": tripMentions("oaxaca"),
          "prearrival-merida": tripMentions("merida"),
          "prearrival-arenal": tripMentions("arenal"),
          "prearrival-monteverde": tripMentions("monteverde"),
          "prearrival-santiago": tripMentions("santiago"),
          "prearrival-valparaiso": tripMentions("valparaiso"),
          "prearrival-atacama": tripMentions("atacama"),
          "prearrival-lapaz": tripMentions("lapaz"),
          "prearrival-uyuni": tripMentions("uyuni"),
          "prearrival-puertonatales": tripMentions("puertonatales"),
          "prearrival-pucon": tripMentions("pucon"),
          "prearrival-copacabana": tripMentions("copacabana"),
          "prearrival-sucre": tripMentions("sucre"),
          "prearrival-pe": tripMentions("peru"),
          "prearrival-mx": tripMentions("mexico"), "prearrival-cr": tripMentions("costarica"),
          "prearrival-ec": tripMentions("ecuador"), "prearrival-gt": tripMentions("guatemala"),
          "prearrival-ar": tripMentions("argentina"), "prearrival-cl": tripMentions("chile"),
          "prearrival-bo": tripMentions("bolivia"),
        };
        (data.PRESETS || []).forEach((p) => {
          if (!shown[p.id]) return;
          const prog = taskProgress({ kind: "preset", scope: p.id });
          m[p.id] = { done: prog.total > 0 && prog.seen >= prog.total, seen: prog.seen, total: prog.total };
        });
        return m;
      })(),
      edition: editionInfo(),   // Co-Branding-Credit im Profil (null = keine Edition)
      tab: state.homeTab,
      install: installVM(),
      shareFormat: shareFormat(), // gewähltes Sharepic-Format (für den Ruta-Check-Teilen-Block)
    };
  }

  // „Auf den Startbildschirm"-Hinweis fürs Profil. Leer, wenn die App schon
  // installiert ist oder als Einzeldatei läuft (siehe install.js).
  function installVM() {
    const inst = window.SC && window.SC.install;
    if (!inst) return { show: false };
    // Läuft die App bereits installiert (standalone), zeigen wir eine klare
    // „offline installiert"-Bestätigung. isIOS mitgeben, damit die UI dort den
    // iOS-Konsequenz-Hinweis zeigt (NICHT erneut zum Startbildschirm hinzufügen –
    // iOS legt sonst eine leere zweite Kopie mit eigenem Speicher an).
    if (inst.isInstalled()) return { show: true, installed: true, isIOS: inst.isIOS() };
    // Als file://-Einzeldatei ist keine PWA-Installation möglich -> nichts zeigen.
    if (inst.isHosted && !inst.isHosted()) return { show: false };
    // Sonst: Status „noch nicht installiert" immer anzeigen. Der nächste Schritt
    // hängt vom Browser ab: nativer Dialog (Android), iOS-Anleitung oder der
    // generische Menü-Hinweis (Desktop / Android ohne beforeinstallprompt).
    return {
      show: true,
      installed: false,
      canPrompt: inst.canPrompt(),
      isIOS: inst.isIOS(),
      hint: t("app.installHintIos"),
    };
  }

  function studyVM() {
    const card = cardById(state.queue[0]);
    const cat = categoryById(card.cat);
    const isAll = state.scopeId === "all";
    const lvl = levelById(card.lvl);
    // Lernrichtung: native→ES zeigt die Muttersprache als Frage und Spanisch als
    // Antwort; ES→native dreht das um. Aussprache-Tipps gehören immer zum Spanischen.
    const spanishIsQuestion = state.dir === "es2de";
    const native = nat(card); // muttersprachlicher Text (de oder en)
    return {
      mode: state.mode,
      dir: state.dir,
      card,
      cardId: card.id,
      isFav: isFavorite(card.id),
      question: spanishIsQuestion ? card.es : native,
      answer: spanishIsQuestion ? native : card.es,
      es: card.es, // Hör-Modus deckt immer das Spanische auf (richtungsunabhängig)
      de: native, // dazu die muttersprachliche Bedeutung als Verständnis-Hilfe
      spanishIsQuestion,
      tip: card.tip || null,
      level: lvl ? { label: natk(lvl, "label"), short: lvl.short, color: lvl.color } : null,
      catLabel: isAll ? t("app.allTopics") : (cat ? natk(cat, "label") : ""),
      catIcon: isAll || !cat ? "📚" : cat.icon,
      accent: isAll || !cat ? DEFAULT_ACCENT : cat.grad,
      position: state.total - state.queue.length,
      total: state.total,
      revealed: state.revealed,
      typeResult: state.typeResult,
      context: card.context ? withNameObj(loc(card.context)) : null,
      contextOpen: state.contextOpen,
      swatch: card.swatch || null,
    };
  }

  // Das Runden-Ergebnis für die Belohnungs-Inszenierung (SC.celebrate) bauen.
  // Alle Felder sind optional – die reine decide()-Engine in celebrate.js leitet
  // Fehlendes ab und klemmt Müll. Quelle: Session-Zähler (state.session) + die Diffs
  // gegen den Rundenbeginn-Schnappschuss (state.roundSnapshot).
  function doneVM() {
    const isAll = state.scopeId === "all";
    const cat = categoryById(state.scopeId);
    const s = state.session || { right: 0, wrong: 0, seen: new Set() };
    const answered = s.right + s.wrong;
    const snap = state.roundSnapshot || {};
    const newBadges = Object.keys(gamestats.unlocked || {})
      .filter((id) => !snap.unlocked || !snap.unlocked[id])
      .map((id) => {
        const m = badges && badges.badgeMeta ? badges.badgeMeta(id) : null;
        return m ? { id: m.id, icon: m.icon, name: natk(m, "name") } : null;
      })
      .filter(Boolean);
    const streakNow = currentStreak();
    const xp = state.roundResult || {}; // von finishRound(): xpBefore/xpGained/xpAfter/level*
    return {
      scope: isAll ? t("app.allTopics") : (cat ? natk(cat, "label") : ""),
      mode: state.mode,
      total: state.total || answered,
      right: s.right,
      wrong: s.wrong,
      accuracy: answered ? Math.round((s.right / answered) * 100) : 0,
      streakBefore: snap.streak || 0,
      streak: streakNow,
      streakIsNew: streakNow > (snap.streak || 0),
      newBadges,
      destinationComplete: pretripJustCompleted(), // {name,country}|null
      isFirstEver: !snap.everStudied,
      // XP-/Rang-Layer (BAUPLAN §6): fehlt finishRound, bleiben die Felder undefined
      // und decide() zeigt weder Level-Up noch XP-Pille.
      xpBefore: xp.xpBefore,
      xpGained: xp.xpGained,
      xpAfter: xp.xpAfter,
      levelBefore: xp.levelBefore,
      levelAfter: xp.levelAfter,
      origin: state.studyOrigin || null, // 'pretrip' | 'task' | null -> bestimmt den Zurück-Knopf
    };
  }

  // Wurde mit DIESER Runde ein ganzes Reiseziel-Pack (Pre-Trip-Plan) fertig?
  // recordPretripDay() in rate() hat den Tag schon vermerkt, bevor das Done rendert –
  // also spiegelt planAllDone() den frisch erreichten Stand. Gibt {name,country}
  // (Ziel-Label aus der Kategorie) zurück, sonst null. Keine neue Datenstruktur.
  function pretripJustCompleted() {
    if (state.studyOrigin !== "pretrip" || !state.pretripScope) return null;
    const plan = pretripPlan(state.pretripScope);
    if (!planAllDone(plan)) return null;
    const cat = categoryById(state.pretripScope);
    return { name: cat ? natk(cat, "label") : state.pretripScope, country: "" };
  }

  // Eine Karte für Listen/Detail aufbereiten (Karte + Statistik + Anzeige-Texte).
  function cardRowVM(card) {
    const cat = categoryById(card.cat);
    const lvl = levelById(card.lvl);
    const s = stats.cardSummary(progress[card.id]);
    return {
      id: card.id,
      de: nat(card),
      es: card.es,
      tip: card.tip || null,
      catLabel: cat ? natk(cat, "label") : "",
      catIcon: cat ? cat.icon : "📚",
      accent: cat ? cat.grad : DEFAULT_ACCENT,
      level: lvl ? { label: natk(lvl, "label"), short: lvl.short, color: lvl.color } : null,
      swatch: card.swatch || null,
      s,
    };
  }

  // Statistik-Übersicht: Kennzahlen + gefilterte/sortierte Kartenliste.
  // Reise-Rang/XP fürs Profil & Cockpit. Spiegelt dieselbe XP-Leiter wie die
  // Belohnungs-Inszenierung (SC.celebrate), damit der im Done-Screen vergebene
  // XP-Stand auch dauerhaft sichtbar ist (nicht nur kurz nach der Runde).
  // Liefert immer ein Objekt – fehlt celebrate.js, fällt es still auf Turista/0 XP.
  function xpVM() {
    const cel = window.SC && SC.celebrate;
    const levels = (cel && cel.VIAJERO_LEVELS) || [];
    const xp = Math.max(0, gamestats.xp || 0);
    const level = (cel && cel.levelForXp)
      ? cel.levelForXp(xp)
      : { n: 0, name: "Turista", min: 0 };
    const next = levels.find((l) => l.min > level.min) || null;
    const span = next ? next.min - level.min : 0;
    const into = xp - level.min;
    // floor statt round: der Balken erreicht 100 % erst beim tatsächlichen
    // Rang-Aufstieg, nicht schon ~1 XP davor (sonst „voll", aber „Noch 1 XP …").
    const pct = next && span > 0
      ? Math.max(0, Math.min(100, Math.floor((into / span) * 100)))
      : 100;
    return {
      xp,
      rankName: level.name,
      rankN: level.n,
      nextName: next ? next.name : null,
      xpToNext: next ? Math.max(0, next.min - xp) : 0,
      pct,
    };
  }

  function statsVM() {
    const all = allCards();
    const ov = stats.overview(all, progress);
    const filter = state.statsFilter;

    // Filtern.
    let rows = all.map(cardRowVM).filter((r) => {
      if (filter === "answered") return r.s.seen > 0;
      if (filter === "hard") return r.s.hard;
      if (filter === "mastered") return r.s.status === "mastered";
      if (filter === "new") return r.s.status === "new";
      return true; // 'all'
    });

    // Sortieren: schwächste zuerst (niedrige Trefferquote), Ungesehene ans Ende.
    rows = rows.sort((a, b) => {
      const ar = a.s.rate, br = b.s.rate;
      if (ar === null && br === null) return 0;
      if (ar === null) return 1;
      if (br === null) return -1;
      if (ar !== br) return ar - br;          // schlechtere Quote zuerst
      return (b.s.lastAt || 0) - (a.s.lastAt || 0); // zuletzt gelernt zuerst
    });

    // Anzeige-Texte je Zeile ergänzen (Fälligkeit).
    const list = rows.map((r) => Object.assign({}, r, { dueText: fmtDue(r.s.due) }));

    return {
      overview: ov,
      xp: xpVM(),
      filter,
      filters: [
        { id: "answered", label: t("app.statAnswered"), count: ov.seenCards },
        { id: "hard", label: t("app.statHard"), count: ov.hard },
        { id: "mastered", label: t("app.statMastered"), count: ov.mastered },
        { id: "new", label: t("app.statNew"), count: ov.neu },
        { id: "all", label: t("app.all"), count: ov.total },
      ],
      list,
      masteredDays: stats.MASTERED_DAYS,
      shareFormat: shareFormat(),
    };
  }

  // Detailseite einer einzelnen Karte.
  function cardVM() {
    const card = cardById(state.cardId);
    if (!card) return null;
    const vm = cardRowVM(card);
    return Object.assign({}, vm, {
      firstText: fmtDate(vm.s.firstAt),
      lastText: fmtDate(vm.s.lastAt),
      dueText: fmtDue(vm.s.due),
      shareFormat: shareFormat(),
      context: card.context ? withNameObj(loc(card.context)) : null,
      contextOpen: state.contextOpen,
      isFav: isFavorite(card.id),
    });
  }

  // Länderkunde-Infoseite: gewähltes Land + nach Region gruppierte Dropdown-Optionen.
  function infoVM() {
    const list = countries ? countries.LIST : [];
    const regions = countries ? countries.REGIONS : [];
    const country = list.find((c) => c.id === state.countryId) || list[0] || null;
    const groups = regions
      .map((region) => ({
        region,
        countries: list
          .filter((c) => c.region === region)
          .map((c) => ({ id: c.id, name: c.name, flag: c.flag, selected: country && c.id === country.id })),
      }))
      .filter((g) => g.countries.length > 0);
    // Das ganze Land-Objekt (tagline/about/history/words/foods …) für die aktive
    // Sprache lokalisieren; Eigennamen ohne …En-Pendant bleiben unverändert.
    return { country: country ? loc(country) : null, groups, hasHistoria: !!historia, hasHistoriaCentro: !!historiaCentro };
  }

  // Historia de Sudamérica: reine Erklärseite. Reicht die Inhalte per localizeDeep
  // (deutsche Felder + …En-Pendants) für die aktive Sprache durch – analog zu
  // regatearVM/logisticaVM. INTRO/FACTS sind {de,en}-Objekte (nativeText).
  // Aktives Geschichts-Modul nach Region (state.histRegion: "sur" | "centro").
  // So teilen sich Süd- und Mittelamerika dieselbe Render-/Share-Mechanik.
  function histMod() { return state.histRegion === "centro" ? historiaCentro : historia; }
  function histTitle() { return state.histRegion === "centro" ? "🌋 Historia de Centroamérica" : "📜 Historia de Sudamérica"; }

  function historiaVM() {
    const mod = histMod();
    if (!mod) return { intro: "", eras: [], figures: [], tensions: [], facts: [], topTitle: histTitle() };
    return {
      topTitle: histTitle(),
      intro: nat(mod.INTRO),
      eras: loc(mod.ERAS || []),
      figures: loc(mod.FIGURES || []),
      tensions: loc(mod.TENSIONS || []),
      facts: (mod.FACTS || []).map(nat),
    };
  }

  // Reise-Knigge: gewähltes Land (teilt state.countryId mit der Länderkunde),
  // Region-Gruppen fürs Dropdown wie infoVM, plus die allgemeinen Themenblöcke
  // mit eingehängtem landesspezifischem Akzent.
  function kniggeVM() {
    const list = countries ? countries.LIST : [];
    const regions = countries ? countries.REGIONS : [];
    const country = list.find((c) => c.id === state.countryId) || list[0] || null;
    const groups = regions
      .map((region) => ({
        region,
        countries: list
          .filter((c) => c.region === region)
          .map((c) => ({ id: c.id, name: c.name, flag: c.flag, selected: country && c.id === country.id })),
      }))
      .filter((g) => g.countries.length > 0);
    const accents = (country && knigge && knigge.ACCENTS[country.id]) || {};
    const topics = (knigge ? knigge.TOPICS : []).map((t) => ({
      icon: t.icon,
      title: natk(t, "title"),
      intro: natk(t, "intro"),
      dos: natk(t, "dos"),
      donts: natk(t, "donts"),
      accent: natk(accents, t.id) || "",
    }));
    return { country, groups, topics };
  }

  // Bebidas AM/PM: Tag-/Abendgetränk des gewählten Landes. Nutzt dieselbe
  // Länder-Auswahl wie die Länderkunde (state.countryId), sodass die Tafel immer
  // das Land der Reise zeigt. Der AM/PM-Schalter liegt in state.bebMode (null =
  // nach Uhrzeit voreingestellt: 6–17 Uhr Tag, sonst Abend).
  function bebidasVM() {
    const list = countries ? countries.LIST : [];
    const regions = countries ? countries.REGIONS : [];
    const country = list.find((c) => c.id === state.countryId) || list[0] || null;
    const groups = regions
      .map((region) => ({
        region,
        countries: list
          .filter((c) => c.region === region)
          .map((c) => ({ id: c.id, name: c.name, flag: c.flag, selected: country && c.id === country.id })),
      }))
      .filter((g) => g.countries.length > 0);
    const data = (country && bebidas && bebidas.BEBIDAS[country.id]) || null;
    const regionLabel = country && bebidas ? (bebidas.REGION_LABEL[country.region] || country.region) : "";
    return { country, groups, data, regionLabel, mode: state.bebMode || bebDefaultMode() };
  }

  // AM/PM-Voreinstellung nach Uhrzeit: 6–17 Uhr Tag (AM), sonst Abend (PM).
  function bebDefaultMode() {
    const h = new Date().getHours();
    return h >= 6 && h < 17 ? "am" : "pm";
  }

  // Regatear: Verhandeln/Feilschen – reine Anzeige-Seite (Taktik, Sätze,
  // Einheiten, Rollenspiele). Reicht die Daten 1:1 durch, hängt nur an den
  // Rollenspielen das Kurz-Label der Schwierigkeitsstufe an.
  function regatearVM() {
    if (!regatear) return { intro: "", tips: [], glossary: [], phrases: [], units: [], regional: [], roleplays: [] };
    const roleplays = (regatear.ROLEPLAYS || []).map((r) => {
      const lvl = levelById(r.level);
      return Object.assign({}, r, { lvlShort: lvl ? lvl.short : "" });
    });
    // Pass-Through-Ansicht: alle …En-Felder (Tipps, Glossar, Sätze, Regionales,
    // Rollenspiele) per localizeDeep für die aktive Sprache überlagern. INTRO ist
    // eine eigenständige Konstante (INTRO_EN) und wird separat aufgelöst.
    const en = i18n && i18n.getLang() === "en";
    const loc = (v) => (i18n ? i18n.localizeDeep(v) : v);
    return {
      intro: (en && regatear.INTRO_EN) ? regatear.INTRO_EN : regatear.INTRO,
      tips: loc(regatear.TIPS || []),
      glossary: loc(regatear.GLOSSARY || []),
      phrases: loc(regatear.PHRASES || []),
      units: loc(regatear.UNITS || []),
      regional: loc(regatear.REGIONAL || []),
      // {name} auch hier auflösen – symmetrisch zu roleplayVM, falls künftig ein
      // Regatear-Rollenspiel den Platzhalter nutzt (sonst stünde „{name}" im Text).
      roleplays: loc(roleplays).map((r) => Object.assign({}, r, {
        dialogue: (r.dialogue || []).map((d) => Object.assign({}, d, { es: withName(d.es), de: withName(d.de) })),
        usefulPhrases: (r.usefulPhrases || []).map(withName),
      })),
    };
  }

  // Logística de viaje: praktische Reise-Logistik (SIM, Geld, Gepäck, Tracker,
  // Handgepäck-Notfallset) – reine Anzeige-Seite. Reicht die Daten 1:1 durch und
  // überlagert per localizeDeep alle …En-Felder für die aktive Sprache (wie
  // regatearVM). INTRO ist eine eigene Konstante und wird separat aufgelöst.
  function logisticaVM() {
    if (!logistica) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = i18n && i18n.getLang() === "en";
    const loc = (v) => (i18n ? i18n.localizeDeep(v) : v);
    return {
      intro: (en && logistica.INTRO_EN) ? logistica.INTRO_EN : logistica.INTRO,
      topics: loc(logistica.TOPICS || []),
      phrases: loc(logistica.PHRASES || []),
      glossary: loc(logistica.GLOSSARY || []),
      checklist: loc(logistica.CHECKLIST || []),
    };
  }

  // Salud y energía: gesund & fit unterwegs (Essen, Trinken, Bauch, Sonne/Höhe,
  // Bewegung). Gleiches Schema und Pass-Through wie logisticaVM.
  function saludVM() {
    if (!salud) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = i18n && i18n.getLang() === "en";
    const loc = (v) => (i18n ? i18n.localizeDeep(v) : v);
    return {
      intro: (en && salud.INTRO_EN) ? salud.INTRO_EN : salud.INTRO,
      topics: loc(salud.TOPICS || []),
      phrases: loc(salud.PHRASES || []),
      glossary: loc(salud.GLOSSARY || []),
      checklist: loc(salud.CHECKLIST || []),
    };
  }

  // Fotos & Videos: praktische Tipps (Topics mit DOs/Don'ts + spanisches
  // Lesetraining wie in der Historia), Sätze zum Bitten/Platz-Machen, der
  // Teilen-Block (AirDrop/Quick Share) plus Foto-Apps (Mymories), Glossar, Kit.
  function fotosVM() {
    if (!fotografia) return { intro: "", topics: [], phrases: [], sharing: null, apps: [], glossary: [], checklist: [] };
    const en = i18n && i18n.getLang() === "en";
    const loc = (v) => (i18n ? i18n.localizeDeep(v) : v);
    return {
      intro: (en && fotografia.INTRO_EN) ? fotografia.INTRO_EN : fotografia.INTRO,
      topics: loc(fotografia.TOPICS || []),
      phrases: loc(fotografia.PHRASES || []),
      sharing: fotografia.SHARING ? loc(fotografia.SHARING) : null,
      apps: loc(fotografia.APPS || []),
      glossary: loc(fotografia.GLOSSARY || []),
      checklist: loc(fotografia.CHECKLIST || []),
    };
  }

  // Coqueteo y romance: flirten & daten unterwegs (Ansprechen, Komplimente,
  // Konsens, Date vorschlagen, Dating-Kultur, Sicherheit). Gleiches Schema und
  // Pass-Through wie saludVM/logisticaVM.
  function flirtVM() {
    if (!flirt) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = i18n && i18n.getLang() === "en";
    const loc = (v) => (i18n ? i18n.localizeDeep(v) : v);
    return {
      intro: (en && flirt.INTRO_EN) ? flirt.INTRO_EN : flirt.INTRO,
      topics: loc(flirt.TOPICS || []),
      phrases: loc(flirt.PHRASES || []),
      glossary: loc(flirt.GLOSSARY || []),
      checklist: loc(flirt.CHECKLIST || []),
    };
  }

  // Bailar: Tanzen in LatAm. Die Tänze (mit Schritt-Diagramm-Koordinaten,
  // Zählrhythmus, Tipps, Lesetraining und Video-Links), Sätze zum Auffordern,
  // ein Glossar und ein Tanz-Knigge. localizeDeep überlagert die …En-Felder.
  function bailarVM() {
    if (!bailar) return { intro: "", dances: [], phrases: [], glossary: [], checklist: [] };
    const en = i18n && i18n.getLang() === "en";
    const loc = (v) => (i18n ? i18n.localizeDeep(v) : v);
    return {
      intro: (en && bailar.INTRO_EN) ? bailar.INTRO_EN : bailar.INTRO,
      dances: loc(bailar.DANCES || []),
      phrases: loc(bailar.PHRASES || []),
      glossary: loc(bailar.GLOSSARY || []),
      checklist: loc(bailar.CHECKLIST || []),
    };
  }

  // Música: die großen Genres LatAms (mit ES-Lesetraining + Spotify/Apple-Deep-
  // Links), der Sound des gewählten Reiselands (state.countryId wie Bebidas/
  // Länderkunde), die Sätze zum Reden/Tanzen und ein Glossar. Pass-Through wie
  // saludVM; zusätzlich die Länder-Auswahl wie bebidasVM, damit der „Sound deines
  // Reiselands" immer das Land der Reise trifft.
  function musicaVM() {
    if (!musica) return { intro: "", genres: [], phrases: [], glossary: [], country: null, countryData: null, groups: [] };
    const en = i18n && i18n.getLang() === "en";
    const loc = (v) => (i18n ? i18n.localizeDeep(v) : v);
    const list = countries ? countries.LIST : [];
    const regions = countries ? countries.REGIONS : [];
    const country = list.find((c) => c.id === state.countryId) || list[0] || null;
    const groups = regions
      .map((region) => ({
        region,
        countries: list
          .filter((c) => c.region === region)
          .map((c) => ({ id: c.id, name: c.name, flag: c.flag, selected: country && c.id === country.id })),
      }))
      .filter((g) => g.countries.length > 0);
    const cd = (country && musica.COUNTRY[country.id]) ? loc(musica.COUNTRY[country.id]) : null;
    return {
      intro: (en && musica.INTRO_EN) ? musica.INTRO_EN : musica.INTRO,
      genres: loc(musica.GENRES || []),
      phrases: loc(musica.PHRASES || []),
      glossary: loc(musica.GLOSSARY || []),
      country: country ? { id: country.id, name: country.name, flag: country.flag } : null,
      countryData: cd,
      groups,
    };
  }

  // ----- Badge-System ("Mein Ruta-Pass") -----
  // Lokaler Tages-Schlüssel "YYYY-MM-DD" – Basis für die Lern-Serie (Streak).
  function dayKey(ms) {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  // Kalendertage zwischen zwei "YYYY-MM-DD"-Schlüsseln (b − a). Über lokale
  // Mitternacht gerechnet, damit Sommer-/Winterzeit (23-/25-Stunden-Tage) die
  // Serie nicht verfälscht – ein fixer 24-h-Abzug täte das nahe Mitternacht.
  function daysBetween(aKey, bKey) {
    const a = new Date(aKey + "T00:00:00");
    const b = new Date(bKey + "T00:00:00");
    if (isNaN(a) || isNaN(b)) return null;
    return Math.round((b - a) / DAY_MS);
  }

  // Aktuelle Tage-Serie für die Startseite: zählt nur, wenn zuletzt heute oder
  // gestern gelernt wurde – sonst ist die Serie gerissen und wird als 0 gezeigt.
  // (gamestats.dailyStreak selbst wird erst bei der nächsten Bewertung korrigiert.)
  function currentStreak() {
    const last = gamestats.lastStudyDate;
    if (!last) return 0;
    const gap = daysBetween(last, dayKey(Date.now()));
    // gap < 0: Zeitzonenwechsel nach Westen – die lokale Uhr liegt VOR dem
    // letzten Lerntag. Zählt wie "heute", die Serie ist nicht gerissen (R7).
    return gap !== null && gap <= 1 ? (gamestats.dailyStreak || 0) : 0;
  }

  // Eine neue Study-Runde anstoßen: Richtig/Falsch-Zähler zurücksetzen und einen
  // Schnappschuss des Spielstands ziehen (für die Diffs am Rundenende: frisch
  // freigeschaltete Badges, Streak-Sprung, allererste Runde). Wird an jeder Stelle
  // aufgerufen, die state.total für eine NEUE Runde setzt (Kategorie/Preset/Ruta/
  // Pre-Trip) – NICHT in rate()/skip(). Speist die Belohnungs-Inszenierung (celebrate.js).
  function beginRound() {
    state.session = { seen: new Set(), right: 0, wrong: 0 };
    state.roundSnapshot = {
      unlocked: Object.assign({}, gamestats.unlocked),
      streak: currentStreak(),
      everStudied: gamestats.lastStudyDate != null,
      xp: gamestats.xp || 0,           // XP-Stand vor der Runde (für die Level-Up-Szene)
    };
    state.roundResult = null;          // wird von finishRound() am Rundenende gefüllt
  }

  // Eine Runde abschließen: Reise-XP gutschreiben und das XP-/Rang-Ergebnis EINMAL
  // festhalten (state.roundResult). Wird genau einmal pro Runde aus rate() gerufen,
  // wenn die Queue leerläuft – NICHT aus doneVM()/render(), das sonst bei jedem
  // Re-Render erneut XP buchen würde. Fehlt das Modul (levelForXp), bleiben level*
  // einfach gleich und decide() zeigt nie „levelup" – nichts bricht.
  function finishRound() {
    const snap = state.roundSnapshot || {};
    const s = state.session || { right: 0, wrong: 0 };
    const answered = s.right + s.wrong;
    const accuracy = answered ? Math.round((s.right / answered) * 100) : 0;
    const streakIsNew = currentStreak() > (snap.streak || 0);
    // XP-Formel (BAUPLAN §6): pro Treffer 5, Perfektrunde +20, neuer Streak-Tag +10.
    const xpGained = s.right * 5 + (accuracy === 100 && answered > 0 ? 20 : 0) + (streakIsNew ? 10 : 0);
    const xpBefore = snap.xp != null ? snap.xp : (gamestats.xp || 0);
    const xpAfter = xpBefore + xpGained;
    const levelFor = (window.SC && SC.celebrate && SC.celebrate.levelForXp)
      ? (xp) => SC.celebrate.levelForXp(xp).n : () => 0;
    gamestats = Object.assign({}, gamestats, { xp: xpAfter });
    store.saveGameStats(gamestats);
    state.roundResult = {
      xpBefore: xpBefore,
      xpGained: xpGained,
      xpAfter: xpAfter,
      levelBefore: levelFor(xpBefore),
      levelAfter: levelFor(xpAfter),
    };
  }

  // ----- Trip-Ziel (Countdown + Tagesziel) -----
  // Optionales Reiseziel mit Datum und Karten-pro-Tag-Ziel. Schärft die Habit-
  // Schleife: „Noch 12 Tage bis Cusco · 8/15 heute". Liegt in gamestats
  // (tripGoal) und stützt sich auf den Tageszähler dailyCounts aus recordStudyEvent.
  // Erkennt am freien Trip-Ziel-Text, ob die Reise nach Kolumbien geht – steuert,
  // ob die „Pre-Arrival Kolumbien"-Kachel auf dem Dashboard erscheint (sonst bliebe
  // sie auch z. B. bei einer Mexiko-Reise sichtbar). Akzent-/Groß-Schreibung egal.
  // --- Reiseziel-Erkennung (datengetrieben) ----------------------------------
  // Früher: je Land/Stadt ein eigenes XXX_HINTS-Array + tripMentionsXxx()/isXxxDest().
  // Jetzt: eine Daten-Map DEST_HINTS und generische destMatches(id,text)/tripMentions(id).
  // Verhalten identisch: Akzent-/Groß-Schreibung egal (NFD-Normalisierung von Text UND
  // Hinweis). Erkennt am freien Trip-Ziel-Text bzw. an der Edition (config.defaultDestination),
  // ob die Reise ein bestimmtes Land/eine bestimmte Stadt meint – steuert Pre-Arrival-Kacheln
  // und den Default-Scope.
  const DEST_HINTS = {
    // Länder (Pre-Arrival-Kacheln)
    colombia: ["colombia", "kolumbien", "cartagena", "medellin", "bogota", "cali",
      "santa marta", "tayrona", "palomino", "minca", "guatape", "barranquilla",
      "getsemani", "caribe", "rosario"],
    peru: ["peru", "perú", "lima", "cusco", "cuzco", "machu picchu", "machupicchu",
      "arequipa", "titicaca", "puno", "colca", "ollantaytambo", "sacsayhuaman",
      "valle sagrado", "aguas calientes", "vinicunca", "nazca", "paracas", "huacachina"],
    mexico: ["mexico", "méxico", "mexiko", "cdmx", "ciudad de mexico", "oaxaca", "chiapas",
      "san cristobal", "palenque", "merida", "yucatan", "yucatán", "tulum", "cancun",
      "cancún", "valladolid", "bacalar", "playa del carmen", "riviera maya", "teotihuacan"],
    costarica: ["costa rica", "costarica", "san jose", "san josé", "la fortuna", "arenal",
      "monteverde", "manuel antonio", "tortuguero", "puerto viejo", "cahuita", "tamarindo",
      "rio celeste", "río celeste", "pacuare", "nicoya", "guanacaste", "uvita", "santa teresa"],
    ecuador: ["ecuador", "quito", "guayaquil", "cuenca", "otavalo", "cotopaxi", "quilotoa",
      "banos", "baños", "tena", "amazonia", "amazonía", "galapagos", "galápagos",
      "mitad del mundo", "montañita"],
    guatemala: ["guatemala", "antigua", "atitlan", "atitlán", "panajachel",
      "san pedro la laguna", "chichicastenango", "tikal", "flores", "semuc champey",
      "lanquin", "lanquín", "acatenango", "xela", "quetzaltenango"],
    argentina: ["argentina", "argentinien", "buenos aires", "patagonia", "patagonien",
      "el calafate", "el chalten", "el chaltén", "ushuaia", "bariloche", "mendoza",
      "iguazu", "iguazú", "salta", "fitz roy", "perito moreno"],
    chile: ["chile", "santiago", "valparaiso", "valparaíso", "atacama", "san pedro de atacama",
      "torres del paine", "puerto natales", "punta arenas", "pucon", "pucón", "chiloe",
      "chiloé", "isla de pascua", "rapa nui", "valle de la luna"],
    bolivia: ["bolivia", "bolivien", "la paz", "el alto", "uyuni", "salar de uyuni", "potosi",
      "potosí", "sucre", "copacabana", "isla del sol", "titicaca", "tiwanaku", "coroico",
      "rurrenabaque"],
    // Stadt-Packs (eigene, engere Stichwörter)
    cartagena: ["cartagena", "getsemani", "bocagrande", "islas del rosario", "san felipe"],
    medellin: ["medellin", "poblado", "laureles", "comuna 13", "envigado", "guatape"],
    cusco: ["cusco", "cuzco", "machu picchu", "machupicchu", "ollantaytambo", "valle sagrado",
      "aguas calientes", "sacsayhuaman", "pisac", "vinicunca"],
    cdmx: ["cdmx", "ciudad de mexico", "mexico city", "zocalo", "coyoacan", "condesa",
      "teotihuacan", "xochimilco"],
    // atitlan/panajachel bewusst NICHT hier (Atitlán-Region-Tokens, auch in guatemala) –
    // sonst stähle eine reine Guatemala-Reise „Lago de Atitlán“ den Antigua-Scope.
    antigua: ["antigua", "acatenango", "pacaya", "semana santa"],
    buenosaires: ["buenos aires", "palermo", "san telmo", "recoleta", "la boca", "subte", "ezeiza"],
    // otavalo/cotopaxi bewusst NICHT hier (Tagesausflugs-Ziele, auch in ecuador) –
    // sonst stähle eine reine Ecuador-Reise „Otavalo“/„Cotopaxi“ den Quito-Scope.
    quito: ["quito", "mitad del mundo", "teleferiqo", "la ronda"],
    lima: ["lima", "miraflores", "barranco", "callao", "jorge chavez", "costa verde", "pisco sour"],
    arequipa: ["arequipa", "colca", "misti", "santa catalina", "yanahuara", "sillar", "chachani"],
    mendoza: ["mendoza", "malbec", "aconcagua", "valle de uco", "ruta del vino"],
    bariloche: ["bariloche", "nahuel huapi", "cerro catedral", "circuito chico", "llao llao",
      "campanario", "siete lagos"],
    oaxaca: ["oaxaca", "monte alban", "hierve el agua", "tlayuda", "guelaguetza"],
    merida: ["merida", "yucatan", "cenote", "chichen itza", "uxmal", "valladolid", "cochinita"],
    arenal: ["fortuna", "arenal", "tabacon", "aguas termales", "catarata"],
    monteverde: ["monteverde", "santa elena", "bosque nuboso", "selvatura"],
    santiago: ["santiago", "bellavista", "providencia", "san cristobal", "bip", "la moneda",
      "cerro santa lucia"],
    valparaiso: ["valparaiso", "valparaíso", "cerro alegre", "cerro concepcion", "ascensor",
      "la sebastiana", "vina del mar"],
    atacama: ["atacama", "san pedro de atacama", "valle de la luna", "el tatio", "geiseres",
      "calama", "lagunas altiplanicas"],
    lapaz: ["la paz", "el alto", "teleferico", "mi teleferico", "mercado de las brujas",
      "valle de la luna", "death road"],
    uyuni: ["uyuni", "salar de uyuni", "salar", "cementerio de trenes", "colchani", "incahuasi",
      "isla incahuasi"],
    puertonatales: ["puerto natales", "torres del paine", "w trek", "paine", "conaf", "milodon"],
    pucon: ["pucon", "villarrica", "huerquehue", "trancura", "caburgua", "araucania"],
    copacabana: ["copacabana", "isla del sol", "cerro calvario", "tiquina", "yampupata"],
    sucre: ["sucre", "ciudad blanca", "plaza 25 de mayo", "cal orcko", "tarabuco",
      "casa de la libertad", "parque cretacico"],
  };
  const _normDest = (text) => String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const tripCfgDest = () => { const cfg = window.SC && window.SC.config; return cfg && cfg.defaultDestination; };
  // Trifft der Hinweis-Satz für `id` den gegebenen Text? (Akzent-/Case-unabhängig.)
  function destMatches(id, text) {
    const hints = DEST_HINTS[id];
    if (!hints || !text) return false;
    const norm = _normDest(text);
    return hints.some((h) => norm.includes(_normDest(h)));
  }
  // Meint das aktuelle Trip-Ziel ODER die Edition (config.defaultDestination) das Ziel `id`?
  function tripMentions(id) {
    const t = gamestats.tripGoal;
    return destMatches(id, t && t.destination) || destMatches(id, tripCfgDest());
  }

  // ----- Link-Parameter lesen/aufräumen (für geteilte Onboarding-Links) -----
  // Roher Parameterwert (NICHT kleinschreiben – Aufgaben-Codes sind base64, case-sensitiv).
  function urlParam(name) {
    try {
      var search = (location.search && location.search.length > 1) ? location.search : "";
      if (!search && location.hash && location.hash.indexOf("=") >= 0) search = location.hash.replace(/^#/, "?");
      return new URLSearchParams(search).get(name) || "";
    } catch (e) { return ""; }
  }
  function stripUrlParam(name) {
    try {
      if (!window.history || !history.replaceState || !location.search) return;
      var p = new URLSearchParams(location.search);
      if (!p.has(name)) return;
      p.delete(name);
      var qs = p.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + (location.hash || ""));
    } catch (e) { /* egal */ }
  }

  // ----- Co-Branding-Edition anwenden (einmalig beim Start) -----
  // Überschreibt nur den Akzent (--brand/--brand-ink, wirkt in Hell & Dunkel) und
  // die theme-color-Meta; NICHT --page, damit der Hell/Dunkel-Rahmen intakt bleibt.
  function applyEdition() {
    const c = window.SC && window.SC.config;
    if (!c || !c.edition) return; // keine Edition → exakt wie heute
    try {
      if (c.brandName) document.title = c.brandName + " – Reise-Spanisch";
      if (c.accent) {
        // Nur den Akzent überschreiben (wirkt in Hell & Dunkel). --page und die
        // theme-color-Meta bleiben der HolaRuta-Rahmen – sonst bräche der Dark Mode,
        // und applyTheme würde die theme-color beim Umschalten ohnehin zurücksetzen.
        const r = document.documentElement.style;
        if (c.accent.brand) r.setProperty("--brand", c.accent.brand);
        if (c.accent.brandInk) r.setProperty("--brand-ink", c.accent.brandInk);
      }
      // Appbar-Wortmarke um den Edition-Zusatz ergänzen (Teil nach „· "), damit die
      // Edition am sichtbarsten Ort erkennbar ist. Die Wortmarke liegt im statischen
      // Appshell (außerhalb von #app) und wird hier einmalig gesetzt.
      const parts = String(c.brandName || "").split("·");
      if (parts.length > 1) {
        const name = document.querySelector(".appbar__name");
        if (name && !name.querySelector(".appbar__edition")) {
          const tag = document.createElement("span");
          tag.className = "appbar__edition";
          tag.textContent = "· " + parts.slice(1).join("·").trim();
          name.appendChild(tag);
        }
      }
    } catch (e) { /* Edition ist optional – nie crashen */ }
  }

  // Edition-Infos für den dezenten Profil-Credit (null = keine Edition).
  function editionInfo() {
    const c = window.SC && window.SC.config;
    if (!c || !c.edition) return null;
    return { name: c.brandName, partner: c.partner || null, logo: c.logo || null };
  }

  function tripGoalVM() {
    const t = gamestats.tripGoal;
    if (!t) return null;
    const today = dayKey(Date.now());
    const daysLeft = daysBetween(today, t.endDate); // null wenn Datum kaputt
    const todayCount = (gamestats.dailyCounts && gamestats.dailyCounts[today]) || 0;
    const perDay = t.perDay || 1;
    // Karten über dem Tagesziel: für die "Ziel übertroffen"-Darstellung. Der Balken
    // ist bei >= Ziel ohnehin voll, deshalb genügt hier der reine Überschuss-Wert.
    const todayExtra = Math.max(0, todayCount - perDay);
    // Aufenthaltsdauer: aus einem konkreten Rückreisedatum berechnet (inkl. An- und
    // Abreisetag) – sonst die grob eingegebene Tageszahl. stayApprox unterscheidet
    // beide Fälle für die „ca."-Darstellung.
    let stayDays = 0;
    if (t.returnDate) {
      const span = daysBetween(t.endDate, t.returnDate);
      stayDays = span === null ? 0 : span + 1;
    } else if (t.stayDays) {
      stayDays = t.stayDays;
    }
    // Route (Zeitleiste): mehrere Reiseländer in Reihenfolge. Der Countdown nennt das
    // erste Ziel (dort kommt man zuerst an); das freie Textziel zählt als „eine Station",
    // wenn keine Route gesetzt ist.
    const route = Array.isArray(t.route)
      ? t.route.map((s) => ({ id: s.id || "", dest: s.dest, flag: s.flag || "" }))
      : [];
    const headDest = route.length ? route[0].dest : t.destination;
    return {
      destination: headDest,
      route,
      endDate: t.endDate,
      returnDate: t.returnDate || "",
      stayDays,
      stayApprox: !t.returnDate && !!t.stayDays,
      perDay,
      userName: profileName(), // persönliche Ansprache auf der Countdown-Karte (leer = neutral)
      daysLeft: daysLeft === null ? 0 : daysLeft, // <0 = Termin vorbei
      past: daysLeft !== null && daysLeft < 0,
      today: t.endDate === today,
      todayCount,
      todayDone: todayCount >= perDay,
      todayOver: todayExtra > 0, // über dem Tagesziel -> eigene Darstellung
      todayExtra,
      todayPct: Math.max(0, Math.min(100, Math.round((todayCount / perDay) * 100))),
    };
  }

  // Erkennt zum aktuellen Trip-Ziel das (unterstützte) Land – für den Schnellwechsel-
  // Chip im Profil (leuchtet das passende Land). Städte zählen zu ihrem Land
  // (z. B. Cartagena → Kolumbien), weil die tripMentions*-Hints sie mit abdecken.
  function tripCountryId() {
    // Bei gesetzter Route zählt das erste Land (dort beginnt die Reise) – so trägt das
    // Erscheinungsbild-Schild im Profil das Getränk der ersten Station.
    const r = gamestats.tripGoal && gamestats.tripGoal.route;
    if (Array.isArray(r) && r.length && r[0].id) return r[0].id;
    if (tripMentions("colombia")) return "colombia";
    if (tripMentions("peru")) return "peru";
    if (tripMentions("mexico")) return "mexico";
    if (tripMentions("costarica")) return "costarica";
    if (tripMentions("ecuador")) return "ecuador";
    if (tripMentions("guatemala")) return "guatemala";
    if (tripMentions("argentina")) return "argentina";
    if (tripMentions("chile")) return "chile";
    if (tripMentions("bolivia")) return "bolivia";
    return null;
  }

  // Tag-/Abendgetränk des erkannten Reiselands fürs Erscheinungsbild-Schild im
  // Profil: dasselbe AM/PM-Emaille-Schild trägt damit das Landesgetränk (wie
  // „Bebidas AM/PM"), leuchtet in der Landes-Akzentfarbe und der Begleittext wird
  // zum Landesgruß. Quelle ist dieselbe Tabelle wie bei Bebidas (bebidas.BEBIDAS
  // [id]: { accent, am, pm, greet }). Ohne erkanntes Land null → neutraler
  // Standard (Kaffee/Wein, warmer Schein).
  function tripCountryBev() {
    const id = tripCountryId();
    return (id && bebidas && bebidas.BEBIDAS[id]) || null;
  }

  // Reiseziel aus den Route-Stopps als Text (für Erkennung der Pre-Arrival-Kacheln &
  // den Countdown). Enthält alle Ländernamen, damit jede Station ihre Kachel auslöst.
  function routeDestText(route) {
    return route.map((s) => s.dest).join(", ");
  }

  // Route speichern: destination spiegelt die Route (Komma-Liste aller Länder), damit
  // die bestehende Land-Erkennung jede Station erfasst. Leere Route → freies Ziel leeren.
  function saveTripRoute(cur, route) {
    const goal = Object.assign({}, cur);
    if (route.length) {
      goal.route = route;
      goal.destination = routeDestText(route);
    } else {
      delete goal.route;
      goal.destination = "";
    }
    gamestats = Object.assign({}, gamestats, { tripGoal: goal });
    store.saveGameStats(gamestats);
    buzz(8);
    render();
  }

  // Schnellwechsel = Reiseland an die Zeitleiste ANHÄNGEN. So baut man Schritt für
  // Schritt die Reiseroute (z. B. zuerst El Salvador, dann Kolumbien, dann Peru).
  // Dasselbe Land direkt zweimal hintereinander wird übersprungen.
  // id -> Flagge für den ersten Stopp, wenn ein schon getipptes Freitext-Ziel in die
  // Zeitleiste übernommen wird. Spiegelt die Chip-Liste in ui.TRIP_COUNTRIES; fehlt ein
  // Eintrag, bleibt der Stopp einfach ohne Flagge (rein kosmetisch).
  const TRIP_FLAGS = {
    colombia: "🇨🇴", peru: "🇵🇪", mexico: "🇲🇽", costarica: "🇨🇷", ecuador: "🇪🇨",
    guatemala: "🇬🇹", elsalvador: "🇸🇻", argentina: "🇦🇷", chile: "🇨🇱", bolivia: "🇧🇴",
  };
  function addTripStop(id, dest, flag) {
    const cur = gamestats.tripGoal;
    if (!cur || !dest) return;
    const route = Array.isArray(cur.route) ? cur.route.slice() : [];
    let seeded = false;
    // Erster Stopp aus einem schon getippten Freitext-Ziel: nicht verwerfen, sondern als
    // Auftakt der Zeitleiste übernehmen (mit erkanntem Land + Flagge) – „zuerst Cartagena …".
    if (!route.length && cur.destination) {
      const seedId = tripCountryId() || "";
      const seedStop = { id: seedId, dest: cur.destination };
      if (TRIP_FLAGS[seedId]) seedStop.flag = TRIP_FLAGS[seedId];
      route.push(seedStop);
      seeded = true;
    }
    const last = route[route.length - 1];
    if (last && last.id && last.id === id) {
      // Getappte Flagge entspricht dem letzten Land. Einen frisch übernommenen Freitext
      // trotzdem als Ein-Stopp-Route sichern (so erscheint die Zeitleiste); sonst nichts tun.
      if (seeded) saveTripRoute(cur, route);
      return;
    }
    if (route.length >= 24) return; // großzügige Obergrenze gegen Endlos-Anhängen
    const stop = { id: String(id || ""), dest: String(dest).trim().slice(0, 80) };
    if (flag) stop.flag = String(flag);
    route.push(stop);
    saveTripRoute(cur, route);
  }

  // Einen Stopp aus der Zeitleiste entfernen (× am Routen-Eintrag im Profil).
  function removeTripStop(index) {
    const cur = gamestats.tripGoal;
    const route = cur && Array.isArray(cur.route) ? cur.route.slice() : [];
    if (index < 0 || index >= route.length) return;
    route.splice(index, 1);
    saveTripRoute(cur, route);
  }

  // Einen Stopp in der Zeitleiste verschieben (Drag & Drop im Profil): aus Position
  // `from` herausnehmen und an Position `to` wieder einsetzen. Die neue Reihenfolge
  // wird gespeichert; saveTripRoute rendert neu (Nummerierung & Karten-Header ziehen mit).
  function moveTripStop(from, to) {
    const cur = gamestats.tripGoal;
    const route = cur && Array.isArray(cur.route) ? cur.route.slice() : [];
    if (from < 0 || from >= route.length || to < 0 || to >= route.length || from === to) return;
    const moved = route.splice(from, 1)[0];
    route.splice(to, 0, moved);
    saveTripRoute(cur, route);
  }

  function setTripGoal(fields) {
    const destination = String(fields.destination || "").trim().slice(0, 80);
    const endDate = /^\d{4}-\d{2}-\d{2}$/.test(fields.endDate) ? fields.endDate : "";
    // Rohwert ZUERST prüfen: leeres/0/ungültiges Tagesziel ablehnen statt still auf
    // 1 zu klemmen (sonst wäre die Fehlermeldung toter Code). Danach auf ≤500 deckeln.
    const perDayRaw = Math.round(Number(fields.perDay));
    if (!endDate || !(perDayRaw >= 1)) {
      showNotice(t("app.tripInvalid"));
      return false;
    }
    const perDay = Math.min(500, perDayRaw);
    // Eine bestehende Route (Zeitleiste) bleibt beim Bearbeiten von Datum/Tagesziel
    // erhalten; das Textziel spiegelt dann die Route statt des (ausgeblendeten) Felds.
    const cur = gamestats.tripGoal;
    const route = cur && Array.isArray(cur.route) && cur.route.length ? cur.route : null;
    const goal = {
      destination: route ? routeDestText(route) : destination,
      endDate, perDay, startedAt: dayKey(Date.now()),
    };
    if (route) goal.route = route;
    // Aufenthaltsdauer optional: ein konkretes Rückreisedatum hat Vorrang; alternativ
    // eine grobe Tageszahl (lange Reisen ohne festes Datum). Eine Rückreise vor der
    // Abreise wird klar abgelehnt statt still verworfen.
    const returnDate = /^\d{4}-\d{2}-\d{2}$/.test(fields.returnDate) ? fields.returnDate : "";
    if (returnDate && returnDate < endDate) {
      showNotice(t("app.tripReturnInvalid"));
      return false;
    }
    const stayRaw = Math.round(Number(fields.stayDays));
    if (returnDate) {
      goal.returnDate = returnDate;
    } else if (stayRaw >= 1) {
      goal.stayDays = Math.min(400, stayRaw);
    }
    gamestats = Object.assign({}, gamestats, { tripGoal: goal });
    store.saveGameStats(gamestats);
    state.tripEdit = false;
    buzz(8);
    render();
    return true;
  }

  // Onboarding starten: mit den Erklär-Slides (Überblick „Wie funktioniert die App,
  // welchen Umfang hat sie") beginnen, danach Name + Geschlecht, dann Reiseziel. Den
  // Ruta-Check vorab als „noch offen" vormerken – so erscheint er im Dashboard,
  // falls er später übersprungen wird, und verschwindet erst nach dem Absolvieren.
  function beginOnboarding() {
    state.screen = "onboarding";
    state.onboardStep = "intro";
    state.onboardSlide = 0;
    settings = Object.assign({}, settings, { placementPending: true });
    store.saveSettings(settings);
  }

  // Onboarding einmalig als erledigt vermerken und aufs Dashboard wechseln. Der
  // Reiter bleibt „Lernen" (Standard); ein gesetztes Trip-Ziel taucht dort direkt auf.
  function finishOnboarding() {
    settings = Object.assign({}, settings, { onboarded: true });
    store.saveSettings(settings);
    state.tripEdit = false;
    setState({ screen: "home" });
  }

  function clearTripGoal() {
    gamestats = Object.assign({}, gamestats, { tripGoal: null });
    store.saveGameStats(gamestats);
    setState({ tripEdit: false });
  }

  function toggleTripEdit() {
    state.tripEdit = !state.tripEdit;
    render();
  }

  // Dashboard-Tap auf die Trip-Karte: ins Profil wechseln und das Bearbeiten-
  // Formular aufklappen (dort wird das Ziel verwaltet). setTab() rendert selbst.
  function openTripManage() {
    state.tripEdit = true;
    setTab("profil");
  }

  // Eine Bewertung in die Spiel-Zähler einbuchen: Streak fortschreiben,
  // Tageszeit-Marken setzen, "Nochmal"-Drücke und Gesamtzahl zählen. Immutabel.
  function recordStudyEvent(rating, now) {
    if (!badges) return;
    const g = Object.assign({}, gamestats);
    g.reviews = (g.reviews || 0) + 1;
    if (rating === srs.RATING.AGAIN) g.againPresses = (g.againPresses || 0) + 1;

    const today = dayKey(now);
    if (g.lastStudyDate !== today) {
      const gap = g.lastStudyDate ? daysBetween(g.lastStudyDate, today) : null;
      if (gap !== null && gap < 0) {
        // Westreise (R7): die lokale Uhr sprang über Zeitzonen auf einen
        // früheren Kalendertag zurück (Berlin -> Bogotá). Das zählt als
        // DERSELBE Lerntag: Serie weder zurücksetzen noch erneut erhöhen,
        // lastStudyDate nicht zurückdatieren (sonst doppeltes Inkrement,
        // sobald die lokale Uhr den Tag wieder erreicht).
        g.dailyStreak = Math.max(1, g.dailyStreak || 0);
      } else {
        g.dailyStreak = gap === 1 ? (g.dailyStreak || 0) + 1 : 1; // genau gestern -> +1, sonst neu
        g.lastStudyDate = today;
        g.longestStreak = Math.max(g.longestStreak || 0, g.dailyStreak);
      }
    }

    const hour = new Date(now).getHours();
    if (hour >= 22) g.nightOwl = true;   // "Midnight Español" – nach 22 Uhr
    if (hour < 9) g.earlyBird = true;    // "Café con Vocabulario" – vor 9 Uhr

    // Trip-Ziel: Tageszähler der heutigen Bewertungen fortschreiben (Fortschritts-
    // balken „X/Y heute"). Läuft unabhängig vom Streak, auch ohne gesetztes Ziel.
    const counts = Object.assign({}, g.dailyCounts);
    counts[today] = (counts[today] || 0) + 1;
    g.dailyCounts = counts;

    gamestats = g;
    store.saveGameStats(gamestats);
  }

  // Hör-Modus (Escuchar): eine im Hör-Modus bewertete Karte einbuchen (für die
  // 👂-Badges). Immutabel, eigener kleiner Zähler – läuft additiv zu recordStudyEvent.
  function recordListenReview() {
    if (!badges) return;
    gamestats = Object.assign({}, gamestats, { listenReviews: (gamestats.listenReviews || 0) + 1 });
    store.saveGameStats(gamestats);
  }

  // Eine erstmals geöffnete Kontext-Karte einbuchen und erfüllte Kontext-Badges
  // freischalten. Dedup: schon gesehene Karten sind ein No-Op – kein erneuter
  // localStorage-Write, kein Badge-Scan beim wiederholten Auf-/Zuklappen. Immutabel.
  function recordContextView(cardId, now) {
    if (!badges || !cardId) return;
    if (gamestats.contextCardsSeen[cardId]) return; // bereits gezählt
    const seen = Object.assign({}, gamestats.contextCardsSeen, { [cardId]: true });
    gamestats = Object.assign({}, gamestats, { contextCardsSeen: seen });
    store.saveGameStats(gamestats);
    syncBadges(now, true);
    paintBadgeToast(); // ohne Re-Render einblenden – das Kontext-Panel bleibt offen
  }

  // Glückwunsch-Einblendung einfügen, ohne den Screen neu zu rendern (sonst klappt
  // das gerade geöffnete Kontext-Panel wieder zu). Einen evtl. noch sichtbaren
  // älteren Toast ERSETZEN statt überspringen, damit das frische Badge nicht
  // verschluckt wird (state.badgeToast wurde gerade aktualisiert).
  function paintBadgeToast() {
    if (!badges || !state.badgeToast || !state.badgeToast.length) return;
    const existing = root.querySelector(".btoast");
    if (existing) existing.remove();
    root.insertAdjacentHTML("afterbegin", ui.badgeToast(state.badgeToast, profileName()));
  }

  // Erfüllte, aber noch nicht vermerkte Badges freischalten. announce=true sammelt
  // sie für die Glückwunsch-Einblendung; beim Start (false) still nachtragen.
  function syncBadges(now, announce) {
    if (!badges) return [];
    const metrics = badges.buildMetrics(allCards(), progress, gamestats);
    const newly = badges.satisfiedIds(metrics).filter((id) => !gamestats.unlocked[id]);
    if (!newly.length) return [];
    const unlocked = Object.assign({}, gamestats.unlocked);
    newly.forEach((id) => { unlocked[id] = now; });
    gamestats = Object.assign({}, gamestats, { unlocked });
    store.saveGameStats(gamestats);
    if (announce) showBadgeToast(newly.map((id) => badges.byId(id)).filter(Boolean));
    return newly;
  }

  // Einblendung schließen: Timer stoppen, Zustand leeren und NUR den Toast-Knoten
  // entfernen. Bewusst kein render() – ein Voll-Re-Render würde sonst nicht
  // gespeicherte Eingaben (Schreiben-Modus #answer, Editor-Felder) verwerfen.
  function dismissBadgeToast() {
    if (badgeToastTimer) { clearTimeout(badgeToastTimer); badgeToastTimer = null; }
    state.badgeToast = null;
    const el = root.querySelector(".btoast");
    if (el) el.remove();
  }

  // Einblendung zeigen und nach kurzer Zeit selbst wieder ausblenden.
  function showBadgeToast(list) {
    if (!list.length) return;
    state.badgeToast = loc(list); // Badge-Namen/Texte in aktiver Sprache (…En überlagert)
    if (badgeToastTimer) clearTimeout(badgeToastTimer);
    badgeToastTimer = setTimeout(dismissBadgeToast, 5000);
  }

  function badgesVM() {
    // Offline-Guard: Badge-Modul nicht geladen (z.B. unvollständiger Offline-
    // Cache) -> null. ui.renderBadges zeigt dann einen Hinweis statt zu crashen
    // (sonst würde JEDER weitere Render erneut werfen – App friert ein).
    if (!badges) return null;
    const metrics = badges.buildMetrics(allCards(), progress, gamestats);
    const all = badges.evaluate(metrics, gamestats.unlocked);
    const groups = badges.GROUPS
      .map((g) => {
        const list = all.filter((b) => b.group === g.id);
        return {
          id: g.id, label: natk(g, "label"), icon: g.icon,
          badges: loc(list), // …En-Felder (nameEn/descriptionEn/unlockedTextEn) überlagern
          unlocked: list.filter((b) => b.unlocked).length,
          total: list.length,
        };
      })
      .filter((g) => g.total > 0);
    return { groups, unlocked: all.filter((b) => b.unlocked).length, total: all.length };
  }

  function openBadges() {
    dismissBadgeToast();
    setState({ screen: "badges" });
  }

  // Hostel Mode: Ergebnis eines beendeten Battles in die Spiel-Zähler buchen.
  function recordBattleResult(b) {
    if (!badges) return;
    const g = Object.assign({}, gamestats);
    g.battlesPlayed = (g.battlesPlayed || 0) + 1;
    if (b.scores.A !== b.scores.B) g.battlesWon = (g.battlesWon || 0) + 1; // klarer Sieger
    // "Perfekt": ein Spieler holte in ALLEN seinen Runden die volle Punktzahl (2).
    const turnsA = Math.ceil(b.totalRounds / 2), turnsB = Math.floor(b.totalRounds / 2);
    if (b.scores.A === turnsA * 2 || (turnsB > 0 && b.scores.B === turnsB * 2)) {
      g.perfectBattles = (g.perfectBattles || 0) + 1;
    }
    // Comeback: Sieger lag zwischendurch hinten.
    const wonA = b.scores.A > b.scores.B, wonB = b.scores.B > b.scores.A;
    if ((wonA && b.behindA) || (wonB && b.behindB)) g.comebacks = (g.comebacks || 0) + 1;
    gamestats = g;
    store.saveGameStats(gamestats);
  }

  // Hostel Mode: eine erledigte Real-Life-Challenge vermerken (distinkt).
  function recordChallengeDone(id) {
    if (!badges || !id || (gamestats.challengesDone && gamestats.challengesDone[id])) return;
    const done = Object.assign({}, gamestats.challengesDone, { [id]: true });
    gamestats = Object.assign({}, gamestats, { challengesDone: done });
    store.saveGameStats(gamestats);
  }

  // Hostel Mode: ein distinktes gespieltes Rollenspiel vermerken (Mehrfach-Öffnen
  // derselben Szene zählt nur einmal).
  function recordRoleplaySeen(id) {
    if (!badges || (gamestats.roleplaysSeen && gamestats.roleplaysSeen[id])) return;
    const seen = Object.assign({}, gamestats.roleplaysSeen, { [id]: true });
    gamestats = Object.assign({}, gamestats, { roleplaysSeen: seen });
    store.saveGameStats(gamestats);
  }

  // ----- Hostel Mode: View-Modelle -----
  const battleById = (id) => data.BATTLES.find((b) => b.id === id) || null;
  const roleplayById = (id) => data.ROLEPLAYS.find((r) => r.id === id) || null;

  // Coordinator-Schnellstart: Szene + Wunschlänge an EINER Stelle, damit das
  // Label (Rundenzahl) und der tatsächliche Start nie auseinanderlaufen.
  const COORDINATOR_SCENE = "meet";  // Kennenlern-Szene = Icebreaker
  const COORDINATOR_ROUNDS = 6;      // kurze 5-Minuten-Runde

  function hostelVM() {
    const meetCount = data.BATTLES.filter((b) => b.scene === COORDINATOR_SCENE).length;
    return {
      battleCount: data.BATTLES.length,
      roleplayCount: data.ROLEPLAYS.length,
      // tatsächliche Rundenzahl des Schnellstarts (gerade, durch den Pool gedeckelt)
      coordinatorRounds: evenRounds(Math.min(COORDINATOR_ROUNDS, meetCount)),
    };
  }

  // Szenen-Auswahl: "Alle" + je Szene mit Anzahl verfügbarer Aufgaben.
  // Wählbare Battle-Längen (Runden). Werte gerade halten, damit A/B gleich oft drankommen.
  const BATTLE_LENGTHS = [
    { value: 6, labelKey: "app.battleLenShort" },
    { value: 10, labelKey: "app.battleLenMedium" },
    { value: 20, labelKey: "app.battleLenLong" },
  ];

  // Gerade Rundenzahl (A,B,A,B…); bei nur 1 Aufgabe bleibt 1 Runde.
  const evenRounds = (n) => (n - (n % 2)) || n;

  function battleSetupVM() {
    const scenes = data.BATTLE_SCENES
      .map((s) => {
        const count = data.BATTLES.filter((b) => b.scene === s.id).length;
        return { id: s.id, label: natk(s, "label"), icon: s.icon, count,
          rounds: evenRounds(Math.min(state.battleLength, count)) };
      })
      .filter((s) => s.count > 0);
    // Object.assign statt Objekt-Spread: die App verspricht ES2017 (Spread auf
    // Objekten ist ES2018 und wirft auf alten WebViews einen SyntaxError).
    const lengths = BATTLE_LENGTHS.map((l) => Object.assign({}, l, { label: t(l.labelKey), selected: l.value === state.battleLength }));
    const totalCount = data.BATTLES.length;
    return {
      scenes,
      totalCount,
      totalRounds: evenRounds(Math.min(state.battleLength, totalCount)),
      lengths,
      names: { A: state.battleNames.A, B: state.battleNames.B },
    };
  }

  // Anzeigename eines Spielers ("A"/"B") – eingegeben oder Fallback "Spieler A/B".
  function playerName(b, side) {
    const n = b.names && b.names[side];
    return n && n.trim() ? n.trim() : t("app.player", { side });
  }

  function battleVM() {
    const b = state.battle;
    const prompt = battleById(b.queue[b.round - 1]);
    const scene = data.BATTLE_SCENES.find((s) => s.id === b.sceneId);
    const lvl = prompt ? levelById(prompt.level) : null;
    // Weitere gültige Antworten (ohne die schon angezeigte Musterlösung) als Hilfe
    // für den bewertenden Mitspieler – damit faire Phrasing-Varianten zählen.
    const alsoOk = prompt
      ? prompt.acceptable.filter((a) => matcher.normalize(a) !== matcher.normalize(prompt.answerEs))
      : [];
    return {
      sceneLabel: b.sceneId === "all" ? t("app.allScenes") : (scene ? natk(scene, "label") : ""),
      sceneIcon: b.sceneId === "all" ? "🎲" : (scene ? scene.icon : "🛏️"),
      round: b.round,
      totalRounds: b.totalRounds,
      current: b.current,
      currentName: playerName(b, b.current),
      raterName: playerName(b, b.current === "A" ? "B" : "A"),
      // Kurze Chip-Beschriftung: eigener Name, sonst „A"/„B" (Score-Zeile bleibt kompakt).
      chipA: (b.names && b.names.A && b.names.A.trim()) ? b.names.A.trim() : "A",
      chipB: (b.names && b.names.B && b.names.B.trim()) ? b.names.B.trim() : "B",
      scores: b.scores,
      revealed: b.revealed,
      suddenDeath: !!b.suddenDeath,
      promptDe: prompt ? natk(prompt, "promptDe") : "",
      answerEs: prompt ? prompt.answerEs : "",
      alsoOk,
      levelShort: lvl ? lvl.short : "",
      hint: prompt ? natk(prompt, "hint") : "",
    };
  }

  function battleDoneVM() {
    const b = state.battle;
    const a = b.scores.A, bb = b.scores.B;
    const winner = a === bb ? "tie" : (a > bb ? "A" : "B");
    return {
      sceneLabel: b.sceneId === "all" ? t("app.allScenes")
        : natk(data.BATTLE_SCENES.find((s) => s.id === b.sceneId) || {}, "label"),
      scores: b.scores,
      rounds: b.totalRounds,
      winner,
      nameA: playerName(b, "A"),
      nameB: playerName(b, "B"),
      winnerName: winner === "tie" ? "" : playerName(b, winner),
      suddenDeath: !!b.suddenDeath, // lief schon eine Stichrunde? (Label „noch eine")
      challenge: b.challenge ? Object.assign({}, b.challenge, { textDe: natk(b.challenge, "textDe") }) : null, // { id, textDe, phraseEs } | null
      challengeDone: !!(b.challenge && gamestats.challengesDone && gamestats.challengesDone[b.challenge.id]),
    };
  }

  function roleplaySetupVM() {
    return {
      scenes: data.ROLEPLAYS.map((r) => {
        const lvl = levelById(r.level);
        return { id: r.id, title: natk(r, "title"), roleA: r.roles.a, roleB: r.roles.b,
          lvlShort: lvl ? lvl.short : "" };
      }),
    };
  }

  function roleplayVM() {
    const r = roleplayById(state.roleplayId);
    if (!r) return null;
    const lvl = levelById(r.level);
    // Rollen-Tausch: A↔B (Ziele & Sprecher-Labels), Dialog-Reihenfolge bleibt gleich.
    const swapped = state.roleplaySwapped;
    return {
      title: natk(r, "title"),
      lvlShort: lvl ? lvl.short : "",
      situationDe: natk(r, "situationDe"),
      swapped,
      roleA: { name: swapped ? r.roles.b : r.roles.a, goal: natk(r, swapped ? "goalB" : "goalA") },
      roleB: { name: swapped ? r.roles.a : r.roles.b, goal: natk(r, swapped ? "goalA" : "goalB") },
      dialogue: r.dialogue.map((d) => ({
        speaker: swapped ? (d.speaker === "A" ? "B" : "A") : d.speaker,
        de: withName(nat(d)), es: withName(d.es),
      })),
      usefulPhrases: r.usefulPhrases.map(withName),
    };
  }

  // ----- Definiciones (Zuordnen-Quiz): View-Modelle -----
  const quizSetById = (id) => data.QUIZ_SETS.find((s) => s.id === id) || null;
  const quizDefById = (id) => data.QUIZ_DEFS.find((d) => d.id === id) || null;
  const quizDefsForSet = (setId) => data.QUIZ_DEFS.filter((d) => d.set === setId);

  // Antwort-Optionen einer Frage bauen: die richtige Lösung + bis zu 3 Ablenker aus
  // derselben Liste, anschließend gemischt. Wird beim Stellen der Frage EINMAL
  // berechnet und im State gehalten – ein Re-Render darf nicht neu mischen.
  function buildQuizOptions(correct, pool) {
    const distractors = shuffle(pool.filter((d) => d.id !== correct.id)).slice(0, 3);
    return shuffle([correct, ...distractors])
      .map((d) => ({ id: d.id, es: d.es, de: d.de, en: d.en, icon: d.icon }));
  }

  function quizSetupVM() {
    return {
      sets: data.QUIZ_SETS.map((s) => {
        const lvl = levelById(s.lvl);
        return { id: s.id, label: s.label, icon: s.icon, intro: natk(s, "intro"),
          count: quizDefsForSet(s.id).length, lvlShort: lvl ? lvl.short : "" };
      }),
    };
  }

  function quizVM() {
    const q = state.quiz;
    const set = quizSetById(q.setId);
    const def = quizDefById(q.queue[q.idx]);
    const answered = q.selected !== null;
    const options = q.options.map((o) => ({
      id: o.id, es: o.es, de: nat(o), icon: o.icon,
      // Zustand fürs Einfärben: vor der Antwort neutral, danach Lösung grün,
      // falsche Wahl rot, der Rest gedämpft.
      state: !answered ? "idle"
        : o.id === def.id ? "correct"
        : o.id === q.selected ? "wrong"
        : "dim",
    }));
    return {
      setLabel: set ? set.label : "",
      setIcon: set ? set.icon : "🧩",
      position: q.idx,
      total: q.total,
      definition: def.def,
      options,
      answered,
      isCorrect: q.selected === def.id,
      solutionEs: def.es,
      solutionDe: nat(def),
      isLast: q.idx >= q.total - 1,
    };
  }

  function quizDoneVM() {
    const q = state.quiz;
    const set = quizSetById(q.setId);
    return {
      setLabel: set ? set.label : "",
      setIcon: set ? set.icon : "🧩",
      correct: q.correct,
      total: q.total,
      perfect: q.total > 0 && q.correct === q.total,
    };
  }

  // ----- Definiciones: Steuerung -----
  function openQuizSetup() {
    dismissBadgeToast();
    setState({ screen: "quizSetup" });
  }

  function startQuiz(setId) {
    dismissBadgeToast();
    const pool = quizDefsForSet(setId);
    if (!pool.length) return;
    const queue = shuffle(pool).map((d) => d.id);
    state.quiz = {
      setId,
      queue,
      idx: 0,
      total: queue.length,
      options: buildQuizOptions(quizDefById(queue[0]), pool),
      selected: null,
      correct: 0,
    };
    setState({ screen: "quiz" });
  }

  // Eine Option wählen. Erste Wahl zählt; weitere Klicks (nach dem Aufdecken) ignorieren.
  function answerQuiz(defId) {
    const q = state.quiz;
    if (!q || q.selected !== null) return;
    const current = q.queue[q.idx];
    q.selected = defId;
    if (defId === current) { q.correct += 1; buzz(12); } else buzz(8);
    render();
  }

  function nextQuiz() {
    const q = state.quiz;
    if (!q || q.selected === null) return; // erst antworten, dann weiter
    if (q.idx >= q.total - 1) {
      recordQuizResult(q);
      syncBadges(Date.now(), true); // Quiz-Badges freischalten + einblenden
      setState({ screen: "quizDone" });
      return;
    }
    q.idx += 1;
    q.selected = null;
    q.options = buildQuizOptions(quizDefById(q.queue[q.idx]), quizDefsForSet(q.setId));
    render();
  }

  function quizAgain() {
    dismissBadgeToast();
    state.quiz = null;
    setState({ screen: "quizSetup" });
  }

  // Ergebnis eines beendeten Quiz in die Spiel-Zähler buchen (Ruta-Pass).
  function recordQuizResult(q) {
    if (!badges) return;
    const g = Object.assign({}, gamestats);
    g.quizzesPlayed = (g.quizzesPlayed || 0) + 1;
    if (q.total > 0 && q.correct === q.total) g.quizzesPerfect = (g.quizzesPerfect || 0) + 1;
    gamestats = g;
    store.saveGameStats(gamestats);
  }

  // ----- Conjugación: Erklärseite Konjugieren -----
  // Statische Grammatik-Erklärung (Inhalte: data.CONJUGATION). Der "Jetzt üben"-
  // Button auf der Seite nutzt die normale open-category-Aktion (Kategorie
  // "verbos") und startet damit den gewohnten Lernfluss.
  function conjugacionVM() {
    return {
      guide: loc(data.CONJUGATION),
      cardCount: data.CARDS.filter((c) => c.cat === "verbos").length,
      canDrill: conjugReady(), // Conjugador-Drill verfügbar (Modul geladen)?
    };
  }

  function openConjugacion() {
    dismissBadgeToast();
    setState({ screen: "conjugacion" });
  }

  // ----- Tiempos: Erklärseite Zeiten -----
  // Statische Zeitformen-Erklärung (Inhalte: data.TENSES). Wie bei Conjugación
  // springt der "Jetzt üben"-Button per normaler open-category-Aktion in die
  // Übungskarten der Kategorie "tiempos".
  function tiemposVM() {
    return {
      guide: loc(data.TENSES),
      cardCount: data.CARDS.filter((c) => c.cat === "tiempos").length,
    };
  }

  function openTiempos() {
    dismissBadgeToast();
    setState({ screen: "tiempos" });
  }

  // ----- Frases flexibles (Satzbaukasten): Steuerung -----
  // Virtuelle "Gemischt"-Id: spielt alle Rahmen quer durch alle Themen.
  const FRASES_ALL = "all";
  const frasesById = (id) => (frases ? frases.FRASES.find((f) => f.id === id) : null) || null;
  const frasesSetById = (id) => (frases && frases.FRASES_SETS ? frases.FRASES_SETS.find((s) => s.id === id) : null) || null;
  // Rahmen eines Themas (oder alle bei "all"). Reihenfolge der Daten bleibt erhalten.
  const frasesForSet = (setId) =>
    frases ? frases.FRASES.filter((f) => setId === FRASES_ALL || f.cat === setId) : [];

  // Optionen eines Rahmens bauen: korrekter Baustein + Ablenker, gemischt. Einmal
  // beim Stellen berechnet und im State gehalten (Re-Render darf nicht neu mischen).
  function buildFrasesOptions(frame) {
    const opts = [Object.assign({ correct: true }, frame.slot)]
      .concat((frame.distractors || []).map((d) => Object.assign({ correct: false }, d)));
    return shuffle(opts);
  }

  // Themen-Auswahl: jede Liste mit Zahl + Stufe, plus eine "Gemischt"-Kachel über alles.
  function frasesSetupVM() {
    const sets = (frases && frases.FRASES_SETS ? frases.FRASES_SETS : []).map((s) => {
      const lvl = levelById(s.lvl);
      return { id: s.id, label: s.label, icon: s.icon, intro: natk(s, "intro"),
        count: frasesForSet(s.id).length, lvlShort: lvl ? lvl.short : "" };
    });
    return {
      sets,
      mixed: { id: FRASES_ALL, label: t("app.mixed"), icon: "🎲",
        intro: t("app.frasesMixedIntro"),
        count: frases ? frases.FRASES.length : 0 },
    };
  }

  function openFrasesSetup() {
    dismissBadgeToast();
    setState({ screen: "frasesSetup" });
  }

  // Backwards-kompatibler Einsprung (Home-Kachel): führt jetzt zur Themen-Auswahl.
  function openFrases() { openFrasesSetup(); }

  function startFrases(setId) {
    dismissBadgeToast();
    const pool = frasesForSet(setId);
    if (!pool.length) return;
    const queue = shuffle(pool).map((f) => f.id);
    state.frases = {
      setId, queue, idx: 0, total: queue.length,
      options: buildFrasesOptions(frasesById(queue[0])),
      selected: null, correct: 0,
    };
    setState({ screen: "frases" });
  }

  // Kopf-Infos zum laufenden Set (Label/Icon) – "Gemischt" hat keinen Datensatz.
  function frasesSetInfo(setId) {
    if (setId === FRASES_ALL) return { label: t("app.mixed"), icon: "🎲" };
    const s = frasesSetById(setId);
    return { label: s ? s.label : "", icon: s ? s.icon : "🧱" };
  }

  function frasesVM() {
    const f = state.frases;
    const frame = frasesById(f.queue[f.idx]);
    const answered = f.selected !== null;
    const info = frasesSetInfo(f.setId);
    const options = f.options.map((o, i) => ({
      es: o.es, de: nat(o),
      // vor der Antwort neutral; danach Lösung grün, falsche Wahl rot, Rest gedämpft.
      state: !answered ? "idle"
        : o.correct ? "correct"
        : i === f.selected ? "wrong"
        : "dim",
    }));
    const sol = f.options.find((o) => o.correct) || {};
    return {
      setLabel: info.label, setIcon: info.icon,
      position: f.idx, total: f.total,
      frameEs: frame ? frame.frameEs : "",
      targetDe: frame ? natk(frame, "targetDe") : "",
      options, answered,
      isCorrect: answered && !!(f.options[f.selected] && f.options[f.selected].correct),
      solutionEs: sol.es, solutionDe: nat(sol),
      isLast: f.idx >= f.total - 1,
    };
  }

  function frasesDoneVM() {
    const f = state.frases;
    const info = frasesSetInfo(f.setId);
    return { setLabel: info.label, setIcon: info.icon,
      correct: f.correct, total: f.total, perfect: f.total > 0 && f.correct === f.total };
  }

  // Eine Option wählen. Erste Wahl zählt; weitere Klicks (nach dem Aufdecken) ignorieren.
  function answerFrases(i) {
    const f = state.frases;
    if (!f || f.selected !== null) return;
    f.selected = i;
    if (f.options[i] && f.options[i].correct) { f.correct += 1; buzz(12); } else buzz(8);
    render();
  }

  function nextFrases() {
    const f = state.frases;
    if (!f || f.selected === null) return; // erst antworten, dann weiter
    if (f.idx >= f.total - 1) {
      recordFrasesResult(f);
      syncBadges(Date.now(), true);
      setState({ screen: "frasesDone" });
      return;
    }
    f.idx += 1;
    f.selected = null;
    f.options = buildFrasesOptions(frasesById(f.queue[f.idx]));
    render();
  }

  function frasesAgain() {
    // Dieselbe Themen-Runde noch einmal (startFrases baut state.frases neu auf);
    // fällt auf "Gemischt" zurück, falls (theoretisch) kein Set hinterlegt ist.
    startFrases(state.frases ? state.frases.setId : FRASES_ALL);
  }

  // Ergebnis einer beendeten Satzbaukasten-Runde buchen (Ruta-Pass). Zusätzlich
  // das gespielte Thema vermerken – speist den "Alle Themen"-Badge (Gemischt zählt
  // nicht als einzelnes Thema).
  function recordFrasesResult(f) {
    if (!badges) return;
    const g = Object.assign({}, gamestats);
    g.frasesPlayed = (g.frasesPlayed || 0) + 1;
    if (f.total > 0 && f.correct === f.total) g.frasesPerfect = (g.frasesPerfect || 0) + 1;
    if (f.setId && f.setId !== FRASES_ALL) {
      const done = Object.assign({}, g.frasesThemesDone);
      done[f.setId] = true;
      g.frasesThemesDone = done;
    }
    gamestats = g;
    store.saveGameStats(gamestats);
  }

  // ----- Diálogos: Gesprächs-Simulationen -----
  // Eine Reisesituation Zug für Zug durchspielen. npc-Züge werden angezeigt und
  // (falls TTS da ist) vorgelesen; user-Züge sind Multiple-Choice oder freies
  // Tippen (matcher.normalize). Pro Szenario ein zufälliger Dialog aus dem cat-Pool.
  const dialogosReady = () => !!(dialogos && dialogos.DIALOGOS_SCENARIOS && dialogos.DIALOGOS_SCENARIOS.length);
  const dialogueById = (id) => (dialogos ? dialogos.DIALOGOS.find((d) => d.id === id) : null) || null;
  const scenarioById = (id) => (dialogos ? dialogos.DIALOGOS_SCENARIOS.find((s) => s.id === id) : null) || null;

  // Reise-Name aus dem Profil: erscheint in Diálogos überall dort, wo der Nutzer
  // sich vorstellt (Hotel, Busticket, Notfall …). Ohne Eintrag bleibt der
  // Beispielname „Marco", damit die Dialoge auch ungenutzt stimmig sind.
  // profileName() liefert den rohen (ggf. leeren) Profil-Namen – für Stellen, die
  // OHNE Eintrag lieber nichts vorbelegen sollen (z. B. Battle-Spielername).
  function profileName() {
    return (settings.userName || "").trim().replace(/\s+/g, " ").slice(0, 40);
  }
  function travelerName() {
    const n = profileName();
    // Ein Name, der bei der Antwortprüfung zu nichts normalisiert (nur Emoji/
    // Satzzeichen), machte die „Wie heißt du?"-Tippzüge unlösbar → Beispielname.
    return (n && matcher.normalize(n)) ? n : "Marco";
  }
  // Geschlecht des Reisenden für die spanische Selbst-Anrede (sola/solo …). Ohne
  // Eintrag männlich als konventioneller Default (so „funktioniert" jeder Text).
  function travelerGender() {
    return settings.userGender === "female" ? "female" : "male";
  }
  // Geschlechts-Token {männlich/weiblich} auflösen, z. B. „perdid{o/a}" → perdido/perdida,
  // „{Lo/La} veo cansad{o/a}" → je nach Profil. Braucht einen Slash innerhalb der
  // Klammern; {name} (ohne Slash) bleibt unberührt, normale Texte ebenfalls (kein „{").
  function withGender(s) {
    if (typeof s !== "string") return s;
    const fem = travelerGender() === "female";
    return s.replace(/\{([^{}/]*)\/([^{}/]*)\}/g, (_, m, f) => (fem ? f : m));
  }
  // Platzhalter {name} in Dialog-Texten (Anzeige, Vorlesen, akzeptierte Eingaben)
  // durch den Reise-Namen ersetzen, danach Geschlechts-Tokens auflösen. Ersatz als
  // Funktion übergeben, damit Sonderzeichen im Namen ($&, $1 …) nicht als replace-
  // Muster interpretiert werden. Beides läuft durch DENSELBEN Pfad – jede Stelle,
  // die withName nutzt (Diálogos, Rollenspiel, Karten-Kontext), kann beide Tokens.
  function withName(s) {
    if (typeof s !== "string") return s;
    return withGender(s.replace(/\{name\}/g, () => travelerName()));
  }
  // {name} in allen String-Feldern eines (flachen) Objekts ersetzen – z. B. im
  // lokalisierten Reise-Kontext einer Karte (sentenceEs/sentenceDe/situation/note).
  function withNameObj(o) {
    if (!o || typeof o !== "object") return o;
    const out = {};
    for (const k in o) out[k] = withName(o[k]);
    return out;
  }

  function dialogosSetupVM() {
    return {
      available: dialogosReady(),
      scenarios: dialogosReady()
        ? dialogos.DIALOGOS_SCENARIOS
            .filter((s) => dialogos.DIALOGOS.some((d) => d.cat === s.id))
            .map((s) => ({ id: s.id, title: natk(s, "title"), icon: s.icon, lvl: s.lvl, intro: natk(s, "intro") }))
        : [],
      hasSpeech: !!(speech && speech.isSupported()),
    };
  }

  function dialogosVM() {
    const d = state.dialogos;
    const dia = dialogueById(d.dialogueId);
    const turns = (dia && dia.turns) || [];
    const scn = scenarioById(d.scenarioId);
    // Verlaufsspur: alle bereits abgehandelten Züge (npc komplett, beantwortete
    // user-Züge mit der Musterantwort als „gesagter" Zeile).
    const transcript = [];
    for (let i = 0; i < d.turnIdx; i++) {
      const t = turns[i];
      if (!t) continue;
      if (t.who === "npc") transcript.push({ who: "npc", es: withName(t.es), de: withName(nat(t)) });
      else transcript.push({ who: "user", es: withName(t.solEs), de: "" });
    }
    const cur = turns[d.turnIdx] || null;
    const current = cur
      ? (cur.who === "npc"
          ? { who: "npc", es: withName(cur.es), de: withName(nat(cur)) }
          : {
              who: "user",
              kind: cur.kind,
              de: withName(nat(cur)),
              solEs: withName(cur.solEs),
              why: withName(natk(cur, "why") || ""),
              options: cur.kind === "mc" ? cur.options.map((o) => ({ es: withName(o.es) })) : null,
            })
      : null;
    return {
      title: dia ? natk(dia, "title") : "",
      icon: scn ? scn.icon : "💬",
      turnIdx: d.turnIdx,
      total: turns.length,
      transcript,
      current,
      result: d.result, // null | { correct, given }
      hint: !!d.hint,   // Musterantwort beim Frei-Tippen aufgedeckt?
      speakable: !!(speech && speech.isSupported()),
    };
  }

  function dialogosDoneVM() {
    const d = state.dialogos;
    const dia = dialogueById(d.dialogueId);
    const scn = scenarioById(d.scenarioId);
    return {
      title: dia ? natk(dia, "title") : "",
      icon: scn ? scn.icon : "💬",
      correct: d.correct,
      total: d.totalUser,
      perfect: d.totalUser > 0 && d.correct === d.totalUser,
    };
  }

  function openDialogosSetup() {
    dismissBadgeToast();
    loadModule("dialogos", () => {
      if (!dialogosReady()) return;
      setState({ screen: "dialogosSetup" });
    });
  }

  function startDialogos(scenarioId) {
    if (!dialogosReady()) return;
    const pool = dialogos.DIALOGOS.filter((d) => d.cat === scenarioId);
    if (!pool.length) return;
    const dia = pool[Math.floor(Math.random() * pool.length)];
    const totalUser = dia.turns.filter((t) => t.who === "user").length;
    state.dialogos = { scenarioId, dialogueId: dia.id, turnIdx: 0, result: null, hint: false, correct: 0, totalUser };
    state.screen = "dialogos";
    render(); // maybeAutoSpeak liest den ersten npc-Zug vor
  }

  // Aktuellen user-Zug holen (oder null, wenn der aktuelle Zug ein npc-Zug ist).
  function currentUserTurn() {
    const d = state.dialogos;
    const dia = dialogueById(d.dialogueId);
    const t = dia && dia.turns[d.turnIdx];
    return t && t.who === "user" ? t : null;
  }

  function answerDialogosMc(idx) {
    const d = state.dialogos;
    if (!d || d.result) return;
    const t = currentUserTurn();
    if (!t || t.kind !== "mc" || !t.options[idx]) return;
    const correct = !!t.options[idx].ok;
    d.result = { correct, given: withName(t.options[idx].es) };
    if (correct) { d.correct += 1; buzz(12); } else buzz(8);
    render();
  }

  function submitDialogosType(input) {
    const d = state.dialogos;
    if (!d || d.result) return;
    const t = currentUserTurn();
    if (!t || t.kind !== "type") return;
    const norm = matcher.normalize(input);
    const accepted = [t.solEs].concat(t.accept || []).map((s) => matcher.normalize(withName(s)));
    const correct = norm.length > 0 && accepted.indexOf(norm) !== -1;
    d.result = { correct, given: input };
    if (correct) { d.correct += 1; buzz(12); } else buzz(8);
    render();
  }

  // Weiter: vom aktuellen Zug zum nächsten. npc-Züge brauchen kein Ergebnis,
  // user-Züge erst nach einer Antwort. Am Ende -> Done-Screen.
  function advanceDialogos() {
    const d = state.dialogos;
    if (!d) return;
    const dia = dialogueById(d.dialogueId);
    if (!dia) return;
    const cur = dia.turns[d.turnIdx];
    if (cur && cur.who === "user" && !d.result) return; // user-Zug erst beantworten
    if (d.turnIdx >= dia.turns.length - 1) {
      recordDialogosResult(d);
      syncBadges(Date.now(), true);
      setState({ screen: "dialogosDone" });
      return;
    }
    d.turnIdx += 1;
    d.result = null;
    d.hint = false;
    render();
  }

  // Tipp aufdecken: zeigt beim Frei-Tippen die Musterantwort als Hilfe. Reine
  // Anzeige – die Antwort muss weiterhin getippt werden, der Zug zählt normal.
  function dialogosHint() {
    const d = state.dialogos;
    if (!d || d.result) return;
    const t = currentUserTurn();
    if (!t || t.kind !== "type") return;
    d.hint = true;
    render();
  }

  function dialogosAgain() {
    startDialogos(state.dialogos ? state.dialogos.scenarioId : null);
  }

  function speakDialogosNpc() {
    const d = state.dialogos;
    if (!d || !speech) return;
    const dia = dialogueById(d.dialogueId);
    const t = dia && dia.turns[d.turnIdx];
    if (t && t.who === "npc") speech.speak(withName(t.es), settings.speechRate);
  }

  // Ergebnis einer beendeten Dialog-Runde buchen (Ruta-Pass): Anzahl, fehlerfreie
  // Runden und das distinkt gespielte Szenario.
  function recordDialogosResult(d) {
    if (!badges) return;
    const g = Object.assign({}, gamestats);
    g.dialogosPlayed = (g.dialogosPlayed || 0) + 1;
    if (d.totalUser > 0 && d.correct === d.totalUser) g.dialogosPerfect = (g.dialogosPerfect || 0) + 1;
    const done = Object.assign({}, g.dialogosScenesDone);
    done[d.scenarioId] = true;
    g.dialogosScenesDone = done;
    gamestats = g;
    store.saveGameStats(gamestats);
  }

  // ----- El Cuerpo: interaktive Körperkarte -----
  const bodyPartById = (id) => data.BODY_PARTS.find((p) => p.id === id) || null;

  function cuerpoVM() {
    const selId = state.bodyPartId;
    const parts = data.BODY_PARTS.map((p) => ({
      id: p.id, de: nat(p), x: p.x, y: p.y,
      selected: p.id === selId,
      seen: !!(gamestats.bodyPartsSeen && gamestats.bodyPartsSeen[p.id]),
    }));
    const sel = bodyPartById(selId);
    return {
      parts,
      selected: sel ? { id: sel.id, es: sel.es, de: nat(sel), tip: sel.tip, note: sel.note } : null,
      exploredCount: gamestats.bodyPartsSeen ? Object.keys(gamestats.bodyPartsSeen).length : 0,
      total: data.BODY_PARTS.length,
      speakable: !!(speech && speech.isSupported()),
    };
  }

  function openCuerpo() {
    dismissBadgeToast();
    state.bodyPartId = null;
    state.bodyYaw = -22; // beim Öffnen in die Drei-Viertel-Ansicht zurücksetzen
    state.bodyPitch = -6;
    setState({ screen: "cuerpo" });
  }

  // Ein Körperteil antippen: Wort anzeigen, vorlesen und (einmalig) für den
  // Ruta-Pass einbuchen. Erneutes Antippen desselben Teils ist ein No-Op-Write.
  function selectBodyPart(id) {
    const part = bodyPartById(id);
    if (!part) return;
    state.bodyPartId = id;
    buzz(8);
    recordBodyPartView(id, Date.now());
    render();
    if (speech && speech.isSupported()) speech.speak(part.es, settings.speechRate);
  }

  // Distinkt erkundetes Körperteil vermerken und erfüllte 🧍-Badges freischalten.
  function recordBodyPartView(id, now) {
    if (!badges || !id || (gamestats.bodyPartsSeen && gamestats.bodyPartsSeen[id])) return;
    const seen = Object.assign({}, gamestats.bodyPartsSeen, { [id]: true });
    gamestats = Object.assign({}, gamestats, { bodyPartsSeen: seen });
    store.saveGameStats(gamestats);
    syncBadges(now, true); // render() malt den Toast anschließend über den Screen
  }

  // 🔊-Knopf im Körperteil-Panel: das gewählte Wort (er-)neut vorlesen.
  function speakBodyPart() {
    const part = bodyPartById(state.bodyPartId);
    if (part && speech && speech.isSupported()) speech.speak(part.es, settings.speechRate);
  }

  // ----- Einkaufszettel (interaktive Einkaufsliste) -----
  const shoppingSections = () => data.SHOPPING || [];
  const shoppingSectionById = (id) => shoppingSections().find((s) => s.id === id) || null;
  function shoppingItemById(id) {
    for (const s of shoppingSections()) {
      const it = s.items.find((i) => i.id === id);
      if (it) return it;
    }
    return null;
  }
  // Wie viele Items einer Rubrik sind schon abgehakt?
  function shoppingSectionDone(sec) {
    const seen = gamestats.shoppingSeen || {};
    return sec.items.reduce((n, it) => n + (seen[it.id] ? 1 : 0), 0);
  }

  // Führenden Artikel (el/la/los/las) abtrennen – für natürlichere Fragen
  // wie «¿Tienen agua?» statt «¿Tienen el agua?».
  function shoppingBareNoun(es) {
    return String(es || "").replace(/^(el|la|los|las)\s+/i, "");
  }

  // Zwei gebrauchsfertige Supermarkt-Fragen pro Item:
  // 1) ob sie es haben, 2) wo man es findet. «¿Dónde puedo encontrar …?»
  // funktioniert für Ein- und Mehrzahl gleich (keine está/están-Falle).
  function shoppingAskPhrases(item) {
    return {
      have: { es: `¿Tienen ${shoppingBareNoun(item.es)}?`, de: t("common.askHave") },
      find: { es: `¿Dónde puedo encontrar ${item.es}?`, de: t("common.askFind") },
    };
  }

  function comprasVM() {
    const curId = state.compras.section;
    const sec = shoppingSectionById(curId) || shoppingSections()[0];
    const seen = gamestats.shoppingSeen || {};
    const sections = shoppingSections().map((s) => ({
      id: s.id, icon: s.icon, label: s.label, de: nat(s),
      active: s.id === sec.id, total: s.items.length, done: shoppingSectionDone(s),
    }));
    const items = sec.items.map((it) => ({
      id: it.id, de: nat(it), es: it.es, tip: it.tip, note: it.note,
      ask: shoppingAskPhrases(it),
      open: state.compras.open === it.id, seen: !!seen[it.id],
    }));
    return {
      sections,
      section: { id: sec.id, icon: sec.icon, label: sec.label, de: nat(sec), grad: sec.grad },
      items,
      doneCount: shoppingSectionDone(sec),
      total: sec.items.length,
      speakable: !!(speech && speech.isSupported()),
    };
  }

  function openCompras() {
    dismissBadgeToast();
    if (!shoppingSectionById(state.compras.section)) {
      state.compras = { section: (shoppingSections()[0] || {}).id || null, open: null };
    } else {
      state.compras = { section: state.compras.section, open: null };
    }
    setState({ screen: "compras" });
  }

  function comprasSection(id) {
    if (!shoppingSectionById(id)) return;
    setState({ compras: { section: id, open: null } });
  }

  // Ein Item antippen: nur auf-/zuklappen und beim Aufklappen das Wort
  // vorlesen. Das Abhaken ist davon getrennt (eigene Checkbox), damit man
  // ein Wort nachschlagen kann, ohne es gleich abzuhaken.
  function comprasPick(id) {
    const item = shoppingItemById(id);
    if (!item) return;
    const opening = state.compras.open !== id;
    state.compras = { section: state.compras.section, open: opening ? id : null };
    if (opening) buzz(8);
    render();
    if (opening && speech && speech.isSupported()) speech.speak(item.es, settings.speechRate);
  }

  // Checkbox antippen: Item ab-/aufhaken (echte Einkaufsliste). Der Stand
  // wird persistent gemerkt und lässt sich jederzeit wieder zurücknehmen.
  function comprasToggle(id) {
    if (!id || !shoppingItemById(id)) return;
    const cur = gamestats.shoppingSeen || {};
    const seen = Object.assign({}, cur);
    if (seen[id]) delete seen[id]; else seen[id] = true;
    gamestats = Object.assign({}, gamestats, { shoppingSeen: seen });
    store.saveGameStats(gamestats);
    buzz(seen[id] ? 12 : 8);
    render();
  }

  // 🔊-Knopf im aufgeklappten Item: das spanische Wort (er-)neut vorlesen.
  function speakCompras(id) {
    const item = shoppingItemById(id);
    if (item && speech && speech.isSupported()) speech.speak(item.es, settings.speechRate);
  }

  // 🔊-Knopf an einer Supermarkt-Frage: den übergebenen Satz vorlesen.
  function speakComprasPhrase(text) {
    if (text && speech && speech.isSupported()) speech.speak(text, settings.speechRate);
  }

  // ----- Einkaufszettel-Quiz (Multiple Choice über die Items einer Rubrik) -----
  // Optionen bauen: richtiges Wort + bis zu 3 Ablenker aus derselben Rubrik,
  // dann gemischt. Einmal je Frage berechnet (Re-Render mischt nicht neu).
  function buildComprasOptions(item, pool) {
    const distractors = shuffle(pool.filter((d) => d.id !== item.id)).slice(0, 3);
    return shuffle([item, ...distractors]).map((d) => ({ es: d.es, correct: d.id === item.id }));
  }

  function openComprasQuiz() {
    const sec = shoppingSectionById(state.compras.section);
    if (!sec || sec.items.length < 2) return;
    const queue = shuffle(sec.items).map((it) => it.id);
    state.comprasQuiz = {
      section: sec.id,
      queue,
      idx: 0,
      total: queue.length,
      options: buildComprasOptions(shoppingItemById(queue[0]), sec.items),
      selected: null,
      correct: 0,
    };
    setState({ screen: "comprasQuiz" });
  }

  function comprasQuizVM() {
    const q = state.comprasQuiz;
    const sec = shoppingSectionById(q.section);
    const item = shoppingItemById(q.queue[q.idx]);
    const answered = q.selected !== null;
    const correctEs = item.es;
    const options = q.options.map((o, i) => ({
      es: o.es,
      state: !answered ? "idle"
        : o.correct ? "correct"
        : i === q.selected ? "wrong"
        : "dim",
    }));
    return {
      sectionIcon: sec ? sec.icon : "🛒",
      sectionLabel: sec ? sec.label : "",
      position: q.idx,
      total: q.total,
      prompt: item.de,
      options,
      answered,
      isCorrect: answered && q.options[q.selected].correct,
      solutionEs: correctEs,
      isLast: q.idx >= q.total - 1,
    };
  }

  // Eine Option wählen. Erste Wahl zählt; spätere Klicks ignorieren.
  function answerComprasQuiz(i) {
    const q = state.comprasQuiz;
    if (!q || q.selected !== null) return;
    q.selected = i;
    if (q.options[i] && q.options[i].correct) { q.correct += 1; buzz(12); } else buzz(8);
    render();
  }

  function nextComprasQuiz() {
    const q = state.comprasQuiz;
    if (!q || q.selected === null) return;
    if (q.idx >= q.total - 1) {
      setState({ screen: "comprasQuizDone" });
      return;
    }
    q.idx += 1;
    q.selected = null;
    const sec = shoppingSectionById(q.section);
    q.options = buildComprasOptions(shoppingItemById(q.queue[q.idx]), sec.items);
    render();
  }

  function comprasQuizDoneVM() {
    const q = state.comprasQuiz;
    const sec = shoppingSectionById(q.section);
    return {
      sectionIcon: sec ? sec.icon : "🛒",
      sectionLabel: sec ? sec.label : "",
      correct: q.correct,
      total: q.total,
      perfect: q.total > 0 && q.correct === q.total,
    };
  }

  // „Nochmal" baut die Runde über dieselbe Rubrik neu.
  function comprasQuizAgain() {
    openComprasQuiz();
  }

  // Zurück vom Quiz zum Zettel (gleiche Rubrik bleibt aktiv).
  function comprasBackToList() {
    state.comprasQuiz = null;
    state.compras = { section: state.compras.section, open: null };
    setState({ screen: "compras" });
  }

  // ----- El Cuerpo: drehbares 3D-Modell (in-place, ohne Voll-Re-Render) -----
  // Die Figur ist eine CSS-3D-Szene aus Kugeln (Orbs) und Hotspot-Punkten.
  // Beim Drehen ändert sich nur der eine Eltern-Transform plus pro Element ein
  // Billboard-Konter (rotateY/X invers), damit jede Kugel rund zur Kamera bleibt.
  const bp3d = { fig: null, orbs: [], nodes: [], raf: 0 };
  let bpDrag = null;        // { x, y, yaw, pitch } während einer Ziehgeste, sonst null
  let bpDragMoved = false;  // wurde wirklich gedreht? (unterscheidet Zieh- von Tipp-Geste)
  let bpDragEndAt = 0;      // Zeitpunkt der letzten echten Drehung – schluckt nur den
                            // unmittelbar folgenden Maus-Klick, nicht spätere Tastatur-Auswahl

  // Nach jedem Render der Cuerpo-Ansicht: Elemente neu einsammeln, Koordinaten
  // aus den data-Attributen cachen und die aktuelle Drehung anwenden.
  function cuerpoInit3D() {
    bp3d.fig = root.querySelector("[data-bp-fig]");
    if (!bp3d.fig) { bp3d.orbs = []; bp3d.nodes = []; return; }
    const num = (el, k) => Number(el.dataset[k]);
    bp3d.orbs = Array.prototype.map.call(bp3d.fig.querySelectorAll(".bp-orb"), (el) => {
      el._x = num(el, "x"); el._y = num(el, "y"); el._z = num(el, "z"); return el;
    });
    bp3d.nodes = Array.prototype.map.call(bp3d.fig.querySelectorAll(".bp-node"), (el) => {
      el._x = num(el, "x"); el._y = num(el, "y"); el._z = num(el, "z"); el._az = num(el, "az"); return el;
    });
    bpApplyRot();
  }

  // Drehung auf Figur (Eltern) und alle Kinder schreiben. Kinder bekommen den
  // inversen Dreh-Anteil (Billboard) -> bleiben runde, zur Kamera gerichtete
  // Scheiben. Hotspots auf der abgewandten Seite werden gedämpft/gesperrt.
  function bpApplyRot() {
    if (!bp3d.fig) return;
    const yaw = state.bodyYaw, pitch = state.bodyPitch;
    bp3d.fig.style.transform = `translateZ(-30px) rotateX(${pitch}deg) rotateY(${yaw}deg)`;
    const inv = `rotateY(${-yaw}deg) rotateX(${-pitch}deg)`;
    for (let i = 0; i < bp3d.orbs.length; i++) {
      const el = bp3d.orbs[i];
      el.style.transform = `translate3d(${el._x}px,${el._y}px,${el._z}px) ${inv} translate(-50%,-50%)`;
    }
    for (let i = 0; i < bp3d.nodes.length; i++) {
      const n = bp3d.nodes[i];
      n.style.transform = `translate3d(${n._x}px,${n._y}px,${n._z}px) ${inv} translate(-50%,-50%)`;
      const back = Math.cos((n._az + yaw) * Math.PI / 180) < -0.15;
      n.classList.toggle("is-back", back);
    }
  }

  function bpScheduleApply() {
    if (!bp3d.raf) bp3d.raf = requestAnimationFrame(() => { bp3d.raf = 0; bpApplyRot(); });
  }

  // Dreh-Knöpfe ↺/↻ (Tastatur-/Klick-Alternative zum Ziehen). Kurz mit
  // Transition (is-anim), damit der Sprung weich statt hart wirkt.
  let bpAnimTimer = null;
  function rotateBody(dir) {
    state.bodyYaw = (state.bodyYaw || 0) + dir * 32;
    const stage = root.querySelector("[data-bp-stage]");
    if (stage) {
      stage.classList.add("is-anim");
      clearTimeout(bpAnimTimer);
      bpAnimTimer = setTimeout(() => stage.classList.remove("is-anim"), 320);
    }
    bpApplyRot();
  }

  // Zeigegesten: Ziehen über der Bühne dreht die Figur. Unter dem 6px-Schwellwert
  // bleibt es ein Tipp (Hotspot wählen); darüber wird es eine Drehung.
  function onBodyPointerDown(e) {
    if (state.screen !== "cuerpo") return;
    if (e.button != null && e.button > 0) return; // nur primäre Maustaste / Touch / Stift
    const stage = e.target.closest("[data-bp-stage]");
    if (!stage || e.target.closest(".bp-rotor")) return; // Dreh-Knöpfe nicht als Ziehstart werten
    bpDrag = { x: e.clientX, y: e.clientY, yaw: state.bodyYaw || 0, pitch: state.bodyPitch || 0 };
    bpDragMoved = false;
    stage.classList.add("is-grab");
  }
  function onBodyPointerMove(e) {
    if (!bpDrag) return;
    const dx = e.clientX - bpDrag.x, dy = e.clientY - bpDrag.y;
    if (!bpDragMoved && Math.hypot(dx, dy) > 6) bpDragMoved = true;
    if (!bpDragMoved) return;
    state.bodyYaw = bpDrag.yaw + dx * 0.6;
    state.bodyPitch = Math.max(-32, Math.min(32, bpDrag.pitch - dy * 0.4));
    bpScheduleApply();
  }
  function onBodyPointerUp() {
    if (!bpDrag) return;
    if (bpDragMoved) bpDragEndAt = Date.now(); // den gleich folgenden Klick auf den Hotspot schlucken
    bpDrag = null;
    const stage = root.querySelector("[data-bp-stage].is-grab");
    if (stage) stage.classList.remove("is-grab");
  }

  // ----- Reise-Route per Drag & Drop umsortieren (Profil-Zeitleiste) -----
  // Greift man den ⠿-Griff eines Routen-Eintrags, ziehen wir den Listeneintrag live
  // im DOM zwischen die Geschwister (Einfügemarke = Mitte des überfahrenen Eintrags)
  // und nummerieren neu. Erst beim Loslassen wird die neue Reihenfolge in die Route
  // übernommen (moveTripStop -> saveTripRoute -> render). Bis dahin kein Re-Render,
  // damit der gezogene Eintrag nicht unter dem Finger verschwindet.
  let tripDrag = null;
  function tripRenumber(list) {
    const items = list.querySelectorAll(".triptl__item");
    for (let i = 0; i < items.length; i++) {
      const num = items[i].querySelector(".triptl__num");
      if (num) num.textContent = String(i + 1);
    }
  }
  function onTripPointerDown(e) {
    if (e.button != null && e.button > 0) return; // nur primäre Maustaste / Touch / Stift
    const handle = e.target.closest("[data-action='drag-trip-stop']");
    if (!handle) return;
    const item = handle.closest(".triptl__item");
    const list = item && item.closest(".triptl__list");
    if (!item || !list) return;
    e.preventDefault();
    const items = Array.from(list.querySelectorAll(".triptl__item"));
    tripDrag = { list, item, startIndex: items.indexOf(item), pointerId: e.pointerId };
    item.classList.add("is-dragging");
    list.classList.add("is-reordering");
    try { handle.setPointerCapture(e.pointerId); } catch (_) { /* ältere Browser ohne Pointer-Capture */ }
  }
  function onTripPointerMove(e) {
    if (!tripDrag || (tripDrag.pointerId != null && e.pointerId !== tripDrag.pointerId)) return;
    e.preventDefault();
    const list = tripDrag.list, item = tripDrag.item;
    const y = e.clientY;
    const others = list.querySelectorAll(".triptl__item:not(.is-dragging)");
    let before = null;
    for (let i = 0; i < others.length; i++) {
      const r = others[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { before = others[i]; break; }
    }
    if (before) {
      if (item.nextElementSibling !== before) list.insertBefore(item, before);
    } else if (list.lastElementChild !== item) {
      list.appendChild(item);
    }
    tripRenumber(list);
  }
  function onTripPointerUp(e) {
    if (!tripDrag) return;
    // Nur der Finger/Zeiger, der den Drag gestartet hat, beendet ihn (Multi-Touch).
    if (e && tripDrag.pointerId != null && e.pointerId !== tripDrag.pointerId) return;
    const list = tripDrag.list, item = tripDrag.item, startIndex = tripDrag.startIndex;
    tripDrag = null;
    item.classList.remove("is-dragging");
    list.classList.remove("is-reordering");
    const items = Array.from(list.querySelectorAll(".triptl__item"));
    const endIndex = items.indexOf(item);
    if (endIndex >= 0 && endIndex !== startIndex) moveTripStop(startIndex, endIndex);
  }

  // ----- Zurück-Geste (Android-Gestensteuerung / Browser-Zurück) -----
  // Standardmäßig schließt eine Zurück-Geste die installierte PWA sofort. Das
  // fühlt sich falsch an, wenn man gerade tief in einer Übung steckt. Wir
  // halten deshalb einen „Puffer"-Eintrag in der Browser-History vor: Jede
  // Zurück-Geste löst dann ein popstate aus, das uns EINE Ebene höher bringt
  // (z.B. Übung → Setup → Dashboard) statt die App zu verlassen. Erst auf dem
  // Dashboard („home") gibt die nächste Zurück-Geste die App regulär frei.

  // Übergeordneter Screen je Ebene („eins höher"). Was hier nicht steht, führt
  // direkt aufs Dashboard. So landet man stufenweise wieder auf der Startseite,
  // statt mit einem Wisch unabsichtlich die ganze App zu schließen.
  const SCREEN_PARENT = {
    quiz: "quizSetup", quizDone: "quizSetup",
    battle: "battleSetup", battleDone: "battleSetup",
    roleplay: "roleplaySetup",
    precios: "preciosSetup", preciosDone: "preciosSetup",
    frases: "frasesSetup", frasesDone: "frasesSetup",
    conjug: "conjugSetup", conjugDone: "conjugSetup",
    yesto: "yestoSetup", yestoDone: "yestoSetup",
    dialogos: "dialogosSetup", dialogosDone: "dialogosSetup",
    comprasQuiz: "compras", comprasQuizDone: "compras",
    editor: "home",
  };

  let backGuardArmed = false; // liegt aktuell ein Puffer-Eintrag auf dem Stack?

  function historyAvailable() {
    return typeof history !== "undefined" && typeof history.pushState === "function";
  }

  // Einen Puffer-Eintrag legen (idempotent), falls noch keiner liegt. Same-URL
  // pushState (kein url-Argument) – die Adresse bleibt unverändert.
  function armBackGuard() {
    if (!historyAvailable() || backGuardArmed) return;
    try { history.pushState({ scGuard: true }, ""); backGuardArmed = true; } catch (e) { /* z.B. file:// – Feature bleibt inert */ }
  }

  // Wohin führt „eins höher" vom aktuellen Screen? Die Detailseite kehrt dahin
  // zurück, wo der Zurück-Knopf ohnehin hinführt (Startseite oder Statistik).
  function backTarget() {
    if (state.screen === "card") return state.backTo === "home" ? "home" : state.backTo === "search" ? "search" : "stats";
    // Fertig-Screen: zurück zur Herkunft der Runde (Pre-Trip-Plan / Aufgabe), sonst Dashboard.
    if (state.screen === "done") return state.studyOrigin === "pretrip" ? "pretrip" : state.studyOrigin === "task" ? "task" : "home";
    return SCREEN_PARENT[state.screen] || "home";
  }

  // Reagiert auf eine Zurück-Geste: erst offene Einblendungen schließen, sonst
  // eine Ebene höher navigieren. Liefert false, wenn nichts mehr abzufangen ist
  // (wir sind auf dem Dashboard) – dann darf die App sich regulär schließen.
  function handleBack() {
    // 1) Offene Overlays/Panels zuerst schließen (wie ein „Schließen").
    if (state.updateNotice && state.updateNotice.length) { dismissUpdateNotice(); return true; }
    if (state.szShow) { szClose(); return true; }
    if (state.favShow) { favClose(); return true; }
    if (state.screen === "study" && state.contextOpen) { setContextOpen(false); render(); return true; }
    // 2) Auf einem Home-Reiter: erst zum Start-Reiter zurück (Lernen/Entdecken/
    //    Profil → Start), dann gibt die nächste Geste die App frei.
    if (state.screen === "home") {
      if (state.homeTab !== "start") { setTab("start"); return true; }
      return false;
    }
    // Onboarding: schrittweise zurück durch die Kette (Reiseziel → Name/Geschlecht →
    // Erklär-Slides → einzelne Slides). Erst vom allerersten Slide überspringt „Zurück"
    // das Onboarding ganz (zählt als erledigt, kein Wiederzeigen). Der Ruta-Check bleibt
    // dann als offene Aufgabe (placementPending) im Dashboard sichtbar.
    if (state.screen === "onboarding") {
      if (state.onboardStep === "trip") { state.onboardStep = "profile"; render(); return true; }
      if (state.onboardStep === "profile") { state.onboardStep = "intro"; state.onboardSlide = onboardSlideCount() - 1; render(); return true; }
      if (state.onboardStep === "intro" && (state.onboardSlide || 0) > 0) { state.onboardSlide = (state.onboardSlide || 0) - 1; render(); return true; }
      finishOnboarding();
      return true;
    }
    // Zurück aus dem Onboarding-Ruta-Check schließt das Onboarding ab (nicht erneut zeigen).
    if (state.screen === "placement" && state.placement && state.placement.fromOnboarding) { finishOnboarding(); return true; }
    // 3) Eine Ebene höher.
    const target = backTarget();
    if (target === "home") goHome();
    else if (target === "stats") goStats();
    else {
      dismissBadgeToast();
      state.revealed = false;
      state.contextOpen = false;
      state.typeResult = null;
      setState({ screen: target });
    }
    return true;
  }

  function onPopState() {
    backGuardArmed = false; // der Puffer-Eintrag wurde gerade konsumiert
    const handled = handleBack();
    // Sind wir noch in der App, sofort einen neuen Puffer legen, damit die
    // nächste Zurück-Geste wieder bei uns landet (render() macht das beim
    // Navigieren bereits – das hier deckt overlay-Fälle ohne Re-Render ab).
    if (handled && !(state.screen === "home" && state.homeTab === "start")) armBackGuard();
  }

  // ----- Rendern -----
  // Merkt sich die zuletzt gerenderte Ansicht, um beim ECHTEN Ansichtswechsel
  // (anderer Screen oder – im Dashboard – anderer Reiter) den Fenster-Scroll auf
  // 0 zu setzen. Sonst „erbt“ die neue Seite die Scroll-Position der alten: wer im
  // Entdecken-Reiter nach unten scrollt und eine Kategorie öffnet, landet sonst
  // mitten in der neuen Seite statt oben. Re-Renders DERSELBEN Ansicht (Karte
  // umdrehen, Antwort prüfen, Dialog-Zug) lassen den Scroll bewusst stehen.
  let lastScrollKey = null;
  function scrollKey() {
    return state.screen === "home" ? "home:" + state.homeTab : state.screen;
  }
  function resetScrollOnViewChange() {
    const key = scrollKey();
    if (key === lastScrollKey) return;
    lastScrollKey = key;
    try {
      window.scrollTo(0, 0);
    } catch (e) {
      try { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; } catch (e2) { /* egal */ }
    }
  }

  // Scrollspy für die Sprungmarken-Leiste im Lernen-Reiter: markiert den Chip der
  // Themen-Gruppe, die gerade oben einläuft, und legt beim Kleben einen dezenten
  // Schatten an. Rein DOM-seitig (classList) – kein Re-Render, kein App-Zustand;
  // die Sprünge selbst laufen über die bestehende „scroll-to"-Aktion. Wird nach
  // jedem Render des Lernen-Reiters neu verdrahtet (das innerHTML wird ersetzt).
  let topicSpy = null;
  let stuckWired = false;
  function wireTopicSpy() {
    const nav = document.getElementById("topic-nav");
    // Sticky-Schatten einmalig verdrahten (Element wird per id bei jedem Scroll
    // frisch gesucht, da das DOM bei Re-Renders ausgetauscht wird).
    if (nav && !stuckWired && typeof window.addEventListener === "function") {
      stuckWired = true;
      window.addEventListener("scroll", function () {
        const n = document.getElementById("topic-nav");
        if (n) n.classList.toggle("is-stuck", n.getBoundingClientRect().top <= 0.5);
      }, { passive: true });
    }
    // Ohne IntersectionObserver bleiben die Chips reine Anker-Sprünge (Fallback).
    if (!nav || typeof IntersectionObserver !== "function") return;
    const chips = nav.querySelectorAll(".dashnav__chip");
    const sections = root.querySelectorAll(".topicgrp[id]");
    if (!sections.length) return;
    if (topicSpy) topicSpy.disconnect();
    // Aktiven Chip optisch (is-active) UND für Screenreader (aria-current) markieren –
    // beides stets im Gleichschritt, damit die Sprungleiste auch vorgelesen stimmig ist.
    const setActive = (id) => chips.forEach((c) => {
      const on = c.getAttribute("data-target") === id;
      c.classList.toggle("is-active", on);
      if (on) c.setAttribute("aria-current", "location");
      else c.removeAttribute("aria-current");
    });
    setActive(sections[0].id); // erste Gruppe initial markieren
    topicSpy = new IntersectionObserver(function (entries) {
      const vis = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: "-64px 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] });
    sections.forEach((s) => topicSpy.observe(s));
  }

  function render() {
    // Screen-Dispatch-Tabelle: state.screen -> Funktion, die das HTML liefert.
    // Ersetzt die fruehere if/else-Kette. Unbekannte Screens fallen auf Home
    // zurueck (wie zuvor der else-Zweig). Reine Lookup-Tabelle, Verhalten gleich.
    const SCREENS = {
      "study": () => ui.renderStudy(studyVM()),
      "done": () => ui.renderDone(),
      "stats": () => ui.renderStats(statsVM()),
      "card": () => ui.renderCard(cardVM()),
      "editor": () => ui.renderEditor(editorVM()),
      "info": () => ui.renderInfo(infoVM()),
      "historia": () => ui.renderHistoria(historiaVM()),
      "knigge": () => ui.renderKnigge(kniggeVM()),
      "bebidas": () => ui.renderBebidas(bebidasVM()),
      "regatear": () => ui.renderRegatear(regatearVM()),
      "logistica": () => ui.renderLogistica(logisticaVM()),
      "salud": () => ui.renderSalud(saludVM()),
      "flirt": () => ui.renderFlirt(flirtVM()),
      "fotos": () => ui.renderFotos(fotosVM()),
      "bailar": () => ui.renderBailar(bailarVM()),
      "musica": () => ui.renderMusica(musicaVM()),
      "badges": () => ui.renderBadges(badgesVM()),
      "social": () => ui.renderSocial(socialVM()),
      "hostel": () => ui.renderHostel(hostelVM()),
      "pretrip": () => ui.renderPretrip(pretripVM()),
      "teacher": () => ui.renderTeacher(teacherVM()),
      "printsheet": () => ui.renderPrintSheet(sheetVM()),
      "task": () => ui.renderTask(taskVM()),
      "placement": () => ui.renderPlacement(placementVM()),
      "assessment": () => ui.renderAssessment(assessmentVM()),
      "battleSetup": () => ui.renderBattleSetup(battleSetupVM()),
      "battle": () => ui.renderBattle(battleVM()),
      "battleDone": () => ui.renderBattleDone(battleDoneVM()),
      "roleplaySetup": () => ui.renderRoleplaySetup(roleplaySetupVM()),
      "roleplay": () => ui.renderRoleplay(roleplayVM()),
      "quizSetup": () => ui.renderQuizSetup(quizSetupVM()),
      "quiz": () => ui.renderQuiz(quizVM()),
      "quizDone": () => ui.renderQuizDone(),
      "cuerpo": () => ui.renderCuerpo(cuerpoVM()),
      "conjugacion": () => ui.renderConjugacion(conjugacionVM()),
      "tiempos": () => ui.renderTiempos(tiemposVM()),
      "spickzettel": () => ui.renderSpickzettel(spickzettelVM()),
      "favorites": () => ui.renderFavorites(favoritesVM()),
      "preciosSetup": () => ui.renderPreciosSetup(preciosSetupVM()),
      "precios": () => ui.renderPrecios(preciosVM()),
      "preciosDone": () => ui.renderPreciosDone(),
      "frasesSetup": () => ui.renderFrasesSetup(frasesSetupVM()),
      "frases": () => ui.renderFrases(frasesVM()),
      "frasesDone": () => ui.renderFrasesDone(),
      "conjugSetup": () => ui.renderConjugSetup(conjugSetupVM()),
      "conjug": () => ui.renderConjug(conjugVM()),
      "conjugDone": () => ui.renderConjugDone(),
      "yestoSetup": () => ui.renderYestoSetup(yestoSetupVM()),
      "yesto": () => ui.renderYesto(yestoVM()),
      "yestoDone": () => ui.renderYestoDone(),
      "dialogosSetup": () => ui.renderDialogosSetup(dialogosSetupVM()),
      "dialogos": () => ui.renderDialogos(dialogosVM()),
      "dialogosDone": () => ui.renderDialogosDone(),
      "compras": () => ui.renderCompras(comprasVM()),
      "comprasQuiz": () => ui.renderComprasQuiz(comprasQuizVM()),
      "comprasQuizDone": () => ui.renderComprasQuizDone(),
      "search": () => ui.renderSearch(searchVM()),
      "onboarding": () => ui.renderOnboarding(homeVM()),
    };
    const screenFn = SCREENS[state.screen];
    root.innerHTML = screenFn ? screenFn() : ui.renderHome(homeVM());

    // Nach dem Austausch des Inhalts: bei echtem Ansichtswechsel oben anfangen.
    resetScrollOnViewChange();

    // Glückwunsch-Einblendung als eigene Ebene über den aktuellen Screen.
    if (badges && state.badgeToast && state.badgeToast.length) {
      root.insertAdjacentHTML("afterbegin", ui.badgeToast(state.badgeToast, profileName()));
    }

    // „Was ist neu?"-Hinweis nach einem Update – oberste Ebene (Scrim + Karte).
    // loc() überlagert title/items per …En für die aktive UI-Sprache (localizeDeep),
    // sodass der Hinweis bei Englisch englisch erscheint und live umschaltet.
    if (state.updateNotice && state.updateNotice.length) {
      root.insertAdjacentHTML("afterbegin", ui.updateNotice(loc(state.updateNotice)));
    }

    // „Neue Version – jetzt laden"-Banner (schwebt unten über der Reiter-Leiste),
    // wenn ein neuer Service Worker installiert ist und auf Aktivierung wartet.
    if (state.swUpdate) {
      root.insertAdjacentHTML("beforeend", ui.updateBanner());
    }

    // Fertig-Screen: die anlassbezogene Belohnungs-Inszenierung in die leere Bühne
    // fahren (SC.celebrate entscheidet Szene, baut Inhalt/Buttons, setzt aria-live +
    // Fokus). Erst NACH dem innerHTML-Austausch, da der Mount-Punkt nun existiert.
    if (state.screen === "done") mountCelebrate();
    // Mini-Spiel-Fertig-Screens: dieselbe Inszenierung wie der Haupt-Lernpfad.
    if (MINI_DONE_SCREENS[state.screen]) mountMiniDone(state.screen);
    // „¿Y esto?“: läuft der 3-2-1-Countdown noch, den nächsten Tick scharf schalten;
    // auf jedem anderen Screen einen evtl. laufenden Timer wieder abräumen (kein Leck).
    if (state.screen === "yesto") yestoArm(); else yestoDisarm();
    // 3D-Körpermodell nach dem Render verdrahten (Elemente neu, Drehung erhalten).
    if (state.screen === "cuerpo") cuerpoInit3D();
    // Diálogos: den aktiven Zug (neue Replik, Optionen, Eingabe oder Verdikt) in
    // den sichtbaren Bereich holen – bei langen Gesprächen wächst der Verlauf
    // sonst unter den Bildschirmrand.
    if (state.screen === "dialogos") scrollDialogActive();

    manageFocus();
    maybeAutoSpeak();

    // Abseits des Start-Reiters einen Puffer-Eintrag vorhalten, damit die nächste
    // Zurück-Geste eine Ebene höher führt (bzw. Lernen/Entdecken/Profil → Start)
    // statt die App zu schließen. Erst auf „Start" gibt Zurück die App frei.
    if (!(state.screen === "home" && state.homeTab === "start")) armBackGuard();

    // Sprungmarken-Scrollspy im Lernen-Reiter (aktiven Chip beim Scrollen setzen).
    if (state.screen === "home" && state.homeTab === "lernen") wireTopicSpy();
  }

  // Belohnungs-Inszenierung in den Fertig-Screen fahren. Entscheidet (rein) anhand
  // des Runden-Ergebnisses die Szene und baut sie in #cb-mount. Die Buttons routen
  // wie bisher: Pre-Trip → zurück zum Plan, Tarea → zurück zur Aufgabe, sonst
  // Übersicht/Statistik. Fehlt das Modul (z. B. Asset noch nicht da), bleibt die
  // Bühne leer statt zu crashen.
  function mountCelebrate() {
    const mount = document.getElementById("cb-mount");
    if (!mount || !(window.SC && SC.celebrate)) return;
    const result = doneVM();
    SC.celebrate.celebrate(result, mount, {
      sound: !!settings.celebrateSound, // Default aus (Sound überrascht); Haptik bleibt an
      haptics: true,
      primaryLabel: result.origin === "pretrip" ? t("study.backPretrip")
        : result.origin === "task" ? t("study.backTask")
        : t("common.overview"),
      secondaryLabel: result.origin ? t("common.overview") : t("common.statsView"),
      onPrimary: function () {
        if (result.origin === "pretrip") openPretrip();
        else if (result.origin === "task") openTaskScreen();
        else goHome();
      },
      onSecondary: function () {
        if (result.origin) goHome();
        else goStats();
      },
    });
  }

  // Mini-Spiel-Fertig-Screens auf dieselbe SC.celebrate-Inszenierung wie der
  // Haupt-Lernpfad heben. Jeder Eintrag baut aus seinem *DoneVM ein result
  // (rein genauigkeitsbasiert -> Ring-/Perfekt-Szene; kein Streak/Badge/XP, das
  // bleibt dem Karteikarten-Pfad vorbehalten) und mappt die ursprünglichen bis zu
  // drei Aktionen auf primary/secondary/tertiary. Battle ist bewusst NICHT dabei:
  // dort zählt ein 1-gegen-1-Scoreboard, kein Rundenergebnis.
  const MINI_DONE_SCREENS = {
    quizDone: true, preciosDone: true, frasesDone: true,
    conjugDone: true, dialogosDone: true, comprasQuizDone: true,
    yestoDone: true,
  };
  function miniResult(vm, scope, mode) {
    const total = Math.max(0, vm.total || 0);
    const right = Math.max(0, Math.min(total, vm.correct || 0));
    return {
      scope: scope || "",
      mode: mode,
      total: total,
      right: right,
      wrong: total - right,
      accuracy: total ? Math.round((right / total) * 100) : 0,
      isGame: true, // fehlerfreie Drill-Runde -> Pokal-Hero statt Alltags-Ring
    };
  }
  function miniDoneConfig(screen) {
    if (screen === "quizDone") {
      const vm = quizDoneVM();
      return { result: miniResult(vm, vm.setLabel, "quiz"), opts: {
        primaryLabel: t("discover.quizAgain"), onPrimary: quizAgain,
        secondaryLabel: t("common.overview"), onSecondary: goHome,
      } };
    }
    if (screen === "preciosDone") {
      const vm = preciosDoneVM();
      const scope = `${vm.flag} ${vm.currencyName} · ${vm.levelLabel}`;
      return { result: miniResult(vm, scope, "precios"), opts: {
        primaryLabel: t("discover.prcAgain"), onPrimary: preciosAgain,
        secondaryLabel: t("discover.prcOtherCountry"), onSecondary: openPrecios,
        tertiaryLabel: t("common.overview"), onTertiary: goHome,
      } };
    }
    if (screen === "frasesDone") {
      const vm = frasesDoneVM();
      return { result: miniResult(vm, vm.setLabel, "frases"), opts: {
        primaryLabel: t("discover.quizAgain"), onPrimary: frasesAgain,
        secondaryLabel: t("discover.frasesOther"), onSecondary: openFrasesSetup,
        tertiaryLabel: t("common.overview"), onTertiary: goHome,
      } };
    }
    if (screen === "conjugDone") {
      const vm = conjugDoneVM();
      return { result: miniResult(vm, vm.levelLabel, "type"), opts: {
        primaryLabel: t("discover.cjAgain"), onPrimary: conjugAgain,
        secondaryLabel: t("discover.cjOtherLevel"), onSecondary: openConjugDrill,
        tertiaryLabel: t("discover.cjToGuide"), onTertiary: openConjugacion,
      } };
    }
    if (screen === "yestoDone") {
      const vm = yestoDoneVM();
      return { result: miniResult(vm, vm.themeLabel, "quiz"), opts: {
        primaryLabel: t("discover.yeAgain"), onPrimary: yestoAgain,
        secondaryLabel: t("discover.yeOtherTheme"), onSecondary: openYesto,
        tertiaryLabel: t("common.overview"), onTertiary: goHome,
      } };
    }
    if (screen === "dialogosDone") {
      const vm = dialogosDoneVM();
      return { result: miniResult(vm, vm.title, "quiz"), opts: {
        primaryLabel: t("discover.dlgAgain"), onPrimary: dialogosAgain,
        secondaryLabel: t("discover.dlgOther"), onSecondary: openDialogosSetup,
        tertiaryLabel: t("common.overview"), onTertiary: goHome,
      } };
    }
    // comprasQuizDone
    const vm = comprasQuizDoneVM();
    return { result: miniResult(vm, vm.sectionLabel, "quiz"), opts: {
      primaryLabel: t("discover.quizAgain"), onPrimary: comprasQuizAgain,
      secondaryLabel: t("discover.comprasBackList"), onSecondary: comprasBackToList,
    } };
  }
  function mountMiniDone(screen) {
    const mount = document.getElementById("cb-mount");
    if (!mount || !(window.SC && SC.celebrate)) return;
    const cfg = miniDoneConfig(screen);
    SC.celebrate.celebrate(cfg.result, mount, Object.assign({
      sound: !!settings.celebrateSound, haptics: true,
    }, cfg.opts));
  }

  // Scrollt den aktiven Dialog-Abschnitt (#dlg-active) sanft in den Blick. Per
  // requestAnimationFrame, damit das Layout nach dem innerHTML steht.
  // Normalfall (npc-Satz, Optionen, Verdikt): block:"end" hält den darüber-
  // liegenden npc-Satz mit im Bild. Tipp-Zug dagegen: das Eingabefeld mittig
  // halten – mit block:"end" schöbe es sonst genau hinter die eingeblendete
  // Tastatur, und der Nutzer sähe nicht, was er tippt.
  function scrollDialogActive() {
    if (typeof requestAnimationFrame !== "function") return;
    requestAnimationFrame(function () {
      const active = root.querySelector("#dlg-active");
      if (!active) return;
      const input = active.querySelector("#dialogos-answer");
      const target = input || active;
      const block = input ? "center" : "end";
      const motion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      try { target.scrollIntoView({ behavior: motion ? "auto" : "smooth", block }); } catch (e) { /* egal */ }
    });
  }

  // Hält das fokussierte Eingabefeld über der eingeblendeten Bildschirmtastatur.
  // scrollDialogActive() & manageFocus() laufen beim Render – also BEVOR die
  // Tastatur auftaucht – und können deren Höhe nicht kennen. Sobald die Tastatur
  // erscheint, schrumpft der visuelle Viewport (visualViewport.resize); das Feld
  // verschwindet dann sonst hinter der Tastatur, und der Nutzer muss von Hand
  // nachscrollen. Dieser Handler holt es genau dann sanft zurück in den Blick.
  function setupKeyboardScroll() {
    const vv = window.visualViewport;
    if (!vv || typeof vv.addEventListener !== "function") return;
    // Nur echte Tipp-Felder berücksichtigen (Buttons/Slider lösen keine Tastatur aus).
    function focusedField() {
      const el = document.activeElement;
      if (!el) return null;
      if (el.tagName === "TEXTAREA") return el;
      if (el.tagName === "INPUT") {
        const t = (el.getAttribute("type") || "text").toLowerCase();
        if (t === "text" || t === "search" || t === "email" || t === "number" ||
            t === "tel" || t === "url" || t === "password") return el;
      }
      return null;
    }
    function ensureVisible() {
      const el = focusedField();
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Untere Kante des sichtbaren Bereichs = obere Tastaturkante.
      const visibleBottom = vv.offsetTop + vv.height;
      const margin = 16;
      // Feld ragt unter die Tastatur oder über den oberen Rand? Dann zentriert
      // in den verbleibenden Sichtbereich holen.
      if (rect.bottom > visibleBottom - margin || rect.top < vv.offsetTop) {
        const motion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        try { el.scrollIntoView({ behavior: motion ? "auto" : "smooth", block: "center" }); } catch (e) { /* egal */ }
      }
    }
    // Mehrere resize-Events (Tastatur-Einblend-Animation) zu einem rAF bündeln.
    let scheduled = false;
    function onViewportChange() {
      if (scheduled) return;
      scheduled = true;
      const run = function () { scheduled = false; ensureVisible(); };
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(run); else run();
    }
    vv.addEventListener("resize", onViewportChange);
    vv.addEventListener("scroll", onViewportChange);
  }

  // Hör-Modus & Preis-Trainer spielen die spanische Vorgabe automatisch ab, sobald
  // eine NEUE Aufgabe erscheint (nicht beim Aufdecken/Re-Render derselben). Der
  // Schlüssel je Aufgabe verhindert mehrfaches Vorlesen; nach der Antwort (Ergebnis
  // sichtbar) wird nichts gesprochen.
  let lastAutoSpoke = null;
  // Liefert { key, text } der aktuell automatisch vorzulesenden Vorgabe – oder
  // null, wenn gerade nichts gesprochen werden soll. Der Schlüssel je Aufgabe
  // verhindert mehrfaches Vorlesen beim Re-Render derselben Aufgabe.
  function autoSpeakTarget() {
    if (!speech || !speech.isSupported()) return null;
    if (state.screen === "study" && state.mode === "listen" && !state.typeResult) {
      const card = cardById(state.queue[0]);
      return card ? { key: "listen:" + state.queue[0], text: matcher.acceptedAnswers(card)[0] || card.es } : null;
    }
    if (state.screen === "precios" && state.precios && !state.precios.result) {
      const it = state.precios.queue[state.precios.idx];
      return it ? { key: "precios:" + state.precios.idx + ":" + it.value, text: it.es } : null;
    }
    // Diálogos: den aktuellen npc-Zug automatisch vorlesen (die Gegenseite spricht).
    if (state.screen === "dialogos" && state.dialogos) {
      const d = state.dialogos;
      const dia = dialogueById(d.dialogueId);
      const t = dia && dia.turns[d.turnIdx];
      if (t && t.who === "npc") return { key: "dialogos:" + d.dialogueId + ":" + d.turnIdx, text: withName(t.es) };
    }
    return null;
  }
  function maybeAutoSpeak() {
    const target = autoSpeakTarget();
    // Außerhalb der Hör-Phase (Ergebnis sichtbar, anderer Screen) zurücksetzen –
    // sonst bliebe die erste Karte einer NEUEN Sitzung stumm, wenn sie zufällig
    // dieselbe ist wie die zuletzt vorgelesene (auch bei „Nochmal" in 1-Karten-Runden).
    if (!target) { lastAutoSpoke = null; return; }
    if (target.key === lastAutoSpoke) return;
    lastAutoSpoke = target.key;
    if (target.text) speech.speak(target.text, settings.speechRate);
  }

  // ----- „Was ist neu?"-Hinweis nach einem Update -----
  // Beim Start die laufende Version mit der zuletzt gesehenen vergleichen.
  // Weichen sie ab -> Hinweis vormerken (render malt ihn). Die ERSTE je
  // gesehene Version (frische Installation oder Bestandsnutzer von vor diesem
  // Feature) wird nur still nachgetragen, damit niemand grundlos einen
  // Update-Hinweis bekommt.
  function checkForUpdate() {
    if (!changelog) return;
    const current = changelog.VERSION;
    let seen = null;
    try { seen = store.loadSeenVersion(); } catch (e) { seen = null; }
    if (seen && seen !== current) {
      const news = changelog.since(seen);
      if (news.length) state.updateNotice = news;
    }
    if (seen !== current) store.saveSeenVersion(current);
  }

  function dismissUpdateNotice() {
    state.updateNotice = null;
    const el = root.querySelector(".upd-scrim");
    if (el) el.remove();
  }

  // Nach jedem Voll-Re-Render (innerHTML wird ersetzt) den Fokus auf ein sinnvolles
  // Ziel setzen – sonst fällt er auf <body> und Tastatur-/Screenreader-Nutzer verlieren
  // ihre Position. preventScroll vermeidet Sprünge.
  // ----- Focus-Trap für modale Dialoge -------------------------------------
  // Modals tragen role="dialog" aria-modal="true" (ui.js). Beim Öffnen merken wir
  // uns das auslösende Element, lenken den Fokus in den Dialog und halten Tab/
  // Shift+Tab innerhalb des Dialogs (Containment). Beim Schließen kehrt der Fokus
  // dorthin zurück, wo er ausgelöst wurde. So bleibt Tastatur-/Screenreader-
  // Navigation im Modal gefangen (WCAG 2.4.3 / 2.1.2).
  let modalReturnFocus = null; // Element, das vor dem Öffnen den Fokus hatte

  // Der oberste offene Modal-Container im aktuellen DOM (oder null).
  function currentModal() {
    const list = root.querySelectorAll('[role="dialog"][aria-modal="true"]');
    return list.length ? list[list.length - 1] : null;
  }
  // Sichtbare, fokussierbare Elemente innerhalb eines Containers.
  function focusableIn(container) {
    if (!container) return [];
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(container.querySelectorAll(sel), (el) => {
      if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") return false;
      // offsetParent === null heißt i. d. R. unsichtbar (display:none / detached)
      return el.offsetParent !== null || el === document.activeElement;
    });
  }
  // Tab/Shift+Tab innerhalb des offenen Modals halten. true, wenn behandelt.
  function trapModalTab(e) {
    if (e.key !== "Tab") return false;
    const modal = currentModal();
    if (!modal) return false;
    const items = focusableIn(modal);
    if (!items.length) { e.preventDefault(); return true; }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    // Fokus außerhalb des Modals (z. B. noch auf dem Auslöser) -> hinein holen.
    if (!modal.contains(active)) {
      e.preventDefault();
      try { first.focus(); } catch (err) { /* egal */ }
      return true;
    }
    if (e.shiftKey && active === first) {
      e.preventDefault();
      try { last.focus(); } catch (err) { /* egal */ }
      return true;
    }
    if (!e.shiftKey && active === last) {
      e.preventDefault();
      try { first.focus(); } catch (err) { /* egal */ }
      return true;
    }
    return false;
  }

  function manageFocus() {
    // Focus-Trap-Buchhaltung: ist gerade ein Modal offen, merken wir uns (einmal)
    // den vorigen Fokus für die Rückgabe. Ist keins (mehr) offen, geben wir den
    // Fokus an das auslösende Element zurück. Läuft VOR der screen-spezifischen
    // Fokus-Logik unten – Modals haben Vorrang.
    const modal = currentModal();
    if (modal) {
      if (!modalReturnFocus && document.activeElement && document.activeElement !== document.body) {
        modalReturnFocus = document.activeElement;
      }
      if (!modal.contains(document.activeElement)) {
        // Update-Hinweis: wie bisher den Primär-Button („Verstanden") fokussieren,
        // nicht den ersten Button (Reload). Sonst generisch: erstes fokussierbares.
        const preferred = modal.querySelector(".upd__ok");
        const items = focusableIn(modal);
        const target = preferred || items[0] || modal;
        if (!target.hasAttribute("tabindex") && target === modal) target.setAttribute("tabindex", "-1");
        try { target.focus({ preventScroll: true }); } catch (e) { try { target.focus(); } catch (e2) { /* egal */ } }
      }
      return; // Fokus bleibt im Modal
    }
    if (modalReturnFocus) {
      const back = modalReturnFocus;
      modalReturnFocus = null;
      // Nur zurückgeben, wenn das Element noch im DOM hängt (Re-Render kann es
      // ersetzt haben – dann übernimmt die normale screen-Fokuslogik unten).
      if (back && (root.contains(back) || (document.body && document.body.contains(back)))) {
        try { back.focus({ preventScroll: true }); } catch (e) { try { back.focus(); } catch (e2) { /* egal */ } }
        return;
      }
    }
    manageScreenFocus();
  }

  function manageScreenFocus() {
    // Update-Hinweis liegt als Modal über allem -> Fokus hinein, nicht auf den
    // verdeckten Screen dahinter (Tastatur/Screenreader).
    if (state.updateNotice && state.updateNotice.length) {
      const ok = root.querySelector(".upd .upd__ok");
      if (ok) { try { ok.focus({ preventScroll: true }); } catch (e) { ok.focus(); } return; }
    }
    // Fertig-Screen: SC.celebrate (celebrate.js) setzt den Fokus selbst auf den
    // Haupt-CTA und kündigt das Ergebnis per aria-live an. manageFocus darf ihn
    // NICHT auf die Überschrift (h2.cb-title) zurückziehen – sonst geht die
    // A11y-Absicht (sofort handlungsfähig auf dem Primär-Button) verloren. Gilt
    // ebenso für die Mini-Spiel-Fertig-Screens (gleiche celebrate-Bühne).
    if (state.screen === "done" || MINI_DONE_SCREENS[state.screen]) return;
    if (state.screen === "study") {
      // Schreiben & Hören: vor dem Prüfen gehört der Fokus ins Eingabefeld.
      if ((state.mode === "type" || state.mode === "listen") && !state.typeResult) {
        const input = document.getElementById("answer");
        if (input) { input.focus(); return; }
      }
      const flipEl = document.getElementById("flip");
      if (flipEl) { try { flipEl.focus({ preventScroll: true }); } catch (e) { flipEl.focus(); } return; }
    }
    // Preis-Hörtrainer: vor dem Prüfen Fokus ins Ziffern-Feld.
    if (state.screen === "precios" && state.precios && !state.precios.result) {
      const input = document.getElementById("precios-answer");
      if (input) { input.focus(); return; }
    }
    // Diálogos: wenn der Nutzer am Zug ist und tippen soll, gehört der Fokus ins
    // Eingabefeld (Tastatur erscheint, kein extra Tap). preventScroll, damit das
    // explizite scrollDialogActive() die Sichtbarkeit übernimmt.
    if (state.screen === "dialogos" && state.dialogos && !state.dialogos.result) {
      const input = document.getElementById("dialogos-answer");
      if (input) { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } return; }
    }
    // Suche: Fokus direkt ins Eingabefeld (Tastatur erscheint, sofort lostippen).
    // Der Cursor ans Ende, damit ein gemerkter Suchbegriff weitergetippt werden kann.
    if (state.screen === "search") {
      const input = document.getElementById("search-input");
      if (input) {
        try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
        const len = input.value.length;
        try { input.setSelectionRange(len, len); } catch (e) { /* type=search erlaubt das nicht überall */ }
        return;
      }
    }
    const target = root.querySelector("h2, [data-action='card-back'], [data-action='home'], .topbar .iconbtn") || root.firstElementChild;
    if (target) {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
    }
  }

  // ----- Aktionen -----
  function startStudy(scopeId, origin) {
    dismissBadgeToast();
    state.studyOrigin = origin || null;
    const cards = scopeCards(scopeId);
    const due = dueIn(cards);
    // Nichts fällig? -> freies Üben mit GEMISCHTER Auswahl – sonst bestünde
    // jede freie Runde aus denselben ersten 20 Karten der Datenreihenfolge
    // (Karte 21+ einer Kategorie wäre nie erreichbar). Fällige Karten behalten
    // ihre Reihenfolge. In beiden Fällen auf eine Runde gedeckelt.
    const chosen = (due.length ? due : shuffle(cards)).slice(0, SESSION_CAP);
    // Letzte Kategorie merken (für "Weiter mit …" auf der Startseite).
    if (scopeId !== "all" && settings.lastScope !== scopeId) {
      settings = Object.assign({}, settings, { lastScope: scopeId });
      store.saveSettings(settings);
    }
    state.pretripDay = null;
    state.scopeId = scopeId;
    state.queue = chosen.map((c) => c.id);
    state.total = state.queue.length;
    beginRound();
    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    state.screen = state.queue.length ? "study" : "done";
    render();
  }

  // ----- Ruta del día (kurze tägliche Mini-Runde) -----
  const RUTA_DIA_CAP = 10;

  // Tag mit gestarteter Ruta del día vermerken (distinkt, für die 🗺️-Badges).
  function recordRutaDia(now) {
    if (!badges) return;
    const key = dayKey(now);
    if (gamestats.rutaDays && gamestats.rutaDays[key]) return; // heute schon gezählt
    const days = Object.assign({}, gamestats.rutaDays, { [key]: true });
    gamestats = Object.assign({}, gamestats, { rutaDays: days });
    store.saveGameStats(gamestats);
  }

  // Eine kurze, kategorienübergreifende Tagesrunde starten: bevorzugt fällige
  // Karten (gemischt), sonst neue (nie gesehene), sonst irgendeine Auswahl. Nutzt
  // den normalen Study-/SRS-Pfad – nur kleiner gedeckelt (RUTA_DIA_CAP) und über
  // alle Bereiche. Stärkt die Lern-Serie.
  function openRutaDelDia() {
    dismissBadgeToast();
    state.studyOrigin = null;
    const now = Date.now();
    const all = scopeCards("all");       // respektiert den Stufen-Filter
    const due = dueIn(all);
    let pool;
    if (due.length) {
      pool = shuffle(due);
    } else {
      const fresh = all.filter((c) => !(progress[c.id] && progress[c.id].seen));
      pool = shuffle(fresh.length ? fresh : all);
    }
    const chosen = pool.slice(0, RUTA_DIA_CAP);
    recordRutaDia(now);
    state.pretripDay = null;
    state.scopeId = "all";
    state.queue = chosen.map((c) => c.id);
    state.total = state.queue.length;
    beginRound();
    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    state.screen = state.queue.length ? "study" : "done";
    syncBadges(now, true); // 🗺️-Badges freischalten + einblenden
    render();
  }

  // ----- Kuratierte Presets (benannte Karten-Auswahl, z. B. Pre-Arrival-Pack) -----
  // Die Preset-Definitionen sind reine Daten (data.PRESETS, ID-Liste im Stil von
  // SPICKZETTEL_GROUPS). startPreset baut die Queue direkt aus der kuratierten
  // Liste – BEWUSST OHNE Stufen-Filter (matchesLevel), damit ein „Essentials"-Set
  // vollständig bleibt, egal welcher A1/A2/B1-Filter gerade aktiv ist. Läuft sonst
  // über den normalen Study-/SRS-Pfad; scope = Kategorie (für die Done-Beschriftung).
  function startPreset(presetId, origin) {
    dismissBadgeToast();
    state.studyOrigin = origin || null;
    const p = (data.PRESETS || []).find((x) => x.id === presetId);
    if (!p) return;
    const cards = p.pick.map(cardById).filter(Boolean);
    const chosen = cards.slice(0, SESSION_CAP);
    state.pretripDay = null;   // normale Preset-Runde, kein Pre-Trip-Tag
    state.scopeId = p.scope || "all";
    state.queue = chosen.map((c) => c.id);
    state.total = state.queue.length;
    beginRound();
    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    state.screen = state.queue.length ? "study" : "done";
    render();
  }

  // ----- Pre-Trip-Plan (mehrtägiger, sequenziell freischaltender Onboarding-Pfad) -----
  // Reuse des Study-Pfads wie startPreset; ein Tag gilt als abgeschlossen, sobald
  // seine Sitzung leer durchläuft (Hook in rate()). Tag N ist freigeschaltet, wenn
  // Tag N-1 abgeschlossen ist (oder es Tag 1 ist). Fortschritt persistent in gamestats.
  const PRETRIP = () => data.PRETRIP || [];
  const pretripPlan = (scope) => PRETRIP().find((p) => p.scope === scope) || PRETRIP()[0] || { scope: null, days: [] };
  const pretripDone = (scope, day) => !!(gamestats.pretripDays && gamestats.pretripDays[scope] && gamestats.pretripDays[scope][day]);
  const pretripUnlocked = (scope, day) => day === 1 || pretripDone(scope, day - 1);
  const planAllDone = (p) => p.days.length > 0 && p.days.every((d) => pretripDone(p.scope, d.day));

  // Standard-Destination für den Pre-Trip-Plan: folgt dem Trip-Ziel/der Edition,
  // sonst der erste Plan (Kolumbien).
  function defaultPretripScope() {
    if (tripMentions("cusco")) return "cusco"; // konkrete Städte vor dem breiten Land
    if (tripMentions("lima")) return "lima";
    if (tripMentions("arequipa")) return "arequipa";
    if (tripMentions("peru")) return "peru";
    if (tripMentions("cdmx")) return "cdmx";
    if (tripMentions("oaxaca")) return "oaxaca";
    if (tripMentions("merida")) return "merida";
    if (tripMentions("mexico")) return "mexico";
    if (tripMentions("arenal")) return "arenal";
    if (tripMentions("monteverde")) return "monteverde";
    if (tripMentions("costarica")) return "costarica";
    if (tripMentions("quito")) return "quito";
    if (tripMentions("ecuador")) return "ecuador";
    if (tripMentions("antigua")) return "antigua";
    if (tripMentions("guatemala")) return "guatemala";
    if (tripMentions("buenosaires")) return "buenosaires";
    if (tripMentions("mendoza")) return "mendoza";
    if (tripMentions("bariloche")) return "bariloche";
    if (tripMentions("argentina")) return "argentina";
    if (tripMentions("santiago")) return "santiago";
    if (tripMentions("valparaiso")) return "valparaiso";
    if (tripMentions("atacama")) return "atacama";
    if (tripMentions("puertonatales")) return "puertonatales";
    if (tripMentions("pucon")) return "pucon";
    if (tripMentions("chile")) return "chile";
    if (tripMentions("lapaz")) return "lapaz";
    if (tripMentions("uyuni")) return "uyuni";
    if (tripMentions("copacabana")) return "copacabana";
    if (tripMentions("sucre")) return "sucre";
    if (tripMentions("bolivia")) return "bolivia";
    if (tripMentions("cartagena")) return "cartagena"; // konkrete Städte vor dem breiten Kolumbien
    if (tripMentions("medellin")) return "medellin";
    if (tripMentions("colombia")) return "colombia";
    return (PRETRIP()[0] || {}).scope || "colombia";
  }

  function openPretrip() {
    dismissBadgeToast();
    if (!state.pretripScope || !PRETRIP().some((p) => p.scope === state.pretripScope)) {
      state.pretripScope = defaultPretripScope();
    }
    setState({ screen: "pretrip" });
  }

  function setPretripScope(scope) {
    if (state.pretripLock) return; // zugewiesene Aufgabe: Ziel ist fix, kein Wechsel
    if (!PRETRIP().some((p) => p.scope === scope)) return;
    setState({ pretripScope: scope });
  }

  function pretripVM() {
    // Zugewiesene Aufgabe: Ziel ist auf das vom Lehrer gewählte Land fixiert.
    const locked = !!(state.pretripLock && PRETRIP().some((p) => p.scope === state.pretripLock));
    const scope = locked ? state.pretripLock : (state.pretripScope || defaultPretripScope());
    const plan = pretripPlan(scope);
    const days = plan.days.map((d) => {
      const ch = d.challengeId ? (data.CHALLENGES || []).find((c) => c.id === d.challengeId) : null;
      return {
        day: d.day,
        title: natk(d, "titleDe"),
        count: d.cardIds.length,
        challenge: ch ? natk(ch, "textDe") : null,
        done: pretripDone(scope, d.day),
        unlocked: pretripUnlocked(scope, d.day),
      };
    });
    const total = days.length;
    const doneCount = days.filter((d) => d.done).length;
    // Im gesperrten Modus NUR das zugewiesene Land anbieten (kein Wechsel).
    const plans = (locked ? PRETRIP().filter((p) => p.scope === scope) : PRETRIP()).map((p) => ({
      scope: p.scope,
      label: natk(categoryById(p.scope) || {}, "label") || p.scope,
      active: p.scope === scope,
      done: planAllDone(p),
    }));
    const scopeLabel = natk(categoryById(scope) || {}, "label") || scope;
    return { scope, scopeLabel, locked, plans, days, total, doneCount, allDone: total > 0 && doneCount === total };
  }

  function startPretripDay(day) {
    dismissBadgeToast();
    const scope = state.pretripScope || defaultPretripScope();
    const plan = pretripPlan(scope);
    const d = plan.days.find((x) => x.day === day);
    if (!d || !pretripUnlocked(scope, day)) return; // gesperrte Tage nicht startbar
    const cards = d.cardIds.map(cardById).filter(Boolean);
    if (!cards.length) { recordPretripDay(scope, day); openPretrip(); return; }
    state.studyOrigin = "pretrip";  // nach der Etappe zurück zum Pre-Trip-Plan
    state.pretripDay = day;
    state.pretripScope = scope;
    state.scopeId = scope;                          // korrektes Done-Label
    state.queue = cards.map((c) => c.id);
    state.total = state.queue.length;
    beginRound();
    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    setState({ screen: "study" });
  }

  // Einen Pre-Trip-Tag als abgeschlossen vermerken (je Destination, distinkt, idempotent).
  function recordPretripDay(scope, day) {
    if (!scope || !day || pretripDone(scope, day)) return;
    const scopeDays = Object.assign({}, gamestats.pretripDays && gamestats.pretripDays[scope], { [day]: true });
    const days = Object.assign({}, gamestats.pretripDays, { [scope]: scopeDays });
    gamestats = Object.assign({}, gamestats, { pretripDays: days });
    store.saveGameStats(gamestats);
    syncBadges(Date.now(), true); // „Reisefertig"-Badge freischalten, wenn ein ganzer Plan geschafft
  }

  // ----- Lehrer-/Coordinator-Modus (backend-frei, offline, ohne Konto) -----
  // Eine Lehrkraft importiert die Fortschritts-Backups ihrer Schüler (dieselben
  // holaruta-backup-*.json, die jede:r über „Export" erzeugt) und sieht eine
  // Klassenübersicht. Alles bleibt NUR im Sitzungsspeicher (state.teacherStudents)
  // – nichts wird in localStorage geschrieben oder gesendet (DSGVO-freundlich).
  // store.readBackup liest das Backup OHNE den eigenen Fortschritt zu überschreiben;
  // badges.buildMetrics berechnet daraus dieselben Kennzahlen wie für den Ruta-Pass.
  function openTeacher() {
    dismissBadgeToast();
    // Sinnvolle Vorauswahl, damit der Ziel-Picker eine Auswahl zeigt und „Code
    // erzeugen" sofort funktioniert (sonst bliebe die Auswahl leer = no-op).
    if (!state.taskItems.length) {
      const first = taskTargets()[0];
      if (first) state.taskItems = [targetValueToItem(first.value)];
    }
    // QR-Generator (window.SC.qr) wird beim Lehrer-Screen inline für den
    // Aufgaben-Code-QR gebraucht. Bei Bedarf nachladen, dann (neu) rendern –
    // der inline qrSvg-Guard zeigt sonst nur ein leeres Feld bis zum Reload.
    loadModule("qr", () => setState({ screen: "teacher" }));
  }

  // Aus einem Backup-Payload eine kompakte Schüler-Auswertung bauen (rein).
  function studentSummaryFromBackup(name, payload) {
    const b = store.readBackup(payload);
    if (!b) return null;
    const m = badges.buildMetrics(allCards(), b.progress, b.gamestats);
    const planMax = (data.PRETRIP && data.PRETRIP[0] && data.PRETRIP[0].days.length) || 7;
    // Gemeisterte Destination-Pakete: Kategorien mit ≥80 % Mastery (wie cat-Badges).
    const masteredCats = Object.keys(m.categoryMastery || {})
      .filter((cat) => (m.categoryMastery[cat] || 0) >= 0.8)
      .map((cat) => { const c = categoryById(cat); return c ? natk(c, "label") : cat; });
    return {
      name: name || t("teacher.defaultName"),
      cardsReviewed: m.cardsReviewed,
      cardsMastered: m.cardsMastered,
      totalCards: m.totalCards,
      reviews: m.totalReviews,
      streak: m.dailyStreak,
      longestStreak: m.longestStreak,
      challenges: m.challengesCompleted,
      pretripDays: Math.min(m.pretripDaysDone, planMax),
      pretripMax: planMax,
      masteredCats,
      // Einstufung: letztes Ergebnis je Test (falls der Schüler ihn gemacht hat).
      // Der ausführliche Nivel-Test ist genauer und hat in der Anzeige Vorrang.
      placement: (b.gamestats && typeof b.gamestats.placement === "object" && b.gamestats.placement) || null,
      assessment: (b.gamestats && typeof b.gamestats.assessment === "object" && b.gamestats.assessment) || null,
    };
  }

  // Mehrere ausgewählte Backup-Dateien einlesen (Dateiname = Schülername).
  function handleTeacherFiles(files) {
    const list = Array.prototype.slice.call(files || []);
    if (!list.length) return;
    let added = 0, updated = 0, skipped = 0, pending = list.length;
    const finalize = () => {
      if (--pending > 0) return;
      if (!added && !updated) showNotice(t("teacher.noneAdded"));
      else if (updated) showNotice(t("teacher.someUpdated", { n: updated }));
      else if (skipped) showNotice(t("teacher.someSkipped", { n: skipped }));
      render();
    };
    list.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        let payload = null;
        try { payload = JSON.parse(String(reader.result)); } catch (e) { payload = null; }
        const fallback = t("teacher.defaultName");
        const name = String(file.name || fallback).replace(/\.json$/i, "").replace(/^holaruta-backup-?/i, "").trim() || fallback;
        const summary = payload ? studentSummaryFromBackup(name, payload) : null;
        if (summary) {
          // Gleichnamiges Backup ersetzt das alte (Re-Import nach erneutem Export) –
          // keine Dubletten in der Klassenliste.
          const res = stats.upsertStudent(state.teacherStudents, summary);
          state.teacherStudents = res.roster;
          if (res.replaced) updated++; else added++;
        } else skipped++;
        finalize();
      };
      reader.onerror = () => { skipped++; finalize(); };
      reader.readAsText(file);
    });
  }

  function removeTeacherStudent(idx) {
    state.teacherStudents = state.teacherStudents.filter((_, i) => i !== idx);
    render();
  }
  function clearTeacher() {
    if (state.teacherStudents.length && !confirmAsk(t("teacher.confirmClear"))) return;
    setState({ teacherStudents: [] });
  }
  function printTeacher() { try { window.print(); } catch (e) { /* egal */ } }

  // Klassentabelle nach Spalte sortieren: gleiche Spalte erneut -> Richtung umdrehen,
  // neue Spalte -> sinnvolle Startrichtung (Name aufsteigend, Kennzahlen absteigend).
  function setTeacherSort(key) {
    const cur = state.teacherSort || { key: "name", dir: 1 };
    if (cur.key === key) state.teacherSort = { key, dir: cur.dir * -1 };
    else state.teacherSort = { key, dir: key === "name" ? 1 : -1 };
    render();
  }

  function setClassName(value) { state.teacherClassName = String(value || ""); }

  // CSV-Spaltenüberschriften in derselben Reihenfolge wie stats.rosterRow (9 Spalten).
  function rosterCsvHeader() {
    return [
      t("teacher.colName"), t("teacher.colNivel"), t("teacher.colScore"),
      t("teacher.colMastered"), t("teacher.colTotal"), t("teacher.colStreak"),
      t("teacher.colChallenges"), t("teacher.colPretrip"), t("teacher.colPacks"),
    ];
  }

  // Klassenliste als CSV herunterladen (offline, kein Server) – fürs Schul-Archiv
  // oder Tabellenkalkulation. Reihenfolge wie aktuell sortiert angezeigt.
  function exportRosterCSV() {
    const vm = teacherVM();
    if (!vm.count) return;
    const csv = stats.rosterCSV(vm.students, rosterCsvHeader());
    // BOM voranstellen, damit Excel UTF-8 (Akzente/ñ) korrekt liest.
    const slug = String(state.teacherClassName || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const fname = "holaruta-klasse" + (slug ? "-" + slug : "") + "-" + dayKey(Date.now()) + ".csv";
    let url = null;
    try {
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      flashButton("teacher-csv", t("teacher.csvDownloaded"));
      buzz(8);
    } catch (e) {
      console.warn("CSV-Export fehlgeschlagen", e);
      showNotice(t("teacher.noneAdded"));
    } finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }

  function teacherVM() {
    // Zeilen mit ihrem Ursprungs-Index versehen, DAMIT die Sortierung nur die Anzeige
    // betrifft und „Entfernen" weiterhin den richtigen Eintrag in state.teacherStudents trifft.
    const raw = state.teacherStudents;
    const withIdx = raw.map((s, i) => Object.assign({ _idx: i }, s));
    const sort = state.teacherSort || { key: "name", dir: 1 };
    const students = stats.sortRoster(withIdx, sort.key, sort.dir);
    const items = state.taskItems.slice();
    return {
      sortKey: sort.key,
      sortDir: sort.dir,
      className: state.teacherClassName || "",
      printDate: (() => { try { return new Date().toLocaleDateString(state.uiLang === "en" ? "en-GB" : "de-DE"); } catch (e) { return ""; } })(),
      levelDist: stats.levelDistribution(raw),
      students,
      count: students.length,
      // Klassen-Aggregat für die Kopfzeile.
      avgMastered: students.length
        ? Math.round(students.reduce((s, x) => s + x.cardsMastered, 0) / students.length) : 0,
      totalCards: students.length ? students[0].totalCards : 0,
      taskTargets: taskTargets(),
      bundles: bundlesVM(),                       // kuratierte Vorlagen
      taskItemKeys: items.map(itemKey),           // aktuell gewählte Ziele (als "kind:scope")
      taskSummary: taskSelectionSummary(),        // Feld-Anzeige (none/single/bundle)
      activeBundleIds: activeBundleIds(),         // alle komplett enthaltenen Bundles (✓-Markierung)
      targetPicker: state.targetPicker,           // offenes Ziel-Picker-Modal? ('task' | null)
      taskTitle: state.taskTitle,                 // Titel-Feld vorbelegen
      taskDue: state.taskDue,                     // Frist-Feld vorbelegen
      taskCode: state.teacherTaskCode,
      taskCodeLabel: state.teacherTaskCodeLabel,  // lesbare Bestätigung, WOFÜR der Code ist
    };
  }

  // ----- Aufgaben/Zuweisung (backend-frei): teilbarer Aufgaben-Code -----
  // Verfügbare Aufgaben-Ziele aus den vorhandenen Daten: Pre-Trip-Pläne,
  // Pre-Arrival-Pakete und ganze Destination-Pakete.
  function taskTargets() {
    const labelOf = (sc) => { const c = categoryById(sc); return c ? natk(c, "label") : sc; };
    const out = [];
    (data.PRETRIP || []).forEach((p) => out.push({ value: "pretrip:" + p.scope, label: labelOf(p.scope), group: "pretrip" }));
    (data.PRESETS || []).forEach((pr) => out.push({ value: "preset:" + pr.id, label: labelOf(pr.scope), group: "preset" }));
    // Ganzes Paket = beliebiger Themenbereich (Destinationen UND Klassiker wie Notfall/Essen).
    (data.CATEGORIES || []).forEach((c) => out.push({ value: "category:" + c.id, label: natk(c, "label"), group: "category" }));
    return out;
  }

  // Bundle-Vorlagen mit lokalisierten Labels + Item-Schlüsseln (für die Auswahl).
  function bundlesVM() {
    return (data.BUNDLES || []).map((b) => ({
      id: b.id, icon: b.icon || "📦", group: b.group || "tema",
      label: natk(b, "label"), count: (b.items || []).length,
      itemKeys: (b.items || []).map(itemKey),
    }));
  }

  // "kind:scope" <-> {kind, scope}: ein Item-Schlüssel deckt sich mit taskTargets().value.
  function itemKey(it) { return it.kind + ":" + it.scope; }
  function targetValueToItem(value) { const p = String(value).split(":"); return { kind: p[0], scope: p.slice(1).join(":") }; }

  function taskTargetLabel(task) {
    if (!task) return "";
    let sc = task.scope;
    if (task.kind === "preset") { const pr = (data.PRESETS || []).find((p) => p.id === task.scope); sc = pr ? pr.scope : task.scope; }
    const c = categoryById(sc);
    const name = c ? natk(c, "label") : sc;
    const prefix = task.kind === "pretrip" ? t("task.kindPretrip") : task.kind === "preset" ? t("task.kindPreset") : t("task.kindCategory");
    return prefix + ": " + name;
  }

  // Schlüssel ("kind:scope") der aktuellen Auswahl.
  function taskItemKeys() { return state.taskItems.map(itemKey); }
  // Ist JEDES Item eines Bundles in der Auswahl? (= Bundle gilt als „aktiv")
  function bundleFullyIn(b, keys) {
    return (b.items || []).length > 0 && (b.items || []).every((it) => keys.indexOf(itemKey(it)) >= 0);
  }
  // Bundles, deren Items komplett enthalten sind (für die ✓-Markierung im Picker).
  function activeBundleIds() {
    const keys = taskItemKeys();
    return (data.BUNDLES || []).filter((b) => bundleFullyIn(b, keys)).map((b) => b.id);
  }
  // Deckt sich die Auswahl EXAKT mit einem Bundle? Dann zeigt das Feld dessen Namen.
  function matchedBundle() {
    const set = taskItemKeys().slice().sort().join("|");
    return (data.BUNDLES || []).find((b) => (b.items || []).map(itemKey).slice().sort().join("|") === set) || null;
  }

  // Wie das Ziel-Feld die aktuelle Auswahl zusammenfasst:
  //   0 Ziele  -> { kind:"none" }
  //   1 Ziel   -> { kind:"single", label } (Einzelaufgabe)
  //   ≥2 Ziele -> { kind:"bundle", label, count } (exakter Bundle-Name oder „Eigenes Bundle")
  function taskSelectionSummary() {
    const items = state.taskItems;
    if (!items.length) return { kind: "none" };
    if (items.length === 1) return { kind: "single", label: taskTargetLabel(items[0]) };
    const m = matchedBundle();
    return { kind: "bundle", label: m ? natk(m, "label") : t("teacher.bundleCustom"), count: items.length };
  }

  // Ziel im Picker gewählt. ctx "sheet" = Aktivitätsblatt: genau EIN Ziel, danach
  // schließen. ctx "task" = Modo profe: Mehrfachauswahl (umschalten, offen lassen),
  // damit man ein Bundle zusammenstellen kann.
  function pickTarget(ctx, value) {
    if (!value) return;
    if (ctx === "sheet") { state.sheetTarget = value; state.sheetStage = "all"; state.targetPicker = null; render(); return; }
    const item = targetValueToItem(value), key = value;
    const idx = state.taskItems.findIndex((x) => itemKey(x) === key);
    if (idx >= 0) { state.taskItems = state.taskItems.filter((_, i) => i !== idx); }
    else if (state.taskItems.length >= MAX_TASK_ITEMS) { showNotice(t("teacher.tooMany", { n: MAX_TASK_ITEMS })); return; }
    else { state.taskItems = state.taskItems.concat([item]); }
    render();
  }

  // Bundle umschalten: ist es schon komplett in der Auswahl, dessen Items wieder
  // entfernen; sonst die Items dazunehmen (Vereinigung). So lassen sich mehrere
  // Bundles UND Einzelziele frei kombinieren – ein Bundle ersetzt nichts mehr.
  function toggleBundle(id) {
    const b = (data.BUNDLES || []).find((x) => x.id === id);
    if (!b) return;
    const keys = taskItemKeys();
    if (bundleFullyIn(b, keys)) {
      const rm = (b.items || []).map(itemKey);
      state.taskItems = state.taskItems.filter((it) => rm.indexOf(itemKey(it)) < 0);
    } else {
      const have = keys.slice();
      let capped = false;
      (b.items || []).forEach((it) => {
        const k = itemKey(it);
        if (have.indexOf(k) >= 0) return;
        if (state.taskItems.length >= MAX_TASK_ITEMS) { capped = true; return; }
        have.push(k); state.taskItems = state.taskItems.concat([{ kind: it.kind, scope: it.scope }]);
      });
      if (capped) showNotice(t("teacher.tooMany", { n: MAX_TASK_ITEMS }));
    }
    render();
  }

  function clearTaskSelection() {
    setState({ taskItems: [] });
  }

  // Aufgabe/Bundle erzeugen (Lehrkraft): aus der Auswahl einen Code bauen.
  // 1 Ziel  -> Einzel-Aufgabencode (HRT1, abwärtskompatibel).
  // ≥2 Ziele -> Bundle-Code (HRB1): ein Link, der mehrere Aufgaben abonniert.
  function generateTask() {
    // Aktuelle Titel/Frist übernehmen (DOM ist die Wahrheit beim Klick), in den
    // State spiegeln, damit der Re-Render sie beibehält. Die Ziele pflegt der Picker.
    const titleEl = document.getElementById("task-title");
    const dueEl = document.getElementById("task-due");
    if (titleEl) state.taskTitle = titleEl.value;
    if (dueEl) state.taskDue = dueEl.value;
    const items = state.taskItems;
    if (!items.length) return;
    const title = (state.taskTitle || "").trim(), due = state.taskDue || "";
    if (items.length === 1) {
      state.teacherTaskCode = store.encodeTask({ kind: items[0].kind, scope: items[0].scope, title: title, due: due });
      state.teacherTaskCodeLabel = taskTargetLabel(items[0]);
    } else {
      state.teacherTaskCode = store.encodeBundle({ items: items, title: title, due: due });
      const s = taskSelectionSummary();
      state.teacherTaskCodeLabel = t("teacher.bundleCodeFor", { label: s.label, n: items.length });
    }
    render();
  }

  // ----- Druckbares Aktivitätsblatt (Lehrkraft / Coordinator) -----
  // Aus einem gewählten Ziel (Pre-Trip-Plan / Pre-Arrival-Paket / Kategorie) ein
  // druckfertiges Blatt bauen: Wortschatz + Reisetipps, Stundenrezept, Real-Life
  // Challenge und Selbst-Abo-Code/Link. Bei Pre-Trip-Plänen wahlweise das ganze
  // Ziel (alle Etappen) ODER eine einzelne Etappe. window.print() macht das PDF.
  const LVL_NAME = ["", "A1", "A2", "B1"];

  function sheetTargetTask() {
    const tgt = state.sheetTarget || (taskTargets()[0] || {}).value || "";
    const parts = String(tgt).split(":");
    return { value: tgt, kind: parts[0], scope: parts.slice(1).join(":") };
  }

  function sheetChallenge(id) {
    const ch = id ? (data.CHALLENGES || []).find((c) => c.id === id) : null;
    return ch ? { text: natk(ch, "textDe"), phrase: ch.phraseEs || "" } : null;
  }

  function sheetCardLine(c) {
    const ctx = c.context || {};
    return { es: c.es, de: nat(c), note: natk(ctx, "note") || "" };
  }

  // ---------- Arbeitsheft: Übungsabschnitte aus dem Gesamtbestand ----------
  // Reiseziel-Scope -> Land (Währung + Landeskunde). Alle PRETRIP/PRESET-Scopes
  // sind Reiseziele; mehrere Städte teilen ein Land.
  const SHEET_SCOPE_COUNTRY = {
    colombia: "colombia", cartagena: "colombia", medellin: "colombia",
    peru: "peru", cusco: "peru", lima: "peru", arequipa: "peru",
    mexico: "mexico", cdmx: "mexico", oaxaca: "mexico", merida: "mexico",
    guatemala: "guatemala", antigua: "guatemala",
    argentina: "argentina", buenosaires: "argentina", mendoza: "argentina", bariloche: "argentina",
    chile: "chile", santiago: "chile", valparaiso: "chile", atacama: "chile", puertonatales: "chile", pucon: "chile",
    costarica: "costarica", arenal: "costarica", monteverde: "costarica",
    ecuador: "ecuador", quito: "ecuador",
    bolivia: "bolivia", lapaz: "bolivia", uyuni: "bolivia", copacabana: "bolivia", sucre: "bolivia",
  };
  // Land -> Währungs-Key (numbers.CURRENCIES). Ecuador (USD) & Bolivia (BOB)
  // haben keinen Eintrag -> Fallback CO (Zahlen-Block bleibt generisch).
  const SHEET_COUNTRY_CURRENCY = {
    colombia: "CO", peru: "PE", mexico: "MX", guatemala: "GT",
    argentina: "AR", chile: "CL", costarica: "CR",
  };
  // Nur für category:-Ziele mit echtem Themen-Overlap: Kategorie -> frases-cat
  // bzw. Dialog-Szenario. Reiseziele -> null = „gemischt" (über alle Frames/Dialoge).
  const SHEET_CAT_FRASES = {
    verkehr: "transporte", auto: "transporte", reise: "transporte", tour: "transporte", rumbo: "orientacion",
    hotel: "alojamiento", hostel: "alojamiento",
    essen: "comida", trinken: "comida", dieta: "comida",
    compras: "compras", dinero: "compras", banco: "compras", ropa: "compras",
    notfall: "emergencia", farmacia: "emergencia", belleza: "emergencia",
    social: "social", coqueteo: "social", familia: "social", talk: "social", noche: "social", alltag: "social",
  };
  const SHEET_CAT_DIALOG = {
    hotel: "hotel", hostel: "hostel", essen: "restaurante", trinken: "restaurante",
    verkehr: "bus", auto: "taxi", compras: "mercado", dinero: "mercado",
    notfall: "emergencia", farmacia: "farmacia", grenze: "frontera",
    coqueteo: "coqueteo", rumbo: "calle", social: "calle",
  };

  // String->uint32 (FNV-1a) + mulberry32 -> deterministischer rng pro Ziel:
  // gleiches Ziel ⇒ identisches Heft beim Nachdrucken.
  function sheetHash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  function sheetRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function sheetShuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const tmp = a[i]; a[i] = a[j]; a[j] = tmp; }
    return a;
  }

  function sheetTheme(tt, lvls) {
    const isCategory = tt.kind === "category";
    let scope = tt.scope;
    if (tt.kind === "preset") { const pr = (data.PRESETS || []).find((p) => p.id === tt.scope); scope = pr ? pr.scope : tt.scope; }
    const country = SHEET_SCOPE_COUNTRY[scope] || null;
    const hasLvl2 = (lvls || []).some((l) => Number(l) >= 2);
    return {
      frasesCat: isCategory ? (SHEET_CAT_FRASES[scope] || null) : null,
      dialogCat: isCategory ? (SHEET_CAT_DIALOG[scope] || null) : null,
      conjugLevel: hasLvl2 ? 2 : 1,
      numbersLevel: (scope === "compras" || scope === "dinero") ? 3 : 2,
      currencyKey: (country && SHEET_COUNTRY_CURRENCY[country]) || "CO",
      countryId: country,
    };
  }

  // Baut die typisierten Übungsabschnitte. Jeder Builder ist gegen leere Quellen
  // abgesichert (kein leerer Abschnitt). Reihenfolge = Heft-Reihenfolge.
  function buildSheetSections(theme, allCards, rng) {
    const out = [];
    const cards = (allCards || []).filter((c) => c && c.es && nat(c));

    // Breiter Reise-Wortschatz als Auffüll-Reserve: hat ein Ziel wenige Karten,
    // werden die karten-basierten Abschnitte (Zuordnen/Übersetzen/Satz ordnen)
    // hieraus aufgefüllt – so bleibt das Heft auch bei kleinen Zielen voll.
    // Zahlen/Gegenteile raus (eigene Abschnitte, kein echter Satz/Begriff).
    const broadPool = (data.CARDS || []).filter((c) => c && c.es && nat(c) && c.cat !== "contrarios" && c.cat !== "zahlen");
    // Wählt n Karten: erst aus der Zielmenge, dann (falls zu wenig) aus der Reserve.
    function fillFrom(primary, extra, n) {
      const seen = {};
      const pick = sheetShuffle(primary, rng).slice(0, n);
      pick.forEach((c) => { if (c.id) seen[c.id] = true; });
      if (pick.length < n) {
        const more = sheetShuffle((extra || []).filter((c) => !c.id || !seen[c.id]), rng);
        for (let i = 0; i < more.length && pick.length < n; i++) { pick.push(more[i]); if (more[i].id) seen[more[i].id] = true; }
      }
      return pick;
    }
    const isPhrase = (c) => {
      if (!c.es || c.cat === "zahlen" || c.cat === "contrarios" || c.es.indexOf("–") !== -1) return false;
      const w = c.es.trim().split(/\s+/);
      return w.length >= 4 && w.length <= 9;
    };

    // 1. Zuordnung ES<->DE (bis 14 Paare; bei kleinem Ziel aus der Reserve aufgefüllt).
    const mPairs = fillFrom(cards, broadPool, 14);
    if (mPairs.length >= 3) {
      const left = mPairs.map((c, i) => ({ n: i + 1, es: c.es, de: nat(c) }));
      const order = sheetShuffle(left.map((_, i) => i), rng);
      const right = order.map((origIdx, j) => ({ l: String.fromCharCode(97 + j), de: left[origIdx].de, orig: origIdx }));
      left.forEach((x, i) => { const r = right.find((rr) => rr.orig === i); x.l = r ? r.l : ""; });
      out.push({ type: "matching", left: left.map((x) => ({ n: x.n, es: x.es, l: x.l })), right: right.map((r) => ({ l: r.l, de: r.de })) });
    }

    // 1b. Gegenteile (Contrarios) – grundlegender Reise-Wortschatz, global (nicht
    // zielgebunden), darum ein verlässlicher Umfangs-Booster. „grande – pequeño":
    // gefragt ist das spanische Gegenteil, das deutsche Erstwort dient als Hilfe.
    const oppPick = sheetShuffle((data.CARDS || []).filter((c) => c.cat === "contrarios" && c.es && c.es.indexOf("–") !== -1), rng).slice(0, 18);
    if (oppPick.length >= 3) {
      const oppItems = oppPick.map((c) => {
        const es = c.es.split("–").map((s) => s.trim());
        const de = String(nat(c)).split("–").map((s) => s.trim());
        return { word: es[0], gloss: de[0] || "", answer: es[1] || "" };
      }).filter((it) => it.word && it.answer);
      if (oppItems.length >= 3) out.push({ type: "opposites", items: oppItems });
    }

    // 2. Lückentext (frases): themenpassend zuerst, dann gemischt aufgefüllt (bis 14).
    if (frases && frases.FRASES) {
      const all = frases.FRASES.filter((f) => f.slot && f.slot.es);
      const themed = theme.frasesCat ? all.filter((f) => f.cat === theme.frasesCat) : [];
      const chosen = [].concat(sheetShuffle(themed, rng), sheetShuffle(all.filter((f) => themed.indexOf(f) === -1), rng)).slice(0, 14);
      if (chosen.length >= 3) {
        const items = chosen.map((f) => ({ frameEs: f.frameEs, targetDe: natk(f, "targetDe"), answer: f.slot.es }));
        out.push({ type: "gapfill", wordbank: sheetShuffle(items.map((it) => it.answer), rng), items: items });
      }
    }

    // 3. Übersetzung DE->ES (bis 18): Kontextsatz wenn vorhanden, sonst die Karte;
    // bei kleinem Ziel aus der Reserve aufgefüllt.
    const trCards = fillFrom(cards, broadPool, 18);
    if (trCards.length >= 3) {
      out.push({ type: "translate", lines: trCards.map((c) => {
        const ctx = c.context;
        return (ctx && ctx.sentenceEs)
          ? { de: natk(ctx, "sentenceDe") || natk(ctx, "situation") || nat(c), es: ctx.sentenceEs }
          : { de: nat(c), es: c.es };
      }) });
    }

    // 3b. Satz ordnen (Wortstellung): mehrwortige Phrasen (4–9 Wörter), Ziel zuerst,
    // dann aus der Reserve (bis 12). Wörter durcheinander, Lösung = der ganze Satz.
    const orderPick = fillFrom(cards.filter(isPhrase), broadPool.filter(isPhrase), 12);
    if (orderPick.length >= 3) {
      out.push({ type: "ordenar", items: orderPick.map((c) => {
        const answer = c.es.trim();
        const words = answer.replace(/[.?!¿¡,;]/g, "").split(/\s+/).filter(Boolean);
        return { answer: answer, scrambled: sheetShuffle(words, rng), de: nat(c) };
      }) });
    }

    // 4. Konjugation (bis 18).
    if (conjug && data.CONJUGATION) {
      const rows = conjug.buildRound(data.CONJUGATION, theme.conjugLevel, 18, rng).map((it) => ({
        verb: natk(it, "verbHint") || it.verb,
        person: natk(it, "personDe") ? natk(it, "personDe") + " (" + it.personEs + ")" : it.personEs,
        answer: it.answer,
      }));
      if (rows.length) out.push({ type: "conjug", rows: rows });
    }

    // 5. Zahlen & Preise (bis 15).
    if (numbers && numbers.buildRound) {
      const items = numbers.buildRound(theme.currencyKey, theme.numbersLevel, 15, rng).map((it) => ({ digits: it.digits, symbol: it.symbol, words: it.words }));
      if (items.length) out.push({ type: "numbers", items: items });
    }

    // 6. Dialog-Lückentext: ZWEI Szenarien (themenpassendes zuerst), user-Repliken
    // verdeckt – ein großer Umfangs-Block aus echten Gesprächen.
    if (dialogos && dialogos.DIALOGOS && dialogos.DIALOGOS.length) {
      const list = dialogos.DIALOGOS;
      const name = "Marco";
      const sub = (s) => String(s || "").replace(/\{name\}/g, name);
      const first = (theme.dialogCat && list.find((d) => d.cat === theme.dialogCat)) || list[Math.floor(rng() * list.length)];
      const picks = [];
      if (first) picks.push(first);
      const rest = sheetShuffle(list.filter((d) => d !== first), rng);
      if (rest.length) picks.push(rest[0]);
      picks.forEach((dlg) => {
        if (dlg && dlg.turns) out.push({
          type: "dialogue", title: natk(dlg, "title"),
          turns: dlg.turns.map((tn) => tn.who === "npc"
            ? { who: "npc", es: sub(tn.es), de: nat(tn) }
            : { who: "user", de: nat(tn), answer: sub(tn.solEs) }),
        });
      });
    }

    // 7. Landeskunde (optional, per Land).
    if (knigge && knigge.ACCENTS && theme.countryId && knigge.ACCENTS[theme.countryId]) {
      const acc = knigge.ACCENTS[theme.countryId];
      const facts = ["hostel", "bus", "grupo", "cultura", "saludo", "comida", "propina", "dinero"].map((k) => natk(acc, k)).filter(Boolean);
      if (facts.length) out.push({ type: "culture", title: "", facts: facts });
    }

    // 8. Freies Schreiben (immer; mehrere Schreibanlässe).
    out.push({ type: "writing", prompts: [t("sheet.writePrompt1"), t("sheet.writePrompt2"), t("sheet.writePrompt3")] });

    return out;
  }
  // Reihenfolge-Map fürs Toggle-Label (i18n-Key je Abschnittstyp).
  const SHEET_SEC_KEY = {
    matching: "secMatching", gapfill: "secGapfill", translate: "secTranslate",
    conjug: "secConjug", numbers: "secNumbers", dialogue: "secDialogue",
    opposites: "secOpposites", ordenar: "secOrdenar",
    culture: "secCulture", writing: "secWriting",
  };

  function sheetVM() {
    const tt = sheetTargetTask();
    const task = { kind: tt.kind, scope: tt.scope, title: "" };
    const isPretrip = tt.kind === "pretrip";
    const plan = isPretrip ? pretripPlan(tt.scope) : null;
    let stageSel = state.sheetStage || "all";
    // Defensiv: zeigt der State eine Etappe, die es im aktuellen Plan nicht (mehr)
    // gibt, auf „Ganzes Ziel" zurückfallen – nie ein leeres Blatt rendern.
    if (isPretrip && stageSel !== "all" && !(plan.days || []).some((d) => String(d.day) === String(stageSel))) stageSel = "all";
    const stages = [];
    let allCards = [];
    if (isPretrip) {
      (plan.days || []).filter((d) => stageSel === "all" || String(d.day) === String(stageSel)).forEach((d) => {
        const cards = d.cardIds.map(cardById).filter(Boolean);
        allCards = allCards.concat(cards);
        stages.push({
          heading: t("sheet.stageLabel", { day: d.day }) + ": " + natk(d, "titleDe"),
          cards: cards.map(sheetCardLine),
          challenge: sheetChallenge(d.challengeId),
        });
      });
    } else {
      const cards = taskCardsFor(task);
      allCards = cards;
      stages.push({ heading: null, cards: cards.map(sheetCardLine), challenge: null });
    }
    const lvls = allCards.map((c) => c.lvl).filter(Boolean);
    const levelRange = lvls.length
      ? (Math.min.apply(null, lvls) === Math.max.apply(null, lvls)
          ? LVL_NAME[lvls[0]]
          : LVL_NAME[Math.min.apply(null, lvls)] + "–" + LVL_NAME[Math.max.apply(null, lvls)])
      : "";
    // Selbst-Abo-Code für das GANZE Ziel (Schüler öffnen damit Plan/Paket in der App).
    const code = store.encodeTask({ kind: tt.kind, scope: tt.scope, title: "", due: "" }) || "";
    const stageOpts = isPretrip
      ? [{ value: "all", label: t("sheet.allStages") }].concat(
          (plan.days || []).map((d) => ({ value: String(d.day), label: t("sheet.stageLabel", { day: d.day }) + ": " + natk(d, "titleDe") })))
      : null;
    // Akzentfarbe + Icon der Ziel-Kategorie (Pre-Trip/Preset zeigen auf eine
    // Reiseziel-Kategorie; „Ganzes Paket" ist selbst eine). Tönt nur den Kopf –
    // der Fließtext bleibt schwarz und druckt auch in S/W sauber.
    let accentScope = tt.scope;
    if (tt.kind === "preset") { const pr = (data.PRESETS || []).find((p) => p.id === tt.scope); accentScope = pr ? pr.scope : tt.scope; }
    const accentCat = categoryById(accentScope);
    const accent = (accentCat && accentCat.grad && accentCat.grad[0]) || "#a23e20";
    const icon = (accentCat && accentCat.icon) || "📄";
    // Drei Varianten: „full" (Lösungsblatt, alle Antworten sichtbar), „exercise"
    // (Druck-Übung, Antworten zu Schreiblinien) und „fill" (am Handy ausfüllbar:
    // echte Eingabefelder + Selbstkontrolle). Im Übungs- UND Fill-Modus bleibt das
    // Deutsch als Prompt stehen, die spanische Antwort wird verdeckt/abgefragt.
    const exercise = state.sheetMode === "exercise";
    const fill = state.sheetMode === "fill";
    const link = code ? taskShareLink(code) : "";
    // Arbeitsheft: zusätzliche Übungsabschnitte aus dem Gesamtbestand. Deterministisch
    // pro Ziel+Etappe geseedet (Nachdruck = identisch); abwählbare via state.sheetSkip.
    const rng = sheetRng(sheetHash(tt.value + "|" + stageSel));
    const builtSections = buildSheetSections(sheetTheme(tt, lvls), allCards, rng);
    const skip = state.sheetSkip || [];
    // Ein Chip je Abschnittstyp (mehrere gleiche Typen – z. B. zwei Dialoge – werden
    // über EINEN Chip an-/abgewählt, kein Doppel-Chip).
    const seenToggle = {};
    const sectionToggles = builtSections.filter((s) => { if (seenToggle[s.type]) return false; seenToggle[s.type] = true; return true; })
      .map((s) => ({ type: s.type, label: t("sheet." + (SHEET_SEC_KEY[s.type] || "secWriting")), on: skip.indexOf(s.type) === -1 }));
    const sections = builtSections.filter((s) => skip.indexOf(s.type) === -1);
    return {
      targets: taskTargets(), sheetTarget: tt.value,
      targetPicker: state.targetPicker, // offenes Ziel-Picker-Modal? ('sheet' | null)
      stageOpts: stageOpts, sheetStage: stageSel,
      // Wird nur EINE Etappe gedruckt? Dann startet der Abo-Code unten trotzdem
      // den GANZEN Plan – Hinweis darauf im Blatt (siehe sheet.subscribeWholeHint).
      stageScoped: isPretrip && stageSel !== "all",
      accent: accent, icon: icon, exercise: exercise, fill: fill,
      title: taskTargetLabel(task), levelRange: levelRange, cardCount: allCards.length,
      stages: stages, sections: sections, sectionToggles: sectionToggles,
      code: code, link: link,
      // QR auf den Abo-Link – Lernende scannen statt abzutippen. Browser-only
      // (window.SC.qr); fehlt der Generator/Link, bleibt das Feld leer.
      qrSvg: (link && window.SC.qr) ? window.SC.qr.svg(link, { ecc: "M", margin: 0 }) : "",
      edition: editionInfo(), date: new Date().toISOString().slice(0, 10),
    };
  }

  function openPrintSheet() {
    dismissBadgeToast();
    if (!state.sheetTarget) state.sheetTarget = (taskTargets()[0] || {}).value || "";
    if (!state.sheetStage) state.sheetStage = "all";
    if (!state.sheetMode) state.sheetMode = "full";
    if (!state.sheetSkip) state.sheetSkip = []; // abgewählte Übungsbausteine (Default: alle an)
    setState({ screen: "printsheet" });
  }

  // scope: "exercise" druckt nur das Übungsblatt, "key" nur den Lösungsschlüssel,
  // sonst (Lösungsblatt/Fill) das ganze Dokument. Die Bereichswahl läuft über eine
  // Body-Klasse, die der Druck-CSS-Block auswertet; nach dem Druck wird sie entfernt.
  function printSheet(scope) {
    const cls = scope === "key" ? "sheet-print--key" : scope === "exercise" ? "sheet-print--exercise" : "";
    const body = document.body;
    if (cls && body) {
      body.classList.add(cls);
      const clean = () => { body.classList.remove(cls); window.removeEventListener("afterprint", clean); };
      window.addEventListener("afterprint", clean);
      setTimeout(clean, 1500); // Fallback, falls afterprint ausbleibt
    }
    try { window.print(); } catch (e) { /* egal */ }
  }

  // ---------- Arbeitsheft am Handy ausfüllen (Selbstkontrolle) ----------
  // Eine Eingabe gilt als richtig, wenn sie – normalisiert (akzent-/satzzeichen-
  // tolerant, via matcher) – einer der „/"-Alternativen oder der Volllösung gleicht.
  function fillAnswerOk(input, answer) {
    const m = window.SC && window.SC.matcher;
    const norm = m ? m.normalize : (s) => String(s).trim().toLowerCase();
    const got = norm(input);
    if (!got) return false;
    const parts = String(answer || "").split("/").map((s) => s.trim()).filter(Boolean);
    parts.push(String(answer || ""));
    return parts.some((p) => norm(p) && norm(p) === got);
  }
  // Alle Eingabefelder mit hinterlegter Lösung im aktuellen Blatt.
  function fillFields() {
    return Array.prototype.slice.call(root.querySelectorAll(".sheet-fill[data-answer]"));
  }
  function setFillScore(text) {
    const out = root.querySelector(".sheet-score");
    if (out) out.textContent = text || "";
  }
  function checkFillSheet() {
    const fields = fillFields();
    if (!fields.length) return;
    let ok = 0, filled = 0;
    fields.forEach((el) => {
      el.classList.remove("is-correct", "is-wrong");
      const val = String(el.value || "").trim();
      if (!val) return;
      filled += 1;
      if (fillAnswerOk(val, el.dataset.answer)) { el.classList.add("is-correct"); ok += 1; }
      else el.classList.add("is-wrong");
    });
    setFillScore(t("sheet.fillResult", { ok: ok, total: fields.length }));
  }
  function revealFillSheet() {
    fillFields().forEach((el) => {
      el.value = el.dataset.answer || "";
      el.classList.remove("is-wrong");
      el.classList.add("is-correct");
    });
    const fields = fillFields();
    setFillScore(t("sheet.fillResult", { ok: fields.length, total: fields.length }));
  }
  function resetFillSheet() {
    fillFields().forEach((el) => { el.value = ""; el.classList.remove("is-correct", "is-wrong"); });
    setFillScore("");
  }

  // Kleines optisches Feedback auf einem Knopf (z. B. „Kopiert!“), ohne Re-Render:
  // Beschriftung & Klasse kurz tauschen und danach zurücksetzen.
  function flashButton(action, label) {
    const btn = root.querySelector('[data-action="' + action + '"]');
    if (!btn) return;
    if (btn.dataset.flashing === "1") return; // nicht stapeln
    const prev = btn.textContent;
    btn.dataset.flashing = "1";
    btn.textContent = "✓ " + label;
    btn.classList.add("btn-flash");
    setTimeout(function () {
      const b = root.querySelector('[data-action="' + action + '"]');
      if (b) { b.textContent = prev; b.classList.remove("btn-flash"); delete b.dataset.flashing; }
    }, 1600);
  }

  // Auswählen + legacy execCommand("copy") – funktioniert auch dort, wo die
  // moderne Clipboard-API gesperrt ist (file://, Android-WebView, content://).
  function execCopyFrom(el, len) {
    if (!el) return false;
    try {
      el.focus();
      el.select();
      if (el.setSelectionRange) el.setSelectionRange(0, len);
      const ok = !!(document.execCommand && document.execCommand("copy"));
      try { if (window.getSelection) window.getSelection().removeAllRanges(); el.blur(); } catch (e2) {}
      return ok;
    } catch (e) { return false; }
  }

  // Einen wichtigen Satz (z. B. im Flirt-Modul) in die Zwischenablage legen.
  // Feedback direkt am geklickten Knopf (✓), ohne Re-Render – es gibt viele
  // gleiche Knöpfe, daher über das Element statt über den data-action-Selektor.
  function copyPhrase(btn) {
    if (!btn) return;
    const text = btn.dataset.text || "";
    if (!text) return;
    const flash = function () {
      if (btn.dataset.flashing === "1") return;
      btn.dataset.flashing = "1";
      btn.classList.add("is-copied");
      const lbl = t("discover.phraseCopied");
      const prevAria = btn.getAttribute("aria-label") || "";
      btn.setAttribute("aria-label", lbl);
      setTimeout(function () {
        btn.classList.remove("is-copied");
        btn.setAttribute("aria-label", prevAria);
        delete btn.dataset.flashing;
      }, 1400);
    };
    // 1) execCommand über ein temporäres Feld (robust im WebView/Datei-Kontext).
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta);
      const ok = execCopyFrom(ta, text.length);
      document.body.removeChild(ta);
      if (ok) { flash(); return; }
    } catch (e) { /* weiter zur modernen API */ }
    // 2) Moderne Clipboard-API als Zweitversuch (sichere Kontexte).
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash, function () { showNotice(text); });
      return;
    }
    // 3) Letzter Ausweg: Satz als Hinweis zeigen.
    showNotice(text);
  }

  function copyTaskCode() {
    const code = state.teacherTaskCode;
    if (!code) return;
    const el = document.getElementById("task-code");
    // 1) execCommand zuerst (robust im mobilen/Datei-Kontext).
    if (execCopyFrom(el, code.length)) { flashButton("task-copy", t("teacher.taskCopied")); return; }
    // 2) Moderne API als Zweitversuch (sichere Kontexte, in denen execCommand fehlt).
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(
        function () { flashButton("task-copy", t("teacher.taskCopied")); },
        function () { if (el) { el.focus(); el.select(); } showNotice(t("task.copyManual")); }
      );
      return;
    }
    // 3) Letzter Ausweg: markiert lassen, Hinweis zum manuellen Kopieren.
    if (el) { el.focus(); el.select(); }
    showNotice(t("task.copyManual"));
  }

  // Lernenden-Seite: Code aus der Zwischenablage ins Eingabefeld holen (mit Feedback).
  // In gesperrten Kontexten (file://, content://, WebView) ist das Lesen der
  // Zwischenablage blockiert – dann das Feld fokussieren/markieren, damit der native
  // „Einfügen“-Befehl direkt greift, plus ein klarer Hinweis.
  function pasteTaskCode() {
    const el = document.getElementById("task-code-input");
    if (!el) return;
    function fallback() { try { el.focus(); el.select(); } catch (e) {} showNotice(t("task.pasteHint")); }
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (text) {
          text = (text || "").trim();
          // Eingefügten Code direkt abonnieren (Einzelaufgabe oder Bundle).
          if (text) { if (addByCode(text)) { el.value = ""; render(); } else { el.value = text; el.focus(); } }
          else fallback();
        }, fallback);
      } else { fallback(); }
    } catch (e) { fallback(); }
  }

  // Teilbarer Link für eine erzeugte Aufgabe: <appUrl>?edition=<id>&task=<code>.
  // appUrl aus der Edition (sonst aktuelle Adresse), damit der Link auch stimmt,
  // wenn die Lehrkraft die App als Datei öffnet.
  function taskShareLink(code) {
    const cfg = (window.SC && window.SC.config) || {};
    let base = cfg.appUrl || "";
    // Nur https als Link-Basis akzeptieren (Härtung); sonst die aktuelle Adresse.
    if (!/^https:\/\//i.test(base)) { try { base = location.origin + location.pathname; } catch (e) { base = ""; } }
    base = String(base).replace(/[?#].*$/, "");
    const parts = [];
    if (cfg.edition) parts.push("edition=" + encodeURIComponent(cfg.edition));
    parts.push("task=" + encodeURIComponent(code));
    return base + (parts.length ? "?" + parts.join("&") : "");
  }
  function copyTaskLink() {
    const code = state.teacherTaskCode;
    if (!code) return;
    const link = taskShareLink(code);
    // execCommand-Kopie über ein temporäres Feld (robust im WebView/Datei-Kontext).
    let ok = false;
    try {
      const ta = document.createElement("textarea");
      ta.value = link; ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ok = execCopyFrom(ta, link.length);
      document.body.removeChild(ta);
    } catch (e) { ok = false; }
    if (ok) { flashButton("task-copy-link", t("teacher.linkCopied")); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(function () { flashButton("task-copy-link", t("teacher.linkCopied")); }, function () { showNotice(link); });
      return;
    }
    showNotice(link);
  }

  // Lernenden-Seite: Aufgabe-Bildschirm öffnen, eingegebenen Code dekodieren.
  function openTaskScreen() { dismissBadgeToast(); state.screen = "task"; render(); }

  // Verweist eine Aufgabe auf existierende Inhalte?
  function taskTargetExists(task) {
    if (!task || !task.scope) return false;
    if (task.kind === "preset") return (data.PRESETS || []).some((p) => p.id === task.scope);
    if (task.kind === "pretrip") return (data.PRETRIP || []).some((p) => p.scope === task.scope);
    return !!categoryById(task.scope);
  }

  // Eine Aufgabe (per Code) abonnieren: dekodieren, prüfen, doppelte vermeiden,
  // persistent oben in die Liste legen. Gibt true bei Erfolg zurück (mit Toast).
  function addSubscribedTask(code, silent) {
    const task = store.decodeTask(code);
    if (!task) { if (!silent) showNotice(t("task.invalid")); return false; }
    if (!taskTargetExists(task)) { if (!silent) showNotice(t("task.unknownTarget")); return false; }
    const norm = String(code).trim();
    const idx = subscribedTasks.findIndex((x) => x.code === norm);
    const entry = { code: norm, kind: task.kind, scope: task.scope, title: task.title || "", due: task.due || "", addedAt: new Date().toISOString().slice(0, 10) };
    let next = idx >= 0
      ? [entry].concat(subscribedTasks.filter((_, i) => i !== idx)) // schon da -> nach oben
      : [entry].concat(subscribedTasks);
    if (next.length > MAX_SUBSCRIBED_TASKS) next = next.slice(0, MAX_SUBSCRIBED_TASKS); // Speicher schützen
    // Persistenz prüfen: bei vollem Speicher nicht so tun, als wäre es gespeichert.
    if (!store.saveTasks(next)) { if (!silent) showNotice(t("task.saveFailed")); return false; }
    subscribedTasks = next;
    if (!silent) showNotice(idx >= 0 ? t("task.already") : t("task.added"));
    return true;
  }

  // Code (Einzelaufgabe ODER Bundle) abonnieren – einheitlicher Einstieg für
  // Einfügen, Eingabefeld und geteilte Links. HRB1.… = Bundle (mehrere Ziele).
  function addByCode(code, silent) {
    const s = String(code || "").trim();
    if (s.indexOf("HRB") === 0) return addSubscribedBundle(s, silent);
    return addSubscribedTask(s, silent);
  }

  // Bundle abonnieren: dekodieren und JEDES enthaltene Ziel als eigene Aufgabe
  // (Einzel-Code) hinzufügen – so laufen sie wie gewohnt parallel. Titel/Frist des
  // Bundles werden auf alle Ziele übernommen. Toast fasst neu/bereits-vorhanden zusammen.
  function addSubscribedBundle(code, silent) {
    const b = store.decodeBundle(code);
    if (!b || !b.items.length) { if (!silent) showNotice(t("task.invalid")); return false; }
    let added = 0, dup = 0;
    b.items.forEach((it) => {
      if (!taskTargetExists(it)) return; // unbekanntes Ziel still überspringen
      const single = store.encodeTask({ kind: it.kind, scope: it.scope, title: b.title || "", due: b.due || "" });
      const existed = subscribedTasks.some((x) => x.code === single);
      if (addSubscribedTask(single, true)) { if (existed) dup++; else added++; }
    });
    if (!added && !dup) { if (!silent) showNotice(t("task.unknownTarget")); return false; }
    if (!silent) showNotice(dup ? t("task.bundleSome", { added: added, dup: dup }) : t("task.bundleAdded", { n: added }));
    return true;
  }

  function removeSubscribedTask(idx) {
    if (idx < 0 || idx >= subscribedTasks.length) return;
    const next = subscribedTasks.filter((_, i) => i !== idx);
    // Persistenz prüfen (wie beim Hinzufügen): scheitert das Speichern, NICHT so tun,
    // als wäre die Aufgabe weg – sonst taucht sie beim Neuladen wieder auf.
    if (!store.saveTasks(next)) { showNotice(t("task.saveFailed")); return; }
    subscribedTasks = next;
    render();
  }

  function startSubscribedTask(idx) {
    const task = subscribedTasks[idx];
    if (!task) return;
    // Herkunft "task" -> der Fertig-Screen führt zurück zur Aufgabenliste. Beim Pre-Trip
    // öffnet sich der Plan-Screen (gesperrt aufs zugewiesene Land).
    if (task.kind === "preset") startPreset(task.scope, "task");
    else if (task.kind === "pretrip") {
      if (PRETRIP().some((p) => p.scope === task.scope)) { state.pretripLock = task.scope; state.pretripScope = task.scope; }
      openPretrip();
    }
    else startStudy(task.scope, "task");
  }

  function openTaskFromInput() {
    const el = document.getElementById("task-code-input");
    if (addByCode(el ? el.value : "")) { if (el) el.value = ""; render(); }
  }

  // Die zu einer Aufgabe gehörenden Karten (Preset = kuratierte Liste, Kategorie =
  // ganzes Paket). Für Pre-Trip-Pläne zählen wir Etappen statt Karten (siehe taskProgress).
  function taskCardsFor(task) {
    if (!task) return [];
    if (task.kind === "preset") {
      const p = (data.PRESETS || []).find((x) => x.id === task.scope);
      return p ? p.pick.map(cardById).filter(Boolean) : [];
    }
    if (task.kind === "category") return (data.CARDS || []).filter((c) => c.cat === task.scope);
    return [];
  }

  // Fortschritt einer Aufgabe als { seen, total, kind }. Pre-Trip-Plan: geschaffte
  // Etappen / alle Etappen. Sonst: gelernte (mind. einmal gesehene) Karten / alle.
  function taskProgress(task) {
    if (task && task.kind === "pretrip") {
      const plan = pretripPlan(task.scope);
      const total = plan.days.length;
      const seen = plan.days.filter((d) => pretripDone(plan.scope, d.day)).length;
      return { seen, total, kind: "stages" };
    }
    const cards = taskCardsFor(task);
    const seen = cards.reduce((n, c) => n + ((stats.cardSummary(progress[c.id]).seen || 0) > 0 ? 1 : 0), 0);
    return { seen, total: cards.length, kind: "cards" };
  }

  // Ist eine Aufgabe „absolviert"? = alle Etappen bzw. alle Karten einmal durch.
  function taskDone(task) {
    if (!task) return false;
    if (task.kind === "pretrip") return planAllDone(pretripPlan(task.scope));
    const p = taskProgress(task);
    return p.total > 0 && p.seen >= p.total;
  }

  function taskVM() {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, mit der Frist (Datums-String) vergleichbar
    return {
      tasks: subscribedTasks.map((tk, i) => {
        const prog = taskProgress(tk);
        const done = prog.total > 0 && prog.seen >= prog.total;
        return {
          idx: i, targetLabel: taskTargetLabel(tk), title: tk.title, due: tk.due,
          overdue: !!(tk.due && tk.due < today), // Frist verstrichen? (nur Anzeige – startbar bleibt sie)
          done, // absolviert? -> als erledigt markieren
          started: !done && prog.seen > 0, // angefangen, aber noch nicht fertig -> optisch abheben
          pct: prog.total > 0 ? Math.round((prog.seen / prog.total) * 100) : 0, // Füllstand der Fortschrittsleiste
          seen: prog.seen, total: prog.total, progressKind: prog.kind, // „12/40" / „3/7 Etappen"
        };
      }),
    };
  }

  // ----- Ruta-Check (Einstufungstest, reisepraktisch + ehrlich) -----
  // Logik/Bewertung leben rein in placement.js; hier nur der Ablauf + Persistenz.
  // „Ich weiß es nicht“ ist eine echte Option (ehrliches Nichtwissen statt Raten),
  // die Antwortzeit je Frage wird erfasst und fließt LEICHT in die Sicherheit ein.
  function placementQuestions() { return (placement && placement.QUESTIONS) || []; }

  function placementTotalPlanned() {
    return (placement.MC_TARGET || 12) + placement.freeQuestions(placementQuestions()).length;
  }
  function currentPlacementQ() {
    const p = state.placement;
    if (!p || !p.asked.length) return null;
    return placement.questionById(p.asked[p.asked.length - 1]);
  }

  function openPlacement(fromOnboarding) {
    dismissBadgeToast();
    // Schutz, falls das placement-Modul nicht geladen ist (z. B. Edition-Build /
    // Offline-Erstaufruf): nicht crashen. Aus dem Onboarding heraus stattdessen
    // sauber abschließen, sonst einfach nichts tun. (Sonst würde unten
    // placement.START_DIFFICULTY / placementTotalPlanned() auf null zugreifen.)
    if (!placement) { if (fromOnboarding) finishOnboarding(); return; }
    // Aus dem Onboarding heraus geöffnet -> das Onboarding gilt ab jetzt als erledigt
    // (sonst erscheint es erneut, wenn jemand den überspringbaren Test abbricht).
    if (fromOnboarding && settings.onboarded !== true) {
      settings = Object.assign({}, settings, { onboarded: true });
      store.saveSettings(settings);
    }
    state.placement = {
      phase: "intro", fromOnboarding: !!fromOnboarding,
      asked: [], answers: [], difficulty: placement.START_DIFFICULTY,
      mcAsked: 0, grammarAsked: 0, freeIdx: 0, startedAt: 0, qStartedAt: 0, result: null,
    };
    setState({ screen: "placement" });
  }

  function pushPlacementQuestion(q) {
    const p = state.placement;
    p.asked.push(q.id);
    p.answeredFor = null;      // Doppel-Tap-Schutz: pro Frage nur eine Antwort
    p.qStartedAt = Date.now();
  }

  function startPlacementTest() {
    const p = state.placement;
    if (!p) return;
    p.phase = "running"; p.asked = []; p.answers = [];
    p.difficulty = placement.START_DIFFICULTY; p.mcAsked = 0; p.grammarAsked = 0; p.freeIdx = 0;
    p.startedAt = Date.now();
    const first = placement.pickNextMc(placementQuestions(), [], p.difficulty, 0, placement.GRAMMAR_CAP);
    if (first) pushPlacementQuestion(first); else placementBeginFree();
    render();
  }

  // Eine Antwort verbuchen, Schwierigkeit anpassen (Treppe), nächste Frage wählen.
  function recordPlacementAnswer(ans) {
    const p = state.placement;
    if (!p || p.phase !== "running") return;
    const q = currentPlacementQ();
    if (!q) return;
    if (p.answeredFor === q.id) return; // gepufferter Doppel-Tap auf dieselbe Frage ignorieren
    p.answeredFor = q.id;
    const now = Date.now();
    ans.responseTimeMs = Math.max(0, now - (p.qStartedAt || now));
    p.answers.push(ans);
    const scored = placement.scoreAnswer(q, ans);
    if (q.type === "mc") {
      p.mcAsked += 1;
      if (placement.GRAMMAR_SKILLS[q.skill]) p.grammarAsked += 1;
      p.difficulty = placement.nextDifficulty(p.difficulty, scored.result); // richtig→schwerer, sonst leichter
    }
    placementAdvance();
  }

  function placementAdvance() {
    const p = state.placement;
    if (p.mcAsked < placement.MC_TARGET) {
      const nextQ = placement.pickNextMc(placementQuestions(), p.asked, p.difficulty, p.grammarAsked, placement.GRAMMAR_CAP);
      if (nextQ) { pushPlacementQuestion(nextQ); render(); return; }
    }
    placementBeginFree();
  }

  function placementBeginFree() {
    const p = state.placement;
    const frees = placement.freeQuestions(placementQuestions());
    if (p.freeIdx < frees.length) {
      pushPlacementQuestion(frees[p.freeIdx]);
      p.freeIdx += 1;
      render();
    } else {
      finishPlacement();
    }
  }

  function placementChoose(index) {
    const q = currentPlacementQ();
    if (!q || q.type === "free") return;
    recordPlacementAnswer({ isUnknown: false, selectedIndex: index });
  }
  function placementUnknown() {
    if (!state.placement || state.placement.phase !== "running") return;
    recordPlacementAnswer({ isUnknown: true, selectedIndex: null });
  }
  function placementSubmitFree() {
    const p = state.placement;
    if (!p || p.phase !== "running") return;
    const q = currentPlacementQ();
    if (!q || q.type !== "free") return;
    const el = document.getElementById("placement-free");
    const text = el ? String(el.value || "").trim() : "";
    if (!text) { placementUnknown(); return; } // leeres Feld zählt als „weiß nicht“
    recordPlacementAnswer({ isUnknown: false, text: text });
  }

  function finishPlacement() {
    const p = state.placement;
    if (!p) return;
    const asked = p.asked.map((id) => placement.questionById(id)).filter(Boolean);
    const result = placement.summarize(asked, p.answers);
    p.result = result;
    p.phase = "done";
    // Ergebnis lokal sichern (geräteweit, reist im Backup mit → Lehrer-Ansicht).
    // „placement" = letztes Ergebnis (Schnellzugriff), „placementHistory" = alle
    // Durchläufe für den Verlauf/Fortschritt im Profil (neueste zuletzt, gedeckelt).
    try {
      const now = new Date();
      const entry = {
        level: result.level,
        finalScore: Math.round(result.finalScore * 100) / 100,
        accuracy: Math.round(result.accuracy * 100) / 100,
        unknownRate: Math.round(result.unknownRate * 100) / 100,
        tempo: result.tempo,
        reliability: result.reliability || "",
        // Ausführliche Ergebnis-Details mitsichern, damit das Profil das volle
        // Ergebnis „wie nach dem Abschluss" dauerhaft zeigen kann.
        note: result.note || "",
        correct: result.correct, total: result.total,
        skills: placementResultView(result).skills,
        // Frage-für-Frage-Rückblick mitsichern, damit man die einzelnen Antworten
        // und Fehler auch später im Profil (nicht nur direkt nach dem Test) abrufen kann.
        review: placementReviewView(p),
        at: now.toISOString().slice(0, 10),
        ts: now.toISOString(),
      };
      const history = (Array.isArray(gamestats.placementHistory) ? gamestats.placementHistory : []).concat([entry]).slice(-50);
      gamestats = Object.assign({}, gamestats, { placement: entry, placementHistory: history });
      store.saveGameStats(gamestats);
      // Ruta-Check ist erledigt → die „noch offen"-Markierung fürs Dashboard löschen.
      if (settings.placementPending) {
        settings = Object.assign({}, settings, { placementPending: false });
        store.saveSettings(settings);
      }
    } catch (e) { /* Persistenz optional – nie crashen */ }
    render();
  }

  // VM für die drei Phasen (intro/running/done) – eine Render-Route „placement“.
  function placementVM() {
    const p = state.placement;
    if (!p) return { phase: "intro", fromOnboarding: false, total: placementTotalPlanned() };
    if (p.phase === "running") {
      const q = currentPlacementQ();
      const index = Math.max(0, p.asked.length - 1);
      return {
        phase: "running", fromOnboarding: !!p.fromOnboarding,
        index: index, total: placementTotalPlanned(),
        // erste 3 Fragen: sanften „lieber weiß-nicht als raten“-Hinweis zeigen.
        showHint: index < 3,
        q: q ? {
          id: q.id, type: q.type, level: q.level,
          promptDe: q.promptDe, questionEs: q.questionEs || null,
          options: q.type === "mc" ? q.options.slice() : null,
        } : null,
      };
    }
    if (p.phase === "done" && p.result) return Object.assign({ phase: "done", fromOnboarding: !!p.fromOnboarding, review: placementReviewView(p), shareFormat: shareFormat() }, placementResultView(p.result));
    return { phase: "intro", fromOnboarding: !!p.fromOnboarding, total: placementTotalPlanned() };
  }

  // Ergebnis in eine anzeigefertige Form bringen (Prozente, Skill-Zeilen, Notiz).
  function placementResultView(r) {
    const pct = (x) => Math.round((x || 0) * 100);
    const skillOrder = ["understanding", "reaction", "vocab", "conjugation", "tenses", "free"];
    const skills = skillOrder
      .filter((k) => r.skillBreakdown[k])
      .map((k) => ({ skill: k, accuracy: pct(r.skillBreakdown[k].accuracy), unknownRate: pct(r.skillBreakdown[k].unknownRate) }));
    return {
      level: r.level,
      scorePct: pct(r.finalScore),
      accuracyPct: pct(r.accuracy),
      unknownPct: pct(r.unknownRate),
      wrongPct: pct(r.wrongRate),
      correct: r.correct, total: r.total,
      tempo: r.tempo,
      note: r.note, // "" | "commStrong" | "grammarStrong"
      reliability: r.reliability, // "" | "fast" | "guessing" | "manyUnknown"
      skills,
    };
  }

  // Frage-für-Frage-Rückblick fürs Ergebnis: was wurde gewählt, was wäre richtig,
  // plus Erklärung. Die Korrektheit kommt aus scoreAnswer (akzent-/satzzeichen-
  // tolerant) – Akzent-Unterschiede gelten also NICHT als Fehler.
  function placementReviewView(p) {
    const out = [];
    for (let i = 0; i < p.asked.length; i++) {
      const q = placement.questionById(p.asked[i]);
      if (!q) continue;
      const a = p.answers[i] || { isUnknown: true };
      const scored = placement.scoreAnswer(q, a);
      let yourText = null;
      if (!a.isUnknown) {
        if (q.type === "free") yourText = String(a.text || "").trim() || null;
        else if (typeof a.selectedIndex === "number" && q.options) yourText = q.options[a.selectedIndex] || null;
      }
      const correctText = q.type === "free"
        ? q.solutionEs || (q.accept && q.accept[0]) || ""
        : (q.options ? q.options[q.correctIndex] : "");
      out.push({
        status: a.isUnknown ? "unknown" : (scored.isCorrect ? "correct" : "wrong"),
        // typo: richtig gewertet, aber nur leicht verschrieben → freundlicher Hinweis.
        typo: !!scored.typo,
        promptDe: q.promptDe,
        questionEs: q.questionEs || null,
        yourText: yourText,
        correctText: correctText,
        explanationDe: q.explanationDe || "",
      });
    }
    return out;
  }

  // ----- HolaRuta Nivel-Test (ausführlicher, adaptiver Einstufungstest) -----
  // Gleicher Ablauf wie der kurze Ruta-Check, nur über sechs Stufen (A0–C1) und
  // mit mehr Fragen. Zwei Varianten: „standard“ und „extremo“ (länger + Hören).
  // Logik/Bewertung leben rein in assessment.js; hier nur Ablauf + Persistenz
  // (eigener Speicher: gamestats.assessment[History]).
  function assessmentVariant() { return (state.assessment && state.assessment.variant) || "standard"; }
  function assessmentConfig() { return assessment.variantConfig(assessmentVariant()); }
  // Katalog-Teilmenge der aktiven Variante (standard ohne Hören/extremo-Items).
  function assessmentQuestions() { return assessment ? assessment.forVariant(assessmentVariant()) : []; }

  function assessmentTotalPlanned(variant) {
    const cfg = assessment.variantConfig(variant || assessmentVariant());
    const pool = assessment.forVariant(variant || assessmentVariant());
    return cfg.choiceTarget + assessment.freeQuestions(pool).length;
  }
  // Audio-Variante nur anbieten, wenn der Browser Sprachausgabe kann.
  function assessmentAudioReady() { return !!(speech && speech.isSupported()); }

  function currentAssessmentQ() {
    const p = state.assessment;
    if (!p || !p.asked.length) return null;
    return assessment.questionById(p.asked[p.asked.length - 1]);
  }

  // Hör-Item beim Erscheinen automatisch vorlesen (passiert im Klick-Kontext der
  // vorigen Antwort -> von der Autoplay-Policy gedeckt). Auch der Replay-Knopf.
  function speakCurrentAssessment() {
    if (!speech || !speech.isSupported()) return;
    const q = currentAssessmentQ();
    if (q && q.type === "listen" && q.audioEs) speech.speak(q.audioEs, settings.speechRate);
  }

  function openAssessment() {
    dismissBadgeToast();
    if (!assessment) return; // Modul nicht geladen (Edition/Offline) -> nicht crashen
    // Läuft noch ein unabgeschlossener Test (z. B. nach versehentlichem Zurück
    // oder Reload)? Dann nahtlos fortsetzen statt von vorn zu beginnen.
    if (resumeAssessment()) return;
    state.assessment = {
      phase: "intro", variant: "standard",
      asked: [], answers: [], difficulty: assessment.START_DIFFICULTY,
      mcAsked: 0, grammarAsked: 0, freeIdx: 0, startedAt: 0, qStartedAt: 0, result: null,
    };
    setState({ screen: "assessment" });
  }

  // Laufenden Test (gamestats.assessmentProgress) wiederaufnehmen. true, wenn
  // erfolgreich fortgesetzt; sonst false (nichts Gespeichertes / Katalog leer).
  function resumeAssessment() {
    const prog = liveAssessmentProgress();
    // Nichts (gültiges) zum Fortsetzen? Einen evtl. veralteten/ungültigen
    // Zwischenstand (anderswo abgeschlossen, Katalog geändert) gleich aufräumen.
    if (!prog) { clearAssessmentProgress(); return false; }
    state.assessment = {
      phase: "running",
      variant: prog.variant === "extremo" ? "extremo" : "standard",
      asked: prog.asked.slice(),
      answers: Array.isArray(prog.answers) ? prog.answers.slice() : [],
      difficulty: typeof prog.difficulty === "number" ? prog.difficulty : assessment.START_DIFFICULTY,
      mcAsked: prog.mcAsked || 0,
      grammarAsked: prog.grammarAsked || 0,
      freeIdx: prog.freeIdx || 0,
      startedAt: prog.startedAt || Date.now(),
      qStartedAt: Date.now(), // Timer der aktuellen Frage neu starten (Pause nicht mitzählen)
      answeredFor: null,
      result: null,
    };
    setState({ screen: "assessment" });
    speakCurrentAssessment(); // war die offene Frage ein Hör-Item, erneut vorlesen
    return true;
  }

  // Den laufenden Test persistent sichern (überlebt Zurück/Reload). Nur während
  // der „running“-Phase; Persistenz ist optional und darf nie crashen.
  function saveAssessmentProgress() {
    const p = state.assessment;
    if (!p || p.phase !== "running" || !p.asked.length) return;
    try {
      const snapshot = {
        variant: p.variant || "standard",
        asked: p.asked.slice(),
        answers: p.answers.slice(),
        difficulty: p.difficulty,
        mcAsked: p.mcAsked,
        grammarAsked: p.grammarAsked,
        freeIdx: p.freeIdx,
        startedAt: p.startedAt,
        savedAt: Date.now(),
      };
      gamestats = Object.assign({}, gamestats, { assessmentProgress: snapshot });
      store.saveGameStats(gamestats);
    } catch (e) { /* Persistenz optional – nie crashen */ }
  }
  function clearAssessmentProgress() {
    if (!gamestats.assessmentProgress) return;
    try {
      gamestats = Object.assign({}, gamestats, { assessmentProgress: null });
      store.saveGameStats(gamestats);
    } catch (e) { /* egal */ }
  }

  function pushAssessmentQuestion(q) {
    const p = state.assessment;
    p.asked.push(q.id);
    p.answeredFor = null;      // Doppel-Tap-Schutz: pro Frage nur eine Antwort
    p.qStartedAt = Date.now();
    saveAssessmentProgress();  // Fortschritt nach jeder neuen Frage sichern
  }

  function startAssessmentTest(variant) {
    const p = state.assessment;
    if (!p) return;
    // Extremo nur mit Sprachausgabe; sonst sauber auf standard zurückfallen.
    let v = variant === "extremo" ? "extremo" : "standard";
    if (v === "extremo" && !assessmentAudioReady()) v = "standard";
    p.variant = v;
    const cfg = assessmentConfig();
    p.phase = "running"; p.asked = []; p.answers = [];
    p.difficulty = cfg.startDifficulty; p.mcAsked = 0; p.grammarAsked = 0; p.freeIdx = 0;
    p.startedAt = Date.now();
    const first = assessment.pickNextMc(assessmentQuestions(), [], p.difficulty, 0, cfg.grammarCap);
    if (first) pushAssessmentQuestion(first); else assessmentBeginFree();
    render();
    speakCurrentAssessment(); // falls die erste Frage ein Hör-Item ist
  }

  function recordAssessmentAnswer(ans) {
    const p = state.assessment;
    if (!p || p.phase !== "running") return;
    const q = currentAssessmentQ();
    if (!q) return;
    if (p.answeredFor === q.id) return; // gepufferter Doppel-Tap auf dieselbe Frage ignorieren
    p.answeredFor = q.id;
    const now = Date.now();
    ans.responseTimeMs = Math.max(0, now - (p.qStartedAt || now));
    p.answers.push(ans);
    const scored = assessment.scoreAnswer(q, ans);
    if (q.type !== "free") { // Auswahl-Fragen (MC + Hören) steuern die Treppe
      p.mcAsked += 1;
      if (assessment.GRAMMAR_SKILLS[q.skill]) p.grammarAsked += 1;
      p.difficulty = assessment.nextDifficulty(p.difficulty, scored.result); // richtig→schwerer, sonst leichter
    }
    assessmentAdvance();
  }

  function assessmentAdvance() {
    const p = state.assessment;
    const cfg = assessmentConfig();
    if (p.mcAsked < cfg.choiceTarget) {
      const nextQ = assessment.pickNextMc(assessmentQuestions(), p.asked, p.difficulty, p.grammarAsked, cfg.grammarCap);
      if (nextQ) { pushAssessmentQuestion(nextQ); render(); speakCurrentAssessment(); return; }
    }
    assessmentBeginFree();
  }

  function assessmentBeginFree() {
    const p = state.assessment;
    const frees = assessment.freeQuestions(assessmentQuestions());
    if (p.freeIdx < frees.length) {
      // freeIdx VOR dem Sichern hochzählen: pushAssessmentQuestion speichert den
      // Fortschritt, und der gesicherte freeIdx muss auf die NÄCHSTE freie Frage
      // zeigen (sonst würde ein Resume die aktuelle Frage erneut stellen).
      const fq = frees[p.freeIdx];
      p.freeIdx += 1;
      pushAssessmentQuestion(fq);
      render();
    } else {
      finishAssessment();
    }
  }

  function assessmentChoose(index) {
    const q = currentAssessmentQ();
    if (!q || q.type === "free") return;
    recordAssessmentAnswer({ isUnknown: false, selectedIndex: index });
  }
  function assessmentUnknown() {
    if (!state.assessment || state.assessment.phase !== "running") return;
    recordAssessmentAnswer({ isUnknown: true, selectedIndex: null });
  }
  function assessmentSubmitFree() {
    const p = state.assessment;
    if (!p || p.phase !== "running") return;
    const q = currentAssessmentQ();
    if (!q || q.type !== "free") return;
    const el = document.getElementById("assessment-free");
    const text = el ? String(el.value || "").trim() : "";
    if (!text) { assessmentUnknown(); return; } // leeres Feld zählt als „weiß nicht“
    recordAssessmentAnswer({ isUnknown: false, text: text });
  }

  function finishAssessment() {
    const p = state.assessment;
    if (!p) return;
    const asked = p.asked.map((id) => assessment.questionById(id)).filter(Boolean);
    const result = assessment.summarize(asked, p.answers);
    p.result = result;
    p.phase = "done";
    try {
      const now = new Date();
      const entry = {
        level: result.level,
        variant: p.variant || "standard",
        finalScore: Math.round(result.finalScore * 100) / 100,
        accuracy: Math.round(result.accuracy * 100) / 100,
        unknownRate: Math.round(result.unknownRate * 100) / 100,
        tempo: result.tempo,
        reliability: result.reliability || "",
        // Ausführliche Ergebnis-Details mitsichern (Profil zeigt das volle Ergebnis).
        note: result.note || "",
        correct: result.correct, total: result.total,
        skills: assessmentResultView(result).skills,
        // Frage-für-Frage-Rückblick mitsichern (einzelne Antworten/Fehler im Profil).
        review: assessmentReviewView(p),
        at: now.toISOString().slice(0, 10),
        ts: now.toISOString(),
      };
      const history = (Array.isArray(gamestats.assessmentHistory) ? gamestats.assessmentHistory : []).concat([entry]).slice(-50);
      // Ergebnis sichern und den laufenden Fortschritt aufräumen (Test ist fertig).
      gamestats = Object.assign({}, gamestats, { assessment: entry, assessmentHistory: history, assessmentProgress: null });
      store.saveGameStats(gamestats);
    } catch (e) { /* Persistenz optional – nie crashen */ }
    render();
  }

  // VM für die drei Phasen (intro/running/done) – eine Render-Route „assessment“.
  function assessmentIntroVM() {
    return {
      phase: "intro",
      hasAudio: assessmentAudioReady(), // Extremo nur mit Sprachausgabe anbieten
      standardTotal: assessmentTotalPlanned("standard"),
      extremoTotal: assessmentTotalPlanned("extremo"),
    };
  }
  function assessmentVM() {
    const p = state.assessment;
    if (!p) return assessmentIntroVM();
    if (p.phase === "running") {
      const q = currentAssessmentQ();
      const index = Math.max(0, p.asked.length - 1);
      const section = q ? (q.type === "free" ? "free" : q.type === "listen" ? "listen" : "mc") : "mc";
      return {
        phase: "running", variant: p.variant,
        index: index, total: assessmentTotalPlanned(p.variant),
        section: section,
        showHint: index < 3,
        q: q ? {
          id: q.id, type: q.type, level: q.level,
          promptDe: q.promptDe,
          // Bei Hör-Items den spanischen Satz NICHT anzeigen (sonst kein Hörtest).
          questionEs: q.type === "listen" ? null : (q.questionEs || null),
          options: assessment.isChoice(q) ? q.options.slice() : null,
        } : null,
      };
    }
    if (p.phase === "done" && p.result) return Object.assign({ phase: "done", variant: p.variant, review: assessmentReviewView(p), shareFormat: shareFormat() }, assessmentResultView(p.result));
    return assessmentIntroVM();
  }

  function assessmentResultView(r) {
    const pct = (x) => Math.round((x || 0) * 100);
    const skillOrder = ["understanding", "reaction", "vocab", "reading", "listening", "conjugation", "tenses", "grammar", "free"];
    const skills = skillOrder
      .filter((k) => r.skillBreakdown[k])
      .map((k) => ({ skill: k, accuracy: pct(r.skillBreakdown[k].accuracy), unknownRate: pct(r.skillBreakdown[k].unknownRate) }));
    return {
      level: r.level,
      scorePct: pct(r.finalScore),
      accuracyPct: pct(r.accuracy),
      unknownPct: pct(r.unknownRate),
      wrongPct: pct(r.wrongRate),
      correct: r.correct, total: r.total,
      tempo: r.tempo,
      note: r.note,
      reliability: r.reliability,
      skills,
    };
  }

  function assessmentReviewView(p) {
    const out = [];
    for (let i = 0; i < p.asked.length; i++) {
      const q = assessment.questionById(p.asked[i]);
      if (!q) continue;
      const a = p.answers[i] || { isUnknown: true };
      const scored = assessment.scoreAnswer(q, a);
      let yourText = null;
      if (!a.isUnknown) {
        if (q.type === "free") yourText = String(a.text || "").trim() || null;
        else if (typeof a.selectedIndex === "number" && q.options) yourText = q.options[a.selectedIndex] || null;
      }
      const correctText = q.type === "free"
        ? q.solutionEs || (q.accept && q.accept[0]) || ""
        : (q.options ? q.options[q.correctIndex] : "");
      out.push({
        status: a.isUnknown ? "unknown" : (scored.isCorrect ? "correct" : "wrong"),
        promptDe: q.promptDe,
        // Im Rückblick den gehörten Satz (audioEs) sichtbar machen, sonst questionEs.
        questionEs: q.type === "listen" ? (q.audioEs || null) : (q.questionEs || null),
        listen: q.type === "listen",
        level: q.level,
        yourText: yourText,
        correctText: correctText,
        explanationDe: q.explanationDe || "",
      });
    }
    return out;
  }

  // Umdrehen ist beidseitig: nach dem Lösen kann die Karte wieder zurück auf die
  // Frage gedreht werden. Die Bewertungs-Leiste erscheint nur auf der Antwortseite.
  function flip() {
    state.revealed = !state.revealed;
    setContextOpen(false); // beim Drehen den Reise-Kontext schließen (Zustand + DOM)
    // In-Place-Klasse für die 3D-Animation (kein Voll-Re-Render).
    const flipEl = document.getElementById("flip");
    const controls = document.getElementById("controls");
    if (flipEl) {
      flipEl.classList.toggle("is-flipped", state.revealed);
      flipEl.setAttribute("aria-label", state.revealed ? t("app.cardFlipped") : t("app.cardFlip"));
    }
    if (controls) controls.toggleAttribute("hidden", !state.revealed);
  }

  // Reise-Kontext-Panel auf den gewünschten Zustand bringen: state.contextOpen ist
  // die Wahrheit, das DOM wird in-place nachgezogen (kein Voll-Re-Render – so bleibt
  // der Fokus auf dem 🧭-Button und im Schreiben-Modus geht nichts verloren). Der
  // Button (rund auf der Karte) und das Panel (darunter) haben verschiedene Eltern;
  // pro Screen existiert genau ein Panel, darum global per id auflösen.
  function setContextOpen(open) {
    state.contextOpen = !!open;
    const panel = document.getElementById("context-panel");
    const btn = document.querySelector("[data-action='toggle-context']");
    if (panel) panel.toggleAttribute("hidden", !open);
    if (btn) {
      btn.setAttribute("aria-expanded", String(!!open));
      btn.classList.toggle("is-open", !!open);
      if (btn.dataset.ctxText) btn.textContent = open ? t("app.contextHide") : t("app.contextShow");
    }
    return panel;
  }

  function toggleContext() {
    const panel = setContextOpen(!state.contextOpen);
    if (state.contextOpen && panel) {
      buzz(6);
      const id = state.screen === "card" ? state.cardId : state.queue[0];
      recordContextView(id, Date.now());
      // Panel sanft in den Blick holen (es sitzt unter der Karte / den Bewertungs-Buttons).
      try { panel.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) { /* egal */ }
    }
  }

  function submitTyped(input) {
    const card = cardById(state.queue[0]);
    if (!card) return;
    // Hör-Modus prüft immer gegen Spanisch (man tippt das Gehörte). Sonst nach
    // Richtung: ES→native erwartet die muttersprachliche Antwort, native→ES die spanische.
    const field = state.mode === "listen" ? "es" : (state.dir === "es2de" ? "native" : "es");
    state.typeResult = Object.assign({ input }, matcher.check(input, card, field));
    setState({ contextOpen: false });
  }

  // Kurzes Haptik-Feedback (nur wo unterstützt, z.B. Android-Chrome). Ignoriert sonst.
  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* egal */ }
  }

  function rate(rating) {
    const card = cardById(state.queue[0]);
    if (!card) return;
    buzz(rating === srs.RATING.AGAIN ? 30 : 12);

    // Pro Karte EINMAL für die Runden-Quote werten. AGAIN hängt die Karte hinten
    // wieder an; nur die ERSTE Wertung zählt, sonst inflationiert die Quote.
    if (state.session && !state.session.seen.has(card.id)) {
      state.session.seen.add(card.id);
      if (rating === srs.RATING.AGAIN) state.session.wrong++; else state.session.right++;
    }

    // SRS-Zustand neu berechnen und Statistik-Felder mitführen (immutabel).
    const now = Date.now();
    const prev = progress[card.id];
    const srsNext = srs.review(prev, rating, now);
    const merged = stats.record(prev, srsNext, rating, now);
    progress = Object.assign({}, progress, { [card.id]: merged });
    // Schlug das Speichern fehl (Quota voll/Private Mode), den Nutzer EINMAL
    // pro Session warnen – sonst verliert er still alles beim nächsten Reload.
    const saved = store.saveProgress(progress);

    // Spiel-Zähler buchen und frisch erreichte Badges freischalten/anzeigen.
    recordStudyEvent(rating, now);
    if (state.mode === "listen") recordListenReview();
    syncBadges(now, true);

    state.queue = state.queue.slice(1);
    if (rating === srs.RATING.AGAIN) state.queue = state.queue.concat(card.id);

    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    state.screen = state.queue.length ? "study" : "done";
    // Pre-Trip-Tag abgeschlossen (Queue leer durchgelaufen)? distinkt vermerken.
    if (!state.queue.length && state.pretripDay != null) recordPretripDay(state.pretripScope, state.pretripDay);
    // Runde fertig: XP gutschreiben & das Belohnungs-Ergebnis EINMAL festhalten,
    // bevor render() den Fertig-Screen (doneVM/mountCelebrate) baut.
    if (!state.queue.length && state.session) finishRound();
    render();
    if (!saved) notifySaveFailed(); // nach render(), sonst wischt der Re-Render den Toast weg
  }

  // Aktuelle Karte überspringen: ohne Bewertung aus dieser Sitzung nehmen (kein
  // SRS-/Statistik-Eingriff, die Karte bleibt fällig). So muss niemand jede Karte
  // durchziehen – Überspringen heißt schlicht „später nochmal", nicht „gewusst".
  function skip() {
    const card = cardById(state.queue[0]);
    if (!card) return;
    buzz(8);

    state.queue = state.queue.slice(1);
    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    state.screen = state.queue.length ? "study" : "done";
    // Bewusst KEIN recordPretripDay hier: Überspringen ist „später nochmal", kein
    // echter Abschluss. Eine Pre-Trip-Etappe gilt erst als geschafft, wenn alle
    // Karten bewertet wurden (Hook in rate()).
    // Endet die Runde aber hier (letzte Karte übersprungen), das Belohnungs-
    // Ergebnis dennoch festhalten: der Fertig-Screen zeigt die Quote der zuvor
    // beantworteten Karten, also auch die dafür verdienten XP. rate()/skip() für
    // die letzte Karte schließen sich aus -> kein Doppel-Buchen.
    if (!state.queue.length && state.session) finishRound();
    render();
  }

  // ----- Hinweis-Toast (gleiche Ebene/Optik wie die Badge-Einblendung) -----
  let saveFailedNotified = false; // Quota-Warnung höchstens einmal pro Session

  function showNotice(text) {
    const existing = root.querySelector(".btoast");
    if (existing) existing.remove();
    root.insertAdjacentHTML("afterbegin", ui.noticeToast(text));
  }

  function notifySaveFailed() {
    if (saveFailedNotified) return;
    saveFailedNotified = true;
    showNotice(t("app.saveFailed"));
  }

  function setMode(mode) {
    state.mode = mode;
    state.contextOpen = false;
    settings = Object.assign({}, settings, { mode });
    store.saveSettings(settings);
    render();
  }

  // Sprechgeschwindigkeit der TTS-Ausgabe wählen und merken. Eine kurze Hörprobe
  // macht die Wahl sofort erlebbar. speech.speak() deckelt den Wert selbst.
  const SPEECH_RATES = [0.75, 0.95, 1.2];
  function setSpeechRate(rate) {
    const r = SPEECH_RATES.indexOf(rate) >= 0 ? rate : 0.95;
    settings = Object.assign({}, settings, { speechRate: r });
    store.saveSettings(settings);
    render();
    if (speech && speech.isSupported()) speech.speak("¡Vamos!", r);
  }

  // ----- Dark Mode ("Nachts im Hostel-Bett") -----
  // settings.theme ist 'light' | 'dark' (gemerkte Wahl) – ohne Wahl folgt die App
  // der System-Vorliebe (prefers-color-scheme). Die <html data-theme>-Umschaltung
  // taucht die CSS-Tokens; ein früher Boot-Schnipsel in index.html verhindert
  // beim Start das Hell-Aufblitzen.
  const THEME_COLOR = { light: "#241510", dark: "#0E0907" };
  function effectiveTheme() {
    if (settings.theme === "dark" || settings.theme === "light") return settings.theme;
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch (e) { return "light"; }
  }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[theme] || THEME_COLOR.light);
  }
  // Hell/Dunkel direkt wählen (AM-Schild → hell, PM-Schild → dunkel). Tippt man die
  // bereits gewählte Seite, passiert nichts (kein blindes Umschalten mehr).
  function setTheme(theme) {
    const next = theme === "dark" ? "dark" : "light";
    if (settings.theme === next) return; // schon explizit gewählt
    settings = Object.assign({}, settings, { theme: next });
    store.saveSettings(settings);
    applyTheme(next);
    buzz(8);
    render();
  }

  // Reise-Namen aus dem Profil speichern. Getrimmt, Mehrfach-Leerzeichen zusammen-
  // gezogen, auf 40 Zeichen begrenzt. rerender:true (Knopf „Speichern") bestätigt
  // mit Haptik und zeichnet neu; ohne (Blur via change-Handler) wird nur still
  // gesichert, damit ein direkt danach getippter Knopf nicht durch ein Re-Render
  // verloren geht.
  function saveUserName(value, rerender) {
    const name = String(value || "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (name !== (settings.userName || "")) {
      settings = Object.assign({}, settings, { userName: name });
      store.saveSettings(settings);
    }
    if (rerender) { buzz(8); render(); }
  }

  // Geschlecht für die Anrede speichern (nur „female"/„male"; sonst ignorieren).
  // Wird in Onboarding UND Profil über dieselbe Aktion gesetzt.
  function saveUserGender(value) {
    const g = value === "female" || value === "male" ? value : "";
    if (!g) return;
    // Im Onboarding den bereits getippten Namen mitsichern, BEVOR das Re-Render das
    // Eingabefeld zurücksetzt (dort hat es – anders als im Profil – keinen Blur-Handler).
    const nameEl = document.getElementById("onboard-name");
    if (nameEl) saveUserName(nameEl.value, false);
    if (g !== settings.userGender) {
      settings = Object.assign({}, settings, { userGender: g });
      store.saveSettings(settings);
    }
    buzz(8);
    render();
  }

  // Anzahl der Erklär-Slides (aus ui.js, robuster Default falls nicht exportiert).
  function onboardSlideCount() {
    return (ui && ui.ONBOARD_SLIDE_COUNT) || 4;
  }

  // Intro-Slides verlassen und zum Profil-Schritt (Name + Geschlecht) wechseln.
  function onboardSlidesToProfile() {
    state.onboardStep = "profile";
    state.onboardSlide = 0;
    buzz(8);
    render();
  }

  // „Weiter" auf einem Erklär-Slide: zum nächsten Slide – oder vom letzten Slide
  // direkt in den Profil-Schritt.
  function advanceOnboardSlide() {
    const i = state.onboardSlide || 0;
    if (i >= onboardSlideCount() - 1) { onboardSlidesToProfile(); return; }
    state.onboardSlide = i + 1;
    buzz(8);
    render();
  }

  // Punkt-Navigation: direkt zu einem bestimmten Erklär-Slide springen.
  function goToOnboardSlide(idx) {
    const n = onboardSlideCount();
    const i = Math.max(0, Math.min(parseInt(idx, 10) || 0, n - 1));
    if (i === (state.onboardSlide || 0)) return;
    state.onboardSlide = i;
    buzz(8);
    render();
  }

  // Onboarding-Schritt 1 (Name + Geschlecht) abschließen. Beides ist Pflicht zum
  // Fortfahren: fehlt etwas, kurz hinweisen und auf dem Schritt bleiben.
  function advanceOnboardingProfile() {
    const el = document.getElementById("onboard-name");
    saveUserName(el ? el.value : "", false);
    if (!settings.userName || !settings.userGender) {
      showNotice(t("home.onboardProfileInvalid"));
      return;
    }
    state.onboardStep = "trip";
    buzz(8);
    render();
  }

  // UI-Sprache anwenden (ohne Persistenz): i18n umstellen + <html lang> setzen.
  // Wird beim Start UND bei jedem Wechsel aufgerufen (Single Source of Truth).
  function applyUiLang(l) {
    const next = l === "en" ? "en" : "de";
    state.uiLang = next;
    if (i18n) i18n.setLang(next);
    try { document.documentElement.lang = next; } catch (e) { /* egal */ }
  }

  // Belohnungs-Sound an/aus (SC.celebrate am Rundenende). Merken & neu rendern,
  // damit der aktive Segment-Button sofort umspringt.
  function setCelebrateSound(on) {
    settings = Object.assign({}, settings, { celebrateSound: !!on });
    store.saveSettings(settings);
    buzz(8);
    render();
  }

  // UI-/Muttersprache umschalten (de/en), merken und neu rendern.
  function setUiLang(l) {
    applyUiLang(l);
    settings = Object.assign({}, settings, { uiLang: state.uiLang });
    store.saveSettings(settings);
    invalidateSearchIndex(); // Titel/Untertitel & Gruppen hängen an der UI-Sprache
    render();
  }

  // Lernrichtung umschalten (native→ES / ES→native) und merken.
  function setDir(dir) {
    state.dir = dir === "es2de" ? "es2de" : "de2es";
    state.contextOpen = false;
    settings = Object.assign({}, settings, { dir: state.dir });
    store.saveSettings(settings);
    render();
  }

  // Stufen-Chip umschalten. level 0 = "Alle" -> Auswahl leeren.
  function toggleLevel(level) {
    if (level === 0) {
      state.levels = [];
    } else {
      const set = new Set(state.levels);
      set.has(level) ? set.delete(level) : set.add(level);
      state.levels = Array.from(set).sort((a, b) => a - b);
    }
    settings = Object.assign({}, settings, { levels: state.levels });
    store.saveSettings(settings);
    render();
  }

  // "Weiter mit …" auf der Startseite: gemerkte letzte Kategorie fortsetzen.
  function resumeLast() {
    if (settings.lastScope && categoryById(settings.lastScope)) startStudy(settings.lastScope);
  }

  // Start-Reiter wechseln (Lernen / Entdecken / Profil) und merken.
  function setTab(tab) {
    // „Tarea“/„Modo profe“ sind eigene Screens (nur in Editionen mit eigenem Reiter).
    if (tab === "tarea") { openTaskScreen(); return; }
    if (tab === "teacher") { openTeacher(); return; }
    // Reiter-Wechsel gilt nur für die laufende Sitzung – beim nächsten App-Start
    // hat der Start-Reiter wieder Vorrang, deshalb wird er nicht persistiert.
    // screen zurück auf "home" setzen, falls man vom Tarea-Screen einen Reiter tippt.
    state.screen = "home";
    setState({ homeTab: (tab === "lernen" || tab === "entdecken" || tab === "profil") ? tab : "start" });
  }

  function goHome() {
    dismissBadgeToast();
    state.screen = "home";
    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    state.pretripDay = null;   // eine abgebrochene Pre-Trip-Sitzung beim Verlassen lösen
    state.studyOrigin = null;  // Herkunft zurücksetzen (Dashboard ist Neustart)
    state.pretripLock = null;  // Aufgaben-Sperre lösen (frei wählbar im Entdecken-Plan)
    state.placement = null;    // Ruta-Check-Sitzung beim Verlassen lösen (kein hängender „done“-State)
    render();
  }

  // ----- Hostel Mode (Anwenden zu zweit) -----
  function openHostel() {
    dismissBadgeToast();
    setState({ screen: "hostel" });
  }

  function openBattleSetup() {
    dismissBadgeToast();
    // Spieler A mit dem Profil-Namen vorbelegen (Gerätebesitzer spielt meist A) –
    // aber nur, solange der Nutzer die Battle-Namensfelder noch NIE angefasst hat.
    // So bleibt ein bewusst geleertes Feld auch nach einem erneuten Öffnen leer.
    if (!state.battleNameEdited && !state.battleNames.A) {
      const n = profileName().slice(0, 14);
      if (n) state.battleNames = Object.assign({}, state.battleNames, { A: n });
    }
    setState({ screen: "battleSetup" });
  }

  // Coordinator-Schnellstart („5-Minuten-Icebreaker"): springt ohne Setup direkt
  // in eine kurze 6-Runden-Battle der Kennenlern-Szene („meet"). Für Reiseleiter,
  // Hostel-Personal oder Lehrkräfte, die der Gruppe in Sekunden eine Aktivität
  // geben wollen. Reuse des kompletten bestehenden Battle-Flows.
  function startCoordinatorRound() {
    startBattle(COORDINATOR_SCENE, COORDINATOR_ROUNDS);
  }

  // Vor dem Start gewählte Battle-Länge merken (nur Umschalten, kein Start).
  function setBattleLength(value) {
    setState({ battleLength: value });
  }

  // Spielernamen aus den Setup-Feldern lesen (vor dem Start) und merken.
  function readBattleNames() {
    const v = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
    const a = v("pname-a"), bb = v("pname-b");
    // Nur überschreiben, wenn die Felder gerendert waren (sonst State behalten).
    state.battleNames = { A: a || state.battleNames.A, B: bb || state.battleNames.B };
    return { A: state.battleNames.A, B: state.battleNames.B };
  }

  const battleLevel = (id) => { const b = battleById(id); return b && b.level ? b.level : 1; };

  // Aufgaben für ein Battle ziehen: bevorzugt noch nicht kürzlich gesehene
  // (kein sofortiges Wiederholen über mehrere Battles), Rest zufällig auffüllen.
  function pickBattleIds(poolIds, count, excludeIds) {
    const ex = {};
    (excludeIds || []).forEach((id) => { ex[id] = true; });
    let chosen = shuffle(poolIds.filter((id) => !ex[id])).slice(0, count);
    if (chosen.length < count) {
      const used = {};
      chosen.forEach((id) => { used[id] = true; });
      const rest = shuffle(poolIds.filter((id) => !used[id]));
      chosen = chosen.concat(rest.slice(0, count - chosen.length));
    }
    return chosen;
  }

  // Faire Verteilung: nach Schwierigkeit sortieren, dann je Runden-Paar (A,B)
  // die Reihenfolge zufällig drehen. So bekommen beide Spieler pro Paar etwa
  // gleich schwere Aufgaben und die Schwierigkeit steigert sich über das Battle.
  function balanceByLevel(ids) {
    const sorted = ids.slice().sort((x, y) => battleLevel(x) - battleLevel(y));
    for (let i = 0; i + 1 < sorted.length; i += 2) {
      if (Math.random() < 0.5) { const t = sorted[i]; sorted[i] = sorted[i + 1]; sorted[i + 1] = t; }
    }
    return sorted;
  }

  // Battle starten: Aufgaben der Szene (oder alle) ziehen, begrenzt auf die gewählte Länge.
  function startBattle(sceneId, lengthOverride) {
    dismissBadgeToast();
    const pool = data.BATTLES.filter((b) => sceneId === "all" || b.scene === sceneId);
    if (!pool.length) return;
    const poolIds = pool.map((b) => b.id);
    // Gerade Rundenzahl, damit beide Spieler gleich oft dran sind (A,B,A,B…).
    // lengthOverride erlaubt einen Direktstart ohne Setup (Coordinator-Runde),
    // ohne die im Setup gewählte Länge (state.battleLength) zu überschreiben.
    const rounds = evenRounds(Math.min(lengthOverride || state.battleLength, poolIds.length));
    const queue = balanceByLevel(pickBattleIds(poolIds, rounds, state.battleSeen));
    rememberBattleSeen(queue, poolIds.length);
    state.battle = {
      sceneId,
      poolIds,               // ganzer Pool – für Stichrunden-Nachschlag
      queue,                 // genau die geplanten Runden, fair sortiert
      round: 1,
      totalRounds: rounds,
      current: "A",
      names: readBattleNames(),
      scores: { A: 0, B: 0 },
      behindA: false,         // war A irgendwann in Rückstand? (für "Comeback Kid")
      behindB: false,
      revealed: false,
      recorded: false,        // Ergebnis schon in die Zähler gebucht? (genau einmal)
      suddenDeath: false,     // läuft/lief eine Stichrunde?
      challenge: null,
    };
    setState({ screen: "battle" });
  }

  // Verwendete Ids merken (für den Wiederholungsschutz), Liste begrenzen.
  function rememberBattleSeen(ids, poolSize) {
    const cap = Math.max(poolSize - 2, ids.length); // immer etwas „frisches" übrig lassen
    state.battleSeen = state.battleSeen.concat(ids).slice(-cap);
  }

  function battleReveal() {
    if (!state.battle) return;
    state.battle.revealed = true;
    render();
  }

  // Mitspieler bewertet (2/1/0). Danach nächste Runde oder Auswertung.
  function battleScore(points) {
    const b = state.battle;
    if (!b || !b.revealed) return;
    buzz(points >= 2 ? 12 : 8);
    b.scores[b.current] += points;
    // Rückstand-Marken laufend mitführen (Basis für "Comeback Kid").
    if (b.scores.A < b.scores.B) b.behindA = true;
    if (b.scores.B < b.scores.A) b.behindB = true;
    if (b.round >= b.totalRounds) {
      // Real-Life-Challenge als Bonus – einmal ziehen, bleibt auch über Stichrunden.
      if (!b.challenge) {
        const list = data.CHALLENGES || [];
        b.challenge = list.length ? list[Math.floor(Math.random() * list.length)] : null;
      }
      // Ergebnis genau EINMAL buchen (am Ende der regulären Runden). Eine
      // Stichrunde kürt nur am Bildschirm einen Sieger und zählt nicht doppelt;
      // ein Unentschieden bleibt fürs Badge-System ein Unentschieden.
      if (!b.recorded) {
        recordBattleResult(b);
        b.recorded = true;
        syncBadges(Date.now(), true); // Battle-Badges freischalten + einblenden
      }
      state.screen = "battleDone";
    } else {
      b.round += 1;
      b.current = b.current === "A" ? "B" : "A";
      b.revealed = false;
    }
    render();
  }

  // Stichrunde bei Gleichstand: zwei zusätzliche Runden (A, B). Zieht zwei
  // möglichst neue Aufgaben nach, die noch nicht im Battle vorkamen.
  function battleSuddenDeath() {
    const b = state.battle;
    if (!b || b.scores.A !== b.scores.B) return;
    const extra = pickBattleIds(b.poolIds, 2, b.queue.concat(state.battleSeen));
    if (!extra.length) return;
    b.queue = b.queue.concat(extra);
    rememberBattleSeen(extra, b.poolIds.length);
    b.totalRounds += extra.length;
    b.round += 1;
    b.current = "A";
    b.revealed = false;
    b.suddenDeath = true;
    setState({ screen: "battle" });
  }

  function battleAgain() {
    dismissBadgeToast();
    state.battle = null;
    setState({ screen: "battleSetup" });
  }

  // Real-Life-Challenge auf dem Battle-Ende-Screen abhaken (Mutproben-Badges).
  function markChallengeDone(id) {
    recordChallengeDone(id);
    syncBadges(Date.now(), true);
    render();
  }

  function openRoleplaySetup() {
    dismissBadgeToast();
    setState({ screen: "roleplaySetup" });
  }

  function startRoleplay(id) {
    if (!roleplayById(id)) return;
    dismissBadgeToast();
    state.roleplayId = id;
    state.roleplaySwapped = false;
    recordRoleplaySeen(id);
    syncBadges(Date.now(), true); // Rollenspiel-Badges freischalten + einblenden
    setState({ screen: "roleplay" });
  }

  function roleplaySwap() {
    state.roleplaySwapped = !state.roleplaySwapped;
    render();
  }

  // ----- Spickzettel (Survival-Schnellzugriff, kein Lernen) -----
  // Kuratierte Überlebens-Bereiche: `pick` hebt die kritischsten Sätze an den
  // Anfang – auch quer zur Kategorie (z. B. "Hilfe!" steht in den Grundlagen,
  // gehört im Ernstfall aber nach ganz oben zu Notfall). Der Rest füllt sich
  // aus der Kategorie bis zum Cap auf, damit es mit der Datenbasis mitwächst.
  const SPICKZETTEL_GROUPS = [
    { cat: "notfall", limit: 10, pick: ["b17", "n01", "b18", "b19", "n08", "n10", "n11", "n14", "n06", "n15"] },
    { cat: "basics",  limit: 10, pick: ["b10", "b11", "b15", "b14", "b08", "b16", "b05", "b06"] },
    { cat: "rumbo",   limit: 6,  pick: ["b20", "dir20", "dir21", "dir23", "dir26"] },
    { cat: "dinero",  limit: 6,  pick: ["d01", "d04", "d05", "d06", "d07"] },
  ];

  function spickzettelVM() {
    const used = new Set(); // jede Karte höchstens einmal auf dem Zettel
    const groups = SPICKZETTEL_GROUPS.map((g) => {
      const cat = categoryById(g.cat);
      const picked = (g.pick || []).map(cardById).filter(Boolean);
      const rest = data.CARDS.filter((c) => c.cat === g.cat);
      const cards = [];
      for (const c of picked.concat(rest)) {
        if (cards.length >= g.limit) break;
        if (used.has(c.id)) continue;
        used.add(c.id);
        cards.push({ id: c.id, de: nat(c), es: c.es, tip: c.tip || null, fav: isFavorite(c.id) });
      }
      return {
        id: g.cat,
        label: cat ? natk(cat, "label") : g.cat,
        icon: cat ? cat.icon : "📌",
        grad: cat ? cat.grad : DEFAULT_ACCENT,
        cards,
      };
    }).filter((g) => g.cards.length);
    // Großanzeige: angetippter Satz bildschirmfüllend – zum Herzeigen.
    const shown = state.szShow ? cardById(state.szShow) : null;
    const show = shown ? { id: shown.id, de: shown.de, es: shown.es } : null;
    return { groups, show, speakable: !!(speech && speech.isSupported()) };
  }

  function openSpickzettel() {
    dismissBadgeToast();
    state.screen = "spickzettel";
    setState({ szShow: null });
  }

  // Großanzeige öffnen/schließen (Satz bildschirmfüllend zum Herzeigen).
  function szShow(id) {
    if (!cardById(id)) return;
    setState({ szShow: id });
  }

  function szClose() {
    setState({ szShow: null });
  }

  // Eine beliebige Karte per Id vorlesen (Spickzettel / Listen außerhalb der
  // Lern-Sitzung). Erste akzeptierte Variante, damit "/"-Alternativen sauber klingen.
  function speakCardId(id) {
    if (!speech) return;
    const card = cardById(id);
    if (!card) return;
    speech.speak(matcher.acceptedAnswers(card)[0] || card.es, settings.speechRate);
  }

  // ----- Favoriten ("Mi léxico" – persönliches Lexikon) -----
  // Vom Nutzer gemerkte Wörter/Sätze, die individuell wichtig sind oder in
  // Stresssituationen schnell griffbereit sein sollen. Karten-Favoriten verweisen
  // per Id auf die Karte (und werden live + in der UI-Sprache aufgelöst); zusätzlich
  // liegt ein Schnappschuss (de/es/tip) im Speicher, damit der Eintrag eine später
  // gelöschte Karte überlebt. Eigene Einträge (vom Nutzer getippt) haben eine
  // "fav-…"-Id und leben nur aus dem Schnappschuss.
  let favorites = store.loadFavorites();        // [{ id, de, es, tip, cat, addedAt }]
  let favIds = new Set(favorites.map((f) => f.id));
  let favMsg = null;                            // { type:"ok"|"error", text } | null

  function isFavorite(id) { return favIds.has(id); }

  function persistFavorites() {
    store.saveFavorites(favorites);
    favIds = new Set(favorites.map((f) => f.id));
  }

  // Schnappschuss aus einer Karte (muttersprachlich aufgelöst) – als Rückfall, falls
  // die Karte später verschwindet.
  function favEntryFromCard(card) {
    return {
      id: card.id,
      de: nat(card) || card.de || "",
      es: card.es || "",
      tip: card.tip || "",
      cat: card.cat || "",
      addedAt: new Date().toISOString(),
    };
  }

  // Sichtbare Favoriten-Sterne einer Id IN-PLACE umschalten – ohne Voll-Re-Render.
  // Wichtig beim Lernen: ein render() würde im Schreiben-Modus den schon getippten
  // (noch nicht abgeschickten) Text wegwerfen und die 3D-Karte neu aufbauen. Wie der
  // 🔊-Knopf (speakCurrent) fasst der Stern darum nur sein eigenes Markup an.
  function updateFavStars(id, on) {
    const label = on ? t("favorites.remove") : t("favorites.add");
    const safe = (window.CSS && CSS.escape) ? CSS.escape(id) : String(id).replace(/["\\]/g, "\\$&");
    let nodes;
    try { nodes = document.querySelectorAll('[data-action="fav-toggle"][data-id="' + safe + '"]'); }
    catch (e) { nodes = []; }
    nodes.forEach((b) => {
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", label);
      b.setAttribute("title", label);
      // Beschrifteter Button (favLine unter der Karte): nur Stern + Text in den
      // gekapselten Spans tauschen, sonst würde der sichtbare Text verschwinden.
      const starEl = b.querySelector(".favline__star");
      if (starEl) {
        starEl.textContent = on ? "★" : "☆";
        const txtEl = b.querySelector(".favline__txt");
        if (txtEl) txtEl.textContent = on ? t("study.favSaved") : t("study.favSave");
      } else {
        b.textContent = on ? "★" : "☆";
      }
    });
  }

  // Karte (eingebaut/eigen) als Favorit an- oder abwählen. Neu hinzugefügte stehen
  // oben (neueste zuerst). Unbekannte Ids werden ignoriert. Aktualisiert die Sterne
  // in-place (kein Re-Render) – siehe updateFavStars.
  function toggleFavorite(id) {
    if (!id) return;
    let on;
    if (favIds.has(id)) {
      favorites = favorites.filter((f) => f.id !== id);
      on = false;
    } else {
      const card = cardById(id);
      if (!card) return;
      favorites = [favEntryFromCard(card)].concat(favorites);
      on = true;
    }
    persistFavorites();
    updateFavStars(id, on);
  }

  // Favorit entfernen (aus der Lexikon-Liste). Schließt ggf. die offene Großanzeige
  // und räumt eine evtl. noch sichtbare „hinzugefügt"-Bestätigung weg.
  function removeFavorite(id) {
    favorites = favorites.filter((f) => f.id !== id);
    persistFavorites();
    favMsg = null;
    if (state.favShow === id) state.favShow = null;
    render();
  }

  // Eigenen Eintrag (vom Nutzer getippt) ins Lexikon legen. de + es sind Pflicht.
  function addCustomFavorite(input) {
    const de = String(input.de || "").trim();
    const es = String(input.es || "").trim();
    const tip = String(input.tip || "").trim();
    if (!de || !es) {
      favMsg = { type: "error", text: t("favorites.errNeed") };
      render();
      return;
    }
    const id = "fav-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    favorites = [{
      id,
      de: de.slice(0, 500),
      es: es.slice(0, 500),
      tip: tip.slice(0, 500),
      cat: "",
      addedAt: new Date().toISOString(),
    }].concat(favorites);
    persistFavorites();
    favMsg = { type: "ok", text: t("favorites.added") };
    render();
  }

  function favoritesVM() {
    const items = favorites.map((f) => {
      // Karten-Favorit: live + in der UI-Sprache auflösen, solange die Karte existiert;
      // sonst den gespeicherten Schnappschuss zeigen (eigene Einträge immer Schnappschuss).
      const card = cardById(f.id);
      const cat = categoryById(card ? card.cat : f.cat);
      return {
        id: f.id,
        de: card ? (nat(card) || f.de) : f.de,
        es: card ? card.es : f.es,
        tip: card ? (card.tip || "") : (f.tip || ""),
        catIcon: cat ? cat.icon : "⭐",
        custom: !card,
      };
    });
    const shown = state.favShow ? items.find((it) => it.id === state.favShow) : null;
    return {
      items,
      count: items.length,
      show: shown || null,
      msg: favMsg,
      speakable: !!(speech && speech.isSupported()),
    };
  }

  function openFavorites() {
    dismissBadgeToast();
    favMsg = null;
    state.favShow = null;
    state.screen = "favorites";
    render();
  }

  // Großanzeige eines Favoriten öffnen/schließen (Eintrag bildschirmfüllend zum Herzeigen).
  function favShow(id) {
    if (!favIds.has(id)) return;
    state.favShow = id;
    render();
  }
  function favClose() {
    state.favShow = null;
    render();
  }

  // Favorit vorlesen: Karten-Favoriten wie gewohnt (akzeptierte Variante), eigene
  // Einträge direkt aus dem gespeicherten Spanisch-Text.
  function speakFavorite(id) {
    if (!speech) return;
    if (cardById(id)) { speakCardId(id); return; }
    const f = favorites.find((x) => x.id === id);
    if (f && f.es) speech.speak(f.es, settings.speechRate);
  }

  // ----- Precios al oído (Preis-Hörtrainer) -----
  // Beträge werden pro Runde frisch generiert (SC.numbers) statt aus den festen
  // Zahlen-Karten gezogen – so sind beliebig große und krumme Preise möglich
  // (kolumbianische Pesos in Millionenhöhe, chilenische/argentinische Beträge …).
  const PRECIOS_ROUND = 10;
  const preciosReady = () => !!(speech && speech.isSupported() && numbers);

  // Setup-Ansicht (Land/Währung + Schwierigkeit wählen).
  function preciosSetupVM() {
    const curKey = state.preciosCurrency;
    const lvl = state.preciosLevel;
    return {
      speakable: preciosReady(),
      currencies: numbers ? numbers.currencyList().map((c) => ({
        key: c.key, flag: c.flag, name: natk(c, "name"), code: c.code, note: natk(c, "note"),
        selected: c.key === curKey,
      })) : [],
      levels: numbers ? numbers.LEVELS.map((l) => ({
        id: l.id, short: l.short, label: natk(l, "label"), hint: natk(l, "hint"), active: l.id === lvl,
      })) : [],
      // Beispiel-Spanne der aktuellen Wahl (gibt eine Vorstellung der Größenordnung).
      sample: numbers ? (() => {
        const c = numbers.currency(curKey);
        const tier = numbers.tierFor(c, lvl);
        return { flag: c.flag, name: natk(c, "name"), max: numbers.format(tier.max), one: c.one, many: c.many };
      })() : null,
    };
  }

  function preciosVM() {
    const p = state.precios;
    const item = p.queue[p.idx] || {};
    const cur = numbers ? numbers.currency(p.currencyKey) : { flag: "💵", name: "", code: "" };
    return {
      position: p.idx,
      total: p.total,
      result: p.result, // null | { correct, input }
      answerEs: item.es || "",
      answerDigits: item.digits || "",
      flag: cur.flag,
      currencyName: natk(cur, "name"),
      currencyCode: cur.code,
      isLast: p.idx >= p.total - 1,
      speakable: preciosReady(),
    };
  }

  function preciosDoneVM() {
    const p = state.precios;
    const cur = numbers ? numbers.currency(p.currencyKey) : { flag: "💵", name: "" };
    const lvl = numbers ? (numbers.LEVELS.find((l) => l.id === p.level) || null) : null;
    return {
      correct: p.correct,
      total: p.total,
      perfect: p.total > 0 && p.correct === p.total,
      flag: cur.flag,
      currencyName: natk(cur, "name"),
      levelLabel: lvl ? natk(lvl, "label") : "",
      hard: p.level >= 3,
    };
  }

  // Einstieg: Setup-Ansicht zeigen (Land/Währung + Stufe). Ohne (unterstützte)
  // Sprachausgabe gibt es nichts zu hören – gleiches Gate wie im UI.
  function openPrecios() {
    dismissBadgeToast();
    if (!preciosReady()) return;
    setState({ screen: "preciosSetup" });
  }

  function setPreciosCurrency(key) {
    if (!numbers || !numbers.CURRENCIES[key]) return;
    state.preciosCurrency = key;
    settings = Object.assign({}, settings, { preciosCurrency: key });
    store.saveSettings(settings);
    render();
  }

  function setPreciosLevel(level) {
    const lvl = Number(level);
    if (![1, 2, 3].includes(lvl)) return;
    state.preciosLevel = lvl;
    settings = Object.assign({}, settings, { preciosLevel: lvl });
    store.saveSettings(settings);
    render();
  }

  // Runde mit den gewählten Einstellungen starten.
  function startPrecios() {
    if (!preciosReady()) return;
    const curKey = state.preciosCurrency;
    const level = state.preciosLevel;
    const queue = numbers.buildRound(curKey, level, PRECIOS_ROUND);
    state.precios = { currencyKey: curKey, level, queue, idx: 0, total: queue.length, result: null, correct: 0 };
    state.screen = "precios";
    render(); // maybeAutoSpeak spielt den ersten Betrag automatisch ab
  }

  // Getippte Ziffern rein numerisch gegen den Wert prüfen: alle Nicht-Ziffern
  // (Punkte, Leerzeichen, Währungszeichen) ignorieren – "1.250.000" == "1250000".
  function submitPrecios(input) {
    const p = state.precios;
    if (!p || p.result) return;
    const item = p.queue[p.idx];
    if (!item) return;
    const typed = String(input || "").replace(/\D/g, "");
    const correct = typed.length > 0 && parseInt(typed, 10) === item.value;
    p.result = { input, correct };
    if (correct) { p.correct += 1; buzz(12); } else buzz(8);
    render();
  }

  function nextPrecios() {
    const p = state.precios;
    if (!p || !p.result) return;
    if (p.idx >= p.total - 1) {
      recordPreciosResult(p);
      syncBadges(Date.now(), true);
      setState({ screen: "preciosDone" });
      return;
    }
    p.idx += 1;
    p.result = null;
    render();
  }

  // „Nochmal" auf der Ergebnis-Seite: gleiche Einstellungen, neue Beträge.
  function preciosAgain() {
    startPrecios();
  }

  function speakPrecios() {
    const p = state.precios;
    if (!p || !speech) return;
    const item = p.queue[p.idx];
    if (item) speech.speak(item.es, settings.speechRate);
  }

  // ----- Conjugador (generativer Konjugations-Drill) -----
  // Übt aktiv das Konjugieren statt nur die Erklärseite zu lesen: „ir – wir" →
  // tippe „vamos". Items werden pro Runde frisch aus data.CONJUGATION erzeugt
  // (SC.conjug). Stufe 1 = regelmäßige Muster, Stufe 2 = + unregelmäßige Verben.
  const CONJUG_ROUND = 10;
  const conjugReady = () => !!(conjug && data.CONJUGATION);
  const CONJUG_LEVELS = [
    { id: 1, short: "Regelmäßig", label: "Nur regelmäßige Muster", hint: "-ar · -er · -ir" },
    { id: 2, short: "Alle", label: "Mit unregelmäßigen Verben", hint: "+ ir, estar, tener …" },
  ];

  function conjugSetupVM() {
    return {
      available: conjugReady(),
      levels: CONJUG_LEVELS.map((l) => ({ ...l,
        short: t(`app.conjL${l.id}Short`), label: t(`app.conjL${l.id}Label`),
        active: l.id === state.conjugLevel })),
    };
  }

  function conjugVM() {
    const c = state.conjug;
    const item = c.queue[c.idx] || {};
    return {
      position: c.idx,
      total: c.total,
      result: c.result, // null | { correct, input, answer }
      verb: item.verb || "",
      verbHint: natk(item, "verbHint") || "",
      personEs: item.personEs || "",
      personDe: natk(item, "personDe") || "",
      isLast: c.idx >= c.total - 1,
    };
  }

  function conjugDoneVM() {
    const c = state.conjug;
    const lvl = CONJUG_LEVELS.find((l) => l.id === c.level) || null;
    return {
      correct: c.correct,
      total: c.total,
      perfect: c.total > 0 && c.correct === c.total,
      levelLabel: lvl ? t(`app.conjL${lvl.id}Label`) : "",
    };
  }

  function openConjugDrill() {
    dismissBadgeToast();
    if (!conjugReady()) return;
    setState({ screen: "conjugSetup" });
  }

  function setConjugLevel(level) {
    const lvl = Number(level);
    if (![1, 2].includes(lvl)) return;
    state.conjugLevel = lvl;
    settings = Object.assign({}, settings, { conjugLevel: lvl });
    store.saveSettings(settings);
    render();
  }

  function startConjug() {
    if (!conjugReady()) return;
    const level = state.conjugLevel;
    const queue = conjug.buildRound(data.CONJUGATION, level, CONJUG_ROUND);
    if (!queue.length) return;
    state.conjug = { level, queue, idx: 0, total: queue.length, result: null, correct: 0 };
    setState({ screen: "conjug" });
  }

  // Getippte Form akzentnachsichtig prüfen (matcher.normalize: á=a, ñ=n, ohne
  // Satzzeichen). So zählt „esta" für „está" – Reise-Tastaturen haben oft keine Akzente.
  function submitConjug(input) {
    const c = state.conjug;
    if (!c || c.result) return;
    const item = c.queue[c.idx];
    if (!item) return;
    const norm = matcher.normalize(input);
    const correct = norm.length > 0 && norm === matcher.normalize(item.answer);
    c.result = { input, correct, answer: item.answer };
    if (correct) { c.correct += 1; buzz(12); } else buzz(8);
    render();
  }

  function nextConjug() {
    const c = state.conjug;
    if (!c || !c.result) return;
    if (c.idx >= c.total - 1) {
      recordConjugResult(c);
      syncBadges(Date.now(), true);
      setState({ screen: "conjugDone" });
      return;
    }
    c.idx += 1;
    c.result = null;
    render();
  }

  function conjugAgain() {
    startConjug();
  }

  // Ergebnis einer beendeten Konjugations-Runde in die Spiel-Zähler buchen.
  function recordConjugResult(c) {
    if (!badges) return;
    const g = Object.assign({}, gamestats);
    g.conjugPlayed = (g.conjugPlayed || 0) + 1;
    if (c.total > 0 && c.correct === c.total) g.conjugPerfect = (g.conjugPerfect || 0) + 1;
    gamestats = g;
    store.saveGameStats(gamestats);
  }

  // ----- „¿Y esto?“ (Bild-Vokabel-Modus mit 3-2-1-Countdown) -----
  // Ein Motiv (Emoji) erscheint groß, ein kurzer Countdown läuft – „Wie heißt
  // das auf Spanisch?“ – dann wird das spanische Wort + Übersetzung aufgelöst und
  // man bewertet sich selbst („Wusste ich“/„Noch nicht“). Motive kommen pro Runde
  // frisch gemischt aus SC.yesto (kein Foto -> bleibt offline & zero-dependency).
  const YESTO_ROUND = 8;      // Motive pro Runde (jedes Thema hat ≥ 8)
  const YESTO_COUNT_FROM = 3; // Start des Countdowns (3 → 2 → 1 → Auflösung)
  let yestoTimer = null;      // genau ein pendelnder Countdown-Tick zur Zeit
  const yestoReady = () => !!(yesto && yesto.THEMES && yesto.THEMES.length);

  // Themen-Label in der aktiven UI-Sprache (label/labelEn via nativeText).
  function natTheme(th) { return i18n.nativeText({ de: th.label, en: th.labelEn }); }

  function yestoSetupVM() {
    return {
      available: yestoReady(),
      themes: yestoReady() ? yesto.themeList().map((th) => ({
        id: th.id, icon: th.icon, label: natTheme(th), count: th.count,
      })) : [],
    };
  }

  function yestoVM() {
    const y = state.yesto;
    const item = (y && y.queue[y.idx]) || {};
    return {
      position: y ? y.idx : 0,
      total: y ? y.total : 0,
      phase: y ? y.phase : "count",
      count: y ? y.count : 0,
      emoji: item.emoji || "",
      es: item.es || "",
      native: i18n.nativeText({ de: item.de, en: item.en }) || "",
      isLast: y ? y.idx >= y.total - 1 : true,
    };
  }

  function yestoDoneVM() {
    const y = state.yesto || {};
    const th = yestoReady() ? yesto.themeById(y.themeId) : null;
    return {
      correct: y.correct || 0,
      total: y.total || 0,
      themeLabel: th ? natTheme(th) : "",
    };
  }

  function openYesto() {
    dismissBadgeToast();
    yestoDisarm();
    if (!yestoReady()) return;
    setState({ screen: "yestoSetup" });
  }

  function startYesto(themeId) {
    if (!yestoReady()) return;
    const queue = yesto.buildRound(themeId, YESTO_ROUND);
    if (!queue.length) return;
    state.yesto = { themeId, queue, idx: 0, total: queue.length, phase: "count", count: YESTO_COUNT_FROM, correct: 0 };
    state.screen = "yesto";
    render(); // render() schaltet anschließend den ersten Countdown-Tick scharf
  }

  // Den nächsten Countdown-Tick scharf schalten (von render() bei screen==="yesto").
  function yestoArm() {
    yestoDisarm();
    const y = state.yesto;
    if (!y || y.phase !== "count" || y.count <= 0) return;
    yestoTimer = setTimeout(yestoTick, 1000);
  }
  function yestoDisarm() {
    if (yestoTimer) { clearTimeout(yestoTimer); yestoTimer = null; }
  }
  function yestoTick() {
    yestoTimer = null;
    const y = state.yesto;
    if (!y || state.screen !== "yesto" || y.phase !== "count") return;
    y.count -= 1;
    if (y.count <= 0) {
      // Auflösung: hier ändert sich die ganze Bühne (Wort + Bewerten) -> volles
      // render(); dessen Nach-Mount schaltet den Timer ab (Phase ist nicht mehr "count").
      y.phase = "reveal";
      buzz(10);
      render();
      return;
    }
    // Reiner Zähl-Tick: nur die Ziffer im DOM tauschen statt der ganze App-Neuaufbau.
    // So läuft kein render() pro Sekunde, das sonst Fokus (manageFocus) und Scroll
    // anfasst. Fehlt der Knoten ausnahmsweise, fällt es sicher auf render() zurück.
    const num = document.querySelector(".ye-count__num");
    if (num) num.textContent = String(y.count); else render();
    yestoArm(); // nächsten Tick scharf schalten (ohne render())
  }

  // Sofort auflösen (Countdown überspringen) – für Ungeduldige & Screenreader.
  function yestoReveal() {
    const y = state.yesto;
    if (!y || y.phase !== "count") return;
    yestoDisarm();
    y.phase = "reveal";
    buzz(10);
    render();
  }

  // Selbsteinschätzung nach der Auflösung -> nächstes Motiv / Runde beenden.
  function yestoRate(known) {
    const y = state.yesto;
    if (!y || y.phase !== "reveal") return;
    if (known) { y.correct += 1; buzz(12); } else buzz(8);
    if (y.idx >= y.total - 1) {
      recordYestoResult(y); // Zähler buchen, BEVOR die Badges ausgewertet werden
      syncBadges(Date.now(), true);
      yestoDisarm();
      setState({ screen: "yestoDone" });
      return;
    }
    y.idx += 1;
    y.phase = "count";
    y.count = YESTO_COUNT_FROM;
    render();
  }

  function yestoAgain() { startYesto(state.yesto ? state.yesto.themeId : null); }

  // Ergebnis einer beendeten ¿Y-esto?-Runde in die Spiel-Zähler buchen (Ruta-Pass).
  // „Perfekt" = bei jedem Bild „Wusste ich" getippt (correct === total).
  function recordYestoResult(y) {
    if (!badges) return;
    const g = Object.assign({}, gamestats);
    g.yestoPlayed = (g.yestoPlayed || 0) + 1;
    if (y.total > 0 && y.correct === y.total) g.yestoPerfect = (g.yestoPerfect || 0) + 1;
    gamestats = g;
    store.saveGameStats(gamestats);
  }

  // Ergebnis einer beendeten Preis-Hörrunde in die Spiel-Zähler buchen (Ruta-Pass).
  function recordPreciosResult(p) {
    if (!badges) return;
    const g = Object.assign({}, gamestats);
    g.preciosPlayed = (g.preciosPlayed || 0) + 1;
    if (p.total > 0 && p.correct === p.total) g.preciosPerfect = (g.preciosPerfect || 0) + 1;
    // Große-Beträge-Runde (Stufe 3) gemeistert: separat zählen (Badge „Millonario").
    if (p.level >= 3 && p.total > 0 && p.correct === p.total) g.preciosMillon = (g.preciosMillon || 0) + 1;
    gamestats = g;
    store.saveGameStats(gamestats);
  }

  // ----- Länderkunde (Infoseite) -----
  // ----- Suche (gezielt nach Karten/Übungen & Informationen suchen) -----
  // Eine flache Volltext-Suche über alle Inhalte: Vokabelkarten, Lern-Kategorien
  // und Übungs-Features ("Übungen") sowie Länderkunde, Reise-Knigge, Logística und
  // Salud ("Informationen"). Jeder Treffer trägt die schon bestehende data-action,
  // mit der die jeweilige Ansicht geöffnet wird – die Suche ist also nur ein
  // zweiter Einstieg, kein eigener Inhaltsspeicher.

  // Übungs-Features (spiegelt die FEATURES-Liste in ui.js, ohne die reinen
  // Infoseiten – die kommen unten als „Informationen" mit reichem Suchindex).
  const SEARCH_FEATURES = [
    { action: "open-favorites",   icon: "⭐", title: "Mi léxico",        subKey: "discover.subFavorites" },
    { action: "open-spickzettel", icon: "🆘", title: "Supervivencia",    subKey: "discover.subSupervivencia" },
    { action: "open-hostel",      icon: "🛏️", title: "Modo hostal",       subKey: "discover.subHostel" },
    { action: "open-quiz-setup",  icon: "🧩", title: "Definiciones",      subKey: "discover.subDefiniciones" },
    { action: "open-frases",      icon: "🧱", title: "Frases flexibles",  subKey: "discover.subFrases", need: "frases" },
    { action: "open-dialogos",    icon: "💬", title: "Diálogos",          subKey: "discover.subDialogos", need: "dialogos" },
    { action: "open-regatear",    icon: "🤝", title: "Regatear",          subKey: "discover.subRegatear", need: "regatear" },
    { action: "open-precios",     icon: "💵", title: "Precios al oído",   subKey: "discover.subPrecios", need: "speech" },
    { action: "open-cuerpo",      icon: "🧍", title: "El Cuerpo",         subKey: "discover.subCuerpo" },
    { action: "open-compras",     icon: "🛒", title: "Lista de compras",  subKey: "discover.subCompras" },
    { action: "open-yesto",       icon: "👀", title: "¿Y esto?",          subKey: "discover.subYesto", need: "yesto" },
    { action: "open-conjugacion", icon: "🔁", title: "Conjugación",       subKey: "discover.subConjugacion" },
    { action: "open-tiempos",     icon: "⏳", title: "Tiempos",           subKey: "discover.subTiempos" },
    { action: "open-bebidas",     icon: "☕", title: "Bebidas AM/PM",     subKey: "discover.subBebidas", need: "bebidas" },
  ];
  const searchHas = {
    countries: !!countries, speech: !!(speech && speech.isSupported()), frases: !!frases,
    dialogos: !!(dialogos && dialogos.DIALOGOS_SCENARIOS && dialogos.DIALOGOS_SCENARIOS.length),
    knigge: !!knigge, regatear: !!regatear, logistica: !!logistica, salud: !!salud,
    fotos: !!fotografia, flirt: !!flirt, bailar: !!bailar, musica: !!musica,
    bebidas: !!(bebidas && countries),
    yesto: !!(yesto && yesto.THEMES && yesto.THEMES.length),
  };

  // Such-Kern (normalisieren/indexieren/ranken) lebt als reines Modul in search.js.
  const searchEngine = window.SC.search || null;
  const searchHay = (parts) => (searchEngine ? searchEngine.haystack(parts) : "");

  // Index wird einmal aufgebaut und gemerkt; bei Sprachwechsel oder geänderten
  // eigenen Karten neu (siehe invalidateSearchIndex).
  let searchIndex = null;
  function invalidateSearchIndex() { searchIndex = null; }
  function getSearchIndex() {
    if (!searchIndex) searchIndex = buildSearchIndex();
    return searchIndex;
  }
  function buildSearchIndex() {
    const idx = [];

    // --- Übungen: Vokabelkarten (eigene inklusive) ---
    allCards().forEach((c) => {
      const cat = categoryById(c.cat);
      idx.push({
        group: "ex", kind: "card", kindLabel: t("search.kindCard"),
        icon: cat ? cat.icon : "🃏",
        title: c.es, titleLang: "es", sub: nat(c),
        action: "open-card", id: c.id, back: "search",
        hay: searchHay([c.es, c.de, c.en, c.tip, c.tipEn, cat && natk(cat, "label")]),
      });
    });

    // --- Übungen: Lern-Kategorien (ganze Themen-Decks) ---
    data.CATEGORIES.forEach((c) => {
      idx.push({
        group: "ex", kind: "category", kindLabel: t("search.kindCategory"),
        icon: c.icon, title: natk(c, "label"), sub: t("search.subCategory"),
        action: "open-category", id: c.id,
        hay: searchHay([c.label, c.labelEn, c.id]),
      });
    });

    // --- Übungen: Übungs-Features (nur die geladenen/verfügbaren) ---
    SEARCH_FEATURES.forEach((f) => {
      if (f.need && !searchHas[f.need]) return;
      idx.push({
        group: "ex", kind: "feature", kindLabel: t("search.kindFeature"),
        icon: f.icon, title: f.title, sub: t(f.subKey),
        action: f.action,
        hay: searchHay([f.title, t(f.subKey)]),
      });
    });

    // --- Informationen: Länderkunde (ein Treffer je Land) ---
    if (countries && Array.isArray(countries.LIST)) {
      countries.LIST.forEach((c) => {
        const words = (c.words || []).map((w) => [w.es, w.de, w.en]);
        idx.push({
          group: "info", kind: "country", kindLabel: t("search.kindCountry"),
          icon: c.flag || "🌎", title: natk(c, "name") || c.name, sub: natk(c, "tagline"),
          action: "search-country", id: c.id,
          hay: searchHay([c.name, c.nameEn, c.capital, c.region, c.tagline, c.taglineEn,
            c.about, c.aboutEn, c.history, c.historyEn, c.language, c.languageEn,
            c.population, c.populationEn, c.ageStructure, c.ageStructureEn,
            c.government, c.governmentEn, c.economy, c.economyEn, c.livelihood, c.livelihoodEn, words]),
        });
      });
    }

    // --- Informationen: Inhaltsseiten mit reichem Heuhaufen (ein Treffer je Seite,
    //     ein Stichwort aus irgendeinem Thema bringt die ganze Seite nach vorn) ---
    if (knigge && Array.isArray(knigge.TOPICS)) {
      const topics = knigge.TOPICS.map((tp) => [tp.title, tp.titleEn, tp.intro, tp.introEn,
        tp.dos, tp.dosEn, tp.donts, tp.dontsEn]);
      idx.push({
        group: "info", kind: "page", kindLabel: t("search.kindInfo"),
        icon: "🧭", title: "Etiqueta de viaje", sub: t("discover.subKnigge"),
        action: "open-knigge",
        hay: searchHay(["etiqueta knigge benehmen verhalten etiquette manners", topics]),
      });
    }
    const pageMod = (mod, icon, title, subKey, action) => {
      if (!mod) return;
      const topics = (mod.TOPICS || []).map((tp) => [tp.title, tp.titleEn, tp.intro, tp.introEn, tp.dos, tp.dosEn, tp.donts, tp.dontsEn, tp.es, (tp.vocab || []).map((v) => [v.es, v.de, v.en])]);
      const phrases = (mod.PHRASES || []).map((p) => [p.title, p.titleEn, (p.items || []).map((it) => [it.es, it.de, it.en])]);
      const gloss = (mod.GLOSSARY || []).map((g) => [g.es, g.de, g.en]);
      const checklist = (mod.CHECKLIST || []).map((c) => [c.item, c.itemEn, c.why, c.whyEn]);
      // Optionale Blöcke (z. B. Fotos: Teilen-Block + Foto-Apps) – andere Module
      // haben diese Felder nicht, dann bleiben sie leer.
      const sharing = mod.SHARING ? [mod.SHARING.intro, mod.SHARING.introEn, mod.SHARING.dos, mod.SHARING.dosEn, mod.SHARING.donts, mod.SHARING.dontsEn] : [];
      const apps = (mod.APPS || []).map((a) => [a.name, a.platform, a.desc, a.descEn, a.bullets, a.bulletsEn, a.url]);
      idx.push({
        group: "info", kind: "page", kindLabel: t("search.kindInfo"),
        icon: icon, title: title, sub: t(subKey),
        action: action,
        hay: searchHay([title, mod.INTRO, mod.INTRO_EN, topics, phrases, gloss, checklist, sharing, apps]),
      });
    };
    pageMod(logistica, "🧳", "Logística de viaje", "discover.subLogistica", "open-logistica");
    pageMod(salud, "🥗", "Salud y energía", "discover.subSalud", "open-salud");
    pageMod(fotografia, "📸", "Fotos y videos", "discover.subFotos", "open-fotos");
    pageMod(flirt, "💘", "Coqueteo y romance", "discover.subFlirt", "open-flirt");

    // Bailar (Tanzen): eigener Indexer, weil die Tänze als DANCES (Feld „name")
    // statt als TOPICS strukturiert sind. Ein Treffer je Tanz bringt die ganze
    // Seite nach vorn (Schritte, Tipps und Lesetext fließen in den Heuhaufen).
    if (bailar && Array.isArray(bailar.DANCES)) {
      const dances = bailar.DANCES.map((d) => [d.name, d.origin, d.originEn, d.intro, d.introEn,
        d.dos, d.dosEn, d.donts, d.dontsEn, d.es, (d.vocab || []).map((v) => [v.es, v.de, v.en])]);
      const phrases = (bailar.PHRASES || []).map((p) => [p.title, p.titleEn, (p.items || []).map((it) => [it.es, it.de, it.en])]);
      const gloss = (bailar.GLOSSARY || []).map((g) => [g.es, g.de, g.en]);
      idx.push({
        group: "info", kind: "page", kindLabel: t("search.kindInfo"),
        icon: "💃", title: "Bailar", sub: t("discover.subBailar"),
        action: "open-bailar",
        hay: searchHay(["bailar baile tanzen tanz dance salsa bachata merengue cumbia tango reggaeton",
          bailar.INTRO, bailar.INTRO_EN, dances, phrases, gloss]),
      });
    }

    // Música: eigene Form (GENRES + COUNTRY) statt TOPICS – darum ein eigener
    // Heuhaufen aus Genres (Name/Region/Beschreibung/Künstler/ES-Text), Sätzen,
    // Glossar und den Landes-Sounds. Ein Treffer bringt die ganze Seite nach vorn.
    if (musica) {
      const genres = (musica.GENRES || []).map((g) => [g.name, g.origin, g.originEn, g.desc, g.descEn, g.artists, g.es, (g.vocab || []).map((v) => [v.es, v.de, v.en])]);
      const phrases = (musica.PHRASES || []).map((p) => [p.title, p.titleEn, (p.items || []).map((it) => [it.es, it.de, it.en])]);
      const gloss = (musica.GLOSSARY || []).map((g) => [g.es, g.de, g.en]);
      const sounds = Object.keys(musica.COUNTRY || {}).map((k) => { const c = musica.COUNTRY[k]; return [c.genre, c.genreEn, c.artist, c.song]; });
      idx.push({
        group: "info", kind: "page", kindLabel: t("search.kindInfo"),
        icon: "🎵", title: "Música", sub: t("discover.subMusica"),
        action: "open-musica",
        hay: searchHay(["musica music musik canciones genero spotify apple cumbia salsa reggaeton tango mariachi", musica.INTRO, musica.INTRO_EN, genres, phrases, gloss, sounds]),
      });
    }

    // Historia (Süd- & Mittelamerika): je ein Treffer für die ganze Erklärseite
    // (Epochen, Protagonisten und aktuelle Spannungen fließen in den Heuhaufen).
    const histPage = (mod, icon, title, subKey, action, keywords) => {
      if (!mod) return;
      const eras = (mod.ERAS || []).map((e) => [e.title, e.titleEn, e.period, e.lead, e.leadEn, e.body, e.bodyEn, e.points, e.pointsEn]);
      const figs = (mod.FIGURES || []).map((f) => [f.name, f.role, f.roleEn, f.text, f.textEn]);
      const tens = (mod.TENSIONS || []).map((s) => [s.title, s.titleEn, s.where, s.whereEn, s.text, s.textEn]);
      const facts = (mod.FACTS || []).map((f) => [f.de, f.en]);
      idx.push({
        group: "info", kind: "page", kindLabel: t("search.kindInfo"),
        icon: icon, title: title, sub: t(subKey),
        action: action,
        hay: searchHay([keywords, mod.INTRO && mod.INTRO.de, mod.INTRO && mod.INTRO.en, eras, figs, tens, facts]),
      });
    };
    histPage(historia, "📜", "Historia de Sudamérica", "discover.subHistoria", "open-historia",
      "historia geschichte history bolivar bolívar san martin independencia unabhängigkeit inka inca conquista kolonialzeit");
    histPage(historiaCentro, "🌋", "Historia de Centroamérica", "discover.subHistoriaCentro", "open-historia-centro",
      "historia geschichte history mittelamerika centroamérica maya morazán sandino romero menchú independencia conquista bukele panama panamá kanal");

    return idx;
  }

  const SEARCH_GROUP_CAP = 60; // pro Gruppe deckeln – hält die Liste schlank
  function searchResultsData(query) {
    if (!searchEngine || !String(query || "").trim()) return { groups: [] };
    const ranked = searchEngine.rank(getSearchIndex(), query); // beste zuerst
    const groups = [];
    [["ex", t("search.groupExercises")], ["info", t("search.groupInfo")]].forEach(([gid, label]) => {
      const items = ranked.filter((it) => it.group === gid).slice(0, SEARCH_GROUP_CAP);
      if (items.length) groups.push({ id: gid, label, items });
    });
    return { groups };
  }

  function searchVM() {
    const q = state.searchQuery || "";
    const res = searchResultsData(q);
    return { query: q, groups: res.groups };
  }

  function openSearch() {
    dismissBadgeToast();
    setState({ screen: "search" });
  }

  // Live-Eingabe: nur die Trefferliste neu zeichnen, NICHT die ganze Seite – so
  // behält das Eingabefeld Fokus und Cursor (ein Voll-Re-Render würde sie verlieren).
  function updateSearchResults() {
    const box = document.getElementById("search-results");
    if (box) box.innerHTML = ui.searchResults(searchVM());
  }

  function clearSearch() {
    state.searchQuery = "";
    render(); // Voll-Re-Render: setzt das Feld zurück und fokussiert es neu
  }

  // Treffer „Land" öffnet die Länderkunde direkt beim gewählten Land.
  function openSearchCountry(id) {
    state.countryId = id;
    openInfo();
  }

  function openInfo() {
    dismissBadgeToast();
    setState({ screen: "info" });
  }

  function openHistoria(region) {
    dismissBadgeToast();
    state.histRegion = region === "centro" ? "centro" : "sur";
    loadModule(region === "centro" ? "historiaCentro" : "historia", () => setState({ screen: "historia" }));
  }

  function openKnigge() {
    dismissBadgeToast();
    setState({ screen: "knigge" });
  }

  function openBebidas() {
    dismissBadgeToast();
    setState({ screen: "bebidas" });
  }

  // AM/PM-Tafel umschalten. Beim ersten Tippen die aktuelle (uhrzeitbasierte)
  // Voreinstellung aus dem VM übernehmen, dann gegenteilig kippen.
  function toggleBebida() {
    const cur = state.bebMode || bebDefaultMode();
    setState({ bebMode: cur === "am" ? "pm" : "am" });
  }

  function openRegatear() {
    dismissBadgeToast();
    setState({ screen: "regatear" });
  }

  function openLogistica() {
    dismissBadgeToast();
    setState({ screen: "logistica" });
  }

  function openSalud() {
    dismissBadgeToast();
    setState({ screen: "salud" });
  }

  function openMusica() {
    dismissBadgeToast();
    loadModule("musica", () => setState({ screen: "musica" }));
  }

  function openFotos() {
    dismissBadgeToast();
    loadModule("fotografia", () => setState({ screen: "fotos" }));
  }

  function openFlirt() {
    dismissBadgeToast();
    loadModule("flirt", () => setState({ screen: "flirt" }));
  }

  function openBailar() {
    dismissBadgeToast();
    loadModule("bailar", () => setState({ screen: "bailar" }));
  }

  function selectCountry(id) {
    setState({ countryId: id });
  }

  // ----- Statistik-Navigation -----
  function goStats() {
    dismissBadgeToast();
    setState({ screen: "stats" });
  }

  function setStatsFilter(filter) {
    setState({ statsFilter: filter });
  }

  // confirm()-Wrapper: fehlt confirm (manche WebViews), ist die Antwort NEIN –
  // destruktive Aktionen dürfen nie ohne echte Rückfrage durchlaufen (R5).
  function confirmAsk(msg) {
    return typeof confirm === "function" ? confirm(msg) : false;
  }

  // Gesamten Lernfortschritt löschen (nach Rückfrage). Einstellungen bleiben erhalten.
  function resetProgress() {
    const ok = confirmAsk(t("app.confirmResetProgress"));
    if (!ok) return;
    store.resetProgress();
    progress = {};
    // Badges/Streak hängen am Lernfortschritt -> mit zurücksetzen (sonst inkonsistent).
    store.resetGameStats();
    gamestats = store.loadGameStats();
    state.statsFilter = "answered";
    goHome(); // räumt auch eine offene Badge-Einblendung weg
  }

  // Detailseite einer Karte öffnen. backTo merkt sich die Herkunft (Zurück-Knopf).
  function openCard(id, backTo) {
    dismissBadgeToast();
    state.cardId = id;
    state.backTo = backTo || "stats";
    state.contextOpen = false;
    setState({ screen: "card" });
  }

  // Genau diese eine Karte üben (von der Detailseite aus).
  function studyOne(id) {
    const card = cardById(id);
    if (!card) return;
    dismissBadgeToast();
    state.studyOrigin = null;  // Einzelkarten-Übung kommt aus dem Detail, nicht aus Pre-Trip/Tarea
    state.pretripDay = null;   // Einzelkarten-Übung ist kein Pre-Trip-Tag
    state.scopeId = card.cat;
    state.queue = [id];
    state.total = 1;
    beginRound();              // Session-Zähler/Snapshot für den Fertig-Screen frisch aufsetzen
    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    setState({ screen: "study" });
  }

  // ----- Eigene Karten (Editor) -----
  let editorMsg = null; // { type: "ok"|"error", text } | null – Rückmeldung nach dem Speichern

  function editorVM() {
    const cards = userCards ? userCards.list() : [];
    return {
      supported: !!userCards,
      categories: data.CATEGORIES.map((c) => ({ id: c.id, label: natk(c, "label"), icon: c.icon })),
      levels: data.LEVELS.map((l) => ({ id: l.id, label: natk(l, "label"), short: l.short })),
      msg: editorMsg,
      cards: cards.map((c) => {
        const cat = categoryById(c.cat);
        const lvl = levelById(c.lvl);
        return {
          id: c.id, de: c.de, es: c.es, tip: c.tip,
          catIcon: cat ? cat.icon : "🗂️",
          catLabel: cat ? natk(cat, "label") : c.cat,
          lvlShort: lvl ? lvl.short : "",
        };
      }),
    };
  }

  function openEditor() {
    dismissBadgeToast();
    editorMsg = null;
    setState({ screen: "editor" });
  }

  // „App installieren" (Android/Chromium): nativen Installations-Dialog zeigen.
  // Erfolg/Abbruch löst über den setOnChange-Callback in install.js ein Re-Render
  // aus (bei Erfolg verschwindet die Karte, weil die App dann standalone läuft).
  function installApp() {
    const inst = window.SC && window.SC.install;
    if (inst) inst.promptInstall();
  }

  function saveCard(input) {
    if (!userCards) return;
    const errs = userCards.validate(input);
    if (errs.length) {
      editorMsg = { type: "error", text: errs.join(" ") };
    } else {
      const card = userCards.add(input);
      editorMsg = { type: "ok", text: t("app.cardSaved", { de: card.de, es: card.es }) };
      buzz(12);
      invalidateSearchIndex(); // neue eigene Karte muss auffindbar werden
    }
    render();
  }

  function deleteCard(id) {
    if (!userCards) return;
    const ok = confirmAsk(t("app.confirmDeleteCard"));
    if (!ok) return;
    userCards.remove(id);
    // Lernfortschritt dieser Karte mit entfernen (verwaiste Einträge vermeiden).
    if (progress[id]) {
      const next = Object.assign({}, progress);
      delete next[id];
      progress = next;
      store.saveProgress(progress);
    }
    editorMsg = { type: "ok", text: t("app.cardDeleted") };
    invalidateSearchIndex(); // gelöschte Karte aus dem Suchindex nehmen
    render();
  }

  // ----- Daten-Backup: Export/Import (R4) -----
  // Export: alle spanischcard.*-Keys als JSON-Datei zum Herunterladen –
  // der einzige Ausweg, bevor iOS/Quota den localStorage räumt.
  function exportData() {
    const payload = store.exportData();
    let url = null;
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "holaruta-backup-" + dayKey(Date.now()) + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      buzz(8);
    } catch (e) {
      console.warn("Export fehlgeschlagen", e);
      showNotice(t("app.exportFailed"));
    }
    if (url) setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) { /* egal */ } }, 1000);
  }

  // Import: öffnet das versteckte file-input im Profil-Reiter.
  function startImport() {
    const input = document.getElementById("import-file");
    if (input) input.click();
  }

  // Gewählte Backup-Datei einlesen: Top-Level-Format prüfen, Rückfrage stellen,
  // nur bekannte spanischcard.*-Keys übernehmen (macht store.importData), dann
  // neu laden – der sauberste Weg, alle Module auf den importierten Stand zu bringen.
  function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let payload = null;
      try { payload = JSON.parse(String(reader.result)); } catch (e) { payload = null; }
      if (!payload || typeof payload !== "object" || !payload.data || typeof payload.data !== "object") {
        showNotice(t("app.importNotBackup"));
        return;
      }
      const ok = confirmAsk(t("app.confirmImport"));
      if (!ok) return;
      if (store.importData(payload) > 0) {
        try { location.reload(); } catch (e) { /* egal */ }
      } else {
        showNotice(t("app.importNoData"));
      }
    };
    reader.onerror = () => showNotice(t("app.importReadError"));
    reader.readAsText(file);
  }

  // ----- Optionale Cloud-Sync (Stufe 3, nur per Edition aktiv) -----
  // Pull → merge → lokal anwenden → push (sync.syncNow). Login passwortlos;
  // der Demo-Mock liefert direkt ein Token, der echte Flow schickt einen
  // Magic-Link. Ohne aktive Edition existiert dieser Pfad gar nicht (Nav-Eintrag
  // ist dann ausgeblendet).
  function cloudSync() {
    const sync = window.SC.sync;
    if (!(sync && sync.enabled())) return;
    const run = () => sync.syncNow().then((r) => {
      if (r && r.changedLocal) { showNotice(t("profile.cloudSynced")); try { location.reload(); } catch (e) { /* egal */ } }
      else showNotice(t("profile.cloudUpToDate"));
    }).catch(() => showNotice(t("profile.cloudFailed")));
    if (sync.loggedIn()) { run(); return; }
    let email = "";
    try { email = window.prompt(t("profile.cloudEmailPrompt")) || ""; } catch (e) { email = ""; }
    email = email.trim();
    if (!email) return;
    sync.login(email).then(() => {
      if (sync.loggedIn()) run();             // Mock: direkt eingeloggt
      else showNotice(t("profile.cloudCheckMail")); // echter Flow: Magic-Link/OTP
    }).catch(() => showNotice(t("profile.cloudFailed")));
  }

  // ----- Freunde & Tages-Rangliste (Stufe 3, opt-in, BACKEND.md §16) -----
  // Ohne aktive Edition (SC.config.social) existiert dieser Pfad gar nicht – der
  // Nav-Eintrag im Profil ist dann ausgeblendet. Der Server ist die source of
  // truth; der Client veröffentlicht nur seinen Tages-Snapshot und holt die Liste.
  function socialVM() {
    const social = window.SC.social;
    return {
      loggedIn: !!(social && social.loggedIn && social.loggedIn()),
      loading: !!state.social.loading,
      error: !!state.social.error,
      board: state.social.board,
      myCode: state.social.code || "",
    };
  }

  function openSocial() {
    const social = window.SC.social;
    if (!(social && social.enabled())) return;
    state.screen = "social";
    if (social.loggedIn()) refreshSocial();        // direkt frische Liste holen
    render();
  }

  // Eigenen Freundes-Code sicherstellen (einmal laden, dann gecacht). Wird VOR
  // dem Aktualisieren gebraucht, damit die eigene Zeile auch bei einem Server
  // OHNE `meId` zuverlässig markiert ist (sonst zeigte sie fälschlich „Entfernen").
  function ensureFriendCode() {
    if (state.social.code) return Promise.resolve(state.social.code);
    return window.SC.social.myCode().then((r) => {
      const code = (r && r.ok && r.body && r.body.code) || "";
      if (code) { state.social = Object.assign({}, state.social, { code: code }); if (state.screen === "social") render(); }
      return code;
    }).catch(() => "");
  }

  // Eigenen Tages-Snapshot veröffentlichen + Rangliste holen (social.refresh).
  function refreshSocial() {
    const social = window.SC.social;
    if (!(social && social.enabled() && social.loggedIn())) return;
    state.social = Object.assign({}, state.social, { loading: true, error: false });
    if (state.screen === "social") render();
    // Erst den eigenen Code (→ eigene Id) sichern, dann mit `meId` aktualisieren.
    ensureFriendCode().then((code) => {
      const self = social.parseFriendCode(code || "");
      return social.refresh(gamestats, { name: profileName(), meId: self ? self.id : undefined });
    }).then((r) => {
      state.social = Object.assign({}, state.social, { loading: false, error: false, board: (r && r.board) || null });
      if (state.screen === "social") render();
    }).catch(() => {
      state.social = Object.assign({}, state.social, { loading: false, error: true });
      if (state.screen === "social") render();
    });
  }

  // Passwortloser Login (geteilt mit Cloud-Sync): Mock loggt direkt ein, der
  // echte Flow schickt einen Magic-Link.
  function socialLogin() {
    const social = window.SC.social;
    if (!(social && social.enabled())) return;
    if (social.loggedIn()) { refreshSocial(); return; }
    let email = "";
    try { email = window.prompt(t("social.loginPrompt")) || ""; } catch (e) { email = ""; }
    email = email.trim();
    if (!email) return;
    social.login(email).then(() => {
      if (social.loggedIn()) { refreshSocial(); render(); }  // Mock: direkt eingeloggt
      else showNotice(t("social.loginCheckMail"));           // echter Flow: Magic-Link/OTP
    }).catch(() => showNotice(t("social.loginFailed")));
  }

  // Freund:in per Code hinzufügen. Vorab clientseitig validieren (klare Meldung
  // statt Server-Roundtrip bei offensichtlichem Müll).
  function socialAddFriend() {
    const social = window.SC.social;
    if (!(social && social.enabled() && social.loggedIn())) return;
    let code = "";
    try { code = window.prompt(t("social.addPrompt")) || ""; } catch (e) { code = ""; }
    code = code.trim();
    if (!code) return;
    if (!social.parseFriendCode(code)) { showNotice(t("social.addBadCode")); return; }
    social.addFriend(code).then((r) => {
      if (r && r.ok) { showNotice(t("social.addOk")); refreshSocial(); }
      else showNotice(t("social.addBadCode"));
    }).catch(() => showNotice(t("social.failed")));
  }

  function socialRemoveFriend(id) {
    const social = window.SC.social;
    if (!(social && social.enabled() && social.loggedIn()) || !id) return;
    if (!confirmAsk(t("social.removeConfirm"))) return;
    social.removeFriend(id).then(() => refreshSocial()).catch(() => showNotice(t("social.failed")));
  }

  function socialCopyCode() {
    const code = state.social.code || "";
    if (!code) return;
    const done = () => showNotice(t("social.codeCopied"));
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done).catch(() => {});
      else done();
    } catch (e) { /* egal */ }
  }

  // Spricht die spanische Antwort der aktuellen Karte vor.
  // Erste akzeptierte Variante (ohne "/"-Alternativen), damit es sauber klingt.
  function speakCurrent() {
    if (!speech) return;
    const card = cardById(state.queue[0]);
    if (!card) return;
    const primary = matcher.acceptedAnswers(card)[0] || card.es;
    speech.speak(primary, settings.speechRate);
  }

  // ----- Sharepic (teilbares Bild) -----
  // Gewähltes Bildformat: 'square' (1:1) | 'story' (9:16). In Einstellungen gemerkt.
  function shareFormat() {
    return settings.shareFormat === "story" ? "story" : "square";
  }

  function setShareFormat(fmt) {
    settings = Object.assign({}, settings, { shareFormat: fmt === "story" ? "story" : "square" });
    store.saveSettings(settings);
    render();
  }

  // Anzeige-Daten einer Karte als Sharepic-Nutzlast (eigene Kategorie-Farben/Stufe).
  function cardSharePayload(card) {
    const cat = categoryById(card.cat);
    const lvl = levelById(card.lvl);
    return {
      de: nat(card),
      es: card.es,
      tip: card.tip || null,
      catLabel: cat ? natk(cat, "label") : "",
      catIcon: cat ? cat.icon : "📚",
      accent: cat ? cat.grad : DEFAULT_ACCENT,
      levelLabel: lvl ? `${lvl.short} · ${natk(lvl, "label")}` : null,
    };
  }

  // Erzeugt aus dem aktuellen Lernfortschritt ein Bild und teilt/lädt es.
  function shareStats() {
    if (!share) return;
    const ov = stats.overview(allCards(), progress);
    buzz(12);
    share.shareImage("stats", {
      userName: profileName(),
      rate: ov.rate,
      mastered: ov.mastered,
      seenCards: ov.seenCards,
      total: ov.total,
      hard: ov.hard,
      learning: ov.learning,
      neu: ov.neu,
      firstTry: ov.firstTry,
    }, shareFormat());
  }

  // Teilt den eigenen Reise-Rang (XP/Viajero) als Sharepic. Quelle ist xpVM(),
  // also derselbe Stand wie im Rang-Banner – funktioniert aus der Statistik
  // heraus jederzeit, unabhängig von einer laufenden Runde.
  function shareRank() {
    if (!share) return;
    const xp = xpVM();
    buzz(12);
    share.shareImage("rank", {
      userName: profileName(),
      rankName: xp.rankName,
      xp: xp.xp,
      nextName: xp.nextName,
      xpToNext: xp.xpToNext,
      pct: xp.pct,
      rankN: xp.rankN,
    }, shareFormat());
  }

  // Teilt einen freigeschalteten Ruta-Pass-Stempel als Sharepic. Wertet die
  // Badges frisch aus, damit Name/Gruppe/Sammelstand stimmen, und teilt nur,
  // wenn der Stempel auch wirklich freigeschaltet ist.
  function shareBadge(id) {
    if (!share || !badges) return;
    const metrics = badges.buildMetrics(allCards(), progress, gamestats);
    const all = badges.evaluate(metrics, gamestats.unlocked);
    const b = all.find((x) => x.id === id);
    if (!b || !b.unlocked) return;
    const grp = (badges.GROUPS || []).find((g) => g.id === b.group);
    buzz(12);
    share.shareImage("badge", {
      userName: profileName(),
      icon: b.icon,
      name: b.name,
      text: b.unlockedText || b.description,
      groupLabel: grp ? grp.label : "",
      groupIcon: grp ? grp.icon : "🎖️",
      unlocked: all.filter((x) => x.unlocked).length,
      total: all.length,
    }, shareFormat());
  }

  // Teilt das letzte Ruta-Check-Ergebnis als Sharepic (Startlevel + Score + Tempo).
  // Quelle ist das gespeicherte letzte Ergebnis – funktioniert daher sowohl direkt
  // nach dem Test als auch später aus dem Profil.
  function sharePlacement() {
    if (!share) return;
    const r = gamestats.placement;
    if (!r) return;
    buzz(12);
    share.shareImage("placement", {
      userName: profileName(),
      level: r.level,
      scorePct: Math.round((r.finalScore || 0) * 100),
      accuracyPct: Math.round((r.accuracy || 0) * 100),
      tempoLabel: r.tempo ? t("placement.tempo_" + r.tempo) : "",
      moduleSlug: "ruta-check", // Begleittext-Link öffnet direkt den HolaRuta-Check
    }, shareFormat());
  }

  // Teilt das Nivel-Test-Ergebnis mit eigenem Sharepic (Motiv „assessment").
  function shareAssessment() {
    if (!share) return;
    const r = gamestats.assessment;
    if (!r) return;
    buzz(12);
    const variant = r.variant === "extremo" ? "extremo" : "standard";
    share.shareImage("assessment", {
      userName: profileName(),
      level: r.level,
      variantLabel: t("assessment.variant_" + variant),
      scorePct: Math.round((r.finalScore || 0) * 100),
      accuracyPct: Math.round((r.accuracy || 0) * 100),
      tempoLabel: r.tempo ? t("assessment.tempo_" + r.tempo) : "",
      moduleSlug: "nivel-test", // Begleittext-Link öffnet direkt den Nivel-Test
    }, shareFormat());
  }

  // Teilt die gerade sichtbare Karte – egal ob Detailseite oder Lern-Sitzung.
  function shareCard() {
    if (!share) return;
    let card = null;
    if (state.screen === "card") card = cardById(state.cardId);
    else if (state.screen === "study") card = cardById(state.queue[0]);
    if (!card) return;
    buzz(12);
    share.shareImage("card", cardSharePayload(card), shareFormat());
  }

  // Teilt einen Geschichts-Lesetext samt Wörterliste als Sharepic. Sucht den
  // Eintrag (Epoche, Protagonist oder Spannung) per id, lokalisiert ihn (de/en),
  // entfernt die *Markierungen* und reicht die „mitnehmen"-Vokabeln durch.
  function findHistItem(id) {
    const mod = histMod();
    if (!mod) return null;
    const lists = [mod.ERAS, mod.FIGURES, mod.TENSIONS];
    for (let i = 0; i < lists.length; i++) {
      const it = (lists[i] || []).find((x) => x.id === id);
      if (it) return it;
    }
    return null;
  }
  function shareHistoria(id) {
    if (!share) return;
    const raw = findHistItem(id);
    if (!raw) return;
    const e = loc(raw);
    const esText = (e.es || []).join("\n\n").replace(/\*/g, "");
    const words = (e.vocab || []).filter((v) => v.take).map((v) => ({ es: v.es, de: v.de }));
    buzz(12);
    share.shareImage("histtext", {
      title: e.title || e.name || (state.histRegion === "centro" ? "Historia de Centroamérica" : "Historia de Sudamérica"),
      levelCode: e.level || "",
      levelWord: e.level ? t("discover.histLvl" + e.level) : "",
      esText,
      words,
      moduleSlug: state.histRegion === "centro" ? "historia-centro" : "historia", // Link öffnet den Zeitstrahl direkt
    }, shareFormat());
  }

  // Sharepic auf Modul-Ebene: das ganze Modul „Historia de Sudamérica" als
  // Einladung (Modulname, Einleitung, Zeitstrahl-Teaser mit den Epochen) – zum
  // Weiterempfehlen des gesamten Moduls, nicht nur eines einzelnen Textes.
  function shareHistModule() {
    const mod = histMod();
    if (!share || !mod) return;
    const name = state.histRegion === "centro" ? "Historia de Centroamérica" : "Historia de Sudamérica";
    const eras = loc(mod.ERAS || []).map((e) => ({
      icon: e.icon || "•",
      period: e.period || "",
      title: e.title || "",
    }));
    buzz(12);
    share.shareImage("histmodule", {
      kicker: name,
      title: name,
      intro: nat(mod.INTRO),
      timelineLabel: t("discover.histNavTimeline"),
      eras,
      moduleSlug: state.histRegion === "centro" ? "historia-centro" : "historia",
    }, shareFormat());
  }

  // Sharepic für die übrigen Entdecken-Kategorien (Knigge, Regatear, Logística,
  // Salud): ein Thema mit seinen DOs/Don'ts als teilbares Bild „zum Versenden".
  // kicker/icon/accent passen zur jeweiligen Kategorie-Kachel (siehe FEATURES).
  const TIPS_META = {
    knigge:    { kicker: "Etiqueta de viaje", icon: "🧭", accent: ["#3F6B8E", "#6B4FA8"] },
    regatear:  { kicker: "Regatear",          icon: "🤝", accent: ["#B97C24", "#3F7355"] },
    logistica: { kicker: "Logística de viaje", icon: "🧳", accent: ["#2F6B70", "#B97C24"] },
    salud:     { kicker: "Salud y energía",   icon: "🥗", accent: ["#2F8E5B", "#76954E"] },
    fotos:     { kicker: "Fotos y videos",    icon: "📸", accent: ["#C25A45", "#5A4FA8"] },
    flirt:     { kicker: "Coqueteo y romance", icon: "💘", accent: ["#D24A77", "#B05AA8"] },
    bailar:    { kicker: "Bailar",            icon: "💃", accent: ["#C0392B", "#5A3FB8"] },
  };

  function shareTips(cat, idx) {
    if (!share) return;
    const src = cat === "knigge" ? (knigge && knigge.TOPICS)
              : cat === "regatear" ? (regatear && regatear.TIPS)
              : cat === "logistica" ? (logistica && logistica.TOPICS)
              : cat === "salud" ? (salud && salud.TOPICS)
              : cat === "fotos" ? (fotografia && fotografia.TOPICS)
              : cat === "flirt" ? (flirt && flirt.TOPICS)
              : cat === "bailar" ? (bailar && bailar.DANCES)
              : null;
    const meta = TIPS_META[cat];
    if (!src || !src[idx] || !meta) return;
    const o = loc(src[idx]); // …En-Felder für die aktive Sprache überlagern
    const lines = []
      .concat((o.dos || []).map((text) => ({ mark: "✅", text })))
      .concat((o.donts || []).map((text) => ({ mark: "🚫", text })));
    buzz(12);
    share.shareImage("tips", {
      kicker: meta.kicker,
      icon: meta.icon,
      title: o.title || o.name || meta.kicker,
      intro: o.intro || "",
      lines,
      accent: meta.accent,
      moduleSlug: cat, // Begleittext-Link öffnet direkt das passende Modul (?m=<cat>)
    }, shareFormat());
  }

  // Sharepic für die Länderkunde (Países y culturas): das aktuell gewählte Land
  // als kompakte Steckbrief-Karte (Hauptstadt, Kurzporträt, etwas lokaler Slang).
  function shareCountry() {
    if (!share || !countries) return;
    const list = countries.LIST || [];
    const c = loc(list.find((x) => x.id === state.countryId) || list[0]);
    if (!c) return;
    const lines = [];
    if (c.capital) lines.push({ mark: "🏛️", text: c.capital });
    if (c.about) lines.push({ mark: "🌎", text: c.about });
    (c.words || []).slice(0, 4).forEach((w) => lines.push({ mark: "🗣️", text: `${w.es} — ${w.de}` }));
    buzz(12);
    share.shareImage("tips", {
      kicker: "Países y culturas",
      icon: "🌎",
      title: `${c.flag || ""} ${c.name || ""}`.trim(),
      intro: c.tagline || "",
      lines,
      accent: ["#B97C24", "#C2502E"],
      moduleSlug: "paises", // Begleittext-Link öffnet direkt die Länderkunde
    }, shareFormat());
  }

  // Sharepic auf Modul-Ebene für ALLE Entdecken-Module: das ganze Modul als
  // Einladung weiterempfehlen (Motiv „module" = generische Modul-Karte: Icon,
  // Titel, Kurz-Intro, ein paar Highlight-Zeilen). Inhalt ist pro Modul
  // maßgeschneidert (echte Vokabel-Beispiele, Themen- oder Szenenlisten) – die
  // Optik teilt es sich mit den Reise-Tipps. Icon/Titel/Akzent spiegeln die
  // jeweilige Entdecken-Kachel (siehe FEATURES in ui.js); der Intro-Einzeiler
  // kommt aus dem Kachel-Untertitel (discover.sub…), damit DE/EN gepflegt sind.
  // Historia hat ein eigenes Motiv (shareHistModule) und ist hier nicht gelistet.
  const MODULE_SHARE = {
    "ruta-check":  { icon: "🎯", title: "HolaRuta-Check",      sub: "discover.subPlacement",     accent: ["#2E6E86", "#C2502E"] },
    "nivel-test":  { icon: "📋", title: "HolaRuta Nivel-Test", sub: "discover.subAssessment",    accent: ["#3F5BA8", "#2E6E86"] },
    supervivencia: { icon: "🆘", title: "Supervivencia",       sub: "discover.subSupervivencia", accent: ["#B5302A", "#CE463E"] },
    hostel:        { icon: "🛏️", title: "Modo hostal",         sub: "discover.subHostel",        accent: ["#C25A45", "#8E4FA8"] },
    definiciones:  { icon: "🧩", title: "Definiciones",         sub: "discover.subDefiniciones",  accent: ["#3F7355", "#2F6B70"] },
    frases:        { icon: "🧱", title: "Frases flexibles",     sub: "discover.subFrases",        accent: ["#7048E8", "#5A3FB8"] },
    dialogos:      { icon: "💬", title: "Diálogos",             sub: "discover.subDialogos",      accent: ["#9B5A8C", "#5A4FA8"] },
    regatear:      { icon: "🤝", title: "Regatear",             sub: "discover.subRegatear",      accent: ["#B97C24", "#3F7355"] },
    precios:       { icon: "💵", title: "Precios al oído",      sub: "discover.subPrecios",       accent: ["#5E7D3A", "#76954E"] },
    cuerpo:        { icon: "🧍", title: "El Cuerpo",            sub: "discover.subCuerpo",        accent: ["#2E6E86", "#7D4A8E"] },
    compras:       { icon: "🛒", title: "Lista de compras",     sub: "discover.subCompras",       accent: ["#3F7355", "#B97C24"] },
    yesto:         { icon: "👀", title: "¿Y esto?",              sub: "discover.subYesto",         accent: ["#C2502E", "#E9A23B"] },
    conjugacion:   { icon: "🔁", title: "Conjugación",          sub: "discover.subConjugacion",   accent: ["#4C5FA8", "#2B7A78"] },
    tiempos:       { icon: "⏳", title: "Tiempos",              sub: "discover.subTiempos",       accent: ["#3E7CA8", "#5A9BC4"] },
    paises:        { icon: "🌎", title: "Países y culturas",    sub: "discover.subInfo",          accent: ["#B97C24", "#C2502E"] },
    knigge:        { icon: "🧭", title: "Etiqueta de viaje",    sub: "discover.subKnigge",        accent: ["#3F6B8E", "#6B4FA8"] },
    logistica:     { icon: "🧳", title: "Logística de viaje",   sub: "discover.subLogistica",     accent: ["#2F6B70", "#B97C24"] },
    salud:         { icon: "🥗", title: "Salud y energía",      sub: "discover.subSalud",         accent: ["#2F8E5B", "#76954E"] },
    fotos:         { icon: "📸", title: "Fotos y videos",       sub: "discover.subFotos",         accent: ["#C25A45", "#5A4FA8"] },
    flirt:         { icon: "💘", title: "Coqueteo y romance",   sub: "discover.subFlirt",         accent: ["#D24A77", "#B05AA8"] },
    bailar:        { icon: "💃", title: "Bailar",               sub: "discover.subBailar",        accent: ["#C0392B", "#5A3FB8"] },
    musica:        { icon: "🎵", title: "Música",               sub: "discover.subMusica",        accent: ["#7A3FA8", "#C2502E"] },
  };

  // Bis zu n Lernkarten einer Kategorie als „es — de"-Zeilen (für Modul-Sharepics).
  function cardSampleLines(cat, n, mark) {
    return data.CARDS
      .filter((c) => c.cat === cat)
      .slice(0, n)
      .map((c) => ({ mark: mark || "🗣️", text: `${c.es} — ${nat(c)}` }));
  }

  // Pro Modul ein paar repräsentative Highlight-Zeilen aus den echten Modul-Daten
  // ziehen. Quelle ist jeweils derselbe View-Model-Builder, der auch den Screen
  // füllt – der Knopf erscheint nur im geöffneten Modul, dessen State steht also.
  function moduleShareLines(id) {
    const CAP = 6;
    const cut = (arr) => (arr || []).filter(Boolean).slice(0, CAP);
    switch (id) {
      case "ruta-check":
        // Der Check selbst hat keine Lernkarten – als Highlights dienen die drei
        // Einleitungspunkte, die auch im Intro stehen (was der Test misst).
        return [
          { mark: "🎯", text: t("placement.introB1") },
          { mark: "🔁", text: t("placement.introB2") },
          { mark: "⏱️", text: t("placement.introB3") },
        ];
      case "nivel-test":
        // Wie der Ruta-Check ohne Lernkarten – als Highlights dienen die vier
        // Einleitungspunkte des Nivel-Tests (Stufen, Inhalte, Adaptivität, Dauer).
        return [
          { mark: "📋", text: t("assessment.introB1") },
          { mark: "🗣️", text: t("assessment.introB2") },
          { mark: "🪜", text: t("assessment.introB3") },
          { mark: "⏱️", text: t("assessment.introB4") },
        ];
      case "supervivencia": {
        const out = [];
        spickzettelVM().groups.forEach((g) => {
          (g.cards || []).slice(0, 2).forEach((c) => out.push({ mark: g.icon || "🆘", text: `${c.es} — ${c.de}` }));
        });
        return cut(out);
      }
      case "hostel":
        return cut(battleSetupVM().scenes.map((s) => ({ mark: s.icon || "⚔️", text: s.label })));
      case "definiciones":
        return cut(quizSetupVM().sets.map((s) => ({ mark: s.icon || "🧩", text: s.label })));
      case "frases":
        return cut(frasesSetupVM().sets.map((s) => ({ mark: s.icon || "🧱", text: s.label })));
      case "dialogos":
        return cut(dialogosSetupVM().scenarios.map((s) => ({ mark: s.icon || "💬", text: s.title })));
      case "regatear":
        return cut((regatearVM().tips || []).map((tp) => ({ mark: tp.icon || "🤝", text: tp.title })));
      case "precios":
        return cut(preciosSetupVM().currencies.map((c) => ({ mark: c.flag || "💵", text: `${c.name} · ${c.code}` })));
      case "cuerpo":
        return cut((data.BODY_PARTS || []).map((p) => ({ mark: "🧍", text: `${p.es} — ${nat(p)}` })));
      case "compras":
        return cut(comprasVM().sections.map((s) => ({ mark: s.icon || "🛒", text: s.label })));
      case "yesto":
        // Repräsentative Motive je Thema (Emoji + „es — Übersetzung“).
        return cut((yesto ? yesto.THEMES : []).map((th) => {
          const it = th.items[0];
          return { mark: it ? it.emoji : th.icon, text: `${it ? it.es : th.label} — ${i18n.nativeText(it || {})}` };
        }));
      case "conjugacion":
        return cardSampleLines("verbos", CAP, "🔁");
      case "tiempos":
        return cardSampleLines("tiempos", CAP, "⏳");
      case "paises":
        return cut((countries ? countries.LIST : []).map((c) => loc(c)).map((c) => ({ mark: c.flag || "🌎", text: c.name })));
      case "knigge":
        return cut((kniggeVM().topics || []).map((tp) => ({ mark: tp.icon || "🧭", text: tp.title })));
      case "logistica":
        return cut((logisticaVM().topics || []).map((tp) => ({ mark: tp.icon || "🧳", text: tp.title })));
      case "salud":
        return cut((saludVM().topics || []).map((tp) => ({ mark: tp.icon || "🥗", text: tp.title })));
      case "fotos":
        return cut((fotosVM().topics || []).map((tp) => ({ mark: tp.icon || "📸", text: tp.title })));
      case "flirt":
        return cut((flirtVM().topics || []).map((tp) => ({ mark: tp.icon || "💘", text: tp.title })));
      case "bailar":
        return cut((bailarVM().dances || []).map((d) => ({ mark: d.icon || "💃", text: d.name })));
      case "musica":
        return cut((musicaVM().genres || []).map((g) => ({ mark: g.icon || "🎵", text: `${g.name} · ${g.origin}` })));
      default:
        return [];
    }
  }

  function shareModule(id) {
    const meta = MODULE_SHARE[id];
    if (!share || !meta) return;
    buzz(12);
    share.shareImage("module", {
      kicker: t("discover.moduleShareKicker"),
      icon: meta.icon,
      title: meta.title,
      intro: t(meta.sub),
      lines: moduleShareLines(id),
      accent: meta.accent,
      moduleSlug: id, // Begleittext-Link zeigt per ?m=<id> direkt in dieses Modul
    }, shareFormat());
  }

  // ----- Event-Verdrahtung (zentral, Delegation) -----
  // Eine verbrauchte Wischgeste erzeugt am Smartphone ~300 ms später einen
  // synthetischen Klick. Ohne Schutz würde dieser ggf. ein zweites rate() auslösen.
  let lastSwipeAt = 0;

  // Aktions-Dispatch-Tabelle: action-Name -> Handler(el). Ersetzt die fruehere
  // lange if/else-Kette in onClick(). Reihenfolge ohne Bedeutung (Lookup statt
  // Kette). Die DOM-naheen Sonderfaelle (hist-word, hist-quiz-answer, scroll-to)
  // bleiben bewusst direkt in onClick(), da sie e/preventDefault brauchen.
  const ACTIONS = {
    "set-mode": (el) => { setMode(el.dataset.mode); },
    "set-speech-rate": (el) => { setSpeechRate(Number(el.dataset.rate)); },
    "set-theme": (el) => { setTheme(el.dataset.theme); },
    "set-dir": (el) => { setDir(el.dataset.dir); },
    "set-celebrate-sound": (el) => { setCelebrateSound(el.dataset.on === "1"); },
    "set-ui-lang": (el) => { setUiLang(el.dataset.lang); },
    "set-level": (el) => { toggleLevel(Number(el.dataset.level)); },
    "study-all": (el) => { startStudy("all"); },
    "open-category": (el) => { startStudy(el.dataset.id); },
    "ruta-del-dia": (el) => { openRutaDelDia(); },
    "open-preset": (el) => { startPreset(el.dataset.preset); },
    "open-pretrip": (el) => { { state.pretripLock = null; openPretrip(); } },
    "set-pretrip-scope": (el) => { setPretripScope(el.dataset.scope); },
    "start-pretrip-day": (el) => { startPretripDay(Number(el.dataset.day)); },
    "open-teacher": (el) => { openTeacher(); },
    "teacher-import": (el) => { { const inp = document.getElementById("teacher-file"); if (inp) inp.click(); } },
    "teacher-remove": (el) => { removeTeacherStudent(Number(el.dataset.idx)); },
    "teacher-clear": (el) => { clearTeacher(); },
    "teacher-sort": (el) => { setTeacherSort(el.dataset.key); },
    "teacher-csv": (el) => { exportRosterCSV(); },
    "teacher-print": (el) => { printTeacher(); },
    "open-printsheet": (el) => { openPrintSheet(); },
    "printsheet-print": (el) => { printSheet(el.dataset.scope); },
    "sheet-mode": (el) => { { state.sheetMode = el.dataset.mode; render(); } },
    "sheet-check": () => { checkFillSheet(); },
    "sheet-reveal": () => { revealFillSheet(); },
    "sheet-reset": () => { resetFillSheet(); },
    "toggle-section": (el) => { { const ty = el.dataset.type; const skip = state.sheetSkip || (state.sheetSkip = []); const i = skip.indexOf(ty); if (i === -1) skip.push(ty); else skip.splice(i, 1); render(); } },
    "open-target-picker": (el) => { { state.targetPicker = el.dataset.ctx; render(); } },
    "close-target-picker": (el) => { { state.targetPicker = null; render(); } },
    "target-stop": (el) => { { /* Klick auf die Modal-Karte: nicht schließen */ } },
    "pick-target": (el) => { pickTarget(el.dataset.ctx, el.dataset.value); },
    "open-favorites": (el) => { openFavorites(); },
    "fav-toggle": (el) => { toggleFavorite(el.dataset.id); },
    "fav-remove": (el) => { removeFavorite(el.dataset.id); },
    "fav-show": (el) => { favShow(el.dataset.id); },
    "fav-close": (el) => { favClose(); },
    "fav-speak": (el) => { speakFavorite(el.dataset.id); },
    "apply-bundle": (el) => { toggleBundle(el.dataset.bundle); },
    "clear-task-sel": (el) => { clearTaskSelection(); },
    "task-generate": (el) => { generateTask(); },
    "task-copy": (el) => { copyTaskCode(); },
    "copy-phrase": (el) => { copyPhrase(el); },
    "task-copy-link": (el) => { copyTaskLink(); },
    "task-paste": (el) => { pasteTaskCode(); },
    "open-task": (el) => { openTaskScreen(); },
    "back-pretrip": (el) => { openPretrip(); },
    "back-task": (el) => { openTaskScreen(); },
    "task-open": (el) => { openTaskFromInput(); },
    "task-start": (el) => { startSubscribedTask(Number(el.dataset.idx)); },
    "task-remove": (el) => { removeSubscribedTask(Number(el.dataset.idx)); },
    "open-placement": (el) => { openPlacement(); },
    "placement-start": (el) => { startPlacementTest(); },
    "placement-choose": (el) => { placementChoose(Number(el.dataset.index)); },
    "placement-unknown": (el) => { placementUnknown(); },
    "placement-free-submit": (el) => { placementSubmitFree(); },
    "placement-retake": (el) => { openPlacement(state.placement && state.placement.fromOnboarding); },
    "open-assessment": (el) => { openAssessment(); },
    "assessment-resume": (el) => { resumeAssessment(); },
    "assessment-start": (el) => { startAssessmentTest(el.dataset.variant); },
    "assessment-choose": (el) => { assessmentChoose(Number(el.dataset.index)); },
    "assessment-unknown": (el) => { assessmentUnknown(); },
    "assessment-free-submit": (el) => { assessmentSubmitFree(); },
    "assessment-listen-play": (el) => { speakCurrentAssessment(); },
    "assessment-retake": (el) => { openAssessment(); },
    "trip-edit": (el) => { toggleTripEdit(); },
    "add-trip-stop": (el) => { addTripStop(el.dataset.country, el.dataset.dest, el.dataset.flag); },
    "remove-trip-stop": (el) => { removeTripStop(Number(el.dataset.index)); },
    "toggle-trip-route": (el) => { { state.tripRouteOpen = state.tripRouteOpen === false; render(); } },
    "toggle-trip-switch": (el) => { { state.tripSwitchOpen = !state.tripSwitchOpen; render(); } },
    "drag-trip-stop": (el) => { { /* Ziehen wird über die Pointer-Handler erledigt; ein reiner Tap macht nichts */ } },
    "trip-clear": (el) => { clearTripGoal(); },
    "manage-trip": (el) => { openTripManage(); },
    "set-gender": (el) => { saveUserGender(el.dataset.gender); }, // ♀/♂ (Onboarding + Profil)
    "onboard-slide-next": (el) => { advanceOnboardSlide(); }, // Erklär-Slide weiter (letzter -> Profil)
    "onboard-slide-skip": (el) => { onboardSlidesToProfile(); }, // Erklär-Slides überspringen -> Profil
    "onboard-slide-go": (el) => { goToOnboardSlide(el.dataset.idx); }, // Punkt-Navigation zu Slide N
    "skip-onboarding": (el) => { openPlacement(true); }, // Trip übersprungen -> trotzdem Ruta-Check anbieten
    "placement-skip": (el) => { finishOnboarding(); }, // Ruta-Check im Onboarding überspringen -> fertig
    "placement-finish": (el) => { finishOnboarding(); }, // Ruta-Check fertig (aus Onboarding) -> Dashboard
    "resume-last": (el) => { resumeLast(); },
    "set-tab": (el) => { setTab(el.dataset.tab); },
    "open-search": (el) => { openSearch(); },
    "search-clear": (el) => { clearSearch(); },
    "search-country": (el) => { openSearchCountry(el.dataset.id); },
    "flip": (el) => { flip(); },
    "toggle-context": (el) => { toggleContext(); },
    "rate": (el) => { rate(el.dataset.rating); },
    "skip": (el) => { skip(); },
    "speak": (el) => { speakCurrent(); },
    "open-stats": (el) => { goStats(); },
    "open-badges": (el) => { openBadges(); },
    "open-info": (el) => { openInfo(); },
    "open-historia": (el) => { openHistoria("sur"); },
    "open-historia-centro": (el) => { openHistoria("centro"); },
    "open-knigge": (el) => { openKnigge(); },
    "open-bebidas": (el) => { openBebidas(); },
    "toggle-bebida": (el) => { toggleBebida(); },
    "open-regatear": (el) => { openRegatear(); },
    "open-logistica": (el) => { openLogistica(); },
    "open-salud": (el) => { openSalud(); },
    "open-flirt": (el) => { openFlirt(); },
    "open-fotos": (el) => { openFotos(); },
    "open-bailar": (el) => { openBailar(); },
    "open-musica": (el) => { openMusica(); },
    "set-stats-filter": (el) => { setStatsFilter(el.dataset.filter); },
    "reset-progress": (el) => { resetProgress(); },
    "open-card": (el) => { openCard(el.dataset.id, el.dataset.back || "stats"); },
    "study-one": (el) => { studyOne(el.dataset.id); },
    "card-back": (el) => { (state.backTo === "home" ? goHome() : state.backTo === "search" ? openSearch() : goStats()); },
    "open-editor": (el) => { openEditor(); },
    "export-data": (el) => { exportData(); },
    "cloud-sync": (el) => { cloudSync(); },
    "open-social": (el) => { openSocial(); },
    "social-login": (el) => { socialLogin(); },
    "social-refresh": (el) => { refreshSocial(); },
    "social-add-friend": (el) => { socialAddFriend(); },
    "social-remove": (el) => { socialRemoveFriend(el.dataset.id); },
    "social-copy-code": (el) => { socialCopyCode(); },
    "import-data": (el) => { startImport(); },
    "dismiss-notice": (el) => { el.remove(); },
    "dismiss-update": (el) => { dismissUpdateNotice(); },
    "reload-app": (el) => { location.reload(); },
    "apply-update": (el) => { applyUpdate(); },
    "dismiss-sw-update": (el) => { dismissSwUpdate(); },
    "upd-stop": (el) => { { /* Klick auf die Hinweis-Karte: nicht schließen */ } },
    "install-app": (el) => { installApp(); },
    "delete-card": (el) => { deleteCard(el.dataset.id); },
    "share-stats": (el) => { shareStats(); },
    "share-rank": (el) => { shareRank(); },
    "share-placement": (el) => { sharePlacement(); },
    "share-assessment": (el) => { shareAssessment(); },
    "share-card": (el) => { shareCard(); },
    "share-historia": (el) => { shareHistoria(el.dataset.id); },
    "share-hist-module": (el) => { shareHistModule(); },
    "share-tips": (el) => { shareTips(el.dataset.cat, Number(el.dataset.idx)); },
    "share-country": (el) => { shareCountry(); },
    "share-module": (el) => { shareModule(el.dataset.mod); },
    "share-badge": (el) => { shareBadge(el.dataset.id); },
    "set-share-format": (el) => { setShareFormat(el.dataset.format); },
    "open-hostel": (el) => { openHostel(); },
    "open-battle-setup": (el) => { openBattleSetup(); },
    "coordinator-round": (el) => { startCoordinatorRound(); },
    "set-battle-length": (el) => { setBattleLength(Number(el.dataset.len)); },
    "start-battle": (el) => { startBattle(el.dataset.scene); },
    "battle-reveal": (el) => { battleReveal(); },
    "battle-score": (el) => { battleScore(Number(el.dataset.points)); },
    "battle-sudden-death": (el) => { battleSuddenDeath(); },
    "battle-again": (el) => { battleAgain(); },
    "challenge-done": (el) => { markChallengeDone(el.dataset.id); },
    "open-roleplay-setup": (el) => { openRoleplaySetup(); },
    "start-roleplay": (el) => { startRoleplay(el.dataset.id); },
    "roleplay-swap": (el) => { roleplaySwap(); },
    "open-quiz-setup": (el) => { openQuizSetup(); },
    "start-quiz": (el) => { startQuiz(el.dataset.set); },
    "quiz-answer": (el) => { answerQuiz(el.dataset.id); },
    "quiz-next": (el) => { nextQuiz(); },
    "quiz-again": (el) => { quizAgain(); },
    "open-cuerpo": (el) => { openCuerpo(); },
    "open-conjugacion": (el) => { openConjugacion(); },
    "open-tiempos": (el) => { openTiempos(); },
    "cuerpo-select": (el) => { { if (Date.now() - bpDragEndAt >= 350) selectBodyPart(el.dataset.id); } },
    "cuerpo-rotate": (el) => { rotateBody(Number(el.dataset.dir)); },
    "cuerpo-speak": (el) => { speakBodyPart(); },
    "open-spickzettel": (el) => { openSpickzettel(); },
    "sz-show": (el) => { szShow(el.dataset.id); },
    "sz-close": (el) => { szClose(); },
    "speak-card": (el) => { speakCardId(el.dataset.id); },
    "open-precios": (el) => { openPrecios(); },
    "precios-currency": (el) => { setPreciosCurrency(el.dataset.id); },
    "precios-level": (el) => { setPreciosLevel(el.dataset.level); },
    "start-precios": (el) => { startPrecios(); },
    "precios-next": (el) => { nextPrecios(); },
    "precios-again": (el) => { preciosAgain(); },
    "precios-setup": (el) => { openPrecios(); },
    "precios-speak": (el) => { speakPrecios(); },
    "open-frases": (el) => { openFrasesSetup(); },
    "start-frases": (el) => { startFrases(el.dataset.set); },
    "frases-answer": (el) => { answerFrases(Number(el.dataset.idx)); },
    "frases-next": (el) => { nextFrases(); },
    "frases-again": (el) => { frasesAgain(); },
    "open-conjug-drill": (el) => { openConjugDrill(); },
    "conjug-level": (el) => { setConjugLevel(el.dataset.level); },
    "start-conjug": (el) => { startConjug(); },
    "conjug-next": (el) => { nextConjug(); },
    "conjug-again": (el) => { conjugAgain(); },
    "open-yesto": (el) => { openYesto(); },
    "start-yesto": (el) => { startYesto(el.dataset.id); },
    "yesto-reveal": (el) => { yestoReveal(); },
    "yesto-rate": (el) => { yestoRate(el.dataset.known === "1"); },
    "yesto-again": (el) => { yestoAgain(); },
    "open-dialogos": (el) => { openDialogosSetup(); },
    "start-dialogos": (el) => { startDialogos(el.dataset.id); },
    "dialogos-answer": (el) => { answerDialogosMc(Number(el.dataset.idx)); },
    "dialogos-next": (el) => { advanceDialogos(); },
    "dialogos-hint": (el) => { dialogosHint(); },
    "dialogos-again": (el) => { dialogosAgain(); },
    "dialogos-speak": (el) => { speakDialogosNpc(); },
    "open-compras": (el) => { openCompras(); },
    "compras-section": (el) => { comprasSection(el.dataset.id); },
    "compras-pick": (el) => { comprasPick(el.dataset.id); },
    "compras-toggle": (el) => { comprasToggle(el.dataset.id); },
    "compras-speak": (el) => { speakCompras(el.dataset.id); },
    "compras-speak-phrase": (el) => { speakComprasPhrase(el.dataset.say); },
    "open-compras-quiz": (el) => { openComprasQuiz(); },
    "compras-quiz-answer": (el) => { answerComprasQuiz(Number(el.dataset.idx)); },
    "compras-quiz-next": (el) => { nextComprasQuiz(); },
    "compras-quiz-again": (el) => { comprasQuizAgain(); },
    "compras-back-list": (el) => { comprasBackToList(); },
    "home": (el) => { goHome(); },
  };

  function onClick(e) {
    if (Date.now() - lastSwipeAt < 600) return; // synthetischen Klick nach Wisch ignorieren
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;

    // Schwierigkeits-Wort im Lesetext: Übersetzungs-Popover umschalten – per
    // Klasse direkt im DOM (kein Re-Render, damit Scrollposition & offene
    // Akkordeons bleiben). Robust auf Mobil, wo :focus auf Buttons unzuverlässig
    // ist. Tippt man ein anderes Wort, schließt das vorige.
    if (action === "hist-word") {
      const open = el.classList.contains("is-open");
      const root = document.getElementById("app") || document;
      root.querySelectorAll(".hist-w.is-open").forEach((b) => b.classList.remove("is-open"));
      if (!open) el.classList.add("is-open");
      return;
    }

    // Quiz-Antwort im Lesetext: prüft direkt im DOM (kein Re-Render). Pro Frage
    // nur einmal; markiert die Wahl und deckt bei Fehler die richtige Antwort auf.
    if (action === "hist-quiz-answer") {
      const q = el.closest(".hist-quiz__q");
      if (!q || q.classList.contains("is-done")) return;
      q.classList.add("is-done");
      if (el.dataset.correct === "1") {
        el.classList.add("is-correct");
      } else {
        el.classList.add("is-wrong");
        const right = q.querySelector('.hist-quiz__opt[data-correct="1"]');
        if (right) right.classList.add("is-correct");
      }
      return;
    }

    // Sprungmarken-Leiste (Historia, Supervivencia …): sanft zum Abschnitt
    // scrollen, OHNE die URL-Raute zu ändern. Eine echte #-Navigation legt sonst
    // einen History-Eintrag an und kollidiert mit dem Zurück-Puffer (armBackGuard)
    // – die nächste Geste/der Klick würde dann eine Ebene höher springen statt zu
    // scrollen. preventDefault hält den nativen Anker-Sprung auf.
    if (action === "scroll-to") {
      e.preventDefault();
      const target = el.dataset.target && document.getElementById(el.dataset.target);
      if (target) {
        const motion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        try { target.scrollIntoView({ behavior: motion ? "auto" : "smooth", block: "start" }); }
        catch (e2) { try { target.scrollIntoView(); } catch (e3) { /* egal */ } }
      }
      return;
    }

    const handler = ACTIONS[action];
    if (handler) handler(el);
  }

  function onSubmit(e) {
    // Eigene Karte speichern (Editor-Formular).
    if (e.target.closest('[data-action="save-card"]')) {
      e.preventDefault();
      const val = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "";
      };
      saveCard({
        de: val("card-de"),
        es: val("card-es"),
        tip: val("card-tip"),
        cat: val("card-cat"),
        lvl: Number(val("card-lvl")),
      });
      return;
    }
    // Eigenen Favoriten-Eintrag ins Lexikon legen („Mi léxico"-Formular).
    if (e.target.closest('[data-action="fav-add"]')) {
      e.preventDefault();
      const val = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
      addCustomFavorite({ de: val("fav-de"), es: val("fav-es"), tip: val("fav-tip") });
      return;
    }
    // Preis-Hörtrainer: getippte Ziffern prüfen.
    if (e.target.closest('[data-action="submit-precios"]')) {
      e.preventDefault();
      const input = document.getElementById("precios-answer");
      submitPrecios(input ? input.value : "");
      return;
    }
    // Onboarding-Schritt 1: Name + Geschlecht bestätigen (Pflicht) und zum
    // Reiseziel-Schritt weitergehen.
    if (e.target.closest('[data-action="onboard-profile-next"]')) {
      e.preventDefault();
      advanceOnboardingProfile();
      return;
    }
    // Trip-Ziel speichern (Datum + Tagesziel + optionales Reiseziel). Beim
    // Onboarding schließt ein erfolgreiches Speichern den Willkommens-Schritt ab.
    if (e.target.closest('[data-action="save-trip"]')) {
      e.preventDefault();
      const val = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
      const onboarding = state.screen === "onboarding";
      const ok = setTripGoal({ destination: val("trip-dest"), endDate: val("trip-date"), perDay: val("trip-perday"), returnDate: val("trip-return"), stayDays: val("trip-staydays") });
      // Im Onboarding nach dem Trip-Ziel direkt den Ruta-Check anbieten (mit „Später“),
      // damit der Einstufungstest tatsächlich gemacht wird.
      if (ok && onboarding) openPlacement(true);
      return;
    }
    // Konjugations-Drill: getippte Verbform prüfen.
    if (e.target.closest('[data-action="submit-conjug"]')) {
      e.preventDefault();
      const input = document.getElementById("conjug-answer");
      submitConjug(input ? input.value : "");
      return;
    }
    // Diálogos: getippte Schlüssel-Replik prüfen.
    if (e.target.closest('[data-action="submit-dialogos"]')) {
      e.preventDefault();
      const input = document.getElementById("dialogos-answer");
      submitDialogosType(input ? input.value : "");
      return;
    }
    // Profil: Reise-Namen speichern (Enter oder „Speichern"-Knopf).
    if (e.target.closest('[data-action="save-name"]')) {
      e.preventDefault();
      const input = document.getElementById("profile-name");
      saveUserName(input ? input.value : "", true);
      return;
    }
    // Getippte Antwort prüfen (Schreiben-/Hör-Modus).
    const form = e.target.closest('[data-action="submit-typed"]');
    if (!form) return;
    e.preventDefault();
    const input = document.getElementById("answer");
    submitTyped(input ? input.value : "");
  }

  // Live-Suche: Tippen im Suchfeld zeichnet nur die Trefferliste neu (Fokus bleibt).
  function onInput(e) {
    if (state.screen !== "search") return;
    if (!e.target || e.target.id !== "search-input") return;
    state.searchQuery = e.target.value;
    updateSearchResults();
  }

  // Aufgaben-Code direkt beim Einfügen abonnieren. Das paste-Event feuert auch dort,
  // wo das Lesen der Zwischenablage per API gesperrt ist (file://, content://, WebView)
  // – so muss niemand extra „Hinzufügen" tippen (das schließt mit offener Tastatur oft
  // nur die Tastatur). Nach dem Einfügen den Feldinhalt prüfen; gültigen Code sofort
  // hinzufügen, sonst stehen lassen (zum Korrigieren).
  function onPaste(e) {
    const el = e.target;
    if (!el || el.id !== "task-code-input") return;
    setTimeout(function () {
      const v = String(el.value || "").trim();
      if (!v) return;
      if (store.decodeTask(v) || store.decodeBundle(v)) {
        // Gültiger Code/Bundle -> abonnieren (addByCode meldet selbst Dopplung/Fehler).
        if (addByCode(v)) { el.value = ""; render(); }
        return;
      }
      // Sieht wie ein Aufgaben-/Bundle-Code aus (HRT1.…/HRB1.…), lässt sich aber nicht
      // lesen -> kurzer Hinweis. Bei beliebigem Fremd-Text bleibt das Einfügen still.
      if (v.indexOf("HRT1.") !== -1 || v.indexOf("HRB1.") !== -1) showNotice(t("task.invalid"));
    }, 0);
  }

  // Dropdown-Auswahl (Länderkunde) – <select> meldet sich über 'change', nicht 'click'.
  function onChange(e) {
    // Backup-Import: verstecktes file-input im Profil-Reiter.
    if (e.target && e.target.id === "import-file") {
      const file = (e.target.files && e.target.files[0]) || null;
      e.target.value = ""; // erlaubt erneuten Import derselben Datei
      handleImportFile(file);
      return;
    }
    // Lehrer-Modus: mehrere Schüler-Backups auf einmal.
    if (e.target && e.target.id === "teacher-file") {
      const files = e.target.files;
      handleTeacherFiles(files);
      e.target.value = "";
      return;
    }
    // Profil-Name still sichern, sobald das Feld verlassen wird (auch ohne
    // „Speichern“). Kein Re-Render hier, damit ein direkt danach getippter Knopf
    // nicht ins Leere greift; die Persistenz reicht.
    if (e.target && e.target.id === "profile-name") {
      saveUserName(e.target.value, false);
      return;
    }
    // Battle-Spielernamen merken, damit ein Re-Render (Längen-Umschalten) sie
    // nicht verschluckt. 'change' feuert beim Verlassen des Feldes (auch wenn
    // direkt ein Längen-/Szenen-Button geklickt wird).
    if (e.target && (e.target.id === "pname-a" || e.target.id === "pname-b")) {
      const side = e.target.id === "pname-a" ? "A" : "B";
      state.battleNames = Object.assign({}, state.battleNames, { [side]: e.target.value.trim() });
      state.battleNameEdited = true; // ab jetzt nicht mehr automatisch mit dem Profil-Namen vorbelegen
      return;
    }
    // Aufgaben-Formular (Modo profe): Titel/Frist merken, damit ein Re-Render
    // (z. B. nach „Code erzeugen“) sie nicht zurücksetzt. Das Ziel läuft über das
    // Picker-Modal (data-action="pick-target"), nicht mehr über ein <select>.
    if (e.target && e.target.id === "task-title") { state.taskTitle = e.target.value; return; }
    if (e.target && e.target.id === "task-due") { state.taskDue = e.target.value; return; }
    // Klassenname (Modo profe): nur merken (für Druck-Kopf/CSV) – KEIN Re-Render,
    // damit der Cursor beim Tippen nicht springt.
    if (e.target && e.target.id === "teacher-classname") { setClassName(e.target.value); return; }
    // Aktivitätsblatt: Etappen-Auswahl -> sofort neu rendern (Live-Vorschau).
    if (e.target && e.target.id === "sheet-stage") { state.sheetStage = e.target.value; render(); return; }
    const el = e.target.closest('[data-action="select-country"]');
    if (!el) return;
    selectCountry(el.value);
  }

  function onKeydown(e) {
    // Focus-Trap: ist ein modaler Dialog offen, Tab/Shift+Tab darin halten.
    if (trapModalTab(e)) return;
    // Ziel-Picker-Modal (Modo profe / Aktivitätsblatt): Escape schließt.
    if (state.targetPicker && e.key === "Escape") {
      setState({ targetPicker: null });
      return;
    }
    // Spickzettel-Großanzeige: Escape schließt.
    if (state.screen === "spickzettel" && state.szShow && e.key === "Escape") {
      szClose();
      return;
    }
    if (state.screen !== "study") return;
    const inInput = e.target && e.target.tagName === "INPUT";
    // Space/Enter auf einem echten Button (Bewerten, 🔊, 🧭 Kontext) gehört dem Button –
    // sonst würde der globale Flip-Shortcut die native Aktivierung kapern.
    const onButton = e.target && e.target.tagName === "BUTTON";

    // 'p' = Antwort anhören (play), sobald die spanische Antwort sichtbar ist.
    if ((e.key === "p" || e.key === "P") && !inInput && canRate()) {
      speakCurrent();
      return;
    }

    // 's' = aktuelle Karte überspringen (jederzeit, nur nicht beim Tippen).
    if ((e.key === "s" || e.key === "S") && !inInput && !onButton) {
      e.preventDefault();
      skip();
      return;
    }

    if (state.mode === "flip") {
      if ((e.key === " " || e.key === "Enter") && !onButton) {
        e.preventDefault();
        flip(); // beidseitig: Frage ⇄ Antwort
      } else if (state.revealed) rateByKey(e.key); // Ziffern 1/2/3 kollidieren nie mit Button-Aktivierung
    } else {
      // Schreiben-Modus: Zahlen nur bewerten, wenn Ergebnis schon sichtbar ist.
      if (state.typeResult && !inInput) rateByKey(e.key);
    }
  }

  function rateByKey(key) {
    if (key === "1") rate(srs.RATING.AGAIN);
    else if (key === "2") rate(srs.RATING.GOOD);
    else if (key === "3") rate(srs.RATING.EASY);
  }

  // ----- Wischgesten (Lernkarte am Smartphone) -----
  // Karteikarte-Modus: hochwischen/antippen = umdrehen. Nach dem Umdrehen
  // (oder im Schreiben-Modus mit Ergebnis): links = Nochmal, rechts = Einfach,
  // hoch = Gut. So lässt sich die App komplett mit dem Daumen bedienen.
  let touch = null; // { x, y } Startpunkt
  const SWIPE_MIN = 45; // px – ab hier zählt es als Wisch
  // Aufdecken (↑) und „Gut" bewerten (↑) sind dieselbe Richtung. Ein direkt auf den
  // Aufdeck-Wisch folgender Hoch-Wisch soll daher nicht versehentlich bewerten.
  let lastFlipSwipeAt = 0;
  const SWIPE_FLIP_GUARD = 600; // ms – Sperrzeit für ↑-Bewerten nach Aufdeck-Wisch

  function canRate() {
    return state.screen === "study" &&
      (state.mode === "flip" ? state.revealed : !!state.typeResult);
  }

  function onTouchStart(e) {
    if (state.screen !== "study" || e.touches.length !== 1) { touch = null; return; }
    const t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e) {
    if (!touch) return;
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    const start = touch;
    touch = null;
    if (!t) return;

    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < SWIPE_MIN) return; // zu kurz -> kein Wisch (Tap bleibt Tap)

    // Nicht aus einem Eingabefeld heraus wischen-bewerten.
    if (e.target && e.target.tagName === "INPUT") return;

    if (canRate()) {
      if (ax > ay) { rate(dx < 0 ? srs.RATING.AGAIN : srs.RATING.EASY); lastSwipeAt = Date.now(); } // ← Nochmal · → Einfach
      else if (dy < 0) {
        if (Date.now() - lastFlipSwipeAt < SWIPE_FLIP_GUARD) return; // direkt nach Aufdeck-Wisch nicht versehentlich bewerten
        rate(srs.RATING.GOOD); lastSwipeAt = Date.now();                                              // ↑ Gut
      }
    } else if (state.mode === "flip" && !state.revealed && dy < 0) {
      flip(); lastSwipeAt = Date.now(); lastFlipSwipeAt = Date.now(); // ↑ hochwischen dreht die Karte um
    }
  }

  // ----- Offline-Fähigkeit (PWA) -----
  // Service Worker cacht alle Dateien, damit die App unterwegs ohne Netz läuft.
  // Zusätzlich: erkennt eine neue Version und bietet sie per Banner zum Laden an
  // (markUpdateReady -> applyUpdate -> controllerchange -> einmaliges Reload).
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol === "file:") return; // SW braucht http(s)

    // Übernimmt der neue Worker die Kontrolle (nach SKIP_WAITING), genau EINMAL
    // neu laden, damit die frischen Dateien greifen. Guard gegen Reload-Schleife.
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });

    navigator.serviceWorker.register("service-worker.js")
      .then((reg) => {
        // Wartet schon ein fertig installierter Worker (z. B. aus einem früheren
        // Besuch)? Dann ist das Update sofort startklar.
        if (reg.waiting && navigator.serviceWorker.controller) markUpdateReady(reg.waiting);
        // Neue Version gefunden -> Installation abwarten -> Banner zeigen.
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            // "installed" + es gibt bereits einen Controller => echtes Update
            // (keine Erstinstallation, bei der nichts zu ersetzen wäre).
            if (nw.state === "installed" && navigator.serviceWorker.controller) markUpdateReady(nw);
          });
        });

        // iOS-PWA-Knackpunkt: eine installierte App wird beim Schließen eingefroren
        // und beim Öffnen NUR fortgesetzt – ohne frisches Page-Load und ohne dass
        // der Browser von selbst auf einen neuen Service Worker prüft. Dadurch
        // feuerte "updatefound" praktisch nie, das "Neue Version"-Banner erschien
        // nicht, und Nutzer installierten die PWA neu, um das Update zu bekommen –
        // was auf iOS einen eigenen, LEEREN Storage-Sandbox erzeugt und so den
        // gesamten Fortschritt löscht. Darum aktiv nach Updates fragen, sobald die
        // App sichtbar/fokussiert wird (gedrosselt) und kurz nach dem Start.
        // reg.update() ist ein No-op, wenn nichts Neues vorliegt.
        let lastUpdateCheck = 0;
        const checkForUpdate = () => {
          const now = Date.now();
          if (now - lastUpdateCheck < 30000) return; // höchstens alle 30 s
          lastUpdateCheck = now;
          try { Promise.resolve(reg.update()).catch(() => {}); } catch (e) { /* egal */ }
        };
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") checkForUpdate();
        });
        window.addEventListener("focus", checkForUpdate);
        setTimeout(checkForUpdate, 3000);
      })
      .catch((err) => console.warn("Service Worker nicht registriert", err));
  }

  // Wartenden Worker vormerken und das "Neue Version – jetzt laden"-Banner zeigen.
  function markUpdateReady(worker) {
    state.swWaiting = worker || state.swWaiting;
    if (state.swUpdate) return; // Banner schon sichtbar
    setState({ swUpdate: true });
  }

  // "Jetzt laden": den wartenden Worker aktivieren -> controllerchange -> Reload.
  // Fällt der Worker-Bezug weg, tut ein einfaches Reload denselben Dienst.
  function applyUpdate() {
    const w = state.swWaiting;
    if (w) { try { w.postMessage({ type: "SKIP_WAITING" }); } catch (e) { location.reload(); } }
    else location.reload();
  }

  // Banner wegtippen: die neue Version übernimmt dann beim nächsten App-Start.
  function dismissSwUpdate() {
    state.swUpdate = false;
    const el = root.querySelector(".updbar");
    if (el) el.remove();
  }

  // Deep-Link beim Start:
  //   ?m=<modul>  – öffnet ein empfohlenes Modul oder einen Test direkt (aus einem
  //                 „Modul teilen"- bzw. Ergebnis-/Inhalts-Sharepic-Link)
  //   ?a=<aktion> – öffnet eine App-Aktion ohne eigenes Modul (Homescreen-Shortcuts
  //                 aus dem Manifest, z.B. „Ruta del día" oder „Suchen")
  // Beides hat Vorrang vor dem Onboarding – wer per Link/Shortcut kommt, soll sofort
  // am Ziel landen. Danach wird der Parameter aus der Adresse geputzt, damit Reload/
  // Zurück-Geste normal laufen. Liefert true, wenn ein gültiges Ziel geöffnet wurde.
  function applyModuleDeepLink() {
    // Kleiner Helfer: Parameter aus Query (?x=) oder Hash (#x=/&x=) lesen.
    function param(key) {
      try {
        const q = (new URLSearchParams(location.search).get(key) || "").trim().toLowerCase();
        if (q) return q;
        if (location.hash) {
          const h = location.hash.match(new RegExp("[#&]" + key + "=([^&]+)"));
          if (h) return decodeURIComponent(h[1]).trim().toLowerCase();
        }
      } catch (e) { /* file:// o.ä. – kein Deep-Link */ }
      return "";
    }
    // App-Aktionen (Homescreen-Shortcuts): direkte Einstiege ohne eigenes Modul.
    const actions = {
      ruta: openRutaDelDia,   // ?a=ruta      → heutige Lernrunde
      buscar: openSearch,     // ?a=buscar    → Suche
      favoritos: openFavorites, // ?a=favoritos → „Mi léxico" (Favoriten)
    };
    const aSlug = param("a");
    if (aSlug && actions[aSlug]) {
      markSeen();
      actions[aSlug]();
      cleanUrl();
      return true;
    }
    const slug = param("m");
    if (!slug) return false;
    const openers = {
      supervivencia: openSpickzettel,
      hostel: openHostel,
      definiciones: openQuizSetup,
      frases: openFrasesSetup,
      dialogos: openDialogosSetup,
      regatear: openRegatear,
      precios: openPrecios,
      cuerpo: openCuerpo,
      compras: openCompras,
      yesto: openYesto,
      conjugacion: openConjugacion,
      tiempos: openTiempos,
      paises: openInfo,
      knigge: openKnigge,
      logistica: openLogistica,
      salud: openSalud,
      fotos: openFotos,
      flirt: openFlirt,
      bailar: openBailar,
      musica: openMusica,
      historia: () => openHistoria("sur"),
      "historia-centro": () => openHistoria("centro"),
      // Einstufungs-Tests: ein geteiltes Ergebnis-Sharepic (Motiv „assessment“/
      // „placement“) verlinkt per ?m=… direkt in den jeweiligen Test, nicht nur
      // auf die Startseite. Beide Opener starten in der Intro-Phase (Auswahl/Start).
      "nivel-test": openAssessment,
      "ruta-check": () => openPlacement(false),
    };
    const open = openers[slug];
    if (!open) return false;
    markSeen();
    open(); // setzt state.screen + rendert
    cleanUrl();
    return true;

    // Eingeladene/per Shortcut Gekommene gelten als „gesehen": kein Onboarding-
    // Zwang vor dem Ziel.
    function markSeen() {
      if (settings.onboarded !== true) {
        settings = Object.assign({}, settings, { onboarded: true });
        store.saveSettings(settings);
      }
    }
    // Parameter aus der Adresse entfernen (ohne Reload), damit ein späterer Reload
    // nicht erneut deep-linkt und die Adresse sauber bleibt.
    function cleanUrl() {
      try { history.replaceState(history.state, "", location.pathname); } catch (e) { /* file:// o.ä. – egal */ }
    }
  }

  // ----- Start -----
  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  root.addEventListener("input", onInput);
  root.addEventListener("paste", onPaste);
  root.addEventListener("submit", onSubmit);
  document.addEventListener("keydown", onKeydown);
  root.addEventListener("touchstart", onTouchStart, { passive: true });
  root.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("popstate", onPopState); // Zurück-Geste: eine Ebene höher statt App schließen
  // Drehen des 3D-Körpermodells (greift nur auf der Cuerpo-Bühne).
  root.addEventListener("pointerdown", onBodyPointerDown);
  window.addEventListener("pointermove", onBodyPointerMove);
  window.addEventListener("pointerup", onBodyPointerUp);
  window.addEventListener("pointercancel", onBodyPointerUp);
  // Reise-Route per Drag & Drop umsortieren (Profil-Zeitleiste).
  root.addEventListener("pointerdown", onTripPointerDown);
  window.addEventListener("pointermove", onTripPointerMove);
  window.addEventListener("pointerup", onTripPointerUp);
  window.addEventListener("pointercancel", onTripPointerUp);
  setupKeyboardScroll(); // fokussiertes Eingabefeld über der Tastatur halten (Diálogos, Schreiben, Suche …)
  applyTheme(effectiveTheme()); // mit gemerkter Wahl / System-Vorliebe gleichziehen
  // Ohne eigene Wahl der System-Vorliebe live folgen (z.B. Nacht-Automatik des Handys).
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSys = () => {
      if (settings.theme !== "dark" && settings.theme !== "light") { applyTheme(effectiveTheme()); render(); }
    };
    mq.addEventListener ? mq.addEventListener("change", onSys) : (mq.addListener && mq.addListener(onSys));
  } catch (e) { /* matchMedia fehlt – egal */ }
  syncBadges(Date.now(), false); // bereits erfüllte Badges still nachtragen (Bestandsnutzer)
  // Der Installier-Hinweis kann erst später verfügbar werden (Browser feuert
  // beforeinstallprompt verzögert). Wird HolaRuta gerade auf der Startseite
  // angezeigt, frisch rendern, damit der Knopf auftaucht bzw. wieder verschwindet.
  if (window.SC && window.SC.install) {
    window.SC.install.setOnChange(() => { if (state.screen === "home") render(); });
  }
  applyEdition();            // Co-Branding (Akzentfarbe/Titel/theme-color) VOR dem ersten render
  applyUiLang(state.uiLang); // UI-Sprache setzen (i18n + <html lang>) VOR dem ersten render
  checkForUpdate(); // VOR dem ersten render – sonst fehlt der Update-Hinweis
  // Erstkontakt: beim allerersten Start (noch nichts gespeichert) ins Onboarding
  // führen, das das Trip-Ziel abfragt. Bestandsnutzer (mit Fortschritt, Bewertungen
  // oder bereits gesetztem Ziel) werden still als „onboarded" markiert.
  if (settings.onboarded !== true) {
    const hasData = Object.keys(progress).length > 0 || (gamestats.reviews | 0) > 0 || !!gamestats.tripGoal;
    if (hasData) {
      settings = Object.assign({}, settings, { onboarded: true });
      store.saveSettings(settings);
    } else {
      beginOnboarding();
    }
  }
  // Geteilter Aufgaben-Link (?task=<code>): die Aufgabe still abonnieren (mehrere
  // parallel möglich) und den Parameter entfernen. Onboarding hat Vorrang vor dem Screen.
  const taskCode = urlParam("task");
  if (taskCode) {
    if (addByCode(taskCode, true) && settings.onboarded === true && state.screen !== "onboarding") {
      openTaskScreen(); // direkt zur Aufgabenliste, wenn schon eingerichtet
    }
    stripUrlParam("task");
  }
  // Geteilter Link einer Schule/Partnerfirma (?start=onboarding): immer ins Onboarding
  // – auch auf einem Bestandsgerät. Branding kommt aus der Edition (?edition=…, registry.js).
  if (urlParam("start").toLowerCase() === "onboarding") {
    beginOnboarding();
    stripUrlParam("start"); // Parameter entfernen, damit ein Reload nicht erneut zwingt (Edition bleibt)
  }
  // Deep-Link aus einem geteilten „Modul teilen"-Link (?m=<id>) hat Vorrang vor
  // Startseite/Onboarding. applyModuleDeepLink() rendert beim Treffer selbst; das
  // abschließende render() deckt zusätzlich Fälle ab, in denen ein Opener vorab
  // abbricht (z.B. Precios ohne Sprachausgabe) – so bleibt der Bildschirm nie leer.
  applyModuleDeepLink();
  render();
  registerServiceWorker();
  // Persistenten Speicher anfragen (fire-and-forget): senkt das Risiko, dass
  // der Browser den localStorage räumt (z.B. iOS nach 7 Tagen Inaktivität).
  try {
    if (navigator.storage && typeof navigator.storage.persist === "function") {
      navigator.storage.persist().catch(() => { /* egal */ });
    }
  } catch (e) { /* Feature fehlt – egal */ }

  window.SC.app = { render }; // nach außen minimal
})();
