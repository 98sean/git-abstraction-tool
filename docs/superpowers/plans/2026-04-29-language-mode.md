# Language Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add English/Korean app language selection while preserving the existing newbie/pro terminology mode.

**Architecture:** Store `language` as a global preference, centralize renderer copy behind a typed i18n dictionary, and pass a derived output language into AI prompt generation. Keep `mode` as terminology mode so language and Git familiarity remain independent.

**Tech Stack:** Electron, electron-store, React, TypeScript, Vitest, Testing Library.

---

## File Structure

- Modify: `src/main/db/preferences.ts`
  - Add `language: 'en' | 'ko'` to the persisted preferences schema.
- Modify: `src/renderer/src/types.ts`
  - Add shared renderer preference language type if needed.
- Modify: `src/renderer/src/context/AppContext.tsx`
  - Add `language: 'en'` to renderer defaults.
- Create: `src/renderer/src/i18n/terms.ts`
  - Own typed term dictionaries and pure `getTerms(language, mode)` function.
- Modify: `src/renderer/src/hooks/useTerms.ts`
  - Read `preferences.language` and `preferences.mode`, then delegate to `getTerms`.
- Modify: `src/renderer/src/components/Sidebar/Sidebar.tsx`
  - Add language selector UI.
- Modify: `src/renderer/src/App.tsx`
  - Wire language preference updates and replace remaining high-traffic hardcoded strings through terms.
- Modify: `src/main/ai/manualToolTypes.ts`, `src/main/ai/manualToolService.ts`, `src/main/ai/commitSuggestion.ts`, `src/main/ai/buildAutoSavePrompt.ts`
  - Accept and use output language where AI-visible prose is generated.
- Modify: relevant AI IPC/service call sites in `src/main/ipc/ai*.ts`
  - Load preferences and pass output language to AI services.
- Test: `src/main/db/__tests__/preferences.test.ts`
- Test: `src/renderer/src/__tests__/terms.test.ts`
- Test: `src/renderer/src/__tests__/SidebarLanguage.test.tsx`
- Test: AI prompt/service tests under `src/main/ai/__tests__/`
- Modify docs: `README.md`, `README.ko.md`

---

### Task 1: Preference Schema

**Files:**
- Modify: `src/main/db/preferences.ts`
- Modify: `src/renderer/src/types.ts`
- Modify: `src/renderer/src/context/AppContext.tsx`
- Test: `src/main/db/__tests__/preferences.test.ts`

- [ ] **Step 1: Write the failing preference default test**

Create `src/main/db/__tests__/preferences.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getPreferences } from '../preferences'

describe('preferences store', () => {
  it('defaults to English language and pro terminology', () => {
    const preferences = getPreferences()

    expect(preferences.language).toBe('en')
    expect(preferences.mode).toBe('pro')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/main/db/__tests__/preferences.test.ts
```

Expected: FAIL because `language` does not exist.

- [ ] **Step 3: Add language preference**

Update `src/main/db/preferences.ts`:

```ts
export interface PreferencesSchema {
  theme: 'light' | 'dark'
  mode: 'newbie' | 'pro'
  language: 'en' | 'ko'
  auto_save_enabled: boolean
  default_save_message_template: string
}
```

Add default:

```ts
language: 'en'
```

Update renderer `Preferences` type in `src/renderer/src/types.ts` and `defaultPreferences` in `src/renderer/src/context/AppContext.tsx` with the same default.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/main/db/__tests__/preferences.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/db/preferences.ts src/renderer/src/types.ts src/renderer/src/context/AppContext.tsx src/main/db/__tests__/preferences.test.ts
git commit -m "feat: add language preference"
```

---

### Task 2: Typed Terms Dictionary

**Files:**
- Create: `src/renderer/src/i18n/terms.ts`
- Modify: `src/renderer/src/hooks/useTerms.ts`
- Test: `src/renderer/src/__tests__/terms.test.ts`

- [ ] **Step 1: Write failing dictionary tests**

Create `src/renderer/src/__tests__/terms.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTerms } from '../i18n/terms'

