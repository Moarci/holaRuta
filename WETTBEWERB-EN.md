# HolaRuta — Wettbewerb des English-/Locals-Tracks

> **Datum:** 2026-06-27 · **Folgt auf:** [LOCALS.md](LOCALS.md), [MARKT.md](MARKT.md), [RISIKO.md](RISIKO.md), [STATUS.md](STATUS.md)
> **Fokus:** Der **englischseitige** Markt — also der [Locals-Track](LOCALS.md) (`es-en`), in dem
> LatAm-Hospitality-Personal **Englisch** lernt. MARKT.md betrachtet bewusst nur die *Reisenden*-Seite
> (Duolingo/Babbel/Pimsleur/Google Translate); dieses Dokument schließt die Lücke für die Gegenrichtung.
> **Maßgeblich bleibt die [README.md](README.md)** als Single-Source-of-Truth. Dies ist ein datierter
> Analyse-Snapshot, kein laufend nachgezogenes Register.

Grundlage ist eine extern erstellte **Wettbewerbs-Inhaltsmatrix** (für ein IU-Consulting-Framing,
Stand Juni 2026) — Original als Tabelle eingebettet (unten) und als Datei unter
[`docs/pitch/HolaRuta_Wettbewerbsmatrix.xlsx`](docs/pitch/HolaRuta_Wettbewerbsmatrix.xlsx). Die Matrix
wurde **ohne Blick in den Code** gebaut. Dieses Dokument prüft sie gegen den realen Repo-Stand und
leitet Ideen + Schritte ab.

**Kernaussage in einem Satz:** Die Matrix-Empfehlung *ist* bereits unsere Strategie (Zwei-Seiten-Venue,
employer-pays, QR/kontolos) — sie **validiert** die These statt sie umzulenken; sie **unterschätzt**
unseren Inhalts-Stand massiv; sie **deckt aber eine echte Produktlücke** auf (der zwei-seitige
Gast↔Personal-Live-Mechanismus ist nicht gebaut); und ihr größter Mehrwert ist die **englischseitige
Wettbewerbs-Intel**, die unseren Docs bisher komplett fehlte.

---

## 1. Wettbewerbsmatrix (Blatt 1, verdichtet)

Bedrohungsampel für den HolaRuta-Wedge: 🔴 hoch · 🟡 mittel · 🟢 niedrig.

| Anbieter | Modelltyp | Hospitality-Vertical | Speech-Feedback | L1 ES/PT | LatAm-Kontext | Offline | Konto nötig | Preis | Bedrohung |
|---|---|---|---|---|---|---|---|---|---|
| **ELSA Speak** | B2C-App + B2B | Ja (Front Office, Housekeeping, F&B) | **Ja** — KI bis Silbenebene (US-Akzent) | UI mehrspr., Logik EN-zentriert | Gering (US-Norm) | Nein | Ja (App) | Freemium, ~140 USD/Jahr | 🔴 |
| **Voxy** | B2B / B2G | Ja (14 Units / 141 Lektionen, 36 h) | Über Live-Lehrer + Plattform | Lehrer bevorzugt ES/PT | Mittel-hoch (Ceibal Uruguay) | Eingeschränkt | Ja | Enterprise (pro Sitz, hoch) | 🔴 |
| **Open English** | B2C + B2B (LatAm-Kern) | Nein (Allgemein + Business) | Aufnahme (wenig interaktiv) | **Nur ES/PT** | **Hoch** (Kernzielgruppe) | Teilweise | Ja | Abo (mittel-hoch) | 🟡 |
| **ABA English** | B2C-App (ES-Markt) | Nein | Aufnahme/Vergleich (kein KI-Scoring) | UI mehrsprachig | Mittel (US/UK-Filme) | Ja | Ja | Freemium ~8–20 €/Mon | 🟢 |
| **Duolingo** | B2C Massen-Free | Nein | Basis-Shadowing; KI-Roleplay nur „Max" | Ja | Mittel (generisch) | Ja (Premium) | Ja | Free + Super/Max | 🟡 |
| **Dexway** (AI Receptionists & Hotel Workers) | B2B-ESP (Hotels/Ketten) | **Ja, hochspezifisch** (Check-in, Beschwerden, Notfälle) | **Ja** — KI-Rollenspiele mit Auto-Feedback | ES (spanische Herkunft) | Niedrig-mittel (Spanien-zentriert) | Nein (online) | Ja | Kurs-/Lizenzpreis | 🔴 |
| **Hospitality-ESP-Kurse** (Udemy, Reallyenglish, Alison …) | Einzelkurse (teils gratis) | Ja (Standard-Syllabus) | Gering (Record & Playback) | Variiert | Niedrig | Variiert | Ja | Gratis (Alison) bis Kurspreis | 🟡 |
| **Cambly / Preply** | 1:1-Tutor-Marktplatz | Nur falls Tutor/Thema gewählt | Mensch (real) | Immersion (kein L1 nötig) | Variabel | Nein | Ja | Pro Minute/Stunde | 🟡 |
| **HolaRuta · Inglés** (Locals-Track) | **B2B2C über Venue, Lerner gratis** | **Ja — situiert am Arbeitsplatz** | Offen (Constraint vs. offline/kontolos) | **Native LatAm ES** (PT = Phase 2) | **Hoch** (Akzente/Kontext, Mascots) | **Ja (PWA)** | **Nein (QR)** | **Arbeitgeber zahlt / Förderung; Lerner gratis** | — (das sind wir) |

