# HolaRuta — Investor-KPIs: Das „Killer-Tracking"-Konzept

> **Stand:** 2026-07-10 · **Code:** [`analytics.js`](../analytics.js) (Client), [`tools/telemetry-server.js`](../tools/telemetry-server.js) (`aggregate()`), [`tools/telemetry-dashboard.html`](../tools/telemetry-dashboard.html) (Cockpit)
> **Grundlagen:** [`docs/TELEMETRIE.md`](./TELEMETRIE.md) (Feldwahrheit), [`BACKEND.md §17`](../BACKEND.md) (Server-/DSGVO-Spec)
>
> Dieses Dokument ist das **Konzept**: welche Kennzahlen ein Investor sehen will, **wie**
> jede aus echten App-Interaktionen berechnet wird (Formel · Datenquelle · Ziel) und **wo**
> sie im Code entsteht. Es **dupliziert** die Feldtabellen aus `TELEMETRIE.md` nicht, sondern
> baut darauf auf und führt das bestehende Tracking zu einem kohärenten AARRR-Cockpit zusammen.

---

## 0. In drei Sätzen

HolaRuta trackt **pro Person** (pseudonyme `clientId`), **pro Sitzung** (`sessionId`),
**pro Tag** (`day`), **pro Kohorte** (Erst-Tag) und **pro Edition** (B2B) — alles **opt-in**
und **ohne PII**. Aus diesem einen Event-Strom rechnet die reine `aggregate()`-Funktion das
komplette **AARRR-Framework** (Acquisition, Activation, Retention, Revenue, Referral) plus die
**North-Star-Metrik** und legt sie im **Investor-Cockpit** des Dashboards ab. So beantwortet
jede Investor-Frage — „Wie viele? Bleiben sie? Wie tief? Wächst es von selbst?" — eine Zahl aus
tatsächlichem Nutzerverhalten, nicht aus einer Schätzung.

---

## 1. North-Star-Metrik (NSM)

> **Weekly Active Learners (WAL)** = distinkte `clientId` mit **≥ 1 abgeschlossenen Lernrunde**
> (`session_complete`) in den letzten 7 Tagen.

| | |
|---|---|
| **Warum diese Metrik** | Sie verbindet die ganze Wertschöpfungskette in einer Zahl: jemand muss die App **finden** (Acquisition), **starten** (Activation) und **wiederkommen** (Retention), um mitzuzählen. Sie belohnt echtes Lernen, nicht bloßes Öffnen. |
| **Formel** | `|{ clientId : ∃ session_complete in [heute−6 … heute] }|` |
| **Datenquelle** | Event `session_complete` (feuert in `app.js:finishRound()`) |
| **Sekundär** | Ø Lernrunden je Learner (`nsm.avgSessionsPerLearner`) — die **Tiefe** hinter der Breite |
| **Trend** | Woche-über-Woche (`nsm.trend.deltaPct`), damit Wachstum sofort sichtbar ist |
| **Ziel/Benchmark** | konsumenten-typisch: **WAL Woche-über-Woche +5–7 %** in der Wachstumsphase; Verhältnis **WAL/MAU ≥ 0,5** (`nsm.walMauPct`, die Hälfte der Monatsnutzer lernt wöchentlich) |

Cockpit: Kachel **★ North Star: WAL** mit Vorwochen-Pfeil.

---

## 2. AARRR-Framework

Jede Zeile: **KPI → Formel → Event-Datenquelle → Zielwert**. Alle KPIs liegen im
`investor`-Block von `aggregate()` bzw. im vorhandenen `users`/`sessions`-Block.

### 2.1 Acquisition — „Woher kommen sie?"

| KPI | Formel | Quelle | Ziel |
|---|---|---|---|
| Neue vs. wiederkehrende Starts | `app_open.returning` = false/true | `app_open` | — |
| **Akquise-Quelle** | distinkte Nutzer nach **erster** Quelle | `app_open.src` (`task`/`onboard-link`/`module-link`/`edition`/`direct`) | Anteil **nicht-`direct`** wächst = Kanäle greifen |
| Neu-Nutzer/Tag (Trend) | distinkte clientId mit Erst-Tag = Tag | `clientFirstDayAll` | positiver Trend |

### 2.2 Activation — „Kommen sie ins Lernen?"

