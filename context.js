/*
 * context.js  (SC.context) – hängt den Reise-Kontext an die Karten. LOGIK-Modul
 * (wie srs/matcher), bewusst getrennt von den reinen Daten in data.js.
 *
 * Lädt NACH data.js und contextdata.js. Quelle der handgeschriebenen Inhalte ist
 * SC.contextData (kompakt { e, d, s, n }); reine Zahlen-Karten bekommen einen
 * praktischen Preis-/Mengen-Kontext generiert.
 *
 * Precedence pro Karte: handgeschriebener Eintrag aus contextData  >  generierte Zahl.
 * (Karten ohne beides bleiben ohne Kontext – der 🧭-Button erscheint dann nicht.)
 */
(function () {
  "use strict";

  // Praktischer Kontext für reine Zahlen-Karten (id "z" + Ziffern). Statt eines
  // erfundenen Satzes pro Ziffer bekommen Zahlen die häufigste Reise-Verwendung:
  // den Preis hören und verstehen. Hinweise variieren nach Größenordnung.
  //
  // Spanische Grammatik korrekt halten (LatAm-Inhalte sind "heilig"):
  //   - genau 1: "Es un peso" (Singular, apokopiertes "un").
  //   - Zahlen auf "uno": vor dem Nomen "un" / "veintiún" (z. B. veintiún pesos).
  //   - "de pesos" NUR, wenn die Zahl auf millón/millones ENDET (un millón de pesos),
  //     nicht bei Tausender-Rest (un millón quinientos mil pesos – ohne "de").
  // Greift – wenn geladen – auf das zentrale Zahlen-Modul zu (gleiche Apokope-/
  // Millionen-/„de"-Regeln wie der Preis-Hörtrainer). Fallback unten, falls das
  // Modul (z. B. in einem isolierten Test) nicht vorhanden ist.
  const NUM = (window.SC && window.SC.numbers) || null;

  function numberContext(card) {
    const es = card.es;                                   // z.B. "cincuenta y siete"
    const deNum = String(card.de).replace(/\s*\(.*\)\s*/g, "").trim(); // "57", "1.000"
    const value = Number(deNum.replace(/[.\s]/g, "")) || 0;

    // "uno" am Wortende vor dem Nomen apokopieren: veintiuno -> veintiún (mit Akzent),
    // sonst -> un (treinta y uno -> treinta y un, ciento uno -> ciento un).
    const apocope = NUM ? NUM.apocope : (n) => /veintiuno$/i.test(n) ? n.replace(/veintiuno$/i, "veintiún")
                                                 : n.replace(/uno$/i, "un");
    const endsInMillion = /mill(?:ó|o)n(?:es)?$/i.test(es);
    // Betrag als Preisangabe: zentrale Logik (NUM.amount) erzeugt identische
    // Strings (un peso / veintiún pesos / un millón de pesos …), nur die deutsche
    // Seite und das Hilfsverb (Es/Son) bleiben hier lokal.
    let amountEs, verbEs, pesoDe, pesoEn;
    if (value === 1) {
      amountEs = NUM ? NUM.amount(1, card.cur) : "un peso"; verbEs = "Es"; pesoDe = "Peso"; pesoEn = "peso";
    } else if (endsInMillion) {
      // Singular/Plural sauber trennen: genau "un millón" ist ein Singular-Subjekt
      // ("Es un millón de pesos"), ab "dos millones" Plural ("Son dos millones de pesos").
      const singularMillion = /^un\s+mill(?:ó|o)n$/i.test(es.trim());
      amountEs = NUM ? NUM.amount(value) : `${es} de pesos`; verbEs = singularMillion ? "Es" : "Son"; pesoDe = "Pesos"; pesoEn = "pesos";
    } else {
      amountEs = NUM ? NUM.amount(value) : `${apocope(es)} pesos`; verbEs = "Son"; pesoDe = "Pesos"; pesoEn = "pesos";
    }

    // 0 ergibt keinen sinnvollen Preis -> echter Reise-Gebrauch von "cero".
    if (value === 0) {
      return {
        sentenceEs: "Me quedan cero pesos, necesito un cajero.",
        sentenceDe: "Mir bleiben null Pesos, ich brauche einen Geldautomaten.",
        sentenceEn: "I have zero pesos left, I need an ATM.",
        situation: "Wenn dein Bargeld alle ist.",
        situationEn: "When you've run out of cash.",
        note: "cero = null; praktisch, um zu sagen, dass etwas leer oder aus ist.",
        noteEn: "cero = zero; handy for saying something is empty or out.",
      };
    }

    let situation, note, situationEn, noteEn;
    if (value < 100) {
      situation = "Beim Bezahlen, bei Mengen, Personen oder einer Zimmernummer.";
      situationEn = "When paying, for quantities, people or a room number.";
      note = "Kleine Zahlen brauchst du ständig – für Anzahl, Personen oder die Hausnummer.";
      noteEn = "You need small numbers all the time – for counts, people or the house number.";
    } else if (value < 10000) {
      situation = "Beim Bezahlen an der Kasse, im Markt oder im Taxi.";
      situationEn = "When paying at the till, in the market or in a taxi.";
      note = "In vielen Ländern (z. B. Kolumbien, Chile) sind selbst kleine Preise schnell vierstellig.";
      noteEn = "In many countries (e.g. Colombia, Chile) even small prices quickly run to four digits.";
    } else {
      situation = "Beim Bezahlen größerer Beträge: Hostel-Nacht, Tour oder am Geldautomaten.";
      situationEn = "When paying larger amounts: a hostel night, a tour or at the ATM.";
      note = "Große Beträge schnell zu erkennen, schützt dich beim Wechselgeld vor Fehlern.";
      noteEn = "Recognising large amounts quickly protects you from change mistakes.";
    }
    return {
      sentenceEs: `${verbEs} ${amountEs}.`,
      sentenceDe: `Das macht ${deNum} ${pesoDe}.`,
      sentenceEn: `That's ${deNum} ${pesoEn}.`,
      situation,
      situationEn,
      note,
      noteEn,
    };
  }

  // Kompakte Schreibweise { e, d, s, n } -> volles context-Objekt. Englische
  // Pendants (dEn/sEn/nEn) werden mitgeführt; die aktive Sprache wählt erst die
  // View (per natk), weil der Kontext einmalig beim Laden angehängt wird.
  const expand = (x) => ({
    sentenceEs: x.e,
    sentenceDe: x.d, sentenceEn: x.dEn,
    situation: x.s, situationEn: x.sEn,
    note: x.n, noteEn: x.nEn,
  });

  // Kontext an die Karten hängen (mutiert die übergebene Liste – einmalig beim Start).
  function attach(cards, contextData) {
    const map = contextData || {};
    (cards || []).forEach((card) => {
      if (card.context) return;                          // bereits gesetzt? unangetastet
      if (map[card.id]) { card.context = expand(map[card.id]); return; }
      if (/^z\d+$/.test(card.id)) card.context = numberContext(card);
    });
    return cards;
  }

  const SC = window.SC || (window.SC = {});
  SC.context = { numberContext, attach };
  // Beim Laden direkt auf die echten Karten anwenden (data.js + contextdata.js sind da).
  if (SC.data && SC.data.CARDS) attach(SC.data.CARDS, SC.contextData);
})();
