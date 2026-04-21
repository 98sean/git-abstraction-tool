# AI, Cloud, And Safe Linking Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate AI auto-save message generation and safe project linking/upload into one mainline product where local work remains first-class, AI remains optional, and cloud upload remains explicit and safe.

**Architecture:** Keep project linking, cloud upload, AI generation, and Git operations as separate main-process services, then compose them in the renderer through one integrated app shell. Global credentials stay split (`Connect GitHub`, `Connect AI`), while project-specific AI and cloud state are presented together in a single `Project Settings` panel and routed through the existing `Save Progress` / `Upload to Cloud` entry points.

**Tech Stack:** Electron 29, React 18, TypeScript 5, electron-store, simple-git, Vitest, Testing Library, jsdom

---

## File Map

### Main process

- Create: `src/main/projectSetup/types.ts`
  Shared types for folder inspection, warnings, and link finalization input.
- Create: `src/main/projectSetup/inspectProjectFolder.ts`
  Detect Git state, remotes, risky files, and suggested ignore entries before registration.
- Create: `src/main/projectSetup/finalizeProjectLink.ts`
  Run optional `git init`, append ignore entries, and register the project only on success.
- Create: `src/main/projectSetup/__tests__/inspectProjectFolder.test.ts`
- Create: `src/main/projectSetup/__tests__/finalizeProjectLink.test.ts`
- Create: `src/main/db/projectCloudTargets.ts`
  Persist per-project backup/collaboration target metadata.
- Create: `src/main/db/__tests__/projectCloudTargets.test.ts`
- Create: `src/main/github/service.ts`
  Validate GitHub access, create backup repositories, and support branch-first collaboration setup.
- Create: `src/main/github/__tests__/service.test.ts`
- Create: `src/main/db/aiConnection.ts`
  Persist the single global AI provider/model state.
- Create: `src/main/db/projectAiSettings.ts`
  Persist project-level AI enablement and diff consent.
- Create: `src/main/db/__tests__/aiConnection.test.ts`
- Create: `src/main/db/__tests__/projectAiSettings.test.ts`
- Create: `src/main/ai/types.ts`
  Shared types for providers, connection state, generation requests, and responses.
- Create: `src/main/ai/providers/openai.ts`
  Validate key, list models, and generate save-message drafts for OpenAI.
- Create: `src/main/ai/providers/anthropic.ts`
  Validate key, list models, and generate save-message drafts for Anthropic.
- Create: `src/main/ai/buildAutoSavePrompt.ts`
  Build constrained save-message prompts from staged diff context.
- Create: `src/main/ai/service.ts`
  Orchestrate provider selection, validation, timeout handling, and message generation.
- Create: `src/main/ai/__tests__/service.test.ts`
- Create: `src/main/ai/__tests__/autoSaveMessage.test.ts`
- Create: `src/main/ipc/projectSetup.ts`
  IPC for folder inspection and safe linking finalization.
- Create: `src/main/ipc/cloud.ts`
  IPC for reading/updating cloud target state and backup/collaboration setup.
- Create: `src/main/ipc/ai.ts`
  IPC for global AI connection state, project AI settings, consent, and generation.
- Modify: `src/main/db/credentials.ts`
  Store GitHub PAT and AI API key separately via encrypted storage helpers.
- Modify: `src/main/db/projects.ts`
  Redirect stores safely under Vitest and keep project rows unchanged.
- Modify: `src/main/git/types.ts`
  Add target-aware push/pull, staged-diff context, and default-branch protection error types.
- Modify: `src/main/git/errors.ts`
  Map new Git safety errors for upload protection.
- Modify: `src/main/git/service.ts`
  Add `isRepository`, `initRepository`, remotes, ignore updates, staged diff extraction, target-aware push/pull, and PR URL helpers.
- Modify: `src/main/ipc/auth.ts`
  Strengthen GitHub PAT validation without weakening `github_pat_` support.
- Modify: `src/main/ipc/git.ts`
  Route upload/download through configured targets and safe guards instead of blind `origin`.
- Modify: `src/main/ipc/index.ts`
  Register AI, project setup, and cloud handlers.
- Modify: `src/main/ipc/projects.ts`
  Reuse a safe project registration helper and clear project AI/cloud settings when projects are removed.

### Renderer

- Create: `src/renderer/src/hooks/useProjectLinkWizard.ts`
  Manage link wizard folder inspection, init approval, warnings, and final registration.
- Create: `src/renderer/src/hooks/useCloudSetup.ts`
  Manage first cloud upload setup, backup creation, collaboration target selection, and ready state.
- Create: `src/renderer/src/hooks/useAiConnection.ts`
  Load global AI connection state and expose connect/disconnect/model selection actions.
- Create: `src/renderer/src/hooks/useProjectAiSettings.ts`
  Load/update project AI enablement and consent state.
- Create: `src/renderer/src/hooks/useAutoSaveMessage.ts`
  Request AI drafts and handle timeout/fallback behavior.
