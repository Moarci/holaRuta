/*
 * ruta-del-dia.test.js – Guard gegen zu viel Orts-/Länder-Spezifisches in der
 * täglichen Mini-Runde („Ruta del día").
 *
 * Hintergrund: Hat man viele Länder/Städte aktiv, sind sehr viele Karten der
 * Gruppe „destinos" fällig/neu. Ohne Guard füllten sie die Tagesrunde fast
 * komplett – statt Grundlagen & allgemeiner Module. openRutaDelDia() deckelt
 * destinos darum pro Runde (RUTA_DIA_DESTINO_CAP) und füllt den Rest mit
 * allgemeinen Karten.
 *
 * Der Test FÜHRT den echten Controller aus (Boot im DOM-Stub) und läuft die
 * gestartete Runde über echte Klick-Dispatches ab – die aktuell sichtbare
 * Karten-Id steht am „fav-toggle"-Button (data-id), darüber lässt sich die
 * Kategorie jeder Queue-Karte auflesen.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const stub = require("./_dom-stub.js");

// Höchstzahl orts-/länderspezifischer Karten pro Tagesrunde (Spiegel von
// RUTA_DIA_DESTINO_CAP in app.js – bewusst dupliziert, damit der Test die
// Erwartung explizit festschreibt).
const DESTINO_CAP = 2;

function freshApp() {
  stub.install();
  stub.seedOnboarded();
  const SRC = require("path").join(__dirname, "..");
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${require("path").sep}test${require("path").sep}`)) {
      delete require.cache[key];
    }
  }
  stub.installModules();
  return document.getElementById("app");
}

function makeDriver(root) {
  function find(action, data) {
    let sel = `[data-action="${action}"]`;
    if (data) for (const k in data) sel += `[data-${k}="${data[k]}"]`;
    return root.querySelector(sel);
  }
  function click(action, data) {
    const el = find(action, data);
    if (!el) return false;
    el.dispatchEvent({ type: "click", target: el, bubbles: true });
    return true;
  }
  function setTab(tab) { click("home") || click("set-tab", { tab: "start" }); return click("set-tab", { tab }); }
  return { find, click, setTab };
}

// Gruppe einer Kategorie-Id ("destinos" = Städte-/Länder-Pack).
function groupOf(catId) {
  const cat = (window.SC.data.CATEGORIES || []).find((c) => c.id === catId);
  return cat ? cat.group : null;
}
function catOfCard(cardId) {
  const card = (window.SC.data.CARDS || []).find((c) => c.id === cardId);
  return card ? card.cat : null;
}

// Läuft die laufende Lernrunde ab und sammelt die Kategorie-Gruppen aller
// Karten (Karten-Id steht am fav-toggle-Button). „skip" nimmt die aktuelle
// Karte ohne Bewertung aus der Queue – so wandert die Runde sauber durch. Die
// LETZTE Karte wird nur gelesen, nicht übersprungen: ein leer geklicktes Ende
// triggert den Fertig-Screen (celebrate.js), der im DOM-Stub degradiert crasht
// und für diesen Test irrelevant ist.
function collectRoundGroups(root, driver) {
  const bar = root.querySelector('[role="progressbar"]');
  const total = bar ? Number(bar.getAttribute("aria-valuemax")) : 0;
  const groups = [];
  for (let i = 0; i < total; i++) {
    const fav = root.querySelector('[data-action="fav-toggle"]');
    if (!fav) break; // keine Lernkarte mehr -> Runde fertig
    groups.push(groupOf(catOfCard(fav.getAttribute("data-id"))));
    if (i < total - 1) driver.click("skip"); // letzte Karte nicht leer klicken
  }
  return groups;
}

// Startet eine frische Tagesrunde und gibt ihre Kategorie-Gruppen zurück. Mehrfach
// aufrufbar: openRutaDelDia() baut die Queue jedes Mal neu (anderer shuffle), skip
// fasst den SRS-Fortschritt nicht an – die Karten bleiben also fällig.
function freshRound(root, d) {
  d.setTab("start");
  assert.ok(d.click("ruta-del-dia"), "Ruta del día startet");
  return collectRoundGroups(root, d);
}

// Über VIELE Runden geprüft – das ist der eigentliche Härtetest: Mit Guard hat
// jede Runde deterministisch genau zwei destinos. OHNE Guard zöge die Runde
// gleichverteilt aus allen Karten (~52 % destinos); dass über alle ROUNDS hinweg
// JEDE Runde zufällig ≤ 2 destinos hätte, ist praktisch ausgeschlossen
// (~0,04^ROUNDS). So fällt ein versehentliches Entfernen des Guards zuverlässig auf.
const ROUNDS = 8;

test("Ruta del día: destinos bleiben über viele Runden gedeckelt", () => {
  const root = freshApp();
  const d = makeDriver(root);
  for (let r = 1; r <= ROUNDS; r++) {
    const groups = freshRound(root, d);
    assert.ok(groups.length > 0, `Runde ${r}: enthält Karten`);
    // Jede Queue-Karte muss einer bekannten Kategorie zugeordnet sein – sonst misst
    // der Test (catOfCard/groupOf) ins Leere und „0 destinos" wäre wertlos.
    assert.ok(groups.every((g) => g !== null), `Runde ${r}: jede Karte hat eine bekannte Kategorie`);
    const destinos = groups.filter((g) => g === "destinos").length;
    assert.ok(
      destinos <= DESTINO_CAP,
      `Runde ${r}: höchstens ${DESTINO_CAP} destinos-Karten (waren ${destinos} von ${groups.length})`
    );
  }
});

test("Ruta del día: voll, mit genau dem reservierten destino-Anteil", () => {
  const root = freshApp();
  const d = makeDriver(root);

  // Frischer Start: alle Karten gelten als fällig (isDue(undefined) === true) und
  // es gibt weit mehr als 8 allgemeine Karten (1095) und mehr als 2 destinos
  // (1198). Die Auswahl ist damit deterministisch: 8 allgemeine + 2 destinos.
  const groups = freshRound(root, d);
  const destinos = groups.filter((g) => g === "destinos").length;
  assert.equal(groups.length, 10, "Tagesrunde ist voll (RUTA_DIA_CAP = 10)");
  assert.equal(destinos, DESTINO_CAP, "genau der reservierte destino-Anteil (kein Fluten)");
  assert.equal(groups.length - destinos, 10 - DESTINO_CAP, "Rest sind allgemeine Karten");
});