> Hinweis: Inhalts-/Lektionszahlen sind Anbieter- bzw. Drittangaben (Stand Juni 2026) und schwanken je
> nach Plan/Quelle — als Größenordnung zu lesen. Quellen in §5.

---

## 2. Gegencheck: Matrix-Annahme ↔ realer Repo-Stand

Die Matrix beschreibt HolaRuta als geplant/„nachzubauen". Der Code sagt etwas anderes:

| Dimension | Matrix-Annahme | Realer Stand (verifiziert) | Bewertung |
|---|---|---|---|
| **Inhalts-Umfang** | „Standard-Hospitality-Syllabus **(nachzubauen)**" | **818 Karten · 63 Kategorien · 7 Vier-Wochen-Kurse · 20 Diálogos**, buildbar (`build.js --edition=ingles-pro`). Breiter als jeder Wettbewerber: Hospitality **+** Alltag **+** Beruf/BPO/Tech **+** Grammatik/Examen ([LOCALS.md](LOCALS.md), `data.locals.js`) | **Matrix unterschätzt** — Content ist erledigt, nicht offen |
| **Hospitality-Vertical** | „situiert am Arbeitsplatz" | Vollständig: recepción, meseros, quejas/escalación, limpieza/housekeeping, ventas/upselling, teléfono/bpo, platos/bar, guías … | **Erfüllt** |
| **Peer-Roleplay (der Wedge!)** | „Situiertes Peer-Roleplay; Gast↔Personal als **Live-Übung**" | Bisher nur NPC-gesteuerte Diálogos (Einzel-Lerner). **Seit 2026-06-27 als Prototyp gebaut:** `venue-roleplay.js` + `features/venue-roleplay-game.js` — Pass-and-play, Gast übt Spanisch, Personal übt Englisch in einer Szene (MC, TTS pro Zeile) | **Lücke geschlossen (Prototyp)** — der Wedge-Mechanismus existiert jetzt; Ausbau (mehr Szenen, Frei-Tippen) offen |
| **Speech-Feedback** | „Offen (Constraint vs. offline/kontolos)" | TTS-Ausgabe (Web Speech API) + phonetische `tip`-Zeile je Karte; **keine** Spracherkennung/Scoring | **Konsistent** — bewusst nicht hier konkurrieren ([IDEEN.md §6](IDEEN.md)) |
| **L1 ES/PT** | „native LatAm ES/PT" | ES ja (`config.js:73` — `cardNativeLang:"es"`, `ttsLocale:"en-US"`); **PT nicht gebaut** (kein `pt`-Track) | PT = Phase 2, wie Matrix sagt |
| **LatAm-Kontext** | „Hoch (Akzente/Kontext, Mascots)" | LatAm-korrekter Content — **Multi-Agent-Sign-off des EN-Korpus erledigt**, menschlicher Stempel optional ([RISIKO.md R13](RISIKO.md), [LOCALS-SIGNOFF.md](LOCALS-SIGNOFF.md)) | Hauptversprechen abgesichert; finaler Human-Review als Siegel offen |
| **Distribution** | „QR, kein Konto, Co-Branding, employer-pays" | Vollständig: `editions/`-System, `ingles-pro` registriert (`editions/registry.js:79`), offline-PWA, localStorage, kein Login, druckfertige QR-Poster (`docs/anleitungen/`) | **Erfüllt & produktionsreif** |

---

## 3. Wedge & Lücke (Blatt 2, abgeglichen)

**Was ALLE haben (Commodity, kein Moat).** Der funktionale Hospitality-Syllabus ist quer über alle
Anbieter nahezu identisch: Check-in/out, Reservierungen, Beschwerden/Eskalation, Sonderwünsche,
Wegbeschreibung/Empfehlung, Upselling, Telefon, F&B/Menü, Housekeeping. Teils gratis (Alison).
→ **Eigener Content differenziert NICHT.** *Unsere Konsequenz:* Wir haben diese Commodity bereits
(818 Karten) — also kein Bau-Aufwand, aber auch kein Verkaufsargument. Nicht auf Content-Masse setzen.

