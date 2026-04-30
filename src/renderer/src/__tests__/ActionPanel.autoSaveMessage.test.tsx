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

describe('ActionPanel AI save flow', () => {
  it('drafts an AI message on the first save click when enabled', async () => {
    const onGenerateAutoMessage = vi.fn().mockResolvedValue('Updated the layout and fixed spacing.')

    render(
      <ActionPanel
        status={{
          current_branch: 'main',
          files: [{ path: 'app.tsx', status: 'modified', staged: true }],
          tracked_files: ['app.tsx'],
          ahead: 0,
          behind: 0,
          has_conflicts: false,
          is_clean: false
        }}
        loading={false}
        aiLoading={false}
        error={null}
        message=""
        tokenExists={true}
        deviceFlow={null}
        cloudUploadReady={true}
        aiAutoSaveEnabled={true}
        aiConnectionReady={true}
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
        onGenerateAutoMessage={onGenerateAutoMessage}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }))
    expect(onGenerateAutoMessage).toHaveBeenCalled()
  })
})
