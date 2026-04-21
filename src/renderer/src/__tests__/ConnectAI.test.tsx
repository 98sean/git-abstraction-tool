// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConnectAI } from '../components/ConnectAI/ConnectAI'

describe('ConnectAI', () => {
  it('submits provider and api key', () => {
    const onConnect = vi.fn()

    render(
      <ConnectAI
        connectionStatus={{
          provider: null,
          selected_model: null,
          available_models: [],
          last_verified_at: null,
          connection_status: 'disconnected'
        }}
        onConnect={onConnect}
        onDisconnect={vi.fn()}
        onOpenProviderDocs={vi.fn()}
        onSelectModel={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText(/Provider/i), { target: { value: 'openai' } })
    fireEvent.change(screen.getByLabelText(/API key/i), { target: { value: 'sk-test' } })
    fireEvent.click(screen.getByRole('button', { name: /Connect AI/i }))

    expect(
      screen.getByText(/save drafts, natural language undo, file insight, and untracked review/i)
    ).toBeTruthy()
    expect(onConnect).toHaveBeenCalledWith('openai', 'sk-test')
  })
})
