# Login Page

## Route
`/login`

## Purpose
Authenticate an existing user through Supabase email/password sign-in.

## Main Components
- Inline form UI in `app/login/page.tsx`

## Key Behavior
- Collects email and password.
- Calls `supabase.auth.signInWithPassword`.
- Redirects to `/dashboard` on success.
- Displays inline error feedback and loading state.

## Data Flow
- Form state is local React state.
- Auth request is sent through `lib/supabase/client.ts`.
