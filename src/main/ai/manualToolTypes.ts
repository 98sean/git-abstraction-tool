import { AiProviderName } from './types'
import { TimelineCommitInfo } from '../git/types'

export interface RelatedCandidate {
  path: string
  score: number
}

export interface FileInsightRelatedFile {
  path: string
  reason: string
}

export interface GenerateFileInsightInput {
  provider: AiProviderName
  model: string
  apiKey: string
  filePath: string
  contentSnippet: string
  recentCommits: Array<{ date: string; message: string }>
  relatedCandidates: RelatedCandidate[]
}

export interface FileInsightResult {
  summary: string
  functionality: string
  relatedFiles: FileInsightRelatedFile[]
}

/**
 * A commit entry sent to the natural-undo AI. Extends the plain git timeline
 * commit with optional fields sourced from `ai-summaries.json`. The AI sees
 * the rich `ai_summary` paragraph plus `areas`/`keywords`/`change_kind` when
 * available so it can match vague natural-language queries against real
 * feature descriptions, not just commit messages.
 */
export interface NaturalUndoTimelineEntry {
  hash: string
  short_hash: string
  date: string
  message: string
  changed_files: string[]
  ai_summary?: string
  change_kind?: string
  user_visible?: boolean
  areas?: string[]
  keywords?: string[]
}

export interface GenerateNaturalUndoSuggestionInput {
  provider: AiProviderName
  model: string
  apiKey: string
  query: string
  timeline: NaturalUndoTimelineEntry[]
}

export interface NaturalUndoCandidate {
  commitHash: string
  reason: string
  confidence: number
}

export interface NaturalUndoSuggestionResult {
  primary: NaturalUndoCandidate
  /** 0-2 additional candidates when the AI is unsure; empty when confident. */
  alternatives: NaturalUndoCandidate[]
}

/**
 * Input to the weekly plain-English feature summary generator. `entries` are
 * the commits in the week that have been enriched with AI summary metadata
 * from `ai-summaries.json`. Commits without AI summaries are still included
 * (message-only) so the output reflects the full week even if some commits
 * were saved without AI summarization.
 */
export interface WeeklyFeatureSummaryEntry {
  hash: string
  date: string
  message: string
  ai_summary?: string
  change_kind?: string
  user_visible?: boolean
  areas?: string[]
  keywords?: string[]
  /**
   * True when this commit is the repository's root commit — an "initial
   * project import" rather than work done during the week. The AI is told
   * to phrase it as "set up the project" instead of listing every file.
   */
  is_initial_import?: boolean
}

/**
 * Real numbers pulled from `git log --numstat --name-status` for the week.
 * Passed to the AI as the ground truth so the narrative can never exceed
 * or contradict what actually happened in git history.
 */
export interface WeeklyFeatureStats {
  totalCommits: number
  filesAdded: number
  filesModified: number
  filesDeleted: number
  linesAdded: number
  linesRemoved: number
  activeDays: number
}

export interface GenerateWeeklyFeatureSummaryInput {
  provider: AiProviderName
  model: string
  apiKey: string
  startDate: string
  endDate: string
  entries: WeeklyFeatureSummaryEntry[]
  stats: WeeklyFeatureStats
}

export interface WeeklyFeatureSummaryResult {
  summary: string
  highlights: string[]
}

export type UntrackedRecommendation = 'commit' | 'delete'

export interface UntrackedReviewItem {
  path: string
  recommendation: UntrackedRecommendation
  reason: string
  confidence: number
}

export interface UntrackedContext {
  path: string
  kind: 'file' | 'dir'
  size: number
  snippet?: string
  entries?: string[]
}

export interface ReviewUntrackedFilesInput {
  provider: AiProviderName
  model: string
  apiKey: string
  contexts: UntrackedContext[]
  timeoutMs?: number
}

export interface UntrackedReviewResult {
  items: UntrackedReviewItem[]
}