- Create: `src/renderer/src/components/ProjectLinkWizard/ProjectLinkWizard.tsx`
- Create: `src/renderer/src/components/ProjectLinkWizard/ProjectLinkWizard.module.css`
- Create: `src/renderer/src/components/CloudSetupWizard/CloudSetupWizard.tsx`
- Create: `src/renderer/src/components/CloudSetupWizard/CloudSetupWizard.module.css`
- Create: `src/renderer/src/components/DangerZoneUploadDialog/DangerZoneUploadDialog.tsx`
- Create: `src/renderer/src/components/DangerZoneUploadDialog/DangerZoneUploadDialog.module.css`
- Create: `src/renderer/src/components/ConnectAI/ConnectAI.tsx`
- Create: `src/renderer/src/components/ConnectAI/ConnectAI.module.css`
- Create: `src/renderer/src/components/AIConsentDialog/AIConsentDialog.tsx`
- Create: `src/renderer/src/components/AIConsentDialog/AIConsentDialog.module.css`
- Create: `src/renderer/src/components/ProjectSettingsPanel/ProjectSettingsPanel.tsx`
- Create: `src/renderer/src/components/ProjectSettingsPanel/ProjectSettingsPanel.module.css`
- Create: `src/renderer/src/__tests__/renderHarness.test.tsx`
- Create: `src/renderer/src/__tests__/ProjectLinkWizard.test.tsx`
- Create: `src/renderer/src/__tests__/CloudSetupWizard.test.tsx`
- Create: `src/renderer/src/__tests__/ConnectAI.test.tsx`
- Create: `src/renderer/src/__tests__/ProjectSettingsPanel.test.tsx`
- Create: `src/renderer/src/__tests__/ActionPanel.cloudSetup.test.tsx`
- Create: `src/renderer/src/__tests__/ActionPanel.autoSaveMessage.test.tsx`
- Modify: `src/renderer/src/App.tsx`
  Orchestrate all global panels, project settings, consent dialogs, and action flows.
- Modify: `src/renderer/src/App.module.css`
  Style utility panels and integrated settings presentation.
- Modify: `src/renderer/src/components/Sidebar/Sidebar.tsx`
  Launch the link wizard and expose both global connection slots.
- Modify: `src/renderer/src/components/Sidebar/Sidebar.module.css`
- Modify: `src/renderer/src/components/ActionPanel/ActionPanel.tsx`
  Integrate safe upload routing, cloud status, AI 2-step save flow, and helper text.
- Modify: `src/renderer/src/components/ActionPanel/ActionPanel.module.css`
- Modify: `src/renderer/src/components/ConnectGitHub/ConnectGitHub.tsx`
  Keep PAT guidance aligned with safe GitHub validation and existing manual connect flow.
- Modify: `src/renderer/src/hooks/useAuth.ts`
  Consume stronger GitHub validation responses.
- Modify: `src/renderer/src/hooks/useGitActions.ts`
  Allow danger-confirmed uploads and keep push/pull typed.
- Modify: `src/renderer/src/ipc.ts`
  Add typed wrappers for non-`git:*` integration flows where useful.
- Modify: `src/renderer/src/types.ts`
  Mirror AI, cloud, link-wizard, and upload types for the renderer.

### Documentation and tooling

- Modify: `package.json`
  Add renderer test dependencies for `.tsx` tests.
- Modify: `package-lock.json`
- Modify: `vitest.config.ts`
  Include renderer tests under `src/**/__tests__/**/*.test.{ts,tsx}`.
- Create: `docs/git-feature-guide-ko.md`
  Korean Git feature guide expanded to include the integrated AI/cloud/save flows.
- Modify: `README.md`
  Document safe linking, optional AI, optional cloud, and the integrated settings model.

### Worktree note

- Execute this plan in a fresh dedicated worktree created from `main`.
- Use the existing feature worktrees only as references. Do not implement the integration by manually continuing inside either old feature worktree.

---

### Task 1: Expand The Renderer Test Harness

**Files:**
- Create: `src/renderer/src/__tests__/renderHarness.test.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Write the failing renderer harness test**

```tsx
// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('renderer harness', () => {
  it('renders JSX in jsdom', () => {
    const { container } = render(<div>integration harness ready</div>)
    expect(container.textContent).toBe('integration harness ready')
  })
})
```

- [ ] **Step 2: Run the harness test to verify it fails**

Run: `npm test -- src/renderer/src/__tests__/renderHarness.test.tsx`  
Expected: FAIL because renderer `.tsx` tests are not included yet and/or renderer test deps are missing.

- [ ] **Step 3: Install renderer test dependencies and expand Vitest includes**

```bash
npm install -D @testing-library/react @testing-library/user-event jsdom
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}']
  }
})
```

- [ ] **Step 4: Re-run the harness test**

Run: `npm test -- src/renderer/src/__tests__/renderHarness.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit the harness change**

```bash
git add package.json package-lock.json vitest.config.ts src/renderer/src/__tests__/renderHarness.test.tsx
git commit -m "test: add integration renderer harness"
```

### Task 2: Build The Safe Linking Main-Process Pipeline

**Files:**
- Create: `src/main/projectSetup/types.ts`
- Create: `src/main/projectSetup/inspectProjectFolder.ts`
- Create: `src/main/projectSetup/finalizeProjectLink.ts`
- Create: `src/main/projectSetup/__tests__/inspectProjectFolder.test.ts`
- Create: `src/main/projectSetup/__tests__/finalizeProjectLink.test.ts`
- Create: `src/main/ipc/projectSetup.ts`
- Modify: `src/main/ipc/index.ts`
- Modify: `src/main/ipc/projects.ts`
- Modify: `src/main/git/service.ts`
- Modify: `src/main/db/projects.ts`
- Modify: `src/renderer/src/types.ts`

- [ ] **Step 1: Write the failing inspection and finalization tests**

```ts
import { describe, expect, it } from 'vitest'
import { inspectProjectFolder } from '../inspectProjectFolder'

describe('inspectProjectFolder', () => {
  it('reports a non-git folder and suggests init', async () => {
    const result = await inspectProjectFolder('/tmp/plain-folder')
    expect(result.isGitRepo).toBe(false)
    expect(result.canInitialize).toBe(true)
  })
})
```

