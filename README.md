# Gamma
A platform that automates proposal generation with cost and timeline estimates for client requirements.

## Supabase setup

1. Add these values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Run `SUPABASE_SETUP.sql` in the Supabase SQL editor.
3. Test connection with `npm run db:test-supabase`.
4. Start app with `npm run dev`.
