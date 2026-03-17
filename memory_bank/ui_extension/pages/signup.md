# Signup Page

## Route
`/signup`

## Purpose
Register a new user account with Supabase and capture a display name in auth metadata.

## Main Components
- Inline form UI in `app/signup/page.tsx`

## Key Behavior
- Collects name, email, and password.
- Sends signup data through `supabase.auth.signUp`.
- Writes `name` into the auth metadata payload.
- Redirects to `/dashboard` after successful signup.

## Data Flow
- Form state is local React state.
- Auth request is sent through `lib/supabase/client.ts`.
