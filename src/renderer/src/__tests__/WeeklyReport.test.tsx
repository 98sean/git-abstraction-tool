// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    weeklySummaryTitle: '주간 요약',
    weeklySummaryGenerating: 'AI 요약 생성 중...',
    weeklySummaryConnectAiHint: 'AI를 연결하면 더 친절한 기능 중심 주간 요약을 볼 수 있습니다.',
    weeklySummaryNoCommits: '이번 주에는 아직 저장 기록이 없습니다.',
    weeklySummaryBasedOn: (commitCount: number, aiSummaryCount: number, activeDays: number) =>
      `${commitCount}개 저장 기록 기준${aiSummaryCount > 0 ? `, AI 요약 ${aiSummaryCount}개` : ''}${activeDays > 0 ? `, 활동일 ${activeDays}일` : ''}`,
    weeklySelectProjectText: '주간 리포트를 보려면 프로젝트를 선택하세요.',
    weeklyLoadingText: '리포트 불러오는 중...',
    weeklyTextFallback: (
      filesAdded: number,
      filesModified: number,
      filesDeleted: number,
      subjects: string[]
    ) => {
      const parts = []
      if (filesAdded > 0) parts.push(`${filesAdded} file(s) added`)
      if (filesModified > 0) parts.push(`${filesModified} file(s) modified`)
      if (filesDeleted > 0) parts.push(`${filesDeleted} file(s) deleted`)
      const statLine = parts.length > 0 ? `This week, ${parts.join(', ')}.` : 'No file changes this week.'
      return subjects.length > 0 ? `${statLine} Key work: ${subjects.join(' and ')}.` : statLine
    },
    weeklyTotalCommitsLabel: '총 저장',
    weeklyNewFilesLabel: '새 파일',
    weeklyModifiedFilesLabel: '수정 파일',
    weeklyDeletedFilesLabel: '삭제 파일',
    weeklyLinesAddedLabel: '추가된 줄',
    weeklyLinesDeletedLabel: '삭제된 줄',
    weeklyCommitHistoryTitle: '저장 기록',
    weeklyNoCommitsThisWeek: '이번 주 저장 기록 없음',
    weeklyInitialImportLabel: '초기 가져오기',
    weeklyInitialImportTitle: '저장소의 첫 저장입니다. 파일 수는 주간 합계에서 제외됩니다.',
    weeklyCommitFileCount: (count: number) => `${count}개 파일`,
    weeklyFileStatusLabel: (status: string) => status,
    weeklyPrevWeekLabel: '이전 주',
    weeklyNextWeekLabel: '다음 주',
    weeklyCurrentWeekLabel: '이번 주'
  })
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

  afterEach(() => {
    cleanup()
  })

  it('shows a deterministic summary when AI is disconnected', () => {
    render(<WeeklyReport projectId="project-1" aiConnection={disconnected} />)

    expect(screen.getByText(/This week, 1 file\(s\) added, 2 file\(s\) modified/i)).toBeTruthy()
    expect(screen.getByText(/AI를 연결하면 더 친절한 기능 중심 주간 요약/i)).toBeTruthy()
  })

  it('shows AI loading state while an enhanced summary is generating', () => {
    hookMocks.useWeeklyAiSummary.mockReturnValue({
      aiSummary: null,
      loading: true,
      error: null
    })

    render(<WeeklyReport projectId="project-1" aiConnection={connected} />)

    expect(screen.getByText(/AI 요약 생성 중/i)).toBeTruthy()
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
    expect(screen.getByText(/2개 저장 기록 기준/i)).toBeTruthy()
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
    expect(screen.getByText(/이번 주에는 아직 저장 기록이 없습니다/i)).toBeTruthy()
  })

  it('keeps commit history inside a dedicated scroll region', () => {
    render(<WeeklyReport projectId="project-1" aiConnection={connected} />)

    const list = screen.getByRole('list', { name: /저장 기록/i })
    expect(list.className).toContain('wr-commit-scroll-region')
  })
})
