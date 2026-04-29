import { describe, expect, it, vi } from 'vitest'
import { generateNaturalUndoSuggestion } from '../naturalUndoService'

describe('natural undo service', () => {
  it('skips no-op primary matches and falls back to a restorable commit', async () => {
    const gitService = {
      getTimeline: vi.fn().mockResolvedValue([
        {
          hash: 'head123',
          short_hash: 'head12',
          date: '2026-04-28T12:00:00.000Z',
          message: 'Current state',
          changed_files: ['src/app.ts']
        },
        {
          hash: 'prev123',
          short_hash: 'prev12',
          date: '2026-04-27T12:00:00.000Z',
          message: 'Before pricing copy',
          changed_files: ['src/app.ts']
        }
      ]),
      getRestorePreview: vi.fn(async (hash: string) =>
        hash === 'head123'
          ? { files_to_restore: [], files_to_remove: [] }
          : { files_to_restore: ['src/app.ts'], files_to_remove: [] }
      )
    }
    const manualToolService = {
      generateNaturalUndoSuggestion: vi.fn().mockResolvedValue({
        primary: {
          commitHash: 'head123',
          reason: 'Closest match',
          confidence: 0.9
        },
        alternatives: []
      })
    }

    const result = await generateNaturalUndoSuggestion({
      projectId: 'project-1',
      query: 'before pricing changed',
      aiConfig: { provider: 'openai', model: 'test-model', apiKey: 'test-key' },
      gitService,
      manualToolService,
      getSummariesByHash: () => new Map()
    })

    expect(result.commit_hash).toBe('prev123')
    expect(result.total_restore_files).toBe(1)
    expect(result.restore_files_preview).toEqual(['src/app.ts'])
    expect(result.reason).toBe('This is the closest earlier point that would actually change your files.')
  })
})
