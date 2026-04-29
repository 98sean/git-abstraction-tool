// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useNaturalUndo } from '../hooks/useNaturalUndo'
import { NaturalUndoSuggestion } from '../types'

function createSuggestion(commitHash = 'abc123'): NaturalUndoSuggestion {
  return {
    query: 'before the pricing copy changed',
    commit_hash: commitHash,
    short_hash: commitHash.slice(0, 6),
    commit_message: 'Update pricing copy',
    commit_date: '2026-04-28T12:00:00.000Z',
    reason: 'Matched pricing copy changes',
    confidence: 0.84,
    total_restore_files: 1,
    total_remove_files: 0,
    restore_files_preview: ['src/App.tsx'],
    remove_files_preview: [],
    proposal_text: 'Restore to before pricing changed',
    alternatives: []
  }
}

describe('useNaturalUndo', () => {
  it('ignores stale suggestions after cancel', async () => {
    let resolveSuggestion: (suggestion: NaturalUndoSuggestion) => void = () => {}
    const invokeDb = vi.fn(
      () =>
        new Promise<NaturalUndoSuggestion>((resolve) => {
          resolveSuggestion = resolve
        })
    )

    const { result } = renderHook(() =>
      useNaturalUndo({
        activeProjectId: 'project-1',
        invokeDb,
        invokeGit: vi.fn(),
        refresh: vi.fn(),
        addToast: vi.fn()
      })
    )

    await act(async () => {
      void result.current.suggest('before the pricing copy changed')
    })

    act(() => {
      result.current.cancel()
      resolveSuggestion(createSuggestion())
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.suggestion).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
