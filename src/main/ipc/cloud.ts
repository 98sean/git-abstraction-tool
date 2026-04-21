import { ipcMain } from 'electron'
import { getProjectCloudTarget, setProjectCloudTarget } from '../db/projectCloudTargets'
import { getGithubToken } from '../db/credentials'
import { createGithubService } from '../github/service'

const githubService = createGithubService()

export function registerCloudHandlers(): void {
  ipcMain.handle('cloud:target:get', (_event, project_id: string) => {
    return getProjectCloudTarget(project_id)
  })

  ipcMain.handle('cloud:github:validate-target', async (_event, owner: string, repo: string) => {
    const token = getGithubToken()

    if (!token) {
      return {
        status: 'invalid',
        accountLogin: null,
        reason: 'Connect GitHub before choosing an upload target.'
      }
    }

    return githubService.validateTokenForRepository({ token, owner, repo })
  })

  ipcMain.handle('cloud:backup:create', async (_event, project_id: string, repoName: string) => {
    const token = getGithubToken()

    if (!token) {
      throw new Error('Connect GitHub before creating a backup repository.')
    }

    const backup = await githubService.createPrivateBackupRepository({
      token,
      repoName
    })

    const currentTarget = getProjectCloudTarget(project_id)
    const nextTarget = {
      ...currentTarget,
      mode: 'backup' as const,
      backup: {
        remoteName: backup.remoteName,
        repoOwner: backup.repoOwner,
        repoName: backup.repoName,
        private: true as const
      },
      collaboration: null
    }

    setProjectCloudTarget(project_id, nextTarget)
    return nextTarget
  })

  ipcMain.handle(
    'cloud:collaboration:set',
    async (
      _event,
      project_id: string,
      input: {
        repoOwner: string
        repoName: string
        remoteName: string
        branchMode: 'new_branch' | 'existing_branch' | 'danger_default_branch'
        selectedBranch: string
      }
    ) => {
      const token = getGithubToken()

      if (!token) {
        throw new Error('Connect GitHub before choosing a team upload target.')
      }

      const validation = await githubService.validateTokenForRepository({
        token,
        owner: input.repoOwner,
        repo: input.repoName
      })

      if (validation.status !== 'ok') {
        throw new Error(validation.reason ?? 'This token cannot access the selected repository.')
      }

      const currentTarget = getProjectCloudTarget(project_id)
      const nextTarget = {
        ...currentTarget,
        mode: 'collaboration' as const,
        backup: null,
        collaboration: {
          remoteName: input.remoteName,
          branchMode: input.branchMode,
          selectedBranch: input.selectedBranch
        }
      }

      setProjectCloudTarget(project_id, nextTarget)
      return nextTarget
    }
  )
}
