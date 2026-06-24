# HolaRuta — Bauplan (was fehlt & wie es gebaut wird)

> **Datum:** 2026-06-14 · **Folgt auf:** [MARKT.md](MARKT.md) · **Gegenpart zu:** [IDEEN.md](IDEEN.md)
> **Fokus:** Technische Ausarbeitung der Lücken aus [MARKT.md](MARKT.md) §6 — *was genau* gebaut wird,
> in *welchen Dateien*, mit *welchen Datenstrukturen* und *welcher Wiederverwendung*.

`MARKT.md` benennt die Lücken auf Strategie-Ebene. Dieses Dokument geht eine Ebene tiefer: für jedes
fehlende Stück die konkrete Bauanleitung — Datenform (an bestehenden Strukturen orientiert),
betroffene Dateien, vorhandene Vorbilder zum Wiederverwenden, Schritte, Akzeptanzkriterien, Aufwand.

---

## 0. Bau-Konventionen (gelten für alles)

HolaRuta ist eine **zero-dependency Vanilla-JS-PWA** mit strikten Prinzipien (siehe README §Design).
Jeder Bau hält sich daran, sonst bricht er das Produkt:

- **Reine Daten getrennt von Logik.** Neue Inhalte sind **additive Daten** in `data.js` /
  `contextdata.js` — keine Logik darin.
- **Module hängen an `window.SC`.** Neue Module folgen dem IIFE-Muster und der Ladereihenfolge in
  `index.html` (erst Daten, dann Logik, dann `ui`, zuletzt `app`).
- **Ein `state`-Objekt, jede Aktion → `render()`.** Neue Screens = neuer Wert in `state.screen`
  (Enum in `app.js:50`), eine `render*`-Funktion in `ui.js`, ein `data-action`-Zweig in `app.js`.
- **Immutability, Graceful Degradation, A11y by Default.**
- **Definition of Done für jeden Bau:**
  - `npm test` (`node --test`) bleibt grün (aktuell **350**),
  - `node --check *.js` ohne Syntaxfehler,
  - `node build.js` läuft fehlerfrei (erzeugt `HolaRuta.html`; **nie** von Hand editieren),
  - neue Inhalte erscheinen live (Home → Bereich → Lernen) und sind offline verfügbar.

### Die zwei wichtigsten Wiederverwendungs-Vorlagen

