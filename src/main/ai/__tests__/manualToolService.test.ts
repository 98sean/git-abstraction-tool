import { describe, expect, it, vi } from 'vitest'
import { createManualToolService } from '../manualToolService'
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

  it('uses the connected provider for file insight instead of hard-coding OpenAI', async () => {
    const provider = {
      validateKey: vi.fn().mockResolvedValue({ ok: true, availableModels: ['claude-test'] }),
      generateMessage: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue({
        summary: 'This file handles branch creation.',
        functionality: 'It creates a new branch from user input.',
        related_files: []
      })
    }

    const aiService = createAiService({ anthropic: provider as never, openai: provider as never })
    const manualToolService = createManualToolService({ aiService })

    const result = await manualToolService.generateFileInsight({
      provider: 'anthropic',
      model: 'claude-test',
      apiKey: 'test-key',
      filePath: 'src/main/git/service.ts',
      contentSnippet: 'export async function createBranch() {}',
      recentCommits: [],
      relatedCandidates: []
    })

    expect(result.summary).toContain('branch')
    expect(provider.generateStructured).toHaveBeenCalled()
  })
})
