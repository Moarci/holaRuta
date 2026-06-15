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
  const changelog = window.SC.changelog || null; // Versionsstand & „Was ist neu?" (optional)
  const DEFAULT_ACCENT = ["#C2502E", "#E9A23B"]; // Terrakotta→Ocker (markenkonform, statt kühlem Indigo)
  // Eine Lernrunde bleibt bewusst klein: höchstens so viele Karten pro Sitzung.
  // Sonst startet ein Neueinsteiger mit "561 fällig" in eine erschlagende
  // Pflicht-Session – der Rest bleibt fällig und kommt in der nächsten Runde.
  const SESSION_CAP = 20;

  // ----- Zustand (eine einzige Quelle der Wahrheit) -----
  let progress = store.loadProgress();
  let settings = store.loadSettings();
  let gamestats = store.loadGameStats(); // Spiel-Zähler fürs Badge-System

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
    screen: "home",          // 'home' | 'study' | 'done' | 'stats' | 'card' | 'hostel' | 'battleSetup' | 'battle' | 'battleDone' | 'roleplaySetup' | 'roleplay' | 'quizSetup' | 'quiz' | 'quizDone' | 'cuerpo' | 'conjugacion' | 'tiempos' | 'spickzettel' | 'preciosSetup' | 'precios' | 'preciosDone' | 'frasesSetup' | 'frases' | 'frasesDone' | 'compras' | 'comprasQuiz' | 'comprasQuizDone' | 'knigge' | 'regatear' | 'logistica' | 'salud'
    homeTab: "lernen",       // Start hat Vorrang: jeder App-Start landet auf dem Lernen-Reiter; Wechsel gilt nur für die laufende Sitzung
    // 'flip' | 'type' | 'listen'. Hör-Modus nur, wenn der Browser TTS kann –
    // sonst (z.B. aus fremdem Gerät importiert) zurück auf Sprechen.
    mode: (settings.mode === "listen" && !(speech && speech.isSupported())) ? "flip" : (settings.mode || "flip"),
    // UI-/Muttersprache: "de" | "en". Gespeicherte Wahl gewinnt; beim ersten
    // Öffnen (noch nichts gespeichert) nach Betriebssystem-Sprache vorbelegen.
    uiLang: settings.uiLang === "en" ? "en" : settings.uiLang === "de" ? "de" : detectUiLang(),
    dir: settings.dir === "es2de" ? "es2de" : "de2es", // Lernrichtung: native→ES (Standard) | ES→native
    levels: Array.isArray(settings.levels) ? settings.levels : [], // [] = alle Stufen, sonst Teilmenge von [1,2,3]
    scopeId: "all",          // 'all' | Kategorie-Id
    queue: [],               // verbleibende Karten-Ids dieser Sitzung
    total: 0,                // Kartenzahl zu Sitzungsbeginn
    revealed: false,         // Karteikarte-Modus: Rückseite sichtbar?
    contextOpen: false,      // 🧭 Reise-Kontext-Panel aufgeklappt? (Single Source of Truth)
    typeResult: null,        // Schreiben-Modus: { correct, answers, input } | null
    statsFilter: "answered", // Statistik-Liste: 'answered'|'hard'|'mastered'|'new'|'all'
    cardId: null,            // Detailseite: welche Karte
    backTo: "home",          // wohin der Zurück-Knopf der Detailseite führt
    countryId: null,         // Länderkunde: welches Land ist gewählt (null = erstes)
    badgeToast: null,        // frisch freigeschaltete Badges (kurze Einblendung)
    updateNotice: null,      // „Was ist neu?"-Einträge nach einem Update (null = keiner)
    swUpdate: false,         // wartet eine neue SW-Version? -> "jetzt laden"-Banner
    swWaiting: null,         // Referenz auf den wartenden Service Worker (für SKIP_WAITING)
    // ----- Hostel Mode (transient, keine Persistenz) -----
    battle: null,            // { sceneId, poolIds, queue:[battleId…], round, totalRounds, current:'A'|'B', names:{A,B}, scores:{A,B}, revealed, recorded, suddenDeath, challenge }
    battleLength: 10,        // gewünschte Battle-Länge in Runden (vor dem Start wählbar)
    battleNames: { A: "", B: "" }, // optionale Spielernamen (sonst „Spieler A/B")
    battleSeen: [],          // zuletzt verwendete Battle-Ids – vermeidet sofortige Wiederholungen
    roleplayId: null,        // aktuell geöffnetes Rollenspiel
    roleplaySwapped: false,  // Rollen A/B getauscht?
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
    // ----- Suche (gezielt nach Karten/Übungen & Informationen suchen) -----
    searchQuery: "",         // aktueller Suchbegriff (lebt nur in der Sitzung)
  };

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
      badgeCount: badges ? Object.keys(gamestats.unlocked || {}).length : 0,
      streak: currentStreak(),
      overall: {
        mastered: overall.mastered,
        total: overall.total,
        pct: overall.total ? Math.round((overall.mastered / overall.total) * 100) : 0,
      },
      lastCat,
      userName: settings.userName || "",       // Reise-Name (für Diálogos automatisch eingesetzt)
      speechRate: settings.speechRate || 0.95, // gewähltes Sprechtempo (Default normal)
      rutaDone: !!(gamestats.rutaDays && gamestats.rutaDays[dayKey(Date.now())]), // Ruta del día heute schon gelaufen?
      trip: tripGoalVM(),       // Trip-Ziel-Karte (null = kein Ziel gesetzt)
      tripEdit: state.tripEdit, // Formular aufgeklappt?
      tab: state.homeTab,
      install: installVM(),
    };
  }

  // „Auf den Startbildschirm"-Hinweis fürs Profil. Leer, wenn die App schon
  // installiert ist oder als Einzeldatei läuft (siehe install.js).
  function installVM() {
    const inst = window.SC && window.SC.install;
    if (!inst) return { show: false };
    // Läuft die App bereits installiert (standalone), zeigen wir eine klare
    // „offline installiert"-Bestätigung.
    if (inst.isInstalled()) return { show: true, installed: true };
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
      context: card.context ? loc(card.context) : null,
      contextOpen: state.contextOpen,
      swatch: card.swatch || null,
    };
  }

  function doneVM() {
    const isAll = state.scopeId === "all";
    const cat = categoryById(state.scopeId);
    return { scopeLabel: isAll ? t("app.allTopics") : (cat ? natk(cat, "label") : "") };
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
      filter,
      filters: [
        { id: "answered", label: t("app.statAnswered"), count: ov.seenCards },
        { id: "hard", label: t("app.statHard"), count: ov.hard },
        { id: "mastered", label: t("app.statMastered"), count: ov.mastered },
        { id: "new", label: t("app.statNew"), count: ov.neu },
        { id: "all", label: t("app.all"), count: ov.total },
      ],
      list,
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
      context: card.context ? loc(card.context) : null,
      contextOpen: state.contextOpen,
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
      roleplays: loc(roleplays),
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

  // ----- Trip-Ziel (Countdown + Tagesziel) -----
  // Optionales Reiseziel mit Datum und Karten-pro-Tag-Ziel. Schärft die Habit-
  // Schleife: „Noch 12 Tage bis Cusco · 8/15 heute". Liegt in gamestats
  // (tripGoal) und stützt sich auf den Tageszähler dailyCounts aus recordStudyEvent.
  function tripGoalVM() {
    const t = gamestats.tripGoal;
    if (!t) return null;
    const today = dayKey(Date.now());
    const daysLeft = daysBetween(today, t.endDate); // null wenn Datum kaputt
    const todayCount = (gamestats.dailyCounts && gamestats.dailyCounts[today]) || 0;
    const perDay = t.perDay || 1;
    return {
      destination: t.destination,
      endDate: t.endDate,
      perDay,
      daysLeft: daysLeft === null ? 0 : daysLeft, // <0 = Termin vorbei
      past: daysLeft !== null && daysLeft < 0,
      today: t.endDate === today,
      todayCount,
      todayDone: todayCount >= perDay,
      todayPct: Math.max(0, Math.min(100, Math.round((todayCount / perDay) * 100))),
    };
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
    const goal = { destination, endDate, perDay, startedAt: dayKey(Date.now()) };
    gamestats = Object.assign({}, gamestats, { tripGoal: goal });
    store.saveGameStats(gamestats);
    state.tripEdit = false;
    buzz(8);
    render();
    return true;
  }

  // Onboarding einmalig als erledigt vermerken und aufs Dashboard wechseln. Der
  // Reiter bleibt „Lernen" (Standard); ein gesetztes Trip-Ziel taucht dort direkt auf.
  function finishOnboarding() {
    settings = Object.assign({}, settings, { onboarded: true });
    store.saveSettings(settings);
    state.tripEdit = false;
    state.screen = "home";
    render();
  }

  function clearTripGoal() {
    gamestats = Object.assign({}, gamestats, { tripGoal: null });
    store.saveGameStats(gamestats);
    state.tripEdit = false;
    render();
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
    root.insertAdjacentHTML("afterbegin", ui.badgeToast(state.badgeToast));
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
    state.screen = "badges";
    render();
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

  function hostelVM() {
    return {
      battleCount: data.BATTLES.length,
      roleplayCount: data.ROLEPLAYS.length,
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
        de: nat(d), es: d.es,
      })),
      usefulPhrases: r.usefulPhrases,
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
    state.screen = "quizSetup";
    render();
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
    state.screen = "quiz";
    render();
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
      state.screen = "quizDone";
      render();
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
    state.screen = "quizSetup";
    render();
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
      guide: data.CONJUGATION,
      cardCount: data.CARDS.filter((c) => c.cat === "verbos").length,
      canDrill: conjugReady(), // Conjugador-Drill verfügbar (Modul geladen)?
    };
  }

  function openConjugacion() {
    dismissBadgeToast();
    state.screen = "conjugacion";
    render();
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
    state.screen = "tiempos";
    render();
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
    state.screen = "frasesSetup";
    render();
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
    state.screen = "frases";
    render();
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
      state.screen = "frasesDone";
      render();
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
    return profileName() || "Marco";
  }
  // Platzhalter {name} in Dialog-Texten (Anzeige, Vorlesen, akzeptierte Eingaben)
  // durch den Reise-Namen ersetzen.
  function withName(s) {
    return typeof s === "string" ? s.replace(/\{name\}/g, travelerName()) : s;
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
    if (!dialogosReady()) return;
    state.screen = "dialogosSetup";
    render();
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
    d.result = { correct, given: t.options[idx].es };
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
      state.screen = "dialogosDone";
      render();
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
    state.screen = "cuerpo";
    render();
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
    state.screen = "compras";
    render();
  }

  function comprasSection(id) {
    if (!shoppingSectionById(id)) return;
    state.compras = { section: id, open: null };
    render();
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
    state.screen = "comprasQuiz";
    render();
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
      state.screen = "comprasQuizDone";
      render();
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
    state.screen = "compras";
    render();
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
    return SCREEN_PARENT[state.screen] || "home";
  }

  // Reagiert auf eine Zurück-Geste: erst offene Einblendungen schließen, sonst
  // eine Ebene höher navigieren. Liefert false, wenn nichts mehr abzufangen ist
  // (wir sind auf dem Dashboard) – dann darf die App sich regulär schließen.
  function handleBack() {
    // 1) Offene Overlays/Panels zuerst schließen (wie ein „Schließen").
    if (state.updateNotice && state.updateNotice.length) { dismissUpdateNotice(); return true; }
    if (state.szShow) { szClose(); return true; }
    if (state.screen === "study" && state.contextOpen) { setContextOpen(false); render(); return true; }
    // 2) Schon auf dem Dashboard: App freigeben.
    if (state.screen === "home") return false;
    // Onboarding mit „Zurück" überspringen (zählt als erledigt, kein Wiederzeigen).
    if (state.screen === "onboarding") { finishOnboarding(); return true; }
    // 3) Eine Ebene höher.
    const target = backTarget();
    if (target === "home") goHome();
    else if (target === "stats") goStats();
    else {
      dismissBadgeToast();
      state.revealed = false;
      state.contextOpen = false;
      state.typeResult = null;
      state.screen = target;
      render();
    }
    return true;
  }

  function onPopState() {
    backGuardArmed = false; // der Puffer-Eintrag wurde gerade konsumiert
    const handled = handleBack();
    // Sind wir noch in der App, sofort einen neuen Puffer legen, damit die
    // nächste Zurück-Geste wieder bei uns landet (render() macht das beim
    // Navigieren bereits – das hier deckt overlay-Fälle ohne Re-Render ab).
    if (handled && state.screen !== "home") armBackGuard();
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

  function render() {
    if (state.screen === "study") root.innerHTML = ui.renderStudy(studyVM());
    else if (state.screen === "done") root.innerHTML = ui.renderDone(doneVM());
    else if (state.screen === "stats") root.innerHTML = ui.renderStats(statsVM());
    else if (state.screen === "card") root.innerHTML = ui.renderCard(cardVM());
    else if (state.screen === "editor") root.innerHTML = ui.renderEditor(editorVM());
    else if (state.screen === "info") root.innerHTML = ui.renderInfo(infoVM());
    else if (state.screen === "historia") root.innerHTML = ui.renderHistoria(historiaVM());
    else if (state.screen === "knigge") root.innerHTML = ui.renderKnigge(kniggeVM());
    else if (state.screen === "regatear") root.innerHTML = ui.renderRegatear(regatearVM());
    else if (state.screen === "logistica") root.innerHTML = ui.renderLogistica(logisticaVM());
    else if (state.screen === "salud") root.innerHTML = ui.renderSalud(saludVM());
    else if (state.screen === "badges") root.innerHTML = ui.renderBadges(badgesVM());
    else if (state.screen === "hostel") root.innerHTML = ui.renderHostel(hostelVM());
    else if (state.screen === "battleSetup") root.innerHTML = ui.renderBattleSetup(battleSetupVM());
    else if (state.screen === "battle") root.innerHTML = ui.renderBattle(battleVM());
    else if (state.screen === "battleDone") root.innerHTML = ui.renderBattleDone(battleDoneVM());
    else if (state.screen === "roleplaySetup") root.innerHTML = ui.renderRoleplaySetup(roleplaySetupVM());
    else if (state.screen === "roleplay") root.innerHTML = ui.renderRoleplay(roleplayVM());
    else if (state.screen === "quizSetup") root.innerHTML = ui.renderQuizSetup(quizSetupVM());
    else if (state.screen === "quiz") root.innerHTML = ui.renderQuiz(quizVM());
    else if (state.screen === "quizDone") root.innerHTML = ui.renderQuizDone(quizDoneVM());
    else if (state.screen === "cuerpo") root.innerHTML = ui.renderCuerpo(cuerpoVM());
    else if (state.screen === "conjugacion") root.innerHTML = ui.renderConjugacion(conjugacionVM());
    else if (state.screen === "tiempos") root.innerHTML = ui.renderTiempos(tiemposVM());
    else if (state.screen === "spickzettel") root.innerHTML = ui.renderSpickzettel(spickzettelVM());
    else if (state.screen === "preciosSetup") root.innerHTML = ui.renderPreciosSetup(preciosSetupVM());
    else if (state.screen === "precios") root.innerHTML = ui.renderPrecios(preciosVM());
    else if (state.screen === "preciosDone") root.innerHTML = ui.renderPreciosDone(preciosDoneVM());
    else if (state.screen === "frasesSetup") root.innerHTML = ui.renderFrasesSetup(frasesSetupVM());
    else if (state.screen === "frases") root.innerHTML = ui.renderFrases(frasesVM());
    else if (state.screen === "frasesDone") root.innerHTML = ui.renderFrasesDone(frasesDoneVM());
    else if (state.screen === "conjugSetup") root.innerHTML = ui.renderConjugSetup(conjugSetupVM());
    else if (state.screen === "conjug") root.innerHTML = ui.renderConjug(conjugVM());
    else if (state.screen === "conjugDone") root.innerHTML = ui.renderConjugDone(conjugDoneVM());
    else if (state.screen === "dialogosSetup") root.innerHTML = ui.renderDialogosSetup(dialogosSetupVM());
    else if (state.screen === "dialogos") root.innerHTML = ui.renderDialogos(dialogosVM());
    else if (state.screen === "dialogosDone") root.innerHTML = ui.renderDialogosDone(dialogosDoneVM());
    else if (state.screen === "compras") root.innerHTML = ui.renderCompras(comprasVM());
    else if (state.screen === "comprasQuiz") root.innerHTML = ui.renderComprasQuiz(comprasQuizVM());
    else if (state.screen === "comprasQuizDone") root.innerHTML = ui.renderComprasQuizDone(comprasQuizDoneVM());
    else if (state.screen === "search") root.innerHTML = ui.renderSearch(searchVM());
    else if (state.screen === "onboarding") root.innerHTML = ui.renderOnboarding(homeVM());
    else root.innerHTML = ui.renderHome(homeVM());

    // Nach dem Austausch des Inhalts: bei echtem Ansichtswechsel oben anfangen.
    resetScrollOnViewChange();

    // Glückwunsch-Einblendung als eigene Ebene über den aktuellen Screen.
    if (badges && state.badgeToast && state.badgeToast.length) {
      root.insertAdjacentHTML("afterbegin", ui.badgeToast(state.badgeToast));
    }

    // „Was ist neu?"-Hinweis nach einem Update – oberste Ebene (Scrim + Karte).
    if (state.updateNotice && state.updateNotice.length) {
      root.insertAdjacentHTML("afterbegin", ui.updateNotice(state.updateNotice));
    }

    // „Neue Version – jetzt laden"-Banner (schwebt unten über der Reiter-Leiste),
    // wenn ein neuer Service Worker installiert ist und auf Aktivierung wartet.
    if (state.swUpdate) {
      root.insertAdjacentHTML("beforeend", ui.updateBanner());
    }

    // 3D-Körpermodell nach dem Render verdrahten (Elemente neu, Drehung erhalten).
    if (state.screen === "cuerpo") cuerpoInit3D();
    // Diálogos: den aktiven Zug (neue Replik, Optionen, Eingabe oder Verdikt) in
    // den sichtbaren Bereich holen – bei langen Gesprächen wächst der Verlauf
    // sonst unter den Bildschirmrand.
    if (state.screen === "dialogos") scrollDialogActive();

    manageFocus();
    maybeAutoSpeak();

    // Abseits des Dashboards einen Puffer-Eintrag vorhalten, damit die nächste
    // Zurück-Geste eine Ebene höher führt statt die App zu schließen.
    if (state.screen !== "home") armBackGuard();
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
  function manageFocus() {
    // Update-Hinweis liegt als Modal über allem -> Fokus hinein, nicht auf den
    // verdeckten Screen dahinter (Tastatur/Screenreader).
    if (state.updateNotice && state.updateNotice.length) {
      const ok = root.querySelector(".upd .upd__ok");
      if (ok) { try { ok.focus({ preventScroll: true }); } catch (e) { ok.focus(); } return; }
    }
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
  function startStudy(scopeId) {
    dismissBadgeToast();
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
    state.scopeId = scopeId;
    state.queue = chosen.map((c) => c.id);
    state.total = state.queue.length;
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
    state.scopeId = "all";
    state.queue = chosen.map((c) => c.id);
    state.total = state.queue.length;
    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    state.screen = state.queue.length ? "study" : "done";
    syncBadges(now, true); // 🗺️-Badges freischalten + einblenden
    render();
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
    state.contextOpen = false;
    render();
  }

  // Kurzes Haptik-Feedback (nur wo unterstützt, z.B. Android-Chrome). Ignoriert sonst.
  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* egal */ }
  }

  function rate(rating) {
    const card = cardById(state.queue[0]);
    if (!card) return;
    buzz(rating === srs.RATING.AGAIN ? 30 : 12);

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
  function toggleTheme() {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
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

  // UI-Sprache anwenden (ohne Persistenz): i18n umstellen + <html lang> setzen.
  // Wird beim Start UND bei jedem Wechsel aufgerufen (Single Source of Truth).
  function applyUiLang(l) {
    const next = l === "en" ? "en" : "de";
    state.uiLang = next;
    if (i18n) i18n.setLang(next);
    try { document.documentElement.lang = next; } catch (e) { /* egal */ }
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
    // Reiter-Wechsel gilt nur für die laufende Sitzung – beim nächsten App-Start
    // hat die Startseite (Lernen) wieder Vorrang, deshalb wird er nicht persistiert.
    state.homeTab = tab === "entdecken" || tab === "profil" ? tab : "lernen";
    render();
  }

  function goHome() {
    dismissBadgeToast();
    state.screen = "home";
    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    render();
  }

  // ----- Hostel Mode (Anwenden zu zweit) -----
  function openHostel() {
    dismissBadgeToast();
    state.screen = "hostel";
    render();
  }

  function openBattleSetup() {
    dismissBadgeToast();
    // Spieler A mit dem Profil-Namen vorbelegen (Gerätebesitzer spielt meist A),
    // solange noch kein Name eingetippt wurde. Das Feld bleibt frei editier- und
    // leerbar; auf 14 Zeichen gekürzt wie das Eingabefeld selbst.
    if (!state.battleNames.A) {
      const n = profileName().slice(0, 14);
      if (n) state.battleNames = Object.assign({}, state.battleNames, { A: n });
    }
    state.screen = "battleSetup";
    render();
  }

  // Vor dem Start gewählte Battle-Länge merken (nur Umschalten, kein Start).
  function setBattleLength(value) {
    state.battleLength = value;
    render();
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
  function startBattle(sceneId) {
    dismissBadgeToast();
    const pool = data.BATTLES.filter((b) => sceneId === "all" || b.scene === sceneId);
    if (!pool.length) return;
    const poolIds = pool.map((b) => b.id);
    // Gerade Rundenzahl, damit beide Spieler gleich oft dran sind (A,B,A,B…).
    const rounds = evenRounds(Math.min(state.battleLength, poolIds.length));
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
    state.screen = "battle";
    render();
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
    state.screen = "battle";
    render();
  }

  function battleAgain() {
    dismissBadgeToast();
    state.battle = null;
    state.screen = "battleSetup";
    render();
  }

  // Real-Life-Challenge auf dem Battle-Ende-Screen abhaken (Mutproben-Badges).
  function markChallengeDone(id) {
    recordChallengeDone(id);
    syncBadges(Date.now(), true);
    render();
  }

  function openRoleplaySetup() {
    dismissBadgeToast();
    state.screen = "roleplaySetup";
    render();
  }

  function startRoleplay(id) {
    if (!roleplayById(id)) return;
    dismissBadgeToast();
    state.roleplayId = id;
    state.roleplaySwapped = false;
    recordRoleplaySeen(id);
    syncBadges(Date.now(), true); // Rollenspiel-Badges freischalten + einblenden
    state.screen = "roleplay";
    render();
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
        cards.push({ id: c.id, de: nat(c), es: c.es, tip: c.tip || null });
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
    state.szShow = null;
    render();
  }

  // Großanzeige öffnen/schließen (Satz bildschirmfüllend zum Herzeigen).
  function szShow(id) {
    if (!cardById(id)) return;
    state.szShow = id;
    render();
  }

  function szClose() {
    state.szShow = null;
    render();
  }

  // Eine beliebige Karte per Id vorlesen (Spickzettel / Listen außerhalb der
  // Lern-Sitzung). Erste akzeptierte Variante, damit "/"-Alternativen sauber klingen.
  function speakCardId(id) {
    if (!speech) return;
    const card = cardById(id);
    if (!card) return;
    speech.speak(matcher.acceptedAnswers(card)[0] || card.es, settings.speechRate);
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
    state.screen = "preciosSetup";
    render();
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
      state.screen = "preciosDone";
      render();
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
    state.screen = "conjugSetup";
    render();
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
    state.screen = "conjug";
    render();
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
      state.screen = "conjugDone";
      render();
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
    { action: "open-spickzettel", icon: "🆘", title: "Supervivencia",    subKey: "discover.subSupervivencia" },
    { action: "open-hostel",      icon: "🛏️", title: "Modo hostal",       subKey: "discover.subHostel" },
    { action: "open-quiz-setup",  icon: "🧩", title: "Definiciones",      subKey: "discover.subDefiniciones" },
    { action: "open-frases",      icon: "🧱", title: "Frases flexibles",  subKey: "discover.subFrases", need: "frases" },
    { action: "open-dialogos",    icon: "💬", title: "Diálogos",          subKey: "discover.subDialogos", need: "dialogos" },
    { action: "open-regatear",    icon: "🤝", title: "Regatear",          subKey: "discover.subRegatear", need: "regatear" },
    { action: "open-precios",     icon: "💵", title: "Precios al oído",   subKey: "discover.subPrecios", need: "speech" },
    { action: "open-cuerpo",      icon: "🧍", title: "El Cuerpo",         subKey: "discover.subCuerpo" },
    { action: "open-compras",     icon: "🛒", title: "Lista de compras",  subKey: "discover.subCompras" },
    { action: "open-conjugacion", icon: "🔁", title: "Conjugación",       subKey: "discover.subConjugacion" },
    { action: "open-tiempos",     icon: "⏳", title: "Tiempos",           subKey: "discover.subTiempos" },
  ];
  const searchHas = {
    countries: !!countries, speech: !!(speech && speech.isSupported()), frases: !!frases,
    dialogos: !!(dialogos && dialogos.DIALOGOS_SCENARIOS && dialogos.DIALOGOS_SCENARIOS.length),
    knigge: !!knigge, regatear: !!regatear, logistica: !!logistica, salud: !!salud,
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
      const topics = (mod.TOPICS || []).map((tp) => [tp.title, tp.titleEn, tp.intro, tp.introEn, tp.dos, tp.dosEn, tp.donts, tp.dontsEn]);
      const phrases = (mod.PHRASES || []).map((p) => [p.title, p.titleEn, (p.items || []).map((it) => [it.es, it.de, it.en])]);
      const gloss = (mod.GLOSSARY || []).map((g) => [g.es, g.de, g.en]);
      const checklist = (mod.CHECKLIST || []).map((c) => [c.item, c.itemEn, c.why, c.whyEn]);
      idx.push({
        group: "info", kind: "page", kindLabel: t("search.kindInfo"),
        icon: icon, title: title, sub: t(subKey),
        action: action,
        hay: searchHay([title, mod.INTRO, mod.INTRO_EN, topics, phrases, gloss, checklist]),
      });
    };
    pageMod(logistica, "🧳", "Logística de viaje", "discover.subLogistica", "open-logistica");
    pageMod(salud, "🥗", "Salud y energía", "discover.subSalud", "open-salud");

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
    state.screen = "search";
    render();
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
    state.screen = "info";
    render();
  }

  function openHistoria(region) {
    dismissBadgeToast();
    state.histRegion = region === "centro" ? "centro" : "sur";
    state.screen = "historia";
    render();
  }

  function openKnigge() {
    dismissBadgeToast();
    state.screen = "knigge";
    render();
  }

  function openRegatear() {
    dismissBadgeToast();
    state.screen = "regatear";
    render();
  }

  function openLogistica() {
    dismissBadgeToast();
    state.screen = "logistica";
    render();
  }

  function openSalud() {
    dismissBadgeToast();
    state.screen = "salud";
    render();
  }

  function selectCountry(id) {
    state.countryId = id;
    render();
  }

  // ----- Statistik-Navigation -----
  function goStats() {
    dismissBadgeToast();
    state.screen = "stats";
    render();
  }

  function setStatsFilter(filter) {
    state.statsFilter = filter;
    render();
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
    state.screen = "card";
    render();
  }

  // Genau diese eine Karte üben (von der Detailseite aus).
  function studyOne(id) {
    const card = cardById(id);
    if (!card) return;
    dismissBadgeToast();
    state.scopeId = card.cat;
    state.queue = [id];
    state.total = 1;
    state.revealed = false;
    state.contextOpen = false;
    state.typeResult = null;
    state.screen = "study";
    render();
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
    state.screen = "editor";
    render();
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
      icon: b.icon,
      name: b.name,
      text: b.unlockedText || b.description,
      groupLabel: grp ? grp.label : "",
      groupIcon: grp ? grp.icon : "🎖️",
      unlocked: all.filter((x) => x.unlocked).length,
      total: all.length,
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
  };

  function shareTips(cat, idx) {
    if (!share) return;
    const src = cat === "knigge" ? (knigge && knigge.TOPICS)
              : cat === "regatear" ? (regatear && regatear.TIPS)
              : cat === "logistica" ? (logistica && logistica.TOPICS)
              : cat === "salud" ? (salud && salud.TOPICS)
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
      title: o.title || meta.kicker,
      intro: o.intro || "",
      lines,
      accent: meta.accent,
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
    supervivencia: { icon: "🆘", title: "Supervivencia",       sub: "discover.subSupervivencia", accent: ["#B5302A", "#CE463E"] },
    hostel:        { icon: "🛏️", title: "Modo hostal",         sub: "discover.subHostel",        accent: ["#C25A45", "#8E4FA8"] },
    definiciones:  { icon: "🧩", title: "Definiciones",         sub: "discover.subDefiniciones",  accent: ["#3F7355", "#2F6B70"] },
    frases:        { icon: "🧱", title: "Frases flexibles",     sub: "discover.subFrases",        accent: ["#7048E8", "#5A3FB8"] },
    dialogos:      { icon: "💬", title: "Diálogos",             sub: "discover.subDialogos",      accent: ["#9B5A8C", "#5A4FA8"] },
    regatear:      { icon: "🤝", title: "Regatear",             sub: "discover.subRegatear",      accent: ["#B97C24", "#3F7355"] },
    precios:       { icon: "💵", title: "Precios al oído",      sub: "discover.subPrecios",       accent: ["#5E7D3A", "#76954E"] },
    cuerpo:        { icon: "🧍", title: "El Cuerpo",            sub: "discover.subCuerpo",        accent: ["#2E6E86", "#7D4A8E"] },
    compras:       { icon: "🛒", title: "Lista de compras",     sub: "discover.subCompras",       accent: ["#3F7355", "#B97C24"] },
    conjugacion:   { icon: "🔁", title: "Conjugación",          sub: "discover.subConjugacion",   accent: ["#4C5FA8", "#2B7A78"] },
    tiempos:       { icon: "⏳", title: "Tiempos",              sub: "discover.subTiempos",       accent: ["#3E7CA8", "#5A9BC4"] },
    paises:        { icon: "🌎", title: "Países y culturas",    sub: "discover.subInfo",          accent: ["#B97C24", "#C2502E"] },
    knigge:        { icon: "🧭", title: "Etiqueta de viaje",    sub: "discover.subKnigge",        accent: ["#3F6B8E", "#6B4FA8"] },
    logistica:     { icon: "🧳", title: "Logística de viaje",   sub: "discover.subLogistica",     accent: ["#2F6B70", "#B97C24"] },
    salud:         { icon: "🥗", title: "Salud y energía",      sub: "discover.subSalud",         accent: ["#2F8E5B", "#76954E"] },
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

    if (action === "set-mode") setMode(el.dataset.mode);
    else if (action === "set-speech-rate") setSpeechRate(Number(el.dataset.rate));
    else if (action === "toggle-theme") toggleTheme();
    else if (action === "set-dir") setDir(el.dataset.dir);
    else if (action === "set-ui-lang") setUiLang(el.dataset.lang);
    else if (action === "set-level") toggleLevel(Number(el.dataset.level));
    else if (action === "study-all") startStudy("all");
    else if (action === "open-category") startStudy(el.dataset.id);
    else if (action === "ruta-del-dia") openRutaDelDia();
    else if (action === "trip-edit") toggleTripEdit();
    else if (action === "trip-clear") clearTripGoal();
    else if (action === "manage-trip") openTripManage();
    else if (action === "skip-onboarding") finishOnboarding();
    else if (action === "resume-last") resumeLast();
    else if (action === "set-tab") setTab(el.dataset.tab);
    else if (action === "open-search") openSearch();
    else if (action === "search-clear") clearSearch();
    else if (action === "search-country") openSearchCountry(el.dataset.id);
    else if (action === "flip") flip();
    else if (action === "toggle-context") toggleContext();
    else if (action === "rate") rate(el.dataset.rating);
    else if (action === "skip") skip();
    else if (action === "speak") speakCurrent();
    else if (action === "open-stats") goStats();
    else if (action === "open-badges") openBadges();
    else if (action === "open-info") openInfo();
    else if (action === "open-historia") openHistoria("sur");
    else if (action === "open-historia-centro") openHistoria("centro");
    else if (action === "open-knigge") openKnigge();
    else if (action === "open-regatear") openRegatear();
    else if (action === "open-logistica") openLogistica();
    else if (action === "open-salud") openSalud();
    else if (action === "set-stats-filter") setStatsFilter(el.dataset.filter);
    else if (action === "reset-progress") resetProgress();
    else if (action === "open-card") openCard(el.dataset.id, el.dataset.back || "stats");
    else if (action === "study-one") studyOne(el.dataset.id);
    else if (action === "card-back") (state.backTo === "home" ? goHome() : state.backTo === "search" ? openSearch() : goStats());
    else if (action === "open-editor") openEditor();
    else if (action === "export-data") exportData();
    else if (action === "import-data") startImport();
    else if (action === "dismiss-notice") el.remove();
    else if (action === "dismiss-update") dismissUpdateNotice();
    else if (action === "reload-app") location.reload();
    else if (action === "apply-update") applyUpdate();
    else if (action === "dismiss-sw-update") dismissSwUpdate();
    else if (action === "upd-stop") { /* Klick auf die Hinweis-Karte: nicht schließen */ }
    else if (action === "install-app") installApp();
    else if (action === "delete-card") deleteCard(el.dataset.id);
    else if (action === "share-stats") shareStats();
    else if (action === "share-card") shareCard();
    else if (action === "share-historia") shareHistoria(el.dataset.id);
    else if (action === "share-hist-module") shareHistModule();
    else if (action === "share-tips") shareTips(el.dataset.cat, Number(el.dataset.idx));
    else if (action === "share-country") shareCountry();
    else if (action === "share-module") shareModule(el.dataset.mod);
    else if (action === "share-badge") shareBadge(el.dataset.id);
    else if (action === "set-share-format") setShareFormat(el.dataset.format);
    else if (action === "open-hostel") openHostel();
    else if (action === "open-battle-setup") openBattleSetup();
    else if (action === "set-battle-length") setBattleLength(Number(el.dataset.len));
    else if (action === "start-battle") startBattle(el.dataset.scene);
    else if (action === "battle-reveal") battleReveal();
    else if (action === "battle-score") battleScore(Number(el.dataset.points));
    else if (action === "battle-sudden-death") battleSuddenDeath();
    else if (action === "battle-again") battleAgain();
    else if (action === "challenge-done") markChallengeDone(el.dataset.id);
    else if (action === "open-roleplay-setup") openRoleplaySetup();
    else if (action === "start-roleplay") startRoleplay(el.dataset.id);
    else if (action === "roleplay-swap") roleplaySwap();
    else if (action === "open-quiz-setup") openQuizSetup();
    else if (action === "start-quiz") startQuiz(el.dataset.set);
    else if (action === "quiz-answer") answerQuiz(el.dataset.id);
    else if (action === "quiz-next") nextQuiz();
    else if (action === "quiz-again") quizAgain();
    else if (action === "open-cuerpo") openCuerpo();
    else if (action === "open-conjugacion") openConjugacion();
    else if (action === "open-tiempos") openTiempos();
    else if (action === "cuerpo-select") { if (Date.now() - bpDragEndAt >= 350) selectBodyPart(el.dataset.id); }
    else if (action === "cuerpo-rotate") rotateBody(Number(el.dataset.dir));
    else if (action === "cuerpo-speak") speakBodyPart();
    else if (action === "open-spickzettel") openSpickzettel();
    else if (action === "sz-show") szShow(el.dataset.id);
    else if (action === "sz-close") szClose();
    else if (action === "speak-card") speakCardId(el.dataset.id);
    else if (action === "open-precios") openPrecios();
    else if (action === "precios-currency") setPreciosCurrency(el.dataset.id);
    else if (action === "precios-level") setPreciosLevel(el.dataset.level);
    else if (action === "start-precios") startPrecios();
    else if (action === "precios-next") nextPrecios();
    else if (action === "precios-again") preciosAgain();
    else if (action === "precios-setup") openPrecios();
    else if (action === "precios-speak") speakPrecios();
    else if (action === "open-frases") openFrasesSetup();
    else if (action === "start-frases") startFrases(el.dataset.set);
    else if (action === "frases-answer") answerFrases(Number(el.dataset.idx));
    else if (action === "frases-next") nextFrases();
    else if (action === "frases-again") frasesAgain();
    else if (action === "open-conjug-drill") openConjugDrill();
    else if (action === "conjug-level") setConjugLevel(el.dataset.level);
    else if (action === "start-conjug") startConjug();
    else if (action === "conjug-next") nextConjug();
    else if (action === "conjug-again") conjugAgain();
    else if (action === "open-dialogos") openDialogosSetup();
    else if (action === "start-dialogos") startDialogos(el.dataset.id);
    else if (action === "dialogos-answer") answerDialogosMc(Number(el.dataset.idx));
    else if (action === "dialogos-next") advanceDialogos();
    else if (action === "dialogos-hint") dialogosHint();
    else if (action === "dialogos-again") dialogosAgain();
    else if (action === "dialogos-speak") speakDialogosNpc();
    else if (action === "open-compras") openCompras();
    else if (action === "compras-section") comprasSection(el.dataset.id);
    else if (action === "compras-pick") comprasPick(el.dataset.id);
    else if (action === "compras-toggle") comprasToggle(el.dataset.id);
    else if (action === "compras-speak") speakCompras(el.dataset.id);
    else if (action === "compras-speak-phrase") speakComprasPhrase(el.dataset.say);
    else if (action === "open-compras-quiz") openComprasQuiz();
    else if (action === "compras-quiz-answer") answerComprasQuiz(Number(el.dataset.idx));
    else if (action === "compras-quiz-next") nextComprasQuiz();
    else if (action === "compras-quiz-again") comprasQuizAgain();
    else if (action === "compras-back-list") comprasBackToList();
    else if (action === "home") goHome();
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
    // Preis-Hörtrainer: getippte Ziffern prüfen.
    if (e.target.closest('[data-action="submit-precios"]')) {
      e.preventDefault();
      const input = document.getElementById("precios-answer");
      submitPrecios(input ? input.value : "");
      return;
    }
    // Trip-Ziel speichern (Datum + Tagesziel + optionales Reiseziel). Beim
    // Onboarding schließt ein erfolgreiches Speichern den Willkommens-Schritt ab.
    if (e.target.closest('[data-action="save-trip"]')) {
      e.preventDefault();
      const val = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
      const onboarding = state.screen === "onboarding";
      const ok = setTripGoal({ destination: val("trip-dest"), endDate: val("trip-date"), perDay: val("trip-perday") });
      if (ok && onboarding) finishOnboarding();
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

  // Dropdown-Auswahl (Länderkunde) – <select> meldet sich über 'change', nicht 'click'.
  function onChange(e) {
    // Backup-Import: verstecktes file-input im Profil-Reiter.
    if (e.target && e.target.id === "import-file") {
      const file = (e.target.files && e.target.files[0]) || null;
      e.target.value = ""; // erlaubt erneuten Import derselben Datei
      handleImportFile(file);
      return;
    }
    // Profil-Name still sichern, sobald das Feld verlassen wird (auch ohne
    // „Speichern"). Kein Re-Render hier, damit ein direkt danach getippter Knopf
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
      return;
    }
    const el = e.target.closest('[data-action="select-country"]');
    if (!el) return;
    selectCountry(el.value);
  }

  function onKeydown(e) {
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
      })
      .catch((err) => console.warn("Service Worker nicht registriert", err));
  }

  // Wartenden Worker vormerken und das "Neue Version – jetzt laden"-Banner zeigen.
  function markUpdateReady(worker) {
    state.swWaiting = worker || state.swWaiting;
    if (state.swUpdate) return; // Banner schon sichtbar
    state.swUpdate = true;
    render();
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
  //   ?m=<modul>  – öffnet ein empfohlenes Modul (aus einem „Modul teilen"-Link)
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
      ruta: openRutaDelDia,   // ?a=ruta   → heutige Lernrunde
      buscar: openSearch,     // ?a=buscar → Suche
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
      conjugacion: openConjugacion,
      tiempos: openTiempos,
      paises: openInfo,
      knigge: openKnigge,
      logistica: openLogistica,
      salud: openSalud,
      historia: () => openHistoria("sur"),
      "historia-centro": () => openHistoria("centro"),
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
      state.screen = "onboarding";
    }
  }
  // Deep-Link aus einem geteilten „Modul teilen"-Link hat Vorrang vor Startseite/
  // Onboarding. applyModuleDeepLink() rendert beim Treffer selbst; das abschließende
  // render() deckt zusätzlich die Fälle ab, in denen ein Opener vorab abbricht
  // (z.B. Precios ohne Sprachausgabe) – so bleibt der Bildschirm nie leer.
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
