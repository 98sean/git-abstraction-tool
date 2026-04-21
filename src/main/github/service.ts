const GITHUB_API_BASE_URL = 'https://api.github.com'
const APP_MANAGED_BACKUP_REMOTE = 'gat-backup'

export interface GithubTokenValidationResult {
  status: 'ok' | 'invalid' | 'missing_repo_access' | 'approval_required'
  accountLogin: string | null
  reason: string | null
}

export interface CreateBackupRepositoryInput {
  token: string
  repoName: string
}

export interface CreateBackupRepositoryResult {
  remoteName: string
  repoOwner: string
  repoName: string
  private: true
  cloneUrl: string
}

interface GithubUserResponse {
  login?: string
}

interface GithubRepoResponse {
  permissions?: {
    push?: boolean
  }
  owner?: {
    login?: string
  }
  name?: string
  private?: boolean
  clone_url?: string
}

interface GithubErrorResponse {
  message?: string
  errors?: Array<{
    message?: string
    code?: string
  }>
}

function getHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  }
}

export function createGithubService() {
  async function getBackupCreationErrorMessage(
    response: Response,
    repoName: string
  ): Promise<string> {
    let payload: GithubErrorResponse | null = null

    try {
      payload = (await response.json()) as GithubErrorResponse
    } catch {
      payload = null
    }

    const combinedErrorText = [
      payload?.message,
      ...(payload?.errors?.map((entry) => entry.message ?? entry.code ?? '').filter(Boolean) ?? [])
    ]
      .join(' ')
      .toLowerCase()

    if (response.status === 422 && combinedErrorText.includes('name already exists')) {
      return `A GitHub repository named "${repoName}" already exists in this account.`
    }

    if (response.status === 401 || response.status === 403) {
      return 'This GitHub token can sign in, but it cannot create a private backup repository. Reconnect with GitHub login or use a token that can create repositories.'
    }

    return 'Could not create a private GitHub backup repository.'
  }

  async function validateToken(token: string): Promise<GithubTokenValidationResult> {
    const response = await fetch(`${GITHUB_API_BASE_URL}/user`, {
      headers: getHeaders(token)
    })

    if (!response.ok) {
      return {
        status: 'invalid',
        accountLogin: null,
        reason: 'This GitHub token could not be validated.'
      }
    }

    const payload = (await response.json()) as GithubUserResponse

    return {
      status: 'ok',
      accountLogin: payload.login ?? null,
      reason: null
    }
  }

  return {
    validateToken,

    async validateTokenForRepository(input: {
      token: string
      owner: string
      repo: string
    }): Promise<GithubTokenValidationResult> {
      const tokenValidation = await validateToken(input.token)

      if (tokenValidation.status !== 'ok') {
        return tokenValidation
      }

      const response = await fetch(`${GITHUB_API_BASE_URL}/repos/${input.owner}/${input.repo}`, {
        headers: getHeaders(input.token)
      })

      if (!response.ok) {
        return {
          status: 'missing_repo_access',
          accountLogin: tokenValidation.accountLogin,
          reason: 'This token cannot access the selected repository.'
        }
      }

      const payload = (await response.json()) as GithubRepoResponse
      if (!payload.permissions?.push) {
        return {
          status: 'missing_repo_access',
          accountLogin: tokenValidation.accountLogin,
          reason: 'This token does not have push access to the selected repository.'
        }
      }

      return {
        status: 'ok',
        accountLogin: tokenValidation.accountLogin,
        reason: null
      }
    },

    async createPrivateBackupRepository(
      input: CreateBackupRepositoryInput
    ): Promise<CreateBackupRepositoryResult> {
      const response = await fetch(`${GITHUB_API_BASE_URL}/user/repos`, {
        method: 'POST',
        headers: getHeaders(input.token),
        body: JSON.stringify({
          name: input.repoName,
          private: true
        })
      })

      if (!response.ok) {
        throw new Error(await getBackupCreationErrorMessage(response, input.repoName))
      }

      const payload = (await response.json()) as GithubRepoResponse

      return {
        remoteName: APP_MANAGED_BACKUP_REMOTE,
        repoOwner: payload.owner?.login ?? '',
        repoName: payload.name ?? input.repoName,
        private: true,
        cloneUrl: payload.clone_url ?? ''
      }
    }
  }
}
