# Current App Integration Spec

## Summary

This spec describes the current product baseline for Git Abstraction Tool after the AI, safe linking, cloud upload, branch management, and weekly report work were merged into `main`.

The app is now a local-first Git workspace for non-technical users that can optionally use:

- GitHub credentials for backup and team upload
- AI credentials for save-message assistance and project intelligence tools
- branch tools for safer collaboration
- weekly reports for reviewing recent work

The product should remain safe-by-default: local work must keep functioning even when AI, GitHub, or remote collaboration is unavailable.

## Product Goal

Users should be able to:

- link a local project folder safely
- turn on Git history when needed
- review project files in a full tracked-file tree
- stage, unstage, revert, and save progress locally
- optionally connect GitHub for backup or team upload
- optionally connect AI for save-message help, undo help, file insight, untracked-file review, and weekly summaries
- manage work branches without accidentally deleting or uploading to protected default branches
- understand incoming updates before pulling team changes

## Product Principles

### Local First

The app must work without GitHub and without AI.

Users can still:

- link projects
- inspect files
- stage and unstage changes
- save local progress manually
- switch local branches
- view local history-derived reports

### Explicit Risk

Potentially dangerous operations must be visible and intentional.

Required safety rules:

- no silent `git init`
- no automatic cloud upload target selection
- no direct default-branch upload without danger confirmation
- no default branch deletion
- no AI diff transmission for automatic save messages before project consent
- no force-push behavior

### Separate Credentials

GitHub and AI remain separate global connections.

- `Connect GitHub` stores and validates the GitHub credential.
- `Connect AI` stores one active AI provider connection, selected model, and API key.
- Project settings can show both statuses, but do not collect either credential directly.

### Terminology Mode

The `newbie` / `pro` setting is a terminology mode, not a feature mode.

- `newbie` uses friendlier product language.
- `pro` can use more Git-like language.
- Both modes must expose the same capabilities and safety rules.

Language selection is tracked separately from terminology mode. See:

- `docs/superpowers/specs/2026-04-29-language-mode-design.md`

## Current Feature Baseline

### Project Linking And Local Setup

Project linking uses a guided setup flow.

The link wizard should:

- let the user choose a folder
- inspect whether it is already a Git repository
- detect configured remotes
- show generated, binary, sensitive, or large-file warnings
- recommend `.gitignore` entries where appropriate
- ask before initializing Git history
- register the project only after finalization succeeds

Already-linked projects that later show `NotARepo` may offer an explicit one-click `git init` recovery. That recovery is local history setup only; it is not an upload.

### File Panel

The file panel is a tracked-file tree, not only a changed-file list.

It should:

- show tracked files even when clean
- mark clean files as synced
- show changed, staged, untracked, renamed, deleted, and conflicted files in the same tree
- allow staging and unstaging changed files
- allow staging and unstaging all visible changes
- allow reverting eligible modified files
- allow selecting a file for insight

Dependency and generated directories are hidden by default.

Examples include:

- `node_modules`
- `dist`
- `build`
- `out`
- `.venv`
- cache directories

The `Show deps` / `Hide deps` control reveals or hides those directories. If hidden dependency directories contain changes, the UI should show that hidden changes exist.

### Save Progress

Manual save must always remain available.

The save flow supports three related paths:

#### Manual Save

- User stages files.
- User writes a message.
- User clicks `Save Progress`.
- App creates a local commit.

#### Automatic AI Save-Message Assistance

This is project-scoped and opt-in.

- Project setting: `auto_save_message_enabled`
- Consent setting: `ai_diff_consent_granted`
- Consent timestamp: `ai_diff_consent_granted_at`

If enabled, connected, and consented:

1. first `Save Progress` click with an empty message generates a draft
2. the draft is inserted into the message field
3. user reviews or edits the draft
4. second `Save Progress` click creates the commit

If AI is unavailable, disabled, not consented, or fails:

- local save remains available
- the user can write the message manually

#### Manual AI Suggest

`AI Suggest` is a manual action for the current staged diff.

It should:

- require an active `Connect AI` connection
- use the currently connected provider, selected model, and stored API key
- not rely on `OPENAI_API_KEY` or other environment-only credentials
- produce the same rich AI commit metadata used by weekly summaries and natural language undo
- fail with a clear message when AI is not connected or no staged diff exists

