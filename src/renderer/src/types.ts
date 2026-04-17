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

export interface BranchInfo {
  name: string
  current: boolean
  remote?: string
}

export type CollaborationBranchMode = 'new_branch' | 'existing_branch' | 'danger_default_branch'
export type CloudSetupIntent = 'backup' | 'collaboration'

export interface PushToCloudOptions {
  dangerConfirmed?: boolean
}

export interface PushConfiguredTargetResult {
  remoteName: string
  branchName: string
  prUrl: string | null
}

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
  message: string
  raw?: string
}

export interface Project {
  project_id: string
  local_path: string
  friendly_name: string
  last_accessed: number
}

export type AiProvider = 'openai' | 'anthropic'
export type AiConnectionStatus = 'connected' | 'invalid' | 'disconnected'

export interface AiConnectionState {
  provider: AiProvider | null
  selected_model: string | null
  available_models: string[]
  last_verified_at: number | null
  connection_status: AiConnectionStatus
}

export interface ValidateAiConnectionResult {
  availableModels: string[]
  selectedModel: string
  verifiedAt: number
}

export interface ProjectAiSettings {
  auto_save_message_enabled: boolean
  ai_diff_consent_granted: boolean
  ai_diff_consent_granted_at: number | null
}

export interface Preferences {
  theme: 'light' | 'dark'
  mode: 'newbie' | 'pro'
  auto_save_enabled: boolean
  default_save_message_template: string
}

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

export interface ProjectRemote {
  name: string
  fetch: string
  push: string
}

export type ProjectWarningKind = 'large' | 'binary' | 'sensitive' | 'generated'

export interface ProjectFolderWarning {
  kind: ProjectWarningKind
  path: string
  reason: string
}

export interface ProjectFolderInspection {
  isGitRepo: boolean
  canInitialize: boolean
  remotes: ProjectRemote[]
  warnings: ProjectFolderWarning[]
  recommendedIgnoreEntries: string[]
}

export interface FinalizeProjectLinkInput {
  localPath: string
  friendlyName: string
  shouldInitializeGit: boolean
  ignoreEntries: string[]
}

export interface ProjectCloudTarget {
  mode: 'none' | 'backup' | 'collaboration'
  backup: { remoteName: string; repoOwner: string; repoName: string; private: true } | null
  collaboration: {
    remoteName: string
    branchMode: CollaborationBranchMode
    selectedBranch: string | null
  } | null
}

export interface GithubTokenValidationResult {
  status: 'ok' | 'invalid' | 'missing_repo_access' | 'approval_required'
  accountLogin: string | null
  reason: string | null
}
