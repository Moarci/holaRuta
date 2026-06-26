# HolaRuta – Vollständige Projektanalyse

> Erstellt am 2026-06-26 durch Multi-Agent-Analyse (parallele spezialisierte Agents:
> Architektur, Features/Business-Logik, Code-Qualität) plus fünf technische Deep-Dives
> (SRS, Antwort-Matcher, PWA/Service Worker, Cloud-Sync, Lehrer-Modus).
> Rein analytisch — keine Code-Änderungen.

---

## Inhalt

1. [Überblick](#1-überblick)
2. [Architektur & Tech-Stack](#2-architektur--tech-stack)
3. [Features & Business-Logik](#3-features--business-logik)
4. [Code-Qualität, Tests & Sicherheit](#4-code-qualität-tests--sicherheit)
5. [Deep-Dive: SRS-Algorithmus](#5-deep-dive-srs-algorithmus-srsjs)
6. [Deep-Dive: Antwort-Matcher](#6-deep-dive-antwort-matcher-matcherjs)
7. [Deep-Dive: PWA / Service Worker](#7-deep-dive-pwa--service-worker)
8. [Deep-Dive: Cloud-Sync](#8-deep-dive-cloud-sync-syncjs-netjs-socialjs)
9. [Deep-Dive: Lehrer-Modus](#9-deep-dive-lehrer-modus-modo-profe)
10. [Gesamturteil & Empfehlungen](#10-gesamturteil--empfehlungen)

---

## 1. Überblick

**HolaRuta** ist eine **Offline-First PWA für Reise-Spanisch** (Lateinamerika-Backpacker).
Vanilla JavaScript, **null Runtime-Dependencies**, gehostet auf GitHub Pages.

| | |
|---|---|
| **Version** | v1.118.0 |
| **Domäne** | Survival-Spanisch für Reisen (LatAm-Fokus) |
| **Umfang** | 2293 Lernkarten über 73 Kategorien, 30+ interaktive Modi |
| **Code** | ~47k Zeilen Produktion + ~9,8k Zeilen Tests |
| **Tests** | 653 Tests (Node built-in Runner) + E2E (Playwright) + Mutation-Testing |
| **Dependencies** | 0 Runtime · 1 dev (esbuild) |
| **Live** | https://moarci.github.io/holaRuta/ |

> Kernversprechen: *„Reines Vanilla JS. Kein Framework, kein Bundler, kein node_modules zur Laufzeit."*

**Zielgruppen:** Individualreisende (B2C), Sprachschulen/Lehrkräfte (B2B), Reiseveranstalter
(White-Label-Editionen via `editions/*.js`).

---

## 2. Architektur & Tech-Stack

Strikte Separation of Concerns mit unidirektionalem Datenfluss:

| Schicht | Module | Verantwortung |
|---|---|---|
| **Daten** | `data.js` (782KB), `contextdata.js`, `countries.js` | Reine Datenstrukturen — 2293 Karten / 73 Kategorien |
| **Kern-Logik** | `srs.js`, `matcher.js`, `stats.js`, `numbers.js` | **Reine Funktionen** — kein DOM, kein Storage |
| **Persistenz** | `store.js`, `sync.js` | localStorage-Abstraktion + opt-in Cloud |
| **Controller** | `app.js` (374KB) | Single State Object, Event-Delegation via `data-action` |
| **View** | `ui.js` (262KB), `view-helpers.js` | Zustand → HTML, keine Logik |
| **Features** | `features/*.js` | 30+ lazy-ladbare Spiel-/Lernmodi |
| **Browser-APIs** | `speech.js`, `service-worker.js`, `install.js` | TTS, Offline-Caching, PWA-Installation |
| **i18n** | `i18n.js`, `i18n.strings.js` (144KB) | UI in Deutsch + Englisch (Content nur Spanisch) |

**Datenfluss:** `data.js` → `context.js` (Runtime-Kontext) → `app.js` (State + srs/matcher/stats)
→ `store.js` (Persistenz, optional `sync.js`) → `ui.js` (HTML aus State).

**Build & Deployment:**
- Entwicklung: roh über `index.html` lauffähig (kein Bundler nötig)
- Single-File-Build: `build.js` inlined alles → `HolaRuta.html` (~600KB)
- Service-Worker-Cache-Version: **automatischer Inhalts-Hash** (`swversion.js`)
- Deploy: GitHub Actions → GitHub Pages; CodeQL-Security-Scan separat

**Edition-System (Co-Branding):** `config.js` (Basis) + `editions/*.js` (Partner-Overrides:
Logo, Farbe, Sync-Endpoint, `teacherTab`).

---

## 3. Features & Business-Logik

**3 Lernmodi:** Karteikarte (3D-Flip), Schreiben (großzügiger Matcher), Hören (TTS-Diktat).

**30+ weitere Modi**, u. a.: Battle (2-Spieler), Dialog-Simulator, Flaggen-/Bild-Quiz,
Konjugations-Drill, Preis-Hörtrainer (`numbers.js`), Satzbaukasten, 3D-Körperkarte, Shopping-Quiz,
Länderkunde (60+ Länder), Geschichte (Süd-/Mittelamerika), Slang, Reise-Knigge, Musik (Deep-Links),
Tanz-Diagramme, Flirt, Rechtswissen, nachhaltiges Reisen.

**Einstufung:** Ruta-Check (kurz, A0–B1-) und Nivel-Test (ausführlich, A0–C1).

**Engagement:** Ruta-Pass (Badges, `badges.js`), Mi léxico (Favoriten), Pre-Trip-Pakete,
druckbare/ausfüllbare Arbeitsblätter.

**Lehrer-Plattform:** Klassenlisten, Aufgaben-Codes (Tareas), opt-in Classroom-Sync — siehe §9.

**Datenmodell (Kern):**
```
Card     { id, cat, lvl:1|2|3, de, es, tip?, alt?, context? }
Progress { ease, interval, due, reps, seen, again/good/easy, lapses, history[] }
Category { id, label, labelEn, icon, grad:[c1,c2], group }
```
Fortschritt liegt unter `spanischcard.progress.v2` (localStorage).

---

## 4. Code-Qualität, Tests & Sicherheit

**Tests — sehr stark:** 653 Tests / 59 Dateien (~21% Test-Ratio), alle grün. Node built-in
Runner (kein Framework). Unit (Kernlogik), Integration (Controller-Smoke), Content-Konsistenz,
PWA/Offline, Build-Validierung, plus E2E (Playwright) und Mutation-Testing.

**Dependencies:** 0 Runtime → keine Supply-Chain-Risiken. Nur `esbuild` (dev).

**Sicherheit:** keine Secrets, kein hardcoded credential, kein exploitierbares XSS.
`esc()` escapt Text-Knoten; `innerHTML`-Nutzung ist template-generiert, nicht user-input-basiert.

**Robustheit:** `store.js` fängt korruptes localStorage ab (`.corrupt`-Rettung), Graceful
Degradation (App läuft ohne localStorage/TTS/Service-Worker).

**Linting:** ESLint v9 Flat Config, bewusst minimal (echte Bugs statt Stil-Bürokratie). Kein
TypeScript (bewusste Langlebigkeits-Entscheidung).

**Dokumentation — ausgezeichnet:** README (645 Z.), AUDIT, RISIKO, BACKEND, BAUPLAN, MARKT,
GLOSSARY, STATUS, IDEEN, CONTRIBUTING.

**Bekannte, dokumentierte Schwächen (`AUDIT.md`) — überwiegend A11y:**
- Kein `prefers-reduced-motion`; Fokus-Verlust nach Render; keine `aria-live`-Regionen
- Tap-Targets < 44px (Level-Chips 34px); Kontrast `--muted`/`--faint` unter WCAG-AA
- `esc()` könnte zusätzlich `"`/`'` escapen (Defense-in-Depth; heute nicht exploitierbar)

---

## 5. Deep-Dive: SRS-Algorithmus (`srs.js`)

99 Zeilen, **reine Funktionen**, vereinfachtes SM-2. Zustand `{ ease, interval, due, reps }`.

**Drei Pfade in `review()`:**
- **AGAIN** (`srs.js:54-61`): `ease−0.2`, `interval→0`, `reps→0`, `due=jetzt+60s`.
- **GOOD/EASY-Wachstum** (`srs.js:63-82`): reps 0 → 1/3 Tage, reps 1 → 3/6, reps ≥2 → `round(interval×ease)`.
- `ease` hart geklemmt auf **[1.3, 3.0]** auf allen Pfaden; unbekanntes Rating = GOOD.

**Drei Härtungen (jede aus einem dokumentierten Risiko-Fix):**
- **NaN-/Korruptionsschutz (R6):** `num()`/`clampEase()` ziehen Strings/`null`/`NaN` auf Defaults
  → nie NaN/0 persistiert.
- **Due-an-Mitternacht (R8):** `dueAtMidnight()` (`srs.js:33-38`) schneidet Fälligkeit auf lokale
  Mitternacht (sonst Wegdriften bei Abend-Lernen); sommer-/winterzeitkorrekt.
- **Early-Review-Dämpfung (R9):** noch nicht fällige Karte zählt nur tatsächlich verstrichene Zeit
  (`srs.js:72-81`) → keine Intervall-Inflation beim freien Üben.

**Tests:** jeder Pfad + jede Härtung mit explizitem `now` (deterministisch).

**Kritik (gering):** `isDue()` nutzt intern `Date.now()` statt eines `now`-Parameters (Inkonsistenz
zu `review()`); ansonsten praktisch kein Verbesserungsbedarf. **Vorzeige-Modul.**

---

## 6. Deep-Dive: Antwort-Matcher (`matcher.js`)

263 Zeilen, **reine Funktionen** — das anspruchsvollste Modul. Prüft getippte Antworten
**großzügig, aber linguistisch korrekt**.

**Pipeline:**
1. `normalize()` (`matcher.js:28-40`): lowercase, `ß→ss`, Akzente weg (bewusst auch `ñ→n`),
   Satzzeichen/Währung/Emojis raus, Slash/Striche als Wortgrenze.
2. `candidates()` (`matcher.js:80-112`): Slash-Alternativen, **optionale Klammerzusätze**,
   `–`-Teile (Preiskarten), `card.alt[]` (nur Spanisch).
3. **Damerau-Levenshtein OSA** (`matcher.js:124-152`): benachbarte Vertauschung kostet 1 (häufigster
   Handy-Tippfehler).
4. `classifyNorm()`: `exact` / `typo` / `""`.

**Zwei klügste Mechanismen:**
- **Längenabhängiges Tippfehler-Budget** (`typoBudget`): < 8 Zeichen → 0 (streng), 8–13 → 1, ≥14 → 2.
- **`isWordFinalEdit()`** (`matcher.js:186-207`): ein Unterschied **am Wortende** ist im Spanischen
  Flexion (Genus/Person/Plural), kein Tippfehler → `necesito`≠`necesita`, aber `neccesito`=`necesito`.
  Erkennt sogar Plural-Genus `buenas`↔`buenos`.

**Bemerkenswert ehrlich:** dokumentierter, gemessener Trade-off (`-mos`-Verb `doblamos` wird
mit-abgelehnt, weil schreibgleich zu `-mo`-Adjektiven; genau ein erreichbares Verb betroffen).

**Risiko-Historie (R1):** Richtung ES→DE war einst kaputt (`alt[]` nur ES, kein Klammer-/ß-Handling) →
heute gefixt, `matcher-de.test.js` ist die Regressionsabsicherung.

**Tests:** 514 Zeilen über 3 Dateien inkl. `typo-corpus` (echte Vertipper) und `ortografia-es`.

**Kritik (gering):** `ñ→n`-Kollaps ist die einzige semantisch riskante Stelle (`año`/`ano`) — bewusst.
Praktisch kein Verbesserungsbedarf.

---

## 7. Deep-Dive: PWA / Service Worker

Drei Teile: `service-worker.js` (Offline-Engine), `swversion.js` (Cache-Versionierung), `manifest.webmanifest`.

**Cache-Strategie (Cache-first, nicht naiv):**
- **Install** (`service-worker.js:117-123`): Precache mit `cache:"reload"` (umgeht HTTP-Cache).
- **Fetch** (`:143-167`): nur GET, Runtime-Caching nur für bekannte Assets (`ASSET_URLS`), nur
  same-origin (`type:"basic"`), Navigations-Fallback auf `index.html`.
- **Activate** (`:133-139`): alte Caches wegräumen.

**Inhaltsbasierte Cache-Versionierung (eleganteste Lösung):** `swversion.js` berechnet SHA-256 über
alle Assets (`computeCacheVersion`, `:43-54`) und stempelt `CACHE_VERSION` (`:60-70`). ASSETS-Liste ist
Single Source of Truth (Regex aus `service-worker.js`); SW selbst nicht in ASSETS → keine Rückkopplung.
Datei ändert sich → neuer Hash → alter Cache verworfen. **Wartungsfrei.**

**Update-Pfad gegen Mixed-Version-Load gehärtet:** kein Auto-`skipWaiting`; App zeigt Banner → `SKIP_WAITING`
→ `controllerchange` → genau ein Reload (`:13-19, 128-130`).

**Sicherheitsnetz `sw-assets.test.js`:** prüft, dass jede in `index.html`/`styles.css`/`manifest`
referenzierte Datei in ASSETS steht und umgekehrt existiert → **maschinell drift-sicher** (schließt R2/R12).

**Risiko-Historie:** R2 (Precache unvollständig → Offline-Freeze) und R10 (Google Fonts remote, DSGVO)
sind behoben; Fonts self-hosted. Manifest: korrektes `id`/`scope`, `theme_color:#241510`, saubere
Icon-Purposes (any + maskable), 5 lokalisierte Shortcuts.

**Kritik (gering):** `skipWaiting`+Reload bei Verbindungsabbruch ist bewusst offener Restpunkt
(`RISIKO.md:108`). **Production-grade.**

---

## 8. Deep-Dive: Cloud-Sync (`sync.js`, `net.js`, `social.js`)

Optionale Stufe-3-Schicht (Standard aus, null Netzwerk). Spec: `BACKEND.md`. 66 Unit-Tests.

**Merge-Engine — mathematisch fundiert** (`sync.js:36-173`):

| Daten | Regel | Warum |
|---|---|---|
| Karten-Fortschritt | `reps×1e15 + due`, höher gewinnt | `reps` monoton → kein Konflikt |
| Zähler | `max(a,b)` | monoton, kein Aufblähen |
| Mengen | `deepUnion` | verlustfrei über Geräte |
| placement/assessment | späterer `ts` | nie zwei Tests mischen |
| History | dedup per Fingerabdruck, max 50 | gleiche Läufe einmal |
| Karten/Favoriten | inhaltsreichere Variante | reihenfolgeunabhängig |

**Schlüssel: Kommutativität** `merge(A,B)===merge(B,A)` (getestet) → Grundlage für Konflikt-Recovery
(`rev`-basiert, bei 409 neu mergen + genau einmal erneut pushen, `sync.js:209-237`).

**Auth (`net.js`):** passwortlos zwei-Phasen (start → confirm), **ein Token für sync + social**;
Token nicht im Backup → gerätelokal.

**Datenminimierung — vorbildlich:** Sync-Payload nur progress/gamestats/usercards/favorites
(nicht settings/Token); Social-Snapshot minimal (kein Fortschritt, keine E-Mail); Import Whitelist-only.

**Kritik — erkennbar Phase-1/2-Prototyp:**
1. Kein `fetch`-Timeout (`net.js:31-45`) → blockiert bis Browser-Timeout.
2. Kein Retry/Backoff bei 5xx/429/Netzfehler (nur 409-Retry).
3. Kein Token-Refresh (Spec fordert ihn).
4. Keine Client-seitige Payload-Größenprüfung (≤256KB).
5. Tests stubben das Netzwerk (Races/Timeouts ungetestet).

Die **Merge-Logik ist das intellektuelle Highlight des Projekts.**

---

## 9. Deep-Dive: Lehrer-Modus („Modo profe")

**Backend-frei, offline-first.** Klassenliste nur im flüchtigen `state` (`app.js:138-140`,
DSGVO-minimal). Schüler-Fortschritt kommt über importierte JSON-Backups.

**Klassenlisten (`app.js:3008-3068`, `stats.js`):** `studentSummaryFromBackup()` →
Kennzahlen (gemeistert, Streak, CEFR), `store.readBackup()` nur lesen, `stats.upsertStudent()`
dedupliziert namens-tolerant. Sortierung `stats.sortRoster` + Histogramm `levelDistribution`.

**Einstufung:** Ruta-Check (`placement.js`, ~14 Fragen, A0–B1-) vs. Nivel-Test (`assessment.js`,
~34 Fragen, A0–C1). Beide: `finalScore = accuracy×0.9 + timeConfidence×0.1`, **`levelBlended`** =
max(score, demonstriert) → IRT-ähnlich. Reliabilitäts-Flags informieren ohne zu blockieren.

**Tarea-Codes (`store.js:239-310`):** base64-Codes (`HRT1.…` / `HRB1.…` Bundle ≤20), UTF-8-sicher,
validiert; Schüler scannen QR → lokale `TASKS_KEY`-Liste → Fortschrittsbalken.

**Export/Druck (`stats.js:203-224`):** CSV RFC-4180-nah mit BOM (Excel-ñ-fest); Print-CSS auf A4.
E2E `scripts/e2e-modo-profe.mjs` deckt den Flow ab.

**Kritik:** Klassenliste nicht persistent (Reload = neu importieren); kein Live-Update;
keine UI-Virtualisierung (>500 Schüler → DOM-Lag); kein Import-Größenlimit; CEFR-Mismatch
alter Checks. Server-Variante (Live-Klassen) in `BACKEND.md` Phase 3 spezifiziert, bewusst noch nicht gebaut.

---

## 10. Gesamturteil & Empfehlungen

**Gesamturteil: Produktionsreifes, ungewöhnlich diszipliniertes Projekt.** Musterbeispiel für eine
Zero-Dependency Offline-PWA: pure Funktionen im Kern, klare Schichten, hohe Testabdeckung,
transparente Selbst-Audits. Ein durchgängiges Muster zieht sich durch alle Kernbereiche:
**Bug gefunden → gefixt → Regressionstest, der ihn unmöglich macht** (R1 Matcher, R2 PWA, R6/R8/R9 SRS).

**Reifegrad nach Bereich:**

| Bereich | Reife | Hinweis |
|---|---|---|
| SRS | ★★★★★ | Vorzeige-Modul, vollständig gehärtet |
| Matcher | ★★★★★ | Linguistisch fundiert, Corpus-getestet |
| PWA | ★★★★★ | Drift-sicher, Mixed-Version-gehärtet |
| Cloud-Sync (Merge) | ★★★★★ | Kommutativ, verlustarm, getestet |
| Cloud-Sync (Netzwerk) | ★★★☆☆ | Prototyp — Timeout/Retry/Refresh fehlen |
| Lehrer-Modus | ★★★★☆ | Solide; Persistenz/Live-Update offen |
| Tests/Doku | ★★★★★ | 653 Tests, exzellente Doku |
| A11y/UX | ★★★☆☆ | Bekannte Lücken, dokumentiert in AUDIT |

**Empfohlene nächste Schritte (priorisiert):**
1. **A11y** (größtes Potenzial): `prefers-reduced-motion`, Fokus-Management nach Render,
   `aria-live`, Tap-Targets ≥44px, Kontrast auf WCAG-AA.
2. **Cloud-Sync-Härtung** (falls produktiv): `fetch`-Timeout (AbortController), Retry/Backoff,
   Token-Refresh, Client-Payload-Limit.
3. **Kleinigkeiten:** `isDue()` optionalen `now`-Parameter geben (Konsistenz); `esc()` zusätzlich
   `"`/`'` escapen (Defense-in-Depth).
4. **Lehrer-Modus** (falls Bedarf): optionale Klassenlisten-Persistenz, UI-Virtualisierung.
