import { describe, expect, it, vi } from 'vitest'
import { GitService } from '../service'

describe('safe upload', () => {
  it('pushes backups through the app-managed remote instead of origin', async () => {
    const git = {
      status: vi.fn().mockResolvedValue({
        current: 'main'
      }),
      getRemotes: vi.fn().mockResolvedValue([]),
      raw: vi.fn()
    }

    const service = new GitService('/tmp/project', git as never)
    const result = await service.pushConfiguredTarget({
      mode: 'backup',
      remoteName: 'gat-backup',
      repoOwner: 'tony',
      repoName: 'demo-backup',
      token: 'github_pat_123'
    })

    expect(result.remoteName).toBe('gat-backup')
    expect(git.raw).toHaveBeenCalledWith([
      'remote',
      'add',
      'gat-backup',
      'https://github.com/tony/demo-backup.git'
    ])
    expect(git.raw).toHaveBeenCalledWith([
      'push',
      '-u',
      'https://oauth2:github_pat_123@github.com/tony/demo-backup.git',
      'HEAD'
    ])
  })

  it('creates and pushes a new collaboration branch before returning a PR URL', async () => {
    const git = {
      checkoutLocalBranch: vi.fn(),
      push: vi.fn(),
      getRemotes: vi.fn().mockResolvedValue([
        {
          name: 'origin',
          refs: {
            push: 'https://github.com/tony/demo.git',
            fetch: 'https://github.com/tony/demo.git'
          }
        }
      ])
    }

    const service = new GitService('/tmp/project', git as never)
    const result = await service.pushConfiguredTarget({
      mode: 'collaboration',
      remoteName: 'origin',
      branchMode: 'new_branch',
      branchName: 'gat/update-copy'
    })

    expect(result.branchName).toBe('gat/update-copy')
    expect(result.prUrl).toBe('https://github.com/tony/demo/compare/gat%2Fupdate-copy?expand=1')
    expect(git.checkoutLocalBranch).toHaveBeenCalledWith('gat/update-copy')
    expect(git.push).toHaveBeenCalledWith('origin', 'gat/update-copy', ['-u'])
  })

  it('blocks default branch upload without danger confirmation', async () => {
    const service = new GitService('/tmp/project', {
      push: vi.fn()
    } as never)

    await expect(
      service.pushConfiguredTarget({
        mode: 'collaboration',
        remoteName: 'origin',
        branchMode: 'danger_default_branch',
        branchName: 'main',
        dangerConfirmed: false
      })
    ).rejects.toMatchObject({
      code: 'DEFAULT_BRANCH_PROTECTED'
    })
  })

  it('returns staged diff context for ai prompts', async () => {
    const git = {
      status: vi.fn().mockResolvedValue({
        current: 'main',
        ahead: 0,
        behind: 0,
        isClean: () => false,
        files: [
          { path: 'src/app.ts', index: 'M', working_dir: ' ' },
          { path: 'README.md', index: ' ', working_dir: 'M' }
        ]
      }),
      diff: vi.fn().mockResolvedValue('diff --git a/src/app.ts b/src/app.ts')
    }

    const service = new GitService('/tmp/project', git as never)
    const context = await service.getStagedDiffContext()

    expect(context.diff).toContain('diff --git')
    expect(context.files).toEqual([{ path: 'src/app.ts', status: 'modified' }])
  })
})
