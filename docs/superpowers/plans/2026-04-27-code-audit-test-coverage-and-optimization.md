# Code Audit, Test Coverage, And Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify every current app feature with a clear test path and make targeted code optimizations that improve safety, maintainability, and testability.

**Architecture:** Work feature-group by feature-group. Add or improve tests first, then make the smallest implementation or refactor needed to pass and improve structure. Avoid broad rewrites; optimize only where tests reveal brittle boundaries or known gaps from the spec.

**Tech Stack:** Electron, React, TypeScript, Vitest, simple-git, Electron IPC.

---

## File Map

### Spec And Planning

- Modify: `docs/superpowers/specs/2026-04-16-ai-cloud-safe-linking-integration-design.md`
- Create: `docs/superpowers/plans/2026-04-27-code-audit-test-coverage-and-optimization.md`

### Main Process

- Modify: `src/main/git/errors.ts`
  - Add clearer non-fast-forward and diverged branch classification.
- Modify: `src/main/git/types.ts`
  - Add or refine error/result types only if tests require it.
- Modify: `src/main/git/service.ts`
  - Add branch-name validation and push result plumbing.
- Modify: `src/main/ipc/git.ts`
  - Return push result data to renderer where needed.
- Modify: `src/main/ipc/ai.ts`
  - Split only if a task needs it; otherwise keep behavior stable.
- Create as needed: `src/main/ai/*Handler.ts` or `src/main/ai/*Service.ts`
  - Only when extracting testable AI boundaries from `ipc/ai.ts`.

### Renderer

- Modify: `src/renderer/src/hooks/useCloudSetup.ts`
  - Validate branch names before saving team upload target.
- Modify: `src/renderer/src/hooks/useGitActions.ts`
  - Preserve push result data for PR handoff.
- Modify: `src/renderer/src/App.tsx`
  - Display PR handoff after successful team upload.
- Modify: `src/renderer/src/components/CloudSetupWizard/CloudSetupWizard.tsx`
  - Surface validation feedback.
- Modify: `src/renderer/src/components/ActionPanel/ActionPanel.tsx`
  - Surface push result / PR handoff if needed.
- Modify: `src/renderer/src/components/FileInsightPanel/FileInsightPanel.tsx`
  - Improve file insight error/fallback copy if needed.
- Modify: `src/renderer/src/components/FileManager/FileManager.tsx`
  - Improve dependency visibility copy if needed.
- Modify: `src/renderer/src/components/WeeklyReport/WeeklyReport.tsx`
  - Ensure fallback and AI summary states are testable.

### Tests

- Create or modify: `src/main/git/__tests__/branchValidation.test.ts`
- Modify: `src/main/git/__tests__/errors.test.ts`
- Modify: `src/main/git/__tests__/safeUpload.test.ts`
- Create or modify: `src/main/ai/__tests__/fileInsightSafety.test.ts`
- Create or modify: `src/main/ai/__tests__/weeklySummary.test.ts`
- Modify: `src/renderer/src/__tests__/CloudSetupWizard.test.tsx`
- Create or modify: `src/renderer/src/__tests__/TeamUploadHandoff.test.tsx`
- Modify: `src/renderer/src/__tests__/FileInsightPanel.test.tsx`
- Modify: `src/renderer/src/__tests__/FileManager.untrackedReview.test.tsx`
- Create or modify: `src/renderer/src/__tests__/WeeklyReport.test.tsx`

---

## Task 1: Branch Name Validation

**Files:**
- Create: `src/main/git/__tests__/branchValidation.test.ts`
- Modify: `src/main/git/service.ts`
- Modify: `src/renderer/src/hooks/useCloudSetup.ts`
- Modify: `src/renderer/src/components/CloudSetupWizard/CloudSetupWizard.tsx`
- Modify: `src/renderer/src/__tests__/CloudSetupWizard.test.tsx`

- [ ] **Step 1: Write failing main-process validation tests**

Add tests for invalid branch names:

