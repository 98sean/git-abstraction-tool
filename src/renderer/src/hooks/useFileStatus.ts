import { useCallback, useEffect, useState } from 'react'
import { invokeGit } from '../ipc'
import { GitError, GitStatus } from '../types'

export function useFileStatus(project_id: string | null): {
  status: GitStatus | null
  loading: boolean
  error: GitError | null
  fetchStatus: () => Promise<void>
  stage: (paths: string[]) => Promise<void>
  unstage: (paths: string[]) => Promise<void>
  stageAll: () => Promise<void>
  unstageAll: () => Promise<void>
  revertFile: (path: string) => Promise<void>
} {
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<GitError | null>(null)

  const fetchStatus = useCallback(async (): Promise<void> => {
    if (!project_id) { setStatus(null); return }
    setLoading(true)
    setError(null)
    try {
      const result = await invokeGit<GitStatus>('git:status', project_id)
      setStatus(result)
    } catch (err) {
      setError(err as GitError)
    } finally {
      setLoading(false)
    }
  }, [project_id])

  // Fetch on project change
  useEffect(() => { fetchStatus() }, [fetchStatus])

  // Listen for watcher push events from main process
  useEffect(() => {
    if (!project_id) return
    const handler = (_: Electron.IpcRendererEvent, changedId: string): void => {
      if (changedId === project_id) fetchStatus()
    }
    window.electron.ipcRenderer.on('db:status:changed', handler)
    return () => { window.electron.ipcRenderer.removeAllListeners('db:status:changed') }
  }, [project_id, fetchStatus])

  const stage = useCallback(
    async (paths: string[]): Promise<void> => {
      if (!project_id) return
      await invokeGit('git:stage', project_id, paths)
      await fetchStatus()
    },
    [project_id, fetchStatus]
  )

  const unstage = useCallback(
    async (paths: string[]): Promise<void> => {
      if (!project_id) return
      await invokeGit('git:unstage', project_id, paths)
      await fetchStatus()
    },
    [project_id, fetchStatus]
  )

  const stageAll = useCallback(async (): Promise<void> => {
    if (!project_id || !status) return
    const paths = status.files.filter((f) => !f.staged).map((f) => f.path)
    if (paths.length > 0) { await invokeGit('git:stage', project_id, paths); await fetchStatus() }
  }, [project_id, status, fetchStatus])

  const unstageAll = useCallback(async (): Promise<void> => {
    if (!project_id || !status) return
    const paths = status.files.filter((f) => f.staged).map((f) => f.path)
    if (paths.length > 0) { await invokeGit('git:unstage', project_id, paths); await fetchStatus() }
  }, [project_id, status, fetchStatus])

  const revertFile = useCallback(
    async (path: string): Promise<void> => {
      if (!project_id) return
      await invokeGit('git:revert', project_id, path)
      await fetchStatus()
    },
    [project_id, fetchStatus]
  )

  return { status, loading, error, fetchStatus, stage, unstage, stageAll, unstageAll, revertFile }
}
