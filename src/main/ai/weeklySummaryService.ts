import { createHash } from 'node:crypto'
import {
  GenerateWeeklyFeatureSummaryInput,
  WeeklyFeatureStats,
  WeeklyFeatureSummaryEntry
} from './manualToolTypes'
import { AiOutputLanguage, AiProviderName } from './types'
import { AiCommitSummary } from '../db/aiSummaries'
import { WeeklySummaryCacheEntry } from '../db/weeklySummaryCache'
import { WeeklyCommit, WeeklyReport } from '../git/types'

interface WeeklySummaryAiConfig {
  provider: AiProviderName
  model: string
  apiKey: string
}

interface WeeklySummaryService {
  getWeeklyLog(
    startDate: string,
    endDate: string,
    projectId: string,
    projectName: string
  ): Promise<WeeklyReport>
}

interface WeeklySummaryManualToolService {
  generateWeeklyFeatureSummary(input: GenerateWeeklyFeatureSummaryInput): Promise<{
    summary: string
    highlights: string[]
  }>
}

interface GenerateWeeklySummaryInput {
  projectId: string
  projectName: string
  startDate: string
  endDate: string
  aiConfig: WeeklySummaryAiConfig
  outputLanguage?: AiOutputLanguage
  weeklyService: WeeklySummaryService
  manualToolService: WeeklySummaryManualToolService
  getSummariesByHash: (projectId: string, commitHashes: string[]) => Map<string, AiCommitSummary>
  getCachedSummary: (params: {
    project_id: string
    start_date: string
    end_date: string
    commit_signature: string
    model: string
    output_language: AiOutputLanguage
    ai_summary_count: number
  }) => WeeklySummaryCacheEntry | undefined
  setCachedSummary: (entry: WeeklySummaryCacheEntry) => void
  now?: () => number
}

interface WeeklySummaryOutput {
  summary: string
  highlights: string[]
  commit_count: number
  ai_summary_count: number
  has_entries: boolean
  stats: WeeklyFeatureStats
  cached?: boolean
}

export async function generateWeeklySummary({
  projectId,
  projectName,
  startDate,
  endDate,
  aiConfig,
  outputLanguage = 'en',
  weeklyService,
  manualToolService,
  getSummariesByHash,
  getCachedSummary,
  setCachedSummary,
  now = Date.now
}: GenerateWeeklySummaryInput): Promise<WeeklySummaryOutput> {
  const weeklyReport = await weeklyService.getWeeklyLog(startDate, endDate, projectId, projectName)
  const weekCommits: WeeklyCommit[] = weeklyReport.commits

  const stats: WeeklyFeatureStats = {
    totalCommits: weeklyReport.summary.totalCommits,
    filesAdded: weeklyReport.summary.filesAdded,
    filesModified: weeklyReport.summary.filesModified,
    filesDeleted: weeklyReport.summary.filesDeleted,
    linesAdded: weeklyReport.summary.totalInsertions,
    linesRemoved: weeklyReport.summary.totalDeletions,
    activeDays: weeklyReport.dailyBreakdown.filter((day) => day.commitCount > 0).length
  }

  if (weekCommits.length === 0) {
    return {
      summary: '',
      highlights: [],
      commit_count: 0,
      ai_summary_count: 0,
      has_entries: false,
      stats
    }
  }

  const summariesByHash = getSummariesByHash(
    projectId,
    weekCommits.map((commit) => commit.hash)
  )

  const entries: WeeklyFeatureSummaryEntry[] = weekCommits
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((commit) => {
      const ai = summariesByHash.get(commit.hash)
      return {
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        ai_summary: ai?.summary,
        change_kind: ai?.change_kind,
        user_visible: ai?.user_visible,
        areas: ai?.areas,
        keywords: ai?.keywords,
        is_initial_import: commit.is_initial_import
      }
    })

  const aiSummaryCount = entries.filter((entry) => Boolean(entry.ai_summary)).length
  const commitSignature = createHash('sha256')
    .update(entries.map((entry) => `${entry.hash}:${entry.ai_summary ? 1 : 0}`).join('|'))
    .digest('hex')

  const cached = getCachedSummary({
    project_id: projectId,
    start_date: startDate,
    end_date: endDate,
    commit_signature: commitSignature,
    model: aiConfig.model,
    output_language: outputLanguage,
    ai_summary_count: aiSummaryCount
  })

  if (cached) {
    return {
      summary: cached.summary,
      highlights: cached.highlights,
      commit_count: cached.commit_count,
      ai_summary_count: cached.ai_summary_count,
      has_entries: true,
      stats: cached.stats,
      cached: true
    }
  }

  const result = await manualToolService.generateWeeklyFeatureSummary({
    provider: aiConfig.provider,
    model: aiConfig.model,
    apiKey: aiConfig.apiKey,
    outputLanguage,
    startDate,
    endDate,
    entries,
    stats
  })

  setCachedSummary({
    project_id: projectId,
    start_date: startDate,
    end_date: endDate,
    commit_signature: commitSignature,
    model: aiConfig.model,
    output_language: outputLanguage,
    ai_summary_count: aiSummaryCount,
    summary: result.summary,
    highlights: result.highlights,
    commit_count: entries.length,
    stats,
    created_at: now()
  })

  return {
    summary: result.summary,
    highlights: result.highlights,
    commit_count: entries.length,
    ai_summary_count: aiSummaryCount,
    has_entries: true,
    stats,
    cached: false
  }
}
