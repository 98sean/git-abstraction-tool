import { describe, expect, it } from 'vitest'
import { buildGithubRemoteUrl, buildPullRequestUrl, injectToken } from '../remoteUrls'

describe('git remote URL helpers', () => {
  it('builds authenticated push URLs and GitHub compare links', () => {
    expect(buildGithubRemoteUrl('tony', 'demo-backup')).toBe(
      'https://github.com/tony/demo-backup.git'
    )
    expect(injectToken('https://github.com/tony/demo.git', 'github_pat_123')).toBe(
      'https://oauth2:github_pat_123@github.com/tony/demo.git'
    )
    expect(buildPullRequestUrl('https://github.com/tony/demo.git', 'gat/update-copy')).toBe(
      'https://github.com/tony/demo/compare/gat%2Fupdate-copy?expand=1'
    )
  })
})
