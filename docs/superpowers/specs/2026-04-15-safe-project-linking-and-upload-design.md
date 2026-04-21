# Safe Project Linking And Upload Design

## Summary

This spec defines a safer onboarding and upload model for Git Abstraction Tool.

It separates internal concerns without exposing that split as a confusing user-facing mode:

- projects should work locally even before GitHub is configured
- linking a folder should safely prepare it for version history
- cloud upload should be configured only when the user actually needs it
- backup and collaboration uploads should follow different safety rules

This is a separate design track from AI auto-save messaging. It covers project linking, Git initialization, remote safety, backup setup, branch-first collaboration, and user-facing Git simplification.

## Product Goal

Make it safe for non-technical users and junior developers to:

- connect almost any project folder
- start using local save history immediately
- avoid accidental pushes to existing remotes
- back up work to GitHub when ready
- collaborate through branches and pull requests instead of risky direct pushes

## Why This Is Separate From The AI Spec

The existing AI spec covers:

- AI provider connection
- AI-generated save messages
- diff consent for AI prompts
- save-panel behavior

This spec covers a different product surface:

- folder linking
- local Git initialization
- dangerous file detection
- remote/origin handling
- backup repository creation
- branch and upload safety rules

These concerns should be implemented and reviewed independently.

## Scope

### In Scope

- Replace simple folder linking with a guided linking wizard
- Detect whether a selected folder is already a Git repository
- If not a Git repository, offer explicit approval before running `git init`
- Register the project only after preparation succeeds
- Detect risky files and folders during linking
- Offer recommended ignore/exclude additions during linking
- Allow immediate local use without requiring GitHub setup
- Trigger cloud setup only when `Upload to Cloud` is first used
- Support two cloud intents:
  - personal backup
  - team collaboration
- Default collaboration flow to branch-first upload
- Hide direct upload to the default branch behind an explicit danger mode
- Treat existing remotes as inactive until the user deliberately selects one
- Improve GitHub PAT support, including `github_pat_` fine-grained tokens
- Provide one separate Korean Markdown document explaining app features through the underlying Git commands

### Out Of Scope

- AI auto-save implementation details
- token dashboards
- GitHub App migration
- enterprise organization administration flows
- full Git education inside the main UI
- automatic merge handling inside the app

## Product Principles

### 1. Local First

The app should be usable before GitHub is configured.

Users should be able to:

- link a project
- save progress locally
- inspect changes
- switch branches later if needed

GitHub upload is important, but it should not be a prerequisite to basic project use.

### 2. Internal Separation, Unified UX

Internally, the app separates:

- local project history
- cloud backup/collaboration setup

But the UI should still feel like one continuous project experience.

The user should not feel like they are choosing between awkward “modes.” Instead:

- the project is linked once
- local use works immediately
- cloud setup appears naturally only when the user asks to upload

### 3. Safe By Default

The app should not silently:

- initialize Git
- reuse an existing `origin`
- push to a remote
- push to a default branch

All risky actions must be explicit and explained in plain language.

## User Experience

### Linking Wizard

`+ Link a Project` should open a guided linking wizard instead of immediately registering the folder.

### Step 1: Choose Folder

The user selects a folder. The app immediately inspects:

- whether it is a Git repository
- whether remotes already exist
- whether risky files or folders are present

This step should avoid heavy Git jargon.

Example language:

- `Choose a project folder`
- `We’re checking whether this folder is ready for save history and cloud backup`

### Step 2: Prepare Project

If the folder is not already a Git repository, the app should explain the concept in plain language.

User-facing framing:

- `Turn on change history for this folder`

Plain explanation:

- this lets the app save versions of your work
- this does not upload anything to GitHub
- this only prepares the folder for local history tracking

Buttons:

- `Turn it on and continue`
- `Cancel`

If the user approves, the app runs `git init`.

The project is registered only if that succeeds.

### Step 3: Review Folder Warnings

The app shows a warning screen if it detects:

- large files
- binary files
- sensitive files
- unnecessary folders or generated output

Examples:

- `.env`
- secrets, keys, certificates
- `node_modules`
- `dist`
- `.DS_Store`
- very large archives or media files

This screen should:

- explain why each item may be risky
- allow the user to continue
- offer `recommended exclude items`

Recommended exclude items should be easy to add in one action.

Sensitive items should use stronger wording and default to selected exclusion if the app offers checkboxes.

### Step 4: Finish Linking

After preparation and warnings:

- register the project
- begin file watching
- allow normal local use immediately

The app may show a lightweight cloud status later, but should not force GitHub setup during linking.

Example lightweight status:

- `Cloud backup not set up yet`

### First Cloud Upload Wizard

Cloud setup should begin only when a user first clicks `Upload to Cloud` for a project that has no upload target configured.

### Step 1: Choose Upload Intent

The first screen should avoid raw Git terminology and focus on the user’s goal.

Choices:

- `Back up to my GitHub`
- `Upload work to a team repository`

### Personal Backup Flow

The default backup flow should be:

- create a new private GitHub repository automatically
- connect it as the app-managed backup destination
- use it for future `Upload to Cloud` actions

