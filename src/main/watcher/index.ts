import chokidar, { FSWatcher } from 'chokidar'
import { BrowserWindow } from 'electron'
import { invalidateCache } from '../db/statusCache'
import { listProjects } from '../db/projects'

// Map of project_id -> FSWatcher instance
const watchers = new Map<string, FSWatcher>()

function notifyRenderer(project_id: string): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('db:status:changed', project_id)
  })
}

export function watchProject(project_id: string, local_path: string): void {
  if (watchers.has(project_id)) return

  const watcher = chokidar.watch(local_path, {
    ignoreInitial: true,
    ignored: /(^|[/\\])\../, // ignore dot-files (e.g. .git internals)
    persistent: true,
    depth: 5
  })

  const invalidate = (): void => {
    invalidateCache(project_id)
    notifyRenderer(project_id)
  }

  watcher.on('add', invalidate)
  watcher.on('change', invalidate)
  watcher.on('unlink', invalidate)
  watcher.on('addDir', invalidate)
  watcher.on('unlinkDir', invalidate)

  watchers.set(project_id, watcher)
}

export function stopWatchingProject(project_id: string): void {
  const watcher = watchers.get(project_id)
  if (watcher) {
    watcher.close()
    watchers.delete(project_id)
  }
}

export function startWatchingAllProjects(): void {
  for (const project of listProjects()) {
    watchProject(project.project_id, project.local_path)
  }
}

export function stopAllWatchers(): void {
  for (const [project_id] of watchers) {
    stopWatchingProject(project_id)
  }
}