```ts
import { describe, expect, it, vi } from 'vitest'
import { finalizeProjectLink } from '../finalizeProjectLink'

describe('finalizeProjectLink', () => {
  it('registers the project only after optional git init and ignore updates', async () => {
    const registerProject = vi.fn(() => ({
      project_id: 'p1',
      local_path: '/tmp/project',
      friendly_name: 'project',
      last_accessed: Date.now()
    }))

    await finalizeProjectLink(
      {
        localPath: '/tmp/project',
        friendlyName: 'project',
        shouldInitializeGit: true,
        ignoreEntries: ['.env']
      },
      { registerProject }
    )

    expect(registerProject).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `npm test -- src/main/projectSetup/__tests__/inspectProjectFolder.test.ts src/main/projectSetup/__tests__/finalizeProjectLink.test.ts`  
Expected: FAIL because the project setup pipeline does not exist yet.

- [ ] **Step 3: Implement folder inspection and safe finalization**

```ts
// src/main/projectSetup/types.ts
export interface ProjectFolderInspection {
  isGitRepo: boolean
  canInitialize: boolean
  remotes: { name: string; fetch: string; push: string }[]
  warnings: { kind: 'large' | 'binary' | 'sensitive' | 'generated'; path: string; reason: string }[]
  recommendedIgnoreEntries: string[]
}
```

```ts
// src/main/projectSetup/finalizeProjectLink.ts
export async function finalizeProjectLink(input: FinalizeProjectLinkInput): Promise<Project> {
  if (input.shouldInitializeGit) await gitService.initRepository()
  if (input.ignoreEntries.length > 0) await gitService.appendIgnoreEntries(input.ignoreEntries)
  return registerProject(input.localPath, input.friendlyName)
}
```

- [ ] **Step 4: Wire IPC and registration helpers**

```ts
// src/main/ipc/projectSetup.ts
ipcMain.handle('project-setup:inspect', (_event, localPath: string) => inspectProjectFolder(localPath))

ipcMain.handle('project-setup:finalize-link', (_event, input) =>
  finalizeProjectLink(input, { registerProject: registerProjectForUse })
)
```

- [ ] **Step 5: Re-run the tests**

Run: `npm test -- src/main/projectSetup/__tests__/inspectProjectFolder.test.ts src/main/projectSetup/__tests__/finalizeProjectLink.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit the safe linking pipeline**

```bash
git add src/main/projectSetup/types.ts src/main/projectSetup/inspectProjectFolder.ts src/main/projectSetup/finalizeProjectLink.ts src/main/projectSetup/__tests__/inspectProjectFolder.test.ts src/main/projectSetup/__tests__/finalizeProjectLink.test.ts src/main/ipc/projectSetup.ts src/main/ipc/index.ts src/main/ipc/projects.ts src/main/git/service.ts src/main/db/projects.ts src/renderer/src/types.ts
git commit -m "feat: add safe project linking pipeline"
```

### Task 3: Persist Cloud Targets And Strengthen GitHub Validation

**Files:**
- Create: `src/main/db/projectCloudTargets.ts`
- Create: `src/main/db/__tests__/projectCloudTargets.test.ts`
- Create: `src/main/github/service.ts`
- Create: `src/main/github/__tests__/service.test.ts`
- Create: `src/main/ipc/cloud.ts`
- Modify: `src/main/ipc/index.ts`
- Modify: `src/main/ipc/projects.ts`
- Modify: `src/main/db/credentials.ts`
- Modify: `src/main/ipc/auth.ts`
- Modify: `src/renderer/src/types.ts`
- Modify: `src/renderer/src/hooks/useAuth.ts`
- Modify: `src/renderer/src/components/ConnectGitHub/ConnectGitHub.tsx`

- [ ] **Step 1: Write the failing cloud-target and GitHub validation tests**

```ts
import { describe, expect, it } from 'vitest'
import { getProjectCloudTarget } from '../projectCloudTargets'

describe('projectCloudTargets', () => {
  it('defaults to no upload target', () => {
    expect(getProjectCloudTarget('p1')).toEqual({
      mode: 'none',
      backup: null,
      collaboration: null
    })
  })
})
```

```ts
import { describe, expect, it, vi } from 'vitest'
import { createGithubService } from '../service'

describe('github service', () => {
  it('accepts a fine-grained PAT after repo validation', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ login: 'tony' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ permissions: { push: true } }) }) as never

    const service = createGithubService()
    const result = await service.validateTokenForRepository({
      token: 'github_pat_123',
      owner: 'tony',
      repo: 'demo'
    })

    expect(result.status).toBe('ok')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/main/db/__tests__/projectCloudTargets.test.ts src/main/github/__tests__/service.test.ts`  
Expected: FAIL because the store and GitHub service do not exist yet.

- [ ] **Step 3: Implement the project cloud target store**

```ts
export interface ProjectCloudTarget {
  mode: 'none' | 'backup' | 'collaboration'
  backup: { remoteName: string; repoOwner: string; repoName: string; private: true } | null
  collaboration: {
    remoteName: string
    branchMode: 'new_branch' | 'existing_branch' | 'danger_default_branch'
    selectedBranch: string | null
  } | null
}
```

- [ ] **Step 4: Implement GitHub validation and target setup handlers**

```ts
// src/main/ipc/cloud.ts
ipcMain.handle('cloud:github:validate-target', async (_event, owner: string, repo: string) => {
  const token = getGithubToken()
  return githubService.validateTokenForRepository({ token, owner, repo })
})

ipcMain.handle('cloud:backup:create', async (_event, project_id: string, repoName: string) => {
  const token = getGithubToken()
  return githubService.createPrivateBackupRepository({ token, repoName })
})
```

- [ ] **Step 5: Strengthen GitHub PAT validation without weakening `github_pat_` support**

```ts
// src/main/ipc/auth.ts
ipcMain.handle('auth:token:set', async (_event, token: string) => {
  const validation = await githubService.validateToken(token)
  if (validation.status !== 'ok') throw new Error(validation.reason ?? 'Token validation failed.')
  setGithubToken(token)
  return validation
})
```

- [ ] **Step 6: Re-run the tests**

