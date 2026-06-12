-- 001_schema.sql
-- Core schema for Creator Content Upload & Review Platform

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: users
-- ============================================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  role text not null check (role in ('admin', 'creator', 'reviewer')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp default now()
);

-- ============================================================
-- TABLE: categories
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null,
  content_type text not null check (content_type in ('poster', 'video', 'both')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp default now()
);

-- ============================================================
-- TABLE: creator_category_assignments
-- ============================================================
create table if not exists public.creator_category_assignments (
  id uuid primary key default gen_random_uuid(),
  creator_email text not null,
  category_id uuid references categories(id) on delete cascade,
  created_at timestamp default now(),
  unique (creator_email, category_id)
);

-- ============================================================
-- TABLE: user_language_assignments
-- ============================================================
create table if not exists public.user_language_assignments (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  language text not null,
  created_at timestamp default now(),
  unique (user_email, language)
);


-- ============================================================
-- TABLE: submissions
-- ============================================================
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  creator_email text not null,
  category_id uuid references categories(id) on delete set null,
  title text,
  file_url text not null,
  file_path text not null,
  file_type text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'drive_failed')),
  rejection_reason text,
  reviewer_email text,
  google_drive_file_id text,
  google_drive_folder_id text,
  created_at timestamp default now(),
  reviewed_at timestamp,
  drive_synced_at timestamp
);

-- ============================================================
-- FUNCTION: auto-set creator_email from auth.uid()
-- ============================================================
create or replace function public.set_submission_creator_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.creator_email is null or new.creator_email = '' then
    new.creator_email := (
      select email
      from auth.users
      where id = auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger trg_set_submission_creator_email
  before insert on public.submissions
  for each row
  execute function public.set_submission_creator_email();

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.creator_category_assignments enable row level security;
alter table public.user_language_assignments enable row level security;
alter table public.submissions enable row level security;

-- ============================================================
-- POLICIES: users
-- ============================================================
create policy "Users are viewable by authenticated users"
  on public.users
  for select
  to authenticated
  using (true);

create policy "Only admins can insert users"
  on public.users
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where email = auth.email() and role = 'admin' and status = 'active'
    )
  );

create policy "Only admins can update users"
  on public.users
  for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where email = auth.email() and role = 'admin' and status = 'active'
    )
  );

-- ============================================================
-- POLICIES: categories
-- ============================================================
create policy "Categories are viewable by authenticated users"
  on public.categories
  for select
  to authenticated
  using (true);

create policy "Only admins can insert categories"
  on public.categories
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where email = auth.email() and role = 'admin' and status = 'active'
    )
  );

create policy "Only admins can update categories"
  on public.categories
  for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where email = auth.email() and role = 'admin' and status = 'active'
    )
  );

-- ============================================================
-- POLICIES: creator_category_assignments
-- ============================================================
create policy "Creator assignments are viewable by authenticated users"
  on public.creator_category_assignments
  for select
  to authenticated
  using (true);

create policy "Only admins can insert creator assignments"
  on public.creator_category_assignments
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where email = auth.email() and role = 'admin' and status = 'active'
    )
  );

create policy "Only admins can delete creator assignments"
  on public.creator_category_assignments
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.users
      where email = auth.email() and role = 'admin' and status = 'active'
    )
  );

-- ============================================================
-- POLICIES: user_language_assignments
-- ============================================================
create policy "Language assignments are viewable by authenticated users"
  on public.user_language_assignments
  for select
  to authenticated
  using (true);

create policy "Only admins can insert language assignments"
  on public.user_language_assignments
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where email = auth.email() and role = 'admin' and status = 'active'
    )
  );

create policy "Only admins can delete language assignments"
  on public.user_language_assignments
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.users
      where email = auth.email() and role = 'admin' and status = 'active'
    )
  );


-- ============================================================
-- POLICIES: submissions
-- ============================================================
create policy "Creators can view their own submissions"
  on public.submissions
  for select
  to authenticated
  using (
    creator_email = auth.email()
    or exists (
      select 1 from public.users
      where email = auth.email() and role in ('reviewer', 'admin') and status = 'active'
    )
  );

create policy "Creators can insert their own submissions"
  on public.submissions
  for insert
  to authenticated
  with check (
    creator_email = auth.email()
    or exists (
      select 1 from public.users
      where email = auth.email() and role = 'admin' and status = 'active'
    )
  );

create policy "Reviewers and admins can update submissions"
  on public.submissions
  for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where email = auth.email() and role in ('reviewer', 'admin') and status = 'active'
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_users_email on public.users (email);
create index if not exists idx_categories_status on public.categories (status);
create index if not exists idx_submissions_status on public.submissions (status);
create index if not exists idx_submissions_creator_email on public.submissions (creator_email);
create index if not exists idx_user_language_assignments_email on public.user_language_assignments (user_email);
