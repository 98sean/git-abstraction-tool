import { describe, expect, it } from 'vitest'
import { mapGitError } from '../errors'

describe('mapGitError', () => {
  it('detects NOT_A_REPO from git message', () => {
    const err = mapGitError({ message: 'fatal: not a git repository' })
    expect(err.code).toBe('NOT_A_REPO')
    expect(err.message).toContain('folder')
    expect(err.raw).toBeDefined()
  })

  it('detects AUTH_FAILED from authentication message', () => {
    const err = mapGitError({ message: 'remote: authentication failed' })
    expect(err.code).toBe('AUTH_FAILED')
    expect(err.message).toContain('credentials')
  })

  it('detects NETWORK_ERROR from resolve host message', () => {
    const err = mapGitError({ message: 'fatal: could not resolve host: github.com' })
    expect(err.code).toBe('NETWORK_ERROR')
    expect(err.message).toContain('internet')
  })

  it('detects MERGE_CONFLICT', () => {
    const err = mapGitError({ message: 'error: automatic merge failed; fix conflicts' })
    expect(err.code).toBe('MERGE_CONFLICT')
  })

  it('detects UNCOMMITTED_CHANGES', () => {
    const err = mapGitError({ message: 'error: please commit or stash your changes' })
    expect(err.code).toBe('UNCOMMITTED_CHANGES')
    expect(err.message).toContain('save')
  })

  it('detects NOTHING_TO_COMMIT', () => {
    const err = mapGitError({ message: 'nothing to commit, working tree clean' })
    expect(err.code).toBe('NOTHING_TO_COMMIT')
  })

  it('falls back to UNKNOWN for unrecognised errors', () => {
    const err = mapGitError({ message: 'some completely unrecognised git error message' })
    expect(err.code).toBe('UNKNOWN')
    expect(err.message).toContain('try again')
  })

  it('handles non-object errors gracefully', () => {
    const err = mapGitError('not a git repository')
    expect(err.code).toBe('NOT_A_REPO')
  })

  it('preserves raw message for logging', () => {
    const raw = 'fatal: not a git repository (or any of the parent directories): .git'
    const err = mapGitError({ message: raw })
    expect(err.raw).toBe(raw)
  })
})
