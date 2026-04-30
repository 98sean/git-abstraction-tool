import React from 'react'
import { WeeklyReportSummary } from '../../types'
import { useTerms } from '../../hooks/useTerms'

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
  const t = useTerms()
  const { totalCommits, filesAdded, filesModified, filesDeleted, totalInsertions, totalDeletions } = summary

  return (
    <div className="wr-summary-cards">
      <Card label={t.weeklyTotalCommitsLabel} value={totalCommits} colorClass="wr-card--neutral" />
      <Card label={t.weeklyNewFilesLabel} value={filesAdded} colorClass="wr-card--added" />
      <Card label={t.weeklyModifiedFilesLabel} value={filesModified} colorClass="wr-card--modified" />
      <Card label={t.weeklyDeletedFilesLabel} value={filesDeleted} colorClass="wr-card--deleted" />
      {(totalInsertions > 0 || totalDeletions > 0) && (
        <>
          <Card label={t.weeklyLinesAddedLabel} value={`+${totalInsertions}`} colorClass="wr-card--insertions" />
          <Card label={t.weeklyLinesDeletedLabel} value={`-${totalDeletions}`} colorClass="wr-card--deletions" />
        </>
      )}
    </div>
  )
}
