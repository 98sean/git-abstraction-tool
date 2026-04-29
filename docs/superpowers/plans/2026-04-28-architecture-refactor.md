# Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the current app architecture without changing user-visible behavior, making AI, renderer orchestration, branch validation, and Git helpers easier to test and maintain.

**Architecture:** Move one boundary at a time. Start with shared pure validation, then extract renderer state hooks, then move AI feature logic out of IPC into services, and only then extract narrow Git helpers where tests already pin behavior. IPC remains a thin transport layer and `App.tsx` remains the page coordinator.

**Tech Stack:** Electron, React, TypeScript, Vitest, simple-git, Electron IPC.

---

## File Map

### Docs

- Existing spec: `docs/superpowers/specs/2026-04-28-architecture-refactor-design.md`
- This plan: `docs/superpowers/plans/2026-04-28-architecture-refactor.md`

### Shared

- Create: `src/shared/branchValidation.ts`
- Modify or remove: `src/renderer/src/branchValidation.ts`

### Main Process

- Modify: `src/main/git/service.ts`
- Modify: `src/main/git/__tests__/branchValidation.test.ts`
- Modify: `src/main/ipc/ai.ts`
- Create: `src/main/ai/naturalUndoService.ts`
- Create: `src/main/ai/fileInsightService.ts`
- Create: `src/main/ai/untrackedReviewService.ts`
- Create: `src/main/ai/weeklySummaryService.ts`
- Create or modify: `src/main/ai/__tests__/naturalUndoService.test.ts`
- Modify: `src/main/ai/__tests__/fileInsightSafety.test.ts`
- Modify: `src/main/ai/__tests__/weeklySummary.test.ts`
- Modify: `src/main/git/__tests__/safeUpload.test.ts`
- Modify: `src/main/git/__tests__/untrackedDelete.test.ts`

### Renderer

- Modify: `src/renderer/src/App.tsx`
- Create: `src/renderer/src/hooks/useNaturalUndo.ts`
- Create: `src/renderer/src/hooks/useFileInsight.ts`
- Create: `src/renderer/src/hooks/usePullUpdates.ts`
- Modify: `src/renderer/src/hooks/useCloudSetup.ts`
- Modify: `src/renderer/src/components/CloudSetupWizard/CloudSetupWizard.tsx`
- Modify: `src/renderer/src/__tests__/CloudSetupWizard.test.tsx`
- Modify: `src/renderer/src/__tests__/ActionPanel.naturalUndo.test.tsx`
- Modify: `src/renderer/src/__tests__/FileInsightPanel.test.tsx`
- Modify: `src/renderer/src/__tests__/FileManager.untrackedReview.test.tsx`
- Modify: `src/renderer/src/__tests__/WeeklyReport.test.tsx`

---

## Task 1: Shared Branch Validation

**Files:**
- Create: `src/shared/branchValidation.ts`
- Modify: `src/main/git/service.ts`
- Modify: `src/main/git/__tests__/branchValidation.test.ts`
- Modify: `src/renderer/src/branchValidation.ts`
- Modify: `src/renderer/src/__tests__/CloudSetupWizard.test.tsx`

- [ ] **Step 1: Write or strengthen failing shared validation tests**

Move the current validation expectations into a test that imports the future shared helper.

```ts
import { describe, expect, it } from 'vitest'
import { validateBranchName } from '../../../shared/branchValidation'

describe('validateBranchName', () => {
  it('rejects branch names with spaces', () => {
    expect(validateBranchName('test and fix')).toEqual({
      ok: false,
      message: 'Branch names cannot contain spaces.'
    })
  })

  it('accepts slash-separated work branches', () => {
    expect(validateBranchName('tony/test-upload')).toEqual({ ok: true, message: null })
  })
})
```

- [ ] **Step 2: Run the failing shared validation test**

Run: `npm test -- src/main/git/__tests__/branchValidation.test.ts`

Expected: FAIL because `src/shared/branchValidation.ts` does not exist yet.

- [ ] **Step 3: Create the shared helper**

Create `src/shared/branchValidation.ts`:

