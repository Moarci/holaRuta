# HelloAbroad – DE-EN Reiseenglisch-Ableger von HolaRuta

**Status:** Design genehmigt, bereit für Implementierungsplanung.

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

### Neuer Config-Mechanismus: `categoryAllowlist`

HolaRuta hat aktuell 71 Kategorien (Zahlen, 27 Länder-/Destinationspakete,
Grammatik-Sets, Jerga, Flirten etc.) – für HelloAbroad sollen nur die den 10
MVP-Themen zugeordneten Kategorien sichtbar sein. Neues optionales Config-Feld
`categoryAllowlist: string[] | null` (`null` = Standardverhalten, alle Kategorien
sichtbar – bestehende Editionen bleiben unverändert). Wenn gesetzt, filtert
`ui.js` beim Rendern der Lernen-Kacheln auf diese Liste. Bestehende
Gruppierung (`group`-Feld je Kategorie: basics/food/travel/people) bleibt
unverändert – keine neue Gruppierungslogik nötig, die 16 Kategorien verteilen
sich sinnvoll auf die vorhandenen 4 Gruppen.

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

Einzige echte Content-Lücke. Neue Kategorie in `data.js` `CATEGORIES` +
~15-20 neue Karten (Schema `{id, cat:"flughafen", lvl, de, en, es?, tip?}`)
für: Einchecken, Bordkarte, Gate, Gepäck aufgeben, Handgepäck, Verspätung,
Anschlussflug verpasst, Gepäck verloren/beschädigt, Sicherheitskontrolle,
Flüssigkeiten-Regel, Zoll/Verzollung, Ausgang/Abholung. `es`-Feld wird nach
Möglichkeit mitgepflegt (Datenkonsistenz mit Rest von data.js), ist aber für
HelloAbroad selbst nicht nötig.

### Ausblendung LatAm-Kultur-Features

Jerga, Flirten, Nachtleben, Länderkunde, Tanzen, Hostel-Modus (Featured-Banner),
Rollenspiele/Dialogos, Musik/Feiern-Spiele verschwinden komplett aus
„Entdecken" für den `de-en`-Track. Mechanismus: bestehendes
`tracks: ["de-es", "es-en"]`-Gate im `FEATURES`-Array (app.js) um Einträge
ergänzen bzw. sicherstellen, dass alle LatAm-spezifischen Einträge **kein**
`de-en` in ihrer `tracks`-Liste haben (Implementierungsdetail für den Plan:
jedes Feature-Item einzeln prüfen, nicht pauschal).

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

Damit „Zum Startbildschirm hinzufügen" korrekt „HelloAbroad" mit eigenem Icon
zeigt (wichtig für die Zielgruppe – ein Icon antippen ist einfacher als eine
URL/Lesezeichen zu merken), reicht der reine `?edition=`-Query-Param-Mechanismus
**nicht**, da alle Editionen sich sonst ein einziges `manifest.webmanifest`
teilen. Stattdessen:

- Neues `manifest-hello-abroad.webmanifest` (Name „HelloAbroad", eigene Farbe,
  eigenes Icon-Set – Muster: bestehendes `manifest-dark.webmanifest` als
  Präzedenzfall für eine alternative Manifest-Datei).
- Neues Icon-Set (analog `icon-180.png`/`icon-192.png`/`icon-512*.png`),
  Motiv/Farbe passend zur Petrol-Akzentfarbe.
- Ausgeliefert über den bestehenden Edition-Build (`node build.js
  --edition=hello-abroad`), gehostet als eigenständige Seite unter
  `moarci.github.io/holaRuta/hello-abroad/` (echte Build-Ausgabe, kein reiner
  Redirect wie `en/index.html`), damit Manifest/Icons dieser Seite fest auf
  HelloAbroad zeigen.

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
- Manuelle Verifikation im Browser: Lernen-Tab zeigt nur die 16 erlaubten
  Kategorien, Entdecken-Tab zeigt keine LatAm-Kultur-Kacheln, PWA-Installation
  zeigt „HelloAbroad"-Icon/Name.

## Nicht im MVP (bewusst zurückgestellt)

- Cloud-Sync/Social/Telemetrie (bleibt deaktiviert, wie Standard-HolaRuta).
- Zusätzliche 50-60+-spezifische A11y-Anpassungen (z.B. größere Standardschrift).
- Aussprache-Tipps für Englisch.
- Reise-Kontext-Beispielsätze für Englisch-Zielsätze.
- Eigenes Domain-/Vercel-Hosting (folgt ggf. später zusammen mit dem generellen
  HolaRuta-Cloud-Launch, siehe `LAUNCH.md`).
