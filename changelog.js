/*
 * changelog.js  (SC.changelog) – Versionsstand & Änderungsverlauf.
 *
 * Eine einzige Quelle der Wahrheit für „welche Version ist das" und „was hat
 * sich geändert". Der Controller (app.js) merkt sich die zuletzt gesehene
 * Version im Speicher; weicht sie beim Start von VERSION ab, blendet die App
 * einen Hinweis ein, WAS neu ist und WIE man aktuell bleibt.
 *
 * Pflege: bei jeder veröffentlichten Änderung oben einen neuen Eintrag
 * ergänzen (NEUESTE zuerst) und – falls Dateien dazukamen/sich änderten –
 * CACHE_VERSION im service-worker.js hochzählen.
 *
 * Öffentlich (window.SC.changelog):
 *   VERSION         – aktuelle App-Version (= neuester entries-Eintrag)
 *   entries         – Verlauf, NEUESTE zuerst: { version, date, title, items[] }
 *   since(seen)     – Einträge, die neuer sind als die zuletzt gesehene Version
 */
(function () {
  "use strict";

  // NEUESTE zuerst. entries[0].version ist die aktuelle App-Version.
  const entries = [
    {
      version: "1.5.0",
      date: "2026-06-12",
      title: "Konjugieren: neuer Bereich + Erklärseite",
      items: [
        "Neuer Lernbereich „🔁 Konjugieren“ mit 42 Karten: die Präsens-Formen der wichtigsten Reiseverben (ir, estar, ser, tener, poder, querer, seguir, doblar …) – genau das, was man z. B. für Wegbeschreibungen braucht.",
        "Neu unter Entdecken: „Conjugación“ erklärt kurz und reisetauglich, wie spanische Verben gebeugt werden – Personen, die drei regelmäßigen Muster (-ar/-er/-ir), die wichtigsten unregelmäßigen Verben und ein Wegbeschreibungs-Dialog. Von dort geht es mit „Jetzt üben“ direkt in die neuen Karten.",
        "LatAm-korrekt: Tabellen mit ustedes statt vosotros.",
        "Neuer Ruta-Pass-Stempel „Verbo-Virtuose“ für 80 % gemeisterte Konjugieren-Karten.",
      ],
    },
    {
      version: "1.4.3",
      date: "2026-06-12",
      title: "Battle: fairer, mehr Inhalt, Stichrunde",
      items: [
        "15 neue Battle-Aufgaben (jetzt 45) und jede Aufgabe hat eine Schwierigkeits-Stufe (A1/A2/B1), die während der Runde angezeigt wird.",
        "Faire Verteilung: A und B bekommen pro Runden-Paar etwa gleich schwere Aufgaben, und die Schwierigkeit steigert sich über das Battle.",
        "Keine sofortigen Wiederholungen mehr: zuletzt gespielte Aufgaben werden über mehrere Battles gemieden.",
        "Optionale Spielernamen – sie erscheinen in Punktestand, am Zug und in der Auswertung.",
        "Stichrunde bei Gleichstand: zwei Extra-Runden küren doch noch einen Sieger.",
        "Die Szenen-Auswahl zeigt jetzt die echte Rundenzahl der gewählten Länge statt nur der Aufgabenzahl.",
      ],
    },
    {
      version: "1.4.2",
      date: "2026-06-12",
      title: "Battle klarer erklärt",
      items: [
        "Hostel Battle: Vor dem Start steht jetzt ein kurzer „So läuft ein Battle“-Ablauf in vier Schritten (zu zweit, antworten, bewerten, abwechseln) – aufklappbar und beim ersten Mal offen. Damit ist sofort klar, dass man zu zweit spielt, das Handy reihum weitergibt und der Mitspieler mit ✅/😬/❌ bewertet.",
      ],
    },
    {
      version: "1.4.1",
      date: "2026-06-12",
      title: "Modus klarer benannt",
      items: [
        "„Sprechen“ heißt jetzt „🃏 Karteikarte“ – ehrlicher, denn hier gibt es keine Prüfung: du denkst oder sagst die Antwort, drehst um und bewertest dich selbst (wie eine echte Karteikarte). Geprüft wird nur im Modus „Schreiben“.",
      ],
    },
    {
      version: "1.4.0",
      date: "2026-06-12",
      title: "Update-Hinweis",
      items: [
        "Neu: Nach einem Update zeigt HolaRuta beim nächsten Öffnen kurz, was sich geändert hat – und wie du immer die neueste Version bekommst.",
      ],
    },
    {
      version: "1.3.0",
      date: "2026-06-11",
      title: "Hostel Mode, Quiz & Farben",
      items: [
        "Hostel Mode: Battle & Rollenspiele zum Üben zu zweit.",
        "Definiciones: neues Zuordnen-Quiz.",
        "Farben mit echtem Farbfeld und 576 Karten in 20 Bereichen.",
      ],
    },
  ];

  const VERSION = entries.length ? entries[0].version : "0";

  // Alle Einträge, die NEUER sind als die zuletzt gesehene Version (NEUESTE
  // zuerst). Unbekannte/ältere Vorversion (nicht im Verlauf) -> nur das
  // Neueste zeigen, damit der Hinweis nie leer und nie überfrachtet ist.
  function since(seen) {
    if (!seen) return [];
    const idx = entries.findIndex((e) => e.version === seen);
    if (idx === -1) return entries.length ? [entries[0]] : [];
    return entries.slice(0, idx);
  }

  window.SC = window.SC || {};
  window.SC.changelog = { VERSION, entries, since };
})();
