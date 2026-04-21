import { createAiService } from './service'
import {
  FileInsightResult,
  GenerateFileInsightInput,
  GenerateNaturalUndoSuggestionInput,
  NaturalUndoSuggestionResult,
  ReviewUntrackedFilesInput,
  UntrackedReviewItem,
  UntrackedReviewResult
} from './manualToolTypes'

interface UndoModelResponse {
  commit_hash?: string
  reason?: string
  confidence?: number
}

interface FileInsightModelResponse {
  summary?: string
  functionality?: string
  related_files?: Array<{
    path?: string
    reason?: string
  }>
}

interface UntrackedModelResponse {
  decisions?: Array<{
    path?: string
    recommendation?: 'commit' | 'delete'
    reason?: string
    confidence?: number
  }>
}

const CJK_CHAR_REGEX = /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u9fff\uf900-\ufaff]/u

function normalizeConfidence(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.min(1, value))
}

function ensureEnglishText(value: string | undefined, fallback: string): string {
  const text = value?.trim() ?? ''
  if (!text) return fallback
  if (CJK_CHAR_REGEX.test(text)) return fallback
  return text
}

function toTimelineInput(commits: GenerateNaturalUndoSuggestionInput['timeline']): Array<{
  hash: string
  short_hash: string
  date: string
  message: string
  changed_files: string[]
}> {
  return commits.map((commit) => ({
    hash: commit.hash,
    short_hash: commit.short_hash,
    date: commit.date,
    message: commit.message,
    changed_files: commit.changed_files.slice(0, 15)
  }))
}

export function createManualToolService(deps: {
  aiService: ReturnType<typeof createAiService>
}) {
  const { aiService } = deps

  return {
    async generateNaturalUndoSuggestion(
      input: GenerateNaturalUndoSuggestionInput
    ): Promise<NaturalUndoSuggestionResult> {
      const model = await aiService.generateStructured<UndoModelResponse>({
        provider: input.provider,
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt:
          'You map a natural-language undo request to one commit from a Git timeline. ' +
          'Return strict JSON only: {"commit_hash":"<full-or-short-hash-or-empty>","reason":"<short reason>","confidence":0..1}. ' +
          'Choose the commit that best matches the requested time or event. If unclear, return empty commit_hash.',
        userPrompt: JSON.stringify({
          now: new Date().toISOString(),
          user_query: input.query,
          timeline: toTimelineInput(input.timeline)
        })
      })

      return {
        commitHash: model.commit_hash?.trim() ?? '',
        reason: model.reason?.trim() || 'Matched from your request and commit history.',
        confidence: normalizeConfidence(model.confidence, 0.5)
      }
    },

    async generateFileInsight(input: GenerateFileInsightInput): Promise<FileInsightResult> {
      const model = await aiService.generateStructured<FileInsightModelResponse>({
        provider: input.provider,
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt:
          'You explain one code file for non-technical users. ' +
          'Return strict JSON only with keys: ' +
          '{"summary":"...","functionality":"...","related_files":[{"path":"...","reason":"..."}]}. ' +
          'Keep summary/functionality concise. related_files max 5 and paths must come from candidates. ' +
          'All user-visible text must be in English only. Never use Japanese or any other language.',
        userPrompt: JSON.stringify({
          file_path: input.filePath,
          content_snippet: input.contentSnippet,
          recent_commits: input.recentCommits,
          related_candidates: input.relatedCandidates,
          output_language: 'English'
        })
      })

      const candidateSet = new Set(input.relatedCandidates.map((candidate) => candidate.path))
      const relatedFromModel = (model.related_files ?? [])
        .map((item) => ({
          path: item.path?.replace(/\\/g, '/').trim() ?? '',
          reason: ensureEnglishText(item.reason, 'Related behavior or dependencies.')
        }))
        .filter((item) => item.path && candidateSet.has(item.path))
        .slice(0, 5)

      const relatedFiles =
        relatedFromModel.length > 0
          ? relatedFromModel
          : input.relatedCandidates.slice(0, 5).map((candidate) => ({
            path: candidate.path,
            reason: 'Frequently changed together in commit history.'
          }))

      return {
        summary: ensureEnglishText(
          model.summary,
          'This file is part of the current project workflow.'
        ),
        functionality: ensureEnglishText(
          model.functionality,
          'It defines behavior used by the surrounding feature set.'
        ),
        relatedFiles
      }
    },

    async reviewUntrackedFiles(input: ReviewUntrackedFilesInput): Promise<UntrackedReviewResult> {
      const unresolvedSet = new Set(input.contexts.map((context) => context.path))
      const model = await aiService.generateStructured<UntrackedModelResponse>({
        provider: input.provider,
        model: input.model,
        apiKey: input.apiKey,
        timeoutMs: input.timeoutMs,
        systemPrompt:
          'You classify untracked files in a software project. ' +
          'Return strict JSON only: {"decisions":[{"path":"...","recommendation":"commit|delete","reason":"...","confidence":0..1}]}. ' +
          'Prefer delete for generated/build/cache/temp/log/virtualenv/local-secret files. ' +
          'Prefer commit for source code, config, tests, docs, migration scripts, and lockfiles.',
        userPrompt: JSON.stringify({ untracked_files: input.contexts })
      })

      const items: UntrackedReviewItem[] = (model.decisions ?? [])
        .map((decision) => {
          const normalizedPath = decision.path?.replace(/\\/g, '/').trim() ?? ''
          const recommendation = decision.recommendation === 'delete' ? 'delete' : 'commit'

          return {
            path: normalizedPath,
            recommendation,
            reason:
              decision.reason?.trim() ||
              (recommendation === 'delete'
                ? 'Looks like a generated or local-only file.'
                : 'Looks like work that should be committed.'),
            confidence: normalizeConfidence(decision.confidence, recommendation === 'delete' ? 0.78 : 0.7)
          }
        })
        .filter((item) => item.path && unresolvedSet.has(item.path))

      return { items }
    }
  }
}
