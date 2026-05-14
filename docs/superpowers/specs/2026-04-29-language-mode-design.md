# Language Mode Design Spec

## Summary

VIVA should support app-level language selection while preserving the existing `newbie` / `pro` terminology mode.

The feature introduces a separate `language` preference:

- `en`: English
- `ko`: Korean

The existing `mode` preference remains a terminology mode:

- `newbie`: friendlier product language
- `pro`: Git-aware language

Together they produce four supported UI combinations:

- English + newbie
- English + pro
- Korean + newbie
- Korean + pro

## Problem

The app currently has a partial terminology system in `useTerms.ts`, but it only switches between English newbie/pro copy. Many UI strings remain hardcoded in components, and AI tool prompts currently force English output in several places.

Users should be able to choose Korean for the app UI without losing the newbie/pro distinction.

## Goals

- Add an app-level `language` preference with `en` and `ko`.
- Preserve the existing `mode` preference as terminology mode.
- Store language preference in the same preferences store as theme and mode.
- Make the visible app shell switch between English and Korean without restarting.
- Keep newbie/pro capability parity: language and terminology do not hide features.
- Make manual and automatic AI outputs follow the selected language where practical.
- Avoid provider-specific language such as "OpenAI-only" in generic AI feature copy.
- Add tests for preference persistence, term selection, UI language switching, and AI output-language prompts.

## Non-Goals

- Full locale formatting for dates, numbers, or time zones.
- Translating Git branch names, file paths, provider names, model names, or error codes.
- Translating user-authored commit messages or existing Git history.
- Adding more languages beyond English and Korean.
- Replacing the current `newbie` / `pro` terminology mode.
- Building an in-page Markdown language toggle for GitHub README files.

## Product Behavior

### Language Selector

The UI should expose a clear language selector.

Preferred placement:

- Sidebar footer or Project Settings, near theme and terminology controls.

Required options:

- `English`
- `한국어`

Changing the language updates visible app text immediately and persists across restarts.

### Terminology Mode

`newbie` / `pro` remains separate from language.

Examples:

| Language | Mode | Save Button | Branch Label | Upload Button |
| --- | --- | --- | --- | --- |
| English | newbie | Save Progress | Version | Upload |
| English | pro | Commit | Branch | Push |
| Korean | newbie | 진행 상황 저장 | 버전 | 올리기 |
| Korean | pro | 커밋 | 브랜치 | 푸시 |

Both modes expose the same actions and safety confirmations.

### Preferences

The preferences schema should include:

```ts
language: 'en' | 'ko'
```

Default:

```ts
language: 'en'
```

Existing users without the field should receive the default through store defaults or renderer fallback.

### Translation Boundary

User-facing renderer copy should move toward a centralized dictionary.

The first implementation must cover:

- sidebar labels and empty states
- file panel actions and empty states
- save/action panel labels
- branch labels and confirmations
- project setup and not-a-repo copy
- GitHub/cloud setup labels where they are already visible in the main workflow
- AI tool labels, loading states, and common error messages

Technical values should not be translated:

- branch names
- file paths
- provider names
- model names
- raw Git remote names

### AI Output Language

AI output should follow the selected app language.

Examples:

- English mode asks AI for English save messages, file insight, weekly summaries, untracked review reasons, and natural language undo explanations.
- Korean mode asks AI for Korean save messages, file insight, weekly summaries, untracked review reasons, and natural language undo explanations.

The implementation should pass a derived output-language value to AI prompt builders/services rather than hardcoding English inside each prompt.

If AI is disconnected, local deterministic fallbacks should still work. Korean deterministic fallback can be added incrementally, but the UI must not crash when language is Korean.

### Safety

Language selection must not weaken existing safety requirements:

- no silent `git init`
- no automatic upload target selection
- no direct default-branch upload without danger confirmation
- no default branch deletion
- no AI diff transmission without consent
- no force-push behavior

### Error Handling

If a translation key is missing, development/tests should catch it before shipping.

Runtime fallback may fall back to English, but this should be treated as a defect in tests for expected keys.

## Implementation Notes

Recommended structure:

```txt
src/renderer/src/i18n/
  terms.ts
```

Suggested types:

```ts
export type AppLanguage = 'en' | 'ko'
export type TerminologyMode = 'newbie' | 'pro'

export function getTerms(language: AppLanguage, mode: TerminologyMode): AppTerms
```

`useTerms()` should become a small hook that reads preferences and calls `getTerms(...)`.

## Testing Requirements

- Unit test preference defaults include `language: 'en'`.
- Unit test `getTerms('en', 'newbie')`, `getTerms('en', 'pro')`, `getTerms('ko', 'newbie')`, and `getTerms('ko', 'pro')`.
- Renderer test verifies changing language updates at least one visible app label.
- Renderer test verifies terminology mode remains independent from language.
- AI service tests verify prompts request Korean output when language is Korean and English output when language is English.
- Existing full test suite and typecheck must pass.

## Documentation

Update:

- `README.md`
- `README.ko.md`

Both should explain:

- app language can be switched between English and Korean
- terminology mode is separate from language
- AI output follows app language where AI tools are used

