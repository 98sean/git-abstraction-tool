import { useEffect, useRef, useState } from 'react'
import { invokeDb } from '../ipc'
import { AiConnectionState, WeeklyAiSummary } from '../types'

interface UseWeeklyAiSummaryReturn {
  aiSummary: WeeklyAiSummary | null
  loading: boolean
  error: string | null
}

/**
 * Fetch a plain-English, feature-focused summary of the current week from the
 * backend (`ai:weekly:summary`). The backend reads `ai-summaries.json` to
 * build the summary — if the AI is not connected or there are no AI summaries
 * in the window, `aiSummary` stays null and the caller should fall back to
 * the rule-based summary.
 *
 * We key the request on (projectId, startDate, endDate, aiConnected) and use
 * a request-id ref to drop stale responses if the user scrubs weeks quickly.
 */
export function useWeeklyAiSummary(
  projectId: string | null,
  startDate: string,
  endDate: string,
  connection: AiConnectionState
): UseWeeklyAiSummaryReturn {
  const [aiSummary, setAiSummary] = useState<WeeklyAiSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reqRef = useRef(0)

  const aiConnected =
    connection.connection_status === 'connected' && Boolean(connection.selected_model)

  useEffect(() => {
    if (!projectId || !aiConnected) {
      setAiSummary(null)
      setLoading(false)
      setError(null)
      return
    }

    const requestId = reqRef.current + 1
    reqRef.current = requestId
    setLoading(true)
    setError(null)

    invokeDb<WeeklyAiSummary>('ai:weekly:summary', projectId, startDate, endDate)
      .then((result) => {
        if (reqRef.current !== requestId) return
        setAiSummary(result)
      })
      .catch((err: { message?: string }) => {
        if (reqRef.current !== requestId) return
        setAiSummary(null)
        setError(err?.message ?? 'Could not generate weekly summary.')
      })
      .finally(() => {
        if (reqRef.current === requestId) {
          setLoading(false)
        }
      })
  }, [projectId, startDate, endDate, aiConnected])

  return { aiSummary, loading, error }
}
