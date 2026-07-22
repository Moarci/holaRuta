-- Telemetrie-Nachschärfung (docs/TELEMETRIE.md §2): der Client sendet
-- mastered/tripGoal/tripDaily im Tages-Snapshot (analytics.js:buildUsageSnapshot),
-- api/_v1/usage.js hat sie bislang aber NICHT persistiert -> Mastery-/Reiseziel-
-- Panels im Investor-Cockpit blieben leer. Additiv, nicht-destruktiv.
alter table usage_snapshot
  add column if not exists mastered_bucket text,
  add column if not exists trip_goal boolean,
  add column if not exists trip_daily_bucket text;
