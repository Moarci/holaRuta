/*
 * app.js  (SC.app) – Controller. Hält den Zustand, verbindet Module und
 * verdrahtet Events. Datenfluss: data → srs/matcher → hier → ui.
 * UI-Buttons tragen data-action; hier wird zentral darauf reagiert (Delegation).
 */
(function () {
  "use strict";

  const { data, srs, matcher, store, ui, stats } = window.SC;
  const numbers = window.SC.numbers || null; // Zahl→Wort & Preis-Generator (Precios al oído)
  const badges = window.SC.badges || null; // optional – Badge-System ("Ruta-Pass")
  const speech = window.SC.speech || null; // optional – Browser kann Ausgabe ggf. nicht
  const share = window.SC.share || null;   // optional – Sharepic teilen/herunterladen
  const userCards = window.SC.userCards || null; // eigene Karten (optional)
  const countries = window.SC.countries || null; // Länderkunde-Infoseite (optional)
  const knigge = window.SC.knigge || null;       // Reise-Knigge (Verhalten unterwegs, optional)
  const frases = window.SC.frases || null;       // Satzbaukasten-Daten (optional)
  const regatear = window.SC.regatear || null;   // Verhandeln/Feilschen-Modul (optional)
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

  const state = {
    screen: "home",          // 'home' | 'study' | 'done' | 'stats' | 'card' | 'hostel' | 'battleSetup' | 'battle' | 'battleDone' | 'roleplaySetup' | 'roleplay' | 'quizSetup' | 'quiz' | 'quizDone' | 'cuerpo' | 'conjugacion' | 'tiempos' | 'spickzettel' | 'preciosSetup' | 'precios' | 'preciosDone' | 'frasesSetup' | 'frases' | 'frasesDone' | 'compras' | 'comprasQuiz' | 'comprasQuizDone' | 'knigge' | 'regatear'
    homeTab: ["lernen", "entdecken", "profil"].includes(settings.homeTab) ? settings.homeTab : "lernen", // aktiver Start-Reiter
    // 'flip' | 'type' | 'listen'. Hör-Modus nur, wenn der Browser TTS kann –
    // sonst (z.B. aus fremdem Gerät importiert) zurück auf Sprechen.
    mode: (settings.mode === "listen" && !(speech && speech.isSupported())) ? "flip" : (settings.mode || "flip"),
    dir: settings.dir === "es2de" ? "es2de" : "de2es", // Lernrichtung: DE→ES (Standard) | ES→DE
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
    // ----- El Cuerpo (drehbares 3D-Körpermodell) -----
    bodyPartId: null,        // aktuell angetipptes Körperteil (Id) | null
    bodyYaw: -22,            // Drehung der Figur um die Hochachse (Grad)
    bodyPitch: -6,           // Neigung der Figur (Grad), begrenzt ±32
    // ----- Einkaufszettel (interaktive Einkaufsliste) -----
    compras: { section: "super", open: null }, // aktuelle Rubrik + aufgeklapptes Item (Id|null)
    comprasQuiz: null,       // { section, queue:[itemId…], idx, total, options:[{es,correct}…], selected:idx|null, correct }
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
      return new Date(ms).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return "—"; }
  }
  // Nächste Fälligkeit relativ zu jetzt: "fällig", "heute", "morgen", "in N Tagen".
  function fmtDue(ms) {
    if (!ms) return "fällig";
    const diff = ms - Date.now();
    if (diff <= 0) return "fällig";
    const days = Math.round(diff / DAY_MS);
    if (days <= 0) return "heute";
    if (days === 1) return "morgen";
    return `in ${days} Tagen`;
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
      return { id: c.id, label: c.label, icon: c.icon, grad: c.grad,
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
      id: l.id, label: l.label, short: l.short, color: l.color,
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
      if (c && due > 0) lastCat = { id: c.id, label: c.label, icon: c.icon, due };
    }
    return {
      mode: state.mode,
      dir: state.dir,
      theme: effectiveTheme(),
      allLevels: state.levels.length === 0,
      levels,
      categories: sortedCategories,
      totalDue: dueIn(all).length,
      sessionCap: SESSION_CAP,
      totalCards: all.length,
      hasBadges: !!badges,       // Offline-Guard: Nav-Eintrag nur mit geladenem Modul
      hasCountries: !!countries, // dito für die Länderkunde
      hasKnigge: !!knigge,       // dito für den Reise-Knigge
      hasSpeech: !!(speech && speech.isSupported()), // Precios braucht Sprachausgabe
      hasFrases: !!frases,       // Satzbaukasten braucht das frases-Modul
      hasRegatear: !!regatear,   // Verhandeln-Modul (Regatear)
      badgeCount: badges ? Object.keys(gamestats.unlocked || {}).length : 0,
      streak: currentStreak(),
      overall: {
        mastered: overall.mastered,
        total: overall.total,
        pct: overall.total ? Math.round((overall.mastered / overall.total) * 100) : 0,
      },
      lastCat,
      setupOpen: setupOpenDefault(),
      tab: state.homeTab,
      install: installVM(),
    };
  }

  // „Auf den Startbildschirm"-Hinweis fürs Profil. Leer, wenn die App schon
  // installiert ist oder als Einzeldatei läuft (siehe install.js).
  function installVM() {
    const inst = window.SC && window.SC.install;
    if (!inst || !inst.shouldOffer()) return { show: false };
    return {
      show: true,
      canPrompt: inst.canPrompt(),
      hint: 'Tippe unten in der Leiste auf „Teilen" und dann auf „Zum Home-Bildschirm" – schon hast du HolaRuta als App-Icon, ganz ohne Datei-Suchen, auch offline.',
    };
  }

  function studyVM() {
    const card = cardById(state.queue[0]);
    const cat = categoryById(card.cat);
    const isAll = state.scopeId === "all";
    const lvl = levelById(card.lvl);
    // Lernrichtung: DE→ES zeigt Deutsch als Frage und Spanisch als Antwort;
    // ES→DE dreht das um. Die Aussprache-Tipps gehören immer zum Spanischen.
    const spanishIsQuestion = state.dir === "es2de";
    return {
      mode: state.mode,
      dir: state.dir,
      card,
      question: spanishIsQuestion ? card.es : card.de,
      answer: spanishIsQuestion ? card.de : card.es,
      es: card.es, // Hör-Modus deckt immer das Spanische auf (richtungsunabhängig)
      de: card.de, // dazu die deutsche Bedeutung als Verständnis-Hilfe
      spanishIsQuestion,
      tip: card.tip || null,
      level: lvl ? { label: lvl.label, short: lvl.short, color: lvl.color } : null,
      catLabel: isAll ? "Alle Bereiche" : (cat ? cat.label : ""),
      catIcon: isAll || !cat ? "📚" : cat.icon,
      accent: isAll || !cat ? DEFAULT_ACCENT : cat.grad,
      position: state.total - state.queue.length,
      total: state.total,
      revealed: state.revealed,
      typeResult: state.typeResult,
      context: card.context || null,
      contextOpen: state.contextOpen,
      swatch: card.swatch || null,
    };
  }

  function doneVM() {
    const isAll = state.scopeId === "all";
    const cat = categoryById(state.scopeId);
    return { scopeLabel: isAll ? "Alle Bereiche" : (cat ? cat.label : "") };
  }

  // Eine Karte für Listen/Detail aufbereiten (Karte + Statistik + Anzeige-Texte).
  function cardRowVM(card) {
    const cat = categoryById(card.cat);
    const lvl = levelById(card.lvl);
    const s = stats.cardSummary(progress[card.id]);
    return {
      id: card.id,
      de: card.de,
      es: card.es,
      tip: card.tip || null,
      catLabel: cat ? cat.label : "",
      catIcon: cat ? cat.icon : "📚",
      accent: cat ? cat.grad : DEFAULT_ACCENT,
      level: lvl ? { label: lvl.label, short: lvl.short, color: lvl.color } : null,
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
        { id: "answered", label: "Beantwortet", count: ov.seenCards },
        { id: "hard", label: "Schwierig", count: ov.hard },
        { id: "mastered", label: "Gemeistert", count: ov.mastered },
        { id: "new", label: "Neu", count: ov.neu },
        { id: "all", label: "Alle", count: ov.total },
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
      context: card.context || null,
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
    return { country, groups };
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
      title: t.title,
      intro: t.intro,
      dos: t.dos,
      donts: t.donts,
      accent: accents[t.id] || "",
    }));
    return { country, groups, topics };
  }

  // Regatear: Verhandeln/Feilschen – reine Anzeige-Seite (Taktik, Sätze,
  // Einheiten, Rollenspiele). Reicht die Daten 1:1 durch, hängt nur an den
  // Rollenspielen das Kurz-Label der Schwierigkeitsstufe an.
  function regatearVM() {
    if (!regatear) return { intro: "", tips: [], phrases: [], units: [], roleplays: [] };
    const roleplays = (regatear.ROLEPLAYS || []).map((r) => {
      const lvl = levelById(r.level);
      return Object.assign({}, r, { lvlShort: lvl ? lvl.short : "" });
    });
    return {
      intro: regatear.INTRO,
      tips: regatear.TIPS || [],
      phrases: regatear.PHRASES || [],
      units: regatear.UNITS || [],
      roleplays,
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

  // Einstellungs-Panel des Lernen-Reiters: standardmäßig zu (Set-once-
  // Einstellungen), offen nur, wenn der Nutzer es selbst aufgeklappt hat.
  function setupOpenDefault() {
    return settings.setupOpen === true;
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
    state.badgeToast = list;
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
          id: g.id, label: g.label, icon: g.icon,
          badges: list,
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
    { value: 6, label: "Kurz" },
    { value: 10, label: "Mittel" },
    { value: 20, label: "Lang" },
  ];

  // Gerade Rundenzahl (A,B,A,B…); bei nur 1 Aufgabe bleibt 1 Runde.
  const evenRounds = (n) => (n - (n % 2)) || n;

  function battleSetupVM() {
    const scenes = data.BATTLE_SCENES
      .map((s) => {
        const count = data.BATTLES.filter((b) => b.scene === s.id).length;
        return { id: s.id, label: s.label, icon: s.icon, count,
          rounds: evenRounds(Math.min(state.battleLength, count)) };
      })
      .filter((s) => s.count > 0);
    // Object.assign statt Objekt-Spread: die App verspricht ES2017 (Spread auf
    // Objekten ist ES2018 und wirft auf alten WebViews einen SyntaxError).
    const lengths = BATTLE_LENGTHS.map((l) => Object.assign({}, l, { selected: l.value === state.battleLength }));
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
    return n && n.trim() ? n.trim() : "Spieler " + side;
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
      sceneLabel: b.sceneId === "all" ? "Alle Szenen" : (scene ? scene.label : ""),
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
      promptDe: prompt ? prompt.promptDe : "",
      answerEs: prompt ? prompt.answerEs : "",
      alsoOk,
      levelShort: lvl ? lvl.short : "",
      hint: prompt ? prompt.hint : "",
    };
  }

  function battleDoneVM() {
    const b = state.battle;
    const a = b.scores.A, bb = b.scores.B;
    const winner = a === bb ? "tie" : (a > bb ? "A" : "B");
    return {
      sceneLabel: b.sceneId === "all" ? "Alle Szenen"
        : ((data.BATTLE_SCENES.find((s) => s.id === b.sceneId) || {}).label || ""),
      scores: b.scores,
      rounds: b.totalRounds,
      winner,
      nameA: playerName(b, "A"),
      nameB: playerName(b, "B"),
      winnerName: winner === "tie" ? "" : playerName(b, winner),
      suddenDeath: !!b.suddenDeath, // lief schon eine Stichrunde? (Label „noch eine")
      challenge: b.challenge, // { id, textDe, phraseEs } | null
      challengeDone: !!(b.challenge && gamestats.challengesDone && gamestats.challengesDone[b.challenge.id]),
    };
  }

  function roleplaySetupVM() {
    return {
      scenes: data.ROLEPLAYS.map((r) => {
        const lvl = levelById(r.level);
        return { id: r.id, title: r.title, roleA: r.roles.a, roleB: r.roles.b,
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
      title: r.title,
      lvlShort: lvl ? lvl.short : "",
      situationDe: r.situationDe,
      swapped,
      roleA: { name: swapped ? r.roles.b : r.roles.a, goal: swapped ? r.goalB : r.goalA },
      roleB: { name: swapped ? r.roles.a : r.roles.b, goal: swapped ? r.goalA : r.goalB },
      dialogue: r.dialogue.map((d) => ({
        speaker: swapped ? (d.speaker === "A" ? "B" : "A") : d.speaker,
        de: d.de, es: d.es,
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
      .map((d) => ({ id: d.id, es: d.es, de: d.de, icon: d.icon }));
  }

  function quizSetupVM() {
    return {
      sets: data.QUIZ_SETS.map((s) => {
        const lvl = levelById(s.lvl);
        return { id: s.id, label: s.label, icon: s.icon, intro: s.intro,
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
      id: o.id, es: o.es, de: o.de, icon: o.icon,
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
      solutionDe: def.de,
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
      guide: data.TENSES,
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
      return { id: s.id, label: s.label, icon: s.icon, intro: s.intro,
        count: frasesForSet(s.id).length, lvlShort: lvl ? lvl.short : "" };
    });
    return {
      sets,
      mixed: { id: FRASES_ALL, label: "Gemischt", icon: "🎲",
        intro: "Alle Themen bunt gemischt – die volle Runde.",
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
    if (setId === FRASES_ALL) return { label: "Gemischt", icon: "🎲" };
    const s = frasesSetById(setId);
    return { label: s ? s.label : "", icon: s ? s.icon : "🧱" };
  }

  function frasesVM() {
    const f = state.frases;
    const frame = frasesById(f.queue[f.idx]);
    const answered = f.selected !== null;
    const info = frasesSetInfo(f.setId);
    const options = f.options.map((o, i) => ({
      es: o.es, de: o.de,
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
      targetDe: frame ? frame.targetDe : "",
      options, answered,
      isCorrect: answered && !!(f.options[f.selected] && f.options[f.selected].correct),
      solutionEs: sol.es, solutionDe: sol.de,
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

  // ----- El Cuerpo: interaktive Körperkarte -----
  const bodyPartById = (id) => data.BODY_PARTS.find((p) => p.id === id) || null;

  function cuerpoVM() {
    const selId = state.bodyPartId;
    const parts = data.BODY_PARTS.map((p) => ({
      id: p.id, de: p.de, x: p.x, y: p.y,
      selected: p.id === selId,
      seen: !!(gamestats.bodyPartsSeen && gamestats.bodyPartsSeen[p.id]),
    }));
    const sel = bodyPartById(selId);
    return {
      parts,
      selected: sel ? { id: sel.id, es: sel.es, de: sel.de, tip: sel.tip, note: sel.note } : null,
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
    if (speech && speech.isSupported()) speech.speak(part.es);
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
    if (part && speech && speech.isSupported()) speech.speak(part.es);
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

  function comprasVM() {
    const curId = state.compras.section;
    const sec = shoppingSectionById(curId) || shoppingSections()[0];
    const seen = gamestats.shoppingSeen || {};
    const sections = shoppingSections().map((s) => ({
      id: s.id, icon: s.icon, label: s.label, de: s.de,
      active: s.id === sec.id, total: s.items.length, done: shoppingSectionDone(s),
    }));
    const items = sec.items.map((it) => ({
      id: it.id, de: it.de, es: it.es, tip: it.tip, note: it.note,
      open: state.compras.open === it.id, seen: !!seen[it.id],
    }));
    return {
      sections,
      section: { id: sec.id, icon: sec.icon, label: sec.label, de: sec.de, grad: sec.grad },
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

  // Ein Item antippen: auf-/zuklappen. Beim Aufklappen Wort vorlesen und
  // (einmalig) als „abgehakt" für den Fortschritt vermerken.
  function comprasPick(id) {
    const item = shoppingItemById(id);
    if (!item) return;
    const opening = state.compras.open !== id;
    state.compras = { section: state.compras.section, open: opening ? id : null };
    if (opening) {
      buzz(8);
      recordShoppingView(id);
    }
    render();
    if (opening && speech && speech.isSupported()) speech.speak(item.es);
  }

  // Distinkt abgehaktes Item persistent vermerken (No-Op bei erneutem Antippen).
  function recordShoppingView(id) {
    if (!id || (gamestats.shoppingSeen && gamestats.shoppingSeen[id])) return;
    const seen = Object.assign({}, gamestats.shoppingSeen, { [id]: true });
    gamestats = Object.assign({}, gamestats, { shoppingSeen: seen });
    store.saveGameStats(gamestats);
  }

  // 🔊-Knopf im aufgeklappten Item: das spanische Wort (er-)neut vorlesen.
  function speakCompras(id) {
    const item = shoppingItemById(id);
    if (item && speech && speech.isSupported()) speech.speak(item.es);
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

  // ----- Rendern -----
  function render() {
    if (state.screen === "study") root.innerHTML = ui.renderStudy(studyVM());
    else if (state.screen === "done") root.innerHTML = ui.renderDone(doneVM());
    else if (state.screen === "stats") root.innerHTML = ui.renderStats(statsVM());
    else if (state.screen === "card") root.innerHTML = ui.renderCard(cardVM());
    else if (state.screen === "editor") root.innerHTML = ui.renderEditor(editorVM());
    else if (state.screen === "info") root.innerHTML = ui.renderInfo(infoVM());
    else if (state.screen === "knigge") root.innerHTML = ui.renderKnigge(kniggeVM());
    else if (state.screen === "regatear") root.innerHTML = ui.renderRegatear(regatearVM());
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
    else if (state.screen === "compras") root.innerHTML = ui.renderCompras(comprasVM());
    else if (state.screen === "comprasQuiz") root.innerHTML = ui.renderComprasQuiz(comprasQuizVM());
    else if (state.screen === "comprasQuizDone") root.innerHTML = ui.renderComprasQuizDone(comprasQuizDoneVM());
    else root.innerHTML = ui.renderHome(homeVM());

    // Glückwunsch-Einblendung als eigene Ebene über den aktuellen Screen.
    if (badges && state.badgeToast && state.badgeToast.length) {
      root.insertAdjacentHTML("afterbegin", ui.badgeToast(state.badgeToast));
    }

    // „Was ist neu?"-Hinweis nach einem Update – oberste Ebene (Scrim + Karte).
    if (state.updateNotice && state.updateNotice.length) {
      root.insertAdjacentHTML("afterbegin", ui.updateNotice(state.updateNotice));
    }

    // 3D-Körpermodell nach dem Render verdrahten (Elemente neu, Drehung erhalten).
    if (state.screen === "cuerpo") cuerpoInit3D();

    manageFocus();
    maybeAutoSpeak();
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
    if (target.text) speech.speak(target.text);
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
      flipEl.setAttribute("aria-label", state.revealed ? "Karte ist umgedreht – tippen zum Zurückdrehen" : "Karte umdrehen");
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
      if (btn.dataset.ctxText) btn.textContent = open ? "🧭 Kontext ausblenden" : "🧭 Kontext";
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
    // Richtung: ES→DE erwartet die deutsche Antwort, DE→ES die spanische.
    const field = state.mode === "listen" ? "es" : (state.dir === "es2de" ? "de" : "es");
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
    showNotice("Speichern fehlgeschlagen – Speicher voll?");
  }

  function setMode(mode) {
    state.mode = mode;
    state.contextOpen = false;
    settings = Object.assign({}, settings, { mode });
    store.saveSettings(settings);
    render();
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

  // Lernrichtung umschalten (DE→ES / ES→DE) und merken.
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

  // Einstellungs-Panel der Startseite auf-/zuklappen und die Wahl merken.
  function toggleSetup() {
    settings = Object.assign({}, settings, { setupOpen: !setupOpenDefault() });
    store.saveSettings(settings);
    render();
  }

  // Start-Reiter wechseln (Lernen / Entdecken / Profil) und merken.
  function setTab(tab) {
    const valid = tab === "entdecken" || tab === "profil" ? tab : "lernen";
    state.homeTab = valid;
    settings = Object.assign({}, settings, { homeTab: valid });
    store.saveSettings(settings);
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
  // Kuratierte Überlebens-Bereiche: je Kategorie die wichtigsten Karten, gedeckelt.
  // Bewusst per Kategorie + Cap statt fester IDs, damit es mit der Datenbasis mitwächst.
  const SPICKZETTEL_GROUPS = [
    { cat: "notfall", limit: 10 },
    { cat: "basics",  limit: 10 },
    { cat: "rumbo",   limit: 6 },
    { cat: "dinero",  limit: 6 },
  ];

  function spickzettelVM() {
    const groups = SPICKZETTEL_GROUPS.map((g) => {
      const cat = categoryById(g.cat);
      const cards = data.CARDS
        .filter((c) => c.cat === g.cat)
        .slice(0, g.limit)
        .map((c) => ({ id: c.id, de: c.de, es: c.es, tip: c.tip || null }));
      return {
        id: g.cat,
        label: cat ? cat.label : g.cat,
        icon: cat ? cat.icon : "📌",
        grad: cat ? cat.grad : DEFAULT_ACCENT,
        cards,
      };
    }).filter((g) => g.cards.length);
    return { groups, speakable: !!(speech && speech.isSupported()) };
  }

  function openSpickzettel() {
    dismissBadgeToast();
    state.screen = "spickzettel";
    render();
  }

  // Eine beliebige Karte per Id vorlesen (Spickzettel / Listen außerhalb der
  // Lern-Sitzung). Erste akzeptierte Variante, damit "/"-Alternativen sauber klingen.
  function speakCardId(id) {
    if (!speech) return;
    const card = cardById(id);
    if (!card) return;
    speech.speak(matcher.acceptedAnswers(card)[0] || card.es);
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
        key: c.key, flag: c.flag, name: c.name, code: c.code, note: c.note,
        selected: c.key === curKey,
      })) : [],
      levels: numbers ? numbers.LEVELS.map((l) => ({
        id: l.id, short: l.short, label: l.label, hint: l.hint, active: l.id === lvl,
      })) : [],
      // Beispiel-Spanne der aktuellen Wahl (gibt eine Vorstellung der Größenordnung).
      sample: numbers ? (() => {
        const c = numbers.currency(curKey);
        const tier = numbers.tierFor(c, lvl);
        return { flag: c.flag, name: c.name, max: numbers.format(tier.max), one: c.one, many: c.many };
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
      currencyName: cur.name,
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
      currencyName: cur.name,
      levelLabel: lvl ? lvl.label : "",
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
    if (item) speech.speak(item.es);
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
  function openInfo() {
    dismissBadgeToast();
    state.screen = "info";
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
    const ok = confirmAsk("Wirklich den gesamten Lernfortschritt löschen?\nDas kann nicht rückgängig gemacht werden.");
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
      categories: data.CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
      levels: data.LEVELS.map((l) => ({ id: l.id, label: l.label, short: l.short })),
      msg: editorMsg,
      cards: cards.map((c) => {
        const cat = categoryById(c.cat);
        const lvl = levelById(c.lvl);
        return {
          id: c.id, de: c.de, es: c.es, tip: c.tip,
          catIcon: cat ? cat.icon : "🗂️",
          catLabel: cat ? cat.label : c.cat,
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
      editorMsg = { type: "ok", text: `„${card.de}" → „${card.es}" gespeichert ✓` };
      buzz(12);
    }
    render();
  }

  function deleteCard(id) {
    if (!userCards) return;
    const ok = confirmAsk("Diese eigene Karte wirklich löschen?\nDer Lernfortschritt dieser Karte geht verloren.");
    if (!ok) return;
    userCards.remove(id);
    // Lernfortschritt dieser Karte mit entfernen (verwaiste Einträge vermeiden).
    if (progress[id]) {
      const next = Object.assign({}, progress);
      delete next[id];
      progress = next;
      store.saveProgress(progress);
    }
    editorMsg = { type: "ok", text: "Karte gelöscht." };
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
      showNotice("Export fehlgeschlagen.");
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
        showNotice("Import fehlgeschlagen – das ist kein HolaRuta-Backup.");
        return;
      }
      const ok = confirmAsk("Backup importieren?\nDein aktueller Stand auf diesem Gerät wird überschrieben.");
      if (!ok) return;
      if (store.importData(payload) > 0) {
        try { location.reload(); } catch (e) { /* egal */ }
      } else {
        showNotice("Import fehlgeschlagen – keine bekannten Daten in der Datei.");
      }
    };
    reader.onerror = () => showNotice("Import fehlgeschlagen – Datei konnte nicht gelesen werden.");
    reader.readAsText(file);
  }

  // Spricht die spanische Antwort der aktuellen Karte vor.
  // Erste akzeptierte Variante (ohne "/"-Alternativen), damit es sauber klingt.
  function speakCurrent() {
    if (!speech) return;
    const card = cardById(state.queue[0]);
    if (!card) return;
    const primary = matcher.acceptedAnswers(card)[0] || card.es;
    speech.speak(primary);
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
      de: card.de,
      es: card.es,
      tip: card.tip || null,
      catLabel: cat ? cat.label : "",
      catIcon: cat ? cat.icon : "📚",
      accent: cat ? cat.grad : DEFAULT_ACCENT,
      levelLabel: lvl ? `${lvl.short} · ${lvl.label}` : null,
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

  // ----- Event-Verdrahtung (zentral, Delegation) -----
  // Eine verbrauchte Wischgeste erzeugt am Smartphone ~300 ms später einen
  // synthetischen Klick. Ohne Schutz würde dieser ggf. ein zweites rate() auslösen.
  let lastSwipeAt = 0;

  function onClick(e) {
    if (Date.now() - lastSwipeAt < 600) return; // synthetischen Klick nach Wisch ignorieren
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;

    if (action === "set-mode") setMode(el.dataset.mode);
    else if (action === "toggle-theme") toggleTheme();
    else if (action === "set-dir") setDir(el.dataset.dir);
    else if (action === "set-level") toggleLevel(Number(el.dataset.level));
    else if (action === "study-all") startStudy("all");
    else if (action === "open-category") startStudy(el.dataset.id);
    else if (action === "ruta-del-dia") openRutaDelDia();
    else if (action === "resume-last") resumeLast();
    else if (action === "toggle-setup") toggleSetup();
    else if (action === "set-tab") setTab(el.dataset.tab);
    else if (action === "flip") flip();
    else if (action === "toggle-context") toggleContext();
    else if (action === "rate") rate(el.dataset.rating);
    else if (action === "speak") speakCurrent();
    else if (action === "open-stats") goStats();
    else if (action === "open-badges") openBadges();
    else if (action === "open-info") openInfo();
    else if (action === "open-knigge") openKnigge();
    else if (action === "open-regatear") openRegatear();
    else if (action === "set-stats-filter") setStatsFilter(el.dataset.filter);
    else if (action === "reset-progress") resetProgress();
    else if (action === "open-card") openCard(el.dataset.id, el.dataset.back || "stats");
    else if (action === "study-one") studyOne(el.dataset.id);
    else if (action === "card-back") (state.backTo === "home" ? goHome() : goStats());
    else if (action === "open-editor") openEditor();
    else if (action === "export-data") exportData();
    else if (action === "import-data") startImport();
    else if (action === "dismiss-notice") el.remove();
    else if (action === "dismiss-update") dismissUpdateNotice();
    else if (action === "reload-app") location.reload();
    else if (action === "upd-stop") { /* Klick auf die Hinweis-Karte: nicht schließen */ }
    else if (action === "install-app") installApp();
    else if (action === "delete-card") deleteCard(el.dataset.id);
    else if (action === "share-stats") shareStats();
    else if (action === "share-card") shareCard();
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
    else if (action === "open-compras") openCompras();
    else if (action === "compras-section") comprasSection(el.dataset.id);
    else if (action === "compras-pick") comprasPick(el.dataset.id);
    else if (action === "compras-speak") speakCompras(el.dataset.id);
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
    // Getippte Antwort prüfen (Schreiben-/Hör-Modus).
    const form = e.target.closest('[data-action="submit-typed"]');
    if (!form) return;
    e.preventDefault();
    const input = document.getElementById("answer");
    submitTyped(input ? input.value : "");
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
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol === "file:") return; // SW braucht http(s)
    navigator.serviceWorker.register("service-worker.js")
      .catch((err) => console.warn("Service Worker nicht registriert", err));
  }

  // ----- Start -----
  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  root.addEventListener("submit", onSubmit);
  document.addEventListener("keydown", onKeydown);
  root.addEventListener("touchstart", onTouchStart, { passive: true });
  root.addEventListener("touchend", onTouchEnd, { passive: true });
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
  checkForUpdate(); // VOR dem ersten render – sonst fehlt der Update-Hinweis
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
