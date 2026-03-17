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
- Current behavior should be reviewed together with working-tree changes because this file is modified in the current session context.
