import {
  GenerateNaturalUndoSuggestionInput,
  NaturalUndoSuggestionResult,
  NaturalUndoTimelineEntry
} from './manualToolTypes'
import { AiOutputLanguage, AiProviderName } from './types'
import { AiCommitSummary } from '../db/aiSummaries'
import { RestorePreview, TimelineCommitInfo } from '../git/types'

interface NaturalUndoGitService {
  getTimeline(limit: number): Promise<TimelineCommitInfo[]>
  getRestorePreview(commitHash: string): Promise<RestorePreview>
}

interface NaturalUndoManualToolService {
  generateNaturalUndoSuggestion(
    input: GenerateNaturalUndoSuggestionInput
  ): Promise<NaturalUndoSuggestionResult>
}

interface GenerateNaturalUndoSuggestionServiceInput {
  projectId: string
  query: string
  aiConfig: {
    provider: AiProviderName
    model: string
    apiKey: string
  }
  outputLanguage?: AiOutputLanguage
  gitService: NaturalUndoGitService
  manualToolService: NaturalUndoManualToolService
  getSummariesByHash: (projectId: string, commitHashes: string[]) => Map<string, AiCommitSummary>
}

interface NaturalUndoOptionOutput {
  commit_hash: string
  short_hash: string
  commit_message: string
  commit_date: string
  reason: string
  confidence: number
  total_restore_files: number
  total_remove_files: number
  restore_files_preview: string[]
  remove_files_preview: string[]
  proposal_text: string
}

interface NaturalUndoSuggestionOutput extends NaturalUndoOptionOutput {
  query: string
  alternatives: NaturalUndoOptionOutput[]
}

function basename(pathValue: string): string {
  const normalized = pathValue.replace(/\\/g, '/')
  const parts = normalized.split('/')
  return parts[parts.length - 1] ?? normalized
}

function summarizeCommitEvent(commit: TimelineCommitInfo): string {
  const files = commit.changed_files
  if (files.length === 0) {
    return commit.message.trim() || 'changes were made'
  }

  const imagePath = files.find((filePath) => /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(filePath))
  if (imagePath) {
    const lower = imagePath.toLowerCase()
    if (
      lower.includes('main') ||
      lower.includes('hero') ||
      lower.includes('banner') ||
      lower.includes('cover')
    ) {
      return 'main image updated'
    }
    return `${basename(imagePath)} updated`
  }

  if (files.length === 1) {
    return `${basename(files[0])} changed`
  }
  return `${basename(files[0])} and ${files.length - 1} more files changed`
}

function formatCommitDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleString()
}

function firstSentence(paragraph: string): string {
  const trimmed = paragraph.trim()
  if (!trimmed) return 'changes were made'
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/u)
  const picked = match ? match[1] : trimmed
  return picked.length > 120 ? `${picked.slice(0, 117).trimEnd()}…` : picked
}

function resolveCommit(commits: TimelineCommitInfo[], suggestedHash?: string): TimelineCommitInfo | null {
  const hash = suggestedHash?.trim()
  if (!hash) return null
  return (
    commits.find((commit) => commit.hash === hash) ??
    commits.find((commit) => commit.hash.startsWith(hash)) ??
    commits.find((commit) => commit.short_hash === hash) ??
    null
  )
}

