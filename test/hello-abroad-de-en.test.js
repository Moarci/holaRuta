/*
 * hello-abroad-de-en.test.js – HelloAbroad-Edition, Track de-en (DE-Muttersprachler
 * lernt Reiseenglisch). Sichert zwei Fixes gegen Spanisch-Reste ab, die entstehen,
 * WEIL de-en denselben data.js-Reise-Korpus wie de-es nutzt, aber card.en lernt.
 * Beide Reste tauchten erst mit dieser Edition auf (der bestehende Locals-Track es-en
 * zeigt nur den eigenen loc-Korpus, nie die Reise-Karten):
 *
 *   (1) Matcher/card.alt: die alt-Liste der Reise-Karten ist SPANISCH (alt überschreibt
 *       den es-Split, siehe data.js-Header). In de-en (learnLang="en") darf sie die
 *       englische Antwortmenge NICHT ersetzen – sonst würde die korrekte englische
 *       Eingabe abgelehnt und stattdessen Spanisch verlangt bzw. vorgelesen.
 *   (2) tipFor: der `tip` der Reise-Karten ist SPANISCHE Laien-Lautschrift ("Hello" →
 *       "OH-la (H ist stumm)"). In de-en muss er – wie im Locals-Track – unterdrückt
 *       werden, sonst lernt der Nutzer die Aussprache des spanischen Wortes.
 *
 * Fährt die App über den ECHTEN Laufzeit-Pfad hoch (?edition=hello-abroad), analog zu
 * endless.test.js / hostel-edition.test.js.
 *
 * Aufruf:  node --test test/hello-abroad-de-en.test.js   (oder: node --test)
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const stub = require("./_dom-stub.js");

// Frischer App-Boot mit optionalem edition-Param (registry.js liest ihn VOR config.js).
function freshApp(edition) {
  stub.install();
  if (globalThis.window.SC) globalThis.window.SC.editionConfig = null; // Edition nicht durchsickern lassen
  stub.seedOnboarded(); // Standard-Namespace (de-es)
  // HelloAbroad läuft im de-en-Track und speichert unter einem eigenen Namespace
  // (store.js: "spanischcard.de-en.settings.v1"); der Standard-Onboarded-Flag greift
  // dort nicht. Für den direkten Dashboard-Boot den de-en-Namespace mit-seeden.
  if (edition === "hello-abroad") {
    globalThis.window.localStorage.setItem(
      "spanischcard.de-en.settings.v1", JSON.stringify({ onboarded: true, mode: "flip" }));
  }
  globalThis.window.location.search = edition ? "?edition=" + edition : "";
  const SRC = path.join(__dirname, "..");
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${path.sep}test${path.sep}`)) delete require.cache[key];
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
  function setTab(tab) { if (!click("home")) click("set-tab", { tab: "start" }); return click("set-tab", { tab }); }
  function html() { return root.innerHTML; }
  return { find, click, setTab, html };
}

// ============================ (0) Track-Auflösung ============================
test("Edition hello-abroad aktiviert den de-en-Track (learnLang=en)", () => {
  freshApp("hello-abroad");
  const { track, config } = window.SC;
  assert.equal(config.edition, "hello-abroad");
  assert.equal(track.id(), "de-en");
  assert.equal(track.learnLang(), "en");
  assert.equal(track.ttsLocale(), "en-US");
});

// ============================ (1) Matcher / card.alt ============================
test("Matcher: spanisches card.alt einer Reise-Karte wird in de-en NICHT verlangt", () => {
  freshApp("hello-abroad");
  const { matcher, data } = window.SC;

  // dir30: de "Geh geradeaus", en "Go straight ahead", alt ["sigue derecho", …] (spanisch).
  const dir30 = data.CARDS.find((c) => c.id === "dir30");
  assert.ok(dir30 && Array.isArray(dir30.alt) && dir30.alt.length, "dir30 trägt ein spanisches alt");
  assert.ok(dir30.alt.every((a) => !/straight ahead/i.test(a)), "alt ist rein spanisch (Vorbedingung)");

  // Die korrekte englische Antwort zählt (vor dem Fix abgelehnt, weil nur das
  // spanische alt als Kandidatenmenge galt).
  assert.equal(matcher.check("Go straight ahead", dir30, "learn").correct, true, "englische Antwort akzeptiert");
  assert.equal(matcher.check("go straight ahead", dir30, "learn").correct, true, "case-insensitiv");
  // Die spanische alt-Form wird NICHT (mehr) als englische Antwort akzeptiert.
  assert.equal(matcher.check("sigue derecho", dir30, "learn").correct, false, "spanisches alt zählt nicht als en-Antwort");

  // Anzeige/TTS-Antwort ist Englisch, nicht Spanisch.
  const acc = matcher.acceptedAnswers(dir30, "learn");
  assert.ok(acc.some((a) => /straight ahead/i.test(a)), "Anzeige/TTS = englische Antwort");
  assert.ok(!acc.some((a) => /sigue|derecho/i.test(a)), "kein Spanisch in der Anzeige-Antwort");
});

test("Matcher: ENGLISCHES card.alt (loc-Karte) bleibt auch in de-en gültig", () => {
  freshApp("hello-abroad");
  const { matcher } = window.SC;
  // Beweist, dass der Fix nach der ANTWORTSPRACHE des alt unterscheidet (loc-=en) und
  // nicht pauschal jedes alt in de-en verwirft.
  const loc = { id: "loc-tst", es: "el baño", en: "the restroom", alt: ["the restroom", "the toilet"] };
  assert.equal(matcher.check("the toilet", loc, "learn").correct, true, "englisches alt-Synonym akzeptiert");
});

// ================= (2) Aussprache: englische Hilfe statt spanischem Tipp =============
// In de-en tragen ALLE Reise-Karten eine ENGLISCHE Aussprachehilfe (card.enPron,
// z. B. "Hello" → "he-LOU"). Der spanische card.tip ("OH-la") darf NIE erscheinen.
// Der Study-Screen zeigt im de-en-Track also ausschließlich enPron-Werte.
// Entfernt HTML-Tags vollständig: wiederholt anwenden, bis sich nichts mehr
// ändert, damit auch verschachtelte/teilweise Tags (z. B. "<scr<script>ipt>")
// nicht als Rest stehen bleiben.
function stripTags(s) {
  let prev;
  let out = String(s);
  do {
    prev = out;
    out = out.replace(/<[^>]*>/g, "");
  } while (out !== prev);
  return out;
}
function drainStudyTips(edition) {
  const root = freshApp(edition);
  const d = makeDriver(root);
  d.setTab("profil");
  if (d.find("set-mode", { mode: "flip" })) d.click("set-mode", { mode: "flip" });
  d.setTab("entdecken");
  assert.ok(d.click("open-endless"), "open-endless startet den Study-Screen");
  const texts = [];
  for (let i = 0; i < 60; i++) {
    if (d.find("flip")) d.click("flip"); // Antwortseite (mit Tipp) aufdecken
    if (/face__tip/.test(d.html())) {
      const m = d.html().match(/face__tip[^>]*>([\s\S]*?)<\/div>/);
      if (m) texts.push(stripTags(m[1]).trim());
    }
    if (!d.click("rate", { rating: "good" })) break;
  }
  return texts.filter(Boolean);
}
const normTip = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();

test("Aussprache: de-en zeigt die ENGLISCHE Aussprachehilfe, nie den spanischen Tipp", () => {
  const shown = drainStudyTips("hello-abroad").map(normTip);
  const { data } = window.SC;
  const enProns = new Set(data.CARDS.filter((c) => c.enPron).map((c) => normTip(c.enPron)));
  const esTips = new Set(data.CARDS.filter((c) => !/^loc-/.test(c.id) && c.tip).map((c) => normTip(c.tip)));
  assert.ok(shown.length >= 3, `genug Aussprachehilfen gesehen (${shown.length})`);
  for (const t of shown) {
    assert.ok(enProns.has(t), `gezeigter Tipp ist eine englische Aussprachehilfe: "${t}"`);
    assert.ok(!esTips.has(t), `spanischer Tipp durchgesickert: "${t}"`);
  }
});

test("Gegenprobe: de-es zeigt weiterhin die SPANISCHE Lautschrift", () => {
  const shown = drainStudyTips(null).map(normTip);
  const { data } = window.SC;
  const esTips = new Set(data.CARDS.filter((c) => !/^loc-/.test(c.id) && c.tip).map((c) => normTip(c.tip)));
  assert.ok(shown.length > 0, "es erscheinen Tipps im de-es-Track");
  assert.ok(shown.some((t) => esTips.has(t)), "mindestens ein gezeigter Tipp ist die spanische Lautschrift");
});

test("Aussprache-Abdeckung: JEDE HelloAbroad-Karte hat eine englische Aussprachehilfe", () => {
  freshApp("hello-abroad");
  const { data, config } = window.SC;
  const allow = config.categoryAllowlist || [];
  const missing = data.CARDS.filter((c) => allow.indexOf(c.cat) >= 0 && !(typeof c.enPron === "string" && c.enPron.trim()));
  assert.equal(missing.length, 0, `Karten ohne enPron: ${missing.map((c) => c.id).join(", ")}`);
});

// ============================ (3) Geschlechts-Abfrage ============================
// Das Geschlecht löst nur spanische Anrede-Tokens ({o/a}) auf und wäre in de-en (Antwort
// Englisch) wirkungslos – der Hinweis verweist zudem auf Spanisch. In de-en darf daher
// KEINE Geschlechts-Auswahl erscheinen (Onboarding + Profil).
function settingsHtml(edition) {
  const root = freshApp(edition);
  const d = makeDriver(root);
  if (!d.click("home")) d.click("set-tab", { tab: "start" });
  d.click("set-tab", { tab: "profil" });
  return d.html();
}

test("Gender-Abfrage: de-en blendet die (spanisch begründete) Geschlechts-Auswahl aus", () => {
  const de_en = settingsHtml("hello-abroad");
  assert.doesNotMatch(de_en, /data-action="set-gender"/, "de-en darf keine Geschlechts-Auswahl zeigen");
});

test("Gegenprobe: de-es zeigt die Geschlechts-Auswahl weiterhin (spanische Anrede)", () => {
  const de_es = settingsHtml(null);
  assert.match(de_es, /data-action="set-gender"/, "de-es braucht die Geschlechts-Auswahl (perdido/perdida)");
});

// ===================== (3b) Reise-Kontext: englischer Beispielsatz ==================
// Das Kontext-Panel zeigt bei Reise-Karten sonst den SPANISCHEN Beispielsatz. In de-en
// (learnLang=en) muss stattdessen der englische Satz (sentenceEn) erscheinen, sonst ist
// der „Beispiel"-Satz Spanisch (Leck). Marker: die gelernte Zeile trägt lang="en".
function openContextPanel(edition) {
  const root = freshApp(edition);
  const d = makeDriver(root);
  d.setTab("profil");
  if (d.find("set-mode", { mode: "flip" })) d.click("set-mode", { mode: "flip" });
  d.setTab("entdecken");
  assert.ok(d.click("open-endless"), "open-endless startet den Study-Screen");
  for (let i = 0; i < 40; i++) {
    if (d.find("flip")) d.click("flip");            // Antwortseite (mit Kontext-Knopf)
    if (d.find("toggle-context")) {
      d.click("toggle-context");                    // Panel aufklappen
      const html = d.html();
      const m = html.match(/context-panel__es" lang="(\w+)"/);
      if (m) return m[1];                           // Sprache der Beispiel-Zeile
    }
    if (!d.click("rate", { rating: "good" })) break;
  }
  return null;
}

test("Reise-Kontext: de-en zeigt den ENGLISCHEN Beispielsatz (lang=en), nicht Spanisch", () => {
  assert.equal(openContextPanel("hello-abroad"), "en", "Kontext-Beispiel muss in de-en Englisch sein");
});

test("Gegenprobe: de-es zeigt weiterhin den spanischen Beispielsatz (lang=es)", () => {
  assert.equal(openContextPanel(null), "es", "Kontext-Beispiel bleibt in de-es Spanisch");
});

// ============================ (4) 50+-Abdeckung ============================
// Die 10 Reisebereiche wurden gezielt für die 50+-Zielgruppe ergänzt (Mobilität/
// Barrierefreiheit + chronische Gesundheit + Verständnis-Helfer). Sichert die
// Kernkarten samt en-US-Antwort ab (data-Ebene, track-unabhängig).
test("50+-Abdeckung: neue Mobilitäts-/Gesundheits-/Verständnis-Karten vorhanden", () => {
  freshApp("hello-abroad"); // lädt data.js + hello-abroad-Allowlist
  const { data } = window.SC;
  const byId = new Map(data.CARDS.map((c) => [c.id, c]));
  const expect = {
    h25: "Is there an elevator?",              // Mobilität Hotel
    h26: "I'd like a room on the ground floor",
    fh21: "I need wheelchair assistance",       // Barrierefreiheit Flughafen
    fh20: "Where is the baggage claim?",
    fa25: "I have high blood pressure",         // chronische Gesundheit
    fa26: "I have diabetes",
    fa27: "I take heart medication",
    n17: "I have chest pain",                   // Notfall
    n16: "Where is the nearest hospital?",
    b22: "Could you repeat that, please?",      // Verständnis-Helfer
    b23: "Could you write it down?",
  };
  const allow = window.SC.config.categoryAllowlist || [];
  for (const [id, en] of Object.entries(expect)) {
    const c = byId.get(id);
    assert.ok(c, `Karte ${id} fehlt`);
    assert.equal(c.en, en, `${id}: falsche englische Antwort`);
    assert.ok(allow.indexOf(c.cat) >= 0, `${id}: Kategorie ${c.cat} muss in HelloAbroad sichtbar sein`);
  }
});

// ============ (5) Kontext-Erklärung: kein Spanisch in Situation/Tipp ============
// Die Reise-Kontexte (contextdata.js) sind fürs Spanisch-Lernen geschrieben: die
// deutschen Situation-/Tipp-Zeilen lehren SPANISCHES Reisevokabular ("sin azúcar",
// "el baño", "izquierda = links"). In de-en (Reiseenglisch) ist das ein Leck. Der
// Fix hängt an die betroffenen Einträge …DeEn-Pendants (sDeEn/nDeEn), die i18n.
// localizeDeep im de-en-Track statt der spanisch-lastigen Basiszeile einsetzt.
//
// Erkennung ohne pflegeintensive Wortliste: ein app-eigenes DREISPRACHEN-Verfahren.
//  - Spanisch-Korpus = alle Wörter aus den spanischen Sätzen (card.es + contextData.e).
//  - Safe-Korpus (DE/EN) = Wörter aus dem sauberen deutschen/englischen Bestand
//    (card.de/en, contextData.d/dEn und die eingesetzten sDeEn/nDeEn). Die
//    spanisch-lastigen Basis-Zeilen s/n bleiben BEWUSST draußen.
// Ein Token in einer angezeigten Situation/Tipp-Zeile, das im Spanisch-Korpus
// vorkommt, aber NICHT im Safe-Korpus, ist ein Spanisch-Leck. Zusätzlich schlagen
// spanische Sonderzeichen (¿ ¡ ñ + Akut-Vokale) sofort an. So fällt auch ein neu
// hinzugefügter, spanisch-lastiger Kontext ohne …DeEn-Pendant künftig auf.
test("Reise-Kontext: de-en zeigt KEIN Spanisch in Situation/Tipp (alle Karten)", () => {
  freshApp("hello-abroad");
  const { data, config, contextData, i18n } = window.SC;
  const allow = config.categoryAllowlist || [];
  const loc = i18n.localizeDeep;
  const words = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2);

  const ES = new Set();
  data.CARDS.forEach((c) => words(c.es).forEach((w) => ES.add(w)));
  Object.keys(contextData || {}).forEach((id) => words(contextData[id].e).forEach((w) => ES.add(w)));

  const SAFE = new Set();
  const addSafe = (s) => words(s).forEach((w) => SAFE.add(w));
  data.CARDS.forEach((c) => { addSafe(c.de); addSafe(c.en); });
  Object.keys(contextData || {}).forEach((id) => {
    const e = contextData[id];
    addSafe(e.d); addSafe(e.dEn); addSafe(e.sDeEn); addSafe(e.nDeEn);
  });
  // Englische/deutsche Reise-Lehnwörter, die auch in spanischen Sätzen auftauchen.
  "check checkin checkout wifi hostel hotel bar taxi bus zero diet local hour usa uk manual automatic padlock lounge gate app board cash".split(/\s+/).forEach((w) => SAFE.add(w));

  const accents = /[¿¡ñáíóúÁÍÓÚÑ]/;
  const leaks = [];
  data.CARDS.filter((c) => allow.indexOf(c.cat) >= 0 && c.context && !c.context.loc).forEach((c) => {
    const lc = loc(c.context);
    for (const f of ["situation", "note"]) {
      const v = lc[f];
      if (!v) continue;
      if (accents.test(v)) { leaks.push(`${c.id}.${f} [accent]: ${v}`); continue; }
      for (const w of words(v)) {
        if (ES.has(w) && !SAFE.has(w)) { leaks.push(`${c.id}.${f} [${w}]: ${v}`); break; }
      }
    }
  });
  assert.equal(leaks.length, 0, `Spanisch im de-en-Kontext:\n${leaks.slice(0, 20).join("\n")}`);
});

// ============ (6) Dashboard: „Mi léxico"-Kachel zeigt keinen spanischen Markennamen ============
// Der Favoriten-Shortcut auf dem Start-Reiter heißt in de-es „Mi léxico" (spanischer
// Flair, passend zur App). Für ein Reiseenglisch-50+-Publikum ist das ein Leck ohne
// Bezug – i18n.strings.js trägt dafür home.lexTitleDeEn ("Meine Vokabeln"), siehe t().
// app.js liest die Favoriten NUR beim Boot in eine Modul-Variable (Schnappschuss) –
// die Kachel erscheint also nur, wenn der Favorit schon VOR installModules() im
// Storage steht (wie freshApp es für den onboarded-Flag macht).
function freshAppWithFavorite(edition, fav) {
  stub.install();
  if (globalThis.window.SC) globalThis.window.SC.editionConfig = null;
  stub.seedOnboarded();
  const ns = edition === "hello-abroad" ? "de-en." : "";
  if (edition === "hello-abroad") {
    globalThis.window.localStorage.setItem(
      "spanischcard.de-en.settings.v1", JSON.stringify({ onboarded: true, mode: "flip" }));
  }
  globalThis.window.localStorage.setItem(
    "spanischcard." + ns + "favorites.v1", JSON.stringify([fav]));
  globalThis.window.location.search = edition ? "?edition=" + edition : "";
  const SRC = path.join(__dirname, "..");
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC) && !key.includes(`${path.sep}test${path.sep}`)) delete require.cache[key];
  }
  stub.installModules();
  return document.getElementById("app");
}

test("Dashboard: de-en zeigt 'Meine Vokabeln' statt 'Mi léxico' (sobald ein Favorit existiert)", () => {
  const root = freshAppWithFavorite("hello-abroad", { id: "f1", de: "Zimmer wechseln", es: "Can I change rooms?", tip: "", addedAt: 1 });
  const html = root.innerHTML;
  assert.match(html, /Meine Vokabeln/, "de-en zeigt den deutschen Lexikon-Namen");
  assert.doesNotMatch(html, /Mi léxico/, "kein spanischer Markenname im de-en-Dashboard");
});

test("Gegenprobe: de-es zeigt weiterhin 'Mi léxico' auf dem Dashboard", () => {
  const root = freshAppWithFavorite(null, { id: "f1", de: "Zimmer wechseln", es: "¿Puedo cambiar de habitación?", tip: "", addedAt: 1 });
  assert.match(root.innerHTML, /Mi léxico/, "de-es behält den spanischen Markennamen");
});

// ============ (7) Belohnungs-Screen: Rang-Namen/Texte ohne spanischen Flair ============
// celebrate.js (SC.celebrate) treibt sowohl den Level-Up-Fertig-Screen als auch die
// „Dein Fortschritt"-Kachel (Rang + XP-Balken). Beide zogen bislang unverändert die
// Reise-Spanisch-Leiter (Turista/Mochilero/…) und spanische Sätze ("¡Subiste de
// nivel!", "Nivel X · Y erreicht.") – im de-en-Track ohne jeden Bezug.
test("Belohnungs-Rangleiter: de-en nutzt die deutsche Namensleiter, kein Turista/Mochilero", () => {
  freshApp("hello-abroad");
  const { celebrate } = window.SC;
  const levels = celebrate.activeLevels();
  assert.equal(levels[1].name, "Reisefreund");
  assert.ok(levels.every((l) => !/Turista|Mochilero|Explorador|Trotamundos|Aventurero|Baqueano|Leyenda/.test(l.name)));
  const scene = celebrate.decide({ levelBefore: 0, levelAfter: 1, xpAfter: 100, right: 8, wrong: 2, total: 10 });
  assert.doesNotMatch(scene.headline, /[¡¿]/, "Level-Up-Headline ohne spanische Satzzeichen");
  assert.doesNotMatch(scene.sub, /Nivel |[¡¿]/, "Level-Up-Untertitel ohne 'Nivel'/spanische Satzzeichen");
});

test("Gegenprobe: de-es behält die Reise-Spanisch-Rangleiter (Turista/Mochilero/…)", () => {
  freshApp(null);
  const { celebrate } = window.SC;
  assert.equal(celebrate.activeLevels()[1].name, "Mochilero");
});
