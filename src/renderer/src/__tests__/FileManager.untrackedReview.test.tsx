// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

  it('removes deleted review items without starting another analysis loop', async () => {
    const user = userEvent.setup()
    const onReviewUntracked = vi.fn().mockResolvedValue({
      items: [
        {
          path: 'dist/bundle.js',
          recommendation: 'delete',
          reason: 'Generated build output.',
          confidence: 0.91
        },
        {
          path: 'src/new-quiz.ts',
          recommendation: 'commit',
          reason: 'Looks like source work.',
          confidence: 0.82
        }
      ],
      total_untracked: 2,
      commit_count: 1,
      delete_count: 1
    })
    const onDeleteUntracked = vi.fn().mockResolvedValue({ deleted: 1, failed: [] })

    render(
      <FileManager
        status={{
          current_branch: 'main',
          files: [
            { path: 'dist/bundle.js', status: 'untracked', staged: false },
            { path: 'src/new-quiz.ts', status: 'untracked', staged: false }
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

    await user.click(screen.getByRole('button', { name: /review untracked/i }))
    expect(await screen.findByText('dist/bundle.js')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /delete selected/i }))

    await waitFor(() => {
      expect(onDeleteUntracked).toHaveBeenCalledWith(['dist/bundle.js'])
    })
    expect(onReviewUntracked).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.queryByText('dist/bundle.js')).toBeNull()
    })
    expect(screen.getByText('src/new-quiz.ts')).toBeTruthy()
  })
})
