# Supabase setup

1. Create a Supabase project and open **SQL Editor**.
2. Run `supabase/migrations/20260823000000_orbitjobs_schema.sql`.
3. In **Authentication → URL Configuration**, add the local and deployed app URLs as redirect URLs. Enable email/password sign-in.
4. Copy the project URL and the publishable/anon key into the two `orbitjobs-supabase-*` meta tags in `index.html`, commit those changes, and redeploy. Both values are currently empty in this repository, so the deployed app cannot contact Supabase until you set them. Do not use the service-role key in the browser.
5. Add interest categories and job listings through the Supabase dashboard, an Edge Function, or a trusted server using the service-role key. The browser only reads active jobs and cannot modify them.

All user-owned rows are protected by Row Level Security. Jobs and interest categories are now database records rather than front-end fixtures.

If **Confirm email** is enabled under **Authentication → Providers → Email**, account creation succeeds without a login session. The app will ask the user to confirm their email and then sign in. Add the exact deployed URL (for example, `https://your-site.example`) under **Authentication → URL Configuration → Site URL** and **Redirect URLs**.
