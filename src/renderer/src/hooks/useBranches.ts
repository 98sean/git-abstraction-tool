import { useCallback, useEffect, useState } from 'react'
import { BranchInfo } from '../types'
import { invokeGit } from '../ipc'

export function useBranches(projectId: string | null): {
  branches: BranchInfo[]
  loading: boolean
  fetchBranches: () => Promise<void>
  switchBranch: (name: string) => Promise<void>
  createBranch: (name: string) => Promise<void>
} {
  const [branches, setBranches] = useState<BranchInfo[]>([])
  const [loading, setLoading] = useState(false)

  const fetchBranches = useCallback(async () => {
    if (!projectId) { setBranches([]); return }
    setLoading(true)
    try {
      const all = await invokeGit<BranchInfo[]>('git:branches', projectId)
      // Show only local branches in the selector
      setBranches(all.filter((b) => !b.remote))
    } catch {
      setBranches([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const switchBranch = useCallback(
    async (name: string) => {
      await invokeGit('git:branch:switch', projectId, name)
      await fetchBranches()
    },
    [projectId, fetchBranches]
  )

  const createBranch = useCallback(
    async (name: string) => {
      await invokeGit('git:branch:create', projectId, name)
      await fetchBranches()
    },
    [projectId, fetchBranches]
  )

  return { branches, loading, fetchBranches, switchBranch, createBranch }
}
