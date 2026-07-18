# HelloAbroad – DE-EN Reiseenglisch-Ableger von HolaRuta

**Status:** Implementiert auf Branch `feat/hello-abroad` (alle 7 Tasks aus
`docs/superpowers/plans/2026-07-18-helloabroad-implementation.md` abgeschlossen
und subagent-review-geprüft, `npm test` grün (884/884), manuelle DoD-Verifikation
per Playwright durchgeführt). Abweichungen vom ursprünglichen Plan, gefunden
während der Implementierung: (1) die geplante es-en-Legacy-Migration in
`store.js` wurde entfernt (Cross-Track-Datenvermischungsrisiko bei
Editions-Wechsel auf demselben Origin) – statt eines fehleranfälligen
Copy-Forward sehen bestehende es-en-Nutzer ab dem ersten Laden nach diesem Fix
leere Fortschrittsdaten unter dem neuen Namespace – ihre alten Daten bleiben
unter dem alten, unpräfixierten Schlüssel liegen, werden aber von der App
nicht mehr gelesen; (2) `categoryAllowlist` musste zusätzlich Stats-/Badges-Aggregate
(`stats.overview`, `badges.buildMetrics`) filtern, nicht nur Home/Suche/Editor;
(3) PWA-Manifest/Icons wurden zusätzlich in `service-worker.js`s Offline-Precache
aufgenommen; (4) eine neue Karte (`fh17`) musste wegen Inhalts-Dopplung mit
`g11` ersetzt werden. Bereit für PR/Merge nach main.

## Ziel

Ein Ableger von HolaRuta für Zielgruppe 50-60+ (initial: der Vater des Nutzers), der
Reiseenglisch auffrischt – gleiche Lernmechanik wie HolaRuta (Spaced Repetition,
Sprechen-/Schreiben-Modus, Stufenfilter, Statistik, eigene Karten, Sprachausgabe),
nur Sprachrichtung Deutsch→Englisch statt Deutsch→Spanisch. Eigene erreichbare URL,
eigene installierbare PWA-Identität.

## MVP-Umfang: 10 Reisebereiche

1. Begrüßung und einfacher Smalltalk
2. Flughafen und Gepäck
3. Einreise und Passkontrolle
4. Hotel und Unterkunft
5. Restaurant und Café
6. Einkaufen und Bezahlen
7. Taxi, Bus und Wegbeschreibung
8. Mietwagen und Tankstelle
9. Arzt, Apotheke und Beschwerden
10. Probleme und Notfälle

## Architektur: Edition statt Fork

HelloAbroad ist eine neue **Edition** von HolaRuta im selben Repo – kein Fork, kein
neues Repo. Begründung: die Lernmechanik ist bereits über `SC.track` (config.js)
sauber von der konkreten Sprachrichtung entkoppelt, und **100 % der 2293 Karten in
data.js haben bereits ein befülltes `en`-Feld** (verifiziert per Codebase-Scan).
Matcher, App-State, Speech, Stats, eigene Karten, Sharepic brauchen dadurch **keine
Logikänderung**.

### Neuer Lern-Track `de-en`

In `config.js` (`TRACKS`-Objekt, analog zu bestehendem `de-es`/`es-en`):

```js
"de-en": { id: "de-en", learnLang: "en", nativeLangs: ["de"], cardNativeLang: null, ttsLocale: "en-US" }
```

- `cardNativeLang: null` → Frage folgt der UI-Sprache (Deutsch), wie beim
  Standard-Track – kein neues Verhalten nötig.
- `learnLang: "en"` → Antwortfeld ist `card.en` (bereits vorhanden).
- `ttsLocale: "en-US"` → gleiche Stimmen-Pipeline wie der bestehende `es-en`-Track
  (dort bereits `en-US` im Einsatz), kein neuer Code in `speech.js`.

### Neue Edition in `editions/registry.js`

