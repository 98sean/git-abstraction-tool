# Git Abstraction Tool

A simple, friendly desktop app for saving and sharing your work — no technical knowledge required.

Think of it like having an automatic "undo history" for your entire project, plus the ability to upload your work to the cloud so it's never lost.

---

## What does it do?

- **Saves snapshots of your work** — capture exactly what you changed and why, so you can always go back
- **Syncs to the cloud** — upload your saved work to GitHub for backup and sharing
- **Tracks changes automatically** — see a live list of everything you've modified since your last save
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

---

## Getting Started

### 1. Link your first project

When you open the app, click **+ Link a Project** in the left sidebar.

A folder picker will open — navigate to your project folder and select it. Give it a friendly name (e.g. "My Novel", "Website", "School Project").

Your project is now being monitored. Any files you change will appear in the main area.

### 2. See what's changed

The main file list shows everything you've modified since your last save. Each file has a coloured dot:

| Colour | Meaning |
|--------|---------|
| 🔵 Blue | New file |
| 🟡 Yellow | Modified (changed) |
| 🔴 Red | Deleted |
| 🟣 Purple | Renamed |

### 3. Select the changes you want to save

Check the box next to each file you want to include in this save. Click **Select all** to include everything, or pick individual files.

### 4. Save your progress

Type a brief note in the message box describing what you did — for example: *"Added introduction chapter"* or *"Fixed the contact form layout"*.

Click **Save Progress**. Your changes are now permanently recorded with that note.

### 5. Upload to the cloud

Once you've saved, click **Upload to Cloud** to push your work to GitHub. This backs it up online and lets collaborators see your changes.

If you want to download changes made by others, click **Get Updates**.

---

## Connecting to GitHub

To use the cloud sync features, you'll need to connect your GitHub account.

### Getting a Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a name (e.g. "Git Abstraction Tool")
4. Select the **`repo`** permission scope
5. Click **Generate token** and copy it

> Keep your token private — treat it like a password.

### Entering your token in the app

In the left sidebar, click **Connect GitHub** (or go to **Settings → GitHub**).

Paste your token and click **Connect**. The app will securely encrypt and store it using your operating system's built-in keychain (Windows Credential Locker / macOS Keychain / Linux Secret Service).

Your token is **never stored in plain text** and never leaves your computer except when communicating directly with GitHub.

---

## Features Overview

### Multiple Projects
Link as many project folders as you like. Switch between them instantly from the sidebar — each keeps its own change history.

### Light & Dark Mode
Click the theme toggle at the bottom of the sidebar to switch between light and dark mode. Your preference is saved automatically.

### Undo Changes to a File
Hover over any file in the list and click **Undo** to revert it back to how it was at your last save point. This only affects that one file.

### See Upload / Download Status
The header shows how many saves you have ready to upload (↑) and how many updates are waiting to download (↓).

### Version Mismatches
If you and a collaborator have both changed the same file, the app will warn you with a **"Version mismatch"** indicator. You'll need to resolve this before uploading — this is an advanced scenario; reach out to your collaborator to coordinate.

---

## Troubleshooting

**"This folder is not a linked project"**
The folder you linked may not have been set up with Git. Open a terminal in that folder and run `git init`, then re-link it.

**"Login failed. Please check your credentials"**
Your GitHub token may have expired or been revoked. Go to GitHub Settings → Tokens, generate a new one, and update it in the app via the **Connect GitHub** button.

**"Could not reach the cloud. Please check your internet connection"**
You're offline, or GitHub is temporarily unavailable. Check your connection and try again.

**"There are no changes to save"**
All your selected files are already up to date — nothing has changed since your last save.

**The file list is empty even though I've made changes**
Click the **Refresh** button (or re-select your project from the sidebar) to manually refresh the file list.

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

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

MIT
