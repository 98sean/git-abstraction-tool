// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProjectSettingsPanel } from '../components/ProjectSettingsPanel/ProjectSettingsPanel'

describe('ProjectSettingsPanel', () => {
  it('shows AI and cloud state together', () => {
    render(
      <ProjectSettingsPanel
        aiSettings={{
          auto_save_message_enabled: true,
          ai_diff_consent_granted: true,
          ai_diff_consent_granted_at: 1
        }}
        aiConnectionStatus="connected"
        selectedModel="gpt-4.1-mini"
        cloudTarget={{
          mode: 'backup',
          backup: {
            remoteName: 'gat-backup',
            repoOwner: 'tony',
            repoName: 'demo-backup',
            private: true
          },
          collaboration: null
        }}
        onAiChange={vi.fn()}
        onOpenAiConnection={vi.fn()}
        onOpenCloudSetup={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/Use AI auto save messages/i)).toBeTruthy()
    expect(screen.getByText(/Private backup ready/i)).toBeTruthy()
  })
})
