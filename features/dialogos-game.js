/*
 * features/dialogos-game.js  (SC.dialogosGame) – „Diálogos": Gesprächs-Simulator.
 * Eine Reisesituation Zug für Zug: die Gegenseite (npc) spricht, der Nutzer
 * antwortet per Multiple-Choice oder freiem Tippen (Antwortprüfung via
 * matcher.normalize). Drei Bildschirme (Setup/Play/Done-Schema wie Precios/Compras):
 *   - dialogosSetup : Szenario wählen (lazy: lädt das Content-Modul SC.dialogos).
 *   - dialogos      : Chat-Verlauf + aktiver Zug (npc-Blase / MC / Frei-Tippen /
 *                     Verdikt). Auto-Vorlesen des npc-Zugs + Scroll-Post-Render-Hook.
 *   - dialogosDone  : Ergebnis (celebrate.js mountet hier; app.js liefert via
 *                     doneVM()/again/open den miniDone-Inhalt).
 * Inhalte aus dem optionalen, lazy geladenen Content-Modul SC.dialogos
 * (DIALOGOS, DIALOGOS_SCENARIOS); der Ruta-Pass-Stand lebt in gamestats.
 *
 * Teil der app.js/ui.js-Zerlegung (Welle D, Abschluss) – das komplexeste Feature:
 * State-Maschine (state.dialogos), 8 Handler, Frei-Text-Prüfung, Scroll-Hook und
 * optionales TTS. State bleibt controller-eigen (ctx.state, in-place). app.js
 * delegiert SCREENS, die dialogos-* Aktionen, die Spotlight-Vorschau, den miniDone-
 * Inhalt, den Scroll-Post-Render-Hook (scrollActive) und das Auto-Vorlesen
 * (autoSpeakItem). {name}/{gender}-Auflösung kommt als ctx.withName aus dem
 * Controller (geteilt mit Rollenspiel/Karten-Kontext). Modul-Global heißt
 * SC.dialogosGame, damit es nicht mit dem Content-Modul SC.dialogos kollidiert.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  // Übersetzer wie in ui.js binden (i18n.js setzt SC.i18n.t === window.t vorab).
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, hmTopbar, moduleShareBtn } = window.SC.view;

  let ctx = null;  // vom Controller injizierte Dienste (init)
  let root = null; // App-Container (ctx.root) – Ziel des Scroll-Hooks

  // ----- Daten-Helfer (lesen das lazy geladene Content-Modul SC.dialogos) -----
  const dlgMod = () => window.SC.dialogos || null;
  const dialogosReady = () => { const m = dlgMod(); return !!(m && m.DIALOGOS_SCENARIOS && m.DIALOGOS_SCENARIOS.length); };
  const dialogueById = (id) => { const m = dlgMod(); return (m ? m.DIALOGOS.find((d) => d.id === id) : null) || null; };
  const scenarioById = (id) => { const m = dlgMod(); return (m ? m.DIALOGOS_SCENARIOS.find((s) => s.id === id) : null) || null; };

  // ----- View-Modelle -----
  function dialogosSetupVM() {
    const m = dlgMod();
    return {
      available: dialogosReady(),
      scenarios: dialogosReady()
        ? m.DIALOGOS_SCENARIOS
            .filter((s) => m.DIALOGOS.some((d) => d.cat === s.id))
            .map((s) => ({ id: s.id, title: ctx.natk(s, "title"), icon: s.icon, lvl: s.lvl, intro: ctx.natk(s, "intro") }))
        : [],
      hasSpeech: !!(ctx.speech && ctx.speech.isSupported()),
    };
  }

  function dialogosVM() {
    const d = ctx.state.dialogos;
    // Schutz wie in den Handlern: ohne aktiven Dialog-State eine harmlose Leer-VM
    // statt eines Deref-Crashes (state.dialogos wird nicht persistiert).
    if (!d) return { title: "", icon: "💬", turnIdx: 0, total: 0, transcript: [], current: null, result: null, hint: false, speakable: false };
    const dia = dialogueById(d.dialogueId);
    const turns = (dia && dia.turns) || [];
    const scn = scenarioById(d.scenarioId);
    // Verlaufsspur: alle bereits abgehandelten Züge (npc komplett, beantwortete
    // user-Züge mit der Musterantwort als „gesagter" Zeile).
    const transcript = [];
    for (let i = 0; i < d.turnIdx; i++) {
      const turn = turns[i];
      if (!turn) continue;
      if (turn.who === "npc") transcript.push({ who: "npc", es: ctx.withName(turn.es), de: ctx.withName(ctx.nat(turn)) });
      else transcript.push({ who: "user", es: ctx.withName(turn.solEs), de: "" });
    }
    const cur = turns[d.turnIdx] || null;
    const current = cur
      ? (cur.who === "npc"
          ? { who: "npc", es: ctx.withName(cur.es), de: ctx.withName(ctx.nat(cur)) }
          : {
              who: "user",
              kind: cur.kind,
              de: ctx.withName(ctx.nat(cur)),
              solEs: ctx.withName(cur.solEs),
              why: ctx.withName(ctx.natk(cur, "why") || ""),
              options: cur.kind === "mc" ? cur.options.map((o) => ({ es: ctx.withName(o.es) })) : null,
            })
      : null;
    return {
      title: dia ? ctx.natk(dia, "title") : "",
      icon: scn ? scn.icon : "💬",
      turnIdx: d.turnIdx,
      total: turns.length,
      transcript,
      current,
      result: d.result, // null | { correct, given }
      hint: !!d.hint,   // Musterantwort beim Frei-Tippen aufgedeckt?
      speakable: !!(ctx.speech && ctx.speech.isSupported()),
    };
  }

  function dialogosDoneVM() {
    const d = ctx.state.dialogos;
    if (!d) return { title: "", icon: "💬", correct: 0, total: 0, perfect: false };
    const dia = dialogueById(d.dialogueId);
    const scn = scenarioById(d.scenarioId);
    return {
      title: dia ? ctx.natk(dia, "title") : "",
      icon: scn ? scn.icon : "💬",
      correct: d.correct,
      total: d.totalUser,
      perfect: d.totalUser > 0 && d.correct === d.totalUser,
    };
  }

  // ----- Handler -----
  function openDialogosSetup() {
    ctx.dismissBadgeToast();
    // Epoche festhalten: navigiert der Nutzer weg, während das (heute eager, künftig
    // evtl. lazy) Modul lädt, snappt der Callback ihn nicht zurück.
    const epoch = ctx.navEpoch();
    ctx.loadModule("dialogos", () => {
      if (!dialogosReady() || ctx.navEpoch() !== epoch) return;
      ctx.setState({ screen: "dialogosSetup" });
    });
  }

  function startDialogos(scenarioId) {
    if (!dialogosReady()) return;
    const pool = dlgMod().DIALOGOS.filter((d) => d.cat === scenarioId);
    if (!pool.length) return;
    const dia = pool[Math.floor(Math.random() * pool.length)];
    const totalUser = dia.turns.filter((tn) => tn.who === "user").length;
    ctx.state.dialogos = { scenarioId, dialogueId: dia.id, turnIdx: 0, result: null, hint: false, correct: 0, totalUser };
    ctx.state.screen = "dialogos";
    ctx.render(); // autoSpeakTarget liest den ersten npc-Zug vor
  }

  // Aktuellen user-Zug holen (oder null, wenn der aktuelle Zug ein npc-Zug ist).
  function currentUserTurn() {
    const d = ctx.state.dialogos;
    const dia = dialogueById(d.dialogueId);
    const turn = dia && dia.turns[d.turnIdx];
    return turn && turn.who === "user" ? turn : null;
  }

  function answerDialogosMc(idx) {
    const d = ctx.state.dialogos;
    if (!d || d.result) return;
    const turn = currentUserTurn();
    if (!turn || turn.kind !== "mc" || !turn.options[idx]) return;
    const correct = !!turn.options[idx].ok;
    d.result = { correct, given: ctx.withName(turn.options[idx].es) };
    if (correct) { d.correct += 1; ctx.buzz(12); } else ctx.buzz(8);
    ctx.render();
  }

  function submitDialogosType(input) {
    const d = ctx.state.dialogos;
    if (!d || d.result) return;
    const turn = currentUserTurn();
    if (!turn || turn.kind !== "type") return;
    const norm = ctx.matcher.normalize(input);
    const accepted = [turn.solEs].concat(turn.accept || []).map((s) => ctx.matcher.normalize(ctx.withName(s)));
    const correct = norm.length > 0 && accepted.indexOf(norm) !== -1;
    d.result = { correct, given: input };
    if (correct) { d.correct += 1; ctx.buzz(12); } else ctx.buzz(8);
    ctx.render();
  }

  // Weiter: vom aktuellen Zug zum nächsten. npc-Züge brauchen kein Ergebnis,
  // user-Züge erst nach einer Antwort. Am Ende -> Done-Screen.
  function advanceDialogos() {
    const d = ctx.state.dialogos;
    if (!d) return;
    const dia = dialogueById(d.dialogueId);
    if (!dia) return;
    const cur = dia.turns[d.turnIdx];
    if (cur && cur.who === "user" && !d.result) return; // user-Zug erst beantworten
    if (d.turnIdx >= dia.turns.length - 1) {
      recordDialogosResult(d);
      ctx.syncBadges(Date.now(), true);
      ctx.setState({ screen: "dialogosDone" });
      return;
    }
    d.turnIdx += 1;
    d.result = null;
    d.hint = false;
    ctx.render();
  }

  // Tipp aufdecken: zeigt beim Frei-Tippen die Musterantwort als Hilfe. Reine
  // Anzeige – die Antwort muss weiterhin getippt werden, der Zug zählt normal.
  function dialogosHint() {
    const d = ctx.state.dialogos;
    if (!d || d.result) return;
    const turn = currentUserTurn();
    if (!turn || turn.kind !== "type") return;
    d.hint = true;
    ctx.render();
  }

  function dialogosAgain() {
    startDialogos(ctx.state.dialogos ? ctx.state.dialogos.scenarioId : null);
  }

  function speakDialogosNpc() {
    const d = ctx.state.dialogos;
    if (!d || !ctx.speech) return;
    const dia = dialogueById(d.dialogueId);
    const turn = dia && dia.turns[d.turnIdx];
    if (turn && turn.who === "npc") ctx.speech.speak(ctx.withName(turn.es), ctx.settings().speechRate);
  }

  // Ergebnis einer beendeten Dialog-Runde buchen (Ruta-Pass): Anzahl, fehlerfreie
  // Runden und das distinkt gespielte Szenario.
  function recordDialogosResult(d) {
    if (!ctx.badges) return;
    const g = Object.assign({}, ctx.gameStats());
    g.dialogosPlayed = (g.dialogosPlayed || 0) + 1;
    if (d.totalUser > 0 && d.correct === d.totalUser) g.dialogosPerfect = (g.dialogosPerfect || 0) + 1;
    const done = Object.assign({}, g.dialogosScenesDone);
    done[d.scenarioId] = true;
    g.dialogosScenesDone = done;
    ctx.setGameStats(g);
  }

  // ----- Auto-Vorlesen (app.js → autoSpeakTarget delegiert die Diálogos-Verzweigung) -----
  // Liefert { key, text } des aktuell automatisch vorzulesenden npc-Zugs – oder
  // null. Der Schlüssel je Zug verhindert mehrfaches Vorlesen beim Re-Render.
  function autoSpeakItem() {
    const d = ctx.state.dialogos;
    if (!d) return null;
    const dia = dialogueById(d.dialogueId);
    const turn = dia && dia.turns[d.turnIdx];
    if (turn && turn.who === "npc") return { key: "dialogos:" + d.dialogueId + ":" + d.turnIdx, text: ctx.withName(turn.es) };
    return null;
  }

  // ----- Scroll-Post-Render-Hook (app.js ruft nach jedem dialogos-Render auf) -----
  // Scrollt den aktiven Dialog-Abschnitt (#dlg-active) sanft in den Blick. Per
  // requestAnimationFrame, damit das Layout nach dem innerHTML steht.
  // Normalfall (npc-Satz, Optionen, Verdikt): block:"end" hält den darüber-
  // liegenden npc-Satz mit im Bild. Tipp-Zug dagegen: das Eingabefeld mittig
  // halten – mit block:"end" schöbe es sonst genau hinter die eingeblendete
  // Tastatur, und der Nutzer sähe nicht, was er tippt.
  function scrollDialogActive() {
    if (typeof requestAnimationFrame !== "function") return;
    requestAnimationFrame(function () {
      const active = root.querySelector("#dlg-active");
      if (!active) return;
      const input = active.querySelector("#dialogos-answer");
      const target = input || active;
      const block = input ? "center" : "end";
      const motion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      try { target.scrollIntoView({ behavior: motion ? "auto" : "smooth", block }); } catch (e) { /* egal */ }
    });
  }

  // ----- Render: Setup -----
  function renderDialogosSetup(vm) {
    if (!vm.available) {
      return `
        <section class="screen">
          ${hmTopbar("💬 Diálogos", "home")}
          <p class="stat-empty">${esc(t("discover.dlgUnavailable"))}</p>
        </section>`;
    }
    const hint = vm.hasSpeech ? "" : `<p class="dlg-nospeak">${esc(t("discover.dlgNoSpeak"))}</p>`;
    const cards = vm.scenarios.map((s) => `
      <button class="dlg-pick" type="button" data-action="start-dialogos" data-id="${esc(s.id)}">
        <span class="dlg-pick__icon" aria-hidden="true">${esc(s.icon)}</span>
        <span class="dlg-pick__text">
          <span class="dlg-pick__title">${esc(s.title)}</span>
          <span class="dlg-pick__sub">${esc(s.intro)}</span>
        </span>
        <span class="dlg-pick__chev" aria-hidden="true">›</span>
      </button>`).join("");
    return `
      <section class="screen">
        ${hmTopbar("💬 Diálogos", "home")}
        <p class="hm-intro">${esc(t("discover.dlgIntro"))}</p>
        ${moduleShareBtn("dialogos")}
        ${hint}
        <div class="dlg-picks">${cards}</div>
      </section>`;
  }

  // Eine Chat-Blase (npc links, user rechts). de optional als Unterzeile.
  function dlgBubble(turn) {
    const side = turn.who === "npc" ? "npc" : "user";
    const de = turn.de ? `<span class="dlg-bubble__de">${esc(turn.de)}</span>` : "";
    return `
      <div class="dlg-row dlg-row--${side}">
        <div class="dlg-bubble dlg-bubble--${side}">
          <span class="dlg-bubble__es" lang="es">${esc(turn.es)}</span>
          ${de}
        </div>
      </div>`;
  }

  // ----- Render: aktiver Dialog -----
  function renderDialogos(vm) {
    const pct = vm.total > 0 ? Math.round(((vm.turnIdx + (vm.result ? 1 : 0)) / vm.total) * 100) : 0;
    const history = vm.transcript.map(dlgBubble).join("");

    let active = "";
    const cur = vm.current;
    if (cur && cur.who === "npc") {
      // npc-Zug: Blase zeigen (+ Vorlesen), dann „Weiter“.
      const replay = vm.speakable
        ? `<button class="listen-replay ghostbtn" type="button" data-action="dialogos-speak">${esc(t("discover.dlgReplay"))}</button>`
        : "";
      active = `
        ${dlgBubble({ who: "npc", es: cur.es, de: cur.de })}
        <div class="dlg-actions">
          ${replay}
          <button class="cta" data-action="dialogos-next">${esc(t("common.next"))}</button>
        </div>`;
    } else if (cur && cur.who === "user") {
      const instr = `<p class="dlg-instr">${esc(cur.de)}</p>`;
      if (!vm.result) {
        if (cur.kind === "mc") {
          const opts = cur.options.map((o, i) => `
            <button class="quiz-opt" type="button" data-action="dialogos-answer" data-idx="${i}">
              <span class="quiz-opt__text"><span class="quiz-opt__es" lang="es">${esc(o.es)}</span></span>
            </button>`).join("");
          active = `${instr}<div class="quiz-opts">${opts}</div>`;
        } else {
          // Frei tippen. Optionaler „Tipp" deckt die Musterantwort auf – als
          // Hilfe, ohne den Zug vorwegzunehmen (getippt werden muss trotzdem).
          const help = vm.hint
            ? `<p class="dlg-tip" role="note"><span aria-hidden="true">💡</span> <b lang="es">${esc(cur.solEs)}</b></p>`
            : `<button class="dlg-tipbtn ghostbtn" type="button" data-action="dialogos-hint">${esc(t("discover.dlgTipShow"))}</button>`;
          active = `
            ${instr}
            <form class="typer" data-action="submit-dialogos" id="dialogos-form">
              <input class="typer__input" id="dialogos-answer" type="text" inputmode="text"
                     autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" lang="es" aria-label="${esc(t("discover.dlgPlaceholder"))}" placeholder="${esc(t("discover.dlgPlaceholder"))}" />
              <button class="typer__btn" type="submit">${esc(t("discover.dlgSay"))}</button>
            </form>
            ${help}`;
        }
      } else {
        // Beantwortet: die eigene (Muster-)Replik als Blase + Verdict + Weiter.
        const verdict = vm.result.correct
          ? `<div class="dlg-verdict dlg-verdict--ok" role="status" aria-live="polite">${esc(t("discover.dlgWellSaid"))}</div>`
          : `<div class="dlg-verdict dlg-verdict--no" role="status" aria-live="polite">
               ${t("discover.dlgBetter", { es: esc(cur.solEs) })}
               <span class="dlg-verdict__given">${esc(t("discover.dlgYou", { given: vm.result.given || "—" }))}</span>
             </div>`;
        // Kurzer Hintergrund zur Musterantwort – zum Ausklappen, damit er nur
        // stört, wenn man ihn wirklich lesen will.
        const why = cur.why
          ? `<details class="dlg-why">
               <summary class="dlg-why__sum">${esc(t("discover.dlgWhy"))}</summary>
               <p class="dlg-why__body">${esc(cur.why)}</p>
             </details>`
          : "";
        active = `
          ${dlgBubble({ who: "user", es: cur.solEs, de: "" })}
          ${verdict}
          ${why}
          <button class="cta" data-action="dialogos-next">${esc(t("common.next"))}</button>`;
      }
    }

    const step = Math.min(vm.turnIdx + 1, vm.total);
    return `
      <section class="screen study">
        ${hmTopbar(vm.icon + " " + esc(vm.title), "open-dialogos")}
        <div class="dlg-progress">
          <div class="progress" role="progressbar" aria-valuenow="${step}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="${esc(t("common.progress"))}"><div class="progress__bar" style="width:${pct}%"></div></div>
          <span class="dlg-step">${esc(t("discover.dlgStep", { step, total: vm.total }))}</span>
        </div>
        <div class="dlg-thread">
          ${history}
          <div id="dlg-active">${active}</div>
        </div>
      </section>`;
  }

  function renderDialogosDone() {
    return `<section class="screen"><div id="cb-mount" class="cb-mount"></div></section>`;
  }

  window.SC.dialogosGame = {
    init(injected) { ctx = injected; root = ctx.root; },
    // SCREENS-Einträge (app.js delegiert).
    setupScreen: () => renderDialogosSetup(dialogosSetupVM()),
    playScreen: () => renderDialogos(dialogosVM()),
    doneScreen: renderDialogosDone,
    // VMs / Hooks für app-Kern (Spotlight-Vorschau, miniDone, Auto-Vorlesen, Scroll).
    setupVM: dialogosSetupVM,
    doneVM: dialogosDoneVM,
    autoSpeakItem,
    scrollActive: scrollDialogActive,
    // Handler (ACTIONS / Submit / miniDone / Deep-Link).
    open: openDialogosSetup,
    start: startDialogos,
    answerMc: answerDialogosMc,
    submitType: submitDialogosType,
    advance: advanceDialogos,
    hint: dialogosHint,
    again: dialogosAgain,
    speakNpc: speakDialogosNpc,
  };
})();
