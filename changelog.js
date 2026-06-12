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
