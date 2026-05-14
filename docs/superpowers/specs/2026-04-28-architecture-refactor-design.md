# Architecture Refactor Design

## Summary

This spec defines a behavior-preserving architecture cleanup for the current VIVA app. The goal is to make the existing AI, safe upload, branch, file insight, untracked review, pull update, and weekly report features easier to test and maintain without changing the product behavior users already see.

This is not a feature expansion spec. It should not add new AI tools, new GitHub flows, new branch modes, or new UI surfaces. It should only improve boundaries, remove duplication, and make current behavior safer to preserve.

## Goals

- Keep the current app behavior intact.
- Reduce large-file complexity in `src/main/ipc/ai.ts`, `src/renderer/src/App.tsx`, and `src/main/git/service.ts`.
- Move duplicated branch-name validation into one shared module.
- Separate AI tool orchestration from Electron IPC registration.
- Separate renderer feature state into focused hooks.
- Increase confidence with tests before each refactor.
- Preserve all safe-by-default behavior from the current integration spec.

## Non-Goals

- Do not redesign the UI layout.
- Do not remove Natural Language Undo.
- Do not weaken Natural Language Undo cancellation or stale-request protection.
- Do not change AI provider behavior.
- Do not add a second API key entry path.
- Do not change GitHub credential handling.
- Do not introduce automatic default-branch upload.
- Do not introduce silent `git init`.
- Do not force-push.
- Do not convert the whole app to a new framework or state library.

## Current Pain Points

### Duplicated Branch Validation

Branch-name validation currently exists in both the main process and renderer. This duplication can drift over time, allowing a branch name to pass the UI but fail during upload or branch creation.

### Large AI IPC File

`src/main/ipc/ai.ts` still owns too much behavior. IPC registration has been partly split, but this file still contains implementation logic for multiple features:

- connection-backed AI operations
- Natural Language Undo
- File Insight
- Untracked Review
- Weekly AI Summary

The file is hard to review because transport, project lookup, Git history reading, prompt input shaping, caching, and AI tool calls sit near each other.

### Large Renderer Shell

`src/renderer/src/App.tsx` owns many independent feature states:

- active project orchestration
- pull update preview dialog state
- Natural Language Undo request state
- File Insight request state
- untracked review callback wiring
- weekly report visibility
- cloud setup modal state

The component is still usable, but every feature change risks touching the central shell.

### Large Git Service

`src/main/git/service.ts` mixes local status, staging, committing, branch management, safe upload, restore, pull preview, and untracked delete behavior. This is workable for now, but future collaboration and conflict-resolution features will be easier if branch/upload/restore helpers are split behind clear interfaces.

## Design Principles

### Behavior-Preserving First

Every refactor task must start with tests that pin current behavior. Implementation should then move code without changing user-visible behavior.

### One Boundary At A Time

Avoid a broad rewrite. Each task should isolate one boundary:

- shared validation
- one renderer hook
- one AI service boundary
- one Git helper boundary

### IPC Should Register, Services Should Work

Electron IPC files should mostly register handlers and translate request/response boundaries. Feature logic should live in main-process service modules that can be tested without IPC.

### Renderer Shell Should Orchestrate

`App.tsx` should remain the page-level coordinator, but detailed feature state should live in hooks with focused return values.

### Shared Code Must Stay Runtime-Safe

Shared modules used by both main and renderer must avoid Node-only and DOM-only dependencies. They should contain pure TypeScript helpers and shared types only.

## Proposed Architecture

### Shared Validation

Create a shared branch validation module:

- `src/shared/branchValidation.ts`

Responsibilities:

- trim and validate user-provided branch names
- reject empty branch names
- reject branch names with spaces
- reject names starting or ending with `/`
- reject `..`
- reject unsupported Git ref characters
- return stable user-facing messages

Consumers:

- `src/main/git/service.ts`
- `src/renderer/src/branchValidation.ts` or direct renderer imports
- `src/renderer/src/hooks/useCloudSetup.ts`
- `src/renderer/src/components/CloudSetupWizard/CloudSetupWizard.tsx`

The old renderer-only validation module can either re-export the shared helper or be removed once imports are updated.

