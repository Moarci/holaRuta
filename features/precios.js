/*
 * features/precios.js  (SC.precios) – „Precios al oído": Preis-Hörtrainer. Beträge
 * werden pro Runde frisch generiert (SC.numbers, via ctx) statt aus festen Karten
 * gezogen – so sind beliebig große, krumme Preise möglich (kolumbianische Pesos in
 * Millionenhöhe, chilenische/argentinische Beträge …). Vorgelesen wird der Betrag,
 * eingetippt werden die Ziffern.
 *
 * Teil der app.js/ui.js-Zerlegung (Welle B). Controller-Dienste per init(ctx):
 * zentraler State, SC.numbers, Sprachausgabe, Persistenz-Accessoren (setGameStats
 * für gamestats, setSettings für die gemerkte Währung/Stufe). Das automatische
 * Vorlesen des ersten Betrags bleibt im Render-Loop des Controllers (autoSpeak).
 * app.js behält die Dispatch-Tabellen und delegiert an die hier exportierten Methoden.
 *
 * Track-fähig: im Locals-Track (es-en) werden die Beträge auf ENGLISCH generiert
 * (SC.numbers toWordsEn/amountEn, Dollar zuerst in der Währungsliste) und über
 * speech.js/ttsLocale automatisch mit en-US-Stimme vorgelesen – hören & tippen
 * wie im Reise-Track, nur in der gelernten Sprache.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, renderIcon, hmTopbar, moduleShareBtn } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  const PRECIOS_ROUND = 10;
  const preciosReady = () => !!(ctx.speech && ctx.speech.isSupported() && ctx.numbers);
  // Sprachfeld der GELERNTEN Seite (Reise: es, Locals: en) – Muster wie in den
  // anderen track-fähigen Feature-Modulen. Steuert Generator-Sprache & lang-Attribut.
  const trackLearnLang = () => (window.SC && window.SC.track && window.SC.track.learnLang && window.SC.track.learnLang()) || "es";
  // Generator-Parameter: nur "en" schaltet SC.numbers um; alles andere = Spanisch.
  const genLang = () => (trackLearnLang() === "en" ? "en" : undefined);

  // ----- View-Modelle -----
  // Setup-Ansicht (Land/Währung + Schwierigkeit wählen).
  function preciosSetupVM() {
    const { state, numbers, natk } = ctx;
    const curKey = state.preciosCurrency;
    const lvl = state.preciosLevel;
    const en = genLang() === "en";
    return {
      speakable: preciosReady(),
      currencies: numbers ? numbers.currencyList(genLang()).map((c) => ({
        key: c.key, flag: c.flag, name: natk(c, "name"), code: c.code, note: natk(c, "note"),
        selected: c.key === curKey,
      })) : [],
      levels: numbers ? numbers.LEVELS.map((l) => ({
        id: l.id, short: l.short, label: natk(l, "label"), hint: natk(l, "hint"), active: l.id === lvl,
      })) : [],
      // Beispiel-Spanne der aktuellen Wahl (gibt eine Vorstellung der Größenordnung).
      sample: numbers ? (() => {
        const c = numbers.currency(curKey);
        const tier = numbers.tierFor(c, lvl);
        return { flag: c.flag, name: natk(c, "name"), max: numbers.format(tier.max),
                 one: en ? (c.oneEn || c.one) : c.one, many: en ? (c.manyEn || c.many) : c.many };
      })() : null,
    };
  }

  function preciosVM() {
    const { state, numbers, natk } = ctx;
    const p = state.precios;
    const item = p.queue[p.idx] || {};
    const cur = numbers ? numbers.currency(p.currencyKey) : { flag: "💵", name: "", code: "" };
    return {
      position: p.idx,
      total: p.total,
      result: p.result, // null | { correct, input }
      answerEs: item.es || "",
      answerDigits: item.digits || "",
      flag: cur.flag,
      currencyName: natk(cur, "name"),
      currencyCode: cur.code,
      isLast: p.idx >= p.total - 1,
      speakable: preciosReady(),
      learnLang: trackLearnLang(), // lang-Attribut der aufgedeckten Wortform
    };
  }

  function preciosDoneVM() {
    const { state, numbers, natk } = ctx;
    const p = state.precios;
    const cur = numbers ? numbers.currency(p.currencyKey) : { flag: "💵", name: "" };
    const lvl = numbers ? (numbers.LEVELS.find((l) => l.id === p.level) || null) : null;
    return {
      correct: p.correct,
      total: p.total,
      perfect: p.total > 0 && p.correct === p.total,
      flag: cur.flag,
      currencyName: natk(cur, "name"),
      levelLabel: lvl ? natk(lvl, "label") : "",
      hard: p.level >= 3,
    };
  }

  // ----- Steuerung -----
  // Einstieg: Setup-Ansicht zeigen (Land/Währung + Stufe). Ohne (unterstützte)
  // Sprachausgabe gibt es nichts zu hören – gleiches Gate wie im UI.
  function openPrecios() {
    ctx.dismissBadgeToast();
    if (!preciosReady()) return;
    ctx.setState({ screen: "preciosSetup" });
  }

  function setPreciosCurrency(key) {
    const { numbers } = ctx;
    // Nur Währungen aus der Liste des Tracks (Reise nie USD, Locals inkl. USD).
    if (!numbers || !numbers.currencyList(genLang()).some((c) => c.key === key)) return;
    ctx.state.preciosCurrency = key;
    ctx.setSettings({ preciosCurrency: key });
    ctx.render();
  }

  function setPreciosLevel(level) {
    const lvl = Number(level);
    if (![1, 2, 3].includes(lvl)) return;
    ctx.state.preciosLevel = lvl;
    ctx.setSettings({ preciosLevel: lvl });
    ctx.render();
  }

  // Runde mit den gewählten Einstellungen starten.
  function startPrecios() {
    if (!preciosReady()) return;
    const curKey = ctx.state.preciosCurrency;
    const level = ctx.state.preciosLevel;
    const queue = ctx.numbers.buildRound(curKey, level, PRECIOS_ROUND, undefined, genLang());
    ctx.state.precios = { currencyKey: curKey, level, queue, idx: 0, total: queue.length, result: null, correct: 0 };
    ctx.state.screen = "precios";
    ctx.render(); // autoSpeak (Controller) spielt den ersten Betrag automatisch ab
  }

  // Getippte Ziffern rein numerisch gegen den Wert prüfen: alle Nicht-Ziffern
  // (Punkte, Leerzeichen, Währungszeichen) ignorieren – "1.250.000" == "1250000".
  function submitPrecios(input) {
    const p = ctx.state.precios;
    if (!p || p.result) return;
    const item = p.queue[p.idx];
    if (!item) return;
    const typed = String(input || "").replace(/\D/g, "");
    const correct = typed.length > 0 && parseInt(typed, 10) === item.value;
    p.result = { input, correct };
    if (correct) { p.correct += 1; ctx.buzz(12); } else ctx.buzz(8);
    ctx.render();
  }

  function nextPrecios() {
    const p = ctx.state.precios;
    if (!p || !p.result) return;
    if (p.idx >= p.total - 1) {
      recordPreciosResult(p);
      ctx.syncBadges(Date.now(), true);
      ctx.setState({ screen: "preciosDone" });
      return;
    }
    p.idx += 1;
    p.result = null;
    ctx.render();
  }

  // „Nochmal" auf der Ergebnis-Seite: gleiche Einstellungen, neue Beträge.
  function preciosAgain() {
    startPrecios();
  }

  function speakPrecios() {
    const p = ctx.state.precios;
    if (!p || !ctx.speech) return;
    const item = p.queue[p.idx];
    if (item) ctx.speech.speak(item.es, ctx.settings().speechRate);
  }

  // Ergebnis einer beendeten Runde in die Spiel-Zähler buchen (Ruta-Pass).
  function recordPreciosResult(p) {
    if (!ctx.badges) return;
    const g = Object.assign({}, ctx.gameStats());
    g.preciosPlayed = (g.preciosPlayed || 0) + 1;
    if (p.total > 0 && p.correct === p.total) g.preciosPerfect = (g.preciosPerfect || 0) + 1;
    // Große-Beträge-Runde (Stufe 3) gemeistert: separat zählen (Badge „Millonario").
    if (p.level >= 3 && p.total > 0 && p.correct === p.total) g.preciosMillon = (g.preciosMillon || 0) + 1;
    ctx.setGameStats(g);
  }

  // ----- Render -----
  // Setup: Land/Währung (mit Flaggen) + Schwierigkeitsstufe wählen, dann starten.
  function renderPreciosSetup(vm) {
    if (!vm.speakable) {
      return `
        <section class="screen">
          ${hmTopbar(`${renderIcon("lc:banknote")} Precios al oído`, "home")}
          <p class="stat-empty">${esc(t("discover.prcNoSpeech"))}</p>
        </section>`;
    }
    const currencies = vm.currencies.map((c) => `
      <button class="prc-cur ${c.selected ? "is-active" : ""}" type="button"
              data-action="precios-currency" data-id="${esc(c.key)}" aria-pressed="${c.selected}">
        <span class="prc-cur__flag" aria-hidden="true">${esc(c.flag)}</span>
        <span class="prc-cur__name">${esc(c.name)}</span>
        <span class="prc-cur__code">${esc(c.code)}</span>
      </button>`).join("");
    const levels = vm.levels.map((l) => `
      <button class="prc-lvl ${l.active ? "is-active" : ""}" type="button"
              data-action="precios-level" data-level="${l.id}" aria-pressed="${l.active}">
        <span class="prc-lvl__short">${esc(l.short)}</span>
        <span class="prc-lvl__label">${esc(l.label)}</span>
        <span class="prc-lvl__hint">${esc(l.hint)}</span>
      </button>`).join("");
    const sample = vm.sample
      ? `<p class="prc-sample">${t("discover.prcSample", { flag: esc(vm.sample.flag), name: esc(vm.sample.name), max: esc(vm.sample.max), many: esc(vm.sample.many) })}</p>`
      : "";
    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:banknote")} Precios al oído`, "home")}
        <p class="hm-intro">${esc(t("discover.prcIntro"))}</p>
        ${moduleShareBtn("precios")}
        <h3 class="prc-head">${t("discover.prcCountryCurrency")}</h3>
        <div class="prc-curs">${currencies}</div>
        <h3 class="prc-head">${esc(t("discover.prcDifficulty"))}</h3>
        <div class="prc-lvls">${levels}</div>
        ${sample}
        <button class="cta" data-action="start-precios">${esc(t("discover.prcStart"))}</button>
      </section>`;
  }

  function renderPrecios(vm) {
    const pct = vm.total > 0 ? Math.round(((vm.position + (vm.result ? 1 : 0)) / vm.total) * 100) : 0;
    const replay = vm.speakable
      ? `<button class="listen-replay ghostbtn" type="button" data-action="precios-speak">${esc(t("discover.prcReplay"))}</button>`
      : "";
    const curTag = `<span class="prc-tag">${esc(vm.flag)} ${esc(vm.currencyCode)}</span>`;
    const body = !vm.result
      ? `
        <div class="card-static card-listen">
          <span class="listen-ear" aria-hidden="true">${renderIcon("lc:banknote")}</span>
          ${replay}
          <span class="face__hint">${esc(t("discover.prcWhich"))}</span>
        </div>
        <form class="typer" data-action="submit-precios" id="precios-form">
          <input class="typer__input" id="precios-answer" type="text" inputmode="numeric"
                 autocomplete="off" autocorrect="off" spellcheck="false" aria-label="${esc(t("discover.prcPlaceholder"))}" placeholder="${esc(t("discover.prcPlaceholder"))}" />
          <button class="typer__btn" type="submit">${esc(t("common.check"))}</button>
        </form>`
      : `
        <div class="card-static ${vm.result.correct ? "is-ok" : "is-no"}" role="status" aria-live="assertive">
          <div class="face__word" lang="${esc(vm.learnLang)}">${esc(vm.answerEs)}</div>
          <div class="listen-de">= ${esc(vm.answerDigits)} ${esc(vm.currencyCode)}</div>
          ${vm.result.correct
            ? `<div class="verdict verdict--ok">${esc(t("common.correctHeard"))}</div>`
            : `<div class="verdict verdict--no">${esc(t("common.notQuiteInput", { input: vm.result.input || "—" }))}</div>`}
        </div>
        <button class="cta" data-action="precios-next">${vm.isLast ? esc(t("common.showResult")) : esc(t("common.next"))}</button>`;
    return `
      <section class="screen study">
        ${hmTopbar(`${renderIcon("lc:banknote")} Precios al oído`, "precios-setup")}
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="${esc(t("discover.prcProgress"))}"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="prc-status"><div class="topbar__counter quiz-count" aria-live="polite">${vm.position + 1}/${vm.total}</div>${curTag}</div>
        ${body}
      </section>`;
  }

  // Auswertung – leere Bühne für SC.celebrate (app.js mountMiniDone baut die Szene).
  function renderPreciosDone() {
    return `<section class="screen"><div id="cb-mount" class="cb-mount"></div></section>`;
  }

  window.SC.precios = {
    init(injected) { ctx = injected; },
    // SCREENS-Einträge (app.js delegiert).
    setupScreen: () => renderPreciosSetup(preciosSetupVM()),
    playScreen: () => renderPrecios(preciosVM()),
    doneScreen: renderPreciosDone,
    // VMs für app-Kern (Sharepic-Highlights bzw. miniDoneConfig).
    setupVM: preciosSetupVM,
    doneVM: preciosDoneVM,
    // Handler (ACTIONS / Submit-Handler / miniDoneConfig / Deep-Link).
    open: openPrecios,
    setCurrency: setPreciosCurrency,
    setLevel: setPreciosLevel,
    start: startPrecios,
    submit: submitPrecios,
    next: nextPrecios,
    again: preciosAgain,
    speak: speakPrecios,
  };
})();
