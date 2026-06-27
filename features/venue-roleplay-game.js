/*
 * features/venue-roleplay-game.js  (SC.venueRoleplayGame) – „Roleplay del local":
 * das Zwei-Seiten-Venue-Rollenspiel (WETTBEWERB-EN.md §4, P1). Gast (übt Spanisch)
 * und Personal (übt Englisch) spielen EINE Szene im Wechsel auf EINEM Gerät
 * (Pass-and-play, offline, kein Konto): wer am Zug ist, produziert seine Zeile in der
 * EIGENEN Lernsprache (Multiple-Choice), die andere Seite hört zu. Genau diese
 * Zwei-Richtungs-Übung ist der nicht kopierbare Wedge – beide Lern-Tracks in einer
 * Engine.
 *
 * Drei Bildschirme im Setup/Play/Done-Schema wie Diálogos/Precios:
 *   - venueRoleplaySetup : Szene wählen (Inhalt aus SC.venueRoleplay, eager geladen).
 *   - venueRoleplay      : pro Zug erst „Gerät weiterreichen"-Schleuse, dann Anweisung
 *                          (in der Muttersprache der aktiven Person) + 3 Optionen
 *                          (in der Lernsprache) + Verdikt mit Vorlesen (TTS pro Zeile
 *                          in der richtigen Stimme: Gast es-419, Personal en-US).
 *   - venueRoleplayDone  : Ergebnis (Treffer / fehlerfrei).
 *
 * Reine HTML-String-Views + State-Maschine (ctx.state.venueRoleplay), kein Matcher
 * (MC-only). UI-Texte als modulinterne Label-Tabelle (de/en/es) statt i18n-Keys –
 * hält die DE↔EN-Key-Paritätsprüfung (i18n.test.js) ohne Mehrdatei-Pflege grün und
 * ist graceful. State bleibt controller-eigen (ctx.state, in-place).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { esc, renderIcon, hmTopbar } = window.SC.view;

  let ctx = null;

  // ----- Inhalte (eager geladenes Daten-Modul SC.venueRoleplay) -----
  const mod = () => window.SC.venueRoleplay || null;
  const ready = () => { const m = mod(); return !!(m && m.SCENES && m.SCENES.length); };
  const sceneById = (id) => { const m = mod(); return (m ? m.SCENES.find((s) => s.id === id) : null) || null; };

  // ----- Sprache & Rollen -----
  const uiLang = () => (ctx && ctx.i18n && ctx.i18n.getLang && ctx.i18n.getLang()) || "es";
  // Lokalisierte Modul-Texte (de/en/es). pick() fällt auf en, dann es zurück.
  const L = {
    title:    { es: "Roleplay del local", en: "Venue roleplay", de: "Venue-Rollenspiel" },
    intro:    { es: "Una escena entre huésped y personal: cada quien practica SU idioma, por turnos, en un solo teléfono.",
                en: "A scene between guest and staff: each practises THEIR language, in turns, on one phone.",
                de: "Eine Szene zwischen Gast und Personal: jede:r übt SEINE Sprache, im Wechsel, auf einem Gerät." },
    unavailable: { es: "Contenido no disponible.", en: "Content unavailable.", de: "Inhalt nicht verfügbar." },
    guest:    { es: "Huésped", en: "Guest", de: "Gast" },
    staff:    { es: "Personal", en: "Staff", de: "Personal" },
    passTo:   { es: "Pasa el teléfono a:", en: "Hand the phone to:", de: "Gib das Gerät weiter an:" },
    ready:    { es: "Listo", en: "Ready", de: "Bereit" },
    yourTurn: { es: "Tu turno", en: "Your turn", de: "Du bist dran" },
    pick:     { es: "Elige la frase correcta", en: "Choose the right line", de: "Wähle die richtige Zeile" },
    wellSaid: { es: "¡Bien dicho!", en: "Well said!", de: "Gut gesagt!" },
    better:   { es: "Mejor así:", en: "Better:", de: "Besser so:" },
    you:      { es: "Tú:", en: "You:", de: "Du:" },
    replay:   { es: "Escuchar otra vez", en: "Listen again", de: "Nochmal hören" },
    next:     { es: "Siguiente", en: "Next", de: "Weiter" },
    step:     { es: "Turno", en: "Turn", de: "Zug" },
    again:    { es: "Jugar otra vez", en: "Play again", de: "Nochmal spielen" },
    other:    { es: "Otra escena", en: "Another scene", de: "Andere Szene" },
    score:    { es: "Aciertos", en: "Correct", de: "Treffer" },
    perfect:  { es: "¡Perfecto, sin errores!", en: "Perfect, no mistakes!", de: "Perfekt, fehlerfrei!" },
  };
  const tr = (k) => { const e = L[k] || {}; const l = uiLang(); return e[l] || e.en || e.es || ""; };
  const roleLabel = (role) => tr(role === "staff" ? "staff" : "guest");
  const roleIcon = (role) => (role === "staff" ? "🛎️" : "🧳");
  // Anweisung in der Muttersprache der aktiven Person: Personal (lokal) liest Spanisch;
  // Gast (Reisende:r) liest die UI-Sprache (de/en), mit Rückfall.
  const instrText = (turn) => {
    if (!turn || !turn.instr) return "";
    if (turn.role === "staff") return turn.instr.es || turn.instr.en || turn.instr.de || "";
    const l = uiLang();
    return turn.instr[l] || turn.instr.en || turn.instr.es || turn.instr.de || "";
  };
  // TTS-Locale je produzierter Sprache (unabhängig vom aktiven Track).
  const localeFor = (target) => (target === "es" ? "es-419" : "en-US");

  // ----- View-Modelle -----
  function setupVM() {
    const m = mod();
    return {
      available: ready(),
      scenes: ready() ? m.SCENES.map((s) => ({ id: s.id, title: (s.title && (s.title[uiLang()] || s.title.en || s.title.es)) || s.id, icon: s.icon })) : [],
    };
  }

  function playVM() {
    const st = ctx.state.venueRoleplay;
    if (!st) return { empty: true };
    const scene = sceneById(st.sceneId);
    const turns = (scene && scene.turns) || [];
    const cur = turns[st.turnIdx] || null;
    const transcript = [];
    for (let i = 0; i < st.turnIdx; i++) {
      const tn = turns[i];
      if (tn) transcript.push({ role: tn.role, text: tn.say, target: tn.target, roleLabel: roleLabel(tn.role), roleIcon: roleIcon(tn.role) });
    }
    return {
      empty: false,
      sceneTitle: (scene && scene.title && (scene.title[uiLang()] || scene.title.en)) || "",
      icon: scene ? scene.icon : "lc:handshake",
      turnIdx: st.turnIdx,
      total: turns.length,
      step: Math.min(st.turnIdx + 1, turns.length),
      pct: turns.length ? Math.round(((st.turnIdx + (st.result ? 1 : 0)) / turns.length) * 100) : 0,
      awaitingPass: !!st.awaitingPass,
      transcript,
      role: cur ? cur.role : null,
      roleLabel: cur ? roleLabel(cur.role) : "",
      roleIcon: cur ? roleIcon(cur.role) : "",
      target: cur ? cur.target : null,
      instr: cur ? instrText(cur) : "",
      options: cur && !st.result ? cur.options.map((o) => ({ t: o.t })) : null,
      say: cur ? cur.say : "",
      result: st.result, // null | { correct, given }
      speakable: !!(ctx.speech && ctx.speech.isSupported()),
    };
  }

  function doneVM() {
    const st = ctx.state.venueRoleplay;
    if (!st) return { title: "", icon: "lc:handshake", correct: 0, total: 0, perfect: false };
    const scene = sceneById(st.sceneId);
    return {
      title: (scene && scene.title && (scene.title[uiLang()] || scene.title.en)) || "",
      icon: scene ? scene.icon : "lc:handshake",
      correct: st.correct,
      total: st.total,
      perfect: st.total > 0 && st.correct === st.total,
    };
  }

  // ----- Handler -----
  function open() {
    ctx.dismissBadgeToast && ctx.dismissBadgeToast();
    if (!ready()) return;
    ctx.setState({ screen: "venueRoleplaySetup" });
  }

  function start(sceneId) {
    const scene = sceneById(sceneId);
    if (!scene || !scene.turns.length) return;
    ctx.state.venueRoleplay = { sceneId: sceneId, turnIdx: 0, result: null, correct: 0, total: scene.turns.length, awaitingPass: true };
    ctx.state.screen = "venueRoleplay";
    ctx.render();
  }

  function begin() {
    const st = ctx.state.venueRoleplay;
    if (!st || !st.awaitingPass) return;
    st.awaitingPass = false;
    ctx.render();
  }

  function currentTurn() {
    const st = ctx.state.venueRoleplay;
    const scene = st && sceneById(st.sceneId);
    return (scene && scene.turns[st.turnIdx]) || null;
  }

  function answer(idx) {
    const st = ctx.state.venueRoleplay;
    if (!st || st.awaitingPass || st.result) return;
    const turn = currentTurn();
    if (!turn || !turn.options[idx]) return;
    const correct = !!turn.options[idx].ok;
    st.result = { correct, given: turn.options[idx].t };
    if (correct) { st.correct += 1; ctx.buzz(12); } else ctx.buzz(8);
    speakLine(); // Musterzeile in der richtigen Stimme vorlesen
    ctx.render();
  }

  function next() {
    const st = ctx.state.venueRoleplay;
    if (!st || !st.result) return;
    const scene = sceneById(st.sceneId);
    if (!scene) return;
    if (st.turnIdx >= scene.turns.length - 1) {
      record(st);
      ctx.syncBadges && ctx.syncBadges(Date.now(), true);
      ctx.setState({ screen: "venueRoleplayDone" });
      return;
    }
    st.turnIdx += 1;
    st.result = null;
    st.awaitingPass = true; // nächste Person: erst Gerät weiterreichen
    ctx.render();
  }

  function again() {
    const st = ctx.state.venueRoleplay;
    start(st ? st.sceneId : null);
  }

  // Die Musterzeile des aktuellen Zuges in der zur Zielsprache passenden Stimme
  // vorlesen (Gast = Spanisch, Personal = Englisch). Graceful ohne Sprachausgabe.
  function speakLine() {
    const st = ctx.state.venueRoleplay;
    if (!st || !ctx.speech) return;
    const turn = currentTurn();
    if (!turn) return;
    ctx.speech.speak(turn.say, ctx.settings().speechRate, localeFor(turn.target));
  }

  function record(st) {
    if (!ctx.badges) return;
    const g = Object.assign({}, ctx.gameStats());
    g.venueRoleplayPlayed = (g.venueRoleplayPlayed || 0) + 1;
    if (st.total > 0 && st.correct === st.total) g.venueRoleplayPerfect = (g.venueRoleplayPerfect || 0) + 1;
    const done = Object.assign({}, g.venueRoleplayScenesDone);
    done[st.sceneId] = true;
    g.venueRoleplayScenesDone = done;
    ctx.setGameStats(g);
  }

  // ----- Render: Setup -----
  function renderSetup(vm) {
    const head = hmTopbar(`${renderIcon("lc:handshake")} ${esc(tr("title"))}`, "home");
    if (!vm.available) {
      return `<section class="screen">${head}<p class="stat-empty">${esc(tr("unavailable"))}</p></section>`;
    }
    const cards = vm.scenes.map((s) => `
      <button class="dlg-pick" type="button" data-action="start-venue-roleplay" data-id="${esc(s.id)}">
        <span class="dlg-pick__icon" aria-hidden="true">${renderIcon(s.icon)}</span>
        <span class="dlg-pick__text"><span class="dlg-pick__title">${esc(s.title)}</span></span>
        <span class="dlg-pick__chev" aria-hidden="true">›</span>
      </button>`).join("");
    return `
      <section class="screen">
        ${head}
        <p class="hm-intro">${esc(tr("intro"))}</p>
        <div class="dlg-picks">${cards}</div>
      </section>`;
  }

  function bubble(role, text, target, roleIco) {
    const side = role === "staff" ? "npc" : "user";
    return `
      <div class="dlg-row dlg-row--${side}">
        <div class="dlg-bubble dlg-bubble--${side}">
          <span class="dlg-bubble__es" lang="${esc(target || "")}">${esc((roleIco ? roleIco + " " : "") + text)}</span>
        </div>
      </div>`;
  }

  // ----- Render: Play -----
  function renderPlay(vm) {
    if (vm.empty) return `<section class="screen">${hmTopbar(esc(tr("title")), "open-venue-roleplay")}</section>`;
    const head = hmTopbar(renderIcon(vm.icon) + " " + esc(vm.sceneTitle), "open-venue-roleplay");
    const progress = `
      <div class="dlg-progress">
        <div class="progress" role="progressbar" aria-valuenow="${vm.step}" aria-valuemin="1" aria-valuemax="${vm.total}"><div class="progress__bar" style="width:${vm.pct}%"></div></div>
        <span class="dlg-step">${esc(tr("step"))} ${vm.step}/${vm.total}</span>
      </div>`;
    const history = vm.transcript.map((tn) => bubble(tn.role, tn.text, tn.target, tn.roleIcon)).join("");

    let active = "";
    if (vm.awaitingPass) {
      // Pass-and-play-Schleuse: erst weiterreichen, dann erscheint die Aufgabe.
      active = `
        <div class="vrp-pass" id="vrp-active">
          <p class="vrp-pass__lead">${esc(tr("passTo"))}</p>
          <p class="vrp-pass__role"><span aria-hidden="true">${vm.roleIcon}</span> ${esc(vm.roleLabel)}</p>
          <button class="cta" data-action="venue-roleplay-begin">${esc(tr("ready"))}</button>
        </div>`;
    } else if (!vm.result) {
      const role = `<p class="vrp-role"><span aria-hidden="true">${vm.roleIcon}</span> ${esc(vm.roleLabel)} — ${esc(tr("yourTurn"))}</p>`;
      const instr = `<p class="dlg-instr">${esc(vm.instr)}</p>`;
      const opts = vm.options.map((o, i) => `
        <button class="quiz-opt" type="button" data-action="venue-roleplay-answer" data-idx="${i}">
          <span class="quiz-opt__text"><span class="quiz-opt__es" lang="${esc(vm.target || "")}">${esc(o.t)}</span></span>
        </button>`).join("");
      active = `<div id="vrp-active">${role}<p class="vrp-pick">${esc(tr("pick"))}</p>${instr}<div class="quiz-opts">${opts}</div></div>`;
    } else {
      const verdict = vm.result.correct
        ? `<div class="dlg-verdict dlg-verdict--ok" role="status" aria-live="polite">${esc(tr("wellSaid"))}</div>`
        : `<div class="dlg-verdict dlg-verdict--no" role="status" aria-live="polite">
             ${esc(tr("better"))} <b lang="${esc(vm.target || "")}">${esc(vm.say)}</b>
             <span class="dlg-verdict__given">${esc(tr("you"))} ${esc(vm.result.given || "—")}</span>
           </div>`;
      const replay = vm.speakable
        ? `<button class="listen-replay ghostbtn" type="button" data-action="venue-roleplay-speak">${esc(tr("replay"))}</button>`
        : "";
      active = `
        <div id="vrp-active">
          ${bubble(vm.role, vm.say, vm.target, vm.roleIcon)}
          ${verdict}
          <div class="dlg-actions">${replay}<button class="cta" data-action="venue-roleplay-next">${esc(tr("next"))}</button></div>
        </div>`;
    }

    return `
      <section class="screen study">
        ${head}
        ${progress}
        <div class="dlg-thread">${history}${active}</div>
      </section>`;
  }

  function renderDone(vm) {
    const head = hmTopbar(renderIcon(vm.icon) + " " + esc(vm.title), "open-venue-roleplay");
    const perfect = vm.perfect ? `<p class="vrp-perfect">${esc(tr("perfect"))}</p>` : "";
    return `
      <section class="screen">
        ${head}
        <div class="vrp-done">
          <p class="vrp-done__score">${esc(tr("score"))}: <b>${vm.correct}/${vm.total}</b></p>
          ${perfect}
          <div class="dlg-actions">
            <button class="cta" data-action="venue-roleplay-again">${esc(tr("again"))}</button>
            <button class="ghostbtn" data-action="open-venue-roleplay">${esc(tr("other"))}</button>
          </div>
        </div>
      </section>`;
  }

  window.SC.venueRoleplayGame = {
    init(injected) { ctx = injected; },
    setupScreen: () => renderSetup(setupVM()),
    playScreen: () => renderPlay(playVM()),
    doneScreen: () => renderDone(doneVM()),
    setupVM,
    doneVM,
    open,
    start,
    begin,
    answerMc: answer,
    advance: next,
    again,
    speakLine,
  };
})();