## AI Tools

### Global AI Connection

The app stores one active AI connection globally.

The connection includes:

- provider
- encrypted API key
- selected model
- available model list
- verification status and timestamp

The UI may name supported providers, but feature copy should stay provider-neutral where possible.

Preferred wording:

- `Connect AI`
- `AI connection required`
- `AI tools`
- `current AI connection`

Avoid tying user-facing feature availability to one provider unless a feature truly requires that provider.

### Project AI Settings

`Project Settings` shows project-specific AI state.

It should include:

- AI save-message toggle
- AI connection status
- selected model summary
- diff consent status
- action to open `Connect AI` when disconnected

It should not include a second API key entry path.

### Natural Language Undo

Natural language undo is a manual AI tool.

The user describes a point in history, such as:

- `before I removed the red button`
- `restore to yesterday afternoon`
- `before the pricing copy changed`

The app should:

- read recent Git timeline entries
- enrich them with stored AI commit summaries when available
- ask AI to choose the best matching commit
- show the proposed restore point, confidence, reason, and preview files
- offer alternative matches when available
- apply the restore only after user confirmation
- create or report a restore safety point according to the restore implementation

### File Insight

File insight is a manual AI tool triggered by selecting a file.

The app should:

- require an active AI connection
- read the selected file safely within the project root
- send a bounded text snippet
- include recent commits for that file
- include related-file candidates based on co-change and path heuristics
- return summary, functionality, and related file explanations
- show retry/error states when AI or file reading fails

### Untracked Review

Untracked review is a manual AI-assisted tool shown only when untracked files exist and AI is connected.

It should:

- combine deterministic rules with AI review
- recommend `commit` or `delete`
- detect obvious generated, cache, log, environment, and dependency artifacts without waiting for AI
- send bounded context for unresolved files
- let the user stage recommended commit files
- let the user delete selected delete-recommended files
- never delete files without explicit user action

### Weekly Report And AI Summary

Weekly report is a first-class feature.

It should show:

- weekly summary cards
- daily activity timeline
- commit list
- text summary

When AI is connected, the weekly text summary can use:

- real Git weekly stats
- real commits in the week window
- stored AI commit summaries when available
- a cache keyed by week, model, commit signature, and AI-summary count

When AI is not connected or no AI summary is available, the report should fall back to a deterministic text summary based on Git stats and commit messages.

## GitHub And Cloud Upload

### Global GitHub Connection

GitHub remains a separate global credential.

It is used for:

- validating repository access
- creating private backup repositories
- authenticated push, pull, and branch deletion where supported

It is not required for local save.

### Cloud Target Types

Each project owns its cloud target.

Supported target modes:

- `none`
- `backup`
- `collaboration`

### Private Backup

Private backup is app-managed.

The app should:

- create or configure a private GitHub repository
- use an app-managed remote
- push the current local branch/HEAD to that backup
- keep it distinct from team collaboration upload

### Team Collaboration Upload

Team upload requires explicit setup.

The user must choose:

- remote
- branch mode
- branch name

Supported branch modes:

- `new_branch`
- `existing_branch`
- `danger_default_branch`

Default behavior should favor branch-first collaboration. Direct default-branch upload must remain a risky option with explicit confirmation.

Branch names should be valid Git branch names before they are saved or pushed. This validation is a known gap if not enforced in the UI.

### Pull Updates

`Get Updates` should preview incoming changes when the project is behind its configured collaboration target.

The preview should show:

- remote and branch
- behind count
- incoming commit list
- author and timestamp where available

The app should not silently pull unknown remote changes when a preview is available.

## Branch Management

The branch selector supports:

- current branch display
- local branch switch
- branch creation
- branch merge into current branch
- branch deletion

Safety rules:

- protected default branch cannot be deleted
- deleting the current branch requires switching to a fallback branch first
- merging into a protected default branch requires extra confirmation
- merge conflicts should produce a clear error and should not be auto-resolved

Branch creation may attempt to publish when configured by the caller, but a local-only branch should remain usable even when publishing fails.

## Project Settings

`Project Settings` is the combined project status surface.

It should show:

- project AI save-message state
- AI connection and selected model
- diff consent status
- cloud target status
- backup repository when configured
- team remote and branch when configured
- protected default branch when detected

It should provide actions to:

