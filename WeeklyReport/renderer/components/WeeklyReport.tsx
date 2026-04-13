// WeeklyReport/renderer/components/WeeklyReport.tsx
// 주간 리포트 메인 대시보드 컨테이너
// 통합 시 src/renderer/src/components/WeeklyReport/WeeklyReport.tsx 로 이동

import React from 'react'
import { useWeeklyReport } from '../hooks/useWeeklyReport'
import { WeekNavigator } from './WeekNavigator'
import { SummaryCards } from './SummaryCards'
import { DailyTimeline } from './DailyTimeline'
import { CommitList } from './CommitList'
import './WeeklyReport.css'

interface Props {
  projectId: string | null
  projectName?: string
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
          <CommitList commits={report.commits} />
        </>
      )}
    </div>
  )
}
