/*
 * locals-track.test.js – Der Locals-Track (Spanisch lernt Englisch), Edition
 * "ingles-pro". Prüft Track-Auflösung, den Matcher mit Englisch als
 * Lernsprache (Artikel-Toleranz an, spanische Flexions-Strenge AUS), die
 * TTS-Locale, die spanische UI-Schicht und die Integrität des Pilot-Korpus
 * (data.locals.js).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// Edition VOR config.js setzen (wie Build/Runtime), damit der Locals-Track aktiv ist.
globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "editions", "registry.js"));
window.SC.editionConfig = window.SC.editions["ingles-pro"];
require(path.join(__dirname, "..", "config.js"));
require(path.join(__dirname, "..", "i18n.js"));
require(path.join(__dirname, "..", "i18n.strings.js"));
require(path.join(__dirname, "..", "i18n.strings.es.js"));
require(path.join(__dirname, "..", "matcher.js"));
require(path.join(__dirname, "..", "data.js"));
require(path.join(__dirname, "..", "data.locals.js"));
const { track, matcher, i18n, data, dataLocals, config } = window.SC;

test("Track: Edition ingles-pro setzt den es-en-Track", () => {
  assert.equal(config.track, "es-en");
  assert.equal(track.id(), "es-en");
  assert.equal(track.learnLang(), "en");
  assert.deepEqual(track.nativeLangs(), ["es", "en"]);
  assert.equal(track.cardNativeLang(), "es"); // Frage bleibt immer Spanisch
  assert.equal(track.ttsLocale(), "en-US");   // TTS spricht Englisch
});

test("Track: learnText liefert die englische Antwort", () => {
  const card = { de: "die Rechnung", es: "la cuenta", en: "the bill" };
  assert.equal(track.learnText(card), "the bill");
});

test("Matcher: field 'learn' prüft gegen Englisch (card.en)", () => {
  const card = { es: "la cuenta", en: "the bill" };
  assert.equal(matcher.check("the bill", card, "learn").correct, true);
  // Artikel-Toleranz fürs Englische: 'the' darf fehlen.
  assert.equal(matcher.check("bill", card, "learn").correct, true);
  assert.equal(matcher.check("the spoon", card, "learn").correct, false);
});

test("Matcher: card.alt zählt als englische Alternativen (field 'learn')", () => {
  const card = { es: "el baño", en: "the restroom", alt: ["the restroom", "the toilet", "the bathroom"] };
  assert.equal(matcher.check("the toilet", card, "learn").correct, true);
  assert.equal(matcher.check("bathroom", card, "learn").correct, true); // artikellos
});

test("Matcher: keine spanische Flexions-Strenge, wenn Englisch gelernt wird", () => {
  // Wort-finale Einzelabweichung (Plural-s) ist im Spanischen eine Flexion (würde
  // abgelehnt), im Englischen ein verzeihlicher Tippfehler -> wird akzeptiert.
  const card = { es: "las maletas", en: "the suitcases" };
  const r = matcher.check("the suitcase", card, "learn"); // fehlendes finales s
  assert.equal(r.correct, true);
  assert.equal(r.typo, true);
});

test("Matcher: Spanisch-Strenge bleibt für den learn-Fall im Reise-Sinn erhalten", () => {
  // Direktes Feld "es" wird weiterhin spanisch streng bewertet (médico≠médica).
  const card = { es: "médico", en: "doctor" };
  assert.equal(matcher.check("médica", card, "es").correct, false);
});

test("Matcher: Richtung ES→native prüft gegen Spanisch – auch bei englischer UI", () => {
  // Locals + dir es2de: Englisch ist die Frage, die getippte Antwort ist Spanisch
  // (Muttersprache). Auch wenn die UI-Chrome auf Englisch steht, MUSS gegen card.es
  // geprüft werden (nicht gegen card.en = die Frage). Regression-Schutz für die
  // cardNativeLang-Auflösung im Matcher.
  const card = { es: "la cuenta", en: "the bill" };
  i18n.setLang("en"); // UI-Chrome Englisch
  assert.equal(matcher.check("la cuenta", card, "native").correct, true);
  assert.equal(matcher.check("the bill", card, "native").correct, false); // die Frage zählt nicht als Antwort
  i18n.setLang("es");
});

test("Matcher: Custom-/Legacy-Karte ({de,es} ohne en) im Locals-Track", () => {
  // Editor & Favoriten speichern generisch de=Frage (Spanisch), es=Antwort (Englisch),
  // OHNE en-Feld. Der Matcher muss die gelernte Antwort dann im es-Slot finden und die
  // native Frage im de-Slot – sonst wäre eine selbst angelegte Karte unlösbar.
  const custom = { de: "la cuenta", es: "the bill" };
  assert.equal(matcher.check("the bill", custom, "learn").correct, true);
  assert.equal(matcher.check("bill", custom, "learn").correct, true);   // Artikel-Toleranz (Englisch)
  assert.equal(matcher.check("la cuenta", custom, "native").correct, true);
  assert.equal(matcher.check("the spoon", custom, "learn").correct, false);
});

test("i18n: Spanisch ist eine unterstützte UI-Sprache", () => {
  assert.ok(i18n.SUPPORTED.indexOf("es") >= 0);
  i18n.setLang("es");
  assert.equal(i18n.getLang(), "es");
  assert.equal(i18n.locale(), "es-CO");
});

test("i18n: spanische Kern-Strings vorhanden, sonst Rückfall es→en→de", () => {
  i18n.setLang("es");
  assert.equal(i18n.t("common.check"), "Comprobar");      // direkt übersetzt
  assert.equal(i18n.t("study.inputEs"), "Escribe tu respuesta en inglés"); // Locals-gespiegelt
  // Ein nur in EN existierender Schlüssel fällt auf Englisch (nicht Deutsch) zurück.
  const en = (() => { i18n.setLang("en"); const v = i18n.t("home.tabDiscover"); i18n.setLang("es"); return v; })();
  assert.equal(i18n.t("home.tabDiscover"), "Descubrir"); // ist übersetzt
  assert.ok(typeof en === "string");
});

test("Content: Pilot-Korpus data.locals ist strukturell sauber", () => {
  assert.ok(dataLocals && Array.isArray(dataLocals.CARDS) && dataLocals.CARDS.length > 0);
  const catIds = new Set(dataLocals.CATEGORIES.map((c) => c.id));
  for (const c of dataLocals.CARDS) {
    assert.ok(c.id && /^loc-/.test(c.id), `Karten-Id mit loc-Präfix: ${c.id}`);
    assert.ok(c.es && c.es.length, `Karte ${c.id} hat eine spanische Frage`);
    assert.ok(c.en && c.en.length, `Karte ${c.id} hat eine englische Antwort`);
    assert.ok(catIds.has(c.cat), `Karte ${c.id} zeigt auf gültige Kategorie ${c.cat}`);
    assert.ok([1, 2, 3, 4].indexOf(c.lvl) >= 0, `Karte ${c.id} hat eine gültige Stufe`);
  }
  // Eindeutige Ids.
  const ids = dataLocals.CARDS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "Karten-Ids sind eindeutig");
});

test("Content: Presets referenzieren existierende Locals-Karten", () => {
  const ids = new Set(dataLocals.CARDS.map((c) => c.id));
  for (const pr of dataLocals.PRESETS) {
    assert.ok(pr.pick.length > 0, `Preset ${pr.id} ist nicht leer`);
    for (const id of pr.pick) assert.ok(ids.has(id), `Preset ${pr.id} referenziert ${id}`);
  }
});

test("i18n natKey: es bevorzugt …Es, sonst …En, sonst de", () => {
  i18n.setLang("es");
  assert.equal(i18n.natKey({ label: "base", labelEs: "Restaurante", labelEn: "Restaurant" }, "label"), "Restaurante");
  assert.equal(i18n.natKey({ label: "base", labelEn: "Beginner" }, "label"), "Beginner"); // kein …Es -> …En
  assert.equal(i18n.natKey({ label: "nur-base" }, "label"), "nur-base");                   // weder Es noch En
  i18n.setLang("es");
});

test("Content: Locals-Kategorien sind 5 Gruppen mit spanischem labelEs", () => {
  const groups = new Set(dataLocals.CATEGORIES.map((c) => c.group));
  assert.deepEqual([...groups].sort(), ["loc-dia", "loc-esc", "loc-hosp", "loc-trab", "loc-voc"]);
  for (const c of dataLocals.CATEGORIES) {
    assert.ok(c.labelEs && c.labelEs.length, `Kategorie ${c.id} hat labelEs (spanisch)`);
    assert.ok(c.labelEn && c.labelEn.length, `Kategorie ${c.id} hat labelEn (englisch)`);
  }
});

test("Content: Kurspläne (PLANS) – je 4 Wochen, Karten existieren, scope curso*", () => {
  assert.ok(Array.isArray(dataLocals.PLANS) && dataLocals.PLANS.length >= 2);
  const ids = new Set(dataLocals.CARDS.map((c) => c.id));
  const scopes = new Set();
  for (const plan of dataLocals.PLANS) {
    assert.ok(/^curso/.test(plan.scope), `Plan-scope beginnt mit curso: ${plan.scope}`);
    scopes.add(plan.scope);
    assert.equal(plan.days.length, 4, `Plan ${plan.scope} hat vier Wochen`);
    assert.ok(plan.labelEs && plan.labelEn, `Plan ${plan.scope} hat labelEs/labelEn`);
    for (const w of plan.days) {
      assert.ok(w.titleEs && w.titleEn, `${plan.scope} Woche ${w.day} hat titleEs/titleEn`);
      assert.ok(w.cardIds.length > 0, `${plan.scope} Woche ${w.day} ist nicht leer`);
      for (const id of w.cardIds) assert.ok(ids.has(id), `${plan.scope} Woche ${w.day} referenziert existierende Karte ${id}`);
    }
  }
  assert.equal(scopes.size, dataLocals.PLANS.length, "Plan-scopes sind eindeutig");
  assert.ok(scopes.has("curso-en") && scopes.has("curso-pro") && scopes.has("curso-dia"),
    "Grund-, Pro- und Alltags-Kurs vorhanden");
});

test("Content: Kursplan ist im Locals-Track vorn in PRETRIP (defaultPretripScope)", () => {
  assert.equal(data.PRETRIP[0].scope, "curso-en");
});

test("Content: Diálogos (Local-Perspektive) – NPC Englisch, Antwort Englisch", () => {
  const scn = dataLocals.DIALOGOS_SCENARIOS, dlg = dataLocals.DIALOGOS;
  assert.ok(Array.isArray(scn) && scn.length >= 3);
  // jedes Szenario hat mind. einen Dialog
  for (const s of scn) assert.ok(dlg.some((d) => d.cat === s.id), `Szenario ${s.id} hat einen Dialog`);
  for (const d of dlg) {
    let userTurns = 0;
    for (const tn of d.turns) {
      if (tn.who === "npc") {
        assert.ok(tn.en && tn.en.length, `${d.id}: NPC-Zug spricht Englisch (en)`);
        assert.ok(tn.es && tn.es.length, `${d.id}: NPC-Zug hat spanische Übersetzung (es)`);
      } else {
        userTurns++;
        assert.ok(tn.es && tn.es.length, `${d.id}: user-Zug hat spanische Anweisung (es)`);
        assert.ok(tn.solEs && tn.solEs.length, `${d.id}: user-Zug hat englische Musterantwort (solEs)`);
        if (tn.kind === "mc") {
          const oks = tn.options.filter((o) => o.ok);
          assert.equal(oks.length, 1, `${d.id}: genau eine richtige MC-Option`);
        } else {
          assert.ok(Array.isArray(tn.accept), `${d.id}: type-Zug hat accept[]`);
        }
      }
    }
    assert.ok(userTurns > 0, `${d.id} hat user-Züge`);
  }
});

test("Content: data.locals hängt im Locals-Track an den aktiven Korpus an", () => {
  const ids = new Set(data.CARDS.map((c) => c.id));
  assert.ok(ids.has("loc-mes01"), "Locals-Karten sind im aktiven Korpus");
  const catIds = new Set(data.CATEGORIES.map((c) => c.id));
  assert.ok(catIds.has("meseros") && catIds.has("recepcion") && catIds.has("guias"));
});

test("Kontext: JEDE loc-Karte bekommt englischen Kontext (contextdata.locals + expandLocals)", () => {
  // context.js hängt beim Laden den Kontext an SC.data.CARDS (Locals-Korpus ist da).
  require(path.join(__dirname, "..", "contextdata.locals.js"));
  require(path.join(__dirname, "..", "numbers.js"));
  require(path.join(__dirname, "..", "context.js"));
  const locCards = data.CARDS.filter((c) => /^loc-/.test(c.id));
  assert.ok(locCards.length >= 800, `genug Locals-Karten (${locCards.length})`);
  for (const c of locCards) {
    const ctx = c.context;
    assert.ok(ctx, `Kontext fehlt: ${c.id}`);
    assert.equal(ctx.loc, true, `loc-Flag fehlt (englische Lernrichtung): ${c.id}`);
    assert.ok(ctx.egLearn && ctx.egLearn.trim(), `englischer Beispielsatz fehlt: ${c.id}`);
    assert.ok(ctx.egNative && ctx.egNative.trim(), `spanische Übersetzung fehlt: ${c.id}`);
    assert.ok(ctx.situation && ctx.situation.trim(), `situación (ES) fehlt: ${c.id}`);
    assert.ok(ctx.situationEn && ctx.situationEn.trim(), `situation (EN) fehlt: ${c.id}`);
    assert.ok(ctx.note && ctx.note.trim(), `consejo (ES) fehlt: ${c.id}`);
    assert.ok(ctx.noteEn && ctx.noteEn.trim(), `tip (EN) fehlt: ${c.id}`);
  }
});

test("Kontext: localizeDeep schaltet Situation/Tipp auf die UI-Sprache (es/en), Beispiel bleibt EN+ES", () => {
  const card = data.CARDS.find((c) => c.id === "loc-mes01");
  assert.ok(card && card.context, "loc-mes01 hat Kontext");
  i18n.setLang("es");
  const es = i18n.localizeDeep(card.context);
  assert.equal(es.egLearn, card.context.egLearn, "englischer Beispielsatz unverändert (ES-UI)");
  assert.equal(es.situation, card.context.situation, "Situation spanisch bei ES-UI");
  i18n.setLang("en");
  const en = i18n.localizeDeep(card.context);
  assert.equal(en.egLearn, card.context.egLearn, "englischer Beispielsatz unverändert (EN-UI)");
  assert.equal(en.situation, card.context.situationEn, "Situation englisch bei EN-UI");
  assert.ok(!Object.keys(en).some((k) => /En$/.test(k)), "keine …En-Hilfsfelder im EN-Ergebnis");
  i18n.setLang("es"); // Track-Default wiederherstellen
});
