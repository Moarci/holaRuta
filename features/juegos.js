/*
 * features/juegos.js  (SC.juegosSheet) – „Juegos de viaje": Hostel-Spiele (UNO,
 * Monopoly Deal, Presidente, Truco, Dudo, Cuarenta, Generala, Dominó, Yo nunca,
 * Hombre lobo) + die Sätze für den Tisch. Info-Modul-Blatt (SC.view.moduleSheet)
 * mit LatAm-Kultur-Lesetraining je Spiel und Kopier-Knopf an jedem Tisch-Satz.
 * Inhalte aus dem Content-Modul SC.juegos (juegos.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Info-Screens, wie jerga/derechos): VM (Daten
 * 1:1 durchgereicht, …En-Felder per localizeDeep überlagert) und Render leben
 * hier zusammen; Controller-Dienste (i18n, Content-Modul) kommen per init(ctx).
 * Der Opener (openJuegos) bleibt im Controller; Suche & „Modul teilen" lesen das
 * Content-Modul SC.juegos direkt.
 *
 * Namensgebung: Content-Modul SC.juegos (Daten), Feature-Modul SC.juegosSheet.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { moduleSheet } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  function juegosVM() {
    const juegos = ctx.juegos;
    if (!juegos) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: (en && juegos.INTRO_EN) ? juegos.INTRO_EN : juegos.INTRO,
      topics: loc(juegos.TOPICS || []),
      phrases: loc(juegos.PHRASES || []),
      glossary: loc(juegos.GLOSSARY || []),
      checklist: loc(juegos.CHECKLIST || []),
    };
  }

  // ----- Render -----
  function renderJuegos(vm) {
    return moduleSheet(vm, {
      icon: "lc:dices", title: "Juegos de viaje", cat: "juegos",
      favPhrases: ctx.isFavorite, // jeder Satz mit Stern → „Mi léxico"
      headTips: "discover.jgTips", headPhrases: "discover.jgPhrases",
      headWords: "discover.jgWords", headChecklist: "discover.jgChecklist",
      headChecklistHint: "discover.jgChecklistHint",
      readingPerTopic: true, // spanisches Lesetraining je Spiel (es/vocab/level)
      copyPhrases: true,     // jeder Tisch-Satz mit Kopier-Knopf (zum Weiterschicken)
    });
  }

  window.SC.juegosSheet = {
    init(injected) { ctx = injected; },
    vm: juegosVM,
    screen: () => renderJuegos(juegosVM()),
  };
})();
