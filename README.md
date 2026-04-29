# Git Abstraction Tool

A desktop app for saving project history locally, reviewing project files in one panel, using your own AI provider key for save assistance and project tools, and optionally uploading work to GitHub with explicit safety checks.

---

## What it does

- **Local-first saves**: record project snapshots without requiring GitHub or AI setup first
- **Safe project linking**: inspect a folder before linking it, warn about generated or sensitive files, and ask before running `git init`
- **Full file visibility**: show tracked, changed, staged, untracked, and clean files together so the project panel stays understandable
- **Dependency hiding**: keep generated folders collapsed by default while still allowing explicit review with **Show deps**
- **Branch-aware workflow**: create, switch, merge, and delete local branches with guardrails around default and current branches
- **Optional AI tools**: connect one AI provider key globally, then use save assistance and manual AI tools where they are helpful
- **Explicit cloud upload**: choose a private backup repo or a collaboration target before anything uploads
- **Pull update preview**: inspect incoming remote changes before pulling them into the local project

No shell commands are required in the UI.

---

## Installation

### Windows
1. Download `Git-Abstraction-Tool-Setup.exe` from the [Releases page](../../releases)
2. Run the installer
3. Launch **Git Abstraction Tool**

### macOS
1. Download `Git-Abstraction-Tool.dmg` from the [Releases page](../../releases)
2. Drag the app to Applications
3. Open it from Applications

### Linux
1. Download `Git-Abstraction-Tool.AppImage` from the [Releases page](../../releases)
2. Make it executable: `chmod +x Git-Abstraction-Tool.AppImage`
3. Run it: `./Git-Abstraction-Tool.AppImage`

> **Requirement:** Git must be installed on your computer.
> - Windows: [git-scm.com](https://git-scm.com/download/win)
> - macOS: install Xcode Command Line Tools with `xcode-select --install`
> - Linux: install `git` from your package manager
>
> If Git is not detected, the app shows a setup guide and lets you retry after installation.

---

## Getting Started

### 1. Link a project

Click **+ Link a Project** in the sidebar.

The link wizard:

- chooses a folder
- checks whether Git is already set up
- asks before turning on local history with `git init`
- shows warnings for generated, binary, sensitive, or unusually large files
- recommends excludes such as `.DS_Store`, `node_modules`, and build output before history starts

The folder is only registered after that preparation succeeds.

If a linked project later enters a **Not a Git repository** state, the app shows an explicit recovery action. It does not silently run `git init`.

### 2. Review files and save progress

The main panel shows tracked files and current changes together.

Use **Show deps** / **Hide deps** to reveal or collapse dependency and generated folders such as
`node_modules` or build output. Hiding deps keeps the normal review focused; showing deps is useful
when you deliberately need to inspect those files.

Stage the changes you want, write a message, and click **Save Progress**.

You can also click **AI Suggest** to draft a commit message from the staged diff. If no AI provider is connected, or if there is no staged diff, the app shows a clear error instead of falling back to an environment variable or hidden key.

If AI save messages are enabled for that project:

1. the first click drafts a message from the staged diff
2. you review or edit it
3. the second click creates the actual commit

Manual AI tools stay separate from this flow:

- **Natural Language Undo** helps find a restore point from plain-language history
- **File Insight** explains the currently selected file and related files
- **Untracked Review** reviews untracked files before you stage or delete them
- **Weekly Report** summarizes recent work, with a deterministic local fallback when AI is unavailable

### 3. Manage branches

Use the branch pill in the project header to:

- switch to an existing local branch
- create a new branch before uploading
- merge a selected branch into the current branch
- delete a branch when it is safe to do so

The app blocks deleting the default branch, requires a fallback branch before deleting the current branch, and treats merges into protected default branches as risky actions that need explicit confirmation.

### 4. Upload to GitHub

Click **Upload to Cloud**.

On first use, the app opens a setup wizard:

- **Back up to my GitHub**: creates an app-managed private backup repository
- **Upload work to a team repository**: chooses a specific remote and branch mode for collaboration

Uploads do not happen until one of those targets is explicitly configured.

For team upload, the recommended path is a new work branch such as `gat/my-update`.
That branch is pushed to GitHub and the app shows an **Open pull request** handoff link when GitHub
can provide a compare URL. Your changes will not appear on `main` until the team reviews and merges
that branch.

### 5. Get remote updates

Use **Get Updates** when the connected remote has new commits.

The app previews the incoming commits and changed files before pulling. Pulling can still fail if Git reports a conflict; in that case the app shows the conflict instead of trying to auto-resolve it.

---

## GitHub Tokens

To use GitHub upload features, connect GitHub in the sidebar footer.

You can use:

- **GitHub device login** from inside the app
- **Personal Access Token**

For classic tokens:

- `repo` is the broad classic scope needed for private repository workflows
- `public_repo` is enough only for public repository workflows

The app accepts both classic `ghp_...` and fine-grained `github_pat_...` tokens.

GitHub credentials are stored with Electron `safeStorage`, not as plain text.

---

## AI Providers

The app currently supports these AI provider types:

- OpenAI
- Anthropic

AI keys are also stored with Electron `safeStorage`.

Only staged diffs are sent, and only after that project explicitly grants AI diff consent.

`Connect AI` is the only supported credential-entry path for AI.
Project Settings can open that flow and configure project AI behavior, but it does not collect or store raw API keys itself.

### AI Features

- **AI Suggest**: manual commit-message drafting from the staged diff
- **Auto save message**: project-scoped save assistance, gated by project toggle and one-time diff consent
- **Natural Language Undo**: manual AI tool for finding a likely restore point before reverting
- **File Insight**: manual AI tool for explaining the selected file and nearby context
- **Untracked Review**: manual AI tool for reviewing untracked files before staging or deletion
- **Weekly Report**: feature-focused weekly report with AI output when connected and a deterministic fallback otherwise

---

## Safety Rules

- No silent `git init`
- No automatic reuse of `origin` for upload
- No upload until a cloud target is configured
- No direct default-branch upload without danger confirmation
- No default-branch deletion
- No force-push workflow
- No AI diff transmission without project-level consent
- No AI key collection inside Project Settings
- No automatic conflict resolution during pull or merge

---

## Features Overview

### Project Settings

Each linked project exposes a combined **Project Settings** panel that shows:

- whether AI save assistance is enabled
- whether diff consent has been granted
- the currently selected AI model
- whether cloud upload is unset, backup, or collaboration

The three manual AI tools are not toggled here. They appear contextually in the workspace when an AI connection is available.

### Upload Modes

- **Backup** uses an app-managed `gat-backup` remote
- **Collaboration** uses the exact remote and branch mode the user selected

The backup flow currently creates an app-managed private GitHub repository. Choosing public versus private backup visibility is not part of the current release behavior.

### Pull Updates

Incoming updates are previewed before pull. The preview includes commits and changed files when Git can report them cleanly.

### Branch Safety

Branch operations use shared validation rules across the renderer and main process so branch names are checked consistently before create, switch, merge, delete, or upload actions.

### Development

```bash
npm install
npm run dev
npm test
npm run typecheck
```

### Korean Git Guide

A Korean guide that maps the app UI to real Git behavior lives here:

- [docs/git-feature-guide-ko.md](docs/git-feature-guide-ko.md)
