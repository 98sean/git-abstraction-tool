import { useCallback, useRef, useState } from 'react'
import { FileInsight } from '../types'

type InvokeDb = <T>(channel: string, ...args: unknown[]) => Promise<T>

interface UseFileInsightOptions {
  activeProjectId: string | null
  enabled: boolean
  invokeDb: InvokeDb
}

interface UseFileInsightResult {
  selectedPath: string | null
  insight: FileInsight | null
  loading: boolean
  error: string | null
  selectFile: (filePath: string) => Promise<void>
  clear: () => void
  reset: () => void
}

function getFriendlyErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: string })?.message?.trim()
  if (!message || message.endsWith('[object Object]')) {
    return fallback
  }

  return message.replace(/^Error invoking remote method '[^']+':\s*/, '')
}

export function useFileInsight({
  activeProjectId,
  enabled,
  invokeDb
}: UseFileInsightOptions): UseFileInsightResult {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [insight, setInsight] = useState<FileInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef(0)

  const reset = useCallback((): void => {
    requestRef.current += 1
    setSelectedPath(null)
    setInsight(null)
    setError(null)
    setLoading(false)
  }, [])

  const clear = useCallback((): void => {
    reset()
  }, [reset])

  const selectFile = useCallback(
    async (filePath: string): Promise<void> => {
      if (!activeProjectId) return

      setSelectedPath(filePath)
      setError(null)
      setInsight(null)

      if (!enabled) {
        setLoading(false)
        setError('Connect AI to analyze files.')
        return
      }

      setLoading(true)

      const requestId = requestRef.current + 1
      requestRef.current = requestId

      try {
        const result = await invokeDb<FileInsight>('ai:file:insight', activeProjectId, filePath)
        if (requestRef.current !== requestId) return
        setInsight(result)
      } catch (caught) {
        if (requestRef.current !== requestId) return
        const message = getFriendlyErrorMessage(caught, 'Could not analyze this file.')
        setError(message)
      } finally {
        if (requestRef.current === requestId) {
          setLoading(false)
        }
      }
    },
    [activeProjectId, enabled, invokeDb]
  )

  return {
    selectedPath,
    insight,
    loading,
    error,
    selectFile,
    clear,
    reset
  }
}
