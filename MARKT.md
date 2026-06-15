# HolaRuta — Markt & Vertrieb

> **Datum:** 2026-06-14 · **Folgt auf:** [IDEEN.md](IDEEN.md), [RISIKO.md](RISIKO.md), [AUDIT.md](AUDIT.md)
> **Fokus:** Vermarktung (B2B + B2C) — *nicht* Code-Hygiene (die ist in AUDIT/RISIKO behandelt).
> **Stand der Faktenbasis (historische Analyse-Basis):** `main` v1.24.0 — 718 Karten · 23 Bereiche · 3 Stufen · 3 Lernmodi · 154 Tests grün.
> **Seitdem auf dem Branch ausgebaut** → heute **933 Karten · 27 Bereiche · 37 Challenges · 160 Tests grün** (inkl. Colombia 89, Peru 45, Mexiko 41, Costa Rica 40 Karten). Siehe Stand-Update in §2/§3.

Dieses Dokument gleicht eine ausführliche Geschäftsanalyse mit dem **echten Code-Stand** ab und
leitet daraus einen realistischen Vertriebsweg ab: Wer sind die Kanäle, was trägt der heutige
Funktionsumfang, was fehlt konkret, in welcher Reihenfolge, zu welchen Preisen.

Die Kernhaltung ist bewusst ehrlich: HolaRuta ist technisch reif und inhaltlich dicht, aber **kein
verkaufsfertiges EdTech-Schulsystem**. Der schnellste Weg zu echtem Umsatz führt nicht über das
größte Feature, sondern über den Kanal, der den **vorhandenen** Funktionsumfang am stärksten nutzt.

---

## 1. Kernthese

**HolaRuta ist ein Immersion-/Reise-Companion — kein Unterrichtsersatz und kein
Schulverwaltungssystem.** Es bringt Lernende *vor, während und nach* einer Reise (oder einem Kurs)
in echte Situationen: Taxi, Hostel, Essen, Preise, Notfall, Smalltalk, Gruppenmomente.

Daraus ergeben sich drei tragende B2B-Kanäle plus ein optionaler B2C-Pfad:

