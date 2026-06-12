-- seed.sql
-- Initial seed data for Creator Content Upload & Review Platform
-- Run this in Supabase SQL Editor after running the migration (001_schema.sql).

-- ============================================================
-- 1. DEFAULT CATEGORIES
-- ============================================================
insert into public.categories (name, language, content_type)
values
  ('Good Morning', 'Hindi', 'both'),
  ('Good Night', 'Hindi', 'both'),
  ('Motivation', 'Hindi', 'both'),
  ('Devotion', 'Hindi', 'both'),
  ('Suvichar', 'Hindi', 'both');

-- ============================================================
-- Language Assignments for Users
-- ============================================================
-- After creating users, assign languages to them:
--
-- Example: Assign Hindi language to a creator
-- INSERT INTO public.user_language_assignments (user_email, language)
-- VALUES ('creator@example.com', 'Hindi');
--
-- Example: Assign Hindi language to a reviewer
-- INSERT INTO public.user_language_assignments (user_email, language)
-- VALUES ('reviewer@example.com', 'Hindi');
--
-- Admin users can see all languages by default (no assignment needed).
-- Creators and reviewers will only see content in their assigned languages.


-- ============================================================
-- 2. CREATING THE FIRST ADMIN USER
-- ============================================================
-- IMPORTANT: The admin user must sign in via Google at least once BEFORE
-- running the insert below. This ensures their email exists in auth.users,
-- which is required for the RLS policies to work correctly.
--
-- Steps to create the first admin:
--   1. Deploy the app and visit it in the browser
--   2. Sign in with your Google account
--   3. You will see "Access Denied" (this is expected — your email is not
--      yet in public.users, so no role is assigned)
--   4. Come back here to the Supabase SQL Editor and uncomment + run the
--      INSERT below, replacing the email and name with your own
--   5. Refresh the app — you should now see the Admin Dashboard
--
-- Example insert:
-- insert into public.users (email, name, role, status)
-- values ('admin@gmail.com', 'Admin User', 'admin', 'active');

-- ============================================================
-- 3. MANAGING ADDITIONAL USERS
-- ============================================================
-- Users are added to the platform in one of two ways:
--
--   a) Via the /admin/users page in the app UI (recommended)
--      - The admin navigates to Admin Dashboard → Users → Add User
--      - This inserts directly into public.users
--
--   b) Via direct database insert (fallback)
--      - Useful for bulk seeding or recovery
--      - Example:
--        insert into public.users (email, name, role, status)
--        values ('creator@example.com', 'Creator Name', 'creator', 'active');
--
-- IMPORTANT: Every user must sign in with Google at least once before they
-- can use the platform. Their email must exist in auth.users for RLS to
-- recognize them. The admin should only add users whose Google-authenticated
-- email is already known.
