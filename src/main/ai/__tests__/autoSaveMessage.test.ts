import { describe, expect, it, vi } from 'vitest'
import { createAiService } from '../service'

describe('auto save message generation', () => {
  it('returns one plain-language draft from staged diff input', async () => {
    const service = createAiService({
      openai: {
        validateKey: vi.fn(),
        generateMessage: vi
          .fn()
          .mockResolvedValue('Updated the homepage layout and fixed spacing issues.')
      } as never,
      anthropic: {} as never
    })

    const result = await service.generateAutoSaveMessage({
      provider: 'openai',
      model: 'gpt-4.1-mini',
      apiKey: 'sk-test',
      diffContext: {
        diff: 'diff --git a/app.tsx b/app.tsx',
        files: [{ path: 'app.tsx', status: 'modified' }]
      }
    })

    expect(result).toContain('Updated')
  })
})
