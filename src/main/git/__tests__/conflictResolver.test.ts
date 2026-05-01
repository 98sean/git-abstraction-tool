import { describe, expect, it, vi } from 'vitest'
import { GitService } from '../service'

function makeGit(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    status: vi.fn().mockResolvedValue({ current: 'main', files: [], ahead: 0, behind: 0, tracking: null }),
    raw: vi.fn().mockResolvedValue(''),
    add: vi.fn().mockResolvedValue(''),
    ...overrides
  }
}

describe('GitService.resolveConflict', () => {
  it('runs checkout --ours then git add for the ours strategy', async () => {
    const git = makeGit()
    const service = new GitService('/tmp/project', git as never)

    await service.resolveConflict('src/foo.ts', 'ours')

    expect(git.raw).toHaveBeenCalledWith(['checkout', '--ours', '--', 'src/foo.ts'])
    expect(git.add).toHaveBeenCalledWith('src/foo.ts')
  })

  it('runs checkout --theirs then git add for the theirs strategy', async () => {
    const git = makeGit()
    const service = new GitService('/tmp/project', git as never)

    await service.resolveConflict('src/bar.ts', 'theirs')

    expect(git.raw).toHaveBeenCalledWith(['checkout', '--theirs', '--', 'src/bar.ts'])
    expect(git.add).toHaveBeenCalledWith('src/bar.ts')
  })

  it('throws a mapped GitError when checkout fails', async () => {
    const git = makeGit({
      raw: vi.fn().mockRejectedValue({ message: 'fatal: not a git repository' })
    })
    const service = new GitService('/tmp/project', git as never)

    await expect(service.resolveConflict('src/foo.ts', 'ours')).rejects.toMatchObject({
      code: 'NOT_A_REPO'
    })
  })

  it('throws a mapped GitError when git add fails', async () => {
    const git = makeGit({
      add: vi.fn().mockRejectedValue({ message: 'error: please commit or stash your changes' })
    })
    const service = new GitService('/tmp/project', git as never)

    await expect(service.resolveConflict('src/foo.ts', 'ours')).rejects.toMatchObject({
      code: 'UNCOMMITTED_CHANGES'
    })
  })
})

describe('GitService.abortMerge', () => {
  it('runs git merge --abort', async () => {
    const git = makeGit()
    const service = new GitService('/tmp/project', git as never)

    await service.abortMerge()

    expect(git.raw).toHaveBeenCalledWith(['merge', '--abort'])
  })

  it('throws a mapped GitError when abort fails', async () => {
    const git = makeGit({
      raw: vi.fn().mockRejectedValue({ message: 'fatal: could not resolve host: github.com' })
    })
    const service = new GitService('/tmp/project', git as never)

    await expect(service.abortMerge()).rejects.toMatchObject({
      code: 'NETWORK_ERROR'
    })
  })
})