```js
"hello-abroad": {
  edition: "hello-abroad",
  brandName: "HelloAbroad",           // KEIN "HolaRuta"-Bezug sichtbar
  accent: { brand: "#2F6B70", brandInk: "#1F4A4E" }, // wiederverwendete venue-en-Petrol-Palette
  partner: null,
  logo: null,
  defaultDestination: null,
  appUrl: "https://moarci.github.io/holaRuta/hello-abroad/",
  track: "de-en",
  taskTab: false,
  teacherTab: false,
  sync: null,                          // aus, wie Standard-HolaRuta (kein Cloud-Zwang im MVP)
  categoryAllowlist: [                  // NEU: Kategorie-Filter (siehe unten)
    "basics", "talk", "flughafen", "grenze", "hotel", "hostel",
    "essen", "trinken", "compras", "dinero", "banco",
    "verkehr", "rumbo", "auto", "farmacia", "notfall"
  ],
}
```

### Speicher-Trennung (kritischer Fix, durch Review gefunden)

HelloAbroad und HolaRuta laufen unter derselben Origin
(`moarci.github.io/holaRuta/*`) – `localStorage`/`IndexedDB` sind **origin-**,
nicht pfadgebunden. Die bestehenden Storage-Keys (`spanischcard.progress.v2`,
`.settings.v1`, `.usercards.v1`, `.gamestats.v1`, IndexedDB-Name
`holaruta-backup`, siehe `store.js:9-25`) sind fest verdrahtet und tragen
keinen Edition-/Track-Diskriminator. Da HelloAbroad **dieselben Karten-IDs**
nutzt (nur `learnLang` unterscheidet sich), würde ein Nutzer, der beide
Editionen auf demselben Gerät installiert, SRS-Fortschritt teilen: eine als
„gewusst" markierte Karte in HolaRuta (Spanisch) würde fälschlich auch in
HelloAbroad (Englisch) als gelernt gelten, und umgekehrt.

**Fix:** Storage-Keys um den Track als Namespace-Präfix erweitern, sobald
`SC.track.id() !== "de-es"` (Rückwärtskompatibilität: bestehende HolaRuta-Keys
ohne Präfix bleiben für den Standard-Track unangetastet, keine Migration für
bestehende Nutzer nötig). Betrifft `store.js` (Progress, Settings, User-Cards,
Game-Stats) und die IndexedDB-Backup-Datenbank. Gilt analog auch für den
bereits produktiven `es-en`-Track (dort bislang offenbar unkritisch, weil
`ingles-pro`/`venue-en` bisher nicht typischerweise auf demselben Gerät wie
die Standard-App genutzt werden – wird hier aber erstmals zum echten Problem,
da HelloAbroad bewusst als eigenständige App an dieselbe Zielgruppe geht, die
ggf. auch HolaRuta nutzt). Dieser Fix ist **Voraussetzung**, kein Nice-to-have.

### Neuer Config-Mechanismus: `categoryAllowlist`

HolaRuta hat aktuell 71 Kategorien (Zahlen, 27 Länder-/Destinationspakete,
Grammatik-Sets, Jerga, Flirten etc.) – für HelloAbroad sollen nur die den 10
MVP-Themen zugeordneten Kategorien sichtbar sein. Neues optionales Config-Feld
`categoryAllowlist: string[] | null` (`null` = Standardverhalten, alle Kategorien
sichtbar – bestehende Editionen bleiben unverändert).

**Korrigierter Befund aus dem Review:** Es gibt aktuell **keinen** zentralen
Rendering-Filter, den man einfach umbiegen könnte – `homeVM()` (app.js:558-560)
filtert Kategorien nur über das hartcodierte `isLocals()` (Track-ID `"es-en"`,
app.js:326), nicht generisch. `categoryAllowlist` muss deshalb an mehreren
Stellen greifen, nicht nur „beim Rendern":

1. `homeVM()` (app.js:558-560) – Kategorien-Kacheln im Lernen-Tab.
2. Such-Indizierung (app.js:6122) – sonst tauchen ausgeblendete Kategorien
   trotzdem in der Suche auf.
3. Eigene-Karten-Editor Kategorie-Auswahl (ui.js:2247) – sonst kann man Karten
   in unsichtbaren Kategorien anlegen.
4. Stats/Fortschritt (`scopeCards("all")`, app.js:582, 3029) – sonst zählen
   Badges/Streaks/Gesamtfortschritt Karten außerhalb der 16 erlaubten
   Kategorien mit.

Bestehende Gruppierung (`group`-Feld je Kategorie: basics/food/travel/people)
bleibt unverändert. Die neue Kategorie `flughafen` wird der Gruppe `"travel"`
zugeordnet (konsistent mit `hotel`, `verkehr`, `auto`, `farmacia`, `notfall`).

