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
import type { AppTerms } from '../../i18n/terms'
import { useTerms } from '../../hooks/useTerms'
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
function generateTextSummary(report: WeeklyReportData, t: AppTerms): string {
  const { summary, commits } = report

  const subjects = commits
    .map((c) => c.message.replace(CONVENTIONAL_RE, '').trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => (s.length > 42 ? s.slice(0, 40) + '…' : s))

  return t.weeklyTextFallback(summary.filesAdded, summary.filesModified, summary.filesDeleted, subjects)
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
  const t = useTerms()
  // Prefer the AI-generated, feature-focused summary when it's available and
  // backed by real ai-summaries.json entries. Otherwise gracefully degrade.
  const hasAiSummary = aiSummary?.has_entries && aiSummary.summary.trim().length > 0

  return (
    <div className="wr-text-summary">
      <h3 className="wr-section-title">{t.weeklySummaryTitle}</h3>

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
            {t.weeklySummaryBasedOn(
              aiSummary!.commit_count,
              aiSummary!.ai_summary_count,
              aiSummary!.stats.activeDays
            )}
          </div>
        </>
      ) : (
        <>
          <p className="wr-summary-text">{generateTextSummary(report, t)}</p>
          {aiLoading && <div className="wr-summary-meta">{t.weeklySummaryGenerating}</div>}
          {!aiLoading && !aiConnected && (
            <div className="wr-summary-meta">
              {t.weeklySummaryConnectAiHint}
            </div>
          )}
          {!aiLoading && aiConnected && aiSummary && !aiSummary.has_entries && (
            <div className="wr-summary-meta">{t.weeklySummaryNoCommits}</div>
          )}
          {aiError && <div className="wr-summary-meta">{aiError}</div>}
        </>
      )}
    </div>
  )
}

export function WeeklyReport({ projectId, aiConnection }: Props): React.JSX.Element {
  const t = useTerms()
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
        <p>{t.weeklySelectProjectText}</p>
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
          <span>{t.weeklyLoadingText}</span>
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
