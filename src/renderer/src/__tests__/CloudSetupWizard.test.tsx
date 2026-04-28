// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CloudSetupWizard } from '../components/CloudSetupWizard/CloudSetupWizard'

describe('CloudSetupWizard', () => {
  it('lets the user choose backup vs team upload', () => {
    const onChoose = vi.fn()

    render(<CloudSetupWizard onChooseIntent={onChoose} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Back up to my GitHub/i }))
    expect(onChoose).toHaveBeenCalledWith('backup')
  })

  it('blocks team upload setup when the branch name contains spaces', () => {
    const onContinue = vi.fn()

    render(
      <CloudSetupWizard
        intent="collaboration"
        remotes={[{ name: 'origin', fetch: 'https://github.com/acme/demo.git', push: 'https://github.com/acme/demo.git' }]}
        selectedRemoteName="origin"
        selectedBranch="test and fix"
        onChooseIntent={vi.fn()}
        onClose={vi.fn()}
        onContinueCollaboration={onContinue}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Save team upload target/i }))

    expect(screen.getByText(/Branch names cannot contain spaces/i)).toBeTruthy()
    expect(onContinue).not.toHaveBeenCalled()
  })
})
