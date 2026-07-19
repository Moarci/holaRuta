/*
 * features/spickzettel.js  (SC.spickzettel) – Survival-Schnellzugriff (kein SRS):
 * die kritischsten Sätze groß, je mit 🔊, plus Großanzeige zum Herzeigen.
 *
 * Track-fähig: im Reise-Track (de-es) die spanischen Überlebens-Sätze, im
 * Locals-Track (es-en) die kritischsten ARBEITS-Sätze auf Englisch („Supervivencia
 * laboral": Notfälle, Beschwerden, Begrüßung, Wege, Geld) – eigene Gruppenliste,
 * die gelernte Seite kommt über SC.track.learnLang() (card.en), die Stimme über
 * speech.js/ttsLocale automatisch als en-US.
 *
 * Erstes Feature-Modul der app.js/ui.js-Zerlegung. Es bündelt zusammengehörig:
 * Daten (SPICKZETTEL_GROUPS), View-Modell, Handler und Render. Den Zugriff auf
 * Controller-Dienste (zentraler State, Daten-Helfer, Persistenz) bekommt es per
 * Dependency-Injection über init(ctx) – so bleibt das Modul vom Controller
 * entkoppelt und einzeln testbar. app.js behält die Dispatch-Tabellen (Routing)
 * und delegiert nur an die hier exportierten Methoden.
 *
 * Lädt NACH view-helpers.js (nutzt SC.view) und VOR app.js (das init() ruft).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, renderIcon, hmTopbar, moduleShareBtn, favStar } = window.SC.view;

  // Vom Controller injizierte Dienste (init). Bündelt zentralen State, Daten-Helfer
  // und optionale Module – statt globaler Closures wie zuvor in app.js.
  let ctx = null;

  // Sprachfeld der GELERNTEN Seite (Reise: card.es, Locals: card.en) – dasselbe
  // Muster wie in den anderen track-fähigen Feature-Modulen (definiciones …).
  const trackLearnLang = () => (window.SC && window.SC.track && window.SC.track.learnLang && window.SC.track.learnLang()) || "es";

  // Kuratierte Überlebens-Bereiche: `pick` hebt die kritischsten Sätze an den
  // Anfang – auch quer zur Kategorie (z. B. "Hilfe!" steht in den Grundlagen,
  // gehört im Ernstfall aber nach ganz oben zu Notfall). Der Rest füllt sich
  // aus der Kategorie bis zum Cap auf, damit es mit der Datenbasis mitwächst.
  const SPICKZETTEL_GROUPS = [
    { cat: "notfall", limit: 10, pick: ["b17", "n01", "b18", "b19", "n08", "n10", "n11", "n14", "n06", "n15"] },
    { cat: "basics",  limit: 10, pick: ["b10", "b11", "b15", "b14", "b08", "b16", "b05", "b06"] },
    { cat: "rumbo",   limit: 6,  pick: ["b20", "dir20", "dir21", "dir23", "dir26"] },
    { cat: "dinero",  limit: 6,  pick: ["d01", "d04", "d05", "d06", "d07"] },
  ];

  // Locals-Track („Supervivencia laboral"): dieselbe Mechanik über den Englisch-
  // Korpus (data.locals.js) – die kritischsten Sätze für den Arbeitsalltag.
  const SPICKZETTEL_GROUPS_LOCALS = [
    { cat: "emergencias-en", limit: 10, pick: ["loc-eme03", "loc-eme24", "loc-eme02", "loc-eme04", "loc-eme10", "loc-eme17", "loc-eme14", "loc-eme16", "loc-eme15", "loc-eme01"] },
    { cat: "saludos-en",     limit: 10, pick: ["loc-sal08", "loc-sal07", "loc-sal01", "loc-sal02", "loc-sal05", "loc-sal06"] },
    { cat: "quejas-en",      limit: 8,  pick: ["loc-que01", "loc-que03", "loc-que02", "loc-que04", "loc-que07"] },
    { cat: "direcciones",    limit: 6,  pick: ["loc-dir01", "loc-dir02", "loc-dir03", "loc-dir08", "loc-dir06"] },
    { cat: "dinero-en",      limit: 6,  pick: ["loc-din05", "loc-din07", "loc-din06", "loc-din01"] },
  ];

  function spickzettelVM() {
    const { data, categoryById, cardById, nat, natk, isFavorite, speech, DEFAULT_ACCENT, state } = ctx;
    const learnLang = trackLearnLang();
    // NUR der echte Locals-Track (es-en) zieht aus dem Arbeits-Korpus
    // (data.locals.js: emergencias-en/saludos-en …). HelloAbroad (de-en) lernt
    // zwar ebenfalls Englisch (learnLang "en"), lädt aber KEIN data.locals.js –
    // seine Locals-Kategorien existieren dort nicht, der Zettel bliebe leer. de-en
    // bekommt daher dieselben Reise-Bereiche wie de-es (notfall/basics/rumbo/
    // dinero, alle im de-en-Allowlist); die gelernte Seite kommt über learnLang
    // aus card.en. Deshalb auf die Track-ID prüfen, nicht auf learnLang.
    const trackId = (window.SC.track && window.SC.track.id && window.SC.track.id()) || "de-es";
    const isDeEn = trackId === "de-en";
    const groupsDef = trackId === "es-en" ? SPICKZETTEL_GROUPS_LOCALS : SPICKZETTEL_GROUPS;
    const used = new Set(); // jede Karte höchstens einmal auf dem Zettel
    const groups = groupsDef.map((g) => {
      const cat = categoryById(g.cat);
      const picked = (g.pick || []).map(cardById).filter(Boolean);
      const rest = data.CARDS.filter((c) => c.cat === g.cat);
      const cards = [];
      for (const c of picked.concat(rest)) {
        if (cards.length >= g.limit) break;
        if (used.has(c.id)) continue;
        used.add(c.id);
        // Feldname `es` = GELERNTE Seite (Reise: Spanisch, Locals: Englisch) –
        // bewusst beibehalten, damit Renderer/Tests stabil bleiben. tip erklärt die
        // SPANISCHE Aussprache – für de-en (Englisch) unbrauchbar (bewusste MVP-
        // Lücke, siehe helloabroad-design.md), daher dort ausgeblendet.
        cards.push({ id: c.id, de: nat(c), es: c[learnLang] || c.es, tip: isDeEn ? null : (c.tip || null), fav: isFavorite(c.id) });
      }
      return {
        id: g.cat,
        label: cat ? natk(cat, "label") : g.cat,
        icon: cat ? cat.icon : "📌",
        grad: cat ? cat.grad : DEFAULT_ACCENT,
        cards,
      };
    }).filter((g) => g.cards.length);
    // Großanzeige: angetippter Satz bildschirmfüllend – zum Herzeigen.
    // nat(shown) statt shown.de: Locals-Karten tragen kein de-Feld.
    const shown = state.szShow ? cardById(state.szShow) : null;
    const show = shown ? { id: shown.id, de: nat(shown), es: shown[learnLang] || shown.es } : null;
    return { groups, show, speakable: !!(speech && speech.isSupported()), learnLang };
  }

  function openSpickzettel() {
    ctx.dismissBadgeToast();
    ctx.state.screen = "spickzettel";
    ctx.setState({ szShow: null });
  }

  // Großanzeige öffnen/schließen (Satz bildschirmfüllend zum Herzeigen).
  function szShow(id) {
    if (!ctx.cardById(id)) return;
    ctx.setState({ szShow: id });
  }

  function szClose() {
    ctx.setState({ szShow: null });
  }

  function renderSpickzettel(vm) {
    const nav = vm.groups.map((g) => `
      <a class="sz-nav__chip" href="#sz-${esc(g.id)}" data-action="scroll-to" data-target="sz-${esc(g.id)}" style="--from:${esc(g.grad[0])};--to:${esc(g.grad[1])}">
        <span aria-hidden="true">${esc(g.icon)}</span> ${esc(g.label)}
      </a>`).join("");
    const groups = vm.groups.map((g) => {
      const rows = g.cards.map((c) => `
        <div class="sz-row">
          <button class="sz-row__main" type="button" data-action="sz-show" data-id="${esc(c.id)}"
                  title="${esc(t("discover.szShowTitle"))}">
            <span class="sz-row__de">${esc(c.de)}</span>
            <span class="sz-row__es" lang="${esc(vm.learnLang)}">${esc(c.es)}</span>
            ${c.tip ? `<span class="sz-row__tip">${renderIcon("lc:audio-lines")} ${esc(c.tip)}</span>` : ""}
          </button>
          ${favStar(c.id, c.fav, { cls: "sz-fav" })}
          ${vm.speakable
            ? `<button class="sz-speak" type="button" data-action="speak-card" data-id="${esc(c.id)}" aria-label="${esc(t("discover.szListen"))}" title="${esc(t("discover.szListen"))}">${renderIcon("lc:volume-2")}</button>`
            : ""}
        </div>`).join("");
      return `
        <div class="sz-group" id="sz-${esc(g.id)}" style="--from:${esc(g.grad[0])};--to:${esc(g.grad[1])}">
          <h3 class="sz-group__h"><span aria-hidden="true">${esc(g.icon)}</span> ${esc(g.label)}</h3>
          <div class="sz-list">${rows}</div>
        </div>`;
    }).join("");
    // Großanzeige: Satz bildschirmfüllend – zum Herzeigen, wenn Reden nicht reicht.
    const show = vm.show ? `
      <div class="sz-show" data-action="sz-close" role="dialog" aria-modal="true" aria-label="${esc(t("discover.szShowLabel"))}">
        <div class="sz-show__inner">
          <p class="sz-show__es" lang="${esc(vm.learnLang)}">${esc(vm.show.es)}</p>
          <p class="sz-show__de">${esc(vm.show.de)}</p>
          <div class="sz-show__actions">
            ${vm.speakable
              ? `<button class="cta" type="button" data-action="speak-card" data-id="${esc(vm.show.id)}">${esc(t("discover.szListenBig"))}</button>`
              : ""}
            <button class="ghostbtn" type="button" data-action="sz-close">${esc(t("common.close"))}</button>
          </div>
        </div>
      </div>` : "";
    return `
      <section class="screen">
        ${hmTopbar("🆘 " + t("discover.spickzettelName"), "home")}
        <p class="hm-intro">${esc(t("discover.szIntro"))}</p>
        ${moduleShareBtn("supervivencia")}
        <nav class="sz-nav" aria-label="${esc(t("discover.szAreas"))}">${nav}</nav>
        ${groups}
        ${show}
      </section>`;
  }

  window.SC.spickzettel = {
    init(injected) { ctx = injected; },
    // Render-Eintrag für die SCREENS-Tabelle (app.js delegiert).
    screen: () => renderSpickzettel(spickzettelVM()),
    // Öffentliche VM – auch der Sharepic-Highlights-Aggregator (app.js) nutzt sie.
    vm: spickzettelVM,
    // Handler (von app.js-ACTIONS und der Zurück-Geste aufgerufen).
    open: openSpickzettel,
    szShow,
    szClose,
  };
})();
