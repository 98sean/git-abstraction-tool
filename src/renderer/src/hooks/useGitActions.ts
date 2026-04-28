import { useCallback, useState } from 'react'
import { invokeGit } from '../ipc'
import { CommitAiMetadata, GitError, PushToCloudOptions } from '../types'

interface UseGitActionsOptions {
  onCommitSuccess?: () => void
  onPushSuccess?: () => void
  onPullSuccess?: () => void
}

export function useGitActions(
  project_id: string | null,
  callbacks: UseGitActionsOptions = {}
): {
  loading: boolean
  error: GitError | null
  commit: (message: string, aiMetadata?: CommitAiMetadata) => Promise<boolean>
  push: (options?: PushToCloudOptions) => Promise<boolean>
  pull: () => Promise<boolean>
  clearError: () => void
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<GitError | null>(null)

  const run = useCallback(
    async (fn: () => Promise<unknown>, onSuccess?: () => void): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        await fn()
        onSuccess?.()
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
      return run(
        () => invokeGit('git:commit', project_id, message, aiMetadata),
        callbacks.onCommitSuccess
      )
    },
    [callbacks.onCommitSuccess, project_id, run]
  )

  const push = useCallback(
    (pushOptions?: PushToCloudOptions): Promise<boolean> => {
      if (!project_id) return Promise.resolve(false)
      return run(() => invokeGit('git:push', project_id, pushOptions), callbacks.onPushSuccess)
    },
    [callbacks.onPushSuccess, project_id, run]
  )

  const pull = useCallback((): Promise<boolean> => {
    if (!project_id) return Promise.resolve(false)
    return run(() => invokeGit('git:pull', project_id), callbacks.onPullSuccess)
  }, [callbacks.onPullSuccess, project_id, run])

  const clearError = useCallback(() => setError(null), [])

  return { loading, error, commit, push, pull, clearError }
}
