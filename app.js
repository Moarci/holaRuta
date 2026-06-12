/*
 * app.js  (SC.app) – Controller. Hält den Zustand, verbindet Module und
 * verdrahtet Events. Datenfluss: data → srs/matcher → hier → ui.
 * UI-Buttons tragen data-action; hier wird zentral darauf reagiert (Delegation).
 */
(function () {
  "use strict";

  const { data, srs, matcher, store, ui, stats } = window.SC;
  const badges = window.SC.badges || null; // optional – Badge-System ("Ruta-Pass")
  const speech = window.SC.speech || null; // optional – Browser kann Ausgabe ggf. nicht
  const share = window.SC.share || null;   // optional – Sharepic teilen/herunterladen
  const userCards = window.SC.userCards || null; // eigene Karten (optional)
  const countries = window.SC.countries || null; // Länderkunde-Infoseite (optional)
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
    screen: "home",          // 'home' | 'study' | 'done' | 'stats' | 'card' | 'hostel' | 'battleSetup' | 'battle' | 'battleDone' | 'roleplaySetup' | 'roleplay' | 'quizSetup' | 'quiz' | 'quizDone' | 'cuerpo'
    homeTab: ["lernen", "entdecken", "profil"].includes(settings.homeTab) ? settings.homeTab : "lernen", // aktiver Start-Reiter
    mode: settings.mode || "flip", // 'flip' | 'type'
    dir: settings.dir === "es2de" ? "es2de" : "de2es", // Lernrichtung: DE→ES (Standard) | ES→DE
    levels: Array.isArray(settings.levels) ? settings.levels : [], // [] = alle Stufen, sonst Teilmenge von [1,2,3]
    scopeId: "all",          // 'all' | Kategorie-Id
    queue: [],               // verbleibende Karten-Ids dieser Sitzung
    total: 0,                // Kartenzahl zu Sitzungsbeginn
    revealed: false,         // Sprechen-Modus: Rückseite sichtbar?
    contextOpen: false,      // 🧭 Reise-Kontext-Panel aufgeklappt? (Single Source of Truth)
    typeResult: null,        // Schreiben-Modus: { correct, answers, input } | null
    statsFilter: "answered", // Statistik-Liste: 'answered'|'hard'|'mastered'|'new'|'all'
    cardId: null,            // Detailseite: welche Karte
    backTo: "home",          // wohin der Zurück-Knopf der Detailseite führt
    countryId: null,         // Länderkunde: welches Land ist gewählt (null = erstes)
    badgeToast: null,        // frisch freigeschaltete Badges (kurze Einblendung)
    updateNotice: null,      // „Was ist neu?"-Einträge nach einem Update (null = keiner)
    // ----- Hostel Mode (transient, keine Persistenz) -----
    battle: null,            // { sceneId, queue:[battleId…], round, totalRounds, current:'A'|'B', scores:{A,B}, revealed, challenge }
    battleLength: 10,        // gewünschte Battle-Länge in Runden (vor dem Start wählbar)
    roleplayId: null,        // aktuell geöffnetes Rollenspiel
    roleplaySwapped: false,  // Rollen A/B getauscht?
    // ----- Definiciones (Zuordnen-Quiz, transient, keine Persistenz) -----
    quiz: null,              // { setId, queue:[defId…], idx, total, options:[{id,es,de,icon}…], selected:defId|null, correct }
    // ----- El Cuerpo (interaktive Körperkarte) -----
    bodyPartId: null,        // aktuell angetipptes Körperteil (Id) | null
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

  function battleSetupVM() {
    const scenes = data.BATTLE_SCENES
      .map((s) => ({ id: s.id, label: s.label, icon: s.icon,
        count: data.BATTLES.filter((b) => b.scene === s.id).length }))
      .filter((s) => s.count > 0);
    // Object.assign statt Objekt-Spread: die App verspricht ES2017 (Spread auf
    // Objekten ist ES2018 und wirft auf alten WebViews einen SyntaxError).
    const lengths = BATTLE_LENGTHS.map((l) => Object.assign({}, l, { selected: l.value === state.battleLength }));
    return { scenes, totalCount: data.BATTLES.length, lengths };
  }

  function battleVM() {
    const b = state.battle;
    const prompt = battleById(b.queue[b.round - 1]);
    const scene = data.BATTLE_SCENES.find((s) => s.id === b.sceneId);
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
      scores: b.scores,
      revealed: b.revealed,
      promptDe: prompt ? prompt.promptDe : "",
      answerEs: prompt ? prompt.answerEs : "",
      alsoOk,
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

  // ----- Rendern -----
  function render() {
    if (state.screen === "study") root.innerHTML = ui.renderStudy(studyVM());
    else if (state.screen === "done") root.innerHTML = ui.renderDone(doneVM());
    else if (state.screen === "stats") root.innerHTML = ui.renderStats(statsVM());
    else if (state.screen === "card") root.innerHTML = ui.renderCard(cardVM());
    else if (state.screen === "editor") root.innerHTML = ui.renderEditor(editorVM());
    else if (state.screen === "info") root.innerHTML = ui.renderInfo(infoVM());
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
    else root.innerHTML = ui.renderHome(homeVM());

    // Glückwunsch-Einblendung als eigene Ebene über den aktuellen Screen.
    if (badges && state.badgeToast && state.badgeToast.length) {
      root.insertAdjacentHTML("afterbegin", ui.badgeToast(state.badgeToast));
    }

    // „Was ist neu?"-Hinweis nach einem Update – oberste Ebene (Scrim + Karte).
    if (state.updateNotice && state.updateNotice.length) {
      root.insertAdjacentHTML("afterbegin", ui.updateNotice(state.updateNotice));
    }

    manageFocus();
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
      if (state.mode === "type" && !state.typeResult) {
        const input = document.getElementById("answer");
        if (input) { input.focus(); return; }
      }
      const flipEl = document.getElementById("flip");
      if (flipEl) { try { flipEl.focus({ preventScroll: true }); } catch (e) { flipEl.focus(); } return; }
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
    // Richtung ES→DE erwartet die deutsche Antwort, sonst die spanische.
    const field = state.dir === "es2de" ? "de" : "es";
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

  // Battle starten: Aufgaben der Szene (oder alle) mischen, begrenzt auf die gewählte Länge.
  function startBattle(sceneId) {
    dismissBadgeToast();
    const pool = data.BATTLES.filter((b) => sceneId === "all" || b.scene === sceneId);
    const queue = shuffle(pool).map((b) => b.id);
    if (!queue.length) return;
    // Gerade Rundenzahl, damit beide Spieler gleich oft dran sind (A,B,A,B…).
    const cap = Math.min(state.battleLength, queue.length);
    const rounds = cap - (cap % 2) || cap; // bei nur 1 Aufgabe bleibt 1 Runde
    state.battle = {
      sceneId,
      queue,
      round: 1,
      totalRounds: rounds,
      current: "A",
      scores: { A: 0, B: 0 },
      behindA: false,         // war A irgendwann in Rückstand? (für "Comeback Kid")
      behindB: false,
      revealed: false,
      challenge: null,
    };
    state.screen = "battle";
    render();
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
      // Passende Real-Life-Challenge als Bonus (zufällig).
      const list = data.CHALLENGES || [];
      b.challenge = list.length ? list[Math.floor(Math.random() * list.length)] : null;
      state.screen = "battleDone";
      recordBattleResult(b);
      syncBadges(Date.now(), true); // Battle-Badges freischalten + einblenden
    } else {
      b.round += 1;
      b.current = b.current === "A" ? "B" : "A";
      b.revealed = false;
    }
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

  // ----- Länderkunde (Infoseite) -----
  function openInfo() {
    dismissBadgeToast();
    state.screen = "info";
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
    else if (action === "cuerpo-select") selectBodyPart(el.dataset.id);
    else if (action === "cuerpo-speak") speakBodyPart();
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
    // Getippte Antwort prüfen (Schreiben-Modus).
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
  // Sprechen-Modus: hochwischen/antippen = umdrehen. Nach dem Umdrehen
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
