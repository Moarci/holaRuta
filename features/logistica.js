/*
 * features/logistica.js  (SC.logisticaSheet) – „Logística de viaje": praktische
 * Reise-Logistik (SIM, Geld, Gepäck, Tracker, Handgepäck-Notfallset, Planung).
 * Info-Modul-Blatt (SC.view.moduleSheet) mit Sätzen, Glossar und Checkliste.
 * Inhalte aus dem Content-Modul SC.logistica (logistica.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Info-Screens, wie jerga/derechos): VM (Daten
 * 1:1 durchgereicht, …En-Felder per localizeDeep überlagert) und Render leben
 * hier zusammen; Controller-Dienste (i18n, Content-Modul) kommen per init(ctx).
 * Der Opener (openLogistica) bleibt im Controller; Suche & „Modul teilen" lesen
 * das Content-Modul SC.logistica direkt.
 *
 * Namensgebung: Content-Modul SC.logistica (Daten), Feature-Modul SC.logisticaSheet.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { moduleSheet } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  function logisticaVM() {
    const logistica = ctx.logistica;
    if (!logistica) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const deEn = !!(window.SC && window.SC.track && window.SC.track.id && window.SC.track.id() === "de-en");
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: deEn && logistica.INTRO_DEEN ? logistica.INTRO_DEEN
           : (en && logistica.INTRO_EN) ? logistica.INTRO_EN
           : logistica.INTRO,
      topics: loc(logistica.TOPICS || []),
      phrases: loc(logistica.PHRASES || []),
      glossary: loc(logistica.GLOSSARY || []),
      checklist: loc(logistica.CHECKLIST || []),
    };
  }

  // ----- Render -----
  function renderLogistica(vm) {
    return moduleSheet(vm, {
      icon: "lc:luggage", title: ctx.i18n.t("discover.logisticaName"), cat: "logistica",
      favPhrases: ctx.isFavorite, // jeder Satz mit Stern → „Mi léxico"
      headTips: "discover.lgTips", headPhrases: "discover.lgPhrases",
      headWords: "discover.lgWords", headChecklist: "discover.lgChecklist",
      headChecklistHint: "discover.lgChecklistHint",
    });
  }

  window.SC.logisticaSheet = {
    init(injected) { ctx = injected; },
    vm: logisticaVM,
    screen: () => renderLogistica(logisticaVM()),
  };
})();
