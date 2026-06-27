/*
 * matcher.js  (SC.matcher) – prüft getippte Antworten. REINE FUNKTIONEN.
 * Großzügig: ignoriert Groß-/Kleinschreibung, Akzente (á=a), Apostrophe und
 * Mehrfach-Leerzeichen und behandelt ß/ss als gleichwertig (Reise-Handys haben
 * oft keine ß-Taste). Slash und Gedankenstrich gelten als Wortgrenze.
 * Alles, was kein Buchstabe und keine Ziffer ist – Satzzeichen (¿¡?!.,;:),
 * Klammern, Währung ($/€), sonstige Symbole, Emojis, versehentlicher Tippmüll –
 * wird vor dem Vergleich entfernt. Antworten zählen also auch mit Fehleingaben.
 *
 * Bewusste Toleranz: die Akzent-Normalisierung (NFD) kollabiert auch ñ→n –
 * "ano" wird für "año" akzeptiert. Das ist gewollt: auf Tastaturen ohne ñ
 * wäre die Karte sonst unlösbar; die seltene echte Verwechslung (año/ano)
 * nehmen wir dafür in Kauf.
 *
 * Mehrere gültige Antworten: mit " / " getrennt (es UND de), explizit per
 * card.alt (nur Spanisch). Klammerzusätze sind OPTIONAL – siehe candidates().
 *
 * Tippfehler-Toleranz: eine inhaltlich richtige, aber leicht VERSCHRIEBENE
 * Antwort ("neccesito" statt "necesito") zählt trotzdem – check() meldet sie über
 * das typo-Flag, damit die UI freundlich die korrekte Schreibweise zeigt.
 * Zusätzlich darf ein optionales Subjektpronomen ("yo quiero" = "quiero")
 * vorne stehen. Bewusst konservativ: kurze Wörter (< 8 Zeichen, z. B. "quiero")
 * bleiben streng, dort wird kein Tippfehler-Budget gewährt.
 */
