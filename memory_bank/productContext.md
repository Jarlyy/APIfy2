# Product Context

## Problem
Teams integrating external APIs need a faster way to send requests, validate auth setups, inspect responses, monitor uptime, and reuse findings without switching between multiple tools and scattered notes.

## Users
- Developers integrating third-party APIs.
- QA engineers validating API behavior and regressions.
- Technical leads who need a quick health check of API integrations.

## Product Value
- One workspace for manual API testing.
- Faster onboarding through OpenAPI import and prefilled request data.
- AI-assisted understanding of responses and generated tests.
- Persistent history, favorites, and monitoring artifacts for repeat workflows.

## Functional Themes Seen In Repo
- Auth flows: `app/login`, `app/signup`, `hooks/useAuth.ts`.
- Main workspace: `app/dashboard/page.tsx`, `components/MainWorkspace.tsx`, `components/UnifiedApiTester.tsx`.
- OpenAPI import: `components/OpenApiImport.tsx`, `app/test-openapi/page.tsx`.
- AI helpers: `components/AiAnalysis.tsx`, `lib/ai-analysis.ts`, `lib/ai-providers.ts`.
- Persistence helpers: `lib/test-history.ts`, `lib/favorites.ts`, `supabase/schema.sql`.
- Proxy and server endpoints: `app/api/*`, `lib/cors-proxy.ts`, `proxy.ts`.
- Monitoring and alerting: scheduled monitor execution, monitor history, and alert channel support reflected in recent plan and schema updates.

## Newly Realized Value
- Periodic monitoring of API endpoints with uptime visibility.
- Failure notifications through configurable alert channels.
- Safer parameterized test execution via placeholder inputs.

## Current Documentation Gaps
- `docs/README.md` does not exist yet, even though `AGENTS.md` declares it as the architecture source of truth.
- The repo contains active product evolution in the working tree, so deliverable status is based on code-visible capabilities rather than outdated doc claims.
