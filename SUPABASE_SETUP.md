# Supabase setup

1. Create a Supabase project and open **SQL Editor**.
2. Run `supabase/migrations/20260823000000_orbitjobs_schema.sql`.
3. In **Authentication → URL Configuration**, add the local and deployed app URLs as redirect URLs. Enable email/password sign-in.
4. Copy the project URL and the publishable/anon key into the two `orbitjobs-supabase-*` meta tags in `index.html`. Do not use the service-role key in the browser.
5. Add interest categories and job listings through the Supabase dashboard, an Edge Function, or a trusted server using the service-role key. The browser only reads active jobs and cannot modify them.

All user-owned rows are protected by Row Level Security. Jobs and interest categories are now database records rather than front-end fixtures.
