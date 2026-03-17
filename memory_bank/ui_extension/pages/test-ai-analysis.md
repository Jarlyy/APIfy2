# Test AI Analysis Page

## Route
`/test-ai-analysis`

## Purpose
Sandbox page for comparing AI response analysis providers against a sample API payload.

## Main Components
- `AiAnalysis`
- shadcn cards and buttons

## Key Behavior
- Uses a fixed sample GitHub-style response payload.
- Lets the user trigger analysis via Gemini or GPT OSS provider paths.
- Mounts `AiAnalysis` only after a provider is selected.

## Data Flow
- Test payload is defined locally in the page component.
- Analysis requests are delegated through the `AiAnalysis` component.