Run: `npm test -- src/main/db/__tests__/projectCloudTargets.test.ts src/main/github/__tests__/service.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit the cloud target and GitHub validation work**

```bash
git add src/main/db/projectCloudTargets.ts src/main/db/__tests__/projectCloudTargets.test.ts src/main/github/service.ts src/main/github/__tests__/service.test.ts src/main/ipc/cloud.ts src/main/ipc/index.ts src/main/ipc/projects.ts src/main/db/credentials.ts src/main/ipc/auth.ts src/renderer/src/types.ts src/renderer/src/hooks/useAuth.ts src/renderer/src/components/ConnectGitHub/ConnectGitHub.tsx
git commit -m "feat: add cloud target state and github validation"
```

### Task 4: Extend Git Helpers For Safe Uploads And AI Diff Extraction

**Files:**
- Modify: `src/main/git/service.ts`
- Modify: `src/main/git/types.ts`
- Modify: `src/main/git/errors.ts`
- Modify: `src/main/ipc/git.ts`
- Modify: `src/main/ipc/cloud.ts`
- Create: `src/main/git/__tests__/safeUpload.test.ts`
- Modify: `src/renderer/src/types.ts`

- [ ] **Step 1: Write the failing safe-upload test**

```ts
import { describe, expect, it, vi } from 'vitest'
import { GitService } from '../service'

describe('safe upload', () => {
  it('creates and pushes a new collaboration branch before returning a PR URL', async () => {
    const git = {
      checkoutLocalBranch: vi.fn(),
      push: vi.fn(),
      getRemotes: vi.fn().mockResolvedValue([
        {
          name: 'origin',
          refs: { push: 'https://github.com/tony/demo.git', fetch: 'https://github.com/tony/demo.git' }
        }
      ])
    }

    const service = new GitService('/tmp/project', git as never)
    const result = await service.pushConfiguredTarget({
      mode: 'collaboration',
      remoteName: 'origin',
      branchMode: 'new_branch',
      branchName: 'gat/update-copy'
    })

    expect(result.branchName).toBe('gat/update-copy')
  })
})
```

- [ ] **Step 2: Run the safe-upload test to verify it fails**

Run: `npm test -- src/main/git/__tests__/safeUpload.test.ts`  
Expected: FAIL because target-aware upload helpers do not exist yet.

- [ ] **Step 3: Add explicit-target upload helpers and default-branch protection**

```ts
async pushConfiguredTarget(input: PushConfiguredTargetInput): Promise<PushConfiguredTargetResult> {
  if (input.mode === 'collaboration' && input.branchMode === 'danger_default_branch' && !input.dangerConfirmed) {
    throw { code: 'DEFAULT_BRANCH_PROTECTED', message: 'Default branch upload requires danger-mode confirmation.' }
  }

  if (input.mode === 'collaboration' && input.branchMode === 'new_branch') {
    await this.git.checkoutLocalBranch(input.branchName)
    await this.git.push(input.remoteName, input.branchName, ['-u'])
    return { remoteName: input.remoteName, branchName: input.branchName, prUrl: /* GitHub compare URL */ null }
  }

  return { remoteName: input.remoteName, branchName: input.branchName, prUrl: null }
}
```

- [ ] **Step 4: Add staged diff extraction for AI prompt generation**

```ts
export interface StagedDiffContext {
  diff: string
  files: { path: string; status: FileStatusCode }[]
}

async getStagedDiffContext(): Promise<StagedDiffContext> {
  const status = await this.getStatus()
  const stagedFiles = status.files.filter((file) => file.staged)
  const diff = await this.git.diff(['--cached', '--no-ext-diff', '--minimal'])
  return { diff, files: stagedFiles.map(({ path, status }) => ({ path, status })) }
}
```

- [ ] **Step 5: Route `git:push` and `git:pull` through configured cloud targets**

```ts
// src/main/ipc/git.ts
ipcMain.handle('git:push', (_event, project_id: string, options?: PushToCloudOptions) => {
  const target = getPushTarget(project_id, getGithubToken() ?? undefined, options)
  return run(() => getGitService(project_id).pushConfiguredTarget(target))
})
```

- [ ] **Step 6: Re-run the safe-upload test**

Run: `npm test -- src/main/git/__tests__/safeUpload.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit the git helper changes**

```bash
git add src/main/git/service.ts src/main/git/types.ts src/main/git/errors.ts src/main/ipc/git.ts src/main/ipc/cloud.ts src/main/git/__tests__/safeUpload.test.ts src/renderer/src/types.ts
git commit -m "feat: add safe upload and staged diff helpers"
```

### Task 5: Persist Global AI State And Project AI Settings

**Files:**
- Create: `src/main/db/aiConnection.ts`
- Create: `src/main/db/projectAiSettings.ts`
- Create: `src/main/db/__tests__/aiConnection.test.ts`
- Create: `src/main/db/__tests__/projectAiSettings.test.ts`
- Modify: `src/main/db/credentials.ts`
- Modify: `src/main/ipc/projects.ts`
- Modify: `src/renderer/src/types.ts`

- [ ] **Step 1: Write the failing AI store tests**

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { clearAiConnectionState, getAiConnectionState, setAiConnectionState } from '../aiConnection'

describe('aiConnection store', () => {
  afterEach(() => clearAiConnectionState())

  it('stores one active provider at a time', () => {
    setAiConnectionState({
      provider: 'openai',
      selected_model: 'gpt-4.1-mini',
      available_models: ['gpt-4.1-mini'],
      last_verified_at: 1,
      connection_status: 'connected'
    })

    expect(getAiConnectionState().provider).toBe('openai')
  })
})
```

```ts
import { describe, expect, it } from 'vitest'
import { getProjectAiSettings } from '../projectAiSettings'

