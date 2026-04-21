// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
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
})
