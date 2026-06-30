/*
 * endless.test.js – Endlos-Modus „Vocabulario sin fin" (Discover › Üben).
 *
 * Führt render()/onClick() echt aus (DOM-Stub), genau wie controller-smoke:
 * Discover öffnen → Kachel „open-endless" klicken → Study-Screen mit ∞-Zähler.
 * Kern-Eigenschaft: Die Runde endet NICHT – auch nach vielen Bewertungen bleibt
 * der Study-Screen stehen (kein Fertig-Screen), die Queue läuft nie leer.
 *
 * Aufruf:  node --test test/endless.test.js   (oder: node --test)
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const stub = require("./_dom-stub.js");

// Frischer App-Boot pro Test (identisch zu controller-smoke.test.js).
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
  function goHome() { if (!click("home")) click("set-tab", { tab: "start" }); }
  function setTab(tab) { goHome(); return click("set-tab", { tab }); }
  function html() { return root.innerHTML; }
  function nonEmpty() { return root.innerHTML.trim().length > 50; }
  return { find, click, goHome, setTab, html, nonEmpty };
}

test("Discover zeigt die Kachel „Vocabulario sin fin“ (open-endless)", () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("entdecken");
  assert.ok(d.find("open-endless"), "Endlos-Kachel ist im Discover-Screen vorhanden");
});

test("open-endless startet den Study-Screen im Endlos-Modus (∞-Zähler statt X/Y)", () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("entdecken");
  assert.ok(d.click("open-endless"), "open-endless klickbar");
  assert.match(d.html(), /data-action="flip"|data-action="rate"|id="answer"/,
    "Study-Screen zeigt Karteikarte/Eingabe");
  assert.match(d.html(), /∞/, "Endlos-Modus zeigt den ∞-Zähler");
});

test("Endlos-Modus endet nicht: viele Bewertungen → bleibt im Study-Screen", () => {
  const root = freshApp();
  const d = makeDriver(root);
  // sicher in den Karteikarten-Modus, damit flip/rate verfügbar sind
  d.setTab("profil");
  if (d.find("set-mode", { mode: "flip" })) d.click("set-mode", { mode: "flip" });
  d.setTab("entdecken");
  assert.ok(d.click("open-endless"), "open-endless klickbar");

  // Deutlich mehr Bewertungen als eine normale Runde (SESSION_CAP = 20) zulässt.
  for (let i = 0; i < 35; i++) {
    if (d.find("flip")) d.click("flip");
    assert.ok(d.click("rate", { rating: "good" }), `rate #${i + 1} klickbar`);
    assert.doesNotMatch(d.html(), /class="screen done"/, `kein Fertig-Screen nach rate #${i + 1}`);
    assert.match(d.html(), /∞/, `∞-Zähler bleibt nach rate #${i + 1}`);
  }
});

test("Endlos-Modus zieht „alle Themen gemischt“ (nicht in Datenreihenfolge Thema für Thema)", () => {
  // Frischer Nutzer ⇒ alle Karten fällig (isDue(undefined) === true). Würde der
  // Modus die fälligen unverändert (Datenreihenfolge) servieren, kämen die ersten
  // Karten alle aus derselben Anfangs-Kategorie. Der Mix-Fix mischt die Fälligen,
  // also müssen die ersten Karten mehrere Kategorien abdecken.
  const root = freshApp();
  const d = makeDriver(root);
  // id -> Kategorie aus den echten Daten (gleiche Quelle wie der Controller).
  const catById = new Map(window.SC.data.CARDS.map((c) => [c.id, c.cat]));

  d.setTab("profil");
  if (d.find("set-mode", { mode: "flip" })) d.click("set-mode", { mode: "flip" });
  d.setTab("entdecken");
  assert.ok(d.click("open-endless"), "open-endless klickbar");

  const cats = new Set();
  for (let i = 0; i < 20; i++) {
    const fav = root.querySelector('[data-action="fav-toggle"]');
    if (fav) { const cat = catById.get(fav.getAttribute("data-id")); if (cat) cats.add(cat); }
    if (d.find("flip")) d.click("flip");
    if (!d.click("rate", { rating: "good" })) break;
  }
  assert.ok(cats.size >= 2, `erste Karten decken mehrere Kategorien ab (gesehen: ${cats.size})`);
});

test("Endlos-Modus: „Zurück“ verlässt den Modus auf den Home-Screen", () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("entdecken");
  d.click("open-endless");
  assert.ok(d.click("home"), "Zurück-Knopf klickbar");
  assert.doesNotMatch(d.html(), /∞/, "nach Zurück kein Endlos-Study-Screen mehr");
  assert.match(d.html(), /data-action="set-tab"/, "Home-Navigation wieder sichtbar");
});
