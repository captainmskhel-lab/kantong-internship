# Kantong Internship

> **RSUD Kabanjahe • Puskesmas Tigapanah • Puskesmas Merek**
> Catat, pantau, dan laporkan kas internship dengan lebih rapi.

A private, internal cash-management web app for 16 medical internship doctors. One
treasurer (dr. Miskhel) records payments and expenses; members get a read-only
view through a shared 6-digit PIN. Premium minimalist white-and-red design,
mobile-first, fully in friendly Indonesian.

The codebase, database fields, and this README are in English; the entire
user-facing interface is in Indonesian.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Local installation](#local-installation)
5. [Supabase setup](#supabase-setup)
6. [Environment variables](#environment-variables)
7. [Migrations & seed data](#migrations--seed-data)
8. [First-time setup wizard](#first-time-setup-wizard)
9. [Logging in](#logging-in)
10. [Security: changing credentials & recovery](#security)
11. [Google Drive proof links](#google-drive-proof-links)
12. [Reports, Excel & backup](#reports-excel--backup)
13. [Money model & financial rules](#money-model--financial-rules)
14. [Design tokens & fonts](#design-tokens--fonts)
15. [Animation architecture](#animation-architecture)
16. [Scripts](#scripts)
17. [Testing](#testing)
18. [Deploying to Vercel](#deploying-to-vercel)

---

## Features

- **Two access modes** — treasurer (username + password) and member (shared 6-digit PIN, read-only).
- **Fast payment entry** — record a member's dues in under a minute, with multi-month support.
- **Automatic balances** — total cash, bank balance, undeposited cash, all computed from one central, tested engine.
- **Monthly dues matrix** — Lunas / Sebagian / Belum bayar per member per month, with a detail drawer.
- **Cash handling** — track undeposited cash and mark it deposited without creating phantom income.
- **Other income & expenses** — categories, recipients, negative-balance warning.
- **Google Drive proof links** — paste a share link; the app builds an embeddable preview.
- **Visibility controls** — choose per-transaction whether members can see it and its proof; internal notes never leak.
- **Transaction history** — search and filter by type, method, proof, month; cancel (never hard-delete) with audit log.
- **Reconciliation** — compare system balance with the real bank balance.
- **Reports** — branded monthly (5-page) & weekly PDF, 7-sheet Excel workbook, JSON backup.
- **PWA** — installable to a phone home screen.
- **Polished motion** — staggered cards, count-up totals, animated nav, respecting `prefers-reduced-motion`.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL (via `postgres` / postgres.js) |
| Auth | Custom server-side credentials, `jose`-signed HTTP-only cookies |
| Hashing | bcrypt (`bcryptjs`) for password & PIN |
| Forms / validation | React Hook Form patterns + Zod |
| Dates | date-fns with Indonesian locale, Asia/Jakarta |
| Animation | Framer Motion |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Excel | SheetJS (`xlsx`) |
| Icons | lucide-react |
| Fonts | Sora + Plus Jakarta Sans via `next/font` |

---

## Project structure

```
db/
  migrations/0001_init.sql   # all tables (idempotent)
  seed.sql                   # 16 members, categories, settings singleton
scripts/
  migrate.ts                 # npm run db:migrate
  seed.ts                    # npm run db:seed
  admin-reset.ts             # npm run admin:reset (credential recovery)
src/lib/
  money.ts                   # integer-rupiah arithmetic & formatting
  finance.ts                 # THE central calculation engine (pure, tested)
  finance.test.ts            # rules from spec §18/§28/§29/§30/§36
  dates.ts                   # Asia/Jakarta + Indonesian formatting
  drive.ts                   # Google Drive link → preview
  db.ts                      # lazy postgres client (server-only)
  repo.ts                    # all SQL queries
  service.ts                 # admin + viewer read models (redaction lives here)
  auth-repo.ts / hash.ts     # credentials, setup, password/PIN hashing
  session.ts                 # signed cookie sessions
  rate-limit.ts              # login throttling
  api.ts / guard.ts          # route + page authorization guards
  validation.ts              # Zod schemas
  pdf.ts / excel.ts          # client-side report generators
src/app/
  page.tsx                   # landing (redirects to /setup on first run)
  masuk-bendahara/           # treasurer login
  masuk-anggota/             # member PIN login
  setup/                     # first-time wizard
  admin/                     # treasurer workspace (dashboard, pembayaran, …)
  lihat/                     # member read-only views
  api/                       # all server endpoints
src/components/              # design system + feature UI
```

---

## Local installation

Requires **Node 18.18+** (Node 20+ recommended).

```bash
git clone <your-repo-url> kantong-internship
cd kantong-internship
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. On first run you'll be redirected to the setup wizard.

---

## Supabase setup

1. Create a free project at <https://supabase.com>.
2. **Project Settings → Database → Connection string → URI**: copy it into `DATABASE_URL`.
   For Vercel/serverless, prefer the **Connection pooler** URI (port 6543).
3. **Project Settings → API**: copy the project URL and `anon` key, and the
   `service_role` key (server-only).
4. Run the migrations and seed (below). No Supabase Storage is needed — proofs
   live in Google Drive in version 1.

> The app talks to Postgres directly via `postgres.js`. The Supabase anon /
> service-role keys are included for completeness and future use; the
> service-role key must never be exposed to the browser.

---

## Environment variables

Copy `.env.example` → `.env.local` and fill in:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Supabase URI / pooler) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (browser-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — **server only** |
| `AUTH_SECRET` | Signs treasurer session cookies (≥ 32 random chars) |
| `VIEWER_SESSION_SECRET` | Signs member viewer cookies (≥ 32 random chars) |
| `ADMIN_RESET_SECRET` | Gate for the `admin:reset` recovery script |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## Migrations & seed data

```bash
npm run db:migrate   # applies db/migrations/*.sql in order (idempotent)
npm run db:seed      # inserts the 16 members + default categories + settings row
```

The 16 members are seeded in order, from dr. Orion (#1) to dr. Sitti (#16).
Treasurer credentials and the member PIN are **not** seeded — they are created in
the setup wizard.

---

## First-time setup wizard

Visiting the app before setup redirects to `/setup`, a 9-step animated wizard:

1. Confirm the application name
2. Confirm the 16 members
3. Set monthly dues amount + due date
4. Set the starting dues month
5. Enter opening balance (not counted as income)
6. Set treasurer username (prefilled `bendahara`)
7. Create the treasurer password
8. Create the 6-digit member PIN
9. Finish — you're logged in as treasurer

After completion the `/setup` route is disabled.

---

## Logging in

- **Treasurer:** `/masuk-bendahara` → username + password. Optional "Ingat
  perangkat ini" extends the session to ~30 days; otherwise ~12 hours.
- **Member:** `/masuk-anggota` → the shared 6-digit PIN (share it privately in
  the WhatsApp group). Viewer sessions last ~7 days and are strictly read-only.

Failed logins are rate-limited per IP (6 failures / 15 min). Members can never
reach admin mutation endpoints — authorization is enforced server-side on every
request.

---

## Security

Everything lives under **Pengaturan → Keamanan** in the treasurer app:

- **Ganti username** — current password + new username
- **Ganti password** — current password + new password (min 8, letters + digits)
- **Ganti PIN anggota** — treasurer password + new 6-digit PIN

Passwords and PINs are bcrypt-hashed; plaintext is never stored, and hashes are
never sent to the browser.

### Credential recovery

There is **no public forgot-password route**. If credentials are lost, run the
CLI recovery script on a trusted machine that has `.env.local`:

```bash
npm run admin:reset
```

It requires `ADMIN_RESET_SECRET`, then securely resets the treasurer username,
password, and the member PIN (input is hidden while typing).

---

## Google Drive proof links

Members send payment proofs over WhatsApp. The treasurer uploads them to Google
Drive and pastes the share link into the payment/expense form.

- Set the Drive file's sharing to **"Siapa saja yang memiliki link dapat
  melihat"** (anyone with the link can view).
- The app converts `/file/d/FILE_ID/view` links into `/preview` for inline
  display inside an animated accordion ("Lihat bukti pembayaran").
- If preview fails, members get a "Buka bukti di Google Drive" button.
- Proof URLs are only exposed to members when **"Izinkan anggota melihat bukti"**
  is on for that transaction.

Only the proof URL/title and visibility flags are stored — no images are hosted.

---

## Reports, Excel & backup

Under **Laporan** (treasurer) and **Laporan** (member, redacted):

- **Monthly PDF** — 5 pages: summary, income, expenses, dues status (all 16
  members), notes & clickable proof references. Branded white/red, print-friendly.
- **Weekly PDF** — period summary + transaction list + optional treasurer note.
- **Excel (.xlsx)** — 7 sheets: Ringkasan, Anggota, Status Iuran, Pemasukan,
  Pengeluaran, Semua Transaksi, Rekonsiliasi (Indonesian column names).
- **JSON backup** (treasurer only, `GET /api/backup`) — settings, members, dues
  periods, transactions, allocations, categories, reconciliations, deposits and
  report metadata. **Never** includes password/PIN hashes, session tokens, or secrets.

Member reports are generated from a server-redacted dataset, so hidden
transactions, internal notes and unshared proofs are stripped before reaching them.

---

## Money model & financial rules

All money is stored and computed as **integer rupiah** — never floating point.
The single source of truth is `src/lib/finance.ts`:

```
totalCash       = openingBalance + activeIncome - activeExpense
undepositedCash = (active undeposited cash income) - (active cash expenses)
bankBalance     = totalCash - undepositedCash
```

Enforced & unit-tested rules (spec §36):

1. Cancelled transactions never affect balances.
2. Cancelled dues payments never count toward dues status.
3. Opening balance is not current-month income.
4. Undeposited cash raises total funds but not the bank balance.
5. Marking cash deposited moves it to the bank without creating income.
6. Cash expenses reduce physical cash.
7. Dues status comes only from valid (active) allocations.
8. Members can never modify data.
9–11. Hidden transactions, hidden proofs and internal notes never reach members.
12. Money is integer rupiah.
13. Dates use Asia/Jakarta.
14. Mutations require server-side authorization.

---

## Design tokens & fonts

White-dominant with an elegant red accent. Tokens live in
`tailwind.config.ts` and mirror as CSS variables in `src/app/globals.css`:

| Token | Value |
| --- | --- |
| Primary red | `#DC2626` |
| Deep red | `#991B1B` |
| Soft / very light red | `#FEE2E2` / `#FEF2F2` |
| Dark text | `#18181B` |
| Muted text | `#71717A` |
| Border | `#E4E4E7` |
| Background | `#FAFAFA` |
| Brand gradient | `linear-gradient(135deg, #B91C1C, #EF4444)` |

Typography (via `next/font`): **Sora** for headings & financial totals,
**Plus Jakarta Sans** for body, forms and navigation. Financial numbers use
tabular figures (`.tnum`).

---

## Animation architecture

Framer Motion, GPU-friendly (`transform` + `opacity` only):

- `components/ui/motion.tsx` — `FadeUp`, `Stagger`, `StaggerItem`, `PageTransition`.
- `components/ui/count-up.tsx` — animated rupiah/number counters.
- Nav uses shared `layoutId` pills for a moving active indicator.
- `Sheet` is a bottom-sheet on mobile and a centered modal on desktop.
- Skeletons + a branded loader bar instead of plain spinners.
- All large motion is disabled under `prefers-reduced-motion` (CSS + Framer).

---

## Scripts

```bash
npm run dev          # start dev server
npm run build        # production build
npm run start        # run the production build
npm run lint         # ESLint (next lint)
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (financial core + visibility + drive)
npm run db:migrate   # apply SQL migrations
npm run db:seed      # seed members, categories, settings
npm run admin:reset  # recover treasurer credentials & member PIN
```

---

## Testing

`npm run test` covers the central financial logic and security-critical
redaction: unpaid/partial/full/multiple/multi-month payments, cancelled
payments, undeposited & deposited cash, cash & transfer expenses, opening
balance, reconciliation, report totals, transaction codes, viewer transaction &
proof visibility, and rupiah parsing/formatting.

Before shipping, run the full gate:

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

---

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add all environment variables from `.env.example` in **Project Settings →
   Environment Variables** (use the Supabase **pooler** `DATABASE_URL`).
3. Run `npm run db:migrate` and `npm run db:seed` against your Supabase database
   once (locally with production `DATABASE_URL`, or via the Supabase SQL editor
   using `db/migrations/0001_init.sql` and `db/seed.sql`).
4. Deploy. Visit the site and complete the setup wizard.

Secure cookies are enabled automatically in production. Keep
`SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, `VIEWER_SESSION_SECRET` and
`ADMIN_RESET_SECRET` server-side only.

---

_Dokumen internal Kantong Internship._
