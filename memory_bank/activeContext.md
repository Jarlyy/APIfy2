# Active Context

## Current Task
Migrate the repository from `pnpm` to `bun` in accordance with `AGENTS.md`, align install/run documentation, and regenerate package-manager artifacts.

## Current Findings
- `package.json` now declares `bun@1.3.10` as the canonical `packageManager`, and the direct `pnpm` dependency has been removed.
- The repository now contains `bun.lock`; the obsolete `pnpm-lock.yaml` and `.npmrc` have been removed.
- Root onboarding docs and supporting setup docs now use `bun install` and `bun dev`.
- `bun` had to be installed locally during this task to generate the new lockfile and verify the migration path.

## Decisions
- Treat the root `AGENTS.md` as the active repository rule set.
- Update only package-manager related files for this task and avoid unrelated tooling migrations.
- Prefer a full migration with regenerated artifacts instead of a metadata-only switch.

## Next Actions
- Run Biome against the changed non-Markdown files where the tool supports the file type.
- Refresh Memory Bank summaries and progress tracking to match the completed package-manager migration.
