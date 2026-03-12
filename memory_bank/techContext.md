# Tech Context

## Stack
- Framework: Next.js 16 (`next`)
- UI: React 19, Tailwind CSS 4, Radix UI, Lucide
- Language: TypeScript
- Backend services: Supabase SSR and Supabase JS
- Charts: Recharts

## Repo and Tooling
- Package manager in practice: `pnpm` (`pnpm-lock.yaml`, `packageManager` field)
- Lint config present: `eslint.config.mjs`
- Next config present: `next.config.ts`
- Vercel deployment files present: `vercel.json`, `.vercelignore`
- PostCSS config present: `postcss.config.mjs`

## Important Paths
- App routes: `app/`
- Components: `components/`
- Shared logic: `lib/`
- Hooks: `hooks/`
- Static assets: `public/`
- Database schema: `supabase/schema.sql`
- Project docs: `docs/`

## Environment Expectations
- Supabase environment variables are required for full functionality.
- AI provider keys are required for AI-powered flows.
- Vercel is the documented deployment target.

## Tooling Mismatches To Remember
- `docs/AGENTS.md` asks to use `bun`, but repository metadata currently points to `pnpm`.
- `docs/AGENTS.md` asks for linting with `biome`, but Biome is not listed in `package.json`.
