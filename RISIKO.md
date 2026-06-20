# HolaRuta — Tiefe Risikoanalyse

**Datum:** 2026-06-11 · **Stand:** `faf7755` (v1.2.0, 561 Karten) · **Folgt auf:** [AUDIT.md](AUDIT.md) (2026-06-10, damals 419 Karten)

> **Status-Update (2026-06-11, v1.3.0): Alle Findings behoben.** Umsetzung in drei Commits auf diesem Branch
> (PWA/CI · Kernlogik · Datenbasis): Matcher-ES→DE-Kandidatenlogik, SW-Precache vollständig + Cache v8 + Update-Mechanik,
> CI-Test-Gate mit Build-Diff und SHA-Pinning, Record-Sanitizer + Ease-Klemme, confirm-Fallback (Reset **und** deleteCard),
> Export/Import + Quota-Toast + `storage.persist()` + Corrupt-Rescue, Streak-Zeitzonen- und Due-Mitternacht-Fix,
> Freies-Üben-Shuffle + Early-Review-Dämpfung, Fonts self-hosted, PNG-Icons, Offline-Guards, ES2017-Konformität,
> 9 Duplikat-Paare konsolidiert (552 Karten), Sprach-Nuancen korrigiert. Testabdeckung 58 → **93** (u. a. neuer
> ASSETS-Drift-Test gegen index.html). Einzige bewusst offene Punkte: Wikimedia-Bild-URLs in der Länderkunde
> (featurebedingt, IP-Leak nur beim Öffnen) und der kosmetische `zmilord`-ID-Slug (Umbenennen würde bestehenden
> Fortschritt verwaisen lassen).
**Methodik:** 5 parallele spezialisierte Risiko-Agents — (1) Security & Datenfluss, (2) Datenbasis, (3) Kernlogik & Datenverlust, (4) PWA/Offline/Kompatibilität, (5) Tests/CI/Prozess. Kritische Hypothesen wurden **mit Node-Testskripten gegen den echten Code belegt oder widerlegt**, nicht nur statisch behauptet. Duplikate zum AUDIT.md sind ausgelassen; mehrere AUDIT-Findings wurden als inzwischen **gefixt verifiziert** (theme-color, manifest id/scope, reduced-motion, store-Top-Level-Guards, build-Escaping, Doppel-Tap-Races).

---

## Gesamtbild

Die Substanz ist weiterhin sehr gut: **kein exploitierbares XSS** (alle Nutzer-Datenflüsse durchgängig escaped; ein URL-Import existiert gar nicht, Link-XSS ist strukturell unmöglich), **Datenbasis nahezu makellos** (alle README-Zahlen 561/19/58 programmatisch bestätigt, 0 Schema-/Referenzfehler, durchgängig LatAm-korrekt), Build deterministisch und in Sync, 58/58 Tests grün.

Die echten Risiken liegen woanders — und sie treffen genau die Kernversprechen der App:

1. **„Großzügig prüfen"** ist in Richtung ES→DE systematisch gebrochen (R1).
2. **„Funktioniert ohne Netz"** kann nach einem Release offline hart einfrieren (R2).
3. **„Der Fortschritt bleibt auf dem Gerät"** hat keinerlei Backup-Ausweg und mehrere stille Verlustpfade (R4).
4. Der Deploy-Prozess hat **kein Test-Gate** — kaputter Code geht ungeprüft live und wird von PWA-Nutzern offline gecacht (R3).

| Schweregrad | Anzahl |
|---|---|
| CRITICAL | 0 |
| HIGH | 3 |
| MEDIUM | 13 |
| LOW | 9 |

> Hinweis: Die MEDIUM-/LOW-Zahlen schließen die neuen, nicht-technischen Risiken **R13–R17**
> (Native-Speaker-Sign-off, Impressum/DSGVO, Wikimedia-CC-BY-Lizenzen, Solo-/Plattform-Abhängigkeit,
> nicht versionierter Generator) ein. Die Prosa oben bezieht sich auf den ursprünglichen technischen
> Audit; aktuelle Kennzahlen (2293 Karten · 72 Kategorien · 333 Tests) stehen in der [README.md](README.md).

---

## HIGH

### R1 · Matcher ES→DE systematisch kaputt — trifft heute jeden Nutzer dieser Richtung *(belegt)*
`matcher.js:23-27`, `matcher.js:15`, `app.js:884` — `alt[]` gilt nur für Spanisch; das deutsche Feld wird roh per `/` gesplittet, `normalize()` entfernt weder Klammern noch ß/$/–/'.

