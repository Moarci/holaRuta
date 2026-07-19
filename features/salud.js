/*
 * features/salud.js  (SC.saludSheet) – „Salud y energía": gesund & fit unterwegs
 * (ausgewogen essen, günstig trinken, Bauch, Sonne/Höhe, Bewegung). Info-Modul-
 * Blatt (SC.view.moduleSheet) mit Sätzen, Glossar und Checkliste. Inhalte aus
 * dem Content-Modul SC.salud (salud.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Info-Screens, wie jerga/derechos): VM (Daten
 * 1:1 durchgereicht, …En-Felder per localizeDeep überlagert) und Render leben
 * hier zusammen; Controller-Dienste (i18n, Content-Modul) kommen per init(ctx).
 * Der Opener (openSalud) bleibt im Controller; Suche & „Modul teilen" lesen das
 * Content-Modul SC.salud direkt.
 *
 * Namensgebung: Content-Modul SC.salud (Daten), Feature-Modul SC.saludSheet.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { moduleSheet } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  function saludVM() {
    const salud = ctx.salud;
    if (!salud) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const deEn = !!(window.SC && window.SC.track && window.SC.track.id && window.SC.track.id() === "de-en");
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: deEn && salud.INTRO_DEEN ? salud.INTRO_DEEN
           : (en && salud.INTRO_EN) ? salud.INTRO_EN
           : salud.INTRO,
      topics: loc(salud.TOPICS || []),
      phrases: loc(salud.PHRASES || []),
      glossary: loc(salud.GLOSSARY || []),
      checklist: loc(salud.CHECKLIST || []),
    };
  }

  // ----- Render -----
  function renderSalud(vm) {
    return moduleSheet(vm, {
      icon: "lc:salad", title: ctx.i18n.t("discover.saludName"), cat: "salud",
      favPhrases: ctx.isFavorite, // jeder Satz mit Stern → „Mi léxico"
      headTips: "discover.sdTips", headPhrases: "discover.sdPhrases",
      headWords: "discover.sdWords", headChecklist: "discover.sdChecklist",
      headChecklistHint: "discover.sdChecklistHint",
    });
  }

  window.SC.saludSheet = {
    init(injected) { ctx = injected; },
    vm: saludVM,
    screen: () => renderSalud(saludVM()),
  };
})();
