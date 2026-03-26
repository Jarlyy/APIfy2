# System Patterns

## High-Level Architecture
- Next.js App Router application rooted in `app/`.
- Client-heavy dashboard experience that delegates feature areas to dedicated React components in `components/`.
- Server routes under `app/api/` provide AI analysis, provider tests, generation helpers, monitoring execution, and proxy behavior.
- Supabase supplies authentication helpers plus persisted data storage, with schema managed in `supabase/schema.sql`.

## Core Runtime Patterns
1. Interactive testing pattern
   `UnifiedApiTester` executes manual and generated tests and participates in placeholder-aware execution flows.
2. Monitoring runner pattern
   Scheduled execution invokes `/api/monitor/run`, loads due monitor configs, records monitor runs, updates monitor state, and now enforces cron secret + request-rate guardrails.
3. Alert fanout pattern
   Failure paths dispatch notifications through configured alert channels.
4. Dashboard orchestration pattern
   `app/dashboard/page.tsx` resolves auth state, restores deferred test data, and mounts `Header` plus `MainWorkspace`.

## Route and UI Structure
- `app/page.tsx` immediately redirects to `/dashboard`.
- `app/login/page.tsx` and `app/signup/page.tsx` are standalone auth screens backed by the Supabase client.
- `app/test-openapi/page.tsx`, `app/test-ai-analysis/page.tsx`, and `app/test-providers/page.tsx` act as feature demo or diagnostic pages.
- Supporting feature panels include favorites, history, AI analysis, OpenAPI import, token input, and CORS guidance.

## Data and Integration Patterns
- Supabase helpers are split into client, server, and middleware-specific modules under `lib/supabase/`.
- User-oriented data such as favorites, history, monitor configs, monitor runs, and alert channels are stored under RLS-protected tables.
- Proxy logic exists both as a server route and a root `proxy.ts` integration point.

## Noted Uncertainties
- Legal policy drafts were added under `docs/legal`, but they still require counsel review before external publication.
