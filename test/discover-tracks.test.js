/*
 * discover-tracks.test.js – Entdecken-Reiter je Lern-Track (tracks-Filter in
 * ui.js FEATURES) + die für den Locals-Track recycelten Module.
 *
 * Bootet die App im DOM-Stub einmal als Reise-Track (Standard) und einmal als
 * Locals-Track (Edition "ingles-pro", echte locals-loader-Reihenfolge) und prüft:
 *   - Reise: alle Reise-Kacheln da, KEINE Locals-Kacheln, neue "Ruta del
 *     español"-Kachel öffnet den Kurs per data-scope.
 *   - Locals: recycelte Kacheln (Supervivencia, Precios, Cuerpo, Compras) da,
 *     spanisch-spezifische Reise-Kacheln (Jerga, Conjugación, Regatear …) weg.
 *   - Supervivencia laboral: VM liefert Locals-Gruppen mit ENGLISCHER Lernseite.
 *   - Precios: Währungsliste beginnt mit USD, Beträge werden englisch verwortet.
 *   - Compras/Cuerpo: Lernseite Englisch, Touristen-Tipps/Notizen ausgeblendet.
 *
 * Aufruf:  node --test test/discover-tracks.test.js   (oder: node --test)
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const stub = require("./_dom-stub.js");

// Frischer App-Boot pro Test (analog controller-smoke); edition optional.
function freshApp(edition) {
  stub.install();
  // install() verwendet dasselbe window-Objekt wieder (SC bleibt stehen) – eine
  // zuvor gewählte Edition muss vor dem nächsten Boot weg (wie hostel-edition.test).
  if (globalThis.window.SC) globalThis.window.SC.editionConfig = null;
  stub.seedOnboarded();
  const SRC = path.join(__dirname, "..");
  // Zusätzlich unter dem track-namespaced Key seeden: store.js migriert seit dem
  // Entfernen der Legacy-Migration (Cross-Track-Bleed-Risiko, siehe store.js-
  // Kommentar) KEINE unpräfixierten Alt-Daten mehr in einen es-en-Namespace.
  // Ohne dies würde ein es-en-Edition-Boot (ingles-pro/venue-en/medellin) hier
  // fälschlich ins Onboarding statt ins Dashboard laufen.
  if (edition) {
    delete require.cache[require.resolve(path.join(SRC, "editions/registry.js"))];
    require(path.join(SRC, "editions/registry.js"));
    const trackId = (window.SC.editions[edition] && window.SC.editions[edition].track) || "de-es";
    if (trackId !== "de-es") {
      globalThis.window.localStorage.setItem(
        "spanischcard." + trackId + ".settings.v1",
        JSON.stringify({ onboarded: true, mode: "flip" }));
    }
  }
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${path.sep}test${path.sep}`)) {
      delete require.cache[key];
    }
  }
  stub.installModules(edition ? { edition } : undefined);
  return document.getElementById("app");
}

function driver(root) {
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
  return { find, click, html: () => root.innerHTML };
}

// ---------------------------------------------------------------------------
// Reise-Track (de-es): Entdecken unverändert + neue Kurs-Kachel
// ---------------------------------------------------------------------------
test("Entdecken (Reise): Reise-Kacheln da, Locals-Kacheln weg, Ruta-del-español-Kachel öffnet den Kurs", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  // Repräsentative Reise-Kacheln (Spielen/Üben/Nachschlagen) sind sichtbar.
  // (open-precios fehlt hier bewusst: need:"speech" – der DOM-Stub hat kein TTS.)
  for (const a of ["open-spickzettel", "open-cuerpo", "open-compras",
    "open-conjugacion", "open-jerga", "open-regatear", "open-hostel", "open-pretrip"]) {
    assert.ok(d.find(a), `Reise-Kachel ${a} sichtbar`);
  }
  // Reine Locals-Kacheln erscheinen im Reise-Track nicht.
  assert.ok(!d.find("open-venue-roleplay"), "Roleplay del local nur im Locals-Track");
  // Neue Kurs-Kachel: öffnet per data-scope direkt die "Ruta del español".
  const curso = d.find("open-pretrip", { scope: "ruta-espanol" });
  assert.ok(curso, "Ruta-del-español-Kachel vorhanden");
  assert.ok(d.click("open-pretrip", { scope: "ruta-espanol" }), "Kachel klickbar");
  assert.match(d.html(), /Ruta del español/, "Lernpfad-Screen zeigt den Kurs");
  assert.match(d.html(), /Woche 1|Week 1/, "Wochen-Meilenstein sichtbar (week-Felder greifen)");
});

test("Lernpfad (Reise): ruta-espanol ist im Kurswähler, Standard-Scope bleibt colombia", () => {
  freshApp();
  const { data } = window.SC;
  assert.equal(data.PRETRIP[0].scope, "colombia", "PRETRIP[0] bleibt colombia (Default-Scope)");
  assert.ok(data.PRETRIP.some((p) => p.scope === "ruta-espanol"), "ruta-espanol im Plan-Pool");
});

// ---------------------------------------------------------------------------
// Locals-Track (es-en): recycelte Kacheln + track-fähige Module
// ---------------------------------------------------------------------------
test("Entdecken (Locals): recycelte Kacheln sichtbar, Reise-Referenz weg, keine Ruta-del-español-Kachel", () => {
  const root = freshApp("ingles-pro");
  assert.equal(window.SC.track.id(), "es-en", "Locals-Track aktiv");
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  // Recycelte + Locals-eigene Kacheln (open-precios via need:"speech" im Stub
  // ausgeblendet – seine Locals-Logik prüft der Precios-Test unten direkt).
  for (const a of ["open-favorites", "open-spickzettel", "open-cuerpo",
    "open-compras", "open-dialogos", "open-banderas", "open-yesto", "open-quiz-setup",
    "open-frases", "open-endless", "open-venue-roleplay", "open-pretrip"]) {
    assert.ok(d.find(a), `Locals-Kachel ${a} sichtbar`);
  }
  // Spanisch-spezifische Reise-Inhalte bleiben draußen.
  for (const a of ["open-conjugacion", "open-tiempos", "open-jerga", "open-regatear",
    "open-hostel", "open-knigge", "open-info", "open-historia"]) {
    assert.ok(!d.find(a), `Reise-Kachel ${a} im Locals-Track ausgeblendet`);
  }
  // Der Spanisch-Kurs gehört NICHT in den Locals-Track.
  assert.ok(!d.find("open-pretrip", { scope: "ruta-espanol" }), "keine Ruta-del-español-Kachel");
});

test("Supervivencia laboral (Locals): Gruppen aus dem Arbeits-Korpus, Lernseite Englisch", () => {
  freshApp("ingles-pro");
  const vm = window.SC.spickzettel.vm();
  assert.equal(vm.learnLang, "en");
  const ids = vm.groups.map((g) => g.id);
  assert.deepEqual(ids, ["emergencias-en", "saludos-en", "quejas-en", "direcciones", "dinero-en"]);
  for (const g of vm.groups) {
    assert.ok(g.cards.length > 0, `Gruppe ${g.id} hat Karten`);
    for (const c of g.cards) {
      assert.ok(c.es && c.es.length, `${g.id}: Lernseite gefüllt`);
      assert.ok(c.de && c.de.length, `${g.id}: Muttersprachen-Seite gefüllt`);
    }
  }
  // Stichprobe: die kuratierte Nothilfe-Zeile lehrt den ENGLISCHEN Satz.
  const first = vm.groups[0].cards[0];
  assert.equal(first.es, "I need help.");
  assert.equal(first.de, "Necesito ayuda.");
});

test("Supervivencia (Reise): unverändert spanische Gruppen (Regression)", () => {
  freshApp();
  const vm = window.SC.spickzettel.vm();
  assert.equal(vm.learnLang, "es");
  assert.deepEqual(vm.groups.map((g) => g.id), ["notfall", "basics", "rumbo", "dinero"]);
  assert.equal(vm.groups[0].cards[0].es.indexOf("I "), -1, "Lernseite bleibt spanisch");
});

test("Precios (Locals): USD zuerst, Standardwährung US, englische Wortformen im Generator", () => {
  freshApp("ingles-pro");
  const N = window.SC.numbers;
  assert.equal(N.currencyList("en")[0].key, "US", "Locals-Liste beginnt mit USD");
  assert.ok(!N.currencyList().some((c) => c.key === "US"), "Reise-Liste bleibt ohne USD");
  const vm = window.SC.precios.setupVM();
  assert.ok(vm.currencies.length > 0 && vm.currencies[0].key === "US", "Setup zeigt USD zuerst");
  assert.ok(vm.currencies[0].selected, "USD ist als Standard vorgewählt");
  // Generierte Beträge tragen englische Wortformen (feste rng → deterministisch).
  const round = N.buildRound("US", 2, 5, () => 0.5, "en");
  for (const item of round) {
    assert.match(item.es, /^[a-z][a-z\s-]*(dollars|dollar)$/,
      `englische Wortform: ${item.es}`);
  }
});

test("Compras (Locals): Lernseite Englisch, englische Fragen, keine Touristen-Notizen", () => {
  freshApp("ingles-pro");
  const vm = window.SC.compras.vm();
  assert.equal(vm.learnLang, "en");
  assert.ok(vm.items.length > 0, "Items vorhanden");
  for (const it of vm.items) {
    assert.equal(it.tip, null, "kein spanischer Aussprache-Tipp");
    assert.equal(it.note, null, "keine Touristen-Notiz");
    assert.match(it.ask.have.es, /^Do you have [a-z].*\?$/, `englische Frage klein eingebettet: ${it.ask.have.es}`);
    assert.match(it.ask.find.es, /^Where can I find [a-z].*\?$/, `englische Frage klein eingebettet: ${it.ask.find.es}`);
  }
  // Anzeige-Label ist großgeschrieben („Toilet roll"), satzintern klein eingebettet.
  const papel = vm.items.find((i) => i.id === "sl_papel");
  if (papel) assert.match(papel.ask.have.es, /^Do you have toilet roll\?$/, `Kleinschreibung: ${papel.ask.have.es}`);
  // Stichprobe Wasser: native Seite Spanisch, Lernseite Englisch.
  const agua = vm.items.find((i) => i.id === "sl_agua");
  assert.ok(agua, "sl_agua in der ersten Rubrik");
  assert.equal(agua.de, "el agua");
  assert.equal(agua.es, "water");
});

test("Compras (Reise): unverändert spanische Lernseite mit Tipps (Regression)", () => {
  freshApp();
  const vm = window.SC.compras.vm();
  assert.equal(vm.learnLang, "es");
  const agua = vm.items.find((i) => i.id === "sl_agua");
  assert.equal(agua.es, "el agua");
  assert.ok(agua.note && agua.note.length, "Reisetipp sichtbar");
  assert.match(agua.ask.have.es, /^¿Tienen agua\?$/, "spanische Frage ohne Artikel");
});

test("Cuerpo (Locals): gelernte Seite Englisch, Tipp/Notiz ausgeblendet", () => {
  const root = freshApp("ingles-pro");
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  assert.ok(d.click("open-cuerpo"), "Cuerpo öffnet");
  assert.ok(d.click("cuerpo-select", { id: "bp_cabeza" }), "Körperteil wählbar");
  const vm = window.SC.cuerpo.vm();
  assert.equal(vm.learnLang, "en");
  assert.ok(vm.selected, "Auswahl im VM");
  assert.equal(vm.selected.es, "Head", "Lernseite Englisch");
  assert.equal(vm.selected.tip, null, "kein spanischer Aussprache-Tipp");
  assert.equal(vm.selected.note, null, "keine Touristen-Notiz");
});

test("Cuerpo (Reise): unverändert spanisches Wort mit Tipp & Notiz (Regression)", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  assert.ok(d.click("open-cuerpo"), "Cuerpo öffnet");
  assert.ok(d.click("cuerpo-select", { id: "bp_cabeza" }), "Körperteil wählbar");
  const vm = window.SC.cuerpo.vm();
  assert.equal(vm.selected.es, "la cabeza");
  assert.ok(vm.selected.tip && vm.selected.note, "Tipp & Notiz sichtbar");
});

// ---------------------------------------------------------------------------
// Suche: die recycelten Features sind im Locals-Track indexiert (nicht nur die
// Kacheln sichtbar) – reine Reise-Features bleiben in beiden Tracks track-korrekt.
// ---------------------------------------------------------------------------
function search(root, query) {
  // Ins Suchfeld tippen (echtes input-Event, wie onInput es liest); die Suche
  // muss vom Aufrufer schon geöffnet sein.
  const field = document.getElementById("search-input");
  field.value = query;
  field.dispatchEvent({ type: "input", target: field, bubbles: true });
  const box = document.getElementById("search-results");
  return box ? box.innerHTML : "";
}

test("Suche (Locals): recycelte Features sind indexiert, Reise-Referenz nicht", () => {
  const root = freshApp("ingles-pro");
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  assert.ok(d.click("open-search"), "Suche öffnet");
  // Recyceltes Feature ist auffindbar (Kachel sichtbar → Suche findet es).
  assert.match(search(root, "cuerpo"), /open-cuerpo/, "El Cuerpo im Locals-Index");
  assert.match(search(root, "supervivencia"), /open-spickzettel/, "Supervivencia im Locals-Index");
  // Reine Reise-Features bleiben draußen.
  assert.doesNotMatch(search(root, "conjugación"), /open-conjugacion/, "Conjugación nicht im Locals-Index");
});

test("Suche (Reise): Reise-Features weiterhin indexiert (Regression)", () => {
  const root = freshApp();
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  assert.ok(d.click("open-search"), "Suche öffnet");
  assert.match(search(root, "cuerpo"), /open-cuerpo/, "El Cuerpo im Reise-Index");
  assert.match(search(root, "conjugación"), /open-conjugacion/, "Conjugación im Reise-Index");
});

// ---------------------------------------------------------------------------
// HelloAbroad-Track (de-en): korrigierte Benennungen + adoptierte Module.
// Kern des DE-EN-Entdecken-Umbaus: die Kacheln tragen deutsche Namen (nicht die
// spanischen Marken „Supervivencia"/„El Cuerpo" …), die adoptierten Lern-Module
// (Spickzettel, Einkaufsliste, Körper, Satzbaukasten, Was ist das?) sind sichtbar,
// und rein spanisch-content-gebundene Module (Definiciones, Diálogos, Banderas)
// bleiben draußen. Die Module selbst liefern die englische Lernseite mit deutscher
// Muttersprache (nicht spanischer, wie im Locals-Track).
// ---------------------------------------------------------------------------
test("Entdecken (HelloAbroad de-en): deutsche Modulnamen, adoptierte Kacheln da, Spanisch-Content-Kacheln weg", () => {
  const root = freshApp("hello-abroad");
  assert.equal(window.SC.track.id(), "de-en", "de-en-Track aktiv");
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  // Adoptierte + weiterhin sinnvolle Kacheln (open-precios via need:"speech" im
  // Stub ausgeblendet – seine de-en-Logik prüft der Precios-Test separat).
  for (const a of ["open-favorites", "open-spickzettel", "open-cuerpo",
    "open-compras", "open-frases", "open-endless", "open-yesto"]) {
    assert.ok(d.find(a), `de-en-Kachel ${a} sichtbar`);
  }
  // Spanisch-content-gebundene bzw. reise-/locals-spezifische Module bleiben weg.
  for (const a of ["open-quiz-setup", "open-dialogos", "open-banderas",
    "open-conjugacion", "open-jerga", "open-regatear", "open-hostel", "open-info",
    "open-historia", "open-venue-roleplay"]) {
    assert.ok(!d.find(a), `Kachel ${a} im de-en-Track ausgeblendet`);
  }
  const html = d.html();
  // Benennungen sind deutsch …
  for (const name of ["Notfall-Sätze", "Einkaufsliste", "Der Körper",
    "Meine Vokabeln", "Satzbaukasten", "Vokabeln ohne Ende", "Was ist das?"]) {
    assert.ok(html.indexOf(name) >= 0, `deutscher Modulname „${name}" sichtbar`);
  }
  // … nicht die spanischen Marken.
  for (const es of ["Supervivencia", "Lista de compras", "El Cuerpo", "Mi léxico",
    "Vocabulario sin fin", "Frases flexibles", "¿Y esto?"]) {
    assert.ok(html.indexOf(es) < 0, `spanischer Name „${es}" nicht mehr sichtbar`);
  }
});

test("Supervivencia (HelloAbroad): Reise-Bereiche, Englisch gelernt, kein Spanisch-Tipp", () => {
  freshApp("hello-abroad");
  const vm = window.SC.spickzettel.vm();
  assert.equal(vm.learnLang, "en", "gelernte Seite Englisch");
  // de-en nutzt die Reise-Bereiche (data.js), NICHT den Locals-Arbeitskorpus.
  assert.deepEqual(vm.groups.map((g) => g.id), ["notfall", "basics", "rumbo", "dinero"]);
  for (const g of vm.groups) {
    assert.ok(g.cards.length > 0, `Gruppe ${g.id} hat Karten`);
    for (const c of g.cards) {
      assert.ok(c.de && c.de.length, `${g.id}: deutsche Seite gefüllt`);
      assert.ok(c.es && c.es.length, `${g.id}: englische Lernseite gefüllt`);
      assert.equal(c.tip, null, `${g.id}: kein spanischer Aussprache-Tipp (MVP-Lücke)`);
    }
  }
});

test("Compras (HelloAbroad): Muttersprache Deutsch, Englisch gelernt, keine Touristen-Notizen", () => {
  freshApp("hello-abroad");
  const vm = window.SC.compras.vm();
  assert.equal(vm.learnLang, "en", "gelernte Seite Englisch");
  const agua = vm.items.find((i) => i.id === "sl_agua");
  assert.ok(agua, "sl_agua vorhanden");
  assert.equal(agua.de, "Wasser", "Muttersprache DEUTSCH statt spanisch el agua");
  assert.equal(agua.es, "water", "gelernte Seite Englisch");
  assert.equal(agua.tip, null, "kein spanischer Aussprache-Tipp");
  assert.equal(agua.note, null, "keine Touristen-Notiz");
  assert.match(agua.ask.have.es, /^Do you have [a-z].*\?$/, "englische Ladenfrage");
});

test("Cuerpo (HelloAbroad): Englisch gelernt, Muttersprache Deutsch, Tipp/Notiz weg", () => {
  const root = freshApp("hello-abroad");
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  assert.ok(d.click("open-cuerpo"), "Cuerpo öffnet");
  assert.ok(d.click("cuerpo-select", { id: "bp_cabeza" }), "Körperteil wählbar");
  const vm = window.SC.cuerpo.vm();
  assert.equal(vm.learnLang, "en");
  assert.equal(vm.selected.es, "Head", "Lernseite Englisch");
  assert.equal(vm.selected.de, "Kopf", "Muttersprache DEUTSCH");
  assert.equal(vm.selected.tip, null, "kein spanischer Aussprache-Tipp");
  assert.equal(vm.selected.note, null, "keine Touristen-Notiz");
});

test("Was ist das? (HelloAbroad): Themen-Labels deutsch, Prompt deutsch, kein Spanisch", () => {
  const root = freshApp("hello-abroad");
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  // Themen-Auswahl trägt deutsche Labels (labelDe), nicht das spanische Basis-label.
  const vm = window.SC.yestoGame.setupVM();
  const labels = vm.themes.map((th) => th.label);
  assert.ok(labels.indexOf("Essen") >= 0, "deutsches Themen-Label Essen");
  assert.ok(labels.indexOf("Comida") < 0, "kein spanisches Comida");
  // Spielfluss bis zur Auflösung: Prompt deutsch, Hilfszeile deutsch, kein „¿".
  assert.ok(d.click("open-yesto"), "yesto öffnet");
  const theme = vm.themes.find((t2) => t2.count >= 1) || vm.themes[0];
  assert.ok(d.click("start-yesto", { id: theme.id }), "Runde startet");
  const html = d.html();
  assert.ok(html.indexOf("Was ist das?") >= 0, "deutscher Prompt");
  assert.ok(html.indexOf("¿Y esto?") < 0, "kein spanischer Marken-Prompt");
});

test("Satzbaukasten (HelloAbroad): englischer Rahmen, deutsche Zielbedeutung, kein spanischer Satz", () => {
  const root = freshApp("hello-abroad");
  const d = driver(root);
  d.click("set-tab", { tab: "entdecken" });
  assert.ok(d.click("open-frases"), "Frases öffnet");
  const set = window.SC.frasesGame.setupVM().sets.find((s) => s.count >= 1);
  assert.ok(set, "ein Thema vorhanden");
  assert.ok(d.click("start-frases", { set: set.id }), "Runde startet");
  const html = d.html();
  // Die Ziel-/Sekundärseite ist deutsch: im Locals-Track stünde hier der volle
  // SPANISCHE Satz (mit „¿"/„¡") – für de-en darf kein Spanisch durchschlagen.
  assert.ok(html.indexOf("¿") < 0 && html.indexOf("¡") < 0,
    "kein spanischer Zielsatz auf der de-en-Satzbaukasten-Seite");
});
