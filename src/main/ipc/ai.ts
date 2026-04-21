import { ipcMain } from 'electron'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { generateCommitSuggestion } from '../ai/openai'
import {
  createManualToolService
} from '../ai/manualToolService'
import { createAiService } from '../ai/service'
import { AiProviderName } from '../ai/types'
import { getAiConnectionState, clearAiConnectionState, setAiConnectionState } from '../db/aiConnection'
import { clearAiApiKey, getAiApiKey, setAiApiKey } from '../db/credentials'
import { getProjectAiSettings, ProjectAiSettings, setProjectAiSettings } from '../db/projectAiSettings'
import { listProjects } from '../db/projects'
import { getGitService } from '../git'
import { TimelineCommitInfo } from '../git/types'

const aiService = createAiService()
const manualToolService = createManualToolService({ aiService })

interface RelatedCandidate {
  path: string
  score: number
}

type UntrackedRecommendation = 'commit' | 'delete'

interface UntrackedReviewItem {
  path: string
  recommendation: UntrackedRecommendation
  reason: string
  confidence: number
}

const UNTRACKED_AI_MAX_CONTEXT_FILES = 100
const UNTRACKED_AI_MAX_SNIPPET_FILES = 16
const UNTRACKED_AI_SNIPPET_MAX_BYTES = 100_000
const UNTRACKED_AI_TIMEOUT_BASE_MS = 12_000
const UNTRACKED_AI_TIMEOUT_PER_FILE_MS = 220
const UNTRACKED_AI_TIMEOUT_MAX_MS = 45_000

function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const parts = normalized.split('/')
  return parts[parts.length - 1] ?? normalized
}

function summarizeCommitEvent(commit: TimelineCommitInfo): string {
  const files = commit.changed_files
  if (files.length === 0) {
    return commit.message.trim() || 'changes were made'
  }

  const imagePath = files.find((f) => /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(f))
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

function getProjectPath(projectId: string): string {
  const project = listProjects().find((p) => p.project_id === projectId)
  if (!project) throw new Error('Project not found.')
  return project.local_path
}

function toSafeAbsolutePath(projectRoot: string, filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const absolute = path.resolve(projectRoot, normalized)
  const rel = path.relative(projectRoot, absolute)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Invalid file path.')
  }
  return absolute
}

function toTextSnippet(content: string, maxChars = 12000): string {
  if (!content) return ''
  return content.length > maxChars ? `${content.slice(0, maxChars)}\n...` : content
}

function buildRelatedCandidates(
  filePath: string,
  trackedFiles: string[],
  timeline: TimelineCommitInfo[]
): RelatedCandidate[] {
  const scoreMap = new Map<string, number>()
  const fileDir = path.posix.dirname(filePath.replace(/\\/g, '/'))
  const fileBase = basename(filePath)
  const fileStem = fileBase.replace(/\.[^.]+$/, '')

  const addScore = (candidate: string, score: number): void => {
    if (!candidate || candidate === filePath) return
    scoreMap.set(candidate, (scoreMap.get(candidate) ?? 0) + score)
  }

  for (const commit of timeline) {
    if (!commit.changed_files.includes(filePath)) continue
    for (const changed of commit.changed_files) {
      addScore(changed, 3)
    }
  }

  for (const tracked of trackedFiles) {
    if (tracked === filePath) continue
    const trackedNorm = tracked.replace(/\\/g, '/')
    if (path.posix.dirname(trackedNorm) === fileDir) addScore(trackedNorm, 2)
    if (basename(trackedNorm).includes(fileStem) || fileStem.includes(basename(trackedNorm).replace(/\.[^.]+$/, ''))) {
      addScore(trackedNorm, 1)
    }
  }

  return Array.from(scoreMap.entries())
    .map(([candidatePath, score]) => ({ path: candidatePath, score }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, 12)
}

const DELETE_PATH_PATTERNS = [
  /(^|\/)\.DS_Store$/i,
  /(^|\/)Thumbs\.db$/i,
  /(^|\/)__pycache__(\/|$)/i,
  /(^|\/)\.pytest_cache(\/|$)/i,
  /(^|\/)\.mypy_cache(\/|$)/i,
  /(^|\/)\.ruff_cache(\/|$)/i,
  /(^|\/)\.venv(\/|$)/i,
  /(^|\/)venv(\/|$)/i,
  /(^|\/)env(\/|$)/i,
  /(^|\/)node_modules(\/|$)/i,
  /(^|\/)dist(\/|$)/i,
  /(^|\/)build(\/|$)/i,
  /(^|\/)coverage(\/|$)/i,
  /(^|\/)\.cache(\/|$)/i,
  /(^|\/)\.idea(\/|$)/i,
  /(^|\/)\.vscode\/.*\.log$/i
]

const DELETE_EXTENSIONS = new Set([
  '.log',
  '.tmp',
  '.temp',
  '.swp',
  '.swo',
  '.pyc',
  '.pyo',
  '.class',
  '.o'
])

const COMMIT_PATH_HINTS = [
  /(^|\/)src(\/|$)/i,
  /(^|\/)app(\/|$)/i,
  /(^|\/)api(\/|$)/i,
  /(^|\/)server(\/|$)/i,
  /(^|\/)client(\/|$)/i,
  /(^|\/)tests?(\/|$)/i,
  /(^|\/)docs?(\/|$)/i,
  /(^|\/)migrations?(\/|$)/i,
  /(^|\/)alembic(\/|$)/i,
  /(^|\/)\.github(\/|$)/i
]

const COMMIT_EXTENSIONS = new Set([
  '.py',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.ini',
  '.md',
  '.sql',
  '.html',
  '.css',
  '.scss',
  '.env.example'
])

interface UntrackedContext {
  path: string
  kind: 'file' | 'dir'
  size: number
  snippet?: string
  entries?: string[]
}

function normalizeUntrackedPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+$/, '')
}

