import { useCallback, useRef, useState } from 'react'
import { NaturalUndoSuggestion, RestoreResult } from '../types'

type InvokeDb = <T>(channel: string, ...args: unknown[]) => Promise<T>
type InvokeGit = <T>(channel: string, ...args: unknown[]) => Promise<T>

interface UseNaturalUndoOptions {
  activeProjectId: string | null
  invokeDb: InvokeDb
  invokeGit: InvokeGit
  refreshStatus: () => Promise<void>
  refreshBranches: () => Promise<void>
  addToast: (message: string, tone?: 'success' | 'error' | 'info') => void
}

interface UseNaturalUndoResult {
  suggestion: NaturalUndoSuggestion | null
  loading: boolean
  applying: boolean
  error: string | null
  suggest: (query: string) => Promise<void>
  apply: () => Promise<void>
  cancel: () => void
  selectAlternative: (alternativeIndex: number) => void
  reset: () => void
}

export function useNaturalUndo({
  activeProjectId,
  invokeDb,
  invokeGit,
  refreshStatus,
  refreshBranches,
  addToast
}: UseNaturalUndoOptions): UseNaturalUndoResult {
  const [suggestion, setSuggestion] = useState<NaturalUndoSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef(0)

  const reset = useCallback((): void => {
    requestRef.current += 1
    setSuggestion(null)
    setError(null)
    setLoading(false)
    setApplying(false)
  }, [])

  const suggest = useCallback(
    async (query: string): Promise<void> => {
      if (!activeProjectId) return

      const requestId = requestRef.current + 1
      requestRef.current = requestId
      setLoading(true)
      setError(null)

      try {
        const nextSuggestion = await invokeDb<NaturalUndoSuggestion>(
          'ai:undo:suggest',
          activeProjectId,
          query
        )
        if (requestRef.current !== requestId) return
        setSuggestion(nextSuggestion)
      } catch (caught) {
        if (requestRef.current !== requestId) return
        const message =
          (caught as { message?: string })?.message ?? 'Could not find a matching point in history.'
        setError(message)
        setSuggestion(null)
      } finally {
        if (requestRef.current === requestId) {
          setLoading(false)
        }
      }
    },
    [activeProjectId, invokeDb]
  )

  const cancel = useCallback((): void => {
    requestRef.current += 1
    setSuggestion(null)
    setError(null)
    setLoading(false)
  }, [])

  const selectAlternative = useCallback((alternativeIndex: number): void => {
    setSuggestion((current) => {
      if (!current) return current
      const picked = current.alternatives[alternativeIndex]
      if (!picked) return current

      const { alternatives: _drop, query, ...oldPrimary } = current
      void _drop
      const remaining = current.alternatives.filter((_, i) => i !== alternativeIndex)
      const nextAlternatives = [oldPrimary, ...remaining].slice(0, 2)

      return {
        query,
        ...picked,
        alternatives: nextAlternatives
      }
    })
  }, [])

  const apply = useCallback(async (): Promise<void> => {
    if (!activeProjectId || !suggestion) return

    setApplying(true)
    setError(null)

    try {
      const result = await invokeGit<RestoreResult>(
        'git:restore:apply',
        activeProjectId,
        suggestion.commit_hash
      )
      await refreshStatus()
      await refreshBranches()
      addToast(
        `Restore complete (restored ${result.restored_files}, removed ${result.removed_files})`,
        'success'
      )
    } catch (caught) {
      const message =
        (caught as { message?: string })?.message ?? 'Restore failed due to an unexpected error.'
      setError(message)
    } finally {
      setApplying(false)
    }
  }, [activeProjectId, addToast, invokeGit, refreshBranches, refreshStatus, suggestion])

  return {
    suggestion,
    loading,
    applying,
    error,
    suggest,
    apply,
    cancel,
    selectAlternative,
    reset
  }
}
