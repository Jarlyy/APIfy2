# Dashboard Page

## Route
`/dashboard`

## Purpose
Primary application workspace for API testing and feature tabs.

## Main Components
- `Header`
- `MainWorkspace`

## Key Behavior
- Reads auth state through `useAuth()`.
- Reads the `tab` search param to initialize the active dashboard tab.
- Restores deferred `pendingTestData` from `localStorage`.
- Shows a loading shell while auth state resolves.

## Data Flow
- Auth data comes from Supabase-backed hook logic.
- Tab state is local React state synchronized with URL search params.
- Deferred test payload is read from browser storage and passed into `MainWorkspace`.
