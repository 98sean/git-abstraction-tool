import { describe, expect, it, vi } from 'vitest'
import { generateWeeklySummary } from '../weeklySummaryService'

describe('weekly summary service', () => {
  it('returns cached summaries without calling AI when the week signature matches', async () => {
    const manualToolService = {
      generateWeeklyFeatureSummary: vi.fn()
    }

    const result = await generateWeeklySummary({
      projectId: 'project-1',
      projectName: 'Demo',
      startDate: '2026-04-20',
      endDate: '2026-04-26',
      aiConfig: { provider: 'openai', model: 'test-model', apiKey: 'test-key' },
      weeklyService: {
        getWeeklyLog: vi.fn().mockResolvedValue({
          projectId: 'project-1',
          projectName: 'Demo',
          startDate: '2026-04-20',
          endDate: '2026-04-26',
          summary: {
            totalCommits: 1,
            filesAdded: 1,
            filesModified: 0,
            filesDeleted: 0,
            totalInsertions: 12,
            totalDeletions: 0
          },
          dailyBreakdown: [{ date: '2026-04-21', dayOfWeek: 'Tue', commitCount: 1 }],
          commits: [
            {
              hash: 'abc123',
              date: '2026-04-21T12:00:00.000Z',
              message: 'feat: add weekly report',
              files: [],
              is_initial_import: false
            }
          ]
        })
      },
      manualToolService,
      getSummariesByHash: () => new Map(),
      getCachedSummary: vi.fn().mockReturnValue({
        summary: 'Cached weekly summary',
        highlights: ['Cached highlight'],
        commit_count: 1,
        ai_summary_count: 0,
        stats: {
          totalCommits: 1,
          filesAdded: 1,
          filesModified: 0,
          filesDeleted: 0,
          linesAdded: 12,
          linesRemoved: 0,
          activeDays: 1
        }
      }),
      setCachedSummary: vi.fn(),
      now: () => 123
    })

    expect(result.cached).toBe(true)
    expect(result.summary).toBe('Cached weekly summary')
    expect(manualToolService.generateWeeklyFeatureSummary).not.toHaveBeenCalled()
  })
})
