# System Patterns

## High-Level Architecture
- Next.js App Router application rooted in `app/`.
- UI assembled from feature components in `components/` and shared primitives in `components/ui/`.
- Domain logic and service helpers live in `lib/`.
- Supabase provides auth and persistent storage, with schema assets under `supabase/`.

## Observed Feature Segments
- Route pages:
  - `app/page.tsx` as the main entry point.
  - `app/dashboard`, `app/login`, `app/signup`.
  - test-oriented routes such as `app/test-ai-analysis`, `app/test-openapi`, `app/test-providers`.
- API-related server routes under `app/api`.
- A proxy-related entry point exists in `proxy.ts`.

## Interaction Patterns
- UI tabs/components separate concerns for analytics, history, favorites, AI analysis, and OpenAPI import.
- Request execution and related UX appear centralized in `UnifiedApiTester` and `MainWorkspace`.
- Supabase client logic is split into `lib/supabase` plus auth hook usage in `hooks/useAuth.ts`.
- AI capabilities are abstracted behind provider/helper modules rather than embedded directly in a single page component.

## Persistence Patterns
- Test history and favorites are encapsulated through dedicated library files.
- Supabase schema is maintained through SQL assets rather than ORM migration files visible at repo root.

## Noted Uncertainties
- Without deeper code tracing, exact data flow between page routes, server routes, and Supabase helpers is summarized only at the subsystem level.
- No authoritative `docs/README.md` is available to cross-check intended architecture.
