// WeeklyReport/renderer/components/WeeklyReport.tsx
// 주간 리포트 메인 대시보드 컨테이너
// 통합 시 src/renderer/src/components/WeeklyReport/WeeklyReport.tsx 로 이동

import React from 'react'
import { useWeeklyReport } from '../hooks/useWeeklyReport'
import { WeekNavigator } from './WeekNavigator'
import { SummaryCards } from './SummaryCards'
import { DailyTimeline } from './DailyTimeline'
import { CommitList } from './CommitList'
import { WeeklyReport as WeeklyReportData } from '../../types/weekly-report'
import './WeeklyReport.css'

interface Props {
  projectId: string | null
  projectName?: string
}

// ─── 주간 요약 텍스트 생성 ────────────────────────────────────────────────────

const CONVENTIONAL_RE = /^(?:feat|fix|chore|docs|style|refactor|test|build|ci|perf)(?:\([^)]+\))?:\s*/i

function generateTextSummary(report: WeeklyReportData): string {
  const { summary, commits } = report

  const parts: string[] = []
  if (summary.filesAdded > 0) parts.push(`${summary.filesAdded} file(s) added`)
  if (summary.filesModified > 0) parts.push(`${summary.filesModified} file(s) modified`)
  if (summary.filesDeleted > 0) parts.push(`${summary.filesDeleted} file(s) deleted`)

  const statLine =
    parts.length > 0
      ? `This week, ${parts.join(', ')}.`
      : 'No file changes this week.'

  const subjects = commits
    .map((c) => c.message.replace(CONVENTIONAL_RE, '').trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => (s.length > 42 ? s.slice(0, 40) + '…' : s))

  const workLine =
    subjects.length > 0
      ? `Key work: ${subjects.join(' and ')}.`
      : ''

  return workLine ? `${statLine} ${workLine}` : statLine
}

// ─── 주간 요약본 섹션 ─────────────────────────────────────────────────────────

function WeeklyTextSummary({ report }: { report: WeeklyReportData }): React.JSX.Element {
  const text = generateTextSummary(report)
  return (
    <div className="wr-text-summary">
      <h3 className="wr-section-title">Weekly Summary</h3>
      <p className="wr-summary-text">{text}</p>
    </div>
  )
}

export function WeeklyReport({ projectId }: Props): React.JSX.Element {
  const {
    report,
    loading,
    error,
    startDate,
    endDate,
    navigatePrev,
    navigateNext,
    isCurrentWeek
  } = useWeeklyReport(projectId)

  if (!projectId) {
    return (
      <div className="wr-empty">
        <span className="wr-empty-icon">📁</span>
        <p>Select a project to view the weekly report.</p>
      </div>
    )
  }

  return (
    <div className="wr-container">
      <WeekNavigator
        startDate={startDate}
        endDate={endDate}
        isCurrentWeek={isCurrentWeek}
        onPrev={navigatePrev}
        onNext={navigateNext}
      />

      {loading && (
        <div className="wr-loading">
          <div className="wr-spinner" />
          <span>Loading report…</span>
        </div>
      )}

      {error && !loading && (
        <div className="wr-error">
          <span>⚠ {error.message}</span>
        </div>
      )}

      {report && !loading && (
        <>
          <SummaryCards summary={report.summary} />
          <DailyTimeline breakdown={report.dailyBreakdown} />
          <div className="wr-bottom-row">
            <CommitList commits={report.commits} />
            <WeeklyTextSummary report={report} />
          </div>
        </>
      )}
    </div>
  )
}
