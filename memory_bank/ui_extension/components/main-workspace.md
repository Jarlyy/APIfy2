# MainWorkspace Component

## Source
`components/MainWorkspace.tsx`

## Role
Acts as the central dashboard orchestrator for the active feature area.

## Inputs
- `userId`
- `activeTab`
- `onTabChange`
- `testData`

## Notes
- Receives restored test data from the dashboard page.
- Owns the feature switching boundary for the main product experience.
- Routes separate `monitoring` and `analytics` tabs instead of combining them in one surface.
- Keeps the manual-test-to-monitor flow by passing `monitorDraft` into the dedicated monitoring tab.
