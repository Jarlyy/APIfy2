# Test OpenAPI Page

## Route
`/test-openapi`

## Purpose
Provide sample OpenAPI specifications and testing instructions for import workflows.

## Main Components
- shadcn cards, buttons, badges
- Inline data tables and helper actions

## Key Behavior
- Lists bundled test specifications and external public spec URLs.
- Supports copy-to-clipboard for spec URLs.
- Supports downloading bundled JSON specs for local import testing.

## Data Flow
- Uses static arrays defined in `app/test-openapi/page.tsx`.
- Fetches JSON only when the user triggers a download action.
