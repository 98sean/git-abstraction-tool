import React from 'react'
import { WeeklyReportSummary } from '../../types'

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
  const { totalCommits, filesAdded, filesModified, filesDeleted, totalInsertions, totalDeletions } = summary

  return (
    <div className="wr-summary-cards">
      <Card label="총 저장 횟수" value={totalCommits} colorClass="wr-card--neutral" />
      <Card label="새 파일" value={filesAdded} colorClass="wr-card--added" />
      <Card label="수정한 파일" value={filesModified} colorClass="wr-card--modified" />
      <Card label="삭제한 파일" value={filesDeleted} colorClass="wr-card--deleted" />
      {(totalInsertions > 0 || totalDeletions > 0) && (
        <>
          <Card label="추가된 줄" value={`+${totalInsertions}`} colorClass="wr-card--insertions" />
          <Card label="삭제된 줄" value={`-${totalDeletions}`} colorClass="wr-card--deletions" />
        </>
      )}
    </div>
  )
}
