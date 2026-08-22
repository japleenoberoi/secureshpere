# OrbitJobs data contract

The browser connects to Supabase using the project URL and publishable/anon key in `index.html`. Supabase Auth manages authentication; application data is protected by the Row Level Security policies in `supabase/migrations/20260823000000_orbitjobs_schema.sql`.

| Feature | Supabase resource |
| --- | --- |
| Sign-up, sign-in, sign-out, session | `auth.users` through Supabase Auth |
| User name | `profiles` (created automatically on sign-up) |
| Available categories | `interest_categories` |
| Saved categories | `user_interests`, set atomically by `set_user_interests` |
| Matching jobs | `jobs`, filtered by the signed-in user's `interest_ids` |
| File-scan history | `scan_results` (metadata only; files never leave the browser) |

The client cannot write jobs or interest categories. Populate those records from a trusted server, Edge Function, or the Supabase dashboard. Never place a service-role key or scraper credentials in the frontend.
