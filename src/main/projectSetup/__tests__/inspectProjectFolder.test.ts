import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { inspectProjectFolder } from '../inspectProjectFolder'

const tempDirs: string[] = []

async function createTempProject(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

describe('inspectProjectFolder', () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
  })

  it('reports a non-git folder and suggests init', async () => {
    const folder = await createTempProject('plain-folder-')

    const result = await inspectProjectFolder(folder)

    expect(result.isGitRepo).toBe(false)
    expect(result.canInitialize).toBe(true)
  })

  it('flags sensitive and generated files', async () => {
    const folder = await createTempProject('project-with-env-')
    await writeFile(join(folder, '.env'), 'SECRET=test\n', 'utf8')
    await mkdir(join(folder, 'node_modules'), { recursive: true })
    await writeFile(join(folder, 'node_modules', 'package.json'), '{}', 'utf8')

    const result = await inspectProjectFolder(folder)

    expect(result.warnings.some((item) => item.kind === 'sensitive')).toBe(true)
    expect(result.recommendedIgnoreEntries).toContain('.env')
    expect(result.recommendedIgnoreEntries).toContain('node_modules')
  })
})
