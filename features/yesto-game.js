/*
 * features/yesto-game.js  (SC.yestoGame) – „¿Y esto?": Bild-Vokabel-Spiel mit
 * Countdown. Ein Motiv (großes Emoji) erscheint, ein kurzer 3-2-1-Countdown läuft
 * („Wie heißt das auf Spanisch?"), dann werden Wort + Übersetzung aufgelöst und man
 * bewertet sich selbst. Motive kommen pro Runde frisch aus dem Datenmodul SC.yesto
 * (kein Foto -> bleibt offline & zero-dependency).
 *
 * Teil der app.js/ui.js-Zerlegung (Welle B). Namespace SC.yestoGame, weil SC.yesto
 * bereits das Datenmodul (Themen/Motive) ist; Screen-/Action-Strings bleiben „yesto…".
 * Controller-Dienste per init(ctx). Der Countdown-Timer ist modul-privat; render()
 * des Controllers schaltet ihn über arm()/disarm() scharf bzw. ab.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, renderIcon, hmTopbar, moduleShareBtn } = window.SC.view;

  let ctx = null;             // vom Controller injizierte Dienste (init)
  let yestoTimer = null;      // genau ein pendelnder Countdown-Tick zur Zeit (modul-privat)

  const YESTO_ROUND = 8;      // Motive pro Runde (jedes Thema hat ≥ 8)
  const YESTO_COUNT_FROM = 3; // Start des Countdowns (3 → 2 → 1 → Auflösung)
  const yestoReady = () => { const y = ctx.yesto; return !!(y && y.THEMES && y.THEMES.length); };

  // Themen-Label in der aktiven UI-Sprache (label/labelEn via nativeText).
  function natTheme(th) { return ctx.i18n.nativeText({ de: th.label, en: th.labelEn }); }

  // ----- View-Modelle -----
  function yestoSetupVM() {
    const yesto = ctx.yesto;
    return {
      available: yestoReady(),
      themes: yestoReady() ? yesto.themeList().map((th) => ({
        id: th.id, icon: th.icon, label: natTheme(th), count: th.count,
      })) : [],
    };
  }

  function yestoVM() {
    const y = ctx.state.yesto;
    const item = (y && y.queue[y.idx]) || {};
    return {
      position: y ? y.idx : 0,
      total: y ? y.total : 0,
      phase: y ? y.phase : "count",
      count: y ? y.count : 0,
      emoji: item.emoji || "",
      es: item.es || "",
      native: ctx.i18n.nativeText({ de: item.de, en: item.en }) || "",
      isLast: y ? y.idx >= y.total - 1 : true,
    };
  }

  function yestoDoneVM() {
    const y = ctx.state.yesto || {};
    const th = yestoReady() ? ctx.yesto.themeById(y.themeId) : null;
    return {
      correct: y.correct || 0,
      total: y.total || 0,
      themeLabel: th ? natTheme(th) : "",
    };
  }

  // ----- Steuerung -----
  function openYesto() {
    ctx.dismissBadgeToast();
    yestoDisarm();
    if (!yestoReady()) return;
    ctx.setState({ screen: "yestoSetup" });
  }

  function startYesto(themeId) {
    if (!yestoReady()) return;
    const queue = ctx.yesto.buildRound(themeId, YESTO_ROUND);
    if (!queue.length) return;
    ctx.state.yesto = { themeId, queue, idx: 0, total: queue.length, phase: "count", count: YESTO_COUNT_FROM, correct: 0 };
    ctx.state.screen = "yesto";
    ctx.render(); // render() schaltet anschließend den ersten Countdown-Tick scharf
  }

  // Den nächsten Countdown-Tick scharf schalten (von render() bei screen==="yesto").
  function yestoArm() {
    yestoDisarm();
    const y = ctx.state.yesto;
    if (!y || y.phase !== "count" || y.count <= 0) return;
    yestoTimer = setTimeout(yestoTick, 1000);
  }
  function yestoDisarm() {
    if (yestoTimer) { clearTimeout(yestoTimer); yestoTimer = null; }
  }
  function yestoTick() {
    yestoTimer = null;
    const y = ctx.state.yesto;
    if (!y || ctx.state.screen !== "yesto" || y.phase !== "count") return;
    y.count -= 1;
    if (y.count <= 0) {
      // Auflösung: hier ändert sich die ganze Bühne (Wort + Bewerten) -> volles
      // render(); dessen Nach-Mount schaltet den Timer ab (Phase ist nicht mehr "count").
      y.phase = "reveal";
      ctx.buzz(10);
      ctx.render();
      return;
    }
    // Reiner Zähl-Tick: nur die Ziffer im DOM tauschen statt der ganze App-Neuaufbau.
    // So läuft kein render() pro Sekunde, das sonst Fokus (manageFocus) und Scroll
    // anfasst. Fehlt der Knoten ausnahmsweise, fällt es sicher auf render() zurück.
    const num = document.querySelector(".ye-count__num");
    if (num) num.textContent = String(y.count); else ctx.render();
    yestoArm(); // nächsten Tick scharf schalten (ohne render())
  }

  // Sofort auflösen (Countdown überspringen) – für Ungeduldige & Screenreader.
  function yestoReveal() {
    const y = ctx.state.yesto;
    if (!y || y.phase !== "count") return;
    yestoDisarm();
    y.phase = "reveal";
    ctx.buzz(10);
    ctx.render();
  }

  // Selbsteinschätzung nach der Auflösung -> nächstes Motiv / Runde beenden.
  function yestoRate(known) {
    const y = ctx.state.yesto;
    if (!y || y.phase !== "reveal") return;
    if (known) { y.correct += 1; ctx.buzz(12); } else ctx.buzz(8);
    if (y.idx >= y.total - 1) {
      recordYestoResult(y); // Zähler buchen, BEVOR die Badges ausgewertet werden
      ctx.syncBadges(Date.now(), true);
      yestoDisarm();
      ctx.setState({ screen: "yestoDone" });
      return;
    }
    y.idx += 1;
    y.phase = "count";
    y.count = YESTO_COUNT_FROM;
    ctx.render();
  }

  function yestoAgain() { startYesto(ctx.state.yesto ? ctx.state.yesto.themeId : null); }

  // Ergebnis einer beendeten ¿Y-esto?-Runde in die Spiel-Zähler buchen (Ruta-Pass).
  // „Perfekt" = bei jedem Bild „Wusste ich" getippt (correct === total).
  function recordYestoResult(y) {
    if (!ctx.badges) return;
    const g = Object.assign({}, ctx.gameStats());
    g.yestoPlayed = (g.yestoPlayed || 0) + 1;
    if (y.total > 0 && y.correct === y.total) g.yestoPerfect = (g.yestoPerfect || 0) + 1;
    ctx.setGameStats(g);
  }

  // ----- Render -----
  function renderYestoSetup(vm) {
    if (!vm.available) {
      return `
        <section class="screen">
          ${hmTopbar(`${renderIcon("lc:eye")} ¿Y esto?`, "home")}
          <p class="stat-empty">${esc(t("discover.yeUnavailable"))}</p>
        </section>`;
    }
    const themes = vm.themes.map((th) => `
      <button class="ye-theme" type="button" data-action="start-yesto" data-id="${esc(th.id)}">
        <span class="ye-theme__icon" aria-hidden="true">${renderIcon(th.icon)}</span>
        <span class="ye-theme__label">${esc(th.label)}</span>
        <span class="ye-theme__count">${esc(t("discover.yeCount", { n: th.count }))}</span>
      </button>`).join("");
    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:eye")} ¿Y esto?`, "home")}
        <p class="hm-intro">${esc(t("discover.yeIntro"))}</p>
        ${moduleShareBtn("yesto")}
        <h3 class="prc-head">${esc(t("discover.yeChooseTheme"))}</h3>
        <div class="ye-themes">${themes}</div>
      </section>`;
  }

  function renderYesto(vm) {
    const shown = vm.position + (vm.phase === "reveal" ? 1 : 0);
    const pct = vm.total > 0 ? Math.round((shown / vm.total) * 100) : 0;
    const stage = vm.phase !== "reveal"
      ? `
        <div class="ye-stage" role="group" aria-label="${esc(t("discover.yePromptHint"))}">
          <div class="ye-emoji" aria-hidden="true">${esc(vm.emoji)}</div>
          <div class="ye-q">¿Y esto?</div>
          <div class="ye-think">${esc(t("discover.yePromptHint"))}</div>
          <div class="ye-count" aria-hidden="true"><span class="ye-count__num">${esc(String(vm.count))}</span></div>
        </div>
        <button class="cta cta--ghost" data-action="yesto-reveal">${esc(t("discover.yeReveal"))}</button>`
      : `
        <div class="ye-stage is-reveal" role="status" aria-live="assertive">
          <div class="ye-emoji" aria-hidden="true">${esc(vm.emoji)}</div>
          <div class="ye-word" lang="es">${esc(vm.es)}</div>
          <div class="ye-native">${esc(vm.native)}</div>
        </div>
        <div class="ye-rate">
          <button class="cta cta--soft" data-action="yesto-rate" data-known="0">${esc(t("discover.yeUnknown"))}</button>
          <button class="cta" data-action="yesto-rate" data-known="1">${vm.isLast ? esc(t("discover.yeKnownLast")) : esc(t("discover.yeKnown"))}</button>
        </div>`;
    return `
      <section class="screen study">
        ${hmTopbar(`${renderIcon("lc:eye")} ¿Y esto?`, "open-yesto")}
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="${esc(t("common.progress"))}"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="topbar__counter quiz-count" aria-live="polite">${vm.position + 1}/${vm.total}</div>
        ${stage}
      </section>`;
  }

  // Auswertung – leere Bühne für SC.celebrate (app.js mountMiniDone baut die Szene).
  function renderYestoDone() {
    return `<section class="screen"><div id="cb-mount" class="cb-mount"></div></section>`;
  }

  window.SC.yestoGame = {
    init(injected) { ctx = injected; },
    // SCREENS-Einträge (app.js delegiert).
    setupScreen: () => renderYestoSetup(yestoSetupVM()),
    playScreen: () => renderYesto(yestoVM()),
    doneScreen: renderYestoDone,
    // VM für miniDoneConfig (app.js).
    setupVM: yestoSetupVM,
    doneVM: yestoDoneVM,
    // Countdown-Timer: render() des Controllers schaltet ihn scharf/ab.
    arm: yestoArm,
    disarm: yestoDisarm,
    // Handler (ACTIONS / miniDoneConfig / Deep-Link).
    open: openYesto,
    start: startYesto,
    reveal: yestoReveal,
    rate: yestoRate,
    again: yestoAgain,
  };
})();
