/*
 * ui.js  (SC.ui) – View. Baut HTML aus dem Zustand, kennt KEINE Logik/Speicher.
 * Buttons tragen data-action (+ optional data-*); der Controller (app.js) hört
 * zentral darauf (Event-Delegation). So bleibt View dumm und austauschbar.
 */
(function () {
  "use strict";

  // Übersetzungs-Helfer lokal binden statt als impliziten Global (window.t) zu
  // nutzen. i18n.js läuft vor ui.js und setzt SC.i18n.t === window.t, daher ist
  // die Referenz hier bereits vorhanden.
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;

  // Geteilte, zustandsfreie Render-Primitive aus view-helpers.js (SC.view) –
  // dieselbe Quelle nutzen auch die Feature-Module (kein Duplikat). view-helpers.js
  // läuft vor ui.js (index.html / Build / _dom-stub-Reihenfolge).
  // (moduleSheet/phraseGroups/tipsShareBtn/levelMeta/readingBlock werden hier nicht
  // mehr gebraucht: die Info-Blätter sind in features/*-Module gewandert und holen
  // sie selbst aus SC.view.)
  const { esc, renderIcon, canShare, speechReady, shareBlock, countryPicker, moduleShareBtn, hmTopbar, favStar, sect, cornerBtn } = window.SC.view;

  // Hell/Dunkel-Wahl als doppelseitiges Emaille-Schild. Hell = Kaffee am Morgen
  // (AM, Dampf steigt), Dunkel = Wein am Abend (PM, Glas voll). Bewusst KEIN blinder
  // Umschalter mehr: AM und PM sind je ein eigener Knopf (role="radio"), man tippt
  // direkt die gewünschte Seite an (AM → hell, PM → dunkel) – das aktive Schild
  // leuchtet, das andere liegt gedimmt daneben. Das Schild reagiert per CSS auf
  // [data-theme]; die Wahl hängt an data-action="set-theme".
  function themeToggle(theme, opts) {
    const dark = theme === "dark";
    const large = opts && opts.large;
    // opts.bev = Tag-/Abendgetränk des Reiselands (bebidas.BEBIDAS[id]). Liegt es
    // vor, trägt das Schild dessen Getränke (gleiche Formen wie „Bebidas AM/PM")
    // statt des Standard-Kaffee/Wein-Paars – so passt Hell/Dunkel sichtbar zum
    // Reiseland. Die Animations-Klassen bleiben themesign__* (an [data-theme]).
    const bev = opts && opts.bev;
    const amArt = bev
      ? bebAmArt(bev.am.art, bev.am.cold, "themesign__steam")
      : `<g class="themesign__steam" fill="none" stroke-width="4.5" stroke-linecap="round">
                <path d="M80 118 q-7 -9 0 -18 q7 -9 0 -18"/>
                <path d="M92 118 q-7 -9 0 -18 q7 -9 0 -18"/>
                <path d="M104 118 q-7 -9 0 -18 q7 -9 0 -18"/>
              </g>
              <path stroke="none" d="M52 128 h66 a6 6 0 0 1 6 6 q-2 34 -10 44 a16 16 0 0 1 -13 7 h-32 a16 16 0 0 1 -13 -7 q-8 -10 -10 -44 a6 6 0 0 1 6 -6 z"/>
              <path fill="none" stroke-width="9" d="M124 138 q22 0 22 18 q0 18 -20 19"/>
              <path stroke="none" d="M44 190 h80 q6 0 4 5 q-3 7 -44 7 q-41 0 -44 -7 q-2 -5 4 -5 z"/>`;
    const pmArt = bev
      ? bebPmArt(bev.pm.art, bev.pm.liquid, "themesign__wine", "signBowlClip")
      : `<clipPath id="signBowlClip">
                <path d="M58 92 q34 -10 68 0 q2 30 -14 46 q-8 8 -20 8 q-12 0 -20 -8 q-16 -16 -14 -46 z"/>
              </clipPath>
              <rect class="themesign__wine" clip-path="url(#signBowlClip)" x="50" y="118" width="84" height="40" fill="#7C2A33"/>
              <path fill="none" stroke="#ECE2CA" stroke-width="6.5" stroke-linejoin="round" d="M58 92 q34 -10 68 0 q2 30 -14 46 q-8 8 -20 8 q-12 0 -20 -8 q-16 -16 -14 -46 z"/>
              <rect x="89" y="146" width="6" height="42" rx="3" fill="#ECE2CA"/>
              <path stroke="none" fill="#ECE2CA" d="M64 196 h56 q6 0 4 4 q-3 5 -32 5 q-29 0 -32 -5 q-2 -4 4 -4 z"/>`;
    return `<div class="themesign${large ? " themesign--lg" : ""}" role="radiogroup" aria-label="${esc(t("common.themeCap"))}">
      <span class="themesign__plank">
        <button type="button" class="themesign__plaque themesign__plaque--am" data-action="set-theme" data-theme="light"
                role="radio" aria-checked="${!dark}" aria-label="${esc(t("common.themeLight"))}" title="${esc(t("common.themeLightTitle"))}">
          <svg viewBox="0 0 184 224" aria-hidden="true" focusable="false">
            <g filter="url(#signGrain)">
              <rect x="6" y="4" width="172" height="216" rx="5" fill="#EDE4CD"/>
              <rect x="6" y="4" width="172" height="216" rx="5" fill="none" stroke="rgba(33,28,21,.10)" stroke-width="2"/>
            </g>
            <g filter="url(#signPaint)" fill="#1B1712" stroke="#1B1712">
              <text x="92" y="62" text-anchor="middle" font-family="Bricolage Grotesque, Segoe UI, sans-serif" font-weight="800" font-size="50" letter-spacing="2" stroke="none">AM</text>
              ${amArt}
            </g>
          </svg>
        </button>
        <button type="button" class="themesign__plaque themesign__plaque--pm" data-action="set-theme" data-theme="dark"
                role="radio" aria-checked="${dark}" aria-label="${esc(t("common.themeDark"))}" title="${esc(t("common.themeDarkTitle"))}">
          <svg viewBox="0 0 184 224" aria-hidden="true" focusable="false">
            <g filter="url(#signGrain)">
              <rect x="6" y="4" width="172" height="216" rx="5" fill="#1B1712"/>
              <rect x="6" y="4" width="172" height="216" rx="5" fill="none" stroke="rgba(236,226,202,.10)" stroke-width="2"/>
            </g>
            <g filter="url(#signPaint)">
              <text x="92" y="60" text-anchor="middle" font-family="Bricolage Grotesque, Segoe UI, sans-serif" font-weight="800" font-size="50" letter-spacing="2" fill="#ECE2CA">PM</text>
              ${pmArt}
            </g>
          </svg>
        </button>
      </span>
    </div>`;
  }

  // Erscheinungsbild-Block im Profil: das große AM/PM-Schild links, rechts ein
  // mitlaufender Begleittext. Ohne Reiseland zeigt es Kaffee/Wein mit neutralem
  // Begleittext; mit erkanntem Reiseland trägt das Schild dessen Tag-/Abend-
  // getränk (wie „Bebidas AM/PM"), leuchtet in der Landesfarbe und der Text wird
  // zum Landesgruß samt Getränk – Hell/Dunkel passt so sichtbar zum Reiseland.
  function themeSetting(vm) {
    const dark = vm.theme === "dark";
    const bev = vm.tripCountryBev || null;
    let title, text;
    if (bev) {
      title = dark ? (bev.greet[1] || "") : (bev.greet[0] || "");
      text = dark
        ? t("common.themePmDrink", { drink: bev.pm.name })
        : t("common.themeAmDrink", { drink: bev.am.name });
    } else {
      title = dark ? t("common.themePmTitle") : t("common.themeAmTitle");
      text = dark ? t("common.themePmText") : t("common.themeAmText");
    }
    // Akzent des Reiselands ans Schild geben: dann leuchtet das aktive AM/PM-
    // Schild in der Landesfarbe und der Block bekommt eine sanfte Tönung.
    const accent = bev ? ` style="--sign-accent:${esc(bev.accent)}"` : "";
    return `
      <div class="switchgroup">
        <span class="switchcap">${esc(t("common.themeCap"))}</span>
        <div class="themeset"${accent}>
          ${themeToggle(vm.theme, { large: true, bev: bev })}
          <div class="themeset__copy" aria-live="polite">
            <p class="themeset__title">${esc(title)}</p>
            <p class="themeset__text">${esc(text)}</p>
          </div>
        </div>
      </div>`;
  }

  // ---------- HOME (drei Reiter: Lernen · Entdecken · Profil) ----------
  // Die Startseite ist in drei Reiter geclustert, damit pro Blick nur ein Thema
  // sichtbar ist: Lernen (Heute-Karte + Themen), Entdecken (Spielmodi & Wissen),
  // Profil (Fortschritt, Pass, Eigenes). Unten eine feste Tab-Leiste; der aktive
  // Reiter kommt aus vm.tab und wird in den Einstellungen gemerkt.

  // Entdecken-Reiter: die großen Einstiege als volle Gradient-Buttons.
  // need: optionale Voraussetzung ("speech"|"frases"|"countries") – fehlt das
  // jeweilige Modul/Feature, wird der Eintrag ausgeblendet (graceful degradation).
  // sub = deutscher Fallback; subKey = i18n-Schlüssel (zur Laufzeit via t() übersetzt).
  // group = thematischer Abschnitt (siehe FEATURE_GROUPS); gegliedert nach
  // Aktivität (Spielen · Üben · Nachschlagen) – deckt sich mit dem Intro-Text
  // und gibt der inzwischen langen Liste eine klare, einheitliche Achse.
  // tracks = Lern-Tracks, in denen der Eintrag erscheint (siehe config.js SC.track).
  // Fehlt das Feld, gilt ["de-es"] (Reise-Track): die meisten Einträge sind
  // spanisch-spezifische Reise-Inhalte. Track-fähige Module (Lernseite über
  // SC.track/learnLang) deklarieren beide Tracks; reine Locals-Einträge nur "es-en".
  // scope = optionaler data-scope des Buttons (z. B. open-pretrip mit festem Kurs).
  const FEATURES = [
    { action: "open-favorites", tracks: ["de-es", "es-en"],   icon: "lc:star", title: "Mi léxico",     subKey: "discover.subFavorites", sub: "Deine Favoriten als persönliches Lexikon – Lieblingswörter & -sätze griffbereit", grad: ["#B97C24", "#E9A23B"], group: "reference" },
    { action: "open-spickzettel", tracks: ["de-es", "es-en"], icon: "lc:life-buoy", title: "Supervivencia",  subKey: "discover.subSupervivencia", sub: "Die wichtigsten Sätze sofort griffbereit", grad: ["#B5302A", "#CE463E"], group: "reference" },
    { action: "open-hostel",      icon: "lc:bed", title: "Modo hostal",    subKey: "discover.subHostel", sub: "Zu zweit & laut: Battle und Rollenspiele",   grad: ["#C25A45", "#8E4FA8"], group: "play" },
    { action: "open-quiz-setup", tracks: ["de-es", "es-en"],  icon: "lc:puzzle", title: "Definiciones",  subKey: "discover.subDefiniciones", sub: "Definition lesen, Begriff wählen",       grad: ["#3F7355", "#2F6B70"], group: "play" },
    { action: "open-yesto", tracks: ["de-es", "es-en"],       icon: "lc:eye", title: "¿Y esto?",      subKey: "discover.subYesto", sub: "Bild raten: 3-2-1, dann das spanische Wort", grad: ["#C2502E", "#E9A23B"], need: "yesto", group: "play" },
    { action: "open-banderas", tracks: ["de-es", "es-en"],    icon: "lc:flag", title: "Banderas",      subKey: "discover.subBanderas", sub: "Flaggen-Quiz: Land raten, Farben & Symbole lernen", grad: ["#C0392B", "#2E6E86"], need: "banderas", group: "play" },
    { action: "open-endless", tracks: ["de-es", "es-en"],     icon: "lc:infinity", title: "Vocabulario sin fin", subKey: "discover.subEndless", sub: "Karteikarten am Stück – alle Themen gemischt, ohne Rundenende", grad: ["#2E6E86", "#7048E8"], group: "practice" },
    { action: "open-frases", tracks: ["de-es", "es-en"],      icon: "lc:blocks", title: "Frases flexibles", subKey: "discover.subFrases", sub: "Bausteine einsetzen – selbst Sätze bauen", grad: ["#7048E8", "#5A3FB8"], need: "frases", group: "practice" },
    { action: "open-dialogos", tracks: ["de-es", "es-en"],    icon: "lc:message-circle", title: "Diálogos",        subKey: "discover.subDialogos", sub: "Allein ein Gespräch Zug für Zug führen", grad: ["#9B5A8C", "#5A4FA8"], need: "dialogos", group: "play" },
    { action: "open-venue-roleplay", tracks: ["es-en"], icon: "lc:handshake", title: "Roleplay del local", subKey: "discover.subVenueRoleplay", sub: "Zu zweit am Handy: Gast und Personal spielen abwechselnd", grad: ["#2F6B70", "#5A4FA8"], group: "play" },
    { action: "open-regatear",    icon: "lc:handshake", title: "Regatear",        subKey: "discover.subRegatear", sub: "Gut verhandeln & feilschen auf dem Markt", grad: ["#B97C24", "#3F7355"], need: "regatear", group: "play" },
    { action: "open-precios",     tracks: ["de-es", "es-en"], icon: "lc:banknote", title: "Precios al oído", subKey: "discover.subPrecios", sub: "Preise hören & eintippen – bis zu Millionenbeträgen", grad: ["#5E7D3A", "#76954E"], need: "speech", group: "play" },
    { action: "open-cuerpo",      tracks: ["de-es", "es-en"], icon: "lc:person-standing", title: "El Cuerpo",     subKey: "discover.subCuerpo", sub: "Körperteile antippen: Wort & Reisetipp", grad: ["#2E6E86", "#7D4A8E"], group: "practice" },
    { action: "open-compras",     tracks: ["de-es", "es-en"], icon: "lc:shopping-cart", title: "Lista de compras", subKey: "discover.subCompras", sub: "Supermarkt, Kleidung, Farmacia – Reisebedarf üben", grad: ["#3F7355", "#B97C24"], group: "practice" },
    { action: "open-conjugacion", icon: "lc:repeat", title: "Conjugación",   subKey: "discover.subConjugacion", sub: "Verben beugen – kurz erklärt, dann üben", grad: ["#4C5FA8", "#2B7A78"], group: "practice" },
    { action: "open-tiempos",     icon: "lc:hourglass", title: "Tiempos",       subKey: "discover.subTiempos", sub: "Zeitformen: gestern, jetzt, morgen – kurz erklärt, dann üben", grad: ["#3E7CA8", "#5A9BC4"], group: "practice" },
    { action: "open-info",        icon: "lc:globe", title: "Países y culturas", subKey: "discover.subInfo", sub: "Land & Leute – von México bis Chile",    grad: ["#B97C24", "#C2502E"], need: "countries", group: "reference" },
    { action: "open-historia",    icon: "lc:scroll", title: "Historia de Sudamérica", subKey: "discover.subHistoria", sub: "Von den Inka über Bolívar bis heute", grad: ["#8E5A2E", "#5A3A24"], need: "historia", group: "reference" },
    { action: "open-historia-centro", icon: "lc:mountain", title: "Historia de Centroamérica", subKey: "discover.subHistoriaCentro", sub: "Von den Maya über Morazán bis heute", grad: ["#2E6E5A", "#1F4A3A"], need: "historiaCentro", group: "reference" },
    { action: "open-knigge",      icon: "lc:compass", title: "Etiqueta de viaje", subKey: "discover.subKnigge", sub: "Verhalten unterwegs: Hostel, Bus, Gruppen", grad: ["#3F6B8E", "#6B4FA8"], need: "knigge", group: "reference" },
    { action: "open-logistica",   icon: "lc:luggage", title: "Logística de viaje", subKey: "discover.subLogistica", sub: "SIM, Geld & Gepäck – clever & sicher ankommen", grad: ["#2F6B70", "#B97C24"], need: "logistica", group: "reference" },
    { action: "open-salud",       icon: "lc:salad", title: "Salud y energía",   subKey: "discover.subSalud", sub: "Gesund & fit bleiben: Essen, Trinken, Bewegung", grad: ["#2F8E5B", "#76954E"], need: "salud", group: "reference" },
    { action: "open-jerga",       icon: "lc:megaphone", title: "Jerga colombiana",  subKey: "discover.subJerga", sub: "Slang verstehen & mitreden: parce, chévere, una luca", grad: ["#C25A45", "#B97C24"], need: "jerga", group: "reference" },
    { action: "open-derechos",    icon: "lc:scale", title: "Conoce tus derechos", subKey: "discover.subDerechos", sub: "Ruhig & sicher bleiben: Kontrolle, Anwalt, Botschaft", grad: ["#3F5BA8", "#5A4FA8"], need: "derechos", group: "reference" },
    { action: "open-responsable", icon: "lc:sprout", title: "Viaja responsable",  subKey: "discover.subResponsable", sub: "Leichter Fußabdruck: kein Müll, lokal kaufen, kein Plastik", grad: ["#3F7355", "#5E7D3A"], need: "responsable", group: "reference" },
    { action: "open-fotos",       icon: "lc:camera", title: "Fotos y videos",    subKey: "discover.subFotos", sub: "Tolle Reisebilder: Motiv, Licht, Posen & Teilen", grad: ["#C25A45", "#5A4FA8"], need: "fotos", group: "reference" },
    { action: "open-flirt",       icon: "lc:heart", title: "Coqueteo y romance", subKey: "discover.subFlirt", sub: "Flirten & daten mit Respekt: ansprechen, Komplimente, Date, Sicherheit", grad: ["#D24A77", "#B05AA8"], need: "flirt", group: "reference" },
    { action: "open-bailar",      icon: "lc:footprints", title: "Bailar",            subKey: "discover.subBailar", sub: "Tanzen in LatAm: Schritt-Diagramme, Rhythmus & Videos", grad: ["#C0392B", "#5A3FB8"], need: "bailar", group: "reference" },
    { action: "open-musica",      icon: "lc:music", title: "Música",            subKey: "discover.subMusica", sub: "Der Soundtrack LatAms – mit Spotify & Apple Music", grad: ["#7A3FA8", "#C2502E"], need: "musica", group: "reference" },
    { action: "open-cafe",        icon: "lc:coffee", title: "Café de la región",  subKey: "discover.subCafe", sub: "Kaffeeanbau & -kultur: vom Strauch zur Tasse, Finca-Besuch & bestellen", grad: ["#6F4A2E", "#B97C24"], need: "cafe", group: "reference" },
    { action: "open-juegos",      icon: "lc:dices", title: "Juegos de viaje",   subKey: "discover.subJuegos", sub: "Hostel-Klassiker: Karten, Würfel & Gruppenspiele – plus die Sätze dazu", grad: ["#C44536", "#2E7D9A"], need: "juegos", group: "reference" },
    { action: "open-pretrip",     icon: "lc:calendar", title: "Pre-Trip-Plan",  subKey: "discover.subPretrip", sub: "In 7 Etappen reisefertig – Kolumbien, Peru, Mexiko, Costa Rica …", grad: ["#2E6E86", "#B97C24"], group: "practice" },
    // Reise-Track: der wochenstrukturierte Spanisch-Kurs (Lernpfad-Mechanik wie der
    // Englisch-Kurs, siehe scripts/gen-curso-espanol.mjs) – öffnet per scope direkt
    // den Kursplan statt des zuletzt gewählten Reiseziels.
    { action: "open-pretrip",     scope: "ruta-espanol", icon: "lc:route", title: "Ruta del español", subKey: "discover.subCursoEs", sub: "Der Spanisch-Kurs: 4 Wochen, Woche für Woche", grad: ["#1F7A8C", "#3F7355"], group: "practice" },
    // Locals-Track: derselbe Plan-Screen als mehrwöchiger Kurs (nur hier sichtbar).
    { action: "open-pretrip",     tracks: ["es-en"], icon: "lc:calendar", titleKey: "discover.cursoTitle", subKey: "discover.cursoSub", grad: ["#1F7A8C", "#3F7355"], group: "practice" },
    { action: "open-placement",   icon: "lc:target", title: "HolaRuta-Check",    subKey: "discover.subPlacement", sub: "Kurzer Einstufungstest: finde dein Startlevel", grad: ["#2E6E86", "#C2502E"], need: "placement", group: "practice" },
    { action: "open-assessment",  icon: "lc:clipboard-list", title: "Nivel-Test",        subKey: "discover.subAssessment", sub: "Ausführlicher Test (A0–C1): dein genaues Niveau", grad: ["#3F5BA8", "#2E6E86"], need: "assessment", group: "practice" },
  ];

  // Reihenfolge & Beschriftung der Entdecken-Abschnitte – eine Achse (Aktivität),
  // Reihenfolge wie im Intro „Spielen, zuordnen, nachschlagen". titleKey via t().
  const FEATURE_GROUPS = [
    { id: "play",      titleKey: "discover.groupPlay" },
    { id: "practice",  titleKey: "discover.groupPractice" },
    { id: "reference", titleKey: "discover.groupReference" },
  ];

  // Reihenfolge & Beschriftung der Themen-Abschnitte im Lernen-Reiter. Wie bei
  // Entdecken sortiert ein fester thematischer Rahmen die inzwischen 23 Themen;
  // innerhalb einer Gruppe bleibt die Fälligkeits-Sortierung aus homeVM erhalten.
  const CATEGORY_GROUPS = [
    // Locals-Track: Englisch nach Lebensbereich (leer/ausgeblendet im Reise-Track).
    { id: "loc-hosp", titleKey: "home.catGroupLocHosp" },
    { id: "loc-dia",  titleKey: "home.catGroupLocDia" },
    { id: "loc-trab", titleKey: "home.catGroupLocTrab" },
    { id: "loc-esc",  titleKey: "home.catGroupLocEsc" },
    { id: "loc-voc",  titleKey: "home.catGroupLocVoc" },
    { id: "loc-b2",   titleKey: "home.catGroupLocB2" },
    { id: "basics",  titleKey: "home.catGroupBasics" },
    { id: "grammar", titleKey: "home.catGroupGrammar" },
    { id: "people",  titleKey: "home.catGroupPeople" },
    { id: "food",    titleKey: "home.catGroupFood" },
    { id: "travel",  titleKey: "home.catGroupTravel" },
    { id: "destinos", titleKey: "home.catGroupDestinos" },
  ];

  // Lucide-Icon je Lern-Kategorie (Themen-Kacheln im Lernen-Reiter). Schlüssel ist
  // die stabile Kategorie-Id (nicht das Emoji), Wert ein "lc:"-Token aus icons.js.
  // catIcon() fällt auf das Inhalts-Emoji aus data.js zurück, sodass die
  // Reiseziel-Flaggen (destinos) unverändert als Flaggen-Emoji bleiben und auch
  // <option>-Dropdowns (kein SVG möglich) weiter das Emoji nutzen.
  const CAT_ICON = (window.SC && window.SC.catIcon) || {};
  const catIcon = (c) => (c && CAT_ICON[c.id]) || (c && c.icon) || "";

  // Sprachcode der GELERNTEN Antwort (Reise: es, Locals: en) – für lang-Attribute auf
  // geteilten Sekundär-Screens (Statistik, Karten-Detail, Mi léxico), deren „es"-Slot
  // die gelernte Antwort trägt. Die reise-spezifischen Feature-Screens (Arbeitsblätter,
  // Placement, Hostel-Battle, Conjugador …) bleiben fest lang="es": dort ist es korrekt
  // und sie sind im Locals-Track ohnehin ausgeblendet.
  const learnLangCode = () => (window.SC && window.SC.track && window.SC.track.learnLang && window.SC.track.learnLang()) || "es";

  // Bewusst kein role="tablist": ohne Pfeiltasten-Navigation und tabpanel wäre
  // das ARIA-Tab-Muster unvollständig. Eine schlichte <nav> mit aria-current
  // ist ehrlicher und für Screenreader genauso klar (Seiten-Navigation).
  function tabbar(tab) {
    const tb = (id, icon, label) =>
      `<button class="tab ${tab === id ? "is-active" : ""}"${tab === id ? ' aria-current="page"' : ""}
               data-action="set-tab" data-tab="${id}">
         <span class="tab__icon" aria-hidden="true">${renderIcon(icon)}</span><span class="tab__label">${label}</span>
       </button>`;
    // Ein einziger „Tarea“-Reiter, wenn eine Edition Aufgaben ODER Modo profe nutzt.
    // Der Modo-profe-Bereich hängt im Tarea-Screen mit drin (kein eigener Reiter).
    const cfg = window.SC.config || {};
    const showTask = !!(cfg.taskTab || cfg.teacherTab);
    return `
      <nav class="tabbar" aria-label="${esc(t("home.tabsAreas"))}">
        ${tb("start", "lc:house", t("home.tabStart"))}${tb("lernen", "lc:backpack", t("home.tabLearn"))}${tb("entdecken", "lc:compass", t("home.tabDiscover"))}${showTask ? tb("tarea", "lc:clipboard-list", t("home.tabTask")) : ""}${tb("profil", "lc:user", t("home.tabProfile"))}
      </nav>`;
  }

  // Schlanke Kopfzeile pro Reiter: nur der Titel (der Markenname steht schon in
  // der App-Bar). Der Hell/Dunkel-Umschalter lebt als großes AM/PM-Schild im
  // Profil-Reiter unter „Einstellungen“ – nicht mehr in jeder Kopfzeile.
  function pagehead(title) {
    return `
      <div class="pagehead">
        <h2 class="pagehead__title">${title}</h2>
      </div>`;
  }

  // Lern-Voreinstellungen (Modus · Richtung · Sprechtempo). Set-once-Vorgaben,
  // deshalb gebündelt im Profil-Reiter. Die Stufen-Auswahl bleibt dagegen aufs
  // Dashboard (siehe lernenBody) – die ändert man laufend beim Lernen.
  // Jede Gruppe trägt ihre eigene Beschriftung.
  function learnPrefs(vm) {
    const mode = vm.mode;
    // Hör-Modus (Dictado) nur anbieten, wenn der Browser Sprachausgabe kann –
    // sonst gäbe es nichts zu hören (graceful degradation).
    const listenSeg = speechReady()
      ? `<button class="seg ${mode === "listen" ? "is-active" : ""}" data-action="set-mode" data-mode="listen">${renderIcon("lc:ear")} ${esc(t("home.modeListen"))}</button>`
      : "";
    // Kurz-Info zu den Modi: erklärt direkt unter der Auswahl, was jeder Modus macht
    // und welche Lern-Aufgabe er hat. Der aktive Modus wird hervorgehoben. Hören nur,
    // wenn der Browser vorlesen kann (sonst gibt es den Modus gar nicht).
    const modeRows = [
      { id: "flip", icon: "lc:layers", label: t("home.modeFlip"), desc: t("home.modeFlipDesc") },
      { id: "type", icon: "lc:square-pen", label: t("home.modeType"), desc: t("home.modeTypeDesc") },
    ];
    if (speechReady()) modeRows.push({ id: "listen", icon: "lc:ear", label: t("home.modeListen"), desc: t("home.modeListenDesc") });
    const modeInfo = `
      <div class="modeinfo">
        <span class="switchcap">${esc(t("home.modeInfoCap"))}</span>
        <ul class="modeinfo__list">
          ${modeRows.map((r) => `
            <li class="modeinfo__item${mode === r.id ? " is-active" : ""}">
              <span class="modeinfo__label">${renderIcon(r.icon)} ${esc(r.label)}</span>
              <span class="modeinfo__desc">${esc(r.desc)}</span>
            </li>`).join("")}
        </ul>
      </div>`;
    // Sprechtempo: nur sinnvoll, wenn der Browser überhaupt vorlesen kann.
    // 0.75 langsam (zum Nachsprechen) · 0.95 normal · 1.2 schnell (Reise-Realität).
    const rate = vm.speechRate || 0.95;
    const speedGroup = speechReady()
      ? `<div class="switchgroup">
          <span class="switchcap">${esc(t("home.speechRate"))}</span>
          <div class="segmented segmented--three" role="tablist" aria-label="${esc(t("home.speechRateAria"))}">
            <button class="seg ${rate === 0.75 ? "is-active" : ""}" data-action="set-speech-rate" data-rate="0.75" aria-pressed="${rate === 0.75}">${esc(t("home.rateSlow"))}</button>
            <button class="seg ${rate === 0.95 ? "is-active" : ""}" data-action="set-speech-rate" data-rate="0.95" aria-pressed="${rate === 0.95}">${esc(t("home.rateNormal"))}</button>
            <button class="seg ${rate === 1.2 ? "is-active" : ""}" data-action="set-speech-rate" data-rate="1.2" aria-pressed="${rate === 1.2}">${esc(t("home.rateFast"))}</button>
          </div>
        </div>`
      : "";
    return `
      <div class="switchgroup">
        <span class="switchcap">${esc(t("home.modeLabel"))}</span>
        <div class="segmented${listenSeg ? " segmented--three" : ""}" role="tablist" aria-label="${esc(t("home.modeAria"))}">
          <button class="seg ${mode === "flip" ? "is-active" : ""}" data-action="set-mode" data-mode="flip">${renderIcon("lc:layers")} ${esc(t("home.modeFlip"))}</button>
          <button class="seg ${mode === "type" ? "is-active" : ""}" data-action="set-mode" data-mode="type">${renderIcon("lc:square-pen")} ${esc(t("home.modeType"))}</button>
          ${listenSeg}
        </div>
        ${modeInfo}
      </div>
      <div class="switchgroup">
        <span class="switchcap">${esc(t("home.dirLabel"))}</span>
        <div class="segmented" role="tablist" aria-label="${esc(t("home.dirAria"))}">
          <button class="seg ${vm.dir === "de2es" ? "is-active" : ""}" data-action="set-dir" data-dir="de2es" aria-pressed="${vm.dir === "de2es"}">${vm.nativeFlag} → ${vm.learnFlag} ${esc(vm.nativeLabel)}</button>
          <button class="seg ${vm.dir === "es2de" ? "is-active" : ""}" data-action="set-dir" data-dir="es2de" aria-pressed="${vm.dir === "es2de"}">${vm.learnFlag} → ${vm.nativeFlag} ${esc(vm.learnLabel)}</button>
        </div>
      </div>
      ${speedGroup}`;
  }

  // Reise-Prognose-Block (Schicht 1+2): macht aus Datum + Karten/Tag eine echte
  // Aussage – „voraussichtlich X % gemeistert" + Pace-Ampel + ggf. Empfehlung +
  // Startklar-Meilensteine (25/50/75/100). Nur Spans (die Karte ist ein <button>,
  // also dürfen hier KEINE verschachtelten Buttons stehen). Leer, wenn keine
  // Prognose vorliegt (Abreise heute/vergangen, Datum kaputt, perDay/total = 0).
  const TRIP_MILESTONES = [25, 50, 75, 100];
  function tripForecastBlock(trip) {
    const f = trip.forecast;
    if (!f) return "";
    const verdictClass = {
      onTrack: "is-ontrack", slightlyBehind: "is-slightly",
      behind: "is-behind", noHistory: "is-neutral", done: "is-ontrack",
    }[f.pace.verdict] || "is-neutral";
    const paceText = {
      onTrack: "home.tripPaceOnTrack", slightlyBehind: "home.tripPaceSlightly",
      behind: "home.tripPaceBehind", noHistory: "home.tripPaceNoHistory", done: "home.tripPaceOnTrack",
    }[f.pace.verdict] || "home.tripPaceNoHistory";
    // Prognose-Hauptzeile: fertig -> Glückwunsch, sonst „rund X % gemeistert".
    const mainLine = f.done
      ? esc(t("home.tripForecastDone"))
      : t("home.tripForecast", { pct: f.projectedPct, now: f.nowPct }); // enthält <b> -> nicht escapen
    // Empfehlung nur bei echtem Rückstand und wenn sie das aktuelle Ziel übersteigt.
    const showRec = f.pace.verdict === "behind" && f.pace.recommendedPerDay > 0
      && f.pace.recommendedPerDay > trip.perDay;
    // Startklar-Meilensteine: erreicht (nowPct), in Reichweite (projectedPct) oder offen.
    const dots = TRIP_MILESTONES.map((m) => {
      const cls = f.nowPct >= m ? "is-reached" : (f.projectedPct >= m ? "is-projected" : "");
      return `<span class="trip__ms-dot ${cls}" aria-hidden="true"></span><span class="trip__ms-label">${m}%</span>`;
    }).join("");
    return `
      <span class="trip__forecast">
        <span class="trip__fc-cap">${esc(t("home.tripForecastCap"))}</span>
        <span class="trip__fc-main">${mainLine}</span>
        <span class="trip__pace ${verdictClass}">${esc(t(paceText))}${showRec ? ` · ${esc(t("home.tripPaceRecommend", { rec: f.pace.recommendedPerDay }))}` : ""}</span>
        <span class="trip__ms" role="group" aria-label="${esc(t("home.tripMilestoneCap"))}">${dots}</span>
      </span>`;
  }

  // Trip-Ziel: read-only Countdown-Karte (bis zum Reisedatum + Tages-Fortschritt).
  // action steuert den Tap (Dashboard -> "manage-trip" ins Profil, Profil -> "trip-edit").
  function tripDisplayCard(trip, action) {
    const dest = trip.destination ? esc(trip.destination) : esc(t("home.tripYourTrip"));
    const route = Array.isArray(trip.route) ? trip.route : [];
    // Kopfzeile: bei mehreren Reiseländern eine kompakte, nicht interaktive Zeitleiste
    // (Flagge + Name, mit Pfeilen verbunden) statt der einzelnen Ziel-Zeile.
    const head = route.length
      ? `<span class="trip__route" aria-label="${esc(t("home.tripRouteCap"))}">${route.map((s, i) =>
          `${i ? `<span class="trip__arrow" aria-hidden="true">→</span>` : ""}<span class="trip__stop">${s.flag ? `<span class="trip__stop-flag">${esc(s.flag)}</span>` : ""}<span class="trip__stop-name">${esc(s.dest)}</span></span>`
        ).join("")}</span>`
      : `<span class="trip__dest">${renderIcon("lc:map-pin")} ${dest}</span>`;
    // Persönliche Ansprache nur bei der Abreise-/Heute-Meldung (Countdown bleibt sachlich).
    const who = trip.userName ? esc(trip.userName) + ", " : "";
    // Oben steht klar die Reise (Countdown bzw. Abreise-Meldung). Das tägliche
    // Karten-Pensum ist bewusst als eigene, beschriftete Zeile darunter abgesetzt –
    // sonst wirkt der Tagesbalken wie ein „Fortschritt bis zur Reise".
    const countdown = trip.past ? who + t("home.tripTime") + " " + renderIcon("lc:backpack")
      : trip.today ? who + t("home.tripToday") + " " + renderIcon("lc:backpack")
      : t("home.tripCountdown", { n: trip.daysLeft, dest });
    return `
      <button class="trip" data-action="${action}" aria-label="${esc(t("home.tripEditLabel"))}">
        ${head}
        <span class="trip__countdown">${countdown}</span>
        ${trip.stayDays ? `<span class="trip__stay">${renderIcon("lc:luggage")} ${esc(t("home.tripStay", { n: trip.stayDays, approx: trip.stayApprox }))}</span>` : ""}
        <span class="trip__daily">
          <span class="trip__daily-head">
            <span class="trip__daily-cap">${esc(t("home.tripDailyCap"))}</span>
            <span class="trip__count ${trip.todayOver ? "is-over" : trip.todayDone ? "is-done" : ""}">${trip.todayOver ? renderIcon("lc:flame") + " " : ""}${esc(t("home.tripDailyCount", { done: trip.todayCount, perDay: trip.perDay, complete: trip.todayDone, over: trip.todayExtra }))}${trip.todayDone && !trip.todayOver ? " " + renderIcon("lc:check-circle") : ""}</span>
          </span>
          <span class="trip__bar"><span class="trip__bar-fill ${trip.todayOver ? "is-over" : trip.todayDone ? "is-done" : ""}" style="width:${trip.todayPct}%"></span></span>
        </span>
        ${tripForecastBlock(trip)}
      </button>`;
  }

  // Tagesziel-Knopf (Schicht 3): startet eine Lernrunde mit genau dem heute noch
  // offenen Pensum (remainingToday) – steht als eigener Button NEBEN der Karte
  // (die Karte ist selbst ein <button>). Bei erfülltem Tagesziel als „erledigt".
  // Bleibt AUCH während der Reise sichtbar (man lernt unterwegs weiter); nur die
  // Reise-Prognose oben blendet ab der Abreise aus (forecast === null).
  function tripDailyCta(trip) {
    if (!trip) return "";
    const done = trip.remainingToday <= 0;
    const label = done
      ? esc(t("home.tripRemainingDone"))
      : esc(t("home.tripRemainingToday", { n: trip.remainingToday }));
    return `
      <button class="trip-daily ${done ? "is-done" : ""}"${done ? " disabled aria-disabled=\"true\"" : ` data-action="study-trip-daily"`}>
        ${done ? renderIcon("lc:check-circle") : renderIcon("lc:play")}
        <span class="trip-daily__label">${label}</span>
        ${done ? "" : `<span class="trip-daily__go">${esc(t("home.tripStartDaily"))}</span>`}
      </button>`;
  }

  // Schnellwechsel Reiseland: ein Tap hängt das Land an die Reise-Zeitleiste an
  // (Datum & Tagesziel bleiben) und schaltet damit auch die länderspezifischen
  // Pre-Arrival-Kacheln auf der Startseite um. Länder, die schon in der Route sind,
  // leuchten. Nur im Profil unter dem Trip-Ziel sichtbar (siehe tripManage).
  const TRIP_COUNTRIES = [
    { id: "colombia",  flag: "🇨🇴", dest: "Kolumbien" },
    { id: "peru",      flag: "🇵🇪", dest: "Peru" },
    { id: "mexico",    flag: "🇲🇽", dest: "Mexiko" },
    { id: "costarica", flag: "🇨🇷", dest: "Costa Rica" },
    { id: "ecuador",   flag: "🇪🇨", dest: "Ecuador" },
    { id: "guatemala", flag: "🇬🇹", dest: "Guatemala" },
    { id: "elsalvador", flag: "🇸🇻", dest: "El Salvador" },
    { id: "argentina", flag: "🇦🇷", dest: "Argentinien" },
    { id: "chile",     flag: "🇨🇱", dest: "Chile" },
    { id: "bolivia",   flag: "🇧🇴", dest: "Bolivien" },
  ];
  // Einklappbar (kompakter im Profil): die Länder-Chips stecken in einem aufklappbaren
  // Abschnitt und sind standardmäßig zugeklappt, damit das Profil nicht ausufert.
  function tripCountrySwitch(vm) {
    const inRoute = Array.isArray(vm.tripRouteIds) ? vm.tripRouteIds : [];
    const open = !!vm.tripSwitchOpen; // Standard: eingeklappt
    const chips = TRIP_COUNTRIES.map((c) => {
      const active = inRoute.indexOf(c.id) !== -1;
      return `<button type="button" class="tripchip ${active ? "is-active" : ""}" data-action="add-trip-stop"
                     data-country="${c.id}" data-dest="${esc(c.dest)}" data-flag="${esc(c.flag)}" aria-pressed="${active}">${c.flag} ${esc(c.dest)}</button>`;
    }).join("");
    return `
      <div class="tripswitch ${open ? "is-open" : "is-collapsed"}" role="group" aria-label="${esc(t("home.tripSwitchCap"))}">
        <button type="button" class="tripswitch__toggle" data-action="toggle-trip-switch" aria-expanded="${open}">
          <span class="tripswitch__cap">${esc(t("home.tripSwitchCap"))}</span>
          <span class="tripswitch__chev" aria-hidden="true">${open ? "▾" : "▸"}</span>
        </button>
        ${open ? `<div class="tripswitch__chips">${chips}</div>
        <p class="tripswitch__hint">${esc(t("home.tripSwitchHint"))}</p>` : ""}
      </div>`;
  }

  // Editierbare Reise-Zeitleiste (nur im Profil): die Stopps in Reihenfolge, jeder mit
  // einem Greif-Griff (⠿) zum Umsortieren per Drag & Drop und einem ×-Knopf zum
  // Entfernen. So entsteht z. B. El Salvador → Kolumbien → Peru. Der Abschnitt lässt
  // sich einklappen, damit das Profil kompakt bleibt (Route steht auch in der Karte oben).
  function tripTimeline(vm) {
    const route = vm.trip && Array.isArray(vm.trip.route) ? vm.trip.route : [];
    if (!route.length) return "";
    const open = vm.tripRouteOpen !== false; // Standard: aufgeklappt (Drag sichtbar)
    const canReorder = route.length > 1;     // Umsortieren erst ab zwei Stopps sinnvoll
    const items = route.map((s, i) => `
      <li class="triptl__item" data-index="${i}">
        ${canReorder ? `<span class="triptl__drag" data-action="drag-trip-stop" role="button" tabindex="-1" aria-label="${esc(t("home.tripStopDrag"))}" title="${esc(t("home.tripStopDrag"))}">⠿</span>` : ""}
        <span class="triptl__num">${i + 1}</span>
        ${s.flag ? `<span class="triptl__flag">${esc(s.flag)}</span>` : ""}
        <span class="triptl__name">${esc(s.dest)}</span>
        <button type="button" class="triptl__rm" data-action="remove-trip-stop" data-index="${i}" aria-label="${esc(t("home.tripStopRemove"))}">✕</button>
      </li>`).join("");
    return `
      <div class="triptl ${open ? "is-open" : "is-collapsed"}" role="group" aria-label="${esc(t("home.tripRouteCap"))}">
        <button type="button" class="triptl__toggle" data-action="toggle-trip-route" aria-expanded="${open}">
          <span class="triptl__cap">${esc(t("home.tripRouteCap"))}</span>
          <span class="triptl__badge">${route.length}</span>
          <span class="triptl__chev" aria-hidden="true">${open ? "▾" : "▸"}</span>
        </button>
        ${open ? `<ol class="triptl__list">${items}</ol>${canReorder ? `
        <p class="triptl__hint">${esc(t("home.tripRouteReorderHint"))}</p>` : ""}` : ""}
      </div>`;
  }

  // Trip-Ziel-Formular (anlegen/bearbeiten). Wird im Profil und beim Onboarding
  // genutzt. extraButtons = zusätzliche Knöpfe rechts neben „Ziel speichern".
  function tripForm(trip, extraButtons) {
    // Aufenthalt vorbelegen: ein konkretes Rückreisedatum (returnDate) füllt das
    // Datumsfeld; die grobe Tageszahl nur, wenn KEIN Datum gesetzt ist (stayApprox) –
    // sonst stünde dieselbe Dauer doppelt im Formular.
    const stayDaysVal = trip && trip.stayApprox && trip.stayDays ? trip.stayDays : "";
    const returnVal = trip && trip.returnDate ? esc(trip.returnDate) : "";
    // Bei gesetzter Route definieren die Stopps das Ziel – das freie Textfeld entfällt
    // dann (die Route wird über die Zeitleiste & Schnellwechsel-Chips verwaltet).
    const hasRoute = trip && Array.isArray(trip.route) && trip.route.length > 0;
    return `
      <form class="trip trip--edit" data-action="save-trip">
        ${hasRoute ? "" : `<label class="trip__field"><span>${esc(t("home.tripDest"))}</span>
          <input id="trip-dest" type="text" maxlength="80" autocomplete="off" placeholder="${esc(t("home.tripDestPlaceholder"))}" value="${trip ? esc(trip.destination) : ""}" /></label>`}
        <label class="trip__field"><span>${esc(t("home.tripDate"))}</span>
          <input id="trip-date" type="date" value="${trip ? esc(trip.endDate) : ""}" required /></label>
        <label class="trip__field"><span>${esc(t("home.tripReturn"))}</span>
          <input id="trip-return" type="date" value="${returnVal}" /></label>
        <label class="trip__field"><span>${esc(t("home.tripStayDays"))}</span>
          <input id="trip-staydays" type="number" inputmode="numeric" min="1" max="400" placeholder="${esc(t("home.tripStayDaysPlaceholder"))}" value="${stayDaysVal}" /></label>
        <p class="trip__hint">${esc(t("home.tripStayHint"))}</p>
        <label class="trip__field"><span>${esc(t("home.tripPerDay"))}</span>
          <input id="trip-perday" type="number" inputmode="numeric" min="1" max="500" value="${trip ? trip.perDay : 15}" required /></label>
        <div class="trip__actions">
          <button class="cta" type="submit">${esc(t("home.tripSave"))}</button>
          ${extraButtons || ""}
        </div>
      </form>`;
  }

  // Profil: vollständige Trip-Ziel-Verwaltung. Drei Zustände – Formular (tripEdit),
  // gesetztes Ziel (Karte, Tap öffnet das Formular) oder leerer Anstoßer.
  function tripManage(vm) {
    const trip = vm.trip;
    if (vm.tripEdit) {
      const extra =
        `${trip ? `<button class="ghostbtn" type="button" data-action="trip-clear">${esc(t("home.tripClear"))}</button>` : ""}` +
        `<button class="ghostbtn" type="button" data-action="trip-edit">${esc(t("common.cancel"))}</button>`;
      return tripForm(trip, extra);
    }
    if (trip) return tripDisplayCard(trip, "trip-edit") + tripDailyCta(trip) + tripTimeline(vm) + tripCountrySwitch(vm);
    return `<button class="trip trip--empty" data-action="trip-edit">${renderIcon("lc:target")} ${t("home.tripEmpty")}</button>`;
  }

  // Geschlechts-Auswahl (♀/♂) als segmentierte Buttons. Gemeinsam für Onboarding
  // und Profil. type="button", damit die Knöpfe innerhalb des Onboarding-<form>
  // dieses NICHT absenden (sonst springt „Weiter" beim Antippen vorzeitig).
  function genderGroup(vm) {
    const g = vm.userGender;
    return `
      <div class="switchgroup">
        <span class="switchcap">${esc(t("home.genderCap"))}</span>
        <div class="segmented" role="group" aria-label="${esc(t("home.genderAria"))}">
          <button class="seg ${g === "female" ? "is-active" : ""}" type="button" data-action="set-gender" data-gender="female" aria-pressed="${g === "female"}">${esc(t("home.genderFemale"))}</button>
          <button class="seg ${g === "male" ? "is-active" : ""}" type="button" data-action="set-gender" data-gender="male" aria-pressed="${g === "male"}">${esc(t("home.genderMale"))}</button>
        </div>
        <p class="namefield__hint">${esc(t("home.genderHint"))}</p>
      </div>`;
  }

  // Belohnungs-Sound an/aus (SC.celebrate spielt am Rundenende einen kurzen
  // WebAudio-Klang). Default aus – Sound überrascht; die Haptik läuft unabhängig.
  function celebrateSoundGroup(vm) {
    const on = !!vm.celebrateSound;
    return `
      <div class="switchgroup">
        <span class="switchcap">${esc(t("home.celebrateSoundCap"))}</span>
        <div class="segmented" role="group" aria-label="${esc(t("home.celebrateSoundAria"))}">
          <button class="seg ${on ? "is-active" : ""}" type="button" data-action="set-celebrate-sound" data-on="1" aria-pressed="${on}">${esc(t("home.celebrateSoundOn"))}</button>
          <button class="seg ${!on ? "is-active" : ""}" type="button" data-action="set-celebrate-sound" data-on="0" aria-pressed="${!on}">${esc(t("home.celebrateSoundOff"))}</button>
        </div>
        <p class="namefield__hint">${esc(t("home.celebrateSoundHint"))}</p>
      </div>`;
  }

  // Nutzungsstatistik teilen (opt-in, Default aus). Nur sichtbar, wenn eine Edition
  // einen Telemetrie-Endpunkt konfiguriert hat (vm.analyticsAvailable). Ohne
  // Zustimmung verlässt KEIN Datum das Gerät; mit Zustimmung werden ein anonymer
  // Tages-Snapshot UND pseudonyme Interaktions-Events gesendet (keine PII, keine
  // Karten-IDs, kein Suchtext). Bei „An" gibt es einen Knopf, die pseudonyme
  // Statistik-Id zurückzusetzen.
  function analyticsConsentGroup(vm) {
    if (!vm.analyticsAvailable) return "";
    const on = !!vm.analyticsConsent;
    return `
      <div class="switchgroup">
        <span class="switchcap">${esc(t("home.analyticsCap"))}</span>
        <div class="segmented" role="group" aria-label="${esc(t("home.analyticsAria"))}">
          <button class="seg ${on ? "is-active" : ""}" type="button" data-action="set-analytics-consent" data-on="1" aria-pressed="${on}">${esc(t("home.analyticsOn"))}</button>
          <button class="seg ${!on ? "is-active" : ""}" type="button" data-action="set-analytics-consent" data-on="0" aria-pressed="${!on}">${esc(t("home.analyticsOff"))}</button>
        </div>
        <p class="namefield__hint">${esc(t("home.analyticsHint"))}</p>
        ${on ? `<button class="ghostbtn" type="button" data-action="reset-analytics-id">${esc(t("home.analyticsResetId"))}</button>` : ""}
      </div>`;
  }

  // Erklär-Slides ganz am Anfang des Onboardings: ein kurzer Überblick, WIE die App
  // funktioniert und welchen UMFANG sie hat – bevor wir Name/Geschlecht und Reiseziel
  // erfragen. Rein datengetrieben: Icon + zwei i18n-Schlüssel je Slide. Die Reihenfolge
  // führt vom „Was ist HolaRuta" über „Wie wird gelernt" und „Auf die Reise zugeschnitten"
  // bis „Wie viel steckt drin". Die Anzahl wird exportiert, damit app.js den letzten
  // Slide kennt (dann „Los geht's" → Profil-Schritt).
  const ONBOARD_SLIDES = [
    { icon: "lc:flame", title: "home.onboardSlide1Title", body: "home.onboardSlide1Body" },
    { icon: "lc:layers", title: "home.onboardSlide2Title", body: "home.onboardSlide2Body" },
    { icon: "lc:compass", title: "home.onboardSlide3Title", body: "home.onboardSlide3Body" },
    { icon: "lc:map", title: "home.onboardSlide4Title", body: "home.onboardSlide4Body" },
  ];

  // Intro-Slides rendern (Schritt 'intro'). Ein Slide zur Zeit, mit Punkt-Navigation
  // (antippbar), „Weiter" bzw. auf dem letzten Slide „Los geht's", und „Überspringen"
  // (springt direkt zum Profil-Schritt). brand = optionales Partner-Branding oben.
  function renderOnboardSlides(vm, brand) {
    const n = ONBOARD_SLIDES.length;
    const i = Math.max(0, Math.min(vm.onboardSlide || 0, n - 1));
    const s = ONBOARD_SLIDES[i];
    const last = i === n - 1;
    const dots = ONBOARD_SLIDES.map((_, k) =>
      `<button class="onboarding__dot${k === i ? " onboarding__dot--on" : ""}" type="button"
               data-action="onboard-slide-go" data-idx="${k}"
               aria-label="${esc(t("home.onboardSlideAria", { n: k + 1, total: n }))}"${k === i ? ' aria-current="true"' : ""}></button>`
    ).join("");
    return `
      <section class="screen onboarding onboarding--intro">
        <div class="onboarding__inner">
          ${brand}
          <div class="onboarding__slide">
            <div class="onboarding__icon" aria-hidden="true">${renderIcon(s.icon)}</div>
            <h1 class="onboarding__title">${esc(t(s.title))}</h1>
            <p class="onboarding__intro">${esc(t(s.body))}</p>
          </div>
          <div class="onboarding__dots" role="group" aria-label="${esc(t("home.onboardSlideAria", { n: i + 1, total: n }))}">${dots}</div>
          <div class="trip__actions">
            <button class="cta" type="button" data-action="onboard-slide-next">${esc(last ? t("home.onboardSlideStart") : t("home.onboardNext"))}</button>
            ${last ? "" : `<button class="ghostbtn" type="button" data-action="onboard-slide-skip">${esc(t("home.onboardSlideSkip"))}</button>`}
          </div>
        </div>
      </section>`;
  }

  // Onboarding: einmaliger Willkommens-Bildschirm beim allerersten Start. Schritte –
  // zuerst Erklär-Slides (Überblick), dann Name + Geschlecht (Pflicht zum Fortfahren),
  // dann das Trip-Ziel (überspringbar), damit der Countdown direkt motiviert.
  function renderOnboarding(vm) {
    // Partner-Branding zuerst: in einer Edition (auch per Link ?edition=…) das Logo
    // + den Namen oben zeigen, sonst nur die HolaRuta-Begrüßung.
    const e = vm.edition;
    const logoOk = e && e.logo && /^(https:\/\/|data:image\/)/i.test(e.logo);
    const brand = e
      ? `<div class="onboarding__brand">
           ${logoOk ? `<img class="onboarding__logo" src="${esc(e.logo)}" alt="${esc((e.partner && e.partner.name) || e.name)}" />` : ""}
           ${e.partner && e.partner.name ? `<p class="onboarding__partner">${esc(e.partner.name)}</p>
           <p class="onboarding__powered">${esc(t("profile.poweredBy"))}</p>` : ""}
         </div>`
      : "";
    // Schritt 0: Erklär-Slides (Überblick: wie funktioniert die App, welcher Umfang).
    if ((vm.onboardStep || "intro") === "intro") {
      return renderOnboardSlides(vm, brand);
    }
    // Schritt 1: Name + Geschlecht. Eigenes <form>, damit Enter „Weiter" auslöst.
    if ((vm.onboardStep || "profile") === "profile") {
      // In Partner-Editionen den Markennamen NICHT beanspruchen – das Logo oben
      // zeigt die Marke bereits; ein neutrales „Willkommen!" passt White-Label.
      const welcomeTitle = e ? t("home.onboardWelcomeTitleEdition") : t("home.onboardWelcomeTitle");
      return `
        <section class="screen onboarding">
          <div class="onboarding__inner">
            ${brand}
            <h1 class="onboarding__title">${esc(welcomeTitle)}</h1>
            <p class="onboarding__intro">${esc(t("home.onboardWelcomeIntro"))}</p>
            <form class="trip trip--edit" data-action="onboard-profile-next">
              <label class="trip__field"><span>${renderIcon("lc:user")} ${esc(t("home.nameCap"))}</span>
                <input id="onboard-name" type="text" maxlength="40"
                       autocomplete="given-name" autocapitalize="words" autocorrect="off" spellcheck="false"
                       placeholder="${esc(t("home.namePlaceholder"))}" value="${esc(vm.userName)}" /></label>
              ${genderGroup(vm)}
              <div class="trip__actions">
                <button class="cta" type="submit">${esc(t("home.onboardNext"))}</button>
              </div>
            </form>
          </div>
        </section>`;
    }
    // Schritt 2: Reiseziel (überspringbar → führt trotzdem zum Ruta-Check).
    const skip = `<button class="ghostbtn" type="button" data-action="skip-onboarding">${esc(t("home.onboardSkip"))}</button>`;
    return `
      <section class="screen onboarding">
        <div class="onboarding__inner">
          ${brand}
          <h1 class="onboarding__title">${esc(t("home.onboardTitle"))}</h1>
          <p class="onboarding__intro">${esc(t("home.onboardIntro"))}</p>
          ${tripForm(vm.trip, skip)}
        </div>
      </section>`;
  }

  // Sucheinstieg: sieht aus wie ein Suchfeld, ist aber ein Knopf, der die
  // Such-Ansicht öffnet (ein echtes Eingabefeld im Dashboard würde bei jedem
  // Re-Render den Fokus verlieren – darum erst auf der eigenen Seite tippen).
  function searchBar() {
    return `
      <button class="searchbar" data-action="open-search" aria-label="${esc(t("search.open"))}">
        <span class="searchbar__icon" aria-hidden="true">${renderIcon("lc:search")}</span>
        <span class="searchbar__text">${esc(t("search.placeholder"))}</span>
      </button>`;
  }

  // Fortschritts-Karte (Streak + Status-Verteilung). Gemeinsam für „Start" und
  // „Profil", damit beide denselben, ehrlichen Überblick zeigen: ein gestapelter
  // Balken (gemeistert / am Lernen / neu) mit Legende statt nur der Meister-Quote,
  // die ganz am Anfang 0 % bleibt und mit leerem Balken wie ein Fehler wirkt.
  // Segmente mit Zähler 0 fallen weg (sonst zeigt min-width einen falschen Splitter).
  // Reise-Rang/XP als kleines Banner. Macht den in der Belohnungs-Inszenierung
  // (Done-Screen) vergebenen XP-Stand dauerhaft sichtbar – im Cockpit, im Profil
  // und in der Statistik. Ohne XP-Stand (frischer Start) bleibt es still, statt
  // einen leeren Balken zu zeigen.
  function xpBanner(xp) {
    if (!xp || (!xp.xp && xp.rankN === 0)) return "";
    const hint = xp.nextName
      ? t("profile.xpToNext", { n: xp.xpToNext, rank: xp.nextName })
      : t("profile.xpMaxRank");
    return `
      <div class="xpbanner">
        <div class="xpbanner__head">
          <span class="xpbanner__rank">${renderIcon("lc:compass")} ${esc(xp.rankName)}</span>
          <span class="xpbanner__xp">${esc(t("profile.xpPoints", { n: xp.xp }))}</span>
        </div>
        <div class="xpbanner__track" role="img" aria-label="${esc(hint)}">
          <div class="xpbanner__fill" style="width:${xp.pct}%"></div>
        </div>
        <p class="xpbanner__hint">${esc(hint)}</p>
      </div>`;
  }

  function progressCard(vm) {
    const ov = vm.overall;
    const streakLine = vm.streak > 0 ? t("profile.streakInRow", { n: vm.streak }) : t("profile.streakFirst");
    const seg = (n, color) => (ov.total && n > 0) ? `<span style="flex:${n};background:${color}"></span>` : "";
    return `
      <div class="profcard">
        ${xpBanner(vm.xp)}
        ${vm.xp && vm.xp.xp ? shareBlock(vm.shareFormat, "share-rank", t("profile.shareRank")) : ""}
        <p class="profcard__streak">${renderIcon(vm.streak > 0 ? "lc:flame" : "lc:sprout")} ${esc(streakLine)}</p>
        <div class="dist__bar" role="img" aria-label="${esc(t("profile.routeAria", { neu: ov.neu, learning: ov.learning, mastered: ov.mastered, pct: ov.pct }))}">
          ${seg(ov.mastered, "var(--ok)")}${seg(ov.learning, "var(--warn)")}${seg(ov.neu, "rgba(45,27,18,0.16)")}
        </div>
        <div class="dist__legend">
          <span><i style="background:var(--ok)"></i>${esc(t("profile.distMastered", { n: ov.mastered }))}</span>
          <span><i style="background:var(--warn)"></i>${esc(t("profile.distLearning", { n: ov.learning }))}</span>
          <span><i style="background:rgba(45,27,18,0.16)"></i>${esc(t("profile.distNew", { n: ov.neu }))}</span>
        </div>
        <p class="profcard__meta">${esc(t("profile.progressMeta", { mastered: ov.mastered, total: ov.total, pct: ov.pct }))}</p>
      </div>`;
  }

  // „Weiterlernen"-Karte auf dem Start-Reiter: der Lernpfad (Locals) bzw. ein
  // angefangener Pre-Trip-Plan (Reise) als prominenter Einstieg statt vergraben im
  // Entdecken-Reiter. Haupt-Tap startet DIREKT den nächsten offenen Teil
  // (pretrip-continue); der sekundäre Text-Button öffnet den ganzen Pfad. Mini-Ring
  // + Balken zeigen den Fortschritt auf einen Blick (gleiche conic-Technik wie Hero).
  function lpathHomeCard(lp) {
    // Track-Strings über denselben K(curso, pretrip)-Schalter wie renderPretrip.
    const loc = isLocalsTrk();
    const K = (curso, pretrip) => loc ? curso : pretrip;
    const nextLine = lp.allDone
      ? t(K("discover.cursoAllDone", "discover.pretripAllDone"))
      : t(lp.done ? "discover.lpathContinue" : "discover.lpathStart", { title: lp.nextTitle });
    const progressLine = t(K("discover.cursoProgress", "discover.pretripProgress"), { done: lp.done, total: lp.total });
    return `
      <section class="dashgrp">
        <p class="sectioncap">${esc(t(K("discover.cursoTitle", "discover.pretripTitle")))}</p>
        <div class="lpath-card" style="--pct:${lp.pct}">
          <button class="lpath-card__main" data-action="pretrip-continue" data-scope="${esc(lp.scope)}">
            <span class="lpath-card__ring" aria-hidden="true"><span class="lpath-card__pct">${lp.pct}%</span></span>
            <span class="lpath-card__text">
              <span class="lpath-card__title">${esc(lp.label)}</span>
              <span class="lpath-card__next">${esc(nextLine)}</span>
              <span class="lpath-card__bar" aria-hidden="true"><span style="width:${lp.pct}%"></span></span>
              <span class="lpath-card__meta">${esc(progressLine)}</span>
            </span>
            <span class="lpath-card__go" aria-hidden="true">${renderIcon(lp.allDone ? "lc:rotate-ccw" : "lc:play")}</span>
          </button>
          <button class="lpath-card__all" data-action="open-pretrip" data-scope="${esc(lp.scope)}">${esc(t("home.lpathView"))} ›</button>
        </div>
      </section>`;
  }

  // ----- START-Reiter (Cockpit): heutige Aktion + Reise + Fortschritt -----
  // Bewusst fokussiert und kurz: hier landet jeder App-Start. Die vielen Themen
  // (mit Sprungmarken) leben im eigenen „Lernen"-Reiter (siehe lernenBody).
  function startBody(vm) {
    // "Heute"-Karte: Streak-Chip, Haupt-CTA und Quick-Resume.
    const streakChip = vm.streak > 0
      ? `<span class="today__streak">${renderIcon("lc:flame")} ${esc(t("home.streakDays", { n: vm.streak }))}</span>`
      : `<span class="today__streak today__streak--new">${renderIcon("lc:sprout")} ${esc(t("home.streakNew"))}</span>`;
    const resume = vm.lastCat
      ? `<button class="today__resume" data-action="resume-last">
           ${renderIcon("lc:corner-down-right")} ${esc(t("home.resumeWith", { cat: vm.lastCat.label }))}
           <span class="today__resumecount">${esc(t("home.tileDue", { n: vm.lastCat.due }))}</span>
         </button>`
      : "";
    // Ruta del día: ein Tap für eine kurze, kategorienübergreifende Tagesrunde –
    // bevorzugt fällige Karten, sonst neue. Stärkt die Lern-Serie. Ist die heutige
    // Runde schon gelaufen, zeigt der Button das mit Häkchen + erledigt-Text an
    // (bleibt antippbar für eine optionale Extra-Runde).
    const rutaDia = vm.rutaDone
      ? `
      <button class="today__ruta today__ruta--done" data-action="ruta-del-dia">
        <span class="today__ruta-main">${renderIcon("lc:check-circle")} ${esc(t("home.rutaDoneTitle"))}</span>
        <span class="today__ruta-sub">${esc(t("home.rutaDoneSub"))}</span>
      </button>`
      : `
      <button class="today__ruta" data-action="ruta-del-dia">
        <span class="today__ruta-main">${renderIcon("lc:map")} ${esc(t("home.rutaTitle"))}</span>
        <span class="today__ruta-sub">${esc(t("home.rutaSub"))}</span>
      </button>`;

    // Kuratierte Pre-Arrival-Presets: ein Tap startet die wichtigsten Ankunfts-Sätze
    // fürs jeweilige Reiseziel (benannte Auswahl, nicht der freie Filter). Nutzt die
    // Ruta-del-día-Optik; erscheint nur bei passendem Trip-/Edition-Bezug. Ist das
    // Paket absolviert (alle Karten einmal gelernt), zeigt die Kachel das mit
    // Häkchen + „geschafft" an (bleibt antippbar zum Wiederholen).
    // Pre-Arrival-Kachel-Icons: Städte/Orte als Lucide-Token (deckungsgleich mit
    // SC.catIcon aus #201), die 9 Länder bewusst als Flaggen-Emoji (Identität).
    // renderIcon() rendert Token → SVG, Flaggen-Emoji → escaped durch.
    const PRESET_ICON = {
      "prearrival-co": "🇨🇴", "prearrival-pe": "🇵🇪", "prearrival-mx": "🇲🇽",
      "prearrival-cr": "🇨🇷", "prearrival-ec": "🇪🇨", "prearrival-gt": "🇬🇹",
      "prearrival-ar": "🇦🇷", "prearrival-cl": "🇨🇱", "prearrival-bo": "🇧🇴",
      "prearrival-ctg": "lc:palmtree", "prearrival-med": "lc:building-2",
      "prearrival-cus": "lc:mountain", "prearrival-cdmx": "lc:building-2",
      "prearrival-ant": "lc:mountain", "prearrival-bue": "lc:footprints",
      "prearrival-qui": "lc:mountain", "prearrival-lima": "lc:waves",
      "prearrival-arequipa": "lc:landmark", "prearrival-mendoza": "lc:wine",
      "prearrival-bariloche": "lc:trees", "prearrival-oaxaca": "lc:skull",
      "prearrival-merida": "lc:landmark", "prearrival-arenal": "lc:mountain",
      "prearrival-monteverde": "lc:leaf", "prearrival-santiago": "lc:building-2",
      "prearrival-valparaiso": "lc:palette", "prearrival-atacama": "lc:telescope",
      "prearrival-lapaz": "lc:cable-car", "prearrival-uyuni": "lc:gem",
      "prearrival-puertonatales": "lc:tent", "prearrival-pucon": "lc:mountain",
      "prearrival-copacabana": "lc:sailboat", "prearrival-sucre": "lc:footprints",
    };
    const PRESET_CARDS = [
      { id: "prearrival-co", show: vm.showColombiaPreset, titleKey: "home.presetCoTitle", subKey: "home.presetCoSub" },
      { id: "prearrival-ctg", show: vm.showCartagenaPreset, titleKey: "home.presetCtgTitle", subKey: "home.presetCtgSub" },
      { id: "prearrival-med", show: vm.showMedellinPreset, titleKey: "home.presetMedTitle", subKey: "home.presetMedSub" },
      { id: "prearrival-cus", show: vm.showCuscoPreset, titleKey: "home.presetCusTitle", subKey: "home.presetCusSub" },
      { id: "prearrival-cdmx", show: vm.showCdmxPreset, titleKey: "home.presetCdmxTitle", subKey: "home.presetCdmxSub" },
      { id: "prearrival-ant", show: vm.showAntiguaPreset, titleKey: "home.presetAntTitle", subKey: "home.presetAntSub" },
      { id: "prearrival-bue", show: vm.showBuenosAiresPreset, titleKey: "home.presetBueTitle", subKey: "home.presetBueSub" },
      { id: "prearrival-qui", show: vm.showQuitoPreset, titleKey: "home.presetQuiTitle", subKey: "home.presetQuiSub" },
      { id: "prearrival-lima", show: vm.showLimaPreset, titleKey: "home.presetLimaTitle", subKey: "home.presetLimaSub" },
      { id: "prearrival-arequipa", show: vm.showArequipaPreset, titleKey: "home.presetArequipaTitle", subKey: "home.presetArequipaSub" },
      { id: "prearrival-mendoza", show: vm.showMendozaPreset, titleKey: "home.presetMendozaTitle", subKey: "home.presetMendozaSub" },
      { id: "prearrival-bariloche", show: vm.showBarilochePreset, titleKey: "home.presetBarilocheTitle", subKey: "home.presetBarilocheSub" },
      { id: "prearrival-oaxaca", show: vm.showOaxacaPreset, titleKey: "home.presetOaxacaTitle", subKey: "home.presetOaxacaSub" },
      { id: "prearrival-merida", show: vm.showMeridaPreset, titleKey: "home.presetMeridaTitle", subKey: "home.presetMeridaSub" },
      { id: "prearrival-arenal", show: vm.showArenalPreset, titleKey: "home.presetArenalTitle", subKey: "home.presetArenalSub" },
      { id: "prearrival-monteverde", show: vm.showMonteverdePreset, titleKey: "home.presetMonteverdeTitle", subKey: "home.presetMonteverdeSub" },
      { id: "prearrival-santiago", show: vm.showSantiagoPreset, titleKey: "home.presetSantiagoTitle", subKey: "home.presetSantiagoSub" },
      { id: "prearrival-valparaiso", show: vm.showValparaisoPreset, titleKey: "home.presetValparaisoTitle", subKey: "home.presetValparaisoSub" },
      { id: "prearrival-atacama", show: vm.showAtacamaPreset, titleKey: "home.presetAtacamaTitle", subKey: "home.presetAtacamaSub" },
      { id: "prearrival-lapaz", show: vm.showLapazPreset, titleKey: "home.presetLapazTitle", subKey: "home.presetLapazSub" },
      { id: "prearrival-uyuni", show: vm.showUyuniPreset, titleKey: "home.presetUyuniTitle", subKey: "home.presetUyuniSub" },
      { id: "prearrival-puertonatales", show: vm.showPuertonatalesPreset, titleKey: "home.presetPuertonatalesTitle", subKey: "home.presetPuertonatalesSub" },
      { id: "prearrival-pucon", show: vm.showPuconPreset, titleKey: "home.presetPuconTitle", subKey: "home.presetPuconSub" },
      { id: "prearrival-copacabana", show: vm.showCopacabanaPreset, titleKey: "home.presetCopacabanaTitle", subKey: "home.presetCopacabanaSub" },
      { id: "prearrival-sucre", show: vm.showSucrePreset, titleKey: "home.presetSucreTitle", subKey: "home.presetSucreSub" },
      { id: "prearrival-pe", show: vm.showPeruPreset, titleKey: "home.presetPeTitle", subKey: "home.presetPeSub" },
      { id: "prearrival-mx", show: vm.showMexicoPreset, titleKey: "home.presetMxTitle", subKey: "home.presetMxSub" },
      { id: "prearrival-cr", show: vm.showCostaRicaPreset, titleKey: "home.presetCrTitle", subKey: "home.presetCrSub" },
      { id: "prearrival-ec", show: vm.showEcuadorPreset, titleKey: "home.presetEcTitle", subKey: "home.presetEcSub" },
      { id: "prearrival-gt", show: vm.showGuatemalaPreset, titleKey: "home.presetGtTitle", subKey: "home.presetGtSub" },
      { id: "prearrival-ar", show: vm.showArgentinaPreset, titleKey: "home.presetArTitle", subKey: "home.presetArSub" },
      { id: "prearrival-cl", show: vm.showChilePreset, titleKey: "home.presetClTitle", subKey: "home.presetClSub" },
      { id: "prearrival-bo", show: vm.showBoliviaPreset, titleKey: "home.presetBoTitle", subKey: "home.presetBoSub" },
    ];
    const presetCards = PRESET_CARDS.filter((p) => p.show).map((p) => {
      const st = (vm.presetStatus && vm.presetStatus[p.id]) || { done: false, seen: 0, total: 0 };
      const sub = st.done ? t("home.presetDoneSub")
        : (st.seen > 0 && st.total > 0) ? t("home.presetProgress", { seen: st.seen, total: st.total })
        : t(p.subKey);
      return `
      <button class="today__ruta${st.done ? " today__ruta--done" : ""}" data-action="open-preset" data-preset="${p.id}">
        <span class="today__ruta-main">${st.done ? renderIcon("lc:check-circle") + " " : ""}${renderIcon(PRESET_ICON[p.id] || "")} ${esc(t(p.titleKey))}${st.done ? ` <span class="today__ruta-badge" role="status">${esc(t("home.presetDone"))}</span>` : ""}</span>
        <span class="today__ruta-sub">${esc(sub)}</span>
      </button>`;
    }).join("");

    // Trip-Ziel: auf dem Dashboard nur die motivierende Countdown-Karte – und nur,
    // wenn ein Ziel gesetzt ist. Angelegt/bearbeitet wird es im Profil bzw. beim
    // Onboarding; ein Tap führt deshalb ins Profil zur Verwaltung.
    const tripCard = vm.trip ? tripDisplayCard(vm.trip, "manage-trip") + tripDailyCta(vm.trip) : "";

    // „Für deine Reise" – eigener, klar betitelter Abschnitt (Trip-Countdown +
    // Pre-Arrival-Pakete). Fällt komplett weg, wenn weder Ziel noch Preset aktiv
    // ist, damit der Start-Reiter bei den meisten Nutzern ruhig bleibt. Im Locals-
    // Track (Englisch lernen am Arbeitsplatz) gibt es keine Reise – Abschnitt entfällt.
    const homeLocalsTrack = !!(window.SC.track && window.SC.track.id && window.SC.track.id() === "es-en");
    const reiseInner = homeLocalsTrack ? "" : `${tripCard}${presetCards}`;
    const reiseGroup = reiseInner.trim()
      ? `<section class="dashgrp">
          <p class="sectioncap">${esc(t("home.tripSection"))}</p>
          ${reiseInner}
        </section>`
      : "";

    // HolaRuta-Check als offene Aufgabe: erscheint, solange der Einstufungstest
    // noch nicht gemacht wurde (für alle, nicht nur bei übersprungenem Onboarding).
    // Verschwindet, sobald er einmal absolviert ist (gamestats.placement gesetzt → placementDone).
    const placementCue = (vm.hasPlacement && !vm.placementDone)
      ? `
      <button class="today__ruta" data-action="open-placement">
        <span class="today__ruta-main">${renderIcon("lc:target")} ${esc(t("home.placementOpenTitle"))}</span>
        <span class="today__ruta-sub">${esc(t("home.placementOpenSub"))}</span>
      </button>`
      : "";

    // Hostel-Edition: Quick-Start-Banner zum „Modo hostal" (Gruppen-Battle & Icebreaker).
    // Nutzt die bestehende hist-banner-Komponente (Akzent fließt über --brand) – kein neues
    // CSS. data-action="open-hostel" hat bereits einen Handler. Ohne Hostel-Edition leer.
    const hcfg = (window.SC.config || {}).hostel;
    const hostelBanner = (hcfg && hcfg.banner)
      ? `
      <button class="hist-banner" data-action="open-hostel">
        <span class="hist-banner__icon" aria-hidden="true">${renderIcon("lc:bed")}</span>
        <span class="hist-banner__text">
          <span class="hist-banner__title">${esc(t("home.hostelBannerTitle"))}</span>
          <span class="hist-banner__sub">${esc(t("home.hostelBannerSub"))}</span>
        </span>
        <span class="hist-banner__chev" aria-hidden="true">›</span>
      </button>`
      : "";

    // Nivel-Test fortsetzen: erscheint, solange ein begonnener Test offen ist
    // (nach versehentlichem Zurück/Reload). Verschwindet beim Abschluss.
    const assessmentResumeCue = vm.assessmentResume
      ? `
      <button class="today__ruta" data-action="assessment-resume">
        <span class="today__ruta-main">${renderIcon("lc:clipboard-list")} ${esc(t("home.assessmentResumeTitle"))}</span>
        <span class="today__ruta-sub">${esc(t("home.assessmentResumeSub", { i: vm.assessmentResume.index, n: vm.assessmentResume.total }))}</span>
      </button>`
      : "";

    // Mi-léxico-Schnellzugriff: eine Kachel zum persönlichen Lexikon. Erscheint nur,
    // wenn schon etwas gemerkt wurde (sonst bleibt der Start-Reiter ruhig). Zeigt den
    // Zähler und – als Teaser – den jüngsten Favoriten; ein Tap öffnet „Mi léxico".
    const favSub = vm.favLast && vm.favLast.es
      ? t("home.lexLast", { es: vm.favLast.es })
      : t("home.lexHint");
    const favGroup = vm.favCount > 0
      ? `<section class="dashgrp">
          <p class="sectioncap">${esc(t("home.lexSection"))}</p>
          <button class="today__ruta" data-action="open-favorites">
            <span class="today__ruta-main">${renderIcon("lc:star")} ${esc(t("home.lexTitle"))} <span class="today__ruta-badge today__ruta-badge--lex" role="status">${vm.favCount}</span></span>
            <span class="today__ruta-sub">${esc(favSub)}</span>
          </button>
        </section>`
      : "";

    // Glanceable Fortschritt: dieselbe Karte wie im Profil (Streak + Verteilung).
    const progressGroup = `
      <section class="dashgrp">
        <p class="sectioncap">${esc(t("home.startProgressCap"))}</p>
        ${progressCard(vm)}
      </section>`;

    // Lernpfad prominent auf dem Start-Reiter (Locals immer, Reise bei laufendem Plan).
    const lpathGroup = vm.lpath ? lpathHomeCard(vm.lpath) : "";

    return `
      ${pagehead(esc(vm.userName ? t("home.homePromptName", { name: vm.userName }) : t("home.homePrompt")))}
      ${searchBar()}

      <div class="today">
        ${streakChip}
        <button class="cta ${vm.totalDue === 0 ? "is-done" : ""}" data-action="study-all">
          ${vm.totalDue === 0
            ? `${esc(t("home.allReviewed"))} ${renderIcon("lc:party-popper")} <span class="cta__count">${vm.totalCards}</span>`
            : vm.totalDue > vm.sessionCap
              ? `${esc(t("home.startSession"))} <span class="cta__count">${esc(t("home.sessionOf", { cap: vm.sessionCap, due: vm.totalDue }))}</span>`
              : `${esc(t("home.studyAllDue"))} <span class="cta__count">${vm.totalDue}</span>`}
        </button>
        ${resume}
        ${rutaDia}
        ${hostelBanner}
        ${assessmentResumeCue}
        ${placementCue}
      </div>

      ${lpathGroup}
      ${reiseGroup}
      ${favGroup}
      ${progressGroup}

      ${dedicationLine(vm)}`;
  }

  // Signatur-Zeile am Fuß von Home/Lernen. Standard: die persönliche Widmung.
  // In Partner-Editionen (ECOS, WeRoad) raus – stattdessen ein neutraler Reisegruß.
  function dedicationLine(vm) {
    const key = vm && vm.edition ? "home.dedicationEdition" : "home.dedication";
    return `<p class="dedication">${esc(t(key))} <span class="dedication__heart">♥</span></p>`;
  }

  // ----- LERNEN-Reiter: alle Themen mit klebriger Sprungmarken-Leiste je Gruppe -----
  function lernenBody(vm) {
    const tileBtn = (c) => {
      // Kategorie hat Karten, aber keine auf der aktiven Stufe (Filter blendet
      // sie aus)? Dann NICHT „erledigt“ (grünes Häkchen) zeigen – das würde
      // fälschlich „gemeistert“ suggerieren –, sondern „andere Stufe“, und als
      // Kartenzahl die echte Gesamtzahl statt der gefilterten 0.
      const filteredOut = c.total === 0 && c.totalAll > 0;
      const badge = filteredOut
        ? `<span class="tile__due tile__due--off">${renderIcon("lc:layers")} ${esc(t("home.tileFiltered"))}</span>`
        : c.due > 0 ? `<span class="tile__due">${esc(t("home.tileDue", { n: c.due }))}</span>` : `<span class="tile__due tile__due--ok">${renderIcon("lc:check-circle")} ${esc(t("home.tileDone"))}</span>`;
      // Stufen-Aufschlüsselung nur bei aktivem Stufen-Filter (aktive Stufe
      // farbig, inaktive ausgegraut) – ohne Filter bleiben die Kacheln ruhig.
      const breakdown = vm.allLevels ? "" : c.byLevel
        .map((b) =>
          `<span class="tile__lvl ${b.active ? "" : "is-off"}" style="--lc:${esc(b.color)}">${esc(b.short)}·${b.count}</span>`)
        .join("");
      return `
        <button class="tile" data-action="open-category" data-id="${esc(c.id)}"
                style="--from:${esc(c.grad[0])};--to:${esc(c.grad[1])}">
          <span class="tile__icon" aria-hidden="true">${renderIcon(catIcon(c))}</span>
          <span class="tile__label">${esc(c.label)}</span>
          <span class="tile__meta">${esc(t("home.tileCards", { n: filteredOut ? c.totalAll : c.total }))} · ${badge}</span>
          ${breakdown ? `<span class="tile__levels">${breakdown}</span>` : ""}
        </button>`;
    };
    // Nur nicht-leere Themen-Gruppen – dieselbe Liste speist Sprungmarken UND
    // Abschnitte, damit Chip und Ziel garantiert zusammenpassen.
    const groups = CATEGORY_GROUPS
      .map((g) => ({ g, items: vm.categories.filter((c) => c.group === g.id) }))
      .filter((x) => x.items.length);
    // Klebrige Sprungmarken-Leiste: ein Chip je Gruppe. Reine Anker-Sprünge über
    // die bestehende „scroll-to"-Aktion (kein History-Eintrag → kollidiert nicht
    // mit dem Zurück-Puffer). Das aktive Hervorheben verdrahtet app.js (Scrollspy).
    const jumpNav = groups.length > 1
      ? `<nav class="dashnav" id="topic-nav" aria-label="${esc(t("home.topicNavAria"))}">
          ${groups.map(({ g }) =>
            `<a class="dashnav__chip" href="#grp-${esc(g.id)}" data-action="scroll-to" data-target="grp-${esc(g.id)}">${esc(t(g.titleKey))}</a>`).join("")}
        </nav>`
      : "";
    // Themen in feste thematische Abschnitte gruppieren (Reihenfolge & Titel aus
    // CATEGORY_GROUPS); innerhalb behalten sie die Fälligkeits-Sortierung aus homeVM.
    const topicSections = groups.map(({ g, items }) => `
      <section class="topicgrp dashgrp" id="grp-${esc(g.id)}">
        <p class="sectioncap">${esc(t(g.titleKey))}</p>
        <div class="tiles">${items.map(tileBtn).join("")}</div>
      </section>`).join("");
    // Stufen-Filter: "Alle" + je Schwierigkeitsstufe (mehrfach wählbar, mit
    // Kartenzahl). Bleibt im Lernen-Reiter – die ändert man laufend beim Lernen.
    const levelChips = [
      `<button class="lvl ${vm.allLevels ? "is-active" : ""}" data-action="set-level" data-level="0">${esc(t("home.levelsAll"))}</button>`,
      ...vm.levels.map((l) =>
        `<button class="lvl ${l.active ? "is-active" : ""}" data-action="set-level" data-level="${l.id}"
                 style="--lc:${esc(l.color)}" aria-pressed="${l.active}" title="${esc(t("home.levelTitle", { label: l.label, n: l.count }))}">
           <span class="lvl__dot"></span>${esc(l.short)} · ${esc(l.label)}
         </button>`),
    ].join("");
    // Wortart-Filter: Einzelwörter vs. auch Wendungen/Sätze. Einfach-Auswahl
    // (immer genau ein Chip aktiv), je Chip die Kartenzahl der Wahl.
    const kindChips = (vm.vocabKinds || []).map((k) =>
      `<button class="lvl ${k.active ? "is-active" : ""}" data-action="set-vocabkind" data-kind="${esc(k.id)}"
               aria-pressed="${k.active}" title="${esc(t("home.kindTitle", { label: t("home.kind_" + k.id), n: k.count }))}">
         ${esc(t("home.kind_" + k.id))} · ${k.count}
       </button>`).join("");

    return `
      ${pagehead(esc(t("home.sectionTopics")))}
      ${searchBar()}
      ${jumpNav}

      <section class="dashgrp">
        <p class="sectioncap">${esc(t("home.sectionLevels"))}</p>
        <div class="levels" role="group" aria-label="${esc(t("home.levelsGroup"))}">${levelChips}</div>
      </section>

      <section class="dashgrp">
        <p class="sectioncap">${esc(t("home.sectionKind"))}</p>
        <div class="levels" role="group" aria-label="${esc(t("home.kindGroup"))}">${kindChips}</div>
      </section>

      ${topicSections}

      ${dedicationLine(vm)}`;
  }

  function entdeckenBody(vm) {
    // Voraussetzungen prüfen (Offline-/Feature-Guards): Länderkunde braucht das
    // countries-Modul, Precios die Sprachausgabe, Frases das frases-Modul.
    const has = { countries: vm.hasCountries, historia: vm.hasHistoria, historiaCentro: vm.hasHistoriaCentro, speech: vm.hasSpeech, frases: vm.hasFrases, dialogos: vm.hasDialogos, knigge: vm.hasKnigge, regatear: vm.hasRegatear, logistica: vm.hasLogistica, salud: vm.hasSalud, jerga: vm.hasJerga, derechos: vm.hasDerechos, responsable: vm.hasResponsable, fotos: vm.hasFotos, flirt: vm.hasFlirt, bailar: vm.hasBailar, musica: vm.hasMusica, cafe: vm.hasCafe, juegos: vm.hasJuegos, banderas: vm.hasBanderas, yesto: vm.hasYesto, placement: vm.hasPlacement, assessment: vm.hasAssessment };
    const featBtn = (x) => `
      <button class="feat" data-action="${x.action}"${x.scope ? ` data-scope="${esc(x.scope)}"` : ""} style="--from:${x.grad[0]};--to:${x.grad[1]}">
        <span class="feat__icon" aria-hidden="true">${renderIcon(x.icon)}</span>
        <span class="feat__text">
          <span class="feat__title">${esc(x.titleKey ? t(x.titleKey) : x.title)}</span>
          <span class="feat__sub">${esc(x.subKey ? t(x.subKey) : x.sub)}</span>
        </span>
      </button>`;
    // Pro Abschnitt nur die verfügbaren Einträge zeigen; leere Gruppen (alle
    // Einträge per need ausgeblendet) fallen samt Überschrift komplett weg.
    // Sichtbarkeit je Lern-Track deklariert jeder Eintrag selbst über `tracks`
    // (fehlend = nur Reise-Track "de-es"): die meisten Features sind spanisch-
    // spezifische Reise-Inhalte; track-fähige Spiele (Lernseite über SC.track)
    // nennen beide Tracks, reine Locals-Einträge nur "es-en".
    const trackId = (window.SC.track && window.SC.track.id && window.SC.track.id()) || "de-es";
    const available = FEATURES.filter((x) => {
      if (x.need && !has[x.need]) return false;
      return (x.tracks || ["de-es"]).indexOf(trackId) >= 0;
    });
    const sections = FEATURE_GROUPS.map((g) => {
      const items = available.filter((x) => x.group === g.id);
      if (!items.length) return "";
      return `
        <p class="sectioncap">${esc(t(g.titleKey))}</p>
        <div class="featgroup">${items.map(featBtn).join("")}</div>`;
    }).join("");
    // Hostel-Edition: kuratierter Abschnitt ganz oben, der die in config.hostel.featured
    // genannten Module (Reihenfolge = Liste) prominent vorzieht. Sie bleiben zusätzlich in
    // ihrer angestammten Gruppe. need-Gating greift über `available` mit; unbekannte
    // Aktionen fallen still weg. Ohne Hostel-Edition (Standard) entsteht hier nichts.
    const hcfg = (window.SC.config || {}).hostel;
    let hostelSection = "";
    if (hcfg && Array.isArray(hcfg.featured)) {
      const items = hcfg.featured.map((a) => available.find((x) => x.action === a)).filter(Boolean);
      if (items.length) hostelSection = `
        <p class="sectioncap">${esc(t("discover.groupHostel"))}</p>
        <div class="featgroup">${items.map(featBtn).join("")}</div>`;
    }
    return `
      ${pagehead(esc(t("discover.discoverTitle")))}
      ${searchBar()}
      <p class="pageintro">${esc(t("discover.discoverIntro"))}</p>
      ${hostelSection}
      ${sections}`;
  }

  // Ausführliche Ergebnis-Blöcke fürs Profil – dasselbe wie auf dem Ergebnis-
  // Schirm „nach dem Abschluss": Statistik (Trefferquote, „weiß nicht", Tempo),
  // Aufschlüsselung nach Bereich, plus optionale Notiz/Zuverlässigkeits-Hinweise.
  // ns = i18n-Namespace ("placement" | "assessment"), l = letztes Ergebnis (fmt).
  function resultDetailBlocks(ns, l) {
    if (!l) return "";
    const tn = (k) => t(ns + "." + k);
    const stats = `
      <ul class="pl-stats plprof__stats">
        <li><b>${l.accuracyPct}%</b> ${esc(tn("statAccuracy"))}</li>
        <li><b>${l.unknownPct}%</b> ${esc(tn("statUnknown"))}</li>
        <li>${esc(tn("statTempo"))}: <b>${esc(l.tempoLabel)}</b></li>
      </ul>`;
    const skillRow = (s) => `
      <li class="pl-skill">
        <span class="pl-skill__name">${esc(tn("skill_" + s.skill))}</span>
        <span class="pl-skill__bar"><span class="pl-skill__fill" style="width:${s.accuracy}%"></span></span>
        <span class="pl-skill__val">${s.accuracy}%</span>
      </li>`;
    const skills = (l.skills && l.skills.length)
      ? `<p class="sectioncap plprof__skillscap">${esc(tn("skillsCap"))}</p>
         <ul class="pl-skills">${l.skills.map(skillRow).join("")}</ul>`
      : "";
    const noteText = l.note === "commStrong" ? tn("noteComm")
      : l.note === "grammarStrong" ? tn("noteGrammar") : "";
    const note = noteText ? `<div class="tip">${esc(noteText)}</div>` : "";
    const relText = l.reliability ? tn("rel_" + l.reliability) : "";
    const rel = relText ? `<div class="tip pl-reliability pl-reliability--${esc(l.reliability)}">${esc(relText)}</div>` : "";
    return `${stats}${skills}${note}${rel}`;
  }

  // Reine Frage-für-Frage-Liste (ohne Aufklapp-Rahmen) – was war richtig/falsch,
  // was wäre korrekt, plus Erklärung. ns = i18n-Namespace ("placement" |
  // "assessment"). Optionale Item-Felder (level/listen/typo) werden nur gezeigt,
  // wenn vorhanden – so deckt eine Funktion Ruta-Check und Nivel-Test ab. "" wenn
  // leer. Eigenständig nutzbar (z. B. als Body einer Verlaufszeile).
  function reviewList(ns, review) {
    if (!review || !review.length) return "";
    const tn = (k) => t(ns + "." + k);
    const reviewIcon = { correct: "lc:check-circle", wrong: "lc:x-circle", unknown: "lc:help-circle" };
    const reviewRow = (r, i) => `
      <li class="pl-review__item pl-review__item--${esc(r.status)}">
        <p class="pl-review__q">
          <span class="pl-review__icon" aria-hidden="true">${renderIcon(reviewIcon[r.status] || "")}</span>
          <span><span class="pl-review__num">${i + 1}.</span> ${r.level ? `<span class="pl-review__lvl">${esc(r.level)}</span> ` : ""}${r.listen ? renderIcon("lc:headphones") + " " : ""}${esc(r.promptDe)}${r.questionEs ? ` <span class="pl-review__es" lang="es">„${esc(r.questionEs)}“</span>` : ""}</span>
        </p>
        ${r.status !== "correct" ? `
          <p class="pl-review__line">
            ${r.yourText
              ? `${esc(tn("reviewYours"))} <span class="pl-review__yours" lang="es">${esc(r.yourText)}</span>`
              : `<span class="pl-review__yours pl-review__yours--none">${esc(tn("reviewNoAnswer"))}</span>`}
          </p>
          <p class="pl-review__line">${esc(tn("reviewCorrect"))} <span class="pl-review__correct" lang="es">${esc(r.correctText)}</span></p>` : ""}
        ${r.status === "correct" && r.typo ? `
          <p class="pl-review__line pl-review__typo">${esc(tn("reviewTypo"))} <span class="pl-review__correct" lang="es">${esc(r.correctText)}</span></p>` : ""}
        ${r.explanationDe ? `<p class="pl-review__exp">${esc(r.explanationDe)}</p>` : ""}
      </li>`;
    return `<ul class="pl-review">${review.map(reviewRow).join("")}</ul>`;
  }

  // Aufklappbarer Rückblick-Block fürs aktuelle Ergebnis (Ergebnis-Schirm + Profil):
  // Liste in <details> mit „Antworten ansehen". "" wenn nichts vorliegt.
  function reviewBox(ns, review) {
    const list = reviewList(ns, review);
    if (!list) return "";
    return `<details class="pl-reviewbox">
           <summary class="pl-reviewbox__sum">${esc(t(ns + ".reviewCap"))}</summary>
           ${list}
         </details>`;
  }

  // Verlauf (Verlauf/Fortschritt) fürs Profil – baugleich für Ruta-Check und Nivel-
  // Test. Jede ältere Zeile ist aufklappbar und zeigt den eigenen Frage-für-Frage-
  // Rückblick (sofern gespeichert); die NEUESTE Zeile bleibt flach, weil ihr voller
  // Rückblick schon oben im Hauptblock steht (keine Dopplung). Altergebnisse ohne
  // Rückblick-Daten bleiben ebenfalls flache Zeilen. "" bei ≤ 1 Durchlauf.
  function historyList(ns, history) {
    if (!history || history.length <= 1) return "";
    const tn = (k) => t(ns + "." + k);
    const head = (h) => `
      <span class="plprof__histdate">${esc(h.at || "")}</span>
      <span class="plprof__histlvl">${esc(h.level)}</span>
      <span class="plprof__histscore">${h.scorePct}%</span>`;
    const row = (h, i) => {
      const list = i === 0 ? "" : reviewList(ns, h.review); // neueste: oben schon voll
      return list
        ? `<li class="plprof__histrow plprof__histrow--open">
             <details class="plprof__histbox">
               <summary class="plprof__histsum">${head(h)}</summary>
               ${list}
             </details>
           </li>`
        : `<li class="plprof__histrow">${head(h)}</li>`;
    };
    return `<div class="plprof__histcap">${esc(tn("profileHistoryCap"))}</div>
       <ul class="plprof__hist">${history.map(row).join("")}</ul>`;
  }

  // Ruta-Check im Profil: letztes Ergebnis (Startlevel, Score, Tempo), kurzer
  // Verlauf und Knöpfe zum Wiederholen + Teilen. Wer ihn noch nie gemacht hat,
  // sieht einen Einstiegs-Aufruf. p = vm.placement (null = Modul nicht geladen).
  function placementCard(p, shareFmt) {
    if (!p) return "";
    const cap = `<p class="sectioncap">${renderIcon("lc:target")} ${esc(t("placement.profileCap"))}</p>`;
    if (!p.taken || !p.last) {
      return `
        ${cap}
        <div class="plprof plprof--empty">
          <p class="plprof__never">${esc(t("placement.profileNever"))}</p>
          <button class="teacher-btn teacher-btn--main" data-action="open-placement">${renderIcon("lc:play")} ${esc(t("placement.takeNow"))}</button>
        </div>`;
    }
    const l = p.last;
    return `
      ${cap}
      <div class="plprof">
        <div class="plprof__head">
          <div class="plprof__levelbox">
            <span class="plprof__levelcap">${esc(t("placement.profileLevelCap"))}</span>
            <span class="plprof__level">${esc(l.level)}</span>
          </div>
          <div class="plprof__meta">
            <p class="plprof__score">${l.total ? esc(t("placement.resultLine", { correct: l.correct, total: l.total, score: l.scorePct })) : esc(t("placement.profileScoreLine", { score: l.scorePct, acc: l.accuracyPct }))}</p>
            ${l.at ? `<p class="plprof__date">${esc(t("placement.profileLastAt", { date: l.at }))} · ${esc(t("placement.profileAttempts", { n: p.attempts }))}</p>` : ""}
          </div>
        </div>
        ${resultDetailBlocks("placement", l)}
        ${reviewBox("placement", l.review)}
        ${historyList("placement", p.history)}
        ${shareBlock(shareFmt, "share-placement", t("placement.share"))}
        <div class="plprof__actions">
          <button class="ghostbtn" data-action="open-placement">${renderIcon("lc:rotate-ccw")} ${esc(t("placement.retake"))}</button>
        </div>
      </div>`;
  }

  // Nivel-Test im Profil – baugleich zur Ruta-Check-Karte, nur aus dem
  // assessment-Namespace und mit eigenem Öffnen/Teilen-Hook.
  function assessmentCard(p, shareFmt) {
    if (!p) return "";
    const cap = `<p class="sectioncap">${renderIcon("lc:clipboard-list")} ${esc(t("assessment.profileCap"))}</p>`;
    if (!p.taken || !p.last) {
      return `
        ${cap}
        <div class="plprof plprof--empty">
          <p class="plprof__never">${esc(t("assessment.profileNever"))}</p>
          <button class="teacher-btn teacher-btn--main" data-action="open-assessment">${renderIcon("lc:play")} ${esc(t("assessment.takeNow"))}</button>
        </div>`;
    }
    const l = p.last;
    return `
      ${cap}
      <div class="plprof">
        <div class="plprof__head">
          <div class="plprof__levelbox">
            <span class="plprof__levelcap">${esc(t("assessment.profileLevelCap"))}</span>
            <span class="plprof__level">${esc(l.level)}</span>
          </div>
          <div class="plprof__meta">
            <p class="plprof__score">${l.total ? esc(t("assessment.resultLine", { correct: l.correct, total: l.total, score: l.scorePct })) : esc(t("assessment.profileScoreLine", { score: l.scorePct, acc: l.accuracyPct }))}</p>
            ${l.variantLabel ? `<p class="plprof__variant">${esc(l.variantLabel)}</p>` : ""}
            ${l.at ? `<p class="plprof__date">${esc(t("assessment.profileLastAt", { date: l.at }))} · ${esc(t("assessment.profileAttempts", { n: p.attempts }))}</p>` : ""}
          </div>
        </div>
        ${resultDetailBlocks("assessment", l)}
        ${reviewBox("assessment", l.review)}
        ${historyList("assessment", p.history)}
        ${shareBlock(shareFmt, "share-assessment", t("assessment.share"))}
        <div class="plprof__actions">
          <button class="ghostbtn" data-action="open-assessment">${renderIcon("lc:rotate-ccw")} ${esc(t("assessment.retake"))}</button>
        </div>
      </div>`;
  }

  function profilBody(vm) {
    const navrow = (action, icon, label, chip) => `
      <button class="navrow" data-action="${action}">
        <span class="navrow__icon" aria-hidden="true">${renderIcon(icon)}</span>
        <span class="navrow__label">${esc(label)}</span>
        ${chip ? `<span class="navrow__chip">${chip}</span>` : ""}
        <span class="navrow__chev" aria-hidden="true">›</span>
      </button>`;
    // Lern-Einstellungen: Bediensprache (de/en) plus die Lern-Voreinstellungen
    // (Modus/Richtung/Stufen/Tempo). Alles globale Vorgaben, daher gebündelt hier
    // im Profil – das Dashboard zeigt davon nur noch die Zusammenfassung.
    // Reise-Name: wird in den Diálogos automatisch eingesetzt (Hotel, Notfall …),
    // damit der Nutzer dort seinen eigenen Namen nennt statt eines Beispielnamens.
    // Eigenes <form>, damit Enter speichert; zusätzlich sichert ein Blur den Stand
    // (change-Handler in app.js), falls ohne „Speichern" weggetippt wird.
    const nameGroup = `
      <form class="switchgroup namefield" data-action="save-name">
        <label class="switchcap" for="profile-name">${renderIcon("lc:user")} ${esc(t("home.nameCap"))}</label>
        <div class="namefield__row">
          <input id="profile-name" class="namefield__input" type="text" maxlength="40"
                 autocomplete="given-name" autocapitalize="words" autocorrect="off" spellcheck="false"
                 placeholder="${esc(t("home.namePlaceholder"))}" value="${esc(vm.userName)}" />
          <button class="ghostbtn namefield__save" type="submit">${esc(t("home.nameSave"))}</button>
        </div>
        <p class="namefield__hint">${esc(t("home.nameHint"))}</p>
      </form>`;
    const langGroup = `
      <div class="switchgroup">
        <span class="switchcap">${esc(t("home.uiLanguage"))}</span>
        <div class="segmented" role="tablist" aria-label="${esc(t("home.uiLanguage"))}">
          ${(vm.uiLangOptions || [{ code: "de", flag: "🇩🇪", label: "Deutsch" }, { code: "en", flag: "🇬🇧", label: "English" }]).map((o) =>
            `<button class="seg ${vm.uiLang === o.code ? "is-active" : ""}" data-action="set-ui-lang" data-lang="${esc(o.code)}" aria-pressed="${vm.uiLang === o.code}">${o.flag} ${esc(o.label)}</button>`
          ).join("")}
        </div>
      </div>`;
    return `
      ${pagehead(esc(t("profile.progressTitle")))}

      ${progressCard(vm)}

      ${vm.showTrip === false ? "" : `<p class="sectioncap">${renderIcon("lc:target")} ${esc(t("home.tripCap"))}</p>
      ${tripManage(vm)}`}

      ${vm.hasPlacement ? placementCard(vm.placement, vm.shareFormat) : ""}
      ${vm.hasAssessment ? assessmentCard(vm.assessment, vm.shareFormat) : ""}

      <p class="sectioncap">${renderIcon("lc:settings")} ${esc(t("home.settingsCap"))}</p>
      <div class="prefs">
        ${themeSetting(vm)}
        ${nameGroup}
        ${genderGroup(vm)}
        ${langGroup}
        ${learnPrefs(vm)}
        ${celebrateSoundGroup(vm)}
      </div>

      ${navrow("open-stats", "lc:bar-chart-3", t("profile.statistics"))}
      ${vm.hasBadges ? navrow("open-badges", "lc:award", t("profile.rutaPass"), vm.badgeCount || "") : ""}
      ${navrow("open-favorites", "lc:star", t("profile.favorites"), vm.favCount || "")}
      ${navrow("open-editor", "lc:square-pen", t("profile.ownCards"))}

      <p class="sectioncap">${esc(t("profile.yourData"))}</p>
      ${navrow("export-data", "lc:upload", t("profile.exportData"))}
      ${navrow("import-data", "lc:download", t("profile.importData"))}
      ${vm.syncEnabled ? navrow("cloud-sync", "lc:cloud", t("profile.cloudSync"), vm.syncLoggedIn ? "✓" : "") : ""}
      ${vm.socialEnabled ? navrow("open-social", "lc:trophy", t("social.navTitle"), vm.socialLoggedIn ? "✓" : "") : ""}
      ${analyticsConsentGroup(vm)}
      <input type="file" id="import-file" accept=".json,application/json" hidden />

      <a class="navrow" href="landing.html" style="text-decoration:none" aria-label="${esc(t("profile.about"))}">
        <span class="navrow__icon" aria-hidden="true">${renderIcon("lc:info")}</span>
        <span class="navrow__label">${esc(t("profile.about"))}</span>
        <span class="navrow__chev" aria-hidden="true">›</span>
      </a>

      <a class="navrow" href="landing.html#partner" style="text-decoration:none" aria-label="${esc(t("profile.partner"))}">
        <span class="navrow__icon" aria-hidden="true">${renderIcon("lc:handshake")}</span>
        <span class="navrow__label">${esc(t("profile.partner"))}</span>
        <span class="navrow__chev" aria-hidden="true">›</span>
      </a>

      ${installBlock(vm.install)}
      ${editionCredit(vm.edition)}`;
  }

  // Dezenter Co-Branding-Hinweis im Profil (nur in einer Edition sichtbar).
  function editionCredit(e) {
    if (!e) return "";
    // Co-Branding-Credit: das Partner-Logo (oder, ohne Logo, der Partnername) plus
    // ein dezentes „mit HolaRuta". Bewusst OHNE den vollen brandName, der den
    // Partnernamen schon enthält (sonst stünde „WeRoad Colombia" doppelt da).
    const partnerName = (e.partner && e.partner.name) || e.name || "";
    // Nur echte http(s)-Links verlinken; alles andere (z.B. javascript:) als Text.
    const url = e.partner && e.partner.url && /^https?:\/\//i.test(e.partner.url) ? e.partner.url : null;
    // Partner-Logo NUR rendern, wenn eine Edition es ausdrücklich setzt (mit Freigabe).
    // Erlaubt sind ausschließlich https:- oder eingebettete data:image-URLs.
    const logoOk = e.logo && /^(https:\/\/|data:image\/)/i.test(e.logo);
    const head = logoOk
      ? `<img class="edition-logo" src="${esc(e.logo)}" alt="${esc(partnerName)}" />`
      : `<span class="edition-credit__name">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(partnerName)}</a>` : esc(partnerName)}</span>`;
    return `<div class="edition-credit">${head}<span class="edition-credit__powered">${esc(t("profile.poweredBy"))}</span></div>`;
  }

  // „Auf den Startbildschirm“-Hinweis (nur wenn sinnvoll, siehe install.js).
  // Android zeigt einen Knopf für den nativen Installations-Dialog; iOS bekommt
  // eine kurze Schritt-für-Schritt-Anleitung, weil Safari keinen Prompt kennt.
  function installBlock(install) {
    if (!install || !install.show) return "";
    // Bereits installiert: klare Bestätigung statt Installations-Aufforderung.
    // Auf iOS zusätzlich der Konsequenz-Hinweis: NICHT erneut zum Startbildschirm
    // hinzufügen (iOS trennt den Speicher pro Icon -> leere zweite Kopie).
    if (install.installed) {
      const iosNote = install.isIOS
        ? `<p class="installcard__note installcard__note--warn">${esc(t("profile.installedIosNote"))}</p>`
        : "";
      return `
        <div class="installcard installcard--done">
          <p class="installcard__title"><span aria-hidden="true">${renderIcon("lc:check-circle")}</span> ${esc(t("profile.installedTitle"))}</p>
          <p class="installcard__text">${esc(t("profile.installedText"))}</p>
          ${iosNote}
        </div>`;
    }
    // Noch nicht installiert: Status klar zeigen, nächster Schritt je nach Browser.
    const body = install.canPrompt
      ? `<p class="installcard__text">${esc(t("profile.installText"))}</p>
         <button class="ghostbtn installcard__btn" data-action="install-app">${esc(t("profile.installBtn"))}</button>`
      : install.isIOS
        ? `<p class="installcard__text">${esc(install.hint)}</p>
           <p class="installcard__note installcard__note--warn">${esc(t("profile.installIosReaddWarn"))}</p>`
        : `<p class="installcard__text">${esc(t("profile.installHintLead"))}</p>
           <ol class="installcard__steps">
             <li>${esc(t("profile.installStep1"))}</li>
             <li>${esc(t("profile.installStep2"))}</li>
             <li>${esc(t("profile.installStep3"))}</li>
           </ol>
           <p class="installcard__note">${esc(t("profile.installHintNote"))}</p>`;
    return `
      <div class="installcard">
        <p class="installcard__title"><span aria-hidden="true">${renderIcon("lc:smartphone")}</span> ${esc(t("profile.notInstalledTitle"))}</p>
        ${body}
      </div>`;
  }

  function renderHome(vm) {
    const body =
      vm.tab === "lernen" ? lernenBody(vm) :
      vm.tab === "entdecken" ? entdeckenBody(vm) :
      vm.tab === "profil" ? profilBody(vm) :
      startBody(vm);
    return `
      <section class="screen screen--tabbed">${body}</section>
      ${tabbar(vm.tab)}`;
  }

  // ---------- SUCHE (gezielt nach Karten/Übungen & Informationen suchen) ----------
  // Eigenes echtes Eingabefeld (autofokussiert in app.js). Die Trefferliste lebt in
  // #search-results und wird beim Tippen separat aktualisiert (Fokus bleibt erhalten).
  function renderSearch(vm) {
    return `
      <section class="screen screen--search">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
          <div class="topbar__title">${renderIcon("lc:search")} ${esc(t("search.title"))}</div>
          <span></span>
        </div>
        <div class="searchfield">
          <span class="searchfield__icon" aria-hidden="true">${renderIcon("lc:search")}</span>
          <input id="search-input" class="searchfield__input" type="search" inputmode="search"
                 autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"
                 placeholder="${esc(t("search.inputPlaceholder"))}" aria-label="${esc(t("search.inputPlaceholder"))}"
                 value="${esc(vm.query)}" />
          <button class="searchfield__clear" data-action="search-clear" aria-label="${esc(t("search.clear"))}">✕</button>
        </div>
        <div id="search-results">${searchResults(vm)}</div>
      </section>`;
  }

  // Nur die Trefferliste – wird sowohl im Voll-Render als auch beim Live-Tippen
  // (app.js updateSearchResults) verwendet, deshalb als eigene Funktion exportiert.
  function searchResults(vm) {
    const q = (vm.query || "").trim();
    if (!q) return `<p class="search-hint">${esc(t("search.hintEmpty"))}</p>`;
    if (!vm.groups.length) return `<p class="stat-empty">${esc(t("search.noResults", { q: q }))}</p>`;
    return vm.groups.map((g) => `
      <p class="sectioncap search-cap">${esc(g.label)} <span class="search-count">${g.items.length}</span></p>
      <div class="search-list">${g.items.map(searchRow).join("")}</div>`).join("");
  }

  function searchRow(it) {
    const dataId = it.id ? ` data-id="${esc(it.id)}"` : "";
    const dataBack = it.back ? ` data-back="${esc(it.back)}"` : "";
    const titleLang = it.titleLang ? ` lang="${esc(it.titleLang)}"` : "";
    const sub = it.sub ? `<span class="search-row__sub">${esc(it.sub)}</span>` : "";
    return `
      <button class="search-row" data-action="${esc(it.action)}"${dataId}${dataBack}>
        <span class="search-row__icon" aria-hidden="true">${renderIcon(it.icon)}</span>
        <span class="search-row__text">
          <span class="search-row__title"${titleLang}>${esc(it.title)}</span>
          ${sub}
        </span>
        <span class="search-row__kind">${esc(it.kindLabel)}</span>
        <span class="search-row__chev" aria-hidden="true">›</span>
      </button>`;
  }

  // favStar() ist nach view-helpers.js (SC.view) gewandert – oben via Destructuring
  // gebunden, da auch Feature-Module (Spickzettel, Mi léxico) es nutzen.

  // Beschrifteter Favoriten-Button direkt unter der Lernkarte. Früher saß der Stern
  // nackt oben in der Kopfzeile (neben dem Zähler) – dort war ohne Beschriftung nicht
  // erkennbar, was er tut. Hier steht er mit Text („Merken"/„Gemerkt") griffbereit am
  // Inhalt. Den Stern (★/☆) und den Text hält der Controller in-place aktuell
  // (updateFavStars), darum sind beide in eigene Spans gekapselt – ein Voll-Re-Render
  // würde im Schreiben-Modus den getippten Text verwerfen.
  function favLine(vm) {
    if (!vm.cardId) return "";
    const on = vm.isFav;
    const cls = "favline" + (on ? " is-on" : "");
    const label = on ? t("favorites.remove") : t("favorites.add");
    return `<button class="${cls}" type="button" data-action="fav-toggle" data-id="${esc(vm.cardId)}"
              aria-pressed="${on ? "true" : "false"}" aria-label="${esc(label)}" title="${esc(label)}"><span class="favline__star" aria-hidden="true">${on ? "★" : "☆"}</span><span class="favline__txt">${esc(on ? t("study.favSaved") : t("study.favSave"))}</span></button>`;
  }

  // Smartphone-Mockup: zeigt die aktuelle Lernkarte auf Desktop-Größe in einem Smartphone-Rahmen.
  function smartphoneMock(vm) {
    const isFlipped = vm.revealed || false;
    const cardText = isFlipped ? (vm.answer || "—") : (vm.question || "—");
    const catLabel = vm.catLabel || "";
    return `
      <div class="smartphone-mock">
        <div class="smartphone-mock__screen">
          <div class="smartphone-mock__statusbar">
            <span>12:34</span>
            <span>📶 ▼</span>
          </div>
          <div class="smartphone-mock__content">
            <div class="smartphone-mock__card${isFlipped ? ' is-back' : ''}">
              <div class="smartphone-mock__card-label">${esc(catLabel)}</div>
              <div class="smartphone-mock__card-text">${esc(cardText)}</div>
              <div class="smartphone-mock__hint">${isFlipped ? '✓' : '↻ Flip'}</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ---------- STUDY ----------
  function renderStudy(vm) {
    const pct = vm.total > 0 ? Math.round((vm.position / vm.total) * 100) : 0;
    const accent = vm.accent; // [from,to]

    const body =
      vm.mode === "listen" ? listenBody(vm) :
      vm.mode === "type" ? typeBody(vm) : flipBody(vm);

    // Endlos-Modus: kein „X/Y", sondern der laufende Zähler bisher gelernter Karten
    // plus ∞-Symbol; die Fortschrittsleiste läuft als dezente Endlos-Animation.
    const counter = vm.endless
      ? `<div class="topbar__counter" aria-live="polite" title="${esc(t("study.endlessLabel"))}">${vm.studied} ∞</div>`
      : `<div class="topbar__counter" aria-live="polite">${vm.position + 1}/${vm.total}</div>`;
    const progress = vm.endless
      ? `<div class="progress progress--endless" role="progressbar" aria-valuetext="${esc(t("study.endlessLabel"))}" aria-label="${esc(t("study.studyProgress"))}"><div class="progress__bar"></div></div>`
      : `<div class="progress" role="progressbar" aria-valuenow="${vm.position + 1}" aria-valuemin="1" aria-valuemax="${vm.total}" aria-label="${esc(t("study.studyProgress"))}"><div class="progress__bar" style="width:${pct}%"></div></div>`;

    return `
      <section class="screen study" style="--from:${esc(accent[0])};--to:${esc(accent[1])}">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
          <div class="topbar__title">${renderIcon(vm.catLc || vm.catIcon)} ${esc(vm.catLabel)}</div>
          <div class="topbar__right">
            ${counter}
          </div>
        </div>
        ${progress}
        ${body}
        ${favLine(vm)}
        ${skipBtn()}
        ${shareCardBtn()}
        ${smartphoneMock(vm)}
      </section>`;
  }

  // Dezenter „Überspringen“-Button: nimmt die aktuelle Karte ohne Bewertung aus der
  // Sitzung (sie bleibt fällig). So muss niemand jede Karte durchziehen.
  function skipBtn() {
    return `<button class="skipbtn" type="button" data-action="skip" aria-label="${esc(t("study.skipLabel"))}">${renderIcon("lc:skip-forward")} ${esc(t("study.skip"))}</button>`;
  }

  // Stufen-Badge (oben rechts auf der Karte). on = farbig (Rückseite), sonst dezent.
  function levelBadge(vm, on) {
    if (!vm.level) return "";
    const cls = on ? "lvl-badge lvl-badge--on" : "lvl-badge";
    const style = on ? "" : ` style="--lc:${esc(vm.level.color)}"`;
    return `<span class="${cls}"${style} title="${esc(vm.level.label)}">${esc(vm.level.short)} · ${esc(vm.level.label)}</span>`;
  }

  // Der runde Eck-Button cornerBtn({base,on,icon,label,action,extra}) wohnt jetzt in
  // view-helpers.js (SC.view) – geteilt von Lernkarte (🔊/🧭), El Cuerpo und
  // Einkaufszettel. Oben aus SC.view destrukturiert.

  // 🔊-Button für die Sprachausgabe (nur wenn der Browser es kann).
  // on = farbige Variante (für die bunte Rückseite).
  function speakBtn(on) {
    if (!speechReady()) return "";
    return cornerBtn({ base: "cardbtn--speak", on, icon: "lc:volume-2", label: t("study.speakAnswer"), action: "speak" });
  }

  // Reise-Kontext-Panel: aufklappbarer Inhalt mit echtem Reisesatz, Situation und
  // kurzem Reisetipp. open spiegelt state.contextOpen (Single Source of Truth) –
  // der Controller hält DOM und Zustand in-place synchron (kein Re-Render nötig).
  function contextPanel(ctx, open) {
    if (!ctx) return "";
    // Beispielzeile: gelernter Satz oben (lang-Attribut für a11y/Vorlesen), darunter
    // die Übersetzung. Reise: Spanisch + Mutterspr.; Locals: Englisch + Spanisch.
    const line = (learn, learnLang, gloss) => {
      const e = learn ? `<p class="context-panel__es" lang="${esc(learnLang)}">${esc(learn)}</p>` : "";
      const d = gloss ? `<p class="context-panel__de">${esc(gloss)}</p>` : "";
      return e || d ? `<div class="context-panel__line">${e}${d}</div>` : "";
    };
    const meta = (label, text) => text
      ? `<div class="context-panel__block"><div class="context-panel__label">${esc(label)}</div><p class="context-panel__text">${esc(text)}</p></div>`
      : "";
    const exLine = ctx.loc
      ? line(ctx.egLearn, "en", ctx.egNative)        // Locals: englischer Satz + spanische Übersetzung
      : line(ctx.sentenceEs, "es", ctx.sentenceDe);  // Reise: spanischer Satz + Mutterspr.
    // Locals (Englisch lernen) nutzt die Arbeits-Labels statt des Reise-Wortlauts.
    const titleKey = ctx.loc ? "study.contextTitleWork" : "study.contextTitle";
    const noteKey = ctx.loc ? "study.contextNoteWork" : "study.contextNote";
    // Im Locals-Track ist der ganze Erklärblock eine Verständnishilfe in der L1 der
    // Lernenden: Überschrift + Labels stehen darum – wie der Inhalt (situation/note)
    // und die Karten-Frage – IMMER auf Spanisch, auch bei englischer UI-Chrome.
    const nl = ctx.loc ? "es" : null;
    return `
      <div class="context-panel" id="context-panel"${open ? "" : " hidden"}${ctx.loc ? ' lang="es"' : ""}>
        <h3 class="context-panel__title">${esc(t(titleKey, null, nl))}</h3>
        ${exLine}
        ${meta(t("study.contextSituation", null, nl), ctx.situation)}
        ${meta(t(noteKey, null, nl), ctx.note)}
      </div>`;
  }

  // Runder 🧭-Icon-Button auf der Lernkarte (unten links) – Pendant zum 🔊 (unten
  // rechts). on = farbige Variante für die bunte Antwort-Rückseite; open = Panel offen.
  function contextIconBtn(ctx, on, open) {
    if (!ctx) return "";
    return cornerBtn({
      base: "cardbtn--ctx" + (open ? " is-open" : ""), on, icon: "lc:info",
      label: t(ctx.loc ? "study.contextShowWork" : "study.contextShow"), action: "toggle-context",
      extra: `aria-expanded="${!!open}" aria-controls="context-panel"`,
    });
  }

  // Detail-Variante (Karten-Detailseite): sichtbar beschrifteter Button + Panel im
  // Textfluss, da hier kein 🔊 zum Spiegeln und mehr Platz vorhanden ist.
  function contextBlock(ctx, open) {
    if (!ctx) return "";
    const label = ctx.loc
      ? (open ? t("study.contextHideWork") : t("study.contextWork"))
      : (open ? t("study.contextHide") : t("study.context"));
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
    const tip = vm.tip ? `<div class="face__tip">${renderIcon("lc:audio-lines")} ${esc(vm.tip)}</div>` : "";
    const sq = vm.spanishIsQuestion; // Lernsprache steht vorne (Frage)?
    // lang-Attribute spiegeln die tatsächlich gezeigte Sprache (a11y/Vorlesen):
    // Frageseite = Lernsprache wenn sq, sonst Muttersprache; Antwortseite umgekehrt.
    const qLang = sq ? vm.learnLang : vm.nativeLang;
    const aLang = sq ? vm.nativeLang : vm.learnLang;
    const catLabel = vm.catLabel || "";
    const question = vm.question || "—";
    const answer = vm.answer || "—";
    return `
      <div class="flip ${vm.revealed ? "is-flipped" : ""}" data-action="flip" id="flip"
           role="button" tabindex="0" aria-label="${vm.revealed ? esc(t("study.cardBack")) : esc(t("study.cardFlip"))}">
        <div class="flip__inner">
          <div class="face face--front">
            <span class="face__cat">${esc(catLabel)}</span>
            ${levelBadge(vm, false)}
            ${sq ? speakBtn(false) : ""}
            <div class="face__word" lang="${esc(qLang)}">${esc(question)}</div>
            ${sq ? tip : ""}
            <span class="face__hint">${esc(t("study.flipHint"))}</span>
          </div>
          <div class="face face--back">
            <span class="face__cat">${esc(catLabel)}</span>
            ${levelBadge(vm, true)}
            ${contextIconBtn(vm.context, true, vm.contextOpen)}
            ${sq ? "" : speakBtn(true)}
            <div class="face__word" lang="${esc(aLang)}">${esc(answer)}</div>
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
    const qLang = sq ? vm.learnLang : vm.nativeLang; // Sprache der Frage
    const aLang = sq ? vm.nativeLang : vm.learnLang; // Sprache der erwarteten Antwort
    const catLabel = vm.catLabel || "";
    const question = vm.question || "—";
    const answer = vm.answer || "—";
    const tip = vm.tip ? `<div class="face__tip">${renderIcon("lc:audio-lines")} ${esc(vm.tip)}</div>` : "";

    if (!res) {
      const inputHint = sq ? t("study.inputDe") : t("study.inputEs");
      const placeholder = sq ? t("study.placeholderDe") : t("study.placeholderEs");
      return `
        <div class="card-static">
          <span class="face__cat">${esc(catLabel)}</span>
          ${levelBadge(vm, false)}
          ${sq ? speakBtn(false) : ""}
          <div class="face__word" lang="${esc(qLang)}">${esc(question)}</div>
          <span class="face__hint">${inputHint}</span>
        </div>
        <form class="typer" data-action="submit-typed" id="typer">
          <input class="typer__input" id="answer" type="text" lang="${esc(aLang)}" autocomplete="off"
                 autocapitalize="off" autocorrect="off" spellcheck="false"
                 aria-label="${esc(placeholder)}" placeholder="${esc(placeholder)}" />
          <button class="typer__btn" type="submit">${esc(t("common.check"))}</button>
        </form>`;
    }

    const verdict = res.correct
      ? `<div class="verdict verdict--ok">${esc(t("common.correctShort"))}</div>`
      : `<div class="verdict verdict--no">${esc(t("common.notQuiteInput", { input: res.input || "—" }))}</div>`;
    return `
      <div class="card-static ${res.correct ? "is-ok" : "is-no"}" role="status" aria-live="assertive">
        <span class="face__cat">${esc(catLabel)}</span>
        ${levelBadge(vm, false)}
        ${contextIconBtn(vm.context, false, vm.contextOpen)}
        ${sq ? "" : speakBtn(false)}
        <div class="face__word" lang="${esc(aLang)}">${esc(answer)}</div>
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
    const catLabel = vm.catLabel || "";
    const es = vm.es || "—";
    const de = vm.de || "—";
    const tip = vm.tip ? `<div class="face__tip">${renderIcon("lc:audio-lines")} ${esc(vm.tip)}</div>` : "";

    if (!res) {
      const replay = speechReady()
        ? `<button class="listen-replay ghostbtn" type="button" data-action="speak">${esc(t("common.listenAgain"))}</button>`
        : "";
      return `
        <div class="card-static card-listen">
          <span class="face__cat">${esc(catLabel)}</span>
          ${levelBadge(vm, false)}
          <span class="listen-ear" aria-hidden="true">${renderIcon("lc:ear")}</span>
          ${replay}
          <span class="face__hint">${esc(t("study.listenHint"))}</span>
        </div>
        <form class="typer" data-action="submit-typed" id="typer">
          <input class="typer__input" id="answer" type="text" lang="${esc(vm.learnLang)}" autocomplete="off"
                 autocapitalize="off" autocorrect="off" spellcheck="false"
                 aria-label="${esc(t("study.listenPlaceholder"))}" placeholder="${esc(t("study.listenPlaceholder"))}" />
          <button class="typer__btn" type="submit">${esc(t("common.check"))}</button>
        </form>`;
    }

    const verdict = res.correct
      ? `<div class="verdict verdict--ok">${esc(t("common.correctHeard"))}</div>`
      : `<div class="verdict verdict--no">${esc(t("common.notQuiteInput", { input: res.input || "—" }))}</div>`;
    return `
      <div class="card-static ${res.correct ? "is-ok" : "is-no"}" role="status" aria-live="assertive">
        <span class="face__cat">${esc(catLabel)}</span>
        ${levelBadge(vm, false)}
        ${contextIconBtn(vm.context, false, vm.contextOpen)}
        ${speakBtn(false)}
        <div class="face__word" lang="${esc(vm.learnLang)}">${esc(es)}</div>
        ${colorSwatch(vm.swatch)}
        <div class="listen-de">${esc(de)}</div>
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
        <span class="rateprompt__de">${esc(t("study.ratePromptDe"))}</span>
      </div>
      <div class="ratebar" role="group" aria-label="${esc(t("study.ratePromptDe"))}">
        <button class="feel feel--again" data-action="rate" data-rating="again" aria-label="${esc(t("study.rateAgainLabel"))}">
          <span class="feel__emoji" aria-hidden="true">${renderIcon("lc:meh")}</span>
          <span class="feel__txt">Otra vez</span>
        </button>
        <button class="feel feel--good" data-action="rate" data-rating="good" aria-label="${esc(t("study.rateGoodLabel"))}">
          <span class="feel__emoji" aria-hidden="true">${renderIcon("lc:smile")}</span>
          <span class="feel__txt">Vale</span>
        </button>
        <button class="feel feel--easy" data-action="rate" data-rating="easy" aria-label="${esc(t("study.rateEasyLabel"))}">
          <span class="feel__emoji" aria-hidden="true">${renderIcon("lc:laugh")}</span>
          <span class="feel__txt">¡Fácil!</span>
        </button>
      </div>`;
  }

  // Dezenter Teilen-Link ganz unten: erzeugt aus der aktuellen Karte ein Sharepic.
  function shareCardBtn() {
    if (!canShare()) return "";
    return `<button class="sharepic-btn" type="button" data-action="share-card" aria-label="${esc(t("study.shareCardLabel"))}">${esc(t("study.shareCard"))}</button>`;
  }

  // ---------- DONE ----------
  // Der Fertig-Screen ist jetzt nur noch die leere Bühne: SC.celebrate (celebrate.js)
  // entscheidet anlassbezogen über die Inszenierung und baut Inhalt + Buttons selbst
  // in den Mount-Punkt. Die A11y-Ansage (aria-live) und der Fokus aufs Haupt-CTA
  // kommen ebenfalls aus dem Modul – die Verdrahtung steckt im Render-Dispatch (app.js).
  function renderDone() {
    return `<section class="screen"><div id="cb-mount" class="cb-mount"></div></section>`;
  }

  // ---------- RUTA-PASS (BADGES) ----------
  // Fortschrittstext eines noch nicht erreichten Badges (je nach Metrik-Typ).
  function badgeProgressText(b) {
    if (b.type === "categoryMastery") return t("profile.badgeMasteryGoal", { pct: Math.round((b.value || 0) * 100) });
    if (b.type === "flag") return t("profile.badgeLocked");
    const cur = Math.min(Math.round(b.value || 0), b.target);
    return `${cur} / ${b.target}`;
  }

  // Eine Stempel-Kachel. Drei Zustände: freigeschaltet, gesperrt, geheim-gesperrt.
  function badgeCard(b) {
    if (b.unlocked) {
      // Freigeschaltete Stempel lassen sich als Sharepic teilen (sofern verfügbar).
      const share = canShare()
        ? `<button class="badge__share" type="button" data-action="share-badge" data-id="${esc(b.id)}"
                   aria-label="${esc(t("profile.badgeShareLabel", { name: b.name }))}">${esc(t("profile.badgeShare"))}</button>`
        : "";
      return `
        <div class="badge is-unlocked">
          <span class="badge__icon" aria-hidden="true">${esc(b.icon)}</span>
          <span class="badge__check" aria-hidden="true">✓</span>
          <span class="badge__name">${esc(b.name)}</span>
          <span class="badge__desc">${esc(b.unlockedText || b.description)}</span>
          ${share}
        </div>`;
    }
    if (b.secret) {
      return `
        <div class="badge is-locked badge--secret" aria-label="${esc(t("profile.badgeSecretLabel"))}">
          <span class="badge__icon" aria-hidden="true">${renderIcon("lc:help-circle")}</span>
          <span class="badge__name">${esc(t("profile.badgeSecretName"))}</span>
          <span class="badge__desc">${esc(t("profile.badgeSecretDesc"))}</span>
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
            <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
            <div class="topbar__title">${renderIcon("lc:medal")} ${esc(t("profile.rutaPass"))}</div>
            <span></span>
          </div>
          <p class="stat-empty">${esc(t("profile.passUnavailable"))}</p>
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
          <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
          <div class="topbar__title">${renderIcon("lc:medal")} ${esc(t("profile.rutaPass"))}</div>
          <div class="topbar__counter">${vm.unlocked}/${vm.total}</div>
        </div>

        <div class="passhero">
          <p class="passhero__sub">${esc(t(isLocalsTrk() ? "profile.passHeroCurso" : "profile.passHero"))}</p>
          <div class="passhero__bar"><div class="passhero__fill" style="width:${pct}%"></div></div>
          <p class="passhero__meta">${esc(t("profile.passMeta", { unlocked: vm.unlocked, total: vm.total, pct }))}</p>
        </div>

        ${groups}
      </section>`;
  }

  // Kurze Glückwunsch-Einblendung nach frisch freigeschalteten Badges.
  // Liegt als eigene Ebene über dem Screen; tippen führt zum Ruta-Pass.
  function badgeToast(list, name) {
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
    const head = name
      ? (list.length > 1 ? t("profile.badgeNewMultiName", { n: list.length, name }) : t("profile.badgeNewOneName", { name }))
      : (list.length > 1 ? t("profile.badgeNewMulti", { n: list.length }) : t("profile.badgeNewOne"));
    return `
      <button class="btoast" data-action="open-badges" aria-label="${esc(t("profile.badgeToastLabel", { head }))}">
        <span class="btoast__head">${renderIcon("lc:medal")} ${esc(head)}</span>
        ${items}
      </button>`;
  }

  // Schlichter Hinweis-Toast (gleiche Optik/Ebene wie die Badge-Einblendung),
  // z.B. wenn das Speichern fehlschlägt. Tippen blendet ihn aus.
  function noticeToast(text) {
    return `
      <button class="btoast" data-action="dismiss-notice" aria-live="assertive">
        <span class="btoast__head">${renderIcon("lc:alert-triangle")} ${esc(text)}</span>
      </button>`;
  }

  // „Neue Version – jetzt laden“-Banner. Schwebt unten über der Reiter-Leiste,
  // wenn ein neuer Service Worker installiert ist und auf Aktivierung wartet.
  // Ein Tap aktiviert ihn und lädt die App kontrolliert neu (siehe applyUpdate).
  function updateBanner() {
    return `
      <div class="updbar" role="status" aria-live="polite">
        <span class="updbar__text">${esc(t("profile.updReadyText"))}</span>
        <button class="updbar__btn" data-action="apply-update">${esc(t("profile.updReadyBtn"))}</button>
        <button class="updbar__close" data-action="dismiss-sw-update" aria-label="${esc(t("common.cancel"))}">✕</button>
      </div>`;
  }

  // „Was ist neu?“-Fenster nach einem Update. Zeigt je Version, WAS sich
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
          <div class="upd__head">${renderIcon("lc:party-popper")} <span id="upd-title">${esc(t("profile.updTitle"))}</span></div>
          ${blocks}
          <div class="upd__how">
            <div class="upd__how-title">${esc(t("profile.updHowTitle"))}</div>
            <p class="upd__how-text">${esc(t("profile.updHowText"))}</p>
          </div>
          <div class="upd__actions">
            <button class="ghostbtn" data-action="reload-app">${esc(t("profile.updReload"))}</button>
            <button class="cta upd__ok" data-action="dismiss-update">${esc(t("profile.updUnderstood"))}</button>
          </div>
        </div>
      </div>`;
  }

  // ---------- STATISTIK ----------
  // Statusfarben/-texte zentral, damit Liste & Detail gleich aussehen.
  // label als Funktion, damit der Text der aktiven UI-Sprache folgt (kein einmaliges Binden).
  const STATUS_META = {
    new:      { label: () => t("profile.statNew"),       color: "var(--muted)" },
    learning: { label: () => t("profile.statLearning"),  color: "var(--warn)" },
    firming:  { label: () => t("profile.statFirming"),   color: "var(--easy)" },
    mastered: { label: () => t("profile.statMastered"),  color: "var(--ok)" },
  };

  // Anzeige-Status: "fast geschafft" ist eine Teilmenge von "am Lernen" (statusOf
  // kennt es nicht – das hält Badges/Verteilung/Strecke bei drei Stufen). Nur für
  // Punkt/Label in Liste & Detail blenden wir die Zwischenstufe ein.
  function displayStatus(s) {
    return s.status === "learning" && s.firming ? "firming" : s.status;
  }

  // Verlaufs-Punkte: je Bewertung ein farbiger Punkt (rot/grün/blau).
  function historyDots(hist) {
    if (!hist || !hist.length) return "";
    // Object.create(null): die Verlaufszeichen kommen aus localStorage –
    // Lookups dürfen nie Prototype-Properties treffen ("constructor",
    // "__proto__" …), sonst landet Funktions-Quelltext im style-Attribut.
    const color = Object.create(null);
    color.a = "var(--no)"; color.g = "var(--ok)"; color.e = "var(--easy)";
    const title = Object.create(null);
    title.a = t("profile.statAgain"); title.g = t("profile.statGood"); title.e = t("profile.statEasy");
    const dots = hist
      .map((ch) => `<span class="hdot" aria-hidden="true" style="background:${color[ch] || "var(--muted)"}" title="${title[ch] || ""}"></span>`)
      .join("");
    // Textzusammenfassung für Screenreader (Farbe allein reicht nicht).
    const count = Object.create(null);
    count.a = 0; count.g = 0; count.e = 0;
    hist.forEach((ch) => { if (count[ch] != null) count[ch]++; });
    const label = t("profile.statHistory", { easy: count.e, good: count.g, again: count.a });
    return `<div class="hdots" role="img" aria-label="${label}">${dots}</div>`;
  }

  // Trefferquote als kleiner Balken (grün), eingefärbt nach Höhe.
  function rateBadge(rate) {
    if (rate === null) return `<span class="srate srate--none">–</span>`;
    const cls = rate >= 80 ? "srate--good" : rate >= 50 ? "srate--mid" : "srate--bad";
    return `<span class="srate ${cls}">${rate}%</span>`;
  }

  // Streckenkarte: der Lernfortschritt als Bus-Strecke (on-brand „Ruta“). Drei
  // Haltestellen Neu → Am Lernen → Gemeistert; der Bus (🚌) fährt mit der
  // Meister-Quote voran. Reine Anzeige aus der vorhandenen stats.overview.
  function routeMap(ov) {
    const pct = ov.total ? Math.round((ov.mastered / ov.total) * 100) : 0;
    const stops = [
      { icon: "lc:sparkles", label: t("profile.routeNew"),       n: ov.neu,      cls: "is-new",    at: 0 },
      { icon: "lc:book-open", label: t("profile.routeLearning"),  n: ov.learning, cls: "is-learn",  at: 50 },
      { icon: "lc:award", label: t("profile.routeMastered"),  n: ov.mastered, cls: "is-master", at: 100 },
    ];
    // Haltestellen-Punkte sitzen auf der Linie, Beschriftung läuft im
    // normalen Fluss darunter – so überlappt nichts (auch bei 0 %).
    const nodesHtml = stops
      .map((s) => `<span class="route__node ${s.cls}" style="left:${s.at}%" aria-hidden="true"></span>`)
      .join("");
    const stopsHtml = stops.map((s) => `
      <div class="route__stop ${s.cls}">
        <span class="route__n">${s.n}</span>
        <span class="route__lbl">${renderIcon(s.icon)} ${esc(s.label)}</span>
      </div>`).join("");
    return `
      <div class="route" role="img" aria-label="${esc(t("profile.routeAria", { neu: ov.neu, learning: ov.learning, mastered: ov.mastered, pct }))}">
        <div class="route__head">
          <span class="route__cap">${esc(t("profile.routeCap"))}</span>
          <span class="route__pct">${esc(t("profile.routePct", { pct }))}</span>
        </div>
        <div class="route__track">
          <div class="route__fill" style="width:${pct}%"></div>
          ${nodesHtml}
          <span class="route__bus" style="left:${pct}%" aria-hidden="true">${renderIcon("lc:bus")}</span>
        </div>
        <div class="route__stops">${stopsHtml}</div>
      </div>`;
  }

  function renderStats(vm) {
    const ov = vm.overview;

    const kpis = `
      <div class="kpis">
        <div class="kpi"><div class="kpi__num">${ov.rate === null ? "–" : ov.rate + "%"}</div><div class="kpi__lbl">${esc(t("profile.kpiHitRate"))}</div></div>
        <div class="kpi"><div class="kpi__num">${ov.seenCards}<span class="kpi__of">/${ov.total}</span></div><div class="kpi__lbl">${esc(t("profile.kpiLearned"))}</div></div>
        <div class="kpi"><div class="kpi__num">${ov.mastered}</div><div class="kpi__lbl">${esc(t("profile.kpiMastered"))}</div></div>
        <div class="kpi"><div class="kpi__num">${ov.hard}</div><div class="kpi__lbl">${esc(t("profile.kpiHard"))}</div></div>
      </div>`;

    // Status-Verteilung als gestapelter Balken.
    const seg = (n, color) => ov.total ? `<span style="flex:${n};background:${color}"></span>` : "";
    const distribution = `
      <div class="dist">
        <div class="dist__bar">
          ${seg(ov.mastered, "var(--ok)")}${seg(ov.learning, "var(--warn)")}${seg(ov.neu, "rgba(45,27,18,0.16)")}
        </div>
        <div class="dist__legend">
          <span><i style="background:var(--ok)"></i>${esc(t("profile.distMastered", { n: ov.mastered }))}</span>
          <span><i style="background:var(--warn)"></i>${esc(t("profile.distLearning", { n: ov.learning }))}</span>
          <span><i style="background:rgba(45,27,18,0.16)"></i>${esc(t("profile.distNew", { n: ov.neu }))}</span>
        </div>
      </div>`;

    // Auf Anhieb vs. nach Übung.
    const firstTry = `
      <div class="splitstat">
        <div class="splitstat__item">${t("profile.splitFirstTry", { n: ov.firstTry })}</div>
        <div class="splitstat__item">${t("profile.splitNeedPractice", { n: ov.needPractice })}</div>
      </div>`;

    // Erklärt, was "gemeistert" bedeutet, und zeigt die Zwischenstufe "fast
    // geschafft" – so wirkt "0 gemeistert" am Anfang nicht entmutigend.
    const masteryNote = ov.seenCards > 0 ? `
      <div class="mnote">
        ${ov.firming > 0 ? `<span class="mnote__firm"><i style="background:var(--easy)"></i>${esc(t("profile.masteryFirming", { n: ov.firming }))}</span>` : ""}
        <span class="mnote__hint">${esc(t("profile.masteryHint", { days: vm.masteredDays }))}</span>
      </div>` : "";

    const chips = vm.filters
      .map((f) => `<button class="schip ${vm.filter === f.id ? "is-active" : ""}" data-action="set-stats-filter" data-filter="${f.id}">${esc(f.label)} <span class="schip__n">${f.count}</span></button>`)
      .join("");

    const rows = vm.list.length
      ? vm.list.map(statRow).join("") + (vm.listMore ? `<p class="stat-more">${esc(t("profile.statsMore", { n: vm.listMore }))}</p>` : "")
      : `<p class="stat-empty">${esc(t("profile.statsEmpty"))}</p>`;

    return `
      <section class="screen">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
          <div class="topbar__title">${esc(t("profile.statsTitle"))}</div>
          <div class="topbar__counter">${ov.seenCards}/${ov.total}</div>
        </div>
        ${xpBanner(vm.xp)}
        ${vm.xp && vm.xp.xp ? shareBlock(vm.shareFormat, "share-rank", t("profile.shareRank")) : ""}
        ${kpis}
        ${routeMap(ov)}
        ${distribution}
        ${masteryNote}
        ${firstTry}
        ${ov.seenCards > 0 ? shareBlock(vm.shareFormat, "share-stats", t("common.shareProgress")) : ""}
        <div class="schips" role="group" aria-label="${esc(t("profile.statsFilter"))}">${chips}</div>
        <div class="statlist">${rows}</div>
        ${ov.seenCards > 0
          ? `<button class="dangerbtn" data-action="reset-progress">${esc(t("profile.resetProgress"))}</button>`
          : ""}
      </section>`;
  }

  // Eine Zeile in der Statistik-Liste (klickbar -> Detailseite).
  function statRow(r) {
    const meta = STATUS_META[displayStatus(r.s)] || STATUS_META.new;
    const seen = r.s.seen > 0 ? t("profile.seenTimes", { n: r.s.seen }) : t("profile.statNewWord");
    return `
      <button class="statrow" data-action="open-card" data-id="${esc(r.id)}" data-back="stats">
        <span class="statrow__dot" style="background:${meta.color}" title="${esc(meta.label())}"></span>
        <span class="statrow__main">
          <span class="statrow__de">${esc(r.de)}</span>
          <span class="statrow__es" lang="${learnLangCode()}">${esc(r.es)}</span>
          <span class="statrow__meta">${renderIcon(r.catLc || r.catIcon)} ${esc(r.catLabel)} · ${esc(seen)}${r.s.lapses ? ` · ${esc(t("profile.forgotTimes", { n: r.s.lapses }))}` : ""}</span>
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
          <div class="topbar"><button class="iconbtn" data-action="card-back" aria-label="${esc(t("common.backShort"))}">‹</button><div class="topbar__title">${esc(t("common.cardWord"))}</div><span></span></div>
          <p class="stat-empty">${esc(t("common.cardNotFound"))}</p>
        </section>`;
    }
    const s = vm.s;
    const meta = STATUS_META[displayStatus(s)] || STATUS_META.new;
    const accent = vm.accent;
    const tip = vm.tip ? `<div class="cardx__tip">${renderIcon("lc:audio-lines")} ${esc(vm.tip)}</div>` : "";

    // Aufschlüsselung der Bewertungen als kleine Balken.
    const total = s.seen || 1;
    const bar = (label, n, color) => `
      <div class="brk">
        <div class="brk__top"><span>${label}</span><span>${n}</span></div>
        <div class="brk__track"><div class="brk__fill" style="width:${Math.round((n / total) * 100)}%;background:${color}"></div></div>
      </div>`;

    const firstTryBadge = s.seen === 0 ? ""
      : s.firstTry
        ? `<span class="tagok">${esc(t("profile.cardFirstTry"))}</span>`
        : `<span class="tagwarn">${esc(t("profile.cardNeededPractice"))}</span>`;

    const facts = `
      <div class="facts">
        <div class="fact"><span class="fact__k">${esc(t("profile.factStatus"))}</span><span class="fact__v" style="color:${meta.color}">${esc(meta.label())}</span></div>
        <div class="fact"><span class="fact__k">${esc(t("profile.factHitRate"))}</span><span class="fact__v">${s.rate === null ? "–" : s.rate + "%"}</span></div>
        <div class="fact"><span class="fact__k">${esc(t("profile.factSeen"))}</span><span class="fact__v">${s.seen}×</span></div>
        <div class="fact"><span class="fact__k">${esc(t("profile.factForgotten"))}</span><span class="fact__v">${s.lapses}×</span></div>
        <div class="fact"><span class="fact__k">${esc(t("profile.factFirstLearned"))}</span><span class="fact__v">${esc(vm.firstText)}</span></div>
        <div class="fact"><span class="fact__k">${esc(t("profile.factLast"))}</span><span class="fact__v">${esc(vm.lastText)}</span></div>
        <div class="fact"><span class="fact__k">${esc(t("profile.factNextReview"))}</span><span class="fact__v">${esc(vm.dueText)}</span></div>
        <div class="fact"><span class="fact__k">${esc(t("profile.factEase"))}</span><span class="fact__v">${typeof s.ease === "number" && isFinite(s.ease) ? s.ease.toFixed(2) : "–"}</span></div>
      </div>`;

    const breakdown = s.seen > 0 ? `
      <div class="breakdown">
        ${bar(t("profile.brkEasy"), s.easy, "var(--easy)")}
        ${bar(t("profile.brkGood"), s.good, "var(--ok)")}
        ${bar(t("profile.brkAgain"), s.again, "var(--no)")}
      </div>` : "";

    const history = s.history.length
      ? `<div class="cardx__history"><span class="cardx__history-lbl">${esc(t("profile.cardHistory"))}</span>${historyDots(s.history)}</div>`
      : "";

    return `
      <section class="screen" style="--from:${esc(accent[0])};--to:${esc(accent[1])}">
        <div class="topbar">
          <button class="iconbtn" data-action="card-back" aria-label="${esc(t("common.backShort"))}">‹</button>
          <div class="topbar__title">${renderIcon(vm.catLc || vm.catIcon)} ${esc(vm.catLabel)}</div>
          ${favStar(vm.id, vm.isFav, { cls: "favstar--top" })}
        </div>

        <div class="cardx">
          <div class="cardx__de">${esc(vm.de)}</div>
          <div class="cardx__es" lang="${learnLangCode()}">${esc(vm.es)}</div>
          ${colorSwatch(vm.swatch)}
          ${tip}
          <div class="cardx__tags">${firstTryBadge}</div>
          ${contextBlock(vm.context, vm.contextOpen)}
        </div>

        ${facts}
        ${breakdown}
        ${history}

        <button class="cta" data-action="study-one" data-id="${esc(vm.id)}">${esc(t("profile.studyThisCard"))}</button>
        ${shareBlock(vm.shareFormat, "share-card", t("common.shareImage"))}
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
      : `<p class="stat-empty">${esc(t("profile.editorEmpty"))}</p>`;

    return `
      <section class="screen">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
          <div class="topbar__title">${esc(t("profile.editorTitle"))}</div>
          <div class="topbar__counter">${vm.cards.length}</div>
        </div>

        ${msg}

        <form class="editor" data-action="save-card">
          <label class="ed-field">
            <span class="ed-label">${esc(t("profile.edQuestionDe"))}</span>
            <input class="ed-input" id="card-de" type="text" autocomplete="off" placeholder="${esc(t("profile.edQuestionDePlaceholder"))}" />
          </label>
          <label class="ed-field">
            <span class="ed-label">${esc(t("profile.edAnswerEs"))}</span>
            <input class="ed-input" id="card-es" type="text" autocomplete="off" autocapitalize="off"
                   placeholder="${esc(t("profile.edAnswerEsPlaceholder"))}" />
            <span class="ed-hint">${esc(t("profile.edAnswerHint"))}</span>
          </label>
          <label class="ed-field">
            <span class="ed-label">${esc(t("profile.edTip"))} <em>${esc(t("profile.edTipOptional"))}</em></span>
            <input class="ed-input" id="card-tip" type="text" autocomplete="off" placeholder="${esc(t("profile.edTipPlaceholder"))}" />
          </label>
          <div class="ed-row">
            <label class="ed-field">
              <span class="ed-label">${esc(t("profile.edArea"))}</span>
              <select class="ed-input" id="card-cat">${catOpts}</select>
            </label>
            <label class="ed-field">
              <span class="ed-label">${esc(t("profile.edLevel"))}</span>
              <select class="ed-input" id="card-lvl">${lvlOpts}</select>
            </label>
          </div>
          <button class="cta" type="submit">${esc(t("profile.edAddCard"))}</button>
        </form>

        <h3 class="ed-h">${esc(t("profile.edYourCards"))}</h3>
        <div class="ed-list">${list}</div>
      </section>`;
  }

  function editorItem(c) {
    const tip = c.tip ? ` · ${renderIcon("lc:audio-lines")} ${esc(c.tip)}` : "";
    return `
      <div class="ed-item">
        <div class="ed-item__main">
          <div class="ed-item__de">${esc(c.de)}</div>
          <div class="ed-item__es" lang="${learnLangCode()}">${esc(c.es)}</div>
          <div class="ed-item__meta">${renderIcon(c.catLc || c.catIcon)} ${esc(c.catLabel)}${c.lvlShort ? ` · ${esc(c.lvlShort)}` : ""}${tip}</div>
        </div>
        <button class="ed-del" type="button" data-action="delete-card" data-id="${esc(c.id)}" aria-label="${esc(t("common.delete"))}" title="${esc(t("common.deleteTitle"))}">${renderIcon("lc:trash-2")}</button>
      </div>`;
  }

  // Der Themenblock-Baustein sect(icon,title,body,id) ist nach view-helpers.js
  // (SC.view) gewandert – geteilt von renderInfo, renderConjugacion und dem
  // Tiempos-Feature-Modul. Hier nur noch oben aus SC.view destrukturiert.

  // SPICKZETTEL (Survival-Schnellzugriff) ist nach features/spickzettel.js
  // (SC.spickzettel) gewandert – VM, Handler und Render leben dort zusammen.

  // ---------- MI LÉXICO (Favoriten – persönliches Lexikon) ----------
  // Vom Nutzer gemerkte Wörter/Sätze: eine Liste (neueste zuerst) mit Vorlesen,
  // Großanzeige und Entfernen, plus ein Formular für eigene Einträge. Über den
  // Homescreen-Shortcut (?a=favoritos) direkt erreichbar.
  // Kategorie-Auswahl für eigene Einträge (Hinzufügen + Bearbeiten): „— Eigene
  // Einträge" (kein Bereich) plus alle Kategorien. So landet ein selbst getippter
  // Eintrag wahlweise in einer Themen-Gruppe statt immer unter „Eigene Einträge".
  function favCatSelect(id, selected, vm) {
    const opts = `<option value=""${selected ? "" : " selected"}>${esc(t("favorites.catNone"))}</option>` +
      vm.cats.map((c) => `<option value="${esc(c.id)}"${c.id === selected ? " selected" : ""}>${esc(c.icon)} ${esc(c.label)}</option>`).join("");
    return `<label class="fav-add__field"><span>${esc(t("favorites.addCat"))}</span>
            <select id="${esc(id)}" class="fav-add__select">${opts}</select></label>`;
  }

  // Eine Favoriten-Zeile – oder, wenn dieser Eintrag gerade bearbeitet wird, das
  // Inline-Edit-Formular an seiner Stelle. Die Edit-Taste gibt es nur bei eigenen
  // (getippten) Einträgen; Karten-/Satz-Favoriten haben keinen freien Text.
  function favRow(it, vm) {
    if (it.editing) {
      return `
        <form class="fav-edit" data-action="fav-edit-save" data-id="${esc(it.id)}">
          <label class="fav-add__field"><span>${esc(t("favorites.addDe"))}</span>
            <input id="fav-edit-de" type="text" maxlength="500" autocomplete="off" value="${esc(it.de)}" /></label>
          <label class="fav-add__field"><span>${esc(t("favorites.addEs"))}</span>
            <input id="fav-edit-es" type="text" maxlength="500" lang="${learnLangCode()}" autocomplete="off" autocapitalize="none" value="${esc(it.es)}" /></label>
          <label class="fav-add__field"><span>${esc(t("favorites.addTip"))}</span>
            <input id="fav-edit-tip" type="text" maxlength="500" autocomplete="off" value="${esc(it.tip)}" /></label>
          ${favCatSelect("fav-edit-cat", it.catId, vm)}
          ${vm.editMsg ? `<p class="fav-add__msg fav-add__msg--${esc(vm.editMsg.type)}" role="status">${esc(vm.editMsg.text)}</p>` : ""}
          <div class="fav-edit__actions">
            <button class="cta" type="submit">${esc(t("favorites.saveBtn"))}</button>
            <button class="ghostbtn" type="button" data-action="fav-edit-cancel">${esc(t("favorites.cancelBtn"))}</button>
          </div>
        </form>`;
    }
    return `
      <div class="fav-row">
        <button class="fav-row__main" type="button" data-action="fav-show" data-id="${esc(it.id)}"
                title="${esc(t("favorites.show"))}">
          <span class="fav-row__icon" aria-hidden="true">${renderIcon(it.catLc || it.catIcon)}</span>
          <span class="fav-row__text">
            <span class="fav-row__es" lang="${learnLangCode()}">${esc(it.es)}</span>
            <span class="fav-row__de">${esc(it.de)}</span>
            ${it.tip ? `<span class="fav-row__tip">${renderIcon("lc:audio-lines")} ${esc(it.tip)}</span>` : ""}
          </span>
        </button>
        ${vm.speakable
          ? `<button class="fav-row__speak" type="button" data-action="fav-speak" data-id="${esc(it.id)}" aria-label="${esc(t("favorites.listen"))}" title="${esc(t("favorites.listen"))}">${renderIcon("lc:volume-2")}</button>`
          : ""}
        ${it.custom
          ? `<button class="fav-row__edit" type="button" data-action="fav-edit" data-id="${esc(it.id)}" aria-label="${esc(t("favorites.edit"))}" title="${esc(t("favorites.edit"))}">${renderIcon("lc:square-pen")}</button>`
          : ""}
        <button class="fav-row__rm" type="button" data-action="fav-remove" data-id="${esc(it.id)}" aria-label="${esc(t("favorites.remove"))}" title="${esc(t("favorites.remove"))}">★</button>
      </div>`;
  }

  // Eine Herkunfts-Gruppe: tappbare Überschrift (Icon + Modul/Kategorie + Anzahl) zum
  // Ein-/Ausklappen + Karten. Beim aktiven Filter wird der Klappzustand ignoriert,
  // damit Treffer nie hinter einer eingeklappten Gruppe verschwinden.
  function favGroup(g, vm) {
    const collapsed = !vm.query && vm.collapsed && vm.collapsed[g.key];
    return `
      <button class="fav-group" type="button" data-action="fav-group-toggle" data-key="${esc(g.key)}"
              aria-expanded="${collapsed ? "false" : "true"}" aria-label="${esc(t("favorites.groupToggle"))}">
        <span class="fav-group__chev" aria-hidden="true">${collapsed ? "▸" : "▾"}</span>
        <span class="fav-group__icon" aria-hidden="true">${renderIcon(g.lc || g.icon)}</span>
        <span class="fav-group__label">${esc(g.label)}</span>
        <span class="fav-group__n">${g.items.length}</span>
      </button>
      ${collapsed ? "" : `<div class="fav-list">${g.items.map((it) => favRow(it, vm)).join("")}</div>`}`;
  }

  // Nur die Trefferliste (Überschrift + Gruppen bzw. Leer-/Kein-Treffer-Hinweis) –
  // im Voll-Render UND beim Live-Filtern (app.js updateFavList) genutzt, deshalb als
  // eigene, exportierte Funktion.
  function favoritesList(vm) {
    if (!vm.hasAny) {
      return `<p class="stat-empty">${esc(t("favorites.empty"))}</p>
         <p class="fav-emptyhint">${esc(t("favorites.emptyHint"))}</p>`;
    }
    if (vm.noMatch) {
      return `<p class="fav-emptyhint">${esc(t("favorites.filterNone", { q: vm.query }))}</p>`;
    }
    const n = vm.query ? vm.filtered : vm.count;
    return `<p class="sectioncap">${esc(t("favorites.listCap", { n }))}</p>
       ${vm.groups.map((g) => favGroup(g, vm)).join("")}`;
  }

  function renderFavorites(vm) {
    // Schnellsuche im Lexikon (nur, wenn es überhaupt Einträge gibt). Liegt AUSSERHALB
    // von #fav-results, damit das Feld beim Live-Filtern Fokus + Cursor behält.
    const filter = vm.hasAny ? `
      <div class="searchfield fav-filter">
        <span class="searchfield__icon" aria-hidden="true">${renderIcon("lc:search")}</span>
        <input id="fav-filter" class="searchfield__input" type="search" inputmode="search"
               autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"
               placeholder="${esc(t("favorites.filterPlaceholder"))}" aria-label="${esc(t("favorites.filterPlaceholder"))}"
               value="${esc(vm.query)}" />
        <button class="searchfield__clear" type="button" data-action="fav-filter-clear" aria-label="${esc(t("favorites.filterClear"))}">✕</button>
      </div>` : "";

    // Eigenen Eintrag hinzufügen: eingeklappt UNTER der Liste (weniger prominent als
    // früher ganz oben). Öffnet automatisch, wenn eine Rückmeldung oder ein noch nicht
    // gespeicherter Entwurf ansteht; die Felder werden dann aus dem Entwurf vorbefüllt.
    const addForm = `
      <details class="fav-add-wrap"${vm.addOpen ? " open" : ""}>
        <summary class="fav-add-toggle">＋ ${esc(t("favorites.addCap"))}</summary>
        <form class="fav-add" data-action="fav-add">
          <label class="fav-add__field"><span>${esc(t("favorites.addDe"))}</span>
            <input id="fav-de" type="text" maxlength="500" autocomplete="off"
                   placeholder="${esc(t("favorites.dePlaceholder"))}" value="${esc(vm.draft.de)}" /></label>
          <label class="fav-add__field"><span>${esc(t("favorites.addEs"))}</span>
            <input id="fav-es" type="text" maxlength="500" lang="${learnLangCode()}" autocomplete="off" autocapitalize="none"
                   placeholder="${esc(t("favorites.esPlaceholder"))}" value="${esc(vm.draft.es)}" /></label>
          <label class="fav-add__field"><span>${esc(t("favorites.addTip"))}</span>
            <input id="fav-tip" type="text" maxlength="500" autocomplete="off"
                   placeholder="${esc(t("favorites.tipPlaceholder"))}" value="${esc(vm.draft.tip)}" /></label>
          ${favCatSelect("fav-cat", vm.draft.cat, vm)}
          ${vm.msg ? `<p class="fav-add__msg fav-add__msg--${esc(vm.msg.type)}" role="status">${esc(vm.msg.text)}</p>` : ""}
          <button class="cta" type="submit">${esc(t("favorites.addBtn"))}</button>
        </form>
      </details>`;

    // „Rückgängig"-Leiste nach dem Entfernen (schwebt unten, blendet sich selbst aus).
    const undo = vm.undo ? `
      <div class="fav-undo" role="status">
        <span class="fav-undo__text">${esc(t("favorites.removed"))}</span>
        <button class="fav-undo__btn" type="button" data-action="fav-undo">${esc(t("favorites.undo"))}</button>
      </div>` : "";

    // Werkzeugleiste: ganzes Lexikon üben (normaler Lern-Pfad mit SRS) bzw. teilen/exportieren.
    const toolbar = vm.hasAny ? `
      <div class="fav-toolbar">
        <button class="cta fav-toolbar__btn" type="button" data-action="fav-practice-start">▶ ${esc(t("favorites.practice"))}</button>
        <button class="ghostbtn fav-toolbar__btn" type="button" data-action="fav-share">↗ ${esc(t("favorites.share"))}</button>
      </div>` : "";

    // Großanzeige: angetippter Eintrag bildschirmfüllend – zum Herzeigen, mit Herkunft.
    const show = vm.show ? `
      <div class="sz-show" data-action="fav-close" role="dialog" aria-modal="true" aria-label="${esc(t("favorites.showLabel"))}">
        <div class="sz-show__inner">
          ${vm.showSrc ? `<p class="sz-show__src">${renderIcon(vm.showSrc.lc || vm.showSrc.icon)} ${esc(vm.showSrc.label)}</p>` : ""}
          <p class="sz-show__es" lang="${learnLangCode()}">${esc(vm.show.es)}</p>
          <p class="sz-show__de">${esc(vm.show.de)}</p>
          ${vm.show.tip ? `<p class="sz-show__tip">${renderIcon("lc:audio-lines")} ${esc(vm.show.tip)}</p>` : ""}
          <div class="sz-show__actions">
            ${vm.speakable
              ? `<button class="cta" type="button" data-action="fav-speak" data-id="${esc(vm.show.id)}">${esc(t("favorites.listenBig"))}</button>`
              : ""}
            <button class="ghostbtn" type="button" data-action="fav-close">${esc(t("common.close"))}</button>
          </div>
        </div>
      </div>` : "";

    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:star")} ` + t("favorites.title"), "home")}
        <p class="hm-intro">${esc(t("favorites.intro"))}</p>
        ${toolbar}
        ${filter}
        <div id="fav-results">${favoritesList(vm)}</div>
        ${addForm}
        ${undo}
        ${show}
      </section>`;
  }

  // PRECIOS AL OÍDO (Preis-Hörtrainer) ist nach features/precios.js
  // (SC.precios) gewandert – VMs, Handler und Render leben dort zusammen.

  // ---------- ZIEL-PICKER (Modo profe / Aktivitätsblatt) ----------
  // Statt eines nativen <select> mit <optgroup> (auf Android nur ein nüchterner
  // Vollbild-Dialog) ein hübsches Modal mit Erklärung je Gruppe: WAS sie ist und
  // WANN die Lehrkraft/Reiseleitung sie wählen sollte. Geteilt von beiden Stellen
  // über ctx ("task" | "sheet"); die Auswahl landet via data-action="pick-target".
  const TARGET_GROUPS = [
    { id: "pretrip",  icon: "lc:calendar", labelKey: "teacher.grpPretrip",  helpKey: "teacher.grpPretripHelp" },
    { id: "preset",   icon: "lc:backpack", labelKey: "teacher.grpPreset",   helpKey: "teacher.grpPresetHelp" },
    { id: "category", icon: "lc:package", labelKey: "teacher.grpCategory", helpKey: "teacher.grpCategoryHelp" },
  ];
  // Abschnitte der Bundle-Vorlagen im Picker (Reihenfolge = Anzeigereihenfolge).
  const BUNDLE_GROUPS = [
    { id: "destino",   labelKey: "teacher.bgDestino" },
    { id: "kurs",      labelKey: "teacher.bgKurs" },
    { id: "situation", labelKey: "teacher.bgSituation" },
    { id: "orga",      labelKey: "teacher.bgOrga" },
  ];

  // Gruppe (pretrip/preset/category) zum Ziel-Wert „kind:scope". Passt nichts,
  // gibt es bewusst KEINE Gruppe zurück (null) – statt still als „category" zu
  // labeln; die Aufrufer rendern dann ohne Gruppen-Kicker.
  function targetGroupOf(value) {
    return TARGET_GROUPS.find((x) => String(value || "").indexOf(x.id + ":") === 0) || null;
  }

  // Locals-Track: der „Pre-Trip"-Block ist hier der Lernpfad – Label/Hilfe entsprechend.
  const isLocalsTrk = () => !!(window.SC.track && window.SC.track.id && window.SC.track.id() === "es-en");
  const tgLabelKey = (g) => (isLocalsTrk() && g.id === "pretrip") ? "teacher.grpCurso" : g.labelKey;
  const tgHelpKey = (g) => (isLocalsTrk() && g.id === "pretrip") ? "teacher.grpCursoHelp" : g.helpKey;

  // Tappbarer „Select-Ersatz": zeigt die aktuelle Auswahl und öffnet das Modal.
  //   sheet (Aktivitätsblatt): EIN Ziel → Gruppe + Label.
  //   task  (Modo profe): Auswahl-Zusammenfassung (keins / Einzelaufgabe / Bundle).
  function targetField(ctx, opts) {
    opts = opts || {};
    let valLine;
    if (ctx === "sheet") {
      const cur = (opts.targets || []).find((x) => x.value === opts.current);
      const g = cur ? targetGroupOf(cur.value) : null;
      valLine = cur
        ? `${g ? `<span class="tgt-field__kicker">${renderIcon(g.icon)} ${esc(t(tgLabelKey(g)))}</span>` : ""}<span class="tgt-field__val">${esc(cur.label)}</span>`
        : `<span class="tgt-field__val tgt-field__val--none">${esc(t("teacher.pickNone"))}</span>`;
    } else {
      const s = opts.summary || { kind: "none" };
      if (s.kind === "single") {
        valLine = `<span class="tgt-field__kicker">${esc(t("teacher.sumSingle"))}</span><span class="tgt-field__val">${esc(s.label)}</span>`;
      } else if (s.kind === "bundle") {
        valLine = `<span class="tgt-field__kicker">${renderIcon("lc:package")} ${esc(t("teacher.sumBundle"))}</span><span class="tgt-field__val">${esc(s.label)} · ${esc(t("teacher.bundleItems", { n: s.count }))}</span>`;
      } else {
        valLine = `<span class="tgt-field__val tgt-field__val--none">${esc(t("teacher.pickNone"))}</span>`;
      }
    }
    return `
      <button type="button" class="tgt-field" data-action="open-target-picker" data-ctx="${esc(ctx)}"
              aria-haspopup="dialog" aria-label="${esc(t("teacher.pickFieldLabel"))}">
        <span class="tgt-field__text">${valLine}</span>
        <span class="tgt-field__change">${esc(t("teacher.pickChange"))} ▾</span>
      </button>`;
  }

  // Eine Ziel-Optionsliste je Gruppe. selectedKeys = bereits gewählte "kind:scope".
  function targetSections(ctx, targets, selectedKeys) {
    const sel = selectedKeys || [];
    return TARGET_GROUPS.map((g) => {
      const opts = (targets || []).filter((x) => x.group === g.id);
      if (!opts.length) return "";
      const rows = opts.map((o) => {
        const active = sel.indexOf(o.value) >= 0;
        return `<button type="button" class="tgt-opt${active ? " is-active" : ""}"
                  data-action="pick-target" data-ctx="${esc(ctx)}" data-value="${esc(o.value)}"${active ? ' aria-current="true"' : ""}>
                  <span class="tgt-opt__label">${esc(o.label)}</span>
                  <span class="tgt-opt__check" aria-hidden="true">${active ? "✓" : ""}</span>
                </button>`;
      }).join("");
      return `
        <section class="tgt-group">
          <h3 class="tgt-group__title">${renderIcon(g.icon)} ${esc(t(tgLabelKey(g)))}</h3>
          <p class="tgt-group__help">${esc(t(tgHelpKey(g)))}</p>
          <div class="tgt-opts">${rows}</div>
        </section>`;
    }).join("");
  }

  // Das Modal selbst (Scrim + Karte).
  //   sheet: EIN Ziel wählen (Tipp schließt sofort).
  //   task : Mehrfachauswahl + Bundle-Vorlagen → ein Code für eine ODER mehrere
  //          Aufgaben. Vorlagen setzen die Auswahl als Startpunkt (frei anpassbar).
  function targetPickerModal(ctx, opts) {
    opts = opts || {};
    if (ctx === "sheet") {
      const selKeys = opts.current ? [opts.current] : [];
      return `
        <div class="tgt-scrim" data-action="close-target-picker">
          <div class="tgt-modal" role="dialog" aria-modal="true" aria-labelledby="tgt-title" data-action="target-stop">
            <div class="tgt-modal__head">
              <h2 class="tgt-modal__title" id="tgt-title">${renderIcon("lc:target")} ${esc(t("sheet.pickTitle"))}</h2>
              <button type="button" class="tgt-modal__x" data-action="close-target-picker" aria-label="${esc(t("teacher.pickClose"))}">✕</button>
            </div>
            <p class="tgt-modal__intro">${esc(t("sheet.pickIntro"))}</p>
            <div class="tgt-modal__body">${targetSections("sheet", opts.targets, selKeys)}</div>
            <div class="tgt-modal__foot">
              <button type="button" class="cta tgt-modal__done" data-action="close-target-picker">${esc(t("teacher.pickClose"))}</button>
            </div>
          </div>
        </div>`;
    }
    // --- task: Bundle-Vorlagen (nach Gruppe) + Mehrfachauswahl ---
    const selKeys = opts.selectedKeys || [];
    const activeBundles = opts.activeBundleIds || [];
    const bundles = opts.bundles || [];
    const bundleRow = (b) => {
      const active = activeBundles.indexOf(b.id) >= 0;
      return `<button type="button" class="tgt-bundle${active ? " is-active" : ""}"
                data-action="apply-bundle" data-bundle="${esc(b.id)}"${active ? ' aria-current="true"' : ""}>
                <span class="tgt-bundle__icon" aria-hidden="true">${renderIcon(b.icon)}</span>
                <span class="tgt-bundle__text"><span class="tgt-bundle__label">${esc(b.label)}</span>
                  <span class="tgt-bundle__meta">${esc(t("teacher.bundleItems", { n: b.count }))}</span></span>
                <span class="tgt-opt__check" aria-hidden="true">${active ? "✓" : ""}</span>
              </button>`;
    };
    // Bundles in ihre Abschnitte einsortieren (bekannte Gruppen zuerst, Rest danach).
    let bundleSubs = BUNDLE_GROUPS.map((bg) => {
      const list = bundles.filter((b) => b.group === bg.id);
      if (!list.length) return "";
      return `<h4 class="tgt-subhead">${esc(t(bg.labelKey))}</h4><div class="tgt-opts">${list.map(bundleRow).join("")}</div>`;
    }).join("");
    const known = BUNDLE_GROUPS.map((g) => g.id);
    const rest = bundles.filter((b) => known.indexOf(b.group) < 0);
    if (rest.length) bundleSubs += `<div class="tgt-opts">${rest.map(bundleRow).join("")}</div>`;
    const bundleSection = bundles.length
      ? `<section class="tgt-group">
           <h3 class="tgt-group__title">${esc(t("teacher.bundleSectionTitle"))}</h3>
           <p class="tgt-group__help">${esc(t("teacher.bundleSectionHelp"))}</p>
           ${bundleSubs}
         </section>`
      : "";
    const count = selKeys.length;
    const footCount = count
      ? esc(t("teacher.selCount", { n: count }))
      : esc(t("teacher.pickNone"));
    return `
      <div class="tgt-scrim" data-action="close-target-picker">
        <div class="tgt-modal" role="dialog" aria-modal="true" aria-labelledby="tgt-title" data-action="target-stop">
          <div class="tgt-modal__head">
            <h2 class="tgt-modal__title" id="tgt-title">${renderIcon("lc:target")} ${esc(t("teacher.pickTitle"))}</h2>
            <button type="button" class="tgt-modal__x" data-action="close-target-picker" aria-label="${esc(t("teacher.pickClose"))}">✕</button>
          </div>
          <p class="tgt-modal__intro">${esc(t("teacher.pickIntro"))} ${esc(t("teacher.multiHint"))}</p>
          <div class="tgt-modal__body">
            ${bundleSection}
            ${targetSections("task", opts.targets, selKeys)}
          </div>
          <div class="tgt-modal__foot tgt-modal__foot--task">
            <span class="tgt-foot__count">${footCount}</span>
            <span class="tgt-foot__btns">
              ${count ? `<button type="button" class="tgt-clear" data-action="clear-task-sel">${esc(t("teacher.clearSel"))}</button>` : ""}
              <button type="button" class="cta tgt-modal__done" data-action="close-target-picker">${esc(t("teacher.pickClose"))}</button>
            </span>
          </div>
        </div>
      </div>`;
  }

  // ---------- LÄNDERKUNDE (INFOSEITE) ----------
  // Dropdown mit Regionen als <optgroup>; darunter das gewählte Land mit
  // Infotexten und der Unterrubrik "Essen & Trinken".
  function renderInfo(vm) {
    const selector = countryPicker(vm.groups);

    if (!vm.country) {
      return `
        <section class="screen">
          ${infoTopbar()}
          ${selector}
          <p class="stat-empty">${esc(t("discover.infoNoCountry"))}</p>
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
      // Bild: lädt faul; bei Fehler/Offline sauber ausblenden (delegierter
      // error-Listener in app.js – Inline-onerror verbietet die CSP script-src 'self').
      const img = d.img
        ? `<img class="cinfo-dish__img" src="${esc(d.img)}" alt="${esc(d.name)}" loading="lazy"
                referrerpolicy="no-referrer" data-img-fallback="hide" />`
        : "";
      const long = d.long ? `<p class="cinfo-dish__long">${esc(d.long)}</p>` : "";
      const order = d.order
        ? `<div class="cinfo-dish__order"><span class="cinfo-dish__order-cap">${esc(t("discover.infoOrder"))}</span> <span class="cinfo-dish__order-es">„${esc(d.order)}“</span></div>`
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
              ${factRow(t("discover.infoIngredients"), d.ingredients)}
              ${factRow(t("discover.infoOrigin"), d.origin)}
              ${factRow(t("discover.infoWhen"), d.occasions)}
            </div>
            ${order}
          </div>
        </details>`;
    };
    const foods = (c.food || []).map(dish).join("");
    const drinks = (c.drink || []).map(dish).join("");

    const para = (text) => `<p class="cinfo-text">${esc(text)}</p>`;

    // Sport: kurze Einleitung, beliebteste Sportarten als Liste und die
    // Sportler, die das Land bewegen (Name + Disziplin + ein Satz). Eigennamen
    // bleiben sprachunabhängig; Notizen werden über localizeDeep lokalisiert.
    const sp = c.sports;
    let sportsSect = "";
    if (sp) {
      const sportsIntro = sp.intro ? para(sp.intro) : "";
      const popular = (sp.popular || [])
        .map((s) => `<li class="cinfo-sport"><span class="cinfo-sport__name">${esc(s.name)}</span>${s.note ? `<span class="cinfo-sport__note">${esc(s.note)}</span>` : ""}</li>`)
        .join("");
      const popularBlock = popular
        ? `<h4 class="cinfo-sub">${esc(t("discover.infoPopularSports"))}</h4><ul class="cinfo-sports">${popular}</ul>`
        : "";
      const athletes = (sp.athletes || [])
        .map((a) => `<li class="cinfo-athlete"><span class="cinfo-athlete__top"><span class="cinfo-athlete__name">${esc(a.name)}</span>${a.sport ? `<span class="cinfo-athlete__sport">${esc(a.sport)}</span>` : ""}</span>${a.note ? `<span class="cinfo-athlete__note">${esc(a.note)}</span>` : ""}</li>`)
        .join("");
      const athletesBlock = athletes
        ? `<h4 class="cinfo-sub">${esc(t("discover.infoAthletes"))}</h4><ul class="cinfo-athletes">${athletes}</ul>`
        : "";
      const sportsBody = sportsIntro + popularBlock + athletesBlock;
      if (sportsBody) sportsSect = sect("lc:goal", t("discover.infoSports"), sportsBody);
    }

    const tip = c.tip ? `<div class="cinfo-tip">💡 ${esc(c.tip)}</div>` : "";

    // Bevölkerung & Wirtschaft: Faktenzeilen (gleiche Optik wie die Speise-Fakten).
    // Nur Zeilen mit Inhalt erscheinen; fehlt alles, entfällt die ganze Sektion.
    const peopleFacts = [
      factRow(t("discover.infoPopulation"), c.population),
      factRow(t("discover.infoAgeStructure"), c.ageStructure),
      factRow(t("discover.infoGovernment"), c.government),
      factRow(t("discover.infoEconomy"), c.economy),
      factRow(t("discover.infoLivelihood"), c.livelihood),
    ].join("");
    const peopleSect = peopleFacts
      ? sect("lc:users", t("discover.infoPeople"), `<div class="cinfo-facts">${peopleFacts}</div>`)
      : "";

    // Brücke zur passenden kontinentalen Geschichte: mittelamerikanische Länder
    // führen zur Historia de Centroamérica, alle anderen (Südamerika/Karibik) zur
    // Historia de Sudamérica. Jeweils nur, wenn das Modul geladen ist.
    const inCentro = vm.country && vm.country.region === "Mittelamerika";
    const histTarget = inCentro
      ? (vm.hasHistoriaCentro ? { action: "open-historia-centro", icon: "lc:mountain", title: t("discover.histBannerCentroTitle"), sub: t("discover.histBannerCentroSub") } : null)
      : (vm.hasHistoria ? { action: "open-historia", icon: "lc:scroll", title: t("discover.histBannerTitle"), sub: t("discover.histBannerSub") } : null);
    const histBanner = histTarget ? `
      <button class="hist-banner" data-action="${histTarget.action}">
        <span class="hist-banner__icon" aria-hidden="true">${renderIcon(histTarget.icon)}</span>
        <span class="hist-banner__text">
          <span class="hist-banner__title">${esc(histTarget.title)}</span>
          <span class="hist-banner__sub">${esc(histTarget.sub)}</span>
        </span>
        <span class="hist-banner__chev" aria-hidden="true">›</span>
      </button>` : "";

    return `
      <section class="screen">
        ${infoTopbar()}
        ${selector}
        ${moduleShareBtn("paises")}
        ${histBanner}

        <div class="cinfo-head">
          <div class="cinfo-head__flag">${c.flag}</div>
          <div class="cinfo-head__main">
            <h2 class="cinfo-head__name">${esc(c.name)}</h2>
            <p class="cinfo-head__tag">${esc(c.tagline)}</p>
            <p class="cinfo-head__cap">${t("discover.infoCapital", { capital: esc(c.capital) })}</p>
          </div>
        </div>
        <button class="hist-share cinfo-share" type="button" data-action="share-country">${renderIcon("lc:upload")} ${esc(t("discover.tipsShare"))}</button>

        ${sect("lc:globe", t("discover.infoAbout"), para(c.about))}
        ${peopleSect}
        ${sect("lc:scroll", t("discover.infoHistory"), para(c.history))}
        ${sect("lc:megaphone", t("discover.infoLanguage"), para(c.language) + wordsBlock)}

        <div class="cinfo-sect cinfo-sect--food">
          <h3 class="cinfo-sect__h">${t("discover.infoFood")}</h3>
          <h4 class="cinfo-sub">${esc(t("discover.infoLocalDishes"))}</h4>
          <div class="cinfo-dishes">${foods || `<p class="cinfo-text">—</p>`}</div>
          <h4 class="cinfo-sub">${esc(t("discover.infoDrinks"))}</h4>
          <div class="cinfo-dishes">${drinks || `<p class="cinfo-text">—</p>`}</div>
        </div>

        ${sportsSect}
        ${tip}
      </section>`;
  }

  function infoTopbar() {
    return `
      <div class="topbar">
        <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
        <div class="topbar__title">${renderIcon("lc:globe")} Países y culturas</div>
        <span></span>
      </div>`;
  }

  // ---------- HISTORIA (Erklärseite Süd-/Mittelamerika) ----------
  // VM und Render (Zeitstrahl, Protagonisten, Spannungen, Fakten) wohnen jetzt im
  // Feature-Modul SC.cronologia (features/cronologia.js); app.js delegiert SCREENS.
  // Die geteilten Lesetraining-Bausteine (readingBlock/levelMeta inkl. esRich/
  // vocabBlock/quizBlock) sind nach view-helpers.js (SC.view) gewandert – auch die
  // Modulblätter (Logística/Salud), Bebidas und Bailar nutzen sie. Oben destrukturiert.


  // Der Tipp-Teilen-Knopf tipsShareBtn(cat, i) wohnt jetzt in view-helpers.js
  // (SC.view) – geteilt von Knigge/Logística/Salud/Fotos/Bailar (hier) und dem
  // Regatear-Feature-Modul. Oben aus SC.view destrukturiert.

  // ---------- REISE-KNIGGE (Etiqueta de viaje) ----------
  // VM und Render (inkl. lokaler kniggeTopbar) wohnen jetzt im Feature-Modul
  // SC.etiqueta (features/etiqueta.js); app.js delegiert SCREENS und Spotlight-
  // Vorschau. Die geteilte Länder-Auswahl (countryPicker/select-country/
  // state.countryId) bleibt controller-seitig (auch Länderkunde/Bebidas nutzen sie).


  // ---------- BEBIDAS AM/PM (Tag-/Abendgetränk pro Land) ----------
  // Ein doppelseitiges Emaille-Schild wie der Theme-Umschalter, aber pro Land:
  // oben (AM) das Morgengetränk, unten (PM) das Abendgetränk. Tippen kippt die
  // Tafel (data-action="toggle-bebida"); das gewählte Land kommt aus der
  // gemeinsamen Länder-Auswahl (state.countryId), die Formen aus art + liquid.
  // Wir nutzen dieselben Filter signPaint/signGrain wie der Theme-Schalter.

  // AM-Becher (dunkle Tinte auf cremefarbener Tafel). steam: Dampf-Pfade nur,
  // wenn warm getrunken (Tereré ist kalt -> kein Dampf). steamClass benennt die
  // CSS-Klasse, die den Dampf animiert – „beb__steam" (Bebidas, [data-beb-mode])
  // oder „themesign__steam" (Theme-Schalter im Profil, [data-theme]).
  function bebAmArt(art, cold, steamClass) {
    const sc = steamClass || "beb__steam";
    const steam3 = `<g class="${sc}" fill="none" stroke-width="4.5" stroke-linecap="round"><path d="M78 116 q-7 -9 0 -18 q7 -9 0 -18"/><path d="M92 116 q-7 -9 0 -18 q7 -9 0 -18"/><path d="M106 116 q-7 -9 0 -18 q7 -9 0 -18"/></g>`;
    const steam2 = `<g class="${sc}" fill="none" stroke-width="4" stroke-linecap="round"><path d="M80 110 q-7 -9 0 -18 q7 -9 0 -18"/><path d="M96 110 q-7 -9 0 -18 q7 -9 0 -18"/></g>`;
    if (art === "mate") {
      return `${cold ? "" : steam2}
        <circle cx="84" cy="158" r="38" stroke="none"/>
        <ellipse cx="84" cy="197" rx="17" ry="5" stroke="none"/>
        <ellipse cx="80" cy="124" rx="20" ry="7" fill="#EDE4CD" stroke="none"/>
        <path d="M60 124 a20 7 0 0 0 40 0" fill="none" stroke-width="4"/>
        <path d="M96 150 L140 96" fill="none" stroke-width="7" stroke-linecap="round"/>
        <circle cx="142" cy="92" r="7" stroke="none"/>`;
    }
    if (art === "olla") {
      return `${cold ? "" : steam2}
        <path stroke="none" d="M62 128 h52 l-5 56 a8 8 0 0 1 -8 7 h-26 a8 8 0 0 1 -8 -7 z"/>
        <path d="M66 150 l8 -6 8 6 8 -6 8 6 8 -6 6 5" fill="none" stroke="#EDE4CD" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path fill="none" stroke-width="9" d="M116 140 q20 0 20 16 q0 16 -18 16"/>`;
    }
    // cup (Standard-Kaffeetasse mit Untertasse)
    return `${cold ? "" : steam3}
      <path stroke="none" d="M58 130 h56 a6 6 0 0 1 6 6 q-2 28 -9 38 a15 15 0 0 1 -12 6 h-26 a15 15 0 0 1 -12 -6 q-7 -10 -9 -38 a6 6 0 0 1 6 -6 z"/>
      <path fill="none" stroke-width="9" d="M120 140 q20 0 20 16 q0 16 -18 17"/>
      <path stroke="none" d="M48 188 h72 q6 0 4 5 q-3 6 -40 6 q-37 0 -40 -6 q-2 -5 4 -5 z"/>`;
  }

  // PM-Glas (heller Umriss + farbige Füllung auf dunkler Tafel). Die Füllung
  // trägt die Animations-Klasse (liquidClass) und füllt sich erst im Abendmodus:
  // „beb__liquid" (Bebidas, [data-beb-mode]) oder „themesign__wine" (Theme-
  // Schalter, [data-theme]). clipId hält die clipPath-Id pro Schild eindeutig.
  function bebPmArt(art, liquid, liquidClass, clipId) {
    const fill = esc(liquid || "#9A4E1E");
    const lc = liquidClass || "beb__liquid";
    const cid = clipId || "bebClip";
    if (art === "coupe") {
      return `<clipPath id="${cid}"><path d="M56 100 q36 22 72 0 q-6 34 -30 40 q-6 2 -12 0 q-24 -6 -30 -40 z"/></clipPath>
        <rect class="${lc}" clip-path="url(#${cid})" x="50" y="118" width="84" height="30" fill="${fill}"/>
        <path fill="none" stroke="#ECE2CA" stroke-width="6" stroke-linejoin="round" d="M56 100 q36 22 72 0 q-6 34 -30 40 q-6 2 -12 0 q-24 -6 -30 -40 z"/>
        <rect x="89" y="146" width="6" height="36" rx="3" fill="#ECE2CA"/>
        <path d="M66 190 h56 q6 0 4 4 q-3 5 -32 5 q-29 0 -32 -5 q-2 -4 4 -4 z" fill="#ECE2CA"/>`;
    }
    if (art === "wine") {
      return `<clipPath id="${cid}"><path d="M58 92 q34 -10 68 0 q2 30 -14 46 q-8 8 -20 8 q-12 0 -20 -8 q-16 -16 -14 -46 z"/></clipPath>
        <rect class="${lc}" clip-path="url(#${cid})" x="50" y="116" width="84" height="42" fill="${fill}"/>
        <path fill="none" stroke="#ECE2CA" stroke-width="6" stroke-linejoin="round" d="M58 92 q34 -10 68 0 q2 30 -14 46 q-8 8 -20 8 q-12 0 -20 -8 q-16 -16 -14 -46 z"/>
        <rect x="89" y="146" width="6" height="42" rx="3" fill="#ECE2CA"/>
        <path d="M64 196 h56 q6 0 4 4 q-3 5 -32 5 q-29 0 -32 -5 q-2 -4 4 -4 z" fill="#ECE2CA"/>`;
    }
    if (art === "beer") {
      // Bierkrug mit Schaumkrone + Henkel (Pilsener). Schaum/Henkel füllen sich
      // nicht mit – nur die Bierfüllung trägt die Animations-Klasse.
      return `<clipPath id="${cid}"><path d="M64 116 h54 l-4 78 a6 6 0 0 1 -6 6 h-30 a6 6 0 0 1 -6 -6 z"/></clipPath>
        <rect class="${lc}" clip-path="url(#${cid})" x="58" y="128" width="66" height="74" fill="${fill}"/>
        <path fill="none" stroke="#ECE2CA" stroke-width="6" stroke-linejoin="round" d="M64 116 h54 l-4 78 a6 6 0 0 1 -6 6 h-30 a6 6 0 0 1 -6 -6 z"/>
        <path fill="#ECE2CA" d="M60 118 q6 -13 16 -5 q8 -13 18 -3 q10 -11 20 -1 q5 11 -4 13 q-26 -6 -50 0 q-7 -2 0 -7 z"/>
        <path fill="none" stroke="#ECE2CA" stroke-width="9" d="M118 134 q22 0 22 22 q0 20 -20 22"/>`;
    }
    // highball (hohes Glas mit Eiswürfeln + Strohhalm)
    return `<clipPath id="${cid}"><path d="M62 100 h60 l-7 92 a6 6 0 0 1 -6 6 h-28 a6 6 0 0 1 -6 -6 z"/></clipPath>
      <rect class="${lc}" clip-path="url(#${cid})" x="56" y="120" width="72" height="82" fill="${fill}"/>
      <g clip-path="url(#${cid})" fill="none" stroke="#ECE2CA" stroke-width="3"><rect x="74" y="150" width="14" height="14" rx="2"/><rect x="96" y="166" width="14" height="14" rx="2"/></g>
      <path fill="none" stroke="#ECE2CA" stroke-width="6" stroke-linejoin="round" d="M62 100 h60 l-7 92 a6 6 0 0 1 -6 6 h-28 a6 6 0 0 1 -6 -6 z"/>
      <path d="M110 84 L98 150" stroke="#ECE2CA" stroke-width="5" stroke-linecap="round"/>`;
  }

  function bebidasTopbar() {
    return `
      <div class="topbar">
        <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
        <div class="topbar__title">${renderIcon("lc:coffee")} Bebidas AM/PM</div>
        <span></span>
      </div>`;
  }

  function renderBebidas(vm) {
    // Länder-Auswahl: identisch zur Länderkunde, damit die Tafel das Land der
    // Reise teilt (data-action="select-country" -> state.countryId).
    const selector = countryPicker(vm.groups);

    const d = vm.data;
    const countryName = vm.country ? vm.country.name : "";
    if (!d) {
      return `
        <section class="screen">
          ${bebidasTopbar()}
          ${selector}
          <p class="pageintro">${esc(t("discover.bebNone"))}</p>
        </section>`;
    }

    const isPm = vm.mode === "pm";
    const amName = d.am.name, pmName = d.pm.name;
    const greet = isPm ? (d.greet[1] || "") : (d.greet[0] || "");
    const readoutText = isPm
      ? t("discover.bebPmText", { drink: pmName })
      : t("discover.bebAmText", { drink: amName });
    const eyebrow = `${vm.regionLabel} · ${amName} · ${pmName}`;
    const aria = `${countryName}: ${amName} (AM) / ${pmName} (PM)`;

    const sign = `
      <button class="beb__signpost" data-action="toggle-bebida" role="switch"
              aria-checked="${isPm}" aria-label="${esc(aria)}" title="${esc(t("discover.bebHint"))}">
        <span class="beb__plank">
          <span class="beb__plaque beb__plaque--am">
            <svg viewBox="0 0 184 224" aria-hidden="true" focusable="false">
              <g filter="url(#signGrain)">
                <rect x="6" y="4" width="172" height="216" rx="5" fill="#EDE4CD"/>
                <rect x="6" y="4" width="172" height="216" rx="5" fill="none" stroke="rgba(27,23,18,.10)" stroke-width="2"/>
              </g>
              <g filter="url(#signPaint)" fill="#1B1712" stroke="#1B1712">
                <text x="92" y="60" text-anchor="middle" font-family="Bricolage Grotesque, Segoe UI, sans-serif" font-weight="800" font-size="48" stroke="none">AM</text>
                ${bebAmArt(d.am.art, d.am.cold)}
              </g>
            </svg>
          </span>
          <span class="beb__plaque beb__plaque--pm">
            <svg viewBox="0 0 184 224" aria-hidden="true" focusable="false">
              <g filter="url(#signGrain)">
                <rect x="6" y="4" width="172" height="216" rx="5" fill="#1B1712"/>
                <rect x="6" y="4" width="172" height="216" rx="5" fill="none" stroke="rgba(236,226,202,.10)" stroke-width="2"/>
              </g>
              <g filter="url(#signPaint)">
                <text x="92" y="56" text-anchor="middle" font-family="Bricolage Grotesque, Segoe UI, sans-serif" font-weight="800" font-size="48" fill="#ECE2CA" stroke="none">PM</text>
                ${bebPmArt(d.pm.art, d.pm.liquid)}
              </g>
            </svg>
          </span>
        </span>
      </button>`;

    return `
      <section class="screen beb" data-beb-mode="${esc(vm.mode)}" style="--beb-accent:${esc(d.accent)}">
        ${bebidasTopbar()}
        ${selector}
        <div class="beb__stage">
          <p class="beb__eyebrow">${esc(eyebrow)}</p>
          ${sign}
          <div class="beb__readout" aria-live="polite">
            <p class="beb__greet">${esc(greet)}</p>
            <p class="beb__text">${esc(readoutText)}</p>
            <p class="beb__country">${esc(countryName)}</p>
          </div>
          <span class="beb__hint">${esc(t("discover.bebHint"))}</span>
        </div>
      </section>`;
  }

  // REGATEAR (gut verhandeln & feilschen) ist nach features/regateo.js (SC.regateo)
  // gewandert – VM und Render leben dort zusammen; der Opener (openRegatear) bleibt
  // im Controller. Der Tipp-Teilen-Knopf tipsShareBtn() kommt aus SC.view.


  // LOGÍSTICA / SALUD / CAFÉ / JUEGOS / COQUETEO sind nach features/logistica.js,
  // features/salud.js, features/cafe.js, features/juegos.js und features/flirt.js
  // (SC.<modul>Sheet) gewandert – VM und Render leben dort zusammen; die Opener
  // bleiben im Controller. Das gemeinsame Blatt moduleSheet() kommt aus SC.view.

  // FOTOS / BAILAR / MÚSICA sind nach features/fotografia.js, features/bailar.js
  // und features/musica.js (SC.fotosSheet/bailarSheet/musicaSheet) gewandert –
  // VM und Render (inkl. MYMORIES_SVG, Schritt-Diagramm, Deep-Links) leben dort
  // zusammen; die Opener bleiben im Controller.

  // ---------- HOSTEL MODE ----------
  // Menü: Battle vs. Rollenspiele.
  function renderHostel(vm) {
    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:bed")} Modo hostal`, "home")}
        <p class="hm-intro">${esc(t("discover.hostelIntro"))}</p>
        ${moduleShareBtn("hostel")}
        <div class="hm-menu">
          <button class="hm-card hm-card--coordinator" data-action="coordinator-round">
            <span class="hm-card__icon" aria-hidden="true">${renderIcon("lc:zap")}</span>
            <span class="hm-card__title">${esc(t("discover.coordinatorTitle"))}</span>
            <span class="hm-card__desc">${esc(t("discover.coordinatorDesc"))}</span>
            <span class="hm-card__meta">${esc(t("discover.coordinatorMeta", { n: vm.coordinatorRounds }))}</span>
          </button>
          <button class="hm-card hm-card--battle" data-action="open-battle-setup">
            <span class="hm-card__icon" aria-hidden="true">${renderIcon("lc:swords")}</span>
            <span class="hm-card__title">${esc(t("discover.battleTitle"))}</span>
            <span class="hm-card__desc">${esc(t("discover.battleDesc"))}</span>
            <span class="hm-card__meta">${esc(t("discover.battleTasks", { n: vm.battleCount }))}</span>
          </button>
          <button class="hm-card hm-card--roleplay" data-action="open-roleplay-setup">
            <span class="hm-card__icon" aria-hidden="true">${renderIcon("lc:venetian-mask")}</span>
            <span class="hm-card__title">${esc(t("discover.roleplaysTitle"))}</span>
            <span class="hm-card__desc">${esc(t("discover.roleplaysDesc"))}</span>
            <span class="hm-card__meta">${esc(t("discover.roleplaysScenes", { n: vm.roleplayCount }))}</span>
          </button>
        </div>
      </section>`;
  }

  // Pre-Trip-Plan / Lernpfad: mehrtägiger, sequenziell freischaltender Pfad.
  // Aufbau: Hero (Fortschrittsring + direkter „Weiter"-CTA in den nächsten Teil),
  // horizontal scrollbare Kurskarten mit Fortschritt (statt Pill-Wolke) und ein
  // Timeline-Pfad mit verbundenen Knoten + Wochen-Meilensteinen. Reise-Pläne ohne
  // week-Felder rendern denselben Pfad einfach ohne Meilensteine.
  function renderPretrip(vm) {
    // Locals-Track: derselbe Screen ist der „Lernpfad" (Kurs), nicht der Reise-„Pre-Trip".
    const loc = isLocalsTrk();
    const K = (curso, pretrip) => loc ? curso : pretrip;

    // Wochen-Zähler (erledigt/gesamt je Woche) für die Meilenstein-Zeilen.
    const weekStats = {};
    vm.days.forEach((d) => {
      if (d.week == null) return;
      const w = weekStats[d.week] || (weekStats[d.week] = { done: 0, total: 0 });
      w.total++; if (d.done) w.done++;
    });

    // Hero: Ring (conic-gradient über --pct), Kursname, Fortschritt + aktuelle Woche,
    // und EIN großer Einstieg in den nächsten offenen Teil – kein Scrollen nötig.
    const progressLabel = t(K("discover.cursoProgress", "discover.pretripProgress"), { done: vm.doneCount, total: vm.total });
    let metaLine = progressLabel;
    if (vm.next && vm.next.week != null) {
      const wt = (vm.days.find((d) => d.week === vm.next.week && d.weekTitle) || {}).weekTitle;
      metaLine += " · " + t("discover.cursoWeek", { w: vm.next.week }) + (wt ? " · " + wt : "");
    }
    const cta = vm.next
      ? `<button class="lpath-hero__cta" data-action="pretrip-continue" data-scope="${esc(vm.scope)}">
           ${renderIcon("lc:play")} <span class="lpath-hero__ctatxt">${esc(t(vm.doneCount ? "discover.lpathContinue" : "discover.lpathStart", { title: vm.next.title }))}</span>
         </button>`
      : `<p class="lpath-hero__done">${renderIcon("lc:party-popper")} ${esc(t(K("discover.cursoAllDone", "discover.pretripAllDone")))}</p>`;
    const hero = `
      <header class="lpath-hero" style="--pct:${vm.pct}">
        <div class="lpath-hero__top">
          <div class="lpath-hero__ring" role="img" aria-label="${esc(progressLabel)}"><span class="lpath-hero__pct">${vm.pct}%</span></div>
          <div class="lpath-hero__body">
            <h2 class="lpath-hero__title">${esc(vm.scopeLabel)}</h2>
            <p class="lpath-hero__meta">${esc(metaLine)}</p>
          </div>
        </div>
        ${cta}
      </header>`;

    // Kurskarten: je Kurs Label + Mini-Balken + erledigt/gesamt (✓ wenn fertig).
    // Bei zugewiesener Aufgabe ist das Ziel fix -> eine nicht-klickbare Pin-Karte.
    const cards = (vm.plans || []).map((p) => `
      <button class="coursecard${p.active ? " is-active" : ""}${p.done ? " is-done" : ""}"
              data-action="set-pretrip-scope" data-scope="${p.scope}"${p.active ? ' aria-current="true"' : ""}>
        <span class="coursecard__label">${esc(p.label)}</span>
        <span class="coursecard__bar" aria-hidden="true"><span style="width:${p.pct}%"></span></span>
        <span class="coursecard__meta">${p.done ? "✓" : `${p.doneCount}/${p.total}`}</span>
      </button>`).join("");
    const picker = vm.locked
      ? `<div class="coursecards coursecards--locked">
           <span class="coursecard coursecard--locked is-active" role="status" aria-label="${esc(vm.scopeLabel + " – " + t("discover.pretripAssigned"))}">
             <span class="coursecard__label">${renderIcon("lc:pin")} ${esc(vm.scopeLabel)}</span>
             <span class="coursecard__bar" aria-hidden="true"><span style="width:${vm.pct}%"></span></span>
             <span class="coursecard__meta">${vm.doneCount}/${vm.total}</span>
           </span>
         </div>
         <p class="pretrip-assigned" aria-hidden="true">${esc(t("discover.pretripAssigned"))}</p>`
      : (vm.plans || []).length > 1
        ? `<div class="coursecards" role="group" aria-label="${esc(t(K("discover.cursoDestLabel", "discover.pretripDestLabel")))}">${cards}</div>`
        : "";

    // Timeline-Pfad: Knoten (✓ / Teilnummer / Schloss) an einer Verbindungslinie;
    // gesperrte Teile werden nur gedimmt (Schloss im Knoten + sr-only-Text) statt
    // je Zeile laut „noch gesperrt" zu rufen. Start/Wiederholen bleibt wie gehabt.
    let lastWeek = null;
    const rows = vm.days.map((d) => {
      const status = d.done ? "done" : (d.unlocked ? "current" : "locked");
      // Bei Wochen/Teilen die Teilnummer (1..5) zeigen, sonst die Etappennummer.
      const num = (d.part != null) ? d.part : d.day;
      const node = d.done ? "✓" : (d.unlocked ? String(num) : renderIcon("lc:lock"));
      const challenge = d.challenge
        ? `<span class="lpath-step__challenge">${renderIcon("lc:door-open")} ${esc(d.challenge)}</span>` : "";
      const right = status === "locked"
        ? `<span class="sr-only">${esc(t("discover.pretripLocked"))}</span>`
        : `<button class="lpath-step__btn" data-action="start-pretrip-day" data-day="${d.day}">${esc(d.done ? t("discover.pretripReplay") : t("discover.pretripStart"))}</button>`;
      const row = `
        <li class="lpath-step lpath-step--${status}"${status === "locked" ? ' aria-disabled="true"' : ""}>
          <span class="lpath-step__node" aria-hidden="true">${node}</span>
          <span class="lpath-step__body">
            <span class="lpath-step__title">${esc(d.title)}</span>
            <span class="lpath-step__meta">${esc(t("discover.pretripCards", { n: d.count }))}</span>
            ${challenge}
          </span>
          ${right}
        </li>`;
      // Wochen-Meilenstein (nur wenn week gesetzt = Kursplan): Titel + Zähler.
      let head = "";
      if (d.week != null && d.week !== lastWeek) {
        lastWeek = d.week;
        const ws = weekStats[d.week];
        const wk = d.weekTitle ? (" · " + esc(d.weekTitle)) : "";
        head = `
        <li class="lpath-week${ws.done === ws.total ? " lpath-week--done" : ""}" role="presentation">
          <span class="lpath-week__cap">${esc(t("discover.cursoWeek", { w: d.week }))}${wk}</span>
          <span class="lpath-week__count">${ws.done}/${ws.total}</span>
        </li>`;
      }
      return head + row;
    }).join("");

    return `
      <section class="screen lpath">
        ${hmTopbar(`${renderIcon("lc:calendar")} ` + esc(t(K("discover.cursoTitle", "discover.pretripTitle"))), "home")}
        ${hero}
        ${picker}
        <p class="lpath-intro">${esc(t(K("discover.cursoIntro", "discover.pretripIntro")))}</p>
        <ol class="lpath-path">${rows}</ol>
      </section>`;
  }

  // Kompaktes Balken-Dashboard der Niveau-Verteilung (CEFR-Stufen + „noch nicht
  // getestet"). Gibt der Lehrkraft auf einen Blick die Gruppengrößen je Stufe.
  // Reiner String-Renderer, druckbar (nur Inline-Breiten + .leveldist-* Klassen).
  function renderLevelDist(d) {
    if (!d || !d.total) return "";
    const base = Math.max(d.max, 1); // größte Stufen-Gruppe füllt den Balken voll aus
    const bars = d.buckets.map((b) => {
      const pct = Math.round((b.count / base) * 100);
      return `
        <div class="leveldist-row">
          <span class="leveldist-label">${esc(b.level)}</span>
          <span class="leveldist-bar"><span class="leveldist-fill" style="width:${pct}%"></span></span>
          <span class="leveldist-count" title="${esc(t("teacher.distCount", { n: b.count }))}">${b.count}</span>
        </div>`;
    }).join("");
    const untested = d.untested
      ? `<p class="leveldist-foot">${esc(t("teacher.distUntested"))}: <strong>${d.untested}</strong></p>`
      : "";
    return `
      <div class="leveldist">
        <h3 class="leveldist-h3">${renderIcon("lc:bar-chart-3")} ${esc(t("teacher.distHeading"))}</h3>
        <p class="teacher-sub2">${esc(t("teacher.distHint"))}</p>
        <div class="leveldist-rows">${bars}</div>
        ${untested}
      </div>`;
  }

  // Lehrer-/Coordinator-Modus: Klassenübersicht aus importierten Schüler-Backups.
  // Backend-frei und offline – die Daten leben nur in dieser Sitzung. Reuse der
  // Screen-/Topbar-Struktur; Tabelle bewusst schlicht und druckbar (window.print).
  function renderTeacher(vm) {
    const actions = `
      <div class="teacher-actions">
        <button class="teacher-btn teacher-btn--main" data-action="teacher-import">${renderIcon("lc:download")} ${esc(t("teacher.importBtn"))}</button>
        ${vm.count ? `<button class="teacher-btn" data-action="teacher-csv">${renderIcon("lc:file-text")} ${esc(t("teacher.csvBtn"))}</button>
        <button class="teacher-btn" data-action="teacher-print">${renderIcon("lc:printer")} ${esc(t("teacher.printBtn"))}</button>
        <button class="teacher-btn" data-action="teacher-clear">${renderIcon("lc:trash-2")} ${esc(t("teacher.clearBtn"))}</button>` : ""}
      </div>
      <input type="file" id="teacher-file" accept="application/json,.json" multiple hidden>`;

    // Klickbarer Spaltenkopf zum Sortieren; aktive Spalte trägt ▲/▼ je Richtung.
    const arrow = (key) => vm.sortKey === key ? (vm.sortDir < 0 ? " ▼" : " ▲") : "";
    const sortTh = (key, label, extra) => `
      <th${extra || ""}><button type="button" class="teacher-sortbtn${vm.sortKey === key ? " is-active" : ""}"
        data-action="teacher-sort" data-key="${key}" aria-label="${esc(t("teacher.sortBy", { col: label }))}">${esc(label)}${arrow(key)}</button></th>`;

    // Druck-Kopf (nur im Ausdruck sichtbar): Klassenname + Datum machen das Blatt
    // selbsterklärend, ohne den Bildschirm zu verstellen.
    const printHead = vm.count ? `
      <div class="teacher-printhead">
        <span class="teacher-printhead__title">${esc(vm.className || t("teacher.printTitleDefault"))}</span>
        <span class="teacher-printhead__meta">${esc(t("teacher.printDateLabel"))}: ${esc(vm.printDate)}</span>
      </div>` : "";

    // Optionaler Klassenname (steuert Druck-Kopf + CSV-Dateiname). Nicht mitgedruckt.
    const classNameField = vm.count ? `
      <label class="teacher-classname no-print">
        <span class="teacher-classname__label">${esc(t("teacher.classNameLabel"))}</span>
        <input id="teacher-classname" class="task-input" type="text" maxlength="60"
          placeholder="${esc(t("teacher.classNamePh"))}" value="${esc(vm.className)}">
      </label>` : "";

    const body = vm.count
      ? `
      ${printHead}
      <p class="teacher-summary">${esc(t("teacher.classSummary", { n: vm.count, avg: vm.avgMastered, total: vm.totalCards }))}</p>
      ${classNameField}
      ${renderLevelDist(vm.levelDist)}
      <div class="teacher-tablewrap">
        <table class="teacher-table">
          <thead><tr>
            ${sortTh("name", t("teacher.colName"))}
            ${sortTh("mastered", t("teacher.colMastered"))}
            ${sortTh("streak", t("teacher.colStreak"))}
            ${sortTh("challenges", t("teacher.colChallenges"))}
            ${sortTh("pretrip", t("teacher.colPretrip"))}
            ${sortTh("level", t("teacher.colLevel"))}
            <th>${esc(t("teacher.colPacks"))}</th>
            <th class="no-print" aria-label="${esc(t("teacher.remove"))}"></th>
          </tr></thead>
          <tbody>
            ${vm.students.map((s) => `
            <tr>
              <td class="teacher-name">${esc(s.name)}</td>
              <td>${s.cardsMastered} / ${s.totalCards}<span class="teacher-sub"> · ${esc(t("teacher.reviewed", { n: s.cardsReviewed }))}</span></td>
              <td>${s.streak}${s.longestStreak > s.streak ? `<span class="teacher-sub"> (max ${s.longestStreak})</span>` : ""}</td>
              <td>${s.challenges}</td>
              <td>${s.pretripDays} / ${s.pretripMax}</td>
              <td>${(s.assessment || s.placement) ? `${esc((s.assessment || s.placement).level)}<span class="teacher-sub"> · ${Math.round(((s.assessment || s.placement).finalScore || 0) * 100)}%${s.assessment ? " " + renderIcon("lc:clipboard-list") : ""}</span>` : "—"}</td>
              <td class="teacher-packs">${s.masteredCats.length ? esc(s.masteredCats.join(", ")) : "—"}</td>
              <td class="no-print"><button class="teacher-x" data-action="teacher-remove" data-idx="${s._idx}" aria-label="${esc(t("teacher.remove"))}" title="${esc(t("teacher.remove"))}">✕</button></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`
      : `<p class="teacher-empty">${esc(t("teacher.empty"))}</p>`;

    const taskForm = `
      <h3 class="teacher-h3">${esc(t("teacher.taskHeading"))}</h3>
      <p class="teacher-sub2">${esc(t("teacher.taskHint"))}</p>
      <div class="task-form">
        ${targetField("task", { summary: vm.taskSummary })}
        <input id="task-title" class="task-input" type="text" maxlength="80" placeholder="${esc(t("teacher.taskTitlePh"))}" value="${esc(vm.taskTitle || "")}">
        <input id="task-due" class="task-input" type="date" aria-label="${esc(t("teacher.taskDue"))}" value="${esc(vm.taskDue || "")}">
        <button class="teacher-btn teacher-btn--main" data-action="task-generate">${esc(t("teacher.taskGenerate"))}</button>
      </div>
      ${vm.taskCode ? `
      <div class="task-result">
        ${vm.taskCodeLabel ? `<p class="task-codefor">${renderIcon("lc:target")} ${esc(t("teacher.taskCodeFor", { label: vm.taskCodeLabel }))}</p>` : ""}
        <textarea id="task-code" class="task-code" readonly rows="2" aria-label="${esc(t("teacher.taskTarget"))}">${esc(vm.taskCode)}</textarea>
        <p class="task-profe-hint">${esc(t("teacher.taskShareHint"))}</p>
        <div class="teacher-actions task-result__btns">
          <button class="teacher-btn teacher-btn--main" data-action="task-copy-link">${renderIcon("lc:link")} ${esc(t("teacher.taskCopyLink"))}</button>
          <button class="teacher-btn" data-action="task-copy">${renderIcon("lc:clipboard-list")} ${esc(t("teacher.taskCopy"))}</button>
        </div>
      </div>` : ""}`;

    // In Editionen hängt Modo profe unter dem Tarea-Reiter: Tab-Leiste mit „Tarea“
    // aktiv, und der Zurück-Pfeil führt zurück in den Tarea-Screen (nicht Home).
    const cfg = window.SC.config || {};
    const withTab = !!(cfg.taskTab || cfg.teacherTab);
    return `
      <section class="screen${withTab ? " screen--tabbed" : ""}">
        ${hmTopbar(`${renderIcon("lc:graduation-cap")} ` + esc(t("teacher.title")), withTab ? "open-task" : "home")}
        <p class="hm-intro no-print">${esc(t("teacher.intro"))}</p>
        <div class="tip no-print">${esc(t("teacher.privacy"))}</div>
        ${actions}
        ${body}
        <div class="no-print">
          <hr class="teacher-sep">
          ${taskForm}
          <hr class="teacher-sep">
          <h3 class="teacher-h3">${esc(t("sheet.heading"))}</h3>
          <p class="teacher-sub2">${esc(t("sheet.hint"))}</p>
          <div class="teacher-actions">
            <button class="teacher-btn teacher-btn--main" data-action="open-printsheet">${renderIcon("lc:file-text")} ${esc(t("sheet.openBtn"))}</button>
          </div>
        </div>
      </section>
      ${vm.targetPicker === "task" ? targetPickerModal("task", { targets: vm.taskTargets, bundles: vm.bundles, selectedKeys: vm.taskItemKeys, activeBundleIds: vm.activeBundleIds }) : ""}
      ${withTab ? tabbar("tarea") : ""}`;
  }

  // Druckbares Aktivitätsblatt (Lehrkraft/Coordinator): oben eine NICHT gedruckte
  // Steuerleiste (Ziel-/Etappenwahl + Drucken), darunter das druckoptimierte Blatt.
  // window.print() macht daraus ein PDF; @media print blendet alles außer .sheet aus.
  function renderPrintSheet(vm) {
    const stagePick = vm.stageOpts
      ? `<select id="sheet-stage" class="task-input" aria-label="${esc(t("sheet.stageSelect"))}">
           ${vm.stageOpts.map((o) => `<option value="${esc(o.value)}"${o.value === vm.sheetStage ? " selected" : ""}>${esc(o.label)}</option>`).join("")}
         </select>`
      : "";
    // Drei Blatt-Varianten umschalten (nur Steuerleiste, nicht gedruckt):
    // Lösungsblatt · Druck-Übung · am Handy ausfüllen.
    const isFull = !vm.exercise && !vm.fill;
    const modeToggle = `
      <div class="sheet-modes" role="group" aria-label="${esc(t("sheet.modeLabel"))}">
        <button type="button" class="sheet-mode${isFull ? " is-active" : ""}" data-action="sheet-mode" data-mode="full" aria-pressed="${isFull}">${esc(t("sheet.modeFull"))}</button>
        <button type="button" class="sheet-mode${vm.exercise ? " is-active" : ""}" data-action="sheet-mode" data-mode="exercise" aria-pressed="${!!vm.exercise}">${esc(t("sheet.modeExercise"))}</button>
        <button type="button" class="sheet-mode${vm.fill ? " is-active" : ""}" data-action="sheet-mode" data-mode="fill" aria-pressed="${!!vm.fill}">${esc(t("sheet.modeFill"))}</button>
      </div>`;
    // Heftlänge: Standard / Groß / XXL – steuert, wie viele Aufgaben pro Baustein.
    const lengthPick = `
      <div class="sheet-modes sheet-lengths" role="group" aria-label="${esc(t("sheet.lengthLabel"))}">
        ${["standard", "gross", "xxl"].map((v) => `<button type="button" class="sheet-mode${vm.sheetLength === v ? " is-active" : ""}" data-action="sheet-length" data-len="${v}" aria-pressed="${vm.sheetLength === v}">${esc(t("sheet.len_" + v))}</button>`).join("")}
      </div>`;
    // Bausteinauswahl: alle baubaren Übungsabschnitte als an-/abwählbare Chips
    // (nur Steuerleiste, nicht gedruckt). on = Abschnitt ist im Heft.
    const pickRow = (vm.sectionToggles && vm.sectionToggles.length) ? `
        <div class="sheet-pick">
          <span class="sheet-pick__label">${esc(t("sheet.pickLabel"))}:</span>
          ${vm.sectionToggles.map((s) => `<button type="button" class="sheet-pick__chip" data-action="toggle-section" data-type="${esc(s.type)}" aria-pressed="${!!s.on}">${esc(s.label)}</button>`).join("")}
        </div>` : "";
    // Im Fill-Modus (am Handy) statt „Drucken" die interaktiven Knöpfe:
    // Prüfen / Lösungen zeigen / zurücksetzen + Live-Ergebnis.
    const actionBtn = vm.fill
      ? `<button class="teacher-btn teacher-btn--main" data-action="sheet-check">${renderIcon("lc:check-circle")} ${esc(t("sheet.checkBtn"))}</button>
         <button class="teacher-btn" data-action="sheet-reveal">${renderIcon("lc:eye")} ${esc(t("sheet.revealBtn"))}</button>
         <button class="teacher-btn" data-action="sheet-reset">${renderIcon("lc:rotate-ccw")} ${esc(t("sheet.resetBtn"))}</button>
         <span class="sheet-score" role="status" aria-live="polite"></span>`
      // Übungsmodus: Übungsblatt und Lösungsschlüssel getrennt druckbar.
      : vm.exercise
        ? `<button class="teacher-btn teacher-btn--main" data-action="printsheet-print" data-scope="exercise">${renderIcon("lc:printer")} ${esc(t("sheet.printExercise"))}</button>
           <button class="teacher-btn" data-action="printsheet-print" data-scope="key">${renderIcon("lc:key")} ${esc(t("sheet.printKey"))}</button>`
        : `<button class="teacher-btn teacher-btn--main" data-action="printsheet-print">${renderIcon("lc:printer")} ${esc(t("sheet.printBtn"))}</button>`;
    const controls = `
      <div class="sheet-controls no-print">
        ${targetField("sheet", { targets: vm.targets, current: vm.sheetTarget })}
        ${stagePick}
        ${modeToggle}
        ${lengthPick}
        ${actionBtn}
        ${pickRow}
      </div>`;

    // Fill-Modus: echtes Eingabefeld mit hinterlegter Lösung (data-answer) für die
    // Selbstkontrolle am Handy. „kind" steuert die Breite (inline/line/mini).
    const fillInput = (answer, kind, key) => `<input class="sheet-fill sheet-fill--${kind || "line"}" type="text" lang="es" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next" data-answer="${esc(answer)}" data-fk="${esc(key || "")}" aria-label="${esc(t("sheet.fillAria"))}">${vm.revealed ? `<span class="sheet-solution"><span class="sheet-solution__lbl">${esc(t("sheet.solutionLabel"))}:</span> <span lang="es">${esc(answer)}</span></span>` : ""}`;

    // Im Übungsmodus wird die spanische Zeile (Antwort) zur Schreiblinie, im
    // Fill-Modus zum tippbaren Feld mit hinterlegter Lösung. Notizen/Challenge-
    // Phrase (die die Lösung verraten) bleiben in beiden Fällen verborgen –
    // sonst stünden die Antworten der Übungen darunter offen daneben.
    const cardLine = (c, key) => `<li>
          ${vm.fill
            ? fillInput(c.es, "line", key)
            : vm.exercise
              ? `<span class="sheet-es sheet-es--blank" aria-hidden="true"></span>`
              : `<span class="sheet-es" lang="es">${esc(c.es)}</span>`}
          <span class="sheet-de">${esc(c.de)}</span>
          ${(!vm.exercise && !vm.fill && c.note) ? `<span class="sheet-note">${renderIcon("lc:lightbulb")} ${esc(c.note)}</span>` : ""}
        </li>`;
    const stagesHtml = (vm.stages || []).map((st, si) => `
      ${st.heading ? `<h3 class="sheet-stage">${esc(st.heading)}</h3>` : ""}
      <ol class="sheet-cards">
        ${st.cards.map((c, ci) => cardLine(c, "voc:" + si + ":" + ci)).join("")}
      </ol>
      ${st.challenge ? `<p class="sheet-challenge"><strong>${esc(t("sheet.challengeLabel"))}:</strong> ${esc(st.challenge.text)}${(!vm.exercise && !vm.fill && st.challenge.phrase) ? ` <span lang="es">„${esc(st.challenge.phrase)}“</span>` : ""}</p>` : ""}
    `).join("");

    // ---------- Arbeitsheft: zusätzliche Übungsabschnitte ----------
    // Jeder Abschnitt trägt Aufgaben- UND Lösungsdaten; im Übungsmodus werden die
    // Antworten zu Schreiblinien/Lücken, im Lösungsblatt stehen sie direkt da.
    const writeLine = '<span class="sheet-write-line"></span>';
    const sectionHead = (titleKey, instrKey) => `<h2 class="sheet-h2">${esc(t(titleKey))}</h2><p class="sheet-instr">${esc(t(instrKey))}</p>`;
    // occ = laufende Nummer dieses Abschnitt-TYPS (z. B. Dialog #0/#1). Daraus
    // wird je Feld ein render-stabiler Schlüssel gebaut – unabhängig davon, welche
    // anderen Bausteine ab-/angewählt oder wie viele Items die Heftlänge zeigt.
    function renderSection(s, occ) {
      const fk = (i) => s.type + "#" + (occ || 0) + ":" + i;
      switch (s.type) {
        case "matching": {
          const left = (s.left || []).map((x) => `<li>${esc(x.es)}</li>`).join("");
          const right = (s.right || []).map((x) => `<li>${esc(x.de)}</li>`).join("");
          const grid = (s.left || []).map((x, i) => `<span>${esc(String(x.n))} → ${vm.fill ? fillInput(x.l, "mini", fk(i)) : vm.exercise ? "____" : esc(x.l)}</span>`).join("");
          return `<section class="sheet-section sheet-section--matching">
            ${sectionHead("sheet.secMatching", "sheet.instrMatching")}
            <div class="sheet-match">
              <ol class="sheet-match__col" type="1" lang="es">${left}</ol>
              <ol class="sheet-match__col" type="a">${right}</ol>
            </div>
            <p class="sheet-match__grid"><strong>${esc(t("sheet.matchHint"))}:</strong> ${grid}</p>
          </section>`;
        }
        case "gapfill": {
          const bank = (s.wordbank || []).map((w) => `<span class="sheet-chip" lang="es">${esc(w)}</span>`).join("");
          const items = (s.items || []).map((it, i) => {
            const filler = vm.fill ? fillInput(it.answer, "inline", fk(i))
              : vm.exercise ? '<span class="sheet-blank-inline"></span>'
              : `<strong>${esc(it.answer)}</strong>`;
            const frame = esc(it.frameEs).replace("___", filler);
            return `<li><span class="sheet-es" lang="es">${frame}</span><span class="sheet-de">${esc(it.targetDe)}</span></li>`;
          }).join("");
          return `<section class="sheet-section sheet-section--gapfill">
            ${sectionHead("sheet.secGapfill", "sheet.instrGapfill")}
            <div class="sheet-wordbank"><span class="sheet-wb-label">${esc(t("sheet.wordbankLabel"))}</span>${bank}</div>
            <ol class="sheet-exlist">${items}</ol>
          </section>`;
        }
        case "translate": {
          const lines = (s.lines || []).map((l, i) => `<li><span class="sheet-de">${esc(l.de)}</span>${vm.fill ? fillInput(l.es, "line", fk(i)) : vm.exercise ? writeLine : `<span class="sheet-es" lang="es">${esc(l.es)}</span>`}</li>`).join("");
          return `<section class="sheet-section sheet-section--translate">
            ${sectionHead("sheet.secTranslate", "sheet.instrTranslate")}
            <ol class="sheet-exlist">${lines}</ol>
          </section>`;
        }
        case "conjug": {
          const rows = (s.rows || []).map((r, i) => `<tr><td lang="es">${esc(r.verb)}</td><td>${esc(r.person)}</td><td class="sheet-ans-cell">${vm.fill ? fillInput(r.answer, "line", fk(i)) : vm.exercise ? writeLine : `<strong lang="es">${esc(r.answer)}</strong>`}</td></tr>`).join("");
          return `<section class="sheet-section sheet-section--conjug">
            ${sectionHead("sheet.secConjug", "sheet.instrConjug")}
            <table class="sheet-table"><thead><tr><th>${esc(t("sheet.colVerb"))}</th><th>${esc(t("sheet.colPerson"))}</th><th>${esc(t("sheet.colAnswer"))}</th></tr></thead><tbody>${rows}</tbody></table>
          </section>`;
        }
        case "numbers": {
          const rows = (s.items || []).map((it, i) => `<tr><td>${esc(it.digits)}${it.symbol ? " " + esc(it.symbol) : ""}</td><td class="sheet-ans-cell">${vm.fill ? fillInput(it.words, "line", fk(i)) : vm.exercise ? writeLine : `<strong lang="es">${esc(it.words)}</strong>`}</td></tr>`).join("");
          return `<section class="sheet-section sheet-section--numbers">
            ${sectionHead("sheet.secNumbers", "sheet.instrNumbers")}
            <table class="sheet-table"><thead><tr><th>${esc(t("sheet.colNumber"))}</th><th>${esc(t("sheet.colSpanish"))}</th></tr></thead><tbody>${rows}</tbody></table>
          </section>`;
        }
        case "dialogue": {
          const turns = (s.turns || []).map((tn, i) => tn.who === "npc"
            ? `<p class="sheet-turn sheet-turn--npc"><span class="who">${esc(t("sheet.npcLabel"))}:</span><span class="es" lang="es">${esc(tn.es)}</span><span class="de">${esc(tn.de)}</span></p>`
            : `<p class="sheet-turn sheet-turn--user"><span class="who">${esc(t("sheet.youLabel"))}:</span><span class="de">${esc(tn.de)}</span>${vm.fill ? fillInput(tn.answer, "line", fk(i)) : vm.exercise ? writeLine : `<span class="es" lang="es">${esc(tn.answer)}</span>`}</p>`).join("");
          return `<section class="sheet-section sheet-section--dialogue">
            ${sectionHead("sheet.secDialogue", "sheet.instrDialogue")}
            ${s.title ? `<h3 class="sheet-stage" lang="es">${esc(s.title)}</h3>` : ""}
            <div class="sheet-dialogue">${turns}</div>
          </section>`;
        }
        case "opposites": {
          const items = (s.items || []).map((it, i) => {
            const sol = vm.fill ? fillInput(it.answer, "inline", fk(i))
              : vm.exercise ? '<span class="sheet-blank-inline"></span>'
              : `<strong lang="es">${esc(it.answer)}</strong>`;
            return `<li><span class="sheet-es" lang="es">${esc(it.word)}</span>${it.gloss ? ` <span class="sheet-de">(${esc(it.gloss)})</span>` : ""} <span class="sheet-arrow" aria-hidden="true">↔</span> ${sol}</li>`;
          }).join("");
          return `<section class="sheet-section sheet-section--opposites">
            ${sectionHead("sheet.secOpposites", "sheet.instrOpposites")}
            <ol class="sheet-exlist sheet-exlist--opp">${items}</ol>
          </section>`;
        }
        case "ordenar": {
          const items = (s.items || []).map((it, i) => {
            const chips = (it.scrambled || []).map((w) => `<span class="sheet-chip" lang="es">${esc(w)}</span>`).join("");
            const sol = vm.fill ? fillInput(it.answer, "line", fk(i))
              : vm.exercise ? writeLine
              : `<span class="sheet-es" lang="es">${esc(it.answer)}</span>`;
            return `<li><span class="sheet-de">${esc(it.de)}</span><span class="sheet-scramble">${chips}</span>${sol}</li>`;
          }).join("");
          return `<section class="sheet-section sheet-section--ordenar">
            ${sectionHead("sheet.secOrdenar", "sheet.instrOrdenar")}
            <ol class="sheet-exlist">${items}</ol>
          </section>`;
        }
        case "choice": {
          const items = (s.items || []).map((it, i) => {
            const opts = (it.options || []).map((o) => `<span class="sheet-choice__opt"><strong>${esc(o.l)})</strong> <span lang="es">${esc(o.es)}</span></span>`).join("");
            const sol = vm.fill ? fillInput(it.answer, "mini", fk(i))
              : vm.exercise ? '<span class="sheet-blank-mini"></span>'
              : `<strong lang="es">${esc(it.answer)}) ${esc(it.answerEs)}</strong>`;
            return `<li><span class="sheet-de">${esc(it.de)}</span><span class="sheet-choices">${opts}</span><span class="sheet-choice__ans">${esc(t("sheet.choiceAnswerLabel"))}: ${sol}</span></li>`;
          }).join("");
          return `<section class="sheet-section sheet-section--choice">
            ${sectionHead("sheet.secChoice", "sheet.instrChoice")}
            <ol class="sheet-exlist sheet-exlist--choice">${items}</ol>
          </section>`;
        }
        case "articles": {
          const items = (s.items || []).map((it, i) => {
            const sol = vm.fill ? fillInput(it.article, "mini", fk(i))
              : vm.exercise ? '<span class="sheet-blank-mini"></span>'
              : `<strong lang="es">${esc(it.article)}</strong>`;
            return `<li>${sol} <span class="sheet-es" lang="es">${esc(it.noun)}</span> <span class="sheet-de">(${esc(it.de)})</span></li>`;
          }).join("");
          return `<section class="sheet-section sheet-section--articles">
            ${sectionHead("sheet.secArticles", "sheet.instrArticles")}
            <ol class="sheet-exlist sheet-exlist--articles">${items}</ol>
          </section>`;
        }
        case "anagram": {
          const items = (s.items || []).map((it, i) => {
            const chips = (it.scrambled || []).map((ch) => `<span class="sheet-chip sheet-chip--letter" lang="es">${esc(ch)}</span>`).join("");
            const sol = vm.fill ? fillInput(it.answer, "line", fk(i))
              : vm.exercise ? writeLine
              : `<span class="sheet-es" lang="es">${esc(it.answer)}</span>`;
            return `<li><span class="sheet-de">${esc(it.de)}</span><span class="sheet-scramble sheet-scramble--letters">${chips}</span>${sol}</li>`;
          }).join("");
          return `<section class="sheet-section sheet-section--anagram">
            ${sectionHead("sheet.secAnagram", "sheet.instrAnagram")}
            <ol class="sheet-exlist">${items}</ol>
          </section>`;
        }
        case "culture": {
          const facts = (s.facts || []).map((f) => `<li>${esc(f)}</li>`).join("");
          return `<section class="sheet-section sheet-section--culture">
            <h2 class="sheet-h2">${esc(t("sheet.secCulture"))}</h2>
            <div class="sheet-culture">${s.title ? `<strong>${esc(s.title)}</strong>` : ""}<ul>${facts}</ul></div>
          </section>`;
        }
        case "writing": {
          // Mehrere Schreibanlässe (prompts[]) oder ein einzelner (prompt) – je
          // Anlass eine eigene Schreibfläche bzw. ein Textfeld im Fill-Modus.
          const prompts = (s.prompts && s.prompts.length) ? s.prompts : (s.prompt ? [s.prompt] : [""]);
          const box = (i) => vm.fill
            ? `<textarea class="sheet-fill-area" data-fk="${esc(fk(i))}" rows="4" lang="es" autocapitalize="sentences" spellcheck="false" aria-label="${esc(t("sheet.secWriting"))}"></textarea>`
            : `<div class="sheet-write-box" aria-hidden="true"></div>`;
          // Anlass + Schreibfläche als ein Block – im Druck nie durch einen
          // Seitenumbruch getrennt (sonst stünden leere Linien ohne Aufgabe oben).
          const blocks = prompts.map((p, i) => `<div class="sheet-writeblock">${p ? `<p class="sheet-goal">${esc(p)}</p>` : ""}${box(i)}</div>`).join("");
          return `<section class="sheet-section sheet-section--writing">
            ${sectionHead("sheet.secWriting", "sheet.instrWriting")}
            ${blocks}
          </section>`;
        }
        default: return "";
      }
    }
    // Pro Abschnittstyp mitzählen, damit zwei gleichartige Abschnitte (z. B. zwei
    // Dialoge) stabile, getrennte Feldschlüssel bekommen.
    const sectionTypeSeq = {};
    const sectionsHtml = (vm.sections || []).map((s) => {
      const occ = (sectionTypeSeq[s.type] = (sectionTypeSeq[s.type] || 0) + 1) - 1;
      return renderSection(s, occ);
    }).join("");

    // Lösungsschlüssel (nur Übungsmodus – im Lösungsblatt stehen die Antworten
    // bereits inline). Kompakt, eigene Seite (Seitenumbruch via CSS).
    function renderAnswerKey(sections) {
      const blocks = (sections || []).map((s) => {
        let heading = "";
        let items = [];
        switch (s.type) {
          // Die <ol> nummeriert bereits die Paar-Nummer (1..n) – nur den Buchstaben ausgeben.
          case "matching": heading = t("sheet.secMatching"); items = (s.left || []).map((x) => x.l); break;
          case "gapfill": heading = t("sheet.secGapfill"); items = (s.items || []).map((it) => it.answer); break;
          case "translate": heading = t("sheet.secTranslate"); items = (s.lines || []).map((l) => l.es); break;
          case "conjug": heading = t("sheet.secConjug"); items = (s.rows || []).map((r) => `${r.verb} (${r.person}) → ${r.answer}`); break;
          case "numbers": heading = t("sheet.secNumbers"); items = (s.items || []).map((it) => `${it.digits} → ${it.words}`); break;
          case "opposites": heading = t("sheet.secOpposites"); items = (s.items || []).map((it) => `${it.word} → ${it.answer}`); break;
          case "ordenar": heading = t("sheet.secOrdenar"); items = (s.items || []).map((it) => it.answer); break;
          case "choice": heading = t("sheet.secChoice"); items = (s.items || []).map((it) => `${it.answer}) ${it.answerEs}`); break;
          case "articles": heading = t("sheet.secArticles"); items = (s.items || []).map((it) => `${it.article} ${it.noun}`); break;
          case "anagram": heading = t("sheet.secAnagram"); items = (s.items || []).map((it) => it.answer); break;
          case "dialogue": heading = t("sheet.secDialogue"); items = (s.turns || []).filter((tn) => tn.who === "user").map((tn) => tn.answer); break;
          default: return ""; // culture/writing haben keine Lösung
        }
        if (!items.length) return "";
        return `<h3>${esc(heading)}</h3><ol class="sheet-exlist">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ol>`;
      }).filter(Boolean).join("");
      return blocks; // nur die Blöcke; das eigene Lösungsschlüssel-Blatt wird unten gebaut
    }

    const credit = vm.edition && vm.edition.name ? esc(vm.edition.name) + " · " + esc(t("profile.poweredBy")) : "HolaRuta";
    // Akzent nur als Farbwert zulassen (Daten sind vertrauenswürdig – defensiv trotzdem).
    const accent = /^#[0-9a-fA-F]{3,8}$/.test(vm.accent || "") ? vm.accent : "#a23e20";

    // Lösungsschlüssel als EIGENES Blatt (separate <article>) – physisch vom
    // Übungsblatt trennbar und einzeln druckbar (siehe Druck-Knöpfe oben).
    const keyBlocks = vm.exercise ? renderAnswerKey(vm.sections) : "";
    const answerKeySheet = keyBlocks ? `
      <article class="sheet sheet--key sheet-answerkey" style="--sheet-accent:${accent}">
        <span class="sheet-accent-bar" aria-hidden="true"></span>
        <header class="sheet-head">
          <p class="sheet-brand"><span class="sheet-badge" aria-hidden="true">${renderIcon("lc:key")}</span><span class="sheet-brand-name">${credit}</span></p>
          <h1 class="sheet-title">${esc(vm.title)} <span class="sheet-tag sheet-tag--key">${esc(t("sheet.answerKeyHeading"))}</span></h1>
          <p class="sheet-meta">${vm.levelRange ? esc(vm.levelRange) + " · " : ""}${esc(t("sheet.cardCount", { n: vm.cardCount }))} · ${esc(vm.date)}</p>
        </header>
        <p class="sheet-ak-note">${esc(t("sheet.answerKeyNote"))}</p>
        ${keyBlocks}
      </article>` : "";

    const sheet = `
      <article class="sheet${vm.exercise ? " sheet--exercise" : ""}" style="--sheet-accent:${accent}">
        <span class="sheet-accent-bar" aria-hidden="true"></span>
        <header class="sheet-head">
          <p class="sheet-brand"><span class="sheet-badge" aria-hidden="true">${esc(vm.icon || "📄")}</span><span class="sheet-brand-name">${credit}</span></p>
          <h1 class="sheet-title">${esc(vm.title)}${vm.exercise ? ` <span class="sheet-tag">${esc(t("sheet.exerciseTag"))}</span>` : ""}</h1>
          <p class="sheet-meta">${vm.levelRange ? esc(vm.levelRange) + " · " : ""}${esc(t("sheet.cardCount", { n: vm.cardCount }))} · ${esc(vm.date)}</p>
        </header>

        ${vm.fill ? `<p class="sheet-fillbar">${renderIcon("lc:square-pen")} ${esc(t("sheet.fillHint"))}</p>` : ""}

        <p class="sheet-goal"><strong>${esc(t("sheet.goalLabel"))}:</strong> ${esc(t("sheet.goalText"))}</p>

        <section class="sheet-recipe-box">
          <h2 class="sheet-h2">${esc(t("sheet.recipeHeading"))}</h2>
          <ol class="sheet-recipe">
            <li>${esc(t("sheet.recipe1"))}</li>
            <li>${esc(t("sheet.recipe2"))}</li>
            <li>${esc(t("sheet.recipe3"))}</li>
            <li>${esc(t("sheet.recipe4"))}</li>
          </ol>
        </section>

        <section class="sheet-vocab">
          <h2 class="sheet-h2">${esc(t("sheet.vocabHeading"))}</h2>
          <p class="sheet-audio">${esc(vm.exercise ? t("sheet.exerciseHint") : t("sheet.audioHint"))}</p>
          ${stagesHtml}
        </section>

        ${sectionsHtml}

        ${vm.code ? `
        <section class="sheet-subscribe">
          <h2 class="sheet-h2">${esc(t("sheet.subscribeHeading"))}</h2>
          <div class="sheet-sub-row">
            <div class="sheet-sub-col">
              <p class="sheet-sub">${esc(t("sheet.subscribeHint"))}</p>
              ${vm.stageScoped ? `<p class="sheet-sub sheet-sub--note">${esc(t("sheet.subscribeWholeHint"))}</p>` : ""}
              <p class="sheet-code">${esc(vm.code)}</p>
              ${vm.link ? `<p class="sheet-link">${esc(vm.link)}</p>` : ""}
            </div>
            ${vm.qrSvg ? `<figure class="sheet-qr"><div class="sheet-qr-img">${vm.qrSvg}</div><figcaption class="sheet-qr-cap">${esc(t("sheet.scanHint"))}</figcaption></figure>` : ""}
          </div>
        </section>` : ""}

        <section class="sheet-notes">
          <h2 class="sheet-h2">${esc(t("sheet.notesHeading"))}</h2>
          ${vm.fill
            ? `<textarea class="sheet-fill-area" data-fk="notes" rows="3" autocapitalize="sentences" spellcheck="false" aria-label="${esc(t("sheet.notesHeading"))}"></textarea>`
            : `<div class="sheet-notes-lines" aria-hidden="true"></div>`}
        </section>

        <footer class="sheet-coord">
          <strong>${esc(t("sheet.coordHeading"))}:</strong> ${esc(t("sheet.coordNote"))}
        </footer>
      </article>`;

    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:file-text")} ` + esc(t("sheet.heading")), "open-teacher", { plainTitle: true })}
        ${controls}
        <div class="sheet-doc sheet-doc--exercise">${sheet}</div>
        ${answerKeySheet ? `<div class="sheet-doc sheet-doc--key">${answerKeySheet}</div>` : ""}
      </section>
      ${vm.targetPicker === "sheet" ? targetPickerModal("sheet", { targets: vm.targets, current: vm.sheetTarget }) : ""}`;
  }

  // Lernenden-Seite: mehrere abonnierte Aufgaben (parallel), plus Code-Eingabe zum
  // Hinzufügen weiterer. Jede Aufgabe ist einzeln startbar und entfernbar.
  function renderTask(vm) {
    const tasks = vm.tasks || [];
    const list = tasks.length
      ? `<p class="sectioncap">${esc(t("task.yours", { n: tasks.length }))}</p>
         <ul class="task-list">
           ${tasks.map((tk) => `
             <li class="task-item${tk.done ? " task-item--done" : tk.started ? " task-item--active" : ""}"${tk.done ? ` aria-label="${esc(tk.targetLabel + " – " + t("task.done"))}"` : tk.started ? ` aria-label="${esc(tk.targetLabel + " – " + t("task.inProgress"))}"` : ""}>
               <div class="task-item__body">
                 <span class="task-item__target"><span aria-hidden="true">${renderIcon(tk.done ? "lc:check-circle" : tk.started ? "lc:hourglass" : "lc:target")}</span> ${esc(tk.targetLabel)}${tk.done ? ` <span class="task-item__badge" role="status" title="${esc(t("task.doneHint"))}">${esc(t("task.done"))}</span>` : tk.started ? ` <span class="task-item__badge task-item__badge--active" role="status" title="${esc(t("task.inProgressHint"))}">${esc(t("task.inProgress"))}</span>` : ""}</span>
                 ${tk.title ? `<span class="task-item__title">„${esc(tk.title)}“</span>` : ""}
                 ${!tk.done && tk.total > 0 ? `<span class="task-item__progress">${esc(t(tk.progressKind === "stages" ? "task.progStages" : "task.progCards", { seen: tk.seen, total: tk.total }))}</span>
                 ${tk.started ? `<span class="task-item__bar" aria-hidden="true"><span class="task-item__bar-fill" style="width:${tk.pct}%"></span></span>` : ""}` : ""}
                 ${tk.due ? `<span class="task-item__due${tk.overdue && !tk.done ? " is-overdue" : ""}">${esc(t(tk.overdue && !tk.done ? "task.overdue" : "task.dueLabel", { date: tk.due }))}</span>` : ""}
               </div>
               <div class="task-item__actions">
                 <button class="teacher-btn${tk.done ? "" : " teacher-btn--main"}" data-action="task-start" data-idx="${tk.idx}">${tk.done ? renderIcon("lc:rotate-ccw") + " " + esc(t("task.replay")) : renderIcon("lc:play") + " " + esc(t("task.start"))}</button>
                 <button class="teacher-x" data-action="task-remove" data-idx="${tk.idx}" aria-label="${esc(t("task.remove"))}" title="${esc(t("task.remove"))}">✕</button>
               </div>
             </li>`).join("")}
         </ul>
         <hr class="teacher-sep">`
      : `<p class="task-empty">${esc(t("task.empty"))}</p>`;
    const body = `
      ${list}
      <label class="task-label" for="task-code-input">${esc(t("task.pasteLabel"))}</label>
      <textarea id="task-code-input" class="task-code" rows="3" placeholder="HRT1.…"></textarea>
      <div class="teacher-actions">
        <button class="teacher-btn teacher-btn--main" data-action="task-open">${renderIcon("lc:plus")} ${esc(t("task.add"))}</button>
        <button class="teacher-btn" data-action="task-paste">${renderIcon("lc:clipboard-list")} ${esc(t("task.paste"))}</button>
      </div>
      <p class="task-paste-hint">${esc(t("task.pasteHelp"))}</p>`;
    // Mit eigenem Reiter (Edition) die untere Navigation mitzeigen und „Tarea“
    // hervorheben; sonst die schlichte Einzelseite mit Zurück-Knopf wie bisher.
    const cfg = window.SC.config || {};
    const withTab = !!(cfg.taskTab || cfg.teacherTab);
    // Modo profe ist im Tarea-Reiter mit eingehängt (kein eigener Reiter mehr).
    const profe = cfg.teacherTab
      ? `<hr class="teacher-sep">
         <button class="teacher-btn teacher-btn--profe" data-action="open-teacher">${renderIcon("lc:graduation-cap")} ${esc(t("teacher.title"))}</button>
         <p class="task-profe-hint">${esc(t("teacher.openHint"))}</p>`
      : "";
    return `
      <section class="screen${withTab ? " screen--tabbed" : ""}">
        ${hmTopbar(`${renderIcon("lc:square-pen")} ` + esc(t("task.title")), "home")}
        <p class="hm-intro">${esc(t("task.intro"))}</p>
        ${body}
        ${profe}
      </section>
      ${withTab ? tabbar("tarea") : ""}`;
  }

  // ---------- Ruta-Check (Einstufungstest) ----------
  function renderPlacement(vm) {
    if (vm.phase === "running") return renderPlacementQuestion(vm);
    if (vm.phase === "done") return renderPlacementDone(vm);
    return renderPlacementIntro(vm);
  }

  function renderPlacementIntro(vm) {
    // Im Onboarding: Kopf ohne Zurück-Knopf, dafür „Später“ zum Überspringen.
    const head = vm.fromOnboarding
      ? `<div class="pagehead"><h2 class="pagehead__title">${renderIcon("lc:target")} ${esc(t("placement.title"))}</h2></div>`
      : hmTopbar(renderIcon("lc:target") + " " + esc(t("placement.title")), "home");
    const later = vm.fromOnboarding
      ? `<button class="ghostbtn" data-action="placement-skip">${esc(t("placement.later"))}</button>` : "";
    return `
      <section class="screen">
        ${head}
        <p class="hm-intro">${esc(t("placement.introLead", { n: vm.total }))}</p>
        <div class="tip">${esc(t("placement.introHonest"))}</div>
        <ul class="pl-introlist">
          <li>${esc(t("placement.introB1"))}</li>
          <li>${esc(t("placement.introB2"))}</li>
          <li>${esc(t("placement.introB3"))}</li>
        </ul>
        ${vm.fromOnboarding ? "" : moduleShareBtn("ruta-check")}
        <div class="teacher-actions">
          <button class="teacher-btn teacher-btn--main" data-action="placement-start">${renderIcon("lc:play")} ${esc(t("placement.start"))}</button>
          ${later}
        </div>
      </section>`;
  }

  function renderPlacementQuestion(vm) {
    const q = vm.q;
    if (!q) return renderPlacementIntro(vm);
    const pct = Math.round(((vm.index + 1) / (vm.total || 1)) * 100);
    const head = `
      <div class="pl-progress">
        <div class="pl-progress__bar" aria-hidden="true"><div class="pl-progress__fill" style="width:${pct}%"></div></div>
        <span class="pl-progress__label" role="status" aria-live="polite">${esc(t("placement.qOf", { i: vm.index + 1, n: vm.total }))} · ${esc(q.level)}</span>
      </div>`;
    const prompt = `
      <p class="pl-prompt">${esc(q.promptDe)}</p>
      ${q.questionEs ? `<p class="pl-prompt-es" lang="es">„${esc(q.questionEs)}“</p>` : ""}`;
    const body = q.type === "free"
      ? `<input id="placement-free" class="task-input pl-free" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t("placement.freePh"))}" lang="es">
         <div class="teacher-actions">
           <button class="teacher-btn teacher-btn--main" data-action="placement-free-submit">${esc(t("placement.answer"))}</button>
         </div>`
      : `<div class="pl-options" role="group" aria-label="${esc(t("placement.optionsLabel"))}">
           ${q.options.map((o, i) => `<button class="pl-option" data-action="placement-choose" data-index="${i}" lang="es">${esc(o)}</button>`).join("")}
         </div>`;
    const unknown = `<button class="pl-unknown" data-action="placement-unknown">${renderIcon("lc:help-circle")} ${esc(t("placement.unknown"))}</button>`;
    const hint = vm.showHint ? `<p class="pl-hint">${esc(t("placement.unknownHint"))}</p>` : "";
    // Im Onboarding KEIN „Home“-Zurück-Pfeil (würde das Onboarding nicht abschließen);
    // Abbrechen geht über die Wisch-Geste (markiert onboarded) – sonst regulär zurück.
    const topbar = vm.fromOnboarding
      ? `<div class="pagehead"><h2 class="pagehead__title">${renderIcon("lc:target")} ${esc(t("placement.title"))}</h2></div>`
      : hmTopbar(renderIcon("lc:target") + " " + esc(t("placement.title")), "home");
    return `
      <section class="screen">
        ${topbar}
        ${head}
        ${prompt}
        ${body}
        ${unknown}
        ${hint}
      </section>`;
  }

  function renderPlacementDone(vm) {
    const noteText = vm.note === "commStrong" ? t("placement.noteComm")
      : vm.note === "grammarStrong" ? t("placement.noteGrammar") : "";
    // Zuverlässigkeits-Hinweis (Qualität des Tests, fließt NICHT in den Score).
    const relText = vm.reliability ? t("placement.rel_" + vm.reliability) : "";
    const skillRow = (s) => `
      <li class="pl-skill">
        <span class="pl-skill__name">${esc(t("placement.skill_" + s.skill))}</span>
        <span class="pl-skill__bar"><span class="pl-skill__fill" style="width:${s.accuracy}%"></span></span>
        <span class="pl-skill__val">${s.accuracy}%</span>
      </li>`;
    // Frage-für-Frage-Rückblick: was war richtig/falsch, was wäre korrekt + Erklärung.
    const review = reviewBox("placement", vm.review);
    // Im Onboarding führt der Zurück-Pfeil über „placement-finish“ (schließt das
    // Onboarding ab), sonst regulär nach Home.
    const topbar = hmTopbar(renderIcon("lc:target") + " " + esc(t("placement.title")), vm.fromOnboarding ? "placement-finish" : "home");
    return `
      <section class="screen">
        ${topbar}
        <div class="pl-result">
          <p class="pl-result__cap">${esc(t("placement.yourLevel"))}</p>
          <p class="pl-result__level">${esc(vm.level)}</p>
          <p class="pl-result__score">${esc(t("placement.resultLine", { correct: vm.correct, total: vm.total, score: vm.scorePct }))}</p>
        </div>
        <ul class="pl-stats">
          <li><b>${vm.accuracyPct}%</b> ${esc(t("placement.statAccuracy"))}</li>
          <li><b>${vm.unknownPct}%</b> ${esc(t("placement.statUnknown"))}</li>
          <li>${esc(t("placement.statTempo"))}: <b>${esc(t("placement.tempo_" + vm.tempo))}</b></li>
        </ul>
        <p class="sectioncap">${esc(t("placement.skillsCap"))}</p>
        <ul class="pl-skills">${vm.skills.map(skillRow).join("")}</ul>
        ${noteText ? `<div class="tip">${esc(noteText)}</div>` : ""}
        ${relText ? `<div class="tip pl-reliability pl-reliability--${esc(vm.reliability)}">${esc(relText)}</div>` : ""}
        ${review}
        ${shareBlock(vm.shareFormat, "share-placement", t("placement.share"))}
        <p class="pl-disclaimer">${esc(t("placement.schoolNote"))}</p>
        <div class="teacher-actions">
          <button class="teacher-btn teacher-btn--main" data-action="${vm.fromOnboarding ? "placement-finish" : "home"}">${esc(vm.fromOnboarding ? t("placement.toApp") : t("common.overview"))}</button>
          <button class="teacher-btn" data-action="placement-retake">${renderIcon("lc:rotate-ccw")} ${esc(t("placement.retake"))}</button>
        </div>
      </section>`;
  }

  // ----- HolaRuta Nivel-Test (ausführlicher Einstufungstest) -----
  // Drei Phasen wie beim Ruta-Check, aber eigener Screen/Namespace. Nutzt dieselben
  // pl-*-Stile für ein vertrautes, ruhiges Erscheinungsbild.
  function renderAssessment(vm) {
    if (vm.phase === "running") return renderAssessmentQuestion(vm);
    if (vm.phase === "done") return renderAssessmentDone(vm);
    return renderAssessmentIntro(vm);
  }

  function renderAssessmentIntro(vm) {
    // Zwei Tiefen zur Wahl: Standard und – mit Sprachausgabe – Extremo (mit Hören).
    const extremoBtn = vm.hasAudio
      ? `<button class="teacher-btn teacher-btn--main pl-variant pl-variant--extremo" data-action="assessment-start" data-variant="extremo">
           ${renderIcon("lc:headphones")} ${esc(t("assessment.startExtremo", { n: vm.extremoTotal }))}
           <span class="pl-variant__desc">${esc(t("assessment.variantExtremoDesc"))}</span>
         </button>`
      : `<div class="tip pl-noaudio">${esc(t("assessment.extremoNoAudio"))}</div>`;
    return `
      <section class="screen">
        ${hmTopbar(renderIcon("lc:clipboard-list") + " " + esc(t("assessment.title")), "home")}
        <p class="hm-intro">${esc(t("assessment.introLead", { n: vm.standardTotal }))}</p>
        <div class="tip">${esc(t("assessment.introHonest"))}</div>
        <ul class="pl-introlist">
          <li>${esc(t("assessment.introB1"))}</li>
          <li>${esc(t("assessment.introB2"))}</li>
          <li>${esc(t("assessment.introB3"))}</li>
          <li>${esc(t("assessment.introB4"))}</li>
        </ul>
        ${moduleShareBtn("nivel-test")}
        <p class="sectioncap">${esc(t("assessment.chooseVariant"))}</p>
        <div class="pl-variants">
          <button class="teacher-btn teacher-btn--main pl-variant" data-action="assessment-start" data-variant="standard">
            ${renderIcon("lc:play")} ${esc(t("assessment.startStandard", { n: vm.standardTotal }))}
            <span class="pl-variant__desc">${esc(t("assessment.variantStandardDesc"))}</span>
          </button>
          ${extremoBtn}
        </div>
      </section>`;
  }

  function renderAssessmentQuestion(vm) {
    const q = vm.q;
    if (!q) return renderAssessmentIntro(vm);
    const pct = Math.round(((vm.index + 1) / (vm.total || 1)) * 100);
    // Abschnitts-Hinweis: Hörverstehen / freie Antworten / Verständnis & Grammatik.
    const sectionLabel = vm.section === "free" ? t("assessment.sectionFree")
      : vm.section === "listen" ? t("assessment.sectionListen") : t("assessment.sectionMc");
    const head = `
      <div class="pl-progress">
        <div class="pl-progress__bar" aria-hidden="true"><div class="pl-progress__fill" style="width:${pct}%"></div></div>
        <span class="pl-progress__label" role="status" aria-live="polite">${esc(sectionLabel)} · ${esc(t("assessment.qOf", { i: vm.index + 1, n: vm.total }))} · ${esc(q.level)}</span>
      </div>`;
    // Hör-Item: großer Abspiel-Knopf statt sichtbarem Spanisch-Satz.
    const listenBlock = q.type === "listen"
      ? `<button class="pl-listen" data-action="assessment-listen-play" aria-label="${esc(t("assessment.listenPlay"))}">
           <span class="pl-listen__icon" aria-hidden="true">${renderIcon("lc:volume-2")}</span>
           <span class="pl-listen__label">${esc(t("assessment.listenPlay"))}</span>
         </button>
         <p class="pl-hint pl-hint--listen">${renderIcon("lc:ear")} ${esc(t("assessment.listenHint"))}</p>`
      : "";
    const prompt = `
      <p class="pl-prompt">${esc(q.promptDe)}</p>
      ${q.questionEs ? `<p class="pl-prompt-es" lang="es">„${esc(q.questionEs)}“</p>` : ""}`;
    const body = q.type === "free"
      ? `<input id="assessment-free" class="task-input pl-free" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t("assessment.freePh"))}" lang="es">
         <div class="teacher-actions">
           <button class="teacher-btn teacher-btn--main" data-action="assessment-free-submit">${esc(t("assessment.answer"))}</button>
         </div>`
      : `<div class="pl-options" role="group" aria-label="${esc(t("assessment.optionsLabel"))}">
           ${q.options.map((o, i) => `<button class="pl-option" data-action="assessment-choose" data-index="${i}" lang="es">${esc(o)}</button>`).join("")}
         </div>`;
    const unknown = `<button class="pl-unknown" data-action="assessment-unknown">${renderIcon("lc:help-circle")} ${esc(t("assessment.unknown"))}</button>`;
    const hint = vm.showHint ? `<p class="pl-hint">${esc(t("assessment.unknownHint"))}</p>` : "";
    return `
      <section class="screen">
        ${hmTopbar(renderIcon("lc:clipboard-list") + " " + esc(t("assessment.title")), "home")}
        ${head}
        ${prompt}
        ${listenBlock}
        ${body}
        ${unknown}
        ${hint}
      </section>`;
  }

  function renderAssessmentDone(vm) {
    const noteText = vm.note === "commStrong" ? t("assessment.noteComm")
      : vm.note === "grammarStrong" ? t("assessment.noteGrammar") : "";
    const relText = vm.reliability ? t("assessment.rel_" + vm.reliability) : "";
    const skillRow = (s) => `
      <li class="pl-skill">
        <span class="pl-skill__name">${esc(t("assessment.skill_" + s.skill))}</span>
        <span class="pl-skill__bar"><span class="pl-skill__fill" style="width:${s.accuracy}%"></span></span>
        <span class="pl-skill__val">${s.accuracy}%</span>
      </li>`;
    const review = reviewBox("assessment", vm.review);
    return `
      <section class="screen">
        ${hmTopbar(renderIcon("lc:clipboard-list") + " " + esc(t("assessment.title")), "home")}
        <div class="pl-result">
          <p class="pl-result__cap">${esc(t("assessment.yourLevel"))}</p>
          <p class="pl-result__level">${esc(vm.level)}</p>
          ${vm.variant ? `<p class="pl-result__variant">${esc(t("assessment.variant_" + vm.variant))}${vm.variant === "extremo" ? " · " + renderIcon("lc:headphones") : ""}</p>` : ""}
          <p class="pl-result__score">${esc(t("assessment.resultLine", { correct: vm.correct, total: vm.total, score: vm.scorePct }))}</p>
        </div>
        <ul class="pl-stats">
          <li><b>${vm.accuracyPct}%</b> ${esc(t("assessment.statAccuracy"))}</li>
          <li><b>${vm.unknownPct}%</b> ${esc(t("assessment.statUnknown"))}</li>
          <li>${esc(t("assessment.statTempo"))}: <b>${esc(t("assessment.tempo_" + vm.tempo))}</b></li>
        </ul>
        <p class="sectioncap">${esc(t("assessment.skillsCap"))}</p>
        <ul class="pl-skills">${vm.skills.map(skillRow).join("")}</ul>
        ${noteText ? `<div class="tip">${esc(noteText)}</div>` : ""}
        ${relText ? `<div class="tip pl-reliability pl-reliability--${esc(vm.reliability)}">${esc(relText)}</div>` : ""}
        ${review}
        ${shareBlock(vm.shareFormat, "share-assessment", t("assessment.share"))}
        <p class="pl-disclaimer">${esc(t("assessment.schoolNote"))}</p>
        <div class="teacher-actions">
          <button class="teacher-btn teacher-btn--main" data-action="home">${esc(t("common.overview"))}</button>
          <button class="teacher-btn" data-action="assessment-retake">${renderIcon("lc:rotate-ccw")} ${esc(t("assessment.retake"))}</button>
        </div>
      </section>`;
  }

  // Battle: Szene wählen.
  function renderBattleSetup(vm) {
    // Badge zeigt die tatsächliche Rundenzahl bei der gewählten Länge – ehrlicher
    // als die reine Aufgabenzahl (kleine Szenen ergeben weniger Runden).
    const roundsBadge = (n) => `<span class="hm-scene__count">${esc(t("discover.battleRounds", { n }))}</span>`;
    const scenes = [
      `<button class="hm-scene" data-action="start-battle" data-scene="all">
         <span class="hm-scene__icon" aria-hidden="true">${renderIcon("lc:dices")}</span>
         <span class="hm-scene__label">${esc(t("discover.battleAllScenes"))}</span>
         ${roundsBadge(vm.totalRounds)}
       </button>`,
      ...vm.scenes.map((s) =>
        `<button class="hm-scene" data-action="start-battle" data-scene="${esc(s.id)}">
           <span class="hm-scene__icon" aria-hidden="true">${renderIcon(s.icon)}</span>
           <span class="hm-scene__label">${esc(s.label)}</span>
           ${roundsBadge(s.rounds)}
         </button>`),
    ].join("");
    const lengths = vm.lengths.map((l) =>
      `<button class="seg seg--len ${l.selected ? "is-active" : ""}" data-action="set-battle-length" data-len="${l.value}"
               aria-pressed="${l.selected}">
         <span class="seg__name">${esc(l.label)}</span>
         <span class="seg__sub">${esc(t("discover.battleRounds", { n: l.value }))}</span>
       </button>`).join("");
    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:swords")} Battle`, "open-hostel")}
        <p class="hm-intro">${esc(t("discover.battleSetupIntro"))}</p>
        <details class="hm-how" open>
          <summary class="hm-how__sum">${esc(t("discover.battleHowSum"))}</summary>
          <ol class="hm-steps">
            <li>${t("discover.battleStep1")}</li>
            <li>${t("discover.battleStep2")}</li>
            <li>${t("discover.battleStep3")}</li>
            <li>${t("discover.battleStep4")}</li>
          </ol>
        </details>
        <div class="hm-length">
          <span class="hm-length__cap">${esc(t("discover.battleLength"))}</span>
          <div class="segmented segmented--len" role="group" aria-label="${esc(t("discover.battleLengthAria"))}">${lengths}</div>
        </div>
        <div class="hm-names">
          <span class="hm-length__cap">${esc(t("discover.battleNames"))} <span class="hm-names__opt">${esc(t("discover.battleNamesOpt"))}</span></span>
          <div class="hm-names__row">
            <input id="pname-a" class="hm-name" type="text" inputmode="text" autocomplete="off"
                   maxlength="14" placeholder="${esc(t("discover.battlePlayerA"))}" aria-label="${esc(t("discover.battleNameA"))}" value="${esc(vm.names.A)}">
            <span class="hm-names__vs" aria-hidden="true">${esc(t("discover.battleVs"))}</span>
            <input id="pname-b" class="hm-name" type="text" inputmode="text" autocomplete="off"
                   maxlength="14" placeholder="${esc(t("discover.battlePlayerB"))}" aria-label="${esc(t("discover.battleNameB"))}" value="${esc(vm.names.B)}">
          </div>
        </div>
        <div class="hm-scenes"><span class="hm-length__cap">${t("discover.battlePickScene")}</span>${scenes}</div>
      </section>`;
  }

  // Battle: laufende Runde.
  function renderBattle(vm) {
    const solution = vm.revealed
      ? `
        <div class="hm-solution" role="status" aria-live="polite">
          <span class="hm-solution__cap">${esc(t("discover.battleSolution"))}</span>
          <div class="hm-solution__es" lang="es">${esc(vm.answerEs)}</div>
          ${vm.alsoOk && vm.alsoOk.length
            ? `<div class="hm-solution__also">${esc(t("discover.battleAlsoOk"))} ${vm.alsoOk.map((a) => `<span lang="es">${esc(a)}</span>`).join(", ")}</div>`
            : ""}
        </div>
        <div class="hm-verdict">
          <p class="hm-verdict__cap">${t("discover.battleRates", { name: esc(vm.raterName) })}</p>
          ${vm.alsoOk && vm.alsoOk.length
            ? `<p class="hm-verdict__fair">${esc(t("discover.battleFair"))}</p>`
            : ""}
          <div class="ratebar" role="group" aria-label="${esc(t("discover.battleRateAria"))}">
            <button class="feel feel--again" data-action="battle-score" data-points="0">
              <span class="feel__emoji" aria-hidden="true">${renderIcon("lc:x-circle")}</span><span class="feel__txt">${esc(t("discover.battleWrong"))}</span>
            </button>
            <button class="feel feel--good" data-action="battle-score" data-points="1">
              <span class="feel__emoji" aria-hidden="true">${renderIcon("lc:meh")}</span><span class="feel__txt">${esc(t("discover.battleAlmost"))}</span>
            </button>
            <button class="feel feel--easy" data-action="battle-score" data-points="2">
              <span class="feel__emoji" aria-hidden="true">${renderIcon("lc:check-circle")}</span><span class="feel__txt">${esc(t("discover.battleCorrect"))}</span>
            </button>
          </div>
        </div>`
      : `
        ${vm.hint ? `<div class="hm-hint">${renderIcon("lc:lightbulb")} ${esc(vm.hint)}</div>` : ""}
        <button class="cta" data-action="battle-reveal">${esc(t("discover.battleReveal"))}</button>`;

    const meta = `
      <span class="hm-prompt__tag">${renderIcon(vm.sceneIcon)} ${esc(vm.sceneLabel)}</span>
      ${vm.levelShort ? `<span class="hm-prompt__lvl">${esc(vm.levelShort)}</span>` : ""}`;

    return `
      <section class="screen study">
        ${hmTopbar(vm.suddenDeath ? esc(t("discover.battleSudden")) : `${renderIcon(vm.sceneIcon)} ${esc(vm.sceneLabel)}`, "battle-again")}
        <div class="hm-score">
          <span class="hm-score__p ${vm.current === "A" ? "is-turn" : ""}">${esc(vm.chipA)} <b>${vm.scores.A}</b></span>
          <span class="hm-score__round">${esc(t("discover.battleScoreRound", { sudden: vm.suddenDeath, round: vm.round, total: vm.totalRounds }))}</span>
          <span class="hm-score__p ${vm.current === "B" ? "is-turn" : ""}">${esc(vm.chipB)} <b>${vm.scores.B}</b></span>
        </div>
        <p class="hm-turn" aria-live="polite">${t("discover.battleTurn", { name: esc(vm.currentName) })}</p>
        <div class="hm-prompt"><div class="hm-prompt__meta">${meta}</div>${esc(vm.promptDe)}</div>
        <div class="controls">${solution}</div>
      </section>`;
  }

  // Battle: Auswertung.
  function renderBattleDone(vm) {
    const verdict = vm.winner === "tie"
      ? t("discover.battleTie")
      : t("discover.battleWins", { name: esc(vm.winnerName) });
    // Bei Gleichstand: Stichrunde anbieten (zwei Extra-Runden, A & B).
    const tieBreak = vm.winner === "tie"
      ? `<button class="cta cta--tiebreak" data-action="battle-sudden-death">${vm.suddenDeath ? esc(t("discover.battleAnotherSudden")) : esc(t("discover.battlePlaySudden"))}</button>`
      : "";
    const challenge = vm.challenge
      ? `
        <div class="hm-challenge">
          <span class="hm-challenge__cap">${esc(t("discover.battleChallengeCap"))}</span>
          <p class="hm-challenge__text">${esc(vm.challenge.textDe)}</p>
          <p class="hm-challenge__es" lang="es">${esc(vm.challenge.phraseEs)}</p>
          ${vm.challengeDone
            ? `<span class="hm-challenge__done">${esc(t("discover.battleChallengeDone"))}</span>`
            : `<button class="hm-challenge__btn" data-action="challenge-done" data-id="${esc(vm.challenge.id)}">${esc(t("discover.battleChallengeBtn"))}</button>`}
        </div>`
      : "";
    return `
      <section class="screen">
        <div class="done">
          <div class="done__emoji">${renderIcon("lc:party-popper")}</div>
          <h2>${t("discover.battleSurvived", { scene: esc(vm.sceneLabel) })}</h2>
          <p class="hm-result">
            <span class="hm-result__p ${vm.winner === "A" ? "is-win" : ""}">${esc(vm.nameA)}<br><b>${vm.scores.A}</b></span>
            <span class="hm-result__vs">:</span>
            <span class="hm-result__p ${vm.winner === "B" ? "is-win" : ""}">${esc(vm.nameB)}<br><b>${vm.scores.B}</b></span>
          </p>
          <p class="hm-winner">${verdict}</p>
          ${tieBreak}
          ${challenge}
          <button class="cta" data-action="battle-again">${esc(t("discover.battleAgain"))}</button>
          <button class="ghostbtn" data-action="home">${esc(t("common.overview"))}</button>
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
        ${hmTopbar(t("discover.roleplaysHead"), "open-hostel")}
        <p class="hm-intro">${esc(t("discover.roleplaySetupIntro"))}</p>
        <div class="hm-rps">${list}</div>
      </section>`;
  }

  // Rollenspiele: eine Szene.
  function renderRoleplay(vm) {
    if (!vm) {
      return `
        <section class="screen">
          ${hmTopbar(t("discover.roleplayHead"), "open-roleplay-setup")}
          <p class="stat-empty">${esc(t("discover.roleplayNotFound"))}</p>
        </section>`;
    }
    const roles = `
      <div class="hm-roles">
        <div class="hm-role hm-role--a">
          <span class="hm-role__tag">${esc(t("discover.roleplayPlayerA", { name: vm.roleA.name }))}</span>
          <span class="hm-role__goal">${esc(vm.roleA.goal)}</span>
        </div>
        <div class="hm-role hm-role--b">
          <span class="hm-role__tag">${esc(t("discover.roleplayPlayerB", { name: vm.roleB.name }))}</span>
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
           <span class="hm-phrases__cap">${esc(t("discover.rgUseful"))}</span>
           <ul class="hm-phrases__list">
             ${vm.usefulPhrases.map((p) => `<li lang="es">${esc(p)}</li>`).join("")}
           </ul>
         </div>`
      : "";

    return `
      <section class="screen">
        ${hmTopbar(t("discover.roleplayHead"), "open-roleplay-setup")}
        <div class="hm-rphead">
          <h2 class="hm-rphead__title">${esc(vm.title)}${vm.lvlShort ? ` <span class="hm-rphead__lvl">${esc(vm.lvlShort)}</span>` : ""}</h2>
          <p class="hm-rphead__sit">${esc(vm.situationDe)}</p>
        </div>
        ${roles}
        <button class="ghostbtn hm-swap" data-action="roleplay-swap">${esc(t("discover.roleplaySwap"))}</button>
        <div class="hm-dialogue">${lines}</div>
        ${phrases}
        <button class="ghostbtn" data-action="open-roleplay-setup">${esc(t("discover.roleplayOther"))}</button>
      </section>`;
  }

  // DEFINICIONES (Zuordnen-Quiz) ist nach features/definiciones.js
  // (SC.definiciones) gewandert – VMs, Handler und Render leben dort zusammen.

  // FRASES FLEXIBLES (Satzbaukasten) ist nach features/frases-game.js
  // (SC.frasesGame) gewandert – VMs, Handler und Render leben dort zusammen.

  // ---------- EL CUERPO (interaktive Körperkarte) ----------
  // VM, Render, die 3D-Geometrie-Konstanten (BP_ORBS/BP_FIGURE_3D/BP_LAYOUT3D) und
  // die komplette Dreh-/Auswahl-Logik wohnen jetzt in features/cuerpo.js (SC.cuerpo).


  // ---------- CONJUGACIÓN (Erklärseite Konjugieren) ----------
  // Kompakte Grammatik-Erklärung (Inhalte aus data.CONJUGATION): Personen,
  // die drei regelmäßigen Muster, wichtige unregelmäßige Reiseverben und ein
  // Wegbeschreibungs-Dialog. Unten ein CTA in die Übungskarten – er nutzt die
  // normale open-category-Aktion, also exakt den gewohnten Lernfluss.
  function renderConjugacion(vm) {
    const g = vm.guide;

    const personRows = g.persons
      .map((p) => `<li class="cinfo-word"><span class="cinfo-word__es" lang="es">${esc(p.es)}</span><span class="cinfo-word__de">${esc(p.de)}</span></li>`)
      .join("");

    // Eine Konjugations-Tabelle: Person links (gemeinsame tableLabels), Form
    // rechts. forms = 5 Formen in Personen-Reihenfolge – dieselbe Datenform
    // für regelmäßige und unregelmäßige Verben.
    const table = (forms) => `
      <ul class="cj-table">
        ${forms.map((f, i) => `<li class="cj-row"><span class="cj-row__p" lang="es">${esc(g.tableLabels[i])}</span><span class="cj-row__f" lang="es">${esc(f)}</span></li>`).join("")}
      </ul>`;

    const regularBlocks = g.regular
      .map((r) => `
        <div class="cj-verb">
          <h4 class="cj-verb__h" lang="es">${esc(r.title)}</h4>
          ${table(r.forms)}
          <p class="cj-verb__like">${esc(r.like)}</p>
        </div>`)
      .join("");

    // Unregelmäßige Verben als aufklappbare Karten (natives <details> wie bei
    // den Länderkunde-Gerichten) – Kopf zeigt Verb + Übersetzung, aufgeklappt
    // die fünf Formen und der Reise-Hinweis.
    const irregularBlocks = g.irregular
      .map((v) => `
        <details class="cinfo-dish">
          <summary class="cinfo-dish__head">
            <span class="cinfo-dish__heart">
              <span class="cinfo-dish__name" lang="es">${esc(v.verb)}</span>
              <span class="cinfo-dish__desc">${esc(v.de)}</span>
            </span>
            <span class="cinfo-dish__chev" aria-hidden="true">▾</span>
          </summary>
          <div class="cinfo-dish__body">
            ${table(v.forms)}
            ${v.note ? `<p class="cj-verb__like">${esc(v.note)}</p>` : ""}
          </div>
        </details>`)
      .join("");

    const exampleLines = g.example.lines
      .map((l) => `
        <div class="context-panel__line">
          <p class="context-panel__es" lang="es">${esc(l.es)}</p>
          <p class="context-panel__de">${esc(l.de)}</p>
        </div>`)
      .join("");

    return `
      <section class="screen">
        ${hmTopbar(`${renderIcon("lc:repeat")} Conjugación`, "home")}
        <p class="hm-intro">${esc(g.intro)}</p>
        ${moduleShareBtn("conjugacion")}

        ${sect("lc:users", t("discover.cjPersons"), `<ul class="cinfo-words">${personRows}</ul><p class="cinfo-text cj-note">${esc(g.personsNote)}</p>`)}
        ${sect("lc:blocks", t("discover.cjRegularPatterns"), `<div class="cj-verbs">${regularBlocks}</div><p class="cinfo-text cj-note">${esc(g.regularNote)}</p>`)}
        ${sect("lc:star", t("discover.cjIrregulars"), `<div class="cinfo-dishes">${irregularBlocks}</div>`)}
        ${sect("lc:compass", g.example.title, `${exampleLines}<p class="cinfo-text cj-note">${esc(g.example.note)}</p>`)}

        <button class="cta cj-cta" data-action="open-category" data-id="verbos">
          ${esc(t("discover.cjPractice"))} <span class="cta__count">${esc(t("home.tileCards", { n: vm.cardCount }))}</span>
        </button>
        ${vm.canDrill ? `
        <button class="cta cj-cta cj-cta--drill" data-action="open-conjug-drill">
          ${esc(t("discover.cjDrill"))}
        </button>` : ""}
      </section>`;
  }

  // ---------- CONJUGADOR (generativer Konjugations-Drill) ----------
  // Übt aktiv: „Verb + Person“ erscheint, man tippt die konjugierte Form. Items
  // werden pro Runde frisch aus data.CONJUGATION erzeugt (SC.conjug). Folgt dem
  // Precios-Drill-Muster (Setup → Lauf → Done).
  // CONJUGADOR (generativer Konjugations-Drill) ist nach features/conjugador.js
  // (SC.conjugDrill) gewandert – VMs, Handler und Render leben dort zusammen.
  // Die Erklärseite „Conjugación" (renderConjugacion) bleibt hier.

  // ---------- ¿Y esto? (Bild-Vokabel-Modus mit 3-2-1-Countdown) ----------
  // ¿Y ESTO? (Bild-Vokabel-Spiel) ist nach features/yesto-game.js
  // (SC.yestoGame) gewandert – VMs, Handler, Timer und Render leben dort zusammen.

  // ---------- DIÁLOGOS (Gesprächs-Simulationen) ----------
  // VMs, Render (Setup/Play/Done), die State-Maschine und alle Handler wohnen jetzt
  // im Feature-Modul SC.dialogosGame (features/dialogos-game.js); app.js delegiert
  // SCREENS, Aktionen, Spotlight-Vorschau, miniDone, Scroll-Hook und Auto-Vorlesen.


  // TIEMPOS (Zeitformen-Erklärseite) ist nach features/tiempos.js (SC.tiempos)
  // gewandert – VM und Render leben dort zusammen; der Opener (openTiempos) bleibt
  // im Controller. Der Themenblock-Baustein sect() kommt aus SC.view.

  // EL CUERPO (interaktive Körperkarte) ist nach features/cuerpo.js (SC.cuerpo)
  // gewandert – VM, Render, 3D-Geometrie und die Dreh-/Auswahl-Logik leben dort
  // zusammen; der Opener (openCuerpo) bleibt im Controller. cornerBtn() aus SC.view.


  // EINKAUFSZETTEL (Lista de compras) ist nach features/compras.js (SC.compras)
  // gewandert – VMs, Render (Liste/Quiz/Done) und alle Handler leben dort zusammen;
  // app.js delegiert SCREENS, Aktionen, Spotlight-Vorschau und miniDone. cornerBtn()
  // kommt aus SC.view.


  window.SC = window.SC || {};
  // Freunde & Tages-Rangliste (opt-in, BACKEND.md §16). Rein darstellend – die
  // Daten kommen aus socialVM() (app.js), das den Server über SC.social anspricht.
  function renderSocial(vm) {
    const head = `
      <div class="topbar">
        <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
        <div class="topbar__title">${esc(t("social.title"))}</div>
        <span></span>
      </div>
      <p class="social-intro">${esc(t("social.intro"))}</p>`;

    // Nicht angemeldet: ein Knopf, der den (geteilten) passwortlosen Login startet.
    if (!vm.loggedIn) {
      return `
        <section class="screen">
          ${head}
          <div class="social-cta">
            <p>${esc(t("social.loginNeeded"))}</p>
            <button class="cta" data-action="social-login">${esc(t("social.loginBtn"))}</button>
          </div>
        </section>`;
    }

    const codeBlock = vm.myCode ? `
      <div class="social-code">
        <span class="switchcap">${esc(t("social.myCodeCap"))}</span>
        <code class="social-code__val">${esc(vm.myCode)}</code>
        <div class="social-code__actions">
          <button class="ghostbtn" data-action="social-copy-code">${esc(t("social.copyCode"))}</button>
          <button class="ghostbtn" data-action="social-add-friend">${esc(t("social.addFriend"))}</button>
        </div>
      </div>` : `
      <div class="social-code">
        <button class="ghostbtn" data-action="social-add-friend">${esc(t("social.addFriend"))}</button>
      </div>`;

    let listHtml;
    if (vm.loading) {
      listHtml = `<p class="stat-empty">${esc(t("social.loading"))}</p>`;
    } else if (vm.error) {
      listHtml = `<p class="stat-empty">${esc(t("social.failed"))}</p>`;
    } else if (!vm.board || !vm.board.entries.length) {
      listHtml = `<p class="stat-empty">${esc(t("social.empty"))}</p>`;
    } else {
      listHtml = `<ol class="lboard">${vm.board.entries.map((e) => `
        <li class="lboard__row ${e.me ? "is-me" : ""}">
          <span class="lboard__rank">${e.rank}</span>
          <span class="lboard__name">${esc(e.name || "—")}${e.me ? ` <em class="lboard__you">${esc(t("social.you"))}</em>` : ""}</span>
          <span class="lboard__streak">${e.streak ? esc(t("social.streakCap", { n: e.streak })) : ""}</span>
          <span class="lboard__cards"><b>${e.cards}</b><small>${esc(t("social.columnCards"))}</small></span>
          ${e.me ? "" : `<button class="lboard__rm" data-action="social-remove" data-id="${esc(e.id)}" aria-label="${esc(t("social.removeFriend"))}">✕</button>`}
        </li>`).join("")}</ol>`;
    }

    return `
      <section class="screen">
        ${head}
        <div class="social-bar">
          <span class="sectioncap">${esc(t("social.todayCap"))}</span>
          <button class="ghostbtn" data-action="social-refresh">↻ ${esc(t("social.refresh"))}</button>
        </div>
        ${listHtml}
        ${codeBlock}
      </section>`;
  }

  window.SC.ui = { esc, renderHome, renderSearch, searchResults, renderOnboarding, renderStudy, renderDone, renderStats, renderCard, renderEditor, renderInfo, renderBebidas, renderTeacher, renderTask, renderPlacement, renderAssessment, renderPrintSheet,
                   renderBadges, renderSocial, badgeToast, noticeToast, updateNotice, updateBanner,
                   renderHostel, renderPretrip, renderBattleSetup, renderBattle, renderBattleDone, renderRoleplaySetup, renderRoleplay,
                   renderConjugacion,
                   renderFavorites, favoritesList,
                   placementCard, assessmentCard,
                   ONBOARD_SLIDE_COUNT: ONBOARD_SLIDES.length };
})();
