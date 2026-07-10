# HolaRuta — Launch-Checkliste (Vercel + Supabase Cloud-Backend)

> Die PWA läuft **ohne** Backend voll offline. Diese Schritte schalten die opt-in-Cloud
> (Sync, Social, Telemetrie, B2B) für den Launch scharf. Details/Begründungen: `BACKEND.md`
> und der Konzept-Plan. Reihenfolge einhalten.

## 1. Supabase-Projekt (EU)

- [ ] Projekt in **EU-Region** (z. B. Frankfurt) anlegen.
- [ ] Migrationen einspielen (Reihenfolge!):
  - `supabase/migrations/0001_schema.sql` — Tabellen, Indizes, Default-Deny-RLS, generierte KPI-Spalten
  - `supabase/migrations/0002_functions.sql` — `rl_hit`, `sync_bump`, `sync_rev` + RPC-`revoke`/`grant`
  - via `supabase db push` **oder** SQL-Editor.
- [ ] Verifizieren: `select rolbypassrls from pg_roles where rolname='service_role';` → `t`
      (die Functions verlassen sich auf den Service-Role-RLS-Bypass).

## 2. Passwortloser Login (OTP-Code, NICHT Magic-Link)

Der Client hat **kein** Magic-Link-Redirect-Handling — er erwartet einen **6-stelligen Code**,
den der Nutzer eintippt (`app.js` → `sync.confirm(email, code)` → `verifyOtp(type:"email")`).

- [ ] Auth → Providers → **Email** aktivieren, „Confirm email"/OTP an.
- [ ] E-Mail-Vorlage „Magic Link" so anpassen, dass sie den **Code** enthält: `{{ .Token }}`
      (statt nur `{{ .ConfirmationURL }}`). Ohne das bekommt der Nutzer keinen Code zum Eintippen.
- [ ] SMTP/Resend als Absender hinterlegen (sonst gilt das Supabase-Test-Sendelimit).
- [ ] `shouldCreateUser` ist an (Default) — neue Nutzer werden beim ersten OTP angelegt.

## 3. Vercel-Deployment

- [ ] `npm install` (zieht die neue Server-Dependency `@supabase/supabase-js`).
- [ ] Env-Vars setzen (siehe `.env.example`):
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `CRON_SECRET` (langer Zufallsstring — der Retention-Cron ist **fail-closed**, ohne Secret gesperrt)
  - optional `EVENT_RETENTION_DAYS` (Default 90)
- [ ] Build-Settings (bereits in `vercel.json`): Build `node build.js --dist --edition=launch`,
      Output `dist/`, Functions unter `api/`, Rewrite `/v1/* → /api/v1/*`, Cron `/api/cron/purge-events` (täglich).
- [ ] Deploy. Die Launch-Edition setzt `apiBase = location.origin` → same-origin,
      CSP `connect-src 'self'` bleibt gültig, kein CORS nötig.

## 4. Domain-Umzug (SEO/GEO)

- [ ] Hartkodierte `moarci.github.io/holaRuta` → neue Vercel-Domain ersetzen in:
  - `index.html` (canonical, OG, JSON-LD), `editions/*.js` (`appUrl`), `scripts/geo/*` (sitemap/robots/llms.txt).
- [ ] GitHub-Pages-Deploy-Job in `.github/workflows/pages.yml` entfernen (Vercel übernimmt).

## 5. Verifikation (Definition of Done)

- [ ] **Ohne Login: 0 Netzwerk-Calls** (DevTools Network) — App bleibt offline-first.
- [ ] Login: E-Mail → Code aus der Mail → eingeloggt. Auf **zweitem Gerät** wiederherstellen →
      Fortschritt konvergiert verlustfrei.
- [ ] `GET /v1/account/export` liefert vollständigen Download; `DELETE /v1/account` entfernt alle Zeilen
      (per SQL prüfen) + `auth.users`.
- [ ] Telemetrie: erst mit **Consent** im Profil wird gesendet; genau ein `POST /v1/usage` pro Tag.
- [ ] Power-User-Payload (viele Karten + placementHistory) synct fehlerfrei (2-MB-Limit greift, nicht 256 KB).
- [ ] Service-Worker cached **keine** `/v1/`-Antwort.
- [ ] `npm test` grün.

## 6. Bekannte Grenzen (bewusst Post-Launch)

- **Löschungen propagieren nicht:** ein lokal gelöschter Favorit/Task/User-Karte kann auf einem
  zweiten Gerät wieder auftauchen. Das entspricht der bestehenden **Union-Merge-Semantik**
  (`sync.js`/BACKEND.md §8). Echte Löschsynchronisation braucht Tombstones (`deleted_at` + Client-Änderung).
- **Freundes-Code = unsignierte User-ID:** wer die ID kennt (z. B. aus Roster/Leaderboard), kann ohne
  Zustimmung eine Freundschaft anlegen. Impact: nur Anzeigename + Tages-Zahlen. HMAC-Codes = Post-Launch
  (bräuchte `social.js`-Änderung).
- **`card_progress.history` wächst append-only:** bei extrem intensiver Nutzung über Jahre theoretisch
  Richtung 2-MB-Limit. Monitoring; ggf. Client-seitiges History-Trimming nachrüsten.
- **B2B (Klassen/Lizenzen):** Endpunkte existieren und sind rollen-gescoped, aber noch **nicht** ans
  Frontend angebunden — reine Server-Vorarbeit, erst mit einem Schul-/Referenzkunden aktivieren.
- **Login-UX:** aktuell `window.prompt` für E-Mail + Code (MVP, konsistent mit Bestandscode).
  Ein dediziertes Login-Formular ist ein sinnvoller Folge-Schliff.
