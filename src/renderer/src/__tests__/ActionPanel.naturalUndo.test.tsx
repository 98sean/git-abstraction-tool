// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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
    conflictMsg: 'Conflict detected',
    dismissErrorLabel: 'Dismiss error',
    aiSuggestBtn: 'AI Suggest',
    aiSuggestTitle: 'Use AI to suggest a save message',
    aiDraftReady: 'AI drafted a save message. Review it, then click Save Progress again.',
    aiDraftFailed: 'AI could not draft a save message. Enter one manually to continue.',
    draftingBtn: 'Drafting...',
    thinkingBtn: 'Thinking...',
    uploadedBranch: (branchName: string) => `Uploaded branch ${branchName}`,
    openPullRequest: 'Open pull request',
    naturalUndoTitle: 'Natural Language Undo',
    aiConnectionRequired: 'AI connection required',
    cancelNaturalUndoLabel: 'Cancel Natural Language Undo',
    naturalUndoPlaceholder: 'Example: "Restore to yesterday afternoon before the red button removal"',
    naturalUndoAnalyzingBtn: 'Analyzing...',
    naturalUndoFindBtn: 'Find Point',
    confidenceLabel: (percent: string) => `Confidence ${percent}%`,
    restoreFiles: (count: number) => `Restore ${count} files`,
    removeFiles: (count: number) => `Remove ${count} files`,
    restoreFilePrefix: 'Restore',
    removeFilePrefix: 'Remove',
    restoringBtn: 'Restoring...',
    restorePointBtn: 'Yes, Restore This Point',
    alternativeMatchesLabel: 'Not quite right? Other possible matches:'
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

  it('shows provider-neutral guidance when natural undo is unavailable', () => {
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
        naturalUndoEnabled={false}
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
      />
    )

    expect(screen.getByText(/AI connection required/i)).toBeTruthy()
  })

  it('keeps long natural undo results inside a scrollable result card', () => {
    const css = readFileSync(
      join(process.cwd(), 'src/renderer/src/components/ActionPanel/ActionPanel.module.css'),
      'utf8'
    )

    expect(css).toMatch(/\.undoSuggestion\s*{[^}]*max-height:\s*min\(/s)
    expect(css).toMatch(/\.undoSuggestion\s*{[^}]*overflow-y:\s*auto;/s)
  })
})
