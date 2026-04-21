import { afterEach, describe, expect, it } from 'vitest'
import {
  clearAiConnectionState,
  getAiConnectionState,
  setAiConnectionState
} from '../aiConnection'

describe('aiConnection store', () => {
  afterEach(() => clearAiConnectionState())

  it('stores one active provider at a time', () => {
    setAiConnectionState({
      provider: 'openai',
      selected_model: 'gpt-4.1-mini',
      available_models: ['gpt-4.1-mini'],
      last_verified_at: 1,
      connection_status: 'connected'
    })

    expect(getAiConnectionState().provider).toBe('openai')
  })

  it('resets provider metadata when cleared', () => {
    clearAiConnectionState()

    expect(getAiConnectionState()).toEqual({
      provider: null,
      selected_model: null,
      available_models: [],
      last_verified_at: null,
      connection_status: 'disconnected'
    })
  })
})
