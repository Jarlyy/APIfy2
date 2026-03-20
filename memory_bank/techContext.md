# Tech Context

## Stack
- Framework: Next.js 16
- UI: React 19, Tailwind CSS 4, Radix UI, Lucide icons
- Language: TypeScript
- Backend services: Supabase SSR and Supabase JS
- Visualization: Recharts

## Repo and Tooling
- Package manager in the checked-in metadata: `bun`
- Lockfile present: `bun.lock`
- Lint tooling in codebase: Biome via `biome.json` and `package.json` scripts
- Deployment files: `vercel.json`, `.vercelignore`
- Styling/build support: `postcss.config.mjs`, `next.config.ts`
- `bun` is installed locally at `C:\Users\Admin\.bun\bin\bun.exe`, but the sandbox shell still does not expose it via `PATH`, so commands should use the absolute binary path unless the terminal session is restarted.

## Monitoring-Specific Tech
- Cron entry in deployment configuration for the monitoring runner.
- Service-role backed monitoring and alert workflows reflected in the schema and recent product plan.
- Alert integrations include Slack, Telegram, and email channels at the product-design level.

## Important Paths
- Routes: `app/`
- Feature components: `components/`
- Shared logic: `lib/`
- Auth hook: `hooks/useAuth.ts`
- Database schema: `supabase/schema.sql`
- Operational memory: `memory_bank/`

## Environment Expectations
- Supabase environment variables are required for auth and persistence features.
- AI provider keys are required for AI analysis and generation routes.
- Monitoring and alerting flows require their respective service credentials when enabled.
- Vercel is the documented deployment target.

## Tooling Mismatches To Remember
- The repository now satisfies the `AGENTS.md` package-manager and lint-tooling requirements with `bun` and `Biome`.
- `biome.json` intentionally relaxes a small set of rules to accommodate the legacy codebase while keeping the lint command operational.
