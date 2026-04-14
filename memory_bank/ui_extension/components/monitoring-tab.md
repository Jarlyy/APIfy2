# MonitoringTab Component

## Source
`components/MonitoringTab.tsx`

## Role
Hosts scheduled monitoring management in its own dashboard tab.

## Inputs
- `monitorDraft`

## Notes
- Loads monitor configs and monitor runs from `lib/monitoring.ts`.
- Owns monitor creation, deletion, active monitor selection, and the response-time chart for recent monitor runs.
- Receives prefilled request data from the manual testing workspace through `monitorDraft`.
- Reuses the creation form for editing an existing monitor configuration in place, including request settings, schedule, and alert preferences.
- Lets the user pause and resume a saved monitor directly from the monitor list through an inline switch-like status control with optimistic UI updates.
- Exposes a chart-range selector so the response-time chart can be viewed across short or long X-axis windows.
