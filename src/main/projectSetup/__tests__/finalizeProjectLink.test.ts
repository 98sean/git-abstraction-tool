import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { finalizeProjectLink } from '../finalizeProjectLink'

const tempDirs: string[] = []

async function createTempProject(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

describe('finalizeProjectLink', () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
  })

  it('initializes git, writes ignore entries, and registers the project', async () => {
    const folder = await createTempProject('finalize-project-')
    const registerProject = vi.fn().mockReturnValue({
      project_id: 'p1',
      local_path: folder,
      friendly_name: 'Demo',
      last_accessed: 1
    })

    const project = await finalizeProjectLink(
      {
        localPath: folder,
        friendlyName: 'Demo',
        shouldInitializeGit: true,
        ignoreEntries: ['.env', 'node_modules']
      },
      { registerProject }
    )

    const gitIgnore = await readFile(join(folder, '.gitignore'), 'utf8')

    expect(project.project_id).toBe('p1')
    expect(gitIgnore).toContain('.env')
    expect(gitIgnore).toContain('node_modules')
    expect(registerProject).toHaveBeenCalledWith(folder, 'Demo')
  })
})