export async function generateNaturalUndoSuggestion({
  projectId,
  query,
  aiConfig,
  outputLanguage = 'en',
  gitService,
  manualToolService,
  getSummariesByHash
}: GenerateNaturalUndoSuggestionServiceInput): Promise<NaturalUndoSuggestionOutput> {
  if (!query?.trim()) {
    throw new Error('Please describe the point in time you want to restore to.')
  }

  const timeline = await gitService.getTimeline(120)
  if (timeline.length === 0) {
    throw new Error('No commit history is available for restoration.')
  }

  const summariesByHash = getSummariesByHash(
    projectId,
    timeline.map((entry) => entry.hash)
  )
  const enrichedTimeline: NaturalUndoTimelineEntry[] = timeline.map((entry) => {
    const ai = summariesByHash.get(entry.hash)
    return {
      hash: entry.hash,
      short_hash: entry.short_hash,
      date: entry.date,
      message: entry.message,
      changed_files: entry.changed_files,
      ai_summary: ai?.summary,
      change_kind: ai?.change_kind,
      user_visible: ai?.user_visible,
      areas: ai?.areas,
      keywords: ai?.keywords
    }
  })

  const suggestion = await manualToolService.generateNaturalUndoSuggestion({
    provider: aiConfig.provider,
    model: aiConfig.model,
    apiKey: aiConfig.apiKey,
    outputLanguage,
    query: query.trim(),
    timeline: enrichedTimeline
  })

  const target = resolveCommit(timeline, suggestion.primary.commitHash)
  if (!target) {
    throw new Error('Could not identify a commit for this request. Please be more specific.')
  }

  const previewByHash = new Map<string, RestorePreview>()
  const getPreview = async (commitHash: string): Promise<RestorePreview> => {
    const cached = previewByHash.get(commitHash)
    if (cached) return cached
    const preview = await gitService.getRestorePreview(commitHash)
    previewByHash.set(commitHash, preview)
    return preview
  }

  const buildOption = async (
    commit: TimelineCommitInfo,
    reason: string,
    confidence: number
  ): Promise<NaturalUndoOptionOutput | null> => {
    const preview = await getPreview(commit.hash)
    if (preview.files_to_restore.length === 0 && preview.files_to_remove.length === 0) {
      return null
    }

    const ai = summariesByHash.get(commit.hash)
    const label = ai?.summary ? firstSentence(ai.summary) : summarizeCommitEvent(commit)
    return {
      commit_hash: commit.hash,
      short_hash: commit.short_hash,
      commit_message: commit.message,
      commit_date: commit.date,
      reason,
      confidence,
      total_restore_files: preview.files_to_restore.length,
      total_remove_files: preview.files_to_remove.length,
      restore_files_preview: preview.files_to_restore.slice(0, 6),
      remove_files_preview: preview.files_to_remove.slice(0, 6),
      proposal_text:
        outputLanguage === 'ko'
          ? `이 시점으로 되돌릴까요? (${formatCommitDate(commit.date)}: ${label})`
          : `Restore to this point (${formatCommitDate(commit.date)}: ${label})?`
    }
  }

  let primaryPayload = await buildOption(
    target,
    suggestion.primary.reason,
    suggestion.primary.confidence
  )

  if (!primaryPayload) {
    for (const commit of timeline) {
      if (commit.hash === target.hash) continue
      primaryPayload = await buildOption(
        commit,
        outputLanguage === 'ko'
          ? '실제로 파일을 바꿀 수 있는 가장 가까운 이전 시점입니다.'
          : 'This is the closest earlier point that would actually change your files.',
        Math.min(suggestion.primary.confidence, 0.7)
      )
      if (primaryPayload) break
    }
  }

  if (!primaryPayload) {
    throw new Error('Your files already match the available restore points.')
  }

  const altCommits = suggestion.alternatives
    .map((candidate) => ({ candidate, commit: resolveCommit(timeline, candidate.commitHash) }))
    .filter(
      (entry): entry is { candidate: (typeof suggestion.alternatives)[number]; commit: TimelineCommitInfo } =>
        entry.commit !== null && entry.commit.hash !== target.hash
    )
    .slice(0, 2)

  const alternatives = (
    await Promise.all(
      altCommits.map(({ candidate, commit }) =>
        buildOption(commit, candidate.reason, candidate.confidence)
      )
    )
  ).filter((option): option is NaturalUndoOptionOutput => option !== null)

  return {
    query: query.trim(),
    ...primaryPayload,
    alternatives
  }
}
