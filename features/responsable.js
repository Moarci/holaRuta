/*
 * features/responsable.js  (SC.responsableSheet) – „Viaja responsable": leichter
 * Fußabdruck (Leave No Trace, lokal kaufen, Plastik sparen, Natur/Kultur/Tiere
 * respektieren, faires Voluntariado, weniger CO₂). Info-Modul-Blatt
 * (SC.view.moduleSheet) mit DOs/Don'ts je Thema, spanischem Lesetraining, Sätzen
 * nach Situation, Glossar und „Wenig-Müll-Kit". Inhalte aus SC.responsable.
 *
 * Teil der app.js/ui.js-Zerlegung (Info-Screens, salud-Stil): VM und Render leben
 * hier zusammen; Controller-Dienste (i18n, Content-Modul) kommen per init(ctx).
 * Der Opener (openResponsable) bleibt im Controller; Suche & „Modul teilen" lesen
 * das Content-Modul SC.responsable direkt.
 *
 * Namensgebung: Content-Modul SC.responsable (Daten), Feature SC.responsableSheet.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { moduleSheet } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  function responsableVM() {
    const responsable = ctx.responsable;
    if (!responsable) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: (en && responsable.INTRO_EN) ? responsable.INTRO_EN : responsable.INTRO,
      topics: loc(responsable.TOPICS || []),
      phrases: loc(responsable.PHRASES || []),
      glossary: loc(responsable.GLOSSARY || []),
      checklist: loc(responsable.CHECKLIST || []),
    };
  }

  // ----- Render -----
  function renderResponsable(vm) {
    return moduleSheet(vm, {
      icon: "🌱", title: "Viaja responsable", cat: "responsable",
      readingPerTopic: true, // spanisches Lesetraining je Thema (es/vocab/level)
      favPhrases: ctx.isFavorite, // jeder Satz mit Stern → „Mi léxico"
      headTips: "discover.rpTips", headPhrases: "discover.rpPhrases",
      headWords: "discover.rpWords", headChecklist: "discover.rpChecklist",
      headChecklistHint: "discover.rpChecklistHint",
    });
  }

  window.SC.responsableSheet = {
    init(injected) { ctx = injected; },
    vm: responsableVM,
    screen: () => renderResponsable(responsableVM()),
  };
})();
