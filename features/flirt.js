/*
 * features/flirt.js  (SC.flirtSheet) – „Coqueteo y romance": flirten & daten
 * unterwegs (ins Gespräch kommen, Komplimente, Konsens, Date vorschlagen,
 * Dating-Kultur, sicher daten). Info-Modul-Blatt (SC.view.moduleSheet) mit
 * spanischem Lesetraining je Thema und Kopier-Knopf an jedem Satz. Inhalte aus
 * dem Content-Modul SC.flirt (flirt.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Info-Screens, wie jerga/derechos): VM (Daten
 * 1:1 durchgereicht, …En-Felder per localizeDeep überlagert) und Render leben
 * hier zusammen; Controller-Dienste (i18n) kommen per init(ctx). Der Opener
 * (openFlirt) bleibt im Controller.
 *
 * WICHTIG: Der Opener läuft über navAfterLoad("flirt", …) – das Content-Modul
 * kann also (künftig) lazy nachgeladen werden und zur init-Zeit noch fehlen.
 * Darum liest die VM window.SC.flirt LIVE statt ctx.flirt (Konvention für
 * lazy/optionale Module, siehe featureCtx-Kommentar in app.js).
 *
 * Namensgebung: Content-Modul SC.flirt (Daten), Feature-Modul SC.flirtSheet.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { moduleSheet } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  function flirtVM() {
    const flirt = window.SC.flirt; // live: kann per navAfterLoad nachgeladen sein
    if (!flirt) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: (en && flirt.INTRO_EN) ? flirt.INTRO_EN : flirt.INTRO,
      topics: loc(flirt.TOPICS || []),
      phrases: loc(flirt.PHRASES || []),
      glossary: loc(flirt.GLOSSARY || []),
      checklist: loc(flirt.CHECKLIST || []),
    };
  }

  // ----- Render -----
  function renderFlirt(vm) {
    return moduleSheet(vm, {
      icon: "lc:heart", title: "Coqueteo y romance", cat: "flirt",
      favPhrases: ctx.isFavorite, // jeder Satz mit Stern → „Mi léxico"
      headTips: "discover.flTips", headPhrases: "discover.flPhrases",
      headWords: "discover.flWords", headChecklist: "discover.flChecklist",
      headChecklistHint: "discover.flChecklistHint",
      readingPerTopic: true, // spanisches Lesetraining je Thema (es/vocab/level)
      copyPhrases: true,     // jeder wichtige Satz mit Kopier-Knopf (zum Weiterschicken)
    });
  }

  window.SC.flirtSheet = {
    init(injected) { ctx = injected; },
    vm: flirtVM,
    screen: () => renderFlirt(flirtVM()),
  };
})();