```ts
export interface BranchNameValidation {
  ok: boolean
  message: string | null
}

export function validateBranchName(name: string): BranchNameValidation {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, message: 'Choose a branch name.' }
  if (/\s/.test(trimmed)) return { ok: false, message: 'Branch names cannot contain spaces.' }
  if (trimmed.startsWith('/') || trimmed.endsWith('/')) {
    return { ok: false, message: 'Branch names cannot start or end with "/".' }
  }
  if (trimmed.includes('..')) return { ok: false, message: 'Branch names cannot contain "..".' }
  if (/[\x00-\x20~^:?*[\\]/.test(trimmed)) {
    return { ok: false, message: 'Branch name contains unsupported characters.' }
  }
  return { ok: true, message: null }
}
```

- [ ] **Step 4: Re-export or update imports**

Either replace `src/renderer/src/branchValidation.ts` with:

```ts
export { validateBranchName } from '../../shared/branchValidation'
export type { BranchNameValidation } from '../../shared/branchValidation'
```

or update renderer imports directly to `src/shared/branchValidation.ts` if the project path aliases already support it.

- [ ] **Step 5: Update main imports**

Remove the local `validateBranchName` implementation from `src/main/git/service.ts` and import from the shared module.

- [ ] **Step 6: Run targeted tests**

Run:

```bash
npm test -- src/main/git/__tests__/branchValidation.test.ts src/renderer/src/__tests__/CloudSetupWizard.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/shared/branchValidation.ts src/main/git/service.ts src/main/git/__tests__/branchValidation.test.ts src/renderer/src/branchValidation.ts src/renderer/src/__tests__/CloudSetupWizard.test.tsx
git commit -m "refactor: share branch name validation"
```

---

## Task 2: Extract Natural Undo Renderer State

**Files:**
- Create: `src/renderer/src/hooks/useNaturalUndo.ts`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/__tests__/ActionPanel.naturalUndo.test.tsx`

- [ ] **Step 1: Strengthen existing Natural Undo cancellation test**

Ensure tests cover:

- entering a query and requesting a suggestion
- canceling clears query/suggestion/error state
- stale request results do not overwrite state after cancel
- alternative selection still promotes the selected alternative

If stale request behavior is not currently testable through the UI, add a hook-level test only if the existing test harness supports it; otherwise keep the component test focused on the visible cancel behavior.

- [ ] **Step 2: Run the targeted Natural Undo test**

Run: `npm test -- src/renderer/src/__tests__/ActionPanel.naturalUndo.test.tsx`

Expected: PASS before refactor. If it fails, fix the test or current behavior before extracting.

- [ ] **Step 3: Create `useNaturalUndo`**

Create a hook that accepts:

```ts
interface UseNaturalUndoOptions {
  activeProjectId: string | null
  invokeDb: typeof import('../ipc').invokeDb
  refresh: () => Promise<void>
  addToast: (message: string, tone?: 'success' | 'error' | 'info') => void
}
```

Return:

```ts
{
  suggestion,
  loading,
  applying,
  error,
  suggest,
  apply,
  cancel,
  selectAlternative,
  reset
}
```

Preserve the current request-id stale guard with `useRef`.

- [ ] **Step 4: Move Natural Undo state from `App.tsx` into the hook**

Remove Natural Undo state and handlers from `App.tsx`, then wire the returned hook values into `ActionPanel`.

- [ ] **Step 5: Run targeted tests**

Run: `npm test -- src/renderer/src/__tests__/ActionPanel.naturalUndo.test.tsx`

Expected: PASS.

- [ ] **Step 6: Run renderer smoke group**

Run:

```bash
npm test -- src/renderer/src/__tests__/ActionPanel.naturalUndo.test.tsx src/renderer/src/__tests__/ActionPanel.autoSaveMessage.test.tsx src/renderer/src/__tests__/TeamUploadHandoff.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/hooks/useNaturalUndo.ts src/renderer/src/App.tsx src/renderer/src/__tests__/ActionPanel.naturalUndo.test.tsx
git commit -m "refactor: extract natural undo renderer state"
```

---

## Task 3: Extract File Insight Renderer State

**Files:**
- Create: `src/renderer/src/hooks/useFileInsight.ts`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/__tests__/FileInsightPanel.test.tsx`

