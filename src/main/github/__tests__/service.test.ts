import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGithubService } from '../service'

describe('github service', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts a fine-grained PAT after repo validation', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ login: 'tony' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ permissions: { push: true } })
      }) as never

    const service = createGithubService()
    const result = await service.validateTokenForRepository({
      token: 'github_pat_123',
      owner: 'tony',
      repo: 'demo'
    })

    expect(result.status).toBe('ok')
    expect(result.accountLogin).toBe('tony')
  })

  it('creates a private backup repository for the authenticated user', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        owner: { login: 'tony' },
        name: 'demo-backup',
        private: true,
        clone_url: 'https://github.com/tony/demo-backup.git'
      })
    }) as never

    const service = createGithubService()
    const result = await service.createPrivateBackupRepository({
      token: 'ghp_123',
      repoName: 'demo-backup'
    })

    expect(result.repoOwner).toBe('tony')
    expect(result.repoName).toBe('demo-backup')
    expect(result.private).toBe(true)
  })

  it('surfaces a helpful error when the backup repository name already exists', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: 'Repository creation failed.',
        errors: [{ code: 'custom', message: 'name already exists on this account' }]
      })
    }) as never

    const service = createGithubService()

    await expect(
      service.createPrivateBackupRepository({
        token: 'ghp_123',
        repoName: 'demo-backup'
      })
    ).rejects.toThrow('A GitHub repository named "demo-backup" already exists in this account.')
  })

  it('surfaces a helpful error when the token cannot create repositories', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        message: 'Resource not accessible by personal access token'
      })
    }) as never

    const service = createGithubService()

    await expect(
      service.createPrivateBackupRepository({
        token: 'github_pat_123',
        repoName: 'demo-backup'
      })
    ).rejects.toThrow(
      'This GitHub token can sign in, but it cannot create a private backup repository.'
    )
  })
})