describe('projectAiSettings', () => {
  it('defaults to disabled and not consented', () => {
    expect(getProjectAiSettings('p1')).toEqual({
      auto_save_message_enabled: false,
      ai_diff_consent_granted: false,
      ai_diff_consent_granted_at: null
    })
  })
})
```

- [ ] **Step 2: Run the AI store tests to verify they fail**

Run: `npm test -- src/main/db/__tests__/aiConnection.test.ts src/main/db/__tests__/projectAiSettings.test.ts`  
Expected: FAIL because the stores do not exist yet.

- [ ] **Step 3: Implement encrypted AI API key storage and AI metadata stores**

```ts
// src/main/db/credentials.ts
export function setAiApiKey(apiKey: string): void { /* safeStorage encrypt */ }
export function getAiApiKey(): string | null { /* safeStorage decrypt */ }
export function clearAiApiKey(): void { /* remove stored key */ }
```

```ts
// src/main/db/projectAiSettings.ts
export interface ProjectAiSettings {
  auto_save_message_enabled: boolean
  ai_diff_consent_granted: boolean
  ai_diff_consent_granted_at: number | null
}
```

- [ ] **Step 4: Ensure project removal clears AI settings**

```ts
// src/main/ipc/projects.ts
clearProjectAiSettings(project_id)
clearProjectCloudTarget(project_id)
```

- [ ] **Step 5: Re-run the AI store tests**

Run: `npm test -- src/main/db/__tests__/aiConnection.test.ts src/main/db/__tests__/projectAiSettings.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit the AI state persistence**

```bash
git add src/main/db/aiConnection.ts src/main/db/projectAiSettings.ts src/main/db/__tests__/aiConnection.test.ts src/main/db/__tests__/projectAiSettings.test.ts src/main/db/credentials.ts src/main/ipc/projects.ts src/renderer/src/types.ts
git commit -m "feat: persist ai connection and project settings"
```

### Task 6: Implement AI Provider Services And IPC

**Files:**
- Create: `src/main/ai/types.ts`
- Create: `src/main/ai/providers/openai.ts`
- Create: `src/main/ai/providers/anthropic.ts`
- Create: `src/main/ai/buildAutoSavePrompt.ts`
- Create: `src/main/ai/service.ts`
- Create: `src/main/ai/__tests__/service.test.ts`
- Create: `src/main/ai/__tests__/autoSaveMessage.test.ts`
- Create: `src/main/ipc/ai.ts`
- Modify: `src/main/ipc/index.ts`
- Modify: `src/main/git/service.ts`
- Modify: `src/renderer/src/types.ts`

- [ ] **Step 1: Write the failing provider and auto-save tests**

```ts
import { describe, expect, it, vi } from 'vitest'
import { createAiService } from '../service'

describe('ai service', () => {
  it('lists provider models after validating the API key', async () => {
    const provider = {
      validateKey: vi.fn().mockResolvedValue({ ok: true, availableModels: ['gpt-4.1-mini'] })
    }

    const service = createAiService({ openai: provider as never, anthropic: provider as never })
    const result = await service.connectProvider({ provider: 'openai', apiKey: 'sk-test' })

    expect(result.available_models).toContain('gpt-4.1-mini')
  })
})
```

```ts
import { describe, expect, it, vi } from 'vitest'
import { createAiService } from '../service'

describe('auto save message generation', () => {
  it('returns one plain-language draft from staged diff input', async () => {
    const service = createAiService({
      openai: {
        generateMessage: vi.fn().mockResolvedValue('Updated the homepage layout and fixed spacing issues.')
      } as never,
      anthropic: {} as never
    })

    const result = await service.generateAutoSaveMessage({
      provider: 'openai',
      model: 'gpt-4.1-mini',
      apiKey: 'sk-test',
      diffContext: {
        diff: 'diff --git a/app.tsx b/app.tsx',
        files: [{ path: 'app.tsx', status: 'modified' }]
      }
    })

    expect(result).toContain('Updated')
  })
})
```

- [ ] **Step 2: Run the AI service tests to verify they fail**

Run: `npm test -- src/main/ai/__tests__/service.test.ts src/main/ai/__tests__/autoSaveMessage.test.ts`  
Expected: FAIL because the AI service and providers do not exist yet.

- [ ] **Step 3: Implement provider adapters and prompt builder**

```ts
// src/main/ai/types.ts
export type AiProvider = 'openai' | 'anthropic'

export interface GenerateAutoSaveMessageInput {
  provider: AiProvider
  model: string
  apiKey: string
  diffContext: StagedDiffContext
}
```

```ts
// src/main/ai/buildAutoSavePrompt.ts
export function buildAutoSavePrompt(input: StagedDiffContext): string {
  return [
    'Write one plain-language save message for a desktop Git app.',
    'Use one sentence.',
    'Do not use Git jargon.',
    'Summarize only the staged changes below.',
    input.diff
  ].join('\n\n')
}
```

- [ ] **Step 4: Implement AI IPC**

```ts
// src/main/ipc/ai.ts
ipcMain.handle('ai:connection:get', () => getAiConnectionState())
ipcMain.handle('ai:connection:connect', async (_event, provider: AiProvider, apiKey: string) => {
  return aiService.connectProvider({ provider, apiKey })
})
ipcMain.handle('ai:project-settings:get', (_event, project_id: string) => getProjectAiSettings(project_id))
ipcMain.handle('ai:auto-save-message:generate', async (_event, project_id: string) => {
  const diffContext = await getGitService(project_id).getStagedDiffContext()
  return aiService.generateAutoSaveMessage(/* current provider + model + key + diffContext */)
})
```

- [ ] **Step 5: Re-run the AI service tests**