- [ ] **Step 1: Strengthen File Insight state tests**

Ensure tests cover:

- loading state while insight is requested
- error state when the request fails
- clearing selected file resets visible insight

- [ ] **Step 2: Run the targeted test before refactor**

Run: `npm test -- src/renderer/src/__tests__/FileInsightPanel.test.tsx`

Expected: PASS before refactor.

- [ ] **Step 3: Create `useFileInsight`**

The hook should own:

- `selectedFilePath`
- `fileInsight`
- `fileInsightLoading`
- `fileInsightError`
- stale request guard
- `selectFile`
- `clear`
- `reset`

- [ ] **Step 4: Wire `App.tsx` to the hook**

Remove equivalent state and request logic from `App.tsx`. Keep existing props to `FileManager` and `FileInsightPanel`.

- [ ] **Step 5: Run targeted tests**

Run: `npm test -- src/renderer/src/__tests__/FileInsightPanel.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/hooks/useFileInsight.ts src/renderer/src/App.tsx src/renderer/src/__tests__/FileInsightPanel.test.tsx
git commit -m "refactor: extract file insight renderer state"
```

---

## Task 4: Extract Pull Update Renderer State

**Files:**
- Create: `src/renderer/src/hooks/usePullUpdates.ts`
- Modify: `src/renderer/src/App.tsx`
- Modify or create: `src/renderer/src/__tests__/PullUpdatesDialog.test.tsx`

- [ ] **Step 1: Add or strengthen pull preview tests**

Cover:

- incoming remote updates show the preview dialog
- repeated polling for the same remote hash does not re-open the same dialog
- user can continue to pull after preview
- preview errors are visible

- [ ] **Step 2: Run the pull update tests**

Run: `npm test -- src/renderer/src/__tests__/PullUpdatesDialog.test.tsx`

Expected: PASS if an existing test already covers this, otherwise FAIL until the test harness is completed.

- [ ] **Step 3: Create `usePullUpdates`**

The hook should own:

- `pullPreview`
- `pullPreviewError`
- `showPullUpdatesDialog`
- `lastShownPullUpdateRef`
- `checkForIncomingUpdates`
- `confirmPull`
- `dismissPreview`
- `reset`

- [ ] **Step 4: Wire `App.tsx` to the hook**

Remove pull preview state and effects from `App.tsx`. Keep `PullUpdatesDialog` props stable.

- [ ] **Step 5: Run targeted tests**

Run: `npm test -- src/renderer/src/__tests__/PullUpdatesDialog.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/hooks/usePullUpdates.ts src/renderer/src/App.tsx src/renderer/src/__tests__/PullUpdatesDialog.test.tsx
git commit -m "refactor: extract pull update renderer state"
```

---

## Task 5: Extract File Insight Main Service

**Files:**
- Create: `src/main/ai/fileInsightService.ts`
- Modify: `src/main/ipc/ai.ts`
- Modify: `src/main/ai/__tests__/fileInsightSafety.test.ts`

- [ ] **Step 1: Strengthen service-level file insight tests**

Cover:

- rejects paths outside project root
- rejects embedded `.git` internal paths
- sends bounded file snippets
- includes recent file commits when available
- returns clear errors for unreadable files

- [ ] **Step 2: Run targeted tests before extraction**

Run: `npm test -- src/main/ai/__tests__/fileInsightSafety.test.ts`

Expected: PASS before refactor.

- [ ] **Step 3: Create `fileInsightService.ts`**

Move only file insight input collection and AI call orchestration from `src/main/ipc/ai.ts`. Keep existing prompt behavior intact.

Expose:

```ts
export async function generateFileInsight(input: GenerateFileInsightInput): Promise<FileInsight>
```

- [ ] **Step 4: Wire IPC to service**

Update `src/main/ipc/ai.ts` so `ai:file:insight` delegates to `generateFileInsight`.

