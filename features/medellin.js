/*
 * features/medellin.js  (SC.medCiudadSheet + SC.medPaisaSheet) – die zwei
 * Medellín-Discover-Info-Module des Locals-Tracks („Descubre Medellín" und
 * „Cultura y sabor paisa"). Info-Blätter im Café-Stil (SC.view.moduleSheet):
 * informative Themen-Texte + Paisa-Glossar aus SC.medellin, und die „wichtigen
 * Sätze" LIVE aus den vorhandenen loc-med-Karten (ctx.data.CARDS) – EINE Quelle
 * der Wahrheit, kein Karten-Duplikat.
 *
 * Eine Sheet-Fabrik für beide Module (gemeinsamer VM-/Phrasen-Helfer). Kein
 * spanisches Lesetraining (readingPerTopic aus): die Lernenden sind Spanisch-
 * Muttersprachler. localizeDeep überlagert die …En-Felder für die englische UI.
 * Nur im Locals-Track sichtbar (Kacheln tracks:["es-en"]).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { moduleSheet } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  const isEn = () => !!(ctx && ctx.i18n && ctx.i18n.getLang && ctx.i18n.getLang() === "en");
  const loc = (v) => (ctx && ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
  const section = (key) => (window.SC.medellin && window.SC.medellin[key]) || null;

  // Phrasen-Gruppe je Thema LIVE aus den loc-med-Karten: gelernter englischer Satz
  // groß (es-Slot), spanische Frage klein (de-Slot). Max. 8 pro Thema (Übersichts-
  // charakter; die volle Kartenmenge lernt man im „Lernen"-Reiter).
  function phrasesFor(sec) {
    const data = ctx && ctx.data;
    if (!(sec && data && Array.isArray(data.CARDS))) return [];
    return (sec.TOPICS || []).map((tp) => {
      const cards = data.CARDS.filter((c) => c.cat === tp.cat).slice(0, 8);
      return {
        icon: tp.icon,
        title: isEn() ? (tp.titleEn || tp.title) : tp.title,
        items: cards.map((c) => ({ es: c.en, de: c.es })),
      };
    }).filter((g) => g.items.length);
  }

  function vmFor(key) {
    const sec = section(key);
    if (!sec) return { intro: "", topics: [], phrases: [], glossary: [], checklist: [] };
    return {
      intro: (isEn() && sec.INTRO_EN) ? sec.INTRO_EN : sec.INTRO,
      topics: loc(sec.TOPICS || []),
      phrases: phrasesFor(sec),
      glossary: loc(sec.GLOSSARY || []),
      checklist: [],
    };
  }

  function renderSheet(key, meta) {
    return moduleSheet(vmFor(key), {
      icon: meta.icon, title: meta.title, cat: meta.cat,
      favPhrases: ctx.isFavorite, // jeder Satz mit Stern → „Mi léxico"
      headTips: "discover.medTips", headPhrases: "discover.medPhrases", headWords: "discover.medWords",
      copyPhrases: true, // Kopier-Knopf an jedem Satz
    });
  }

  const CIUDAD = { icon: "lc:cable-car", title: "Descubre Medellín", cat: "med-ciudad" };
  const PAISA = { icon: "lc:heart", title: "Cultura y sabor paisa", cat: "med-paisa" };

  window.SC.medCiudadSheet = {
    init(injected) { ctx = injected; },
    vm: () => vmFor("ciudad"),
    screen: () => renderSheet("ciudad", CIUDAD),
  };
  window.SC.medPaisaSheet = {
    init(injected) { ctx = injected; },
    vm: () => vmFor("paisa"),
    screen: () => renderSheet("paisa", PAISA),
  };
})();
