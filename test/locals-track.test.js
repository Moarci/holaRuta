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

test("Matcher: jede loc-alt-Karte akzeptiert ihre eigene Haupt-en (Regression)", () => {
  // card.alt ERSETZT beim Matching die Antwortmenge der gelernten Antwort. Damit die
  // ANGEZEIGTE Haupt-en weiterhin akzeptiert wird (früher ein Bug – „besides" wurde
  // als falsch gewertet), MUSS jede loc-alt-Liste die Hauptantwort als ersten Eintrag
  // enthalten. Diese Daten-Invariante wird hier festgeschrieben.
  const card = { es: "además", en: "besides", alt: ["besides", "in addition", "moreover"] };
  assert.equal(matcher.check("besides", card, "learn").correct, true, "Haupt-en akzeptiert");
  assert.equal(matcher.check("moreover", card, "learn").correct, true, "Synonym akzeptiert");
  assert.equal(matcher.acceptedAnswers(card, "learn")[0], "besides", "Anzeige/TTS = Haupt-en zuerst");
  // ALLE echten loc-Karten mit alt: die Hauptantwort ist enthalten UND wird akzeptiert.
  const norm = (s) => String(s || "").toLowerCase().replace(/[.,!?¿¡;:"']/g, "").replace(/^(?:the|a|an)\s+/, "").replace(/\s+/g, " ").trim();
  const withAlt = data.CARDS.filter((c) => /^loc-/.test(c.id) && Array.isArray(c.alt) && c.alt.length);
  assert.ok(withAlt.length >= 7, `genug alt-Karten (${withAlt.length})`);
  for (const c of withAlt) {
    assert.ok(c.alt.some((a) => norm(a) === norm(c.en)), `${c.id}: alt enthält die Haupt-en (${JSON.stringify(c.en)})`);
    assert.equal(matcher.check(c.en, c, "learn").correct, true, `${c.id}: Haupt-en akzeptiert (${JSON.stringify(c.en)})`);
  }
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

test("i18n: Locals-Track dreht die Sprachrichtung der EN-UI um (Englisch statt Spanisch)", () => {
  // In der englischen UI des Locals-Tracks darf kein „Spanish" mehr auftauchen, wo
  // tatsächlich Englisch gelernt wird – t() bevorzugt die <key>Locals-Variante.
  i18n.setLang("en");
  const intro = i18n.t("discover.discoverIntro");
  assert.ok(/English/.test(intro) && !/Spanish/.test(intro), `Entdecken-Intro: ${intro}`);
  const yesto = i18n.t("discover.subYesto");
  assert.ok(/English/.test(yesto) && !/Spanish/.test(yesto), `¿Y esto?-Untertitel: ${yesto}`);
  const quiz = i18n.t("discover.quizSetupIntro");
  assert.ok(/English/.test(quiz) && !/with no translation/.test(quiz), `Definiciones-Intro: ${quiz}`);
  i18n.setLang("es"); // Track-Default wiederherstellen
});

test("i18n: Locals-Variante überschreibt NICHT die korrekte spanische Basiszeile (ES-UI)", () => {
  // Eine nur auf Englisch hinterlegte <key>Locals-Variante darf in der ES-UI die
  // bereits richtige spanische Basiszeile nicht durch Englisch ersetzen.
  i18n.setLang("es");
  assert.equal(i18n.t("discover.subYesto"), "Adivina la imagen: 3-2-1, ¿cómo se dice en inglés?");
  assert.ok(/en inglés/.test(i18n.t("discover.quizSetupIntro")));
  // Descubrir-Intro: spanischer Text passt zur Seite (kein „Mi léxico"-Rest).
  assert.ok(/inglés/.test(i18n.t("discover.discoverIntro")) && !/guardadas/.test(i18n.t("discover.discoverIntro")));
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

test("Content: Locals-Kategorien sind 6 Gruppen mit spanischem labelEs", () => {
  const groups = new Set(dataLocals.CATEGORIES.map((c) => c.group));
  assert.deepEqual([...groups].sort(), ["loc-b2", "loc-dia", "loc-esc", "loc-hosp", "loc-trab", "loc-voc"]);
  for (const c of dataLocals.CATEGORIES) {
    assert.ok(c.labelEs && c.labelEs.length, `Kategorie ${c.id} hat labelEs (spanisch)`);
    assert.ok(c.labelEn && c.labelEn.length, `Kategorie ${c.id} hat labelEn (englisch)`);
  }
});

test("Content: jede Locals-Kategorie hat Karten (keine leeren Kacheln)", () => {
  // Schützt vor „null content": die Kachel-Anzeige „0 Karten" entsteht NUR durch
  // den Stufen-Filter, nie durch eine kartenlose Kategorie. Besonders die reine
  // B2-Gruppe (loc-b2, alle Karten lvl 4) muss befüllt bleiben.
  const counts = new Map();
  for (const k of dataLocals.CARDS) counts.set(k.cat, (counts.get(k.cat) || 0) + 1);
  for (const c of dataLocals.CATEGORIES) {
    assert.ok((counts.get(c.id) || 0) > 0, `Kategorie ${c.id} hat keine Karten`);
  }
  // Die B2-Gruppe existiert und trägt ausschließlich Stufe-4-Karten.
  const b2 = dataLocals.CATEGORIES.filter((c) => c.group === "loc-b2");
  assert.ok(b2.length > 0, "loc-b2-Gruppe fehlt");
  for (const c of b2) {
    const cards = dataLocals.CARDS.filter((k) => k.cat === c.id);
    assert.ok(cards.length > 0, `B2-Kategorie ${c.id} ist leer`);
    assert.ok(cards.every((k) => k.lvl === 4), `B2-Kategorie ${c.id}: alle Karten Stufe 4`);
  }
});

test("Content: Lernpfade (PLANS) – 8 Wochen × 5 Teile à 20 Karten, scope curso*", () => {
  assert.ok(Array.isArray(dataLocals.PLANS) && dataLocals.PLANS.length >= 2);
  const ids = new Set(dataLocals.CARDS.map((c) => c.id));
  const scopes = new Set();
  for (const plan of dataLocals.PLANS) {
    assert.ok(/^curso/.test(plan.scope), `Plan-scope beginnt mit curso: ${plan.scope}`);
    scopes.add(plan.scope);
    assert.equal(plan.days.length, 40, `Plan ${plan.scope} hat 40 Etappen (8 Wochen × 5 Teile)`);
    assert.ok(plan.labelEs && plan.labelEn, `Plan ${plan.scope} hat labelEs/labelEn`);
    let expectedDay = 0;
    for (const w of plan.days) {
      expectedDay++;
      assert.equal(w.day, expectedDay, `${plan.scope}: day läuft sequenziell (${w.day})`);
      assert.ok(w.week >= 1 && w.week <= 8, `${plan.scope} day ${w.day}: week 1..8 (${w.week})`);
      assert.ok(w.part >= 1 && w.part <= 5, `${plan.scope} day ${w.day}: part 1..5 (${w.part})`);
      assert.ok(w.titleEs && w.titleEn, `${plan.scope} day ${w.day} hat titleEs/titleEn`);
      if (w.part === 1) assert.ok(w.weekTitleEs && w.weekTitleEn, `${plan.scope} Woche ${w.week} hat weekTitle auf Teil 1`);
      assert.equal(w.cardIds.length, 20, `${plan.scope} day ${w.day} hat 20 Karten`);
      assert.equal(new Set(w.cardIds).size, 20, `${plan.scope} day ${w.day}: keine Dubletten im Teil`);
      for (const id of w.cardIds) assert.ok(ids.has(id), `${plan.scope} day ${w.day} referenziert existierende Karte ${id}`);
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

// ---------------------------------------------------------------------------
// Badges: im Locals-Track eigene, reise-freie Badge-Welt (edition-aware).
// ---------------------------------------------------------------------------
test("Badges: Locals-Track liefert re-thematisierte Badges ohne Reise-Spielmodi", () => {
  const badges = require(path.join(__dirname, "..", "badges.js")).default || window.SC.badges;
  // Gruppen: nur die im Locals-Track vorhandenen Features
  const gids = badges.groups().map((g) => g.id).sort();
  assert.deepEqual(gids, ["category", "context", "learning", "special", "streak"]);
  const all = badges.evaluate({});
  const ids = new Set(all.map((b) => b.id));
  // Reise-only Spielmodus-Badges sind raus
  for (const gone of ["banderas_first", "cuerpo_first", "yesto_first", "quiz_first", "battle_first", "listen_first", "challenge_first", "frases_first"]) {
    assert.ok(!ids.has(gone), `Reise-Badge ${gone} ist im Locals-Track ausgeblendet`);
  }
  // Reise-Kategorie-Badges raus, Locals-Kategorie-Badges da
  assert.ok(!ids.has("cat_basics") && !ids.has("cat_hotel"), "Reise-Kategorie-Badges ausgeblendet");
  assert.ok(ids.has("cat_bpo-en") && ids.has("cat_tech-en"), "Locals-Kategorie-Badges vorhanden");
  // pretrip_done ist zum Lernpfad-Meilenstein umgedeutet (kein „Trip")
  const pd = badges.byId("pretrip_done");
  assert.equal(pd.nameEn, "Learning-path milestone");
  assert.ok(!/trip|travel|reise/i.test(pd.nameEn + " " + pd.descriptionEn + " " + pd.unlockedTextEn), "pretrip_done ohne Reise-Wording");
  // Stichprobe: keine Reise-Metaphern in den sichtbaren Badge-Texten (EN)
  const blob = all.map((b) => `${b.nameEn} ${b.descriptionEn} ${b.unlockedTextEn}`).join(" ");
  assert.ok(!/\b(trip|travel|backpack|guidebook|on the road|Ruta)\b/i.test(blob), "keine Reise-Metaphern in Locals-Badges");
});

// ---------------------------------------------------------------------------
// Discover-Spiele aus dem Reise-Track recycelt (PR #217): im Locals-Track ist
// die gelernte Seite Englisch (card.en/item.en/o.en/frameEn). Die Spiele lesen
// dieses Feld – fehlt es in den Daten, rendern sie leere Wörter. Diese Tests
// sichern die volle en-Feld-Abdeckung der drei datengetriebenen Spiele ab.
// ---------------------------------------------------------------------------
test("Discover-Spiele (Locals): Definiciones-Quiz hat für jede Option ein en-Wort", () => {
  const defs = data.QUIZ_DEFS || [];
  assert.ok(defs.length > 0, "QUIZ_DEFS vorhanden");
  for (const d of defs) {
    assert.ok(d.es && d.es.length, `QUIZ_DEF ${d.id} hat ein spanisches Wort`);
    assert.ok(d.en && d.en.trim(), `QUIZ_DEF ${d.id} hat ein englisches Wort (Locals-Lernseite)`);
    assert.ok(d.def && d.def.length, `QUIZ_DEF ${d.id} hat eine (spanische) Definition`);
  }
});

test("Discover-Spiele (Locals): ¿Y esto? – jedes Motiv hat ein en-Lösungswort", () => {
  const yesto = require(path.join(__dirname, "..", "yesto.js")).default || window.SC.yesto;
  const themes = (yesto && yesto.THEMES) || [];
  assert.ok(themes.length > 0, "yesto THEMES vorhanden");
  let items = 0;
  for (const th of themes) {
    for (const it of th.items || []) {
      items++;
      assert.ok(it.es && it.es.length, `yesto ${th.id}: Item hat es`);
      assert.ok(it.en && String(it.en).trim(), `yesto ${th.id}: Item „${it.es}" hat en (Locals-Lösungswort)`);
    }
  }
  assert.ok(items > 0, "yesto hat Motive");
});

test("Discover-Spiele (Locals): Frases – jeder Rahmen hat frameEn (mit Lücke) + en-Bausteine", () => {
  const frases = require(path.join(__dirname, "..", "frases.js")).default || window.SC.frases;
  const list = (frases && frases.FRASES) || [];
  assert.ok(list.length > 0, "FRASES vorhanden");
  for (const f of list) {
    assert.ok(f.frameEn && f.frameEn.indexOf("___") >= 0, `Frase ${f.id}: frameEn mit Lücke (Locals baut den englischen Satz)`);
    assert.ok(f.slot && f.slot.en && f.slot.en.length, `Frase ${f.id}: slot.en (richtiger englischer Baustein)`);
    for (const d of f.distractors || []) {
      assert.ok(d.en && d.en.length, `Frase ${f.id}: jeder Distraktor hat en`);
    }
    // Der zusammengesetzte englische Satz darf kein „How are you called?"-Muster
    // erzeugen (unidiomatisch): das war der Review-Befund zu so03.
    const built = f.frameEn.replace("___", f.slot.en).toLowerCase();
    assert.ok(!/how\s+(is|are|am|do|does|did)\s+\w+\s+called/.test(built),
      `Frase ${f.id}: zusammengesetzter Satz ist idiomatisch (kein „how … called"): ${built}`);
  }
});

// ---------------------------------------------------------------------------
// Korpus-Integrität: Vokabel-Wortlisten (loc-voc) und Themen-/Service-Karten
// teilen sich bewusst häufige Wörter (z. B. „naranja" als Farbe UND als Frucht).
// Das ist gewollt – ABER kein einzelnes Lern-Set (Kategorie, Preset, Kurs-Etappe)
// darf denselben Prompt doppelt zeigen. Akzent-sensitiv, d. h. tu≠tú, si≠sí.
// ---------------------------------------------------------------------------
test("Korpus: kein In-Session-Set (Kategorie/Preset/Kurs-Etappe) zeigt denselben Prompt doppelt", () => {
  const loc = data.CARDS.filter((c) => /^loc-/.test(c.id));
  const byId = Object.fromEntries(loc.map((c) => [c.id, c]));
  const norm = (s) => (s || "").toLowerCase().replace(/[¿¡!?.,]/g, "").replace(/\s+/g, " ").trim();
  const findDup = (ids, where) => {
    const seen = {};
    for (const id of ids) {
      const c = byId[id];
      if (!c) continue;
      const k = norm(c.es);
      if (!k) continue;
      (seen[k] = seen[k] || []).push(id);
    }
    for (const [k, v] of Object.entries(seen)) {
      assert.equal(v.length, 1, `${where}: Prompt „${k}" mehrfach (${v.join(", ")})`);
    }
  };
  // Kategorien
  const cats = {};
  for (const c of loc) (cats[c.cat] = cats[c.cat] || []).push(c.id);
  for (const [cat, ids] of Object.entries(cats)) findDup(ids, `Kategorie ${cat}`);
  // Presets
  for (const p of dataLocals.PRESETS) findDup(p.pick, `Preset ${p.id}`);
  // Kurs-Etappen (je 20 Karten)
  for (const plan of dataLocals.PLANS) {
    for (const d of plan.days) findDup(d.cardIds, `${plan.scope} Etappe ${d.day}`);
  }
});

test("Doku: LOCALS.md-Zähler (Kategorien · Karten) == echter Stand", () => {
  const fs = require("fs");
  const md = fs.readFileSync(path.join(__dirname, "..", "LOCALS.md"), "utf8");
  const m = md.match(/\*\*(\d+)\s+Kategorien\s+·\s+(\d+)\s+Karten\*\*/);
  assert.ok(m, "LOCALS.md nennt '**N Kategorien · M Karten**'");
  const docCats = Number(m[1]);
  const docCards = Number(m[2]);
  const realCats = dataLocals.CATEGORIES.length;
  const realCards = data.CARDS.filter((c) => /^loc-/.test(c.id)).length;
  assert.equal(docCats, realCats, `LOCALS.md Kategorien (${docCats}) == echt (${realCats})`);
  assert.equal(docCards, realCards, `LOCALS.md Karten (${docCards}) == echt (${realCards})`);
});
