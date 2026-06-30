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
| `cardsToday` | Bucket | Karten heute, Kanten `[10, 30, 60]` → `"0"`,`"1-10"`,`"11-30"`,`"31-60"`,`"61+"` |
| `streak` | Bucket | Tagesserie, Kanten `[1, 3, 7, 30]` |
| `reviews` | Bucket | Bewertungen gesamt (Lebenszeit), Kanten `[10, 50, 200, 1000]` |
| `features` | Objekt aus **Booleans** | je Modus „**jemals** benutzt": `study, listen, precios, dialogos, definiciones, yesto, frases, conjug, battles, roleplay, challenges, ruta, pretrip` |

> **Keine** IDs, **keine** PII, **keine** Karteninhalte. Tages-Dedupe rein clientseitig
> (`spanischcard.analyticssent.v1`).

---

## 3. Event-Strom (`POST /v1/events`)

Jedes Event hat einen festen **Envelope** (gebaut von `buildEvent()`):

```
{ v:1, ts, day, clientId, sessionId, seq, appVersion, locale, track, event, props }
```

| Envelope-Feld | Inhalt |
|---|---|
| `v` | Schema-Version (`1`) |
| `ts` | Zeitstempel (ms) |
| `day` | lokaler Tag `YYYY-MM-DD` |
| `clientId` | **pseudonyme**, resetbare Geräte-Id (zufällig; kein Klarname) |
| `sessionId` | **pseudonyme** Sitzungs-Id (pro App-Start, rotiert nach 30 min Inaktivität) |
| `seq` | fortlaufende Nummer (Dedupe/Reihenfolge) |
| `appVersion` / `locale` / `track` | wie beim Snapshot |
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

## 7. Lokal ausprobieren

```bash
node tools/mock-events-server.js          # Collector auf :8789, loggt eintreffende Events
```

In einer Edition (`editions/<id>.js`) setzen und bauen:

```js
analytics: { enabled: true, endpoint: "http://localhost:8789" }
```

```bash
node build.js --edition=<id>
```

Dann App öffnen → Profil → **„Nutzungsstatistik teilen" → An**. Klicken/Lernen/Suchen erzeugt
Events; der Collector zeigt im Terminal Anzahl je Event-Typ und distinkte (pseudonyme) Clients.

---

## 8. Erweitern (für Entwickler)

1. Event-Namen + Prop-Allowlist in `EVENTS` (`analytics.js`) ergänzen (Modi: `slug`/`bucket`/`int`/`bool`/`text`).
2. An der passenden Stelle `SC.analytics.track("<name>", { … })` aufrufen (im Controller über den Helfer `trackEvent`).
3. Zahl-Felder als Bucket übergeben: `abucket(n, [kanten…])`.
4. Diese Tabelle (§3.1) **und** BACKEND.md §17.6.2 aktualisieren – **Spec == Implementierung** halten.
