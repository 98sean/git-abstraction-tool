// WeeklyReport/renderer/components/SummaryCards.tsx
// 주간 요약 카드 (총 저장 횟수, 파일 추가/수정/삭제, 줄 수)

import React from 'react'
import { WeeklyReportSummary } from '../../types/weekly-report'

interface Props {
  summary: WeeklyReportSummary
}

interface CardProps {
  label: string
  value: number | string
  colorClass?: string
}

function Card({ label, value, colorClass = '' }: CardProps): React.JSX.Element {
  return (
    <div className={`wr-card ${colorClass}`}>
      <span className="wr-card-value">{value}</span>
      <span className="wr-card-label">{label}</span>
    </div>
  )
}

export function SummaryCards({ summary }: Props): React.JSX.Element {
  const {
    totalCommits,
    filesAdded,
    filesModified,
    filesDeleted,
    totalInsertions,
    totalDeletions
  } = summary

  return (
    <div className="wr-summary-cards">
      <Card label="Total Commits" value={totalCommits} colorClass="wr-card--neutral" />
      <Card label="New Files" value={filesAdded} colorClass="wr-card--added" />
      <Card label="Modified Files" value={filesModified} colorClass="wr-card--modified" />
      <Card label="Deleted Files" value={filesDeleted} colorClass="wr-card--deleted" />
      {(totalInsertions > 0 || totalDeletions > 0) && (
        <>
          <Card label="Lines Added" value={`+${totalInsertions}`} colorClass="wr-card--insertions" />
          <Card label="Lines Deleted" value={`-${totalDeletions}`} colorClass="wr-card--deletions" />
        </>
      )}
    </div>
  )
}
