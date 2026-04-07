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