- open `Connect AI`
- open or change cloud setup

It should not:

- collect GitHub tokens directly
- collect AI API keys directly
- replace first-time cloud setup wizard steps

## Architecture

### Main Process Boundaries

Keep services separated by responsibility.

- `projectSetup`
  - folder inspection
  - warnings
  - safe finalization
- `git`
  - status, staging, commit, restore, branch, push, pull, weekly log
- `github` / `cloud`
  - GitHub validation
  - backup creation
  - project cloud target persistence
- `ai`
  - provider validation
  - model selection
  - save-message generation
  - structured AI tools
- `db`
  - project state
  - credentials
  - AI connection state
  - project AI settings
  - cloud targets
  - AI summaries
  - weekly summary cache

The renderer should orchestrate these services rather than merging their storage or credentials.

### Renderer Boundaries

Recommended renderer surfaces:

- `Sidebar`
  - project selection
  - terminology/theme controls
  - `Connect GitHub`
  - `Connect AI`
  - `Weekly Report`
- `ProjectLinkWizard`
  - project onboarding
- `ProjectSettingsPanel`
  - project AI/cloud state
- `FileManager`
  - tracked tree, staging, untracked review
- `FileInsightPanel`
  - selected file analysis
- `ActionPanel`
  - save, AI suggest, upload, get updates, natural language undo
- `CloudSetupWizard`
  - first cloud setup or target change
- `BranchSelector`
  - branch create/switch/merge/delete
- `PullUpdatesDialog`
  - incoming update preview
- `WeeklyReport`
  - weekly review view

### AI Service Boundary

AI tools should use the current connected provider through one provider-neutral service layer.

The app should avoid one-off OpenAI-only paths unless explicitly justified.

Provider-neutral tools include:

- auto save-message draft
- manual `AI Suggest`
- natural language undo
- file insight
- untracked review
- weekly summary

## Data Model

### Global Stores

GitHub credential:

- encrypted token
- validation/readiness state

AI connection:

- provider
- encrypted API key
- selected model
- available models
- last verified time
- connection status

### Project Stores

Project registry:

- project id
- friendly name
- local path
- last opened/touched metadata

Project AI settings:

- `auto_save_message_enabled`
- `ai_diff_consent_granted`
- `ai_diff_consent_granted_at`

Project cloud target:

- `mode`
- backup target data
- collaboration target data

AI summaries:

- commit hash
- message
- rich summary
- change kind
- user-visible flag
- areas
- keywords
- model
- fingerprint

Weekly summary cache:

- project id
- start/end date
- commit signature
- model
- AI summary count
- summary
- highlights
- stats

## Error Handling

### AI Errors

AI errors must not block local work.

Examples:

- disconnected provider
- invalid API key
- selected model unavailable
- structured JSON parsing failure
- provider timeout
- provider API failure

Expected result:

- show a clear inline message or toast
- keep manual controls available
- allow retry where useful

### GitHub And Cloud Errors

Cloud errors must only block cloud actions.

Examples:

- missing GitHub credential
- insufficient token scope
- remote not configured
- non-GitHub collaboration remote
- invalid branch name
- default branch danger block
- authentication failure
- network failure

Expected result:

- do not block local save
- show the user what action failed
- guide them toward setup, retry, or safer branch-first upload

### Branch And Pull Errors

Branch and pull errors should avoid destructive recovery.

Examples:

- branch already exists
- branch not found
- merge conflict
- uncommitted changes before switch/merge
- non-fast-forward push
- diverged remote branch

Expected result:

- report the specific condition where possible
- do not force push
- do not auto-resolve merge conflicts
- suggest `Get Updates`, new branch upload, or manual conflict resolution depending on the case

## Testing Strategy

### Feature Inventory

The current product should be treated as these feature groups for testing and maintenance:

- project linking and local setup
- file panel and dependency visibility
- local save progress
- AI save-message assistance
- manual AI tools
- weekly report
- GitHub connection
- backup and team upload
- branch management
- pull updates preview
- project settings

Each feature group should have an explicit owner surface, backend boundary, and verification path.

### Main Process Tests

Required coverage:

- AI connection and model selection
- provider-neutral AI suggestion generation
- auto save-message generation
- manual AI tool structured-generation paths
- GitHub service validation
- safe upload behavior
- default branch protection
- branch error mapping
- branch name validation
- non-fast-forward and diverged branch error mapping
- project AI settings store
- cloud target store
- project link finalization
- folder warning inspection
- untracked delete safety
- weekly report data generation
- weekly AI summary caching

### Renderer Tests

Required coverage:

- project settings state display
- `Connect AI` flow
- cloud setup wizard routing
- save flow with AI draft and manual fallback
- natural language undo UI
- file insight disabled/connected states
- untracked review visibility
- project link wizard
- sidebar footer alignment
- pull/update and branch UI where practical
- branch-name validation feedback
- PR handoff display after successful team upload
- dependency visibility copy and toggle behavior
- weekly report fallback and AI-enhanced states

### Test Matrix

| Feature group | Main unit | Renderer unit | Integration / hook | Manual smoke |
| --- | --- | --- | --- | --- |
| Project linking | required | required | useful | required |
| File panel | useful | required | useful | required |
| Save progress | required | required | useful | required |
| AI save-message assistance | required | required | useful | required |
| Manual `AI Suggest` | required | useful | useful | required |
| Natural language undo | required | required | useful | required |
| File insight | required | required | useful | required |
| Untracked review | required | required | useful | required |
| Weekly report | required | required | useful | required |
| GitHub connection | required | required | useful | required |
| Backup upload | required | useful | useful | required |
| Team upload | required | required | useful | required |
| Branch management | required | required | useful | required |
| Pull updates preview | required | required | useful | required |
| Project settings | useful | required | useful | required |

`required` means the feature should not be considered covered without that test type. `useful` means coverage is valuable when the implementation boundary is stable enough to test without brittle mocks.

### Manual Smoke Tests

Before shipping major changes, manually verify:

- link a non-Git folder
- link an existing Git repo
- stage and save manually
- connect AI and use `AI Suggest`
- enable AI auto save and generate a draft
- use natural language undo on a project with history
- select a file and load file insight
- create an untracked file and run untracked review
- configure team upload to a new branch
- confirm default branch upload requires danger confirmation
- preview incoming updates
- open weekly report with and without AI connected

## Optimization Targets

Optimization should be guided by testability and safety, not broad refactoring for its own sake.

Priority targets:

- split `src/main/ipc/ai.ts` into smaller feature handlers
- centralize provider-neutral AI tool orchestration
- validate branch names before saving cloud targets or creating branches
- expose push result data, including PR URL, to the renderer
- improve Git error mapping for non-fast-forward and diverged branches
- add size/type guards for file insight
- make untracked review deletion rules easy to test independently
- clarify weekly report ownership between integrated app code and standalone preview code

Optimization should preserve current user-visible behavior unless the change is explicitly listed in this spec or a follow-up plan.

## Known Gaps And Next Version

### Spec And Documentation

- User-facing docs should explain the difference between backup, team upload, branch upload, and PR review.
- `Show deps` / `Hide deps` needs clearer product copy for non-technical users.

### Collaboration Upload

- Push success should expose the generated PR URL in the UI.
- Branch-name validation should run before saving the cloud target.
- `non-fast-forward`, `fetch first`, and diverged branch errors should map to clearer user-facing messages.
- The app should better explain that pushing to a new branch does not update `main` until PR/merge.
- `Get Updates` should support explicitly choosing an update source, such as the team repository default branch, instead of only pulling from the configured collaboration upload branch.
- AI-assisted conflict explanation and resolution should be a future feature, not automatic behavior.

### AI Tools

- Structured JSON failures should have better fallback behavior where possible.
- File insight may need size/type guards for binary and very large text files.
- AI tool copy should stay provider-neutral unless the provider truly matters.
- Fine-grained on/off switches are not required for manual AI tools now, but may be revisited if tools become automatic.

### Architecture

- `src/main/ipc/ai.ts` is large and should eventually be split by feature:
  - connection/settings
  - save suggestion
  - undo
  - weekly summary
  - file insight
  - untracked review
- Weekly report has both integrated app files and legacy standalone preview files; ownership should be clarified.

## Non-Goals

The current product does not aim to:

- require AI for saving
- require GitHub for local work
- auto-resolve merge conflicts
- force-push team branches
- merge AI and GitHub credentials
- silently upload to `origin`
- silently upload to a default branch
- replace GitHub pull request review
