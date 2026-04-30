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

  it('requests Korean file insight output and preserves Korean model text', async () => {
    const provider = {
      validateKey: vi.fn(),
      generateMessage: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue({
        summary: '이 파일은 브랜치 생성을 처리합니다.',
        functionality: '사용자가 입력한 이름으로 새 브랜치를 만듭니다.',
        related_files: [{ path: 'src/main/git/branches.ts', reason: '브랜치 목록을 함께 다룹니다.' }]
      })
    }

    const aiService = createAiService({ anthropic: provider as never, openai: provider as never })
    const manualToolService = createManualToolService({ aiService })

    const result = await manualToolService.generateFileInsight({
      provider: 'anthropic',
      model: 'claude-test',
      apiKey: 'test-key',
      outputLanguage: 'ko',
      filePath: 'src/main/git/service.ts',
      contentSnippet: 'export async function createBranch() {}',
      recentCommits: [],
      relatedCandidates: [{ path: 'src/main/git/branches.ts', score: 2 }]
    })

    const call = provider.generateStructured.mock.calls[0]?.[0]
    expect(call.systemPrompt).toContain('Korean')
    expect(call.userPrompt).toContain('"output_language":"Korean"')
    expect(result.summary).toContain('브랜치')
    expect(result.relatedFiles[0].reason).toContain('브랜치')
  })

  it('requests Korean natural undo reasons when the app language is Korean', async () => {
    const provider = {
      validateKey: vi.fn(),
      generateMessage: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue({
        primary: {
          commit_hash: 'abc123',
          reason: '버튼을 제거하기 전 상태와 가장 가깝습니다.',
          confidence: 0.9
        },
        alternatives: []
      })
    }

    const aiService = createAiService({ anthropic: provider as never, openai: provider as never })
    const manualToolService = createManualToolService({ aiService })

    const result = await manualToolService.generateNaturalUndoSuggestion({
      provider: 'anthropic',
      model: 'claude-test',
      apiKey: 'test-key',
      outputLanguage: 'ko',
      query: '빨간 버튼 지우기 전으로',
      timeline: [
        {
          hash: 'abc123',
          short_hash: 'abc123',
          date: '2026-04-29T00:00:00.000Z',
          message: 'Removed red button',
          changed_files: ['src/App.tsx']
        }
      ]
    })

    const call = provider.generateStructured.mock.calls[0]?.[0]
    expect(call.systemPrompt).toContain('Korean')
    expect(call.userPrompt).toContain('"output_language":"Korean"')
    expect(result.primary.reason).toContain('버튼')
  })

  it('requests Korean untracked review reasons when the app language is Korean', async () => {
    const provider = {
      validateKey: vi.fn(),
      generateMessage: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue({
        decisions: [
          {
            path: 'src/new-feature.ts',
            recommendation: 'commit',
            reason: '새 기능 코드로 보입니다.',
            confidence: 0.8
          }
        ]
      })
    }

    const aiService = createAiService({ anthropic: provider as never, openai: provider as never })
    const manualToolService = createManualToolService({ aiService })

    const result = await manualToolService.reviewUntrackedFiles({
      provider: 'anthropic',
      model: 'claude-test',
      apiKey: 'test-key',
      outputLanguage: 'ko',
      contexts: [{ path: 'src/new-feature.ts', kind: 'file', size: 20, snippet: 'export {}' }]
    })

    const call = provider.generateStructured.mock.calls[0]?.[0]
    expect(call.systemPrompt).toContain('Korean')
    expect(call.userPrompt).toContain('"output_language":"Korean"')
    expect(result.items[0].reason).toContain('새 기능')
  })
})
