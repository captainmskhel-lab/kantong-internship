-- ============================================================================
-- Kantong Internship — seed data (spec §5, §21, §22)
-- Inserts the 16 members, default categories, and the settings singleton.
-- Treasurer credentials + member PIN are created in the first-time setup wizard.
-- Idempotent.
-- ============================================================================

-- --- The 16 members, in order (spec §5) ---
insert into members (order_number, full_name) values
  (1,  'dr. Orion'),
  (2,  'dr. Dicky'),
  (3,  'dr. Agam'),
  (4,  'dr. Martinus'),
  (5,  'dr. Miskhel'),
  (6,  'dr. Greace'),
  (7,  'dr. Salsabila'),
  (8,  'dr. Fiena'),
  (9,  'dr. Budi Safitri'),
  (10, 'dr. Amelya'),
  (11, 'dr. Pratiwi'),
  (12, 'dr. Riris'),
  (13, 'dr. Firda'),
  (14, 'dr. Rani'),
  (15, 'dr. Rizy'),
  (16, 'dr. Sitti')
on conflict (order_number) do nothing;

-- --- Default income categories (spec §21) ---
insert into categories (type, name) values
  ('income', 'Iuran anggota'),
  ('income', 'Iuran kegiatan'),
  ('income', 'Donasi'),
  ('income', 'Pengembalian dana'),
  ('income', 'Pemasukan lainnya')
on conflict (type, name) do nothing;

-- --- Default expense categories (spec §22) ---
insert into categories (type, name) values
  ('expense', 'Konsumsi'),
  ('expense', 'Transportasi'),
  ('expense', 'Administrasi'),
  ('expense', 'Perlengkapan'),
  ('expense', 'Kegiatan'),
  ('expense', 'Sosial'),
  ('expense', 'Lainnya')
on conflict (type, name) do nothing;

-- --- Settings singleton (created only if missing) ---
insert into app_settings (organization_name, organization_subtitle, monthly_dues_amount, due_day, setup_completed)
select 'Kantong Internship',
       'RSUD Kabanjahe • Puskesmas Tigapanah • Puskesmas Merek',
       100000, 10, false
where not exists (select 1 from app_settings);
