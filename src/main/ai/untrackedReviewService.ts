import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import {
  ReviewUntrackedFilesInput,
  UntrackedContext,
  UntrackedReviewItem
} from './manualToolTypes'
import { AiOutputLanguage, AiProviderName } from './types'
import { isGitInternalArtifact } from './fileInsightService'
import { GitStatus } from '../git/types'

interface UntrackedReviewGitService {
  getStatus(): Promise<GitStatus>
}

interface UntrackedReviewManualToolService {
  reviewUntrackedFiles(input: ReviewUntrackedFilesInput): Promise<{ items: UntrackedReviewItem[] }>
}

interface ReviewUntrackedFilesServiceInput {
  projectRoot: string
  aiConfig: {
    provider: AiProviderName
    model: string
    apiKey: string
  }
  outputLanguage?: AiOutputLanguage
  gitService: UntrackedReviewGitService
  manualToolService: UntrackedReviewManualToolService
}

interface UntrackedReviewOutput {
  items: UntrackedReviewItem[]
  total_untracked: number
  commit_count: number
  delete_count: number
}

const UNTRACKED_AI_MAX_CONTEXT_FILES = 100
const UNTRACKED_AI_MAX_SNIPPET_FILES = 16
const UNTRACKED_AI_SNIPPET_MAX_BYTES = 100_000
const UNTRACKED_AI_TIMEOUT_BASE_MS = 12_000
const UNTRACKED_AI_TIMEOUT_PER_FILE_MS = 220
const UNTRACKED_AI_TIMEOUT_MAX_MS = 45_000

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

function normalizeUntrackedPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+$/, '')
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

function inferByRule(filePath: string): UntrackedReviewItem | null {
  const normalized = normalizeUntrackedPath(filePath)
  const ext = path.extname(normalized).toLowerCase()

  if (isGitInternalArtifact(normalized)) {
    return {
      path: normalized,
      recommendation: 'delete',
      reason: 'Looks like an embedded Git repository artifact, not project source.',
      confidence: 0.99
    }
  }

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
    '.txt',
    '.sql',
    '.html',
    '.css',
    '.scss',
    '.xml',
    '.sh',
    '.env',
    '.cfg'
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

export async function reviewUntrackedFiles({
  projectRoot,
  aiConfig,
  outputLanguage = 'en',
  gitService,
  manualToolService
}: ReviewUntrackedFilesServiceInput): Promise<UntrackedReviewOutput> {
  const status = await gitService.getStatus()
  const untrackedPaths = Array.from(
    new Set(
      status.files
        .filter((file) => file.status === 'untracked')
        .map((file) => normalizeUntrackedPath(file.path))
        .filter(Boolean)
    )
  ).sort()

  if (untrackedPaths.length === 0) {
    return {
      items: [],
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
    const aiInputPaths = unresolved.slice(0, UNTRACKED_AI_MAX_CONTEXT_FILES)
    if (aiInputPaths.length > 0) {
      const contexts = await buildUntrackedContexts(projectRoot, aiInputPaths)
      if (contexts.length > 0) {
        try {
          const timeoutMs = getUntrackedReviewTimeoutMs(contexts.length)
          const review = await manualToolService.reviewUntrackedFiles({
            provider: aiConfig.provider,
            model: aiConfig.model,
            apiKey: aiConfig.apiKey,
            outputLanguage,
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
  }

  const items = untrackedPaths.map((filePath) => {
    return (
      ruleDecisions.get(filePath) ??
      aiDecisions.get(filePath) ?? {
        path: filePath,
        recommendation: 'commit' as const,
        reason:
          aiFallbackReason ?? 'No strong generated-file signal found, so keep for manual review.',
        confidence: aiFallbackReason ? 0.35 : 0.4
      }
    )
  })

  return {
    items,
    total_untracked: items.length,
    commit_count: items.filter((item) => item.recommendation === 'commit').length,
    delete_count: items.filter((item) => item.recommendation === 'delete').length
  }
}
