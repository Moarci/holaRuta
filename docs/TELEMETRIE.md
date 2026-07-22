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
und ein **pseudonymer Interaktions-Event-Strom**. Der Snapshot ist rein gebucketet; der Event-Strom
trägt grobe Enums/Buckets **plus** einzelne **exakte, nicht-identifizierende Ganzzahlen** (Interaktions-
zähler & Rundendauer, für die Investor-Analytik) – aber **kein** Suchtext, **keine** Kartentexte/-IDs,
**keine** Namen, **keine** Freitexte, **keine** stabile Identität.

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
| **`app_open`** | `returning`:bool · `load_ms`:Bucket`[200,500,1000,3000]` · `src`:slug | `app.js` · `setupAnalyticsEvents` (Boot) | App geöffnet; `returning` = es gab schon mal einen Lerntag; `src` = Akquise-Quelle (`task`/`onboard-link`/`module-link`/`edition`/`direct`) aus den Start-URL-Parametern (nur Enum, **nie** die URL) |
| **`screen_view`** | `screen`:slug · `tab`:slug | `app.js` · `render()` → `trackScreenView` | Ansicht gewechselt (nur bei echtem Wechsel; `tab` nur auf Home) |
| **`action`** | `action`:slug · `mode` · `dir` · `level` · `tab` · `scope` | `app.js` · `onClick` (Aktions-Dispatch) | jeder Button-Klick mit `data-action`; **ausgenommen** die Hochfrequenz-Aktionen `flip`/`rate`/`skip`/`speak` (separat erfasst) |
| **`session_start`** | `scope`:slug · `origin`:slug · `mode` · `cards`:Bucket`[5,10,20,40]` | `app.js` · `beginRound()` | Lernrunde gestartet – deckt **alle 6** Startpfade ab (Kategorie/Alles, Preset, Pre-Trip-Tag, Ruta del día, Favoriten, Einzelkarte). `scope` = `"all"`/Kategorie-Slug |
| **`session_complete`** | `answered`/`accuracy`/`xp`/`again`:Buckets · **`answered_n`/`correct_n`/`xp_n`/`secs`**:int | `app.js` · `finishRound()` | Lernrunde beendet. Buckets (grob) **plus** exakte Ints für die Investor-Interaktions-Tiefe pro Sitzung; `secs` = Dauer **dieser** Runde (auf 1 h gedeckelt) |
| **`card_rated`** | `rating`:`again`/`good`/`easy` · `mode` · `level` · `cat`:Kategorie-slug | `app.js` · `rate()` | eine Karte bewertet – **nur** Bewertung/Modus/Stufe/**Kategorie**, **nie** Karten-Id/-Text |
| **`feature_start`** | `feature`:slug · `mode`:slug | `app.js` · `onClick` (`FEATURE_STARTS`-Map bei `start-*`); **Battle** zentral in `startBattle()` (deckt alle Einstiegspfade ab) | Lernspiel-Runde **gestartet** – Gegenstück zu `feature_complete` (ergibt die Abschlussquote). `feature` gleich benannt wie unten |
| **`feature_complete`** | `feature`:slug · `perfect`:bool | `app.js` · `setGameStats`-Diff (`trackFeatureCompletions`) | Lernspiel-Runde fertig; zentral über die `*Played`-Zähler. `feature` ∈ `precios, dialogos, definiciones, yesto, frases, conjug, battle` |
| **`search`** | `qlen`:Bucket`[3,6,12,24]` · `results`:Bucket`[1,5,20]` | `app.js` · `updateSearchResults` (gedrosselt ~1/s) | Suche benutzt – **nur Länge & Trefferzahl**, **NIE** der Suchtext |
| **`share`** | `content`:slug | `app.js` · `onClick` (`SHARE_ACTIONS`-Map bei `share-*`) | etwas geteilt (Virality-Funnel) – **nur** WAS (`content`: stats/card/tips/module …), **nie** Empfänger/Inhalt. Ersetzt das frühere generische `action`-Event für `share-*` |
| **`activation`** | `milestone`:slug | `app.js` · `finishRound()` | Aktivierungs-„Aha" – heute `milestone:first_session` (allererste je abgeschlossene Runde) |
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
- **Snapshot:** keine exakten Zähler – Mengen reisen nur als **grobe Buckets** (k-anonymity-freundlich).
  **Event-Strom:** zusätzlich **exakte Ganzzahlen** in `session_complete` (`answered_n`/`correct_n`/`xp_n`/`secs`)
  für die Interaktions-Tiefe – bewusst feiner, aber weiterhin **ohne** PII/Freitext/Karteninhalt und mit
  gedeckelter `secs` (≤ 1 h) gegen Fingerprinting.
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

Es gibt **zwei** Wege, dieselbe **reine, unit-getestete** `aggregate()`-Funktion
([`test/telemetry-aggregate.test.js`](../test/telemetry-aggregate.test.js)) mit Daten zu füttern:

1. **Self-Host/Demo:** [`tools/telemetry-server.js`](../tools/telemetry-server.js) — Zero-Dependency
   (nur Node-Builtins), persistiert als JSONL. Für lokales Ausprobieren/Editionen ohne eigenes Backend.
2. **Produktion (holaruta.com):** `GET /v1/admin/stats(.csv)` · `GET /v1/admin/kpis.csv`
   ([`api/_v1/admin/stats.js`](../api/_v1/admin/stats.js)) — liest die **echten** Ereignisse direkt aus
   den Supabase-Tabellen `event`/`usage_snapshot` (paginiert, Mapper in
   [`tools/telemetry-map.js`](../tools/telemetry-map.js)) und füttert damit **dieselbe** `aggregate()`.
   Fail-closed ohne `ADMIN_TELEMETRY_TOKEN` (Vercel-Env-Var); Zugriff per
   `Authorization: Bearer <token>` oder `?token=…`, rate-limitiert.

   > ⚠️ **Rollout-Reihenfolge (Pflicht):** [`supabase/migrations/0003_telemetry_admin.sql`](../supabase/migrations/0003_telemetry_admin.sql)
   > (neue Spalten `mastered_bucket`/`trip_goal`/`trip_daily_bucket` auf `usage_snapshot`) **muss vor**
   > dem Deploy des `api/_v1/usage.js`-Codes angewendet sein — sonst schlägt **jeder** `/v1/usage`-Insert
   > mit einem Schema-Fehler fehl. `usage.js`/`events.js` geben in diesem Fall jetzt `500` zurück (statt
   > den Fehler stillschweigend als `200` zu quittieren), sodass der Client den Snapshot/die Events lokal
   > behält und erneut versucht — aber besser ist, die Reihenfolge von vornherein einzuhalten.

   [`tools/telemetry-dashboard.html`](../tools/telemetry-dashboard.html) zeigt beide: Standard
   `?base=/api` (Self-Host) oder `?base=https://holaruta.com/v1/admin&token=…` (Produktion).

```bash
node tools/telemetry-server.js            # Server + Dashboard auf :8789
# optional:  PORT=9000 TELEMETRY_DIR=/var/holaruta node tools/telemetry-server.js
```

Dashboard öffnen: **http://localhost:8789/** · API: `GET /api/stats` (JSON) · `GET /api/stats.csv` (Tagesreihe) · `GET /api/kpis.csv` (Investor-KPI-Zeile fürs Data-Room).

**Bedienung/Betrieb:**
- **Zeitfenster** 7 / 30 / 90 Tage (Umschalter im Header bzw. `?days=`).
- **Export:** Buttons **JSON** (ganze Statistik), **CSV** (Tag · DAU · Sessions) und **KPI-CSV** (eine Investor-KPI-Zeile fürs Data-Room, `/api/kpis.csv`).
- **Zugriffsschutz (optional):** `TELEMETRY_TOKEN=… node tools/telemetry-server.js` → Dashboard/API nur mit `?token=…`.
- **Aufbewahrung:** `TELEMETRY_RETENTION_DAYS` (Default 120) — ältere Einträge werden beim Start verworfen und die Dateien kompaktiert.
- Ungültiger/zu großer POST → `400` (Client behält den Batch und sendet erneut → kein Datenverlust).

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
| **📈 Investor-Cockpit** (oben) | **North Star** (Weekly Active Learners + Trend), **DAU/WAU/MAU**, **Stickiness**, **Aktivierungsrate** + Funnel, **Retention-Kohorten-Heatmap** (Erst-Tag × Tag-N), **Growth Accounting** + **Quick Ratio**, **K-Faktor**/Virality, **Interaktionen pro Person/Sitzung/aktivem Tag**, **Ø Lernzeit/Runde**, **Start↔Abschluss je Lernspiel**, **B2B-KPIs je Edition**. Vollständige Definitionen: [`docs/INVESTOR-KPIS.md`](./INVESTOR-KPIS.md), Feld `investor` in `aggregate()` |
| **Nutzer** | distinkte (pseudonyme `clientId`), **DAU heute**, **WAU** (7 T, mit **Trend** vs. Vorwoche ▲/▼), **MAU** (30 T), neu vs. wiederkehrend, **Wiederkehrrate**, **Stickiness** (Ø DAU/MAU); Balken „aktive Nutzer/Tag" |
| **Akquise & Teilen** | **Akquise-Quelle** (`app_open.src`: task/onboarding-link/edition/direct), **Teilen**-Aktionen |
| **Snapshot-Verteilungen** | **Feature-Adoption**, **Streak**, **Karten/Tag**, **Bewertungen gesamt** (Lebenszeit) |
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

