import { useCallback, useState } from 'react'
import { invokeGit } from '../ipc'
import { CommitAiMetadata, GitError, PushConfiguredTargetResult, PushToCloudOptions } from '../types'

interface UseGitActionsOptions {
  onCommitSuccess?: () => void
  onPushSuccess?: (result: PushConfiguredTargetResult) => void
  onPullSuccess?: () => void
}

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: GitError }

export function useGitActions(
  project_id: string | null,
  callbacks: UseGitActionsOptions = {}
): {
  loading: boolean
  error: GitError | null
  commit: (message: string, aiMetadata?: CommitAiMetadata) => Promise<boolean>
  push: (options?: PushToCloudOptions) => Promise<PushConfiguredTargetResult | null>
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

  const runWithResult = useCallback(
    async <T,>(fn: () => Promise<T>, onSuccess?: (data: T) => void): Promise<ActionResult<T>> => {
      setLoading(true)
      setError(null)
      try {
        const data = await fn()
        onSuccess?.(data)
        return { ok: true, data }
      } catch (err) {
        const gitError = err as GitError
        setError(gitError)
        return { ok: false, error: gitError }
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
    async (pushOptions?: PushToCloudOptions): Promise<PushConfiguredTargetResult | null> => {
      if (!project_id) return null
      const result = await runWithResult(
        () => invokeGit<PushConfiguredTargetResult>('git:push', project_id, pushOptions),
        callbacks.onPushSuccess
      )
      return result.ok ? result.data : null
    },
    [callbacks.onPushSuccess, project_id, runWithResult]
  )

  const pull = useCallback((): Promise<boolean> => {
    if (!project_id) return Promise.resolve(false)
    return run(() => invokeGit('git:pull', project_id), callbacks.onPullSuccess)
  }, [callbacks.onPullSuccess, project_id, run])

  const clearError = useCallback(() => setError(null), [])

  return { loading, error, commit, push, pull, clearError }
}
