// @vitest-environment jsdom
import { act, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionPanel } from '../components/ActionPanel/ActionPanel'
import { useGitActions } from '../hooks/useGitActions'
import { invokeGit } from '../ipc'

vi.mock('../ipc', () => ({
  invokeGit: vi.fn()
}))

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    commitPlaceholder: () => 'Describe your changes...',
    commitBtn: (count: number) => `Save Progress${count > 0 ? ` (${count})` : ''}`,
    committingBtn: 'Saving...',
    pushBtn: 'Upload to Cloud',
    pullBtn: 'Get Updates',
    pushTitle: 'Upload your saved versions to cloud',
    pullTitle: 'Get latest updates from cloud',
    filesStaged: (n: number) => `${n} changes selected`,
    toPush: (n: number) => `${n} to upload`,
    toPull: (n: number) => `${n} to download`,
    conflictMsg: 'Conflict detected'
  })
}))

const pushResult = {
  remoteName: 'origin',
  branchName: 'gat/team-upload',
  prUrl: 'https://github.com/org/repo/compare/gat%2Fteam-upload?expand=1'
}

function renderActionPanel(): void {
  render(
    <ActionPanel
      status={{
        current_branch: 'gat/team-upload',
        files: [],
        tracked_files: [],
        ahead: 0,
        behind: 0,
        has_conflicts: false,
        is_clean: true
      }}
      loading={false}
      aiLoading={false}
      error={null}
      message=""
      tokenExists={true}
      deviceFlow={null}
      cloudUploadReady={true}
      cloudStatusLabel="Team upload ready: origin"
      uploadHandoff={pushResult}
      naturalUndoEnabled={false}
      naturalUndoSuggestion={null}
      naturalUndoLoading={false}
      naturalUndoApplying={false}
      naturalUndoError={null}
      onMessageChange={vi.fn()}
      onCommit={vi.fn()}
      onSuggestMessage={vi.fn()}
      onPush={vi.fn()}
      onPull={vi.fn()}
      onOpenCloudSetup={vi.fn()}
      onClearError={vi.fn()}
      onConnectGitHub={vi.fn()}
      onOpenGitHubDocs={vi.fn()}
      onOpenDevicePage={vi.fn()}
      onStartDeviceFlow={vi.fn()}
      onCancelDeviceFlow={vi.fn()}
    />
  )
}

describe('team upload handoff', () => {
  it('returns the push result so callers can expose the pull request handoff', async () => {
    vi.mocked(invokeGit).mockResolvedValueOnce(pushResult)
    const { result } = renderHook(() => useGitActions('project-1'))

    let actual: unknown
    await act(async () => {
      actual = await result.current.push()
    })

    expect(actual).toEqual(pushResult)
  })

  it('shows an Open pull request action after a team branch upload', () => {
    renderActionPanel()

    expect(screen.getByText(/Uploaded branch gat\/team-upload/i)).toBeTruthy()
    expect(screen.getByRole('link', { name: /Open pull request/i }).getAttribute('href')).toBe(
      pushResult.prUrl
    )
  })
})
