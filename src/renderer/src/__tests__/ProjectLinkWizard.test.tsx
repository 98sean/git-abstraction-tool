// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProjectLinkWizard } from '../components/ProjectLinkWizard/ProjectLinkWizard'

describe('ProjectLinkWizard', () => {
  it('shows init approval for non-git folders', () => {
    render(
      <ProjectLinkWizard
        inspection={{
          isGitRepo: false,
          canInitialize: true,
          remotes: [],
          warnings: [],
          recommendedIgnoreEntries: []
        }}
        onApproveInit={vi.fn()}
        onCancel={vi.fn()}
        onFinish={vi.fn()}
      />
    )

    expect(screen.getByText(/Turn on change history/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Turn it on and continue/i }))
  })
})
