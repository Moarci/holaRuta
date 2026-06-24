/*
 * phrase-favorites.test.js – Stern an den „Wichtigen Sätzen" der Module.
 *
 * Alle Module mit „Wichtigen Sätzen" rendern ihre Satz-Listen über den gemeinsamen
 * Helfer SC.view.phraseGroups (moduleSheet-Module + die eigenständigen Renderer
 * Regatear/Fotos/Bailar/Música). Jeder Satz trägt jetzt einen Favoriten-Stern, der
 * den Satz OHNE eigene Karte ins „Mi léxico" legt – der Schnappschuss (es/de + cat)
 * reist als data-Attribute am Knopf mit.
 *
 * Dieser Test bootet die App im DOM-Stub (echter Dispatch-Pfad) und prüft:
 *   - der Stern erscheint in den Satz-Listen und trägt seinen Schnappschuss,
 *   - ein Klick legt den Satz als Favorit ab (store.loadFavorites),
 *   - die Id ist stabil und sprachunabhängig (favPhraseId aus dem es-Text),
 *   - ein zweiter Klick entfernt ihn wieder (Umschalter),
 *   - JEDES Modul mit Sätzen verdrahtet den Stern (Vollständigkeit).
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

// Ein Modul vom Entdecken-Reiter aus öffnen (echte onClick-Dispatches wie smoke-Test).
function openModule(root, action) {
  if (!click(root, "home")) click(root, "set-tab"); // zurück auf die Startseite
  const tab = root.querySelector('[data-action="set-tab"][data-tab="entdecken"]');
  if (tab) tab.dispatchEvent({ type: "click", target: tab, bubbles: true });
  const ok = click(root, action);
  return { ok, html: root.innerHTML };
}

function openResponsable(root) {
  const r = openModule(root, "open-responsable");
  assert.ok(r.ok, "open-responsable erreichbar");
  return r.html;
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

// Vollständigkeit: JEDES Modul mit „Wichtigen Sätzen" verdrahtet den Stern – egal,
// ob es über moduleSheet (Salud/Logística/Coqueteo/Juegos/Jerga/Derechos/Responsable)
// oder einen eigenständigen Renderer (Regatear/Fotos/Bailar/Música) läuft. Bewusst
// als einzelne test()-Fälle (nicht als Schleife), damit die Test-Zählung in der
// Doku-Konsistenzprüfung exakt der Laufzeit entspricht.
function assertModuleStar(action, cat) {
  const root = freshApp();
  const { ok } = openModule(root, action);
  assert.ok(ok, `${action} ist erreichbar`);
  // Mindestens ein Satz-Stern mit Schnappschuss + modul-eigener, stabiler Id.
  const star = root.querySelector(`[data-action="fav-toggle"][data-cat="${cat}"][data-es]`);
  assert.ok(star, `${cat}: Satz-Stern vorhanden`);
  assert.match(star.getAttribute("data-id"), new RegExp(`^favph-${cat}-`), `${cat}: stabile Id`);
  assert.ok(star.getAttribute("data-es"), `${cat}: spanischer Satz im Schnappschuss`);
  assert.ok(star.getAttribute("data-de"), `${cat}: Übersetzung im Schnappschuss`);
}

test("Vollständigkeit responsable: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-responsable", "responsable"));
test("Vollständigkeit salud: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-salud", "salud"));
test("Vollständigkeit logistica: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-logistica", "logistica"));
test("Vollständigkeit flirt: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-flirt", "flirt"));
test("Vollständigkeit juegos: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-juegos", "juegos"));
test("Vollständigkeit jerga: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-jerga", "jerga"));
test("Vollständigkeit derechos: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-derechos", "derechos"));
test("Vollständigkeit regatear: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-regatear", "regatear"));
test("Vollständigkeit fotos: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-fotos", "fotos"));
test("Vollständigkeit bailar: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-bailar", "bailar"));
test("Vollständigkeit musica: jeder Satz hat einen Stern (Mi léxico)", () => assertModuleStar("open-musica", "musica"));

// Banderas: das Saber-más-Blatt liegt eine Ebene tiefer (Hub → „Saber más"), darum
// ein eigener Fall mit zwei Klicks statt des einstufigen assertModuleStar-Helfers.
test("Vollständigkeit banderas: jeder Satz hat einen Stern (Mi léxico)", () => {
  const root = freshApp();
  assert.ok(openModule(root, "open-banderas").ok, "open-banderas erreichbar");
  assert.ok(click(root, "open-banderas-info"), "Saber más erreichbar");
  const star = root.querySelector('[data-action="fav-toggle"][data-cat="banderas"][data-es]');
  assert.ok(star, "banderas: Satz-Stern vorhanden");
  assert.match(star.getAttribute("data-id"), /^favph-banderas-/, "banderas: stabile Id");
  assert.ok(star.getAttribute("data-es"), "banderas: spanischer Satz im Schnappschuss");
  assert.ok(star.getAttribute("data-de"), "banderas: Übersetzung im Schnappschuss");
});
