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

// ─── Errors ──────────────────────────────────────────────────────────────────

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
  message: string  // user-friendly; safe to show in the UI
  raw?: string     // original git stderr — for logging only, never shown to user
}
