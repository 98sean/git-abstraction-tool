import { GitError, GitErrorCode } from './types'

interface RawError {
  message?: string
  git?: { raw?: string }
}

function detectCode(raw: string): GitErrorCode {
  const r = raw.toLowerCase()
  if (r.includes('not a git repository')) return 'NOT_A_REPO'
  if (r.includes('no remote') || r.includes("doesn't have a remote")) return 'NO_REMOTE'
  if (
    r.includes('authentication failed') ||
    r.includes('could not read username') ||
    r.includes('permission denied')
  )
    return 'AUTH_FAILED'
  if (r.includes('have diverged') || r.includes('diverged')) return 'BRANCH_DIVERGED'
  if (
    r.includes('non-fast-forward') ||
    r.includes('fetch first') ||
    r.includes('remote contains work') ||
    r.includes('updates were rejected')
  )
    return 'REMOTE_AHEAD'
  if (
    r.includes('could not resolve host') ||
    r.includes('network is unreachable') ||
    r.includes('connection timed out') ||
    r.includes('unable to connect')
  )
    return 'NETWORK_ERROR'
  if (r.includes('merge conflict') || r.includes('automatic merge failed'))
    return 'MERGE_CONFLICT'
  if (r.includes('please commit or stash')) return 'UNCOMMITTED_CHANGES'
  if (r.includes('invalid branch name')) return 'INVALID_BRANCH_NAME'
  if (r.includes('already exists') && r.includes('branch')) return 'BRANCH_EXISTS'
  if (r.includes('did not match any') || r.includes('unknown revision'))
    return 'BRANCH_NOT_FOUND'
  if (r.includes('nothing to commit')) return 'NOTHING_TO_COMMIT'
  return 'UNKNOWN'
}

const USER_MESSAGES: Record<GitErrorCode, string> = {
  NOT_A_REPO: 'This folder is not a linked project. Please re-link it.',
  NO_REMOTE: 'No cloud destination is set up for this project.',
  DEFAULT_BRANCH_PROTECTED: 'Default branch upload requires danger-mode confirmation.',
  AUTH_FAILED: 'Login failed. Please check your credentials in Settings.',
  NETWORK_ERROR: 'Could not reach the cloud. Please check your internet connection.',
  MERGE_CONFLICT: 'There is a version mismatch that needs to be resolved before continuing.',
  UNCOMMITTED_CHANGES: 'Please save your current changes before switching.',
  REMOTE_AHEAD:
    'The cloud branch has newer work. Get updates first or upload to a new branch; this app will not force push.',
  BRANCH_DIVERGED:
    'Your branch and the cloud branch both changed. Get updates first, resolve the mismatch, or upload to a new branch; this app will not force push.',
  INVALID_BRANCH_NAME: 'Choose a valid branch name before continuing.',
  BRANCH_EXISTS: 'A version with that name already exists.',
  BRANCH_NOT_FOUND: 'The requested version could not be found.',
  NOTHING_TO_COMMIT: 'There are no changes to save.',
  RESTORE_NO_CHANGES: 'That restore point already matches your current files.',
  UNKNOWN: 'Something went wrong. Please try again.'
}

export function mapGitError(err: unknown): GitError {
  const raw =
    (err as RawError)?.git?.raw ??
    (err as RawError)?.message ??
    String(err)

  const code = detectCode(raw)
  return {
    code,
    message: USER_MESSAGES[code],
    raw
  }
}
