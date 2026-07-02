/*
 * features/cronologia.js  (SC.cronologia) – „Historia": die Geschichts-Erklärseite
 * für Süd- und Mittelamerika. Interaktiver Zeitstrahl (aufklappbare Epochen), eine
 * Galerie der Protagonisten, der „Heute"-Block mit aktuellen Spannungen und ein paar
 * „¿Sabías que…?"-Fakten. Pro Abschnitt ein spanisches Lesetraining (Lesetext mit
 * antippbaren Vokabel-Chips, Wörterliste, Mini-Quiz, Teilen) – der gemeinsame
 * readingBlock/levelMeta aus SC.view. Inhalte aus den lazy geladenen Content-Modulen
 * SC.historia (Sudamérica) bzw. SC.historiaCentro (Centroamérica); welches aktiv ist,
 * steuert state.histRegion ("sur" | "centro").
 *
 * Teil der app.js/ui.js-Zerlegung (Welle E – vormals „blockiert" durch den geteilten
 * readingBlock, der jetzt in SC.view wohnt): VM und Render leben hier zusammen;
 * Controller-Dienste kommen per init(ctx). Der Opener (openHistoria, lazy-Load +
 * state.histRegion) sowie die Sharepic-Logik (shareHistoria/shareHistModule/
 * findHistItem) und die DOM-nahen Aktionen (hist-word/hist-quiz-answer/scroll-to/
 * share-historia) bleiben im Controller; die Sharepics rufen cronologia.histMod().
 *
 * Namensgebung: die Content-Module heißen SC.historia/SC.historiaCentro, dieses
 * Feature-Modul SC.cronologia (Zeitstrahl/Chronologie) – so kollidieren die Globals
 * nicht.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  // Übersetzer wie in ui.js binden (i18n.js setzt SC.i18n.t === window.t vorab).
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, renderIcon, canShare, hmTopbar, levelMeta, readingBlock } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);

  // Aktives Geschichts-Modul nach Region (state.histRegion: "sur" | "centro").
  // So teilen sich Süd- und Mittelamerika dieselbe Render-/Share-Mechanik.
  function histMod() { return ctx.state.histRegion === "centro" ? (window.SC.historiaCentro || null) : (window.SC.historia || null); }
  function histTitle() { return ctx.state.histRegion === "centro" ? "🌋 Historia de Centroamérica" : "📜 Historia de Sudamérica"; }

  // ----- View-Modell -----
  function historiaVM() {
    const mod = histMod();
    if (!mod) return { intro: "", eras: [], figures: [], tensions: [], facts: [], topTitle: histTitle() };
    return {
      topTitle: histTitle(),
      intro: ctx.nat(mod.INTRO),
      eras: loc(mod.ERAS || []),
      figures: loc(mod.FIGURES || []),
      tensions: loc(mod.TENSIONS || []),
      facts: (mod.FACTS || []).map(ctx.nat),
    };
  }

  // Bilder kommen über Wikimedia Special:FilePath – so muss kein Hash geraten
  // werden; offline/bei Fehler blendet onerror sie aus.
  function commonsImg(file, w) {
    if (!file) return "";
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(file) + "?width=" + (w || 960);
  }

  // ----- Render -----
  function renderHistoria(vm) {
    // Sprungmarken-Leiste (wie die Spickzettel-Navigation).
    const nav = `
      <nav class="hist-nav" aria-label="${esc(t("discover.histAreas"))}">
        <a class="hist-nav__chip" href="#hist-zeitstrahl" data-action="scroll-to" data-target="hist-zeitstrahl">${renderIcon("lc:clock")} ${esc(t("discover.histNavTimeline"))}</a>
        <a class="hist-nav__chip" href="#hist-protagonisten" data-action="scroll-to" data-target="hist-protagonisten">${renderIcon("lc:user")} ${esc(t("discover.histNavFigures"))}</a>
        <a class="hist-nav__chip" href="#hist-heute" data-action="scroll-to" data-target="hist-heute">${renderIcon("lc:newspaper")} ${esc(t("discover.histNavToday"))}</a>
      </nav>`;

    // Auf Modul-Ebene teilbar: ein Sharepic des ganzen Moduls (Titel, Einleitung
    // und Zeitstrahl-Teaser) – damit man „Historia de Sudamérica" weiterempfehlen
    // kann, nicht nur einen einzelnen Text. Logik in app.shareHistModule.
    const moduleShare = canShare()
      ? `<div class="hist-modshare"><button class="hist-share" type="button" data-action="share-hist-module">${renderIcon("lc:upload")} ${esc(t("discover.histModuleShare"))}</button></div>`
      : "";

    // Eine Epoche als aufklappbare Karte am Zeitstrahl. Aufbau wie bei den
    // Protagonisten: zuerst der erklärende Text in der UI-Sprache, darunter das
    // spanische Lesetraining als eigener aufklappbarer Block.
    const era = (e) => {
      const img = e.img
        ? `<figure class="hist-era__fig">
             <img class="hist-era__img" src="${esc(commonsImg(e.img))}" alt="${esc(e.imgCaption || e.title)}"
                  loading="lazy" referrerpolicy="no-referrer" data-img-fallback="hide-figure" />
             ${e.imgCaption ? `<figcaption class="hist-era__cap">${esc(e.imgCaption)}</figcaption>` : ""}
           </figure>`
        : "";
      const lvl = levelMeta(e.level);
      const bodyText = (e.body || []).map((p) => `<p class="hist-era__p">${esc(p)}</p>`).join("");
      const reading = (e.es && e.es.length)
        ? `<details class="hist-read">
             <summary class="hist-read__sum">${renderIcon("lc:book-open")} ${esc(t("discover.histReadToggle"))}${lvl ? `<span class="hist-read__lvl hist-lvl--${esc(lvl.code)}">${esc(lvl.code)}</span>` : ""}<span class="hist-read__chev" aria-hidden="true">▾</span></summary>
             <div class="hist-read__body">${readingBlock({ es: e.es, vocab: e.vocab, level: e.level, shareId: e.id, quiz: true })}</div>
           </details>`
        : "";
      const points = (e.points || []).length
        ? `<ul class="hist-era__points">${e.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`
        : "";
      return `
        <details class="hist-era">
          <summary class="hist-era__head">
            <span class="hist-era__dot" aria-hidden="true">${renderIcon(e.icon || "•")}</span>
            <span class="hist-era__heart">
              <span class="hist-era__metarow">
                <span class="hist-era__period">${esc(e.period)}</span>
                ${lvl ? `<span class="hist-era__lvlchip hist-lvl--${esc(lvl.code)}">${esc(lvl.code)}</span>` : ""}
              </span>
              <span class="hist-era__title">${esc(e.title)}</span>
              <span class="hist-era__lead">${esc(e.lead)}</span>
            </span>
            <span class="hist-era__chev" aria-hidden="true">▾</span>
          </summary>
          <div class="hist-era__body">
            ${img}
            ${bodyText}
            ${reading}
            ${points}
          </div>
        </details>`;
    };
    const eras = (vm.eras || []).map(era).join("");

    // Ein Protagonist als Karte mit Porträt.
    const figure = (f) => {
      const img = f.img
        ? `<img class="hist-fig__img" src="${esc(commonsImg(f.img, 320))}" alt="${esc(f.name)}"
                loading="lazy" referrerpolicy="no-referrer" data-img-fallback="hide" />`
        : `<span class="hist-fig__img hist-fig__img--ph" aria-hidden="true">${renderIcon("lc:user")}</span>`;
      const quote = f.quote ? `<p class="hist-fig__quote">${esc(f.quote)}</p>` : "";
      const lvl = levelMeta(f.level);
      const reading = (f.es && f.es.length)
        ? `<details class="hist-read">
             <summary class="hist-read__sum">${renderIcon("lc:book-open")} ${esc(t("discover.histReadToggle"))}${lvl ? `<span class="hist-read__lvl hist-lvl--${esc(lvl.code)}">${esc(lvl.code)}</span>` : ""}<span class="hist-read__chev" aria-hidden="true">▾</span></summary>
             <div class="hist-read__body">${readingBlock({ es: f.es, vocab: f.vocab, level: f.level, shareId: f.id, quiz: false })}</div>
           </details>`
        : "";
      return `
        <article class="hist-fig">
          <div class="hist-fig__top">
            ${img}
            <div class="hist-fig__id">
              <h4 class="hist-fig__name">${f.flag ? `<span aria-hidden="true">${f.flag}</span> ` : ""}${esc(f.name)}</h4>
              <p class="hist-fig__role">${esc(f.role)}</p>
              <p class="hist-fig__years">${esc(f.years)}</p>
            </div>
          </div>
          <p class="hist-fig__text">${esc(f.text)}</p>
          ${quote}
          ${reading}
        </article>`;
    };
    const figures = (vm.figures || []).map(figure).join("");

    // Eine aktuelle Spannung/Lage als Karte mit Status-Plakette.
    const tension = (s) => {
      const lvl = levelMeta(s.level);
      const reading = (s.es && s.es.length)
        ? `<details class="hist-read">
             <summary class="hist-read__sum">${renderIcon("lc:book-open")} ${esc(t("discover.histReadToggle"))}${lvl ? `<span class="hist-read__lvl hist-lvl--${esc(lvl.code)}">${esc(lvl.code)}</span>` : ""}<span class="hist-read__chev" aria-hidden="true">▾</span></summary>
             <div class="hist-read__body">${readingBlock({ es: s.es, vocab: s.vocab, level: s.level, shareId: s.id, quiz: false })}</div>
           </details>`
        : "";
      return `
      <article class="hist-ten hist-ten--${esc(s.tone || "shift")}">
        <div class="hist-ten__head">
          <span class="hist-ten__icon" aria-hidden="true">${renderIcon(s.icon || "•")}</span>
          <h4 class="hist-ten__title">${esc(s.title)}</h4>
          <span class="hist-ten__badge">${esc(s.status)}</span>
        </div>
        <p class="hist-ten__where">${esc(s.where)}</p>
        <p class="hist-ten__text">${esc(s.text)}</p>
        ${reading}
      </article>`;
    };
    const tensions = (vm.tensions || []).map(tension).join("");

    const facts = (vm.facts || []).length
      ? `<div class="hist-facts">
           <h3 class="hist-block__h">${renderIcon("lc:lightbulb")} ${esc(t("discover.histFactsTitle"))}</h3>
           <ul class="hist-facts__grid">
             ${vm.facts.map((f) => `<li class="hist-fact">${esc(f)}</li>`).join("")}
           </ul>
         </div>`
      : "";

    return `
      <section class="screen">
        ${hmTopbar(esc(vm.topTitle || "📜 Historia de Sudamérica"), "home")}
        <p class="hm-intro">${esc(vm.intro)}</p>
        ${nav}
        ${moduleShare}

        <div class="hist-block" id="hist-zeitstrahl">
          <h3 class="hist-block__h">${renderIcon("lc:clock")} ${esc(t("discover.histTimelineTitle"))}</h3>
          <p class="hist-block__sub">${esc(t("discover.histTimelineSub"))}</p>
          <div class="hist-timeline">${eras}</div>
        </div>

        <div class="hist-block" id="hist-protagonisten">
          <h3 class="hist-block__h">${renderIcon("lc:user")} ${esc(t("discover.histFiguresTitle"))}</h3>
          <p class="hist-block__sub">${esc(t("discover.histFiguresSub"))}</p>
          <div class="hist-figs">${figures}</div>
        </div>

        <div class="hist-block" id="hist-heute">
          <h3 class="hist-block__h">${renderIcon("lc:newspaper")} ${esc(t("discover.histTodayTitle"))}</h3>
          <p class="hist-block__sub">${esc(t("discover.histTodaySub"))}</p>
          <div class="hist-tens">${tensions}</div>
        </div>

        ${facts}
      </section>`;
  }

  window.SC.cronologia = {
    init(injected) { ctx = injected; },
    vm: historiaVM,
    // SCREENS-Eintrag (app.js delegiert).
    screen: () => renderHistoria(historiaVM()),
    // Aktives Content-Modul nach Region – die Controller-Sharepics (shareHistoria/
    // shareHistModule/findHistItem) lesen es hierüber.
    histMod,
  };
})();
