-- HolaRuta Backend – Schema (Supabase / Postgres, EU).
-- Siehe Plan: „Nutzerdaten normalisiert, Offline-first bleibt, Server = Spiegel".
--
-- Zugriffskontrolle: Die Vercel-Functions greifen mit der SERVICE-ROLE zu
-- (bypasst RLS) und scopen jede Query selbst über die aus dem Session-Token
-- aufgelöste user_id. RLS wird trotzdem überall als DEFAULT-DENY-Härtung
-- aktiviert (kein Zugriff für die Rollen anon/authenticated): ein geleakter
-- Anon-Key kann keine Tabelle lesen. Keine Policies = niemand außer service_role.
--
-- Losslessness-Hinweis game_stats/user_settings: als JSONB gespeichert, damit
-- künftige Zähler/Felder (mergeGamestats behandelt Keys generisch) NIE verloren
-- gehen. Für Abfragen/Investor-KPIs werden die stabilen Kennzahlen als GENERATED
-- COLUMNS aus dem JSONB projiziert (SQL-abfragbar UND verlustfrei).

create extension if not exists "pgcrypto";

-- ---------- Identität & Sync-Meta ----------

create table if not exists profile (
  id           uuid primary key,               -- = auth.users.id
  email        text,
  locale       text,
  display_name text,
  created_at   timestamptz not null default now()
);

create table if not exists device (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profile(id) on delete cascade,
  label        text,
  last_seen_at timestamptz,
  revoked_at   timestamptz
);

