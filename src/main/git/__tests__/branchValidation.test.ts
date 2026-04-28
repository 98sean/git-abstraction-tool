import { describe, expect, it, vi } from 'vitest'
import { GitService, validateBranchName } from '../service'

describe('branch name validation', () => {
  it('rejects branch names with spaces', () => {
    expect(validateBranchName('test and fix')).toEqual({
      ok: false,
      message: 'Branch names cannot contain spaces.'
    })
  })

  it('accepts slash-separated work branches', () => {
    expect(validateBranchName('tony/test-upload')).toEqual({
      ok: true,
      message: null
    })
  })

  it('rejects invalid branch creation before invoking git', async () => {
    const git = {
      checkoutLocalBranch: vi.fn()
    }
    const service = new GitService('/tmp/project', git as never)

    await expect(service.createBranch('test and fix')).rejects.toMatchObject({
      code: 'INVALID_BRANCH_NAME',
      message: 'Branch names cannot contain spaces.'
    })
    expect(git.checkoutLocalBranch).not.toHaveBeenCalled()
  })
})
