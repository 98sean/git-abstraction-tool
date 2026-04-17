# Git Abstraction Tool

A simple, friendly desktop app for saving and sharing your work — no technical knowledge required.

Think of it like having an automatic "undo history" for your entire project, plus the ability to upload your work to the cloud so it's never lost.

---

## What does it do?

- **Saves snapshots of your work** — capture exactly what you changed and why, so you can always go back
- **Syncs to the cloud** — upload your saved work to GitHub for backup and sharing
- **Shows all your files** — see every file in your project at a glance, with clear indicators of what's changed and what's already saved
- **Works with any folder** — link any folder on your computer and start tracking changes immediately

No commands to type. No technical jargon. Just point it at a folder and go.

---

## Installation

### Windows
1. Download `Git-Abstraction-Tool-Setup.exe` from the [Releases page](../../releases)
2. Run the installer and follow the prompts
3. Launch **Git Abstraction Tool** from the Start Menu or Desktop shortcut

### macOS
1. Download `Git-Abstraction-Tool.dmg` from the [Releases page](../../releases)
2. Open the DMG and drag the app to your Applications folder
3. Open the app from Applications (right-click → Open on first launch)

### Linux
1. Download `Git-Abstraction-Tool.AppImage` from the [Releases page](../../releases)
2. Make it executable: `chmod +x Git-Abstraction-Tool.AppImage`
3. Run it: `./Git-Abstraction-Tool.AppImage`