> ⚠️ **`tools/telemetry-server.js` ist kein Produktionsdienst** (Datei-Storage, Dashboard nur
> optional per `TELEMETRY_TOKEN` geschützt) — nur für Self-Host/lokale Demo. Der **Produktions-Pfad
> ist `/v1/admin/stats`**: echter Event-Store (Supabase, RLS aktiv, nur `service_role` liest/schreibt),
> Rate-Limiting, fail-closed ohne Token, EU-Hosting (siehe [BACKEND.md §17.6.3](../BACKEND.md)).

**Ultra-einfacher Smoke-Test** ohne Dashboard/Persistenz: [`tools/mock-events-server.js`](../tools/mock-events-server.js)
loggt eintreffende Events nur im Terminal.

---

## 8. Erweitern (für Entwickler)

1. Event-Namen + Prop-Allowlist in `EVENTS` (`analytics.js`) ergänzen (Modi: `slug`/`bucket`/`int`/`bool`/`text`).
2. An der passenden Stelle `SC.analytics.track("<name>", { … })` aufrufen (im Controller über den Helfer `trackEvent`).
3. Zahl-Felder als Bucket übergeben: `abucket(n, [kanten…])`.
4. Diese Tabelle (§3.1) **und** BACKEND.md §17.6.2 aktualisieren – **Spec == Implementierung** halten.

