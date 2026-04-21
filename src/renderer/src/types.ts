// Mirrors src/main/git/types.ts — kept in sync manually

export type FileStatusCode =
  | 'new'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'conflicted'
  | 'untracked'

export interface FileStatus {
  path: string
  status: FileStatusCode
  staged: boolean
  oldPath?: string
}

export interface GitStatus {
  current_branch: string
  files: FileStatus[]
  tracked_files: string[]
  ahead: number
  behind: number
  has_conflicts: boolean
  is_clean: boolean
}

export interface CommitInfo {
  hash: string
  short_hash: string
  message: string
  author_name: string
  author_email: string
  date: string
}

export interface TimelineCommitInfo {
  hash: string
  short_hash: string
  message: string
  date: string
  changed_files: string[]
}

export interface BranchInfo {
  name: string
  current: boolean
  remote?: string
}

export interface RestoreResult {
  backup_branch: string
  restored_files: number
  removed_files: number
}

export interface RestorePreview {
  files_to_restore: string[]
  files_to_remove: string[]
}

export interface UntrackedDeleteResult {
  deleted: number
  failed: string[]
}

export interface NaturalUndoSuggestion {
  query: string
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

export interface FileInsightRelated {
  path: string
  reason: string
}

export interface FileInsight {
  file_path: string
  summary: string
  functionality: string
  related_files: FileInsightRelated[]
}

export type UntrackedRecommendation = 'commit' | 'delete'

export interface UntrackedReviewItem {
  path: string
  recommendation: UntrackedRecommendation
  reason: string
  confidence: number
}

export interface UntrackedReviewResult {
  items: UntrackedReviewItem[]
  total_untracked: number
  commit_count: number
  delete_count: number
}

export type GitErrorCode =
  | 'NOT_A_REPO'
  | 'NO_REMOTE'
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'MERGE_CONFLICT'
  | 'UNCOMMITTED_CHANGES'
  | 'BRANCH_EXISTS'
  | 'BRANCH_NOT_FOUND'
  | 'NOTHING_TO_COMMIT'
  | 'UNKNOWN'

export interface GitError {
  code: GitErrorCode
  message: string
  raw?: string
}

export interface Project {
  project_id: string
  local_path: string
  friendly_name: string
  last_accessed: number
}

export interface Preferences {
  theme: 'light' | 'dark'
  mode: 'newbie' | 'pro'
  auto_save_enabled: boolean
  default_save_message_template: string
}

export type AiCommitChangeKind =
  | 'feature'
  | 'fix'
  | 'content'
  | 'style'
  | 'config'
  | 'refactor'
  | 'chore'
  | 'mixed'

export interface AiCommitSuggestion {
  message: string
  summary: string
  change_kind: AiCommitChangeKind
  user_visible: boolean
  areas: string[]
  keywords: string[]
  fingerprint: string
  model: string
}

export interface CommitAiMetadata extends AiCommitSuggestion {}

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}
