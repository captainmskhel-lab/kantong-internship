-- ============================================================================
-- Kantong Internship — initial schema (spec §32)
-- PostgreSQL / Supabase. Money is stored as BIGINT whole rupiah (no decimals).
-- Idempotent: safe to run multiple times.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Treasurer accounts
-- ---------------------------------------------------------------------------
create table if not exists admin_users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  password_hash text not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Shared member viewer PIN (single row)
-- ---------------------------------------------------------------------------
create table if not exists viewer_access (
  id         uuid primary key default gen_random_uuid(),
  pin_hash   text not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Members (the 16 internship doctors)
-- ---------------------------------------------------------------------------
create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  order_number  integer not null unique,
  full_name     text not null,
  active        boolean not null default true,
  internal_note text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Application settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists app_settings (
  id                    uuid primary key default gen_random_uuid(),
  organization_name     text not null default 'Kantong Internship',
  organization_subtitle text not null default 'RSUD Kabanjahe • Puskesmas Tigapanah • Puskesmas Merek',
  monthly_dues_amount   bigint not null default 100000,
  due_day               integer not null default 10 check (due_day between 1 and 28),
  internship_start_date date,
  internship_end_date   date,
  opening_balance       bigint not null default 0,
  opening_balance_date  date,
  setup_completed       boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Income / expense categories
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('income','expense')),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (type, name)
);

-- ---------------------------------------------------------------------------
-- Dues periods (one row per month the group collects dues)
-- ---------------------------------------------------------------------------
create table if not exists dues_periods (
  id                uuid primary key default gen_random_uuid(),
  year              integer not null,
  month             integer not null check (month between 1 and 12),
  amount_per_member bigint not null,
  due_date          date,
  created_at        timestamptz not null default now(),
  unique (year, month)
);

-- ---------------------------------------------------------------------------
-- Transactions (dues payments, other income, expenses)
-- ---------------------------------------------------------------------------
create table if not exists transactions (
  id                       uuid primary key default gen_random_uuid(),
  transaction_code         text not null unique,
  transaction_type         text not null check (transaction_type in ('dues','income','expense')),
  member_id                uuid references members(id) on delete set null,
  category_id              uuid references categories(id) on delete set null,
  title                    text not null,
  amount                   bigint not null check (amount >= 0),
  transaction_date         date not null,
  payment_method           text not null check (payment_method in ('transfer','cash')),
  cash_deposit_status      text not null default 'not_applicable'
                             check (cash_deposit_status in ('not_applicable','undeposited','deposited')),
  recipient_or_source      text,
  description              text,
  internal_note            text,
  proof_url                text,
  proof_title              text,
  visible_to_viewers       boolean not null default true,
  proof_visible_to_viewers boolean not null default true,
  status                   text not null default 'active' check (status in ('active','cancelled')),
  cancellation_reason      text,
  created_by               text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_transactions_date on transactions (transaction_date);
create index if not exists idx_transactions_type on transactions (transaction_type);
create index if not exists idx_transactions_status on transactions (status);
create index if not exists idx_transactions_member on transactions (member_id);

-- ---------------------------------------------------------------------------
-- Payment allocations (split a dues payment across member/period)
-- ---------------------------------------------------------------------------
create table if not exists payment_allocations (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid not null references transactions(id) on delete cascade,
  member_id       uuid not null references members(id) on delete cascade,
  dues_period_id  uuid not null references dues_periods(id) on delete cascade,
  allocated_amount bigint not null check (allocated_amount >= 0),
  created_at      timestamptz not null default now()
);

create index if not exists idx_alloc_member_period on payment_allocations (member_id, dues_period_id);
create index if not exists idx_alloc_transaction on payment_allocations (transaction_id);

-- ---------------------------------------------------------------------------
-- Cash deposits (audit trail of "marked deposited" events)
-- ---------------------------------------------------------------------------
create table if not exists cash_deposits (
  id           uuid primary key default gen_random_uuid(),
  amount       bigint not null check (amount >= 0),
  deposit_date date not null,
  note         text,
  created_by   text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reconciliations
-- ---------------------------------------------------------------------------
create table if not exists reconciliations (
  id                    uuid primary key default gen_random_uuid(),
  reconciliation_date   date not null,
  expected_bank_balance bigint not null,
  actual_bank_balance   bigint not null,
  undeposited_cash      bigint not null,
  difference            bigint not null,
  note                  text,
  created_by            text,
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Transaction audit log (simple history)
-- ---------------------------------------------------------------------------
create table if not exists transaction_audit_logs (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete set null,
  action         text not null,
  previous_data  jsonb,
  new_data       jsonb,
  reason         text,
  performed_by   text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_audit_transaction on transaction_audit_logs (transaction_id);

-- ---------------------------------------------------------------------------
-- Saved reports metadata
-- ---------------------------------------------------------------------------
create table if not exists reports (
  id           uuid primary key default gen_random_uuid(),
  report_type  text not null check (report_type in ('weekly','monthly')),
  period_start date not null,
  period_end   date not null,
  version      integer not null default 1,
  generated_at timestamptz not null default now(),
  generated_by text,
  report_data  jsonb
);

-- ---------------------------------------------------------------------------
-- Login attempt log (rate limiting, spec §4)
-- ---------------------------------------------------------------------------
create table if not exists login_attempts (
  id          uuid primary key default gen_random_uuid(),
  identifier  text not null,          -- ip or ip+scope
  scope       text not null,          -- 'admin' | 'viewer'
  successful  boolean not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_login_attempts_lookup on login_attempts (identifier, scope, created_at);
