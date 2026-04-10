# Active Context

## Current Task
Continue `DEL-006` workspace polish by cleaning up user-facing copy and encoding issues after the dashboard tab split.

## Current Findings
- Plan re-evaluation shows that the legal/security hardening scope for scheduled monitoring is already implemented end to end in the codebase, so `DEL-010` is now marked `completed`.
- `MainWorkspace` routes monitoring to `MonitoringTab` and request analytics to `RequestAnalyticsTab`; the old combined `AnalyticsTab` has been removed.
- The selected monitor view now renders recent `monitor_runs.response_time_ms` values as a response-time trend, while keeping uptime as a summary KPI instead of the main chart.
- Dashboard routing uses dedicated `components/MonitoringTab.tsx` and `components/RequestAnalyticsTab.tsx`, and the manual-test handoff opens `tab=monitoring`.
- `components/Header.tsx`, `components/MonitoringTab.tsx`, and `components/RequestAnalyticsTab.tsx` have now been normalized to clean UTF-8 Russian copy so the separated tabs no longer show mojibake in the UI.
- `components/Header.tsx` now includes a user-facing theme toggle that switches light/dark mode and persists preference in `localStorage` while applying the `dark` class on `<html>`.
- Monitoring creation now enforces user legal attestation in UI before monitor can be created.
- Monitoring URL validation now blocks local/private targets and sensitive query patterns (`token`, `key`, `secret`, etc.) to reduce abuse risk.
- `/api/monitor/run` now treats missing `MONITOR_CRON_SECRET` as a configuration error, adds rate limiting, and writes basic operational security logs.
- Public draft legal docs were added under `docs/legal/` (ToS, Privacy, AUP) and linked from architecture/monitoring docs.
- User requested adding a dedicated dark-theme item to the development plan; this is now tracked as a separate deliverable candidate.
- User additionally requested adding monitoring migration to another cron service into the development plan.
- `package.json` now declares `bun@1.3.10` as the canonical `packageManager`, and the direct `pnpm` dependency has been removed.
- The repository now contains `bun.lock`; the obsolete `pnpm-lock.yaml` and `.npmrc` have been removed.
- Root onboarding docs and supporting setup docs now use `bun install` and `bun dev`.
- `bun` had to be installed locally during this task to generate the new lockfile and verify the migration path.
- The changed non-Markdown files in the migration commit are limited to `.gitignore`, `install-deps.sh`, and `package.json`; of those, only `package.json` is a practical Biome target.
- `bun` is now installed at `C:\Users\Admin\.bun\bin\bun.exe`, and `bun x @biomejs/biome check --write package.json` completed successfully.
- `docs/README.md` now exists and documents the high-level architecture, route groups, shared modules, and key data flows required by `AGENTS.md`.
- The repository now uses `Biome` as the canonical lint tool via `package.json` scripts and `biome.json`, and `bun run lint` passes successfully.
- Enabling Biome on the existing codebase required auto-formatting the supported source files and relaxing a small set of legacy a11y/style rules in `biome.json`.
- The analytics tab was not removed from the codebase; the immediate UX issue was the non-responsive dashboard header, where tabs could slide out of view on narrower widths.
- `components/Header.tsx` has been updated so the dashboard tabs stay accessible via horizontal scrolling on compact layouts.
- The working analytics content is now split into dedicated monitoring and request-analytics tabs in the dashboard.
- Re-running tests from `History` and `Favorites` no longer requires a full page reload; the dashboard now consumes pending test data through a shared client-side event flow.
- The monitoring data layer now accepts richer request configuration during monitor creation: HTTP method, custom headers, optional body, expected status, and failure alert preferences.
- `components/MonitoringTab.tsx` monitor creation UI is aligned with manual testing capabilities for request setup: method, headers JSON, body, auth modes (`none`, `bearer`, `api-key`, `basic`), expected status, and failure alert toggle.
- The manual testing workspace can now hand off the current request configuration directly into monitor creation, switching the dashboard to the monitoring tab and pre-filling the monitor form without a page reload.
- Vercel deploys now run through `bun` correctly; the remaining deployment stopper found in this session was a strict TypeScript mismatch in `app/dashboard/page.tsx`, where `testData` needed `undefined` instead of `null`.

## Decisions
- Treat the root `AGENTS.md` as the active repository rule set.
- Prefer a full migration with regenerated artifacts instead of a metadata-only switch.
- Align lint tooling pragmatically: switch to Biome now, preserve app behavior, and defer deeper code-health refactors that are not required to make the lint workflow operational.
- Prefer workflow polish that removes disruptive full-page reloads from the dashboard experience when equivalent client-side state handoff is feasible.

## Next Actions
- Keep project progress at 92% with three open deliverables: `DEL-006` (in progress), `DEL-008` (in progress), and `DEL-009` (pending).
- Review the separated monitoring and analytics tabs for any remaining UX duplication beyond copy cleanup, especially empty states and visual hierarchy.
- Continue dashboard productivity polish work under `DEL-006`, focusing on remaining workspace UX rough edges.
- Continue dedicated dark-theme pass under `DEL-008` after initial toggle rollout, focusing on full dashboard/workspace parity and contrast validation.
- Plan monitoring migration under `DEL-009`: replace current cron provider, update schedules/env, and validate `/api/monitor/run` trigger compatibility.
