# Product Context

## Problem
Developers and QA engineers need a faster way to inspect third-party APIs, validate requests with different authentication methods, and understand responses without constantly switching between documentation, API clients, and ad-hoc scripts.

## Users
- Developers integrating external APIs.
- QA engineers validating API behavior and regressions.
- Technical product owners or leads who need a quick health and usability check of APIs.

## Product Value
- Manual API testing from one workspace.
- Faster onboarding through OpenAPI import and prefilled requests.
- Better understanding of responses through AI-assisted analysis.
- Reuse through favorites, history, and analytics views.

## Functional Themes Seen In Repo
- Authentication flows: `app/login`, `app/signup`, `hooks/useAuth.ts`.
- Main testing workflow: `components/UnifiedApiTester.tsx`, `components/MainWorkspace.tsx`.
- OpenAPI import: `components/OpenApiImport.tsx`, `app/test-openapi`.
- AI analysis: `components/AiAnalysis.tsx`, `lib/ai-analysis.ts`, `lib/ai-providers.ts`.
- History and analytics: `components/HistoryTab.tsx`, `components/AnalyticsTab.tsx`, `lib/test-history.ts`.
- Favorites and UX helpers: `components/FavoritesTab.tsx`, `lib/favorites.ts`.

## Current Documentation Gaps
- No `docs/README.md`, despite it being declared as the authoritative architecture document in `docs/AGENTS.md`.
- Existing docs indicate a broader vision than can be fully verified from a quick repository scan, so Memory Bank entries below stay close to code-visible facts.
