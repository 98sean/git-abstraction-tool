export function injectToken(url: string, token: string): string {
  return url.replace(/^https:\/\//, `https://oauth2:${token}@`)
}

export function buildGithubRemoteUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}.git`
}

function parseGithubRepository(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim()
  const match = trimmed.match(
    /^(?:https:\/\/(?:[^@]+@)?github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+)\/([^/]+?)(?:\.git)?$/i
  )

  if (!match) return null

  return {
    owner: match[1],
    repo: match[2]
  }
}

export function buildPullRequestUrl(remoteUrl: string, branchName: string): string | null {
  const repository = parseGithubRepository(remoteUrl)
  if (!repository) return null

  return `https://github.com/${repository.owner}/${repository.repo}/compare/${encodeURIComponent(branchName)}?expand=1`
}
