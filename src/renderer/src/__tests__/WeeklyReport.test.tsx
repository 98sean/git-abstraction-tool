// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WeeklyReport } from '../components/WeeklyReport'
import { AiConnectionState, WeeklyAiSummary, WeeklyReport as WeeklyReportData } from '../types'

const hookMocks = vi.hoisted(() => ({
  useWeeklyReport: vi.fn(),
  useWeeklyAiSummary: vi.fn()
}))

vi.mock('../hooks/useWeeklyReport', () => ({
  useWeeklyReport: hookMocks.useWeeklyReport
}))

vi.mock('../hooks/useWeeklyAiSummary', () => ({
  useWeeklyAiSummary: hookMocks.useWeeklyAiSummary
}))

const disconnected: AiConnectionState = {
  provider: null,
  selected_model: null,
  available_models: [],
  last_verified_at: null,
  connection_status: 'disconnected'
}

const connected: AiConnectionState = {
  provider: 'openai',
  selected_model: 'gpt-test',
  available_models: ['gpt-test'],
  last_verified_at: 1,
  connection_status: 'connected'
}

const report: WeeklyReportData = {
  projectId: 'project-1',
  projectName: 'Demo',
  startDate: '2026-04-20',
  endDate: '2026-04-26',
  summary: {
    totalCommits: 2,
    filesAdded: 1,
    filesModified: 2,
    filesDeleted: 0,
    totalInsertions: 20,
    totalDeletions: 5
  },
  dailyBreakdown: [{ date: '2026-04-21', dayOfWeek: 'Tue', commitCount: 2 }],
  commits: [
    { hash: 'abc', date: '2026-04-21', message: 'feat: add dashboard', files: [] },
    { hash: 'def', date: '2026-04-22', message: 'fix: polish upload copy', files: [] }
  ]
}

const emptyReport: WeeklyReportData = {
  ...report,
  summary: {
    totalCommits: 0,
    filesAdded: 0,
    filesModified: 0,
    filesDeleted: 0,
    totalInsertions: 0,
    totalDeletions: 0
  },
  dailyBreakdown: [],
  commits: []
}

function weeklyAiSummary(patch: Partial<WeeklyAiSummary> = {}): WeeklyAiSummary {
  return {
    summary: 'You improved the upload flow and clarified review steps.',
    highlights: ['Improved team upload handoff'],
    commit_count: 2,
    ai_summary_count: 1,
    has_entries: true,
    stats: {
      totalCommits: 2,
      filesAdded: 1,
      filesModified: 2,
      filesDeleted: 0,
      linesAdded: 20,
      linesRemoved: 5,
      activeDays: 2
    },
    ...patch
  }
}

function mockWeeklyReport(nextReport: WeeklyReportData): void {
  hookMocks.useWeeklyReport.mockReturnValue({
    report: nextReport,
    loading: false,
    error: null,
    startDate: nextReport.startDate,
    endDate: nextReport.endDate,
    fetchReport: vi.fn(),
    navigatePrev: vi.fn(),
    navigateNext: vi.fn(),
    isCurrentWeek: true
  })
}

describe('WeeklyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWeeklyReport(report)
    hookMocks.useWeeklyAiSummary.mockReturnValue({
      aiSummary: null,
      loading: false,
      error: null
    })
  })

  it('shows a deterministic summary when AI is disconnected', () => {
    render(<WeeklyReport projectId="project-1" aiConnection={disconnected} />)

    expect(screen.getByText(/This week, 1 file\(s\) added, 2 file\(s\) modified/i)).toBeTruthy()
    expect(screen.getByText(/Connect AI to get a friendlier/i)).toBeTruthy()
  })

  it('shows AI loading state while an enhanced summary is generating', () => {
    hookMocks.useWeeklyAiSummary.mockReturnValue({
      aiSummary: null,
      loading: true,
      error: null
    })

    render(<WeeklyReport projectId="project-1" aiConnection={connected} />)

    expect(screen.getByText(/Generating AI summary/i)).toBeTruthy()
  })

  it('shows the AI enhanced summary when available', () => {
    hookMocks.useWeeklyAiSummary.mockReturnValue({
      aiSummary: weeklyAiSummary(),
      loading: false,
      error: null
    })

    render(<WeeklyReport projectId="project-1" aiConnection={connected} />)

    expect(screen.getByText(/You improved the upload flow/i)).toBeTruthy()
    expect(screen.getByText('Improved team upload handoff')).toBeTruthy()
    expect(screen.getByText(/Based on 2 commits this week/i)).toBeTruthy()
  })

  it('shows an empty-week state when no commits exist', () => {
    mockWeeklyReport(emptyReport)
    hookMocks.useWeeklyAiSummary.mockReturnValue({
      aiSummary: weeklyAiSummary({
        summary: 'No saves were recorded this week.',
        highlights: [],
        commit_count: 0,
        ai_summary_count: 0,
        has_entries: false,
        stats: {
          totalCommits: 0,
          filesAdded: 0,
          filesModified: 0,
          filesDeleted: 0,
          linesAdded: 0,
          linesRemoved: 0,
          activeDays: 0
        }
      }),
      loading: false,
      error: null
    })

    render(<WeeklyReport projectId="project-1" aiConnection={connected} />)

    expect(screen.getByText(/No file changes this week/i)).toBeTruthy()
    expect(screen.getByText(/No commits were recorded this week yet/i)).toBeTruthy()
  })
})
