# Übersetzungs-Glossar & Stil-Leitfaden (Deutsch → Englisch)

Verbindlich für alle Agents, die Inhalte oder UI-Strings ins Englische übersetzen.
Ziel: **konsistente Terminologie** über alle Dateien hinweg, damit `en:`-Felder und
`t()`-Strings zusammenpassen.

## Grundprinzip

HolaRuta lehrt **Spanisch** für Reisende. Bisher war die Muttersprache Deutsch,
jetzt zusätzlich Englisch. Übersetzt wird **Deutsch → Englisch**; das **spanische
Feld (`es:`) bleibt immer unverändert** – es ist das Lernziel, keine Übersetzung.

## Ton & Stil

- **Informell, freundlich, reisetauglich.** Direkte Anrede „you" (kein „one").
- **Britisches Englisch** als Standard (Datum `en-GB`, „timetable", „queue").
  Nicht britisch/amerikanisch mischen.
- Knapp wie das Deutsche – UI-Strings sind kurze Labels, keine Sätze.
- Emojis und Satzzeichen **wie im Original** übernehmen (🃏, →, ·, ¿¡).
- **Nicht übersetzen:** die Marke **HolaRuta** und die bewusst spanischen
  Feature-/Modus-Namen: `Diálogos`, `Regatear`, `Supervivencia`, `Definiciones`,
  `Precios al oído`, `El Cuerpo`, `Conjugación`, `Tiempos`, `Frases flexibles`,
  `Lista de compras`, `Países y culturas`, `Etiqueta de viaje`, `Ruta del día`,
  `Modo hostal`. Nur der **deutsche Begleittext** (Untertitel/Hinweise) wird übersetzt.

## Kernbegriffe (Reise-Spanisch-Domäne)

| Deutsch | Englisch (verbindlich) |
|---|---|
| Haltestelle | bus stop |
| Bushaltestelle / Busbahnhof | bus station |
| Abfahrt | departure |
| Ankunft | arrival |
| Fahrplan | timetable |
| Fahrkarte / Ticket | ticket |
| Wechselgeld | change |
| Rechnung | bill |
| Unterkunft | accommodation |
| Hostel | hostel |
| Zimmer | room |
| Schlange (anstehen) | queue |
| Notfall | emergency |
| Apotheke | pharmacy |
| Markt | market |
| feilschen / verhandeln | to haggle / to bargain |
| Karteikarte | flashcard |
| Lernrunde | study session |
| Stufe (A1/A2/B1) | level |
| Richtung (Lernrichtung) | direction |
| Wiederholung (fällig) | review (due) |
| Serie (Streak) | streak |
| Eigene Karten | your own cards |
| Einstellungen | settings |

## UI-Begriffe (für `i18n.strings.js`)

| Deutsch | Englisch |
|---|---|
| Lernen | Learn |
| Entdecken | Discover |
| Profil | Profile |
| Modus | Mode |
| Karteikarte / Schreiben / Hören | Flashcard / Writing / Listening |
| Sprechtempo (Langsam/Normal/Schnell) | Speech rate (Slow/Normal/Fast) |
| Überspringen | Skip |
| Nochmal | Again |
| Speichern / Abbrechen / Löschen | Save / Cancel / Delete |
| Daten exportieren / importieren | Export / Import data |
| Statistik | Statistics |
| Heute | Today |

## Pluralformen

Für Mengen **Funktionswerte** im Wörterbuch nutzen (siehe `common.dayStreak`,
`common.inNDays`), nicht „N day(s)". Beispiel EN: `n === 1 ? "day" : "days"`.

## Vorgehen pro Inhaltsdatei

1. Zu **jedem** `de:`-Feld ein `en:`-Feld direkt daneben hinzufügen (gleiche Reihenfolge).
2. `es:`, IDs, Koordinaten, Icons, Levels **unverändert** lassen.
3. Bei Sonderfeldern mit `…De`-Suffix (z. B. `situationDe`) ein `…En`-Pendant ergänzen.
4. Terminologie aus diesem Glossar verwenden; im Zweifel die spanische Seite als Kontext heranziehen.
