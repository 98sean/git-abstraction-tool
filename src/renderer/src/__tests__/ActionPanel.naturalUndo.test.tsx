// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionPanel } from '../components/ActionPanel/ActionPanel'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    commitPlaceholder: () => 'Describe your changes…',
    commitBtn: (count: number) => `Save Progress${count > 0 ? ` (${count})` : ''}`,
    committingBtn: 'Saving…',
    pushBtn: 'Upload to Cloud',
    pullBtn: 'Get Updates',
    pushTitle: 'Upload your saved versions to cloud',
    pullTitle: 'Get latest updates from cloud',
    filesStaged: (n: number) => `${n} changes selected`,
    toPush: (n: number) => `↑ ${n} to upload`,
    toPull: (n: number) => `↓ ${n} to download`,
    conflictMsg: 'Conflict detected'
  })
}))

describe('ActionPanel natural undo flow', () => {
  it('submits a natural-language undo query when analysis is enabled', () => {
    const onSuggestNaturalUndo = vi.fn().mockResolvedValue(undefined)

    render(
      <ActionPanel
        status={{
          current_branch: 'feature/demo',
          files: [],
          tracked_files: [],
          ahead: 0,
          behind: 0,
          has_conflicts: false,
          is_clean: true
        }}
        loading={false}
        error={null}
        messageTemplate=""
        tokenExists={true}
        cloudUploadReady={true}
        deviceFlow={null}
        naturalUndoEnabled={true}
        onCommit={vi.fn()}
        onPush={vi.fn()}
        onPull={vi.fn()}
        onOpenCloudSetup={vi.fn()}
        onClearError={vi.fn()}
        onConnectGitHub={vi.fn()}
        onOpenGitHubDocs={vi.fn()}
        onOpenDevicePage={vi.fn()}
        onStartDeviceFlow={vi.fn()}
        onCancelDeviceFlow={vi.fn()}
        onSuggestNaturalUndo={onSuggestNaturalUndo}
      />
    )

    fireEvent.change(screen.getByPlaceholderText(/restore to yesterday afternoon/i), {
      target: { value: 'Restore to before the pricing copy change' }
    })
    fireEvent.click(screen.getByRole('button', { name: /Find Point/i }))

    expect(onSuggestNaturalUndo).toHaveBeenCalledWith('Restore to before the pricing copy change')
  })
})
