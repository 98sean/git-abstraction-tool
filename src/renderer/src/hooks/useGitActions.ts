import { useCallback, useState } from 'react'
import { invokeGit } from '../ipc'
import { GitError, PushToCloudOptions } from '../types'

export function useGitActions(
  project_id: string | null,
  onSuccess?: () => void
): {
  loading: boolean
  error: GitError | null
  commit: (message: string) => Promise<void>
  push: (options?: PushToCloudOptions) => Promise<void>
  pull: () => Promise<void>
  clearError: () => void
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<GitError | null>(null)

  const run = useCallback(
    async (fn: () => Promise<unknown>): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        await fn()
        onSuccess?.()
      } catch (err) {
        setError(err as GitError)
      } finally {
        setLoading(false)
      }
    },
    [onSuccess]
  )

  const commit = useCallback(
    (message: string): Promise<void> => {
      if (!project_id) return Promise.resolve()
      return run(() => invokeGit('git:commit', project_id, message))
    },
    [project_id, run]
  )

  const push = useCallback((options?: PushToCloudOptions): Promise<void> => {
    if (!project_id) return Promise.resolve()
    return run(() => invokeGit('git:push', project_id, options))
  }, [project_id, run])

  const pull = useCallback((): Promise<void> => {
    if (!project_id) return Promise.resolve()
    return run(() => invokeGit('git:pull', project_id))
  }, [project_id, run])

  const clearError = useCallback(() => setError(null), [])

  return { loading, error, commit, push, pull, clearError }
}
