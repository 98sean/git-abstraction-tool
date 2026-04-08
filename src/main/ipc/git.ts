import { ipcMain } from 'electron'
import { getGitService, removeGitService } from '../git'
import { getCachedStatus, setCachedStatus, invalidateCache } from '../db/statusCache'
import { getGithubToken } from '../db/credentials'
import { GitError } from '../git/types'

// Wrap a git call so IPC errors are serialisable plain objects (Errors don't
// survive the IPC boundary cleanly in Electron).
async function run<T>(fn: () => Promise<T>): Promise<{ data: T } | { error: GitError }> {
  try {
    const data = await fn()
    return { data }
  } catch (err) {
    return { error: err as GitError }
  }
}

export function registerGitHandlers(): void {
  // Status — cache-first; populates statusCache on miss
  ipcMain.handle('git:status', async (_event, project_id: string) => {
    const cached = getCachedStatus(project_id)
    if (cached) return { data: cached }

    return run(async () => {
      const status = await getGitService(project_id).getStatus()
      setCachedStatus(project_id, status)
      return status
    })
  })

  ipcMain.handle('git:stage', async (_event, project_id: string, paths: string[]) => {
    const result = await run(() => getGitService(project_id).stage(paths))
    invalidateCache(project_id)
    return result
  })

  ipcMain.handle('git:unstage', async (_event, project_id: string, paths: string[]) => {
    const result = await run(() => getGitService(project_id).unstage(paths))
    invalidateCache(project_id)
    return result
  })

  ipcMain.handle('git:commit', async (_event, project_id: string, message: string) => {
    const result = await run(() => getGitService(project_id).commit(message))
    invalidateCache(project_id)
    return result
  })

  ipcMain.handle('git:push', (_event, project_id: string) => {
    const token = getGithubToken() ?? undefined
    return run(() => getGitService(project_id).push(token))
  })

  ipcMain.handle('git:pull', (_event, project_id: string) => {
    const token = getGithubToken() ?? undefined
    return run(() => getGitService(project_id).pull(token))
  })

  ipcMain.handle('git:branches', (_event, project_id: string) =>
    run(() => getGitService(project_id).getBranches())
  )

  ipcMain.handle('git:branch:create', (_event, project_id: string, name: string) =>
    run(() => getGitService(project_id).createBranch(name))
  )

  ipcMain.handle('git:branch:switch', (_event, project_id: string, name: string) =>
    run(() => getGitService(project_id).switchBranch(name))
  )

  ipcMain.handle('git:revert', (_event, project_id: string, path: string) =>
    run(() => getGitService(project_id).revertFile(path))
  )

  ipcMain.handle(
    'git:log',
    (_event, project_id: string, limit?: number) =>
      run(() => getGitService(project_id).getLog(limit))
  )

  // Clean up service instance when a project is removed
  ipcMain.handle('git:service:remove', (_event, project_id: string) => {
    removeGitService(project_id)
  })
}
