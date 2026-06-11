/*
 * app.js  (SC.app) – Controller. Hält den Zustand, verbindet Module und
 * verdrahtet Events. Datenfluss: data → srs/matcher → hier → ui.
 * UI-Buttons tragen data-action; hier wird zentral darauf reagiert (Delegation).
 */
(function () {
  "use strict";

  const { data, srs, matcher, store, ui, stats } = window.SC;
  const speech = window.SC.speech || null; // optional – Browser kann Ausgabe ggf. nicht
  const share = window.SC.share || null;   // optional – Sharepic teilen/herunterladen
  const userCards = window.SC.userCards || null; // eigene Karten (optional)
  const countries = window.SC.countries || null; // Länderkunde-Infoseite (optional)
  const DEFAULT_ACCENT = ["#C2502E", "#E9A23B"]; // Terrakotta→Ocker (markenkonform, statt kühlem Indigo)

  // ----- Zustand (eine einzige Quelle der Wahrheit) -----
  let progress = store.loadProgress();
  let settings = store.loadSettings();

  const state = {
    screen: "home",          // 'home' | 'study' | 'done' | 'stats' | 'card'
    mode: settings.mode || "flip", // 'flip' | 'type'
    dir: settings.dir === "es2de" ? "es2de" : "de2es", // Lernrichtung: DE→ES (Standard) | ES→DE
    levels: Array.isArray(settings.levels) ? settings.levels : [], // [] = alle Stufen, sonst Teilmenge von [1,2,3]
    scopeId: "all",          // 'all' | Kategorie-Id
    queue: [],               // verbleibende Karten-Ids dieser Sitzung
    total: 0,                // Kartenzahl zu Sitzungsbeginn
    revealed: false,         // Sprechen-Modus: Rückseite sichtbar?
    typeResult: null,        // Schreiben-Modus: { correct, answers, input } | null
    statsFilter: "answered", // Statistik-Liste: 'answered'|'hard'|'mastered'|'new'|'all'
    cardId: null,            // Detailseite: welche Karte
    backTo: "home",          // wohin der Zurück-Knopf der Detailseite führt
    countryId: null,         // Länderkunde: welches Land ist gewählt (null = erstes)
  };

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
    const all = scopeCards("all");
    // Stufen inkl. Kartenzahl je Stufe (über alle Kategorien) + Auswahl-Status.
    const levels = data.LEVELS.map((l) => ({
      id: l.id, label: l.label, short: l.short, color: l.color,
      count: everyCard.filter((c) => c.lvl === l.id).length,
      active: state.levels.includes(l.id),
    }));
    return {
      mode: state.mode,
      dir: state.dir,
      theme: effectiveTheme(),
      allLevels: state.levels.length === 0,
      levels,
      categories,
      totalDue: dueIn(all).length,
      totalCards: all.length,
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
      catLabel: isAll ? "Alle Bereiche" : cat.label,
      catIcon: isAll ? "📚" : cat.icon,
      accent: isAll ? DEFAULT_ACCENT : cat.grad,
      position: state.total - state.queue.length,
      total: state.total,
      revealed: state.revealed,
      typeResult: state.typeResult,
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

  // ----- Rendern -----
  function render() {
    if (state.screen === "study") root.innerHTML = ui.renderStudy(studyVM());
    else if (state.screen === "done") root.innerHTML = ui.renderDone(doneVM());
    else if (state.screen === "stats") root.innerHTML = ui.renderStats(statsVM());
    else if (state.screen === "card") root.innerHTML = ui.renderCard(cardVM());
    else if (state.screen === "editor") root.innerHTML = ui.renderEditor(editorVM());
    else if (state.screen === "info") root.innerHTML = ui.renderInfo(infoVM());
    else root.innerHTML = ui.renderHome(homeVM());

    manageFocus();
  }

  // Nach jedem Voll-Re-Render (innerHTML wird ersetzt) den Fokus auf ein sinnvolles
  // Ziel setzen – sonst fällt er auf <body> und Tastatur-/Screenreader-Nutzer verlieren
  // ihre Position. preventScroll vermeidet Sprünge.
  function manageFocus() {
    if (state.screen === "study") {
      if (state.mode === "type" && !state.typeResult) {
        const input = document.getElementById("answer");
        if (input) { input.focus(); return; }
      }
      const flipEl = document.getElementById("flip");
      if (flipEl) { try { flipEl.focus({ preventScroll: true }); } catch (e) { flipEl.focus(); } return; }
    }
    const target = root.querySelector("h2, [data-action='card-back'], [data-action='home']") || root.firstElementChild;
    if (target) {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
    }
  }

  // ----- Aktionen -----
  function startStudy(scopeId) {
    const cards = scopeCards(scopeId);
    const due = dueIn(cards);
    const chosen = due.length ? due : cards; // nichts fällig? -> freies Üben
    state.scopeId = scopeId;
    state.queue = chosen.map((c) => c.id);
    state.total = state.queue.length;
    state.revealed = false;
    state.typeResult = null;
    state.screen = state.queue.length ? "study" : "done";
    render();
  }

  // Umdrehen ist beidseitig: nach dem Lösen kann die Karte wieder zurück auf die
  // Frage gedreht werden. Die Bewertungs-Leiste erscheint nur auf der Antwortseite.
  function flip() {
    state.revealed = !state.revealed;
    // In-Place-Klasse für die 3D-Animation (kein Voll-Re-Render).
    const flipEl = document.getElementById("flip");
    const controls = document.getElementById("controls");
    if (flipEl) {
      flipEl.classList.toggle("is-flipped", state.revealed);
      flipEl.setAttribute("aria-label", state.revealed ? "Karte ist umgedreht – tippen zum Zurückdrehen" : "Karte umdrehen");
    }
    if (controls) controls.toggleAttribute("hidden", !state.revealed);
  }

  function submitTyped(input) {
    const card = cardById(state.queue[0]);
    if (!card) return;
    // Richtung ES→DE erwartet die deutsche Antwort, sonst die spanische.
    const field = state.dir === "es2de" ? "de" : "es";
    state.typeResult = Object.assign({ input }, matcher.check(input, card, field));
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
    const prev = progress[card.id];
    const srsNext = srs.review(prev, rating);
    const merged = stats.record(prev, srsNext, rating, Date.now());
    progress = Object.assign({}, progress, { [card.id]: merged });
    store.saveProgress(progress);

    state.queue = state.queue.slice(1);
    if (rating === srs.RATING.AGAIN) state.queue = state.queue.concat(card.id);

    state.revealed = false;
    state.typeResult = null;
    state.screen = state.queue.length ? "study" : "done";
    render();
  }

  function setMode(mode) {
    state.mode = mode;
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

  function goHome() {
    state.screen = "home";
    state.revealed = false;
    state.typeResult = null;
    render();
  }

  // ----- Länderkunde (Infoseite) -----
  function openInfo() {
    state.screen = "info";
    render();
  }

  function selectCountry(id) {
    state.countryId = id;
    render();
  }

  // ----- Statistik-Navigation -----
  function goStats() {
    state.screen = "stats";
    render();
  }

  function setStatsFilter(filter) {
    state.statsFilter = filter;
    render();
  }

  // Gesamten Lernfortschritt löschen (nach Rückfrage). Einstellungen bleiben erhalten.
  function resetProgress() {
    const ok = typeof confirm === "function"
      ? confirm("Wirklich den gesamten Lernfortschritt löschen?\nDas kann nicht rückgängig gemacht werden.")
      : true;
    if (!ok) return;
    store.resetProgress();
    progress = {};
    state.statsFilter = "answered";
    goHome();
  }

  // Detailseite einer Karte öffnen. backTo merkt sich die Herkunft (Zurück-Knopf).
  function openCard(id, backTo) {
    state.cardId = id;
    state.backTo = backTo || "stats";
    state.screen = "card";
    render();
  }

  // Genau diese eine Karte üben (von der Detailseite aus).
  function studyOne(id) {
    const card = cardById(id);
    if (!card) return;
    state.scopeId = card.cat;
    state.queue = [id];
    state.total = 1;
    state.revealed = false;
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
    editorMsg = null;
    state.screen = "editor";
    render();
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
    const ok = typeof confirm === "function"
      ? confirm("Diese eigene Karte wirklich löschen?\nDer Lernfortschritt dieser Karte geht verloren.")
      : true;
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
    else if (action === "flip") flip();
    else if (action === "rate") rate(el.dataset.rating);
    else if (action === "speak") speakCurrent();
    else if (action === "open-stats") goStats();
    else if (action === "open-info") openInfo();
    else if (action === "set-stats-filter") setStatsFilter(el.dataset.filter);
    else if (action === "reset-progress") resetProgress();
    else if (action === "open-card") openCard(el.dataset.id, el.dataset.back || "stats");
    else if (action === "study-one") studyOne(el.dataset.id);
    else if (action === "card-back") (state.backTo === "home" ? goHome() : goStats());
    else if (action === "open-editor") openEditor();
    else if (action === "delete-card") deleteCard(el.dataset.id);
    else if (action === "share-stats") shareStats();
    else if (action === "share-card") shareCard();
    else if (action === "set-share-format") setShareFormat(el.dataset.format);
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
    const el = e.target.closest('[data-action="select-country"]');
    if (!el) return;
    selectCountry(el.value);
  }

  function onKeydown(e) {
    if (state.screen !== "study") return;
    const inInput = e.target && e.target.tagName === "INPUT";

    // 'p' = Antwort anhören (play), sobald die spanische Antwort sichtbar ist.
    if ((e.key === "p" || e.key === "P") && !inInput && canRate()) {
      speakCurrent();
      return;
    }

    if (state.mode === "flip") {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip(); // beidseitig: Frage ⇄ Antwort
      } else if (state.revealed) rateByKey(e.key);
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
      else if (dy < 0) { rate(srs.RATING.GOOD); lastSwipeAt = Date.now(); }                          // ↑ Gut
    } else if (state.mode === "flip" && !state.revealed && dy < 0) {
      flip(); lastSwipeAt = Date.now(); // ↑ hochwischen dreht die Karte um
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
  render();
  registerServiceWorker();

  window.SC.app = { render }; // nach außen minimal
})();
