# Tech Context

## Stack
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS + Radix UI + Lucide
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Recharts for analytics charts

## Operational Tooling (Effective)
- Package manager currently used in this environment/repo: **pnpm**
- Linting setup in repo: ESLint (`eslint.config.mjs`)
- Type checking: `tsc --noEmit`

## Monitoring-Specific Tech
- Cron entry in `vercel.json` for `/api/monitor/run`
- Service-role client in `lib/supabase/admin.ts`
- Alert integrations:
  - Slack webhook
  - Telegram Bot API
  - Resend API (email)

## Env Variables (Critical)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MONITOR_CRON_SECRET` (recommended for cron endpoint auth)
- Optional AI and alert provider keys/config values

## Constraints
- External font fetching (`next/font` + Google Fonts) may break build in restricted networks.
