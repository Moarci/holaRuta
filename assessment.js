/*
 * assessment.js  (SC.assessment) – „HolaRuta Nivel-Test“: der ausführliche,
 * adaptive Einstufungstest. REINE DATEN + REINE FUNKTIONEN (kein DOM).
 *
 * Verhältnis zum kurzen „HolaRuta-Check“ (placement.js):
 *  - placement.js  = schneller Einstieg (A0–B1, ~14 Fragen) fürs Onboarding.
 *  - assessment.js = der gründliche Test (A0–C1, ~34 Fragen) für alle, die ihr
 *    Niveau wirklich genau wissen wollen. Länger & abwechslungsreicher, aber
 *    bewusst kürzer als ein professioneller Zertifikatstest (DELE/SIELE).
 *
 * Leitlinie (gleiche Philosophie wie der kurze Check, nur tiefer):
 *  - Kommunikation im Zentrum (~60 %), Grammatik als ernstzunehmende Diagnose
 *    (~40 %) – inkl. Leseverstehen längerer Sätze und Subjuntivo/Konditional.
 *  - Jede Frage hat „Ich weiß es nicht“ – ehrliches Nichtwissen statt Raten.
 *  - Antwortzeit fließt nur LEICHT in den Score (10 %).
 *  - Ergebnis ist ein Profil (Trefferquote, Sicherheit, Unknown-Rate, Tempo,
 *    Skill-Aufschlüsselung) + ein genaues Niveau (A0…C1) – nützlicher als eine Note.
 *  - Adaptiv über SECHS Stufen (Treppe), damit der Test nicht alle ~70 Items
 *    durchgeht, sondern aufs echte Niveau konvergiert.
 *
 * Blöcke/Skills: understanding · reaction · vocab · reading · free (= Kommunikation),
 *                conjugation · tenses · grammar (= Grammatik/Strukturen).
 *
 * Alle Fragen sind LatAm-tauglich (ustedes statt vosotros) und an echten
 * Reise-/Alltagssituationen orientiert – nur eben anspruchsvoller als im Check.
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});

  // ---------- Fragenkatalog ----------
  // type "mc": options + correctIndex.  type "free": accept[] (akzeptierte Antworten).
  // skill steuert die Aufschlüsselung; block die Anzeige-Gruppierung.
  // questionEs (optional) = spanischer Satz/Lückentext, der mit angezeigt wird.
  var QUESTIONS_ES = [
    // ===================== A0 – allererste Schritte =====================
    { id: "as_un_a0a", block: "understanding", skill: "understanding", level: "A0", type: "mc",
      promptDe: "Was bedeutet „Buenos días“?",
      options: ["Guten Tag / Guten Morgen", "Gute Nacht", "Auf Wiedersehen", "Bis bald"],
      correctIndex: 0, expectedTimeSec: 6,
      explanationDe: "„Buenos días“ = Guten Morgen/Guten Tag (vormittags)." },
    { id: "as_un_a0b", block: "understanding", skill: "understanding", level: "A0", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "No, gracias.",
      options: ["Ja, bitte.", "Nein, danke.", "Bitte schön.", "Bis später."],
      correctIndex: 1, expectedTimeSec: 6,
      explanationDe: "„No, gracias“ = Nein, danke." },
    { id: "as_vo_a0a", block: "vocab", skill: "vocab", level: "A0", type: "mc",
      promptDe: "Was bedeutet „el agua“?",
      options: ["das Brot", "das Wasser", "der Kaffee", "die Milch"],
      correctIndex: 1, expectedTimeSec: 6,
      explanationDe: "„el agua“ = das Wasser (trotz „el“ ist agua weiblich)." },
    { id: "as_vo_a0b", block: "vocab", skill: "vocab", level: "A0", type: "mc",
      promptDe: "Welche Zahl ist „tres“?",
      options: ["zwei", "drei", "vier", "fünf"],
      correctIndex: 1, expectedTimeSec: 6,
      explanationDe: "uno (1), dos (2), tres (3), cuatro (4), cinco (5)." },
    { id: "as_re_a0a", block: "reaction", skill: "reaction", level: "A0", type: "mc",
      promptDe: "Du gehst abends ins Hostel und grüßt. Was passt?",
      options: ["Buenos días.", "Buenas noches.", "De nada.", "Hasta mañana."],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„Buenas noches“ = Guten Abend / Gute Nacht." },
    { id: "as_un_a0c", block: "understanding", skill: "understanding", level: "A0", type: "mc",
      promptDe: "Was bedeutet „Me llamo Ana“?",
      options: ["Ich heiße Ana.", "Ich rufe Ana.", "Das ist Ana.", "Ana ist da."],
      correctIndex: 0, expectedTimeSec: 8,
      explanationDe: "„Me llamo …“ = Ich heiße … (wörtlich: ich nenne mich)." },

    // ===================== A1 – einfache Alltagssätze =====================
    { id: "as_un_a1a", block: "understanding", skill: "understanding", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "¿Dónde está la estación?",
      options: ["Wie viel kostet der Bahnhof?", "Wo ist der Bahnhof?", "Wann fährt der Zug?", "Ist der Bahnhof offen?"],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„¿Dónde está…?“ = Wo ist…? – „la estación“ = der Bahnhof/die Station." },
    { id: "as_un_a1b", block: "understanding", skill: "understanding", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Tengo hambre.",
      options: ["Ich habe Durst.", "Ich habe Hunger.", "Ich bin müde.", "Mir ist kalt."],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„tener hambre“ = Hunger haben. (Durst = tener sed)" },
    { id: "as_un_a1c", block: "understanding", skill: "understanding", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Soy de Alemania.",
      options: ["Ich wohne in Deutschland.", "Ich komme aus Deutschland.", "Ich fahre nach Deutschland.", "Ich mag Deutschland."],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„ser de …“ = von/aus … sein (Herkunft): soy de Alemania = ich komme aus Deutschland." },
    { id: "as_re_a1a", block: "reaction", skill: "reaction", level: "A1", type: "mc",
      promptDe: "Du möchtest im Café ein Wasser bestellen. Was sagst du?",
      options: ["¿Dónde está el agua?", "Un agua, por favor.", "El agua es buena.", "No hay agua."],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„Un agua, por favor“ = Ein Wasser, bitte – kurz und höflich." },
    { id: "as_re_a1b", block: "reaction", skill: "reaction", level: "A1", type: "mc",
      promptDe: "Du willst wissen, was etwas kostet. Was fragst du?",
      options: ["¿Qué hora es?", "¿Cuánto cuesta?", "¿Cómo estás?", "¿Dónde está?"],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„¿Cuánto cuesta?“ = Wie viel kostet es?" },
    { id: "as_vo_a1a", block: "vocab", skill: "vocab", level: "A1", type: "mc",
      promptDe: "Was bedeutet „la habitación“?",
      options: ["die Rechnung", "das Zimmer", "der Schlüssel", "das Frühstück"],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„la habitación“ = das Zimmer." },
    { id: "as_vo_a1b", block: "vocab", skill: "vocab", level: "A1", type: "mc",
      promptDe: "Ein Laden hat ein Schild „Cerrado“. Was heißt das?",
      options: ["geöffnet", "geschlossen", "Eingang", "Ausverkauf"],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„cerrado“ = geschlossen, „abierto“ = geöffnet." },
    { id: "as_cj_a1a", block: "conjugation", skill: "conjugation", level: "A1", type: "mc",
      promptDe: "Setze die richtige Form ein (Ich bin Student.):", questionEs: "Yo _____ estudiante.",
      options: ["soy", "eres", "es", "somos"],
      correctIndex: 0, expectedTimeSec: 10,
      explanationDe: "ser: yo soy, tú eres, él/ella es, nosotros somos. Beruf/Identität → ser." },
    { id: "as_cj_a1b", block: "conjugation", skill: "conjugation", level: "A1", type: "mc",
      promptDe: "Du willst sagen: „Ich brauche Hilfe.“ Welche Form passt?",
      options: ["Necesitas ayuda.", "Necesito ayuda.", "Necesitan ayuda.", "Necesitamos ayuda."],
      correctIndex: 1, expectedTimeSec: 10,
      explanationDe: "„necesito“ = ich brauche (yo-Form)." },
    { id: "as_ti_a1a", block: "tenses", skill: "tenses", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Estoy esperando el bus.",
      options: ["Ich habe den Bus genommen.", "Ich warte gerade auf den Bus.", "Ich werde den Bus nehmen.", "Ich brauche keinen Bus."],
      correctIndex: 1, expectedTimeSec: 10,
      explanationDe: "„estar + -ando/-iendo“ = Verlaufsform (gerade dabei)." },
    { id: "as_gr_a1a", block: "grammar", skill: "grammar", level: "A1", type: "mc",
      promptDe: "Welcher Artikel passt? (der Rucksack)", questionEs: "_____ mochila",
      options: ["el", "la", "los", "un"],
      correctIndex: 1, expectedTimeSec: 10,
      explanationDe: "„mochila“ ist weiblich → la mochila (auf -a, wie meist)." },

    // ===================== A2 – etwas mehr Substanz =====================
    { id: "as_un_a2a", block: "understanding", skill: "understanding", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Ayer fui al mercado.",
      options: ["Morgen gehe ich zum Markt.", "Ich gehe gerade zum Markt.", "Gestern bin ich zum Markt gegangen.", "Ich gehe oft zum Markt."],
      correctIndex: 2, expectedTimeSec: 10,
      explanationDe: "„ayer“ + „fui“ (Indefinido) = abgeschlossene Vergangenheit: gestern ging ich." },
    { id: "as_un_a2b", block: "understanding", skill: "understanding", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Hace tres días que estoy aquí.",
      options: ["In drei Tagen bin ich hier.", "Ich bin seit drei Tagen hier.", "Vor drei Tagen war ich hier.", "Ich bleibe drei Tage hier."],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "„Hace + Zeit + que + Präsens“ = seit … (etwas dauert an): seit drei Tagen." },
    { id: "as_re_a2a", block: "reaction", skill: "reaction", level: "A2", type: "mc",
      promptDe: "Du fragst eine fremde Person höflich nach dem Weg. Was passt?",
      options: ["¿Sabes dónde está el centro?", "¿Sabe usted dónde está el centro?", "¿Dónde está el centro tuyo?", "¿Yo sé el centro?"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "Fremde höflich → usted: „¿Sabe usted dónde está…?“" },
    { id: "as_re_a2b", block: "reaction", skill: "reaction", level: "A2", type: "mc",
      promptDe: "Im Zimmer gibt es kein warmes Wasser. Wie meldest du das an der Rezeption?",
      options: ["No hay agua caliente en mi habitación.", "Quiero agua caliente fría.", "El agua caliente es bueno.", "¿Hay agua caliente mañana?"],
      correctIndex: 0, expectedTimeSec: 12,
      explanationDe: "„No hay agua caliente“ = Es gibt kein warmes Wasser – klar das Problem benennen." },
    { id: "as_re_a2c", block: "reaction", skill: "reaction", level: "A2", type: "mc",
      promptDe: "Am Schalter willst du ein Busticket nach Cusco kaufen. Was passt?",
      options: ["¿Dónde está Cusco?", "Quiero un boleto a Cusco, por favor.", "Cusco es muy bonito.", "¿A qué hora es Cusco?"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "„Quiero un boleto a Cusco“ = Ich möchte ein Ticket nach Cusco (LatAm: boleto)." },
    { id: "as_vo_a2a", block: "vocab", skill: "vocab", level: "A2", type: "mc",
      promptDe: "Im Restaurant: Was ist „la cuenta“?",
      options: ["die Speisekarte", "die Rechnung", "das Trinkgeld", "der Kellner"],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„la cuenta“ = die Rechnung. (Speisekarte = la carta/el menú)" },
    { id: "as_vo_a2b", block: "vocab", skill: "vocab", level: "A2", type: "mc",
      promptDe: "Achtung „falscher Freund“: Was bedeutet „embarazada“?",
      options: ["peinlich berührt", "schwanger", "verlegen", "beschäftigt"],
      correctIndex: 1, expectedTimeSec: 11,
      explanationDe: "„embarazada“ = schwanger (NICHT „embarrassed“). Peinlich = avergonzado/a." },
    { id: "as_cj_a2a", block: "conjugation", skill: "conjugation", level: "A2", type: "mc",
      promptDe: "Setze die richtige Form ein:", questionEs: "Ayer _____ (yo, comer) en un restaurante peruano.",
      options: ["como", "comí", "comía", "comeré"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "„ayer“ → abgeschlossene Handlung (Indefinido): yo comí = ich aß." },
    { id: "as_ti_a2a", block: "tenses", skill: "tenses", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Voy a viajar a Bolivia el próximo mes.",
      options: ["Ich bin nach Bolivien gereist.", "Ich reise nächsten Monat nach Bolivien.", "Ich reise gerade nach Bolivien.", "Ich möchte nach Bolivien."],
      correctIndex: 1, expectedTimeSec: 11,
      explanationDe: "„ir a + Infinitiv“ = nahe Zukunft: voy a viajar = ich werde reisen." },
    { id: "as_gr_a2a", block: "grammar", skill: "grammar", level: "A2", type: "mc",
      promptDe: "ser oder estar? (Die Bank ist neben dem Platz.)", questionEs: "El banco _____ al lado de la plaza.",
      options: ["es", "está", "son", "ser"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "Ort/Lage → immer estar: „está al lado de la plaza“ = liegt neben dem Platz." },
    { id: "as_gr_a2b", block: "grammar", skill: "grammar", level: "A2", type: "mc",
      promptDe: "Welche Form passt? (Ich mag Arepas.)", questionEs: "A mí me _____ las arepas.",
      options: ["gusta", "gustan", "gusto", "gustas"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "Bei „gustar“ richtet sich das Verb nach dem Gefallenden: las arepas (Plural) → gustan." },
    { id: "as_rd_a2a", block: "reading", skill: "reading", level: "A2", type: "mc",
      promptDe: "Lies die Hostel-Notiz. Was sollst du tun?",
      questionEs: "El desayuno es de 7 a 9. Por favor, deja la llave en recepción antes de salir.",
      options: ["Vor der Abreise den Schlüssel an der Rezeption lassen.", "Das Frühstück um 10 Uhr abholen.", "Den Schlüssel mitnehmen.", "Die Rezeption nicht stören."],
      correctIndex: 0, expectedTimeSec: 14,
      explanationDe: "„deja la llave en recepción antes de salir“ = lass den Schlüssel vor dem Gehen an der Rezeption." },
    { id: "as_un_a2c", block: "understanding", skill: "understanding", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Me levanto temprano para tomar el primer bus.",
      options: ["Ich stehe früh auf, um den ersten Bus zu nehmen.", "Ich nehme spät den letzten Bus.", "Ich verpasse oft den ersten Bus.", "Ich warte früh auf den Bus."],
      correctIndex: 0, expectedTimeSec: 13,
      explanationDe: "Reflexiv „me levanto“ = ich stehe auf; „para + Infinitiv“ = um zu." },

    // ===================== B1 – sicher in Alltag & Reise =====================
    { id: "as_un_b1a", block: "understanding", skill: "understanding", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Estaba durmiendo cuando sonó el teléfono.",
      options: ["Ich werde schlafen, wenn das Telefon klingelt.", "Ich schlief gerade, als das Telefon klingelte.", "Ich schlafe, sobald das Telefon klingelt.", "Ich konnte nicht schlafen wegen des Telefons."],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "Imperfecto im Verlauf („estaba durmiendo“) + Indefinido („sonó“) = lief gerade, als etwas geschah." },
    { id: "as_un_b1b", block: "understanding", skill: "understanding", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "He estado en México, pero nunca he ido a Oaxaca.",
      options: ["Ich war in Mexiko und auch in Oaxaca.", "Ich bin in Mexiko gewesen, aber nie in Oaxaca.", "Ich gehe nach Mexiko und Oaxaca.", "Ich wollte nach Oaxaca, war aber in Mexiko."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "Pretérito perfecto („he estado / he ido“) = Lebenserfahrung bis jetzt; „nunca“ = nie." },
    { id: "as_gr_b1a", block: "grammar", skill: "grammar", level: "B1", type: "mc",
      promptDe: "Setze die richtige Form ein:", questionEs: "Espero que _____ (tú, tener) un buen viaje.",
      options: ["tienes", "tengas", "tendrás", "tener"],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "Wunsch/„espero que“ verlangt den Subjuntivo: tengas (nicht tienes)." },
    { id: "as_gr_b1b", block: "grammar", skill: "grammar", level: "B1", type: "mc",
      promptDe: "por oder para? (Dieses Geschenk ist für dich.)", questionEs: "Este regalo es _____ ti.",
      options: ["por", "para", "por que", "de"],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "Empfänger/Ziel → para: „es para ti“ = ist für dich." },
    { id: "as_gr_b1c", block: "grammar", skill: "grammar", level: "B1", type: "mc",
      promptDe: "Ersetze die Objekte (Antwort auf „¿Le diste el dinero a Juan?“):", questionEs: "Sí, _____ di.",
      options: ["le lo", "se lo", "lo le", "se le"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "Vor lo/la/los/las wird „le“ zu „se“: se lo di = ich gab es ihm." },
    { id: "as_cj_b1a", block: "conjugation", skill: "conjugation", level: "B1", type: "mc",
      promptDe: "Höflicher Befehl (usted): „Bringen Sie mir bitte die Rechnung.“",
      options: ["Tráeme la cuenta, por favor.", "Tráigame la cuenta, por favor.", "Me traes la cuenta, por favor.", "Traer la cuenta, por favor."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "Imperativ usted von traer + me: „tráigame“ (höflich, an Servicepersonal)." },
    { id: "as_ti_b1a", block: "tenses", skill: "tenses", level: "B1", type: "mc",
      promptDe: "Welche Form ist höflicher („Könnten Sie mir helfen?“)?",
      options: ["¿Puede ayudarme?", "¿Podría ayudarme?", "¿Puedes ayudarme?", "¡Ayúdeme!"],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "Konditional „podría“ = könnten Sie – besonders höfliche Bitte (höflicher als das Präsens „¿Puede?“/„¿Puedes?“ oder der Imperativ „¡Ayúdeme!“)." },
    { id: "as_ti_b1b", block: "tenses", skill: "tenses", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "El año que viene iré a Patagonia.",
      options: ["Letztes Jahr war ich in Patagonien.", "Nächstes Jahr werde ich nach Patagonien gehen.", "Ich gehe gerade nach Patagonien.", "Ich wollte nach Patagonien."],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "Futuro simple „iré“ = ich werde gehen; „el año que viene“ = nächstes Jahr." },
    { id: "as_vo_b1a", block: "vocab", skill: "vocab", level: "B1", type: "mc",
      promptDe: "Was bedeutet die Redewendung „echar de menos“?",
      options: ["weniger essen", "vermissen", "etwas wegwerfen", "sich verlaufen"],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "„echar de menos (a alguien)“ = jemanden vermissen." },
    { id: "as_vo_b1b", block: "vocab", skill: "vocab", level: "B1", type: "mc",
      promptDe: "Welches Wort verbindet einen Gegensatz („…, jedoch …“)?",
      options: ["además", "sin embargo", "por eso", "entonces"],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "„sin embargo“ = jedoch/dennoch (Gegensatz). además = außerdem, por eso = deshalb." },
    { id: "as_un_b1c", block: "understanding", skill: "understanding", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Llevo dos semanas viajando por Colombia.",
      options: ["Ich werde zwei Wochen durch Kolumbien reisen.", "Ich reise seit zwei Wochen durch Kolumbien.", "Vor zwei Wochen reiste ich durch Kolumbien.", "Ich brauche zwei Wochen für Kolumbien."],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "„llevar + Zeit + Gerundio“ = seit … (etwas läuft seit): seit zwei Wochen am Reisen." },
    { id: "as_re_b1a", block: "reaction", skill: "reaction", level: "B1", type: "mc",
      promptDe: "Du möchtest höflich um einen Rabatt bitten, ohne zu fordern. Was passt am besten?",
      options: ["¡Baje el precio!", "¿Me podría hacer un descuento?", "Quiero descuento ahora.", "El precio es caro."],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "„¿Me podría hacer un descuento?“ = Könnten Sie mir einen Rabatt geben? – höflich & wirksam." },
    { id: "as_rd_b1a", block: "reading", skill: "reading", level: "B1", type: "mc",
      promptDe: "Lies und beantworte: Warum verschiebt sich die Tour?",
      questionEs: "La excursión al volcán se pospone hasta mañana porque el clima no es seguro hoy.",
      options: ["Weil zu wenige Leute mitkommen.", "Weil das Wetter heute nicht sicher ist.", "Weil der Guide krank ist.", "Weil der Vulkan geschlossen ist."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "„se pospone … porque el clima no es seguro“ = wird verschoben, weil das Wetter unsicher ist." },
    { id: "as_gr_b1d", block: "grammar", skill: "grammar", level: "B1", type: "mc",
      promptDe: "Vergleich (größer als):", questionEs: "Bogotá es _____ grande _____ Medellín.",
      options: ["tan … como", "más … que", "menos … de", "muy … que"],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "Steigerung „größer als“ = „más grande que“." },

    // ===================== B2 – nuanciert & sicher =====================
    { id: "as_gr_b2a", block: "grammar", skill: "grammar", level: "B2", type: "mc",
      promptDe: "Setze die richtige Form ein:", questionEs: "Si _____ (tener) más tiempo, viajaría por toda Sudamérica.",
      options: ["tengo", "tendría", "tuviera", "tenga"],
      correctIndex: 2, expectedTimeSec: 16,
      explanationDe: "Irreale Bedingung: „si“ + Subjuntivo imperfecto (tuviera) + Konditional (viajaría)." },
    { id: "as_gr_b2b", block: "grammar", skill: "grammar", level: "B2", type: "mc",
      promptDe: "Setze die richtige Form ein (Zukunftsbezug):", questionEs: "Te llamo cuando _____ (llegar) al hotel.",
      options: ["llego", "llegué", "llegaré", "llegue"],
      correctIndex: 3, expectedTimeSec: 16,
      explanationDe: "„cuando“ mit Zukunftsbezug verlangt Subjuntivo: cuando llegue = wenn ich ankomme." },
    { id: "as_gr_b2c", block: "grammar", skill: "grammar", level: "B2", type: "mc",
      promptDe: "Setze die richtige Form ein (Tatsache):", questionEs: "Aunque _____ (estar) cansado, salí a explorar la ciudad.",
      options: ["esté", "estaba", "estuviera", "estaré"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "„aunque“ + Indikativ, wenn es eine eingeräumte Tatsache ist: „aunque estaba cansado“ = obwohl ich müde war." },
    { id: "as_cj_b2a", block: "conjugation", skill: "conjugation", level: "B2", type: "mc",
      promptDe: "Setze die richtige Form ein (er/sie):", questionEs: "No creo que _____ (haber) llegado todavía.",
      options: ["ha", "haya", "había", "habrá"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "„No creo que“ + Subjuntivo perfecto: „haya llegado“ = (dass) er/sie angekommen sei." },
    { id: "as_ti_b2a", block: "tenses", skill: "tenses", level: "B2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Yo que tú, habría reservado con más antelación.",
      options: ["An deiner Stelle hätte ich früher reserviert.", "Ich werde früher reservieren.", "Du solltest jetzt reservieren.", "Ich reserviere immer früh."],
      correctIndex: 0, expectedTimeSec: 16,
      explanationDe: "Konditional Perfekt „habría reservado“ = hätte reserviert; „yo que tú“ = an deiner Stelle." },
    { id: "as_un_b2a", block: "understanding", skill: "understanding", level: "B2", type: "mc",
      promptDe: "Was bedeutet umgangssprachlich „Se me hizo tarde“?",
      options: ["Ich habe es spät gemacht.", "Es ist mir (unbeabsichtigt) spät geworden.", "Ich mache es später.", "Es ist zu spät für mich."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "„se me hizo tarde“ = es ist mir spät geworden (unabsichtlich, häufig in LatAm)." },
    { id: "as_un_b2b", block: "understanding", skill: "understanding", level: "B2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "De haberlo sabido, no habría venido.",
      options: ["Wenn ich es weiß, komme ich nicht.", "Hätte ich es gewusst, wäre ich nicht gekommen.", "Ich wusste, dass ich kommen würde.", "Ich komme, um es zu wissen."],
      correctIndex: 1, expectedTimeSec: 17,
      explanationDe: "„De + Infinitiv compuesto“ als irreale Bedingung: de haberlo sabido = hätte ich es gewusst …" },
    { id: "as_gr_b2d", block: "grammar", skill: "grammar", level: "B2", type: "mc",
      promptDe: "Unpersönlich/Passiv mit „se“: Wie sagt man „Hier spricht man Englisch“?",
      options: ["Aquí habla inglés.", "Aquí se habla inglés.", "Aquí es hablado inglés.", "Aquí hablan a inglés."],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "„se + 3. Person“ ist die übliche unpersönliche Form: se habla inglés." },
    { id: "as_vo_b2a", block: "vocab", skill: "vocab", level: "B2", type: "mc",
      promptDe: "Welches Wort drückt eine logische Folge aus („…, daher …“)?",
      options: ["no obstante", "por lo tanto", "a pesar de", "en cambio"],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "„por lo tanto“ = daher/folglich. no obstante = dennoch, en cambio = dagegen." },
    { id: "as_vo_b2b", block: "vocab", skill: "vocab", level: "B2", type: "mc",
      promptDe: "Was bedeutet „estar al tanto (de algo)“?",
      options: ["pünktlich sein", "über etwas Bescheid wissen", "etwas bezahlen", "in der Nähe sein"],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "„estar al tanto de algo“ = über etwas auf dem Laufenden / informiert sein." },
    { id: "as_re_b2a", block: "reaction", skill: "reaction", level: "B2", type: "mc",
      promptDe: "Du willst höflich widersprechen, ohne unhöflich zu wirken. Was passt am besten?",
      options: ["¡Estás equivocado!", "Entiendo tu punto, pero no estoy del todo de acuerdo.", "No, eso no es así.", "Tienes razón en nada."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "„Entiendo tu punto, pero no estoy del todo de acuerdo“ = diplomatischer, abgewogener Widerspruch." },
    { id: "as_rd_b2a", block: "reading", skill: "reading", level: "B2", type: "mc",
      promptDe: "Lies. Welche Haltung hat der Sprecher zum Bus?",
      questionEs: "El viaje en bus fue larguísimo, aunque, para ser honesto, los paisajes valieron cada hora.",
      options: ["Er bereut die Fahrt völlig.", "Trotz der Länge fand er sie wegen der Landschaft lohnend.", "Ihm war die Landschaft egal.", "Die Fahrt war kurz und angenehm."],
      correctIndex: 1, expectedTimeSec: 17,
      explanationDe: "„aunque … valieron cada hora“ = obwohl lang, war es die Landschaft wert – abwägende Haltung." },
    { id: "as_rd_b2b", block: "reading", skill: "reading", level: "B2", type: "mc",
      promptDe: "Lies. Was wird empfohlen?",
      questionEs: "Conviene llevar efectivo en pueblos pequeños, ya que no siempre aceptan tarjeta.",
      options: ["In kleinen Dörfern besser Bargeld dabei haben.", "Immer mit Karte zahlen.", "In Dörfern gibt es keine Geschäfte.", "Karten werden überall akzeptiert."],
      correctIndex: 0, expectedTimeSec: 16,
      explanationDe: "„Conviene llevar efectivo … ya que no siempre aceptan tarjeta“ = besser Bargeld, da Karte nicht immer geht." },

    // ===================== C1 – feine Nuancen =====================
    { id: "as_gr_c1a", block: "grammar", skill: "grammar", level: "C1", type: "mc",
      promptDe: "Setze die richtige Form ein:", questionEs: "Si _____ (saber) la verdad antes, habría actuado distinto.",
      options: ["sabía", "supiera", "hubiera sabido", "sé"],
      correctIndex: 2, expectedTimeSec: 18,
      explanationDe: "Irreale Vergangenheit: „si“ + Pluscuamperfecto de subjuntivo (hubiera sabido) + Konditional Perfekt." },
    { id: "as_gr_c1b", block: "grammar", skill: "grammar", level: "C1", type: "mc",
      promptDe: "Setze die richtige Form ein (als ob er alles wüsste):", questionEs: "Habla como si lo _____ (saber) todo.",
      options: ["sabe", "sepa", "supiera", "sabría"],
      correctIndex: 2, expectedTimeSec: 17,
      explanationDe: "„como si“ verlangt immer Subjuntivo imperfecto: como si lo supiera = als ob er es wüsste." },
    { id: "as_gr_c1c", block: "grammar", skill: "grammar", level: "C1", type: "mc",
      promptDe: "Setze die richtige Form ein:", questionEs: "No hay nadie que _____ (poder) ayudarte con eso aquí.",
      options: ["puede", "pueda", "podría", "podía"],
      correctIndex: 1, expectedTimeSec: 17,
      explanationDe: "Verneinter/unbestimmter Bezug („no hay nadie que“) verlangt Subjuntivo: pueda." },
    { id: "as_un_c1a", block: "understanding", skill: "understanding", level: "C1", type: "mc",
      promptDe: "Was bedeutet die Redewendung „no tener pelos en la lengua“?",
      options: ["sehr schweigsam sein", "kein Blatt vor den Mund nehmen", "schlecht sprechen", "die Sprache verlernen"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "„no tener pelos en la lengua“ = unverblümt/offen heraus reden, kein Blatt vor den Mund nehmen." },
    { id: "as_un_c1b", block: "understanding", skill: "understanding", level: "C1", type: "mc",
      promptDe: "Was bedeutet „dar algo por sentado“?",
      options: ["etwas verschenken", "etwas als selbstverständlich voraussetzen", "sich hinsetzen", "etwas bedauern"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "„dar por sentado“ = als selbstverständlich/gegeben annehmen." },
    { id: "as_vo_c1a", block: "vocab", skill: "vocab", level: "C1", type: "mc",
      promptDe: "Welche Kollokation ist idiomatisch korrekt: „eine Entscheidung treffen“?",
      options: ["hacer una decisión", "tomar una decisión", "dar una decisión", "poner una decisión"],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "Im Spanischen „tomar una decisión“ (nicht *hacer una decisión)." },
    { id: "as_vo_c1b", block: "vocab", skill: "vocab", level: "C1", type: "mc",
      promptDe: "Was bedeutet „a regañadientes“?",
      options: ["sehr gern", "widerwillig / zähneknirschend", "heimlich", "vergeblich"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "„a regañadientes“ = widerwillig, zähneknirschend." },
    { id: "as_rd_c1a", block: "reading", skill: "reading", level: "C1", type: "mc",
      promptDe: "Lies. Was deutet der Sprecher an?",
      questionEs: "No es que la ciudad no me gustara; simplemente, esperaba algo distinto.",
      options: ["Die Stadt hat ihm überhaupt nicht gefallen.", "Die Stadt war okay, entsprach aber nicht seinen Erwartungen.", "Er hat die Stadt nie besucht.", "Die Stadt hat all seine Erwartungen übertroffen."],
      correctIndex: 1, expectedTimeSec: 18,
      explanationDe: "„No es que … no me gustara; esperaba algo distinto“ = es lag nicht an Abneigung, sondern an anderen Erwartungen." },

    // ===================== Hörverstehen (nur „Extremo“; TTS spricht audioEs) =====================
    // type "listen": der spanische Satz (audioEs) wird vorgelesen, NICHT angezeigt.
    // Im Rückblick wird audioEs sichtbar gemacht. Bewertung = wie MC (selectedIndex).
    // Optionen auf Spanisch (Audio verstehen + spanische Antwort lesen). Die
    // promptDe-Frage bleibt deutsch (Bediensprache); audioEs wird nur gesprochen.
    { id: "as_li_a2a", block: "listening", skill: "listening", level: "A2", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Wo ist die Toilette?", audioEs: "El baño está al fondo, a la derecha.",
      options: ["A la izquierda, junto a la entrada.", "En el segundo piso.", "Al fondo, a la derecha.", "Al lado de la recepción."],
      correctIndex: 2, expectedTimeSec: 15,
      explanationDe: "„al fondo, a la derecha“ = hinten, rechts." },
    { id: "as_li_a2b", block: "listening", skill: "listening", level: "A2", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was sagt die Person?", audioEs: "Lo siento, la cocina ya está cerrada.",
      options: ["La comida está casi lista.", "La cocina ya no está abierta.", "La cocina sigue abierta.", "Hoy no hay menú."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "„la cocina ya está cerrada“ = die Küche ist schon geschlossen (ya no está abierta)." },
    { id: "as_li_a2c", block: "listening", skill: "listening", level: "A2", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Wann und von wo fährt der Bus?", audioEs: "El bus sale en diez minutos del andén tres.",
      options: ["A las diez, del andén tres.", "En tres minutos, del andén diez.", "En una hora, del andén tres.", "En diez minutos, del andén tres."],
      correctIndex: 3, expectedTimeSec: 16,
      explanationDe: "„en diez minutos del andén tres“ = in 10 Minuten von Bahnsteig 3." },
    { id: "as_li_b1a", block: "listening", skill: "listening", level: "B1", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was bietet die Person an?", audioEs: "Si quieres, te puedo recomendar un restaurante típico cerca de aquí.",
      options: ["Invitarte a comer.", "Recomendarte un restaurante típico cerca.", "Acompañarte al mercado.", "Reservarte un hotel."],
      correctIndex: 1, expectedTimeSec: 17,
      explanationDe: "„te puedo recomendar un restaurante típico cerca“ = ich kann dir ein typisches Restaurant in der Nähe empfehlen." },
    { id: "as_li_b1b", block: "listening", skill: "listening", level: "B1", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was teilt die Person mit?", audioEs: "Disculpe, este asiento está ocupado, mi amigo ya viene.",
      options: ["El asiento está ocupado.", "El asiento está libre.", "Está buscando a su amigo.", "Se baja en la próxima parada."],
      correctIndex: 0, expectedTimeSec: 17,
      explanationDe: "„este asiento está ocupado“ = dieser Platz ist besetzt." },
    { id: "as_li_b1c", block: "listening", skill: "listening", level: "B1", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was ist im Tourpreis enthalten?", audioEs: "El tour dura unas cuatro horas e incluye el almuerzo.",
      options: ["El desayuno.", "La entrada al museo.", "El almuerzo.", "El transporte al hotel."],
      correctIndex: 2, expectedTimeSec: 17,
      explanationDe: "„incluye el almuerzo“ = das Mittagessen ist inbegriffen (dura cuatro horas = dauert vier Stunden)." },
    { id: "as_li_b2a", block: "listening", skill: "listening", level: "B2", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was drückt die Person aus?", audioEs: "Te lo habría dicho antes, pero no quería preocuparte.",
      options: ["Te lo dirá más tarde.", "No te lo dijo para no preocuparte.", "Está muy preocupada por ti.", "Olvidó contártelo."],
      correctIndex: 1, expectedTimeSec: 18,
      explanationDe: "„te lo habría dicho … pero no quería preocuparte“ = sie hat es nicht gesagt, um dich nicht zu beunruhigen." },
    { id: "as_li_b2b", block: "listening", skill: "listening", level: "B2", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was ist passiert?", audioEs: "Por más que lo intenté, no logré cambiar el vuelo.",
      options: ["No consiguió cambiar el vuelo, aunque lo intentó.", "Cambió el vuelo sin problemas.", "No quiere cambiar el vuelo.", "Le cancelaron el vuelo."],
      correctIndex: 0, expectedTimeSec: 18,
      explanationDe: "„Por más que lo intenté, no logré …“ = so sehr ich es auch versuchte, ich schaffte es nicht …" },
    { id: "as_li_c1a", block: "listening", skill: "listening", level: "C1", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was sagt die Person?", audioEs: "De haber sabido que el camino estaba cerrado, habríamos salido más temprano.",
      options: ["Sabían que el camino estaba cerrado.", "Salieron temprano a propósito.", "Si hubieran sabido lo del camino, habrían salido antes.", "El camino ya está abierto otra vez."],
      correctIndex: 2, expectedTimeSec: 19,
      explanationDe: "„De haber sabido …, habríamos salido“ = irreale Vergangenheit: hätten sie gewusst …, wären sie gefahren." },
    { id: "as_li_c1b", block: "listening", skill: "listening", level: "C1", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Welche Haltung hat die Person?", audioEs: "No es que no me guste la idea, sino que me parece poco realista.",
      options: ["No le gusta nada la idea.", "Le gusta la idea, pero la ve poco realista.", "Le parece totalmente realista.", "No tiene una opinión clara."],
      correctIndex: 1, expectedTimeSec: 19,
      explanationDe: "„No es que no me guste …, sino que …“ = es ist nicht so, dass es ihr nicht gefällt, sondern dass sie es für unrealistisch hält." },

    // ===================== Freie Antworten (kurz schreiben) =====================
    { id: "as_fr_a1", block: "free", skill: "free", level: "A1", type: "free",
      promptDe: "Schreib auf Spanisch: Ich möchte einen Kaffee.",
      accept: ["quiero un cafe", "quiero un cafe por favor", "un cafe por favor", "me gustaria un cafe", "quisiera un cafe"],
      solutionEs: "Quiero un café.", expectedTimeSec: 14,
      explanationDe: "„Quiero un café.“ = Ich möchte einen Kaffee. (Akzente/Satzzeichen egal)" },
    { id: "as_fr_a2", block: "free", skill: "free", level: "A2", type: "free",
      promptDe: "Schreib die Frage auf Spanisch: Wie viel kostet das?",
      accept: ["cuanto cuesta", "cuanto cuesta esto", "cuanto cuesta eso", "cuanto vale", "cuanto vale esto", "cuanto sale", "que precio tiene"],
      solutionEs: "¿Cuánto cuesta?", expectedTimeSec: 14,
      explanationDe: "„¿Cuánto cuesta?“ ist die Standardfrage nach dem Preis." },
    { id: "as_fr_a1b", block: "free", skill: "free", level: "A1", type: "free",
      promptDe: "Stell dich auf Spanisch vor: „Ich heiße …“ (mit irgendeinem Namen).",
      accept: ["me llamo", "mi nombre es", "yo me llamo"], matchMode: "prefix",
      solutionEs: "Me llamo …", expectedTimeSec: 12,
      explanationDe: "„Me llamo …“ = Ich heiße … – nach dem Anfang darf ein beliebiger Name folgen." },
    { id: "as_fr_b1", block: "free", skill: "free", level: "B1", type: "free",
      promptDe: "Schreib höflich auf Spanisch: Könnten Sie mir helfen, bitte?",
      accept: ["podria ayudarme", "podria ayudarme por favor", "me podria ayudar", "me podria ayudar por favor", "puede ayudarme por favor", "podria usted ayudarme"],
      solutionEs: "¿Podría ayudarme, por favor?", expectedTimeSec: 18,
      explanationDe: "Konditional „podría“ macht die Bitte höflich: ¿Podría ayudarme, por favor?" },
    { id: "as_fr_b1b", block: "free", skill: "free", level: "B1", type: "free",
      promptDe: "Schreib auf Spanisch: Ich bin gestern Abend angekommen.",
      accept: ["llegue ayer por la noche", "llegue anoche", "yo llegue ayer por la noche", "llegue ayer en la noche", "llegue ayer por la tarde noche"],
      solutionEs: "Llegué ayer por la noche.", expectedTimeSec: 18,
      explanationDe: "Indefinido „llegué“ (ich kam an) + „ayer por la noche / anoche“ = gestern Abend/Nacht." },
    { id: "as_fr_b2", block: "free", skill: "free", level: "B2", type: "free",
      promptDe: "Schreib auf Spanisch: Wenn ich Zeit hätte, würde ich mehr reisen.",
      accept: ["si tuviera tiempo viajaria mas", "si tuviera mas tiempo viajaria mas", "si yo tuviera tiempo viajaria mas", "si tuviera tiempo viajaria mas seguido"],
      solutionEs: "Si tuviera tiempo, viajaría más.", expectedTimeSec: 22,
      explanationDe: "Irreale Bedingung: „si“ + Subjuntivo imperfecto (tuviera) + Konditional (viajaría)." },

    // Nur „Extremo“: zwei zusätzliche, anspruchsvollere Produktionsaufgaben.
    { id: "as_fr_b1c", block: "free", skill: "free", level: "B1", type: "free", variant: "extremo",
      promptDe: "Schreib höflich auf Spanisch: Ich hätte gern die Rechnung, bitte.",
      accept: ["la cuenta por favor", "me gustaria la cuenta por favor", "quisiera la cuenta por favor", "me trae la cuenta por favor", "me podria traer la cuenta por favor"],
      solutionEs: "Quisiera la cuenta, por favor.", expectedTimeSec: 18,
      explanationDe: "„Quisiera/Me gustaría la cuenta, por favor“ – höflich um die Rechnung bitten." },
    { id: "as_fr_b2b", block: "free", skill: "free", level: "B2", type: "free", variant: "extremo",
      promptDe: "Schreib auf Spanisch: Wenn ich Geld hätte, würde ich ein Haus kaufen.",
      accept: ["si tuviera dinero compraria una casa", "si yo tuviera dinero compraria una casa", "si tuviera dinero me compraria una casa", "si tuviera mas dinero compraria una casa"],
      solutionEs: "Si tuviera dinero, compraría una casa.", expectedTimeSec: 22,
      explanationDe: "Irreale Bedingung: „si“ + Subjuntivo imperfecto (tuviera) + Konditional (compraría)." },
  ];

  // ===== ENGLISCHER Fragenkatalog (Track de-en: UI Deutsch, gelernt Englisch) =====
  // 1:1 struktureller Spiegel von QUESTIONS_ES: gleiche id/block/skill/level/type/
  // variant/expectedTimeSec und (bei mc/listen) dieselbe correctIndex-Position.
  // Nur der INHALT prüft die äquivalente ENGLISCHE Kompetenz auf gleichem CEFR-Niveau.
  // Feldnamen bleiben identisch (questionEs = engl. Satz, audioEs = engl. Hörsatz,
  // solutionEs = engl. Lösung), damit Renderer/Sprachausgabe unverändert lesen.
  var QUESTIONS_EN = [
    // ===================== A0 – allererste Schritte =====================
    { id: "as_un_a0a", block: "understanding", skill: "understanding", level: "A0", type: "mc",
      promptDe: "Was bedeutet „Good morning“?",
      options: ["Guten Morgen", "Gute Nacht", "Auf Wiedersehen", "Bis bald"],
      correctIndex: 0, expectedTimeSec: 6,
      explanationDe: "„Good morning“ = Guten Morgen (vormittags)." },
    { id: "as_un_a0b", block: "understanding", skill: "understanding", level: "A0", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "No, thanks.",
      options: ["Ja, bitte.", "Nein, danke.", "Bitte schön.", "Bis später."],
      correctIndex: 1, expectedTimeSec: 6,
      explanationDe: "„No, thanks.“ = Nein, danke." },
    { id: "as_vo_a0a", block: "vocab", skill: "vocab", level: "A0", type: "mc",
      promptDe: "Was bedeutet „water“?",
      options: ["das Brot", "das Wasser", "der Kaffee", "die Milch"],
      correctIndex: 1, expectedTimeSec: 6,
      explanationDe: "„water“ = das Wasser." },
    { id: "as_vo_a0b", block: "vocab", skill: "vocab", level: "A0", type: "mc",
      promptDe: "Welche Zahl ist „three“?",
      options: ["zwei", "drei", "vier", "fünf"],
      correctIndex: 1, expectedTimeSec: 6,
      explanationDe: "one (1), two (2), three (3), four (4), five (5)." },
    { id: "as_re_a0a", block: "reaction", skill: "reaction", level: "A0", type: "mc",
      promptDe: "Du gehst abends ins Hostel und grüßt. Was passt?",
      options: ["Good morning.", "Good evening.", "You're welcome.", "See you tomorrow."],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„Good evening“ = Guten Abend." },
    { id: "as_un_a0c", block: "understanding", skill: "understanding", level: "A0", type: "mc",
      promptDe: "Was bedeutet „My name is Ana“?",
      options: ["Ich heiße Ana.", "Ich rufe Ana.", "Das ist Ana.", "Ana ist da."],
      correctIndex: 0, expectedTimeSec: 8,
      explanationDe: "„My name is …“ = Ich heiße …" },

    // ===================== A1 – einfache Alltagssätze =====================
    { id: "as_un_a1a", block: "understanding", skill: "understanding", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Where is the station?",
      options: ["Wie viel kostet der Bahnhof?", "Wo ist der Bahnhof?", "Wann fährt der Zug?", "Ist der Bahnhof offen?"],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„Where is …?“ = Wo ist …? – „the station“ = der Bahnhof/die Station." },
    { id: "as_un_a1b", block: "understanding", skill: "understanding", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "I'm hungry.",
      options: ["Ich habe Durst.", "Ich habe Hunger.", "Ich bin müde.", "Mir ist kalt."],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„I'm hungry“ = Ich habe Hunger. (Durst = I'm thirsty)" },
    { id: "as_un_a1c", block: "understanding", skill: "understanding", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "I'm from Germany.",
      options: ["Ich wohne in Deutschland.", "Ich komme aus Deutschland.", "Ich fahre nach Deutschland.", "Ich mag Deutschland."],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„to be from …“ = aus … kommen (Herkunft): I'm from Germany = ich komme aus Deutschland." },
    { id: "as_re_a1a", block: "reaction", skill: "reaction", level: "A1", type: "mc",
      promptDe: "Du möchtest im Lokal ein Wasser bestellen. Was sagst du?",
      options: ["Where is the water?", "A water, please.", "The water is good.", "There is no water."],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„A water, please.“ = Ein Wasser, bitte – kurz und höflich." },
    { id: "as_re_a1b", block: "reaction", skill: "reaction", level: "A1", type: "mc",
      promptDe: "Du willst wissen, was etwas kostet. Was fragst du?",
      options: ["What time is it?", "How much is it?", "How are you?", "Where is it?"],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„How much is it?“ = Wie viel kostet es?" },
    { id: "as_vo_a1a", block: "vocab", skill: "vocab", level: "A1", type: "mc",
      promptDe: "Was bedeutet „the room“?",
      options: ["die Rechnung", "das Zimmer", "der Schlüssel", "das Frühstück"],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„the room“ = das Zimmer." },
    { id: "as_vo_a1b", block: "vocab", skill: "vocab", level: "A1", type: "mc",
      promptDe: "Ein Laden hat ein Schild „Closed“. Was heißt das?",
      options: ["geöffnet", "geschlossen", "Eingang", "Ausverkauf"],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„closed“ = geschlossen, „open“ = geöffnet." },
    { id: "as_cj_a1a", block: "conjugation", skill: "conjugation", level: "A1", type: "mc",
      promptDe: "Setze die richtige Form ein (Ich bin Student.):", questionEs: "I _____ a student.",
      options: ["am", "are", "is", "be"],
      correctIndex: 0, expectedTimeSec: 10,
      explanationDe: "to be: I am, you are, he/she is. Beruf/Identität → am." },
    { id: "as_cj_a1b", block: "conjugation", skill: "conjugation", level: "A1", type: "mc",
      promptDe: "Du willst sagen: „Ich brauche Hilfe.“ Welche Form passt?",
      options: ["You need help.", "I need help.", "They need help.", "We need help."],
      correctIndex: 1, expectedTimeSec: 10,
      explanationDe: "„I need“ = ich brauche (I-Form)." },
    { id: "as_ti_a1a", block: "tenses", skill: "tenses", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "I'm waiting for the bus.",
      options: ["Ich habe den Bus genommen.", "Ich warte gerade auf den Bus.", "Ich werde den Bus nehmen.", "Ich brauche keinen Bus."],
      correctIndex: 1, expectedTimeSec: 10,
      explanationDe: "„to be + -ing“ = Verlaufsform / present continuous (gerade dabei)." },
    { id: "as_gr_a1a", block: "grammar", skill: "grammar", level: "A1", type: "mc",
      promptDe: "Welcher Artikel passt? (ein Apfel)", questionEs: "I'd like _____ apple.",
      options: ["a", "an", "the", "some"],
      correctIndex: 1, expectedTimeSec: 10,
      explanationDe: "Vor einem Vokal-Laut steht „an“: an apple (nicht „a apple“)." },

    // ===================== A2 – etwas mehr Substanz =====================
    { id: "as_un_a2a", block: "understanding", skill: "understanding", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Yesterday I went to the market.",
      options: ["Morgen gehe ich zum Markt.", "Ich gehe gerade zum Markt.", "Gestern bin ich zum Markt gegangen.", "Ich gehe oft zum Markt."],
      correctIndex: 2, expectedTimeSec: 10,
      explanationDe: "„yesterday“ + „went“ (past simple) = abgeschlossene Vergangenheit: gestern ging ich." },
    { id: "as_un_a2b", block: "understanding", skill: "understanding", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "I've been here for three days.",
      options: ["In drei Tagen bin ich hier.", "Ich bin seit drei Tagen hier.", "Vor drei Tagen war ich hier.", "Ich bleibe drei Tage hier."],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "„have been … for + Zeit“ = seit … (etwas dauert an): seit drei Tagen." },
    { id: "as_re_a2a", block: "reaction", skill: "reaction", level: "A2", type: "mc",
      promptDe: "Du fragst eine fremde Person höflich nach dem Weg. Was passt?",
      options: ["Where the centre?", "Could you tell me where the centre is?", "You know where centre?", "Do I know the centre?"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "Höflich fragen → „Could you tell me where …?“" },
    { id: "as_re_a2b", block: "reaction", skill: "reaction", level: "A2", type: "mc",
      promptDe: "Im Zimmer gibt es kein warmes Wasser. Wie meldest du das an der Rezeption?",
      options: ["There's no hot water in my room.", "I want hot cold water.", "The hot water is good.", "Is there hot water tomorrow?"],
      correctIndex: 0, expectedTimeSec: 12,
      explanationDe: "„There's no hot water“ = Es gibt kein warmes Wasser – klar das Problem benennen." },
    { id: "as_re_a2c", block: "reaction", skill: "reaction", level: "A2", type: "mc",
      promptDe: "Am Schalter willst du ein Busticket nach Cusco kaufen. Was passt?",
      options: ["Where is Cusco?", "I'd like a ticket to Cusco, please.", "Cusco is very beautiful.", "What time is Cusco?"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "„I'd like a ticket to Cusco“ = Ich möchte ein Ticket nach Cusco." },
    { id: "as_vo_a2a", block: "vocab", skill: "vocab", level: "A2", type: "mc",
      promptDe: "Im Restaurant: Was ist „the bill“?",
      options: ["die Speisekarte", "die Rechnung", "das Trinkgeld", "der Kellner"],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„the bill“ (AmE „the check“) = die Rechnung. (Speisekarte = the menu)" },
    { id: "as_vo_a2b", block: "vocab", skill: "vocab", level: "A2", type: "mc",
      promptDe: "Achtung „falscher Freund“: Was bedeutet „to become“?",
      options: ["bekommen", "werden", "begegnen", "beschäftigen"],
      correctIndex: 1, expectedTimeSec: 11,
      explanationDe: "„to become“ = werden (NICHT „bekommen“). bekommen = to get/receive." },
    { id: "as_cj_a2a", block: "conjugation", skill: "conjugation", level: "A2", type: "mc",
      promptDe: "Setze die richtige Form ein:", questionEs: "Yesterday I _____ (eat) at a Peruvian restaurant.",
      options: ["eat", "ate", "eaten", "will eat"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "„yesterday“ → abgeschlossene Handlung (past simple): I ate = ich aß." },
    { id: "as_ti_a2a", block: "tenses", skill: "tenses", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "I'm going to travel to Bolivia next month.",
      options: ["Ich bin nach Bolivien gereist.", "Ich reise nächsten Monat nach Bolivien.", "Ich reise gerade nach Bolivien.", "Ich möchte nach Bolivien."],
      correctIndex: 1, expectedTimeSec: 11,
      explanationDe: "„going to + Infinitiv“ = nahe Zukunft: I'm going to travel = ich werde reisen." },
    { id: "as_gr_a2a", block: "grammar", skill: "grammar", level: "A2", type: "mc",
      promptDe: "Present simple oder continuous? (Die Bank ist neben dem Platz.)", questionEs: "The bank _____ next to the square.",
      options: ["is being", "is", "are being", "be"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "Ort/Zustand → present simple: „is next to the square“ (keine Verlaufsform)." },
    { id: "as_gr_a2b", block: "grammar", skill: "grammar", level: "A2", type: "mc",
      promptDe: "Welche Form passt? (Diese Arepas sind lecker.)", questionEs: "These arepas _____ delicious.",
      options: ["is", "are", "am", "be"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "Plural-Subjekt „these arepas“ → are (nicht is)." },
    { id: "as_rd_a2a", block: "reading", skill: "reading", level: "A2", type: "mc",
      promptDe: "Lies die Hostel-Notiz. Was sollst du tun?",
      questionEs: "Breakfast is from 7 to 9. Please leave the key at reception before you go out.",
      options: ["Vor der Abreise den Schlüssel an der Rezeption lassen.", "Das Frühstück um 10 Uhr abholen.", "Den Schlüssel mitnehmen.", "Die Rezeption nicht stören."],
      correctIndex: 0, expectedTimeSec: 14,
      explanationDe: "„leave the key at reception before you go out“ = lass den Schlüssel vor dem Gehen an der Rezeption." },
    { id: "as_un_a2c", block: "understanding", skill: "understanding", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "I get up early to catch the first bus.",
      options: ["Ich stehe früh auf, um den ersten Bus zu nehmen.", "Ich nehme spät den letzten Bus.", "Ich verpasse oft den ersten Bus.", "Ich warte früh auf den Bus."],
      correctIndex: 0, expectedTimeSec: 13,
      explanationDe: "„get up“ = aufstehen; „to + Infinitiv“ = um zu." },

    // ===================== B1 – sicher in Alltag & Reise =====================
    { id: "as_un_b1a", block: "understanding", skill: "understanding", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "I was sleeping when the phone rang.",
      options: ["Ich werde schlafen, wenn das Telefon klingelt.", "Ich schlief gerade, als das Telefon klingelte.", "Ich schlafe, sobald das Telefon klingelt.", "Ich konnte nicht schlafen wegen des Telefons."],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "Past continuous („was sleeping“) + past simple („rang“) = lief gerade, als etwas geschah." },
    { id: "as_un_b1b", block: "understanding", skill: "understanding", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "I've been to Mexico, but I've never been to Oaxaca.",
      options: ["Ich war in Mexiko und auch in Oaxaca.", "Ich bin in Mexiko gewesen, aber nie in Oaxaca.", "Ich gehe nach Mexiko und Oaxaca.", "Ich wollte nach Oaxaca, war aber in Mexiko."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "Present perfect („have been“) = Lebenserfahrung bis jetzt; „never“ = nie." },
    { id: "as_gr_b1a", block: "grammar", skill: "grammar", level: "B1", type: "mc",
      promptDe: "Setze das richtige Wort ein (seit 2019):", questionEs: "I've lived here _____ 2019.",
      options: ["for", "since", "from", "ago"],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "„since“ + Zeitpunkt (2019); „for“ + Zeitdauer (three years)." },
    { id: "as_gr_b1b", block: "grammar", skill: "grammar", level: "B1", type: "mc",
      promptDe: "Welche Präposition? (Dieses Geschenk ist für dich.)", questionEs: "This gift is _____ you.",
      options: ["to", "for", "by", "of"],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "Empfänger/Ziel → „for“: „for you“ = für dich." },
    { id: "as_gr_b1c", block: "grammar", skill: "grammar", level: "B1", type: "mc",
      promptDe: "Ersetze die Objekte (Antwort auf „Did you give the money to Juan?“):", questionEs: "Yes, I gave _____.",
      options: ["it him", "it to him", "him it to", "to him it"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "Reihenfolge: direktes Objekt + „to“ + indirektes Objekt: „gave it to him“ = ich gab es ihm." },
    { id: "as_cj_b1a", block: "conjugation", skill: "conjugation", level: "B1", type: "mc",
      promptDe: "Höfliche Bitte: „Bringen Sie mir bitte die Rechnung.“",
      options: ["You bring me the bill, please.", "Could you bring me the bill, please?", "Bringing me the bill, please.", "Bring the bill me, please."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "Höfliche Bitte an Servicepersonal: „Could you bring me the bill, please?“ (höflicher als der reine Imperativ)." },
    { id: "as_ti_b1a", block: "tenses", skill: "tenses", level: "B1", type: "mc",
      promptDe: "Welche Form ist höflicher („Könnten Sie mir helfen?“)?",
      options: ["Can you help me?", "Could you help me?", "You help me?", "Help me!"],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "„Could you …?“ = könnten Sie – besonders höfliche Bitte (höflicher als „Can you …?“ oder der Imperativ „Help me!“)." },
    { id: "as_ti_b1b", block: "tenses", skill: "tenses", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Next year I'll go to Patagonia.",
      options: ["Letztes Jahr war ich in Patagonien.", "Nächstes Jahr werde ich nach Patagonien gehen.", "Ich gehe gerade nach Patagonien.", "Ich wollte nach Patagonien."],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "Future simple „I'll go / I will go“ = ich werde gehen; „next year“ = nächstes Jahr." },
    { id: "as_vo_b1a", block: "vocab", skill: "vocab", level: "B1", type: "mc",
      promptDe: "Was bedeutet die Redewendung „to look forward to“?",
      options: ["nach vorne schauen", "sich auf etwas freuen", "etwas wegwerfen", "sich verlaufen"],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "„to look forward to (something)“ = sich auf etwas freuen." },
    { id: "as_vo_b1b", block: "vocab", skill: "vocab", level: "B1", type: "mc",
      promptDe: "Welches Wort verbindet einen Gegensatz („…, jedoch …“)?",
      options: ["besides", "however", "therefore", "then"],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "„however“ = jedoch/dennoch (Gegensatz). besides = außerdem, therefore = deshalb." },
    { id: "as_un_b1c", block: "understanding", skill: "understanding", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "I've been travelling around Colombia for two weeks.",
      options: ["Ich werde zwei Wochen durch Kolumbien reisen.", "Ich reise seit zwei Wochen durch Kolumbien.", "Vor zwei Wochen reiste ich durch Kolumbien.", "Ich brauche zwei Wochen für Kolumbien."],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "„have been + -ing + for + Zeit“ = seit … (läuft seit): seit zwei Wochen am Reisen." },
    { id: "as_re_b1a", block: "reaction", skill: "reaction", level: "B1", type: "mc",
      promptDe: "Du möchtest höflich um einen Rabatt bitten, ohne zu fordern. Was passt am besten?",
      options: ["Lower the price!", "Could you give me a discount?", "I want a discount now.", "The price is expensive."],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "„Could you give me a discount?“ = Könnten Sie mir einen Rabatt geben? – höflich & wirksam." },
    { id: "as_rd_b1a", block: "reading", skill: "reading", level: "B1", type: "mc",
      promptDe: "Lies und beantworte: Warum verschiebt sich die Tour?",
      questionEs: "The volcano hike is postponed until tomorrow because the weather isn't safe today.",
      options: ["Weil zu wenige Leute mitkommen.", "Weil das Wetter heute nicht sicher ist.", "Weil der Guide krank ist.", "Weil der Vulkan geschlossen ist."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "„postponed … because the weather isn't safe“ = wird verschoben, weil das Wetter unsicher ist." },
    { id: "as_gr_b1d", block: "grammar", skill: "grammar", level: "B1", type: "mc",
      promptDe: "Vergleich (größer als):", questionEs: "Bogota is _____ Medellin.",
      options: ["as big as", "bigger than", "more big than", "the biggest"],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "Steigerung kurzer Adjektive: „bigger than“ (nicht „more big than“)." },

    // ===================== B2 – nuanciert & sicher =====================
    { id: "as_gr_b2a", block: "grammar", skill: "grammar", level: "B2", type: "mc",
      promptDe: "Setze die richtige Form ein:", questionEs: "If I _____ (have) more time, I would travel all over South America.",
      options: ["have", "would have", "had", "will have"],
      correctIndex: 2, expectedTimeSec: 16,
      explanationDe: "Irreale Bedingung (second conditional): „if“ + past simple (had) + would + Infinitiv (would travel)." },
    { id: "as_gr_b2b", block: "grammar", skill: "grammar", level: "B2", type: "mc",
      promptDe: "Setze die richtige Form ein (Zukunftsbezug):", questionEs: "I'll call you when I _____ (get) to the hotel.",
      options: ["got", "will get", "would get", "get"],
      correctIndex: 3, expectedTimeSec: 16,
      explanationDe: "Nach „when“ mit Zukunftsbezug steht das present simple, nicht „will“: when I get = wenn ich ankomme." },
    { id: "as_gr_b2c", block: "grammar", skill: "grammar", level: "B2", type: "mc",
      promptDe: "Setze die richtige Form ein (Tatsache):", questionEs: "Although I _____ (be) tired, I went out to explore the city.",
      options: ["am", "was", "were", "will be"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "„although“ + Vergangenheit (eingeräumte Tatsache): „although I was tired“ = obwohl ich müde war." },
    { id: "as_cj_b2a", block: "conjugation", skill: "conjugation", level: "B2", type: "mc",
      promptDe: "Setze die richtige Form ein (er/sie):", questionEs: "I don't think he _____ (arrive) yet.",
      options: ["arrives", "has arrived", "had arrived", "will arrive"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "„yet“ → present perfect: „has arrived“ = angekommen ist (Bezug zur Gegenwart)." },
    { id: "as_ti_b2a", block: "tenses", skill: "tenses", level: "B2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "If I were you, I would have booked earlier.",
      options: ["An deiner Stelle hätte ich früher reserviert.", "Ich werde früher reservieren.", "Du solltest jetzt reservieren.", "Ich reserviere immer früh."],
      correctIndex: 0, expectedTimeSec: 16,
      explanationDe: "„would have booked“ = hätte reserviert; „if I were you“ = an deiner Stelle." },
    { id: "as_un_b2a", block: "understanding", skill: "understanding", level: "B2", type: "mc",
      promptDe: "Was bedeutet umgangssprachlich „I lost track of time“?",
      options: ["Ich habe meine Uhr verloren.", "Ich habe (unbeabsichtigt) die Zeit vergessen / mich verspätet.", "Ich mache es später.", "Es ist zu spät für mich."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "„I lost track of time“ = ich habe die Zeit aus den Augen verloren / mich unabsichtlich verspätet." },
    { id: "as_un_b2b", block: "understanding", skill: "understanding", level: "B2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Had I known, I wouldn't have come.",
      options: ["Wenn ich es weiß, komme ich nicht.", "Hätte ich es gewusst, wäre ich nicht gekommen.", "Ich wusste, dass ich kommen würde.", "Ich komme, um es zu wissen."],
      correctIndex: 1, expectedTimeSec: 17,
      explanationDe: "Inversion „Had I known …“ als irreale Bedingung: hätte ich es gewusst …" },
    { id: "as_gr_b2d", block: "grammar", skill: "grammar", level: "B2", type: "mc",
      promptDe: "Passiv/unpersönlich: Wie sagt man „Hier spricht man Englisch“?",
      options: ["Here speaks English.", "English is spoken here.", "Here is speak English.", "One speak English here."],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "Unpersönliche Aussage → Passiv: „English is spoken here.“" },
    { id: "as_vo_b2a", block: "vocab", skill: "vocab", level: "B2", type: "mc",
      promptDe: "Welches Wort drückt eine logische Folge aus („…, daher …“)?",
      options: ["nevertheless", "therefore", "despite", "instead"],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "„therefore“ = daher/folglich. nevertheless = dennoch, instead = stattdessen." },
    { id: "as_vo_b2b", block: "vocab", skill: "vocab", level: "B2", type: "mc",
      promptDe: "Was bedeutet „to keep up with (something)“?",
      options: ["pünktlich sein", "Schritt halten / auf dem Laufenden bleiben", "etwas bezahlen", "in der Nähe sein"],
      correctIndex: 1, expectedTimeSec: 14,
      explanationDe: "„to keep up with something“ = mit etwas Schritt halten / auf dem Laufenden bleiben." },
    { id: "as_re_b2a", block: "reaction", skill: "reaction", level: "B2", type: "mc",
      promptDe: "Du willst höflich widersprechen, ohne unhöflich zu wirken. Was passt am besten?",
      options: ["You're wrong!", "I see your point, but I'm not entirely sure I agree.", "No, that's not how it is.", "You're not right at all."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "„I see your point, but I'm not entirely sure I agree“ = diplomatischer, abgewogener Widerspruch." },
    { id: "as_rd_b2a", block: "reading", skill: "reading", level: "B2", type: "mc",
      promptDe: "Lies. Welche Haltung hat der Sprecher zum Bus?",
      questionEs: "The bus ride was incredibly long, though, to be honest, the scenery was worth every hour.",
      options: ["Er bereut die Fahrt völlig.", "Trotz der Länge fand er sie wegen der Landschaft lohnend.", "Ihm war die Landschaft egal.", "Die Fahrt war kurz und angenehm."],
      correctIndex: 1, expectedTimeSec: 17,
      explanationDe: "„though … the scenery was worth every hour“ = obwohl lang, war es die Landschaft wert – abwägende Haltung." },
    { id: "as_rd_b2b", block: "reading", skill: "reading", level: "B2", type: "mc",
      promptDe: "Lies. Was wird empfohlen?",
      questionEs: "It's a good idea to carry cash in small towns, since they don't always accept cards.",
      options: ["In kleinen Dörfern besser Bargeld dabei haben.", "Immer mit Karte zahlen.", "In Dörfern gibt es keine Geschäfte.", "Karten werden überall akzeptiert."],
      correctIndex: 0, expectedTimeSec: 16,
      explanationDe: "„carry cash … since they don't always accept cards“ = besser Bargeld, da Karte nicht immer geht." },

    // ===================== C1 – feine Nuancen =====================
    { id: "as_gr_c1a", block: "grammar", skill: "grammar", level: "C1", type: "mc",
      promptDe: "Setze die richtige Form ein:", questionEs: "If I _____ (know) the truth earlier, I would have acted differently.",
      options: ["knew", "would know", "had known", "know"],
      correctIndex: 2, expectedTimeSec: 18,
      explanationDe: "Irreale Vergangenheit (third conditional): „if“ + past perfect (had known) + would have + Partizip." },
    { id: "as_gr_c1b", block: "grammar", skill: "grammar", level: "C1", type: "mc",
      promptDe: "Setze die richtige Form ein (als ob er alles wüsste):", questionEs: "He talks as if he _____ (know) everything.",
      options: ["knows", "know", "knew", "would know"],
      correctIndex: 2, expectedTimeSec: 17,
      explanationDe: "Nach „as if“ (unwirklich) steht das past simple: as if he knew = als ob er es wüsste." },
    { id: "as_gr_c1c", block: "grammar", skill: "grammar", level: "C1", type: "mc",
      promptDe: "Setze die richtige Form ein (indirekte Rede):", questionEs: "She asked me where I _____ from.",
      options: ["am", "was", "were", "be"],
      correctIndex: 1, expectedTimeSec: 17,
      explanationDe: "Indirekte Rede (backshift): „Where are you from?“ → „She asked me where I was from.“" },
    { id: "as_un_c1a", block: "understanding", skill: "understanding", level: "C1", type: "mc",
      promptDe: "Was bedeutet die Redewendung „not to mince your words“?",
      options: ["sehr schweigsam sein", "kein Blatt vor den Mund nehmen", "schlecht sprechen", "die Sprache verlernen"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "„not to mince your words“ = unverblümt/offen reden, kein Blatt vor den Mund nehmen." },
    { id: "as_un_c1b", block: "understanding", skill: "understanding", level: "C1", type: "mc",
      promptDe: "Was bedeutet „to take something for granted“?",
      options: ["etwas verschenken", "etwas als selbstverständlich voraussetzen", "sich hinsetzen", "etwas bedauern"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "„to take something for granted“ = als selbstverständlich/gegeben annehmen." },
    { id: "as_vo_c1a", block: "vocab", skill: "vocab", level: "C1", type: "mc",
      promptDe: "Welche Kollokation ist idiomatisch korrekt: „eine Entscheidung treffen“?",
      options: ["to do a decision", "to make a decision", "to give a decision", "to put a decision"],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "Im Englischen „to make a decision“ (nicht *do a decision)." },
    { id: "as_vo_c1b", block: "vocab", skill: "vocab", level: "C1", type: "mc",
      promptDe: "Was bedeutet „grudgingly“?",
      options: ["sehr gern", "widerwillig / zähneknirschend", "heimlich", "vergeblich"],
      correctIndex: 1, expectedTimeSec: 16,
      explanationDe: "„grudgingly“ = widerwillig, zähneknirschend." },
    { id: "as_rd_c1a", block: "reading", skill: "reading", level: "C1", type: "mc",
      promptDe: "Lies. Was deutet der Sprecher an?",
      questionEs: "It's not that I didn't like the city; I was just expecting something different.",
      options: ["Die Stadt hat ihm überhaupt nicht gefallen.", "Die Stadt war okay, entsprach aber nicht seinen Erwartungen.", "Er hat die Stadt nie besucht.", "Die Stadt hat all seine Erwartungen übertroffen."],
      correctIndex: 1, expectedTimeSec: 18,
      explanationDe: "„It's not that I didn't like it; I was just expecting something different“ = keine Abneigung, sondern andere Erwartungen." },

    // ===================== Hörverstehen (nur „Extremo“; TTS spricht audioEs) =====================
    // type "listen": der englische Satz (audioEs) wird vorgelesen (en-US-Stimme), NICHT angezeigt.
    // Im Rückblick wird audioEs sichtbar gemacht. Bewertung = wie MC (selectedIndex).
    // Optionen auf Englisch (Audio verstehen + englische Paraphrase lesen). Die
    // promptDe-Frage bleibt deutsch (Bediensprache); audioEs wird nur gesprochen.
    { id: "as_li_a2a", block: "listening", skill: "listening", level: "A2", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Wo ist die Toilette?", audioEs: "The bathroom is at the back, on the right.",
      options: ["On the left, next to the entrance.", "On the second floor.", "At the back, on the right.", "Next to the reception."],
      correctIndex: 2, expectedTimeSec: 15,
      explanationDe: "„at the back, on the right“ = hinten, rechts." },
    { id: "as_li_a2b", block: "listening", skill: "listening", level: "A2", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was sagt die Person?", audioEs: "Sorry, the kitchen is already closed.",
      options: ["The food is almost ready.", "The kitchen isn't open anymore.", "The kitchen is still open.", "There's no menu today."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "„the kitchen is already closed“ = die Küche ist schon geschlossen (isn't open anymore)." },
    { id: "as_li_a2c", block: "listening", skill: "listening", level: "A2", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Wann und von wo fährt der Bus?", audioEs: "The bus leaves in ten minutes from platform three.",
      options: ["At ten o'clock, from platform three.", "In three minutes, from platform ten.", "In an hour, from platform three.", "In ten minutes, from platform three."],
      correctIndex: 3, expectedTimeSec: 16,
      explanationDe: "„in ten minutes from platform three“ = in 10 Minuten von Bahnsteig 3." },
    { id: "as_li_b1a", block: "listening", skill: "listening", level: "B1", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was bietet die Person an?", audioEs: "If you like, I can recommend a traditional restaurant near here.",
      options: ["Invite you for a meal.", "Recommend a traditional restaurant nearby.", "Walk you to the market.", "Book you a hotel."],
      correctIndex: 1, expectedTimeSec: 17,
      explanationDe: "„I can recommend a traditional restaurant near here“ = ich kann dir ein typisches Restaurant in der Nähe empfehlen." },
    { id: "as_li_b1b", block: "listening", skill: "listening", level: "B1", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was teilt die Person mit?", audioEs: "Excuse me, this seat is taken, my friend is coming.",
      options: ["The seat is taken.", "The seat is free.", "He's looking for his friend.", "He's getting off at the next stop."],
      correctIndex: 0, expectedTimeSec: 17,
      explanationDe: "„this seat is taken“ = dieser Platz ist besetzt." },
    { id: "as_li_b1c", block: "listening", skill: "listening", level: "B1", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was ist im Tourpreis enthalten?", audioEs: "The tour lasts about four hours and includes lunch.",
      options: ["Breakfast.", "Entry to the museum.", "Lunch.", "Transport to the hotel."],
      correctIndex: 2, expectedTimeSec: 17,
      explanationDe: "„includes lunch“ = das Mittagessen ist inbegriffen (lasts about four hours = dauert vier Stunden)." },
    { id: "as_li_b2a", block: "listening", skill: "listening", level: "B2", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was drückt die Person aus?", audioEs: "I would have told you earlier, but I didn't want to worry you.",
      options: ["She'll tell you later.", "She didn't tell you so as not to worry you.", "She's very worried about you.", "She forgot to tell you."],
      correctIndex: 1, expectedTimeSec: 18,
      explanationDe: "„I would have told you … but I didn't want to worry you“ = sie hat es nicht gesagt, um dich nicht zu beunruhigen." },
    { id: "as_li_b2b", block: "listening", skill: "listening", level: "B2", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was ist passiert?", audioEs: "No matter how hard I tried, I couldn't change the flight.",
      options: ["She couldn't change the flight, though she tried.", "She changed the flight without any problems.", "She doesn't want to change the flight.", "Her flight was cancelled."],
      correctIndex: 0, expectedTimeSec: 18,
      explanationDe: "„No matter how hard I tried, I couldn't …“ = so sehr sie es auch versuchte, sie schaffte es nicht." },
    { id: "as_li_c1a", block: "listening", skill: "listening", level: "C1", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Was sagt die Person?", audioEs: "Had we known the road was closed, we would have left earlier.",
      options: ["They knew the road was closed.", "They left early on purpose.", "If they had known about the road, they would have left earlier.", "The road is open again now."],
      correctIndex: 2, expectedTimeSec: 19,
      explanationDe: "„Had we known …, we would have left earlier“ = irreale Vergangenheit: hätten sie es gewusst, wären sie früher losgefahren." },
    { id: "as_li_c1b", block: "listening", skill: "listening", level: "C1", type: "listen", variant: "extremo",
      promptDe: "Hör zu: Welche Haltung hat die Person?", audioEs: "It's not that I don't like the idea, it's just that it seems unrealistic to me.",
      options: ["He doesn't like the idea at all.", "He likes the idea but finds it unrealistic.", "He thinks it's completely realistic.", "He doesn't have a clear opinion."],
      correctIndex: 1, expectedTimeSec: 19,
      explanationDe: "„It's not that I don't like it, it's just that it seems unrealistic“ = es gefällt ihr schon, aber sie hält es für unrealistisch." },

    // ===================== Freie Antworten (kurz schreiben) =====================
    { id: "as_fr_a1", block: "free", skill: "free", level: "A1", type: "free",
      promptDe: "Schreib auf Englisch: Ich möchte einen Kaffee.",
      accept: ["i would like a coffee", "id like a coffee", "i want a coffee", "can i have a coffee", "could i have a coffee", "a coffee please", "i would like a coffee please"],
      solutionEs: "I'd like a coffee.", expectedTimeSec: 14,
      explanationDe: "„I'd like a coffee.“ = Ich möchte einen Kaffee. (Groß-/Kleinschreibung/Satzzeichen egal)" },
    { id: "as_fr_a2", block: "free", skill: "free", level: "A2", type: "free",
      promptDe: "Schreib die Frage auf Englisch: Wie viel kostet das?",
      accept: ["how much is it", "how much is this", "how much is that", "how much does it cost", "how much does this cost", "what does it cost", "how much"],
      solutionEs: "How much is it?", expectedTimeSec: 14,
      explanationDe: "„How much is it?“ ist die Standardfrage nach dem Preis." },
    { id: "as_fr_a1b", block: "free", skill: "free", level: "A1", type: "free",
      promptDe: "Stell dich auf Englisch vor: „Ich heiße …“ (mit irgendeinem Namen).",
      accept: ["my name is", "i am", "im", "i'm", "hi my name is", "hello my name is"], matchMode: "prefix",
      solutionEs: "My name is …", expectedTimeSec: 12,
      explanationDe: "„My name is …“ = Ich heiße … – nach dem Anfang darf ein beliebiger Name folgen." },
    { id: "as_fr_b1", block: "free", skill: "free", level: "B1", type: "free",
      promptDe: "Schreib höflich auf Englisch: Könnten Sie mir helfen, bitte?",
      accept: ["could you help me", "could you help me please", "could you please help me", "can you help me please", "would you help me please", "could you help me out please"],
      solutionEs: "Could you help me, please?", expectedTimeSec: 18,
      explanationDe: "„Could you …?“ macht die Bitte höflich: Could you help me, please?" },
    { id: "as_fr_b1b", block: "free", skill: "free", level: "B1", type: "free",
      promptDe: "Schreib auf Englisch: Ich bin gestern Abend angekommen.",
      accept: ["i arrived last night", "i arrived yesterday evening", "i got here last night", "i arrived last evening", "i got in last night"],
      solutionEs: "I arrived last night.", expectedTimeSec: 18,
      explanationDe: "Past simple „arrived“ (kam an) + „last night / yesterday evening“ = gestern Abend/Nacht." },
    { id: "as_fr_b2", block: "free", skill: "free", level: "B2", type: "free",
      promptDe: "Schreib auf Englisch: Wenn ich Zeit hätte, würde ich mehr reisen.",
      accept: ["if i had time i would travel more", "if i had more time i would travel more", "id travel more if i had time", "i would travel more if i had time", "if i had time id travel more"],
      solutionEs: "If I had time, I would travel more.", expectedTimeSec: 22,
      explanationDe: "Second conditional: „if“ + past simple (had) + would + Infinitiv (would travel)." },

    // Nur „Extremo“: zwei zusätzliche, anspruchsvollere Produktionsaufgaben.
    { id: "as_fr_b1c", block: "free", skill: "free", level: "B1", type: "free", variant: "extremo",
      promptDe: "Schreib höflich auf Englisch: Ich hätte gern die Rechnung, bitte.",
      accept: ["could i have the bill please", "can i have the bill please", "could i get the bill please", "id like the bill please", "i would like the bill please", "the bill please", "could i have the check please", "can i have the check please"],
      solutionEs: "Could I have the bill, please?", expectedTimeSec: 18,
      explanationDe: "„Could I have the bill, please?“ – höflich um die Rechnung bitten (AmE „the check“)." },
    { id: "as_fr_b2b", block: "free", skill: "free", level: "B2", type: "free", variant: "extremo",
      promptDe: "Schreib auf Englisch: Wenn ich Geld hätte, würde ich ein Haus kaufen.",
      accept: ["if i had money i would buy a house", "if i had more money i would buy a house", "id buy a house if i had money", "i would buy a house if i had money", "if i had the money i would buy a house"],
      solutionEs: "If I had money, I would buy a house.", expectedTimeSec: 22,
      explanationDe: "Second conditional: „if“ + past simple (had) + would + Infinitiv (would buy)." },
  ];

  // Aktiven Fragenkatalog nach Track wählen: „en“ gelernt -> EN, sonst ES.
  // In Node-Tests (kein window.SC.track) fällt es auf QUESTIONS_ES zurück.
  function activeQuestions() {
    return (window.SC && window.SC.track && window.SC.track.learnLang && window.SC.track.learnLang() === "en") ? QUESTIONS_EN : QUESTIONS_ES;
  }

  // Kommunikation vs. Grammatik (für das Profil + die Empfehlung).
  var COMM_SKILLS = { understanding: 1, reaction: 1, vocab: 1, reading: 1, listening: 1, free: 1 };
  var GRAMMAR_SKILLS = { conjugation: 1, tenses: 1, grammar: 1 };

  // „Auswahl-Fragen“ laufen durch die adaptive Treppe (Multiple Choice + Hören);
  // freie Antworten kommen separat am Ende. (Hören wird wie MC bewertet.)
  var CHOICE_TYPES = { mc: 1, listen: 1 };
  function isChoice(q) { return !!(q && CHOICE_TYPES[q.type]); }

  // ---------- Test-Varianten ----------
  // standard = der ausführliche Nivel-Test (kein Hören).
  // extremo  = deutlich länger + Hörverstehen (braucht Sprachausgabe).
  // Eine Variante filtert den Katalog: standard lässt Hören & extremo-Items weg.
  var VARIANTS = {
    standard: { id: "standard", choiceTarget: 28, grammarCap: 11, startDifficulty: 2, listen: false },
    extremo: { id: "extremo", choiceTarget: 46, grammarCap: 16, startDifficulty: 2, listen: true },
  };
  function variantConfig(variant) { return VARIANTS[variant] || VARIANTS.standard; }
  // Katalog-Teilmenge für eine Variante (Reihenfolge bleibt erhalten – deterministisch).
  function forVariant(variant) {
    var ex = variant === "extremo";
    return activeQuestions().filter(function (q) {
      if (!ex && q.type === "listen") return false;     // Hören nur im Extremo
      if (!ex && q.variant === "extremo") return false; // extremo-only Items weglassen
      return true;
    });
  }

  // ---------- adaptiver Ablauf (Treppen-Logik über SECHS Stufen) ----------
  // Schwierigkeit als Index 0..5. Richtig -> eine Stufe höher, falsch/„weiß nicht“
  // -> eine Stufe tiefer. So konvergiert der Test aufs Niveau, ohne dass jemand
  // den ganzen Katalog durchmachen muss.
  var LEVEL_ORDER = ["A0", "A1", "A2", "B1", "B2", "C1"];   // Item-Schwierigkeit (= q.level, Treppe)
  var DISPLAY_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1"]; // Anzeige-Niveau (1:1)
  var START_DIFFICULTY = 2;   // Start bei A2 (mittig – konvergiert nach oben oder unten)
  var MC_TARGET = 28;         // so viele Multiple-Choice-Fragen, dann die freien
  var GRAMMAR_CAP = 11;       // höchstens so viele Grammatik-Fragen (~40 % von 28)

  function levelIndex(name) { var i = LEVEL_ORDER.indexOf(name); return i < 0 ? START_DIFFICULTY : i; }
  function nextDifficulty(difficulty, result) {
    var d = (typeof difficulty === "number") ? difficulty : START_DIFFICULTY;
    if (result === "correct") return Math.min(LEVEL_ORDER.length - 1, d + 1);
    return Math.max(0, d - 1); // wrong oder unknown -> leichter
  }

  // Nächste Multiple-Choice-Frage wählen: möglichst auf der Zielstufe, sonst die
  // nächstgelegene; Grammatik nur bis zum Deckel; bevorzugt den am wenigsten
  // gefragten Skill (gleichmäßige Abdeckung). DETERMINISTISCH (testbar).
  function pickNextMc(questions, askedIds, difficulty, grammarAsked, grammarCap) {
    questions = questions || activeQuestions();
    askedIds = askedIds || [];
    var asked = {}; askedIds.forEach(function (id) { asked[id] = 1; });
    var skillCount = {};
    questions.forEach(function (q) { if (asked[q.id]) skillCount[q.skill] = (skillCount[q.skill] || 0) + 1; });
    var capped = grammarAsked >= (grammarCap == null ? GRAMMAR_CAP : grammarCap);
    var pool = questions.filter(function (q) {
      if (!isChoice(q) || asked[q.id]) return false; // Auswahl-Fragen (MC + Hören)
      if (capped && GRAMMAR_SKILLS[q.skill]) return false;
      return true;
    });
    if (!pool.length) return null;
    var target = (typeof difficulty === "number") ? difficulty : START_DIFFICULTY;
    // Stufen nach Nähe zur Zielstufe durchsuchen (0, ±1, ±2, …).
    var offsets = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5];
    for (var oi = 0; oi < offsets.length; oi++) {
      var name = LEVEL_ORDER[target + offsets[oi]];
      if (!name) continue;
      var group = pool.filter(function (q) { return q.level === name; });
      if (!group.length) continue;
      group.sort(function (a, b) {
        var sa = skillCount[a.skill] || 0, sb = skillCount[b.skill] || 0;
        if (sa !== sb) return sa - sb; // seltener gefragten Skill bevorzugen
        return questions.indexOf(a) - questions.indexOf(b); // stabile Reihenfolge
      });
      return group[0];
    }
    return pool[0];
  }

  function freeQuestions(questions) { return (questions || activeQuestions()).filter(function (q) { return q.type === "free"; }); }

  // ---------- IRT-artige Einschätzung + Zuverlässigkeit ----------
  // „Demonstriertes“ Niveau: die höchste Stufe, auf der mehr richtig als falsch
  // gelöst wurde (mind. eine richtige MC-Antwort). So wird ein starker Lerner
  // nicht durch ein paar schwere Treffer-Fehlversuche unter Wert eingestuft.
  function demonstratedIndex(questions, answers) {
    questions = Array.isArray(questions) ? questions : [];
    answers = Array.isArray(answers) ? answers : [];
    var n = LEVEL_ORDER.length;
    var correctAt = new Array(n).fill(0), wrongAt = new Array(n).fill(0);
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      if (!isChoice(q)) continue; // MC + Hören zählen fürs demonstrierte Niveau
      var r = scoreAnswer(q, answers[i] || { isUnknown: true });
      var idx = levelIndex(q.level);
      if (r.result === "correct") correctAt[idx]++;
      else if (r.result === "wrong") wrongAt[idx]++;
    }
    var demo = 0;
    for (var L = 0; L < n; L++) {
      if (correctAt[L] >= 1 && correctAt[L] >= wrongAt[L]) demo = L;
    }
    return demo;
  }

  // Endgültiges Level: das höhere aus Score-basiertem und demonstriertem Niveau;
  // viel „weiß nicht“ deckelt weiterhin auf A0 (ehrliches Nichtwissen).
  function levelBlended(finalScore, unknownRate, questions, answers) {
    if (unknownRate > 0.55) return DISPLAY_LEVELS[0]; // A0
    var sIdx = scoreIndex(finalScore, unknownRate);
    var demoIdx = demonstratedIndex(questions, answers);
    return DISPLAY_LEVELS[Math.max(sIdx, demoIdx)];
  }

  // Zuverlässigkeit (Anti-Cheating/Qualität, NICHT im Score).
  function reliabilityFor(s) {
    s = s || {};
    var med = s.medianMs || 0;
    if (s.wrongRate >= 0.4 && s.unknownRate <= 0.1 && med > 0 && med < 4000) return "guessing";
    if (med > 0 && med < 2000) return "fast";
    if (s.unknownRate > 0.5) return "manyUnknown";
    return "";
  }

  // ---------- reine Hilfsfunktionen ----------
  function normalizeFree(s) {
    // Bevorzugt den App-Matcher (akzent-/satzzeichentolerant), mit lokalem Fallback.
    if (SC.matcher && typeof SC.matcher.normalize === "function") return SC.matcher.normalize(s);
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[¿?¡!.,;:()]/g, "").replace(/\s+/g, " ").trim();
  }
  function median(nums) {
    var a = nums.filter(function (n) { return typeof n === "number" && isFinite(n); }).slice().sort(function (x, y) { return x - y; });
    if (!a.length) return 0;
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  // Sicherheits-Faktor aus der Antwortzeit (nur für RICHTIGE Antworten relevant).
  function timeConfidence(responseTimeMs, expectedTimeSec) {
    var sec = (Number(responseTimeMs) || 0) / 1000;
    var exp = Number(expectedTimeSec) || 10;
    if (sec <= exp * 0.75) return 1.0;   // sicher
    if (sec <= exp * 1.5) return 0.7;    // normal
    if (sec <= exp * 2.5) return 0.4;    // langsam
    return 0.2;                          // sehr langsam / unsicher
  }

  function questionById(id) {
    var qs = activeQuestions();
    for (var i = 0; i < qs.length; i++) if (qs[i].id === id) return qs[i];
    return null;
  }

  // Eine einzelne Antwort bewerten. answer: { isUnknown, selectedIndex, text, responseTimeMs }
  function scoreAnswer(q, answer) {
    answer = answer || {};
    if (answer.isUnknown) return { result: "unknown", isCorrect: false, timeConfidence: 0 };
    var isCorrect;
    if (q.type === "free") {
      var got = normalizeFree(answer.text || "");
      isCorrect = !!got && (q.accept || []).some(function (a) {
        var acc = normalizeFree(a);
        // matchMode "prefix": der Anfang muss passen (z. B. „me llamo …“ + beliebiger Name).
        return q.matchMode === "prefix" ? got.indexOf(acc) === 0 : acc === got;
      });
    } else {
      isCorrect = answer.selectedIndex === q.correctIndex;
    }
    return {
      result: isCorrect ? "correct" : "wrong",
      isCorrect: isCorrect,
      timeConfidence: isCorrect ? timeConfidence(answer.responseTimeMs, q.expectedTimeSec) : 0,
    };
  }

  // Score-Stufe als Index (0..5) – feinere Schwellen für sechs Stufen.
  function scoreIndex(finalScore, unknownRate) {
    if (!isFinite(finalScore)) return 0; // NaN/undefined -> sicher A0, nicht versehentlich C1
    if (finalScore < 0.25 || unknownRate > 0.55) return 0; // A0
    if (finalScore < 0.42) return 1; // A1
    if (finalScore < 0.58) return 2; // A2
    if (finalScore < 0.72) return 3; // B1
    if (finalScore < 0.85) return 4; // B2
    return 5;                        // C1
  }
  function levelFor(finalScore, unknownRate) {
    return DISPLAY_LEVELS[scoreIndex(finalScore, unknownRate)];
  }

  function tempoFor(medianMs) {
    if (!medianMs) return "medium";
    if (medianMs < 7000) return "fast";
    if (medianMs < 15000) return "medium";
    return "slow";
  }

  // Gesamtauswertung. answers: Array gleicher Länge/Reihenfolge wie questions.
  function summarize(questions, answers) {
    questions = Array.isArray(questions) ? questions : [];
    answers = Array.isArray(answers) ? answers : [];
    var total = questions.length || 1;
    var correct = 0, wrong = 0, unknown = 0;
    var confSum = 0, confCount = 0;
    var times = [];
    var skill = {}; // skill -> { correct, total, unknown, timeSum, timeCount }
    var commCorrect = 0, commTotal = 0, gramCorrect = 0, gramTotal = 0;

    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var a = answers[i] || { isUnknown: true };
      var r = scoreAnswer(q, a);
      var sk = skill[q.skill] || (skill[q.skill] = { correct: 0, total: 0, unknown: 0, timeSum: 0, timeCount: 0 });
      sk.total++;
      if (typeof a.responseTimeMs === "number" && isFinite(a.responseTimeMs)) { times.push(a.responseTimeMs); sk.timeSum += a.responseTimeMs; sk.timeCount++; }
      if (r.result === "correct") { correct++; sk.correct++; confSum += r.timeConfidence; confCount++; }
      else if (r.result === "unknown") { unknown++; sk.unknown++; }
      else { wrong++; }

      if (COMM_SKILLS[q.skill]) { commTotal++; if (r.isCorrect) commCorrect++; }
      if (GRAMMAR_SKILLS[q.skill]) { gramTotal++; if (r.isCorrect) gramCorrect++; }
    }

    var accuracy = correct / total;
    var confidence = confCount ? confSum / confCount : 0;
    var finalScore = accuracy * 0.9 + confidence * 0.1;
    var unknownRate = unknown / total;
    var wrongRate = wrong / total;
    var medianMs = median(times);

    var skillBreakdown = {};
    Object.keys(skill).forEach(function (k) {
      var s = skill[k];
      skillBreakdown[k] = {
        accuracy: s.total ? s.correct / s.total : 0,
        unknownRate: s.total ? s.unknown / s.total : 0,
        avgTimeMs: s.timeCount ? Math.round(s.timeSum / s.timeCount) : 0,
        total: s.total,
      };
    });

    var communicationAccuracy = commTotal ? commCorrect / commTotal : 0;
    var grammarAccuracy = gramTotal ? gramCorrect / gramTotal : 0;
    var note = "";
    if (communicationAccuracy >= 0.70 && grammarAccuracy < 0.45) note = "commStrong";
    else if (grammarAccuracy >= 0.70 && communicationAccuracy < 0.50) note = "grammarStrong";

    var reliability = reliabilityFor({ medianMs: medianMs, wrongRate: wrongRate, unknownRate: unknownRate });

    return {
      total: total, correct: correct, wrong: wrong, unknown: unknown,
      accuracy: accuracy, confidence: confidence, finalScore: finalScore,
      unknownRate: unknownRate, wrongRate: wrongRate,
      medianMs: medianMs, tempo: tempoFor(medianMs),
      communicationAccuracy: communicationAccuracy, grammarAccuracy: grammarAccuracy,
      skillBreakdown: skillBreakdown, note: note,
      reliability: reliability,
      level: levelBlended(finalScore, unknownRate, questions, answers),
    };
  }

  SC.assessment = {
    QUESTIONS: activeQuestions(),
    QUESTIONS_ES: QUESTIONS_ES,
    QUESTIONS_EN: QUESTIONS_EN,
    activeQuestions: activeQuestions,
    COMM_SKILLS: COMM_SKILLS,
    GRAMMAR_SKILLS: GRAMMAR_SKILLS,
    CHOICE_TYPES: CHOICE_TYPES,
    LEVEL_ORDER: LEVEL_ORDER,
    DISPLAY_LEVELS: DISPLAY_LEVELS,
    START_DIFFICULTY: START_DIFFICULTY,
    MC_TARGET: MC_TARGET,
    GRAMMAR_CAP: GRAMMAR_CAP,
    VARIANTS: VARIANTS,
    variantConfig: variantConfig,
    forVariant: forVariant,
    isChoice: isChoice,
    // reine Funktionen (getestet)
    timeConfidence: timeConfidence,
    scoreAnswer: scoreAnswer,
    levelFor: levelFor,
    scoreIndex: scoreIndex,
    summarize: summarize,
    questionById: questionById,
    normalizeFree: normalizeFree,
    levelIndex: levelIndex,
    nextDifficulty: nextDifficulty,
    pickNextMc: pickNextMc,
    freeQuestions: freeQuestions,
    demonstratedIndex: demonstratedIndex,
    levelBlended: levelBlended,
    reliabilityFor: reliabilityFor,
    tempoFor: tempoFor,
  };
})();
