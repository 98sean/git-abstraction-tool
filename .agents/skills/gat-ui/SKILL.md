---
name: gat-ui
description: UI/UX Component Developer for Local Git UI Abstraction Tool (Desktop Application)
---

## Tech Stack (Decided)
- **Desktop framework:** Electron 29 (renderer process = browser environment)
- **Build tool:** electron-vite 2 + Vite 5
- **UI framework:** React 18 + TypeScript 5
- **IPC:** `window.electron.ipcRenderer.invoke(channel, ...args)` for all main-process calls
- **State management:** React Context + `useReducer` for global state; local `useState` for component state
- **Styling:** Plain CSS Modules (no external UI library — keeps bundle small, full control over design)

## Project Phases

### Phase 1 — Foundation & Scaffolding ✅ COMPLETE
- Electron + Vite + React + TypeScript scaffold
- `src/renderer/src/App.tsx` placeholder

### Phase 2 — Core Infrastructure (gat-db) ✅ COMPLETE
- No UI work this phase. DB and IPC channels wired in the main process.

### Phase 3 — Git Abstraction Layer ✅ COMPLETE
- No UI work this phase. Git service built in the main process.

### Phase 4 — UI ✅ COMPLETE
**Layout:** 2-column CSS Grid — `Sidebar` (260px) + main area (header / `FileManager` / `ActionPanel`)

**Component tree:**
```
App
├── Sidebar          ← project list, "Link a Project" button, theme toggle
├── Header           ← project name + current branch (from git:status)
├── FileManager      ← file list with checkboxes; stage/unstage/revert per file
├── ActionPanel      ← commit message input, "Save Progress", "Upload to Cloud", "Get Updates"
└── Toast            ← floating notifications (success, error, info)
```

**State & data flow:**
- `AppContext` (useReducer) holds: `projects[]`, `activeProjectId`, `preferences`, `toasts[]`
- All IPC calls live in hooks (`useProjects`, `useFileStatus`, `useGitActions`, `usePreferences`, `useToast`)
- Components are dumb — receive data and callbacks via props only
- `db:status:changed` push event from main → triggers re-fetch in `useFileStatus`

**Styling:** CSS Modules + CSS custom properties for light/dark theming. Applied via `data-theme` attribute on `<html>`. No external UI library.

### Phase 5 — Polish & Reliability ← CURRENT
- `ConnectGitHub` component — inline prompt shown when `AUTH_FAILED` or no token stored
- `useAuth` hook — `auth:token:exists`, `auth:token:set`, `auth:token:clear` via IPC
- GitHub connection status indicator in Sidebar footer
- Vitest unit tests for error mapper
- `electron-builder` packaging: Windows NSIS, macOS DMG, Linux AppImage
- `README.md` user guide

---

## 1. Core Philosophy (Absolute Rules)
- **Zero Git Terminology:** Completely hide Git concepts from the user. Never use terms like `commit`, `push`, `pull`, `branch`, `merge`, or `repository` in UI text, tooltips, or error alerts.
- **File Manager Experience:** The interface mimics consumer file managers or cloud sync apps (Google Drive / Dropbox).
- **Renderer is dumb:** The renderer never calls `child_process`, accesses the file system, or touches the DB directly. All data flows through IPC via `window.electron.ipcRenderer.invoke(...)`.

## 2. Terminology Mapping (Strict Enforcement)
Always use these exact translations in UI text and variable names representing UI text:
- `git add` → "Select changes" / "Stage files"
- `git commit` → "Save progress" / "Save version"
- `git push` → "Upload to Cloud" / "Sync"
- `git branch` → "Create new version" / "Experiment"
- `git checkout` / `restore` → "Revert to previous state" / "Undo changes"
- `conflict` → "Cloud version mismatch"

## 3. Component Architecture
- **Dumb Components:** UI components handle rendering and user interaction only (clicks, drag-and-drop). No business logic.
- **Smart Hooks:** All IPC calls, state mutations, and side effects live in custom hooks (`useProjects`, `useFileStatus`, `usePreferences`, etc.).
- **IPC calls:** Always use `await window.electron.ipcRenderer.invoke('db:resource:action', payload)` inside hooks, never inside components.

## 4. IPC Channel Reference (from gat-db)
The renderer uses these channels to communicate with the main process:
- `db:projects:list` — fetch all linked project folders
- `db:projects:add` — link a new project folder
- `db:projects:remove` — unlink a project
- `db:preferences:get` — fetch all user preferences
- `db:preferences:set` — update a preference
- `db:status:get` — get cached file status for a project (raw cache read)
- `db:status:invalidate` — drop the cache entry
- `git:status` — fetch full git status (cache-first, auto-populates cache)
- `git:stage` — stage file paths
- `git:unstage` — unstage file paths
- `git:commit` — commit with message ("Save Progress")
- `git:push` — push to remote ("Upload to Cloud")
- `git:pull` — pull from remote
- `git:branches` — list all branches
- `git:branch:create` — create new branch ("New Experiment")
- `git:branch:switch` — switch branch
- `git:revert` — revert a file to last saved state ("Undo Changes")
- `git:log` — get history timeline

## 5. Key UX Interactions
- **Drag and Drop:** Prioritize drag-and-drop zones for adding files or folders to the "Save" queue.
- **Visual Status Indicators:** Use intuitive icons and colors (green checkmarks for synced, blue dots for new files, yellow for unsaved changes) — no text-heavy logs.
- **Loading States:** Always show spinners, progress bars, or skeleton loaders during IPC operations (especially "Syncing to Cloud").

## 6. Error Handling in UI
- Never display raw terminal or IPC errors to the user.
- Intercept errors in hooks and dispatch friendly, actionable toast notifications.
  - Example: "We couldn't upload your files because the internet connection was lost. Please check your network and try again."
- DB recovery state: if the main process emits a `db:recovered` event, show a modal prompting the user to re-link their project folders.
