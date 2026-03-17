# APIfy2 Project Brief

## Summary
APIfy2 is a Next.js application for API exploration, manual request execution, OpenAPI-driven workflows, scheduled monitoring, and AI-assisted analysis. The current codebase combines a dashboard-style frontend, server routes under `app/api`, and Supabase-backed auth/data storage.

## Goals
- Give developers and QA engineers one workspace for API testing.
- Reduce setup time through OpenAPI import and reusable request data.
- Persist user data such as history, favorites, and monitoring state.
- Add AI-assisted analysis and test-generation helpers on top of raw API calls.
- Support recurring health checks and alerting for important endpoints.

## Current Scope
- App Router pages for dashboard, auth, and feature test routes.
- API endpoints for proxying, AI analysis, provider testing, test generation, and monitoring execution.
- Supabase integration for authentication and persisted records.
- Client-side workspace centered around `MainWorkspace` and `UnifiedApiTester`.
- Monitoring configuration, run history, and alert channel persistence in the database layer.
- Vercel-oriented deployment files and Supabase SQL schema.

## Constraints
- The repository instructions in `AGENTS.md` require `bun` and `biome`; package management is now aligned with `bun`, but lint tooling is still on ESLint rather than Biome.
- `docs/README.md` is still absent, so there is no canonical architecture document in the location mandated by `AGENTS.md`.
- The development server must not be started, stopped, or inspected by the agent.

## Primary References
- `AGENTS.md`
- `README.md`
- `docs/prd.md`
- `docs/development-plan.md`
- `supabase/schema.sql`

## Recent Additions
- Scheduled monitoring with cron runner and alert channels.
- Uptime and SLA analytics extensions in the dashboard flow.
- Placeholder-aware execution flow for generated and manual tests.

## Project Deliverables
| ID | Deliverable | Status | Weight |
| --- | --- | --- | --- |
| DEL-001 | Core API testing workspace with manual request execution | completed | 20 |
| DEL-002 | Authentication and user-scoped persistence via Supabase | completed | 15 |
| DEL-003 | OpenAPI import and specification-driven request preparation | completed | 15 |
| DEL-004 | AI-assisted analysis and test generation flows | completed | 15 |
| DEL-005 | Monitoring, alerting, and uptime analytics workflows | completed | 15 |
| DEL-006 | Dashboard productivity features: history, favorites, workspace polish | in_progress | 10 |
| DEL-007 | Operational documentation and tooling alignment with AGENTS requirements | in_progress | 10 |

## Project Completion
Project completion based on completed deliverables: 80%.
