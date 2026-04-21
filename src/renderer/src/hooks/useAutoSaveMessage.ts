import { useCallback, useState } from 'react'
import { invokeDb } from '../ipc'

export function useAutoSaveMessage(projectId: string | null): {
  generate: () => Promise<string | null>
  loading: boolean
  error: string | null
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (): Promise<string | null> => {
    if (!projectId) {
      return null
    }

    setLoading(true)
    setError(null)

    try {
      return await invokeDb<string | null>('ai:auto-save-message:generate', projectId)
    } catch {
      setError('Could not generate an AI save message right now.')
      return null
    } finally {
      setLoading(false)
    }
  }, [projectId])

  return { generate, loading, error }
}