> **Aktivierungsrate** = aktivierte / neue Nutzer. **Aktiviert** = ≥ 1 `session_complete`.

| KPI | Formel | Quelle | Ziel |
|---|---|---|---|
| **Aktivierungsrate** | `|neu ∩ aktiviert| / |neu|` | `session_complete` + Erst-Tag | **> 40 %** der Neuen lernen mind. eine Runde |
| Aktivierungs-Funnel | neu → `onboarding_complete` → first_session → wiederkehrend | `onboarding_*`, `activation:first_session`, aktive Tage | jede Stufe möglichst wenig Drop-off |
| „Aha"-Moment | erste je abgeschlossene Runde | `activation` (`milestone:first_session`) | schnell nach Erst-Open |

Cockpit: Kachel **Aktivierungsrate** + Panel **Aktivierungs-Funnel**.

### 2.3 Retention — „Bleiben sie?" (der Kern jeder Bewertung)

| KPI | Formel | Quelle | Ziel |
|---|---|---|---|
| **D1 / D7 / D30-Retention** | von Nutzern mit Erst-Tag+N ≤ heute: Anteil an Tag N wieder aktiv | `clientsAll` (Tagesmengen je clientId) | konsumenten-typisch **D1 ≥ 25 %, D7 ≥ 15 %, D30 ≥ 8 %** |
| **Kohorten-Heatmap** | Erst-Tag × Tag-N-Gitter (% wieder aktiv) | `investor.cohorts` | Kurven flachen ab (nicht auf 0) = Produkt hält |
| **Stickiness** | Ø DAU / MAU | `users.stickinessPct` | **≥ 20 %** (täglich-relevantes Produkt) |
| Wiederkehrrate | Anteil mit ≥ 2 aktiven Tagen | `users.returnRatePct` | steigend |
| **Growth Accounting** | neu / wiederkehrend / reaktiviert / abgewandert | `investor.growth` | — |
| **Quick Ratio** | (neu + reaktiviert) / abgewandert | `investor.growth.quickRatio` | **> 1** (Wachstum), gute Produkte **> 1,5** |
| **Bounce** (nur 1 Tag aktiv) | Anteil Nutzer mit genau 1 aktivem Tag | `investor.quality.bouncePct` | niedrig = starke Aktivierung/Retention |
| Streak / aktive Tage | Snapshot-Verteilungen | `usage`-Snapshot | rechtslastig |
| **Stabilität** (Fehler/Sitzung) | JS-Fehler / Sitzungen | `investor.quality.errorsPerSession` | niedrig = wenig Churn-durch-Bugs |

Cockpit: **Retention-Kohorten**-Heatmap + Panel **Growth Accounting** + Kacheln D1/D7/D30, Stickiness, Quick Ratio.

### 2.4 Revenue — „Wie wird Geld verdient?" (Leitindikatoren, pre-revenue)

HolaRuta ist heute kostenlos; Umsatz kommt aus **B2B-Editionen** (Schulen, Hostels,
Reiseanbieter — Co-Branding/Lizenzen). Bis Zahlungen fließen, tracken wir **Umsatz-Leitindikatoren**:

| KPI | Formel | Quelle | Ziel |
|---|---|---|---|
| **Aktive Editionen** | Editionen mit ≥ 1 aktivem Nutzer | `investor.editions` | wächst je Vertriebs-Deal |
| **Nutzer / Sessions je Edition** | pro Edition | `investor.editions[].users/sessions` | pro Partner steigend |
| **Aktivierung je Edition** | aktiviert / Nutzer je Edition | `investor.editions[].activationPct` | belegt Partner-Wert (Retention/Nutzung) |
| **WAU je Edition** | aktive Nutzer 7 T je Edition | `investor.editions[].wau` | Grundlage für Seat-/Lizenz-Pricing |

**Vorwärtsgerichtete Definitionen** (sobald Zahlungen existieren, s. `BACKEND.md`): **ARPU** =
Umsatz / aktive Nutzer, **LTV** = ARPU × Ø Lebensdauer (aus Retention-Kurve), **CAC** =
Akquise-Kosten / neue Nutzer, Zielkorridor **LTV/CAC ≥ 3**. Die Retention-Kurve (§2.3) liefert
schon heute die **Lebensdauer-Schätzung** für LTV.

Cockpit: Panel **B2B: KPIs je Edition** (Tabelle).