### Main AI Services

Split feature logic out of `src/main/ipc/ai.ts` into focused service modules under `src/main/ai/`:

- `naturalUndoService.ts`
- `fileInsightService.ts`
- `untrackedReviewService.ts`
- `weeklySummaryService.ts`

The service modules should receive their dependencies explicitly where practical:

- project lookup
- Git service factory or local path
- manual AI tool service
- cache helpers
- AI connection state

IPC registration files should call these services rather than containing feature implementation directly.

Expected result:

- `src/main/ipc/ai.ts` becomes a composition root for AI dependencies.
- `src/main/ipc/aiConnectionHandlers.ts`, `aiSaveHandlers.ts`, `aiManualToolHandlers.ts`, and `aiWeeklyHandlers.ts` remain thin registration files.
- AI feature tests can target service modules without relying on IPC.

### Renderer Feature Hooks

Extract focused hooks from `src/renderer/src/App.tsx`:

- `useNaturalUndo.ts`
- `useFileInsight.ts`
- `usePullUpdates.ts`

Responsibilities:

- `useNaturalUndo`
  - track query result state, loading, applying, and error
  - preserve stale-request protection
  - expose suggest, apply, cancel, and select-alternative handlers

- `useFileInsight`
  - track selected file, insight, loading, and error
  - guard stale requests
  - reset when active project changes

- `usePullUpdates`
  - track preview, preview errors, dialog visibility, and last-shown remote update
  - preserve current "show incoming updates before pulling" behavior

`App.tsx` should still pass data to existing components. The visual layout should not change.

### Git Service Helpers

Split only the safest pieces first:

- shared validation in this refactor
- branch helper extraction if tests show the boundary is stable
- upload/restore extraction only after existing safe upload and restore tests are pinned

This spec does not require a full `GitService` rewrite. It permits incremental extraction when a task has tests proving no behavior changed.

## Safety Requirements

The refactor must preserve these behaviors:

- `Connect AI` remains the only official AI API key entry path.
- AI tools require a connected AI provider and selected model.
- Auto save-message assistance remains project-scoped and consent-gated.
- Natural Language Undo remains manual, previewed, and confirmation-based.
- Natural Language Undo cancellation and stale-request guards must stay intact.
- File Insight must block embedded `.git` internals and stay inside project root.
- Untracked Review must never delete files without explicit user action.
- Branch validation must run before saving or pushing collaboration branch targets.
- Default branch upload remains behind explicit danger confirmation.
- Default branch deletion remains blocked.
- `Get Updates` continues to preview incoming commits instead of silently pulling when a preview is available.

## Testing Strategy

Each refactor task must follow TDD:

1. Add or strengthen tests for the behavior being moved.
2. Run the test and verify it fails only when appropriate.
3. Move the implementation behind the new boundary.
4. Run the targeted test.
5. Run a broader related test group.
6. Commit the task independently.

Required coverage areas:

- shared branch validation in main and renderer consumers
- Natural Language Undo cancellation, stale request handling, alternative selection, and apply flow
- File Insight root/path safety and error states
- Untracked Review generated-file detection and explicit delete behavior
- Weekly summary cache behavior and deterministic fallback
- Pull update preview visibility and pull execution behavior
- Safe upload branch validation and PR handoff result

Final verification:

- `npm test`
- `npm run typecheck`

## Migration Order

1. Move branch validation to shared code.
2. Extract renderer hooks from `App.tsx`.
3. Extract AI services from `src/main/ipc/ai.ts`.
4. Extract narrow Git helpers only where tests are already strong.
5. Run full verification and update the feature matrix if boundaries changed.

This order keeps the riskiest main-process service split behind existing test coverage and reduces renderer coordination complexity before deeper service work.

## Acceptance Criteria

- Current tests pass after every task.
- New tests cover each extracted boundary.
- `src/main/ipc/ai.ts` no longer owns detailed feature implementation for all AI tools.
- `src/renderer/src/App.tsx` delegates Natural Undo, File Insight, and Pull Updates state to hooks.
- Branch-name validation has one source of truth.
- No current product feature is removed.
- The final branch passes `npm test` and `npm run typecheck`.
