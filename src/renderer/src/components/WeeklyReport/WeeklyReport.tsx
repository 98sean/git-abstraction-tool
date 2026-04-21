import React from 'react'
import { useWeeklyReport } from '../../hooks/useWeeklyReport'
import { useWeeklyAiSummary } from '../../hooks/useWeeklyAiSummary'
import { WeekNavigator } from './WeekNavigator'
import { SummaryCards } from './SummaryCards'
import { DailyTimeline } from './DailyTimeline'
import { CommitList } from './CommitList'
import {
  AiConnectionState,
  WeeklyAiSummary,
  WeeklyReport as WeeklyReportData
} from '../../types'
import './WeeklyReport.css'

interface Props {
  projectId: string | null
  aiConnection: AiConnectionState
}

const CONVENTIONAL_RE = /^(?:feat|fix|chore|docs|style|refactor|test|build|ci|perf)(?:\([^)]+\))?:\s*/i

/**
 * Rule-based fallback used when there is no AI connection, no AI summaries in
 * the week window, or the AI call failed. Intentionally short and statistical.
 */
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

  const workLine = subjects.length > 0 ? `Key work: ${subjects.join(' and ')}.` : ''

  return workLine ? `${statLine} ${workLine}` : statLine
}

interface WeeklyTextSummaryProps {
  report: WeeklyReportData
  aiSummary: WeeklyAiSummary | null
  aiLoading: boolean
  aiError: string | null
  aiConnected: boolean
}

function WeeklyTextSummary({
  report,
  aiSummary,
  aiLoading,
  aiError,
  aiConnected
}: WeeklyTextSummaryProps): React.JSX.Element {
  // Prefer the AI-generated, feature-focused summary when it's available and
  // backed by real ai-summaries.json entries. Otherwise gracefully degrade.
  const hasAiSummary = aiSummary?.has_entries && aiSummary.summary.trim().length > 0

  return (
    <div className="wr-text-summary">
      <h3 className="wr-section-title">Weekly Summary</h3>

      {hasAiSummary ? (
        <>
          <p className="wr-summary-text">{aiSummary!.summary}</p>
          {aiSummary!.highlights.length > 0 && (
            <ul className="wr-summary-highlights">
              {aiSummary!.highlights.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          )}
          <div className="wr-summary-meta">
            {`Based on ${aiSummary!.commit_count} commit${aiSummary!.commit_count === 1 ? '' : 's'} this week`}
            {aiSummary!.ai_summary_count > 0 &&
              ` (${aiSummary!.ai_summary_count} with AI summaries)`}
            {aiSummary!.stats.activeDays > 0 &&
              ` across ${aiSummary!.stats.activeDays} active day${aiSummary!.stats.activeDays === 1 ? '' : 's'}`}
            .
          </div>
        </>
      ) : (
        <>
          <p className="wr-summary-text">{generateTextSummary(report)}</p>
          {aiLoading && <div className="wr-summary-meta">Generating AI summary…</div>}
          {!aiLoading && !aiConnected && (
            <div className="wr-summary-meta">
              Connect AI to get a friendlier, feature-focused weekly summary.
            </div>
          )}
          {!aiLoading && aiConnected && aiSummary && !aiSummary.has_entries && (
            <div className="wr-summary-meta">No commits were recorded this week yet.</div>
          )}
          {aiError && <div className="wr-summary-meta">{aiError}</div>}
        </>
      )}
    </div>
  )
}

export function WeeklyReport({ projectId, aiConnection }: Props): React.JSX.Element {
  const { report, loading, error, startDate, endDate, navigatePrev, navigateNext, isCurrentWeek } =
    useWeeklyReport(projectId)

  const {
    aiSummary,
    loading: aiLoading,
    error: aiError
  } = useWeeklyAiSummary(projectId, startDate, endDate, aiConnection)

  const aiConnected =
    aiConnection.connection_status === 'connected' && Boolean(aiConnection.selected_model)

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
            <WeeklyTextSummary
              report={report}
              aiSummary={aiSummary}
              aiLoading={aiLoading}
              aiError={aiError}
              aiConnected={aiConnected}
            />
          </div>
        </>
      )}
    </div>
  )
}