| Kanal | HolaRuta ist dort … | Fit | Einstieg |
|---|---|---|---|
| **A — Sprachschulen** | Lern- & Unterrichtsbegleiter | gut, aber didaktisch anspruchsvoll | mittel |
| **B — Gruppenreise-Anbieter** | Trip-Companion / Pre-Trip- / Social-Tool | emotional am stärksten | mittel |
| **C — Hostels & Hostel-Ketten** | fertige Social-Aktivität (der „Hostel Mode") | naheliegendster Produkt-Fit | niedrig |
| **D — B2C (Reisende)** | Free/Pro-Reise-App | groß, aber marketingintensiv | hoch |

> Die Reise-/Social-Kanäle (B, C) nutzen den **heutigen** Feature-Stand stärker als Schulen, weil
> dort „nützlich, cool, einfach, passt zur Reise" zählt — und nicht Lehrplan-Anbindung,
> Grammatikprogression und Lehrersteuerung.

---

## 2. Realitäts-Check: Analyse vs. Code

Die Analyse ist überwiegend präzise — fast alle behaupteten Features existieren wirklich. Belegt
gegen `main` v1.24.0:

| Behauptung | Code-Realität | Status |
|---|---|---|
| Hostel Battle | `data.js`: 45 BATTLES, Scoring 2/1/0, 6/10/20 Runden | ✅ existiert |
| Rollenspiele | `data.js`: ROLEPLAYS + `dialogos.js` (10 Dialoge) | ✅ existiert |
| Real-Life Challenges | `data.js`: CHALLENGES als Battle-Bonus, inzwischen **37** (von 10 ausgebaut) | ✅ umgesetzt |
| Kontextkarten | `contextdata.js`: Reise-Kontext für **alle** Karten (heute 933) | ✅ existiert |
| Badges (Ruta-Pass) | `badges.js`: 50+ Stempel, 11 Gruppen | ✅ existiert |
| Kategorien | 23 Bereiche (Hostel, Essen, Busreise, Notfall, Geld …) | ✅ existiert |
| Spickzettel (Survival, offline, vorgelesen) | README / `ui.js` | ✅ existiert |
| Offline / PWA / zero-dependency / kein Tracking | Service Worker, `localStorage` | ✅ existiert |
| Niveau A1/A2/B1 | `lvl`-Mehrfach-Filter, 3 Stufen | ✅ existiert (s. u.) |
| Coordinator-Modus (5-Min-Icebreaker) | `startCoordinatorRound` (Modo hostal) | ✅ umgesetzt |
| Lehrer-/Kurs-Modus (geführt, Zuweisung/Sync) | — | ❌ fehlt (Stufe 3) |
| White-Label / Co-Branding | `config.js` + `editions/*` + `build.js --edition` | ✅ umgesetzt (ecos/weroad) |
| Backend / Accounts / Pro-Kauf / Per-Seat | nur `localStorage`, ein Gerät, kein Sync | ❌ fehlt (bewusst, Stufe 3) |
| Cartagena-/Destination-/„Colombia Pack" | Kategorie `colombia`, **89 Karten** (inkl. Kaffeeregion Salento/Cocora) | ✅ umgesetzt |
| Kuratierte Pakete / Pre-Trip-Plan | `PRESETS` (Pre-Arrival je Ziel) + `PRETRIP` (4 Ziele × 7 Etappen) | ✅ umgesetzt |
| Lehrer-/Coordinator-/Hostel-Handouts | druckbare HTML (DE·EN·ES) unter `docs/anleitungen/` | ✅ umgesetzt |

> **Stand-Update (Juni 2026):** Mehrere der ursprünglich als „❌ fehlt" notierten MVP-Lücken wurden
> inzwischen gebaut (Destination-Packs **Colombia 89 · Peru 45 · Mexiko 41 · Costa Rica 40**, Pre-Arrival-Presets
> je Pack, Pre-Trip-Plan, 37 Challenges, Coordinator-Schnellstart, dreisprachige Handouts, Edition-Schalter) —
> Details und Status in [BAUPLAN.md](BAUPLAN.md).
> Offen bleiben bewusst die Stufe-3-Punkte (echtes Lehrer-Dashboard, Accounts/Sync/Backend).

**Vier Klarstellungen, die man im Pitch nicht übersehen darf:**

- **Kartenzahl ist aufgeräumt.** Auf `main` v1.24.0 durchgängig **718** (frühere 710/718-Mischung
  ist behoben). Kein offener Punkt.
- **Niveau ≠ Lehrplan.** Die 3 Stufen (A1/A2/B1) sind ein **Filter**, kein didaktisch kuratierter
  Lernpfad. Die Forderung „A1/A2/B1 sauberer / kuratierte Pakete" bleibt berechtigt — es fehlt die
  **Kuration**, nicht das Niveau-Feld.
- **Inhalts-Qualität ist agent-, nicht lehrkraft-geprüft.** Es gibt ein 4-Agenten-[AUDIT.md](AUDIT.md),
  aber **kein** Sign-off durch Muttersprachler/Lehrkraft. Für Schulen ist das Pflicht, für
  Gruppenreisen/Hostels weniger heikel.
- **Privacy/Offline ist ein unterschätztes Verkaufsargument** (DSGVO, kein Tracking, alles lokal).
  ABER: Auf GitHub Pages teilen sich alle Projekte derselben `github.io`-Origin den `localStorage`
  — beim ernsthaften Schul-/Partnereinsatz eine eigene Domain erwägen.

---

## 3. Kanal A — Sprachschulen (z. B. ECOS Cartagena)

Schulen wie ECOS verkaufen nicht nur Grammatik, sondern einen **Aufenthalt**: Cartagena, Kultur,
Aktivitäten, Salsa, Unterkunft, Ausflüge. Genau dort ist HolaRuta stark — als Brücke zwischen
Klassenzimmer und Straße.

**Drei Einsatz-Szenarien** (jeweils mit dem, was der Code **heute schon** trägt):

1. **Pre-Arrival Pack** — Schüler bekommen HolaRuta zur Vorbereitung (Flughafen, Taxi, Check-in,
   Essen, Geld, Notfall). *Trägt heute:* Kategorien + Spickzettel + Kontextkarten. *Fehlt:* das
   kuratierte „Top-100"-Set und der Cartagena-Bezug (→ §6).
2. **Classroom Companion** — Lehrkraft nutzt im Unterricht: 5-Min-Warm-up mit Karten, Partnerarbeit
   mit **Hostel Battle**, **Rollenspiele**, Kontext-Button als Gesprächsanlass, Hausaufgabe =
   10 Karten + 1 Real-Life Challenge. *Trägt heute:* alles davon existiert. *Fehlt:* ein „Kursmodus"
   und ein Lehrer-PDF mit fertigen Stundenabläufen.
3. **Real-Life Challenge Tool** — der spannendste Teil für Immersion: „Frag heute im Café nach der
   Rechnung", „Frag im Hostel nach dem WLAN". *Trägt heute:* **37 Challenges** (von 10 ausgebaut,
   inkl. Kolumbien- und Peru-Spezial). *Offen:* noch stärker schul-/stadtspezifisch.

**Was eine Schule verlangen würde:** sichtbares Niveau-System, Lehrersteuerung/Kursmodus,
Aufgabenpakete, teilbarer Fortschritt, Branding-Option, Datenschutz-Hinweis, **Gegenlesung der
Inhalte durch eine Lehrkraft**, optional Cartagena-Inhalte.

---

## 4. Kanal B — Gruppenreise-Anbieter (WeRoad & Co.)

Bei Gruppenreisen ist HolaRuta **kein Sprachkurs**, sondern ein **Travel-Language-Companion**. Das
ist attraktiver, weil die Teilnehmer keine Schule buchen — sie wollen sich sicherer fühlen, mehr
lokal erleben, weniger hilflos sein. WeRoads Kolumbien-Reisen (Medellín, Cartagena, Karibik) sind
fast deckungsgleich mit HolaRutas Logik.

**Nutzenversprechen:** *Eine leichte Offline-PWA, mit der Reisende vor und während der Reise die
wichtigsten lokalen Sätze für Taxi, Essen, Unterkunft, Geld, Notfälle, Smalltalk und Gruppenmomente
üben.*

Das verstärkt WeRoads Markenkern (kleine Gruppen, Community, Vibe):

- **Social Icebreaker** — die Gruppe spielt kleine Sprach-Battles.
- **Local Immersion** — Teilnehmer trauen sich, selbst zu bestellen.
- **Safety** — Notfall-/Orientierungssätze offline verfügbar.
- **Pre-Trip Engagement** — die Reise beginnt 2 Wochen vorher in der App.
- **Community** — nach der Reise bleibt ein digitales Souvenir.

**Vier Produktpakete** (Detail-Lücken → §6):

1. **Destination Pack** (Colombia / Peru / Mexico / Costa Rica): 100 Sätze, Offline-Spickzettel,
   Essen/Taxi/Unterkunft/Geld/Notfall, Lokalvokabeln, Mini-Knigge, Real-Life Challenges,
   Gruppen-Battle.
2. **Pre-Trip Challenge** (2 Wochen vor Abreise, Tag 1 Begrüßung … Tag 5 Icebreaker …).
3. **Coordinator Mode** (fertiges 5-Minuten-Gruppenspiel für den Reiseleiter).
4. **Real-Life Missions** (kleine gemeinsame Mutproben unterwegs).

> **Achtung:** Gruppenreise-Anbieter haben *keinen* Sprachfokus. Der Pitch muss zeigen, dass
> HolaRuta die **Reisequalität** verbessert — nicht „Vokabeln trainiert".

> **Ausgearbeitetes WeRoad-Colombia-Proposal** (DE/EN, druckbar, in der WeRoad-Akzentfarbe):
> [docs/pitch/weroad-colombia.html](docs/pitch/weroad-colombia.html) — Route↔Inhalt-Mapping
> (Medellín / Karibikküste / Cartagena), 3-Phasen-Modell, Coordinator-Playbook, 7-Tage-Pre-Trip-Plan,
> Edition-Look, Preise und konkreter Pilot-Vorschlag. Alle Inhalte am realen Code-Stand belegt.

---

## 5. Kanal C — Hostels & Hostel-Ketten

Der naheliegendste Fit überhaupt: Die App heißt im Kern **„Hostel Mode"** — Battle und Rollenspiele
sind buchstäblich für die Hostel-Situation gebaut. Hostels suchen ständig Social-Aktivitäten.

Zwei Spielarten:

- **Einzel-Hostels = Reichweiten-/Distribution-Kanal** (kaum direkte Zahlungsbereitschaft):
  „Spanish Night / Language Battle" als fertiger Ice-Breaker, QR-Code an Rezeption/Common Room,
  Empfehlung beim Check-in. Niedrigschwellig, weil offline-PWA ohne Installation. **Nutzen für dich:
  Nutzer, Testimonials, Cartagena-Praxisfeedback.** Monetarisierung eher kostenlose Partnerschaft /
  Co-Branding / Lead-Gen.
- **Hostel-Ketten/Netzwerke = vierter B2B-Kanal mit Budget:** Selina (Hostel + Coworking +
  Experiences, ganz LatAm), Viajero, Masaya, Los Patios/Republica (Cartagena/Medellín) — Standorte,
  Aktivitätsprogramme, Marketing. Für sie eine „Hostel Edition" ähnlich der Gruppenreise-Logik
  (Destination-Pack + Aktivitäts-PDF).

> **Bester Warm-Up-Kanal:** Cartagena-Hostels liegen direkt an deinem aktuellen Bezug. Ein QR-Code
> im Common Room kostet dich nichts und liefert echtes Nutzer-Feedback.

---

## 6. Was fehlt — detaillierte Gap-Analyse

Das Herzstück. Was müsste tatsächlich entstehen, damit die Kanäle tragen? Gegliedert in
**Inhalte / Modi / Pakete / Infrastruktur**, jeweils mit Aufwand (S/M/L), Reuse-Hinweis und
Ziel-Kanal (**S**chule / **G**ruppenreise / **H**ostel / **B2C**).

> **Datei-/datenstruktur-genaue Bauanleitung** zu jedem Punkt hier: [BAUPLAN.md](BAUPLAN.md) —
> mit konkreten Strukturen, betroffenen Dateien, Wiederverwendungs-Vorlagen und Akzeptanzkriterien.

### 6a — Fehlende INHALTE (reine Daten, additiv, zero-dependency)

| Lücke | Was genau | Aufwand | Reuse | Kanal |
|---|---|---|---|---|
| **Destination-/City-Packs** | je ~100 kuratierte Sätze + Lokalvokabular. **Colombia ✅ umgesetzt (89 Karten:** Taxi/Ankunft, Unterkunft, Stadtteile, Essen/Markt/Geld, Bogotá, Medellín/Guatapé, Karibikküste/Tayrona, Cartagena/Islas del Rosario, Kaffeeregion Salento/Cocora, Slang/Ausgehen). **Peru/Cusco ✅ umgesetzt (45 Karten:** Lima, Höhe/soroche, Arequipa/Colca, Titicaca/Puno, Cusco/Heiliges Tal, Machu Picchu, Regenbogenberg, Essen, Quechua). **Mexiko ✅ umgesetzt (41 Karten:** CDMX, Teotihuacán, Oaxaca/Mezcal, Chiapas/Sumidero, Yucatán/Cenoten/Tulum, Día de Muertos). **Costa Rica ✅ umgesetzt (40 Karten:** San José, Karibik/Tortuguero/Bribri, Arenal/Río Celeste, Monteverde, Manuel Antonio, pura vida). **Offen:** Guatemala/Antigua, Argentinien/Chile | S–M je Pack | additive Kategorie in `data.js` + `contextdata.js`, Muster wie bestehende Bereiche | S/G/H/B2C |
| **Kuratierte Starter-Sets** | benannte Auswahl „Pre-Arrival 100" / „Survival 50" statt nur freiem Kategorie+Stufen-Filter | S | Karten-IDs als Preset-Liste | S/G |
| **Pre-Trip-Challenge-Programm** | sequenziert (Tag 1 Begrüßung … Tag 5 Icebreaker). Heute: `Ruta del día` ist eine **zufällige** Tagesrunde, kein mehrtägiger Onboarding-Pfad | M | geordnete Tagesliste; Mechanik teils aus Ruta del día | G/H |
| **Gruppen-/Social-Icebreaker-Set** | z. B. „¿De dónde eres?"-Gruppenspiel. Battles (45) existieren; Real-Life Missions **von 10 auf 31 erweitert ✅** (inkl. Kolumbien-Spezial); Coordinator-Schnellstart ✅. Offen: noch stärker gruppen-geframte Sets | S | bestehende BATTLES/CHALLENGES-Struktur | G/H |
| **Lehr-/Stunden-Rezepte (Content)** | „Restaurant: 10 Karten → Kontext → Rollenspiel → Real-Life Challenge" | S (als PDF-Text) | bestehende Inhalte verknüpfen | S/H |
| **Muttersprachler-/Lehrkraft-Gegenlesung** | menschliches Sign-off der spanischen Inhalte (heute nur Agenten-Audit) | M (extern) | — | S |

### 6b — Fehlende MODI / Features (Code)

| Lücke | Was genau | Aufwand | Reuse | Kanal |
|---|---|---|---|---|
| **Destination-Onboarding** | „Wohin reist du?" filtert & thematisiert Inhalte; App ist heute generisch | M | Kategorien-Filter + Settings | G/H/B2C |
| **Pre-Trip-Challenge-Modus** | mehrtägige, freischaltende Sequenz | M | gamestats/Streak | G/H |
| **Coordinator-/Aktivitäts-Launcher** | „5-Minuten-Icebreaker" als ein Tap startet Gruppen-Battle/Mission | S–M | Hostel Mode | G/H |
| **Lehrer-/Kurs-Modus** | geführte Pakete statt freier Filter, optional Aufgaben-Zuweisung | M (ohne Backend) / L (mit Sync) | Filter + neue UI | S |
| **Branding-/Edition-Schalter** | Name/Logo/Startbereich per Konfig → „ECOS Edition", „WeRoad Colombia Pack" | M | CSS-Custom-Properties + `build.js`-Variante | S/G/H |
| **Fortschritt teilen/exportieren** | Lehrer-Sicht, Testimonial-Beleg (heute nur Sharepic-PNG) | M | `share.js`, `stats.js` | S |
| **Accounts / Sync / Per-Seat / Pro-Kauf** | nichts vorhanden (nur `localStorage`). Voraussetzung für Network-/Per-Seat-Preise, Lehrer-Dashboard, B2C-Pro | **L** | — (neues Backend) | S/G/B2C |

### 6c — Fehlende PAKETE / Vertriebs-Artefakte (kein Code)

| Lücke | Aufwand | Kanal |
|---|---|---|
| „School Edition"-Bundle-Definition (was genau drin ist) | S | S |
| Destination-Packs als verkaufbare Einheiten (Colombia/Peru/Mexico/CR) | S | G/H |
| Lehrer-PDF · Coordinator-PDF · Hostel-„Spanish-Night"-PDF | S je | S/G/H |
| 1-seitige Landingpage / Pitch-PDF je Kanal + Demo-Zugang | S–M | alle |
| Datenschutzseite (DSGVO) + Impressum | S | S/G |
| Preis-/Lizenz-/Terms-Seite | S | alle |
| Referenz/Testimonial-Material (Henne-Ei → erster Pilot) | — | alle |

### 6d — Fehlende INFRASTRUKTUR / Vertrauen

| Lücke | Aufwand | Kanal |
|---|---|---|
| Eigene Domain statt `github.io`-Subpfad (behebt `localStorage`-Shared-Origin, wirkt seriöser) | S–M | S/G |
| Support-Kanal (Mail) + sichtbare Update-Kadenz | S | alle |
| Mehrsprachige Landingpage (DE/EN/ES) | M | alle |

> **Leitprinzip:** Die **6a-Inhalte und die kleinen 6b-Modi sind MVP-tauglich** — additiv,
> zero-dependency, offline, on-brand. Alles mit **Accounts/Sync/Dashboard (L)** bricht die
> Zero-Dep-/Offline-/Privacy-Prinzipien und kommt erst mit einem zahlenden Referenzkunden.

---

## 7. Empfohlene Roadmap (3 Stufen)

| Stufe | Inhalt | Aufwand | Bricht Prinzipien? |
|---|---|---|---|
| **1 — MVP** ✅ | Colombia-Pack (89 Karten) + Pre-Arrival-Preset + Pre-Trip-Plan + Coordinator-Schnellstart + dreisprachige Handouts — **umgesetzt** | gering | nein — zero-dep, offline, on-brand |
| **2 — Edition** ✅ | Branding-Option → „ECOS Edition" / „WeRoad Colombia" als Build-Variante (`node build.js --edition=…`) — **umgesetzt** | mittel | nein (Build-Variante) |
| **3 — EdTech** | Lehrer-Dashboard + Accounts/Sync + Per-Seat-Lizenzlogik | groß | **ja** — nur mit zahlendem Referenzkunden |

Der größte Hebel ist **nicht** Stufe 3, sondern Stufe 1: Sie macht aus „nette generische App" ein
glaubwürdiges Angebot für genau einen ersten Pilotkunden.

---

## 8. Preise & Pakete

**Sprachschulen:**

| Paket | Preis/Jahr | Für | Enthält |
|---|---|---|---|
| Pilot | 0–199 USD | Einstieg, 1–2 Klassen | 4–6 Wochen Test + Feedbackgespräch |
| School Starter | 499 USD | kleine Einzelschule | App + School-Pack + Lehrer-PDF, kein Custom-Branding |
| School Plus / Edition | 999–1.499 USD | ECOS, Centro Catalina | Stadt-/Schulpaket, Hostel Mode im Unterricht, Challenges, kleine Co-Branding-Seite, Lehrer-Material |
| Network | 2.500–5.000 USD | mehrere Standorte | mehrere Stadtpakete, Partner-Branding, mehr Support |
| Custom / White-Label | ab 5.000 USD + Setup | später | volle Anpassung |

**Gruppenreisen:** Destination Pack 500–1.500 USD · Jahres-Partnerlizenz 5.000–15.000 USD ·
Per-Seat 0,50–2,00 USD/Reisendem (erst bei Volumen).

**Hostels:** Einzel-Hostel meist **0 USD** (Partnerschaft/Co-Branding/Lead-Gen) · Hostel-Kette
(Selina & Co.) wie Gruppenreise-Netzwerk: „Hostel Edition" 2.500–10.000 USD/Jahr.

**B2C (optional):** Free (Basis-Karten, Kontext, einige Kategorien) vs. Pro (Hostel Mode, Hören,
Badges, Offline-/Destination-Packs, Länderkunde) — 9–19 USD einmalig oder 2,99–4,99 USD/Monat.
Braucht Reichweite + App-Store-Vertrauen + das fehlende Kauf-/Account-Backend → nachrangig.

> **Ehrlich:** Co-Branded-, Network- und Per-Seat-Modelle sind erst nach Roadmap-Stufe 2/3 tragfähig.
> Für den Einstieg: kostenloser Pilot → einfache Jahreslizenz.

---

## 9. Umsatz-Szenarien (Aufbaupfad, keine Prognose)

| Szenario | Annahme | Jahresumsatz |
|---|---|---|
| **Konservativ** | 5 × 499 + 3 × 999 USD | ~5.500 USD |
| **Realistisch gut** | 10 × 499 + 10 × 999 + 2 × 2.500 USD | ~20.000 USD |
| **Stark** | 25 × 999 + 5 × 3.000 + 3 × 5.000 USD | ~55.000 USD |

**Aufbaupfad:** Jahr 1 ~10k → Jahr 2 30–50k → Jahr 3 75k+ USD. Nebenbei eher 3–10k, aktiv verkauft
eher 10–30k. Über 100k kurzfristig unrealistisch — der Markt ist speziell und Schulen kaufen
langsamer als Endkunden.

> **Erster echter Meilenstein ist nicht Umsatz, sondern:** 1 zahlende Schule · 1 gutes Testimonial ·
> 1 School/Destination Edition · 1 klarer Pitch. Steht das, wird daraus ein kleines, profitables
> Nischenprodukt.

---

## 10. Zielkunden-Priorisierung

**Sprachschulen** (Kolumbien-/Immersion-Nähe zuerst, große Ketten später):

1. Centro Catalina (Cartagena + Medellín) · 2. ECOS (Cartagena) · 3. Maximo Nivel (CR/Guatemala/Peru)
· 4. Linguaschools (Boutique-Netzwerk) · 5. Sprachcaffe · 6. Enforex / don Quijote · 7. EF.

**Gruppenreisen:** zuerst kleine/mittlere LatAm-/Backpacker-Anbieter → deutsche Junge-Gruppen-
Anbieter → WeRoad DACH → G Adventures / Intrepid.

**Hostels:** zuerst Cartagena-Hostels (direkter Bezug, Distribution) → dann Ketten (Selina, Viajero,
Masaya, Los Patios/Republica) für zahlende „Hostel Edition".

> Nicht mit den größten Konzernen anfangen. Bei kleineren Partnern kommt man schneller zum Pilot —
> und ein einziger Referenzkunde macht jeden weiteren Pitch glaubwürdiger.

---

## 11. Warm-Intro-Playbook (Beispiel: WeRoad-Reiseleiterin)

Ein persönlicher Kontakt (z. B. eine Reiseleiterin) ist **kein Einkauf**, aber ein **Türöffner**:
sie kann ehrliches Praxisfeedback geben, einen Mini-Pilot testen und intern den richtigen Kontakt
herstellen (Produkt / Partnerships / Operations / Community / DACH).

> Richtiger Rahmen: **nicht** „Kannst du das WeRoad verkaufen?", **sondern** „Kannst du mir helfen
> einzuschätzen, ob das für WeRoad-Gruppenreisen nützlich wäre?"

**Kurznachricht (Vorlage):**

> Hey [Name], kurze Frage an dich als WeRoad-Reiseleiterin: Ich baue gerade HolaRuta, eine kleine
> Reise-Spanisch-Web-App für echte Situationen unterwegs — nicht Schulbuch-Spanisch, sondern Taxi,
> Hostel, Essen bestellen, Preise verstehen, Notfall, Smalltalk und kleine Gruppen-Challenges. Läuft
> im Browser/als PWA und hat einen Hostel-/Gruppenmodus mit Battle und Rollenspielen. Könnte so was
> für WeRoad-Reisen nach Lateinamerika spannend sein — als kleines Pre-Trip-Tool oder als
> 5-Minuten-Challenge unterwegs? Magst du kurz reinschauen und mir ehrlich sagen, ob das für
> Reisegruppen praktisch wäre? → https://moarci.github.io/holaRuta/

**Sag ihr, worauf sie achten soll** (sonst zu viele Features): (1) Karten mit Kontext, (2) Hostel
Mode / Battle, (3) Spickzettel / Notfall.

**Fünf konkrete Fragen** (nicht „findest du es gut?"):

1. Würden Reisende vor einer LatAm-Reise so etwas nutzen?
2. Könnte ein Koordinator unterwegs kleine Gruppen-Challenges machen?
3. Welche Situationen fehlen aus deiner Sicht?
4. Nettes Extra oder echter Mehrwert?
5. **Wen müsste man bei WeRoad ansprechen, um einen Pilot zu testen?** ← die wichtigste.

**Mini-Pilot-Idee:** ein kleines Colombia/LatAm-Pack bauen und einmal mit 5–10 Reisenden testen —
kein offizieller Prozess, erstmal nur Feedback (Nutzen, Verständlichkeit, Spaß, fehlende Situationen).

---

## 12. Pitch-Bausteine

**Grundframing — nie „Vokabel-App", immer „Companion":**

> *Nicht:* „Ich habe eine Vokabel-App gebaut."
> *Sondern:* „Ich habe ein mobiles Immersion-Tool gebaut, das Lernende vom Klassenzimmer in echte
> Situationen bringt." (bzw. „… einen offlinefähigen Travel-Language-Companion für Gruppenreisen.")

**Schule (ECOS Edition):**

> HolaRuta ergänzt den ECOS-Unterricht als mobile Reise-Spanisch-App: Schüler üben vor, während und
> nach dem Kurs echte Situationen aus Cartagena — mit Kontextbeispielen, Rollenspielen,
> Partner-Battle und Real-Life-Challenges. Angebot: kostenloser 4-Wochen-Pilot mit 1–2 Gruppen,
> danach 499 USD im ersten Jahr / 999 USD ab dem zweiten.

**Gruppenreise (WeRoad Colombia Pack):**

> HolaRuta ist ein offlinefähiger Travel-Language-Companion für WeRoad-Lateinamerika-Reisen: hilft
> Reisenden bei Taxi, Unterkunft, Essen, Preisen, Notfall und Gruppen-Icebreakern. Für Koordinatoren
> Mini-Challenges und Sprach-Battles als 5-Minuten-Gruppenaktivität.

**Hostel (Spanish Night):**

> Eine fertige Abend-Aktivität für euren Common Room: Sprach-Battle und Rollenspiele für Gäste,
> komplett offline, ohne App-Installation — nur ein QR-Code an der Rezeption.

> **Regel:** Im Pitch nur zusagen, was existiert. Lehrer-/Coordinator-Modus, Pro-Kauf und
> Destination-Packs sind (Stand heute) Roadmap, kein Bestand — sonst entsteht ein Versprechen, das
> die Demo nicht hält.

---

## 13. Risiken & offene Punkte

- **Inhalts-Gegenprüfung durch Lehrkraft/Muttersprachler fehlt** — vor dem Schul-Pitch nachholen.
- **`localStorage`-Shared-Origin auf GitHub Pages** — für ernsthaften Einsatz eigene Domain.
- **Kein Mehrgeräte-Sync** — begrenzt Lehrer-Dashboard und Per-Seat-Modelle.
- **B2C braucht Account-/Kauf-Backend** — ohne das kein Pro-Verkauf.
- **Niveau-Kuration fehlt** — die Stufen sind nur ein Filter, kein Lernpfad.
- **Große Partner (WeRoad, EF, Enforex) haben lange, strukturierte Sales-Zyklen** — erst Referenz
  über kleine Partner aufbauen, dann groß pitchen.

---

> **Fazit:** HolaRuta kann ein kleines, profitables B2B-Nischenprodukt werden — am schnellsten über
> Hostels (Distribution) und Gruppenreisen/Schulen in Kolumbien (Referenz). Der nächste konkrete
> Schritt ist nicht „groß verkaufen", sondern **ein Cartagena/Colombia-Pack (Roadmap-Stufe 1) + ein
> erster Pilot + ein Testimonial**.
