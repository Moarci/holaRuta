/*
 * features/carrito.js  (SC.carritoSheet) – „El carrito" (Chicos que venden):
 * das kindgerechte Verkaufs-Modul des Locals-Tracks (loc-nino). Ein Info-Blatt
 * mit den englischen Sätzen zum Vorlesen/Kopieren (Produkte, Ofrecer & vender,
 * Precios & vuelto, Saludar & despedir) PLUS ein Solo-Rollenspiel „Vender a un
 * turista" (Multiple-Choice, Inhalt aus SC.ventaRoleplay). Trägt eine kurze
 * Würde-/Sicherheitsnotiz (höflich sein, sicher bleiben, „nein" ist ok).
 *
 * Drei Bildschirme (Sheet/Play/Done wie Diálogos/Venue-Rollenspiel):
 *   - carrito      : das Blatt (Sätze nach Kategorie + Szenen-Auswahl).
 *   - carritoPlay  : ein Zug – Turista-Zeile, dann 3 englische Optionen, Verdikt.
 *   - carritoDone  : Ergebnis (Treffer / fehlerfrei).
 *
 * Reine HTML-String-Views + State-Maschine (ctx.state.carritoRP). UI-Texte als
 * modulinterne Label-Tabelle (es/en/de) statt i18n-Keys – hält die DE↔EN-Parität
 * ohne Mehrdatei-Pflege und ist graceful. Nur im Locals-Track sichtbar (Kachel
 * tracks:["es-en"]); die Lernkarten stehen in data.locals.js (Kategorien loc-nino).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { esc, renderIcon, hmTopbar } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // Die vier loc-nino-Kategorien in Anzeige-Reihenfolge.
  const CATS = ["carrito", "vender-nino", "precios-nino", "charla-nino"];

  // ----- Sprache & lokalisierte Modul-Texte (es/en/de) -----
  const uiLang = () => (ctx && ctx.i18n && ctx.i18n.getLang && ctx.i18n.getLang()) || "es";
  const L = {
    title:   { es: "El carrito", en: "The cart", de: "Der Wagen" },
    intro:   { es: "Inglés sencillo para vender en la calle a los turistas: tus productos, ofrecer y vender, precios y vuelto, y saludar con simpatía.",
               en: "Simple English to sell on the street to tourists: your things, offering and selling, prices and change, and friendly hellos.",
               de: "Einfaches Englisch, um Tourist:innen auf der Straße etwas zu verkaufen: deine Produkte, Anbieten & Verkaufen, Preise & Wechselgeld und freundliches Grüßen." },
    safe:    { es: "Sé amable y respetuoso. Cuídate: quédate en lugares seguros, no subas a autos y está bien decir «no». Tú mandas.",
               en: "Be kind and polite. Stay safe: keep to safe places, never get into cars, and it's okay to say “no”. You're in charge.",
               de: "Sei freundlich und höflich. Bleib sicher: halte dich an sichere Orte, steig in keine Autos und „nein“ sagen ist völlig ok. Du bestimmst." },
    practice:{ es: "Practica la venta", en: "Practise the sale", de: "Den Verkauf üben" },
    listen:  { es: "Escuchar", en: "Listen", de: "Anhören" },
    copy:    { es: "Copiar", en: "Copy", de: "Kopieren" },
    tourist: { es: "Turista", en: "Tourist", de: "Tourist" },
    you:     { es: "Tú", en: "You", de: "Du" },
    yourTurn:{ es: "Tu turno", en: "Your turn", de: "Du bist dran" },
    pick:    { es: "Elige la frase correcta", en: "Choose the right line", de: "Wähle die richtige Zeile" },
    wellSaid:{ es: "¡Bien dicho!", en: "Well said!", de: "Gut gesagt!" },
    better:  { es: "Mejor así:", en: "Better:", de: "Besser so:" },
    replay:  { es: "Escuchar otra vez", en: "Listen again", de: "Nochmal hören" },
    next:    { es: "Siguiente", en: "Next", de: "Weiter" },
    step:    { es: "Turno", en: "Turn", de: "Zug" },
    again:   { es: "Jugar otra vez", en: "Play again", de: "Nochmal spielen" },
    other:   { es: "Otra escena", en: "Another scene", de: "Andere Szene" },
    score:   { es: "Aciertos", en: "Correct", de: "Treffer" },
    perfect: { es: "¡Perfecto, sin errores!", en: "Perfect, no mistakes!", de: "Perfekt, fehlerfrei!" },
    unavailable: { es: "Contenido no disponible.", en: "Content unavailable.", de: "Inhalt nicht verfügbar." },
  };
  const tr = (k) => { const e = L[k] || {}; const l = uiLang(); return e[l] || e.en || e.es || ""; };
  // Kategorie-Überschrift in der UI-Sprache (labelEs/labelEn).
  const catLabel = (c) => (ctx.i18n ? ctx.i18n.natKey(c, "label") : (c.labelEs || c.label));

  // ----- Inhalte (Szenen eager geladen, Karten aus dem aktiven Korpus) -----
  const scenes = () => (window.SC.ventaRoleplay && window.SC.ventaRoleplay.SCENES) || [];
  const sceneById = (id) => scenes().find((s) => s.id === id) || null;
  const cardsOf = (catId) => (ctx.data && ctx.data.CARDS ? ctx.data.CARDS.filter((c) => c.cat === catId) : []);
  const speakable = () => !!(ctx.speech && ctx.speech.isSupported && ctx.speech.isSupported());

  // ===================== Blatt (Sheet) =====================
  function sheetVM() {
    const cats = (ctx.data && ctx.data.CATEGORIES) || [];
    const byId = Object.fromEntries(cats.map((c) => [c.id, c]));
    return {
      groups: CATS.map((id) => ({ cat: byId[id] || { id }, cards: cardsOf(id) })).filter((g) => g.cards.length),
      scenes: scenes().map((s) => ({ id: s.id, title: (s.title && (s.title[uiLang()] || s.title.en || s.title.es)) || s.id, icon: s.icon })),
      speakable: speakable(),
    };
  }

  function phraseRow(card, canSpeak) {
    const sub = esc(card.es) + (card.tip ? ` · <span class="rg-phrase__tip">${esc(card.tip)}</span>` : "");
    const speak = canSpeak
      ? `<button class="rg-copy" type="button" data-action="carrito-speak" data-text="${esc(card.en)}" aria-label="${esc(tr("listen"))}" title="${esc(tr("listen"))}"><span aria-hidden="true">${renderIcon("lc:volume-2")}</span></button>`
      : "";
    const copy = `<button class="rg-copy" type="button" data-action="copy-phrase" data-text="${esc(card.en)}" aria-label="${esc(tr("copy"))}" title="${esc(tr("copy"))}"><span aria-hidden="true">${renderIcon("lc:clipboard-list")}</span></button>`;
    return `
      <li class="rg-phrase rg-phrase--row">
        <span class="rg-phrase__text">
          <span class="rg-phrase__es" lang="en">${esc(card.en)}</span>
          <span class="rg-phrase__de">${sub}</span>
        </span>
        <span class="rg-phrase__actions">${speak}${copy}</span>
      </li>`;
  }

  function renderSheet(vm) {
    const head = hmTopbar(`${renderIcon("lc:shopping-cart")} ${esc(tr("title"))}`, "home");
    const safe = `<p class="hm-intro carrito-safe">🛟 ${esc(tr("safe"))}</p>`;
    const sceneBtns = vm.scenes.map((s) => `
      <button class="dlg-pick" type="button" data-action="carrito-start" data-id="${esc(s.id)}">
        <span class="dlg-pick__icon" aria-hidden="true">${s.icon || renderIcon("lc:handshake")}</span>
        <span class="dlg-pick__text"><span class="dlg-pick__title">${esc(s.title)}</span></span>
        <span class="dlg-pick__chev" aria-hidden="true">›</span>
      </button>`).join("");
    const practice = vm.scenes.length
      ? `<h2 class="rg-head">${renderIcon("lc:handshake")} ${esc(tr("practice"))}</h2><div class="dlg-picks">${sceneBtns}</div>`
      : "";
    const sections = vm.groups.map((g) => `
      <h2 class="rg-head">${renderIcon(g.cat.icon || "lc:shopping-cart")} ${esc(catLabel(g.cat))}</h2>
      <div class="rg-group"><ul class="rg-phrases">${g.cards.map((c) => phraseRow(c, vm.speakable)).join("")}</ul></div>`).join("");
    return `
      <section class="screen">
        ${head}
        <p class="pageintro">${esc(tr("intro"))}</p>
        ${safe}
        ${practice}
        ${sections}
      </section>`;
  }

  // ===================== Rollenspiel (Play/Done) =====================
  function instrText(turn) {
    if (!turn || !turn.instr) return "";
    const l = uiLang();
    const order = [l, "es", "en", "de"];
    for (let i = 0; i < order.length; i++) if (turn.instr[order[i]]) return turn.instr[order[i]];
    return "";
  }

  function currentTurn() {
    const st = ctx.state.carritoRP;
    const scene = st && sceneById(st.sceneId);
    return (scene && scene.turns[st.turnIdx]) || null;
  }

  function playVM() {
    const st = ctx.state.carritoRP;
    if (!st) return { empty: true };
    const scene = sceneById(st.sceneId);
    const turns = (scene && scene.turns) || [];
    const cur = turns[st.turnIdx] || null;
    const transcript = [];
    for (let i = 0; i < st.turnIdx; i++) {
      const tn = turns[i];
      if (tn) transcript.push({ role: tn.role, text: tn.role === "npc" ? tn.en : tn.say, sub: tn.role === "npc" ? tn.es : "" });
    }
    return {
      empty: false,
      title: (scene && scene.title && (scene.title[uiLang()] || scene.title.en)) || "",
      icon: scene ? scene.icon : "🛒",
      total: turns.length,
      step: Math.min(st.turnIdx + 1, turns.length),
      pct: turns.length ? Math.round(((st.turnIdx + (st.result ? 1 : 0)) / turns.length) * 100) : 0,
      transcript,
      role: cur ? cur.role : null,
      npc: cur && cur.role === "npc" ? { en: cur.en, es: cur.es } : null,
      instr: cur && cur.role === "user" ? instrText(cur) : "",
      options: cur && cur.role === "user" && !st.result ? cur.options.map((o) => ({ t: o.t })) : null,
      say: cur ? cur.say : "",
      result: st.result, // null | { correct, given }
      speakable: speakable(),
    };
  }

  function doneVM() {
    const st = ctx.state.carritoRP;
    if (!st) return { title: "", icon: "🛒", correct: 0, total: 0, perfect: false };
    const scene = sceneById(st.sceneId);
    return {
      title: (scene && scene.title && (scene.title[uiLang()] || scene.title.en)) || "",
      icon: scene ? scene.icon : "🛒",
      correct: st.correct,
      total: st.total,
      perfect: st.total > 0 && st.correct === st.total,
    };
  }

  function bubble(role, text, sub) {
    const side = role === "npc" ? "npc" : "user";
    const ico = role === "npc" ? "🧳" : "🙋";
    return `
      <div class="dlg-row dlg-row--${side}">
        <div class="dlg-bubble dlg-bubble--${side}">
          <span class="dlg-bubble__es" lang="${role === "npc" ? "en" : "en"}">${esc(ico + " " + text)}</span>
          ${sub ? `<span class="dlg-bubble__de">${esc(sub)}</span>` : ""}
        </div>
      </div>`;
  }

  function renderPlay(vm) {
    if (vm.empty) return `<section class="screen">${hmTopbar(esc(tr("title")), "open-carrito")}</section>`;
    const head = hmTopbar(`${vm.icon} ${esc(vm.title)}`, "open-carrito");
    const progress = `
      <div class="dlg-progress">
        <div class="progress" role="progressbar" aria-valuenow="${vm.step}" aria-valuemin="1" aria-valuemax="${vm.total}"><div class="progress__bar" style="width:${vm.pct}%"></div></div>
        <span class="dlg-step">${esc(tr("step"))} ${vm.step}/${vm.total}</span>
      </div>`;
    const history = vm.transcript.map((tn) => bubble(tn.role, tn.text, tn.sub)).join("");

    let active = "";
    if (vm.npc && !vm.result) {
      // Turista-Zeile steht (im Transcript ist sie noch nicht) → zeige sie + nichts zu tun?
      // NPC-Züge werden automatisch übersprungen (siehe advance/skipNpc), daher tritt
      // dieser Fall praktisch nicht auf; als Sicherheitsnetz die Zeile anzeigen.
      active = bubble("npc", vm.npc.en, vm.npc.es);
    } else if (vm.options) {
      const role = `<p class="vrp-role"><span aria-hidden="true">🙋</span> ${esc(tr("you"))} — ${esc(tr("yourTurn"))}</p>`;
      const instr = `<p class="dlg-instr">${esc(vm.instr)}</p>`;
      const opts = vm.options.map((o, i) => `
        <button class="quiz-opt" type="button" data-action="carrito-answer" data-idx="${i}">
          <span class="quiz-opt__text"><span class="quiz-opt__es" lang="en">${esc(o.t)}</span></span>
        </button>`).join("");
      active = `<div id="carrito-active">${role}<p class="vrp-pick">${esc(tr("pick"))}</p>${instr}<div class="quiz-opts">${opts}</div></div>`;
    } else if (vm.result) {
      const verdict = vm.result.correct
        ? `<div class="dlg-verdict dlg-verdict--ok" role="status" aria-live="polite">${esc(tr("wellSaid"))}</div>`
        : `<div class="dlg-verdict dlg-verdict--no" role="status" aria-live="polite">${esc(tr("better"))} <b lang="en">${esc(vm.say)}</b></div>`;
      const replay = vm.speakable
        ? `<button class="listen-replay ghostbtn" type="button" data-action="carrito-speak" data-text="${esc(vm.say)}">${esc(tr("replay"))}</button>`
        : "";
      active = `
        <div id="carrito-active">
          ${bubble("user", vm.say, "")}
          ${verdict}
          <div class="dlg-actions">${replay}<button class="cta" data-action="carrito-next">${esc(tr("next"))}</button></div>
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
    const head = hmTopbar(`${vm.icon} ${esc(vm.title)}`, "open-carrito");
    const perfect = vm.perfect ? `<p class="vrp-perfect">${esc(tr("perfect"))}</p>` : "";
    return `
      <section class="screen">
        ${head}
        <div class="vrp-done">
          <p class="vrp-done__score">${esc(tr("score"))}: <b>${vm.correct}/${vm.total}</b></p>
          ${perfect}
          <div class="dlg-actions">
            <button class="cta" data-action="carrito-again">${esc(tr("again"))}</button>
            <button class="ghostbtn" data-action="open-carrito">${esc(tr("other"))}</button>
          </div>
        </div>
      </section>`;
  }

  // ----- Handler -----
  function open() {
    ctx.dismissBadgeToast && ctx.dismissBadgeToast();
    ctx.state.carritoRP = null;
    ctx.setState({ screen: "carrito" });
  }

  function speak(text) {
    if (!text || !ctx.speech) return;
    ctx.speech.speak(text, ctx.settings().speechRate, "en-US");
  }

  // Beim Betreten eines user-Zuges nichts tun; NPC-Züge werden vor der Anzeige
  // „durchgereicht" (die Turista-Zeile landet im Transcript), damit immer eine
  // Auswahl ansteht. Startet auf einem NPC-Zug → sofort ins Transcript schieben.
  function skipNpc() {
    const st = ctx.state.carritoRP;
    const scene = st && sceneById(st.sceneId);
    if (!scene) return;
    while (scene.turns[st.turnIdx] && scene.turns[st.turnIdx].role === "npc") st.turnIdx += 1;
  }

  function start(sceneId) {
    const scene = sceneById(sceneId);
    if (!scene || !scene.turns.length) return;
    const userTurns = scene.turns.filter((tn) => tn.role === "user").length;
    ctx.state.carritoRP = { sceneId: sceneId, turnIdx: 0, result: null, correct: 0, total: userTurns };
    skipNpc();
    ctx.state.screen = "carritoPlay";
    ctx.render();
  }

  function answer(idx) {
    const st = ctx.state.carritoRP;
    if (!st || st.result) return;
    const turn = currentTurn();
    if (!turn || turn.role !== "user" || !turn.options[idx]) return;
    const correct = !!turn.options[idx].ok;
    st.result = { correct, given: turn.options[idx].t };
    if (correct) { st.correct += 1; ctx.buzz && ctx.buzz(12); } else ctx.buzz && ctx.buzz(8);
    speak(turn.say); // Musterzeile in en-US vorlesen
    ctx.render();
  }

  function next() {
    const st = ctx.state.carritoRP;
    if (!st || !st.result) return;
    const scene = sceneById(st.sceneId);
    if (!scene) return;
    st.result = null;
    st.turnIdx += 1;
    skipNpc(); // die nächste Turista-Zeile(n) ins Transcript ziehen
    if (st.turnIdx >= scene.turns.length) {
      record(st);
      ctx.syncBadges && ctx.syncBadges(Date.now(), true);
      ctx.setState({ screen: "carritoDone" });
      return;
    }
    ctx.render();
  }

  function again() {
    const st = ctx.state.carritoRP;
    start(st ? st.sceneId : (scenes()[0] && scenes()[0].id));
  }

  function record(st) {
    if (!ctx.setGameStats || !ctx.gameStats) return;
    const g = Object.assign({}, ctx.gameStats());
    g.carritoPlayed = (g.carritoPlayed || 0) + 1;
    if (st.total > 0 && st.correct === st.total) g.carritoPerfect = (g.carritoPerfect || 0) + 1;
    const done = Object.assign({}, g.carritoScenesDone);
    done[st.sceneId] = true;
    g.carritoScenesDone = done;
    ctx.setGameStats(g);
  }

  window.SC.carritoSheet = {
    init(injected) { ctx = injected; },
    vm: sheetVM,
    screen: () => renderSheet(sheetVM()),
    playScreen: () => renderPlay(playVM()),
    doneScreen: () => renderDone(doneVM()),
    open,
    start,
    answer,
    next,
    again,
    speak,
  };
})();
