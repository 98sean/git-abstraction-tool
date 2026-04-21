import { describe, expect, it, vi } from 'vitest'
import { createAiService } from '../service'

describe('ai service manual tool capabilities', () => {
  it('treats a connected provider as eligible for manual AI tools when the adapter exposes structured generation', async () => {
    const provider = {
      validateKey: vi.fn().mockResolvedValue({ ok: true, availableModels: ['model-a'] }),
      generateMessage: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue({ summary: 'ok' })
    }

    const service = createAiService({ openai: provider as never, anthropic: provider as never })
    const state = await service.connectProvider({ provider: 'anthropic', apiKey: 'test-key' })

    expect(state.provider).toBe('anthropic')
    expect(service.supportsManualTools('anthropic')).toBe(true)
  })
})
