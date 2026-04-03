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
  if (r.includes('already exists') && r.includes('branch')) return 'BRANCH_EXISTS'
  if (r.includes('did not match any') || r.includes('unknown revision'))
    return 'BRANCH_NOT_FOUND'
  if (r.includes('nothing to commit')) return 'NOTHING_TO_COMMIT'
  return 'UNKNOWN'
}

const USER_MESSAGES: Record<GitErrorCode, string> = {
  NOT_A_REPO: 'This folder is not a linked project. Please re-link it.',
  NO_REMOTE: 'No cloud destination is set up for this project.',
  AUTH_FAILED: 'Login failed. Please check your credentials in Settings.',
  NETWORK_ERROR: 'Could not reach the cloud. Please check your internet connection.',
  MERGE_CONFLICT: 'There is a version mismatch that needs to be resolved before continuing.',
  UNCOMMITTED_CHANGES: 'Please save your current changes before switching.',
  BRANCH_EXISTS: 'A version with that name already exists.',
  BRANCH_NOT_FOUND: 'The requested version could not be found.',
  NOTHING_TO_COMMIT: 'There are no changes to save.',
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
