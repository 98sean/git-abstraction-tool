// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'

describe('App smoke', () => {
  it('renders the app shell without crashing', async () => {
    Object.defineProperty(window, 'electron', {
      configurable: true,
      value: {
        ipcRenderer: {
          invoke: vi.fn(async (channel: string) => {
            if (channel === 'db:projects:list') return []
            if (channel === 'db:preferences:get') {
              return {
                theme: 'light',
                mode: 'pro',
                auto_save_enabled: true,
                default_save_message_template: ''
              }
            }
            if (channel === 'git:install:check') return { installed: true }
            if (channel === 'auth:token:exists') return false
            if (channel === 'ai:connection:get') {
              return {
                provider: null,
                connection_status: 'disconnected',
                selected_model: null,
                available_models: [],
                last_verified_at: null
              }
            }
            return null
          }),
          on: vi.fn(),
          removeAllListeners: vi.fn()
        }
      }
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeTruthy()
    })
  })
})
