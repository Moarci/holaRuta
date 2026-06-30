/*
 * features/banderas-game.js  (SC.banderasGame) – „Banderas": Landesflaggen
 * spielerisch lernen. Drei Bausteine, ein Modul:
 *
 *   1) Quiz   – eine große Flagge, „¿De qué país es esta bandera?", vier Länder
 *               zur Auswahl mit Sofort-Feedback. Jede Antwort deckt auf, wofür die
 *               Farben und Symbole stehen – Raten und Lernen in einem. Spielbar nach
 *               Region (Sudamérica · Centroamérica y Caribe) oder als Mix.
 *   2) Galería – alle Flaggen zum Durchblättern: Farben, Symbolik und ein Merk-Fakt
 *               je Land (das „speziell zu den jeweiligen Landesflaggen").
 *   3) Saber más – Wissen zu Flaggen insgesamt über die gemeinsame moduleSheet-
 *               Darstellung (wie Juegos/Salud).
 *
 * Teil der app.js/ui.js-Zerlegung: eigener Namespace SC.banderasGame, die reinen
 * Daten liegen in banderas.js (SC.banderas, hier als ctx.banderas). Controller-
 * Dienste per init(ctx) (Dependency-Injection). app.js behält die Dispatch-Tabellen
 * (SCREENS/ACTIONS/miniDoneConfig) und delegiert hierher.
 *
 * Lädt NACH view-helpers.js (nutzt SC.view) und VOR app.js (das init() ruft).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, renderIcon, hmTopbar, moduleSheet } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  const OPTIONS_PER_Q = 4;
  // Quiz-Mengen: Region-Filter über banderas.COUNTRIES. "todas" = alle Länder.
  const SETS = [
    { id: "sur", region: "sur" },
    { id: "centro", region: "centro" },
    { id: "mundo", region: "mundo" },
    { id: "todas", region: null },
  ];

  const data = () => ctx.banderas || (window.SC && window.SC.banderas) || null;
  const ready = () => { const b = data(); return !!(b && Array.isArray(b.COUNTRIES) && b.COUNTRIES.length); };
  const allCountries = () => { const b = data(); return b ? b.COUNTRIES : []; };
  const countriesForSet = (setId) => {
    const set = SETS.find((s) => s.id === setId) || SETS[SETS.length - 1];
    return set.region ? allCountries().filter((c) => c.region === set.region) : allCountries();
  };
  const countryById = (id) => allCountries().find((c) => c.id === id) || null;

  const isEn = () => !!(ctx.i18n && ctx.i18n.getLang && ctx.i18n.getLang() === "en");
  // Banderas-Daten tragen nur deutsche Inhalte + …En-Pendants (keine …Es-Felder).
  // Unter jeder Nicht-DE-Oberfläche (Englisch ODER Spanisch im Locals-Track) ist
  // das englische Feld der passende Wert; nur die deutsche UI nimmt den de-Wert.
  const preferEn = () => !!(ctx.i18n && ctx.i18n.getLang && ctx.i18n.getLang() !== "de");
  // Lokaler Ländername in UI-Sprache (Spanisch bleibt der Hauptname im Quiz).
  const localName = (c) => (preferEn() ? c.en : c.de);
  const symText = (c) => (preferEn() ? c.symEn : c.sym);
  const factText = (c) => (preferEn() ? c.factEn : c.fact);
  const colorsText = (c) => (preferEn() && c.colorsEn ? c.colorsEn : c.colors);

  // Antwort-Optionen bauen: das richtige Land + bis zu 3 Ablenker aus derselben
  // Menge (gleiche Region = angemessen schwer), dann gemischt. Einmal beim Stellen
  // berechnet und im State gehalten – ein Re-Render darf nicht neu mischen.
  function buildOptions(correct, pool) {
    const distractors = ctx.shuffle(pool.filter((c) => c.id !== correct.id)).slice(0, OPTIONS_PER_Q - 1);
    return ctx.shuffle([correct, ...distractors]).map((c) => c.id);
  }

  // ----- View-Modelle -----
  function setupVM() {
    return {
      sets: SETS.map((s) => ({ id: s.id, count: countriesForSet(s.id).length })),
      galleryCount: allCountries().length,
    };
  }

  function quizVM() {
    const b = ctx.state.banderas;
    const country = countryById(b.queue[b.idx]);
    const answered = b.selected !== null;
    const options = b.options.map((id) => {
      const c = countryById(id);
      return {
        id: c.id, es: c.es, de: localName(c),
        // vor der Antwort neutral; danach Lösung grün, falsche Wahl rot, Rest gedämpft.
        state: !answered ? "idle"
          : c.id === country.id ? "correct"
          : c.id === b.selected ? "wrong"
          : "dim",
      };
    });
    return {
      flag: country.flag,
      position: b.idx, total: b.total,
      options, answered,
      isCorrect: answered && b.selected === country.id,
      solutionName: country.es, solutionLocal: localName(country),
      colors: colorsText(country), sym: symText(country), fact: factText(country),
      isLast: b.idx >= b.total - 1,
    };
  }

  function doneVM() {
    const b = ctx.state.banderas;
    const set = SETS.find((s) => s.id === b.setId) || SETS[SETS.length - 1];
    return {
      setLabel: t("discover.bnd_" + set.id),
      correct: b.correct, total: b.total,
      perfect: b.total > 0 && b.correct === b.total,
    };
  }

  // Info-Seite (Saber más): wie juegosVM – per …En-Felder für die UI-Sprache.
  function infoVM() {
    const b = data();
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    if (!b) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    return {
      intro: (preferEn() && b.INTRO_EN) ? b.INTRO_EN : b.INTRO,
      topics: loc(b.TOPICS || []),
      phrases: loc(b.PHRASES || []),
      glossary: loc(b.GLOSSARY || []),
      checklist: loc(b.CHECKLIST || []),
      isFav: ctx.isFavorite,
    };
  }

  // ----- Steuerung -----
  function openSetup() {
    ctx.dismissBadgeToast();
    if (!ready()) return;
    ctx.setState({ screen: "banderasSetup" });
  }

  function startQuiz(setId) {
    ctx.dismissBadgeToast();
    const pool = countriesForSet(setId);
    if (pool.length < OPTIONS_PER_Q) return;
    const queue = ctx.shuffle(pool).map((c) => c.id);
    ctx.state.banderas = {
      setId, queue, idx: 0, total: queue.length,
      options: buildOptions(countryById(queue[0]), pool),
      selected: null, correct: 0,
    };
    ctx.setState({ screen: "banderas" });
  }

  // Eine Option wählen. Erste Wahl zählt; weitere Klicks (nach dem Aufdecken) ignorieren.
  function answer(id) {
    const b = ctx.state.banderas;
    if (!b || b.selected !== null) return;
    const correctId = b.queue[b.idx];
    b.selected = id;
    if (id === correctId) { b.correct += 1; ctx.buzz(12); } else ctx.buzz(8);
    ctx.render();
  }

  function next() {
    const b = ctx.state.banderas;
    if (!b || b.selected === null) return; // erst antworten, dann weiter
    if (b.idx >= b.total - 1) {
      recordResult(b);
      ctx.syncBadges(Date.now(), true);
      ctx.setState({ screen: "banderasDone" });
      return;
    }
    b.idx += 1;
    b.selected = null;
    b.options = buildOptions(countryById(b.queue[b.idx]), countriesForSet(b.setId));
    ctx.render();
  }

  function again() {
    startQuiz(ctx.state.banderas ? ctx.state.banderas.setId : "todas");
  }

  function openGallery() {
    ctx.dismissBadgeToast();
    if (!ready()) return;
    ctx.setState({ screen: "banderasGaleria" });
  }

  function openInfo() {
    ctx.dismissBadgeToast();
    if (!ready()) return;
    ctx.setState({ screen: "banderasInfo" });
  }

  // Ergebnis einer beendeten Quiz-Runde in die Spiel-Zähler buchen (Ruta-Pass).
  function recordResult(b) {
    if (!ctx.badges) return;
    const g = Object.assign({}, ctx.gameStats());
    g.banderasPlayed = (g.banderasPlayed || 0) + 1;
    if (b.total > 0 && b.correct === b.total) g.banderasPerfect = (g.banderasPerfect || 0) + 1;
    if (b.setId) {
      const done = Object.assign({}, g.banderasSetsDone);
      done[b.setId] = true;
      g.banderasSetsDone = done;
    }
    ctx.setGameStats(g);
  }

  // ----- Render -----
  function renderSetup(vm) {
    const quizTile = (id) => {
      const s = vm.sets.find((x) => x.id === id);
      return `
        <button class="hm-scene" data-action="start-banderas" data-set="${esc(id)}">
          <span class="hm-scene__icon" aria-hidden="true">${esc(t("discover.bnd_" + id + "_icon"))}</span>
          <span class="hm-scene__label">${esc(t("discover.bnd_" + id))}<br><span class="quiz-set__intro">${esc(t("discover.bnd_" + id + "_desc"))}</span></span>
          <span class="hm-scene__count">${s ? s.count : 0}</span>
        </button>`;
    };
    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:flag")} Banderas`, "home")}
        <p class="hm-intro">${esc(t("discover.bndSetupIntro"))}</p>
        <h2 class="rg-head">${esc(t("discover.bndPlayHead"))}</h2>
        <div class="hm-scenes">
          ${quizTile("sur")}
          ${quizTile("centro")}
          ${quizTile("mundo")}
          ${quizTile("todas")}
        </div>
        <h2 class="rg-head">${esc(t("discover.bndLearnHead"))}</h2>
        <div class="hm-scenes">
          <button class="hm-scene hm-scene--mixed" data-action="open-banderas-galeria">
            <span class="hm-scene__icon" aria-hidden="true">${renderIcon("lc:image")}</span>
            <span class="hm-scene__label">${esc(t("discover.bndGaleria"))}<br><span class="quiz-set__intro">${esc(t("discover.bndGaleriaDesc"))}</span></span>
            <span class="hm-scene__count">${vm.galleryCount}</span>
          </button>
          <button class="hm-scene hm-scene--mixed" data-action="open-banderas-info">
            <span class="hm-scene__icon" aria-hidden="true">${renderIcon("lc:book-open")}</span>
            <span class="hm-scene__label">${esc(t("discover.bndSaberMas"))}<br><span class="quiz-set__intro">${esc(t("discover.bndSaberMasDesc"))}</span></span>
            <span class="hm-scene__count" aria-hidden="true">›</span>
          </button>
        </div>
      </section>`;
  }

  function renderQuiz(vm) {
    const pct = vm.total > 0 ? Math.round(((vm.position + (vm.answered ? 1 : 0)) / vm.total) * 100) : 0;
    const options = vm.options
      .map((o) => {
        const cls = `quiz-opt${o.state !== "idle" ? " quiz-opt--" + o.state : ""}`;
        const dis = vm.answered ? " disabled aria-disabled=\"true\"" : "";
        const mark = o.state === "correct" ? `<span class="quiz-opt__mark" aria-hidden="true">✓</span>`
          : o.state === "wrong" ? `<span class="quiz-opt__mark" aria-hidden="true">✕</span>` : "";
        return `
          <button class="${cls}" type="button" data-action="banderas-answer" data-id="${esc(o.id)}"${dis}>
            <span class="quiz-opt__text">
              <span class="quiz-opt__es" lang="es">${esc(o.es)}</span>
              <span class="quiz-opt__de">${esc(o.de)}</span>
            </span>
            ${mark}
          </button>`;
      })
      .join("");

    const reveal = vm.answered
      ? `<div class="quiz-feedback bnd-reveal ${vm.isCorrect ? "is-correct" : "is-wrong"}" role="status" aria-live="polite">
           <span class="quiz-feedback__head">${esc(vm.isCorrect ? t("discover.quizCorrect") : t("discover.quizNotExactly"))}</span>
           <span class="bnd-reveal__name"><span lang="es">${esc(vm.solutionName)}</span> · ${esc(vm.solutionLocal)}</span>
           <span class="bnd-reveal__colors">${renderIcon("lc:palette")} ${esc(vm.colors)}</span>
           <span class="bnd-reveal__sym">${esc(vm.sym)}</span>
           <span class="bnd-reveal__fact">${renderIcon("lc:lightbulb")} ${esc(vm.fact)}</span>
         </div>
         <button class="cta" data-action="banderas-next">${vm.isLast ? esc(t("common.showResult")) : esc(t("common.next"))}</button>`
      : "";

    return `
      <section class="screen study">
        ${hmTopbar(`${renderIcon("lc:flag")} Banderas`, "banderas-again")}
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="${esc(t("common.progress"))}"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="topbar__counter quiz-count" aria-live="polite">${esc(t("discover.bndCount", { pos: vm.position + 1, total: vm.total }))}</div>
        <div class="bnd-stage">
          <span class="bnd-flag" role="img" aria-label="${esc(t("discover.bndQuestion"))}">${vm.flag}</span>
          <p class="bnd-q">${esc(t("discover.bndQuestion"))}</p>
        </div>
        <div class="quiz-opts">${options}</div>
        ${reveal}
      </section>`;
  }

  function renderDone() {
    return `<section class="screen"><div id="cb-mount" class="cb-mount"></div></section>`;
  }

  // Galería: alle Flaggen zum Durchblättern, gruppiert nach Region. Reuse der
  // aufklappbaren knigge-topic-Optik. Jede Karte: Flagge + Name, dann Farben,
  // Symbolik und ein Merk-Fakt.
  function renderGallery() {
    const regions = [
      { id: "sur", label: t("discover.bndRegSur") },
      { id: "centro", label: t("discover.bndRegCentro") },
      { id: "europa", label: t("discover.bndRegEuropa") },
      { id: "mundo", label: t("discover.bndRegMundo") },
    ];
    const card = (c) => `
      <details class="knigge-topic bnd-card">
        <summary class="knigge-topic__head">
          <span class="knigge-topic__icon bnd-card__flag" aria-hidden="true">${c.flag}</span>
          <span class="knigge-topic__title"><span lang="es">${esc(c.es)}</span> · <span class="bnd-card__de">${esc(localName(c))}</span></span>
          <span class="knigge-topic__chev" aria-hidden="true">▾</span>
        </summary>
        <div class="knigge-topic__body">
          <p class="bnd-card__colors">${renderIcon("lc:palette")} ${esc(colorsText(c))} · ${renderIcon("lc:map-pin")} ${esc(c.capital)}</p>
          <p class="knigge-intro">${esc(symText(c))}</p>
          <ul class="knigge-list"><li class="knigge-tip"><span class="knigge-mark" role="img" aria-label="${esc(t("discover.kniggeTip"))}">💡</span>${esc(factText(c))}</li></ul>
        </div>
      </details>`;
    const sections = regions.map((r) => {
      const items = allCountries().filter((c) => c.region === r.id);
      if (!items.length) return "";
      return `<h2 class="rg-head">${esc(r.label)}</h2>${items.map(card).join("")}`;
    }).join("");
    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:image")} Galería de banderas`, "open-banderas")}
        <p class="pageintro">${esc(t("discover.bndGaleriaIntro"))}</p>
        ${sections}
      </section>`;
  }

  // Saber más: das gemeinsame Info-Modul-Blatt. cat:"banderas" schaltet die
  // Sharepic-Knöpfe frei (ganzes Modul + je Thema) und nutzt den Banderas-
  // Namespace für Satz-Favoriten; Deep-Link & Sharepic-Register sind in app.js
  // (MODULE_SHARE/TIPS_META/openers) gepflegt.
  function renderInfo() {
    return moduleSheet(infoVM(), {
      icon: "lc:library", title: t("discover.bndSaberMas"), cat: "banderas", back: "open-banderas",
      headTips: "discover.bnTips", headPhrases: "discover.bnPhrases", headWords: "discover.bnWords",
      headChecklist: "discover.bnChecklist", headChecklistHint: "discover.bnChecklistHint",
      readingPerTopic: true, copyPhrases: true, favPhrases: ctx.isFavorite, // jeder Satz mit Stern → „Mi léxico"
    });
  }

  window.SC.banderasGame = {
    init(injected) { ctx = injected; },
    ready,
    // SCREENS-Einträge (app.js delegiert).
    setupScreen: () => renderSetup(setupVM()),
    playScreen: () => renderQuiz(quizVM()),
    doneScreen: renderDone,
    galleryScreen: renderGallery,
    infoScreen: renderInfo,
    // VMs für app-Kern (miniDoneConfig).
    doneVM,
    // Handler (ACTIONS / miniDoneConfig / Deep-Link).
    open: openSetup,
    start: startQuiz,
    answer,
    next,
    again,
    gallery: openGallery,
    info: openInfo,
  };
})();
