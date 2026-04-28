import { access, mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it, vi } from 'vitest'
import { GitService } from '../service'

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function makeProject(): Promise<{ root: string; outside: string }> {
  const base = await mkdtemp(join(tmpdir(), 'gat-untracked-delete-'))
  const root = join(base, 'project')
  await mkdir(root)
  return { root, outside: join(base, 'outside.txt') }
}

describe('untracked delete safety', () => {
  it('rejects paths outside the project root even if status reports them', async () => {
    const { root, outside } = await makeProject()
    await writeFile(outside, 'do not delete')
    const git = {
      status: vi.fn().mockResolvedValue({
        files: [{ path: '../outside.txt', index: '?', working_dir: '?' }]
      })
    }

    const service = new GitService(root, git as never)
    const result = await service.deleteUntracked(['../outside.txt'])

    expect(result).toEqual({ deleted: 0, failed: ['../outside.txt'] })
    expect(await exists(outside)).toBe(true)
  })

  it('does not delete tracked files through the untracked delete path', async () => {
    const { root } = await makeProject()
    const tracked = join(root, 'tracked.txt')
    await writeFile(tracked, 'keep me')
    const git = {
      status: vi.fn().mockResolvedValue({
        files: [{ path: 'tracked.txt', index: ' ', working_dir: 'M' }]
      })
    }

    const service = new GitService(root, git as never)
    const result = await service.deleteUntracked(['tracked.txt'])

    expect(result).toEqual({ deleted: 0, failed: ['tracked.txt'] })
    expect(await exists(tracked)).toBe(true)
  })

  it('deletes only explicitly selected untracked files', async () => {
    const { root } = await makeProject()
    const selected = join(root, 'selected.log')
    const unselected = join(root, 'unselected.log')
    await writeFile(selected, 'delete')
    await writeFile(unselected, 'keep')
    const git = {
      status: vi.fn().mockResolvedValue({
        files: [
          { path: 'selected.log', index: '?', working_dir: '?' },
          { path: 'unselected.log', index: '?', working_dir: '?' }
        ]
      })
    }

    const service = new GitService(root, git as never)
    const result = await service.deleteUntracked(['selected.log'])

    expect(result).toEqual({ deleted: 1, failed: [] })
    expect(await exists(selected)).toBe(false)
    expect(await exists(unselected)).toBe(true)
  })
})
