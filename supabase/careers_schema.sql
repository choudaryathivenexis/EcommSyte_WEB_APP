-- =============================================================================
-- ecommsyte — Careers roles CMS  (Supabase / Postgres)
-- Run this in the Supabase SQL editor. Idempotent (safe to re-run).
--
-- Security model: the browser uses the PUBLIC anon key; Row Level Security below
-- is the real boundary — the public can only read visible rows, and only
-- authenticated users can insert/update/delete. Never expose the service_role key.
-- =============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ── Table ───────────────────────────────────────────────────────────────────
create table if not exists public.job_roles (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  department      text        not null default '',
  employment_type text        not null default 'Full-time',
  location        text        not null default 'Remote',
  description     text        not null default '',
  apply_url       text        not null default 'contact.html#contact',
  visible         boolean     not null default true,
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists job_roles_visible_sort_idx
  on public.job_roles (visible, sort_order);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.job_roles enable row level security;

-- READ — the public (anon) sees only visible rows; authenticated admins see all.
drop policy if exists "public reads visible roles"    on public.job_roles;
create policy "public reads visible roles"
  on public.job_roles for select to anon
  using (visible = true);

drop policy if exists "authenticated reads all roles" on public.job_roles;
create policy "authenticated reads all roles"
  on public.job_roles for select to authenticated
  using (true);

-- WRITE — authenticated users only (insert / update / delete).
drop policy if exists "authenticated inserts roles" on public.job_roles;
create policy "authenticated inserts roles"
  on public.job_roles for insert to authenticated
  with check (true);

drop policy if exists "authenticated updates roles" on public.job_roles;
create policy "authenticated updates roles"
  on public.job_roles for update to authenticated
  using (true) with check (true);

drop policy if exists "authenticated deletes roles" on public.job_roles;
create policy "authenticated deletes roles"
  on public.job_roles for delete to authenticated
  using (true);

-- ── Seed (optional) — the 6 current roles, only if the table is empty ────────
insert into public.job_roles (title, department, employment_type, location, description, sort_order)
select * from (values
  ('Senior Amazon PPC Manager', 'Advertising', 'Full-time', 'Remote',
   'Own the advertising strategy for a portfolio of premium brands. Build clean campaign architectures, manage six-figure ad budgets, and drive profit-first growth across Sponsored Ads and DSP.', 0),
  ('Amazon Creative Designer (A+ & Storefronts)', 'Creative', 'Full-time', 'Remote',
   'Design premium listing images, infographics, A+ content, and storefronts that turn browsers into buyers. Strong visual hierarchy and conversion instincts required.', 1),
  ('Product Research & Sourcing Analyst', 'Research', 'Full-time', 'Remote',
   'Discover, screen, and validate winning products, then help brands source them profitably. Deep with Helium 10 / Data Dive and comfortable talking to suppliers.', 2),
  ('Listing SEO & Conversion Copywriter', 'Optimization', 'Full-time', 'Remote',
   'Engineer keyword-rich, high-converting listings — titles, bullets, descriptions, and backend terms. Equal parts SEO scientist and persuasive writer.', 3),
  ('Account Health & Operations Specialist', 'Operations', 'Full-time', 'Remote',
   'Keep client accounts healthy, compliant, and stocked. Handle inventory planning, case management, appeals, and multichannel coordination with a steady hand.', 4),
  ('Brand Manager / Account Lead', 'Client Success', 'Full-time', 'Remote',
   'Be the strategic owner of a set of brand partnerships — orchestrating our specialist teams, running weekly scorecards, and keeping clients delighted and growing.', 5)
) as v(title, department, employment_type, location, description, sort_order)
where not exists (select 1 from public.job_roles);
