# System Patterns

## High-Level Architecture
- Next.js App Router app (`app/`) with feature tabs in `components/`.
- Domain/service helpers in `lib/`.
- Supabase as persistence/auth backbone (`lib/supabase/*`, `supabase/schema.sql`).

## Core Runtime Patterns
1. **Interactive testing pattern**
   - `UnifiedApiTester` executes manual and generated tests.
   - Placeholder extraction/resolution blocks execution until required values are supplied.
2. **Monitoring runner pattern**
   - Cron invokes `POST /api/monitor/run`.
   - Route reads due `monitor_configs`, performs check, writes `monitor_runs`, updates monitor state.
3. **Alert fanout pattern**
   - On monitor failure, route loads user `alert_channels` and dispatches via `lib/alerts`.
4. **Analytics aggregation pattern**
   - `AnalyticsTab` combines test history + monitor runs for KPI/timelines.

## Data Boundaries
- User-bound tables under RLS: favorites, history, monitor configs/runs, alert channels.
- System cron path uses service-role client for scheduled operations.

## Noted Constraints
- Documentation source `docs/README.md` referenced in AGENTS is still absent in repository snapshot.