function inferByRule(filePath: string): UntrackedReviewItem | null {
  const normalized = normalizeUntrackedPath(filePath)
  const ext = path.extname(normalized).toLowerCase()

  for (const pattern of DELETE_PATH_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        path: normalized,
        recommendation: 'delete',
        reason: 'Generated/cache/system artifact. Usually not needed in commits.',
        confidence: 0.98
      }
    }
  }

  if (normalized.endsWith('.env') || normalized.includes('/.env.')) {
    return {
      path: normalized,
      recommendation: 'delete',
      reason: 'Looks like local environment secrets/config. Keep out of repository.',
      confidence: 0.95
    }
  }

  if (DELETE_EXTENSIONS.has(ext)) {
    return {
      path: normalized,
      recommendation: 'delete',
      reason: 'Temporary or compiled artifact file type.',
      confidence: 0.92
    }
  }

  if (
    normalized.endsWith('package-lock.json') ||
    normalized.endsWith('pnpm-lock.yaml') ||
    normalized.endsWith('yarn.lock')
  ) {
    return {
      path: normalized,
      recommendation: 'commit',
      reason: 'Dependency lockfile should usually be committed for reproducible installs.',
      confidence: 0.9
    }
  }

  for (const pattern of COMMIT_PATH_HINTS) {
    if (pattern.test(normalized)) {
      return {
        path: normalized,
        recommendation: 'commit',
        reason: 'Located in a source/config/docs area typically tracked in commits.',
        confidence: 0.82
      }
    }
  }

  if (COMMIT_EXTENSIONS.has(ext) || normalized.endsWith('.env.example')) {
    return {
      path: normalized,
      recommendation: 'commit',
      reason: 'Source/config/documentation file type that is usually versioned.',
      confidence: 0.76
    }
  }

  return null
}

function isLikelyTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase()
  if (!ext) return true
  return [
    '.py', '.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml', '.toml', '.ini',
    '.md', '.txt', '.sql', '.html', '.css', '.scss', '.xml', '.sh', '.env', '.cfg'
  ].includes(ext)
}

async function buildUntrackedContexts(projectRoot: string, paths: string[]): Promise<UntrackedContext[]> {
  const contexts: UntrackedContext[] = []
  for (let i = 0; i < paths.length; i += 1) {
    const filePath = paths[i]
    const normalized = normalizeUntrackedPath(filePath)
    let absolute = ''
    try {
      absolute = toSafeAbsolutePath(projectRoot, normalized)
    } catch {
      continue
    }

    try {
      const st = await stat(absolute)
      if (st.isDirectory()) {
        const entries = await readdir(absolute).catch(() => [])
        contexts.push({
          path: normalized,
          kind: 'dir',
          size: st.size,
          entries: entries.slice(0, 8)
        })
        continue
      }

      let snippet = ''
      if (
        i < UNTRACKED_AI_MAX_SNIPPET_FILES &&
        isLikelyTextFile(normalized) &&
        st.size <= UNTRACKED_AI_SNIPPET_MAX_BYTES
      ) {
        snippet = toTextSnippet(await readFile(absolute, 'utf8').catch(() => ''), 900)
      }
      contexts.push({
        path: normalized,
        kind: 'file',
        size: st.size,
        snippet
      })
    } catch {
      contexts.push({
        path: normalized,
        kind: 'file',
        size: 0
      })
    }
  }
  return contexts
}

function getUntrackedReviewTimeoutMs(itemCount: number): number {
  const timeout = UNTRACKED_AI_TIMEOUT_BASE_MS + itemCount * UNTRACKED_AI_TIMEOUT_PER_FILE_MS
  return Math.min(timeout, UNTRACKED_AI_TIMEOUT_MAX_MS)
}

