---
name: gat-db
description: Database & Local State Manager for Local Git UI Abstraction Tool (Desktop Application)
---

## Tech Stack (Decided)
- **Desktop framework:** Electron 29
- **Build tool:** electron-vite 2 + Vite 5
- **Frontend:** React 18 + TypeScript 5
- **Local database:** `electron-store` v8 (JSON-based key-value store, no native compilation required)
- **File system watcher:** `chokidar` (detects changes to watched project directories)
- **Secure credential storage:** Electron's built-in `safeStorage` API (encrypts via OS keychain — no `keytar`)
- **Git CLI wrapper:** `simple-git` (Node.js library, runs in the main process)

## Project Phases

### Phase 1 — Foundation & Scaffolding ✅ COMPLETE
- Electron 29 + electron-vite 2 + React 18 + TypeScript 5 scaffold
- `package.json`, `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`, `electron.vite.config.ts`, `.gitignore`
- Directory structure: `src/main/`, `src/preload/`, `src/renderer/`
- Verified: `npm run typecheck` passes, `npm run build` produces all 3 bundles

### Phase 2 — Core Infrastructure (gat-db) ✅ COMPLETE
- `electron-store` v8, `chokidar`, `uuid` installed (switched from `better-sqlite3` — ClangCL not available in VS2019 Build Tools)
- Three JSON stores: `projects.json`, `preferences.json`, `statusCache.json` (`src/main/db/`)
- IPC handlers for all `db:*` channels (`src/main/ipc/`)
- `chokidar` file watcher — watches all project dirs, invalidates status cache on any fs change (`src/main/watcher/`)
- Verified: `npm run typecheck` passes, `npm run build` produces all 3 bundles

### Phase 3 — Git Abstraction Layer ✅ COMPLETE
- Add `simple-git` dependency
- Structured types: `FileStatus`, `GitStatus`, `CommitInfo`, `BranchInfo`, `GitError` (`src/main/git/types.ts`)
- Error mapper: raw `simple-git` errors → typed `GitError` codes (`src/main/git/errors.ts`)
- `GitService` class: `getStatus`, `stage`, `unstage`, `commit`, `push`, `pull`, `getBranches`, `createBranch`, `switchBranch`, `revertFile`, `getLog` (`src/main/git/service.ts`)
- Per-project service factory (`src/main/git/index.ts`)
- IPC handlers for all `git:*` channels (`src/main/ipc/git.ts`)
- `git:status` populates `statusCache` on cache miss

### Phase 4 — UI (gat-ui) ✅ COMPLETE
- `dialog:openFolder` IPC channel for native folder picker
- Watcher emits `db:status:changed` push event to renderer on fs change
- Renderer: `types.ts`, `ipc.ts` (typed IPC helpers), `index.css` (CSS variables + theming)
- Global state: `context/AppContext.tsx` (useReducer — projects, active project, preferences, toasts)
- Hooks: `useProjects`, `useFileStatus`, `useGitActions`, `usePreferences`, `useToast`
- Components: Sidebar (project list, link project), FileManager (file list + checkboxes), ActionPanel (commit + push/pull), shared Spinner + Toast
- App layout: 2-column grid (sidebar 260px + main area with header / file list / action panel)
- Terminology mapping strictly enforced (no Git jargon in UI)
- Verified: `npm run typecheck` passes, `npm run build` produces main (13.66 kB) + CSS (12.88 kB) + renderer (242.69 kB) bundles

### Phase 5 — Polish & Reliability ← CURRENT
- `safeStorage` GitHub token encryption (`src/main/db/credentials.ts`)
- Auth IPC channels: `auth:token:set`, `auth:token:exists`, `auth:token:clear`
- git:push / git:pull wired to inject token into HTTPS remote URL (not persisted to git config)
- Renderer: `useAuth` hook + `ConnectGitHub` component (shown on AUTH_FAILED or first run)
- Vitest unit tests for error mapper (`src/main/git/__tests__/errors.test.ts`)
- `electron-builder` packaging: NSIS installer (Win), DMG (macOS), AppImage (Linux)
- `README.md` user guide (non-technical language)

---

## 1. Core Philosophy
- **Lightweight & Local:** Three separate `electron-store` JSON files in `app.getPath('userData')`: `projects.json`, `preferences.json`, `statusCache.json`. No network database, no ORM.
- **Single Source of Truth:** Git (via `simple-git`) remains the ultimate source of truth for file versions. The local store only holds application metadata.
- **Main-process only:** All store access runs exclusively in the Electron **main process**. The renderer communicates via typed IPC channels defined in the preload script.

## 2. Responsibilities & Data Structures

### Store: `projects` (projects.json)
```typescript
interface ProjectsStore {
  projects: Array<{
    project_id: string    // UUID v4
    local_path: string
    friendly_name: string
    last_accessed: number // Unix timestamp (ms)
  }>
}
```

### Store: `preferences` (preferences.json)
```typescript
interface PreferencesStore {
  theme: 'light' | 'dark'                  // default: 'light'
  auto_save_enabled: boolean               // default: true
  default_save_message_template: string    // default: ''
}
```

### Store: `statusCache` (statusCache.json)
```typescript
interface StatusCacheStore {
  [project_id: string]: {
    status: unknown     // JSON-serialised git status result (Phase 3+)
    cached_at: number   // Unix timestamp (ms)
  }
}
```

## 3. Data Handling Rules
- **Non-Blocking via IPC:** `electron-store` reads/writes are synchronous but fast (small JSON files). All calls are wrapped in `ipcMain.handle` handlers, making them async from the renderer's perspective. The renderer always uses `await window.electron.ipcRenderer.invoke(...)`.
- **Data Integrity:** `electron-store` handles missing files by creating them with defaults automatically. If a store file is corrupted (invalid JSON), `electron-store` clears it and recreates with defaults. The user is notified via a `db:recovered` IPC event so the UI can prompt them to re-link projects.
- **Cache Invalidation:** `chokidar` watches the `local_path` of each active project. On any `change`/`add`/`unlink` event, the corresponding `status_cache` row is deleted. The renderer re-fetches status on next view activation.

## 4. Security & Privacy
- **No plain-text credentials.** GitHub tokens are encrypted with `safeStorage.encryptString()` before being stored (added in Phase 5). They are decrypted in-memory in the main process only and never sent to the renderer.
- **Context isolation ON.** The renderer has no direct access to Node.js APIs. All sensitive operations go through the preload's `contextBridge`.

## 5. IPC Channel Conventions
All channels follow the pattern `db:<resource>:<action>`:
- `db:projects:list` → returns all projects
- `db:projects:add` → adds a new project row
- `db:projects:remove` → removes a project and cascades status_cache
- `db:preferences:get` → returns all preference key/value pairs
- `db:preferences:set` → sets a single preference key
- `db:status:get` → returns cached status for a project_id (null if not cached)
- `db:status:invalidate` → deletes cache row (next `git:status` call will repopulate)

### Git channels — `git:<resource>:<action>` (Phase 3+)
- `git:status` → fetch status (cache-first; populates cache on miss)
- `git:stage` → stage file paths
- `git:unstage` → unstage file paths
- `git:commit` → commit with message
- `git:push` → push current branch to remote
- `git:pull` → pull from remote
- `git:branches` → list all branches
- `git:branch:create` → create new branch
- `git:branch:switch` → switch to branch
- `git:revert` → revert a single file to HEAD
- `git:log` → get commit history (default last 50)
