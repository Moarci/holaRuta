/*
 * features/cafe.js  (SC.cafeSheet) – „Café de la región": Kaffeeanbau & -kultur
 * (Anbau, Ernte, Verarbeitung, Rösten, Regionen, Finca-Besuch, fairer Handel)
 * + Sätze zum Bestellen, auf der Tour und beim Bohnenkauf. Info-Modul-Blatt
 * (SC.view.moduleSheet) mit spanischem Lesetraining je Thema und Kopier-Knopf
 * an jedem Satz. Inhalte aus dem Content-Modul SC.cafe (cafe.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Info-Screens, wie jerga/derechos): VM (Daten
 * 1:1 durchgereicht, …En-Felder per localizeDeep überlagert) und Render leben
 * hier zusammen; Controller-Dienste (i18n, Content-Modul) kommen per init(ctx).
 * Der Opener (openCafe) bleibt im Controller; Suche & „Modul teilen" lesen das
 * Content-Modul SC.cafe direkt.
 *
 * Namensgebung: Content-Modul SC.cafe (Daten), Feature-Modul SC.cafeSheet.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { moduleSheet } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  function cafeVM() {
    const cafe = ctx.cafe;
    if (!cafe) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: (en && cafe.INTRO_EN) ? cafe.INTRO_EN : cafe.INTRO,
      topics: loc(cafe.TOPICS || []),
      phrases: loc(cafe.PHRASES || []),
      glossary: loc(cafe.GLOSSARY || []),
      checklist: loc(cafe.CHECKLIST || []),
    };
  }

  // ----- Render -----
  function renderCafe(vm) {
    return moduleSheet(vm, {
      icon: "lc:coffee", title: "Café de la región", cat: "cafe",
      favPhrases: ctx.isFavorite, // jeder Satz mit Stern → „Mi léxico"
      headTips: "discover.cfTips", headPhrases: "discover.cfPhrases",
      headWords: "discover.cfWords", headChecklist: "discover.cfChecklist",
      headChecklistHint: "discover.cfChecklistHint",
      readingPerTopic: true, // spanisches Lesetraining je Thema (es/vocab/level)
      copyPhrases: true,     // jeder Satz mit Kopier-Knopf (zum Weiterschicken)
    });
  }

  window.SC.cafeSheet = {
    init(injected) { ctx = injected; },
    vm: cafeVM,
    screen: () => renderCafe(cafeVM()),
  };
})();
