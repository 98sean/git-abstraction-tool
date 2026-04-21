// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FileInsightPanel } from '../components/FileInsightPanel/FileInsightPanel'

describe('FileInsightPanel', () => {
  it('shows provider-neutral copy when file insight is unavailable', () => {
    render(
      <FileInsightPanel
        selectedPath={null}
        insight={null}
        loading={false}
        error={null}
        enabled={false}
        onRetry={vi.fn()}
        onSelectRelated={vi.fn()}
      />
    )

    expect(screen.getByText(/Connect AI to use file insight/i)).toBeTruthy()
  })
})
