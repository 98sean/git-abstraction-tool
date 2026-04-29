import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it, vi } from 'vitest'
import {
  buildFileInsightAnalysisInput,
  FILE_INSIGHT_SNIPPET_MAX_CHARS
} from '../fileInsightInput'
import { generateFileInsight } from '../fileInsightService'
import { createManualToolService } from '../manualToolService'
import { createAiService } from '../service'

async function makeProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'gat-file-insight-'))
}

describe('file insight input safety', () => {
  it('rejects likely binary files before building an AI prompt', async () => {
    const projectRoot = await makeProject()
    await writeFile(join(projectRoot, 'image.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]))

    await expect(buildFileInsightAnalysisInput(projectRoot, 'image.png')).rejects.toThrow(
      /only analyzes text files/i
    )
  })

  it('keeps selected paths inside the project root', async () => {
    const projectRoot = await makeProject()

    await expect(buildFileInsightAnalysisInput(projectRoot, '../secret.txt')).rejects.toThrow(
      /Invalid file path/i
    )
  })

  it('caps oversized text files to a bounded snippet', async () => {
    const projectRoot = await makeProject()
    await mkdir(join(projectRoot, 'src'))
    await writeFile(join(projectRoot, 'src', 'large.ts'), 'a'.repeat(FILE_INSIGHT_SNIPPET_MAX_CHARS + 500))

    const input = await buildFileInsightAnalysisInput(projectRoot, 'src/large.ts')

    expect(input.contentSnippet.length).toBeLessThanOrEqual(FILE_INSIGHT_SNIPPET_MAX_CHARS + 4)
    expect(input.contentSnippet.endsWith('\n...')).toBe(true)
  })

  it('falls back to useful text when structured AI output is incomplete', async () => {
    const provider = {
      validateKey: vi.fn(),
      generateMessage: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue({})
    }
    const aiService = createAiService({ openai: provider as never, anthropic: provider as never })
    const manualToolService = createManualToolService({ aiService })

    const result = await manualToolService.generateFileInsight({
      provider: 'openai',
      model: 'test-model',
      apiKey: 'test-key',
      filePath: 'src/app.ts',
      contentSnippet: 'export function app() {}',
      recentCommits: [],
      relatedCandidates: [{ path: 'src/routes.ts', score: 3 }]
    })

    expect(result.summary).toBe('This file is part of the current project workflow.')
    expect(result.functionality).toBe('It defines behavior used by the surrounding feature set.')
    expect(result.relatedFiles).toEqual([
      { path: 'src/routes.ts', reason: 'Frequently changed together in commit history.' }
    ])
  })

  it('builds service input with recent commits and related candidates', async () => {
    const projectRoot = await makeProject()
    await mkdir(join(projectRoot, 'src'))
    await writeFile(join(projectRoot, 'src', 'app.ts'), 'export function app() {}')

    const manualToolService = {
      generateFileInsight: vi.fn().mockResolvedValue({
        summary: 'App shell',
        functionality: 'Coordinates rendering',
        relatedFiles: [{ path: 'src/routes.ts', reason: 'Frequently changed together.' }]
      })
    }

    const result = await generateFileInsight({
      projectRoot,
      filePath: 'src/app.ts',
      aiConfig: { provider: 'openai', model: 'test-model', apiKey: 'test-key' },
      gitService: {
        getTimeline: vi.fn().mockResolvedValue([
          {
            hash: 'abc123',
            short_hash: 'abc123',
            date: '2026-04-28T12:00:00.000Z',
            message: 'Update app shell',
            changed_files: ['src/app.ts', 'src/routes.ts']
          }
        ]),
        listTrackedFiles: vi.fn().mockResolvedValue(['src/app.ts', 'src/routes.ts'])
      },
      manualToolService
    })

    expect(manualToolService.generateFileInsight).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'openai',
        model: 'test-model',
        apiKey: 'test-key',
        filePath: 'src/app.ts',
        recentCommits: [{ date: '2026-04-28T12:00:00.000Z', message: 'Update app shell' }],
        relatedCandidates: [expect.objectContaining({ path: 'src/routes.ts' })]
      })
    )
    expect(result).toEqual({
      file_path: 'src/app.ts',
      summary: 'App shell',
      functionality: 'Coordinates rendering',
      related_files: [{ path: 'src/routes.ts', reason: 'Frequently changed together.' }]
    })
  })

  it('rejects embedded git internals at the service boundary', async () => {
    const projectRoot = await makeProject()
    await mkdir(join(projectRoot, 'nested.git'))
    await writeFile(join(projectRoot, 'nested.git', 'config'), '[core]')

    await expect(
      generateFileInsight({
        projectRoot,
        filePath: 'nested.git/config',
        aiConfig: { provider: 'openai', model: 'test-model', apiKey: 'test-key' },
        gitService: {
          getTimeline: vi.fn(),
          listTrackedFiles: vi.fn()
        },
        manualToolService: {
          generateFileInsight: vi.fn()
        }
      })
    ).rejects.toThrow(/embedded Git system file/i)
  })
})
