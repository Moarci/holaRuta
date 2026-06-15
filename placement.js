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
      promptDe: "An der Rezeption willst du höflich fragen, ob man dir helfen kann. Was passt?",
      options: ["¿Puedes ayudarme?", "¿Puedo ayudarme?", "¿Puede ayudarme?", "¿Pueden ayudarme?"],
      correctIndex: 2, expectedTimeSec: 12,
      explanationDe: "„¿Puede…?“ ist die höfliche usted-Form – für Rezeption, Polizei, Buspersonal." },
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

    // --- Block 6: Freie Antwort (kurz schreiben; akzent-/satzzeichentolerant) ---
    { id: "pt_fr_001", block: "free", skill: "free", level: "A1", type: "free",
      promptDe: "Schreib auf Spanisch: Danke.",
      accept: ["gracias", "muchas gracias", "mil gracias"], expectedTimeSec: 12,
      explanationDe: "„gracias“ = danke." },
    { id: "pt_fr_002", block: "free", skill: "free", level: "A2", type: "free",
      promptDe: "Schreib auf Spanisch die Frage: Wie viel kostet das?",
      accept: ["cuanto cuesta", "cuanto cuesta esto", "cuanto vale", "cuanto cuesta eso"], expectedTimeSec: 16,
      explanationDe: "„¿Cuánto cuesta?“ ist die Standardfrage nach dem Preis (Akzente/Satzzeichen egal)." },
  ];

  // Kommunikation vs. Grammatik (für das Profil + die Empfehlung).
  var COMM_SKILLS = { understanding: 1, reaction: 1, vocab: 1, free: 1 };
  var GRAMMAR_SKILLS = { conjugation: 1, tenses: 1 };

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

  // Startlevel aus Gesamtscore + Unknown-Rate (bewusst einfache V1-Formel).
  function levelFor(finalScore, unknownRate) {
    if (finalScore < 0.30 || unknownRate > 0.55) return "A0";
    if (finalScore < 0.55) return "A1";
    if (finalScore < 0.78) return "A2";
    return "B1-";
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

    return {
      total: total, correct: correct, wrong: wrong, unknown: unknown,
      accuracy: accuracy, confidence: confidence, finalScore: finalScore,
      unknownRate: unknownRate, wrongRate: wrongRate,
      medianMs: medianMs, tempo: tempoFor(medianMs),
      communicationAccuracy: communicationAccuracy, grammarAccuracy: grammarAccuracy,
      skillBreakdown: skillBreakdown, note: note,
      level: levelFor(finalScore, unknownRate),
    };
  }

  SC.placement = {
    QUESTIONS: QUESTIONS,
    COMM_SKILLS: COMM_SKILLS,
    GRAMMAR_SKILLS: GRAMMAR_SKILLS,
    // reine Funktionen (getestet)
    timeConfidence: timeConfidence,
    scoreAnswer: scoreAnswer,
    levelFor: levelFor,
    summarize: summarize,
    questionById: questionById,
    normalizeFree: normalizeFree,
  };
})();
