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
})
