/*
 * controller-smoke.test.js – Controller-Sicherheitsnetz (Lane L0).
 *
 * Zweck: ein belastbares Netz vor einem späteren app.js-Refactoring. Die Tests
 * FÜHREN render() und onClick() tatsächlich AUS (kein bloßes Text-Scannen):
 * app.js bootet im DOM-Stub (test/_dom-stub.js), und alle Übergänge laufen über
 * echte Klick-Dispatches auf das gerenderte DOM – genau den Pfad, den der
 * Browser nimmt (Event-Delegation auf #app -> onClick -> setMode/flip/… ->
 * render()). Bricht ein Refactoring einen Screen oder einen Dispatch, schlägt
 * hier ein Test fehl.
 *
 * Aufruf:  node --test test/controller-smoke.test.js   (oder: node --test)
 *
 * BEWUSST AUSGELASSEN (siehe Kommentare unten):
 *   - Onboarding-Flow: erfordert eigenen Start ohne "onboarded"-Seed; das Netz
 *     bootet absichtlich ins Dashboard, um die Kern-Screens zu erreichen.
 *   - Tiefe Verläufe von Mini-Spielen (Battle-Runden, Quiz-Antwortketten,
 *     Precios-Eingaben): diese hängen an celebrate.js-Animationen / TTS / Timern,
 *     die im Stub nur degradiert laufen. Wir prüfen ihren EINSTIEG (Setup-Screen
 *     rendert), nicht jeden Folgezug – das Netz bliebe sonst fragil.
 *   - 3D-Körpermodell-Interaktion, Service-Worker, Sprachausgabe: durch fehlende
 *     Browser-APIs (WebGL/serviceWorker/speechSynthesis) im Stub inert; die
 *     App degradiert sauber, der cuerpo-Screen RENDERT aber (siehe Test).
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const stub = require("./_dom-stub.js");

// Frischer App-Boot pro Test: localStorage zurücksetzen, als "onboarded"
// markieren (sonst landet der Boot im Onboarding), Module neu laden. Da Node
// Module cached, würde ein erneutes require() app.js NICHT neu booten – deshalb
// löschen wir die App-Modul-Caches gezielt, damit jeder Test einen sauberen
// Controller-Zustand bekommt.
function freshApp() {
  stub.install();          // DOM/window/localStorage neu (frisches #app)
  stub.seedOnboarded();    // direkt ins Dashboard booten
  // App-Quelldateien aus dem require-Cache werfen, damit der IIFE-Boot (inkl.
  // render()) erneut läuft.
  const SRC = require("path").join(__dirname, "..");
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${require("path").sep}test${require("path").sep}`)) {
      delete require.cache[key];
    }
  }
  stub.installModules();
  return document.getElementById("app");
}

// ---- Klick-Helfer: dispatcht einen echten, bubbelnden Klick auf den ersten
// passenden Knopf; onClick (delegiert auf #app) verarbeitet ihn und ruft render().
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

// ---------------------------------------------------------------------------
// 1) Boot + Dashboard
// ---------------------------------------------------------------------------
test("Boot rendert das Dashboard ohne Throw und mit Inhalt", () => {
  const root = freshApp();
  assert.equal(typeof window.SC.app.render, "function", "render() wird exportiert");
  assert.ok(root.innerHTML.trim().length > 100, "Dashboard ist nicht leer");
  assert.match(root.innerHTML, /data-action="set-tab"/, "Reiter-Navigation vorhanden");
});

test("render() ist idempotent aufrufbar (kein Throw beim erneuten Zeichnen)", () => {
  const root = freshApp();
  const before = root.innerHTML.length;
  assert.doesNotThrow(() => window.SC.app.render());
  assert.doesNotThrow(() => window.SC.app.render());
  assert.ok(root.innerHTML.length > 0);
  assert.ok(Math.abs(root.innerHTML.length - before) < before, "stabiler Output");
});

// ---------------------------------------------------------------------------
// 2) Reiter-Wechsel (set-tab) – echte onClick-Dispatches, Screen-Übergänge
// ---------------------------------------------------------------------------
test("set-tab schaltet zwischen den Home-Reitern und markiert den aktiven", () => {
  const root = freshApp();
  const d = makeDriver(root);
  function activeTabs() {
    const out = [];
    root.querySelectorAll('[data-action="set-tab"]').forEach((e) => {
      if (e.classList.contains("is-active")) out.push(e.getAttribute("data-tab"));
    });
    return out;
  }
  assert.deepEqual(activeTabs(), ["start"], "Boot landet auf Start");
  for (const tab of ["lernen", "entdecken", "profil", "start"]) {
    assert.ok(d.setTab(tab), `Reiter "${tab}" ist anklickbar`);
    assert.deepEqual(activeTabs(), [tab], `Reiter "${tab}" ist nach Klick aktiv`);
    assert.ok(d.nonEmpty(), `Reiter "${tab}" rendert Inhalt`);
  }
});

// ---------------------------------------------------------------------------
// 3) Kern-Lernpfad: study (flip / type / listen), flip, rate, skip
// ---------------------------------------------------------------------------
test("study-all startet die Lernrunde (Study-Screen erscheint)", () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("start");
  assert.ok(d.click("study-all"), "study-all anklickbar");
  assert.match(d.html(), /data-action="flip"|data-action="rate"|id="answer"/,
    "Study-Screen zeigt Karteikarte/Eingabe");
});

test("set-mode WIRKT: der im Profil gewählte Modus bestimmt die Study-UI", () => {
  // Der Modus-Wähler liegt im Einstellungen-Screen (Profil → open-settings →
  // learnPrefs). Wir öffnen ihn, wählen den Modus, gehen auf Start und starten die
  // Runde. Der Study-Screen muss dem gewählten Modus FOLGEN: type → Eingabefeld
  // (#answer/#typer) und KEIN Flip-Knopf; flip → Aufdeck-Knopf. Ein toter
  // set-mode-Handler fällt damit auf (Mutationstest), weil der gewählte Modus sich
  // nicht in der Study-UI zeigt.
  {
    const d = makeDriver(freshApp());
    d.setTab("profil");
    assert.ok(d.click("open-settings"), "open-settings öffnet den Einstellungen-Screen");
    assert.ok(d.find("set-mode", { mode: "type" }), "Modus-Wähler (set-mode) liegt in den Einstellungen");
    assert.ok(d.click("set-mode", { mode: "type" }), "set-mode type klickbar");
    d.setTab("start");
    assert.ok(d.click("study-all"), "Runde startbar");
    assert.match(d.html(), /id="answer"|id="typer"/, "type-Modus → Eingabefeld im Study-Screen");
    assert.doesNotMatch(d.html(), /id="flip"/, "type-Modus zeigt KEINEN Flip-Aufdeck-Knopf");
  }
  {
    const d = makeDriver(freshApp());
    d.setTab("profil");
    assert.ok(d.click("open-settings"), "open-settings öffnet den Einstellungen-Screen");
    assert.ok(d.click("set-mode", { mode: "flip" }), "set-mode flip klickbar");
    d.setTab("start");
    assert.ok(d.click("study-all"), "Runde startbar");
    assert.match(d.html(), /id="flip"|data-action="flip"/, "flip-Modus → Aufdeck-Knopf im Study-Screen");
  }
  // listen ist TTS-abhängig (im Stub ggf. nicht angeboten): nur Robustheit prüfen.
  const dl = makeDriver(freshApp());
  dl.setTab("profil");
  dl.click("open-settings");
  if (dl.find("set-mode", { mode: "listen" })) {
    assert.ok(dl.click("set-mode", { mode: "listen" }), "set-mode listen klickbar");
    dl.setTab("start");
    assert.ok(dl.click("study-all") && dl.nonEmpty(), "listen-Modus rendert Study-Screen");
  }
});

test("flip deckt die Karte auf; rate und skip führen die Runde fort", () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("start");
  d.click("study-all");
  // sicher in den Karteikarten-Modus
  if (d.find("set-mode", { mode: "flip" })) d.click("set-mode", { mode: "flip" });

  const before = d.html();
  assert.ok(d.click("flip"), "flip klickbar");
  assert.notEqual(d.html(), before, "flip verändert den DOM (Rückseite sichtbar)");

  // bewerten (rate) – die Runde geht weiter / endet, beides ohne Throw.
  if (d.find("rate", { rating: "good" })) {
    assert.ok(d.click("rate", { rating: "good" }));
    assert.ok(d.nonEmpty(), "nach rate weiterhin Inhalt");
  }
  // skip ist je nach Restkarten ggf. nicht vorhanden -> nur best effort.
  if (d.find("skip")) {
    assert.doesNotThrow(() => d.click("skip"));
    assert.ok(d.nonEmpty());
  }
});

// ---------------------------------------------------------------------------
// 4) Suche
// ---------------------------------------------------------------------------
test("open-search rendert den Suche-Screen mit Eingabefeld", () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("entdecken");
  assert.ok(d.click("open-search"), "open-search klickbar");
  assert.match(d.html(), /id="search-input"/, "Suchfeld vorhanden");
});

// ---------------------------------------------------------------------------
// 4b) Profil-Umbau: die Einstell-/Reise-Steuerung ist aus dem Profil AUSGELAGERT
//     (Entschlackung) und vollständig auf den neuen Screens ANGEKOMMEN. Ein
//     versehentliches Zurückrutschen ins Profil ODER ein verlorenes Bedienelement
//     fällt damit sofort auf.
// ---------------------------------------------------------------------------
test("Profil ist entschlackt: Einstellungen & Reise liegen auf eigenen Screens", () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("profil");
  const profil = d.html();
  // Der Profil-Reiter selbst trägt KEINE Einstell-/Reise-Steuerung mehr …
  for (const moved of ["set-mode", "set-dir", "set-theme", "set-ui-lang", "export-data", "import-data", "drag-trip-stop"]) {
    assert.doesNotMatch(profil, new RegExp(`data-action="${moved}"`), `"${moved}" gehört nicht mehr aufs Profil`);
  }
  // … sondern nur noch die schlanke Sprungziel-Liste dorthin.
  assert.match(profil, /data-action="open-settings"/, "Einstellungen-Sprungziel fehlt im Profil");
  assert.match(profil, /data-action="open-reise"/, "Reise-Sprungziel fehlt im Profil");

  // Einstellungen-Screen: alle globalen Vorgaben + der Daten-Block sind da.
  assert.ok(d.click("open-settings"), "open-settings öffnet den Screen");
  const settings = d.html();
  for (const ctrl of ["set-theme", "save-name", "set-mode", "set-dir", "export-data", "import-data"]) {
    assert.match(settings, new RegExp(`data-action="${ctrl}"`), `"${ctrl}" fehlt in den Einstellungen`);
  }
  assert.match(settings, /id="import-file"/, "verstecktes Import-Feld fehlt in den Einstellungen");

  // Reise-Screen: die Reiseplanung rendert (leerer Zustand => Anlege-Knopf).
  d.setTab("profil");
  assert.ok(d.click("open-reise"), "open-reise öffnet den Screen");
  assert.ok(d.nonEmpty(), "Reise-Screen rendert Inhalt");
});

// ---------------------------------------------------------------------------
// 5) Statistik + Filter
// ---------------------------------------------------------------------------
test("open-stats rendert die Statistik; alle Filter sind durchschaltbar", () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("profil");
  assert.ok(d.click("open-stats"), "open-stats klickbar");
  assert.ok(d.nonEmpty(), "Statistik nicht leer");
  for (const filter of ["answered", "hard", "mastered", "new", "all"]) {
    if (d.find("set-stats-filter", { filter })) {
      assert.ok(d.click("set-stats-filter", { filter }), `Filter ${filter} klickbar`);
      assert.ok(d.nonEmpty(), `Filter ${filter} rendert`);
    }
  }
});

test("Statistik-Liste ist gekappt (Performance: nicht alle 2293 Karten auf einmal)", () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("profil");
  d.click("open-stats");
  d.click("set-stats-filter", { filter: "all" });
  const rows = (root.innerHTML.match(/data-action="open-card"/g) || []).length;
  assert.ok(rows > 0 && rows <= 200, `Karten-Zeilen auf 200 gekappt (gerendert: ${rows})`);
  assert.match(root.innerHTML, /stat-more/, "‚+N weitere'-Hinweis erscheint bei gekappter Liste");
});

// ---------------------------------------------------------------------------
// 6) Breites Screen-Netz: jeden erreichbaren Opener auf seinem Reiter klicken
//    und prüfen: kein Throw + nicht-leerer Output. Das ist der Kern des Netzes –
//    es deckt ~30 Screens über echte onClick-Dispatches ab.
// ---------------------------------------------------------------------------
// Opener -> Reiter, auf dem der Knopf liegt (zur Boot-Zeit ermittelt).
const OPENERS = {
  // Entdecken-Reiter (Module & Mini-Spiele – jeweils ihr EINSTIEGS-Screen)
  "open-search": "entdecken",
  "open-hostel": "entdecken",
  "open-quiz-setup": "entdecken",
  "open-yesto": "entdecken",
  "open-dialogos": "entdecken",
  "open-regatear": "entdecken",
  "open-frases": "entdecken",
  "open-cuerpo": "entdecken",
  "open-compras": "entdecken",
  "open-conjugacion": "entdecken",
  "open-tiempos": "entdecken",
  "open-pretrip": "entdecken",
  "open-spickzettel": "entdecken",
  "open-info": "entdecken",
  "open-historia": "entdecken",
  "open-historia-centro": "entdecken",
  "open-knigge": "entdecken",
  "open-logistica": "entdecken",
  "open-salud": "entdecken",
  "open-jerga": "entdecken",
  "open-derechos": "entdecken",
  "open-responsable": "entdecken",
  "open-fotos": "entdecken",
  "open-flirt": "entdecken",
  "open-bailar": "entdecken",
  "open-musica": "entdecken",
  "open-cafe": "entdecken",
  "open-juegos": "entdecken",
  "open-banderas": "entdecken",
  // Start-Reiter
  "study-all": "start",
  "ruta-del-dia": "start",
  // Profil-Reiter
  "open-placement": "profil",
  "open-assessment": "profil",
  "open-stats": "profil",
  "open-badges": "profil",
  "open-editor": "profil",
  "open-settings": "profil",
  "open-reise": "profil",
};

test("alle erreichbaren Screens rendern ohne Throw und mit Inhalt", () => {
  const root = freshApp();
  const d = makeDriver(root);
  const failed = [];
  let covered = 0;
  for (const action of Object.keys(OPENERS)) {
    d.setTab(OPENERS[action]);
    if (!d.find(action)) continue; // Opener auf diesem Build/Edition nicht sichtbar
    try {
      assert.ok(d.click(action));
      if (!d.nonEmpty()) failed.push(`${action}: leerer Output`);
      else covered++;
    } catch (e) {
      failed.push(`${action}: THROW ${e.message}`);
    }
  }
  assert.deepEqual(failed, [], "kein Screen wirft / bleibt leer");
  // Untergrenze: das Netz soll ein breites Spektrum tatsächlich ausführen.
  assert.ok(covered >= 20, `mind. 20 Screens abgedeckt (waren ${covered})`);
});

// ---------------------------------------------------------------------------
// 7) Rückweg: von jedem Screen führt "home" zuverlässig zurück zum Dashboard.
// ---------------------------------------------------------------------------
test('Aktion "home" führt aus einem Modul-Screen zurück aufs Dashboard', () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("entdecken");
  assert.ok(d.click("open-knigge"), "Beispiel-Screen geöffnet");
  assert.ok(d.click("home"), 'home-Knopf vorhanden');
  assert.match(root.innerHTML, /data-action="set-tab"/, "wieder auf dem Dashboard");
});

// ---------------------------------------------------------------------------
// 8) Lernpfad/Pre-Trip: der „Weiter"-CTA im Hero startet direkt den nächsten
//    offenen Teil (Study-Screen), ohne die passende Zeile suchen zu müssen.
// ---------------------------------------------------------------------------
test('pretrip-continue startet aus dem Lernpfad-Hero die nächste Etappe', () => {
  const root = freshApp();
  const d = makeDriver(root);
  d.setTab("entdecken");
  assert.ok(d.click("open-pretrip"), "Lernpfad geöffnet");
  assert.ok(d.find("start-pretrip-day"), "aktuelle Etappe trägt weiterhin start-pretrip-day");
  assert.ok(d.find("set-pretrip-scope"), "Kurskarten (Scope-Wechsel) vorhanden");
  assert.ok(d.click("pretrip-continue"), "Weiter-CTA vorhanden & klickbar");
  assert.match(d.html(), /data-action="flip"|data-action="rate"|id="answer"/,
    "Study-Screen erscheint");
});
