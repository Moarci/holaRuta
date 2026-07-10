-- HolaRuta Backend – Server-Funktionen.
--
-- Warum hier nur Rate-Limit + Sync-rev-CAS und NICHT der ganze Merge:
-- Shred/Rebuild leben als reines, unit-getestetes JS (api/_shred.js). Die
-- Merge-Ops sind Union/Max/Overwrite (idempotent + kommutativ), daher ist eine
-- nicht-atomare Upsert-Folge verlustfrei. Die einzige nicht-idempotente Stelle –
-- das rev-Hochzählen – wird hier als atomarer Compare-and-Swap gekapselt:
-- gewinnt genau ein Writer, der andere bekommt 409 und merged neu.

-- Atomarer Rate-Limit-Treffer: zählt count im Fenster hoch, gibt true zurück,
-- solange count <= p_limit (also erlaubt), sonst false.
create or replace function rl_hit(p_bucket text, p_window bigint, p_limit integer)
returns boolean
language plpgsql
as $$
declare
  c integer;
begin
  insert into rate_limit(bucket, window_start, count)
  values (p_bucket, p_window, 1)
  on conflict (bucket, window_start)
  do update set count = rate_limit.count + 1
  returning count into c;
  return c <= p_limit;
end;
$$;

-- Atomarer Sync-rev-CAS. Legt die sync_meta-Zeile bei Bedarf an (rev 0).
-- Erfolg: rev wird auf p_base_rev+1 gesetzt, neuer rev zurückgegeben.
-- Konflikt (aktueller rev != p_base_rev): NULL -> Aufrufer antwortet 409.
create or replace function sync_bump(p_user uuid, p_base_rev integer)
returns integer
language plpgsql
as $$
declare
  new_rev integer;
begin
  insert into sync_meta(user_id, rev) values (p_user, 0)
  on conflict (user_id) do nothing;

  update sync_meta
     set rev = rev + 1, updated_at = now()
   where user_id = p_user and rev = p_base_rev
  returning rev into new_rev;

  return new_rev; -- NULL bei Konflikt
end;
$$;

-- Aktuellen rev lesen (für GET /v1/sync und die 409-Antwort).
create or replace function sync_rev(p_user uuid)
returns integer
language sql
stable
as $$
  select coalesce((select rev from sync_meta where user_id = p_user), 0);
$$;

-- Defense-in-Depth: diese Funktionen sind SECURITY INVOKER (bewusst – sie sollen
-- NIE RLS umgehen) und dürfen nur von der Service-Role der Functions aufgerufen
-- werden. Ausführung für anon/authenticated/public explizit entziehen, damit sie
-- nicht über PostgREST /rpc/* erreichbar sind. WICHTIG: niemals security definer!
revoke execute on function rl_hit(text, bigint, integer)  from public, anon, authenticated;
revoke execute on function sync_bump(uuid, integer)       from public, anon, authenticated;
revoke execute on function sync_rev(uuid)                 from public, anon, authenticated;
grant  execute on function rl_hit(text, bigint, integer)  to service_role;
grant  execute on function sync_bump(uuid, integer)       to service_role;
grant  execute on function sync_rev(uuid)                 to service_role;
