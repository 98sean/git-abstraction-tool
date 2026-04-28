import { describe, expect, it, vi } from 'vitest'
import { createManualToolService } from '../manualToolService'
import { createAiService } from '../service'

describe('weekly AI feature summary', () => {
  it('returns a deterministic empty-week summary without calling AI', async () => {
    const provider = {
      validateKey: vi.fn(),
      generateMessage: vi.fn(),
      generateStructured: vi.fn()
    }
    const aiService = createAiService({ openai: provider as never, anthropic: provider as never })
    const manualToolService = createManualToolService({ aiService })

    const result = await manualToolService.generateWeeklyFeatureSummary({
      provider: 'openai',
      model: 'gpt-test',
      apiKey: 'test-key',
      startDate: '2026-04-20',
      endDate: '2026-04-26',
      entries: [],
      stats: {
        totalCommits: 0,
        filesAdded: 0,
        filesModified: 0,
        filesDeleted: 0,
        linesAdded: 0,
        linesRemoved: 0,
        activeDays: 0
      }
    })

    expect(result).toEqual({
      summary: 'No saves were recorded this week.',
      highlights: []
    })
    expect(provider.generateStructured).not.toHaveBeenCalled()
  })

  it('sends grounded weekly stats and normalizes highlights', async () => {
    const provider = {
      validateKey: vi.fn(),
      generateMessage: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue({
        summary: 'You made steady progress across the upload flow.',
        highlights: ['Improved branch upload', '', 'Clarified review copy', 'Added safety checks']
      })
    }
    const aiService = createAiService({ openai: provider as never, anthropic: provider as never })
    const manualToolService = createManualToolService({ aiService })

    const result = await manualToolService.generateWeeklyFeatureSummary({
      provider: 'openai',
      model: 'gpt-test',
      apiKey: 'test-key',
      startDate: '2026-04-20',
      endDate: '2026-04-26',
      entries: [
        {
          hash: 'abc',
          date: '2026-04-21',
          message: 'feat: add team upload handoff',
          ai_summary: 'You added a clearer team upload handoff.',
          areas: ['upload'],
          keywords: ['pull request'],
          user_visible: true
        }
      ],
      stats: {
        totalCommits: 1,
        filesAdded: 1,
        filesModified: 2,
        filesDeleted: 0,
        linesAdded: 30,
        linesRemoved: 4,
        activeDays: 1
      }
    })

    const call = provider.generateStructured.mock.calls[0]?.[0]
    expect(call.userPrompt).toContain('"totalCommits":1')
    expect(call.userPrompt).toContain('add team upload handoff')
    expect(result).toEqual({
      summary: 'You made steady progress across the upload flow.',
      highlights: ['Improved branch upload', 'Clarified review copy', 'Added safety checks']
    })
  })
})