-- Server-geminteter Opaque-Bearer-Token (löst net.js-„kein Refresh").
create table if not exists session (
  token        text primary key,
  user_id      uuid not null references profile(id) on delete cascade,
  device_id    uuid references device(id) on delete set null,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at   timestamptz
);
create index if not exists session_user_idx on session(user_id);

-- Optimistische Concurrency für Sync (1 Zeile/User).
create table if not exists sync_meta (
  user_id    uuid primary key references profile(id) on delete cascade,
  rev        integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Geteilter Zustand fürs Rate-Limiting (Vercel-Functions sind zustandslos).
create table if not exists rate_limit (
  bucket       text    not null,
  window_start bigint  not null,   -- epoch-Sekunden des Fensterbeginns
  count        integer not null default 0,
  primary key (bucket, window_start)
);

-- ---------- Fortschritt & Stats (normalisiert) ----------

-- SM-2-Zustand pro Karte. Feldschnitt = store.js sanitizeRecord (kein reviewed_at:
-- Merge-Tiebreak ist reps, dann due – exakt wie sync.js progressScore).
create table if not exists card_progress (
  user_id       uuid not null references profile(id) on delete cascade,
  card_id       text not null,
  ease          real    not null default 2.5,
  interval_days integer not null default 0,
  due           bigint  not null default 0,   -- epoch ms
  reps          integer not null default 0,
  seen          integer not null default 0,
  history       jsonb   not null default '[]'::jsonb,  -- ['a'|'g'|'e', …]
  updated_at    timestamptz not null default now(),
  primary key (user_id, card_id)
);
create index if not exists card_progress_due_idx on card_progress(user_id, due);

-- Eigene Karten (usercards). Union nach id.
create table if not exists user_card (
  user_id    uuid not null references profile(id) on delete cascade,
  id         text not null,
  cat        text,
  lvl        integer,
  de         text,
  es         text,
  tip        text,
  custom     boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Favoriten „Mi léxico". Union nach id.
create table if not exists favorite (
  user_id  uuid not null references profile(id) on delete cascade,
  id       text not null,
  de       text,
  es       text,
  tip      text,
  cat      text,
  added_at text,
  primary key (user_id, id)
);

-- Abonnierte Aufgaben. Union nach code.
create table if not exists task (
  user_id  uuid not null references profile(id) on delete cascade,
  code     text not null,
  kind     text,
  scope    text,
  title    text,
  due      text,
  added_at text,
  primary key (user_id, code)
);

-- game_stats: JSONB-Kern (verlustfrei) + generierte KPI-Spalten (abfragbar).
create table if not exists game_stats (
  user_id        uuid primary key references profile(id) on delete cascade,
  data           jsonb not null default '{}'::jsonb,
  -- CAST-SICHER: nur echte JSON-Zahlen casten (jsonb_typeof-Guard), sonst 0. Ohne
  -- den Guard würde ein Float ("12.5"), String oder Objekt in data->>'xp' beim
  -- ::int-Cast eine Exception werfen und den GESAMTEN game_stats-Upsert sprengen ->
  -- der Client pusht denselben Blob erneut -> Sync dauerhaft blockiert (Poison-Blob).
  -- numeric-Zwischenschritt rundet Floats sauber statt zu werfen.
  xp             integer generated always as (case when jsonb_typeof(data->'xp')='number' then (data->>'xp')::numeric::int else 0 end) stored,
  reviews        integer generated always as (case when jsonb_typeof(data->'reviews')='number' then (data->>'reviews')::numeric::int else 0 end) stored,
  daily_streak   integer generated always as (case when jsonb_typeof(data->'dailyStreak')='number' then (data->>'dailyStreak')::numeric::int else 0 end) stored,
  longest_streak integer generated always as (case when jsonb_typeof(data->'longestStreak')='number' then (data->>'longestStreak')::numeric::int else 0 end) stored,
  last_study_date text  generated always as (data->>'lastStudyDate') stored,
  updated_at     timestamptz not null default now()
);
create index if not exists game_stats_xp_idx on game_stats(xp);

-- Einstellungen: bewusst JSONB (lose getippt, gerätelokal / LWW).
create table if not exists user_settings (
  user_id    uuid primary key references profile(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- Social (BACKEND.md §16) ----------

create table if not exists friendship (
  user_id    uuid not null references profile(id) on delete cascade,
  friend_id  uuid not null references profile(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

-- Veröffentlichter Tages-Snapshot (flach, fürs Leaderboard ohne Blob-Entpacken).
create table if not exists daily_snapshot (
  user_id    uuid not null references profile(id) on delete cascade,
  day        text not null,   -- YYYY-MM-DD
  name       text,
  cards      integer not null default 0,
  streak     integer not null default 0,
  reviews    integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
create index if not exists daily_snapshot_day_idx on daily_snapshot(day);

-- ---------- Telemetrie (BACKEND.md §17) – auth-frei, keine PII ----------

create table if not exists usage_snapshot (
  id            bigserial primary key,
  day           text,
  app_version   text,
  locale        text,
  track         text,
  edition       text,
  platform      text,
  cards_bucket  text,
  streak_bucket text,
  reviews_bucket text,
  features      jsonb,
  received_at   timestamptz not null default now()
);
create index if not exists usage_snapshot_day_idx on usage_snapshot(day);

-- Append-only Event-Store (pseudonyme client_id, Retention ≤90 Tage).
create table if not exists event (
  id          bigserial primary key,
  v           integer,
  ts          bigint,
  day         text,
  client_id   text,
  session_id  text,
  seq         integer,
  app_version text,
  locale      text,
  track       text,
  edition     text,
  platform    text,
  event       text,
  props       jsonb,
  received_at timestamptz not null default now()
);
create index if not exists event_day_idx on event(day);
create index if not exists event_client_idx on event(client_id);

-- ---------- B2B: Klassen & Lizenzen (BACKEND.md §5/§9) ----------

create table if not exists org (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text,
  seats_total integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists membership (
  org_id  uuid not null references org(id) on delete cascade,
  user_id uuid not null references profile(id) on delete cascade,
  role    text not null check (role in ('owner','teacher','student')),
  primary key (org_id, user_id)
);

-- Klasse/Gruppe (Tabellenname bewusst school_class, um jede Kollision mit
-- Postgres-Katalogbegriffen zu vermeiden; API-Pfad bleibt /v1/classes).
create table if not exists school_class (
  id      uuid primary key default gen_random_uuid(),
  org_id  uuid not null references org(id) on delete cascade,
  name    text not null,
  code    text unique
);

create table if not exists enrollment (
  class_id uuid not null references school_class(id) on delete cascade,
  user_id  uuid not null references profile(id) on delete cascade,
  primary key (class_id, user_id)
);

create table if not exists assignment (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references school_class(id) on delete cascade,
  kind       text,
  scope      text,
  title      text,
  due        text,
  created_by uuid references profile(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists assignment_state (
  assignment_id uuid not null references assignment(id) on delete cascade,
  user_id       uuid not null references profile(id) on delete cascade,
  status        text,
  progress      integer not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (assignment_id, user_id)
);

create table if not exists license_seat (
  org_id      uuid not null references org(id) on delete cascade,
  user_id     uuid not null references profile(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- DSGVO-Nachvollziehbarkeit: nur Aktionen, KEINE Payloads/Inhalte.
create table if not exists audit_log (
  id     bigserial primary key,
  actor  text,
  action text,
  target text,
  at     timestamptz not null default now()
);

-- ---------- Reverse-Lookup-Indizes auf der 2. Spalte der Composite-PKs ----------
-- Ein Composite-PK (a,b) indexiert nur WHERE a=…; „meine Zeilen" (WHERE user_id=…)
-- liefe sonst als Seq Scan. Betrifft Auth-/Roster-/Lizenz-Checks auf jedem Request.
create index if not exists device_user_idx           on device(user_id);
create index if not exists membership_user_idx        on membership(user_id);
create index if not exists enrollment_user_idx        on enrollment(user_id);
create index if not exists assignment_class_idx       on assignment(class_id);
create index if not exists assignment_state_user_idx  on assignment_state(user_id);
create index if not exists license_seat_user_idx      on license_seat(user_id);
create index if not exists friendship_friend_idx      on friendship(friend_id);

-- ---------- Default-Deny-RLS auf allen Tabellen ----------
-- Enable RLS ohne Policies => nur die service_role (BYPASSRLS) kommt durch.
do $$
declare t text;
begin
  foreach t in array array[
    'profile','device','session','sync_meta','rate_limit',
    'card_progress','user_card','favorite','task','game_stats','user_settings',
    'friendship','daily_snapshot','usage_snapshot','event',
    'org','membership','school_class','enrollment','assignment','assignment_state',
    'license_seat','audit_log'
  ]
  loop
    -- Nur ENABLE (kein FORCE): service_role hat BYPASSRLS und kommt durch;
    -- alle anderen Rollen (anon/authenticated) sind mangels Policy gesperrt.
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;