describe('getTerms', () => {
  it('keeps English newbie and pro terminology separate', () => {
    expect(getTerms('en', 'newbie').commitBtn(1)).toContain('Save Progress')
    expect(getTerms('en', 'pro').commitBtn(1)).toContain('Commit')
  })

  it('keeps Korean newbie and pro terminology separate', () => {
    expect(getTerms('ko', 'newbie').commitBtn(1)).toContain('진행 상황 저장')
    expect(getTerms('ko', 'pro').commitBtn(1)).toContain('커밋')
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/renderer/src/__tests__/terms.test.ts
```

Expected: FAIL because `src/renderer/src/i18n/terms.ts` does not exist.

- [ ] **Step 3: Move dictionaries**

Create `src/renderer/src/i18n/terms.ts` with:

```ts
export type AppLanguage = 'en' | 'ko'
export type TerminologyMode = 'newbie' | 'pro'
export interface AppTerms {
  // move the existing AppTerms interface here
}

export function getTerms(language: AppLanguage, mode: TerminologyMode): AppTerms {
  return TERM_DICTIONARY[language][mode]
}
```

Move existing `PRO` and `NEWBIE` dictionaries from `useTerms.ts` to this file as English dictionaries. Add Korean newbie/pro dictionaries for the same keys.

Update `useTerms.ts` to:

```ts
import { getTerms } from '../i18n/terms'
import { usePreferences } from './usePreferences'

export function useTerms() {
  const { preferences } = usePreferences()
  return getTerms(preferences.language ?? 'en', preferences.mode ?? 'pro')
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- src/renderer/src/__tests__/terms.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/i18n/terms.ts src/renderer/src/hooks/useTerms.ts src/renderer/src/__tests__/terms.test.ts
git commit -m "feat: add typed language terms"
```

---

### Task 3: Language Selector UI

**Files:**
- Modify: `src/renderer/src/components/Sidebar/Sidebar.tsx`
- Modify: `src/renderer/src/components/Sidebar/Sidebar.module.css`
- Modify: `src/renderer/src/App.tsx`
- Test: `src/renderer/src/__tests__/SidebarLanguage.test.tsx`

- [ ] **Step 1: Write failing renderer test**

Create `src/renderer/src/__tests__/SidebarLanguage.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from '../components/Sidebar/Sidebar'

describe('Sidebar language selector', () => {
  it('lets the user choose Korean language', () => {
    const onLanguageToggle = vi.fn()

    render(
      <Sidebar
        projects={[]}
        activeProjectId={null}
        theme="light"
        mode="newbie"
        language="en"
        connectionStatus={{ connected: false, provider: null, model: null }}
        projectStates={{}}
        onSelectProject={vi.fn()}
        onAddProject={vi.fn()}
        onRemoveProject={vi.fn()}
        onToggleTheme={vi.fn()}
        onToggleMode={vi.fn()}
        onToggleLanguage={onLanguageToggle}
        onConnectAi={vi.fn()}
        onOpenAiDocs={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /한국어/i }))
    expect(onLanguageToggle).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/renderer/src/__tests__/SidebarLanguage.test.tsx
```

Expected: FAIL because `Sidebar` has no language props/control.

- [ ] **Step 3: Add language selector props and UI**

Add props to `Sidebar.tsx`:

```ts
language: 'en' | 'ko'
onToggleLanguage: () => void
```

Render a compact control near existing theme/mode controls:

```tsx
<button type="button" onClick={onToggleLanguage}>
  {language === 'ko' ? 'English' : '한국어'}
</button>
```

In `App.tsx`, add:

```ts
const handleToggleLanguage = (): void => {
  setPreference('language', preferences.language === 'ko' ? 'en' : 'ko')
}
```

Pass `language={preferences.language}` and `onToggleLanguage={handleToggleLanguage}` to `Sidebar`.

- [ ] **Step 4: Run test**

Run:

```bash
npm test -- src/renderer/src/__tests__/SidebarLanguage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/Sidebar src/renderer/src/App.tsx src/renderer/src/__tests__/SidebarLanguage.test.tsx
git commit -m "feat: add app language selector"
```

---

### Task 4: Localize Primary UI Copy

**Files:**
- Modify: `src/renderer/src/i18n/terms.ts`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/components/ActionPanel/ActionPanel.tsx`
- Modify: `src/renderer/src/components/FileManager/FileManager.tsx`
- Modify: `src/renderer/src/components/BranchSelector/BranchSelector.tsx`
- Modify: setup/dialog components as needed
- Test: update existing renderer tests where labels change

- [ ] **Step 1: Find hardcoded visible copy**

Run:

```bash
rg -n "'[A-Z][^']{2,}'|\"[A-Z][^\"]{2,}\"" src/renderer/src --glob '*.tsx'
```

Record visible user-facing strings that should move to terms.

- [ ] **Step 2: Write or update a focused UI test**

Add an assertion to an existing smoke or sidebar test that Korean mode renders at least:

```ts
expect(screen.getByText(/진행 상황 저장|커밋|프로젝트/)).toBeInTheDocument()
```

- [ ] **Step 3: Move high-traffic strings to terms**

Start with:

- sidebar labels
- empty project state
- save/action panel labels
- branch controls
- project setup/not-a-repo labels
- AI tool buttons and common errors

Do not translate branch names, paths, model names, providers, or raw remote names.

- [ ] **Step 4: Run targeted renderer tests**

Run:

```bash
npm test -- src/renderer/src/__tests__/SidebarLanguage.test.tsx src/renderer/src/__tests__/App.smoke.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src
git commit -m "feat: localize primary app copy"
```

---

### Task 5: AI Output Language

**Files:**
- Modify: `src/main/ai/manualToolTypes.ts`
- Modify: `src/main/ai/manualToolService.ts`
- Modify: `src/main/ai/buildAutoSavePrompt.ts`
- Modify: `src/main/ai/commitSuggestion.ts`
- Modify: `src/main/ipc/ai*.ts`
- Test: `src/main/ai/__tests__/manualToolService.test.ts`
- Test: `src/main/ai/__tests__/autoSaveMessage.test.ts`
- Test: `src/main/ai/__tests__/weeklySummary.test.ts`

- [ ] **Step 1: Write failing AI language prompt test**

Add to `src/main/ai/__tests__/manualToolService.test.ts`:

```ts
it('requests Korean output when output language is Korean', async () => {
  const provider = {
    validateKey: vi.fn().mockResolvedValue({ ok: true, availableModels: ['test-model'] }),
    generateMessage: vi.fn(),
    generateStructured: vi.fn().mockResolvedValue({
      summary: '한국어 요약',
      functionality: '한국어 설명',
      related_files: []
    })
  }
  const aiService = createAiService({ openai: provider as never, anthropic: provider as never })
  const manualToolService = createManualToolService({ aiService })

  await manualToolService.generateFileInsight({
    provider: 'openai',
    model: 'test-model',
    apiKey: 'test-key',
    outputLanguage: 'ko',
    filePath: 'src/App.tsx',
    contentSnippet: 'export function App() {}',
    recentCommits: [],
    relatedCandidates: []
  })

  expect(provider.generateStructured).toHaveBeenCalledWith(
    expect.objectContaining({
      systemPrompt: expect.stringMatching(/Korean|한국어/)
    })
  )
})
```

Adjust exact input shape to match current `manualToolService` types.

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/main/ai/__tests__/manualToolService.test.ts
```

Expected: FAIL because output language is not accepted or used.

- [ ] **Step 3: Add output language plumbing**

Add:

```ts
export type AiOutputLanguage = 'English' | 'Korean'
```

or equivalent derived from app language.

Pass this through manual tool input types and prompt builders. Replace hardcoded instructions like:

```ts
All user-visible text must be in English only.
```

with:

```ts
All user-visible text must be in ${input.outputLanguage}.
```

In IPC handlers, read preferences and map:

```ts
const outputLanguage = getPreferences().language === 'ko' ? 'Korean' : 'English'
```

- [ ] **Step 4: Run AI tests**

Run:

```bash
npm test -- src/main/ai/__tests__/manualToolService.test.ts src/main/ai/__tests__/autoSaveMessage.test.ts src/main/ai/__tests__/weeklySummary.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/ai src/main/ipc
git commit -m "feat: align ai output with app language"
```

---

### Task 6: Docs And Final Verification

**Files:**
- Modify: `README.md`
- Modify: `README.ko.md`
- Modify: `docs/superpowers/specs/2026-04-29-language-mode-design.md` if implementation decisions changed

- [ ] **Step 1: Update docs**

Document:

- language selector supports English and Korean
- terminology mode remains separate
- AI outputs follow selected app language where AI is used

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run typecheck
```

Expected:

- `npm test`: all test files pass
- `npm run typecheck`: exit code 0

- [ ] **Step 3: Commit docs**

```bash
git add README.md README.ko.md docs/superpowers/specs/2026-04-29-language-mode-design.md
git commit -m "docs: document language mode"
```

---

## Final Checklist

- [ ] `language` preference defaults to `en`.
- [ ] `mode` remains `newbie` / `pro`.
- [ ] Language switch updates visible UI without restart.
- [ ] Korean newbie/pro terms are distinct.
- [ ] English newbie/pro terms are unchanged unless intentionally refined.
- [ ] AI prompt builders request the selected output language.
- [ ] Safety confirmations remain present in both languages.
- [ ] `npm test` passes.
- [ ] `npm run typecheck` passes.
