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