---

## 9. Dateien & Architektur

| Datei | Rolle |
|---|---|
| [`analytics.js`](../analytics.js) | **Client-Modul** `SC.analytics`: reiner Kern (Snapshot, Event-Bau, Allowlist-Sanitizer, Buckets, IDs) + dünner opt-in-Adapter (`track`/`flush`/`maybeSend`, Ring-Queue, `sendBeacon`). |
| [`app.js`](../app.js) | **Instrumentierung**: `trackEvent`/`abucket`, Hooks (onClick, render, beginRound, finishRound, rate, updateSearchResults, Onboarding, setGameStats-Diff, Boot/Errors), `analyticsCtx`, `detectPlatform`, `detectAcquisitionSrc`, Consent-Handler. |
| `ui.js` + `i18n.strings*.js` | Consent-Schalter „Nutzungsstatistik teilen" + „Statistik-Id zurücksetzen" (de/en/es). |
| `config.js` | `SC.config.analytics = { enabled, endpoint }` (Default `null` = aus). |
| `index.html` · `service-worker.js` | Modul eingebunden + im PWA-Precache. |
| [`api/_v1/events.js`](../api/_v1/events.js) · [`api/_v1/usage.js`](../api/_v1/usage.js) | **Produktions-Ingest** (Vercel): schreiben `POST /v1/events`/`/v1/usage` nach Supabase (`event`/`usage_snapshot`), Allowlist/Größenlimit/Rate-Limit serverseitig gespiegelt. |
| [`api/_v1/admin/stats.js`](../api/_v1/admin/stats.js) | **Produktions-Aggregation**: `GET /v1/admin/stats(.csv)`/`kpis.csv`, liest Supabase paginiert, mappt via `telemetry-map.js`, ruft `aggregate()`/`toCsv()`/`toKpiCsv()`. Fail-closed ohne `ADMIN_TELEMETRY_TOKEN`. Im Dispatcher [`api/v1.js`](../api/v1.js) verdrahtet. |
| [`tools/telemetry-map.js`](../tools/telemetry-map.js) | Reine Mapper Supabase-Zeile (snake_case) → aggregate()-Envelope (camelCase); unit-getestet (`test/telemetry-map.test.js`). |
| [`tools/telemetry-server.js`](../tools/telemetry-server.js) | **Self-Host Collector + Dashboard-Server**: nimmt `POST /v1/usage`+`/v1/events` an, persistiert JSONL, reine `aggregate()`/`toCsv()`/`toKpiCsv()`-Funktionen (auch von `admin/stats.js` genutzt), `GET /api/stats(.csv)`, serviert das Dashboard; Token/Retention/Windowing. |
| [`tools/telemetry-dashboard.html`](../tools/telemetry-dashboard.html) | **Dashboard-UI** (Vanilla, SVG-Charts, kein externes Framework); `?base=` wählt Self-Host (`/api`, Standard) oder Produktion (`https://holaruta.com/v1/admin`). |
| [`tools/mock-events-server.js`](../tools/mock-events-server.js) | Ultra-einfacher Smoke-Collector (nur Terminal-Log). |
| `test/analytics.test.js` · `test/telemetry-aggregate.test.js` · `test/telemetry-map.test.js` | Unit-Tests (Sanitizer/Gating/Queue/Envelope · Aggregation · Supabase-Mapper). |
| [`BACKEND.md §17`](../BACKEND.md) | Server-/DSGVO-Spec (Ziel-Endpunkte, Event-Store, Löschung, Sampling). |