```ts
import { describe, expect, it } from 'vitest'
import { validateBranchName } from '../service'

describe('branch name validation', () => {
  it('rejects branch names with spaces', () => {
    expect(validateBranchName('test and fix').ok).toBe(false)
  })

  it('accepts slash-separated work branches', () => {
    expect(validateBranchName('tony/test-upload').ok).toBe(true)
  })
})
```

- [ ] **Step 2: Run failing validation tests**

Run: `npm test -- src/main/git/__tests__/branchValidation.test.ts`

Expected: FAIL because `validateBranchName` does not exist.

- [ ] **Step 3: Implement minimal branch validation**

Add an exported helper in `src/main/git/service.ts` or a small focused module if cleaner:

```ts
export function validateBranchName(name: string): { ok: boolean; message: string | null } {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, message: 'Choose a branch name.' }
  if (/\s/.test(trimmed)) return { ok: false, message: 'Branch names cannot contain spaces.' }
  if (trimmed.startsWith('/') || trimmed.endsWith('/')) return { ok: false, message: 'Branch names cannot start or end with "/".' }
  if (trimmed.includes('..')) return { ok: false, message: 'Branch names cannot contain "..".' }
  if (/[\x00-\x20~^:?*[\\]/.test(trimmed)) return { ok: false, message: 'Branch name contains unsupported characters.' }
  return { ok: true, message: null }
}
```

- [ ] **Step 4: Run validation tests**

Run: `npm test -- src/main/git/__tests__/branchValidation.test.ts`

Expected: PASS.

- [ ] **Step 5: Add renderer validation test**

Update `CloudSetupWizard` or `useCloudSetup` tests so entering `test and fix` blocks saving with a clear message.

- [ ] **Step 6: Implement renderer validation**

Use the same validation rule or mirrored helper before `cloud:collaboration:set`.

- [ ] **Step 7: Run related tests**

Run:

```bash
npm test -- src/main/git/__tests__/branchValidation.test.ts src/renderer/src/__tests__/CloudSetupWizard.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/main/git src/renderer/src/hooks/useCloudSetup.ts src/renderer/src/components/CloudSetupWizard src/renderer/src/__tests__/CloudSetupWizard.test.tsx
git commit -m "fix: validate collaboration branch names"
```

---

## Task 2: Team Upload PR Handoff

**Files:**
- Modify: `src/main/ipc/git.ts`
- Modify: `src/renderer/src/hooks/useGitActions.ts`
- Modify: `src/renderer/src/App.tsx`
- Create or modify: `src/renderer/src/__tests__/TeamUploadHandoff.test.tsx`
- Modify: `src/main/git/__tests__/safeUpload.test.ts`

- [ ] **Step 1: Write failing renderer test**

Add a test that stubs `git:push` returning `{ prUrl: 'https://github.com/org/repo/compare/branch?expand=1' }` and expects the UI to expose an `Open PR` or GitHub compare action.

- [ ] **Step 2: Run failing renderer test**

Run: `npm test -- src/renderer/src/__tests__/TeamUploadHandoff.test.tsx`

Expected: FAIL because push result is currently discarded.

- [ ] **Step 3: Preserve push result in hook**

Change `useGitActions.push` to return the push result while preserving existing boolean success behavior where needed. Prefer a small return object:

```ts
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: GitError }
```

Keep call sites minimal.

- [ ] **Step 4: Render handoff**

After successful team upload with `prUrl`, show a toast or inline action:

- `Open pull request`
- `Copy branch name`
- `Uploaded branch <name>`

- [ ] **Step 5: Run related tests**

Run:

```bash
npm test -- src/main/git/__tests__/safeUpload.test.ts src/renderer/src/__tests__/TeamUploadHandoff.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/ipc/git.ts src/renderer/src/hooks/useGitActions.ts src/renderer/src/App.tsx src/renderer/src/__tests__/TeamUploadHandoff.test.tsx src/main/git/__tests__/safeUpload.test.ts
git commit -m "feat: show pull request handoff after upload"
```

---

## Task 3: Collaboration Error Mapping

