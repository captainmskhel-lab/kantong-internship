-- ============================================================================
-- 0002 — harden setup & secure sensitive tables
-- Idempotent. Safe to run repeatedly.
--   * de-duplicate the singleton tables (app_settings, viewer_access) left over
--     from any previous failed/partial setup attempt
--   * enforce a single row on those tables going forward
--   * enable Row Level Security on every table so Supabase's auto-exposed REST
--     API (anon / authenticated roles) cannot read sensitive data such as
--     password_hash / pin_hash. The app connects as the table owner via
--     DATABASE_URL (server-only) and bypasses RLS, so it keeps full access.
-- This migration never touches financial data (transactions, allocations, etc.).
-- ============================================================================

-- --- 1. Clean duplicate singleton rows from failed setups -------------------
-- Keep the earliest app_settings row; drop any extras.
delete from app_settings
where id not in (select id from app_settings order by created_at asc, id asc limit 1);

-- Keep the most recently updated viewer_access row (latest PIN); drop extras.
delete from viewer_access
where id not in (select id from viewer_access order by updated_at desc, id desc limit 1);

-- --- 2. Enforce singletons going forward ------------------------------------
create unique index if not exists app_settings_singleton on app_settings ((true));
create unique index if not exists viewer_access_singleton on viewer_access ((true));

-- --- 3. Enable RLS everywhere (default-deny for non-owner roles) -------------
-- No policies are created on purpose: with RLS enabled and no policy, the anon
-- and authenticated PostgREST roles get zero rows, while the owning role used
-- by the server keeps full access. This closes the door on the public anon key
-- ever reading admin_users.password_hash or viewer_access.pin_hash.
do $$
declare t text;
begin
  foreach t in array array[
    'admin_users','viewer_access','members','app_settings','categories',
    'dues_periods','transactions','payment_allocations','cash_deposits',
    'reconciliations','transaction_audit_logs','reports','login_attempts'
  ]
  loop
    -- ENABLE (not FORCE): the owning role used by the server bypasses RLS and
    -- keeps full access; anon / authenticated PostgREST roles are denied.
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
