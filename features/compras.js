/*
 * features/compras.js  (SC.compras) – „Lista de compras": interaktive Einkaufsliste
 * plus Kurz-Quiz. Drei Bildschirme (Setup/Play/Done-Schema wie Precios):
 *   - compras        : Rubrik wählen (Supermercado/Ropa/Farmacia), Items antippen
 *                      (Wort, Aussprache, Reisetipp, zwei gebrauchsfertige Markt-
 *                      Fragen, Vorlesen) und abhaken (persistenter Stand).
 *   - comprasQuiz    : Multiple-Choice über die Items der aktiven Rubrik.
 *   - comprasQuizDone: Ergebnis (celebrate.js mountet hier; app.js liefert via
 *                      quizDoneVM()/quizAgain/backToList den miniDone-Inhalt).
 * Inhalte aus data.SHOPPING; der Abhak-Stand lebt in gamestats.shoppingSeen.
 *
 * Teil der app.js/ui.js-Zerlegung (Welle D): VMs, Render und alle Handler leben hier
 * zusammen; Controller-Dienste kommen per init(ctx). Der State (state.compras /
 * state.comprasQuiz) bleibt controller-eigen und wird über ctx.state gelesen/
 * geschrieben (in-place – setState mutiert dasselbe Objekt). app.js delegiert die
 * SCREENS-Einträge, die compras-* Aktionen, die Spotlight-Vorschau, den miniDone-
 * Inhalt und den Deep-Link an dieses Modul. Der Eckknopf cornerBtn() kommt aus
 * SC.view (geteilt mit Lernkarte & El Cuerpo).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  // Übersetzer wie in ui.js binden (i18n.js setzt SC.i18n.t === window.t vorab).
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, renderIcon, hmTopbar, moduleShareBtn, cornerBtn } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- Daten-Helfer (Einkaufszettel) -----
  const shoppingSections = () => ctx.data.SHOPPING || [];
  const shoppingSectionById = (id) => shoppingSections().find((s) => s.id === id) || null;
  function shoppingItemById(id) {
    for (const s of shoppingSections()) {
      const it = s.items.find((i) => i.id === id);
      if (it) return it;
    }
    return null;
  }
  // Wie viele Items einer Rubrik sind schon abgehakt?
  function shoppingSectionDone(sec) {
    const seen = ctx.gameStats().shoppingSeen || {};
    return sec.items.reduce((n, it) => n + (seen[it.id] ? 1 : 0), 0);
  }

  // Führenden Artikel (el/la/los/las) abtrennen – für natürlichere Fragen
  // wie «¿Tienen agua?» statt «¿Tienen el agua?».
  function shoppingBareNoun(es) {
    return String(es || "").replace(/^(el|la|los|las)\s+/i, "");
  }

  // Zwei gebrauchsfertige Supermarkt-Fragen pro Item:
  // 1) ob sie es haben, 2) wo man es findet. «¿Dónde puedo encontrar …?»
  // funktioniert für Ein- und Mehrzahl gleich (keine está/están-Falle).
  function shoppingAskPhrases(item) {
    return {
      have: { es: `¿Tienen ${shoppingBareNoun(item.es)}?`, de: t("common.askHave") },
      find: { es: `¿Dónde puedo encontrar ${item.es}?`, de: t("common.askFind") },
    };
  }

  // ----- View-Modelle -----
  function comprasVM() {
    const curId = ctx.state.compras.section;
    const sec = shoppingSectionById(curId) || shoppingSections()[0];
    const seen = ctx.gameStats().shoppingSeen || {};
    const sections = shoppingSections().map((s) => ({
      id: s.id, icon: s.icon, label: s.label, de: ctx.nat(s),
      active: s.id === sec.id, total: s.items.length, done: shoppingSectionDone(s),
    }));
    const items = sec.items.map((it) => ({
      id: it.id, de: ctx.nat(it), es: it.es, tip: it.tip, note: it.note,
      ask: shoppingAskPhrases(it),
      open: ctx.state.compras.open === it.id, seen: !!seen[it.id],
    }));
    return {
      sections,
      section: { id: sec.id, icon: sec.icon, label: sec.label, de: ctx.nat(sec), grad: sec.grad },
      items,
      doneCount: shoppingSectionDone(sec),
      total: sec.items.length,
      speakable: !!(ctx.speech && ctx.speech.isSupported()),
    };
  }

  function openCompras() {
    ctx.dismissBadgeToast();
    if (!shoppingSectionById(ctx.state.compras.section)) {
      ctx.state.compras = { section: (shoppingSections()[0] || {}).id || null, open: null };
    } else {
      ctx.state.compras = { section: ctx.state.compras.section, open: null };
    }
    ctx.setState({ screen: "compras" });
  }

  function comprasSection(id) {
    if (!shoppingSectionById(id)) return;
    ctx.setState({ compras: { section: id, open: null } });
  }

  // Ein Item antippen: nur auf-/zuklappen und beim Aufklappen das Wort
  // vorlesen. Das Abhaken ist davon getrennt (eigene Checkbox), damit man
  // ein Wort nachschlagen kann, ohne es gleich abzuhaken.
  function comprasPick(id) {
    const item = shoppingItemById(id);
    if (!item) return;
    const opening = ctx.state.compras.open !== id;
    ctx.state.compras = { section: ctx.state.compras.section, open: opening ? id : null };
    if (opening) ctx.buzz(8);
    ctx.render();
    if (opening && ctx.speech && ctx.speech.isSupported()) ctx.speech.speak(item.es, ctx.settings().speechRate);
  }

  // Checkbox antippen: Item ab-/aufhaken (echte Einkaufsliste). Der Stand
  // wird persistent gemerkt und lässt sich jederzeit wieder zurücknehmen.
  function comprasToggle(id) {
    if (!id || !shoppingItemById(id)) return;
    const cur = ctx.gameStats().shoppingSeen || {};
    const seen = Object.assign({}, cur);
    if (seen[id]) delete seen[id]; else seen[id] = true;
    ctx.setGameStats(Object.assign({}, ctx.gameStats(), { shoppingSeen: seen }));
    ctx.buzz(seen[id] ? 12 : 8);
    ctx.render();
  }

  // 🔊-Knopf im aufgeklappten Item: das spanische Wort (er-)neut vorlesen.
  function speakCompras(id) {
    const item = shoppingItemById(id);
    if (item && ctx.speech && ctx.speech.isSupported()) ctx.speech.speak(item.es, ctx.settings().speechRate);
  }

  // 🔊-Knopf an einer Supermarkt-Frage: den übergebenen Satz vorlesen.
  function speakComprasPhrase(text) {
    if (text && ctx.speech && ctx.speech.isSupported()) ctx.speech.speak(text, ctx.settings().speechRate);
  }

  // ----- Einkaufszettel-Quiz (Multiple Choice über die Items einer Rubrik) -----
  // Optionen bauen: richtiges Wort + bis zu 3 Ablenker aus derselben Rubrik,
  // dann gemischt. Einmal je Frage berechnet (Re-Render mischt nicht neu).
  function buildComprasOptions(item, pool) {
    const distractors = ctx.shuffle(pool.filter((d) => d.id !== item.id)).slice(0, 3);
    return ctx.shuffle([item, ...distractors]).map((d) => ({ es: d.es, correct: d.id === item.id }));
  }

  function openComprasQuiz() {
    const sec = shoppingSectionById(ctx.state.compras.section);
    if (!sec || sec.items.length < 2) return;
    const queue = ctx.shuffle(sec.items).map((it) => it.id);
    ctx.state.comprasQuiz = {
      section: sec.id,
      queue,
      idx: 0,
      total: queue.length,
      options: buildComprasOptions(shoppingItemById(queue[0]), sec.items),
      selected: null,
      correct: 0,
    };
    ctx.setState({ screen: "comprasQuiz" });
  }

  function comprasQuizVM() {
    const q = ctx.state.comprasQuiz;
    const sec = shoppingSectionById(q.section);
    const item = shoppingItemById(q.queue[q.idx]);
    const answered = q.selected !== null;
    const correctEs = item.es;
    const options = q.options.map((o, i) => ({
      es: o.es,
      state: !answered ? "idle"
        : o.correct ? "correct"
        : i === q.selected ? "wrong"
        : "dim",
    }));
    return {
      sectionIcon: sec ? sec.icon : "🛒",
      sectionLabel: sec ? sec.label : "",
      position: q.idx,
      total: q.total,
      prompt: item.de,
      options,
      answered,
      isCorrect: answered && q.options[q.selected].correct,
      solutionEs: correctEs,
      isLast: q.idx >= q.total - 1,
    };
  }

  // Eine Option wählen. Erste Wahl zählt; spätere Klicks ignorieren.
  function answerComprasQuiz(i) {
    const q = ctx.state.comprasQuiz;
    if (!q || q.selected !== null) return;
    q.selected = i;
    if (q.options[i] && q.options[i].correct) { q.correct += 1; ctx.buzz(12); } else ctx.buzz(8);
    ctx.render();
  }

  function nextComprasQuiz() {
    const q = ctx.state.comprasQuiz;
    if (!q || q.selected === null) return;
    if (q.idx >= q.total - 1) {
      ctx.setState({ screen: "comprasQuizDone" });
      return;
    }
    q.idx += 1;
    q.selected = null;
    const sec = shoppingSectionById(q.section);
    q.options = buildComprasOptions(shoppingItemById(q.queue[q.idx]), sec.items);
    ctx.render();
  }

  function comprasQuizDoneVM() {
    const q = ctx.state.comprasQuiz;
    const sec = shoppingSectionById(q.section);
    return {
      sectionIcon: sec ? sec.icon : "🛒",
      sectionLabel: sec ? sec.label : "",
      correct: q.correct,
      total: q.total,
      perfect: q.total > 0 && q.correct === q.total,
    };
  }

  // „Nochmal" baut die Runde über dieselbe Rubrik neu.
  function comprasQuizAgain() {
    openComprasQuiz();
  }

  // Zurück vom Quiz zum Zettel (gleiche Rubrik bleibt aktiv).
  function comprasBackToList() {
    ctx.state.comprasQuiz = null;
    ctx.state.compras = { section: ctx.state.compras.section, open: null };
    ctx.setState({ screen: "compras" });
  }

  // ----- Render: Einkaufsliste -----
  function renderCompras(vm) {
    const chips = vm.sections
      .map((s) => `
        <button class="sl-chip ${s.active ? "is-active" : ""}" type="button"
                data-action="compras-section" data-id="${esc(s.id)}"
                aria-pressed="${s.active ? "true" : "false"}"
                title="${esc(t("discover.comprasCheckedTitle", { de: s.de, done: s.done, total: s.total }))}">
          <span class="sl-chip__icon" aria-hidden="true">${esc(s.icon)}</span>
          <span class="sl-chip__label">${esc(s.label)}</span>
          ${s.done >= s.total ? `<span class="sl-chip__done" aria-hidden="true">✓</span>` : ""}
        </button>`)
      .join("");

    const items = vm.items
      .map((it) => {
        const speak = it.open && vm.speakable
          ? cornerBtn({ base: "cardbtn--speak sl-speak", on: false, icon: "lc:volume-2", label: t("discover.comprasSpeakWord"),
              action: "compras-speak", extra: `data-id="${esc(it.id)}"` })
          : "";
        // Eine Supermarkt-Frage mit deutschem Label und 🔊 zum Vorlesen.
        const askLine = (ask) => `
          <div class="sl-ask__line">
            <div class="sl-ask__texts">
              <span class="sl-ask__de">${esc(ask.de)}</span>
              <span class="sl-ask__es" lang="es">${esc(ask.es)}</span>
            </div>
            ${vm.speakable
              ? cornerBtn({ base: "cardbtn--speak sl-speak", on: false, icon: "lc:volume-2", label: t("discover.comprasSpeakPhrase"),
                  action: "compras-speak-phrase", extra: `data-say="${esc(ask.es)}"` })
              : ""}
          </div>`;
        const ask = it.ask
          ? `
            <div class="sl-ask">
              <span class="sl-ask__cap">${esc(t("discover.comprasAsk"))}</span>
              ${askLine(it.ask.have)}
              ${askLine(it.ask.find)}
            </div>`
          : "";
        const detail = it.open
          ? `
            <div class="sl-item__detail" role="region" aria-label="${esc(it.de)}">
              <div class="sl-item__estop">
                <p class="sl-item__es" lang="es">${esc(it.es)}</p>
                ${speak}
              </div>
              ${it.tip ? `<p class="sl-item__tip"><span aria-hidden="true">${renderIcon("lc:audio-lines")}</span> ${esc(it.tip)}</p>` : ""}
              ${it.note ? `<p class="sl-item__note">${esc(it.note)}</p>` : ""}
              ${ask}
            </div>`
          : "";
        return `
          <li class="sl-item ${it.open ? "is-open" : ""} ${it.seen ? "is-checked" : ""}">
            <div class="sl-item__head">
              <button class="sl-item__check" type="button" data-action="compras-toggle" data-id="${esc(it.id)}"
                      aria-pressed="${it.seen ? "true" : "false"}"
                      aria-label="${it.seen ? esc(t("discover.comprasUncheck")) : esc(t("discover.comprasCheckOff"))}: ${esc(it.de)}">
                <span class="sl-item__box" aria-hidden="true">✓</span>
              </button>
              <button class="sl-item__row" type="button" data-action="compras-pick" data-id="${esc(it.id)}"
                      aria-expanded="${it.open ? "true" : "false"}">
                <span class="sl-item__de">${esc(it.de)}</span>
                <span class="sl-item__chev" aria-hidden="true">›</span>
              </button>
            </div>
            ${detail}
          </li>`;
      })
      .join("");

    const pct = vm.total > 0 ? Math.round((vm.doneCount / vm.total) * 100) : 0;
    const done = vm.total > 0 && vm.doneCount >= vm.total;
    const progLabel = done ? t("discover.comprasComplete", { total: vm.total }) : t("discover.comprasCheckedCount", { n: vm.doneCount, total: vm.total });
    const progress = `
      <div class="bp-progress">
        <div class="bp-progress__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(progLabel)}"><div class="bp-progress__fill sl-fill" style="width:${pct}%"></div></div>
        <span class="bp-progress__label">${progLabel}</span>
      </div>`;

    const quizBtn = vm.total >= 2
      ? `<button class="cta sl-quizbtn" data-action="open-compras-quiz">${t("discover.comprasQuiz", { section: esc(vm.section.label) })}</button>`
      : "";

    return `
      <section class="screen sl-screen" style="--from:${esc(vm.section.grad[0])};--to:${esc(vm.section.grad[1])}">
        ${hmTopbar(`${renderIcon("lc:shopping-cart")} Lista de compras`, "home")}
        <p class="hm-intro">${esc(t("discover.comprasIntro"))}</p>
        ${moduleShareBtn("compras")}
        <div class="sl-chips" role="group" aria-label="${esc(t("discover.comprasPickSection"))}">${chips}</div>
        ${progress}
        <ul class="sl-list">${items}</ul>
        ${quizBtn}
      </section>`;
  }

  // ----- Render: Quiz -----
  // „Du brauchst X“ (Deutsch) -> richtiges spanisches Wort wählen.
  // Reuse der Definiciones-Optik (.quiz-def / .quiz-opt / .quiz-feedback).
  function renderComprasQuiz(vm) {
    const pct = vm.total > 0 ? Math.round(((vm.position + (vm.answered ? 1 : 0)) / vm.total) * 100) : 0;
    const options = vm.options
      .map((o, i) => {
        const cls = `quiz-opt${o.state !== "idle" ? " quiz-opt--" + o.state : ""}`;
        const dis = vm.answered ? " disabled aria-disabled=\"true\"" : "";
        const mark = o.state === "correct" ? `<span class="quiz-opt__mark" aria-hidden="true">✓</span>`
          : o.state === "wrong" ? `<span class="quiz-opt__mark" aria-hidden="true">✕</span>` : "";
        return `
          <button class="${cls}" type="button" data-action="compras-quiz-answer" data-idx="${i}"${dis}>
            <span class="quiz-opt__text">
              <span class="quiz-opt__es" lang="es">${esc(o.es)}</span>
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
                <span class="quiz-feedback__sol">${t("discover.comprasSolution", { es: esc(vm.solutionEs) })}</span>`}
         </div>
         <button class="cta" data-action="compras-quiz-next">${vm.isLast ? esc(t("common.showResult")) : esc(t("common.next"))}</button>`
      : "";

    return `
      <section class="screen study">
        ${hmTopbar(`${esc(vm.sectionIcon)} ${esc(vm.sectionLabel)}`, "compras-back-list")}
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="${esc(t("discover.quizProgress"))}"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="topbar__counter quiz-count" aria-live="polite">${esc(t("discover.quizQuestion", { pos: vm.position + 1, total: vm.total }))}</div>
        <div class="quiz-def">
          <span class="quiz-def__cap">${esc(t("discover.comprasNeed"))}</span>
          <p class="quiz-def__text">${esc(vm.prompt)}</p>
        </div>
        <div class="quiz-opts">${options}</div>
        ${feedback}
      </section>`;
  }

  function renderComprasQuizDone() {
    return `<section class="screen"><div id="cb-mount" class="cb-mount"></div></section>`;
  }

  window.SC.compras = {
    init(injected) { ctx = injected; },
    // SCREENS-Einträge (app.js delegiert).
    listScreen: () => renderCompras(comprasVM()),
    quizScreen: () => renderComprasQuiz(comprasQuizVM()),
    doneScreen: renderComprasQuizDone,
    // VMs für app-Kern (Spotlight-Vorschau bzw. miniDone-Inhalt).
    vm: comprasVM,
    quizDoneVM: comprasQuizDoneVM,
    // Handler (ACTIONS / miniDone / Deep-Link).
    open: openCompras,
    section: comprasSection,
    pick: comprasPick,
    toggle: comprasToggle,
    speak: speakCompras,
    speakPhrase: speakComprasPhrase,
    openQuiz: openComprasQuiz,
    quizAnswer: answerComprasQuiz,
    quizNext: nextComprasQuiz,
    quizAgain: comprasQuizAgain,
    backToList: comprasBackToList,
  };
})();
