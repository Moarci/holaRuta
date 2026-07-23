# HolaRuta — Backend-Spec (optionale Stufe 3: Accounts · Sync · Klassen · Lizenzen)

> **Datum:** 2026-06-15 · **Folgt auf:** [MARKT.md](MARKT.md), [BAUPLAN.md](BAUPLAN.md), [RISIKO.md](RISIKO.md)
> **Status:** **Spezifikation, kein Code.** Dieses Dokument beschreibt ein **optionales** Server-Backend,
> das HolaRuta um Accounts, Mehrgeräte-Sync, serverseitige Klassen/Zuweisungen und Per-Seat-Lizenzen
> erweitert. Es wird **erst mit einem zahlenden Referenzkunden** gebaut (vgl. MARKT.md §6/§7, „Stufe 3").
>
> **Leitsatz:** Die heutige App bleibt **unverändert** eine statische, offline-first, zero-dependency-PWA.
> Das Backend ist eine **Opt-in-Zusatzschicht** — wer es nicht nutzt, merkt nichts davon.

---

## 0. Warum diese Spec existiert

Drei Stufe-3-Themen sind **server-gebunden** und lassen sich nicht offline lösen:

| Thema | Warum Server nötig |
|---|---|
| **Accounts** | Identität über Geräte hinweg, geteilter Zustand |
| **Echtzeit-Mehrgeräte-Sync** | gemeinsamer Speicher als „source of truth" jenseits eines Geräts |
| **Per-Seat-Lizenzlogik / Abrechnung** | Lizenzen zählen/erzwingen, Zahlungen |

Bereits **backend-frei umgesetzt** (kein Server, vgl. README/Changelog):
- **Backup-Export/-Import** (`store.exportData`/`importData`) — manueller Geräte-Transfer per Datei.
- **„Modo profe"** — Lehrkraft importiert Schüler-Backups → Klassenübersicht (`store.readBackup`, rein lesend).
- **„Tarea"** — teilbare Aufgaben-Codes (`store.encodeTask`/`decodeTask`).

Diese Spec hebt genau diese drei Server-Themen auf einen **anschlussfähigen, datenschutzkonformen** Plan.

---

## 1. Leitprinzipien (nicht verhandelbar)

1. **Offline-first bleibt.** Die PWA funktioniert **vollständig ohne Backend**. Der lokale `localStorage`
   bleibt die primäre Quelle der Wahrheit auf dem Gerät; das Backend ist nur ein **Spiegel/Merge-Ziel**.
2. **Opt-in.** Ohne Login keine Netzwerk-Calls — exakt wie heute. Sync ist eine bewusste
   Nutzer-Entscheidung (Anmelden).
3. **Zero-dependency-Prinzip der PWA bleibt.** Der Client bekommt **einen** schlanken Vanilla-JS-Adapter
   (`sync.js`, < 1 Modul, `fetch`-basiert, keine Frameworks). Die **Server-Komponente** ist ein
   **separates Projekt/Repo** mit eigenem Stack — sie bricht die Zero-Dep-Regel der PWA nicht.
4. **Datenminimierung & DSGVO by Design.** So wenig personenbezogene Daten wie möglich; EU-Hosting;
   Auskunft/Löschung/Export als Erstklasse-Funktion; keine Verhaltens-Analytics.
5. **Anschlussfähigkeit über die vorhandenen Seams.** Sync-Einheit = das **bestehende Backup-Payload**
   (`{ app:"holaruta", format, data:{ <key>:… } }`). Kein neues Datenformat erfinden.
6. **Kein Big-Bang.** Vier kleine, je für sich auslieferbare Phasen (siehe §11). Jede Phase ist ohne die
   nächste nützlich.

---

## 2. Was das Backend **nicht** ändert

- Die statische `HolaRuta.html` / der Service-Worker / der Edition-Build (`build.js --edition`) bleiben wie sie sind.
- Die lokalen Keys (`spanischcard.progress.v2`, `…settings.v1`, `…usercards.v1`, `…gamestats.v1`) bleiben das
  lokale Schema; sie werden **nicht** ersetzt, nur optional gespiegelt.
- Die Pakete/Pre-Trip-Pläne/Challenges (reine Daten in `data.js`) bleiben **client-seitig** — der Server
  speichert **Fortschritt**, nicht Lerninhalte.

---

## 3. Architektur-Überblick

```
   ┌─────────────────────────────┐         HTTPS (nur bei Login)        ┌──────────────────────────┐
   │   HolaRuta PWA (wie heute)  │  ───────────────────────────────▶   │   Sync-API (separat)     │
   │  localStorage = Quelle d. W.│  ◀───────────────────────────────   │  Stateless Functions     │
   │  + optionaler sync.js-Adapter│        Push/Pull Backup-Blob        │  + Auth + DB (EU)        │
   └─────────────────────────────┘                                     └──────────────────────────┘
            │  (ohne Login: 0 Netzwerk)                                     │   │        │
            └── exportData/importData/readBackup (bestehend) ───────────────┘   │        │
                                                              Accounts ─────────┘        │
                                                              Org/Class/Assignment ──────┘
```

- **Client:** unverändert + `sync.js` (Feature-geschaltet über `config.js`, Default aus).
- **API:** zustandslose Funktionen (Serverless oder kleiner Node-Dienst). Nur JSON.
- **DB:** relationale DB (Postgres) oder Serverless-DB (siehe §10). EU-Region.
- **Auth:** passwortlos (E-Mail-Magic-Link/OTP) → **kein** Passwort-Hashing-Risiko.

---

## 4. Anschlusspunkte im bestehenden Code

| Vorhandenes | Rolle im Backend-Plan |
|---|---|
| `store.exportData()` → `{app,format,exportedAt,data}` | **Sync-Push-Payload** (Gerät → Server) |
| `store.importData(payload)` | **Sync-Pull-Anwendung** (Server → Gerät), nach Merge |
| `store.readBackup(payload)` | rein lesendes Mappen (für Server-seitige Auswertung/Dashboard-Read identisch nachbaubar) |
| `store.encodeTask/decodeTask` | Aufgaben — Phase 3 macht sie **serverseitig zuweisbar** (statt nur Code-Teilen) |
| `config.js` (`SC.config`) | trägt künftig `sync: { apiBase, enabled }` (Default `null` = aus) |
| Edition-Build (`editions/*`) | eine „Schul-/Partner-Edition" kann Sync vorkonfiguriert ausliefern |

**Neuer Client-Code (minimal):** ein Modul `sync.js` mit
`login(email)`, `confirm(token)`, `push()`, `pull()`, `merge(local, remote)`, `logout()` — alles `fetch`-basiert,
hinter `if (SC.config.sync && SC.config.sync.enabled)`. Ohne Config bleibt es toter Code (graceful).

---

## 5. Datenmodell (Server)

Minimal, normalisiert, pseudonymisierbar. IDs sind UUIDs.

| Tabelle | Felder (Kern) | Zweck |
|---|---|---|
| **user** | id, email (hash/optional klar), created_at, locale | Konto (passwortlos) |
| **device** | id, user_id, label, last_seen_at | Mehrgeräte-Zuordnung |
| **sync_state** | user_id, payload (JSONB = Backup-`data`), rev (int), updated_at | gespiegelter Fortschritt (1 Zeile/User) |
| **org** | id, name, plan, seats_total, created_at | Schule/Anbieter (Lizenznehmer) |
| **membership** | org_id, user_id, role (`owner`/`teacher`/`student`) | Wer gehört zu welcher Org |
| **class** | id, org_id, name, code | Klasse/Gruppe |
| **enrollment** | class_id, user_id | Schüler ↔ Klasse |
| **assignment** | id, class_id, kind, scope, title, due, created_by, created_at | serverseitige Zuweisung (erweitert `encodeTask`-Schema) |
| **assignment_state** | assignment_id, user_id, status, progress, updated_at | pro Schüler erledigt/offen |
| **license_seat** | org_id, user_id, assigned_at | Per-Seat-Belegung |
| **audit_log** | id, actor, action, target, at | DSGVO-Nachvollziehbarkeit (ohne Inhalte) |

> **Wichtig:** `sync_state.payload` ist exakt das `data`-Objekt aus `store.exportData()` — der Server muss das
> Lernschema **nicht** kennen, nur als opaken Blob speichern/zurückgeben. Auswertung fürs Dashboard läuft
> serverseitig über dieselbe Logik wie `store.readBackup` + `badges.buildMetrics` (als kleine Server-Portierung
> oder per Edge-Function, die den Client-Reducer wiederverwendet).

---

## 6. API (REST, JSON, versioniert unter `/v1`)

**Auth (passwortlos):**
- `POST /v1/auth/start` `{ email }` → schickt Magic-Link/OTP. (Rate-limited.)
- `POST /v1/auth/confirm` `{ email, token }` → `{ accessToken, user }`. Token gerätegebunden, kurz lebig + Refresh.
- `POST /v1/auth/logout`.

**Sync (Kern):**
- `GET /v1/sync` → `{ rev, payload }` (aktueller Server-Stand).
- `PUT /v1/sync` `{ baseRev, payload }` → `{ rev }` oder `409 { rev, payload }` bei Konflikt (Client merged, retry).

**Klassen/Zuweisung (Phase 3):**
- `POST /v1/classes` (teacher) · `POST /v1/classes/:id/join` `{ code }` (student).
- `GET /v1/classes/:id/roster` → Schüler + aggregierte Kennzahlen (Dashboard-Read).
- `POST /v1/classes/:id/assignments` `{ kind, scope, title, due }` · `GET /v1/assignments?class=…`.
- `POST /v1/assignments/:id/state` `{ status, progress }` (Schüler meldet Fortschritt).

**Konto/DSGVO (Pflicht):**
- `GET /v1/account/export` → vollständiger Daten-Download (JSON).
- `DELETE /v1/account` → harte Löschung (Konto + sync_state + Memberships), bestätigt.

Alle Endpunkte: HTTPS, Bearer-Token, Org-Scoping, strikte Eingabevalidierung, Größenlimit auf `payload`.

---

## 7. Auth-Design

- **Zwei Login-Wege, eine Identität:**
  - **Google-OAuth** (niedrigste Schwelle, 1 Klick). Umsetzung SDK-frei: `GET /v1/auth/google/start`
    baut serverseitig die Supabase-Google-URL (`signInWithOAuth`, `flowType:"implicit"`) und leitet per
    302 dorthin. Der Redirect kommt auf `auth-callback.html` mit dem Supabase-Access-Token im
    URL-Fragment zurück; die Seite reicht es an `POST /v1/auth/google/confirm`, wo `getUser()` es
    validiert. Bewusst **kein** eingebettetes Google-Script → die enge CSP (`script-src 'self'`) bleibt.
  - **Passwortlos** (E-Mail-Magic-Link / 6-stelliger OTP) als Rückfall. Kein Passwort-Storage.
- **Ein Token für alle Wege:** Nach erfolgreichem Login (Google wie E-Mail) mintet der Server über den
  gemeinsamen Helfer `mintSession()` (siehe `api/_auth.js`) genau **einen langlebigen, opaken
  Bearer-Token** (`hr_…`, in der `session`-Tabelle, per Logout widerrufbar). `net.js` hält bewusst nur
  diesen einen Token und kennt **kein** Refresh — der kurzlebige Supabase-JWT wird nie im Client gehalten.
- **Account-First (Launch-Edition):** `config.account = { required, google }` schaltet ein Login-Gate
  direkt beim ersten Start (Onboarding erst danach). Greift nur, wenn zugleich Cloud-Sync aktiv ist
  (truthy `apiBase`) — die `file://`-Offline-Variante bleibt anonym/gate-frei. Nach dem Login faltet der
  vorhandene Sync-Merge (§8) evtl. lokal vorhandene Daten in den Account („Claim").
- **Account-Linking:** In Supabase „Allow linking identities with same email" aktivieren, damit derselbe
  Mensch via Google **und** E-Mail-OTP eine Identität bleibt (sonst zwei `profile` → doppelter Fortschritt).
- **Schüler ohne E-Mail** (Minderjährige/Schulkontext): **Klassen-Code + Anzeigename** statt E-Mail
  (Pseudonym-Konto, von der Lehrkraft/Org verwaltet) — DSGVO-schonend, keine Schüler-Mailadressen nötig.

---

## 8. Sync- & Merge-Strategie

Der Fortschritt ist **gut mergebar**, weil die Felder fast alle monoton oder mengenartig sind:

- **Zähler** (reviews, battlesPlayed, Streaks …): `max(local, remote)` bzw. additive Felder feld-spezifisch.
- **Mengen-Maps** (`challengesDone`, `roleplaysSeen`, `pretripDays{scope}`, `rutaDays`, `contextCardsSeen` …):
  **Vereinigung** (Union) — verlustfrei über Geräte.
- **Karten-Fortschritt** (`progress[cardId]`): **last-write-wins pro Karte** anhand eines `updatedAt`/`reviewedAt`
  (SM-2-Box). Konfliktfenster ist klein, Verlustrisiko gering.
- **Einstellungen** (`settings`): last-write-wins pro Gerät (oder gar nicht syncen — gerätelokal lassen).

> Konkret: `sync.merge(local, remote)` ist eine **reine Funktion** (wie `srs`/`matcher`) und gehört damit zu
> HolaRutas Stärke — sie ist **unit-testbar** ohne Server. Empfehlung: zuerst `merge` + Tests schreiben,
> dann erst die HTTP-Schicht. Konfliktstrategie über `rev` (optimistic concurrency, `409` → merge → retry).

---

## 9. Per-Seat-Lizenzlogik

- Eine **Org** hat `seats_total`. Beim ersten Sync eines Schülers in einer Org wird ein `license_seat` belegt;
  Freigabe gibt einen Seat frei.
- **Soft-Enforcement:** Überschreiten der Seats blockiert **nicht** das Lernen (offline-first!), sondern meldet
  der Org „n über Limit" → Upsell. Das schützt das Lernerlebnis und vermeidet Härtefälle.
- Abrechnung: separater Billing-Provider (z. B. Stripe) — **nicht** Teil des Lern-Backends; nur Webhook
  aktualisiert `org.plan/seats_total`.

---

## 10. Hosting / Betrieb (Optionen)

| Variante | Stack | Vorteil | Nachteil |
|---|---|---|---|
| **A — Serverless EU** *(Empf. Start)* | Cloudflare Workers + D1/KV **oder** Supabase (EU-Region) | minimaler Betrieb, günstig, schnell startklar, EU-Region | Vendor-Bindung |
| **B — Kleiner Node-Dienst** | Node + Postgres (Hetzner/Scaleway EU) | volle Kontrolle, portabel | mehr Ops |
| **C — Self-host für Schulen** | Docker-Compose (API+Postgres) | Datenhoheit beim Kunden (starkes Schul-Argument) | Support-Aufwand |

**Empfehlung:** Start mit **A** (schnell, EU, billig), Architektur aber providerneutral halten (DB hinter einem
Repository-Interface), damit **C** für datensensible Schulkunden später möglich ist.

> Nebeneffekt: Die eigene Domain **holaruta.com** (statt `moarci.github.io`) löst zugleich die in
> MARKT.md §2 genannte `github.io`-Shared-Origin-`localStorage`-Randbedingung und wirkt für
> Schulen/Partner seriöser.

---

## 11. Migrationspfad / Stufenplan (klein, je auslieferbar)

| Phase | Inhalt | Aufwand | Bricht App-Prinzipien? |
|---|---|---|---|
| **0 — heute** | Datei-Backup/-Import, Modo profe, Tarea | ✅ fertig | nein |
| **1 — Cloud-Backup** | Login + 1 Blob/User (`PUT/GET /sync`), „in der Cloud sichern/wiederherstellen" | **M** | nein (opt-in, App bleibt offline) |
| **2 — Mehrgeräte-Merge** | reine `merge()`-Funktion + Tests, automatischer Pull/Push, Konflikt via `rev` | **M–L** | nein |
| **3 — Klassen & Zuweisung server-seitig** | Org/Class/Enrollment/Assignment, Live-Dashboard-Read, Schüler-Konten per Klassen-Code | **L** | teilweise (Server nötig; PWA bleibt offline-fähig) |
| **4 — Per-Seat + Billing** | Seats, Soft-Enforcement, Stripe-Webhooks | **M** | nein für die PWA; kommerzielle Schicht |

**Regel:** Jede Phase nur starten, wenn ein zahlender Kunde sie verlangt. Phase 1+2 liefern bereits den
größten Endkunden-Nutzen (Mehrgeräte). Phase 3+4 sind die B2B-/Schul-Monetarisierung.

---

## 12. Datenschutz / DSGVO (Pflichtenheft)

- **Rechtsgrundlage & Einwilligung:** Sync ist opt-in; klare Einwilligung beim Login; Datenschutzerklärung + AVV/DPA.
- **Datenminimierung:** nur E-Mail (oder Pseudonym) + Fortschritts-Blob + Klassen-Zugehörigkeit. **Keine**
  personenbezogene Verhaltens-Analytics, **kein** Werbe-Tracking, **keine** Drittanbieter-Tracker.
  (Die optionale **anonyme, aggregierte** Nutzungsstatistik aus §17 ist opt-in, ohne PII und ohne Karteninhalte.)
- **Minderjährige/Schulen:** Schüler-Pseudonym-Konten ohne E-Mail; Org/Schule ist Verantwortliche, HolaRuta
  Auftragsverarbeiter (AVV). Elternzustimmung über die Schule.
- **Betroffenenrechte:** Self-Service-Export (`/account/export`) und harte Löschung (`/account`) ab Tag 1.
- **Speicherort:** EU-Region; Verschlüsselung in Transit (TLS) und at Rest; Backups verschlüsselt, befristet.
- **Logs:** keine Lerninhalte/PII in Logs; `audit_log` nur Aktionen, keine Payloads.

---

## 13. Sicherheit

- Bearer-Tokens mit kurzer Lebensdauer + Refresh; Geräte-Widerruf.
- Strenge Eingabevalidierung; `payload`-Größenlimit (z. B. ≤ 256 KB) und Schema-Sanity (gleiche Idee wie
  `store.importData`, das schon nur bekannte Keys übernimmt).
- Org-/Rollen-Scoping auf jedem Endpoint (ein Schüler sieht nie fremde Schüler; nur Teacher/Owner sehen Roster).
- Rate-Limiting (Auth, Sync), CORS strikt auf die App-Origin.
- Keine Geheimnisse im Client; `config.sync.apiBase` ist öffentlich, alles andere serverseitig.

---

## 14. Akzeptanzkriterien (Definition of Done je Phase)

- **Phase 1:** Nutzer kann sich passwortlos anmelden, „in Cloud sichern" und auf einem zweiten Gerät
  „wiederherstellen"; ohne Login 0 Netzwerk-Calls (nachweisbar); Export/Löschung funktionieren.
- **Phase 2:** Zwei Geräte konvergieren ohne Fortschrittsverlust; `merge()` ist rein + voll unit-getestet
  (Union der Mengen, max der Zähler, LWW pro Karte); Konflikt via `rev` deterministisch.
- **Phase 3:** Lehrkraft erstellt Klasse + Zuweisung serverseitig; Schüler tritt per Code bei (ohne E-Mail);
  Live-Roster zeigt dieselben Kennzahlen wie „Modo profe" heute.
- **Phase 4:** Seats werden korrekt belegt/freigegeben; Überschreiten meldet (blockiert nicht); Stripe-Webhook
  aktualisiert Plan/Seats.

---

## 15. Bewusst **draußen** (Scope-Grenzen)

- Kein Realtime-Collaboration/WebSockets — Pull/Push reicht (offline-first).
- Kein Inhalts-CMS auf dem Server — Lerninhalte bleiben in `data.js` und werden client-seitig ausgeliefert.
- Kein Vendor-Lock im Kern: DB hinter Repository-Interface, damit Self-Host (Variante C) möglich bleibt.
- Keine eigene Zahlungslogik — ausgelagert an Stripe (nur Webhook-Anbindung).

---

## 16. Soziale Schicht — Freunde & Tages-Rangliste (Phase 5, opt-in)

Der **soziale/kompetitive** Aufsatz: sich mit Freund:innen verbinden und sehen, **wer heute am meisten
Karten gemacht hat**. Baut auf derselben opt-in-Cloud auf (gleiche passwortlose Anmeldung), bleibt aber
sauber abgrenzbar — ohne `SC.config.social` existiert der ganze Pfad nicht.

> **Status:** Der **Client ist vorbereitet** (`social.js` reiner Kern + fetch-Adapter, UI im Profil,
> Tests, Mock-Endpunkte in `tools/mock-sync-server.js`). Es fehlt **nur noch der echte Server**, der die
> unten spezifizierten Endpunkte implementiert. Phase 5 startet — wie alle Stufe-3-Phasen — kundengetrieben.

### 16.1 Leitplanken (zusätzlich zu §1)

- **Datenminimierung als Kern-Feature.** Veröffentlicht wird **nur** ein winziger Tages-Snapshot
  (`{ day, name, cards, streak, reviews }`) — **kein** Lernfortschritt, **keine** Inhalte, **kein**
  Klarname nötig (selbst gewählter Anzeigename). „Andere sehen meine Zahlen" ist eine bewusste
  Einwilligung, getrennt vom reinen Sichern (Sichtbarkeit ≠ Backup).
- **Geteilte Identität.** Login = derselbe passwortlose Flow + **derselbe Token** wie §7. Die
  gemeinsame Auth-/fetch-Schicht liegt in **`net.js` (`SC.net`)**, die `sync.js` und `social.js`
  beide nutzen — ein Login deckt Cloud-Sync **und** Freunde ab. `social.apiBase` fällt auf
  `sync.apiBase` zurück.
- **Server = source of truth** für die Rangliste; der Client hält nur einen transienten Stand
  (kein neuer localStorage-Key). Offline zeigt der Schirm zuletzt Geladenes bzw. einen Hinweis.
- **Reiner Kern zuerst.** `buildSnapshot` / `buildLeaderboard` (deterministische Sortierung +
  geteilter Wettbewerbsrang) / `makeFriendCode` sind seiteneffektfrei und in `test/social.test.js`
  geprüft — der Server kann dieselbe Sortierlogik wiederverwenden.

### 16.2 Datenmodell (Ergänzung zu §5)

| Tabelle | Felder (Kern) | Zweck |
|---|---|---|
| **friendship** | user_id, friend_id, created_at | beidseitige Freundschaft (zwei Zeilen oder symmetrisch lesen) |
| **daily_snapshot** | user_id, day (`YYYY-MM-DD`), name, cards, streak, reviews, updated_at | veröffentlichter Tages-Stand (1 Zeile je user×day; Upsert) |

> Der Snapshot ist bewusst **redundant** zum `sync_state`-Blob (er hält genau die Ranglisten-Felder
> flach), damit die Rangliste **ohne** Auspacken des opaken Sync-Blobs beantwortbar ist und ein Nutzer
> die Rangliste teilen kann, **ohne** seinen vollen Fortschritt zu spiegeln.

### 16.3 API (Ergänzung zu §6, unter `/v1`, Bearer-Token)

- `GET /v1/me/code` → `{ code }` — eigener teilbarer Freundes-Code (`HRF1.…`, kapselt die user_id).
- `GET /v1/friends` → `{ friends: [{ id, name }] }`.
- `POST /v1/friends` `{ code }` → `{ added }` (Code serverseitig via `parseFriendCode` auflösen;
  `400` bei Müll/Selbst-Code).
- `DELETE /v1/friends/:id` → `{ removed }`.
- `PUT /v1/social/snapshot` `{ snapshot:{ day, name, cards, streak, reviews } }` → `{ ok }`
  (Upsert auf user×day; Felder validieren/cappen — Name ≤ 40, Zahlen ≥ 0).
- `GET /v1/leaderboard?day=YYYY-MM-DD` → `{ meId, entries:[{ id, name, cards, streak, reviews, day }] }`
  (eigener + Freundes-Snapshots des Tages; Sortierung macht der Client deterministisch nach).

Scoping: ein Nutzer sieht **nur** eigene Freunde; `meId` markiert den eigenen Eintrag. Rate-Limiting auf
`snapshot`/`leaderboard`. Löschung (§6 `DELETE /v1/account`) entfernt auch `friendship` + `daily_snapshot`.

### 16.4 Akzeptanzkriterien (DoD)

- Zwei eingeloggte Geräte werden über `code` → `POST /v1/friends` Freunde; beide veröffentlichen einen
  Snapshot; `GET /v1/leaderboard` liefert beide; der Client zeigt sie nach Karten sortiert mit
  geteiltem Rang und markiertem „Du". Ohne `SC.config.social.enabled`: **0 Netzwerk-Calls**, Nav-Eintrag
  unsichtbar. `tools/mock-sync-server.js` deckt alle Endpunkte für die lokale Demo ab.

### 16.5 Bewusst draußen (zusätzlich zu §15)

- **Keine** öffentlichen/globalen Bestenlisten (nur unter eingewilligten Freunden) — schützt Minderjährige
  und vermeidet Leistungsdruck/PII-Streuung.
- **Kein** Push/Realtime — die Rangliste wird beim Öffnen/„Aktualisieren" geholt (offline-first).
- **Keine** Verlaufs-Historie fremder Nutzer auf dem Client — immer nur der angefragte Tag.

---

## 17. Anonyme Nutzungs-Telemetrie — „wie viele nutzen es und wie?" (Phase 6, opt-in)

> **Vollständige Feld-für-Feld-Aufstellung aller geloggten Daten:** [docs/TELEMETRIE.md](docs/TELEMETRIE.md).

Die **betreiberseitige** Frage „wie viele Leute nutzen HolaRuta und welche Modi?" lässt sich nicht
offline beantworten — sie braucht einen **Zähl-Endpunkt**. Damit das die Datensparsamkeit der App
nicht aufweicht, ist die Telemetrie **opt-in, anonym und aggregiert**: standardmäßig aus, und selbst
eingeschaltet verlässt **kein** Lernfortschritt, **keine** Karteninhalte und **keine** stabile
Nutzer-ID das Gerät.

> **Status:** Client **und** Server sind live: `analytics.js` (reiner Kern + fetch-Adapter über
> `SC.net`, Consent-Schalter im Profil, `test/analytics.test.js`) sendet an `POST /v1/usage`/`/v1/events`
> (`api/_v1/usage.js`/`events.js`), die nach Supabase schreiben (RLS an, nur `service_role`). Die
> Auswertung läuft über `GET /v1/admin/stats` (`api/_v1/admin/stats.js`, §17.6.3) — siehe
> [docs/TELEMETRIE.md §7](docs/TELEMETRIE.md#7-dashboard--wie-viele-nutzen-es-und-wie-lange).

### 17.1 Leitplanken (zusätzlich zu §1, §12)

- **Doppelte Schranke.** Gesendet wird **nur**, wenn (1) eine Edition `SC.config.analytics`
  (`enabled` + `endpoint`) setzt **und** (2) der Nutzer die Statistik nicht abgeschaltet hat
  (**Opt-out**: `settings.analyticsConsent !== false`). Ohne beides: **0 Netzwerk-Calls** — exakt
  wie ohne das Modul. `analytics.js` selbst kennt keinen Default: es prüft weiterhin strikt
  `consent === true`; den Default setzt allein der Controller (`app.js`).
- **Datenminimierung als Kern.** Der Snapshot trägt **nur grobe, gebucketete** Aggregate, alle aus dem
  **bereits vorhandenen** `gamestats` abgeleitet (nichts Neues wird erfasst): Tag, App-Version, UI-Sprache,
  Lern-Track, Karten-heute-**Bucket**, Streak-**Bucket**, Reviews-**Bucket** und boolesche „je-Modus-benutzt"-
  Flags. Buckets sind bewusst grob (k-anonymity-freundlich). **Keine** Karten-IDs, **kein** Suchtext,
  **keine** PII, **keine** stabile/rotierende ID — der Server zählt reine Aggregate.
- **Anonym & ohne Auth.** Der Endpunkt braucht **keinen** Login/Token (anders als §6/§16). Ein Nutzer ist
  serverseitig nicht wiedererkennbar; Tages-Dedupe passiert **clientseitig** (lokaler „zuletzt gesendet"-Tag,
  nicht im Backup).
- **Höchstens ein Snapshot pro Tag**, beim App-Start (fire-and-forget; Fehler werden geschluckt, nie blockierend).

### 17.2 API (Ergänzung zu §6, unter `/v1`, **ohne** Bearer-Token)

- `POST /v1/usage`
  `{ app:"holaruta", schema:1, day:"YYYY-MM-DD", appVersion, locale, track,
     cardsToday:"<bucket>", streak:"<bucket>", reviews:"<bucket>",
     features:{ study, listen, precios, dialogos, definiciones, yesto, frases, conjug, battles, roleplay, challenges, ruta, pretrip } }`
  → `{ ok:true }`. Server: strikte Eingabevalidierung, **Größenlimit** (z. B. ≤ 4 KB), **Rate-Limiting**
  (pro IP/Tag), CORS strikt auf die App-Origin. Die Bucket-Grenzen sind clientseitig fix
  (`analytics.js`: `CARD_EDGES`/`STREAK_EDGES`/`REVIEW_EDGES`) und serverseitig 1:1 nachnutzbar.

### 17.3 Datenschutz (Ergänzung zu §12)

- **Rechtsgrundlage:** ausdrückliche Einwilligung (opt-in im Profil), jederzeit widerrufbar (Schalter aus).
- **Keine PII, kein Profil, kein Werbe-Tracking, keine Drittanbieter-Tracker.** Server speichert nur
  aggregierte Tageszahlen; IP wird **nicht** persistiert (nur transient fürs Rate-Limit).
- **Marketing-Konsistenz:** Da eine Telemetrie existiert und seit dem Wechsel auf **Opt-out**
  voreingestellt **an** ist, wird die frühere absolute „kein Tracking"-Aussage in den Beschreibungen
  durch die ehrliche Formulierung ersetzt („lokal-first, keine Werbung; Cloud-Sync ist optional, die
  anonyme Nutzungsstatistik läuft voreingestellt mit und ist mit einem Klick abschaltbar").

### 17.4 Akzeptanzkriterien (DoD)

- Ohne `SC.config.analytics` **oder** ohne Consent: nachweisbar **0** `fetch`-Calls (Test mit Spy).
- Mit beidem: **genau ein** `POST /v1/usage` pro Tag mit anonymem, gebucketetem Body (kein PII/keine
  Karten-ID/keine ID — per Allowlist-Assertion geprüft). `analytics.js`-Kern ist rein + voll unit-getestet.

### 17.5 Bewusst draußen (zusätzlich zu §15)

- **Keine** Geolokalisierung, **keine** Device-Fingerprints, **keine** Cookies.
- **Keine** Verknüpfung mit Sync/Social-Konten (ohne Token, eigene pseudonyme `clientId`).
- **Kein** Klick-für-Klick-Mitschnitt von Inhalten — Events tragen Enums/Buckets plus einzelne
  nicht-identifizierende Ganzzahlen (Interaktionszähler/Rundendauer), aber **keine** Inhalte (s. §17.6).

### 17.6 Interaktions-Events — „was machen sie genau?" (Vollausbau, opt-in)

Der **Tages-Snapshot** (§17.2) beantwortet „wie viele & grob was". Für **Weiterentwicklung**
(Funnels, Retention, Drop-off) und **Monitoring** (JS-Fehler, Ladezeiten) kommt ein
**Event-Strom** dazu — derselbe Opt-in-Schalter, dieselbe Datenminimierungs-DNA.

> **Status:** Client fertig (`analytics.js`: `track`/`flush`/`buildEvent`/`sanitizeProps`, Queue,
> pseudonyme IDs; Hooks in `app.js`; `test/analytics.test.js`). Server-Event-Store ist Supabase
> (`event`-Tabelle, §17.6.3); lokale Demo ohne eigenes Backend: `tools/mock-events-server.js` oder
> `tools/telemetry-server.js`.

**17.6.1 Leitplanken (zusätzlich zu §17.1)**
- **Doppelte Schranke unverändert:** ohne Endpunkt **und** ohne Zustimmung wird **nichts gepuffert
  oder gesendet** (kein Sammeln „auf Vorrat").
- **Pseudonym statt anonym (bewusst):** zufällige, **resetbare** `clientId` (gerätelokal, eigener
  LS-Key, **nicht** im Backup) + `sessionId` (pro App-Start, rotiert nach 30 min Inaktivität).
  Erlaubt Journeys/Retention, **kein** Klarname, **keine** Geräte-Fingerprints. Reset-Knopf im Profil;
  Consent-aus verwirft `clientId` + Puffer.
- **Allowlist-Sanitizer (Default deny):** jedes Event hat eine feste Prop-Allowlist; Werte werden in
  **Enum/Slug/Zahl/Bucket** gezwungen. Freitext (Leerzeichen/Satzzeichen) fällt **strukturell** durch
  → **kein Suchtext, keine Kartentexte/-IDs, keine Namen**. Fehler-Texte werden PII-bereinigt
  (E-Mail/lange Ziffernfolgen raus) und auf 80 Zeichen gekappt.
- **Lokale Pufferung & Batching:** Ring-Queue (≤ 200 Events) im `localStorage`; Versand gebündelt
  (≤ 50/Batch) periodisch und beim Verstecken/Schließen via `navigator.sendBeacon` (zuverlässig).

**17.6.2 Event-Taxonomie (heute gesendet)** — `app_open` · `screen_view` · `action` ·
`session_start` · `session_complete` · `card_rated` · `feature_start` · `feature_complete` ·
`search` · `share` · `activation` · `placement_result` · `onboarding_step` · `onboarding_complete` ·
`error` · `consent_change` · `pwa_prompt` · `pwa_installed`. Bewusst
nur Events, die der Client tatsächlich sendet (Spec == Implementierung); die Allowlist
(`analytics.js: EVENTS`) ist erweiterbar. `session_start` deckt **alle** Lern-Startpfade ab
(zentral aus `beginRound`); `feature_start`/`feature_complete` **alle** Lernspiele (zentral aus
`onClick` bzw. `setGameStats`). `session_complete` trägt neben den Buckets exakte Ints
(`answered_n`/`correct_n`/`xp_n`/`secs`) für die Investor-Interaktions-Tiefe; `share`/`activation`
speisen Virality- und Aktivierungs-KPIs (`activation.day_n` = Tage seit Erstnutzung → Time-to-Value;
Meilensteine `first_session` + `streak_3/7/30` → Habit-Funnel); `pwa_prompt`/`pwa_installed`/
`app_open.standalone` bilden den Install-Funnel bis „benutzt"; `placement_result` trägt nur das
grobe Einstufungs-Niveau. Das daraus abgeleitete **Investor-Cockpit** (North Star,
Retention-Kohorten, K-Faktor, Growth Accounting, Interaktionen pro Person/Sitzung/Tag, B2B je
Edition) ist in [docs/INVESTOR-KPIS.md](docs/INVESTOR-KPIS.md) definiert.
Envelope (zusätzlich `edition` + grobe `platform`-Klasse):
`{ v, ts, day, clientId, sessionId, seq, appVersion, locale, track, edition, platform, event, props }`.
Der **anonyme Snapshot** trägt zusätzlich `mastered` (% gemeistert), `tripGoal`/`tripDaily`,
`edition`, `platform` — alles gebucketet. `app_open` trägt zudem `src` (Akquise-Quelle, nur Enum).
Vollständige Feldliste: [docs/TELEMETRIE.md](docs/TELEMETRIE.md). Der Referenz-Collector
(`tools/telemetry-server.js`) bietet Zeitfenster (`?days=`), CSV-Export, optionalen
`TELEMETRY_TOKEN`-Zugriffsschutz und Aufbewahrung (`TELEMETRY_RETENTION_DAYS`).

**17.6.3 API (Ergänzung zu §17.2, ohne Bearer-Token)**
- `POST /v1/events` `{ events: [ <envelope>, … ] }` → `{ ok:true }`. Auch via `sendBeacon`
  (Content-Type `application/json`). Server: **Größenlimit** (z. B. ≤ 64 KB/Batch), **Rate-Limiting**
  pro `clientId`/IP, CORS strikt auf die App-Origin, Schema-/Allowlist-Validierung **serverseitig
  spiegeln** (nie mehr Felder akzeptieren als der Client sendet).
- **Datenspeicher:** append-only in der Supabase-Tabelle `event` (RLS an, nur `service_role`
  schreibt/liest); Aufbewahrung befristet auf `EVENT_RETENTION_DAYS` (Default 90, Vercel-Cron
  `api/cron/purge-events.js`), danach nur die bereits gezogenen Aggregate.
- **Auswertung:** `GET /v1/admin/stats` (`.csv` / `kpis.csv`) — `api/_v1/admin/stats.js` holt die
  Rohdaten paginiert aus Supabase, mappt sie über `tools/telemetry-map.js` zurück aufs
  Client-Envelope und füttert damit dieselbe `aggregate()`-Funktion, die auch der Self-Host-Collector
  nutzt (`tools/telemetry-server.js`). Fail-closed ohne die Vercel-Env-Var `ADMIN_TELEMETRY_TOKEN`;
  Zugriff per `Authorization: Bearer <token>` oder `?token=…`, IP-rate-limitiert. Details:
  [docs/TELEMETRIE.md §7](docs/TELEMETRIE.md#7-dashboard--wie-viele-nutzen-es-und-wie-lange).

**17.6.4 Datenschutz (Ergänzung zu §17.3)**
- Einwilligung deckt Snapshot **und** Events (ein Schalter); Widerruf stoppt sofort und verwirft die
  lokale `clientId` + Queue. **Löschung per `clientId`** muss serverseitig möglich sein (DSGVO Art. 17).
- IP nicht persistieren (nur transient fürs Rate-Limit); **kein** Werbe-Tracking, **keine** Dritt-Tracker.
- **Sampling** optional (`SC.config.analytics.sampleRate`, 0…1) zur Datenminimierung bei Reichweite —
  clientseitig verdrahtet, **deterministisch pro Gerät** (FNV-1a über die pseudonyme `clientId`),
  damit Funnels/Sessions nicht zerreißen; gilt für Event-Strom und Snapshot.

**17.6.5 Akzeptanzkriterien (DoD)**
- Ohne Endpunkt **oder** ohne Consent: **0** `request`/`sendBeacon` und **0** gepufferte Events (Test).
- Mit beidem: `track` puffert sanitisierte Envelopes; `flush` sendet **einen** Batch an `/v1/events`;
  Allowlist-Assertion belegt, dass Freitext/PII/Karten-IDs **nicht** durchkommen; Queue-Ring deckelt
  auf 200, Batch ≤ 50; `sessionId` rotiert nach Inaktivität, `clientId` bleibt bis Reset.

---

> **Fazit:** Das Backend ist als **opt-in-Spiegelschicht** entworfen, die HolaRutas Offline-/Privacy-/
> Zero-Dep-DNA der PWA bewahrt und exakt auf den **bestehenden** Export/Import/Tarea-Seams aufsetzt.
> Reihenfolge: erst die **reine `merge()`-Funktion + Tests** (passt zur Architektur), dann Phase 1 (Cloud-Backup),
> alles Weitere kundengetrieben. Umsetzung beginnt mit dem ersten zahlenden Referenzkunden — nicht früher.