function resolveCommit(commits: TimelineCommitInfo[], suggestedHash?: string): TimelineCommitInfo | null {
  const hash = suggestedHash?.trim()
  if (!hash) return null
  return (
    commits.find((c) => c.hash === hash) ??
    commits.find((c) => c.hash.startsWith(hash)) ??
    commits.find((c) => c.short_hash === hash) ??
    null
  )
}

function getConnectedAiConfig(): { provider: AiProviderName; apiKey: string; model: string } {
  const connectionState = getAiConnectionState()
  const apiKey = getAiApiKey()

  if (!connectionState.provider || !connectionState.selected_model || !apiKey) {
    throw new Error('Connect AI to use this analysis feature.')
  }

  if (!aiService.supportsManualTools(connectionState.provider)) {
    throw new Error('The current AI connection does not support this analysis feature.')
  }

  return {
    provider: connectionState.provider,
    apiKey,
    model: connectionState.selected_model
  }
}

export function registerAiHandlers(): void {
  ipcMain.handle('ai:connection:get', () => {
    return getAiConnectionState()
  })

  ipcMain.handle('ai:connection:connect', async (_event, provider: AiProviderName, apiKey: string) => {
    const connectionState = await aiService.connectProvider({ provider, apiKey })

    setAiApiKey(apiKey)
    setAiConnectionState(connectionState)

    return getAiConnectionState()
  })

  ipcMain.handle('ai:connection:disconnect', () => {
    clearAiApiKey()
    clearAiConnectionState()
    return getAiConnectionState()
  })

  ipcMain.handle('ai:connection:model:set', (_event, model: string) => {
    const currentState = getAiConnectionState()

    if (!currentState.provider) {
      return currentState
    }

    setAiConnectionState({
      ...currentState,
      selected_model: model
    })

    return getAiConnectionState()
  })

  ipcMain.handle('ai:project-settings:get', (_event, project_id: string) => {
    return getProjectAiSettings(project_id)
  })

  ipcMain.handle(
    'ai:project-settings:set',
    (_event, project_id: string, patch: Partial<ProjectAiSettings>) => {
      const currentSettings = getProjectAiSettings(project_id)
      const nextSettings: ProjectAiSettings = {
        ...currentSettings,
        ...patch
      }

      if (
        patch.ai_diff_consent_granted === true &&
        !currentSettings.ai_diff_consent_granted &&
        patch.ai_diff_consent_granted_at === undefined
      ) {
        nextSettings.ai_diff_consent_granted_at = Date.now()
      }

      if (patch.ai_diff_consent_granted === false) {
        nextSettings.ai_diff_consent_granted_at = null
      }

      setProjectAiSettings(project_id, nextSettings)
      return getProjectAiSettings(project_id)
    }
  )

  ipcMain.handle('ai:auto-save-message:generate', async (_event, project_id: string) => {
    const connectionState = getAiConnectionState()
    const projectSettings = getProjectAiSettings(project_id)
    const apiKey = getAiApiKey()

    if (!connectionState.provider || !connectionState.selected_model || !apiKey) {
      return null
    }

    if (!projectSettings.auto_save_message_enabled || !projectSettings.ai_diff_consent_granted) {
      return null
    }

    const gitService = getGitService(project_id)
    const diffContext = await gitService.getStagedDiffContext()

    if (!diffContext.diff.trim()) {
      return null
    }

    return aiService.generateAutoSaveMessage({
      provider: connectionState.provider,
      model: connectionState.selected_model,
      apiKey,
      diffContext
    })
  })

  ipcMain.handle('ai:commit-suggestion', async (_event, project_id: string) => {
    const diff = await getGitService(project_id).getStagedDiff()
    if (!diff.trim()) {
      throw new Error('There are no staged changes to summarize.')
    }
    return generateCommitSuggestion(diff)
  })

  ipcMain.handle('ai:undo:suggest', async (_event, project_id: string, query: string) => {
    if (!query?.trim()) {
      throw new Error('Please describe the point in time you want to restore to.')
    }

    const aiConfig = getConnectedAiConfig()

    const service = getGitService(project_id)
    const timeline = await service.getTimeline(120)
    if (timeline.length === 0) {
      throw new Error('No commit history is available for restoration.')
    }

    const suggestion = await manualToolService.generateNaturalUndoSuggestion({
      provider: aiConfig.provider,
      model: aiConfig.model,
      apiKey: aiConfig.apiKey,
      query: query.trim(),
      timeline
    })
    const target = resolveCommit(timeline, suggestion.commitHash)

    if (!target) {
      throw new Error('Could not identify a commit for this request. Please be more specific.')
    }

    const preview = await service.getRestorePreview(target.hash)
    const eventSummary = summarizeCommitEvent(target)
    const proposalText = `Restore to this point (${formatCommitDate(target.date)}: ${eventSummary})?`

    return {
      query: query.trim(),
      commit_hash: target.hash,
      short_hash: target.short_hash,
      commit_message: target.message,
      commit_date: target.date,
      reason: suggestion.reason,
      confidence: suggestion.confidence,
      total_restore_files: preview.files_to_restore.length,
      total_remove_files: preview.files_to_remove.length,
      restore_files_preview: preview.files_to_restore.slice(0, 6),
      remove_files_preview: preview.files_to_remove.slice(0, 6),
      proposal_text: proposalText
    }
  })

  ipcMain.handle('ai:file:insight', async (_event, project_id: string, file_path: string) => {
    const normalizedPath = (file_path ?? '').replace(/\\/g, '/').trim()
    if (!normalizedPath) {
      throw new Error('Please select a file first.')
    }

    const aiConfig = getConnectedAiConfig()

    const service = getGitService(project_id)
    const [timeline, trackedFiles] = await Promise.all([
      service.getTimeline(260),
      service.listTrackedFiles()
    ])

    const projectRoot = getProjectPath(project_id)
    const absolutePath = toSafeAbsolutePath(projectRoot, normalizedPath)
    let rawContent = ''
    try {
      rawContent = await readFile(absolutePath, 'utf8')
    } catch {
      throw new Error('Could not read this file for analysis.')
    }

    const relatedCandidates = buildRelatedCandidates(normalizedPath, trackedFiles, timeline)
    const recentCommits = timeline
      .filter((c) => c.changed_files.includes(normalizedPath))
      .slice(0, 8)
      .map((c) => ({ date: c.date, message: c.message }))

    const insight = await manualToolService.generateFileInsight({
      provider: aiConfig.provider,
      model: aiConfig.model,
      apiKey: aiConfig.apiKey,
      filePath: normalizedPath,
      contentSnippet: toTextSnippet(rawContent),
      recentCommits: recentCommits,
      relatedCandidates: relatedCandidates
    })

    return {
      file_path: normalizedPath,
      summary: insight.summary,
      functionality: insight.functionality,
      related_files: insight.relatedFiles
    }
  })

  ipcMain.handle('ai:untracked:review', async (_event, project_id: string) => {
    const aiConfig = getConnectedAiConfig()

    const service = getGitService(project_id)
    const status = await service.getStatus()
    const untrackedPaths = Array.from(
      new Set(
        status.files
          .filter((f) => f.status === 'untracked')
          .map((f) => normalizeUntrackedPath(f.path))
          .filter(Boolean)
      )
    ).sort()

    if (untrackedPaths.length === 0) {
      return {
        items: [] as UntrackedReviewItem[],
        total_untracked: 0,
        commit_count: 0,
        delete_count: 0
      }
    }

    const ruleDecisions = new Map<string, UntrackedReviewItem>()
    const unresolved: string[] = []
    for (const filePath of untrackedPaths) {
      const rule = inferByRule(filePath)
      if (rule) ruleDecisions.set(filePath, rule)
      else unresolved.push(filePath)
    }

    let aiDecisions = new Map<string, UntrackedReviewItem>()
    let aiFallbackReason: string | null = null
    if (unresolved.length > 0) {
      const projectRoot = getProjectPath(project_id)
      const aiInputPaths = unresolved.slice(0, UNTRACKED_AI_MAX_CONTEXT_FILES)
      if (aiInputPaths.length > 0) {
        const contexts = await buildUntrackedContexts(projectRoot, aiInputPaths)
        try {
          const timeoutMs = getUntrackedReviewTimeoutMs(contexts.length)
          const review = await manualToolService.reviewUntrackedFiles({
            provider: aiConfig.provider,
            model: aiConfig.model,
            apiKey: aiConfig.apiKey,
            contexts,
            timeoutMs
          })
          const unresolvedSet = new Set(aiInputPaths)
          aiDecisions = new Map(
            review.items
              .map((item) =>
                unresolvedSet.has(item.path) ? ([item.path, item] as const) : null
              )
              .filter((entry): entry is readonly [string, UntrackedReviewItem] => entry !== null)
          )
        } catch {
          aiFallbackReason =
            'AI analysis timed out before completing all files; fallback guidance is shown for unresolved items.'
        }
      }
    }

    const items = untrackedPaths.map((filePath) => {
      return (
        ruleDecisions.get(filePath) ??
        aiDecisions.get(filePath) ?? {
          path: filePath,
          recommendation: 'commit' as const,
          reason:
            aiFallbackReason ??
            'No strong generated-file signal found, so keep for manual review.',
          confidence: aiFallbackReason ? 0.35 : 0.4
        }
      )
    })

    return {
      items,
      total_untracked: items.length,
      commit_count: items.filter((i) => i.recommendation === 'commit').length,
      delete_count: items.filter((i) => i.recommendation === 'delete').length
    }
  })
}
