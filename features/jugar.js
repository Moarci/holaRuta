/*
 * features/jugar.js  (SC.jugarIngles) – „¡A jugar en inglés!": das kindgerechte
 * Zusammen-Spielen-&-Üben-Modul des Locals-Tracks. LOKAL & OFFLINE by design:
 * zwei Kinder spielen abwechselnd auf EINEM Gerät (Pass-and-play). Kein Konto,
 * kein Netz, keine Fremden, keine personenbezogenen Daten. Über „Invitar a un
 * amigo" (Modul-Teilen, ?m=jugar) kann ein Kind eine Runde an einen Freund
 * schicken, damit sie sich in echt verabreden und zusammen üben.
 *
 * Drei Bildschirme (Setup/Play/Done):
 *   - jugar      : Intro + Einladen + Spiel-Auswahl.
 *   - jugarPlay  : pro Zug erst „Gerät weiterreichen"-Schleuse (Pass-and-play),
 *                  dann die Anweisung (Muttersprache) + englischer Modellsatz zum
 *                  Nachsprechen (mit Vorlese-Knopf), dann „Siguiente".
 *   - jugarDone  : „¡Bien jugado!" + nochmal / anderes Spiel.
 *
 * Reine HTML-String-Views + State-Maschine (ctx.state.jugar). UI-Texte als
 * modulinterne Label-Tabelle (es/en/de). Inhalt eager aus SC.jugar (jugar.js).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { esc, renderIcon, hmTopbar, moduleShareBtn } = window.SC.view;

  let ctx = null;

  const uiLang = () => (ctx && ctx.i18n && ctx.i18n.getLang && ctx.i18n.getLang()) || "es";
  const pick = (o) => (o && (o[uiLang()] || o.en || o.es)) || "";
  const L = {
    title:   { es: "¡A jugar en inglés!", en: "Let's play in English!", de: "Auf Englisch spielen!" },
    intro:   { es: "Un juego para dos: túrnense en un solo teléfono, hablen un poco y practiquen inglés jugando.",
               en: "A game for two: take turns on one phone, chat a little and practise English by playing.",
               de: "Ein Spiel zu zweit: wechselt euch an einem Gerät ab, plaudert ein bisschen und übt Englisch beim Spielen." },
    invite:  { es: "Invita a un amigo", en: "Invite a friend", de: "Lade einen Freund ein" },
    inviteHint: { es: "Comparte el enlace o el QR y quédense en un lugar seguro para jugar juntos.",
               en: "Share the link or QR and meet in a safe place to play together.",
               de: "Teile den Link oder QR und trefft euch an einem sicheren Ort zum gemeinsamen Spielen." },
    choose:  { es: "Elige un juego", en: "Choose a game", de: "Wähle ein Spiel" },
    unavailable: { es: "Contenido no disponible.", en: "Content unavailable.", de: "Inhalt nicht verfügbar." },
    passTo:  { es: "Pasa el teléfono a:", en: "Hand the phone to:", de: "Gib das Gerät weiter an:" },
    ready:   { es: "Listo", en: "Ready", de: "Bereit" },
    yourTurn:{ es: "Tu turno", en: "Your turn", de: "Du bist dran" },
    sayThis: { es: "Di esto en inglés:", en: "Say this in English:", de: "Sag das auf Englisch:" },
    listen:  { es: "Escuchar", en: "Listen", de: "Anhören" },
    next:    { es: "Siguiente", en: "Next", de: "Weiter" },
    step:    { es: "Turno", en: "Turn", de: "Zug" },
    p1:      { es: "Jugador 1", en: "Player 1", de: "Spieler 1" },
    p2:      { es: "Jugador 2", en: "Player 2", de: "Spieler 2" },
    done:    { es: "¡Bien jugado!", en: "Well played!", de: "Gut gespielt!" },
    doneSub: { es: "Practicaron inglés juntos. ¿Otra ronda?", en: "You practised English together. Another round?", de: "Ihr habt zusammen Englisch geübt. Noch eine Runde?" },
    again:   { es: "Jugar otra vez", en: "Play again", de: "Nochmal spielen" },
    other:   { es: "Otro juego", en: "Another game", de: "Anderes Spiel" },
  };
  const tr = (k) => { const e = L[k] || {}; const l = uiLang(); return e[l] || e.en || e.es || ""; };

  const games = () => (window.SC.jugar && window.SC.jugar.GAMES) || [];
  const gameById = (id) => games().find((g) => g.id === id) || null;
  const speakable = () => !!(ctx.speech && ctx.speech.isSupported && ctx.speech.isSupported());
  const playerLabel = (who) => (who === "B" ? tr("p2") : tr("p1"));
  const playerIcon = (who) => (who === "B" ? "🧑" : "🧒");

  // ===================== Setup =====================
  function setupVM() {
    return {
      available: games().length > 0,
      games: games().map((g) => ({ id: g.id, title: pick(g.title), howto: pick(g.howto), icon: g.icon })),
    };
  }

  function renderSetup(vm) {
    const head = hmTopbar(`${renderIcon("lc:dices")} ${esc(tr("title"))}`, "home");
    if (!vm.available) return `<section class="screen">${head}<p class="stat-empty">${esc(tr("unavailable"))}</p></section>`;
    const invite = `
      <h2 class="rg-head">${renderIcon("lc:users")} ${esc(tr("invite"))}</h2>
      <p class="hm-intro">${esc(tr("inviteHint"))}</p>
      ${moduleShareBtn("jugar")}`;
    const cards = vm.games.map((g) => `
      <button class="dlg-pick" type="button" data-action="jugar-start" data-id="${esc(g.id)}">
        <span class="dlg-pick__icon" aria-hidden="true">${g.icon || renderIcon("lc:dices")}</span>
        <span class="dlg-pick__text"><span class="dlg-pick__title">${esc(g.title)}</span><span class="dlg-pick__sub">${esc(g.howto)}</span></span>
        <span class="dlg-pick__chev" aria-hidden="true">›</span>
      </button>`).join("");
    return `
      <section class="screen">
        ${head}
        <p class="pageintro">${esc(tr("intro"))}</p>
        ${invite}
        <h2 class="rg-head">${renderIcon("lc:dices")} ${esc(tr("choose"))}</h2>
        <div class="dlg-picks">${cards}</div>
      </section>`;
  }

  // ===================== Play =====================
  function currentTurn() {
    const st = ctx.state.jugar;
    const game = st && gameById(st.gameId);
    return (game && game.turns[st.turnIdx]) || null;
  }

  function playVM() {
    const st = ctx.state.jugar;
    if (!st) return { empty: true };
    const game = gameById(st.gameId);
    const turns = (game && game.turns) || [];
    const cur = turns[st.turnIdx] || null;
    return {
      empty: false,
      title: pick(game && game.title) || "",
      icon: game ? game.icon : "🎮",
      total: turns.length,
      step: Math.min(st.turnIdx + 1, turns.length),
      pct: turns.length ? Math.round((st.turnIdx / turns.length) * 100) : 0,
      awaitingPass: !!st.awaitingPass,
      who: cur ? cur.who : null,
      playerLabel: cur ? playerLabel(cur.who) : "",
      playerIcon: cur ? playerIcon(cur.who) : "",
      prompt: cur ? pick(cur.prompt) : "",
      say: cur ? cur.say : "",
      tip: cur ? (cur.tip || "") : "",
      speakable: speakable(),
    };
  }

  function renderPlay(vm) {
    if (vm.empty) return `<section class="screen">${hmTopbar(esc(tr("title")), "open-jugar")}</section>`;
    const head = hmTopbar(`${vm.icon} ${esc(vm.title)}`, "open-jugar");
    const progress = `
      <div class="dlg-progress">
        <div class="progress" role="progressbar" aria-valuenow="${vm.step}" aria-valuemin="1" aria-valuemax="${vm.total}"><div class="progress__bar" style="width:${vm.pct}%"></div></div>
        <span class="dlg-step">${esc(tr("step"))} ${vm.step}/${vm.total}</span>
      </div>`;

    let active;
    if (vm.awaitingPass) {
      active = `
        <div class="vrp-pass">
          <p class="vrp-pass__lead">${esc(tr("passTo"))}</p>
          <p class="vrp-pass__role"><span aria-hidden="true">${vm.playerIcon}</span> ${esc(vm.playerLabel)}</p>
          <button class="cta" data-action="jugar-begin">${esc(tr("ready"))}</button>
        </div>`;
    } else {
      const speak = vm.speakable
        ? `<button class="listen-replay ghostbtn" type="button" data-action="jugar-speak" data-text="${esc(vm.say)}">${renderIcon("lc:volume-2")} ${esc(tr("listen"))}</button>`
        : "";
      const tip = vm.tip ? `<p class="jugar-tip">${esc(vm.tip)}</p>` : "";
      active = `
        <div id="jugar-active">
          <p class="vrp-role"><span aria-hidden="true">${vm.playerIcon}</span> ${esc(vm.playerLabel)} — ${esc(tr("yourTurn"))}</p>
          <p class="dlg-instr">${esc(vm.prompt)}</p>
          <p class="jugar-say__lead">${esc(tr("sayThis"))}</p>
          <p class="jugar-say" lang="en">${esc(vm.say)}</p>
          ${tip}
          <div class="dlg-actions">${speak}<button class="cta" data-action="jugar-next">${esc(tr("next"))}</button></div>
        </div>`;
    }
    return `
      <section class="screen study">
        ${head}
        ${progress}
        <div class="dlg-thread">${active}</div>
      </section>`;
  }

  function renderDone() {
    const head = hmTopbar(`${renderIcon("lc:dices")} ${esc(tr("title"))}`, "open-jugar");
    return `
      <section class="screen">
        ${head}
        <div class="vrp-done">
          <p class="vrp-perfect">${esc(tr("done"))}</p>
          <p class="hm-intro">${esc(tr("doneSub"))}</p>
          <div class="dlg-actions">
            <button class="cta" data-action="jugar-again">${esc(tr("again"))}</button>
            <button class="ghostbtn" data-action="open-jugar">${esc(tr("other"))}</button>
          </div>
        </div>
      </section>`;
  }

  // ----- Handler -----
  function open() {
    ctx.dismissBadgeToast && ctx.dismissBadgeToast();
    ctx.state.jugar = null;
    ctx.setState({ screen: "jugar" });
  }

  function start(gameId) {
    const game = gameById(gameId);
    if (!game || !game.turns.length) return;
    ctx.state.jugar = { gameId: gameId, turnIdx: 0, awaitingPass: true };
    ctx.state.screen = "jugarPlay";
    ctx.render();
  }

  function begin() {
    const st = ctx.state.jugar;
    if (!st || !st.awaitingPass) return;
    st.awaitingPass = false;
    ctx.render();
  }

  function speak(text) {
    if (!text || !ctx.speech) return;
    ctx.speech.speak(String(text).replace(/___/g, " "), ctx.settings().speechRate, "en-US");
  }

  function next() {
    const st = ctx.state.jugar;
    if (!st || st.awaitingPass) return;
    const game = gameById(st.gameId);
    if (!game) return;
    if (st.turnIdx >= game.turns.length - 1) {
      record(st);
      ctx.syncBadges && ctx.syncBadges(Date.now(), true);
      ctx.setState({ screen: "jugarDone" });
      return;
    }
    st.turnIdx += 1;
    st.awaitingPass = true; // nächste Person: erst Gerät weiterreichen
    ctx.render();
  }

  function again() {
    const st = ctx.state.jugar;
    start(st ? st.gameId : (games()[0] && games()[0].id));
  }

  function record(st) {
    if (!ctx.setGameStats || !ctx.gameStats) return;
    const g = Object.assign({}, ctx.gameStats());
    g.jugarPlayed = (g.jugarPlayed || 0) + 1;
    const done = Object.assign({}, g.jugarGamesDone);
    if (st) done[st.gameId] = true;
    g.jugarGamesDone = done;
    ctx.setGameStats(g);
  }

  window.SC.jugarIngles = {
    init(injected) { ctx = injected; },
    setupVM,
    setupScreen: () => renderSetup(setupVM()),
    playScreen: () => renderPlay(playVM()),
    doneScreen: renderDone,
    open,
    start,
    begin,
    speak,
    next,
    again,
  };
})();