**Themen→Kategorien-Zuordnung:**

| Thema | Kategorie(n) | Status |
|---|---|---|
| Begrüßung/Smalltalk | `basics`, `talk` | bestehend |
| Flughafen & Gepäck | `flughafen` | **neu, ~15-20 Karten** |
| Einreise & Passkontrolle | `grenze` | bestehend |
| Hotel & Unterkunft | `hotel`, `hostel` | bestehend |
| Restaurant & Café | `essen`, `trinken` | bestehend |
| Einkaufen & Bezahlen | `compras`, `dinero`, `banco` | bestehend |
| Taxi/Bus & Wegbeschreibung | `verkehr`, `rumbo` | bestehend |
| Mietwagen & Tankstelle | `auto` | bestehend (enthält bereits Tankstellen-Vokabular) |
| Arzt/Apotheke & Beschwerden | `farmacia` | bestehend |
| Probleme & Notfälle | `notfall` | bestehend |

### Neue Kategorie „flughafen"

**Keine echte Content-Lücke mehr (Review-Fund):** `logistica.js:265-298`
enthält bereits eine fertige Sektion `id: "equipaje"` („Airport & lost
luggage") mit ES/DE/EN-Phrasen zu Gepäck, Handgepäck, Gepäckschein/Tracker
etc. – diese wird nach `data.js` `CATEGORIES`/`CARDS` **portiert und ergänzt**
statt komplett neu geschrieben. Zielumfang: 15-20 Karten (Schema `{id,
cat:"flughafen", lvl, de, en, es?, tip?}`, Gruppe `"travel"`) für: Einchecken,
Bordkarte, Gate, Gepäck aufgeben/Handgepäck (aus `logistica.js` übernehmbar),
Verspätung, Anschlussflug verpasst, Gepäck verloren/beschädigt,
Sicherheitskontrolle, Flüssigkeiten-Regel, Zoll/Verzollung, Ausgang/Abholung.
`es`-Feld wird mitgepflegt (Datenkonsistenz mit Rest von data.js, und weil die
Kategorie – wie jede andere in `data.js` – bei `categoryAllowlist: null` auch
in HolaRuta selbst (Track `de-es`) sichtbar wird; das ist **gewollt**: die
neue Kategorie bereichert nebenbei auch die bestehende App, kein isolierter
Datensatz nur für HelloAbroad).

### Ausblendung LatAm-Kultur-Features / Einblendung Kern-Features

**Korrigierter Befund aus dem Review:** Das bestehende `tracks`-Gate im
`FEATURES`-Array (`ui.js:139` ff., nicht `app.js`) verhält sich anders als in
der ersten Fassung dieser Spec angenommen. Fehlt das `tracks`-Feld, gilt der
Default `["de-es"]` (ui.js:1095) – **LatAm-Kultur-Features (Jerga, Flirten,
Nachtleben, Länderkunde, Tanzen, Hostel-Banner, Musik/Feiern-Spiele) sind für
`de-en` dadurch bereits automatisch unsichtbar, ohne jede Code-Änderung.**

Das eigentliche Problem ist umgekehrt: Kern-Features, die man in HelloAbroad
weiterhin braucht, tragen ein **explizites** `tracks: ["de-es", "es-en"]`
(ui.js:6064-6075) – ohne `"de-en"` wäre der „Entdecken"-Tab für HelloAbroad
komplett leer. Diese Liste muss um `"de-en"` **erweitert** werden:

- `open-favorites` (Mi léxico / Meine Vokabeln)
- `open-spickzettel` (Supervivencia / Spickzettel)
- `open-quiz-setup` (Definiciones / Quiz)
- `open-endless` (Vocabulario sin fin / Endlos-Vokabeltraining)
- `open-frases` (Frases flexibles, sofern für HelloAbroad relevant – prüfen)
- `open-precios` (Precios al oído / Preise per Gehör, sofern Sprachausgabe
  relevant)
- `open-compras` (Lista de compras / Einkaufsliste)
- weitere Einträge im `FEATURES`-Array einzeln gegen die 10 MVP-Themen prüfen
  (nicht pauschal alle mit `es-en` übernehmen – z.B. `open-dialogos`/
  `open-cuerpo`/`open-yesto` sind Kandidaten zum Weglassen, da sie eher
  Reise-Spanisch-spezifisch entstanden sind; endgültige Liste im
  Implementierungsplan).

## Aussprache-Tipps: bewusste MVP-Lücke

Bestehende `tip`/`tipEn`-Felder erklären die **spanische** Aussprache (auf
Deutsch bzw. Englisch erklärt) – für `de-en` unbrauchbar, da eine komplett neue
Content-Dimension nötig wäre (englische Aussprache, auf Deutsch erklärt, z.B.
„Hello" → „heh-LOH"). **Für den MVP werden keine neuen Aussprache-Tipps
verfasst.** Leere `tip`-Felder werden von der UI bereits heute sauber
übersprungen (kein Code-Änderung nötig). Spätere Ausbaustufe, nicht MVP.

## Reise-Kontext (Beispielsätze): nicht portiert

Das „Reise-Kontext"-Feature (`context.js`/`contextdata.js`) ist durchgehend
Spanisch-Ziel-Content (Zielsatz ist immer Spanisch, auch die
`sentenceEn`/`sentenceDe`-Varianten sind nur Übersetzungen der Erklärung, nicht
englische Zielsätze). Für HelloAbroad **nicht portiert** – ist kein
MVP-Kernfeature, Karten ohne Kontext-Eintrag funktionieren bereits heute
identisch (viele bestehende Karten haben ebenfalls keinen Kontext).

## Branding & Sprache

- **Name:** „HelloAbroad" – kein sichtbarer HolaRuta-Bezug (brandName, Tab-Titel,
  PWA-Installname).
