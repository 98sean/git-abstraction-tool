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

export interface GenerateNaturalUndoSuggestionInput {
  provider: AiProviderName
  model: string
  apiKey: string
  query: string
  timeline: TimelineCommitInfo[]
}

export interface NaturalUndoSuggestionResult {
  commitHash: string
  reason: string
  confidence: number
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
