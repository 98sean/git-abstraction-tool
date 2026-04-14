import { useCallback, useState } from 'react'
import { invokeGit } from '../ipc'
import { CommitAiMetadata, GitError } from '../types'

export function useGitActions(
  project_id: string | null
): {
  loading: boolean
  error: GitError | null
  commit: (message: string, aiMetadata?: CommitAiMetadata) => Promise<boolean>
  push: () => Promise<boolean>
  pull: () => Promise<boolean>
  clearError: () => void
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<GitError | null>(null)

  const run = useCallback(
    async (fn: () => Promise<unknown>): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        await fn()
        return true
      } catch (err) {
        setError(err as GitError)
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const commit = useCallback(
    (message: string, aiMetadata?: CommitAiMetadata): Promise<boolean> => {
      if (!project_id) return Promise.resolve(false)
      return run(() => invokeGit('git:commit', project_id, message, aiMetadata))
    },
    [project_id, run]
  )

  const push = useCallback((): Promise<boolean> => {
    if (!project_id) return Promise.resolve(false)
    return run(() => invokeGit('git:push', project_id))
  }, [project_id, run])

  const pull = useCallback((): Promise<boolean> => {
    if (!project_id) return Promise.resolve(false)
    return run(() => invokeGit('git:pull', project_id))
  }, [project_id, run])

  const clearError = useCallback(() => setError(null), [])

  return { loading, error, commit, push, pull, clearError }
}
