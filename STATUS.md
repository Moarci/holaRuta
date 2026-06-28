# HolaRuta — Standortbestimmung (Status-Snapshot)

> **Datum:** 2026-06-23 · **Folgt auf:** [AUDIT.md](AUDIT.md), [RISIKO.md](RISIKO.md), [IDEEN.md](IDEEN.md), [MARKT.md](MARKT.md), [WETTBEWERB-EN.md](WETTBEWERB-EN.md)
> **Fokus:** Wo steht das Projekt *jetzt* — qualitativ **und** marktmäßig — und was ist der nächste konkrete Hebel.
> **Maßgeblich bleibt die [README.md](README.md)** als Single-Source-of-Truth (Tabelle „Projektstatus", per `test/doc-consistency.test.js` gegen den Code abgesichert). Dieses Dokument ist ein datierter Snapshot, kein laufend nachgezogenes Register.

---

## Kurzfazit

HolaRuta ist ein **technisch außergewöhnlich reifes, inhaltlich sehr dichtes Nischenprodukt** — aber
kommerziell weiterhin in der **Vor-Pilot-Phase**. Die Substanz ist da; was fehlt, ist nicht mehr Code,
sondern **der erste zahlende Referenzkunde und ein menschliches Qualitäts-Sign-off**. Das Risiko hat
sich vom Produkt zum Vertrieb verschoben.

---

## 1. Qualitativer Stand

### Verifizierter Ist-Stand (Snapshot)

| Kennzahl | Wert (verifiziert) | Quelle |
|---|---|---|
| Version | v1.114.0 | `package.json`, README-Header |
| Karten | 2293 | README-Projektstatus (test-abgesichert) |
| Bereiche / Kategorien | 72 | README-Projektstatus (test-abgesichert) |
| Lernmodi | 3 (Karteikarte · Schreiben · Hören) | README |
| Tests | 622 literale `test()`-Deklarationen, **alle grün** (Laufzeit inkl. dynamisch generierter: 633) | `npm test` |
| Test-Dateien | 56 | `test/*.test.js` |
| Laufzeit-Dependencies | 0 | `package.json` |
| Destination-Packs | 9 (Colombia 89 · Peru 45 · Mexiko 41 · Costa Rica 40 · Ecuador 40 · Guatemala 40 · Argentinien 40 · Chile 40 · Bolivien 40) | MARKT/BAUPLAN |
| Code-Audit | 0 CRITICAL | [AUDIT.md](AUDIT.md) |

### Stark
- **Architektur:** Vanilla-JS-PWA, 0 Runtime-Dependencies, reine Funktionen im Kern (`srs`, `matcher`,
  `stats`), Immutability, Event-Delegation, graceful degradation. Für den Umfang vorbildlich.
- **Audit-/Risiko-Lage:** 0 CRITICALs, kein exploitierbares XSS, keine falschen Übersetzungen. Die
  früheren HIGH-Findings (Matcher ES→DE, Service-Worker-Precache-Freeze, fehlendes CI-Test-Gate) sind
  laut [RISIKO.md](RISIKO.md) behoben.
- **Inhaltstiefe & Feature-Breite:** weit über eine Vokabel-App hinaus (Diálogos, Historia mit
  Lesetraining, Bailar, Juegos, Mi léxico, HolaRuta-Check, mehrsprachige UI DE/EN …).
- **Entwicklungstempo:** sehr hoch und aktiv — das Projekt ist in wenigen Wochen zum heutigen Umfang
  gewachsen.

### Echte verbleibende Schwächen (offen, aus den eigenen Docs)
1. **Kein Muttersprachler-/Lehrkraft-Sign-off** der Inhalte (RISIKO R13). Heute nur agent-geprüft. Für
   den Schulkanal ein Showstopper.
2. **Niveau ist ein Filter, kein Lernpfad.** A1/A2/B1 sind ein Häkchen-Filter, keine didaktische
   Progression — Schulen erwarten kuratierte Pfade.
3. **`localStorage`-Shared-Origin auf `github.io`** — eigene Domain nötig für ernsthaften
   Partnereinsatz.
4. **Kein Mehrgeräte-Sync / keine Accounts** (bewusst Roadmap-Stufe 3) — begrenzt Lehrer-Dashboard und
   Per-Seat-Modelle.
5. **Wikimedia-Bilder** als einziger externer Request (CC-BY-Attributionspflicht, kleiner IP-Leak,
   nicht offline).

### Hinweis zur Doku-Konsistenz
Eine geprüfte „Drift"-Vermutung hat sich **nicht** bestätigt: Die README-Testzahl **622** ist korrekt —
sie zählt bewusst literale `test()`-Deklarationen (per `doc-consistency.test.js` abgesichert); die
Laufzeit-633 enthält zusätzlich dynamisch generierte Fälle. Die Angabe „JS-Module" ist **unscharf
definiert** (50 Dateien mit `window.SC`, ~60 `SC.*`-Namespaces, 64 Script-Tags) und nicht
test-abgesichert; bewusst **nicht** spekulativ geändert.

**Qualitäts-Urteil:** technisch A-, inhaltlich B+ (gehemmt allein durch das fehlende menschliche
Sign-off).

---

## 2. Marktstand

### Positionierung (überzeugend)
Kein Allzweck-Wettbewerb gegen Duolingo/Babbel, sondern die bewusst ausgelassene Nische:
**situatives, LatAm-korrektes Reise-Spanisch, offline, ohne Tracking.** Differenzierung (LatAm-korrekt ·
situativ statt kursförmig · offline-PWA · privacy by design) ist scharf und glaubwürdig — Details in
[MARKT.md §1b](MARKT.md).

### Vier Kanäle — realistisch sortiert

| Kanal | Fit | Reife |
|---|---|---|
| **Hostels** | naheliegendster Produkt-Fit („Hostel Mode") | bester Warm-Up-Kanal, kaum Zahlungsbereitschaft → Distribution/Testimonials |
| **Gruppenreisen** (WeRoad & Co.) | emotional am stärksten | ausgearbeitetes Proposal vorhanden, Pilot fehlt |
| **Sprachschulen** (ECOS/Cartagena) | gut, didaktisch anspruchsvoll | braucht Sign-off + Kursmodus |
| **B2C** | groß, aber marketing-/backend-intensiv | nachrangig (kein Kauf-/Account-Backend) |

### Was vertrieblich schon steht
- Roadmap-**Stufe 1 (MVP)** und **Stufe 2 (Editions/White-Label via `build.js --edition`)** umgesetzt.
- Druckfertige Handouts (DE/EN/ES) für Lehrer, Coordinator, Hostel unter `docs/anleitungen/`.
- Pitch-One-Pager + ausgearbeitetes WeRoad-Colombia-Proposal unter `docs/pitch/`.

### Was den Umsatz heute blockiert (kein Code-Problem mehr)
1. **1 menschliches Inhalts-Sign-off** (Schul-Voraussetzung).
2. **1 echter Pilot + 1 Testimonial** (Henne-Ei-Durchbruch).
3. **Stufe 3** (Accounts/Sync/Per-Seat) — bewusst aufgeschoben bis zum zahlenden Kunden ([BACKEND.md](BACKEND.md)).

### Umsatzrealität (aus [MARKT.md](MARKT.md), plausibel)
Aufbaupfad Jahr 1 ~10k → Jahr 2 30–50k → Jahr 3 75k+ USD. >100k kurzfristig unrealistisch — Markt ist
speziell, Schulen kaufen langsam.

---

## 3. Nächste konkrete Schritte (Vertriebs-Checkliste)

> Leitprinzip: Der größte Hebel ist **nicht** noch ein Feature, sondern der **erste Markt-Beweis**.
> Reihenfolge bewusst: erst der kostenlose, schnelle Distribution-/Feedback-Kanal, dann der erste Pilot,
> dann der Schulkanal.

### Sofort (Tage, ~0 €)
- [ ] **Cartagena-Hostel-QR** aufhängen (1–2 Hostels, Common Room / Rezeption). Liefert erste echte
      Nutzer + Praxisfeedback. Asset existiert: `docs/anleitungen/hostel.html` (Poster mit QR).
- [ ] **Warm-Intro WeRoad** anstoßen (Reiseleiter:in) nach dem Playbook in [MARKT.md §11](MARKT.md) —
      Rahmen „hilf mir einschätzen", nicht „verkauf das".
- [ ] **Feedback-Kanal** sichtbar machen (eine Mailadresse auf dem Pitch-One-Pager).

### Kurzfristig (Wochen)
- [ ] **Muttersprachler-Gegenlesung** eines Kern-Sets (Spickzettel + Colombia-Pack) beauftragen —
      entriegelt den Schulkanal, schließt RISIKO R13. Ergebnis als sichtbares „native-reviewed"-Siegel.
- [ ] **Erster Pilot** festklopfen (WeRoad-Colombia **oder** ECOS Cartagena): 4–6 Wochen, 1–2 Gruppen,
      kostenlos, mit Feedbackgespräch. Proposal liegt bereit (`docs/pitch/weroad-colombia.html`).
- [ ] **Ein Testimonial** einsammeln (Zitat + Name/Logo, Freigabe schriftlich).

### Mittelfristig (Quartal, nur bei Pilot-Zugkraft)
- [ ] **Eigene Domain** statt `github.io`-Subpfad (behebt `localStorage`-Shared-Origin, wirkt seriöser).
- [ ] **Niveau-Kuration:** benannte Starter-Sets („Pre-Arrival 100" / „Survival 50") statt nur freiem
      Filter ([MARKT.md §6a](MARKT.md), [BAUPLAN.md](BAUPLAN.md)).
- [ ] **Erste bezahlte Lizenz** (School Starter 499 USD bzw. Destination-Pack) auf Basis des Piloten.
- [ ] **Stufe 3 nur bei zahlendem Referenzkunden** anstoßen (Accounts/Sync/Per-Seat, [BACKEND.md](BACKEND.md)).

### Definition of „durchgebrochen"
> Nicht ein Umsatzziel, sondern: **1 zahlende Schule/Partner · 1 gutes Testimonial · 1 School/Destination
> Edition · 1 klarer Pitch.** Steht das, wird HolaRuta ein kleines, profitables Nischenprodukt.

---

> **Fazit:** Klassisches „starkes Produkt, fehlender Markt-Beweis"-Profil. Produkt-seitig ist die Arbeit
> getan; der nächste Meter ist vertrieblich und qualitätssichernd (menschliches Sign-off), nicht
> technisch.
