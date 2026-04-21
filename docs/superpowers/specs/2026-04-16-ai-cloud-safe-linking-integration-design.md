# AI, Cloud, And Safe Linking Integration Design

## Summary

This spec defines how the existing AI auto-save feature and the safe project linking/upload feature should ship together in one coherent product.

It does not replace the original feature specs. Instead, it defines the integration rules for:

- safe local-first project linking
- explicit cloud upload setup
- global AI provider connection
- project-scoped AI save-message behavior
- one combined project settings surface

The goal is to keep the app understandable for non-technical users while preserving the safety guarantees already established in both feature tracks.

## Product Goal

Make one app experience where a user can:

- link a folder safely
- save progress locally right away
- optionally connect their own AI provider to draft save messages
- optionally configure GitHub upload later
- understand project-specific AI and cloud status in one place

The app should remain local-first and safe-by-default.

## Relationship To Existing Specs

This spec integrates these two approved designs:

- `2026-04-13-ai-auto-save-message-design.md`
- `2026-04-15-safe-project-linking-and-upload-design.md`

Those specs still define the detailed behavior of their own subsystems.

This document defines:

- which settings remain global
- which settings remain per-project
- which user flows stay separate
- which UI surfaces become combined

## Scope

### In Scope

- Keep safe project linking and cloud upload behavior from the safe-linking spec
- Keep AI save-message behavior from the AI spec
- Preserve local-only use before GitHub setup
- Preserve local-only use before AI setup
- Keep GitHub connection and AI connection as separate global credentials
- Replace project-level AI-only settings UI with one combined project settings panel
- Keep first cloud setup as a dedicated wizard triggered from `Upload to Cloud`
- Keep AI diff consent project-specific and first-use triggered
- Keep AI save-message generation available even when cloud upload is not configured

### Out Of Scope

- New AI capabilities beyond save-message generation
- New GitHub capabilities beyond the safe-linking spec
- Merging GitHub and AI credentials into one setup flow
- Making cloud setup part of project linking
- Replacing the first cloud setup wizard with a fully inline project settings flow

## Product Principles

### 1. Local First Still Wins

After linking a project, the user should be able to save progress locally immediately.

Neither GitHub connection nor AI connection should be required for:

- linking a project
- staging files
- saving progress manually
- viewing file changes

### 2. AI And Cloud Stay Separate Internally

AI save-message generation and cloud upload are not the same feature.

They may appear near each other in the UI, but they should remain separate internally:

- AI uses the user's OpenAI or Anthropic API key
- cloud upload uses the user's GitHub credential
- AI failure must not block saving
- cloud unavailability must not block local work

### 3. Project UI Can Be Unified Without Unifying Credentials

Global credentials stay global:

- `Connect GitHub`
- `Connect AI`

Project-specific behavior is shown together in one panel:

- whether this project uses AI save messages
- whether this project's diff consent has been granted
- whether this project has a cloud upload target
- what kind of cloud target it has

### 4. Keep Risk Explicit

The integration must not weaken existing safety rules:

- no silent `git init`
- no automatic use of `origin`
- no direct default-branch upload without explicit danger confirmation
- no automatic diff transmission to AI without project consent

## Core Decisions

### Global AI Connection Model

The app stores exactly one active AI provider connection globally.

- supported providers remain `OpenAI` and `Anthropic`
- the user provides their own API key
- the selected provider and model apply to all projects
- projects do not manage their own provider or model

### Global GitHub Connection Model

GitHub remains a separate global connection.

- GitHub credential state is not merged with AI credential state
- cloud upload readiness is still determined per project
- GitHub setup remains independent from AI setup

### Project-Level AI Model

Projects still own their own AI usage choices:

- `auto_save_message_enabled`
- `ai_diff_consent_granted`
- `ai_diff_consent_granted_at`

AI diff consent remains project-specific and is requested on first AI save-message use, not during project linking.

### Project-Level Cloud Model

Projects still own their own cloud upload target:

- `none`
- `backup`
- `collaboration`

Collaboration details remain project-specific, including:

- selected remote
- branch mode
- selected branch

### Save Flow Model

If AI save messages are enabled for the project and the global AI connection is valid:

1. first `Save Progress` click attempts to generate a save-message draft
2. the draft is inserted into the existing message field
3. the user reviews or edits it
4. second `Save Progress` click creates the actual commit

If AI is unavailable, disabled, not consented, or times out:

- the manual save flow continues
- saving is never blocked by AI

### Cloud Flow Model

If a project has no cloud target configured:

- `Upload to Cloud` opens the first cloud setup wizard

After the project has a cloud target:

- `Upload to Cloud` uses that configured target
- backup and collaboration continue to follow different safety rules

### Project Settings UI Model

The app should replace the separate AI-only project settings surface with one combined `Project Settings` panel.

This panel shows:

- AI status for the project
- cloud status for the project
- current global AI provider/model summary
- current cloud target summary

This panel does not collect global credentials directly.

## User Experience

### Sidebar

The sidebar continues to expose separate global entry points:

- `Connect GitHub`
- `Connect AI`

These remain distinct because they represent different external services and different credentials.

### Linking

Project linking behavior remains unchanged from the safe-linking spec:

- guided link wizard
- optional `git init`
- warning review
- register project only after preparation succeeds

AI setup is not part of linking.

### Project Settings Panel

Each project exposes one combined `Project Settings` panel.

Recommended sections:

#### AI Save Messages

- global AI connection status
- current provider/model summary
- `Use AI auto save messages`
- diff consent state for this project
- action to open global AI connection if AI is not connected

#### Cloud Upload

- current cloud target state
- backup vs collaboration summary
- branch mode summary for collaboration targets
- action to open first-time cloud setup or change an existing target

#### Project Summary

A short project-level summary is recommended, such as:

- local save ready
- AI enabled/disabled
- cloud ready/not ready

### Save Progress

#### Case 1: AI not in use

- manual save behaves exactly like the current local save flow

#### Case 2: first AI use in a project

- the app asks whether this project's staged diff may be sent to AI
- if approved, generation proceeds
- if declined, the user stays in manual save mode

#### Case 3: AI succeeds

- the message input is filled with the generated draft
- helper text explains that the user should review and click `Save Progress` again

#### Case 4: AI fails

- show a short error
- keep the message box editable
- do not block manual save

### Upload To Cloud

#### Case 1: target not configured

- open the first cloud setup wizard

#### Case 2: backup selected

- create or use the app-managed private backup target

#### Case 3: collaboration selected

- require explicit remote selection
- default to branch-first upload
- keep risky default-branch upload behind a danger mode

#### Case 4: direct default-branch upload

- require explicit confirmation at upload time
- preserve the existing protection rules from the safe-linking spec

## Architecture

### Main Process Boundaries

Keep the existing split responsibilities:

- `projectSetup`
  - folder inspection
  - warnings
  - safe finalization
- `cloud` / `github`
  - token validation
  - backup creation
  - collaboration target persistence
- `ai`
  - provider validation
  - model listing
  - save-message generation
- `git`
  - status
  - staged diff extraction
  - safe push/pull behavior

The integration should happen at the renderer orchestration layer, not by collapsing these services together.

### Renderer Boundaries

The renderer should compose the existing and new flows like this:

- sidebar for global connections
- project settings panel for per-project state
- action panel for `Save Progress` and `Upload to Cloud`
- link wizard for project onboarding
- cloud setup wizard for first upload
- AI consent dialog for first AI use in a project

## Data Model

### Global Stores

Keep these separate:

#### GitHub Connection

- encrypted GitHub credential
- validation state as already defined by the safe-linking feature

#### AI Connection

- provider
- encrypted API key
- selected model
- available model list
- verification metadata

### Project Stores

Keep these separate:

#### Project AI Settings

- `auto_save_message_enabled`
- `ai_diff_consent_granted`
- `ai_diff_consent_granted_at`

#### Project Cloud Target

- `mode`
- `backup`
- `collaboration`

The combined project settings panel reads from both stores and presents one unified view.

## Error Handling

### AI Errors

AI errors must never prevent local save.

Examples:

- provider disconnected
- invalid API key
- model unavailable
- timeout
- provider API failure

Result:

- show inline feedback or toast
- keep manual message entry available

### Cloud Errors

Cloud errors must never prevent local use.

Examples:

- GitHub not connected
- target not configured
- invalid or insufficient GitHub token
- remote access failure
- default-branch protection block

Result:

- block only the upload action
- keep linking, staging, and local save working

### Safety Errors

Existing safety behavior must remain intact:

- `git init` failure means the project is not registered
- default-branch upload without explicit confirmation must fail
- collaboration upload without configured branch information must fail safely

## Migration Strategy

### Users Coming From The AI Feature Branch

- keep their AI connection state
- keep their project AI settings
- show cloud status as `not set up` where no cloud target exists

### Users Coming From The Safe Linking Feature Branch

- keep their linked project state
- keep their cloud target state
- treat AI as disconnected and disabled until the user connects it

### Users With No Prior Setup

- link locally first
- opt into AI later if desired
- opt into cloud upload later if desired

## Testing Strategy

### Main Process

- AI connection store tests
- project AI settings tests
- cloud target tests
- credential helpers to ensure GitHub and AI secrets remain separate
- integration-safe tests for staged diff generation plus AI prompt generation

### Renderer

- combined project settings panel state tests
- save flow tests covering AI-enabled and manual fallback cases
- first cloud upload wizard routing tests
- UI tests for projects that use:
  - neither AI nor cloud
  - AI only
  - cloud only
  - both AI and cloud

### End-To-End Risk Areas

- linking a project, then using AI before cloud setup
- linking a project, then using cloud setup before AI
- enabling AI in a project with no cloud target
- configuring collaboration upload without weakening branch safety rules

## Non-Goals

This integration is not intended to:

- merge AI and GitHub credential setup into one flow
- make cloud setup part of project linking
- require AI for saving
- require GitHub for local history
- introduce new AI product capabilities beyond save-message drafting
