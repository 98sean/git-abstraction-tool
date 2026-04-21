export type FileStatusCode =
  | 'new'         // untracked or added (A)
  | 'modified'    // modified (M)
  | 'deleted'     // deleted (D)
  | 'renamed'     // renamed (R)
  | 'conflicted'  // merge conflict (U / AA / DD etc.)
  | 'untracked'   // untracked (??)

export interface FileStatus {
  path: string
  status: FileStatusCode
  staged: boolean
  oldPath?: string  // populated for renames
}

export interface GitStatus {
  current_branch: string
  files: FileStatus[]
  tracked_files: string[]  // all files tracked by git (from ls-files)
  ahead: number   // commits ahead of remote
  behind: number  // commits behind remote
  has_conflicts: boolean
  is_clean: boolean
}

export interface CommitInfo {
  hash: string
  short_hash: string
  message: string
  author_name: string
  author_email: string
  date: string  // ISO 8601
}

export interface TimelineCommitInfo {
  hash: string
  short_hash: string
  message: string
  date: string
  changed_files: string[]
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

export interface BranchInfo {
  name: string
  current: boolean
  remote?: string
}

export interface BranchCreateResult {
  name: string
  published: boolean
  remote_name: string | null
  publish_error: string | null
}

export interface BranchDeleteResult {
  name: string
  current_branch: string
  local_deleted: boolean
  remote_name: string | null
  remote_deleted: boolean
  remote_delete_error: string | null
}

export interface BranchMergeResult {
  source_branch: string
  target_branch: string
}

export type CollaborationBranchMode = 'new_branch' | 'existing_branch' | 'danger_default_branch'

export interface PushToCloudOptions {
  dangerConfirmed?: boolean
}

export interface PushBackupTargetInput {
  mode: 'backup'
  remoteName: string
  repoOwner: string
  repoName: string
  token?: string
}

export interface PushCollaborationTargetInput {
  mode: 'collaboration'
  remoteName: string
  branchMode: CollaborationBranchMode
  branchName: string
  dangerConfirmed?: boolean
  token?: string
}

export type PushConfiguredTargetInput = PushBackupTargetInput | PushCollaborationTargetInput

export interface PushConfiguredTargetResult {
  remoteName: string
  branchName: string
  prUrl: string | null
}

export interface PullConfiguredTargetInput {
  remoteName: string
  branchName: string
  token?: string
}

export interface IncomingCommitInfo {
  hash: string
  short_hash: string
  message: string
  author_name: string
  date: string
}

export interface PullUpdatesPreview {
  remote_name: string
  branch_name: string
  current_branch: string
  behind_count: number
  latest_remote_hash: string
  commits: IncomingCommitInfo[]
}

export interface StagedDiffContext {
  diff: string
  files: Array<{ path: string; status: FileStatusCode }>
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export type GitErrorCode =
  | 'NOT_A_REPO'
  | 'NO_REMOTE'
  | 'DEFAULT_BRANCH_PROTECTED'
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
  message: string  // user-friendly; safe to show in the UI
  raw?: string     // original git stderr — for logging only, never shown to user
}