### 2.5 Referral / Virality — „Wächst es von selbst?"

| KPI | Formel | Quelle | Ziel |
|---|---|---|---|
| Teilende Nutzer / Shares | distinkte Sharer, Shares gesamt | `share`-Event (`content`) | steigend |
| Shares je Nutzer | Shares / Nutzer | `investor.virality.sharesPerUser` | — |
| **Share-Installs** (Fenster) | im Fenster aktive Nutzer, deren **erste Quelle** (lebenslang bestimmt) ein Teil-Link ist | `investor.virality.sharedInstalls` | wächst |
| **K-Faktor** (viraler Koeffizient, 7-T-Periode) | virale Neuzugänge der letzten 7 T / aktive Basis der Vorwoche | `investor.virality.kFactor` = `viralNew7 / base7` | **> 0,5** stark viral-unterstützt; **> 1** = selbsttragendes Wachstum |

Cockpit: Kachel **K-Faktor** + Panel **Virality**.

### 2.6 Engagement / Tiefe — „Wie intensiv nutzen sie es?" (der Investoren-Kern)

> **Interaktionen pro Person · pro Sitzung · pro Tag** — die vom Auftrag geforderte Kern-Sicht.

| KPI | Formel | Quelle | Ziel |
|---|---|---|---|
| **Interaktionen / Sitzung** | Events je `sessionId` (Ø, Median, Histogramm) | `investor.interactions.perSession` | rechtslastige Verteilung |
| **Interaktionen / Person** | Events je `clientId` (Ø, Median, Histogramm) | `investor.interactions.perUser` | — |
| **Interaktionen / aktivem Tag** | Events / (aktive Nutzer-Tage) | `investor.interactions.perActiveDay` | — |
| **Ø Sitzungsdauer** | ts-Spanne je `sessionId` | `sessions.avgDurationSec` | — |
| **Ø Lernzeit / Runde** | exaktes `secs` je `session_complete` | `investor.timeOnTask` | — |
| **Feature-Adoption** | je Modus jemals benutzt | `usage`-Snapshot | breit |
| **Runden-Abschlussquote** | abgeschlossene / begonnene Lernrunden | `investor.rounds` (`session_complete` / `session_start`) | hoch = Nutzer ziehen Runden durch |
| **Start↔Abschluss-Quote** je Lernspiel | `feature_complete` / `feature_start` | `investor.featureFunnel` | hoch = Spiele fesseln, kein Abbruch |

Cockpit: Kacheln **Ø Interakt./Sitzung**, **Ø Lernzeit/Runde** + Panels **Interaktionen pro
Sitzung/Person**, **Lernspiel: Start → Abschluss**.

---

## 3. Granularität pro Person · Sitzung · Tag · Kohorte · Edition

| Ebene | Schlüssel | Beispiel-KPIs |
|---|---|---|
| **Person** | `clientId` (pseudonym, resetbar) | Interaktionen/Person, Aktivierung, Retention, K-Faktor |
| **Sitzung** | `sessionId` (rotiert nach 30 min) | Interaktionen/Sitzung, Sitzungsdauer, Lernzeit/Runde |
| **Tag** | `day` (lokaler Tag) | DAU, Interaktionen/aktivem Tag, Aktivität nach Uhrzeit/Wochentag |
| **Kohorte** | Erst-Tag der Person | Kohorten-Heatmap, D1/D7/D30, Growth Accounting |
| **Edition** | `edition` (B2B) | Nutzer/Sessions/WAU/Aktivierung je Partner |

Der **Granularitäts-Sprung** gegenüber dem früheren Tracking: `session_complete` trägt jetzt
neben den groben Buckets **exakte Ganzzahlen** (`answered_n`, `correct_n`, `xp_n`, `secs`), damit
die Tiefe pro Sitzung **präzise** statt nur gebucketet ist.

---

## 4. Datenschutz-Position (ein Investor-Asset, kein Widerspruch)

Mehr Granularität heißt hier **feinere Zahlen**, **nicht** mehr Identität:

- **Opt-in & Default aus:** ohne konfigurierten Endpunkt **und** ausdrückliche Zustimmung → **0**
  Netzwerk-Calls (Test-belegt, `analytics.test.js`).
