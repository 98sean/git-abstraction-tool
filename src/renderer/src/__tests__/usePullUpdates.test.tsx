// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePullUpdates } from '../hooks/usePullUpdates'
import { PullUpdatesPreview } from '../types'

function createPreview(behindCount = 1): PullUpdatesPreview {
  return {
    remote_name: 'origin',
    branch_name: 'main',
    current_branch: 'feature/demo',
    behind_count: behindCount,
    latest_remote_hash: 'abc123',
    commits: [
      {
        hash: 'abc123',
        short_hash: 'abc123',
        message: 'Update shared UI',
        author_name: 'Teammate',
        date: '2026-04-28T12:00:00.000Z'
      }
    ]
  }
}

describe('usePullUpdates', () => {
  it('opens a preview instead of pulling immediately when incoming commits exist', async () => {
    const pull = vi.fn().mockResolvedValue(undefined)
    const invokeGit = vi.fn().mockResolvedValue(createPreview())

    const { result } = renderHook(() =>
      usePullUpdates({
        activeProjectId: 'project-1',
        enabled: false,
        currentBranch: 'feature/demo',
        invokeGit,
        pull,
        refreshStatus: vi.fn()
      })
    )

    await act(async () => {
      await result.current.requestPull()
    })

    await waitFor(() => {
      expect(result.current.showDialog).toBe(true)
    })

    expect(result.current.preview?.behind_count).toBe(1)
    expect(pull).not.toHaveBeenCalled()
  })
})
