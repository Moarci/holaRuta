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

  // Sprachausgabe verfügbar? (TTS-Modul geladen + vom Browser unterstützt).
  // Steuert, ob der Hör-Modus und 🔊-Buttons überhaupt angeboten werden.
  function speechReady() {
    const sp = window.SC && window.SC.speech;
    return !!(sp && sp.isSupported());
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

  // Entdecken-Reiter: die großen Einstiege als volle Gradient-Buttons.
  // need: optionale Voraussetzung ("speech"|"frases"|"countries") – fehlt das
  // jeweilige Modul/Feature, wird der Eintrag ausgeblendet (graceful degradation).
  const FEATURES = [
    { action: "open-spickzettel", icon: "🆘", title: "Spickzettel",   sub: "Die wichtigsten Sätze sofort griffbereit", grad: ["#B5302A", "#CE463E"] },
    { action: "open-hostel",      icon: "🛏️", title: "Hostel Mode",   sub: "Zu zweit üben: Battle & Rollenspiele",   grad: ["#C25A45", "#8E4FA8"] },
    { action: "open-quiz-setup",  icon: "🧩", title: "Definiciones",  sub: "Definition lesen, Begriff wählen",       grad: ["#3F7355", "#2F6B70"] },
    { action: "open-frases",      icon: "🧱", title: "Frases flexibles", sub: "Bausteine einsetzen – selbst Sätze bauen", grad: ["#7048E8", "#5A3FB8"], need: "frases" },
    { action: "open-precios",     icon: "💵", title: "Precios al oído", sub: "Preise hören, die Zahl eintippen",     grad: ["#5E7D3A", "#76954E"], need: "speech" },
    { action: "open-cuerpo",      icon: "🧍", title: "El Cuerpo",     sub: "Körperteile antippen: Wort & Reisetipp", grad: ["#2E6E86", "#7D4A8E"] },
    { action: "open-info",        icon: "🌎", title: "Länderkunde",   sub: "Land & Leute – von México bis Chile",    grad: ["#B97C24", "#C2502E"], need: "countries" },
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
    // Ruta del día: ein Tap für eine kurze, kategorienübergreifende Tagesrunde –
    // bevorzugt fällige Karten, sonst neue. Stärkt die Lern-Serie.
    const rutaDia = `
      <button class="today__ruta" data-action="ruta-del-dia">
        <span class="today__ruta-main">🗺️ Ruta del día</span>
        <span class="today__ruta-sub">Kurze Tagesrunde quer durch alle Themen</span>
      </button>`;

    // Einstellungs-Panel: Kopfzeile fasst die aktive Wahl zusammen, Inhalt
    // (Modus/Richtung/Stufen) erscheint nur aufgeklappt.
    const lvlSummary = vm.allLevels
      ? "Alle Stufen"
      : vm.levels.filter((l) => l.active).map((l) => l.short).join(" + ");
    const modeLabel = mode === "type" ? "⌨️ Schreiben" : mode === "listen" ? "👂 Hören" : "🃏 Karteikarte";
    const setupSummary = `${modeLabel} · ${vm.dir === "es2de" ? "🇪🇸→🇩🇪" : "🇩🇪→🇪🇸"} · ${esc(lvlSummary)}`;
    // Hör-Modus (Dictado) nur anbieten, wenn der Browser Sprachausgabe kann –
    // sonst gäbe es nichts zu hören (graceful degradation).
    const listenSeg = speechReady()
      ? `<button class="seg ${mode === "listen" ? "is-active" : ""}" data-action="set-mode" data-mode="listen">👂 Hören</button>`
      : "";
    const setupBody = `
      <div class="setup__body" id="setup-body">
        <div class="switchgroup">
          <span class="switchcap">Modus</span>
          <div class="segmented${listenSeg ? " segmented--three" : ""}" role="tablist" aria-label="Lernmodus">
            <button class="seg ${mode === "flip" ? "is-active" : ""}" data-action="set-mode" data-mode="flip">🃏 Karteikarte</button>
            <button class="seg ${mode === "type" ? "is-active" : ""}" data-action="set-mode" data-mode="type">⌨️ Schreiben</button>
            ${listenSeg}
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
        ${rutaDia}
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
    // Voraussetzungen prüfen (Offline-/Feature-Guards): Länderkunde braucht das
    // countries-Modul, Precios die Sprachausgabe, Frases das frases-Modul.
    const has = { countries: vm.hasCountries, speech: vm.hasSpeech, frases: vm.hasFrases };
    const feats = FEATURES.filter((x) => !x.need || has[x.need]).map((x) => `
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
      ${vm.hasBadges ? navrow("open-badges", "🎖️", "Mein Ruta-Pass", vm.badgeCount || "") : ""}
      ${navrow("open-editor", "✍️", "Eigene Karten")}

      <p class="sectioncap">Deine Daten</p>
      ${navrow("export-data", "📤", "Daten exportieren")}
      ${navrow("import-data", "📥", "Daten importieren")}
      <input type="file" id="import-file" accept=".json,application/json" hidden />

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
      vm.mode === "listen" ? listenBody(vm) :
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
    if (!speechReady()) return "";
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

  // Interaktives Farbfeld: zeigt die echte Farbe einer Farben-Karte. Erscheint nur,
  // wenn die Karte ein swatch trägt (sonst leerer String). Der dünne Rahmen hält auch
  // Weiß/Beige sichtbar; der Farbwert kommt aus reinen Daten (data.js), nie aus Logik.
  function colorSwatch(swatch) {
    if (!swatch) return "";
    return `<div class="swatch" aria-hidden="true" style="--sw:${esc(swatch)}"></div>`;
  }

  // Karteikarte-Modus: 3D-Dreh-Karte. Frage/Antwort hängen an der Lernrichtung;
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
            ${colorSwatch(vm.swatch)}
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
        ${colorSwatch(vm.swatch)}
        ${sq ? "" : tip}
        ${verdict}
      </div>
      <div class="controls" id="controls">
        ${contextPanel(vm.context, vm.contextOpen)}
        ${rateButtons()}
      </div>`;
  }

  // Hör-Modus (Escuchar / Dictado): die App spricht die spanische Antwort vor (der
  // Controller stößt das beim Kartenwechsel automatisch an, siehe maybeAutoSpeak).
  // Der spanische Text bleibt verborgen, bis getippt wurde – getestet wird IMMER
  // gegen Spanisch (richtungsunabhängig). Danach Aufdecken + Bewerten wie im Schreiben-
  // Modus. Reuse: 🔊 (data-action="speak"), typer-Formular, rateButtons.
  function listenBody(vm) {
    const res = vm.typeResult; // null | {correct, answers, input}
    const tip = vm.tip ? `<div class="face__tip">🗣️ ${esc(vm.tip)}</div>` : "";

    if (!res) {
      const replay = speechReady()
        ? `<button class="listen-replay ghostbtn" type="button" data-action="speak">🔊 Nochmal anhören</button>`
        : "";
      return `
        <div class="card-static card-listen">
          <span class="face__cat">${esc(vm.catLabel)}</span>
          ${levelBadge(vm, false)}
          <span class="listen-ear" aria-hidden="true">👂</span>
          ${replay}
          <span class="face__hint">Hör zu und tippe auf Spanisch, was du hörst</span>
        </div>
        <form class="typer" data-action="submit-typed" id="typer">
          <input class="typer__input" id="answer" type="text" autocomplete="off"
                 autocapitalize="off" autocorrect="off" spellcheck="false"
                 placeholder="Tippe das Gehörte …" />
          <button class="typer__btn" type="submit">Prüfen</button>
        </form>`;
    }

    const verdict = res.correct
      ? `<div class="verdict verdict--ok">✓ Richtig gehört!</div>`
      : `<div class="verdict verdict--no">✗ Nicht ganz – deine Eingabe: „${esc(res.input || "—")}“</div>`;
    return `
      <div class="card-static ${res.correct ? "is-ok" : "is-no"}" role="status" aria-live="assertive">
        <span class="face__cat">${esc(vm.catLabel)}</span>
        ${levelBadge(vm, false)}
        ${contextIconBtn(vm.context, false, vm.contextOpen)}
        ${speakBtn(false)}
        <div class="face__word" lang="es">${esc(vm.es)}</div>
        ${colorSwatch(vm.swatch)}
        <div class="listen-de">${esc(vm.de)}</div>
        ${tip}
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
    // Offline-Guard: Badge-Modul fehlt (unvollständiger Offline-Cache) ->
    // Hinweis statt TypeError bei jedem Render.
    if (!vm) {
      return `
        <section class="screen">
          <div class="topbar">
            <button class="iconbtn" data-action="home" aria-label="Zurück">‹</button>
            <div class="topbar__title">🎖️ Mein Ruta-Pass</div>
            <span></span>
          </div>
          <p class="stat-empty">Der Ruta-Pass ist gerade nicht verfügbar – vermutlich wurde die App offline geöffnet, bevor alles geladen war. Mit Netz neu laden, dann klappt's wieder.</p>
        </section>`;
    }
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

  // Schlichter Hinweis-Toast (gleiche Optik/Ebene wie die Badge-Einblendung),
  // z.B. wenn das Speichern fehlschlägt. Tippen blendet ihn aus.
  function noticeToast(text) {
    return `
      <button class="btoast" data-action="dismiss-notice" aria-live="assertive">
        <span class="btoast__head">⚠️ ${esc(text)}</span>
      </button>`;
  }

  // „Was ist neu?"-Fenster nach einem Update. Zeigt je Version, WAS sich
  // geändert hat, und erklärt, WIE man aktuell bleibt. Liegt als eigene Ebene
  // (Scrim + Karte) über dem Screen; Schließen führt zurück zur App.
  function updateNotice(list) {
    if (!list || !list.length) return "";
    const blocks = list.map((e) => {
      const items = (e.items || []).map((t) => `<li>${esc(t)}</li>`).join("");
      const meta = e.title ? `${esc(e.title)} · v${esc(e.version)}` : `v${esc(e.version)}`;
      return `
        <div class="upd__block">
          <div class="upd__ver">${meta}</div>
          <ul class="upd__list">${items}</ul>
        </div>`;
    }).join("");
    return `
      <div class="upd-scrim" data-action="dismiss-update">
        <div class="upd" role="dialog" aria-modal="true" aria-labelledby="upd-title"
             data-action="upd-stop">
          <div class="upd__head">🎉 <span id="upd-title">HolaRuta wurde aktualisiert</span></div>
          ${blocks}
          <div class="upd__how">
            <div class="upd__how-title">So bleibst du aktuell</div>
            <p class="upd__how-text">HolaRuta aktualisiert sich automatisch im Hintergrund.
            Schließe die App ab und zu ganz und öffne sie neu – dann hast du immer die
            neueste Version. Geht etwas mal nicht, hilft „Jetzt neu laden".</p>
          </div>
          <div class="upd__actions">
            <button class="ghostbtn" data-action="reload-app">Jetzt neu laden</button>
            <button class="cta upd__ok" data-action="dismiss-update">Verstanden</button>
          </div>
        </div>
      </div>`;
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
    // Object.create(null): die Verlaufszeichen kommen aus localStorage –
    // Lookups dürfen nie Prototype-Properties treffen ("constructor",
    // "__proto__" …), sonst landet Funktions-Quelltext im style-Attribut.
    const color = Object.create(null);
    color.a = "var(--no)"; color.g = "var(--ok)"; color.e = "var(--easy)";
    const title = Object.create(null);
    title.a = "Nochmal"; title.g = "Gut"; title.e = "Einfach";
    const dots = hist
      .map((ch) => `<span class="hdot" aria-hidden="true" style="background:${color[ch] || "var(--muted)"}" title="${title[ch] || ""}"></span>`)
      .join("");
    // Textzusammenfassung für Screenreader (Farbe allein reicht nicht).
    const count = Object.create(null);
    count.a = 0; count.g = 0; count.e = 0;
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

  // Streckenkarte: der Lernfortschritt als Bus-Strecke (on-brand „Ruta"). Drei
  // Haltestellen Neu → Am Lernen → Gemeistert; der Bus (🚌) fährt mit der
  // Meister-Quote voran. Reine Anzeige aus der vorhandenen stats.overview.
  function routeMap(ov) {
    const pct = ov.total ? Math.round((ov.mastered / ov.total) * 100) : 0;
    const stops = [
      { icon: "🆕", label: "Neu",        n: ov.neu,      cls: "is-new" },
      { icon: "📚", label: "Am Lernen",  n: ov.learning, cls: "is-learn" },
      { icon: "🏁", label: "Gemeistert", n: ov.mastered, cls: "is-master" },
    ];
    const stopsHtml = stops.map((s) => `
      <div class="route__stop ${s.cls}">
        <span class="route__dot" aria-hidden="true">${s.icon}</span>
        <span class="route__n">${s.n}</span>
        <span class="route__lbl">${esc(s.label)}</span>
      </div>`).join("");
    return `
      <div class="route" role="img" aria-label="Lern-Strecke: ${ov.neu} neu, ${ov.learning} am Lernen, ${ov.mastered} gemeistert (${pct} %)">
        <div class="route__head">
          <span class="route__cap">🚌 Deine Ruta</span>
          <span class="route__pct">${pct} % gemeistert</span>
        </div>
        <div class="route__track">
          <div class="route__fill" style="width:${pct}%"></div>
          <span class="route__bus" style="left:${pct}%" aria-hidden="true">🚌</span>
          <div class="route__stops">${stopsHtml}</div>
        </div>
      </div>`;
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
        ${routeMap(ov)}
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
        <div class="fact"><span class="fact__k">Leichtigkeit</span><span class="fact__v">${typeof s.ease === "number" && isFinite(s.ease) ? s.ease.toFixed(2) : "–"}</span></div>
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
          ${colorSwatch(vm.swatch)}
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

  // ---------- SPICKZETTEL (Survival-Schnellzugriff) ----------
  // Reine Nachschlage-Ansicht (kein SRS): die kritischsten Sätze groß, je mit 🔊.
  function renderSpickzettel(vm) {
    const groups = vm.groups.map((g) => {
      const rows = g.cards.map((c) => `
        <div class="sz-row">
          <div class="sz-row__main">
            <div class="sz-row__de">${esc(c.de)}</div>
            <div class="sz-row__es" lang="es">${esc(c.es)}</div>
            ${c.tip ? `<div class="sz-row__tip">🗣️ ${esc(c.tip)}</div>` : ""}
          </div>
          ${vm.speakable
            ? `<button class="sz-speak" type="button" data-action="speak-card" data-id="${esc(c.id)}" aria-label="Anhören" title="Anhören">🔊</button>`
            : ""}
        </div>`).join("");
      return `
        <div class="sz-group" style="--from:${esc(g.grad[0])};--to:${esc(g.grad[1])}">
          <h3 class="sz-group__h"><span aria-hidden="true">${esc(g.icon)}</span> ${esc(g.label)}</h3>
          <div class="sz-list">${rows}</div>
        </div>`;
    }).join("");
    return `
      <section class="screen">
        ${hmTopbar("🆘 Spickzettel", "home")}
        <p class="hm-intro">Die wichtigsten Sätze für den Ernstfall – groß, sofort da und auf Tipp vorgelesen. Kein Lernen, nur schnell nachschlagen.</p>
        ${groups}
      </section>`;
  }

  // ---------- PRECIOS AL OÍDO (Preis-Hörtrainer) ----------
  // Die App sagt einen Betrag auf Spanisch (Auto-Speak), man tippt die Ziffern.
  // Reuse der Hör-Karten-Optik (card-listen) + matcher (field "de").
  function renderPrecios(vm) {
    const pct = vm.total > 0 ? Math.round(((vm.position + (vm.result ? 1 : 0)) / vm.total) * 100) : 0;
    const replay = vm.speakable
      ? `<button class="listen-replay ghostbtn" type="button" data-action="precios-speak">🔊 Nochmal anhören</button>`
      : "";
    const body = !vm.result
      ? `
        <div class="card-static card-listen">
          <span class="listen-ear" aria-hidden="true">💵</span>
          ${replay}
          <span class="face__hint">Welchen Betrag hörst du? Tippe die Zahl.</span>
        </div>
        <form class="typer" data-action="submit-precios" id="precios-form">
          <input class="typer__input" id="precios-answer" type="text" inputmode="numeric"
                 autocomplete="off" autocorrect="off" spellcheck="false" placeholder="z. B. 4500" />
          <button class="typer__btn" type="submit">Prüfen</button>
        </form>`
      : `
        <div class="card-static ${vm.result.correct ? "is-ok" : "is-no"}" role="status" aria-live="assertive">
          <div class="face__word" lang="es">${esc(vm.answerEs)}</div>
          <div class="listen-de">= ${esc(vm.answerDe)}</div>
          ${vm.result.correct
            ? `<div class="verdict verdict--ok">✓ Richtig gehört!</div>`
            : `<div class="verdict verdict--no">✗ Nicht ganz – deine Eingabe: „${esc(vm.result.input || "—")}“</div>`}
        </div>
        <button class="cta" data-action="precios-next">${vm.isLast ? "Ergebnis anzeigen" : "Weiter"}</button>`;
    return `
      <section class="screen study">
        ${hmTopbar("💵 Precios al oído", "home")}
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="Fortschritt"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="topbar__counter quiz-count" aria-live="polite">${vm.position + 1}/${vm.total}</div>
        ${body}
      </section>`;
  }

  function renderPreciosDone(vm) {
    const rate = vm.total > 0 ? Math.round((vm.correct / vm.total) * 100) : 0;
    const verdict = vm.perfect ? "¡Perfecto! Jeden Preis erkannt. 🏆"
      : rate >= 60 ? "¡Bien! Dein Ohr für Zahlen wird besser. 👏"
      : "Sigue practicando – Zahlen hören ist Übungssache. 💪";
    return `
      <section class="screen">
        <div class="done">
          <div class="done__emoji">${vm.perfect ? "🏆" : "💵"}</div>
          <h2>Precios al oído</h2>
          <p class="quiz-result"><b>${vm.correct}</b> von <b>${vm.total}</b> richtig gehört</p>
          <p class="hm-winner">${verdict}</p>
          <button class="cta" data-action="precios-again">Nochmal hören</button>
          <button class="ghostbtn" data-action="home">Zur Übersicht</button>
        </div>
      </section>`;
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
    // Badge zeigt die tatsächliche Rundenzahl bei der gewählten Länge – ehrlicher
    // als die reine Aufgabenzahl (kleine Szenen ergeben weniger Runden).
    const roundsBadge = (n) => `<span class="hm-scene__count">${n} Runden</span>`;
    const scenes = [
      `<button class="hm-scene" data-action="start-battle" data-scene="all">
         <span class="hm-scene__icon" aria-hidden="true">🎲</span>
         <span class="hm-scene__label">Alle Szenen</span>
         ${roundsBadge(vm.totalRounds)}
       </button>`,
      ...vm.scenes.map((s) =>
        `<button class="hm-scene" data-action="start-battle" data-scene="${esc(s.id)}">
           <span class="hm-scene__icon" aria-hidden="true">${esc(s.icon)}</span>
           <span class="hm-scene__label">${esc(s.label)}</span>
           ${roundsBadge(s.rounds)}
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
        <p class="hm-intro">Ein Sprach-Duell zu zweit: Aufgabe auf Deutsch lesen, laut auf Spanisch antworten – der Mitspieler bewertet. Wer mehr Punkte sammelt, gewinnt.</p>
        <details class="hm-how" open>
          <summary class="hm-how__sum">So läuft ein Battle</summary>
          <ol class="hm-steps">
            <li><b>Zu zweit:</b> Ihr seid Spieler A und B – ein Handy reicht, ihr reicht es reihum weiter.</li>
            <li><b>Antworten:</b> Die App zeigt eine Aufgabe auf Deutsch. Wer dran ist, sagt sie laut auf Spanisch.</li>
            <li><b>Bewerten:</b> „Lösung anzeigen“ – der andere vergleicht und tippt ✅ Richtig&nbsp;(2), 😬 Fast&nbsp;(1) oder ❌ Falsch&nbsp;(0).</li>
            <li><b>Abwechseln:</b> A, B, A, B … bis alle Runden gespielt sind. Am Ende gewinnt, wer mehr Punkte hat – plus eine Real-Life-Challenge als Bonus.</li>
          </ol>
        </details>
        <div class="hm-length">
          <span class="hm-length__cap">Länge</span>
          <div class="segmented segmented--len" role="group" aria-label="Battle-Länge">${lengths}</div>
        </div>
        <div class="hm-names">
          <span class="hm-length__cap">Namen <span class="hm-names__opt">(optional)</span></span>
          <div class="hm-names__row">
            <input id="pname-a" class="hm-name" type="text" inputmode="text" autocomplete="off"
                   maxlength="14" placeholder="Spieler A" aria-label="Name Spieler A" value="${esc(vm.names.A)}">
            <span class="hm-names__vs" aria-hidden="true">vs</span>
            <input id="pname-b" class="hm-name" type="text" inputmode="text" autocomplete="off"
                   maxlength="14" placeholder="Spieler B" aria-label="Name Spieler B" value="${esc(vm.names.B)}">
          </div>
        </div>
        <div class="hm-scenes"><span class="hm-length__cap">Szene wählen &amp; starten</span>${scenes}</div>
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
          <p class="hm-verdict__cap"><b>${esc(vm.raterName)}</b> bewertet die Antwort:</p>
          ${vm.alsoOk && vm.alsoOk.length
            ? `<p class="hm-verdict__fair">Diese Varianten zählen auch als richtig.</p>`
            : ""}
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

    const meta = `
      <span class="hm-prompt__tag">${esc(vm.sceneIcon)} ${esc(vm.sceneLabel)}</span>
      ${vm.levelShort ? `<span class="hm-prompt__lvl">${esc(vm.levelShort)}</span>` : ""}`;

    return `
      <section class="screen study">
        ${hmTopbar(vm.suddenDeath ? "⚡ Stichrunde" : `${esc(vm.sceneIcon)} ${esc(vm.sceneLabel)}`, "battle-again")}
        <div class="hm-score">
          <span class="hm-score__p ${vm.current === "A" ? "is-turn" : ""}">${esc(vm.chipA)} <b>${vm.scores.A}</b></span>
          <span class="hm-score__round">${vm.suddenDeath ? "⚡ " : ""}Runde ${vm.round}/${vm.totalRounds}</span>
          <span class="hm-score__p ${vm.current === "B" ? "is-turn" : ""}">${esc(vm.chipB)} <b>${vm.scores.B}</b></span>
        </div>
        <p class="hm-turn" aria-live="polite"><b>${esc(vm.currentName)}</b> ist dran – laut auf Spanisch!</p>
        <div class="hm-prompt"><div class="hm-prompt__meta">${meta}</div>${esc(vm.promptDe)}</div>
        <div class="controls">${solution}</div>
      </section>`;
  }

  // Battle: Auswertung.
  function renderBattleDone(vm) {
    const verdict = vm.winner === "tie"
      ? "Unentschieden! 🤝"
      : `${esc(vm.winnerName)} gewinnt! 🏆`;
    // Bei Gleichstand: Stichrunde anbieten (zwei Extra-Runden, A & B).
    const tieBreak = vm.winner === "tie"
      ? `<button class="cta cta--tiebreak" data-action="battle-sudden-death">⚡ ${vm.suddenDeath ? "Noch eine Stichrunde" : "Stichrunde spielen"}</button>`
      : "";
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
            <span class="hm-result__p ${vm.winner === "A" ? "is-win" : ""}">${esc(vm.nameA)}<br><b>${vm.scores.A}</b></span>
            <span class="hm-result__vs">:</span>
            <span class="hm-result__p ${vm.winner === "B" ? "is-win" : ""}">${esc(vm.nameB)}<br><b>${vm.scores.B}</b></span>
          </p>
          <p class="hm-winner">${verdict}</p>
          ${tieBreak}
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

  // ---------- FRASES FLEXIBLES (Satzbaukasten) ----------
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
         <button class="cta" data-action="frases-next">${vm.isLast ? "Ergebnis anzeigen" : "Weiter"}</button>`
      : "";

    return `
      <section class="screen study">
        ${hmTopbar("🧱 Frases flexibles", "home")}
        <div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="Fortschritt"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="topbar__counter quiz-count" aria-live="polite">Satz ${vm.position + 1}/${vm.total}</div>
        <div class="quiz-def">
          <span class="quiz-def__cap">Bilde den Satz</span>
          <p class="frases-target">${esc(vm.targetDe)}</p>
          <p class="quiz-def__text frases-frame" lang="es">${frameHtml}</p>
        </div>
        <div class="quiz-opts">${options}</div>
        ${feedback}
      </section>`;
  }

  function renderFrasesDone(vm) {
    const rate = vm.total > 0 ? Math.round((vm.correct / vm.total) * 100) : 0;
    const verdict = vm.perfect ? "¡Perfecto! Alle Sätze gebaut. 🏆"
      : rate >= 60 ? "¡Muy bien! Weiter so. 👏"
      : "Sigue practicando – Satzbauen kommt mit der Übung. 💪";
    return `
      <section class="screen">
        <div class="done">
          <div class="done__emoji">${vm.perfect ? "🏆" : "🧱"}</div>
          <h2>Frases flexibles geschafft</h2>
          <p class="quiz-result"><b>${vm.correct}</b> von <b>${vm.total}</b> richtig</p>
          <p class="hm-winner">${verdict}</p>
          <button class="cta" data-action="frases-again">Nochmal üben</button>
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
                   renderBadges, badgeToast, noticeToast, updateNotice,
                   renderHostel, renderBattleSetup, renderBattle, renderBattleDone, renderRoleplaySetup, renderRoleplay,
                   renderQuizSetup, renderQuiz, renderQuizDone, renderCuerpo, renderSpickzettel,
                   renderPrecios, renderPreciosDone, renderFrases, renderFrasesDone };
})();
