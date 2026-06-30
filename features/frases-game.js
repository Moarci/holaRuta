/*
 * features/frases-game.js  (SC.frasesGame) – „Frases flexibles" (Satzbaukasten):
 * zu einem Satzrahmen mit Lücke + deutscher Zielbedeutung den passenden Baustein
 * aus mehreren Optionen wählen, mit Sofort-Feedback. Themen-Auswahl plus eine
 * „Gemischt"-Runde quer durch alle Themen.
 *
 * Teil der app.js/ui.js-Zerlegung (Welle C). Eigener Namespace SC.frasesGame, weil
 * SC.frases bereits das Datenmodul (Rahmen/Themen) ist; Screen-/Action-Strings
 * bleiben „frases…". Controller-Dienste per init(ctx); die Daten kommen über
 * ctx.frases. app.js behält die Dispatch-Tabellen und delegiert hierher.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, renderIcon, hmTopbar, moduleShareBtn } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // Gelernte Sprache des aktiven Tracks: Reise "es", Locals "en" (Muster wie
  // dialogos-game). Steuert Rahmen (frameEs/frameEn), Bausteine und Zielbedeutung.
  const trackLearnLang = () => (window.SC && window.SC.track && window.SC.track.learnLang && window.SC.track.learnLang()) || "es";

  // Virtuelle "Gemischt"-Id: spielt alle Rahmen quer durch alle Themen.
  const FRASES_ALL = "all";
  const frasesById = (id) => { const f = ctx.frases; return (f ? f.FRASES.find((x) => x.id === id) : null) || null; };
  const frasesSetById = (id) => { const f = ctx.frases; return (f && f.FRASES_SETS ? f.FRASES_SETS.find((s) => s.id === id) : null) || null; };
  // Rahmen eines Themas (oder alle bei "all"). Reihenfolge der Daten bleibt erhalten.
  const frasesForSet = (setId) => { const f = ctx.frases; return f ? f.FRASES.filter((x) => setId === FRASES_ALL || x.cat === setId) : []; };

  // Optionen eines Rahmens bauen: korrekter Baustein + Ablenker, gemischt. Einmal
  // beim Stellen berechnet und im State gehalten (Re-Render darf nicht neu mischen).
  function buildFrasesOptions(frame) {
    const opts = [Object.assign({ correct: true }, frame.slot)]
      .concat((frame.distractors || []).map((d) => Object.assign({ correct: false }, d)));
    return ctx.shuffle(opts);
  }

  // ----- View-Modelle -----
  // Themen-Auswahl: jede Liste mit Zahl + Stufe, plus eine "Gemischt"-Kachel über alles.
  function frasesSetupVM() {
    const { frases, levelById, natk } = ctx;
    const sets = (frases && frases.FRASES_SETS ? frases.FRASES_SETS : []).map((s) => {
      const lvl = levelById(s.lvl);
      return { id: s.id, label: s.label, icon: s.icon, intro: natk(s, "intro"),
        count: frasesForSet(s.id).length, lvlShort: lvl ? lvl.short : "" };
    });
    return {
      sets,
      mixed: { id: FRASES_ALL, label: t("app.mixed"), icon: "lc:dices",
        intro: t("app.frasesMixedIntro"),
        count: frases ? frases.FRASES.length : 0 },
    };
  }

  // Kopf-Infos zum laufenden Set (Label/Icon) – "Gemischt" hat keinen Datensatz.
  function frasesSetInfo(setId) {
    if (setId === FRASES_ALL) return { label: t("app.mixed"), icon: "lc:dices" };
    const s = frasesSetById(setId);
    return { label: s ? s.label : "", icon: s ? s.icon : "lc:blocks" };
  }

  function frasesVM() {
    const { state, nat, natk } = ctx;
    const f = state.frases;
    const frame = frasesById(f.queue[f.idx]);
    const answered = f.selected !== null;
    const info = frasesSetInfo(f.setId);
    const ll = trackLearnLang();
    // Primärzeile der Bausteine = gelernte Sprache; Sekundärzeile die andere Seite.
    const primary = (o) => (ll === "en" ? o.en : o.es) || "";
    const secondary = (o) => (ll === "en" ? o.es : nat(o)) || "";
    const options = f.options.map((o, i) => ({
      es: primary(o), de: secondary(o),
      // vor der Antwort neutral; danach Lösung grün, falsche Wahl rot, Rest gedämpft.
      state: !answered ? "idle"
        : o.correct ? "correct"
        : i === f.selected ? "wrong"
        : "dim",
    }));
    const sol = f.options.find((o) => o.correct) || {};
    // Locals baut den englischen Satz (frameEn) zur spanischen Zielbedeutung
    // (vollständiger spanischer Satz = frameEs mit korrektem Baustein); Reise
    // unverändert: frameEs + muttersprachliche Zielbedeutung (targetDe/En).
    const frameShown = !frame ? "" : (ll === "en" ? (frame.frameEn || frame.frameEs) : frame.frameEs);
    const target = !frame ? "" : (ll === "en"
      ? frame.frameEs.replace("___", (frame.slot && frame.slot.es) || "")
      : natk(frame, "targetDe"));
    return {
      setLabel: info.label, setIcon: info.icon,
      lang: ll,
      position: f.idx, total: f.total,
      frameEs: frameShown,
      targetDe: target,
      options, answered,
      isCorrect: answered && !!(f.options[f.selected] && f.options[f.selected].correct),
      solutionEs: primary(sol), solutionDe: secondary(sol),
      isLast: f.idx >= f.total - 1,
    };
  }

  function frasesDoneVM() {
    const f = ctx.state.frases;
    const info = frasesSetInfo(f.setId);
    return { setLabel: info.label, setIcon: info.icon,
      correct: f.correct, total: f.total, perfect: f.total > 0 && f.correct === f.total };
  }

  // ----- Steuerung -----
  function openFrasesSetup() {
    ctx.dismissBadgeToast();
    ctx.setState({ screen: "frasesSetup" });
  }

  function startFrases(setId) {
    ctx.dismissBadgeToast();
    const pool = frasesForSet(setId);
    if (!pool.length) return;
    const queue = ctx.shuffle(pool).map((f) => f.id);
    ctx.state.frases = {
      setId, queue, idx: 0, total: queue.length,
      options: buildFrasesOptions(frasesById(queue[0])),
      selected: null, correct: 0,
    };
    ctx.setState({ screen: "frases" });
  }

  // Eine Option wählen. Erste Wahl zählt; weitere Klicks (nach dem Aufdecken) ignorieren.
  function answerFrases(i) {
    const f = ctx.state.frases;
    if (!f || f.selected !== null) return;
    f.selected = i;
    if (f.options[i] && f.options[i].correct) { f.correct += 1; ctx.buzz(12); } else ctx.buzz(8);
    ctx.render();
  }

  function nextFrases() {
    const f = ctx.state.frases;
    if (!f || f.selected === null) return; // erst antworten, dann weiter
    if (f.idx >= f.total - 1) {
      recordFrasesResult(f);
      ctx.syncBadges(Date.now(), true);
      ctx.setState({ screen: "frasesDone" });
      return;
    }
    f.idx += 1;
    f.selected = null;
    f.options = buildFrasesOptions(frasesById(f.queue[f.idx]));
    ctx.render();
  }

  function frasesAgain() {
    // Dieselbe Themen-Runde noch einmal (startFrases baut state.frases neu auf);
    // fällt auf "Gemischt" zurück, falls (theoretisch) kein Set hinterlegt ist.
    startFrases(ctx.state.frases ? ctx.state.frases.setId : FRASES_ALL);
  }

  // Ergebnis einer beendeten Satzbaukasten-Runde buchen (Ruta-Pass). Zusätzlich
  // das gespielte Thema vermerken – speist den "Alle Themen"-Badge (Gemischt zählt
  // nicht als einzelnes Thema).
  function recordFrasesResult(f) {
    if (!ctx.badges) return;
    const g = Object.assign({}, ctx.gameStats());
    g.frasesPlayed = (g.frasesPlayed || 0) + 1;
    if (f.total > 0 && f.correct === f.total) g.frasesPerfect = (g.frasesPerfect || 0) + 1;
    if (f.setId && f.setId !== FRASES_ALL) {
      const done = Object.assign({}, g.frasesThemesDone);
      done[f.setId] = true;
      g.frasesThemesDone = done;
    }
    ctx.setGameStats(g);
  }

  // ----- Render -----
  // Themen-Auswahl vor der Runde – Reuse der Hostel-Szenenkacheln (.hm-scene)
  // wie bei Definiciones. Die "Gemischt"-Kachel steht zuoberst und abgesetzt.
  function renderFrasesSetup(vm) {
    const tile = (s, mixed) =>
      `<button class="hm-scene${mixed ? " hm-scene--mixed" : ""}" data-action="start-frases" data-set="${esc(s.id)}">
         <span class="hm-scene__icon" aria-hidden="true">${renderIcon(s.icon)}</span>
         <span class="hm-scene__label">${esc(s.label)}${s.lvlShort ? ` <span class="quiz-lvl">${esc(s.lvlShort)}</span>` : ""}<br><span class="quiz-set__intro">${esc(s.intro)}</span></span>
         <span class="hm-scene__count">${s.count}</span>
       </button>`;
    const list = vm.sets.map((s) => tile(s, false)).join("");
    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:blocks")} Frases flexibles`, "home")}
        <p class="hm-intro">${esc(t("discover.frasesIntro"))}</p>
        ${moduleShareBtn("frases")}
        <div class="hm-scenes">
          ${tile(vm.mixed, true)}
          ${list}
        </div>
      </section>`;
  }

  // Satzrahmen mit Lücke + Multiple Choice. Reuse der Definiciones-Optik
  // (.quiz-def / .quiz-opt / .quiz-feedback).
  function renderFrases(vm) {
    const pct = vm.total > 0 ? Math.round(((vm.position + (vm.answered ? 1 : 0)) / vm.total) * 100) : 0;
    // "___" im Rahmen durch eine sichtbare Lücke ersetzen (frameEs ist intern,
    // kein User-Input – esc() lässt "___" unverändert).
    const frameHtml = esc(vm.frameEs).replace("___", '<span class="frases-gap"></span>');
    const options = vm.options
      .map((o, i) => {
        const cls = `quiz-opt${o.state !== "idle" ? " quiz-opt--" + o.state : ""}`;
        const dis = vm.answered ? " disabled aria-disabled=\"true\"" : "";
        const mark = o.state === "correct" ? `<span class="quiz-opt__mark" aria-hidden="true">✓</span>`
          : o.state === "wrong" ? `<span class="quiz-opt__mark" aria-hidden="true">✕</span>` : "";
        return `
          <button class="${cls}" type="button" data-action="frases-answer" data-idx="${i}"${dis}>
            <span class="quiz-opt__text">
              <span class="quiz-opt__es" lang="${esc(vm.lang)}">${esc(o.es)}</span>
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
         <button class="cta" data-action="frases-next">${vm.isLast ? esc(t("common.showResult")) : esc(t("common.next"))}</button>`
      : "";

    return `
      <section class="screen study">
        ${hmTopbar(`${renderIcon(vm.setIcon)} ${esc(vm.setLabel)}`, "open-frases")}
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="${esc(t("common.progress"))}"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="topbar__counter quiz-count" aria-live="polite">${esc(t("discover.frasesSentence", { pos: vm.position + 1, total: vm.total }))}</div>
        <div class="quiz-def">
          <span class="quiz-def__cap">${esc(t("discover.frasesBuild"))}</span>
          <p class="frases-target">${esc(vm.targetDe)}</p>
          <p class="quiz-def__text frases-frame" lang="${esc(vm.lang)}">${frameHtml}</p>
        </div>
        <div class="quiz-opts">${options}</div>
        ${feedback}
      </section>`;
  }

  // Auswertung – leere Bühne für SC.celebrate (app.js mountMiniDone baut die Szene).
  function renderFrasesDone() {
    return `<section class="screen"><div id="cb-mount" class="cb-mount"></div></section>`;
  }

  window.SC.frasesGame = {
    init(injected) { ctx = injected; },
    // SCREENS-Einträge (app.js delegiert).
    setupScreen: () => renderFrasesSetup(frasesSetupVM()),
    playScreen: () => renderFrases(frasesVM()),
    doneScreen: renderFrasesDone,
    // VMs für app-Kern (Sharepic-Highlights bzw. miniDoneConfig).
    setupVM: frasesSetupVM,
    doneVM: frasesDoneVM,
    // Handler (ACTIONS / miniDoneConfig / Deep-Link).
    open: openFrasesSetup,
    start: startFrases,
    answer: answerFrases,
    next: nextFrases,
    again: frasesAgain,
  };
})();
