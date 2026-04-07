# AnalyticsTab Component

## Source
`components/AnalyticsTab.tsx`

## Role
Legacy combined monitoring-and-analytics component kept in the repo but no longer mounted by `MainWorkspace`.

## Inputs
- `monitorDraft`
- `mode`

## Notes
- The dashboard now prefers `MonitoringTab.tsx` for scheduled monitoring and `RequestAnalyticsTab.tsx` for request-history analytics.
- This file still reflects the older combined implementation and should be treated as transitional code until removed or fully refactored.
