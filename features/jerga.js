/*
 * features/jerga.js  (SC.jergaSheet) – „Jerga colombiana": Slang verstehen &
 * mitreden. Info-Modul-Blatt (SC.view.moduleSheet) mit DOs/Don'ts je Thema,
 * spanischem Lesetraining (antippbare Vokabeln + Mini-Quiz), Sätzen nach Situation
 * und Schnell-Glossar. Inhalte aus dem Content-Modul SC.jerga (jerga.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Info-Screens, salud-Stil): VM (Daten 1:1
 * durchgereicht, …En-Felder per localizeDeep überlagert) und Render leben hier
 * zusammen; Controller-Dienste (i18n, Content-Modul) kommen per init(ctx). Der
 * Opener (openJerga) bleibt im Controller (Entdecken-Kachel + Shortcut-Map);
 * Suche & „Modul teilen" lesen das Content-Modul SC.jerga direkt.
 *
 * Namensgebung: Content-Modul SC.jerga (Daten), Feature-Modul SC.jergaSheet
 * (Bildschirm) – so kollidieren die Globals nicht.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { moduleSheet } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  // Pass-Through-Ansicht des Jerga-Moduls. Slang braucht keine Packliste → checklist
  // bleibt leer (der Abschnitt fällt im moduleSheet weg).
  function jergaVM() {
    const jerga = ctx.jerga;
    if (!jerga) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: (en && jerga.INTRO_EN) ? jerga.INTRO_EN : jerga.INTRO,
      topics: loc(jerga.TOPICS || []),
      phrases: loc(jerga.PHRASES || []),
      glossary: loc(jerga.GLOSSARY || []),
      checklist: [],
    };
  }

  // ----- Render -----
  function renderJerga(vm) {
    return moduleSheet(vm, {
      icon: "lc:megaphone", title: "Jerga colombiana", cat: "jerga",
      readingPerTopic: true, // spanisches Lesetraining je Thema (es/vocab/level)
      favPhrases: ctx.isFavorite, // jeder Satz mit Stern → „Mi léxico"
      headTips: "discover.jrTips", headPhrases: "discover.jrPhrases",
      headWords: "discover.jrWords",
    });
  }

  window.SC.jergaSheet = {
    init(injected) { ctx = injected; },
    vm: jergaVM,
    // SCREENS-Eintrag (app.js delegiert) + Spotlight-Vorschau (app.js liest vm().topics).
    screen: () => renderJerga(jergaVM()),
  };
})();
