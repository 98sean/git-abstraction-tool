// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FileManager } from '../components/FileManager/FileManager'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    loadingStatus: 'Loading status…',
    stageAll: 'Stage all',
    unstageAll: 'Unstage all',
    stagedOf: (staged: number, changed: number) => `${staged}/${changed} selected`,
    cleanTitle: 'Clean',
    cleanSubtext: 'No changes',
    revertTitle: 'Revert file',
    revertBtn: 'Revert'
  })
}))

afterEach(() => {
  cleanup()
})

describe('FileManager untracked review visibility', () => {
  it('does not offer untracked review when ai tools are unavailable', () => {
    render(
      <FileManager
        status={{
          current_branch: 'main',
          files: [{ path: 'tmp.log', status: 'untracked', staged: false }],
          tracked_files: [],
          ahead: 0,
          behind: 0,
          has_conflicts: false,
          is_clean: false
        }}
        trackedPaths={[]}
        selectedPath={null}
        loading={false}
        error={null}
        aiReviewEnabled={false}
        onStage={vi.fn()}
        onUnstage={vi.fn()}
        onStageAll={vi.fn()}
        onUnstageAll={vi.fn()}
        onRevert={vi.fn()}
        onReviewUntracked={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: /review untracked/i })).toBeNull()
  })

  it('deletes only files selected from delete recommendations', async () => {
    const onReviewUntracked = vi.fn().mockResolvedValue({
      total_untracked: 2,
      commit_count: 1,
      delete_count: 1,
      items: [
        {
          path: 'tmp.log',
          recommendation: 'delete',
          reason: 'Temporary log file.',
          confidence: 0.95
        },
        {
          path: 'src/new-feature.ts',
          recommendation: 'commit',
          reason: 'Source file.',
          confidence: 0.82
        }
      ]
    })
    const onDeleteUntracked = vi.fn().mockResolvedValue({ deleted: 1, failed: [] })

    render(
      <FileManager
        status={{
          current_branch: 'main',
          files: [
            { path: 'tmp.log', status: 'untracked', staged: false },
            { path: 'src/new-feature.ts', status: 'untracked', staged: false }
          ],
          tracked_files: [],
          ahead: 0,
          behind: 0,
          has_conflicts: false,
          is_clean: false
        }}
        trackedPaths={[]}
        selectedPath={null}
        loading={false}
        error={null}
        aiReviewEnabled={true}
        onStage={vi.fn()}
        onUnstage={vi.fn()}
        onStageAll={vi.fn()}
        onUnstageAll={vi.fn()}
        onRevert={vi.fn()}
        onReviewUntracked={onReviewUntracked}
        onDeleteUntracked={onDeleteUntracked}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /review untracked/i }))
    expect((await screen.findAllByText('tmp.log')).length).toBeGreaterThan(0)
    expect(screen.getByText('src/new-feature.ts')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Delete selected \(1\)/i }))

    await waitFor(() => {
      expect(onDeleteUntracked).toHaveBeenCalledWith(['tmp.log'])
    })
  })
})