(function () {
  "use strict";

  function normalize(str) {
    return String(str)
      .toLowerCase()
      .replace(/ß/g, "ss")                   // ß ↔ ss gleichwertig
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")       // Akzente entfernen (á→a, ñ→n – bewusst, s.o.)
      .replace(/['’`´]/g, "")                // Apostrophe entfernen (geht's → gehts)
      .replace(/[\/\-–—]/g, " ")             // Slash, Binde-/Gedankenstrich als Wortgrenze
      .replace(/[^\p{L}\p{N} ]/gu, "")       // ALLES übrige (Satzzeichen, Währung, Symbole,
                                             // Emojis, Tippmüll) raus – siehe Kopfkommentar
      .replace(/\s+/g, " ")
      .trim();
  }

  // Aktiver Lern-Track (config.js → SC.track). Welche Sprache wird als ANTWORT
  // erwartet? Graceful, wenn SC.track nicht geladen ist (isolierte Matcher-Tests):
  // dann gilt das bisherige Axiom „gelernt wird Spanisch" -> "es".
  function learnLang() {
    const tr = (typeof window !== "undefined") && window.SC && window.SC.track;
    return (tr && typeof tr.learnLang === "function" && tr.learnLang()) || "es";
  }
  function uiLang() {
    const i18n = (typeof window !== "undefined") && window.SC && window.SC.i18n;
    return (i18n && i18n.getLang && i18n.getLang()) || "de";
  }
  // Sprache der erwarteten Antwort für ein Feld.
  //   "learn"  -> die zu lernende Sprache des Tracks (Reise: es, Locals: en)
  //   "native" -> die aktive UI-/Muttersprache (via SC.i18n)
  //   sonst (z.B. "es"/"de"/"en") -> das Feld selbst (Alias, hält Bestands-Tests grün).
  function answerLang(field) {
    if (field === "learn") return learnLang();
    if (field === "native") return uiLang();
    return field || "es";
  }
  // Gilt das Feld als die GELERNTE Antwort? Steuert die card.alt-Konvention:
  // "learn" immer, und das konkrete learnLang-Feld (Reise: "es", Locals: "en").
  function isLearnedField(field) {
    return field === "learn" || field === learnLang();
  }

  // Wert des erwarteten Antwortfeldes einer Karte.
  // field: "es"/"de"/"en" (direktes Feld) | "learn" (gelernte Antwort des Tracks)
  //        | "native" (Muttersprache = aktive UI-Sprache, via SC.i18n.nativeText).
  function fieldText(card, field) {
    if (field === "native") {
      const i18n = window.SC && window.SC.i18n;
      return i18n ? i18n.nativeText(card) : String(card.de);
    }
    if (field === "learn") return String(card[learnLang()] != null ? card[learnLang()] : "");
    return String(card[field]);
  }

  // Artikel-Toleranz fürs Englische: führendes the/a/an darf fehlen
  // ("the bus stop" == "bus stop"). Nur sinnvoll, wenn die erwartete ANTWORT
  // Englisch ist – egal ob als Muttersprache (Reise ES→native, UI=en) oder als
  // Lernsprache (Locals, learnLang=en). Greift auf NORMALISIERTEN Text.
  function answerIsEnglish(field) {
    return answerLang(field) === "en";
  }
  function stripArticle(norm) {
    return norm.replace(/^(?:the|a|an)\s+/, "");
  }

  // Anzeige-Antworten einer Karte (UNnormalisiert, z.B. fürs Vorlesen).
  // card.alt gilt nur für die GELERNTE Antwort (Reise: Spanisch, Locals: Englisch).
  function acceptedAnswers(card, field) {
    field = field || "es";
    if (isLearnedField(field) && Array.isArray(card.alt) && card.alt.length) return card.alt;
    return fieldText(card, field).split("/").map((s) => s.trim()).filter(Boolean);
  }

  // Kandidaten-Generierung: Liste akzeptierter NORMALISIERTER Eingaben.
  // Akzeptiert werden (für es ohne alt[] und für de gleichermaßen):
  //  - die wörtliche Volleingabe ("links / rechts" exakt wie angezeigt)
  //  - jede Slash-Alternative einzeln ("links", "rechts")
  //  - " – "/" — "-Teile (Preis-Karten: "$ 45.000 – Hostel-Nacht" → "45.000",
  //    "Hostel-Nacht")
  //  - Klammerzusätze sind optional: "1. (erster/erste)" → "1.", "erster",
  //    "erste" und die Volleingabe zählen alle.
  function candidates(card, field) {
    field = field || "es";
    const out = [];
    const stripEn = answerIsEnglish(field);
    const add = (s) => {
      const n = normalize(s);
      if (n && out.indexOf(n) === -1) out.push(n);
      // Englische Muttersprache: zusätzlich die artikellose Form akzeptieren.
      if (stripEn && n) {
        const ns = stripArticle(n);
        if (ns && ns !== n && out.indexOf(ns) === -1) out.push(ns);
      }
    };

    // card.alt zählt nur für die gelernte Antwort und ersetzt dort die Varianten.
    if (isLearnedField(field) && Array.isArray(card.alt) && card.alt.length) {
      card.alt.forEach(add);
      return out;
    }

    const raw = fieldText(card, field);
    // Varianten-Basis: Original, ohne Klammerzusätze, jeder Klammerinhalt einzeln.
    const variants = [raw, raw.replace(/\([^)]*\)/g, " ")];
    const parens = /\(([^)]*)\)/g;
    let m;
    while ((m = parens.exec(raw)) !== null) variants.push(m[1]);

    variants.forEach((v) => {
      add(v);                                 // Volleingabe der Variante
      v.split(/\/|\s[–—]\s/).forEach(add);    // jede Alternative einzeln
    });
    return out;
  }

  // ---------- Tippfehler-Toleranz ----------
  // Ziel: eine inhaltlich richtige Antwort, die nur leicht VERSCHRIEBEN ist
  // ("neccesito" statt "necesito"), soll zählen – aber als solche erkennbar bleiben
  // (typo-Flag), damit die UI freundlich auf die korrekte Schreibweise hinweist.
  // Bewusst KONSERVATIV: kurze Wörter bleiben streng (sonst kippt gato↔pato).

  // Damerau-Levenshtein (Optimal String Alignment): wie Levenshtein, aber eine
  // Vertauschung zweier BENACHBARTER Zeichen kostet EINEN statt zwei Fehler – der
  // häufigste Handy-Tippfehler ("gtao"→"gato", "necestio"→"necesito"). OSA-Variante
  // mit zwei Vorgängerzeilen (kein zusätzlicher Alphabet-Speicher nötig).
  function levenshtein(a, b) {
    a = String(a); b = String(b);
    if (a === b) return 0;
    const al = a.length, bl = b.length;
    if (!al) return bl;
    if (!bl) return al;
    let prevPrev = null;
    let prev = new Array(bl + 1);
    for (let j = 0; j <= bl; j++) prev[j] = j;
    for (let i = 1; i <= al; i++) {
      const cur = new Array(bl + 1);
      cur[0] = i;
      const ca = a.charCodeAt(i - 1);
      const caPrev = i > 1 ? a.charCodeAt(i - 2) : -1;
      for (let j = 1; j <= bl; j++) {
        const cb = b.charCodeAt(j - 1);
        const cost = ca === cb ? 0 : 1;
        let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        // benachbarte Vertauschung: a[i-1]a[i-2] entspricht b[j-2]b[j-1]
        if (i > 1 && j > 1 && ca === b.charCodeAt(j - 2) && caPrev === cb) {
          v = Math.min(v, prevPrev[j - 2] + 1);
        }
        cur[j] = v;
      }
      prevPrev = prev;
      prev = cur;
    }
    return prev[bl];
  }

  // Wie viele Vertipper bei einer erwarteten Antwort dieser Länge durchgehen.
  // Kurze Wörter (<8 Zeichen) bleiben STRENG: ein einzelner Buchstabe ist im
  // Spanischen dort meist eine echte Flexion (médico↔médica, quiero↔quiere),
  // kein Vertipper. Erst längere Wörter/Sätze bekommen Toleranz (1), ganze
  // Sätze zwei – da ist ein zufälliger Tipper viel wahrscheinlicher als ein
  // bedeutungsänderndes Minimalpaar.
  function typoBudget(len) {
    if (len < 8) return 0;
    if (len < 14) return 1;
    return 2;
  }

  // Führende, in LatAm grammatisch weglassbare Subjektpronomen. Bewusst OHNE die
  // mit Artikel/Possessiv kollidierenden Formen "el"/"tu" – die würden sonst
  // Nomen-Antworten ("el bus", "tu casa") fälschlich verkürzen.
  const LEADING_PRONOUN = /^(?:yo|vos|usted|ustedes|ella|ellos|ellas|nosotros|nosotras)\s+/;
  function dropLeadingPronoun(norm) {
    const s = norm.replace(LEADING_PRONOUN, "");
    return s.length ? s : norm;
  }

  // Länge des gemeinsamen Wort-Endes (von hinten gezählt).
  function commonSuffixLen(a, b) {
    let i = a.length - 1, j = b.length - 1, n = 0;
    while (i >= 0 && j >= 0 && a.charCodeAt(i) === b.charCodeAt(j)) { i--; j--; n++; }
    return n;
  }
  // Liegt der EINE Unterschied (nur bei Distanz 1 sinnvoll) am Wortende? Dann ist
  // es im Spanischen meist eine echte Flexion (Genus -o/-a, Person, Plural -s) –
  // ein BEDEUTUNGSunterschied, kein Vertipper: direkt nach der Abweichung steht
  // ein Leerzeichen oder das String-Ende. So zählt "necesita"≠"necesito", aber
  // "neccesito"="necesito" (Abweichung im Wortinneren) bleibt ein Tippfehler.
  function isWordFinalEdit(a, b) {
    const longer = a.length >= b.length ? a : b;
    const after = longer.length - commonSuffixLen(a, b); // Zeichen direkt NACH der Abweichung
    // (1) Abweichung am Wortende (Leerzeichen oder String-Ende danach).
    if (after >= longer.length || longer.charCodeAt(after) === 32) return true; // 32 = Leerzeichen
    // (2) Genus im Plural: ein a/o-Vokal direkt vor einem wort-finalen "s"
    //     (buenas↔buenos, amigas↔amigos, últimas↔últimos) ist ebenfalls eine Flexion,
    //     kein Vertipper. Eng gehalten (nur a/o vor "s" am Tokenende), damit echte
    //     Wort-INNEN-Tippfehler wie "neccesito"↔"necesito" weiter als Tippfehler zählen.
    //     Bewusst in Kauf genommen: die nosotros-Endung "-mos" (doblamas↔doblamos) hat
    //     dieselbe a/o-vor-s-Form und wird mit-abgelehnt. Eine Ausnahme für "-mos" ist
    //     nicht möglich, ohne die häufigen -mo-Genus-Adjektive (último/próximo/supremo)
    //     wieder fälschlich durchzulassen – sie sind schreibgleich. Trade-off netto
    //     positiv (genau ein erreichbares Verb betroffen: doblamos).
    if (a.length === b.length && longer.charCodeAt(after) === 115) { // 115 = 's'
      const cA = a.charCodeAt(after - 1), cB = b.charCodeAt(after - 1);
      const genderVowel = (c) => c === 97 || c === 111; // 'a' | 'o'
      const boundaryAfterS = after + 1 >= longer.length || longer.charCodeAt(after + 1) === 32;
      if (genderVowel(cA) && genderVowel(cB) && boundaryAfterS) return true;
    }
    return false;
  }

  // Vergleicht eine NORMALISIERTE Eingabe gegen normalisierte Kandidaten.
  // -> "exact" (Treffer, evtl. nur ein optionales Pronomen zu viel – kein Hinweis),
  //    "typo"  (klarer Vertipper innerhalb des Budgets – zählt, aber mit Hinweis),
  //    ""      (kein Treffer).
  // ansLang (optional, Default "es"): Sprache der erwarteten Antwort. Die
  // spanischen Flexions-Sonderregeln (führendes Subjektpronomen optional;
  // wort-finale Abweichung = Flexion statt Vertipper) gelten NUR fürs Spanische.
  // Für Englisch als Lernsprache wären sie falsch (buses↔busses, color↔colour,
  // fehlendes Plural-"s" sind genau die typischen Tippfehler).
  function classifyNorm(normInput, normCands, ansLang) {
    if (!normInput) return "";
    const isEs = (ansLang || "es") === "es";
    const inVariants = [normInput];
    if (isEs) {
      const noPron = dropLeadingPronoun(normInput);
      if (noPron !== normInput) inVariants.push(noPron);
    }
    // 1) exakter Treffer (auch nach Weglassen eines optionalen Pronomens, nur es).
    for (let c = 0; c < normCands.length; c++)
      for (let v = 0; v < inVariants.length; v++)
        if (inVariants[v] === normCands[c]) return "exact";
    // 2) klarer Vertipper innerhalb des Budgets – im Spanischen aber NICHT, wenn die
    //    einzige Abweichung am Wortende sitzt (das ist eine Flexion, kein Vertipper).
    for (let c = 0; c < normCands.length; c++) {
      const budget = typoBudget(normCands[c].length);
      if (!budget) continue;
      for (let v = 0; v < inVariants.length; v++) {
        const d = levenshtein(inVariants[v], normCands[c]);
        if (d > 0 && d <= budget && !(isEs && d === 1 && isWordFinalEdit(inVariants[v], normCands[c]))) return "typo";
      }
    }
    return "";
  }

  // Prüft Eingabe gegen eine Karte. -> { correct, typo, answers }
  // field bestimmt die Zielsprache der erwarteten Antwort (siehe oben).
  // typo=true: zählt als richtig, ist aber nur leicht verschrieben (UI-Hinweis).
  function check(input, card, field) {
    const norm = normalize(input);
    const accepted = candidates(card, field);
    const ans = answerLang(field);
    // Englische Antwort: auch die artikellose Eingabe gegen die Liste prüfen,
    // damit „the bus stop" und „bus stop" beidseitig passen.
    const tries = answerIsEnglish(field) ? [norm, stripArticle(norm)] : [norm];
    let cls = "";
    for (let i = 0; i < tries.length && cls !== "exact"; i++) {
      const c = classifyNorm(tries[i], accepted, ans);
      if (c === "exact") cls = "exact";
      else if (c === "typo") cls = "typo"; // exakt hätte weiterhin Vorrang
    }
    return { correct: cls !== "", typo: cls === "typo", answers: acceptedAnswers(card, field) };
  }

  // Bequemer Freitext-Check gegen eine Liste roher Musterlösungen (z.B. Ruta-Check
  // accept[]). -> { correct, typo }. Hält die Tippfehler-Schwellen zentral hier.
  function matchFree(input, acceptList) {
    const cands = (acceptList || []).map(normalize).filter(Boolean);
    const cls = classifyNorm(normalize(input), cands);
    return { correct: cls !== "", typo: cls === "typo" };
  }

  window.SC = window.SC || {};
  window.SC.matcher = { normalize, acceptedAnswers, candidates, check, levenshtein, classifyNorm, matchFree };
})();