Run: `npm test -- src/main/ai/__tests__/service.test.ts src/main/ai/__tests__/autoSaveMessage.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit the AI service and IPC**

```bash
git add src/main/ai/types.ts src/main/ai/providers/openai.ts src/main/ai/providers/anthropic.ts src/main/ai/buildAutoSavePrompt.ts src/main/ai/service.ts src/main/ai/__tests__/service.test.ts src/main/ai/__tests__/autoSaveMessage.test.ts src/main/ipc/ai.ts src/main/ipc/index.ts src/main/git/service.ts src/renderer/src/types.ts
git commit -m "feat: add ai provider services"
```

### Task 7: Build Global AI Connection UI

**Files:**
- Create: `src/renderer/src/hooks/useAiConnection.ts`
- Create: `src/renderer/src/components/ConnectAI/ConnectAI.tsx`
- Create: `src/renderer/src/components/ConnectAI/ConnectAI.module.css`
- Create: `src/renderer/src/__tests__/ConnectAI.test.tsx`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/App.module.css`
- Modify: `src/renderer/src/components/Sidebar/Sidebar.tsx`
- Modify: `src/renderer/src/components/Sidebar/Sidebar.module.css`
- Modify: `src/renderer/src/types.ts`

- [ ] **Step 1: Write the failing Connect AI test**

```tsx
// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConnectAI } from '../components/ConnectAI/ConnectAI'

describe('ConnectAI', () => {
  it('submits provider and api key', () => {
    const onConnect = vi.fn()

    render(
      <ConnectAI
        connectionStatus={{
          provider: null,
          selected_model: null,
          available_models: [],
          last_verified_at: null,
          connection_status: 'disconnected'
        }}
        onConnect={onConnect}
        onDisconnect={vi.fn()}
        onOpenProviderDocs={vi.fn()}
        onSelectModel={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText(/Provider/i), { target: { value: 'openai' } })
    fireEvent.change(screen.getByLabelText(/API key/i), { target: { value: 'sk-test' } })
    fireEvent.click(screen.getByRole('button', { name: /Connect AI/i }))

    expect(onConnect).toHaveBeenCalledWith('openai', 'sk-test')
  })
})
```

- [ ] **Step 2: Run the Connect AI test to verify it fails**

Run: `npm test -- src/renderer/src/__tests__/ConnectAI.test.tsx`  
Expected: FAIL because the component and hook do not exist yet.

- [ ] **Step 3: Implement the AI connection hook and panel**

```ts
// src/renderer/src/hooks/useAiConnection.ts
export function useAiConnection() {
  const [connectionStatus, setConnectionStatus] = useState<AiConnectionState>(/* disconnected */)
  // load via ai:connection:get, connect via ai:connection:connect, disconnect via ai:connection:disconnect
}
```

```tsx
// src/renderer/src/App.tsx
const [showAiPanel, setShowAiPanel] = useState(false)

<Sidebar aiSlot={<AIStatus connected={connectionStatus.connection_status === 'connected'} onClick={() => setShowAiPanel((v) => !v)} />} />
{showAiPanel && <ConnectAI /* hook-driven props */ />}
```

- [ ] **Step 4: Re-run the Connect AI test**

Run: `npm test -- src/renderer/src/__tests__/ConnectAI.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit the global AI connection UI**

```bash
git add src/renderer/src/hooks/useAiConnection.ts src/renderer/src/components/ConnectAI/ConnectAI.tsx src/renderer/src/components/ConnectAI/ConnectAI.module.css src/renderer/src/__tests__/ConnectAI.test.tsx src/renderer/src/App.tsx src/renderer/src/App.module.css src/renderer/src/components/Sidebar/Sidebar.tsx src/renderer/src/components/Sidebar/Sidebar.module.css src/renderer/src/types.ts
git commit -m "feat: add global ai connection ui"
```

### Task 8: Build Safe Link And First Cloud Setup Wizards

**Files:**
- Create: `src/renderer/src/hooks/useProjectLinkWizard.ts`
- Create: `src/renderer/src/hooks/useCloudSetup.ts`
- Create: `src/renderer/src/components/ProjectLinkWizard/ProjectLinkWizard.tsx`
- Create: `src/renderer/src/components/ProjectLinkWizard/ProjectLinkWizard.module.css`
- Create: `src/renderer/src/components/CloudSetupWizard/CloudSetupWizard.tsx`
- Create: `src/renderer/src/components/CloudSetupWizard/CloudSetupWizard.module.css`
- Create: `src/renderer/src/components/DangerZoneUploadDialog/DangerZoneUploadDialog.tsx`
- Create: `src/renderer/src/components/DangerZoneUploadDialog/DangerZoneUploadDialog.module.css`
- Create: `src/renderer/src/__tests__/ProjectLinkWizard.test.tsx`
- Create: `src/renderer/src/__tests__/CloudSetupWizard.test.tsx`
- Create: `src/renderer/src/__tests__/ActionPanel.cloudSetup.test.tsx`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/components/ActionPanel/ActionPanel.tsx`
- Modify: `src/renderer/src/components/ActionPanel/ActionPanel.module.css`
- Modify: `src/renderer/src/hooks/useGitActions.ts`
- Modify: `src/renderer/src/types.ts`

- [ ] **Step 1: Write the failing wizard and routing tests**

```tsx
// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProjectLinkWizard } from '../components/ProjectLinkWizard/ProjectLinkWizard'

describe('ProjectLinkWizard', () => {
  it('shows init approval for non-git folders', () => {
    render(
      <ProjectLinkWizard
        inspection={{
          isGitRepo: false,
          canInitialize: true,
          remotes: [],
          warnings: [],
          recommendedIgnoreEntries: []
        }}
        onApproveInit={vi.fn()}
        onCancel={vi.fn()}
        onFinish={vi.fn()}
      />
    )

    expect(screen.getByText(/Turn on change history/i)).toBeTruthy()
  })
})
```

