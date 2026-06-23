/*
 * phrase-favorites.test.js – Stern an den „Wichtigen Sätzen" der Module.
 *
 * Die Info-Module (Viaja responsable, Salud, Coqueteo, Logística, Jerga, Derechos)
 * rendern ihre Sätze über SC.view.moduleSheet. Jeder Satz trägt jetzt einen
 * Favoriten-Stern, der den Satz OHNE eigene Karte ins „Mi léxico" legt – der
 * Schnappschuss (es/de) reist als data-Attribute am Knopf mit.
 *
 * Dieser Test bootet die App im DOM-Stub (echter Dispatch-Pfad) und prüft:
 *   - der Stern erscheint in den Satz-Listen und trägt seinen Schnappschuss,
 *   - ein Klick legt den Satz als Favorit ab (store.loadFavorites),
 *   - die Id ist stabil und sprachunabhängig (favPhraseId aus dem es-Text),
 *   - ein zweiter Klick entfernt ihn wieder (Umschalter).
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const stub = require("./_dom-stub.js");

function freshApp() {
  stub.install();
  stub.seedOnboarded();
  const path = require("path");
  const SRC = path.join(__dirname, "..");
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${path.sep}test${path.sep}`)) {
      delete require.cache[key];
    }
  }
  stub.installModules();
  return document.getElementById("app");
}

// Klick wie im Browser: bubbelnder Dispatch auf den ersten passenden Knopf,
// onClick (delegiert auf #app) verarbeitet ihn und ruft render().
function click(root, action) {
  const el = root.querySelector(`[data-action="${action}"]`);
  if (!el) return false;
  el.dispatchEvent({ type: "click", target: el, bubbles: true });
  return true;
}

function openResponsable(root) {
  // Erst auf den Entdecken-Reiter, dort liegt der Modul-Opener (wie smoke-Test).
  click(root, "set-tab"); // start -> aktiver Reiter; entdecken explizit unten
  const tab = root.querySelector('[data-action="set-tab"][data-tab="entdecken"]');
  if (tab) tab.dispatchEvent({ type: "click", target: tab, bubbles: true });
  assert.ok(click(root, "open-responsable"), "open-responsable erreichbar");
  return root.innerHTML;
}

test("moduleSheet: Satz-Stern trägt einen Schnappschuss (es/de + cat)", () => {
  const root = freshApp();
  openResponsable(root);
  const star = root.querySelector('[data-action="fav-toggle"][data-es]');
  assert.ok(star, "Stern an den Wichtigen Sätzen vorhanden");
  assert.ok(star.getAttribute("data-es"), "spanischer Satz als Schnappschuss");
  assert.ok(star.getAttribute("data-de"), "Übersetzung als Schnappschuss");
  assert.equal(star.getAttribute("data-cat"), "responsable", "Modul-cat reist mit");
  assert.match(star.getAttribute("data-id"), /^favph-responsable-/, "stabile Satz-Id");
});

test("Klick legt den Satz ins Mi léxico und schaltet beim zweiten Klick wieder ab", () => {
  const root = freshApp();
  const { store } = window.SC;
  openResponsable(root);

  const star = root.querySelector('[data-action="fav-toggle"][data-es]');
  const es = star.getAttribute("data-es");
  const id = star.getAttribute("data-id");
  assert.equal(store.loadFavorites().length, 0, "anfangs leeres Lexikon");

  star.dispatchEvent({ type: "click", target: star, bubbles: true });
  let favs = store.loadFavorites();
  assert.equal(favs.length, 1, "ein Favorit nach dem Klick");
  assert.equal(favs[0].id, id);
  assert.equal(favs[0].es, es, "spanischer Satz gespeichert");
  assert.ok(favs[0].de, "Übersetzung gespeichert");

  // Stern spiegelt den Zustand (in-place, ohne Re-Render).
  assert.ok(star.classList.contains("is-on"), "Stern gefüllt");

  star.dispatchEvent({ type: "click", target: star, bubbles: true });
  assert.equal(store.loadFavorites().length, 0, "zweiter Klick entfernt wieder");
  assert.ok(!star.classList.contains("is-on"), "Stern wieder leer");
});

test("favPhraseId: stabil und sprachunabhängig (gleicher es-Text → gleiche Id)", () => {
  freshApp();
  const { favPhraseId } = window.SC.view;
  const a = favPhraseId("responsable", "Sin bolsa, gracias.");
  const b = favPhraseId("responsable", "Sin bolsa, gracias.");
  const c = favPhraseId("responsable", "Sin pitillo, por favor.");
  assert.equal(a, b, "deterministisch");
  assert.notEqual(a, c, "verschiedene Sätze → verschiedene Ids");
  assert.match(a, /^favph-responsable-/, "eigenes Präfix, kollidiert nicht mit Karten-Ids");
});
