# AnalyticsTab Component

## Source
`components/AnalyticsTab.tsx`

## Role
Shows monitoring analytics, monitor management, and historical API testing insights inside the dashboard analytics tab.

## Inputs
- `monitorDraft`

## Notes
- Loads monitor configs and monitor run history from Supabase-backed helpers in `lib/monitoring.ts`.
- The selected monitor summary keeps aggregate KPI cards (`uptime`, average response, run count), while the main chart now visualizes recent `response_time_ms` values per monitor run.
- The monitor creation form supports request method, headers, body, auth helpers, expected status, SLA target, and legal confirmation.
