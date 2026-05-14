# VIVA — Claude Code Instructions

## Project layout
- `src/main/` — Electron main process (git service, IPC handlers, DB, AI)
- `src/renderer/src/` — React UI (components, hooks, i18n)
- `src/shared/` — types and utilities shared across processes

## Test runner
```
npm test          # vitest run (all tests)
npx vitest run <pattern>   # run a single file or pattern
```

## Specs, plans & reports
- Feature specs: @docs/superpowers/specs/
- Implementation plans: @docs/superpowers/plans/
- Reports: @docs/superpowers/reports/

When asked to test a feature, read the matching spec from `docs/superpowers/specs/` for acceptance criteria, then write and run tests that verify those criteria.

## Testing conventions
- Main-process tests live in `src/main/**/__tests__/` — plain Vitest, mock `simpleGit` as a plain object
- Renderer tests live in `src/renderer/src/__tests__/` — `@vitest-environment jsdom`, `@testing-library/react`
- Always add `// @vitest-environment jsdom` at the top of renderer test files
- Mock `useTerms` with only the keys the component under test actually reads
- Prefer `fireEvent` over `userEvent` for simple click/change interactions
