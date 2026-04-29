// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFileInsight } from '../hooks/useFileInsight'
import { FileInsight } from '../types'

function createInsight(filePath = 'src/App.tsx'): FileInsight {
  return {
    file_path: filePath,
    summary: 'Main renderer shell',
    functionality: 'Coordinates app-level UI state',
    related_files: []
  }
}

describe('useFileInsight', () => {
  it('ignores stale insight results after reset', async () => {
    let resolveInsight: (insight: FileInsight) => void = () => {}
    const invokeDb = vi.fn(
      () =>
        new Promise<FileInsight>((resolve) => {
          resolveInsight = resolve
        })
    )

    const { result } = renderHook(() =>
      useFileInsight({
        activeProjectId: 'project-1',
        enabled: true,
        invokeDb
      })
    )

    await act(async () => {
      void result.current.selectFile('src/App.tsx')
    })

    act(() => {
      result.current.reset()
      resolveInsight(createInsight())
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.selectedPath).toBeNull()
    expect(result.current.insight).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