```tsx
// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionPanel } from '../components/ActionPanel/ActionPanel'

describe('ActionPanel cloud setup', () => {
  it('opens cloud setup instead of uploading when no target exists', () => {
    const onOpenCloudSetup = vi.fn()

    render(
      <ActionPanel
        status={{ current_branch: 'main', files: [], ahead: 1, behind: 0, has_conflicts: false, is_clean: false }}
        loading={false}
        error={null}
        messageTemplate=""
        tokenExists={true}
        deviceFlow={null}
        cloudUploadReady={false}
        onCommit={vi.fn()}
        onPush={vi.fn()}
        onPull={vi.fn()}
        onOpenCloudSetup={onOpenCloudSetup}
        onClearError={vi.fn()}
        onConnectGitHub={vi.fn()}
        onOpenGitHubDocs={vi.fn()}
        onStartDeviceFlow={vi.fn()}
        onCancelDeviceFlow={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Upload to Cloud/i }))
    expect(onOpenCloudSetup).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the renderer tests to verify they fail**

Run: `npm test -- src/renderer/src/__tests__/ProjectLinkWizard.test.tsx src/renderer/src/__tests__/CloudSetupWizard.test.tsx src/renderer/src/__tests__/ActionPanel.cloudSetup.test.tsx`  
Expected: FAIL because the wizards and new ActionPanel flow do not exist yet.

- [ ] **Step 3: Implement the link wizard and first cloud setup hooks/components**

```tsx
// src/renderer/src/hooks/useProjectLinkWizard.ts
export function useProjectLinkWizard() {
  // dialog:openFolder -> project-setup:inspect -> project-setup:finalize-link
}
```

```tsx
// src/renderer/src/hooks/useCloudSetup.ts
export function useCloudSetup(project: Project | null) {
  // cloud:target:get -> cloud:backup:create / cloud:collaboration:set
}
```

- [ ] **Step 4: Route `Upload to Cloud` through the wizard entry point**

```tsx
const handlePush = (): void => {
  if (!cloudUploadReady) {
    onOpenCloudSetup()
    return
  }

  onPush()
}
```

- [ ] **Step 5: Re-run the renderer tests**

Run: `npm test -- src/renderer/src/__tests__/ProjectLinkWizard.test.tsx src/renderer/src/__tests__/CloudSetupWizard.test.tsx src/renderer/src/__tests__/ActionPanel.cloudSetup.test.tsx`  
Expected: PASS

- [ ] **Step 6: Commit the safe-link/cloud wizard UI**

```bash
git add src/renderer/src/hooks/useProjectLinkWizard.ts src/renderer/src/hooks/useCloudSetup.ts src/renderer/src/components/ProjectLinkWizard/ProjectLinkWizard.tsx src/renderer/src/components/ProjectLinkWizard/ProjectLinkWizard.module.css src/renderer/src/components/CloudSetupWizard/CloudSetupWizard.tsx src/renderer/src/components/CloudSetupWizard/CloudSetupWizard.module.css src/renderer/src/components/DangerZoneUploadDialog/DangerZoneUploadDialog.tsx src/renderer/src/components/DangerZoneUploadDialog/DangerZoneUploadDialog.module.css src/renderer/src/__tests__/ProjectLinkWizard.test.tsx src/renderer/src/__tests__/CloudSetupWizard.test.tsx src/renderer/src/__tests__/ActionPanel.cloudSetup.test.tsx src/renderer/src/App.tsx src/renderer/src/components/ActionPanel/ActionPanel.tsx src/renderer/src/components/ActionPanel/ActionPanel.module.css src/renderer/src/hooks/useGitActions.ts src/renderer/src/types.ts
git commit -m "feat: add safe link and cloud setup ui"
```

### Task 9: Build The Combined Project Settings Panel And AI Save Flow

**Files:**
- Create: `src/renderer/src/hooks/useProjectAiSettings.ts`
- Create: `src/renderer/src/hooks/useAutoSaveMessage.ts`
- Create: `src/renderer/src/components/AIConsentDialog/AIConsentDialog.tsx`
- Create: `src/renderer/src/components/AIConsentDialog/AIConsentDialog.module.css`
- Create: `src/renderer/src/components/ProjectSettingsPanel/ProjectSettingsPanel.tsx`
- Create: `src/renderer/src/components/ProjectSettingsPanel/ProjectSettingsPanel.module.css`
- Create: `src/renderer/src/__tests__/ProjectSettingsPanel.test.tsx`
- Create: `src/renderer/src/__tests__/ActionPanel.autoSaveMessage.test.tsx`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/App.module.css`
- Modify: `src/renderer/src/components/ActionPanel/ActionPanel.tsx`
- Modify: `src/renderer/src/components/ActionPanel/ActionPanel.module.css`
- Modify: `src/renderer/src/types.ts`

- [ ] **Step 1: Write the failing project-settings and AI save-flow tests**

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProjectSettingsPanel } from '../components/ProjectSettingsPanel/ProjectSettingsPanel'

describe('ProjectSettingsPanel', () => {
  it('shows AI and cloud state together', () => {
    render(
      <ProjectSettingsPanel
        aiSettings={{
          auto_save_message_enabled: true,
          ai_diff_consent_granted: true,
          ai_diff_consent_granted_at: 1
        }}
        aiConnectionStatus="connected"
        selectedModel="gpt-4.1-mini"
        cloudTarget={{
          mode: 'backup',
          backup: { remoteName: 'gat-backup', repoOwner: 'tony', repoName: 'demo-backup', private: true },
          collaboration: null
        }}
        onAiChange={vi.fn()}
        onOpenAiConnection={vi.fn()}
        onOpenCloudSetup={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/Use AI auto save messages/i)).toBeTruthy()
    expect(screen.getByText(/Private backup ready/i)).toBeTruthy()
  })
})
```

```tsx
// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionPanel } from '../components/ActionPanel/ActionPanel'

