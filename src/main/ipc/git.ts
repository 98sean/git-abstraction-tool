import { ipcMain } from 'electron'
import simpleGit from 'simple-git'
import { getGitService, removeGitService } from '../git'
import { getCachedStatus, setCachedStatus, invalidateCache } from '../db/statusCache'
import { getGithubToken } from '../db/credentials'
import { getProjectCloudTarget } from '../db/projectCloudTargets'
import {
  GitError,
  PullConfiguredTargetInput,
  PushConfiguredTargetInput,
  PushToCloudOptions
} from '../git/types'

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

function noRemoteError(message: string): GitError {
  return {
    code: 'NO_REMOTE',
    message
  }
}

function missingBranchError(message: string): GitError {
  return {
    code: 'BRANCH_NOT_FOUND',
    message
  }
}

function getPushTarget(project_id: string, token?: string, options?: PushToCloudOptions): PushConfiguredTargetInput {
  const target = getProjectCloudTarget(project_id)

  if (target.mode === 'backup' && target.backup) {
    return {
      mode: 'backup',
      remoteName: target.backup.remoteName,
      repoOwner: target.backup.repoOwner,
      repoName: target.backup.repoName,
      token
    }
  }

  if (target.mode === 'collaboration' && target.collaboration) {
    if (!target.collaboration.selectedBranch) {
      throw missingBranchError('Choose a work branch before uploading to the team repository.')
    }

    return {
      mode: 'collaboration',
      remoteName: target.collaboration.remoteName,
      branchMode: target.collaboration.branchMode,
      branchName: target.collaboration.selectedBranch,
      dangerConfirmed: options?.dangerConfirmed,
      token
    }
  }

  throw noRemoteError('Set up Upload to Cloud before uploading this project.')
}

function getPullTarget(project_id: string, token?: string): PullConfiguredTargetInput {
  const target = getProjectCloudTarget(project_id)

  if (target.mode === 'collaboration' && target.collaboration?.selectedBranch) {
    return {
      remoteName: target.collaboration.remoteName,
      branchName: target.collaboration.selectedBranch,
      token
    }
  }

  throw noRemoteError('Set up a team upload target before getting updates.')
}

export function registerGitHandlers(): void {
  // Check whether git is installed and reachable on PATH
  ipcMain.handle('git:install:check', async () => {
    try {
      const vr = await simpleGit().version()
      if (!vr.installed) return { installed: false }
      return { installed: true, version: `${vr.major}.${vr.minor}.${vr.patch}` }
    } catch {
      return { installed: false }
    }
  })

  // Initialize a git repo in the project's folder
  ipcMain.handle('git:init', async (_event, project_id: string) => {
    const result = await run(() => getGitService(project_id).init())
    // Recreate the service so subsequent calls see the new repo
    removeGitService(project_id)
    return result
  })

  // Validate a folder path is an existing git repo (pre-flight before adding)
  ipcMain.handle('git:check-repo', async (_event, local_path: string) => {
    try {
      await simpleGit(local_path).status()
      return { isRepo: true }
    } catch {
      return { isRepo: false }
    }
  })

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

  ipcMain.handle('git:push', async (_event, project_id: string, options?: PushToCloudOptions) => {
    const token = getGithubToken() ?? undefined
    const result = await run(() =>
      getGitService(project_id).pushConfiguredTarget(getPushTarget(project_id, token, options))
    )
    invalidateCache(project_id)
    return result
  })

  ipcMain.handle('git:pull', async (_event, project_id: string) => {
    const token = getGithubToken() ?? undefined
    const result = await run(() =>
      getGitService(project_id).pullConfiguredTarget(getPullTarget(project_id, token))
    )
    invalidateCache(project_id)
    return result
  })

  ipcMain.handle('git:files:tracked', (_event, project_id: string) =>
    run(() => getGitService(project_id).listTrackedFiles())
  )

  ipcMain.handle('git:branches', (_event, project_id: string) =>
    run(() => getGitService(project_id).getBranches())
  )

  ipcMain.handle('git:branch:create', (_event, project_id: string, name: string) =>
    run(() => getGitService(project_id).createBranch(name))
  )

  ipcMain.handle('git:branch:switch', (_event, project_id: string, name: string) =>
    run(() => getGitService(project_id).switchBranch(name))
  )

  ipcMain.handle('git:branch:delete', (_event, project_id: string, name: string) =>
    run(() => getGitService(project_id).deleteBranch(name))
  )

  ipcMain.handle('git:untracked:delete', async (_event, project_id: string, paths: string[]) => {
    const result = await run(() => getGitService(project_id).deleteUntracked(paths))
    invalidateCache(project_id)
    return result
  })

  ipcMain.handle('git:revert', (_event, project_id: string, path: string) =>
    run(() => getGitService(project_id).revertFile(path))
  )

  ipcMain.handle(
    'git:log',
    (_event, project_id: string, limit?: number) =>
      run(() => getGitService(project_id).getLog(limit))
  )

  ipcMain.handle(
    'git:timeline',
    (_event, project_id: string, limit?: number) =>
      run(() => getGitService(project_id).getTimeline(limit))
  )

  ipcMain.handle(
    'git:restore:preview',
    (_event, project_id: string, commitHash: string) =>
      run(() => getGitService(project_id).getRestorePreview(commitHash))
  )

  ipcMain.handle(
    'git:restore:apply',
    async (_event, project_id: string, commitHash: string) => {
      const result = await run(() => getGitService(project_id).restoreToCommit(commitHash))
      invalidateCache(project_id)
      return result
    }
  )

  // Clean up service instance when a project is removed
  ipcMain.handle('git:service:remove', (_event, project_id: string) => {
    removeGitService(project_id)
  })
}
