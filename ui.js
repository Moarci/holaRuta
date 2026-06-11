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

  // ---------- HOME (drei Reiter: Lernen · Entdecken · Profil) ----------
  // Die Startseite ist in drei Reiter geclustert, damit pro Blick nur ein Thema
  // sichtbar ist: Lernen (Heute-Karte + Themen), Entdecken (Spielmodi & Wissen),
  // Profil (Fortschritt, Pass, Eigenes). Unten eine feste Tab-Leiste; der aktive
  // Reiter kommt aus vm.tab und wird in den Einstellungen gemerkt.

  // Entdecken-Reiter: die vier großen Einstiege als volle Gradient-Buttons.
  const FEATURES = [
    { action: "open-hostel",     icon: "🛏️", title: "Hostel Mode",  sub: "Zu zweit üben: Battle & Rollenspiele",   grad: ["#C25A45", "#8E4FA8"] },
    { action: "open-quiz-setup", icon: "🧩", title: "Definiciones", sub: "Definition lesen, Begriff wählen",       grad: ["#3F7355", "#2F6B70"] },
    { action: "open-cuerpo",     icon: "🧍", title: "El Cuerpo",    sub: "Körperteile antippen: Wort & Reisetipp", grad: ["#2E6E86", "#7D4A8E"] },
    { action: "open-info",       icon: "🌎", title: "Länderkunde",  sub: "Land & Leute – von México bis Chile",    grad: ["#B97C24", "#C2502E"] },
  ];

  // Bewusst kein role="tablist": ohne Pfeiltasten-Navigation und tabpanel wäre
  // das ARIA-Tab-Muster unvollständig. Eine schlichte <nav> mit aria-current
  // ist ehrlicher und für Screenreader genauso klar (Seiten-Navigation).
  function tabbar(tab) {
    const t = (id, icon, label) =>
      `<button class="tab ${tab === id ? "is-active" : ""}"${tab === id ? ' aria-current="page"' : ""}
               data-action="set-tab" data-tab="${id}">
         <span class="tab__icon" aria-hidden="true">${icon}</span><span class="tab__label">${label}</span>
       </button>`;
    return `
      <nav class="tabbar" aria-label="Bereiche">
        ${t("lernen", "🎒", "Lernen")}${t("entdecken", "🧭", "Entdecken")}${t("profil", "👤", "Profil")}
      </nav>`;
  }

  // Schlanke Kopfzeile pro Reiter: nur Titel + Dark-Mode-Knopf (statt des großen
  // Heros mit Kicker und Icon-Reihe – der Markenname steht schon in der App-Bar).
  function pagehead(title, vm) {
    return `
      <div class="pagehead">
        <h2 class="pagehead__title">${title}</h2>
        ${themeToggle(vm.theme)}
      </div>`;
  }

  function lernenBody(vm) {
    const tiles = vm.categories
      .map((c) => {
        const badge = c.due > 0 ? `<span class="tile__due">${c.due} fällig</span>` : `<span class="tile__due tile__due--ok">✓ erledigt</span>`;
        // Stufen-Aufschlüsselung nur bei aktivem Stufen-Filter (aktive Stufe
        // farbig, inaktive ausgegraut) – ohne Filter bleiben die Kacheln ruhig.
        const breakdown = vm.allLevels ? "" : c.byLevel
          .map((b) =>
            `<span class="tile__lvl ${b.active ? "" : "is-off"}" style="--lc:${esc(b.color)}">${esc(b.short)}·${b.count}</span>`)
          .join("");
        return `
          <button class="tile" data-action="open-category" data-id="${esc(c.id)}"
                  style="--from:${esc(c.grad[0])};--to:${esc(c.grad[1])}">
            <span class="tile__icon" aria-hidden="true">${esc(c.icon)}</span>
            <span class="tile__label">${esc(c.label)}</span>
            <span class="tile__meta">${c.total} Karten · ${badge}</span>
            ${breakdown ? `<span class="tile__levels">${breakdown}</span>` : ""}
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

    // "Heute"-Karte: Streak-Chip, Haupt-CTA und Quick-Resume. (Der Fortschritts-
    // balken wohnt im Profil-Reiter – hier zählt nur die heutige Aktion.)
    const streakChip = vm.streak > 0
      ? `<span class="today__streak">🔥 ${vm.streak} ${vm.streak === 1 ? "Tag" : "Tage"} Serie</span>`
      : `<span class="today__streak today__streak--new">🌱 Starte deine Serie</span>`;
    const resume = vm.lastCat
      ? `<button class="today__resume" data-action="resume-last">
           ↩ Weiter mit ${esc(vm.lastCat.icon)} ${esc(vm.lastCat.label)}
           <span class="today__resumecount">${vm.lastCat.due} fällig</span>
         </button>`
      : "";

    // Einstellungs-Panel: Kopfzeile fasst die aktive Wahl zusammen, Inhalt
    // (Modus/Richtung/Stufen) erscheint nur aufgeklappt.
    const lvlSummary = vm.allLevels
      ? "Alle Stufen"
      : vm.levels.filter((l) => l.active).map((l) => l.short).join(" + ");
    const setupSummary = `${mode === "type" ? "⌨️ Schreiben" : "🗣️ Sprechen"} · ${vm.dir === "es2de" ? "🇪🇸→🇩🇪" : "🇩🇪→🇪🇸"} · ${esc(lvlSummary)}`;
    const setupBody = `
      <div class="setup__body" id="setup-body">
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
      </div>`;

    return `
      ${pagehead("¿Qué aprendemos hoy?", vm)}

      <div class="today">
        ${streakChip}
        <button class="cta ${vm.totalDue === 0 ? "is-done" : ""}" data-action="study-all">
          ${vm.totalDue === 0
            ? `Alles wiederholt 🎉 <span class="cta__count">${vm.totalCards}</span>`
            : vm.totalDue > vm.sessionCap
              ? `Lernrunde starten <span class="cta__count">${vm.sessionCap} von ${vm.totalDue}</span>`
              : `Alle fälligen lernen <span class="cta__count">${vm.totalDue}</span>`}
        </button>
        ${resume}
      </div>

      <div class="setup">
        <button class="setup__head" data-action="toggle-setup" aria-expanded="${vm.setupOpen}"${vm.setupOpen ? ' aria-controls="setup-body"' : ""}>
          <span class="setup__cap">⚙️ Einstellungen</span>
          <span class="setup__summary">${setupSummary}</span>
          <span class="setup__chev" aria-hidden="true">›</span>
        </button>
        ${vm.setupOpen ? setupBody : ""}
      </div>

      <p class="sectioncap">Themen</p>
      <div class="tiles">${tiles}</div>

      <p class="dedication">Für meine liebe Lisa. <span class="dedication__heart">♥</span></p>`;
  }

  function entdeckenBody(vm) {
    const feats = FEATURES.map((x) => `
      <button class="feat" data-action="${x.action}" style="--from:${x.grad[0]};--to:${x.grad[1]}">
        <span class="feat__icon" aria-hidden="true">${x.icon}</span>
        <span class="feat__text">
          <span class="feat__title">${esc(x.title)}</span>
          <span class="feat__sub">${esc(x.sub)}</span>
        </span>
        <span class="feat__chev" aria-hidden="true">›</span>
      </button>`).join("");
    return `
      ${pagehead("Entdecken", vm)}
      <p class="pageintro">Spielen, zuordnen, nachschlagen – Spanisch abseits der Karten.</p>
      ${feats}`;
  }

  function profilBody(vm) {
    const streakLine = vm.streak > 0
      ? `🔥 ${vm.streak} ${vm.streak === 1 ? "Tag" : "Tage"} in Folge`
      : `🌱 Heute die erste Karte lernen`;
    const navrow = (action, icon, label, chip) => `
      <button class="navrow" data-action="${action}">
        <span class="navrow__icon" aria-hidden="true">${icon}</span>
        <span class="navrow__label">${esc(label)}</span>
        ${chip ? `<span class="navrow__chip">${chip}</span>` : ""}
        <span class="navrow__chev" aria-hidden="true">›</span>
      </button>`;
    return `
      ${pagehead("Dein Fortschritt", vm)}

      <div class="profcard">
        <p class="profcard__streak">${streakLine}</p>
        <div class="today__bar" role="progressbar" aria-valuenow="${vm.overall.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Gemeisterte Karten">
          <div class="today__barfill" style="width:${vm.overall.pct}%"></div>
        </div>
        <p class="profcard__meta">${vm.overall.mastered} von ${vm.overall.total} Karten gemeistert · ${vm.overall.pct} %</p>
      </div>

      ${navrow("open-stats", "📊", "Statistik")}
      ${navrow("open-badges", "🎖️", "Mein Ruta-Pass", vm.badgeCount || "")}
      ${navrow("open-editor", "✍️", "Eigene Karten")}
      ${installBlock(vm.install)}`;
  }

  // „Auf den Startbildschirm"-Hinweis (nur wenn sinnvoll, siehe install.js).
  // Android zeigt einen Knopf für den nativen Installations-Dialog; iOS bekommt
  // eine kurze Schritt-für-Schritt-Anleitung, weil Safari keinen Prompt kennt.
  function installBlock(install) {
    if (!install || !install.show) return "";
    const body = install.canPrompt
      ? `<p class="installcard__text">Leg HolaRuta als App-Icon ab – startet dann direkt, ohne die Datei zu suchen, und läuft offline.</p>
         <button class="ghostbtn installcard__btn" data-action="install-app">📲 App installieren</button>`
      : `<p class="installcard__text">${esc(install.hint)}</p>`;
    return `
      <div class="installcard">
        <p class="installcard__title"><span aria-hidden="true">📲</span> Auf den Startbildschirm</p>
        ${body}
      </div>`;
  }

  function renderHome(vm) {
    const body =
      vm.tab === "entdecken" ? entdeckenBody(vm) :
      vm.tab === "profil" ? profilBody(vm) :
      lernenBody(vm);
    return `
      <section class="screen screen--tabbed">${body}</section>
      ${tabbar(vm.tab)}`;
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

  // Runder Eck-Button auf der Karte (44px). Gemeinsame Basis für 🔊 (rechts) und
  // 🧭 (links), damit Markup/Stil nicht doppelt gepflegt werden. base = Modifier-
  // Klasse (cardbtn--speak | cardbtn--ctx), on = farbige Variante für die Rückseite,
  // extra = zusätzliche Attribute (z.B. aria-expanded/-controls), icon/label/action.
  function cornerBtn({ base, on, icon, label, action, extra = "" }) {
    const cls = `cardbtn ${base}${on ? " is-on" : ""}`;
    return `<button class="${cls}" type="button" data-action="${action}"
              aria-label="${esc(label)}" title="${esc(label)}"${extra ? " " + extra : ""}>${icon}</button>`;
  }

  // 🔊-Button für die Sprachausgabe (nur wenn der Browser es kann).
  // on = farbige Variante (für die bunte Rückseite).
  function speakBtn(on) {
    const sp = window.SC && window.SC.speech;
    if (!sp || !sp.isSupported()) return "";
    return cornerBtn({ base: "cardbtn--speak", on, icon: "🔊", label: "Antwort anhören", action: "speak" });
  }

  // Reise-Kontext-Panel: aufklappbarer Inhalt mit echtem Reisesatz, Situation und
  // kurzem Reisetipp. open spiegelt state.contextOpen (Single Source of Truth) –
  // der Controller hält DOM und Zustand in-place synchron (kein Re-Render nötig).
  function contextPanel(ctx, open) {
    if (!ctx) return "";
    const line = (es, de) => {
      const e = es ? `<p class="context-panel__es" lang="es">${esc(es)}</p>` : "";
      const d = de ? `<p class="context-panel__de">${esc(de)}</p>` : "";
      return e || d ? `<div class="context-panel__line">${e}${d}</div>` : "";
    };
    const meta = (label, text) => text
      ? `<div class="context-panel__block"><div class="context-panel__label">${esc(label)}</div><p class="context-panel__text">${esc(text)}</p></div>`
      : "";
    return `
      <div class="context-panel" id="context-panel"${open ? "" : " hidden"}>
        <h3 class="context-panel__title">🧭 So nutzt du es unterwegs</h3>
        ${line(ctx.sentenceEs, ctx.sentenceDe)}
        ${meta("Situation", ctx.situation)}
        ${meta("Reisetipp", ctx.note)}
      </div>`;
  }

  // Runder 🧭-Icon-Button auf der Lernkarte (unten links) – Pendant zum 🔊 (unten
  // rechts). on = farbige Variante für die bunte Antwort-Rückseite; open = Panel offen.
  function contextIconBtn(ctx, on, open) {
    if (!ctx) return "";
    return cornerBtn({
      base: "cardbtn--ctx" + (open ? " is-open" : ""), on, icon: "🧭",
      label: "Reise-Kontext anzeigen", action: "toggle-context",
      extra: `aria-expanded="${!!open}" aria-controls="context-panel"`,
    });
  }

  // Detail-Variante (Karten-Detailseite): sichtbar beschrifteter Button + Panel im
  // Textfluss, da hier kein 🔊 zum Spiegeln und mehr Platz vorhanden ist.
  function contextBlock(ctx, open) {
    if (!ctx) return "";
    const label = open ? "🧭 Kontext ausblenden" : "🧭 Kontext";
    return `
      <div class="context">
        <button class="ghostbtn contextbtn${open ? " is-open" : ""}" type="button" data-action="toggle-context"
                data-ctx-text="1" aria-expanded="${!!open}" aria-controls="context-panel">${label}</button>
        ${contextPanel(ctx, open)}
      </div>`;
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
            ${contextIconBtn(vm.context, true, vm.contextOpen)}
            ${sq ? "" : speakBtn(true)}
            <div class="face__word"${sq ? "" : ' lang="es"'}>${esc(vm.answer)}</div>
            ${sq ? "" : tip}
          </div>
        </div>
      </div>
      <div class="controls" id="controls" ${vm.revealed ? "" : "hidden"}>
        ${contextPanel(vm.context, vm.contextOpen)}
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
        ${contextIconBtn(vm.context, false, vm.contextOpen)}
        ${sq ? "" : speakBtn(false)}
        <div class="face__word"${sq ? "" : ' lang="es"'}>${esc(vm.answer)}</div>
        ${sq ? "" : tip}
        ${verdict}
      </div>
      <div class="controls" id="controls">
        ${contextPanel(vm.context, vm.contextOpen)}
        ${rateButtons()}
      </div>`;
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

  // ---------- RUTA-PASS (BADGES) ----------
  // Fortschrittstext eines noch nicht erreichten Badges (je nach Metrik-Typ).
  function badgeProgressText(b) {
    if (b.type === "categoryMastery") return `${Math.round((b.value || 0) * 100)} % · Ziel 80 %`;
    if (b.type === "flag") return "Noch nicht freigeschaltet";
    const cur = Math.min(Math.round(b.value || 0), b.target);
    return `${cur} / ${b.target}`;
  }

  // Eine Stempel-Kachel. Drei Zustände: freigeschaltet, gesperrt, geheim-gesperrt.
  function badgeCard(b) {
    if (b.unlocked) {
      return `
        <div class="badge is-unlocked">
          <span class="badge__icon" aria-hidden="true">${esc(b.icon)}</span>
          <span class="badge__check" aria-hidden="true">✓</span>
          <span class="badge__name">${esc(b.name)}</span>
          <span class="badge__desc">${esc(b.unlockedText || b.description)}</span>
        </div>`;
    }
    if (b.secret) {
      return `
        <div class="badge is-locked badge--secret" aria-label="Geheimes Badge, noch nicht freigeschaltet">
          <span class="badge__icon" aria-hidden="true">❓</span>
          <span class="badge__name">Geheim-Stempel</span>
          <span class="badge__desc">Noch nicht freigeschaltet.</span>
        </div>`;
    }
    const pct = Math.round((b.progress || 0) * 100);
    return `
      <div class="badge is-locked">
        <span class="badge__icon" aria-hidden="true">${esc(b.icon)}</span>
        <span class="badge__name">${esc(b.name)}</span>
        <span class="badge__desc">${esc(b.description)}</span>
        <span class="badge__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <span class="badge__fill" style="width:${pct}%"></span>
        </span>
        <span class="badge__prog">${esc(badgeProgressText(b))}</span>
      </div>`;
  }

  function renderBadges(vm) {
    const pct = vm.total ? Math.round((vm.unlocked / vm.total) * 100) : 0;
    const groups = vm.groups
      .map((g) => `
        <div class="passgroup">
          <div class="passgroup__head">
            <span class="passgroup__title">${g.icon} ${esc(g.label)}</span>
            <span class="passgroup__count">${g.unlocked}/${g.total}</span>
          </div>
          <div class="passgrid">${g.badges.map(badgeCard).join("")}</div>
        </div>`)
      .join("");

    return `
      <section class="screen">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="Zurück">‹</button>
          <div class="topbar__title">🎖️ Mein Ruta-Pass</div>
          <div class="topbar__counter">${vm.unlocked}/${vm.total}</div>
        </div>

        <div class="passhero">
          <p class="passhero__sub">Sammle Stempel für deine Reise-Skills.</p>
          <div class="passhero__bar"><div class="passhero__fill" style="width:${pct}%"></div></div>
          <p class="passhero__meta">${vm.unlocked} von ${vm.total} Stempeln gesammelt · ${pct} %</p>
        </div>

        ${groups}
      </section>`;
  }

  // Kurze Glückwunsch-Einblendung nach frisch freigeschalteten Badges.
  // Liegt als eigene Ebene über dem Screen; tippen führt zum Ruta-Pass.
  function badgeToast(list) {
    if (!list || !list.length) return "";
    const items = list
      .map((b) => `
        <span class="btoast__item">
          <span class="btoast__icon" aria-hidden="true">${esc(b.icon)}</span>
          <span class="btoast__text">
            <span class="btoast__name">${esc(b.name)}</span>
            <span class="btoast__sub">${esc(b.unlockedText || b.description)}</span>
          </span>
        </span>`)
      .join("");
    const head = list.length > 1 ? `${list.length} neue Stempel!` : "Neuer Stempel!";
    return `
      <button class="btoast" data-action="open-badges" aria-label="${esc(head)} Ruta-Pass öffnen">
        <span class="btoast__head">🎖️ ${esc(head)}</span>
        ${items}
      </button>`;
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
          ${contextBlock(vm.context, vm.contextOpen)}
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

  // ---------- HOSTEL MODE ----------
  // Topbar-Helfer für alle Hostel-Mode-Screens. back = data-action des Zurück-Knopfs.
  function hmTopbar(title, back) {
    return `
      <div class="topbar">
        <button class="iconbtn" data-action="${back}" aria-label="Zurück">‹</button>
        <div class="topbar__title">${title}</div>
        <span></span>
      </div>`;
  }

  // Menü: Battle vs. Rollenspiele.
  function renderHostel(vm) {
    return `
      <section class="screen">
        ${hmTopbar("🛏️ Hostel Mode", "home")}
        <p class="hm-intro">Reise-Spanisch zu zweit anwenden – nicht nur lernen, sondern laut sprechen.</p>
        <div class="hm-menu">
          <button class="hm-card hm-card--battle" data-action="open-battle-setup">
            <span class="hm-card__icon" aria-hidden="true">⚔️</span>
            <span class="hm-card__title">Battle</span>
            <span class="hm-card__desc">Tretet gegeneinander an und übt echte Reisesätze laut. Der Mitspieler bewertet.</span>
            <span class="hm-card__meta">${vm.battleCount} Aufgaben</span>
          </button>
          <button class="hm-card hm-card--roleplay" data-action="open-roleplay-setup">
            <span class="hm-card__icon" aria-hidden="true">🎭</span>
            <span class="hm-card__title">Rollenspiele</span>
            <span class="hm-card__desc">Übernehmt Rollen und spielt echte Situationen als Dialog durch.</span>
            <span class="hm-card__meta">${vm.roleplayCount} Szenen</span>
          </button>
        </div>
      </section>`;
  }

  // Battle: Szene wählen.
  function renderBattleSetup(vm) {
    const scenes = [
      `<button class="hm-scene" data-action="start-battle" data-scene="all">
         <span class="hm-scene__icon" aria-hidden="true">🎲</span>
         <span class="hm-scene__label">Alle Szenen</span>
         <span class="hm-scene__count">${vm.totalCount}</span>
       </button>`,
      ...vm.scenes.map((s) =>
        `<button class="hm-scene" data-action="start-battle" data-scene="${esc(s.id)}">
           <span class="hm-scene__icon" aria-hidden="true">${esc(s.icon)}</span>
           <span class="hm-scene__label">${esc(s.label)}</span>
           <span class="hm-scene__count">${s.count}</span>
         </button>`),
    ].join("");
    const lengths = vm.lengths.map((l) =>
      `<button class="seg seg--len ${l.selected ? "is-active" : ""}" data-action="set-battle-length" data-len="${l.value}"
               aria-pressed="${l.selected}">
         <span class="seg__name">${esc(l.label)}</span>
         <span class="seg__sub">${l.value} Runden</span>
       </button>`).join("");
    return `
      <section class="screen">
        ${hmTopbar("⚔️ Battle", "open-hostel")}
        <p class="hm-intro">Wählt eine Situation. Die App zeigt eine Aufgabe auf Deutsch – einer antwortet laut auf Spanisch, der andere bewertet.</p>
        <div class="hm-length">
          <span class="hm-length__cap">Länge</span>
          <div class="segmented segmented--len" role="group" aria-label="Battle-Länge">${lengths}</div>
        </div>
        <div class="hm-scenes">${scenes}</div>
      </section>`;
  }

  // Battle: laufende Runde.
  function renderBattle(vm) {
    const solution = vm.revealed
      ? `
        <div class="hm-solution" role="status" aria-live="polite">
          <span class="hm-solution__cap">Musterlösung</span>
          <div class="hm-solution__es" lang="es">${esc(vm.answerEs)}</div>
          ${vm.alsoOk && vm.alsoOk.length
            ? `<div class="hm-solution__also">auch ok: ${vm.alsoOk.map((a) => `<span lang="es">${esc(a)}</span>`).join(", ")}</div>`
            : ""}
        </div>
        <div class="hm-verdict">
          <p class="hm-verdict__cap">Spieler ${vm.current === "A" ? "B" : "A"} bewertet:</p>
          <div class="ratebar" role="group" aria-label="Antwort bewerten">
            <button class="feel feel--again" data-action="battle-score" data-points="0">
              <span class="feel__emoji" aria-hidden="true">❌</span><span class="feel__txt">Falsch</span>
            </button>
            <button class="feel feel--good" data-action="battle-score" data-points="1">
              <span class="feel__emoji" aria-hidden="true">😬</span><span class="feel__txt">Fast</span>
            </button>
            <button class="feel feel--easy" data-action="battle-score" data-points="2">
              <span class="feel__emoji" aria-hidden="true">✅</span><span class="feel__txt">Richtig</span>
            </button>
          </div>
        </div>`
      : `
        ${vm.hint ? `<div class="hm-hint">💡 ${esc(vm.hint)}</div>` : ""}
        <button class="cta" data-action="battle-reveal">Lösung anzeigen</button>`;

    return `
      <section class="screen study">
        ${hmTopbar(`${esc(vm.sceneIcon)} ${esc(vm.sceneLabel)}`, "battle-again")}
        <div class="hm-score">
          <span class="hm-score__p ${vm.current === "A" ? "is-turn" : ""}">A <b>${vm.scores.A}</b></span>
          <span class="hm-score__round">Runde ${vm.round}/${vm.totalRounds}</span>
          <span class="hm-score__p ${vm.current === "B" ? "is-turn" : ""}">B <b>${vm.scores.B}</b></span>
        </div>
        <p class="hm-turn" aria-live="polite">Spieler <b>${vm.current}</b> ist dran – laut auf Spanisch!</p>
        <div class="hm-prompt">${esc(vm.promptDe)}</div>
        <div class="controls">${solution}</div>
      </section>`;
  }

  // Battle: Auswertung.
  function renderBattleDone(vm) {
    const verdict = vm.winner === "tie"
      ? "Unentschieden! 🤝"
      : `Spieler ${vm.winner} gewinnt! 🏆`;
    const challenge = vm.challenge
      ? `
        <div class="hm-challenge">
          <span class="hm-challenge__cap">🎯 Real-Life Challenge</span>
          <p class="hm-challenge__text">${esc(vm.challenge.textDe)}</p>
          <p class="hm-challenge__es" lang="es">${esc(vm.challenge.phraseEs)}</p>
          ${vm.challengeDone
            ? `<span class="hm-challenge__done">✓ Geschafft – ¡bien hecho!</span>`
            : `<button class="hm-challenge__btn" data-action="challenge-done" data-id="${esc(vm.challenge.id)}">Challenge gemeistert ✓</button>`}
        </div>`
      : "";
    return `
      <section class="screen">
        <div class="done">
          <div class="done__emoji">🎉</div>
          <h2>Ihr habt ${esc(vm.sceneLabel)} überlebt</h2>
          <p class="hm-result">
            <span class="hm-result__p">Spieler A<br><b>${vm.scores.A}</b></span>
            <span class="hm-result__vs">:</span>
            <span class="hm-result__p">Spieler B<br><b>${vm.scores.B}</b></span>
          </p>
          <p class="hm-winner">${verdict}</p>
          ${challenge}
          <button class="cta" data-action="battle-again">Nochmal spielen</button>
          <button class="ghostbtn" data-action="home">Zur Übersicht</button>
        </div>
      </section>`;
  }

  // Rollenspiele: Szene wählen.
  function renderRoleplaySetup(vm) {
    const list = vm.scenes
      .map((s) =>
        `<button class="hm-rp" data-action="start-roleplay" data-id="${esc(s.id)}">
           <span class="hm-rp__main">
             <span class="hm-rp__title">${esc(s.title)}</span>
             <span class="hm-rp__roles">${esc(s.roleA)} ↔ ${esc(s.roleB)}</span>
           </span>
           ${s.lvlShort ? `<span class="hm-rp__lvl">${esc(s.lvlShort)}</span>` : ""}
         </button>`)
      .join("");
    return `
      <section class="screen">
        ${hmTopbar("🎭 Rollenspiele", "open-hostel")}
        <p class="hm-intro">Wählt eine Szene, verteilt die Rollen und spielt den Dialog laut durch.</p>
        <div class="hm-rps">${list}</div>
      </section>`;
  }

  // Rollenspiele: eine Szene.
  function renderRoleplay(vm) {
    if (!vm) {
      return `
        <section class="screen">
          ${hmTopbar("🎭 Rollenspiel", "open-roleplay-setup")}
          <p class="stat-empty">Szene nicht gefunden.</p>
        </section>`;
    }
    const roles = `
      <div class="hm-roles">
        <div class="hm-role hm-role--a">
          <span class="hm-role__tag">Spieler A · ${esc(vm.roleA.name)}</span>
          <span class="hm-role__goal">${esc(vm.roleA.goal)}</span>
        </div>
        <div class="hm-role hm-role--b">
          <span class="hm-role__tag">Spieler B · ${esc(vm.roleB.name)}</span>
          <span class="hm-role__goal">${esc(vm.roleB.goal)}</span>
        </div>
      </div>`;

    const lines = vm.dialogue
      .map((d) =>
        `<div class="hm-line hm-line--${d.speaker === "A" ? "a" : "b"}">
           <span class="hm-line__who">${esc(d.speaker)}</span>
           <span class="hm-line__bubble">
             <span class="hm-line__es" lang="es">${esc(d.es)}</span>
             <span class="hm-line__de">${esc(d.de)}</span>
           </span>
         </div>`)
      .join("");

    const phrases = vm.usefulPhrases && vm.usefulPhrases.length
      ? `<div class="hm-phrases">
           <span class="hm-phrases__cap">Nützliche Sätze</span>
           <ul class="hm-phrases__list">
             ${vm.usefulPhrases.map((p) => `<li lang="es">${esc(p)}</li>`).join("")}
           </ul>
         </div>`
      : "";

    return `
      <section class="screen">
        ${hmTopbar("🎭 Rollenspiel", "open-roleplay-setup")}
        <div class="hm-rphead">
          <h2 class="hm-rphead__title">${esc(vm.title)}${vm.lvlShort ? ` <span class="hm-rphead__lvl">${esc(vm.lvlShort)}</span>` : ""}</h2>
          <p class="hm-rphead__sit">${esc(vm.situationDe)}</p>
        </div>
        ${roles}
        <button class="ghostbtn hm-swap" data-action="roleplay-swap">🔄 Rollen tauschen</button>
        <div class="hm-dialogue">${lines}</div>
        ${phrases}
        <button class="ghostbtn" data-action="open-roleplay-setup">Andere Szene wählen</button>
      </section>`;
  }

  // ---------- DEFINICIONES (Zuordnen-Quiz) ----------
  // Liste wählen.
  function renderQuizSetup(vm) {
    const list = vm.sets
      .map((s) =>
        `<button class="hm-scene" data-action="start-quiz" data-set="${esc(s.id)}">
           <span class="hm-scene__icon" aria-hidden="true">${esc(s.icon)}</span>
           <span class="hm-scene__label">${esc(s.label)}${s.lvlShort ? ` <span class="quiz-lvl">${esc(s.lvlShort)}</span>` : ""}<br><span class="quiz-set__intro">${esc(s.intro)}</span></span>
           <span class="hm-scene__count">${s.count}</span>
         </button>`)
      .join("");
    return `
      <section class="screen">
        ${hmTopbar("🧩 Definiciones", "home")}
        <p class="hm-intro">Lies eine spanische Definition und wähle den passenden Begriff. So lernst du Wörter über ihre Bedeutung – ganz ohne Übersetzung.</p>
        <div class="hm-scenes">${list}</div>
      </section>`;
  }

  // Eine Frage: Definition + Antwort-Optionen.
  function renderQuiz(vm) {
    const pct = vm.total > 0 ? Math.round(((vm.position + (vm.answered ? 1 : 0)) / vm.total) * 100) : 0;
    const options = vm.options
      .map((o) => {
        const cls = `quiz-opt${o.state !== "idle" ? " quiz-opt--" + o.state : ""}`;
        // Nach dem Aufdecken sind alle Optionen deaktiviert (kein Umentscheiden).
        const dis = vm.answered ? " disabled aria-disabled=\"true\"" : "";
        const mark = o.state === "correct" ? `<span class="quiz-opt__mark" aria-hidden="true">✓</span>`
          : o.state === "wrong" ? `<span class="quiz-opt__mark" aria-hidden="true">✕</span>` : "";
        return `
          <button class="${cls}" type="button" data-action="quiz-answer" data-id="${esc(o.id)}"${dis}>
            <span class="quiz-opt__icon" aria-hidden="true">${esc(o.icon)}</span>
            <span class="quiz-opt__text">
              <span class="quiz-opt__es" lang="es">${esc(o.es)}</span>
              <span class="quiz-opt__de">${esc(o.de)}</span>
            </span>
            ${mark}
          </button>`;
      })
      .join("");

    const feedback = vm.answered
      ? `<div class="quiz-feedback ${vm.isCorrect ? "is-correct" : "is-wrong"}" role="status" aria-live="polite">
           ${vm.isCorrect
             ? `<span class="quiz-feedback__head">¡Correcto! 🎉</span>`
             : `<span class="quiz-feedback__head">No exactamente.</span>
                <span class="quiz-feedback__sol">Richtig: <b lang="es">${esc(vm.solutionEs)}</b> · ${esc(vm.solutionDe)}</span>`}
         </div>
         <button class="cta" data-action="quiz-next">${vm.isLast ? "Ergebnis anzeigen" : "Weiter"}</button>`
      : "";

    return `
      <section class="screen study">
        ${hmTopbar(`${esc(vm.setIcon)} ${esc(vm.setLabel)}`, "quiz-again")}
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="Quiz-Fortschritt"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="topbar__counter quiz-count" aria-live="polite">Frage ${vm.position + 1}/${vm.total}</div>
        <div class="quiz-def">
          <span class="quiz-def__cap">Definición</span>
          <p class="quiz-def__text" lang="es">${esc(vm.definition)}</p>
        </div>
        <div class="quiz-opts">${options}</div>
        ${feedback}
      </section>`;
  }

  // Auswertung.
  function renderQuizDone(vm) {
    const rate = vm.total > 0 ? Math.round((vm.correct / vm.total) * 100) : 0;
    const verdict = vm.perfect ? "¡Perfecto! Alles richtig. 🏆"
      : rate >= 60 ? "¡Muy bien! Weiter so. 👏"
      : "Sigue practicando – Übung macht den Meister. 💪";
    return `
      <section class="screen">
        <div class="done">
          <div class="done__emoji">${vm.perfect ? "🏆" : "🧩"}</div>
          <h2>${esc(vm.setLabel)} geschafft</h2>
          <p class="quiz-result"><b>${vm.correct}</b> von <b>${vm.total}</b> richtig</p>
          <p class="hm-winner">${verdict}</p>
          <button class="cta" data-action="quiz-again">Nochmal üben</button>
          <button class="ghostbtn" data-action="home">Zur Übersicht</button>
        </div>
      </section>`;
  }

  // ---------- EL CUERPO (interaktive Körperkarte) ----------
  // Stilisierte, frontale Figur als reines SVG (dekorativ, aria-hidden). Bezugsrahmen
  // viewBox 0 0 200 440 – exakt der, auf den sich die Prozent-Koordinaten der Hotspots
  // beziehen. Gliedmaßen sind runde Striche (currentColor), Rumpf/Kopf gefüllte Flächen.
  const BP_FIGURE = `
    <svg class="bp-figure" viewBox="0 0 200 440" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      <!-- weicher Bodenschatten – erdet die Figur. -->
      <ellipse class="bp-figure__ground" cx="100" cy="430" rx="56" ry="8" />
      <!-- Arme & Beine: runde Striche. -->
      <g class="bp-figure__limbs" fill="none" stroke="currentColor" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
        <path d="M70 104 L52 168 L46 240" />
        <path d="M130 104 L148 168 L154 240" />
      </g>
      <g class="bp-figure__limbs" fill="none" stroke="currentColor" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
        <path d="M86 236 L82 330 L78 408" />
        <path d="M114 236 L118 330 L122 408" />
      </g>
      <!-- Rumpf, Kopf, Hände/Füße + runde Schulter-/Hüftgelenke (glätten die Übergänge). -->
      <g class="bp-figure__body" fill="currentColor" stroke="none">
        <ellipse cx="74" cy="416" rx="17" ry="9" />
        <ellipse cx="126" cy="416" rx="17" ry="9" />
        <circle cx="44" cy="248" r="12" />
        <circle cx="156" cy="248" r="12" />
        <circle cx="70" cy="104" r="14" />
        <circle cx="130" cy="104" r="14" />
        <circle cx="86" cy="238" r="15" />
        <circle cx="114" cy="238" r="15" />
        <path d="M68 96 L132 96 C141 96 141 105 139 113 L126 212 C125 232 121 242 100 242 C79 242 75 232 74 212 L61 113 C59 105 59 96 68 96 Z" />
        <rect x="91" y="68" width="18" height="20" rx="8" />
        <circle cx="100" cy="44" r="30" />
      </g>
      <!-- Lichtkante oben links: gibt der flachen Sticker-Figur etwas Tiefe. -->
      <g class="bp-figure__shine" fill="#fff" stroke="none">
        <ellipse cx="89" cy="35" rx="11" ry="13" />
        <ellipse cx="85" cy="152" rx="12" ry="44" />
      </g>
    </svg>`;

  function renderCuerpo(vm) {
    const dots = vm.parts
      .map((p) => {
        const cls = `bp-dot${p.selected ? " is-active" : ""}${p.seen ? " is-seen" : ""}`;
        return `
          <button class="${cls}" type="button" data-action="cuerpo-select" data-id="${esc(p.id)}"
                  style="left:${p.x}%;top:${p.y}%" aria-label="${esc(p.de)}" title="${esc(p.de)}"
                  aria-pressed="${p.selected ? "true" : "false"}">
            <span class="bp-dot__ring" aria-hidden="true"></span>
          </button>`;
      })
      .join("");

    const sel = vm.selected;
    const speak = sel && vm.speakable
      ? cornerBtn({ base: "cardbtn--speak bp-speak", on: false, icon: "🔊", label: "Wort anhören", action: "cuerpo-speak" })
      : "";
    const panel = sel
      ? `
        <div class="bp-panel bp-panel--filled" role="status" aria-live="polite">
          <div class="bp-panel__top">
            <span class="bp-panel__de">${esc(sel.de)}</span>
            ${speak}
          </div>
          <p class="bp-panel__es" lang="es">${esc(sel.es)}</p>
          ${sel.tip ? `<p class="bp-panel__tip"><span aria-hidden="true">🗣️</span> ${esc(sel.tip)}</p>` : ""}
          ${sel.note ? `<p class="bp-panel__note">${esc(sel.note)}</p>` : ""}
        </div>`
      : `
        <div class="bp-panel" role="status" aria-live="polite">
          <p class="bp-panel__hint">👆 Tippe einen Punkt auf der Figur an – dann erscheinen das spanische Wort, die Aussprache und ein Reisetipp.</p>
        </div>`;

    const pct = vm.total > 0 ? Math.round((vm.exploredCount / vm.total) * 100) : 0;
    const done = vm.total > 0 && vm.exploredCount >= vm.total;
    const progress = `
      <div class="bp-progress">
        <div class="bp-progress__bar"><div class="bp-progress__fill" style="width:${pct}%"></div></div>
        <span class="bp-progress__label">${done ? "¡Cuerpo completo! 🎉 Alle " + vm.total + " erkundet" : "Erkundet: " + vm.exploredCount + "/" + vm.total}</span>
      </div>`;

    return `
      <section class="screen bp-screen">
        ${hmTopbar("🧍 El Cuerpo", "home")}
        <p class="hm-intro">Der menschliche Körper auf Spanisch – zum Antippen. Wähle ein Körperteil und lerne Wort, Aussprache und den passenden Reisesatz (oft die «Me duele …»-Formel für Arzt &amp; Apotheke).</p>
        ${progress}
        <div class="bp-stage">
          <div class="bp-figwrap">
            ${BP_FIGURE}
            ${dots}
          </div>
          ${panel}
        </div>
      </section>`;
  }

  window.SC = window.SC || {};
  window.SC.ui = { esc, renderHome, renderStudy, renderDone, renderStats, renderCard, renderEditor, renderInfo,
                   renderBadges, badgeToast,
                   renderHostel, renderBattleSetup, renderBattle, renderBattleDone, renderRoleplaySetup, renderRoleplay,
                   renderQuizSetup, renderQuiz, renderQuizDone, renderCuerpo };
})();
