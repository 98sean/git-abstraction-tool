# Git Abstraction Tool

A simple desktop app for saving project history locally, optionally drafting save messages with your own AI key, and optionally uploading work to GitHub with explicit safety checks.

---

## What it does

- **Local-first saves**: record project snapshots without needing GitHub or AI first
- **Safe project linking**: inspect a folder before linking it and ask before running `git init`
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

Git must already be installed on the machine.

---

## Getting Started

### 1. Link a project

Click **+ Link a Project** in the sidebar.

The app opens a link wizard that:

- chooses a folder
- checks whether Git is already set up
- asks before turning on local history with `git init`
- shows warnings for risky files like `.env` or generated folders

The folder is only registered after that preparation succeeds.

### 2. Save progress locally

Stage the changes you want, write a message, and click **Save Progress**.

If AI save messages are enabled for that project:

1. the first click drafts a message from the staged diff
2. you review or edit it
3. the second click creates the actual commit

AI never blocks manual saving.

### 3. Connect GitHub only when you need cloud upload

Use **Connect GitHub** in the sidebar. The app accepts classic `ghp_...` and fine-grained `github_pat_...` tokens and validates access before marking a cloud target ready.

### 4. Connect AI only when you want save drafts

Use **Connect AI** in the sidebar. One provider and model are stored globally, and each project decides whether AI save drafts are enabled.

### 5. Set up Upload to Cloud

The first time you click **Upload to Cloud**, the app opens a setup wizard.

You choose one of:

- **Back up to my GitHub**: create an app-managed private backup repository
- **Upload work to a team repository**: choose a detected remote and a branch strategy

For collaboration uploads, the recommended mode is **new work branch**. Direct upload to the default branch stays behind an explicit danger confirmation.

---

## GitHub Tokens

For classic personal access tokens, `repo` is enough for private repositories.  
If you only use public repositories, `public_repo` is enough.

The app stores tokens with Electron `safeStorage`, so they stay encrypted in the OS keychain instead of plain text.

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

---

## Troubleshooting

**Upload to Cloud opens setup instead of uploading**  
The project does not have a configured cloud target yet. Finish the setup wizard first.

**This folder is not a linked project**  
The folder was not registered successfully, or Git setup failed during linking.

**Direct upload to the default branch is blocked**  
This is intentional. Confirm the danger flow explicitly if you truly mean to upload to that branch.

**AI did not draft a save message**  
The provider may be disconnected, the project may not have diff consent yet, or there may be no staged diff to summarize.

---

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Setup

```bash
git clone https://github.com/98sean/git-abstraction-tool.git
cd git-abstraction-tool
npm install
```

### Common Commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
```

### Project Structure

```text
src/
├── main/
│   ├── ai/
│   ├── db/
│   ├── git/
│   ├── ipc/
│   ├── projectSetup/
│   └── watcher/
├── preload/
└── renderer/
    ├── components/
    ├── context/
    └── hooks/
```

### Architecture Notes

- The Electron main process owns Git, credential, filesystem, AI, and GitHub access
- The renderer talks to main only through IPC
- `db:*`, `auth:*`, `ai:*`, `cloud:*`, `project-setup:*`, and `git:*` stay split by responsibility

---

## License

MIT