This should be explained as:

- safe private backup
- under the user’s GitHub account
- separate from team collaboration if desired

For V1, existing-repository backup selection is a later enhancement, not the default path.

### Team Collaboration Flow

If the project has an existing remote such as `origin`, the app must not start uploading immediately.

Instead, the user must explicitly confirm:

- which remote to use
- which branch strategy to use

The default recommendation should be:

- create a new work branch
- push that branch
- open GitHub for a pull request

Secondary option:

- push to an existing non-default branch

Danger-mode-only option:

- push directly to the default branch such as `main`

## Collaboration Safety Model

### Existing Remote Safety

When a user links a cloned repository:

- the app can detect existing remotes
- but it should treat them as unconfigured for upload purposes
- upload remains disabled until the user explicitly chooses a target

This prevents accidental pushes to a repository the user did not intend to update.

### Branch-First Default

For collaboration uploads, the app should recommend:

1. create a new branch
2. push to that branch
3. open GitHub to create a pull request

This is the safest default for the target audience.

### Default Branch Protection

Direct upload to the default branch should be supported only behind explicit danger mode.

Rules:

- hidden from the main flow
- revealed only after the user chooses to see risky options
- explained with clear consequences
- confirmed again before upload

Example language:

- `This can update the team’s main branch without review`

## Terminology Strategy

The app should translate Git concepts into easier language in the primary UI, while still allowing detailed Git terms in advanced or secondary views.

Examples:

- `git init` -> `Turn on change history`
- `push` -> `Upload to Cloud`
- `pull` -> `Get Updates`
- `branch` -> `Work branch`
- `default branch` -> `Main branch` or `default branch`
- `remote` / `origin` -> shown only when needed in advanced configuration

The goal is to reduce fear without hiding the truth from users who want detail.

## Technical Behavior

### Linking

When a folder is selected:

- inspect whether `.git` exists or whether the folder is inside a work tree
- inspect remotes if a repository exists
- inspect files for risk patterns
- optionally prepare recommended ignore entries

If Git initialization is approved:

- run `git init`
- verify success
- only then create the managed project entry and start watchers

### Cloud Configuration

Cloud upload should remain inactive until one of these is configured:

- app-managed backup destination
- explicit collaboration upload destination

`Upload to Cloud` should open the setup wizard if neither is configured.

### Backup Modeling

Internally, the app should distinguish:

- local project state
- backup destination
- collaboration destination

But this should not feel like separate user modes during normal use.

## GitHub Authentication And Token Support

The current app already supports:

- OAuth device flow
- manual token entry

This design requires stronger token handling and clearer validation.

### Required Improvements

- support both classic `ghp_` tokens and fine-grained `github_pat_` tokens
- validate whether the token can actually access the intended repository
- distinguish likely failure causes:
  - invalid token
  - missing repository permission
  - repo not included in fine-grained token scope
  - approval or SSO-related access issue
- update UI copy so it does not assume only classic `repo` scope semantics

### Fine-Grained PAT Support

Fine-grained PATs should be treated as first-class citizens in the design.

The app should not assume:

- a generic `repo` scope is enough
- all repositories are accessible
- the token can push just because it can authenticate

Instead, token validation should verify intended repository access before the app marks cloud upload as ready.

## Error Handling

- If `git init` fails, do not register the project
- If folder inspection fails, show a clear blocking error
- If risky files are detected, warn but do not hard-block by default
- If a collaboration target is not configured, `Upload to Cloud` opens setup instead of failing
- If token validation fails, explain why cloud upload is unavailable and keep local use working
- If direct default-branch upload is attempted without danger-mode confirmation, block it

## Documentation Deliverable

In addition to the UI behavior above, this design includes one separate Korean Markdown document that explains how major app features map to real Git behavior.

This document should be written as one file, not split into many files.

Each feature section should include:

- feature name
- simple Korean explanation
- what Git is doing internally
- example Git commands

Example sections:

- `Save Progress`
- `Upload to Cloud`
- `Get Updates`
- `Turn on change history`
- `Create work branch`

This document is intentionally separate from the UI so the user can store or reuse it independently.

## Existing Code Areas Likely To Change

- `src/main/ipc/projects.ts`
- `src/main/db/projects.ts`
- `src/main/git/service.ts`
- `src/main/ipc/git.ts`
- `src/main/ipc/auth.ts`
- `src/main/db/credentials.ts`
- `src/renderer/src/components/Sidebar/Sidebar.tsx`
- `src/renderer/src/App.tsx`
- `src/renderer/src/components/ActionPanel/ActionPanel.tsx`
- new wizard UI components for linking and first upload setup

## Backlog / Later Enhancements

- selecting an existing repository for personal backup during first setup
- richer `.gitignore` recommendation logic
- deeper repository health checks
- in-app educational detail pages
- safer conflict translation during collaboration workflows

## Non-Goals

- forcing GitHub setup during project linking
- automatically pushing to any detected remote
- making direct default-branch push the primary workflow
- combining this design with the AI auto-save feature spec
