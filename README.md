# Git Abstraction Tool

A desktop app for saving project history locally, reviewing every tracked file in one panel, optionally drafting save messages with your own AI key, and optionally uploading work to GitHub with explicit safety checks.

---

## What it does

- **Local-first saves**: record project snapshots without requiring GitHub or AI setup first
- **Safe project linking**: inspect a folder before linking it and ask before running `git init`
- **Full file visibility**: show tracked files and changed files together so the project panel stays understandable
- **Branch-aware workflow**: create or switch branches from the header before uploading
- **Optional AI save drafts**: connect one OpenAI or Anthropic key globally, then enable AI per project
- **Explicit cloud upload**: choose a private backup repo or a collaboration target before anything uploads

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
- shows warnings for risky files like `.env`, `.DS_Store`, or generated folders

The folder is only registered after that preparation succeeds.

### 2. Review files and save progress

The main panel shows tracked files and current changes together.

Stage the changes you want, write a message, and click **Save Progress**.

If AI save messages are enabled for that project:

1. the first click drafts a message from the staged diff
2. you review or edit it
3. the second click creates the actual commit

### 3. Switch or create a branch

Use the branch pill in the project header to:

- switch to an existing local branch
- create a new branch before uploading

### 4. Upload to GitHub

Click **Upload to Cloud**.

On first use, the app opens a setup wizard:

- **Back up to my GitHub**: creates an app-managed private backup repository
- **Upload work to a team repository**: chooses a specific remote and branch mode for collaboration

Uploads do not happen until one of those targets is explicitly configured.

---

## GitHub Tokens

To use GitHub upload features, connect GitHub in the sidebar footer.

You can use:

- **GitHub device login** from inside the app
- **Personal Access Token**

For classic tokens:

- `repo` is enough for private repositories
- `public_repo` is enough if you only use public repositories

The app accepts both classic `ghp_...` and fine-grained `github_pat_...` tokens.

GitHub credentials are stored with Electron `safeStorage`, not as plain text.

---

## AI Providers

The app currently supports:

- OpenAI
- Anthropic

AI keys are also stored with Electron `safeStorage`.

Only staged diffs are sent, and only after that project explicitly grants AI diff consent.

---

## Safety Rules

- No silent `git init`
- No automatic reuse of `origin` for upload
- No upload until a cloud target is configured
- No direct default-branch upload without danger confirmation
- No AI diff transmission without project-level consent

---

## Features Overview

### Project Settings

Each linked project exposes a combined **Project Settings** panel that shows:

- whether AI save drafts are enabled
- whether diff consent has been granted
- the currently selected AI model
- whether cloud upload is unset, backup, or collaboration

### Upload Modes

- **Backup** uses an app-managed `gat-backup` remote
- **Collaboration** uses the exact remote and branch mode the user selected

### Korean Git Guide

A Korean guide that maps the app UI to real Git behavior lives here:

- [docs/git-feature-guide-ko.md](docs/git-feature-guide-ko.md)