**Files:**
- Modify: `src/main/git/errors.ts`
- Modify: `src/main/git/__tests__/errors.test.ts`
- Modify as needed: `src/renderer/src/components/ActionPanel/ActionPanel.tsx`

- [ ] **Step 1: Write failing error mapping tests**

Add cases for:

- non-fast-forward
- fetch first
- remote contains work
- diverged branch

Example:

```ts
expect(mapGitError({ message: 'Updates were rejected because the remote contains work that you do not have locally.' }).code).toBe('REMOTE_AHEAD')
```

- [ ] **Step 2: Run failing tests**

Run: `npm test -- src/main/git/__tests__/errors.test.ts`

Expected: FAIL because codes are not mapped.

- [ ] **Step 3: Add codes and messages**

Add specific codes and user-facing messages that explain:

- get updates first
- use a new branch if unsure
- no force push will happen

- [ ] **Step 4: Run tests**

Run: `npm test -- src/main/git/__tests__/errors.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/git/errors.ts src/main/git/__tests__/errors.test.ts
git commit -m "fix: explain remote branch divergence"
```

---

## Task 4: File Insight Safety And Fallback

**Files:**
- Create or modify: `src/main/ai/__tests__/fileInsightSafety.test.ts`
- Modify: `src/main/ipc/ai.ts`
- Modify: `src/main/ai/manualToolService.ts`
- Modify: `src/renderer/src/components/FileInsightPanel/FileInsightPanel.tsx`

- [ ] **Step 1: Write failing safety tests**

Cover:

- binary file rejected before AI call
- oversized text file gets a bounded snippet
- structured JSON failure yields a useful fallback/error state

- [ ] **Step 2: Run failing tests**

Run: `npm test -- src/main/ai/__tests__/fileInsightSafety.test.ts`

Expected: FAIL until safety helpers exist.

- [ ] **Step 3: Extract file insight input builder**

Move file-read/snippet/type guard logic out of `src/main/ipc/ai.ts` into a focused helper.

- [ ] **Step 4: Implement safety rules**

Rules:

- reject likely binary files with a clear message
- cap text snippets
- keep paths constrained inside project root

- [ ] **Step 5: Run related tests**

Run:

```bash
npm test -- src/main/ai/__tests__/fileInsightSafety.test.ts src/renderer/src/__tests__/FileInsightPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/ai src/main/ipc/ai.ts src/renderer/src/components/FileInsightPanel src/renderer/src/__tests__/FileInsightPanel.test.tsx
git commit -m "fix: harden file insight analysis inputs"
```

---

## Task 5: Untracked Review Delete Safety

**Files:**
- Modify: `src/main/git/service.ts`
- Create or modify: `src/main/git/__tests__/untrackedDelete.test.ts`
- Modify: `src/renderer/src/__tests__/FileManager.untrackedReview.test.tsx`

- [ ] **Step 1: Write failing delete safety tests**

Cover:

- path outside project root is rejected
- tracked file cannot be deleted through untracked delete
- only explicit selected delete recommendations are deleted

- [ ] **Step 2: Run failing tests**

Run: `npm test -- src/main/git/__tests__/untrackedDelete.test.ts`

Expected: FAIL if helper coverage is missing.

- [ ] **Step 3: Implement or expose testable helpers**

Keep delete logic path-constrained and status-constrained.

- [ ] **Step 4: Run related tests**

Run:

```bash
npm test -- src/main/git/__tests__/untrackedDelete.test.ts src/renderer/src/__tests__/FileManager.untrackedReview.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/git/service.ts src/main/git/__tests__/untrackedDelete.test.ts src/renderer/src/__tests__/FileManager.untrackedReview.test.tsx
git commit -m "test: cover untracked delete safety"
```

---

## Task 6: Weekly Report Coverage

**Files:**
- Create or modify: `src/renderer/src/__tests__/WeeklyReport.test.tsx`
- Create or modify: `src/main/ai/__tests__/weeklySummary.test.ts`
- Modify: `src/renderer/src/components/WeeklyReport/WeeklyReport.tsx`
- Modify: `src/main/ai/manualToolService.ts`

