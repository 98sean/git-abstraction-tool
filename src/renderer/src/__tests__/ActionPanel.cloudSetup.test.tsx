// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionPanel } from '../components/ActionPanel/ActionPanel'
import { GitStatus } from '../types'

const status: GitStatus = {
  current_branch: 'main',
  files: [],
  ahead: 1,
  behind: 0,
  has_conflicts: false,
  is_clean: false
}

describe('ActionPanel cloud setup', () => {
  it('opens cloud setup instead of uploading when no cloud target exists', () => {
    const onOpenCloudSetup = vi.fn()
    const onPush = vi.fn()

    render(
      <ActionPanel
        status={status}
        loading={false}
        error={null}
        messageTemplate=""
        tokenExists={true}
        deviceFlow={null}
        cloudUploadReady={false}
        onCommit={vi.fn()}
        onPush={onPush}
        onPull={vi.fn()}
        onClearError={vi.fn()}
        onConnectGitHub={vi.fn()}
        onOpenGitHubDocs={vi.fn()}
        onStartDeviceFlow={vi.fn()}
        onCancelDeviceFlow={vi.fn()}
        onOpenCloudSetup={onOpenCloudSetup}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Upload to Cloud/i }))
    expect(onOpenCloudSetup).toHaveBeenCalled()
    expect(onPush).not.toHaveBeenCalled()
  })
})