> **Requirement:** Git must be installed on your computer.
> - Windows: [git-scm.com](https://git-scm.com/download/win)
> - macOS: Install via Xcode Command Line Tools (`xcode-select --install`)
> - Linux: `sudo apt install git` or equivalent
>
> If Git is not detected at startup, the app will show a setup guide and let you retry once it's installed.

---

## Getting Started

### 1. Link your first project

When you open the app, click **+ Link a Project** in the left sidebar.

A folder picker will open — navigate to your project folder and select it.

> If the folder hasn't been set up for tracking yet, the app will offer to initialise it automatically — just click the button.

### 2. See all your files

The main panel lists **every file** in your project. Each file shows its current status:

| Colour | Meaning |
|--------|---------|
| 🟢 Green | Synced — no changes since last save |
| 🔵 Blue | New file |
| 🟡 Yellow | Modified (changed) |
| 🔴 Red | Deleted |
| 🟣 Purple | Renamed |

Files in dependency folders (`node_modules`, `dist`, etc.) are hidden by default. Click **Show deps** in the toolbar to reveal them.

### 3. Select the changes you want to save

Check the box next to each file you want to include in this save. Click **Stage all** to include everything, or pick individual files.

Only files with changes (non-green) have checkboxes — synced files are shown for reference but can't be selected.

### 4. Save your progress

Type a brief note in the message box describing what you did — for example: *"Added introduction chapter"* or *"Fixed the contact form layout"*.

Click **Commit** (or **Save Progress** in Newbie mode). Your changes are now permanently recorded with that note.

### 5. Upload to the cloud

Once you've saved, click **↑ Push** (or **↑ Upload**) to send your work to GitHub. This backs it up online and lets collaborators see your changes.

To download changes made by others, click **↓ Pull** (or **↓ Get Updates**).

---

## Modes

The app supports two modes, switchable from the bottom of the sidebar:

| Mode | Terminology | Best for |
|------|------------|---------|
| **Newbie** | Save Progress, Upload, Get Updates, Version | First-time users, non-developers |
| **Pro** | Commit, Push, Pull, Branch | Developers who know Git |

Your mode preference is saved automatically.

---

## Branches / Versions

The current branch is shown in the header next to the project name. Click it to:

- **Switch** to an existing branch
- **Create** a new branch by typing a name and pressing the create button

Branches let you work on separate ideas in parallel without affecting your main work.

---

## Connecting to GitHub

To use the cloud sync features, you'll need to connect your GitHub account. There are two ways:

### Option A — Sign in with GitHub (recommended)

1. In the sidebar footer, click **Connect GitHub**
2. Choose **Sign in with GitHub**
3. A code will appear — click **Copy** and then **Open GitHub**
4. Enter the code on the GitHub page that opens
5. Approve the access request
6. Return to the app — it will detect the connection automatically

### Option B — Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a name (e.g. "Git Abstraction Tool")
4. Select the **`repo`** permission scope
5. Click **Generate token** and copy it
6. In the app sidebar, click **Connect GitHub** → **Use a Personal Access Token**
7. Paste your token and click **Connect**

> Keep your token private — treat it like a password.

Your credentials are **never stored in plain text** and never leave your computer except when communicating directly with GitHub.

---

## API Keys (AI Features)

The app supports optional AI-powered features using your own API key. Go to **Settings** (gear icon in the sidebar) to enter:

- **OpenAI** (ChatGPT) key
- **Anthropic** (Claude) key

Keys are stored locally in the app only and never sent anywhere except the respective AI provider.

---

## Features Overview

### Multiple Projects
Link as many project folders as you like. Switch between them instantly from the sidebar — each keeps its own change history.

### Light & Dark Mode
Click the theme toggle at the bottom of the sidebar to switch between light and dark mode. Your preference is saved automatically.

### Undo Changes to a File
Hover over any changed file in the list and click **Revert** (or **Undo**) to restore it to how it was at your last save point. This only affects that one file.

### Upload / Download Status
The header shows how many commits you have ready to upload (↑) and how many updates are waiting to download (↓).

### Dependency Folder Handling
Folders like `node_modules`, `dist`, `.next`, and `vendor` are hidden by default to keep the file list clean. A warning badge appears if there are changes inside them. Click **Show deps** to reveal them.

### Version Mismatches
If you and a collaborator have both changed the same file, the app will warn you with a conflict indicator. You'll need to resolve this before uploading.

---

## Troubleshooting

**"Git is not installed"**
The app detected that Git is not available. Install it from [git-scm.com](https://git-scm.com/download/win) (Windows), via `xcode-select --install` (macOS), or `sudo apt install git` (Linux), then click **Check again** in the app.

**"This folder is not a linked project" / "Project not set up yet"**
The folder hasn't been initialised for tracking. Click the **Initialize Repository** (or **Set up this Project**) button shown in the main panel — no terminal required.

**"Login failed. Please check your credentials"**
Your GitHub token may have expired or been revoked. Go to GitHub Settings → Tokens, generate a new one, and update it in the app via the **Connect GitHub** button.

**"Could not reach the cloud. Please check your internet connection"**
You're offline, or GitHub is temporarily unavailable. Check your connection and try again.

**"There are no changes to save"**
Nothing has changed since your last save — all files are already synced.

**The file list only shows changed files / looks empty**
Try switching away from the project and back again to force a refresh. If the issue persists, fully restart the app.

**The app isn't detecting my changes**
Make sure the project folder is correctly linked and that your changes are inside the linked folder. Sub-folders are watched automatically.

---

## Developer Documentation

### Prerequisites
- [Node.js](https://nodejs.org) 18+
- npm 9+
- Git

### Setup

```bash
git clone https://github.com/98sean/git-abstraction-tool.git
cd git-abstraction-tool
npm install
```

### Development

```bash
npm run dev          # Launch in development mode with hot reload
npm run typecheck    # Type-check without building
npm run build        # Production build
npm test             # Run unit tests
```

### Project Structure

```
src/
├── main/            # Electron main process (Node.js)
│   ├── db/          # Local state (electron-store JSON files)
│   ├── git/         # Git abstraction layer (simple-git)
│   ├── ipc/         # IPC handlers (bridge between main & renderer)
│   └── watcher/     # File system watcher (chokidar)
├── preload/         # Context bridge (exposes safe IPC API to renderer)
└── renderer/        # React frontend
    ├── components/  # UI components (dumb)
    ├── context/     # Global state (AppContext)
    └── hooks/       # Business logic hooks (smart)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop framework | Electron 29 |
| Build tool | electron-vite 2 + Vite 5 |
| Frontend | React 18 + TypeScript 5 |
| Local storage | electron-store v8 (JSON) |
| Git integration | simple-git |
| File watching | chokidar |
| Credential security | Electron safeStorage (OS keychain) |

### Packaging

```bash
npm run package      # Build and package for the current OS
```

Output installers are placed in the `dist/` folder. Cross-platform builds require platform-native toolchains (macOS for DMG, Windows for NSIS, Linux for AppImage).

### Architecture Notes

- The **main process** owns all file system, Git, and credential access
- The **renderer** is a sandboxed React app — it communicates exclusively via IPC
- IPC channels follow two patterns:
  - `db:*` — local data store operations (return raw values)
  - `git:*` — git operations (return `{ data }` or `{ error }` for typed error handling)
  - `auth:*` — credential management (never exposes raw tokens to renderer)
- The file system watcher pushes `db:status:changed` events to the renderer to trigger UI refreshes without polling
- `git:status` fetches both `git status` and `git ls-files` in a single call, so the full file tree (including unchanged files) is always available in the renderer
- The status cache is **in-memory only** — it resets on every app restart to avoid stale data

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

MIT
