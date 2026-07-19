/*
 * features/derechos.js  (SC.derechosSheet) – „Conoce tus derechos": ruhig & sicher
 * bei Kontrolle/Festnahme. Info-Modul-Blatt (SC.view.moduleSheet) mit DOs/Don'ts je
 * Thema, spanischem Lesetraining, Sätzen nach Situation, Glossar und „Im-Notfall-
 * vorbereitet-Kit". Inhalte aus dem Content-Modul SC.derechos (derechos.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Info-Screens, salud-Stil): VM (Daten 1:1
 * durchgereicht, …En-Felder per localizeDeep überlagert) und Render leben hier
 * zusammen; Controller-Dienste (i18n, Content-Modul) kommen per init(ctx). Der
 * Opener (openDerechos) bleibt im Controller; Suche & „Modul teilen" lesen das
 * Content-Modul SC.derechos direkt.
 *
 * Namensgebung: Content-Modul SC.derechos (Daten), Feature-Modul SC.derechosSheet.
 * WICHTIG (Inhalt): allgemeine Reise-Orientierung, KEIN Rechtsrat (siehe derechos.js).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { moduleSheet } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  function derechosVM() {
    const derechos = ctx.derechos;
    if (!derechos) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const deEn = !!(window.SC && window.SC.track && window.SC.track.id && window.SC.track.id() === "de-en");
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: deEn && derechos.INTRO_DEEN ? derechos.INTRO_DEEN
           : (en && derechos.INTRO_EN) ? derechos.INTRO_EN
           : derechos.INTRO,
      topics: loc(derechos.TOPICS || []),
      phrases: loc(derechos.PHRASES || []),
      glossary: loc(derechos.GLOSSARY || []),
      checklist: loc(derechos.CHECKLIST || []),
    };
  }

  // ----- Render -----
  function renderDerechos(vm) {
    return moduleSheet(vm, {
      icon: "lc:scale", title: ctx.i18n.t("discover.derechosName"), cat: "derechos",
      readingPerTopic: true, // spanisches Lesetraining je Thema (es/vocab/level)
      favPhrases: ctx.isFavorite, // jeder Satz mit Stern → „Mi léxico"
      headTips: "discover.drTips", headPhrases: "discover.drPhrases",
      headWords: "discover.drWords", headChecklist: "discover.drChecklist",
      headChecklistHint: "discover.drChecklistHint",
    });
  }

  window.SC.derechosSheet = {
    init(injected) { ctx = injected; },
    vm: derechosVM,
    screen: () => renderDerechos(derechosVM()),
  };
})();
