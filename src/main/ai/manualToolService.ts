import { createAiService } from './service'
import {
  FileInsightResult,
  GenerateFileInsightInput,
  GenerateNaturalUndoSuggestionInput,
  GenerateWeeklyFeatureSummaryInput,
  NaturalUndoCandidate,
  NaturalUndoSuggestionResult,
  ReviewUntrackedFilesInput,
  UntrackedReviewItem,
  UntrackedReviewResult,
  WeeklyFeatureSummaryResult
} from './manualToolTypes'
import { AiOutputLanguage } from './types'

interface UndoCandidateModel {
  commit_hash?: string
  reason?: string
  confidence?: number
}

interface UndoModelResponse {
  primary?: UndoCandidateModel
  alternatives?: UndoCandidateModel[]
  // Back-compat with the older single-commit response shape.
  commit_hash?: string
  reason?: string
  confidence?: number
}

interface WeeklyFeatureSummaryModelResponse {
  summary?: string
  highlights?: string[]
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
const OUTPUT_LANGUAGE_LABEL: Record<AiOutputLanguage, string> = {
  en: 'English',
  ko: 'Korean'
}

function normalizeConfidence(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.min(1, value))
}

function getOutputLanguage(input?: { outputLanguage?: AiOutputLanguage }): AiOutputLanguage {
  return input?.outputLanguage ?? 'en'
}

function outputLanguageInstruction(language: AiOutputLanguage): string {
  return `Write all user-visible text in ${OUTPUT_LANGUAGE_LABEL[language]}.`
}

function ensureLocalizedText(
  value: string | undefined,
  fallback: string,
  outputLanguage: AiOutputLanguage
): string {
  const text = value?.trim() ?? ''
  if (!text) return fallback
  if (outputLanguage === 'en' && CJK_CHAR_REGEX.test(text)) return fallback
  return text
}

function toTimelineInput(
  commits: GenerateNaturalUndoSuggestionInput['timeline']
): Array<Record<string, unknown>> {
  return commits.map((commit) => {
    const entry: Record<string, unknown> = {
      hash: commit.hash,
      short_hash: commit.short_hash,
      date: commit.date,
      message: commit.message,
      changed_files: commit.changed_files.slice(0, 15)
    }
    if (commit.ai_summary) entry.ai_summary = commit.ai_summary
    if (commit.change_kind) entry.change_kind = commit.change_kind
    if (typeof commit.user_visible === 'boolean') entry.user_visible = commit.user_visible
    if (commit.areas && commit.areas.length > 0) entry.areas = commit.areas.slice(0, 8)
    if (commit.keywords && commit.keywords.length > 0) entry.keywords = commit.keywords.slice(0, 12)
    return entry
  })
}

function normalizeUndoCandidate(
  model: UndoCandidateModel | undefined,
  fallback: NaturalUndoCandidate
): NaturalUndoCandidate {
  if (!model) return fallback
  return {
    commitHash: model.commit_hash?.trim() ?? fallback.commitHash,
    reason: model.reason?.trim() || fallback.reason,
    confidence: normalizeConfidence(model.confidence, fallback.confidence)
  }
}

