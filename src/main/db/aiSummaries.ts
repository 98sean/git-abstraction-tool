import Store from 'electron-store'

export type AiCommitChangeKind =
  | 'feature'
  | 'fix'
  | 'content'
  | 'style'
  | 'config'
  | 'refactor'
  | 'chore'
  | 'mixed'

export interface AiCommitSummary {
  project_id: string
  commit_hash: string
  message: string
  summary: string
  created_at: number
  model: string
  fingerprint: string
  // Optional on the stored record so entries written before these fields existed
  // remain readable. New writes from the current code always populate them.
  change_kind?: AiCommitChangeKind
  user_visible?: boolean
  areas?: string[]
  keywords?: string[]
}

interface AiSummariesSchema {
  summaries: AiCommitSummary[]
}

const store = new Store<AiSummariesSchema>({
  name: 'ai-summaries',
  defaults: { summaries: [] }
})

export function addAiCommitSummary(summary: AiCommitSummary): void {
  const summaries = store.get('summaries')
  const withoutExisting = summaries.filter(
    (entry) =>
      !(entry.project_id === summary.project_id && entry.commit_hash === summary.commit_hash)
  )
  store.set('summaries', [...withoutExisting, summary])
}

export function listAiCommitSummaries(project_id: string): AiCommitSummary[] {
  return store
    .get('summaries')
    .filter((entry) => entry.project_id === project_id)
    .sort((a, b) => b.created_at - a.created_at)
}

/**
 * Return AI summaries whose `created_at` falls inside [startMs, endMs] inclusive.
 * Both bounds are epoch millis. Used by the weekly-report AI summarizer.
 */
export function listAiCommitSummariesInRange(
  project_id: string,
  startMs: number,
  endMs: number
): AiCommitSummary[] {
  return listAiCommitSummaries(project_id).filter(
    (entry) => entry.created_at >= startMs && entry.created_at <= endMs
  )
}

/**
 * Lookup summaries for a specific set of commit hashes within a project.
 * Returns a Map keyed by full commit hash for O(1) joins against git timelines.
 */
export function getAiCommitSummariesByHash(
  project_id: string,
  commitHashes: string[]
): Map<string, AiCommitSummary> {
  const wanted = new Set(commitHashes)
  const out = new Map<string, AiCommitSummary>()
  for (const entry of listAiCommitSummaries(project_id)) {
    if (wanted.has(entry.commit_hash)) {
      out.set(entry.commit_hash, entry)
    }
  }
  return out
}
