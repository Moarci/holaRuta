/*
 * matcher-de.test.js – R1: Matcher-Fixes, vor allem für die Richtung ES→DE
 * (Klammerzusätze optional, ß/ss, Volleingabe "A / B", Preis-Karten) plus
 * Regressionen der bestehenden es-Richtung.
 *
 * Bewusst NUR synthetische Kartenobjekte ({de, es, alt}) – keine IDs aus
 * data.js, weil die Datenbasis parallel umgebaut wird.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "matcher.js"));
const { matcher } = globalThis.window.SC;

const ok = (input, card, field) =>
  assert.equal(matcher.check(input, card, field).correct, true, `sollte akzeptiert werden: "${input}"`);
const no = (input, card, field) =>
  assert.equal(matcher.check(input, card, field).correct, false, `sollte abgelehnt werden: "${input}"`);

// ---------- normalize: neue Zeichen-Toleranzen ----------
test("normalize: ß wird zu ss", () => {
  assert.equal(matcher.normalize("Wie heißt du?"), "wie heisst du");
  assert.equal(matcher.normalize("Straße"), "strasse");
});

test("normalize: $, –, — und Apostrophe verschwinden, Striche sind Wortgrenzen", () => {
  assert.equal(matcher.normalize("$ 45.000"), "45000");
  assert.equal(matcher.normalize("links – rechts"), "links rechts");
  assert.equal(matcher.normalize("links — rechts"), "links rechts");
  assert.equal(matcher.normalize("Wie geht's?"), "wie gehts");
  assert.equal(matcher.normalize("l’agua"), "lagua");
  assert.equal(matcher.normalize("Hostel-Nacht"), "hostel nacht");
});

test("normalize: Klammern werden entfernt", () => {
  assert.equal(matcher.normalize("1. (erster/erste)"), "1 erster erste");
});

test("normalize: bisherige Toleranzen bleiben (Akzente, Satzzeichen, Spaces)", () => {
  assert.equal(matcher.normalize("¿Cómo  estás?"), "como estas");
  assert.equal(matcher.normalize("  ñandú "), "nandu");
  assert.equal(matcher.normalize("¡Hólá!"), "hola");
});

// ---------- ES→DE: Klammerzusätze sind optional ----------
test("de-Richtung: Ordinalzahl '1. (erster/erste)' – alle sinnvollen Eingaben zählen", () => {
  const card = { de: "1. (erster/erste)", es: "primero/a" };
  ok("1.", card, "de");
  ok("1", card, "de");
  ok("erster", card, "de");
  ok("erste", card, "de");
  ok("1. (erster/erste)", card, "de"); // wörtliche Volleingabe
  no("zweite", card, "de");
  no("", card, "de"); // leere Eingabe bleibt falsch
  no("   ", card, "de");
});

test("de-Richtung: Klammerzusatz ohne Slash ist optional", () => {
  const card = { de: "der Geldautomat (ATM)", es: "el cajero automático" };
  ok("der Geldautomat", card, "de");
  ok("atm", card, "de");
  ok("der Geldautomat (ATM)", card, "de");
  no("der Schalter", card, "de");
});

// ---------- ES→DE: ß/ss ----------
test("de-Richtung: ß-Antworten akzeptieren die ss-Schreibweise", () => {
  const card = { de: "Wie heißt du?", es: "¿Cómo te llamas?" };
  ok("Wie heisst du?", card, "de");
  ok("wie heißt du", card, "de");
  no("wie alt bist du", card, "de");
});

// ---------- ES→DE: Slash-Alternativen + Volleingabe ----------
test("de-Richtung: 'links / rechts' – Alternativen UND Volleingabe zählen", () => {
  const card = { de: "links / rechts", es: "izquierda / derecha" };
  ok("links", card, "de");
  ok("rechts", card, "de");
  ok("links / rechts", card, "de"); // exakt wie angezeigt
  ok("links rechts", card, "de");
  no("geradeaus", card, "de");
});

// ---------- ES→DE: Preis-Karten ----------
test("de-Richtung: Preis-Karte '$ 45.000 – Hostel-Nacht' ist lösbar", () => {
  const card = { de: "$ 45.000 – Hostel-Nacht", es: "cuarenta y cinco mil" };
  ok("45.000", card, "de");
  ok("45000", card, "de");
  ok("Hostel-Nacht", card, "de");
  ok("hostel nacht", card, "de");
  ok("$ 45.000 – Hostel-Nacht", card, "de"); // wörtliche Volleingabe
  no("50.000", card, "de");
});

// ---------- ES→DE: das richtige Feld wird geprüft ----------
test("de-Richtung: spanische Antwort zählt nicht als deutsche", () => {
  const card = { de: "Arzt", es: "médico" };
  ok("arzt", card, "de");
  no("medico", card, "de");
});

// ---------- es-Richtung: keine Regressionen ----------
test("es-Richtung: Klammerzusätze sind auch hier optional", () => {
  const card = { de: "Wasser", es: "el agua (sin gas)" };
  ok("el agua", card);
  ok("sin gas", card);
  ok("el agua (sin gas)", card);
});

test("es-Richtung: Slash-Alternativen + Volleingabe", () => {
  const card = { es: "el bus / el colectivo" };
  ok("el bus", card);
  ok("el colectivo", card);
  ok("el bus / el colectivo", card); // exakt wie angezeigt – jetzt auch ok
  no("el taxi", card);
});

test("es-Richtung: card.alt hat weiterhin Vorrang", () => {
  const card = { es: "Soy vegetariano/a", alt: ["soy vegetariano", "soy vegetariana"] };
  ok("soy vegetariano", card);
  ok("soy vegetariana", card);
  no("soy carnívoro", card);
});

test("es-Richtung: bewusste n/ñ-Toleranz (año/ano, Tastatur ohne ñ)", () => {
  const card = { es: "el año" };
  ok("el año", card);
  ok("el ano", card); // dokumentierte Toleranz, siehe matcher.js-Kommentar
});

// ---------- Tippfehler-Toleranz ----------
test("Tippfehler: klarer Vertipper zählt, wird aber als typo markiert", () => {
  const card = { es: "quiero un café" };
  // exakt -> correct, kein typo
  let r = matcher.check("quiero un cafe", card);
  assert.equal(r.correct, true); assert.equal(r.typo, false);
  // ein fehlender Buchstabe -> correct mit typo-Flag
  r = matcher.check("quiro un cafe", card);
  assert.equal(r.correct, true); assert.equal(r.typo, true);
  // optionales Pronomen davor -> correct, kein typo
  r = matcher.check("yo quiero un café", card);
  assert.equal(r.correct, true); assert.equal(r.typo, false);
  // Pronomen + Vertipper -> correct mit typo
  r = matcher.check("yo quiro un café", card);
  assert.equal(r.correct, true); assert.equal(r.typo, true);
});

test("Tippfehler: kurze Wörter bleiben streng (gato ≠ pato), echte Fehler bleiben falsch", () => {
  assert.equal(matcher.check("pato", { es: "gato" }).correct, false);   // 4 Buchstaben: nur exakt
  assert.equal(matcher.check("gato", { es: "gato" }).correct, true);
  no("geradeaus", { de: "links / rechts", es: "izquierda / derecha" }, "de"); // weit weg bleibt weit weg
});

test("Tippfehler: Wortend-Flexion (Genus/Person/Plural) ist KEIN Tippfehler", () => {
  // Eine einzelne Abweichung am Wortende ist eine echte Form, kein Vertipper.
  assert.equal(matcher.check("necesita", { es: "necesito" }).correct, false);        // Person yo↔ella
  assert.equal(matcher.check("soy vegetariano", { es: "soy vegetariana" }).correct, false); // Genus
  assert.equal(matcher.check("estoy cansado", { es: "estoy cansada" }).correct, false);     // Genus
  assert.equal(matcher.check("necesito ayuda", { es: "necesita ayuda" }).correct, false);   // Flexion mitten im Satz
  assert.equal(matcher.check("reservas", { es: "reserva" }).correct, false);          // Plural-s am Ende
  assert.equal(matcher.check("buenas dias", { es: "buenos dias" }).correct, false);   // Genus-Plural -as/-os (vor Wort-finalem s, mitten im Satz)
  assert.equal(matcher.check("amigas", { es: "amigos" }).correct, false);             // Genus-Plural -as/-os
  // Gegenprobe: ein Vertipper im Wortinneren bleibt ein (akzeptierter) Tippfehler.
  let r = matcher.check("quiro un cafe", { es: "quiero un cafe" });
  assert.equal(r.correct, true); assert.equal(r.typo, true);
  // … auch ein langer Wort-INNEN-Tippfehler mit a/o bleibt akzeptiert (keine Über-Strenge).
  let r2 = matcher.check("neccesito", { es: "necesito" });
  assert.equal(r2.correct, true); assert.equal(r2.typo, true);
});

test("Tippfehler: benachbarte Vertauschung zählt als EIN Fehler (Damerau)", () => {
  // Vertauschte Nachbarzeichen sind der häufigste Handy-Tipper. In langen genug
  // Wörtern/Sätzen (Budget >= 1) zählen sie als akzeptierter Tippfehler.
  let r = matcher.check("necestio ayuda", { es: "necesito ayuda" }); // io↔oi im Wortinneren
  assert.equal(r.correct, true); assert.equal(r.typo, true);
  r = matcher.check("quiero un acfé", { es: "quiero un café" });     // ca↔ac
  assert.equal(r.correct, true); assert.equal(r.typo, true);
  // Kurze Wörter bleiben streng: Vertauschung sprengt das Budget 0 nicht auf.
  assert.equal(matcher.check("gtao", { es: "gato" }).correct, false); // 4 Buchstaben
});

test("matchFree: bequemer Freitext-Check liefert correct + typo", () => {
  const acc = ["quiero un cafe", "un cafe por favor"];
  assert.deepEqual(matcher.matchFree("quiero un café", acc), { correct: true, typo: false });
  assert.deepEqual(matcher.matchFree("quiro un cafe", acc), { correct: true, typo: true });
  assert.deepEqual(matcher.matchFree("no se", acc), { correct: false, typo: false });
});

test("check: answers bleibt die unnormalisierte Anzeige-Liste", () => {
  const card = { es: "el bus / el colectivo" };
  assert.deepEqual(matcher.check("x", card).answers, ["el bus", "el colectivo"]);
  const withAlt = { es: "Soy vegetariano/a", alt: ["soy vegetariano", "soy vegetariana"] };
  assert.deepEqual(matcher.check("x", withAlt).answers, withAlt.alt);
});

// ---------- levenshtein (Damerau-OSA): exakte Distanzen ----------
test("levenshtein: benachbarte Vertauschung kostet GENAU 1 (Damerau)", () => {
  assert.equal(matcher.levenshtein("ab", "ba"), 1);          // reine Transposition
  assert.equal(matcher.levenshtein("abc", "acb"), 1);        // Transposition am Ende
  assert.equal(matcher.levenshtein("ca", "ac"), 1);
  assert.equal(matcher.levenshtein("necesito", "necesiot"), 1); // to↔ot am Ende
  assert.equal(matcher.levenshtein("converse", "covnerse"), 1); // nv↔vn im Inneren
});

test("levenshtein: Standard-Distanzen ohne falsches Transponieren", () => {
  assert.equal(matcher.levenshtein("gato", "gato"), 0);
  assert.equal(matcher.levenshtein("gato", "pato"), 1);      // eine Substitution
  assert.equal(matcher.levenshtein("", "abc"), 3);           // leer -> Länge
  assert.equal(matcher.levenshtein("abc", ""), 3);
  assert.equal(matcher.levenshtein("abc", "xyz"), 3);        // drei Substitutionen
  assert.equal(matcher.levenshtein("kitten", "sitting"), 3); // klassisches Beispiel
  assert.equal(matcher.levenshtein("ab", "abc"), 1);         // eine Einfügung
});

// ---------- native EN: führender Artikel (the/a/an) ist optional ----------
test("native EN: artikellose UND volle Eingabe zählen, ohne Dublette", () => {
  const i18n = { getLang: () => "en", nativeText: (c) => c.en };
  globalThis.window.SC.i18n = i18n;
  try {
    const card = { es: "la parada del bus", en: "the bus stop" };
    ok("the bus stop", card, "native"); // volle Eingabe
    ok("bus stop", card, "native");      // Artikel weggelassen
    const cands = matcher.candidates(card, "native");
    assert.ok(cands.includes("the bus stop"));
    assert.ok(cands.includes("bus stop"));
    // keine Dublette: artikellose Form genau einmal
    assert.equal(cands.filter((c) => c === "bus stop").length, 1);
  } finally { delete globalThis.window.SC.i18n; }
});

test("native EN strippt NUR bei native: spanisches Feld bleibt artikel-streng", () => {
  const i18n = { getLang: () => "en", nativeText: (c) => c.en };
  globalThis.window.SC.i18n = i18n;
  try {
    // Für das es-Feld darf KEIN Artikel entfernt werden, auch wenn UI=Englisch.
    no("casa", { es: "a casa" }, "es");
    ok("a casa", { es: "a casa" }, "es");
  } finally { delete globalThis.window.SC.i18n; }
});

test("native nicht-EN: deutscher Artikel wird NICHT entfernt", () => {
  const i18n = { getLang: () => "de", nativeText: (c) => c.de };
  globalThis.window.SC.i18n = i18n;
  try {
    no("bus", { es: "x", de: "der Bus" }, "native"); // "der" ist kein engl. Artikel
    ok("der bus", { es: "x", de: "der Bus" }, "native");
  } finally { delete globalThis.window.SC.i18n; }
});

// ---------- card.alt-Vorrang ist an field==="es" gebunden ----------
test("candidates: card.alt gilt NUR für es und ersetzt dort die Generierung", () => {
  const card = { es: "Soy vegetariano/a", alt: ["soy vegetariano", "soy vegetariana"] };
  // es: exakt die normalisierten alt-Einträge, nichts aus dem es-Text generiert
  assert.deepEqual(matcher.candidates(card, "es"), ["soy vegetariano", "soy vegetariana"]);
  // de ignoriert alt[] komplett (alt ist nur Spanisch)
  const deCard = { de: "links / rechts", es: "x", alt: ["IGNORIERT"] };
  const deCands = matcher.candidates(deCard, "de");
  assert.ok(deCands.includes("links") && deCands.includes("rechts"));
  assert.ok(!deCands.includes("ignoriert"));
});

// Eine Abweichung am WORTANFANG ist KEINE Wortend-Flexion -> zählt als Tippfehler.
// (Sichert die volle Suffix-Zählung in commonSuffixLen bis zum ersten Zeichen ab.)
test("Tippfehler: fehlender Anfangsbuchstabe ist ein Tippfehler, keine Flexion", () => {
  // Beide Richtungen: die Abweichung sitzt am Wortanfang (Distanz 1), das gemeinsame
  // Suffix reicht bis zum ersten Zeichen des kürzeren Worts – darf NICHT als
  // Wortend-Flexion abgelehnt werden. (Sichert die Suffix-Zählung an beiden Rändern.)
  let r = matcher.check("o cuesta", { es: "no cuesta" }); // Eingabe kürzer
  assert.equal(r.correct, true);
  assert.equal(r.typo, true);
  r = matcher.check("no cuesta", { es: "o cuesta" });     // Kandidat kürzer
  assert.equal(r.correct, true);
  assert.equal(r.typo, true);
});

// ---------- Tippfehler-Schwelle (typoBudget) an der Längen-Grenze ----------
test("Tippfehler-Budget: 8 Zeichen lassen 1 Fehler zu, 7 Zeichen keinen", () => {
  // 7 Zeichen (< 8) -> Budget 0: ein Vertipper im Inneren zählt NICHT.
  no("xanjero", { es: "cajero" }, "es");          // 6 Zeichen Ziel: streng
  // 8 Zeichen -> Budget 1: ein Vertipper im INNEREN zählt (ein Dreher am Wortende
  // wäre Flexion; daher bewusst innen: r statt e).
  const r = matcher.check("entirnde", { es: "entiende" }); // r statt e im Inneren, 8 Zeichen
  assert.equal(r.correct, true);
  assert.equal(r.typo, true);
});

// ---------- Tippfehler-Budget & Genus-vor-s (Mutations-Regressionsschutz) ----------
// Verriegelt zwei Verzweigungen, die der Mutationstest sonst überleben lässt:
test("typoBudget: 8–13-Zeichen-Wörter tolerieren NUR 1 Edit (nicht 2)", () => {
  // 8 Zeichen -> Budget 1: zwei innere Edits dürfen NICHT als Tippfehler zählen
  // (sonst würde aus "necesito" über zwei Buchstaben hinweg fälschlich ein Treffer).
  no("nacasito", { es: "necesito" }, "es");        // 2 Edits (e->a, e->a), len 8
  // Kontrast: genau 1 innerer Edit auf demselben Wort IST ein Tippfehler.
  const one = matcher.check("neccesito", { es: "necesito" }, "es");
  assert.equal(one.correct, true);
  assert.equal(one.typo, true);
});

test("Wortende: a/o-vor-s ist Flexion, ANDERE Vokale-vor-s bleiben Tippfehler", () => {
  // Echte Genus-Plural-Flexion (beide a/o vor finalem s) -> KEIN Tippfehler.
  no("buenos", { es: "buenas" }, "es");
  no("amigas", { es: "amigos" }, "es");
  // Aber: differiert vor dem finalen s ein NICHT-Genus-Vokal (e<->a), bleibt es ein
  // gewöhnlicher 1-Zeichen-Tippfehler und zählt (len>=8). Das tötet die &&->||-Mutation
  // der Genus-Bedingung: || würde dies fälschlich als Flexion abweisen.
  const t = matcher.check("presentes", { es: "presentas" }, "es"); // e statt a vor s, len 9
  assert.equal(t.correct, true);
  assert.equal(t.typo, true);
});