- [ ] **Step 1: Write failing renderer tests**

Cover:

- deterministic summary shown when AI disconnected
- AI loading state
- AI enhanced summary shown when available
- empty week state

- [ ] **Step 2: Run failing renderer test**

Run: `npm test -- src/renderer/src/__tests__/WeeklyReport.test.tsx`

Expected: FAIL until test harness/mock setup is complete.

- [ ] **Step 3: Add main AI weekly summary tests**

Cover prompt contract and normalization for feature summary response.

- [ ] **Step 4: Run related tests**

Run:

```bash
npm test -- src/renderer/src/__tests__/WeeklyReport.test.tsx src/main/ai/__tests__/weeklySummary.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/__tests__/WeeklyReport.test.tsx src/main/ai/__tests__/weeklySummary.test.ts src/renderer/src/components/WeeklyReport src/main/ai/manualToolService.ts
git commit -m "test: cover weekly report states"
```

---

## Task 7: AI IPC Boundary Split

**Files:**
- Modify: `src/main/ipc/ai.ts`
- Create: `src/main/ipc/aiConnectionHandlers.ts`
- Create: `src/main/ipc/aiSaveHandlers.ts`
- Create: `src/main/ipc/aiManualToolHandlers.ts`
- Create: `src/main/ipc/aiWeeklyHandlers.ts`
- Modify: `src/main/ipc/index.ts`
- Existing tests should continue to pass.

- [ ] **Step 1: Add safety net run**

Run: `npm test -- src/main/ai src/renderer/src/__tests__/ActionPanel.autoSaveMessage.test.tsx`

Expected: PASS before refactor.

- [ ] **Step 2: Extract connection/settings handlers**

Move:

- `ai:connection:get`
- `ai:connection:connect`
- `ai:connection:disconnect`
- `ai:connection:model:set`
- `ai:project-settings:get`
- `ai:project-settings:set`

- [ ] **Step 3: Run tests**

Run: `npm test -- src/main/ai src/renderer/src/__tests__/ConnectAI.test.tsx src/renderer/src/__tests__/ProjectSettingsPanel.test.tsx`

Expected: PASS.

- [ ] **Step 4: Extract save handlers**

Move:

- `ai:auto-save-message:generate`
- `ai:commit-suggestion`

- [ ] **Step 5: Run save tests**

Run: `npm test -- src/main/ai/__tests__/service.test.ts src/main/ai/__tests__/autoSaveMessage.test.ts src/renderer/src/__tests__/ActionPanel.autoSaveMessage.test.tsx`

Expected: PASS.

- [ ] **Step 6: Extract manual tool and weekly handlers**

Move:

- `ai:undo:suggest`
- `ai:file:insight`
- `ai:untracked:review`
- `ai:weekly:summary`

- [ ] **Step 7: Run full test suite**

Run:

```bash
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/main/ipc src/main/ai
git commit -m "refactor: split ai ipc handlers by feature"
```

---

## Task 8: Final Feature Audit And Smoke Checklist

**Files:**
- Create: `docs/superpowers/reports/2026-04-27-feature-test-matrix.md`
- Modify: `README.md`
- Modify: `docs/git-feature-guide-ko.md`

- [ ] **Step 1: Create feature-test matrix report**

Document every feature group with:

- implementation status
- automated test status
- manual smoke steps
- remaining risk

- [ ] **Step 2: Update user docs**

Clarify:

- backup vs team upload
- branch upload vs main visibility
- `Show deps` / `Hide deps`
- AI tools and required connection

- [ ] **Step 3: Run final verification**

Run:

```bash
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/reports/2026-04-27-feature-test-matrix.md README.md docs/git-feature-guide-ko.md
git commit -m "docs: add feature coverage matrix"
```

---

## Final Verification

After all tasks:

```bash
npm test
npm run typecheck
```

Expected:

- all tests pass
- no TypeScript errors
- worktree clean except intentional documentation changes

Then use `superpowers:finishing-a-development-branch`.
