/*
 * placement.js  (SC.placement) – „Ruta-Check“: kurzer, reisepraktischer
 * Einstufungstest (Placement). REINE DATEN + REINE FUNKTIONEN (kein DOM).
 *
 * Leitlinie (siehe School-Edition-Konzept):
 *  - Kommunikation zuerst (~70 %), Grammatik als Diagnose (~30 %).
 *  - Jede Frage hat „Ich weiß es nicht“ – ehrliches Nichtwissen statt Raten.
 *  - Antwortzeit wird je Frage erfasst, fließt aber nur LEICHT in den Score (10 %).
 *  - Ergebnis ist ein Profil (Trefferquote, Sicherheit, Unknown-Rate, Tempo,
 *    Skill-Aufschlüsselung) + ein Startlevel – nützlicher als eine harte Note.
 *
 * Blöcke/Skills: understanding · reaction · vocab (= Kommunikation),
 *                conjugation · tenses (= Grammatik), free (= Kommunikation).
 *
 * Die Fragen sind LatAm-tauglich (ustedes statt vosotros) und an echten
 * Reisesituationen orientiert, nicht an abstrakter Schulgrammatik.
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});

  // ---------- Fragenkatalog (V1: 24 Fragen) ----------
  // type "mc": options + correctIndex.  type "free": accept[] (akzeptierte Antworten).
  // skill steuert die Skill-Aufschlüsselung; block die Anzeige-Gruppierung.
  var QUESTIONS = [
    // --- Block 1: Verstehen (Spanisch lesen → Bedeutung wählen) ---
    { id: "pt_un_001", block: "understanding", skill: "understanding", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "¿Cuánto cuesta?",
      options: ["Wo ist es?", "Wie viel kostet es?", "Ich brauche Hilfe.", "Ich habe eine Reservierung."],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„¿Cuánto cuesta?“ = Wie viel kostet es? Einer der wichtigsten Reisesätze." },
    { id: "pt_un_002", block: "understanding", skill: "understanding", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "La cuenta, por favor.",
      options: ["Die Rechnung, bitte.", "Einen Tisch, bitte.", "Das Zimmer, bitte.", "Die Speisekarte, bitte."],
      correctIndex: 0, expectedTimeSec: 8,
      explanationDe: "„La cuenta, por favor“ = Die Rechnung, bitte." },
    { id: "pt_un_003", block: "understanding", skill: "understanding", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "¿Dónde está el baño?",
      options: ["Wo ist der Bus?", "Wo ist die Toilette?", "Wo ist das Hostel?", "Wo ist der Markt?"],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "„el baño“ ist in LatAm die Toilette." },
    { id: "pt_un_004", block: "understanding", skill: "understanding", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Estoy en el hostel.",
      options: ["Ich war im Hostel.", "Ich bin im Hostel.", "Ich werde im Hostel sein.", "Ich gehe zum Hostel."],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„estoy“ = ich bin (gerade). Präsens von estar." },
    { id: "pt_un_005", block: "understanding", skill: "understanding", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "No había agua caliente.",
      options: ["Es gibt kein warmes Wasser.", "Es gab kein warmes Wasser.", "Es wird kein warmes Wasser geben.", "Ich brauche warmes Wasser."],
      correctIndex: 1, expectedTimeSec: 11,
      explanationDe: "„había“ = es gab. Nützlich, um ein Problem zu erklären." },
    { id: "pt_un_006", block: "understanding", skill: "understanding", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Estaba esperando el bus cuando empezó a llover.",
      options: ["Ich werde auf den Bus warten, wenn es regnet.", "Ich wartete gerade auf den Bus, als es zu regnen begann.", "Ich habe den Bus genommen, weil es regnete.", "Ich warte auf den Bus, sobald es regnet."],
      correctIndex: 1, expectedTimeSec: 15,
      explanationDe: "„estaba esperando“ (Verlauf in der Vergangenheit) + „empezó“ (Indefinido) = lief gerade, als etwas passierte." },

    // --- Block 2: Reagieren (Situation → passende spanische Äußerung) ---
    { id: "pt_re_001", block: "reaction", skill: "reaction", level: "A1", type: "mc",
      promptDe: "Du willst im Restaurant bezahlen. Was sagst du?",
      options: ["La cuenta, por favor.", "Tengo una reserva.", "¿Dónde está el bus?", "No entiendo."],
      correctIndex: 0, expectedTimeSec: 9,
      explanationDe: "Kurz, höflich und im Restaurant sehr realistisch." },
    { id: "pt_re_002", block: "reaction", skill: "reaction", level: "A1", type: "mc",
      promptDe: "Du verstehst etwas nicht. Was sagst du?",
      options: ["Estoy bien.", "No entiendo.", "Mucho gusto.", "Hasta luego."],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„No entiendo“ = Ich verstehe nicht." },
    { id: "pt_re_003", block: "reaction", skill: "reaction", level: "A1", type: "mc",
      promptDe: "Du begrüßt jemanden am Nachmittag. Was passt?",
      options: ["Buenos días.", "Buenas tardes.", "Buenas noches.", "Hasta mañana."],
      correctIndex: 1, expectedTimeSec: 9,
      explanationDe: "„Buenas tardes“ = Guten Tag/Nachmittag (ab Mittag)." },
    { id: "pt_re_004", block: "reaction", skill: "reaction", level: "A2", type: "mc",
      promptDe: "An der Rezeption willst du EINE Person höflich fragen, ob sie dir helfen kann. Was passt?",
      options: ["¿Puedes ayudarme?", "¿Puedo ayudarme?", "¿Puede ayudarme?", "¿Ayudo a usted?"],
      correctIndex: 2, expectedTimeSec: 12,
      explanationDe: "„¿Puede…?“ ist die höfliche usted-Form (eine Person) – für Rezeption, Polizei, Buspersonal." },
    { id: "pt_re_005", block: "reaction", skill: "reaction", level: "A2", type: "mc",
      promptDe: "Du suchst den Weg zum Busbahnhof. Was fragst du?",
      options: ["¿Cuánto cuesta el bus?", "¿Cómo llego a la terminal de buses?", "¿A qué hora sale el bus?", "¿Dónde compro el boleto?"],
      correctIndex: 1, expectedTimeSec: 12,
      explanationDe: "„¿Cómo llego a…?“ = Wie komme ich nach/zu…? – fragt nach dem Weg." },

    // --- Block 3: Wortschatz / Kontext ---
    { id: "pt_vo_001", block: "vocab", skill: "vocab", level: "A1", type: "mc",
      promptDe: "Was bedeutet „el boleto“ (LatAm)?",
      options: ["das Gepäck", "die Fahrkarte / das Ticket", "der Schlüssel", "die Rechnung"],
      correctIndex: 1, expectedTimeSec: 8,
      explanationDe: "In LatAm ist „el boleto“ das Ticket/die Fahrkarte (in Spanien eher „el billete“)." },
    { id: "pt_vo_002", block: "vocab", skill: "vocab", level: "A1", type: "mc",
      promptDe: "Was bedeutet „la llave“?",
      options: ["der Schlüssel", "das Zimmer", "die Tür", "das Bett"],
      correctIndex: 0, expectedTimeSec: 8,
      explanationDe: "„la llave“ = der Schlüssel." },
    { id: "pt_vo_003", block: "vocab", skill: "vocab", level: "A2", type: "mc",
      promptDe: "Du hast Kopfschmerzen und gehst in die Apotheke. Was brauchst du?",
      options: ["una almohada", "una pastilla", "una toalla", "una manta"],
      correctIndex: 1, expectedTimeSec: 10,
      explanationDe: "„una pastilla“ = eine Tablette. (almohada = Kissen, toalla = Handtuch, manta = Decke)" },
    { id: "pt_vo_004", block: "vocab", skill: "vocab", level: "A2", type: "mc",
      promptDe: "Was bedeutet „¿Tiene una habitación libre?“",
      options: ["Haben Sie ein freies Zimmer?", "Haben Sie einen freien Tisch?", "Ist das Zimmer sauber?", "Wie viel kostet das Zimmer?"],
      correctIndex: 0, expectedTimeSec: 11,
      explanationDe: "„habitación libre“ = freies/verfügbares Zimmer." },

    // --- Block 4: Konjugation (reisepraktisch, nicht abstrakt) ---
    { id: "pt_cj_001", block: "conjugation", skill: "conjugation", level: "A1", type: "mc",
      promptDe: "Du willst sagen: Ich brauche Hilfe. Welche Form passt?",
      options: ["Necesitas ayuda.", "Necesito ayuda.", "Necesitamos ayuda.", "Necesitan ayuda."],
      correctIndex: 1, expectedTimeSec: 10,
      explanationDe: "„necesito“ = ich brauche (yo-Form)." },
    { id: "pt_cj_002", block: "conjugation", skill: "conjugation", level: "A1", type: "mc",
      promptDe: "Du fragst einen anderen Reisenden: Reist du allein? Was passt?",
      options: ["¿Viajo solo?", "¿Viajas solo?", "¿Viajan solo?", "¿Viajamos solos?"],
      correctIndex: 1, expectedTimeSec: 11,
      explanationDe: "„viajas“ = du reist (tú-Form). Bei Frauen: ¿Viajas sola?" },
    { id: "pt_cj_003", block: "conjugation", skill: "conjugation", level: "A1", type: "mc",
      promptDe: "Du und ein anderer Reisender wollt zusammen gehen. Was passt?",
      options: ["Vamos juntos.", "Van juntos.", "Voy juntos.", "Vas juntos."],
      correctIndex: 0, expectedTimeSec: 11,
      explanationDe: "„vamos“ = wir gehen / lass uns gehen (nosotros). Sehr nützlich in der Gruppe." },
    { id: "pt_cj_004", block: "conjugation", skill: "conjugation", level: "A2", type: "mc",
      promptDe: "Die Rezeption sagt zu mehreren Gästen: Ihr könnt hier warten. Was passt in Lateinamerika?",
      options: ["Podéis esperar aquí.", "Pueden esperar aquí.", "Puedes esperar aquí.", "Podemos esperar aquí."],
      correctIndex: 1, expectedTimeSec: 13,
      explanationDe: "In LatAm ist „ihr“ = ustedes + 3. Person Plural: „pueden“ (nicht „podéis“)." },

    // --- Block 5: Zeiten (Gegenwart / Verlauf / Zukunft / Vergangenheit) ---
    { id: "pt_ti_001", block: "tenses", skill: "tenses", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Voy a tomar el bus mañana.",
      options: ["Ich nehme morgen den Bus.", "Ich habe gestern den Bus genommen.", "Ich nehme gerade den Bus.", "Ich habe keinen Bus."],
      correctIndex: 0, expectedTimeSec: 11,
      explanationDe: "„ir a + Infinitiv“ ist die einfache Zukunft: voy a tomar = ich werde nehmen." },
    { id: "pt_ti_002", block: "tenses", skill: "tenses", level: "A1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Estoy esperando un taxi.",
      options: ["Ich habe ein Taxi genommen.", "Ich warte gerade auf ein Taxi.", "Ich werde ein Taxi bestellen.", "Ich brauche kein Taxi."],
      correctIndex: 1, expectedTimeSec: 11,
      explanationDe: "„estoy + -ando/-iendo“ beschreibt, was gerade passiert (Verlaufsform)." },
    { id: "pt_ti_003", block: "tenses", skill: "tenses", level: "A2", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Llegué ayer.",
      options: ["Ich komme morgen an.", "Ich komme gerade an.", "Ich bin gestern angekommen.", "Ich möchte ankommen."],
      correctIndex: 2, expectedTimeSec: 11,
      explanationDe: "„ayer“ (gestern) signalisiert abgeschlossene Vergangenheit (Indefinido): llegué = ich kam an." },

    // --- Zusätzliche Stufen für den adaptiven Test (A0 ganz einfach, B1 fordernd) ---
    { id: "pt_un_a0a", block: "understanding", skill: "understanding", level: "A0", type: "mc",
      promptDe: "Was bedeutet dieses Wort?", questionEs: "Hola.",
      options: ["Hallo", "Danke", "Tschüss", "Bitte"], correctIndex: 0, expectedTimeSec: 6,
      explanationDe: "„Hola“ = Hallo." },
    { id: "pt_un_a0b", block: "understanding", skill: "understanding", level: "A0", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Agua, por favor.",
      options: ["Wasser, bitte.", "Brot, bitte.", "Die Rechnung, bitte.", "Hilfe, bitte."],
      correctIndex: 0, expectedTimeSec: 7, explanationDe: "„agua“ = Wasser." },
    { id: "pt_vo_a0a", block: "vocab", skill: "vocab", level: "A0", type: "mc",
      promptDe: "Was bedeutet „sí“?",
      options: ["ja", "nein", "vielleicht", "gut"], correctIndex: 0, expectedTimeSec: 6,
      explanationDe: "„sí“ = ja (mit Akzent), „si“ ohne Akzent = wenn." },
    { id: "pt_re_a0a", block: "reaction", skill: "reaction", level: "A0", type: "mc",
      promptDe: "Jemand sagt „Gracias.“ Was antwortest du?",
      options: ["De nada.", "Buenos días.", "No.", "Adiós."], correctIndex: 0, expectedTimeSec: 8,
      explanationDe: "„De nada“ = gern geschehen / keine Ursache." },

    { id: "pt_re_a2b", block: "reaction", skill: "reaction", level: "A2", type: "mc",
      promptDe: "Du fragst nach der Abfahrtszeit des Busses. Was passt?",
      options: ["¿Cuánto cuesta el bus?", "¿A qué hora sale el bus?", "¿Dónde está el bus?", "¿El bus es directo?"],
      correctIndex: 1, expectedTimeSec: 12, explanationDe: "„¿A qué hora sale…?“ = Um wie viel Uhr fährt … ab?" },

    { id: "pt_cj_b1a", block: "conjugation", skill: "conjugation", level: "B1", type: "mc",
      promptDe: "Im Restaurant willst du höflich sagen: Bringen Sie mir bitte die Rechnung. Was passt?",
      options: ["Tráigame la cuenta, por favor.", "Traigo la cuenta, por favor.", "Traes la cuenta, por favor.", "Trajiste la cuenta, por favor."],
      correctIndex: 0, expectedTimeSec: 15, explanationDe: "„Tráigame“ ist die höfliche Befehls-/Bitteform (usted) – praktisch, aber eher B1." },
    { id: "pt_re_b1a", block: "reaction", skill: "reaction", level: "B1", type: "mc",
      promptDe: "Du willst besonders höflich/vorsichtig fragen (Konditional): Könnten Sie mir helfen? Was passt?",
      options: ["¿Puede ayudarme?", "¿Podría ayudarme?", "¿Puedo ayudarme?", "¡Ayúdame!"],
      correctIndex: 1, expectedTimeSec: 15, explanationDe: "„¿Podría…?“ (Konditional) ist die besonders höfliche Bitte." },
    { id: "pt_ti_b1a", block: "tenses", skill: "tenses", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Ya he comido, gracias.",
      options: ["Ich esse gerade.", "Ich habe schon gegessen, danke.", "Ich werde essen.", "Ich aß gestern."],
      correctIndex: 1, expectedTimeSec: 14, explanationDe: "„he comido“ (pretérito perfecto) = ich habe gegessen; „ya“ = schon." },
    { id: "pt_un_b1a", block: "understanding", skill: "understanding", level: "B1", type: "mc",
      promptDe: "Was bedeutet dieser Satz?", questionEs: "Si tuviera tiempo, iría a la playa.",
      options: ["Wenn ich Zeit habe, gehe ich an den Strand.", "Wenn ich Zeit hätte, würde ich an den Strand gehen.", "Ich hatte Zeit und ging an den Strand.", "Ich werde Zeit haben für den Strand."],
      correctIndex: 1, expectedTimeSec: 16, explanationDe: "„si tuviera … iría“ (Subjuntivo + Konditional) = irreale Bedingung: hätte ich …, würde ich …" },

    // --- Block 6: Freie Antwort (kurz schreiben; akzent-/satzzeichentolerant) ---
    { id: "pt_fr_001", block: "free", skill: "free", level: "A1", type: "free",
      promptDe: "Schreib auf Spanisch: Die Rechnung, bitte.",
      accept: ["la cuenta por favor", "la cuenta"], expectedTimeSec: 14,
      explanationDe: "„La cuenta, por favor.“ = Die Rechnung, bitte. (Akzente/Satzzeichen egal)" },
    { id: "pt_fr_002", block: "free", skill: "free", level: "A2", type: "free",
      promptDe: "Schreib auf Spanisch die Frage: Wie viel kostet das?",
      accept: ["cuanto cuesta", "cuanto cuesta esto", "cuanto cuesta eso", "cuanto vale", "cuanto vale esto", "cuanto vale eso"], expectedTimeSec: 16,
      explanationDe: "„¿Cuánto cuesta?“ ist die Standardfrage nach dem Preis (Akzente/Satzzeichen egal)." },
  ];

  // Kommunikation vs. Grammatik (für das Profil + die Empfehlung).
  var COMM_SKILLS = { understanding: 1, reaction: 1, vocab: 1, free: 1 };
  var GRAMMAR_SKILLS = { conjugation: 1, tenses: 1 };

  // ---------- adaptiver Ablauf (Treppen-Logik) ----------
  // Schwierigkeit als Index 0..3. Richtig -> eine Stufe höher, falsch/„weiß nicht“
  // -> eine Stufe tiefer. So konvergiert der Test aufs Niveau (leicht↔schwer),
  // ohne dass jemand alle 33 Fragen durchmachen muss.
  var LEVEL_ORDER = ["A0", "A1", "A2", "B1"];          // Item-Schwierigkeit (= q.level, Treppe)
  var DISPLAY_LEVELS = ["A0", "A1", "A2", "B1-"];      // Anzeige-Niveau (B1- = „nahe B1“)
  var START_DIFFICULTY = 1;   // Start bei A1
  var MC_TARGET = 12;         // so viele Multiple-Choice-Fragen, dann die freien
  var GRAMMAR_CAP = 4;        // höchstens so viele Grammatik-Fragen (~30 % von 12)

  function levelIndex(name) { var i = LEVEL_ORDER.indexOf(name); return i < 0 ? 1 : i; }
  function nextDifficulty(difficulty, result) {
    var d = (typeof difficulty === "number") ? difficulty : START_DIFFICULTY;
    if (result === "correct") return Math.min(LEVEL_ORDER.length - 1, d + 1);
    return Math.max(0, d - 1); // wrong oder unknown -> leichter
  }

  // Nächste Multiple-Choice-Frage wählen: möglichst auf der Zielstufe, sonst die
  // nächstgelegene; Grammatik nur bis zum Deckel; bevorzugt den am wenigsten
  // gefragten Skill (gleichmäßige Abdeckung). DETERMINISTISCH (testbar).
  function pickNextMc(questions, askedIds, difficulty, grammarAsked, grammarCap) {
    askedIds = askedIds || [];
    var asked = {}; askedIds.forEach(function (id) { asked[id] = 1; });
    var skillCount = {};
    questions.forEach(function (q) { if (asked[q.id]) skillCount[q.skill] = (skillCount[q.skill] || 0) + 1; });
    var capped = grammarAsked >= (grammarCap == null ? GRAMMAR_CAP : grammarCap);
    var pool = questions.filter(function (q) {
      if (q.type !== "mc" || asked[q.id]) return false;
      if (capped && GRAMMAR_SKILLS[q.skill]) return false;
      return true;
    });
    if (!pool.length) return null;
    var target = (typeof difficulty === "number") ? difficulty : START_DIFFICULTY;
    // Stufen nach Nähe zur Zielstufe durchsuchen.
    var offsets = [0, 1, -1, 2, -2, 3, -3];
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

  function freeQuestions(questions) { return (questions || QUESTIONS).filter(function (q) { return q.type === "free"; }); }

  // ---------- IRT-artige Einschätzung + Zuverlässigkeit ----------
  // „Demonstriertes“ Niveau: die höchste Stufe, auf der mehr richtig als falsch
  // gelöst wurde (mind. eine richtige MC-Antwort). Belohnt es, schwere Items
  // richtig zu lösen – im adaptiven Test erreicht man hohe Stufen nur, wenn man
  // sich hochgearbeitet hat. So wird ein starker Lerner nicht durch ein paar
  // schwere Treffer-Fehlversuche unter Wert eingestuft.
  function demonstratedIndex(questions, answers) {
    questions = Array.isArray(questions) ? questions : [];
    answers = Array.isArray(answers) ? answers : [];
    var correctAt = [0, 0, 0, 0], wrongAt = [0, 0, 0, 0];
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      if (!q || q.type !== "mc") continue;
      var r = scoreAnswer(q, answers[i] || { isUnknown: true });
      var idx = levelIndex(q.level);
      if (r.result === "correct") correctAt[idx]++;
      else if (r.result === "wrong") wrongAt[idx]++;
    }
    var demo = 0;
    for (var L = 0; L < LEVEL_ORDER.length; L++) {
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
    return DISPLAY_LEVELS[Math.max(sIdx, demoIdx)]; // Anzeige-Niveau (höheres aus Score & demonstriert)
  }

  // Zuverlässigkeit des Ergebnisses (Anti-Cheating/Qualität, NICHT in den Score):
  //  "guessing" – viele falsche, kaum „weiß nicht“, sehr schnell -> wirkt geraten
  //  "fast"     – insgesamt sehr schnell -> evtl. weniger zuverlässig
  //  "manyUnknown" – über die Hälfte „weiß nicht“ -> ehrlich offen (Hinweis, keine Warnung)
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
    // Bevorzugt den App-Matcher (akzent-/satzzeichentolerant), mit lokalem Fallback
    // (damit Tests ohne matcher.js laufen).
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
    for (var i = 0; i < QUESTIONS.length; i++) if (QUESTIONS[i].id === id) return QUESTIONS[i];
    return null;
  }

  // Eine einzelne Antwort bewerten. answer: { isUnknown, selectedIndex, text, responseTimeMs }
  function scoreAnswer(q, answer) {
    answer = answer || {};
    if (answer.isUnknown) return { result: "unknown", isCorrect: false, timeConfidence: 0 };
    var isCorrect;
    if (q.type === "free") {
      var got = normalizeFree(answer.text || "");
      isCorrect = !!got && (q.accept || []).some(function (a) { return normalizeFree(a) === got; });
    } else {
      isCorrect = answer.selectedIndex === q.correctIndex;
    }
    return {
      result: isCorrect ? "correct" : "wrong",
      isCorrect: isCorrect,
      timeConfidence: isCorrect ? timeConfidence(answer.responseTimeMs, q.expectedTimeSec) : 0,
    };
  }

  // Score-Stufe als Index (0..3) – eine Quelle für Schwellen + Unknown-Override.
  function scoreIndex(finalScore, unknownRate) {
    if (finalScore < 0.30 || unknownRate > 0.55) return 0;
    if (finalScore < 0.55) return 1;
    if (finalScore < 0.78) return 2;
    return 3;
  }
  // Startlevel aus Gesamtscore + Unknown-Rate (Anzeige-Niveau, bewusst einfache V1-Formel).
  function levelFor(finalScore, unknownRate) {
    return DISPLAY_LEVELS[scoreIndex(finalScore, unknownRate)];
  }

  function tempoFor(medianMs) {
    if (!medianMs) return "medium";
    if (medianMs < 6000) return "fast";
    if (medianMs < 12000) return "medium";
    return "slow";
  }

  // Gesamtauswertung. answers: Array gleicher Länge/Reihenfolge wie questions,
  // jedes { isUnknown, selectedIndex, text, responseTimeMs }.
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
      // IRT-artig: Score-Level mit demonstriertem Niveau (richtig gelöste schwere Items) verschmolzen.
      level: levelBlended(finalScore, unknownRate, questions, answers),
    };
  }

  SC.placement = {
    QUESTIONS: QUESTIONS,
    COMM_SKILLS: COMM_SKILLS,
    GRAMMAR_SKILLS: GRAMMAR_SKILLS,
    LEVEL_ORDER: LEVEL_ORDER,
    START_DIFFICULTY: START_DIFFICULTY,
    MC_TARGET: MC_TARGET,
    GRAMMAR_CAP: GRAMMAR_CAP,
    // reine Funktionen (getestet)
    timeConfidence: timeConfidence,
    scoreAnswer: scoreAnswer,
    levelFor: levelFor,
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
  };
})();
