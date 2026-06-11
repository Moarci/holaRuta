/*
 * store.js  (SC.store) – Persistenz. Kapselt localStorage komplett weg.
 * Speichert Lernfortschritt (pro Karte) und Einstellungen (z.B. Modus).
 * Wenn localStorage fehlt/fehlschlägt, läuft die App trotzdem (nur ohne Speichern).
 */
(function () {
  "use strict";

  const PROGRESS_KEY = "spanischcard.progress.v2";
  const SETTINGS_KEY = "spanischcard.settings.v1";
  const USERCARDS_KEY = "spanischcard.usercards.v1";

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn("store: lesen fehlgeschlagen", key, err);
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn("store: schreiben fehlgeschlagen", key, err);
    }
  }

  // Strukturwächter: externes/korrumpiertes localStorage darf die App nicht crashen.
  const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

  function loadProgress() {
    const v = readJson(PROGRESS_KEY, {});
    return isPlainObject(v) ? v : {};
  }
  function loadSettings() {
    const v = readJson(SETTINGS_KEY, { mode: "flip" });
    return isPlainObject(v) ? v : { mode: "flip" };
  }
  function loadUserCards() {
    const v = readJson(USERCARDS_KEY, []);
    if (!Array.isArray(v)) return [];
    // Nur Einträge mit gültiger id behalten (verhindert "undefined"-Karten & Crashes).
    return v.filter((c) => c && typeof c === "object" && typeof c.id === "string" && c.id);
  }

  window.SC = window.SC || {};
  window.SC.store = {
    loadProgress,
    saveProgress: (p) => writeJson(PROGRESS_KEY, p),
    resetProgress: () => {
      try { localStorage.removeItem(PROGRESS_KEY); } catch (e) { /* egal */ }
    },
    loadSettings,
    saveSettings: (s) => writeJson(SETTINGS_KEY, s),
    loadUserCards,
    saveUserCards: (c) => writeJson(USERCARDS_KEY, c),
  };
})();