**Wo der Wettbewerb stark ist (frontal meiden).**
- Speech-/Aussprache-KI: **ELSA, Dexway, Voxy**.
- Live-Lehrer: **Voxy, Open English, ABA**.
- Reichweite/Default-Choice: **Duolingo**.
- LatAm-B2C-Distribution & Marke: **Open English**.
- Produktisiertes KI-Hospitality-Roleplay: **Dexway** — faktisch die Version unserer Idee.

**Wo NIEMAND sauber sitzt (unsere Lücke = Wedge).** Kostenloses, kontoloses, per QR sofort startbares,
offline-fähiges, **situiertes** Peer-Üben von Job-Szenarien **direkt am Arbeitsplatz**, in LatAm-Spanisch
(PT Phase 2), **gekoppelt an die ohnehin anwesenden internationalen Gäste**. Der Vorteil liegt in
**Distribution + Kontext + Zwei-Seitigkeit**, nicht in Content-Masse oder Speech-Genauigkeit.

**Zentrale Risiken (Matrix), mit unserem Abgleich.**
1. Dexway/ELSA/Voxy besetzen KI-Roleplay + Speech-Feedback bereits. → *Wir konkurrieren dort nicht;
   Dexway ist Spanien-zentriert, online-only, konto-/kostenpflichtig — unser Wedge hält.*
2. Speech-Scoring kollidiert technisch mit „offline, kein Konto". → *Deckt sich mit [IDEEN.md §6](IDEEN.md)
   (Aussprache-Check bewusst zurückgestellt) und dem Code (kein STT).*
3. Content allein ist kein Burggraben (Syllabus commoditisiert, teils gratis). → *Bestätigt; unser Moat
   ist Distribution, nicht Inhalt.*
4. Für den billigsten Lerner existiert bereits Gratis (Alison, Duolingo, staatliche Programme). → *Unser
   Lerner zahlt ohnehin nichts; es zahlt der Arbeitgeber/Venue. Free-vs-paid ist nicht unsere Schlacht.*
5. **(Zusätzlich, aus unseren Docs):** [RISIKO.md R13](RISIKO.md) — fehlendes Muttersprachler-Sign-off
   trifft die 818 Locals-Karten **doppelt**, da diese englischen *Output* lehren (andere Fehlerklasse als
   im Reise-Track). Vor Schul-/Hotel-Deals zu schließen.

**Empfehlung (Positionierung).** Nicht auf Content-Masse oder Speech-Genauigkeit konkurrieren. Auf den
**Zwei-Seiten-Venue-Vorteil** setzen: Gast (will Spanisch) **und** Personal (will Englisch) im selben
Hostel/Hotel, ein QR, ein Co-Branding-Deal, Land-and-expand auf bestehende Beziehungen. Standard-Syllabus
ist bereits da; Aussprache bewusst klein halten oder als Online-Premium; Brasilien/Portugiesisch als
Phase 2.

---

## 4. Abgeleitete Ideen & Schritte (priorisiert)

> Leitprinzip wie in [STATUS.md](STATUS.md): der größte Hebel ist nicht noch ein Feature, sondern der
> erste Markt-Beweis — **außer** an der einen Stelle, wo der verkaufte Wedge im Produkt noch fehlt.

**P1 — Zwei-Seiten-Venue-Roleplay ✅ (Prototyp gebaut, 2026-06-27).**
Gast (übt Spanisch) und Mitarbeiter (übt Englisch) spielen eine Szene im Wechsel auf *einem* Gerät
(Pass-and-play, offline, kein Konto); jede:r produziert seine Zeile in der eigenen Lernsprache, TTS spricht
sie in der passenden Stimme (Gast es-419, Personal en-US). **Nur HolaRuta hat beide Richtungen in einer
Engine** → der einzige nicht kopierbare Moat. Umgesetzt: `venue-roleplay.js` (3 bilinguale Szenen),
`features/venue-roleplay-game.js`, Discover-Eintrag „Roleplay del local" (loc-only), Test
`test/venue-roleplay-game.test.js`. **Offener Ausbau:** mehr Szenen, Frei-Tippen statt MC,
Muttersprachler-Sign-off der Szenen.

