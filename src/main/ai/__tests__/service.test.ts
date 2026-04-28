import { createHash } from 'node:crypto'
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

  it('uses the connected provider for AI suggestions instead of relying on env-only OpenAI settings', async () => {
    const provider = {
      validateKey: vi.fn(),
      generateMessage: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue({
        message: 'Changed the pricing page copy and button text',
        summary:
          'The pricing page now uses clearer plan descriptions and updated button text so visitors understand the offer faster.',
        change_kind: 'content',
        user_visible: true,
        areas: ['pricing page'],
        keywords: ['pricing', 'plan', 'button text']
      })
    }
    const service = createAiService({ openai: provider as never, anthropic: provider as never })
    const diff = 'diff --git a/src/pricing.tsx b/src/pricing.tsx\n+Updated pricing copy'

    const result = await service.generateCommitSuggestion({
      provider: 'anthropic',
      model: 'claude-test',
      apiKey: 'anthropic-key',
      diff
    })

    expect(provider.generateStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'anthropic-key',
        model: 'claude-test'
      })
    )
    expect(result.model).toBe('claude-test')
    expect(result.fingerprint).toBe(createHash('sha256').update(diff).digest('hex'))
    expect(result.message).toContain('pricing page')
  })
})
