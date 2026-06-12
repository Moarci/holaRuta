# HolaRuta — Ideen & Produkt-Vision

> **Datum:** 2026-06-12 · **Folgt auf:** [AUDIT.md](AUDIT.md), [RISIKO.md](RISIKO.md)
> **Fokus:** Produkt & Features (nicht Code-Hygiene – die ist in AUDIT/RISIKO erschöpfend behandelt).

HolaRuta ist technisch außergewöhnlich reif: zero-dependency Vanilla-JS-PWA, offline, 0 CRITICALs,
93 Tests grün. Der nächste Hebel ist nicht noch ein Bugfix, sondern **neue Lernwege**, die das
Kernversprechen schärfen: *Reise-Spanisch für echte Situationen*. Diese Datei hält sechs Ideen fest –
ehrlich nach Passung (offline, zero-dep, daumenbedienbar, reise-real) und Aufwand sortiert.

Die zentrale Beobachtung: Die App trainiert **Sprechen** (Flip) und **Schreiben** (Type) – aber nicht
**Hörverstehen**, obwohl genau das unterwegs am schwersten ist (eine schnell genuschelte Preisangabe
am Busbahnhof versteht man nicht vom Lesen). Und alle Bausteine dafür liegen längst bereit:
`speech.speak()` (LatAm-TTS, offline), der großzügige `matcher`, die SRS-Pipeline und die
Definiciones-Multiple-Choice-Mechanik.

---

## Umgesetzt in diesem Durchlauf (1–5)

### 1. 👂 Escuchar — Hörverständnis-Modus *(Flagship)*
Dritter Lernmodus neben Sprechen/Schreiben. Die Karte **spricht** die spanische Antwort vor (Text
verborgen), man tippt das Gehörte (Dictado), der Matcher prüft großzügig, dann Aufdecken + SRS-Bewertung.
- **Warum:** schließt die größte echte Reiselücke (gesprochenes LatAm-Spanisch verstehen).
- **Reuse:** `speech` + `matcher` (field `es`) + kompletter Study-/SRS-Pfad. Offline, zero-dep.
- **Graceful:** erscheint nur, wenn der Browser TTS kann.

### 2. 🆘 Spickzettel — Survival-Schnellzugriff
*Nicht-Lern*-Utility: ein Reiter zeigt die kritischsten Sätze (Notfall, Wegbeschreibung, Grundlagen,
Geld) sofort groß und auf Tipp vorgelesen – ohne SRS, ohne Umweg. Macht das „Survival"-Versprechen für
den echten Ernstfall buchstäblich.
- **Reuse:** `data.CARDS` + `speech`. **Aufwand:** klein–mittel.

### 3. 💵 Precios — Zahlen-/Preis-Hörtrainer
Fokus-Drill auf die schwerste Reise-Fähigkeit: gesprochene Preise verstehen. Die App sagt einen Betrag
auf Spanisch, man tippt die Ziffern. Generativ aus den 110 Zahlen-Karten, mit Score am Ende.
- **Reuse:** `speech` + `matcher` (field `de` = Ziffern). **Aufwand:** klein–mittel.

### 4. 🧱 Frases flexibles — Satzbaukasten
Generatives Slot-Filling im Multiple-Choice-Stil (wie Definiciones): ein Satzrahmen mit Lücke
(„Necesito ___"), man wählt den passenden Baustein. Lehrt **produktives** Satzbauen statt bloßem
Übersetzen – passt zur Phrasen-DNA der App.
- **Reuse:** Definiciones-Interaktion + neues, additives Datenmodul `frases.js`. **Aufwand:** mittel.

### 5. 🗺️ Ruta del día + Streckenkarte
- **Ruta del día:** eine kuratierte tägliche Mini-Runde (kategorienübergreifend fällige Karten) als ein
  Tap auf dem Lernen-Reiter – stärkt die schon halb gebaute Streak-/Habit-Schleife.
- **Streckenkarte:** der Lernfortschritt als Bus-Strecke visualisiert (gemeistert/am Lernen/neu als
  Haltestellen) auf der Statistik-Seite – on-brand „Ruta"-Metapher.
- **Reuse:** `srs`/`stats`/`gamestats`, reine UI. **Aufwand:** mittel.

---

## Bewusst zurückgestellt

### 6. 🎙️ Aussprache-Check *(nicht umgesetzt)*
Web Speech **Recognition** (es-419) würde gesprochene Antworten prüfen. Das ist reizvoll, bricht aber
das **Offline-Versprechen**: Spracherkennung läuft in den meisten Browsern serverseitig und ist
plattformabhängig unzuverlässig. Daher höchstens als optionale, graceful-degradierende Zusatzfähigkeit
denkbar – außerhalb dieses Durchlaufs.

---

## Leitplanken (gelten für jede Idee)
Offline & zero-dep · graceful degradation (TTS-Features verschwinden ohne Support) · A11y
(`aria-live`-Verdicts, ≥44px Tap-Targets, `esc()` für alle Interpolationen) · **die Wörterbasis bleibt
unangetastet** – neue Inhalte nur additiv (`frases.js`).