export function createManualToolService(deps: {
  aiService: ReturnType<typeof createAiService>
}) {
  const { aiService } = deps

  return {
    async generateNaturalUndoSuggestion(
      input: GenerateNaturalUndoSuggestionInput
    ): Promise<NaturalUndoSuggestionResult> {
      const outputLanguage = getOutputLanguage(input)
      const model = await aiService.generateStructured<UndoModelResponse>({
        provider: input.provider,
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt:
          'You map a natural-language "undo" or "restore to" request to commits from a Git timeline. ' +
          'Each timeline entry may include an `ai_summary` paragraph plus `areas`, `keywords`, `change_kind`, and `user_visible` ' +
          'that describe what changed in plain, non-technical terms — prefer matching those fields over the raw commit message when they are present. ' +
          'Return strict JSON only: ' +
          '{"primary":{"commit_hash":"<full-hash>","reason":"<one short sentence, non-technical>","confidence":0..1},' +
          '"alternatives":[{"commit_hash":"<hash>","reason":"<short reason>","confidence":0..1}]}. ' +
          'Rules: ' +
          '(1) If exactly one commit clearly matches, set primary.confidence >= 0.8 and leave alternatives empty. ' +
          '(2) If the request is vague, ambiguous, or fits multiple commits, return the best-guess primary plus 1-2 alternatives ' +
          '(different commits, each with its own reason). Never return more than 2 alternatives. ' +
          '(3) If nothing matches at all, set primary.commit_hash to "" and alternatives to []. ' +
          '(4) All reasons must use plain language that a non-developer can understand — describe the feature/change, not file paths or function names. ' +
          outputLanguageInstruction(outputLanguage),
        userPrompt: JSON.stringify({
          now: new Date().toISOString(),
          output_language: OUTPUT_LANGUAGE_LABEL[outputLanguage],
          user_query: input.query,
          timeline: toTimelineInput(input.timeline)
        })
      })

      // Back-compat: some earlier responses return the flat single-commit shape.
      const hasStructured = model.primary !== undefined || model.alternatives !== undefined
      const primary = hasStructured
        ? normalizeUndoCandidate(model.primary, {
            commitHash: '',
            reason: 'Matched from your request and commit history.',
            confidence: 0.5
          })
        : {
            commitHash: model.commit_hash?.trim() ?? '',
            reason: model.reason?.trim() || 'Matched from your request and commit history.',
            confidence: normalizeConfidence(model.confidence, 0.5)
          }

      const alternativesRaw = Array.isArray(model.alternatives) ? model.alternatives : []
      const alternatives: NaturalUndoCandidate[] = alternativesRaw
        .slice(0, 2)
        .map((candidate, index) =>
          normalizeUndoCandidate(candidate, {
            commitHash: '',
            reason: `Another possible match #${index + 1}.`,
            confidence: 0.4
          })
        )
        .filter((candidate) => candidate.commitHash && candidate.commitHash !== primary.commitHash)

      return { primary, alternatives }
    },

    async generateWeeklyFeatureSummary(
      input: GenerateWeeklyFeatureSummaryInput
    ): Promise<WeeklyFeatureSummaryResult> {
      const outputLanguage = getOutputLanguage(input)
      if (input.entries.length === 0 || input.stats.totalCommits === 0) {
        return {
          summary: outputLanguage === 'ko'
            ? '이번 주에는 저장된 기록이 없습니다.'
            : 'No saves were recorded this week.',
          highlights: []
        }
      }

      // Ground-truth stats come from `git log --numstat --name-status` for
      // the week — the AI must never contradict or exceed them. Rich context
      // (ai_summary / areas / keywords) improves the prose but cannot inflate
      // the counts. For "vibe coders" we still forbid file paths and function
      // names, but *numeric facts from stats* are explicitly allowed because
      // those come from git, not from the AI.
      const model = await aiService.generateStructured<WeeklyFeatureSummaryModelResponse>({
        provider: input.provider,
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt:
          'You write a weekly "what I accomplished" summary for a non-technical creator using a Git app. ' +
          'Input contains: ' +
          '(a) `stats` — REAL numbers pulled directly from git history (total_commits, active_days, files added/modified/deleted, lines added/removed). ' +
          '(b) `commits` — every commit made this week; some include an `ai_summary` paragraph and `areas`/`keywords` tags, others only a short message. ' +
          'Rules you MUST follow: ' +
          '1. Treat `stats` as ground truth. Never claim more commits, days, or changes than `stats` says. ' +
          '2. You may reference numeric facts from `stats` (e.g. "across your 5 saves on 3 different days") but must not invent new numbers. ' +
          '3. Write in the second person ("you added…") using clear, non-technical language. ' +
          '4. Focus on user-facing FEATURES that were added, changed, or removed. Prefer `ai_summary` text; for commits with only a message, infer a feature-level description from the message. ' +
          '5. Never mention file paths, function names, programming languages, or Git jargon (commit, branch, merge, refactor, lint, etc.). Translate technical terms into everyday words. ' +
          '6. Cover the whole week — do not silently drop commits just because they lack an `ai_summary`. ' +
          '7. If a commit has `is_initial_import:true`, describe it as "set up / imported the project" or "added a batch of existing assets" only. Never list its files, and do not treat it as if the user built thousands of new features — it is a bulk import of existing work, not new work done this week. ' +
          '8. If a commit is clearly non-user-facing (user_visible:false or obvious chore), roll it up as "some behind-the-scenes cleanup" rather than listing it. ' +
          `9. ${outputLanguageInstruction(outputLanguage)} ` +
          'Return strict JSON only: {"summary":"<2-4 sentences, warm, encouraging, grounded in stats>", ' +
          '"highlights":["<feature-level bullet>", "..." (3-6 bullets, each under 14 words, each describing a real commit)]}.',
        userPrompt: JSON.stringify({
          week_start: input.startDate,
          week_end: input.endDate,
          output_language: OUTPUT_LANGUAGE_LABEL[outputLanguage],
          stats: input.stats,
          commits: input.entries
        })
      })

      const summaryText = (model.summary ?? '').trim()
      const rawHighlights = Array.isArray(model.highlights) ? model.highlights : []
      const highlights = rawHighlights
        .map((h) => (typeof h === 'string' ? h.trim() : ''))
        .filter((h) => h.length > 0)
        .slice(0, 6)

      return {
        summary: ensureLocalizedText(
          summaryText,
          outputLanguage === 'ko'
            ? '이번 주에는 프로젝트를 앞으로 나아가게 한 저장 기록이 있습니다.'
            : 'This week you made a handful of saves that moved the project forward.',
          outputLanguage
        ),
        highlights
      }
    },

    async generateFileInsight(input: GenerateFileInsightInput): Promise<FileInsightResult> {
      const outputLanguage = getOutputLanguage(input)
      const model = await aiService.generateStructured<FileInsightModelResponse>({
        provider: input.provider,
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt:
          'You explain one code file for non-technical users. ' +
          'Return strict JSON only with keys: ' +
          '{"summary":"...","functionality":"...","related_files":[{"path":"...","reason":"..."}]}. ' +
          'Keep summary/functionality concise. related_files max 5 and paths must come from candidates. ' +
          outputLanguageInstruction(outputLanguage),
        userPrompt: JSON.stringify({
          file_path: input.filePath,
          content_snippet: input.contentSnippet,
          recent_commits: input.recentCommits,
          related_candidates: input.relatedCandidates,
          output_language: OUTPUT_LANGUAGE_LABEL[outputLanguage]
        })
      })

      const candidateSet = new Set(input.relatedCandidates.map((candidate) => candidate.path))
      const relatedFromModel = (model.related_files ?? [])
        .map((item) => ({
          path: item.path?.replace(/\\/g, '/').trim() ?? '',
          reason: ensureLocalizedText(
            item.reason,
            outputLanguage === 'ko' ? '관련된 동작이나 의존성이 있습니다.' : 'Related behavior or dependencies.',
            outputLanguage
          )
        }))
        .filter((item) => item.path && candidateSet.has(item.path))
        .slice(0, 5)

      const relatedFiles =
        relatedFromModel.length > 0
          ? relatedFromModel
          : input.relatedCandidates.slice(0, 5).map((candidate) => ({
            path: candidate.path,
            reason: outputLanguage === 'ko'
              ? '최근 기록에서 자주 함께 변경되었습니다.'
              : 'Frequently changed together in commit history.'
          }))

      return {
        summary: ensureLocalizedText(
          model.summary,
          outputLanguage === 'ko'
            ? '이 파일은 현재 프로젝트 흐름의 일부입니다.'
            : 'This file is part of the current project workflow.',
          outputLanguage
        ),
        functionality: ensureLocalizedText(
          model.functionality,
          outputLanguage === 'ko'
            ? '주변 기능에서 사용하는 동작을 정의합니다.'
            : 'It defines behavior used by the surrounding feature set.',
          outputLanguage
        ),
        relatedFiles
      }
    },

    async reviewUntrackedFiles(input: ReviewUntrackedFilesInput): Promise<UntrackedReviewResult> {
      const outputLanguage = getOutputLanguage(input)
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
          'Prefer commit for source code, config, tests, docs, migration scripts, and lockfiles. ' +
          outputLanguageInstruction(outputLanguage),
        userPrompt: JSON.stringify({
          output_language: OUTPUT_LANGUAGE_LABEL[outputLanguage],
          untracked_files: input.contexts
        })
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
                ? outputLanguage === 'ko'
                  ? '생성된 파일이거나 로컬에서만 필요한 파일로 보입니다.'
                  : 'Looks like a generated or local-only file.'
                : outputLanguage === 'ko'
                  ? '저장해야 할 작업으로 보입니다.'
                  : 'Looks like work that should be committed.'),
            confidence: normalizeConfidence(decision.confidence, recommendation === 'delete' ? 0.78 : 0.7)
          }
        })
        .filter((item) => item.path && unresolvedSet.has(item.path))

      return { items }
    }
  }
}