- **27 Karten sind ohne wörtliches Abtippen der Klammer unlösbar**: bei `zo01` („1. (erster/erste)") sind „erster", „erste", „1." alle falsch — nur `erste)` mit Klammer zählt. Betroffen u. a. alle Ordinalzahlen `zo02–zo10`, `z2025`, `dir40/43/44/56`, `e32/e34`, `d07/d13`.
- **19 ß-Karten lehnen die ss-Schreibweise ab** („Wie heisst du?" → falsch) — auf Reise-Handys ohne ß-Taste praktisch immer.
- **42 Karten akzeptieren die exakt angezeigte Lösung nicht** („links / rechts" getippt → falsch).
- Preis-Karten wie `zp04` („$ 45.000 – Hostel-Nacht") sind mit keiner plausiblen Eingabe lösbar.

**Folgeschaden:** Nutzer drückt nach dem ✗ vertrauensvoll „Otra vez" → SRS-Intervalle und Statistik werden still verfälscht. Das AUDIT hatte den Matcher nur DE→ES live verifiziert.
**Fix:** `normalize()` um `()`, ß→ss, `$–-'` erweitern; Klammerzusätze in ES→DE als optional behandeln; Volleingabe „A / B" akzeptieren.

### R2 · Service-Worker-Precache unvollständig → Offline-Freeze nach Release *(belegt, von zwei Agents unabhängig)*
`service-worker.js:8-27` precacht **`badges.js` und `countries.js` nicht**, obwohl `index.html:73,79` sie lädt. Runtime-Caching kaschiert das nur bis zum nächsten `CACHE_VERSION`-Bump: dann wird der alte Cache gelöscht (`service-worker.js:41`) und nur die unvollständige ASSETS-Liste neu geladen — durch `skipWaiting()`+`clients.claim()` noch während des Update-Loads.

**Feld-Szenario:** App im Hostel-WLAN geöffnet (Release wird installiert), am nächsten Tag offline im Bus: Länderkunde leer, und **ein Tap auf „Mein Ruta-Pass" friert die App ein** — `openBadges()` setzt `state.screen="badges"` ohne Guard (`app.js:439-443`), `badgesVM()` (`app.js:773`) wirft auf `null`, und da der Screen-State bestehen bleibt, wirft **jeder weitere Render erneut**, bis Reload/Online. Der „ASSETS pflegen"-Prozess hat nachweislich bereits zweimal versagt (SW zuletzt nach Existenz beider Dateien angefasst).
**Fix:** beide Dateien in ASSETS; ASSETS idealerweise per Test/Build gegen `index.html` abgleichen; `badgesVM()` und Nav-Eintrag guarden.

### R3 · Kein Test-Gate im Deploy — kaputter Code geht ungeprüft live
`pages.yml:36-52`: Checkout → Upload → Deploy. **`npm test` läuft nirgends im CI**, `node build.js` auch nicht (das eingecheckte `HolaRuta.html` wird unverifiziert mit hochgeladen). Jeder Push auf `main` geht direkt live; PWA-Nutzer cachen eine kaputte Version offline (Kombination mit R2 verschärft das).
**Fix:** Test-Job vor `deploy` (`needs:`): `npm test` + `node build.js && git diff --exit-code HolaRuta.html` — letzteres erledigt auch das Build-Drift-Risiko (R12) mit.

---

## MEDIUM

### R4 · Datenverlust-Cluster: kein Export, stilles Quota-Versagen, iOS-Eviction *(belegt)*
Der gesamte Fortschritt lebt ausschließlich in localStorage, **ohne Export/Import/Backup**:
- **Quota voll / Private Mode:** `store.js:24-30` schluckt `QuotaExceededError` still; per Simulation belegt: App läuft sichtbar normal weiter, nach Reload fehlen alle seither bewerteten Karten — wiederholt sich jede Session. Verschärfend: alle GitHub-Pages-Projekte des Accounts teilen sich Origin und Quota.
- **iOS-ITP:** Safari löscht Storage nach 7 Tagen ohne Interaktion (Browser-Tab-Nutzung, nicht installierte PWA). Szenario: 3 Wochen gelernt, 8 Tage Trekking → alles weg.
- **Korruptes JSON:** Fallback auf `{}`, der Roh-String wird nicht gesichert — unwiederbringlich.

**Fix:** `writeJson` Erfolg zurückgeben + einmaliges Banner; `navigator.storage.persist()` anfragen; JSON-Export/Import im Profil; bei Parse-Fehler Roh-String unter `…corrupt`-Key retten.

### R5 · Reset ohne Rückfrage möglich
`app.js:1146`: Fallback des `confirm`-Wrappers ist `: true` — fehlt `confirm` (eingebettete WebView u. ä.), löscht der einzige destruktive Pfad der App den **gesamten Fortschritt ohne Rückfrage**. Einzeiler-Fix: Fallback auf `false`.

### R6 · Korrupter Einzel-Record macht Karte „für immer fällig" oder „nie fällig" *(belegt)*
`store.js:35-38` validiert nur das Top-Level; `srs.js` rechnet ungeprüft: `due` als String → Karte für immer nicht fällig (verschwindet still); `ease` als String → über String-Konkatenation zu `NaN` → persistiert als `null` → `ease=0, interval=0` → Karte in **jeder** Session, Bewertungen wirkungslos. Der im AUDIT als LOW eingestufte fehlende Ease-Floor auf dem GOOD/EASY-Pfad (`srs.js:33-41`) ist genau der Mechanismus, der das **permanent** macht — er war unterschätzt. Ein ~10-zeiliger Record-Sanitizer in `loadProgress` (Number-Koersion + Floor 1.3) heilt alle Varianten. Verwandt: `cardSummary`-Crash via `ease.toFixed` (`ui.js:715`), `cat.label` ohne Guard (`app.js:197`).

### R7 · Streak-Verlust bei Zeitzonenwechsel nach Westen *(belegt — Reise-App!)*
`app.js:309-333`: `dayKey()` nutzt die lokale Uhr. Belegt per TZ-Simulation: Berlin 00:30 gelernt → Landung Bogotá (dort Vortag) → Streak sofort 0, nächste Bewertung setzt auf 1. Für Backpacker Richtung Lateinamerika der Normalfall. (DST dagegen korrekt.) **Fix:** negativen Tages-Gap als „gleicher Tag" werten.

### R8 · Due-Drift: Fälligkeit klebt an der Uhrzeit der Bewertung *(belegt)*
`srs.js:44`: `due = Date.now() + n*DAY_MS` ohne Mitternachts-Schnitt. 23:30 bewertet → am Folgetag um 21:00 nicht fällig → faktisch +1 Tag; bei abendlichem Lernen rutschen Karten systematisch. **Fix:** `due` für Intervalle ≥ 1 Tag auf lokale Mitternacht runden.

### R9 · Freies Üben: immer dieselben ersten 20 Karten + Intervall-Inflation
`app.js:819`: ohne fällige Karten besteht „freies Üben" stets aus den ersten 20 der Datenreihenfolge (Karte 21+ einer Kategorie nie erreichbar), und `srs.review()` ignoriert `due` — GOOD auf eine erst in 29 Tagen fällige Karte springt sofort auf ~75 Tage. Spaced Repetition wird so still ausgehebelt. **Fix:** shufflen + Early-Review nicht voll multiplizieren.

### R10 · Google Fonts remote: DSGVO + offline nie verfügbar
`index.html:25` + `service-worker.js:56` (`type === "basic"`-Filter cached Cross-Origin nie): IP-Übermittlung an Google bei jedem Aufruf (LG München I, Az. 3 O 17493/20 — für eine öffentliche deutschsprachige App real), und offline greift immer der System-Font-Fallback. **Ein Fix für beides: Fonts self-hosten und precachen.** (Analog kleiner: Wikimedia-Bild-IP-Leak in der Länderkunde.)

### R11 · iOS-Installations-Erlebnis: apple-touch-icon als SVG
`index.html:13`: iOS unterstützt kein SVG als Homescreen-Icon → Screenshot-Kachel statt Icon, genau bei der Kern-Zielgruppe. Zusatz: `icon.svg` nutzt `<text>` mit Webfont — Icon-Renderer laden keine Webfonts. Manifest-Icons weiterhin nur SVG (AUDIT-H5 nur teilgefixt). **Fix:** PNG 180/192/512 ergänzen.

### R12 · Release-Drift: 6 manuell synchron zu haltende Stellen
`package.json:3` ↔ `README.md:7` (Version + 2 Zählwerte) ↔ `README.md:12` (Testanzahl) ↔ `service-worker.js:7` (eigene Cache-Zählung v7) ↔ `service-worker.js:8-27` (ASSETS ↔ `index.html`, **bereits gedriftet**, siehe R2) ↔ `HolaRuta.html` (eingechecktes Build-Artefakt). Jede Stelle ist ein Drift-Risiko; R3-Fix (CI-Gate mit Build-Diff) plus ein ASSETS-Test automatisieren die zwei gefährlichsten.

---

## LOW (kompakt)

- **9 inhaltliche Karten-Duplikate** (`s04`/`social01` und `h22`/`hostel06` sind Vollduplikate; dazu `b15`/`v27`, `e34`/`f20`, `v14`/`dir08`, `v16`/`dir26`, `c12`/`kj34`, `c22`/`kj36`, `s03`/`social10`): doppelter Lernaufwand, False-Negatives im ES→DE-Modus. Je Paar konsolidieren.
- **ES2018 statt ES2017:** Objekt-Spread in `app.js:504` bricht das README-Versprechen (`README.md:9,402`) — auf sehr alten WebViews SyntaxError → tote App. Spread ersetzen oder README korrigieren.
- **skipWaiting+claim Mixed-Version-Load** (`service-worker.js:34,41,44`): Update mitten im Page-Load kann bei abreißender Verbindung eine halb initialisierte App hinterlassen. „Neu laden"-Toast oder auf skipWaiting verzichten.
- **Keine Schema-Migration** (`store.js:9`, `progress.v2`): die nächste Key-Erhöhung verliert kommentarlos allen Fortschritt, wenn keine Migration ergänzt wird.
- **Actions ohne SHA-Pinning** (`pages.yml:38,41,46,52`).
- **Geteilte github.io-Origin:** jedes andere Pages-Projekt des Accounts kann HolaRutas localStorage lesen/schreiben (kein XSS möglich, aber Daten-Manipulation). Architektur-Randbedingung.
- **iOS speechSynthesis:** `synth.cancel()` direkt vor `speak()` (`speech.js:29`) verschluckt auf iOS gelegentlich die erste Utterance.
- **Sprach-Nuancen:** „Son un millón" (`context.js:38`, eher „Es"), `social10` „Mucho gusto" als Abschied (eher „Fue un gusto"), n/ñ-Kollaps im Matcher (año/ano — bewusste Toleranz, dokumentieren).

---

## Inhaltliche, geschäftliche & rechtliche Risiken (bislang nicht erfasst)

Die obige Analyse ist überwiegend technisch. Für einen öffentlich erreichbaren Betrieb (DE-App,
`moarci.github.io`) fehlten bislang folgende nicht-technische Risiken:

### R13 · Muttersprachler-Sign-off der 2293 Karten noch offen *(Qualität/Inhalt)*
Die heute **2293 Karten** sind generativ/auditiv auf IDs, Schema, Zahlen und „kein
Spanien-Spanisch" geprüft (s. „Datenbasis" unten), aber **nicht** Karte für Karte von
LatAm-Muttersprachlern gegengelesen. Sprach-Nuancen (vgl. R8/LOW: „Son un millón", „Mucho gusto"
als Abschied, regionale Register) können vereinzelt falsch oder unnatürlich sein. Das
Kernversprechen „LatAm-korrekt" ist Marketing-tragend → ein systematischer
Native-Speaker-Review (mind. stichprobenhaft je Bereich, vollständig bei neuen Packs) sollte
fest eingeplant werden. **Schwere: MEDIUM** (Glaubwürdigkeit des Hauptversprechens).

### R14 · Impressum / DSGVO für öffentlich erreichbare DE-App *(rechtlich)*
Eine in Deutschland öffentlich erreichbare App unterliegt i. d. R. **Impressumspflicht (§ 5 DDG/TMG)**
und **DSGVO-Informationspflichten** (Datenschutzerklärung). Auch wenn HolaRuta lokal speichert und
nicht trackt: Es werden **Wikimedia-Bilder extern geladen** (IP-Übertragung an Dritte) und die
**opt-in Cloud-Sync-Schicht** verarbeitet ggf. personenbezogene Daten. Fehlen Impressum und
Datenschutzerklärung → Abmahnrisiko. **Schwere: MEDIUM** (kommerzieller/öffentlicher Betrieb).

### R15 · Wikimedia-CC-BY-Bildlizenzen & Attribution *(rechtlich/Lizenz)*
Die Kultur-/Geschichtsbilder (Länderkunde, `countries.js`/`historia*.js`) stammen von
**Wikimedia/Wikipedia**. Viele stehen unter **CC-BY / CC-BY-SA** und erfordern korrekte
**Attribution (Urheber, Lizenz, ggf. Quelle/Änderungen)**; CC-BY-SA kann zudem Share-Alike-Pflichten
auslösen. Ist die Attribution unvollständig oder fehlt, drohen Lizenzverstöße. → Lizenz-/Credit-Liste
je Bild führen und sichtbar machen (z. B. Bild-Credits-Sektion). **Schwere: MEDIUM.**

### R16 · Solo-Person- & Plattform-Abhängigkeit (`moarci.github.io`) *(Geschäft/Bus-Faktor)*
Das Projekt hängt an **einer Person** (Bus-Faktor 1) und am **kostenlosen GitHub-Pages-Hosting unter
`moarci.github.io`**. Risiken: Account-/Repo-Verlust, Pages-Policy-/Quota-Änderungen, geteilte
github.io-Origin (vgl. LOW: Daten-Manipulation durch andere Pages-Projekte), keine eigene Domain →
kein einfacher Umzug, schwacher Marken-/Vertrauensanker für B2B. → Eigene Domain + Backup-Hosting +
dokumentierte Bus-Faktor-Übergabe einplanen. **Schwere: MEDIUM** (Kontinuität/Geschäft).

### R17 · Nicht versionierter Generator `tmp_build_countries.js` *(Reproduzierbarkeit)*
`countries.js` (≈ Zeile 27) verweist darauf, dass der Datensatz von einem Skript
**`tmp_build_countries.js`** erzeugt wurde. Dieses Skript ist **nicht im Repo versioniert** →
die Länder-/Bilddaten lassen sich nicht reproduzierbar neu erzeugen, und Wissen über Bild-Quellen/
Lizenzen (vgl. R15) lebt nur im verlorenen Generator. → Generator einchecken oder
`countries.js` als manuell gepflegte Quelle-der-Wahrheit deklarieren. **Schwere: LOW.**

---

## Geprüft und entkräftet / solide

- **XSS:** alle Interpolationen in `ui.js` einzeln geprüft — ausnahmslos escaped oder interne Konstanten. Kein URL-Import, kein `postMessage`, kein `window.open`, kein externer `<a>`-Link (Tabnabbing unmöglich).
- **Prototype Pollution via JSON.parse:** entkräftet (eigene Property, kein Deep-Merge).
- **SW-Cache-Poisoning:** entschärft (`basic`-only, selbstheilende Revalidierung).
- **Datenbasis:** 0 ID-Kollisionen (SRS-Schlüssel kollisionssicher, `u`-Präfix für eigene Karten), 0 Schema-/Referenzfehler, alle 62 Zahlenkarten generativ verifiziert (inkl. `veintiún`-Apokope), 0 ¿¡-Fehler, 0 Spanien-Spanisch-Treffer.
- **Workflow-Permissions** minimal, keine Injection-Vektoren.
- **Build:** `node build.js` byte-identisch zum eingecheckten `HolaRuta.html`, deterministisch.
- **Races/Leaks:** Doppel-Tap mehrfach abgesichert, reine Event-Delegation, Reload mitten in der Session verliert nur die Position (AUDIT überzeichnete hier: die AGAIN-Re-Queue ist persistiert).
- **Tests:** 58/58, substanziell (Böden/Decken, Korruption, Off-by-one) — Lücken: `app.js`-Controller, `store.loadProgress/loadUserCards`, kein Import-/Exportpfad existiert.

---

## Priorisierte Maßnahmen

| # | Maßnahme | Deckt ab | Aufwand |
|---|---|---|---|
| 1 | Matcher-Normalisierung erweitern (Klammern, ß, $/–, Volleingabe) | R1 | klein |
| 2 | `badges.js`+`countries.js` in ASSETS + `badgesVM`-Guard + ASSETS-Test gegen index.html | R2, Teil R12 | klein |
| 3 | CI-Gate: `npm test` + Build-Diff vor Deploy | R3, R12 | klein |
| 4 | Record-Sanitizer in `loadProgress` + Ease-Floor auf allen Pfaden | R6 | klein |
| 5 | `confirm`-Fallback auf `false` | R5 | trivial |
| 6 | Quota-Feedback + `storage.persist()` + JSON-Export/Import | R4 | mittel |
| 7 | Streak-Gap-Fix (Westreise) + Due-Mitternacht | R7, R8 | klein |
| 8 | Fonts self-hosten; PNG-Icons | R10, R11 | mittel |
| 9 | Freies Üben shufflen, Early-Review dämpfen | R9 | klein |
| 10 | Karten-Duplikate konsolidieren | LOW | klein |
