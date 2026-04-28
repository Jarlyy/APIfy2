# Active Context

## Current Task
Improve the monitoring response-time chart so dense histories remain readable when many run points are available.

## Current Findings
- Monitoring chart readability was improved in `components/MonitoringTab.tsx`: dense run histories are compacted into up to 80 averaged segments, dots are hidden for crowded charts, X-axis ticks are thinned, labels adapt to selected range, and tooltips explain aggregated periods.
- Monitoring chart tooltip now uses theme-aware popover/background/foreground CSS variables, so hover details stay readable in both light and dark themes.
- User approved fixing the previously identified risks: default app metadata, missing route-level dashboard auth guard, permissive local proxy URL handling, and sensitive AI request logging.
- Risk fixes are implemented: `app/layout.tsx` has product metadata, `proxy.ts` now delegates to Supabase middleware, `/api/proxy` blocks unsafe targets and oversized bodies, auth pages create the browser Supabase client only during form submission, and `/api/ai/analyze` logs only action-level completion metadata.
- Verification: targeted Biome auto-fix on changed code files passed with no fixes; `bun run build` passed after moving login/signup Supabase client creation out of render-time prerendering.
- Current repository `HEAD` is `c0ebcda`; change-control comparison from previous `last_checked_commit` (`d970248`) shows one newer commit: `c0ebcda a lot`.
- The high-level architecture remains aligned with `docs/README.md`: Next.js App Router UI, `app/api` route handlers, shared domain logic in `lib`, and Supabase-backed auth/persistence.
- The current code still matches the documented dashboard split: `MainWorkspace` routes `monitoring` to `MonitoringTab` and `analytics` to `RequestAnalyticsTab`.
- The canonical project completion remains 92% based on `memory_bank/projectbrief.md`; open deliverables are still `DEL-006`, `DEL-008`, and `DEL-009`.
- No implementation changes were made during this analysis pass; Memory Bank was updated only to record refreshed context and change-control state.
- The selected monitor response-time chart now supports user-controlled X-axis ranges (`6h`, `24h`, `7d`, `30d`, `all`) so the visible time window is no longer fixed to a hardcoded recent slice.
- Two follow-up UX items were explicitly added to the plan for the monitoring chart: adaptive X-axis label formatting by selected range and a per-monitor default chart range.
- The monitor status switch now uses optimistic UI updates, so pause/resume changes appear immediately in the list and only roll back if the backend update fails.
- The monitor status switch now keeps a stable layout regardless of `Активен`/`Пауза` label length and no longer uses disabled styling while the toggle request is in flight, avoiding the dimmed card and forbidden cursor UX regression.
- Monitor pause/resume no longer emits a green success message; the monitor list now uses a compact switch-like status control so the action is communicated inline instead of via toast-style feedback.
- Scheduled monitors can now be paused and resumed from `MonitoringTab` without deletion; resuming recalculates `next_run_at` from the stored interval so the schedule restarts cleanly.
- Saved monitor configurations can now be edited in `components/MonitoringTab.tsx` without recreating the monitor: the existing form now supports create/edit modes and persists changes through `lib/monitoring.ts:updateMonitor`.
- Editing a monitor now rehydrates stored auth/header settings back into the form and recalculates `next_run_at` when the monitoring interval changes, so updated schedules take effect predictably.
- `docs/README.md` and `docs/development-plan.md` required synchronization with the post-split dashboard architecture and the current deliverable/tooling status.
- `memory_bank/progress.md` had already described the latest dashboard changes, but its `last_checked_commit` still pointed to `37eabdc` instead of current `HEAD`.
- Plan re-evaluation shows that the legal/security hardening scope for scheduled monitoring is already implemented end to end in the codebase, so `DEL-010` is now marked `completed`.
- `MainWorkspace` routes monitoring to `MonitoringTab` and request analytics to `RequestAnalyticsTab`; the old combined `AnalyticsTab` has been removed.
- The selected monitor view now renders recent `monitor_runs.response_time_ms` values as a response-time trend, while keeping uptime as a summary KPI instead of the main chart.
- Dashboard routing uses dedicated `components/MonitoringTab.tsx` and `components/RequestAnalyticsTab.tsx`, and the manual-test handoff opens `tab=monitoring`.
- `components/Header.tsx`, `components/MonitoringTab.tsx`, and `components/RequestAnalyticsTab.tsx` have now been normalized to clean UTF-8 Russian copy so the separated tabs no longer show mojibake in the UI.
- The separated monitoring and analytics tabs now have explicit empty states, so users are guided when there is no history yet or when no monitors have been created.
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
- Continue `DEL-006` with the remaining monitoring-chart follow-up: a per-monitor default chart range.
- Review the separated monitoring and analytics tabs for any remaining UX duplication beyond copy cleanup and empty states, especially visual hierarchy plus the create/edit monitor flow.
- Continue dashboard productivity polish work under `DEL-006`, focusing on remaining workspace UX rough edges.
- Continue dedicated dark-theme pass under `DEL-008` after initial toggle rollout, focusing on full dashboard/workspace parity and contrast validation.
- Plan monitoring migration under `DEL-009`: replace current cron provider, update schedules/env, and validate `/api/monitor/run` trigger compatibility.
