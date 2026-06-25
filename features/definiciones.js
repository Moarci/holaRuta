/*
 * features/definiciones.js  (SC.definiciones) – „Zuordnen-Quiz": zu einer spanischen
 * Definition die passende Vokabel aus vier Optionen wählen, mit Sofort-Feedback.
 *
 * Teil der app.js/ui.js-Zerlegung (Welle B, Mini-Spiele). Bündelt Daten-Helfer,
 * View-Modelle, Handler und Render. Controller-Dienste kommen per init(ctx)
 * (Dependency-Injection): zentraler State, Daten-Helfer, Persistenz-Accessoren
 * (setGameStats). app.js behält die Dispatch-Tabellen und delegiert an die hier
 * exportierten Methoden.
 *
 * Lädt NACH view-helpers.js (nutzt SC.view) und VOR app.js (das init() ruft).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, renderIcon, hmTopbar, moduleShareBtn } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- Daten-Helfer -----
  const quizSetById = (id) => ctx.data.QUIZ_SETS.find((s) => s.id === id) || null;
  const quizDefById = (id) => ctx.data.QUIZ_DEFS.find((d) => d.id === id) || null;
  const quizDefsForSet = (setId) => ctx.data.QUIZ_DEFS.filter((d) => d.set === setId);

  // Antwort-Optionen einer Frage bauen: die richtige Lösung + bis zu 3 Ablenker aus
  // derselben Liste, anschließend gemischt. Wird beim Stellen der Frage EINMAL
  // berechnet und im State gehalten – ein Re-Render darf nicht neu mischen.
  function buildQuizOptions(correct, pool) {
    const distractors = ctx.shuffle(pool.filter((d) => d.id !== correct.id)).slice(0, 3);
    return ctx.shuffle([correct, ...distractors])
      .map((d) => ({ id: d.id, es: d.es, de: d.de, en: d.en, icon: d.icon }));
  }

  // ----- View-Modelle -----
  function quizSetupVM() {
    const { data, levelById, natk } = ctx;
    return {
      sets: data.QUIZ_SETS.map((s) => {
        const lvl = levelById(s.lvl);
        return { id: s.id, label: s.label, icon: s.icon, intro: natk(s, "intro"),
          count: quizDefsForSet(s.id).length, lvlShort: lvl ? lvl.short : "" };
      }),
    };
  }

  function quizVM() {
    const { state, nat } = ctx;
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
    const q = ctx.state.quiz;
    const set = quizSetById(q.setId);
    return {
      setLabel: set ? set.label : "",
      setIcon: set ? set.icon : "🧩",
      correct: q.correct,
      total: q.total,
      perfect: q.total > 0 && q.correct === q.total,
    };
  }

  // ----- Steuerung -----
  function openQuizSetup() {
    ctx.dismissBadgeToast();
    ctx.setState({ screen: "quizSetup" });
  }

  function startQuiz(setId) {
    ctx.dismissBadgeToast();
    const pool = quizDefsForSet(setId);
    if (!pool.length) return;
    const queue = ctx.shuffle(pool).map((d) => d.id);
    ctx.state.quiz = {
      setId,
      queue,
      idx: 0,
      total: queue.length,
      options: buildQuizOptions(quizDefById(queue[0]), pool),
      selected: null,
      correct: 0,
    };
    ctx.setState({ screen: "quiz" });
  }

  // Eine Option wählen. Erste Wahl zählt; weitere Klicks (nach dem Aufdecken) ignorieren.
  function answerQuiz(defId) {
    const q = ctx.state.quiz;
    if (!q || q.selected !== null) return;
    const current = q.queue[q.idx];
    q.selected = defId;
    if (defId === current) { q.correct += 1; ctx.buzz(12); } else ctx.buzz(8);
    ctx.render();
  }

  function nextQuiz() {
    const q = ctx.state.quiz;
    if (!q || q.selected === null) return; // erst antworten, dann weiter
    if (q.idx >= q.total - 1) {
      recordQuizResult(q);
      ctx.syncBadges(Date.now(), true); // Quiz-Badges freischalten + einblenden
      ctx.setState({ screen: "quizDone" });
      return;
    }
    q.idx += 1;
    q.selected = null;
    q.options = buildQuizOptions(quizDefById(q.queue[q.idx]), quizDefsForSet(q.setId));
    ctx.render();
  }

  function quizAgain() {
    ctx.dismissBadgeToast();
    ctx.state.quiz = null;
    ctx.setState({ screen: "quizSetup" });
  }

  // Ergebnis eines beendeten Quiz in die Spiel-Zähler buchen (Ruta-Pass).
  function recordQuizResult(q) {
    if (!ctx.badges) return;
    const g = Object.assign({}, ctx.gameStats());
    g.quizzesPlayed = (g.quizzesPlayed || 0) + 1;
    if (q.total > 0 && q.correct === q.total) g.quizzesPerfect = (g.quizzesPerfect || 0) + 1;
    ctx.setGameStats(g);
  }

  // ----- Render -----
  function renderQuizSetup(vm) {
    const list = vm.sets
      .map((s) =>
        `<button class="hm-scene" data-action="start-quiz" data-set="${esc(s.id)}">
           <span class="hm-scene__icon" aria-hidden="true">${esc(s.icon)}</span>
           <span class="hm-scene__label">${esc(s.label)}${s.lvlShort ? ` <span class="quiz-lvl">${esc(s.lvlShort)}</span>` : ""}<br><span class="quiz-set__intro">${esc(s.intro)}</span></span>
           <span class="hm-scene__count">${s.count}</span>
         </button>`)
      .join("");
    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:puzzle")} Definiciones`, "home")}
        <p class="hm-intro">${esc(t("discover.quizSetupIntro"))}</p>
        ${moduleShareBtn("definiciones")}
        <div class="hm-scenes">${list}</div>
      </section>`;
  }

  // Eine Frage: Definition + Antwort-Optionen.
  function renderQuiz(vm) {
    const pct = vm.total > 0 ? Math.round(((vm.position + (vm.answered ? 1 : 0)) / vm.total) * 100) : 0;
    const options = vm.options
      .map((o) => {
        const cls = `quiz-opt${o.state !== "idle" ? " quiz-opt--" + o.state : ""}`;
        // Nach dem Aufdecken sind alle Optionen deaktiviert (kein Umentscheiden).
        const dis = vm.answered ? " disabled aria-disabled=\"true\"" : "";
        const mark = o.state === "correct" ? `<span class="quiz-opt__mark" aria-hidden="true">✓</span>`
          : o.state === "wrong" ? `<span class="quiz-opt__mark" aria-hidden="true">✕</span>` : "";
        return `
          <button class="${cls}" type="button" data-action="quiz-answer" data-id="${esc(o.id)}"${dis}>
            <span class="quiz-opt__icon" aria-hidden="true">${esc(o.icon)}</span>
            <span class="quiz-opt__text">
              <span class="quiz-opt__es" lang="es">${esc(o.es)}</span>
              <span class="quiz-opt__de">${esc(o.de)}</span>
            </span>
            ${mark}
          </button>`;
      })
      .join("");

    const feedback = vm.answered
      ? `<div class="quiz-feedback ${vm.isCorrect ? "is-correct" : "is-wrong"}" role="status" aria-live="polite">
           ${vm.isCorrect
             ? `<span class="quiz-feedback__head">${esc(t("discover.quizCorrect"))}</span>`
             : `<span class="quiz-feedback__head">${esc(t("discover.quizNotExactly"))}</span>
                <span class="quiz-feedback__sol">${t("discover.quizSolution", { es: esc(vm.solutionEs), de: esc(vm.solutionDe) })}</span>`}
         </div>
         <button class="cta" data-action="quiz-next">${vm.isLast ? esc(t("common.showResult")) : esc(t("common.next"))}</button>`
      : "";

    return `
      <section class="screen study">
        ${hmTopbar(`${esc(vm.setIcon)} ${esc(vm.setLabel)}`, "quiz-again")}
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="${esc(t("discover.quizProgress"))}"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="topbar__counter quiz-count" aria-live="polite">${esc(t("discover.quizQuestion", { pos: vm.position + 1, total: vm.total }))}</div>
        <div class="quiz-def">
          <span class="quiz-def__cap">${esc(t("discover.quizDefinicion"))}</span>
          <p class="quiz-def__text" lang="es">${esc(vm.definition)}</p>
        </div>
        <div class="quiz-opts">${options}</div>
        ${feedback}
      </section>`;
  }

  // Auswertung – leere Bühne für SC.celebrate (app.js mountMiniDone baut die Szene).
  function renderQuizDone() {
    return `<section class="screen"><div id="cb-mount" class="cb-mount"></div></section>`;
  }

  window.SC.definiciones = {
    init(injected) { ctx = injected; },
    // SCREENS-Einträge (app.js delegiert).
    setupScreen: () => renderQuizSetup(quizSetupVM()),
    playScreen: () => renderQuiz(quizVM()),
    doneScreen: renderQuizDone,
    // VMs für app-Kern (Sharepic-Highlights bzw. miniDoneConfig).
    setupVM: quizSetupVM,
    doneVM: quizDoneVM,
    // Handler (ACTIONS / miniDoneConfig / Deep-Link).
    open: openQuizSetup,
    start: startQuiz,
    answer: answerQuiz,
    next: nextQuiz,
    again: quizAgain,
  };
})();
