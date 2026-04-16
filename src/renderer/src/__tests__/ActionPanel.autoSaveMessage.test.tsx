// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionPanel } from '../components/ActionPanel/ActionPanel'

describe('ActionPanel AI save flow', () => {
  it('drafts an AI message on the first save click when enabled', async () => {
    const onGenerateAutoMessage = vi.fn().mockResolvedValue('Updated the layout and fixed spacing.')

    render(
      <ActionPanel
        status={{
          current_branch: 'main',
          files: [{ path: 'app.tsx', status: 'modified', staged: true }],
          ahead: 0,
          behind: 0,
          has_conflicts: false,
          is_clean: false
        }}
        loading={false}
        error={null}
        messageTemplate=""
        tokenExists={true}
        deviceFlow={null}
        cloudUploadReady={true}
        aiAutoSaveEnabled={true}
        aiConnectionReady={true}
        onCommit={vi.fn()}
        onPush={vi.fn()}
        onPull={vi.fn()}
        onOpenCloudSetup={vi.fn()}
        onClearError={vi.fn()}
        onConnectGitHub={vi.fn()}
        onOpenGitHubDocs={vi.fn()}
        onStartDeviceFlow={vi.fn()}
        onCancelDeviceFlow={vi.fn()}
        onGenerateAutoMessage={onGenerateAutoMessage}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }))
    expect(onGenerateAutoMessage).toHaveBeenCalled()
  })
})