- [ ] **Step 5: Run targeted tests**

Run: `npm test -- src/main/ai/__tests__/fileInsightSafety.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/ai/fileInsightService.ts src/main/ipc/ai.ts src/main/ai/__tests__/fileInsightSafety.test.ts
git commit -m "refactor: extract file insight service"
```

---

## Task 6: Extract Natural Undo Main Service

**Files:**
- Create: `src/main/ai/naturalUndoService.ts`
- Create or modify: `src/main/ai/__tests__/naturalUndoService.test.ts`
- Modify: `src/main/ipc/ai.ts`
- Modify: `src/main/git/__tests__/safeUpload.test.ts`

- [ ] **Step 1: Add Natural Undo service tests**

Cover:

- chooses from recent timeline entries
- uses stored AI commit summaries when available
- preserves alternatives
- rejects no-op restore candidates
- returns preview files before apply

- [ ] **Step 2: Run the new test to verify it fails**

Run: `npm test -- src/main/ai/__tests__/naturalUndoService.test.ts`

Expected: FAIL because the service module does not exist.

- [ ] **Step 3: Create `naturalUndoService.ts`**

Move suggestion orchestration out of `src/main/ipc/ai.ts`. Keep apply/restore behavior wired through existing Git service methods.

- [ ] **Step 4: Wire IPC to service**

Update `ai:undo:suggest` and any related apply handler to call the service boundary.

- [ ] **Step 5: Run related tests**

Run:

```bash
npm test -- src/main/ai/__tests__/naturalUndoService.test.ts src/main/git/__tests__/safeUpload.test.ts src/renderer/src/__tests__/ActionPanel.naturalUndo.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/ai/naturalUndoService.ts src/main/ai/__tests__/naturalUndoService.test.ts src/main/ipc/ai.ts src/main/git/__tests__/safeUpload.test.ts
git commit -m "refactor: extract natural undo service"
```

---

## Task 7: Extract Untracked Review Main Service

**Files:**
- Create: `src/main/ai/untrackedReviewService.ts`
- Modify: `src/main/ipc/ai.ts`
- Modify: `src/renderer/src/__tests__/FileManager.untrackedReview.test.tsx`
- Modify: `src/main/git/__tests__/untrackedDelete.test.ts`

- [ ] **Step 1: Strengthen untracked review tests**

Cover:

- deterministic generated/cache/dependency recommendations
- AI review for unresolved files
- explicit delete only
- deleted items are removed from the review UI without re-running analysis

- [ ] **Step 2: Run targeted tests before extraction**

Run:

```bash
npm test -- src/renderer/src/__tests__/FileManager.untrackedReview.test.tsx src/main/git/__tests__/untrackedDelete.test.ts
```

Expected: PASS.

- [ ] **Step 3: Create `untrackedReviewService.ts`**

Move untracked review classification and AI orchestration out of `src/main/ipc/ai.ts`.

- [ ] **Step 4: Wire IPC to service**

Update `ai:untracked:review` to delegate to the service.

- [ ] **Step 5: Run targeted tests**

Run:

```bash
npm test -- src/renderer/src/__tests__/FileManager.untrackedReview.test.tsx src/main/git/__tests__/untrackedDelete.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/ai/untrackedReviewService.ts src/main/ipc/ai.ts src/renderer/src/__tests__/FileManager.untrackedReview.test.tsx src/main/git/__tests__/untrackedDelete.test.ts
git commit -m "refactor: extract untracked review service"
```

---

## Task 8: Extract Weekly Summary Main Service

**Files:**
- Create: `src/main/ai/weeklySummaryService.ts`
- Modify: `src/main/ipc/ai.ts`
- Modify: `src/main/ai/__tests__/weeklySummary.test.ts`
- Modify: `src/renderer/src/__tests__/WeeklyReport.test.tsx`

- [ ] **Step 1: Strengthen weekly summary tests**

Cover:

- deterministic fallback remains available without AI summary
- cache key includes week, model, commit signature, and AI-summary count
- cached summaries are reused when inputs are unchanged
- changed commit signature invalidates cache

