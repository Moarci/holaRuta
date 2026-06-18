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
 * Antwort ("quiro" statt "quiero") zählt trotzdem – check() meldet sie über
 * das typo-Flag, damit die UI freundlich die korrekte Schreibweise zeigt.
 * Zusätzlich darf ein optionales Subjektpronomen ("yo quiero" = "quiero")
 * vorne stehen. Bewusst konservativ (kurze Wörter bleiben streng).
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

  // Wert des erwarteten Antwortfeldes einer Karte.
  // field: "es" (Spanisch) | "de" (Deutsch, Alias – hält Bestands-Tests grün)
  //        | "native" (Muttersprache = aktive UI-Sprache, via SC.i18n.nativeText).
  function fieldText(card, field) {
    if (field === "native") {
      const i18n = window.SC && window.SC.i18n;
      return i18n ? i18n.nativeText(card) : String(card.de);
    }
    return String(card[field]);
  }

  // Artikel-Toleranz fürs Englische: führendes the/a/an darf fehlen
  // ("the bus stop" == "bus stop"). Nur sinnvoll, wenn die Muttersprache gerade
  // Englisch ist – sonst (de/es) unverändert. Greift auf NORMALISIERTEN Text.
  function nativeIsEnglish(field) {
    const i18n = window.SC && window.SC.i18n;
    return field === "native" && i18n && i18n.getLang() === "en";
  }
  function stripArticle(norm) {
    return norm.replace(/^(?:the|a|an)\s+/, "");
  }

  // Anzeige-Antworten einer Karte (UNnormalisiert, z.B. fürs Vorlesen).
  // card.alt gilt nur für die spanische Antwort.
  function acceptedAnswers(card, field) {
    field = field || "es";
    if (field === "es" && Array.isArray(card.alt) && card.alt.length) return card.alt;
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
    const stripEn = nativeIsEnglish(field);
    const add = (s) => {
      const n = normalize(s);
      if (n && out.indexOf(n) === -1) out.push(n);
      // Englische Muttersprache: zusätzlich die artikellose Form akzeptieren.
      if (stripEn && n) {
        const ns = stripArticle(n);
        if (ns && ns !== n && out.indexOf(ns) === -1) out.push(ns);
      }
    };

    // card.alt zählt nur für Spanisch und ersetzt dort die generierten Varianten.
    if (field === "es" && Array.isArray(card.alt) && card.alt.length) {
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
  // ("quiro" statt "quiero"), soll zählen – aber als solche erkennbar bleiben
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
  // "quiro"="quiero" (Abweichung im Wortinneren) bleibt ein Tippfehler.
  function isWordFinalEdit(a, b) {
    const longer = a.length >= b.length ? a : b;
    const after = longer.length - commonSuffixLen(a, b); // erstes Zeichen des gemeinsamen Suffixes
    return after >= longer.length || longer.charCodeAt(after) === 32; // 32 = Leerzeichen
  }

  // Vergleicht eine NORMALISIERTE Eingabe gegen normalisierte Kandidaten.
  // -> "exact" (Treffer, evtl. nur ein optionales Pronomen zu viel – kein Hinweis),
  //    "typo"  (klarer Vertipper innerhalb des Budgets – zählt, aber mit Hinweis),
  //    ""      (kein Treffer).
  function classifyNorm(normInput, normCands) {
    if (!normInput) return "";
    const inVariants = [normInput];
    const noPron = dropLeadingPronoun(normInput);
    if (noPron !== normInput) inVariants.push(noPron);
    // 1) exakter Treffer (auch nach Weglassen eines optionalen Pronomens).
    for (let c = 0; c < normCands.length; c++)
      for (let v = 0; v < inVariants.length; v++)
        if (inVariants[v] === normCands[c]) return "exact";
    // 2) klarer Vertipper innerhalb des Budgets – aber NICHT, wenn die einzige
    //    Abweichung am Wortende sitzt (das ist eine Flexion, keine Verschreibung).
    for (let c = 0; c < normCands.length; c++) {
      const budget = typoBudget(normCands[c].length);
      if (!budget) continue;
      for (let v = 0; v < inVariants.length; v++) {
        const d = levenshtein(inVariants[v], normCands[c]);
        if (d > 0 && d <= budget && !(d === 1 && isWordFinalEdit(inVariants[v], normCands[c]))) return "typo";
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
    // Englische Muttersprache: auch die artikellose Eingabe gegen die Liste prüfen,
    // damit „the bus stop" und „bus stop" beidseitig passen.
    const tries = nativeIsEnglish(field) ? [norm, stripArticle(norm)] : [norm];
    let cls = "";
    for (let i = 0; i < tries.length && cls !== "exact"; i++) {
      const c = classifyNorm(tries[i], accepted);
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
