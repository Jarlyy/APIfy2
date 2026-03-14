# APIfy2 Project Brief

## Summary
APIfy2 is a web application for interactive API testing, documentation-assisted request generation, and AI-powered response analysis. The current implementation is a Next.js application with Supabase-backed authentication and persistence.

## Goals
- Provide a single workspace for manual API testing.
- Support importing OpenAPI/Swagger specs and working from documented endpoints.
- Store request history, favorites, and analytics for authenticated users.
- Offer AI-assisted analysis and test generation workflows.

## Current Scope
- Next.js App Router frontend and server routes.
- Supabase integration for auth and database-backed data.
- API testing workspace with auth helpers and response inspection.
- AI provider integrations for analysis flows.
- Vercel-oriented deployment configuration.

## Constraints
- The repository currently uses `pnpm` (`pnpm-lock.yaml`, `packageManager` in `package.json`) even though `docs/AGENTS.md` says to use `bun`.
- `docs/README.md` is referenced by `docs/AGENTS.md` as the architecture source of truth, but that file is currently absent.
- The development server must not be started, stopped, or inspected by the agent per `docs/AGENTS.md`.

## Primary References
- `README.md`
- `docs/prd.md`
- `docs/development-plan.md`
- `docs/AGENTS.md`


## Recent Additions
- Scheduled monitoring with cron runner and alert channels.
- Uptime/SLA analytics extension in dashboard analytics tab.
- Placeholder-aware execution flow for generated/manual tests.
