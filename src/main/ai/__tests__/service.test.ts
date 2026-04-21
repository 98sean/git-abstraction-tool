import { describe, expect, it, vi } from 'vitest'
import { createAiService } from '../service'

describe('ai service', () => {
  it('lists provider models after validating the API key', async () => {
    const provider = {
      validateKey: vi.fn().mockResolvedValue({ ok: true, availableModels: ['gpt-4.1-mini'] }),
      generateMessage: vi.fn()
    }

    const service = createAiService({ openai: provider as never, anthropic: provider as never })
    const result = await service.connectProvider({ provider: 'openai', apiKey: 'sk-test' })

    expect(result.available_models).toContain('gpt-4.1-mini')
    expect(result.provider).toBe('openai')
    expect(result.connection_status).toBe('connected')
  })
})