**P1 — Muttersprachler-/Bilingual-Sign-off der Locals-Karten. → WEITGEHEND ERLEDIGT.**
Der inzwischen auf **2844 Karten** gewachsene EN-Korpus hat einen systematischen
**Multi-Agent-Sign-off** durchlaufen (Review + adversariale Verifikation je Kategorie,
~86 Befunde behoben — [LOCALS-SIGNOFF.md](LOCALS-SIGNOFF.md)). [R13](RISIKO.md) ist für den
English-Track damit deutlich gesenkt. Offen bleibt nur noch ein optionaler finaler
**menschlicher** Native-Stempel als sichtbares „native-reviewed"-Siegel für Schul-/Hotel-Deals.

**P2 — Generische Venue-English-Edition ✅ (gebaut, 2026-06-27).**
`venue-en` in `editions/registry.js` (track `es-en`, ohne ECOS-Bezug, taskTab/teacherTab aus) +
druckfertiges QR-Poster `docs/anleitungen/venue-en.html` (QR → `?edition=venue-en`). Macht employer-pays
sofort über Cartagena hinaus pitchbar: `?edition=venue-en` oder `node build.js --edition=venue-en`.

**P2 — Dexway-Differenzierungs-Slide für den Pitch.**
Eine Folie: HolaRuta (offline · kontolos · gratis-Lerner · LatAm · zwei-seitig) vs. Dexway (Spanien ·
online · Konto · Bezahlung). Entwaffnet den „das gibt's doch schon"-Einwand.

**P3 — Aussprache bewusst klein halten** bzw. als Online-Premium — nicht gegen ELSA/Dexway auf
Speech-Genauigkeit antreten. Deckt sich mit „kein STT" und [IDEEN.md §6](IDEEN.md).

**P3 — Portugiesisch/Brasilien als Phase 2** (neuer `pt`-Track) — erst nach erstem zahlenden
ES-Referenzkunden.

---

## 5. Quellen (Blatt 3)

Belegte Datenpunkte der Matrix (Anbieterangaben/Drittquellen, Stand Juni 2026; als Größenordnung zu lesen):

| Datenpunkt | Quelle | URL |
|---|---|---|
| LatAm Englisch-Niveau überwiegend „low" (KO 480, BR 482, EC <470) | EF EPI 2025 | https://www.ef.com/wwen/epi/ |
| Höheres Sprech-Englisch → 2–3× Einkommen (z. B. Brasilien) | ELSA / TechCrunch 2021 | https://techcrunch.com/2021/01/31/english-learning-app-elsa-lands-15-million-series-b-for-international-growth-and-its-b2b-platform/ |
| LAC-Tourismus 2024: ~28,2 Mio. Jobs (1 von 11), 714 Mrd. USD (10 % BIP) | WTTC / IDB 2025 | https://www.iadb.org/en/news/idb-and-wttc-join-forces-strengthen-tourism-latin-america-and-caribbean |
| „Talent & Beschäftigung" als Kern-Enabler der Branche | WTTC 2025 | https://wttc.org/news/travel-and-tourism-in-lac-set-to-add-usd-206bn-to-regional-economy-over-the-next-decade |
| ELSA: 3.000+ Lektionen / 129 Themen (Schule: 8.300+) | ELSA FAQ / Schools | https://vn.elsaspeak.com/b2b/school-en/ |
| ELSA Hospitality-Vertical (Front Office, Housekeeping, F&B) | ELSA for Hospitality | https://vn.elsaspeak.com/b2b/hospitality-en/ |
| Voxy Hospitality: 14 Units / 141 Lektionen, task-based | Voxy Travel & Hospitality | https://voxy.com/industries/travel-hospitality/ |
| Voxy: authentische Medien, 20.000+ Inhalts-Stücke | Voxy Platform | https://voxy.com/voxy-platform/ |
| Open English: 6 CEFR-Stufen, L1 nur ES/PT, Live-Lehrer | Open English Review (Hawaii) | https://scholarspace.manoa.hawaii.edu/bitstreams/28eae48c-375b-4f32-bc51-3ad4c9dbc634/download |
| ABA English: 144 Units, ABA Films, „Interpreta"-Roleplay | ABA-Reviews | https://es.wikipedia.org/wiki/ABA_English |
| Duolingo: EN-ab-ES CEFR A1–B2, gamifiziert; AI-Roleplay nur Max | Duolingo Course Data | https://duocorner.com/how-many-sections-in-duolingo/ |
| Dexway: 30 h Hospitality, KI-Roleplays mit Auto-Feedback | Dexway | https://www.dexway.com/professional-english-for-the-hospitality-industry/ |
| Hospitality-ESP Standard-Syllabus (check-in, complaints, upselling) | Udemy / Reallyenglish / Alison | https://www.reallyenglish.com/en-gb/esp/english-for-hospitality |
