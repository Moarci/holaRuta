/*
 * usercards.js  (SC.userCards) – Eigene, vom Nutzer angelegte Karten.
 * Domänen-Logik (Anlegen/Löschen/Prüfen). Persistenz läuft über SC.store.
 *
 * Eigene Karten haben dieselbe Form wie die fest eingebauten
 * (id, cat, lvl, de, es, tip) plus `custom: true`, damit der Rest der App sie
 * ohne Sonderbehandlung verarbeiten kann. Sie werden in app.js mit data.CARDS
 * zusammengeführt.
 */
(function () {
  "use strict";

  const store = window.SC.store;

  // In-Memory-Kopie, beim Start aus dem Speicher geladen.
  let cards = store.loadUserCards();

  function list() {
    return cards.slice(); // Kopie -> Aufrufer kann nichts versehentlich mutieren
  }

  // Eindeutige, kollisionsarme Id (Präfix "u" trennt von eingebauten Karten).
  function genId() {
    return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // Pflichtfelder prüfen -> Liste von Fehlertexten (leer = ok).
  // Übersetzer optional: ohne i18n (z.B. isolierter Test) deutscher Fallback.
  function tr(key, fallback) {
    return (typeof window !== "undefined" && window.t) ? window.t(key) : fallback;
  }
  function validate(input) {
    const errs = [];
    if (!String(input && input.de || "").trim()) errs.push(tr("app.edNeedQuestion", "Bitte die Frage (Deutsch) ausfüllen."));
    if (!String(input && input.es || "").trim()) errs.push(tr("app.edNeedAnswer", "Bitte die Antwort (Spanisch) ausfüllen."));
    return errs;
  }

  // Legt eine neue Karte an (immutabel) und speichert. Gibt die Karte zurück.
  function add(input) {
    const card = {
      id: genId(),
      cat: String(input.cat || "alltag"),
      lvl: Number(input.lvl) || 1,
      de: String(input.de || "").trim(),
      es: String(input.es || "").trim(),
      tip: String(input.tip || "").trim(),
      custom: true,
    };
    cards = cards.concat(card);
    store.saveUserCards(cards);
    return card;
  }

  // Entfernt eine eigene Karte.
  function remove(id) {
    cards = cards.filter((c) => c.id !== id);
    store.saveUserCards(cards);
  }

  window.SC = window.SC || {};
  window.SC.userCards = { list, add, remove, validate };
})();
