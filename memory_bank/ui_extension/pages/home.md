# Home Page

## Route
`/`

## Purpose
Acts as a lightweight entry route that immediately redirects users to the dashboard.

## Key Behavior
- Implemented in `app/page.tsx`.
- Uses `next/navigation` redirect.
- Does not render its own UI state.

## Data Flow
- No direct data loading.
- Navigation flow forwards the user to `/dashboard`.