- **Pseudonym, kein PII:** `clientId` ist zufällig und **jederzeit resetbar**; kein Klarname,
  keine E-Mail, keine Geräte-Fingerprints, keine Cookies, keine Drittanbieter-Tracker.
- **Keine Inhalte:** kein Suchtext, keine Karten-Texte/-IDs, keine Freitexte — der Allowlist-
  Sanitizer verwirft alles Nicht-Gelistete strukturell (`analytics.js`).
- **Exakte Ints ≠ PII:** `secs` ist gegen Fingerprinting auf 1 h gedeckelt; alle Zähler sind
  ganzzahlig und ohne Kontext nicht auf eine Person rückführbar.
- **DSGVO/EU:** Löschung per `clientId` möglich (Art. 17), befristete Aufbewahrung, EU-Hosting
  vorgesehen (`BACKEND.md §17.3/§12`).

Für einen europäischen Investor ist das ein **Verkaufsargument**: belastbare Produkt-Metriken
**ohne** Third-Party-Tracking-Risiko.

---

## 5. Wo die Zahlen entstehen (Architektur, End-to-End)

```
App-Interaktion → analytics.track(<event>)  ──►  POST /v1/events (opt-in, Batch)
                                                        │
                        tools/telemetry-server.js: aggregate(events, usage)
                                                        │  investor{ nsm, cohorts, growth,
                                                        │            activation, virality,
                                                        │            interactions, timeOnTask,
                                                        │            featureFunnel, editions }
                                                        ▼
                        tools/telemetry-dashboard.html  →  📈 Investor-Cockpit
```

- **Events** (Taxonomie & Felder): `docs/TELEMETRIE.md §3` — inkl. der neuen `feature_start`,
  `share`, `activation` und der granularen `session_complete`-Ints.
- **Aggregation:** rein & unit-getestet (`test/telemetry-aggregate.test.js`), Map/Set-basiert
  (injection-sicher).
- **Cockpit:** Vanilla + SVG/Heatmap, keine externen Abhängigkeiten.

---

## 6. Betrieb & Demo (für den Pitch)

```bash
node tools/telemetry-server.js          # Collector + Dashboard auf :8789
# Dashboard:  http://localhost:8789/     (Zeitfenster 7/30/90 T, JSON/CSV-Export)
# KPI-Export: GET /api/kpis.csv          (eine Investor-KPI-Zeile fürs Data-Room; Button „KPI-CSV")
```

In einer Edition den Endpunkt setzen und im Profil „Nutzungsstatistik teilen → An":

```js
analytics: { enabled: true, endpoint: "http://localhost:8789" }
```

> ⚠️ Der mitgelieferte Collector ist ein **Self-Host-/Demo-Tool** (Datei-Storage, In-Memory-
> Aggregation, optionaler Token). Für Produktion gehören ein echter Event-Store, Auth,
> Rate-Limits und EU-Hosting davor — siehe [`BACKEND.md §17.6`](../BACKEND.md).

---

## 7. KPI-Schnellreferenz (Cockpit → Kennzahl)

| Cockpit-Element | KPI | `aggregate()`-Feld |
|---|---|---|
| ★ North Star: WAL | Weekly Active Learners + Trend + WAL/MAU | `investor.nsm` |
| Runden-Abschluss | abgeschlossene / begonnene Runden | `investor.rounds` |
| DAU / WAU / MAU | aktive Nutzer | `users.dauToday/wau/mau` |
| Stickiness | Ø DAU / MAU | `users.stickinessPct` |
| Aktivierungsrate + Funnel | aktiviert / neu | `investor.activation` |
| Retention-Kohorten (Heatmap) | Erst-Tag × Tag-N | `investor.cohorts` |
| Growth Accounting + Quick Ratio | neu/wiederk./reakt./abgew. | `investor.growth` |
| K-Faktor / Virality | virale Neuzugänge 7T / Basis Vorwoche | `investor.virality` |
| Interaktionen / Sitzung · Person · Tag | Engagement-Tiefe | `investor.interactions` |
| Ø Lernzeit / Runde | Time-on-Task | `investor.timeOnTask` |
| Bounce / Stabilität | 1-Tag-Nutzer % · Fehler/Sitzung | `investor.quality` |
| Start → Abschluss je Spiel | Abschlussquote | `investor.featureFunnel` |
| B2B: KPIs je Edition | Umsatzkanal | `investor.editions` |