- **Akzentfarbe:** ruhiges Petrol/Blau, `#2F6B70` / `#1F4A4E` (identisch zur
  bereits im Einsatz befindlichen `venue-en`-Palette – keine neue
  Farbentscheidung/kein neues Kontrast-Audit nötig).
- **Englisch-Variante:** en-US (Stimme + ggf. Schreibweise), konsistent mit dem
  bereits produktiven `es-en`-Track.
- **UI-Sprache:** Deutsch (Standard, bereits vollständig vorhanden in `i18n.js`
  – kein neues UI-Sprachpaket nötig).
- **A11y:** unverändert HolaRuta-Standard (WCAG-AA-Kontrast, 44px-Tap-Targets,
  Fokus-Management) – keine zusätzlichen 50-60+-spezifischen Anpassungen im MVP.

## Eigene installierbare PWA

**Vereinfachter Ansatz nach Review-Fund:** `boot.js:19-35` tauscht den
`<link rel="manifest">`-href bereits **dynamisch zur Laufzeit** aus (heute:
Theme-abhängig zwischen `manifest.webmanifest`/`manifest-dark.webmanifest`).
Statt eines komplett separaten Build-Outputs (ursprünglicher Plan – hätte
zusätzlich Service-Worker-Scope/Cache-Namespace-Fragen zwischen `/holaRuta/`
und `/holaRuta/hello-abroad/` aufgeworfen, siehe Architektur-Review) wird
dasselbe Muster um eine dritte Bedingung erweitert: `edition ===
"hello-abroad"` → `manifest-hello-abroad.webmanifest`. Das funktioniert mit
dem bestehenden Query-Param-Mechanismus (`?edition=hello-abroad`) und
**vermeidet die zweite-Service-Worker-Problematik komplett** (ein einziger
Service Worker wie bei ecos/weroad/ingles-pro heute schon).

- Neues `manifest-hello-abroad.webmanifest` (eigener `name`/`short_name`
  „HelloAbroad", eigene `id` – wichtig, damit Browser die Installation als
  eigenständige App-Identität führen, nicht als zweite Instanz von HolaRuta –,
  eigene `theme_color`/`background_color` passend zur Petrol-Akzentfarbe,
  eigenes Icon-Set).
- Neues Icon-Set (analog `icon-180.png`/`icon-192.png`/`icon-512*.png`),
  Motiv/Farbe passend zur Petrol-Akzentfarbe – eigener Implementierungs-Slice
  (visuell/kreativ, anderes Abnahmekriterium als die übrigen Code-Änderungen).
