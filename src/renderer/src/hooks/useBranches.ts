import { useCallback, useEffect, useState } from 'react'
import { BranchCreateResult, BranchDeleteResult, BranchInfo, BranchMergeResult } from '../types'
import { invokeGit } from '../ipc'

export function useBranches(projectId: string | null): {
  branches: BranchInfo[]
  loading: boolean
  fetchBranches: () => Promise<void>
  fetchDefaultBranch: (remoteName?: string) => Promise<string | null>
  switchBranch: (name: string) => Promise<void>
  createBranch: (name: string) => Promise<BranchCreateResult>
  mergeBranch: (name: string) => Promise<BranchMergeResult>
  deleteBranch: (name: string) => Promise<BranchDeleteResult>
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

  const fetchDefaultBranch = useCallback(
    async (remoteName = 'origin') => {
      if (!projectId) return null
      return await invokeGit<string | null>('git:branch:default', projectId, remoteName)
    },
    [projectId]
  )

  const createBranch = useCallback(
    async (name: string) => {
      const result = await invokeGit<BranchCreateResult>('git:branch:create', projectId, name)
      await fetchBranches()
      return result
    },
    [projectId, fetchBranches]
  )

  const mergeBranch = useCallback(
    async (name: string) => {
      const result = await invokeGit<BranchMergeResult>('git:branch:merge', projectId, name)
      await fetchBranches()
      return result
    },
    [projectId, fetchBranches]
  )

  const deleteBranch = useCallback(
    async (name: string) => {
      const result = await invokeGit<BranchDeleteResult>('git:branch:delete', projectId, name)
      await fetchBranches()
      return result
    },
    [projectId, fetchBranches]
  )

  return {
    branches,
    loading,
    fetchBranches,
    fetchDefaultBranch,
    switchBranch,
    createBranch,
    mergeBranch,
    deleteBranch
  }
}