- [ ] **Step 2: Run targeted tests before extraction**

Run:

```bash
npm test -- src/main/ai/__tests__/weeklySummary.test.ts src/renderer/src/__tests__/WeeklyReport.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Create `weeklySummaryService.ts`**

Move weekly summary orchestration, stats construction, summary cache lookup, and cache write behavior out of `src/main/ipc/ai.ts`.

- [ ] **Step 4: Wire IPC to service**

Update `ai:weekly:summary` registration to call the new service.

- [ ] **Step 5: Run targeted tests**

Run:

```bash
npm test -- src/main/ai/__tests__/weeklySummary.test.ts src/renderer/src/__tests__/WeeklyReport.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/ai/weeklySummaryService.ts src/main/ipc/ai.ts src/main/ai/__tests__/weeklySummary.test.ts src/renderer/src/__tests__/WeeklyReport.test.tsx
git commit -m "refactor: extract weekly summary service"
```

---

## Task 9: Extract Narrow Git Helpers

**Files:**
- Create as needed: `src/main/git/branchService.ts`
- Create as needed: `src/main/git/uploadService.ts`
- Modify: `src/main/git/service.ts`
- Modify: `src/main/git/__tests__/branchValidation.test.ts`
- Modify: `src/main/git/__tests__/safeUpload.test.ts`
- Modify: `src/main/git/__tests__/untrackedDelete.test.ts`

- [ ] **Step 1: Identify the smallest extraction**

Start with the safest boundary:

- branch validation and branch operation helpers if Task 1 left them clean
- upload helper only if `safeUpload.test.ts` covers all branch-mode behavior

Do not extract restore logic unless Natural Undo and safe upload tests already pass after Task 6.

- [ ] **Step 2: Run current Git tests before extraction**

Run:

```bash
npm test -- src/main/git/__tests__/branchValidation.test.ts src/main/git/__tests__/safeUpload.test.ts src/main/git/__tests__/untrackedDelete.test.ts src/main/git/__tests__/errors.test.ts
```

Expected: PASS.

- [ ] **Step 3: Move one helper boundary**

Prefer small pure helpers or class collaborators. Keep `GitService` public methods stable so IPC and renderer code do not change.

- [ ] **Step 4: Run Git tests**

Run:

```bash
npm test -- src/main/git/__tests__/branchValidation.test.ts src/main/git/__tests__/safeUpload.test.ts src/main/git/__tests__/untrackedDelete.test.ts src/main/git/__tests__/errors.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/git src/main/git/__tests__
git commit -m "refactor: extract git service helpers"
```

---

## Task 10: Final Verification And Documentation Update

**Files:**
- Modify if needed: `docs/superpowers/reports/2026-04-27-feature-test-matrix.md`
- Modify if needed: `docs/superpowers/specs/2026-04-16-ai-cloud-safe-linking-integration-design.md`
- Modify if needed: `docs/superpowers/specs/2026-04-28-architecture-refactor-design.md`

- [ ] **Step 1: Run full tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Inspect large-file improvement**

Run:

```bash
wc -l src/main/ipc/ai.ts src/renderer/src/App.tsx src/main/git/service.ts
```

Expected: `src/main/ipc/ai.ts` and `src/renderer/src/App.tsx` are materially smaller than before. `src/main/git/service.ts` may still be large if only narrow helpers were safely extracted.

- [ ] **Step 4: Update docs if behavior or boundaries changed**

Only update docs if the final code differs from this plan or if a boundary was intentionally deferred.

- [ ] **Step 5: Commit final docs if needed**

```bash
git add docs/superpowers
git commit -m "docs: update architecture refactor notes"
```

---

## Execution Notes

- Execute tasks in order.
- Use TDD for every task.
- Do not merge behavior changes into refactor commits.
- If a task reveals missing behavior coverage, add tests before moving code.
- If an extraction requires changing public behavior, stop and update the spec before continuing.
- If Natural Language Undo cancellation or stale-request behavior becomes unclear, preserve the current safer implementation rather than adopting the removal commit.