- Eigene erreichbare URL weiterhin über einen Redirect-Ordner
  `hello-abroad/index.html` (identisches Muster zu `en/index.html`,
  Meta-Refresh auf `../?edition=hello-abroad`), **kein** separater
  Edition-Build nötig.
- `boot.js` muss die Manifest-Umschaltung **vor** dem für die PWA-Installation
  relevanten Zeitpunkt anwenden (wie heute schon beim Theme-Fall – gleiches
  bewährtes Timing, kein neues Risiko).

## Hosting/URL

Pfad auf dem bestehenden GitHub-Pages-Deploy:
`moarci.github.io/holaRuta/hello-abroad/` – kein neues Repo, kein Warten auf
die noch offene HolaRuta-Cloud-Domain (siehe `LAUNCH.md`, aktuell blockiert).
Sofort live mit dem bestehenden Deploy-Workflow (`pages.yml`), keine
Infrastrukturänderung nötig.

## Testing

- Bestehender `npm test` (Datenintegrität: keine doppelten IDs, alle `cat`/`lvl`
  referenzieren existierende `CATEGORIES`/`LEVELS`) deckt die neue Kategorie
  automatisch ab, sobald sie in `data.js` ergänzt ist.
- Neuer Test-Fall für den `de-en`-Track: `matcher.check` liefert bei
  `learnLang()==="en"` korrekt gegen `card.en` (kein Spanisch-Nachsichts-Bonus
  greift fälschlich – bereits durch `ansLang`-Gate in matcher.js sichergestellt,
  Test dient als Regressionsschutz).
- **Neuer Test-Fall (Review-Fund): Storage-Key-Trennung.** Verifizieren, dass
  `store.js` für Track `de-en` (und `es-en`) einen anderen Storage-Key/
  IndexedDB-Namespace nutzt als `de-es`, und dass bestehende `de-es`-Keys
  unverändert bleiben (Rückwärtskompatibilität, keine Migration nötig).
- Manuelle Verifikation im Browser: Lernen-Tab zeigt nur die erlaubten
  Kategorien (Home, Suche, Editor, Stats – alle vier Stellen), Entdecken-Tab
  zeigt die geprüfte Kern-Feature-Liste (nicht leer, keine LatAm-Kacheln),
  PWA-Installation zeigt „HelloAbroad"-Icon/Name als eigenständige App neben
  einer ggf. installierten HolaRuta-App, Fortschritt in HelloAbroad bleibt
  unabhängig von parallel installiertem HolaRuta auf demselben Gerät.

## Definition of Done

- [ ] Track `de-en` + Edition `hello-abroad` in `config.js`/`editions/registry.js`.
- [ ] Storage-Key-Namespace-Trennung für `de-en` implementiert und getestet.
- [ ] `categoryAllowlist` greift an allen 4 Stellen (Home, Suche, Editor, Stats).
- [ ] Kategorie `flughafen` (15-20 Karten, Gruppe `travel`) in `data.js`, Inhalt
      aus `logistica.js`/`equipaje` portiert + ergänzt.
- [ ] `FEATURES`-Array: geprüfte Kern-Feature-Liste trägt `"de-en"`, LatAm-Features
      bleiben ungetaggt (automatisch ausgeblendet).
- [ ] `manifest-hello-abroad.webmanifest` + eigenes Icon-Set, `boot.js`-Switch
      um Edition-Fall erweitert.
- [ ] `hello-abroad/index.html`-Redirect-Ordner live unter
      `moarci.github.io/holaRuta/hello-abroad/`.
- [ ] `npm test` grün (inkl. neuer Kategorie- und Track-Tests).
- [ ] Manuelle Verifikation gemäß Testing-Abschnitt durchgeführt.

## Nicht im MVP (bewusst zurückgestellt)

- Cloud-Sync/Social/Telemetrie (bleibt deaktiviert, wie Standard-HolaRuta).
- Zusätzliche 50-60+-spezifische A11y-Anpassungen (z.B. größere Standardschrift).
- Aussprache-Tipps für Englisch.
- Reise-Kontext-Beispielsätze für Englisch-Zielsätze.
- Eigenes Domain-/Vercel-Hosting (folgt ggf. später zusammen mit dem generellen
  HolaRuta-Cloud-Launch, siehe `LAUNCH.md`).
