import { useCallback, useEffect, useRef, useState } from 'react'
import { invokeGit } from '../ipc'

export function useTrackedFiles(projectId: string | null): {
  trackedPaths: string[]
  trackedLoading: boolean
  fetchTracked: () => Promise<void>
} {
  const [trackedPaths, setTrackedPaths] = useState<string[]>([])
  const [trackedLoading, setTrackedLoading] = useState(false)
  // Track whether we've completed at least one successful fetch for this project
  const hasFetched = useRef(false)

  const fetchTracked = useCallback(async (): Promise<void> => {
    if (!projectId) { setTrackedPaths([]); hasFetched.current = false; return }
    setTrackedLoading(true)
    try {
      const paths = await invokeGit<string[]>('git:files:tracked', projectId)
      setTrackedPaths(paths)
      hasFetched.current = true
    } catch (err) {
      console.error('[GAT] fetchTracked failed:', err)
      // Keep previous value on error so the file list doesn't disappear
    } finally {
      setTrackedLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    hasFetched.current = false
    fetchTracked()
  }, [fetchTracked])

  return { trackedPaths, trackedLoading, fetchTracked }
}