---

## 10. Status & offene Punkte (TODO)

### ✅ Fertig (end-to-end lauffähig, Client UND Produktion)
- Opt-in-Snapshot + pseudonymer Event-Strom, Allowlist-Sanitizer, Ring-Queue, Batching/Beacon, Reset-Id.
- Volle Instrumentierung (Screens, Aktionen, Sessions, Karten, Spiele, Suche, Onboarding, Fehler, PWA; Startzeit in `app_open.load_ms`).
- **Produktions-Event-Store:** `POST /v1/events`/`/v1/usage` schreiben live nach Supabase (`event`/`usage_snapshot`, RLS an, nur `service_role` kommt ran), Rate-Limiting atomar über `rl_hit`-RPC, Retention-Cron (`purge-events.js`, fail-closed ohne `CRON_SECRET`), DSGVO-Löschung per `clientId` (`DELETE /v1/events?clientId=…`). Live gegen Produktion verifiziert (2026-07-22).
- **Produktions-Aggregation:** `GET /v1/admin/stats(.csv|kpis.csv)` liest Supabase paginiert, mappt zurück aufs Envelope (`tools/telemetry-map.js`, unit-getestet) und füttert dieselbe `aggregate()` wie der Self-Host-Collector — das Investor-Cockpit (§7) läuft damit auch gegen echte Nutzerdaten, nicht nur die JSONL-Demo. Fail-closed ohne `ADMIN_TELEMETRY_TOKEN`.
- Self-Host-Collector (`tools/telemetry-server.js`) mit Persistenz, Dashboard, Zeitfenster, CSV/JSON-Export, optionaler Token, Retention-Pruning — für lokales Ausprobieren/Editionen ohne eigenes Backend.
- **Injection-sicher:** alle mit Event-Daten geschlüsselten Zähler nutzen `Map`/`Set` (keine Objekt-Property-Writes) → keine „remote property injection"/Prototype-Pollution (per Test mit `__proto__`-Payload belegt).
- Unit-Tests grün (`analytics.test.js`, `telemetry-aggregate.test.js`, `telemetry-map.test.js`); Doku hier + BACKEND.md + README.

