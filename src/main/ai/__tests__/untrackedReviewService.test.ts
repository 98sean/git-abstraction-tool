import { describe, expect, it, vi } from 'vitest'
import { reviewUntrackedFiles } from '../untrackedReviewService'

describe('untracked review service', () => {
  it('uses deterministic rules for generated files before AI review', async () => {
    const manualToolService = {
      reviewUntrackedFiles: vi.fn()
    }

    const result = await reviewUntrackedFiles({
      projectRoot: '/tmp/project',
      aiConfig: { provider: 'openai', model: 'test-model', apiKey: 'test-key' },
      gitService: {
        getStatus: vi.fn().mockResolvedValue({
          files: [
            { path: 'dist/bundle.js', status: 'untracked', staged: false },
            { path: 'src/new-feature.ts', status: 'untracked', staged: false }
          ],
          tracked_files: [],
          current_branch: 'main',
          ahead: 0,
          behind: 0,
          has_conflicts: false,
          is_clean: false
        })
      },
      manualToolService
    })

    expect(result.delete_count).toBe(1)
    expect(result.commit_count).toBe(1)
    expect(result.items.find((item) => item.path === 'dist/bundle.js')).toMatchObject({
      recommendation: 'delete'
    })
    expect(manualToolService.reviewUntrackedFiles).not.toHaveBeenCalled()
  })
})