| Vorlage | Ort | Wofür |
|---|---|---|
| **`SPICKZETTEL_GROUPS`** | `app.js:2454` — `{ cat, limit, pick:[ids] }` | kuratierte Karten-Presets (Top-100, Destination-Sets) |
| **`openRutaDelDia()`** | `app.js` (`RUTA_DIA_CAP`, Pool aus fälligen/neuen Karten; `RUTA_DIA_DESTINO_CAP` deckelt orts-/länderspezifische „destinos"-Karten pro Runde, damit Grundlagen dominieren) | neue geführte Modi (Pre-Trip-Sequenz, Coordinator-Runde) |

### Bestehende Datenstrukturen (Belege aus `data.js`)

```js
// Kategorie  (CATEGORIES, data.js:27)
{ id: "hostel", label: "Hostel", labelEn: "Hostel", icon: "🛏️", grad: ["#C25A45", "#DB7A5E"] }

// Karte  (CARDS, data.js:63)
{ id: "b01", cat: "basics", lvl: 1, de: "Hallo", en: "Hello", es: "Hola",
  tip: "OH-la (H ist stumm)", tipEn: "OH-la (H is silent)", alt?: [...] }

// Battle  (BATTLES, data.js:925)
{ id: "hb01", mode: "battle", cat: "hostel", scene: "checkin",
  promptDe: "...", promptEn: "...", answerEs: "¿Tiene una cama libre?",
  acceptable: ["tiene una cama libre", ...], points: 2, level: 1, hint: "...", hintEn: "..." }

// Challenge  (CHALLENGES, data.js:1589) — nur 10 vorhanden
{ id: "challenge01", category: "social", level: 1,
  textDe: "...", textEn: "...", phraseEs: "¿De dónde eres?" }

// Reise-Kontext  (contextdata.js, kompakt, per Karten-id)
"b18": { e: <sentenceEs>, d: <sentenceDe>, s: <situation>, n: <note> }
```

---

## STUFE 1 — MVP (geringer Aufwand, kein Backend, on-brand)

### 1.1 Cartagena/Colombia Destination-Pack  · INHALT · **S–M**

**Was:** ~80–100 kuratierte Karten + Kontext für eine konkrete Stadt/Reise — der Beweis, dass
HolaRuta nicht generisch ist. Inhalte: Flughafen→Taxi (Tarif/„por el taxímetro"), Unterkunft/
Gastfamilie, Stadtteile (Getsemaní/Manga/Centro/Bocagrande), Arepa/menú del día/jugo, Salsa-Abend,
Islas del Rosario (Bootstour), Bus nach Santa Marta/Tayrona, typische Cartagena-Wörter/Hitze/Regen.

**Entscheidung — Pack = neue Kategorie:** Eine neue Kategorie `cartagena` (analog zu `hostel`) ist
der einfachste, additive Weg. Karten tragen `cat: "cartagena"`, IDs `ctg01…ctgNN`. Alternativ
mehrere Stadt-Kategorien (`colombia`, später `peru`, `mexico`).

**Dateien:**
- `data.js` — Eintrag in `CATEGORIES` (id/label/labelEn/icon `🌴`/grad), neue Karten ans `CARDS`-Array.
- `contextdata.js` — `{ e,d,s,n }`-Eintrag je neuer Karten-id (Pflicht: alle Karten haben Kontext).

**Reuse:** identisches Karten-/Kontext-Schema wie alle bestehenden Karten — keine Logikänderung.
Die Kategorie erscheint automatisch auf Home, im Filter, in Statistik und im Ruta-Pass (Bereichs-Badge).

**Schritte:** Karten kuratieren (LatAm-/Kolumbien-korrekt, *colectivo*, *plata*, *¡qué chimba!* nur
wo passend) → Kontext je Karte → `node --test` (Daten-Integritätstests prüfen Felder/Duplikate) →
`node build.js`.

**Akzeptanz:** Kategorie „Cartagena" sichtbar; alle neuen Karten haben `lvl`, `es`, Kontext; 0
Duplikate/fehlende Felder (Audit-Tests); Bereichs-Badge funktioniert.

> **Vor Schul-Einsatz:** Inhalte einmal von Muttersprachler/Lehrkraft gegenlesen (MARKT.md §13).

### 1.2 Kuratierte Presets „Pre-Arrival 100" / „Survival 50"  · INHALT+MODUS · **S**

**Was:** benannte, kuratierte Kartenlisten statt nur freiem Kategorie+Stufen-Filter. Für Schulen
(„diese 100 vor Ankunft") und Reisende.

**Dateien & Reuse:** **Direkt das `SPICKZETTEL_GROUPS`-Muster** (`app.js:2454`) verallgemeinern:
ein `PRESETS`-Array `{ id, label, labelEn, pick: [cardIds] }`. Eine kleine Startauswahl auf Home
(neue Kachel) oder im Lernen-Reiter, die `state` mit der Preset-Kartenmenge in den **bestehenden**
Study-/SRS-Pfad schickt (wie `openRutaDelDia()` einen Pool übergibt).

**Schritte:** Karten-IDs kuratieren → `PRESETS` definieren → Home-Kachel + `data-action="open-preset"`
→ Study-Start mit Preset-Pool (Cap wie Ruta del día). **Kein** neuer Lernmodus nötig.

**Akzeptanz:** Preset startbar, nutzt vorhandene Flip/Type/Hören-Modi + SRS; offline.

### 1.3 Lehrer-/Coordinator-/Hostel-PDF  · PAKET (kein Code) · **S je** · ✅ UMGESETZT

**Was:** fertige Abläufe als **druckbare HTML-Handouts** (statt Binär-PDF — bleibt zero-dependency,
offline, diffbar; PDF per Strg/Cmd+P):
- *Lehrer-Anleitung:* Stundenaufbau + 10 Stunden-Rezepte (Thema → Karten/Kontext → Battle/Rollenspiel
  → Real-Life Challenge).
- *Coordinator-Karte:* „5-Minuten-Icebreaker", Restaurant-Battle, Markt-Challenge, Pre-Trip.
- *Hostel-Aushang:* „Spanish Night" — 3 Schritte + QR-Platzhalter (QR einmalig extern erzeugen).

**Geliefert:** [`docs/anleitungen/`](docs/anleitungen/index.html) — `index/lehrer/coordinator/hostel.html`
+ gemeinsames `handout.css`/`handout.js` (Sprachschalter DE·EN·ES, `@media print`). Dreisprachig,
mit Hinweis, dass die App-Oberfläche selbst nur DE/EN ist. Verweist auf vorhandene Features.

---

## STUFE 2 — Edition & geführte Modi (mittlerer Aufwand)

### 2.1 Branding-/Edition-Schalter  · MODUS · **M** · ✅ UMGESETZT

**Was:** Name/Akzentfarbe/theme-color/Default-Ziel per Konfig → „ECOS Edition", „WeRoad Colombia
Pack". Co-Branding ohne Code-Fork.

**Geliefert:** `config.js` (SC.config, Default = HolaRuta pur) + `editions/<id>.js` (reine Daten) +
Apply-Schicht in `app.js` (`applyEdition`: nur `--brand`/`--brand-ink` + Tab-Titel + Appbar-Zusatz
„· ECOS"; `--page`/theme-color bleiben → Dark Mode heil) + Profil-Credit + `build.js --edition=<id>`
→ `HolaRuta-<id>.html` + Guard-Test. Beispiel-Editionen: `ecos`, `weroad`. Default unverändert, 350 Tests grün.

**Dateien & Reuse:**
- Neues Mini-Modul `config.js` (`SC.config`) mit `{ edition, brandName, accent, logo, startTab,
  defaultCategory }`, ganz vorn in `index.html` geladen.
- **CSS Custom Properties existieren bereits** (`styles.css :root` — `--brand`, `--brand-ink`,
  `--page`, …). `app`/`install` setzen beim Start die Override-Werte (`document.documentElement.
  style.setProperty('--brand', SC.config.accent)`) und den Titel/Logo.
- `build.js` bekommt eine **Edition-Variante**: gleicher Mechanismus wie heute (Embed von
  CSS+Scripts), nur mit einer alternativen `config.js` → `HolaRuta-ecos.html`.

**Schritte:** `config.js` mit Default = heutige Marke → `app` liest `SC.config` für Titel/Akzent/
Start → `build.js`-Flag `--edition=ecos`. **Bricht keine Prinzipien** (Build-Variante, zero-dep).

**Akzeptanz:** Default-Build unverändert; Edition-Build zeigt Name/Akzent/Logo, sonst identisch;
`node build.js` erzeugt beide Varianten fehlerfrei.

### 2.2 Pre-Trip-Challenge-Modus (sequenziert)  · MODUS+INHALT · **M**

**Was:** mehrtägiges, freischaltendes Programm (Tag 1 Begrüßung … Tag 5 Icebreaker …). Heute ist
`Ruta del día` nur eine **zufällige** Tagesrunde — kein geordneter Onboarding-Pfad.

**Dateien & Reuse:**
- Daten: `PRETRIP` = geordnete Liste `{ day, titleDe/En, cardIds:[…], challengeId? }` (in `data.js`
  oder eigenem `pretrip.js`).
- Logik: **`openRutaDelDia()` als Vorbild** (Pool an Study-Pfad übergeben). Freischalt-Status in
  `gamestats` mitführen (wie `rutaDays`, `app.js:1998`).
- UI: neuer `state.screen = "pretrip"`, `ui.renderPretrip()`, `data-action="open-pretrip"`.

**Akzeptanz:** Tage in Reihenfolge, Tag N+1 nach Abschluss N; Fortschritt persistent in
`gamestats`; zahlt optional auf einen neuen Badge ein.

### 2.3 Coordinator-/Aktivitäts-Launcher  · MODUS · **S–M**

**Was:** „5-Minuten-Icebreaker" als **ein Tap**, der ein Gruppen-Battle oder eine Mission startet —
für Reiseleiter/Hostel-Personal. Der Hostel Mode existiert, ist aber nicht als fertige
Gruppen-Aktivität kuratiert.

**Dateien & Reuse:** kuratierte Battle-/Challenge-Auswahl (`{ pick:[battleIds] }`-Preset analog
1.2) + ein Home-/Hostel-Einstieg, der direkt in den **bestehenden** Battle-Flow (`battleSetup`/
`battle`-Screens, schon vorhanden) springt. Kein neuer Spielkern.

**Akzeptanz:** ein Tap → fertige Gruppenrunde mit 6/10 Aufgaben; nutzt vorhandene Battle-Mechanik.

### 2.4 Real-Life Missions / Challenges erweitern  · INHALT · **S**

**Was:** `CHALLENGES` von **10 → ~30** ausbauen und gruppen-/koordinator-tauglich rahmen
(„Frag jemanden aus der Gruppe: ¿De dónde eres?"). Stadt-spezifische Missionen je Destination-Pack.

**Dateien & Reuse:** `data.js` `CHALLENGES`-Array (Struktur `{ id, category, level, textDe, textEn,
phraseEs }` ist schon da). Rein additiv; speist die bestehenden Mutproben-Badges.

**Akzeptanz:** mehr Challenges erscheinen als Battle-Bonus; Badges zählen korrekt.

---

## STUFE 3 — Echtes EdTech (groß, bricht Prinzipien → nur mit zahlendem Kunden)

### 3.1 Lehrer-/Kurs-Modus (ohne Backend)  · MODUS · **M**

**Was:** geführte Pakete statt freier Filter; Lehrer wählt „heutiges Thema", Schüler folgen.
Ohne Server machbar als kuratierte Sequenzen + lokale Klassencodes.

**Reuse:** Presets (1.2) + Pre-Trip-Mechanik (2.2). Kein Sync.

### 3.2 Fortschritt teilen/exportieren  · MODUS · **M**

**Was:** Lehrer-Sicht/Testimonial-Beleg. Heute nur Sharepic-PNG (`share.js`).
**Leichte Variante ohne Backend:** Export/Import des Fortschritts als Code/JSON (`store.js` kapselt
schon den `localStorage`-Zustand) → Schüler zeigt/teilt seinen Stand.

### 3.3 Accounts / Sync / Per-Seat / Pro-Kauf  · INFRASTRUKTUR · **L**

**Was:** Voraussetzung für Lehrer-Dashboard, Mehrgeräte-Sync, Network-/Per-Seat-Preise und B2C-Pro.
**Bricht** Zero-Dep/Offline/Privacy → bewusst zuletzt, nur mit Referenzkunde.

**Optionsskala (vom Kleinsten zum Größten):**
1. *Export/Import-Codes* (kein Server) — 3.2.
2. *Schlanker Sync* (eine kleine API + optionales Konto) — eigene Domain nötig (löst zugleich die
   `localStorage`-Shared-Origin-Randbedingung von GitHub Pages, README §Architektur).
3. *Voll-Dashboard + Lizenzlogik* — eigenständiges Projekt, eigener Sales-Case.

---

## Prioritäten-Kurzfassung (was zuerst gebaut wird)

| # | Bau | Stufe | Aufwand | Hebel |
|---|---|---|---|---|
| 1 | Cartagena/Colombia Destination-Pack (1.1) | 1 | S–M | macht App glaubwürdig für ersten Pilot |
| 2 | Kuratierte Presets „Pre-Arrival/Survival" (1.2) | 1 | S | Schul-/Reise-Onboarding |
| 3 | Lehrer-/Coordinator-/Hostel-PDF (1.3) ✅ | 1 | S | Vertriebsmaterial, kein Code |
| 4 | Challenges 10→30 (2.4) | 2 | S | Immersion-Kern, additiv |
| 5 | Coordinator-Launcher (2.3) | 2 | S–M | Hostel-/Gruppen-Aktivität |
| 6 | Edition-/Branding-Schalter (2.1) ✅ | 2 | M | Co-Branding für ECOS/WeRoad |
| 7 | Pre-Trip-Modus (2.2) | 2 | M | Pre-Trip-Engagement |
| 8 | Kurs-Modus / Export (3.1/3.2) | 3 | M | erst mit Pilot |
| 9 | Accounts/Sync/Backend (3.3) | 3 | L | erst mit zahlendem Kunden |

> **Roter Faden:** Bau 1–5 sind rein additiv (Daten + kleine UI), halten zero-dependency/offline/
> on-brand und liefern den größten Vertriebs-Hebel. Erst wenn ein zahlender Kunde es verlangt,
> lohnt der Schritt zu Accounts/Backend (Bau 9) — der das Produkt-Prinzip am stärksten verändert.
