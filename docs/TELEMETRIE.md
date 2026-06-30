# HolaRuta — Telemetrie: Was wird geloggt, wo und wie?

> **Stand:** 2026-06-30 · **Code:** [`analytics.js`](../analytics.js) · **Spec/Server:** [BACKEND.md §17](../BACKEND.md) · **Demo-Collector:** [`tools/mock-events-server.js`](../tools/mock-events-server.js)
>
> Diese Datei ist die **einzige Quelle der Wahrheit**, welche Daten die App – **nur mit
> ausdrücklicher Zustimmung** – an einen konfigurierten Telemetrie-Endpunkt sendet. Sie
> beschreibt **jedes Feld** und **wo** es im Code erfasst wird.

---

## 0. In einem Satz

HolaRuta sendet **standardmäßig nichts**. Erst wenn (1) eine Edition einen Endpunkt setzt
(`SC.config.analytics = { enabled:true, endpoint:"…" }`) **und** (2) der Nutzer im Profil
„Nutzungsstatistik teilen" auf **An** stellt, gehen zwei Dinge raus: ein **anonymer Tages-Snapshot**
und ein **pseudonymer Interaktions-Event-Strom**. Beide enthalten **nur grobe Enums/Zahlen-Buckets** –
**kein** Suchtext, **keine** Kartentexte/-IDs, **keine** Namen, **keine** Freitexte.

---

## 1. Die zwei Datenströme

| Strom | Endpunkt | Frequenz | Zweck | Quelle |
|---|---|---|---|---|
| **Tages-Snapshot** | `POST /v1/usage` | höchstens **1×/Tag** (App-Start) | „wie viele & grob was" (Reichweite) | `analytics.buildUsageSnapshot()` |
| **Event-Strom** | `POST /v1/events` (Batch) | gebündelt, alle ~15 s + beim Schließen | „was genau" (Funnels, Retention, Monitoring) | `analytics.track()` / `flush()` |

---

## 2. Tages-Snapshot (`POST /v1/usage`)

Erzeugt von `buildUsageSnapshot(gamestats, meta)` in [`analytics.js`](../analytics.js). Rein aus dem
**bereits vorhandenen** `gamestats` abgeleitet – es wird **nichts Neues** erfasst.

| Feld | Typ | Inhalt |
|---|---|---|
| `app` | const | `"holaruta"` |
| `schema` | const | `1` |
| `day` | `YYYY-MM-DD` | lokaler Tag |
| `appVersion` | string ≤20 | z. B. `"1.120.0"` (aus `changelog.VERSION`) |
| `locale` | string ≤8 | UI-Sprache (`de`/`en`/`es`) |
| `track` | string ≤12 | Lern-Track (`de-es`/`es-en`) |
| `edition` | string ≤16 | Co-Branding-Edition (B2B) oder `"none"` |
| `platform` | string ≤12 | grobe Plattform-Klasse: `android`/`ios`/`mobile`/`desktop`/`other` (UA wird **nur lokal** ausgelesen, **nie** gesendet) |
| `cardsToday` | Bucket | Karten heute, Kanten `[10, 30, 60]` → `"0"`,`"1-10"`,`"11-30"`,`"31-60"`,`"61+"` |
| `streak` | Bucket | Tagesserie, Kanten `[1, 3, 7, 30]` |
| `reviews` | Bucket | Bewertungen gesamt (Lebenszeit), Kanten `[10, 50, 200, 1000]` |
| `mastered` | Bucket | **% gemeisterte Karten** (Lernfortschritt), Kanten `[10, 25, 50, 75, 90]` |
| `tripGoal` | bool | hat ein Reiseziel gesetzt? |
| `tripDaily` | Bucket | Tagesziel (Karten/Tag), Kanten `[5, 10, 20, 40]` |
| `features` | Objekt aus **Booleans** | je Modus „**jemals** benutzt": `study, listen, precios, dialogos, definiciones, yesto, frases, conjug, battles, roleplay, challenges, ruta, pretrip` |

> **Keine** IDs, **keine** PII, **keine** Karteninhalte. Tages-Dedupe rein clientseitig
> (`spanischcard.analyticssent.v1`).

---

## 3. Event-Strom (`POST /v1/events`)

