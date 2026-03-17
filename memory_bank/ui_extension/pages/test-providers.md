# Test Providers Page

## Route
`/test-providers`

## Purpose
Diagnostic page for comparing AI providers that generate API tests from a service name.

## Main Components
- shadcn form controls and cards

## Key Behavior
- Accepts a service name input.
- Calls `/api/test-providers` with either `gemini` or `huggingface`.
- Renders loading, success, or error states per provider.
- Attempts to parse returned test JSON for a quick summary count.

## Data Flow
- User input is stored in local React state.
- Results are fetched from the server route and stored per provider.
