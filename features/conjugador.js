/*
 * features/conjugador.js  (SC.conjugDrill) – „Conjugador": generativer Konjugations-
 * Drill. Übt aktiv das Konjugieren statt nur die Erklärseite zu lesen: „ir – wir"
 * → tippe „vamos". Items werden pro Runde frisch aus data.CONJUGATION erzeugt
 * (SC.conjug). Stufe 1 = regelmäßige Muster, Stufe 2 = + unregelmäßige Verben.
 *
 * Teil der app.js/ui.js-Zerlegung (Welle C). Eigener Namespace SC.conjugDrill, weil
 * SC.conjug bereits das Generator-Datenmodul ist; Screen-/Action-Strings bleiben
 * „conjug…". Controller-Dienste per init(ctx). Die Erklärseite „Conjugación"
 * (renderConjugacion) bleibt im Controller – der Done-Screen verlinkt über
 * miniDoneConfig zurück dorthin (openConjugacion in app.js).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, hmTopbar } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  const CONJUG_ROUND = 10;
  const conjugReady = () => !!(ctx.conjug && ctx.data.CONJUGATION);
  const CONJUG_LEVELS = [
    { id: 1, short: "Regelmäßig", label: "Nur regelmäßige Muster", hint: "-ar · -er · -ir" },
    { id: 2, short: "Alle", label: "Mit unregelmäßigen Verben", hint: "+ ir, estar, tener …" },
  ];

  // ----- View-Modelle -----
  function conjugSetupVM() {
    return {
      available: conjugReady(),
      levels: CONJUG_LEVELS.map((l) => ({ ...l,
        short: t(`app.conjL${l.id}Short`), label: t(`app.conjL${l.id}Label`),
        active: l.id === ctx.state.conjugLevel })),
    };
  }

  function conjugVM() {
    const { state, natk } = ctx;
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
    const c = ctx.state.conjug;
    const lvl = CONJUG_LEVELS.find((l) => l.id === c.level) || null;
    return {
      correct: c.correct,
      total: c.total,
      perfect: c.total > 0 && c.correct === c.total,
      levelLabel: lvl ? t(`app.conjL${lvl.id}Label`) : "",
    };
  }

  // ----- Steuerung -----
  function openConjugDrill() {
    ctx.dismissBadgeToast();
    if (!conjugReady()) return;
    ctx.setState({ screen: "conjugSetup" });
  }

  function setConjugLevel(level) {
    const lvl = Number(level);
    if (![1, 2].includes(lvl)) return;
    ctx.state.conjugLevel = lvl;
    ctx.setSettings({ conjugLevel: lvl });
    ctx.render();
  }

  function startConjug() {
    if (!conjugReady()) return;
    const level = ctx.state.conjugLevel;
    const queue = ctx.conjug.buildRound(ctx.data.CONJUGATION, level, CONJUG_ROUND);
    if (!queue.length) return;
    ctx.state.conjug = { level, queue, idx: 0, total: queue.length, result: null, correct: 0 };
    ctx.setState({ screen: "conjug" });
  }

  // Getippte Form akzentnachsichtig prüfen (matcher.normalize: á=a, ñ=n, ohne
  // Satzzeichen). So zählt „esta" für „está" – Reise-Tastaturen haben oft keine Akzente.
  function submitConjug(input) {
    const { state, matcher } = ctx;
    const c = state.conjug;
    if (!c || c.result) return;
    const item = c.queue[c.idx];
    if (!item) return;
    const norm = matcher.normalize(input);
    const correct = norm.length > 0 && norm === matcher.normalize(item.answer);
    c.result = { input, correct, answer: item.answer };
    if (correct) { c.correct += 1; ctx.buzz(12); } else ctx.buzz(8);
    ctx.render();
  }

  function nextConjug() {
    const c = ctx.state.conjug;
    if (!c || !c.result) return;
    if (c.idx >= c.total - 1) {
      recordConjugResult(c);
      ctx.syncBadges(Date.now(), true);
      ctx.setState({ screen: "conjugDone" });
      return;
    }
    c.idx += 1;
    c.result = null;
    ctx.render();
  }

  function conjugAgain() {
    startConjug();
  }

  // Ergebnis einer beendeten Konjugations-Runde in die Spiel-Zähler buchen.
  function recordConjugResult(c) {
    if (!ctx.badges) return;
    const g = Object.assign({}, ctx.gameStats());
    g.conjugPlayed = (g.conjugPlayed || 0) + 1;
    if (c.total > 0 && c.correct === c.total) g.conjugPerfect = (g.conjugPerfect || 0) + 1;
    ctx.setGameStats(g);
  }

  // ----- Render -----
  function renderConjugSetup(vm) {
    if (!vm.available) {
      return `
        <section class="screen">
          ${hmTopbar("🔁 Conjugador", "open-conjugacion")}
          <p class="stat-empty">${esc(t("discover.cjDrillUnavailable"))}</p>
        </section>`;
    }
    const levels = vm.levels.map((l) => `
      <button class="prc-lvl ${l.active ? "is-active" : ""}" type="button"
              data-action="conjug-level" data-level="${l.id}" aria-pressed="${l.active}">
        <span class="prc-lvl__short">${esc(l.short)}</span>
        <span class="prc-lvl__label">${esc(l.label)}</span>
        <span class="prc-lvl__hint">${esc(l.hint)}</span>
      </button>`).join("");
    return `
      <section class="screen">
        ${hmTopbar("🔁 Conjugador", "open-conjugacion")}
        <p class="hm-intro">${esc(t("discover.cjDrillIntro"))}</p>
        <h3 class="prc-head">${esc(t("discover.cjDifficulty"))}</h3>
        <div class="prc-lvls">${levels}</div>
        <button class="cta" data-action="start-conjug">${esc(t("discover.cjStart"))}</button>
      </section>`;
  }

  function renderConjug(vm) {
    const pct = vm.total > 0 ? Math.round(((vm.position + (vm.result ? 1 : 0)) / vm.total) * 100) : 0;
    const body = !vm.result
      ? `
        <div class="card-static cj-prompt">
          <span class="cj-prompt__verb" lang="es">${esc(vm.verb)}</span>
          <span class="cj-prompt__person">${esc(vm.personDe)} · <span lang="es">${esc(vm.personEs)}</span></span>
          <span class="face__hint">${esc(t("discover.cjPromptHint"))}</span>
        </div>
        <form class="typer" data-action="submit-conjug" id="conjug-form">
          <input class="typer__input" id="conjug-answer" type="text" inputmode="text"
                 autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" lang="es" placeholder="${esc(t("discover.cjPlaceholder"))}" />
          <button class="typer__btn" type="submit">${esc(t("common.check"))}</button>
        </form>`
      : `
        <div class="card-static ${vm.result.correct ? "is-ok" : "is-no"}" role="status" aria-live="assertive">
          <div class="face__word" lang="es">${esc(vm.result.answer)}</div>
          <div class="listen-de">${esc(vm.personDe)} · <span lang="es">${esc(vm.personEs)}</span> · ${esc(vm.verb)}</div>
          ${vm.result.correct
            ? `<div class="verdict verdict--ok">${esc(t("common.correctShort"))}</div>`
            : `<div class="verdict verdict--no">${esc(t("common.notQuiteInput", { input: vm.result.input || "—" }))}</div>`}
        </div>
        <button class="cta" data-action="conjug-next">${vm.isLast ? esc(t("common.showResult")) : esc(t("common.next"))}</button>`;
    return `
      <section class="screen study">
        ${hmTopbar("🔁 Conjugador", "open-conjug-drill")}
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="${esc(t("common.progress"))}"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="topbar__counter quiz-count" aria-live="polite">${vm.position + 1}/${vm.total}</div>
        ${body}
      </section>`;
  }

  // Auswertung – leere Bühne für SC.celebrate (app.js mountMiniDone baut die Szene).
  function renderConjugDone() {
    return `<section class="screen"><div id="cb-mount" class="cb-mount"></div></section>`;
  }

  window.SC.conjugDrill = {
    init(injected) { ctx = injected; },
    // SCREENS-Einträge (app.js delegiert).
    setupScreen: () => renderConjugSetup(conjugSetupVM()),
    playScreen: () => renderConjug(conjugVM()),
    doneScreen: renderConjugDone,
    // VM für miniDoneConfig (app.js).
    doneVM: conjugDoneVM,
    // Handler (ACTIONS / Submit-Handler / miniDoneConfig).
    open: openConjugDrill,
    setLevel: setConjugLevel,
    start: startConjug,
    submit: submitConjug,
    next: nextConjug,
    again: conjugAgain,
  };
})();