describe('ActionPanel AI save flow', () => {
  it('drafts an AI message on the first save click when enabled', async () => {
    const onGenerateAutoMessage = vi.fn().mockResolvedValue('Updated the layout and fixed spacing.')

    render(
      <ActionPanel
        status={{
          current_branch: 'main',
          files: [{ path: 'app.tsx', status: 'modified', staged: true }],
          ahead: 0,
          behind: 0,
          has_conflicts: false,
          is_clean: false
        }}
        loading={false}
        error={null}
        messageTemplate=""
        tokenExists={true}
        deviceFlow={null}
        cloudUploadReady={true}
        aiAutoSaveEnabled={true}
        aiConnectionReady={true}
        onCommit={vi.fn()}
        onPush={vi.fn()}
        onPull={vi.fn()}
        onOpenCloudSetup={vi.fn()}
        onClearError={vi.fn()}
        onConnectGitHub={vi.fn()}
        onOpenGitHubDocs={vi.fn()}
        onStartDeviceFlow={vi.fn()}
        onCancelDeviceFlow={vi.fn()}
        onGenerateAutoMessage={onGenerateAutoMessage}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }))
    expect(onGenerateAutoMessage).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the renderer tests to verify they fail**

Run: `npm test -- src/renderer/src/__tests__/ProjectSettingsPanel.test.tsx src/renderer/src/__tests__/ActionPanel.autoSaveMessage.test.tsx`  
Expected: FAIL because the combined panel and AI save-flow hook do not exist yet.

- [ ] **Step 3: Implement project AI hooks, consent dialog, and combined project settings panel**

```tsx
// src/renderer/src/components/ProjectSettingsPanel/ProjectSettingsPanel.tsx
<section>
  <h2>Project Settings</h2>
  {/* AI Save Messages */}
  {/* Cloud Upload */}
  {/* Project Summary */}
</section>
```

- [ ] **Step 4: Integrate the AI 2-step save flow into ActionPanel and App**

```tsx
const shouldGenerateAiMessageFirst =
  aiAutoSaveEnabled &&
  aiConnectionReady &&
  stagedCount > 0 &&
  message.trim().length === 0

if (shouldGenerateAiMessageFirst) {
  const suggestion = await onGenerateAutoMessage?.()
  if (suggestion) {
    setMessage(suggestion)
    setHelperText('AI drafted a save message. Review it, then click Save Progress again.')
    return
  }
}
```

- [ ] **Step 5: Re-run the renderer tests**

Run: `npm test -- src/renderer/src/__tests__/ProjectSettingsPanel.test.tsx src/renderer/src/__tests__/ActionPanel.autoSaveMessage.test.tsx`  
Expected: PASS

- [ ] **Step 6: Commit the integrated project settings and AI save flow**

```bash
git add src/renderer/src/hooks/useProjectAiSettings.ts src/renderer/src/hooks/useAutoSaveMessage.ts src/renderer/src/components/AIConsentDialog/AIConsentDialog.tsx src/renderer/src/components/AIConsentDialog/AIConsentDialog.module.css src/renderer/src/components/ProjectSettingsPanel/ProjectSettingsPanel.tsx src/renderer/src/components/ProjectSettingsPanel/ProjectSettingsPanel.module.css src/renderer/src/__tests__/ProjectSettingsPanel.test.tsx src/renderer/src/__tests__/ActionPanel.autoSaveMessage.test.tsx src/renderer/src/App.tsx src/renderer/src/App.module.css src/renderer/src/components/ActionPanel/ActionPanel.tsx src/renderer/src/components/ActionPanel/ActionPanel.module.css src/renderer/src/types.ts
git commit -m "feat: integrate ai and cloud project settings"
```

### Task 10: Document The Integrated Product And Run Final Verification

**Files:**
- Create: `docs/git-feature-guide-ko.md`
- Modify: `README.md`

- [ ] **Step 1: Write the Korean feature guide**

```md
# Git Abstraction Tool 기능과 Git 동작 설명

## Save Progress
- 쉬운 설명:
- 내부 Git 과정:
- 예시 명령:

## AI save message draft
- 쉬운 설명:
- 내부 AI/Git 과정:
- 예시:
```

- [ ] **Step 2: Update the README**

Add sections covering:

- safe local-first linking
- optional global AI connection with user-provided API key
- optional cloud setup with backup vs collaboration
- combined `Project Settings` panel
- location of the Korean feature guide

- [ ] **Step 3: Run the full test suite**

Run: `npm test`  
Expected: PASS for all main-process and renderer tests

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`  
Expected: PASS with no TypeScript errors

- [ ] **Step 5: Commit the docs and final integrated state**

```bash
git add docs/git-feature-guide-ko.md README.md
git commit -m "docs: explain integrated ai and safe upload behavior"
```

## Execution Notes

- Implement this plan from a fresh worktree created off `main`.
- Use the old feature worktrees only as references for code and tests.
- Keep the integration anchored to:
  - `docs/superpowers/specs/2026-04-13-ai-auto-save-message-design.md`
  - `docs/superpowers/specs/2026-04-15-safe-project-linking-and-upload-design.md`
  - `docs/superpowers/specs/2026-04-16-ai-cloud-safe-linking-integration-design.md`
- Confirm before execution that:
  - AI remains optional and never blocks saving
  - cloud upload remains optional and never blocks local use
  - `Upload to Cloud` never falls back to automatic `origin`
  - default-branch upload still requires explicit danger confirmation
  - AI diff consent remains project-scoped and first-use triggered

- Because this environment may not expose a dedicated plan reviewer subagent, perform a structured self-review before execution:
  - check every task has exact file paths
  - check every task starts with a failing test
  - check `App.tsx`, `Sidebar.tsx`, and `ActionPanel.tsx` conflicts are explicitly covered
  - check credential separation between GitHub PAT and AI API key remains explicit
