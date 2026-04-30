import { describe, expect, it, vi } from 'vitest'
import { createAiService } from '../service'

describe('auto save message generation', () => {
  it('returns one plain-language draft from staged diff input', async () => {
    const generateMessage = vi
      .fn()
      .mockResolvedValue('Updated the homepage layout and fixed spacing issues.')
    const service = createAiService({
      openai: {
        validateKey: vi.fn(),
        generateMessage
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

  it('asks for Korean output when the app language is Korean', async () => {
    const generateMessage = vi.fn().mockResolvedValue('홈페이지 레이아웃을 정리했습니다')
    const service = createAiService({
      openai: {
        validateKey: vi.fn(),
        generateMessage
      } as never,
      anthropic: {} as never
    })

    await service.generateAutoSaveMessage({
      provider: 'openai',
      model: 'gpt-4.1-mini',
      apiKey: 'sk-test',
      outputLanguage: 'ko',
      diffContext: {
        diff: 'diff --git a/app.tsx b/app.tsx',
        files: [{ path: 'app.tsx', status: 'modified' }]
      }
    })

    expect(generateMessage.mock.calls[0]?.[0].prompt).toContain('Korean')
  })
})
