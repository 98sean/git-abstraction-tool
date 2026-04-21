import React from 'react'
import { useWeeklyReport } from '../../hooks/useWeeklyReport'
import { WeekNavigator } from './WeekNavigator'
import { SummaryCards } from './SummaryCards'
import { DailyTimeline } from './DailyTimeline'
import { CommitList } from './CommitList'
import { WeeklyReport as WeeklyReportData } from '../../types'
import './WeeklyReport.css'

interface Props {
  projectId: string | null
}

const CONVENTIONAL_RE = /^(?:feat|fix|chore|docs|style|refactor|test|build|ci|perf)(?:\([^)]+\))?:\s*/i

function generateTextSummary(report: WeeklyReportData): string {
  const { summary, commits } = report

  const parts: string[] = []
  if (summary.filesAdded > 0) parts.push(`새 파일 ${summary.filesAdded}개가 추가`)
  if (summary.filesModified > 0) parts.push(`${summary.filesModified}개 파일이 수정`)
  if (summary.filesDeleted > 0) parts.push(`${summary.filesDeleted}개 파일이 삭제`)

  const statLine =
    parts.length > 0
      ? `이번 주에는 ${parts.join(', ')}되었습니다.`
      : '이번 주에는 변경된 파일이 없습니다.'

  const subjects = commits
    .map((c) => c.message.replace(CONVENTIONAL_RE, '').trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => (s.length > 42 ? s.slice(0, 40) + '…' : s))

  const workLine = subjects.length > 0 ? `주요 작업: ${subjects.join(' 및 ')}.` : ''

  return workLine ? `${statLine} ${workLine}` : statLine
}

function WeeklyTextSummary({ report }: { report: WeeklyReportData }): React.JSX.Element {
  return (
    <div className="wr-text-summary">
      <h3 className="wr-section-title">주간 요약본</h3>
      <p className="wr-summary-text">{generateTextSummary(report)}</p>
    </div>
  )
}

export function WeeklyReport({ projectId }: Props): React.JSX.Element {
  const { report, loading, error, startDate, endDate, navigatePrev, navigateNext, isCurrentWeek } =
    useWeeklyReport(projectId)

  if (!projectId) {
    return (
      <div className="wr-empty">
        <span className="wr-empty-icon">📁</span>
        <p>프로젝트를 선택하면 주간 리포트를 볼 수 있습니다.</p>
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
          <span>리포트를 불러오는 중…</span>
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
