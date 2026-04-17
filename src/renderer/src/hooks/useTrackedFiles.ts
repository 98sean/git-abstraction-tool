import { useCallback, useEffect, useState } from 'react'
import { invokeGit } from '../ipc'

export function useTrackedFiles(projectId: string | null): {
  trackedPaths: string[]
  fetchTracked: () => Promise<void>
} {
  const [trackedPaths, setTrackedPaths] = useState<string[]>([])

  const fetchTracked = useCallback(async (): Promise<void> => {
    if (!projectId) { setTrackedPaths([]); return }
    try {
      const paths = await invokeGit<string[]>('git:files:tracked', projectId)
      setTrackedPaths(paths)
    } catch {
      setTrackedPaths([])
    }
  }, [projectId])

  useEffect(() => { fetchTracked() }, [fetchTracked])

  return { trackedPaths, fetchTracked }
}
