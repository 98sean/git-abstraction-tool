import Store from 'electron-store'

/**
 * One cached weekly AI summary. `commit_signature` is a hash of the week's
 * commit list (hashes joined in order); as long as the week's git history
 * hasn't changed, the cached summary is valid. `model` + `ai_summary_count`
 * are stored so we can also invalidate if the user swapped models or wrote
 * new per-commit AI summaries in the window.
 */
export interface WeeklySummaryCacheEntry {
  project_id: string
  start_date: string
  end_date: string
  commit_signature: string
  model: string
  ai_summary_count: number
  summary: string
  highlights: string[]
  commit_count: number
  stats: {
    totalCommits: number
    filesAdded: number
    filesModified: number
    filesDeleted: number
    linesAdded: number
    linesRemoved: number
    activeDays: number
  }
  created_at: number
}

interface WeeklySummaryCacheSchema {
  entries: WeeklySummaryCacheEntry[]
}

const MAX_ENTRIES = 200

const store = new Store<WeeklySummaryCacheSchema>({
  name: 'weekly-summary-cache',
  defaults: { entries: [] }
})

function keyOf(entry: {
  project_id: string
  start_date: string
  end_date: string
}): string {
  return `${entry.project_id}|${entry.start_date}|${entry.end_date}`
}

/**
 * Look up a cached entry for one project + week. Returns undefined when no
 * entry exists yet, or when the caller's current `commit_signature` / `model`
 * / `ai_summary_count` don't match what was cached (i.e. the week's content
 * changed — we should regenerate).
 */
export function getCachedWeeklySummary(params: {
  project_id: string
  start_date: string
  end_date: string
  commit_signature: string
  model: string
  ai_summary_count: number
}): WeeklySummaryCacheEntry | undefined {
  const targetKey = keyOf(params)
  const entries = store.get('entries')
  const found = entries.find((e) => keyOf(e) === targetKey)
  if (!found) return undefined
  if (
    found.commit_signature !== params.commit_signature ||
    found.model !== params.model ||
    found.ai_summary_count !== params.ai_summary_count
  ) {
    return undefined
  }
  return found
}

/**
 * Insert or replace the cache entry for (project_id, start_date, end_date).
 * Evicts the oldest entries if the cache grows unbounded.
 */
export function setCachedWeeklySummary(entry: WeeklySummaryCacheEntry): void {
  const targetKey = keyOf(entry)
  const entries = store.get('entries').filter((e) => keyOf(e) !== targetKey)
  entries.push(entry)
  entries.sort((a, b) => b.created_at - a.created_at)
  store.set('entries', entries.slice(0, MAX_ENTRIES))
}

/** Wipe every cached week for a project (useful when the project is deleted). */
export function clearWeeklySummaryCacheForProject(project_id: string): void {
  const entries = store.get('entries').filter((e) => e.project_id !== project_id)
  store.set('entries', entries)
}
