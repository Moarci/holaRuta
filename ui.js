/*
 * ui.js  (SC.ui) – View. Baut HTML aus dem Zustand, kennt KEINE Logik/Speicher.
 * Buttons tragen data-action (+ optional data-*); der Controller (app.js) hört
 * zentral darauf (Event-Delegation). So bleibt View dumm und austauschbar.
 */
(function () {
  "use strict";

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Sharepic verfügbar? (Modul geladen + Canvas vorhanden)
  function canShare() {
    return !!(window.SC && window.SC.share);
  }

  // Format-Umschalter (1:1 / 9:16) + Teilen-Button als ein Block.
  // fmt = aktuell gewähltes Format ('square'|'story'), action = Teilen-Aktion.
  function shareBlock(fmt, action, label) {
    if (!canShare()) return "";
    const chip = (id, txt) =>
      `<button class="fmtchip ${fmt === id ? "is-active" : ""}" type="button"
               data-action="set-share-format" data-format="${id}"
               aria-pressed="${fmt === id}">${txt}</button>`;
    return `
      <div class="sharebar">
        <div class="fmtrow" role="group" aria-label="Bildformat">
          ${chip("square", "▢ 1:1")}${chip("story", "▯ 9:16")}
        </div>
        <button class="ghostbtn" data-action="${action}">📤 ${esc(label)}</button>
      </div>`;
  }

  // Dark-Mode-Umschalter (Startseite, oben rechts). Zeigt das Ziel der nächsten
  // Aktion: Mond = "in den Dunkelmodus" (fürs Hostel-Bett), Sonne = "zurück ins Helle".
  function themeToggle(theme) {
    const dark = theme === "dark";
    const icon = dark ? "☀️" : "🌙";
    const label = dark ? "Hellen Modus einschalten" : "Dunklen Modus einschalten";
    const title = dark ? "Heller Modus" : "Dunkler Modus – fürs Hostel-Bett 🌙";
    return `<button class="iconbtn" data-action="toggle-theme"
                    aria-label="${esc(label)}" title="${esc(title)}" aria-pressed="${dark}">${icon}</button>`;
  }

  // ---------- HOME ----------
  function renderHome(vm) {
    const tiles = vm.categories
      .map((c) => {
        const badge = c.due > 0 ? `<span class="tile__due">${c.due} fällig</span>` : `<span class="tile__due tile__due--ok">✓ erledigt</span>`;
        // Stufen-Aufschlüsselung: aktive Stufe farbig, inaktive ausgegraut.
        const breakdown = c.byLevel
          .map((b) =>
            `<span class="tile__lvl ${b.active ? "" : "is-off"}" style="--lc:${esc(b.color)}">${esc(b.short)}·${b.count}</span>`)
          .join("");
        return `
          <button class="tile" data-action="open-category" data-id="${esc(c.id)}"
                  style="--from:${esc(c.grad[0])};--to:${esc(c.grad[1])}">
            <span class="tile__icon" aria-hidden="true">${esc(c.icon)}</span>
            <span class="tile__label">${esc(c.label)}</span>
            <span class="tile__meta">${c.total} Karten · ${badge}</span>
            <span class="tile__levels">${breakdown}</span>
          </button>`;
      })
      .join("");

    const mode = vm.mode;

    // Stufen-Filter: "Alle" + je Schwierigkeitsstufe (mehrfach wählbar, mit Kartenzahl).
    const levelChips = [
      `<button class="lvl ${vm.allLevels ? "is-active" : ""}" data-action="set-level" data-level="0">Alle</button>`,
      ...vm.levels.map((l) =>
        `<button class="lvl ${l.active ? "is-active" : ""}" data-action="set-level" data-level="${l.id}"
                 style="--lc:${esc(l.color)}" aria-pressed="${l.active}" title="${esc(l.label)} · ${l.count} Karten">
           <span class="lvl__dot"></span>${esc(l.short)} · ${esc(l.label)}
         </button>`),
    ].join("");

    return `
      <section class="screen">
        <div class="hero">
          <div class="hero__text">
            <p class="hero__kicker">Reise-Spanisch für echte Situationen</p>
            <h2 class="hero__title">¿Qué aprendemos hoy?</h2>
          </div>
          <div class="hero__actions">
            ${themeToggle(vm.theme)}
            <button class="iconbtn" data-action="open-info" aria-label="Länderkunde" title="Länderkunde">🌎</button>
            <button class="iconbtn" data-action="open-editor" aria-label="Eigene Karten" title="Eigene Karten">✍️</button>
            <button class="iconbtn hero__stats" data-action="open-stats" aria-label="Statistik" title="Statistik">📊</button>
          </div>
        </div>

        <div class="switchgroup">
          <span class="switchcap">Modus</span>
          <div class="segmented" role="tablist" aria-label="Lernmodus">
            <button class="seg ${mode === "flip" ? "is-active" : ""}" data-action="set-mode" data-mode="flip">🗣️ Sprechen</button>
            <button class="seg ${mode === "type" ? "is-active" : ""}" data-action="set-mode" data-mode="type">⌨️ Schreiben</button>
          </div>
        </div>

        <div class="switchgroup">
          <span class="switchcap">Richtung</span>
          <div class="segmented" role="tablist" aria-label="Lernrichtung">
            <button class="seg ${vm.dir === "de2es" ? "is-active" : ""}" data-action="set-dir" data-dir="de2es" aria-pressed="${vm.dir === "de2es"}">🇩🇪 → 🇪🇸 Deutsch</button>
            <button class="seg ${vm.dir === "es2de" ? "is-active" : ""}" data-action="set-dir" data-dir="es2de" aria-pressed="${vm.dir === "es2de"}">🇪🇸 → 🇩🇪 Español</button>
          </div>
        </div>

        <div class="levels" role="group" aria-label="Schwierigkeitsstufe">${levelChips}</div>

        <button class="cta ${vm.totalDue === 0 ? "is-done" : ""}" data-action="study-all">
          ${vm.totalDue > 0
            ? `Alle fälligen lernen <span class="cta__count">${vm.totalDue}</span>`
            : `Alles wiederholt 🎉 <span class="cta__count">${vm.totalCards}</span>`}
        </button>

        <div class="tiles">${tiles}</div>

        <p class="dedication">Für meine liebe Lisa. <span class="dedication__heart">♥</span></p>
      </section>`;
  }

  // ---------- STUDY ----------
  function renderStudy(vm) {
    const pct = vm.total > 0 ? Math.round((vm.position / vm.total) * 100) : 0;
    const card = vm.card;
    const accent = vm.accent; // [from,to]

    const body =
      vm.mode === "type" ? typeBody(vm) : flipBody(vm);

    return `
      <section class="screen study" style="--from:${esc(accent[0])};--to:${esc(accent[1])}">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="Zurück">‹</button>
          <div class="topbar__title">${esc(vm.catIcon)} ${esc(vm.catLabel)}</div>
          <div class="topbar__right">
            <div class="topbar__counter" aria-live="polite">${vm.position + 1}/${vm.total}</div>
          </div>
        </div>
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="Lernfortschritt"><div class="progress__bar" style="width:${pct}%"></div></div>
        ${body}
        ${shareCardBtn()}
      </section>`;
  }

  // Stufen-Badge (oben rechts auf der Karte). on = farbig (Rückseite), sonst dezent.
  function levelBadge(vm, on) {
    if (!vm.level) return "";
    const cls = on ? "lvl-badge lvl-badge--on" : "lvl-badge";
    const style = on ? "" : ` style="--lc:${esc(vm.level.color)}"`;
    return `<span class="${cls}"${style} title="${esc(vm.level.label)}">${esc(vm.level.short)} · ${esc(vm.level.label)}</span>`;
  }

  // 🔊-Button für die Sprachausgabe (nur wenn der Browser es kann).
  // on = farbige Variante (für die bunte Rückseite).
  function speakBtn(on) {
    const sp = window.SC && window.SC.speech;
    if (!sp || !sp.isSupported()) return "";
    const cls = on ? "speak speak--on" : "speak";
    return `<button class="${cls}" type="button" data-action="speak" aria-label="Antwort anhören" title="Anhören">🔊</button>`;
  }

  // Sprechen-Modus: 3D-Dreh-Karte. Frage/Antwort hängen an der Lernrichtung;
  // 🔊 und Aussprache-Tipp sitzen immer auf der spanischen Seite.
  function flipBody(vm) {
    const tip = vm.tip ? `<div class="face__tip">🗣️ ${esc(vm.tip)}</div>` : "";
    const sq = vm.spanishIsQuestion; // Spanisch steht vorne (Frage)?
    return `
      <div class="flip ${vm.revealed ? "is-flipped" : ""}" data-action="flip" id="flip"
           role="button" tabindex="0" aria-label="${vm.revealed ? "Karte ist umgedreht" : "Karte umdrehen"}">
        <div class="flip__inner">
          <div class="face face--front">
            <span class="face__cat">${esc(vm.catLabel)}</span>
            ${levelBadge(vm, false)}
            ${sq ? speakBtn(false) : ""}
            <div class="face__word"${sq ? ' lang="es"' : ""}>${esc(vm.question)}</div>
            ${sq ? tip : ""}
            <span class="face__hint">Tippen oder ↑ wischen zum Umdrehen 🔄</span>
          </div>
          <div class="face face--back">
            <span class="face__cat">${esc(vm.catLabel)}</span>
            ${levelBadge(vm, true)}
            ${sq ? "" : speakBtn(true)}
            <div class="face__word"${sq ? "" : ' lang="es"'}>${esc(vm.answer)}</div>
            ${sq ? "" : tip}
          </div>
        </div>
      </div>
      <div class="controls" id="controls" ${vm.revealed ? "" : "hidden"}>
        ${rateButtons()}
      </div>`;
  }

  // Schreiben-Modus: Eingabefeld + Prüfung. Bei ES→DE ist die Frage spanisch
  // und die erwartete Antwort deutsch (🔊/Tipp bleiben am Spanischen).
  function typeBody(vm) {
    const res = vm.typeResult; // null | {correct, answers, input}
    const sq = vm.spanishIsQuestion;
    const tip = vm.tip ? `<div class="face__tip">🗣️ ${esc(vm.tip)}</div>` : "";

    if (!res) {
      const inputHint = sq ? "Antwort auf Deutsch eingeben" : "Antwort auf Spanisch eingeben";
      const placeholder = sq ? "Tippe die deutsche Antwort …" : "Tippe die spanische Antwort …";
      return `
        <div class="card-static">
          <span class="face__cat">${esc(vm.catLabel)}</span>
          ${levelBadge(vm, false)}
          ${sq ? speakBtn(false) : ""}
          <div class="face__word"${sq ? ' lang="es"' : ""}>${esc(vm.question)}</div>
          <span class="face__hint">${inputHint}</span>
        </div>
        <form class="typer" data-action="submit-typed" id="typer">
          <input class="typer__input" id="answer" type="text" autocomplete="off"
                 autocapitalize="off" autocorrect="off" spellcheck="false"
                 placeholder="${placeholder}" />
          <button class="typer__btn" type="submit">Prüfen</button>
        </form>`;
    }

    const verdict = res.correct
      ? `<div class="verdict verdict--ok">✓ Richtig!</div>`
      : `<div class="verdict verdict--no">✗ Nicht ganz – deine Eingabe: „${esc(res.input || "—")}“</div>`;
    return `
      <div class="card-static ${res.correct ? "is-ok" : "is-no"}" role="status" aria-live="assertive">
        <span class="face__cat">${esc(vm.catLabel)}</span>
        ${levelBadge(vm, false)}
        ${sq ? "" : speakBtn(false)}
        <div class="face__word"${sq ? "" : ' lang="es"'}>${esc(vm.answer)}</div>
        ${sq ? "" : tip}
        ${verdict}
      </div>
      <div class="controls" id="controls">${rateButtons()}</div>`;
  }

  function rateButtons() {
    return `
      <div class="rateprompt">
        <span class="rateprompt__es">¿Cómo fue?</span>
        <span class="rateprompt__de">Wie gut saß die Antwort?</span>
      </div>
      <div class="ratebar" role="group" aria-label="Wie gut saß die Antwort?">
        <button class="feel feel--again" data-action="rate" data-rating="again" aria-label="Otra vez – nochmal üben">
          <span class="feel__emoji" aria-hidden="true">😅</span>
          <span class="feel__txt">Otra vez</span>
        </button>
        <button class="feel feel--good" data-action="rate" data-rating="good" aria-label="Vale – saß ganz gut">
          <span class="feel__emoji" aria-hidden="true">🙂</span>
          <span class="feel__txt">Vale</span>
        </button>
        <button class="feel feel--easy" data-action="rate" data-rating="easy" aria-label="¡Fácil! – mühelos gewusst">
          <span class="feel__emoji" aria-hidden="true">😎</span>
          <span class="feel__txt">¡Fácil!</span>
        </button>
      </div>`;
  }

  // Dezenter Teilen-Link ganz unten: erzeugt aus der aktuellen Karte ein Sharepic.
  function shareCardBtn() {
    if (!canShare()) return "";
    return `<button class="sharepic-btn" type="button" data-action="share-card" aria-label="Diese Karte als Bild teilen">Teilen</button>`;
  }

  // ---------- DONE ----------
  function renderDone(vm) {
    return `
      <section class="screen">
        <div class="done">
          <div class="done__emoji">🎉</div>
          <h2>¡Muy bien!</h2>
          <p>${esc(vm.scopeLabel)} – für jetzt alles wiederholt.<br>
             Die schweren Karten kommen früher zurück.</p>
          <button class="cta" data-action="home">Zur Übersicht</button>
          <button class="ghostbtn" data-action="open-stats">📊 Statistik ansehen</button>
        </div>
      </section>`;
  }

  // ---------- STATISTIK ----------
  // Statusfarben/-texte zentral, damit Liste & Detail gleich aussehen.
  const STATUS_META = {
    new:      { label: "Neu",        color: "var(--muted)" },
    learning: { label: "Am Lernen",  color: "var(--warn)" },
    mastered: { label: "Gemeistert", color: "var(--ok)" },
  };

  // Verlaufs-Punkte: je Bewertung ein farbiger Punkt (rot/grün/blau).
  function historyDots(hist) {
    if (!hist || !hist.length) return "";
    const color = { a: "var(--no)", g: "var(--ok)", e: "var(--easy)" };
    const title = { a: "Nochmal", g: "Gut", e: "Einfach" };
    const dots = hist
      .map((ch) => `<span class="hdot" aria-hidden="true" style="background:${color[ch] || "var(--muted)"}" title="${title[ch] || ""}"></span>`)
      .join("");
    // Textzusammenfassung für Screenreader (Farbe allein reicht nicht).
    const count = { a: 0, g: 0, e: 0 };
    hist.forEach((ch) => { if (count[ch] != null) count[ch]++; });
    const label = `Verlauf: ${count.e}× Einfach, ${count.g}× Gut, ${count.a}× Nochmal`;
    return `<div class="hdots" role="img" aria-label="${label}">${dots}</div>`;
  }

  // Trefferquote als kleiner Balken (grün), eingefärbt nach Höhe.
  function rateBadge(rate) {
    if (rate === null) return `<span class="srate srate--none">–</span>`;
    const cls = rate >= 80 ? "srate--good" : rate >= 50 ? "srate--mid" : "srate--bad";
    return `<span class="srate ${cls}">${rate}%</span>`;
  }

  function renderStats(vm) {
    const ov = vm.overview;

    const kpis = `
      <div class="kpis">
        <div class="kpi"><div class="kpi__num">${ov.rate === null ? "–" : ov.rate + "%"}</div><div class="kpi__lbl">Trefferquote</div></div>
        <div class="kpi"><div class="kpi__num">${ov.seenCards}<span class="kpi__of">/${ov.total}</span></div><div class="kpi__lbl">Gelernt</div></div>
        <div class="kpi"><div class="kpi__num">${ov.mastered}</div><div class="kpi__lbl">Gemeistert</div></div>
        <div class="kpi"><div class="kpi__num">${ov.hard}</div><div class="kpi__lbl">Schwierig</div></div>
      </div>`;

    // Status-Verteilung als gestapelter Balken.
    const seg = (n, color) => ov.total ? `<span style="flex:${n};background:${color}"></span>` : "";
    const distribution = `
      <div class="dist">
        <div class="dist__bar">
          ${seg(ov.mastered, "var(--ok)")}${seg(ov.learning, "var(--warn)")}${seg(ov.neu, "rgba(45,27,18,0.16)")}
        </div>
        <div class="dist__legend">
          <span><i style="background:var(--ok)"></i>Gemeistert ${ov.mastered}</span>
          <span><i style="background:var(--warn)"></i>Am Lernen ${ov.learning}</span>
          <span><i style="background:rgba(45,27,18,0.16)"></i>Neu ${ov.neu}</span>
        </div>
      </div>`;

    // Auf Anhieb vs. nach Übung.
    const firstTry = `
      <div class="splitstat">
        <div class="splitstat__item"><b>${ov.firstTry}</b> auf Anhieb gewusst 🎯</div>
        <div class="splitstat__item"><b>${ov.needPractice}</b> brauchten Übung 🔁</div>
      </div>`;

    const chips = vm.filters
      .map((f) => `<button class="schip ${vm.filter === f.id ? "is-active" : ""}" data-action="set-stats-filter" data-filter="${f.id}">${esc(f.label)} <span class="schip__n">${f.count}</span></button>`)
      .join("");

    const rows = vm.list.length
      ? vm.list.map(statRow).join("")
      : `<p class="stat-empty">Hier erscheinen deine Karten, sobald du sie bewertet hast.</p>`;

    return `
      <section class="screen">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="Zurück">‹</button>
          <div class="topbar__title">📊 Statistik</div>
          <div class="topbar__counter">${ov.seenCards}/${ov.total}</div>
        </div>
        ${kpis}
        ${distribution}
        ${firstTry}
        ${ov.seenCards > 0 ? shareBlock(vm.shareFormat, "share-stats", "Fortschritt teilen") : ""}
        <div class="schips" role="group" aria-label="Filter">${chips}</div>
        <div class="statlist">${rows}</div>
        ${ov.seenCards > 0
          ? `<button class="dangerbtn" data-action="reset-progress">🗑️ Fortschritt zurücksetzen</button>`
          : ""}
      </section>`;
  }

  // Eine Zeile in der Statistik-Liste (klickbar -> Detailseite).
  function statRow(r) {
    const meta = STATUS_META[r.s.status] || STATUS_META.new;
    const seen = r.s.seen > 0 ? `${r.s.seen}× gesehen` : "neu";
    return `
      <button class="statrow" data-action="open-card" data-id="${esc(r.id)}" data-back="stats">
        <span class="statrow__dot" style="background:${meta.color}" title="${esc(meta.label)}"></span>
        <span class="statrow__main">
          <span class="statrow__de">${esc(r.de)}</span>
          <span class="statrow__es" lang="es">${esc(r.es)}</span>
          <span class="statrow__meta">${esc(r.catIcon)} ${esc(r.catLabel)} · ${seen}${r.s.lapses ? ` · ${r.s.lapses}× vergessen` : ""}</span>
        </span>
        <span class="statrow__right">
          ${rateBadge(r.s.rate)}
          ${historyDots(r.s.history.slice(-8))}
        </span>
      </button>`;
  }

  // ---------- KARTEN-DETAIL ----------
  function renderCard(vm) {
    if (!vm) {
      return `
        <section class="screen">
          <div class="topbar"><button class="iconbtn" data-action="card-back" aria-label="Zurück">‹</button><div class="topbar__title">Karte</div><span></span></div>
          <p class="stat-empty">Karte nicht gefunden.</p>
        </section>`;
    }
    const s = vm.s;
    const meta = STATUS_META[s.status] || STATUS_META.new;
    const accent = vm.accent;
    const tip = vm.tip ? `<div class="cardx__tip">🗣️ ${esc(vm.tip)}</div>` : "";

    // Aufschlüsselung der Bewertungen als kleine Balken.
    const total = s.seen || 1;
    const bar = (label, n, color) => `
      <div class="brk">
        <div class="brk__top"><span>${label}</span><span>${n}</span></div>
        <div class="brk__track"><div class="brk__fill" style="width:${Math.round((n / total) * 100)}%;background:${color}"></div></div>
      </div>`;

    const firstTryBadge = s.seen === 0 ? ""
      : s.firstTry
        ? `<span class="tagok">🎯 Auf Anhieb gewusst</span>`
        : `<span class="tagwarn">🔁 Brauchte Übung</span>`;

    const facts = `
      <div class="facts">
        <div class="fact"><span class="fact__k">Status</span><span class="fact__v" style="color:${meta.color}">${esc(meta.label)}</span></div>
        <div class="fact"><span class="fact__k">Trefferquote</span><span class="fact__v">${s.rate === null ? "–" : s.rate + "%"}</span></div>
        <div class="fact"><span class="fact__k">Gesehen</span><span class="fact__v">${s.seen}×</span></div>
        <div class="fact"><span class="fact__k">Vergessen</span><span class="fact__v">${s.lapses}×</span></div>
        <div class="fact"><span class="fact__k">Zuerst gelernt</span><span class="fact__v">${esc(vm.firstText)}</span></div>
        <div class="fact"><span class="fact__k">Zuletzt</span><span class="fact__v">${esc(vm.lastText)}</span></div>
        <div class="fact"><span class="fact__k">Nächste Whlg.</span><span class="fact__v">${esc(vm.dueText)}</span></div>
        <div class="fact"><span class="fact__k">Leichtigkeit</span><span class="fact__v">${s.ease ? s.ease.toFixed(2) : "–"}</span></div>
      </div>`;

    const breakdown = s.seen > 0 ? `
      <div class="breakdown">
        ${bar("✓ Einfach", s.easy, "var(--easy)")}
        ${bar("✓ Gut", s.good, "var(--ok)")}
        ${bar("✗ Nochmal", s.again, "var(--no)")}
      </div>` : "";

    const history = s.history.length
      ? `<div class="cardx__history"><span class="cardx__history-lbl">Verlauf</span>${historyDots(s.history)}</div>`
      : "";

    return `
      <section class="screen" style="--from:${esc(accent[0])};--to:${esc(accent[1])}">
        <div class="topbar">
          <button class="iconbtn" data-action="card-back" aria-label="Zurück">‹</button>
          <div class="topbar__title">${esc(vm.catIcon)} ${esc(vm.catLabel)}</div>
          <span></span>
        </div>

        <div class="cardx">
          <div class="cardx__de">${esc(vm.de)}</div>
          <div class="cardx__es" lang="es">${esc(vm.es)}</div>
          ${tip}
          <div class="cardx__tags">${firstTryBadge}</div>
        </div>

        ${facts}
        ${breakdown}
        ${history}

        <button class="cta" data-action="study-one" data-id="${esc(vm.id)}">Diese Karte üben</button>
        ${shareBlock(vm.shareFormat, "share-card", "Als Bild teilen")}
      </section>`;
  }

  // ---------- EIGENE KARTEN (EDITOR) ----------
  function renderEditor(vm) {
    const catOpts = vm.categories
      .map((c) => `<option value="${esc(c.id)}"${c.id === "alltag" ? " selected" : ""}>${esc(c.icon)} ${esc(c.label)}</option>`)
      .join("");
    const lvlOpts = vm.levels
      .map((l) => `<option value="${l.id}">${esc(l.short)} · ${esc(l.label)}</option>`)
      .join("");

    const msg = vm.msg
      ? `<div class="ed-msg ed-msg--${vm.msg.type === "error" ? "error" : "ok"}">${esc(vm.msg.text)}</div>`
      : "";

    const list = vm.cards.length
      ? vm.cards.map(editorItem).join("")
      : `<p class="stat-empty">Noch keine eigenen Karten. Leg oben deine erste an! ✍️</p>`;

    return `
      <section class="screen">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="Zurück">‹</button>
          <div class="topbar__title">✍️ Eigene Karten</div>
          <div class="topbar__counter">${vm.cards.length}</div>
        </div>

        ${msg}

        <form class="editor" data-action="save-card">
          <label class="ed-field">
            <span class="ed-label">Frage (Deutsch)</span>
            <input class="ed-input" id="card-de" type="text" autocomplete="off" placeholder="z. B. Wo ist der Strand?" />
          </label>
          <label class="ed-field">
            <span class="ed-label">Antwort (Spanisch)</span>
            <input class="ed-input" id="card-es" type="text" autocomplete="off" autocapitalize="off"
                   placeholder="z. B. ¿Dónde está la playa?" />
            <span class="ed-hint">Mehrere gültige Antworten mit „ / " trennen.</span>
          </label>
          <label class="ed-field">
            <span class="ed-label">Tipp / Aussprache <em>(optional)</em></span>
            <input class="ed-input" id="card-tip" type="text" autocomplete="off" placeholder="z. B. DON-de es-TA la PLA-ya" />
          </label>
          <div class="ed-row">
            <label class="ed-field">
              <span class="ed-label">Bereich</span>
              <select class="ed-input" id="card-cat">${catOpts}</select>
            </label>
            <label class="ed-field">
              <span class="ed-label">Stufe</span>
              <select class="ed-input" id="card-lvl">${lvlOpts}</select>
            </label>
          </div>
          <button class="cta" type="submit">➕ Karte hinzufügen</button>
        </form>

        <h3 class="ed-h">Deine Karten</h3>
        <div class="ed-list">${list}</div>
      </section>`;
  }

  function editorItem(c) {
    const tip = c.tip ? ` · 🗣️ ${esc(c.tip)}` : "";
    return `
      <div class="ed-item">
        <div class="ed-item__main">
          <div class="ed-item__de">${esc(c.de)}</div>
          <div class="ed-item__es" lang="es">${esc(c.es)}</div>
          <div class="ed-item__meta">${esc(c.catIcon)} ${esc(c.catLabel)}${c.lvlShort ? ` · ${esc(c.lvlShort)}` : ""}${tip}</div>
        </div>
        <button class="ed-del" type="button" data-action="delete-card" data-id="${esc(c.id)}" aria-label="Löschen" title="Löschen">🗑️</button>
      </div>`;
  }

  // ---------- LÄNDERKUNDE (INFOSEITE) ----------
  // Dropdown mit Regionen als <optgroup>; darunter das gewählte Land mit
  // Infotexten und der Unterrubrik "Essen & Trinken".
  function renderInfo(vm) {
    const options = vm.groups
      .map((g) => {
        const opts = g.countries
          .map((c) => `<option value="${esc(c.id)}"${c.selected ? " selected" : ""}>${c.flag} ${esc(c.name)}</option>`)
          .join("");
        return `<optgroup label="${esc(g.region)}">${opts}</optgroup>`;
      })
      .join("");

    const selector = `
      <label class="cinfo-pick">
        <span class="cinfo-pick__cap">Land wählen</span>
        <select class="cinfo-pick__sel" id="country-select" data-action="select-country">${options}</select>
      </label>`;

    if (!vm.country) {
      return `
        <section class="screen">
          ${infoTopbar()}
          ${selector}
          <p class="stat-empty">Kein Land verfügbar.</p>
        </section>`;
    }

    const c = vm.country;

    // Sprach-Wörterliste (lokaler Slang).
    const words = (c.words || [])
      .map((w) => `<li class="cinfo-word"><span class="cinfo-word__es">${esc(w.es)}</span><span class="cinfo-word__de">${esc(w.de)}</span></li>`)
      .join("");
    const wordsBlock = words ? `<ul class="cinfo-words">${words}</ul>` : "";

    // Eine aufklappbare Speise-/Getränke-Karte (natives <details> = ohne JS-State).
    // Kopf zeigt Name + Kurzbeschreibung; aufgeklappt Bild + Detailinfos.
    const factRow = (label, value) =>
      value ? `<div class="cinfo-fact"><span class="cinfo-fact__k">${esc(label)}</span><span class="cinfo-fact__v">${esc(value)}</span></div>` : "";
    const dish = (d) => {
      // Bild: lädt faul; bei Fehler/Offline blendet onerror es sauber aus.
      const img = d.img
        ? `<img class="cinfo-dish__img" src="${esc(d.img)}" alt="${esc(d.name)}" loading="lazy"
                referrerpolicy="no-referrer" onerror="this.style.display='none'" />`
        : "";
      const long = d.long ? `<p class="cinfo-dish__long">${esc(d.long)}</p>` : "";
      const order = d.order
        ? `<div class="cinfo-dish__order"><span class="cinfo-dish__order-cap">So bestellst du:</span> <span class="cinfo-dish__order-es">„${esc(d.order)}“</span></div>`
        : "";
      return `
        <details class="cinfo-dish">
          <summary class="cinfo-dish__head">
            <span class="cinfo-dish__heart">
              <span class="cinfo-dish__name">${esc(d.name)}</span>
              <span class="cinfo-dish__desc">${esc(d.desc)}</span>
            </span>
            <span class="cinfo-dish__chev" aria-hidden="true">▾</span>
          </summary>
          <div class="cinfo-dish__body">
            ${img}
            ${long}
            <div class="cinfo-facts">
              ${factRow("Zutaten", d.ingredients)}
              ${factRow("Herkunft", d.origin)}
              ${factRow("Wann", d.occasions)}
            </div>
            ${order}
          </div>
        </details>`;
    };
    const foods = (c.food || []).map(dish).join("");
    const drinks = (c.drink || []).map(dish).join("");

    // Ein Themenblock (Überschrift + Inhalt).
    const sect = (icon, title, body) => `
      <div class="cinfo-sect">
        <h3 class="cinfo-sect__h">${icon} ${esc(title)}</h3>
        ${body}
      </div>`;
    const para = (text) => `<p class="cinfo-text">${esc(text)}</p>`;

    const tip = c.tip ? `<div class="cinfo-tip">💡 ${esc(c.tip)}</div>` : "";

    return `
      <section class="screen">
        ${infoTopbar()}
        ${selector}

        <div class="cinfo-head">
          <div class="cinfo-head__flag">${c.flag}</div>
          <div class="cinfo-head__main">
            <h2 class="cinfo-head__name">${esc(c.name)}</h2>
            <p class="cinfo-head__tag">${esc(c.tagline)}</p>
            <p class="cinfo-head__cap">🏛️ Hauptstadt: ${esc(c.capital)}</p>
          </div>
        </div>

        ${sect("🌎", "Über das Land", para(c.about))}
        ${sect("📜", "Geschichte", para(c.history))}
        ${sect("🗣️", "Sprache", para(c.language) + wordsBlock)}

        <div class="cinfo-sect cinfo-sect--food">
          <h3 class="cinfo-sect__h">🍽️ Essen &amp; Trinken</h3>
          <h4 class="cinfo-sub">Lokale Speisen</h4>
          <div class="cinfo-dishes">${foods || `<p class="cinfo-text">—</p>`}</div>
          <h4 class="cinfo-sub">Getränke</h4>
          <div class="cinfo-dishes">${drinks || `<p class="cinfo-text">—</p>`}</div>
        </div>

        ${tip}
      </section>`;
  }

  function infoTopbar() {
    return `
      <div class="topbar">
        <button class="iconbtn" data-action="home" aria-label="Zurück">‹</button>
        <div class="topbar__title">🌎 Länderkunde</div>
        <span></span>
      </div>`;
  }

  window.SC = window.SC || {};
  window.SC.ui = { esc, renderHome, renderStudy, renderDone, renderStats, renderCard, renderEditor, renderInfo };
})();