Jedes Event hat einen festen **Envelope** (gebaut von `buildEvent()`):

```
{ v:1, ts, day, clientId, sessionId, seq, appVersion, locale, track, edition, platform, event, props }
```

| Envelope-Feld | Inhalt |
|---|---|
| `v` | Schema-Version (`1`) |
| `ts` | Zeitstempel (ms) |
| `day` | lokaler Tag `YYYY-MM-DD` |
| `clientId` | **pseudonyme**, resetbare Geräte-Id (zufällig; kein Klarname) |
| `sessionId` | **pseudonyme** Sitzungs-Id (pro App-Start, rotiert nach 30 min Inaktivität) |
| `seq` | fortlaufende Nummer (Dedupe/Reihenfolge) |
| `appVersion` / `locale` / `track` / `edition` / `platform` | wie beim Snapshot |
| `event` | Event-Name (s. u.) |
| `props` | **Allowlist-gefilterte** Felder (Default deny) |

### 3.1 Alle Events (heute gesendet) — Feld für Feld

| Event | `props` | Wo erfasst (Datei · Funktion) | Bedeutung |
|---|---|---|---|
| **`app_open`** | `returning`:bool · `load_ms`:Bucket`[200,500,1000,3000]` | `app.js` · `setupAnalyticsEvents` (Boot) | App geöffnet; `returning` = es gab schon mal einen Lerntag |
| **`perf`** | `load_ms`:Bucket`[200,500,1000,3000]` | `app.js` · `setupAnalyticsEvents` (Boot) | grobe Startzeit (`performance.now`) |
| **`screen_view`** | `screen`:slug · `tab`:slug | `app.js` · `render()` → `trackScreenView` | Ansicht gewechselt (nur bei echtem Wechsel; `tab` nur auf Home) |
| **`action`** | `action`:slug · `mode` · `dir` · `level` · `tab` · `scope` | `app.js` · `onClick` (Aktions-Dispatch) | jeder Button-Klick mit `data-action`; **ausgenommen** die Hochfrequenz-Aktionen `flip`/`rate`/`skip`/`speak` (separat erfasst) |
| **`session_start`** | `scope`:slug · `origin`:slug · `mode` · `cards`:Bucket`[5,10,20,40]` | `app.js` · `beginRound()` | Lernrunde gestartet – deckt **alle 6** Startpfade ab (Kategorie/Alles, Preset, Pre-Trip-Tag, Ruta del día, Favoriten, Einzelkarte). `scope` = `"all"`/Kategorie-Slug |
| **`session_complete`** | `answered`:Bucket`[1,5,10,20,40]` · `accuracy`:Bucket`[25,50,75,90,99]` · `xp`:Bucket`[10,30,60,120]` · `again`:Bucket`[1,3,6,12]` | `app.js` · `finishRound()` | Lernrunde beendet (grobe Kennzahlen) |
| **`card_rated`** | `rating`:`again`/`good`/`easy` · `mode` · `level` · `cat`:Kategorie-slug | `app.js` · `rate()` | eine Karte bewertet – **nur** Bewertung/Modus/Stufe/**Kategorie**, **nie** Karten-Id/-Text |
| **`feature_complete`** | `feature`:slug · `perfect`:bool | `app.js` · `setGameStats`-Diff (`trackFeatureCompletions`) | Lernspiel-Runde fertig; zentral über die `*Played`-Zähler. `feature` ∈ `precios, dialogos, definiciones, yesto, frases, conjug, battle` |
| **`search`** | `qlen`:Bucket`[3,6,12,24]` · `results`:Bucket`[1,5,20]` | `app.js` · `updateSearchResults` (gedrosselt ~1/s) | Suche benutzt – **nur Länge & Trefferzahl**, **NIE** der Suchtext |
| **`onboarding_step`** | `step`:`intro`/`profile`/`trip` · `n`:int | `app.js` · `beginOnboarding`/`onboardSlidesToProfile`/`advanceOnboardingProfile` | Onboarding-Schritt erreicht (Aktivierungs-Funnel). Greift nur mit Consent **während** des Onboardings (z. B. Editionen) |
| **`onboarding_complete`** | – | `app.js` · `finishOnboarding` | Onboarding abgeschlossen |
| **`error`** | `type`:`error`/`promise` · `msg`:text (PII-bereinigt ≤80) · `src` · `line`:int | `app.js` · `window.onerror` / `unhandledrejection` | JS-Fehler fürs Monitoring; `msg` ohne E-Mails/lange Ziffernfolgen |
| **`consent_change`** | `on`:bool | `app.js` · `setAnalyticsConsent` | Zustimmung erteilt (nur `on:true`; ein Opt-out wird bewusst **nicht** gesendet) |
| **`pwa_installed`** | – | `app.js` · `window 'appinstalled'` | App als PWA installiert |

> **Quelle der Allowlist:** `EVENTS` in [`analytics.js`](../analytics.js). Jedes nicht gelistete Feld
> und jeder Freitext (Leerzeichen/Satzzeichen) wird vom Sanitizer **verworfen** – Slug-Regex
> `^[a-z0-9_.:+-]{1,32}$`. Buckets erzeugt `analytics.bucket(n, edges)`.

---

## 4. Was bewusst **NICHT** geloggt wird

- **Kein** Suchtext (`state.searchQuery`), **keine** Kartentexte oder **Karten-IDs**, **keine** eigenen Karten/Favoriten-Inhalte.
- **Keine** Namen/E-Mails/PII; Fehler-Texte werden bereinigt (E-Mail → `@`, lange Ziffern → `#`) und auf 80 Zeichen gekappt.
- **Keine** Geolokalisierung, **keine** Device-Fingerprints, **keine** Cookies, **keine** Drittanbieter-Tracker, **keine** Werbung.
- **Keine** exakten Zähler – Mengen reisen nur als **grobe Buckets** (k-anonymity-freundlich).
- Hochfrequente Lern-Aktionen (`flip`/`rate`/`skip`/`speak`) erzeugen **kein** generisches `action`-Event (Rauschen/Queue-Schutz).

---

## 5. Identität, Speicherung, Transport

| Aspekt | Detail |
|---|---|
| **Gate** | sendet nur bei `SC.config.analytics.enabled` + `endpoint` **UND** `settings.analyticsConsent === true`. Sonst **0** Netzwerk-Calls **und** 0 Pufferung. |
| **clientId** | pseudonym, zufällig, **resetbar** (Profil-Knopf „Statistik-Id zurücksetzen"); bei Opt-out gelöscht. LS-Key `spanischcard.analyticscid.v1`. |
| **sessionId** | pro App-Start, rotiert nach 30 min Inaktivität; nur im Speicher. |
| **Lokale Keys** | `…analyticssent.v1` (Snapshot-Tag), `…analyticsqueue.v1` (Event-Ring), `…analyticscid.v1` (clientId) – **keiner** in `store.KNOWN_KEYS`, reisen also **nicht** im Backup. |
| **Queue** | localStorage-**Ring**, max **200** Events (älteste werden verworfen). |
| **Versand** | Batches ≤ **50** via `SC.net.request` (POST); beim Verstecken/Schließen via `navigator.sendBeacon`. Flush alle ~15 s + bei `visibilitychange→hidden`/`pagehide`. Nebenläufigkeits-sicher (Entfernen per `seq`). |
| **Fehlertoleranz** | Fire-and-forget; jeder Fehler wird geschluckt – Telemetrie blockiert die UI nie. |

---

## 6. DSGVO / Betroffenenrechte (Kurz)

- **Rechtsgrundlage:** ausdrückliche Einwilligung (opt-in im Profil), jederzeit widerrufbar (Schalter → Aus; löscht `clientId` + Puffer).
- **Löschung:** serverseitig per `clientId` möglich (Art. 17). Aufbewahrung befristet (s. BACKEND.md §17.6.4).
- **Datenminimierung:** Snapshot ist anonym; Events sind pseudonym und enthalten nur Enums/Buckets.
- Details & Server-Pflichten: **[BACKEND.md §17](../BACKEND.md)**.

---

## 7. Dashboard — „wie viele nutzen es und wie lange?"

Damit man die Daten **sieht**, gibt es einen self-host-tauglichen Collector **mit Dashboard**:
[`tools/telemetry-server.js`](../tools/telemetry-server.js) (+ [`tools/telemetry-dashboard.html`](../tools/telemetry-dashboard.html)).
Zero-Dependency (nur Node-Builtins), persistiert als JSONL, rechnet die Kennzahlen in einer
**reinen, unit-getesteten** `aggregate()`-Funktion ([`test/telemetry-aggregate.test.js`](../test/telemetry-aggregate.test.js)).

```bash
node tools/telemetry-server.js            # Server + Dashboard auf :8789
# optional:  PORT=9000 TELEMETRY_DIR=/var/holaruta node tools/telemetry-server.js
```

Dashboard öffnen: **http://localhost:8789/** · API: `GET /api/stats` (JSON).

In einer Edition (`editions/<id>.js`) den Endpunkt setzen und bauen, dann im Profil
**„Nutzungsstatistik teilen" → An**:

```js
analytics: { enabled: true, endpoint: "http://localhost:8789" }
```

```bash
node build.js --edition=<id>
```

**Das Dashboard zeigt** (30-Tage-Fenster, auto-refresh):

| Bereich | Kennzahlen |
|---|---|
| **Nutzer** | distinkte (pseudonyme `clientId`), **DAU heute**, **WAU** (7 T), **MAU** (30 T), neu vs. wiederkehrend, **Wiederkehrrate** (≥2 aktive Tage), **Stickiness** (Ø DAU/MAU); Balken „aktive Nutzer/Tag" |
| **Bindung & Retention** | **D1/D7/D30-Retention** (Kohorte nach Erst-Tag), Verteilung „aktive Tage je Nutzer" |
| **Sitzungen** | Anzahl, **Ø & Median Sitzungsdauer** (aus den `ts`-Spannen je `sessionId`), Dauer-Histogramm, Sitzungen/Tag, Ø Events/Sitzung |
| **Engagement** | meistgenutzte Bildschirme, Top-Aktionen |
| **Lernen** | Lernspiel-Abschlüsse (+ perfekt-Quote), Karten-Bewertungen, Runden-Genauigkeit, **Lernmodus** (flip/type/listen) |
| **Content-Qualität** | **schwierigste Themen** („Nochmal"-Quote je Kategorie), **Suche-ohne-Treffer-Quote** |
| **Lernfortschritt** | **Mastery-Verteilung** (% gemeisterte Karten), **Reiseziel-Adoption** + Tagesziel |
| **Aktivierung** | **Onboarding-Funnel** (intro→profile→trip→complete, Drop-off) |
| **Zeit** | Aktivität nach **Uhrzeit** (UTC) und **Wochentag** |
| **Segmente** | **Plattformen** & **Editionen** (distinkte Nutzer) |
| **Monitoring** | JS-Fehler (Top), **Fehler je App-Version** (Regressionen) |
| **Meta** | App-Versionen, Sprachen, Lern-Tracks; aus dem anonymen Snapshot: Feature-Adoption, Karten/Tag |

> **„Wie viele Leute"** = distinkte `clientId` (nur aus dem Event-Strom; der Tages-Snapshot ist
> anonym ohne Id). **„Wie lange"** = Sitzungsdauer als Spanne zwischen erstem und letztem Event
> derselben `sessionId`.

> ⚠️ **Kein Produktionsdienst.** Das Dashboard ist **ungeschützt** und der Storage ist eine Datei
> (`tools/telemetry-data/`, ge-`.gitignore`-t). Für echten Betrieb gehören davor **Auth**, ein
> richtiger **Event-Store**, Rate-/Größenlimits und EU-Hosting (siehe [BACKEND.md §17.6.3](../BACKEND.md)).

**Ultra-einfacher Smoke-Test** ohne Dashboard/Persistenz: [`tools/mock-events-server.js`](../tools/mock-events-server.js)
loggt eintreffende Events nur im Terminal.

---

## 8. Erweitern (für Entwickler)

1. Event-Namen + Prop-Allowlist in `EVENTS` (`analytics.js`) ergänzen (Modi: `slug`/`bucket`/`int`/`bool`/`text`).
2. An der passenden Stelle `SC.analytics.track("<name>", { … })` aufrufen (im Controller über den Helfer `trackEvent`).
3. Zahl-Felder als Bucket übergeben: `abucket(n, [kanten…])`.
4. Diese Tabelle (§3.1) **und** BACKEND.md §17.6.2 aktualisieren – **Spec == Implementierung** halten.
