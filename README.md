# VIVA — Visual Interface for Version Assistance

[![English](https://img.shields.io/badge/lang-English-blue)](README.md)
[![한국어](https://img.shields.io/badge/lang-%ED%95%9C%EA%B5%AD%EC%96%B4-green)](README.ko.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)]()

**Git version control for everyone who isn't a terminal power user.**

VIVA (Visual Interface for Version Assistance) is a local-first desktop app that makes saving, reviewing, and sharing code safe and approachable — no shell commands required. It wraps Git in a visual workflow with explicit consent before anything destructive or irreversible happens, and layers in opt-in AI tools at the exact moments they help most.

Built for vibe coders, designers, students, and early-stage developers who generate code with AI tools but need a reliable way to manage it.

---

## Features

- **Local-first saves** — record project snapshots without requiring GitHub or AI setup
- **Safe project linking** — inspect a folder before linking, warn about generated or sensitive files, and ask before running `git init`
- **Full file visibility** — show tracked, changed, staged, untracked, and clean files together in one panel
- **Dependency hiding** — keep generated folders collapsed by default; reveal with **Show deps** when needed
- **Branch-aware workflow** — create, switch, merge, and delete local branches with guardrails on default and current branches
- **Opt-in AI tools** — connect one AI provider key globally, then use save assistance and manual tools where helpful
- **Language and terminology modes** — switch between English and Korean, and separately between beginner-friendly or Git-aware wording
- **Explicit cloud upload** — choose a private backup repo or a team collaboration target before anything is pushed
- **Pull update preview** — inspect incoming remote changes before pulling them into the local project

No shell commands are required in the UI.

---

## Screenshots

> Screenshots coming soon. Drop UI images here before publishing.

---

## Installation

### Windows
1. Download `VIVA-Setup.exe` from the [Releases page](../../releases)
2. Run the installer
3. Launch **VIVA**

### macOS
1. Download `VIVA.dmg` from the [Releases page](../../releases)
2. Drag the app to Applications
3. Open it from Applications

### Linux
1. Download `VIVA.AppImage` from the [Releases page](../../releases)
2. Make it executable: `chmod +x VIVA.AppImage`
3. Run it: `./VIVA.AppImage`

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

Use **Show deps** / **Hide deps** to reveal or collapse dependency and generated folders such as `node_modules` or build output.

Stage the changes you want, write a message, and click **Save Progress**.

You can also click **AI Suggest** to draft a commit message from the staged diff. If no AI provider is connected, or if there is no staged diff, the app shows a clear error instead of falling back to an environment variable or hidden key.

If AI save messages are enabled for that project:

1. the first click drafts a message from the staged diff
2. you review or edit it
3. the second click creates the actual commit

Manual AI tools stay separate from this flow:

- **Natural Language Undo** — find a restore point from plain-language history
- **File Insight** — explain the currently selected file and related files
- **Untracked Review** — review untracked files before staging or deleting them
- **Weekly Report** — summarize recent work, with a deterministic local fallback when AI is unavailable

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

- **Back up to my GitHub** — creates an app-managed private backup repository
- **Upload work to a team repository** — chooses a specific remote and branch mode for collaboration

Uploads do not happen until one of those targets is explicitly configured.

For team upload, the recommended path is a new work branch such as `gat/my-update`. That branch is pushed to GitHub and the app shows an **Open pull request** handoff link when GitHub can provide a compare URL. Your changes will not appear on `main` until the team reviews and merges that branch.

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

## Feature Guide

### Project Linking

Use **+ Link a Project** to register a folder with the app.

The app checks whether the folder already has Git history, whether it has remotes, and whether it contains files that are usually unsafe or noisy to track. Recommended excludes are shown before setup completes so the first save does not accidentally include generated folders, local OS files, secrets, or large binaries.

If the folder is not a Git repository, the app asks before running `git init`. If a linked project later loses its `.git` metadata, recovery is also explicit: the user must choose the repair action.

### File Review

The project file panel shows the whole project state, not only changed files.

- **Tracked clean files** are visible so users know what is already part of history
- **Modified, staged, and untracked files** are marked by status
- **Dependency and generated folders** are hidden by default to keep review focused
- **Show deps** reveals dependency and generated folders when explicit inspection is needed
- **Hide deps** collapses them again after review

### Save Progress

Use **Save Progress** to create a local commit.

The normal flow is:

1. review changed files
2. stage the files that belong in the save
3. write or generate a message
4. save the commit locally

The app does not require GitHub or AI to save local history.

### Branch Management

Use the branch controls in the project header to create, switch, merge, or delete local branches.

Branch names are validated before use. The app blocks deleting the default branch, requires a fallback branch before deleting the current branch, and asks for explicit confirmation before risky default-branch operations.

### GitHub Upload

Use **Upload to Cloud** after local changes are saved.

- **Back up to my GitHub** creates an app-managed private backup repository and uses the `gat-backup` remote
- **Upload work to a team repository** uses an explicitly selected collaboration remote and branch mode
- **New branch upload** is the recommended team workflow because it lets GitHub review happen through a pull request before `main` changes
- **Default branch upload** is treated as dangerous and requires explicit confirmation

The app does not automatically reuse `origin` for upload. A cloud target must be selected first.

### Get Updates

Use **Get Updates** to inspect incoming remote commits before pulling from the selected collaboration branch.

The app previews commits and changed files when Git can report them cleanly. If pulling would create a conflict, the app reports the conflict instead of attempting automatic resolution.

### Project Settings

Each linked project has a combined **Project Settings** panel.

Project Settings shows:

- AI save-message status
- AI diff-consent status
- selected AI model
- cloud setup status
- an entry point to **Connect AI**

Project Settings does not collect raw GitHub tokens or AI API keys. Credentials are handled through the dedicated connection flows.

### Language and Terminology

The sidebar includes a language selector for **English** and **한국어**.

Language is independent from terminology mode:

- **Newbie mode** uses friendlier product wording such as **Save Progress**, **Version**, and **Upload**
- **Pro mode** uses Git-aware wording such as **Commit**, **Branch**, and **Push**

AI-generated save messages, natural undo explanations, file insight, untracked review reasons, and weekly summaries request output in the selected app language.

---

## AI Providers

The app currently supports:

- OpenAI
- Anthropic

AI keys are stored with Electron `safeStorage`.

Only staged diffs are sent, and only after that project explicitly grants AI diff consent.

`Connect AI` is the only supported credential-entry path. Project Settings can open that flow and configure project AI behavior, but does not collect or store raw API keys.

### AI Suggest

Use **AI Suggest** near the save-message area.

What it does:

- reads the staged diff
- drafts a commit message
- leaves the message editable before saving

Required:

- an AI provider is connected
- the project has granted diff consent
- at least one file is staged

### Auto Save Message

When enabled:

1. the first save action drafts a message from the staged diff
2. the user reviews or edits the message
3. the next save action creates the commit

### Natural Language Undo

Example inputs:

- `go back to before I changed the upload flow`
- `undo the last UI cleanup`
- `restore the version before the AI settings change`

The tool searches project history and proposes likely restore points with a file preview. The restore is only applied when the user explicitly chooses the apply action.

### File Insight

Explains what the selected file does, summarizes relevant nearby changes, and helps decide whether the file should be reviewed, staged, or left alone.

### Untracked Review

Reviews untracked files before they enter history, calls out likely generated, local-machine, or sensitive files, and helps separate source files from files that belong in `.gitignore`. Advisory only — the user still decides what to stage or exclude.

### Weekly Report

When AI is connected, produces a feature-focused summary from recent history. When AI is unavailable, falls back to a deterministic local summary from Git data.

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

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Electron](https://www.electronjs.org/) |
| UI | [React](https://react.dev/) + TypeScript |
| Git operations | [simple-git](https://github.com/steveukx/git-js) |
| Local storage | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| AI providers | OpenAI API, Anthropic API |
| i18n | Custom i18n layer (English + Korean) |
| Tests | [Vitest](https://vitest.dev/) + Testing Library |
| Packaging | [electron-builder](https://www.electron.build/) |

---

## Development

```bash
npm install
npm run dev       # start the app in development mode
npm test          # run tests with Vitest
npm run typecheck # TypeScript type check
```

Main-process code lives in `src/main/`, the React UI in `src/renderer/src/`, and shared types in `src/shared/`.

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change — especially for features that touch the safety rules or the AI provider boundary.

1. Fork the repo and create a branch from `main`
2. Make your changes with tests where applicable
3. Run `npm test` and `npm run typecheck` before submitting
4. Open a pull request with a clear description of the change and why

Please keep PRs focused. One concern per PR makes review faster.

---

## Current Limitations

- Backup repositories are created as app-managed private GitHub repositories; public/private selection is not in the current release
- Pull and merge conflicts are reported, not automatically resolved
- Team collaboration upload is branch-first; pull request creation is handed off to GitHub through the compare URL
- AI tools require a connected provider and project consent before sending diffs

---

## License

[MIT](LICENSE)

---

## Korean Git Guide

A Korean guide that maps the app UI to real Git behavior:

- [docs/git-feature-guide-ko.md](docs/git-feature-guide-ko.md)