### ⚠️ Bekannte Grenzen (bewusst)
- **`/v1/admin/stats`-Fetch ist paginiert, aber gedeckelt** (30 Seiten × 1000 Zeilen/Tabelle ≈ 30k Zeilen) gegen die 15s-Vercel-Function-Laufzeit — bei sehr hohem Volumen müsste das auf serverseitige Aggregation (SQL) umgestellt werden.
- **UTC-„heute":** Tages-Buckets nutzen den UTC-Tag des Servers vs. die lokale `day` des Clients → minimale Unschärfe an Tagesgrenzen.
- **Onboarding-Funnel & Snapshot-Kennzahlen** liefern nur Daten von Nutzern **mit aktivem Consent** (der Consent-Schalter liegt hinter dem Onboarding → Funnel primär für Editionen mit vor-aktiviertem Consent aussagekräftig).
- **Beacon-Flush** beim Schließen sendet höchstens **einen** Batch (≤ 50 Events); ein sehr großer Restpuffer kann beim harten Schließen verloren gehen.
- **`mock-events-server.js`** und `telemetry-server.js` überlappen (bewusst: einfacher Smoke vs. voll).

### 🔧 TODO — Produktion
- [ ] Optional **Sampling** (`SC.config.analytics.sampleRate`) client- und/oder serverseitig verdrahten.
- [ ] Bei wachsendem Volumen: `/v1/admin/stats` von Paginierung + In-Memory-`aggregate()` auf serverseitige SQL-Aggregation umstellen.

### 🧪 TODO — Tests/Qualität
- [ ] **Integrationstest** der Server-Routen (Token-401, `?days=`, `/v1/admin/stats.csv`, 400 bei kaputtem POST) — aktuell manuell/live verifiziert.
- [ ] Optional Controller-Smoke, der belegt, dass die App-Hooks ohne Fehler feuern (DOM-Stub vorhanden).

### 📈 Produkt-/Investor-Metriken
- [x] Retention-**Kohorten über Zeit** (Heatmap Erst-Tag × Tag-N) — `investor.cohorts` + Dashboard-Heatmap.
- [x] **Trichter-Konversion** neu→erste Session→wiederkehrend als ein Funnel — `investor.activation.funnel`.
- [x] `feature_start` für Start↔Abschluss-Quote je Lernspiel — `investor.featureFunnel`.
- [x] **North Star** (Weekly Active Learners), **Growth Accounting**/Quick Ratio, **K-Faktor**,
      **Interaktionen pro Person/Sitzung/Tag**, **B2B-KPIs je Edition** — `investor`-Block; Konzept: `docs/INVESTOR-KPIS.md`.
- [x] **Alerting** bei Fehler-Spitzen je Version — `investor.alerts` (Fehlerquote je App-Version ab Schwelle) + roter Banner im Dashboard.

### 🧹 TODO — Housekeeping
- [ ] Entscheiden, ob `mock-events-server.js` zugunsten von `telemetry-server.js` entfällt.
- [x] `perf` (redundant zu `app_open.load_ms`) entfernt — Startzeit reist weiter in `app_open.load_ms`.
