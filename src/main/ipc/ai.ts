import { ipcMain } from 'electron'
import { createAiService } from '../ai/service'
import { AiProviderName } from '../ai/types'
import { clearAiConnectionState, getAiConnectionState, setAiConnectionState } from '../db/aiConnection'
import { clearAiApiKey, getAiApiKey, setAiApiKey } from '../db/credentials'
import { getProjectAiSettings, ProjectAiSettings, setProjectAiSettings } from '../db/projectAiSettings'
import { getGitService } from '../git'

const aiService = createAiService()

export function registerAiHandlers(): void {
  ipcMain.handle('ai:connection:get', () => {
    return getAiConnectionState()
  })

  ipcMain.handle('ai:connection:connect', async (_event, provider: AiProviderName, apiKey: string) => {
    const connectionState = await aiService.connectProvider({ provider, apiKey })

    setAiApiKey(apiKey)
    setAiConnectionState(connectionState)

    return getAiConnectionState()
  })

  ipcMain.handle('ai:connection:disconnect', () => {
    clearAiApiKey()
    clearAiConnectionState()
    return getAiConnectionState()
  })

  ipcMain.handle('ai:connection:model:set', (_event, model: string) => {
    const currentState = getAiConnectionState()

    if (!currentState.provider) {
      return currentState
    }

    setAiConnectionState({
      ...currentState,
      selected_model: model
    })

    return getAiConnectionState()
  })

  ipcMain.handle('ai:project-settings:get', (_event, project_id: string) => {
    return getProjectAiSettings(project_id)
  })

  ipcMain.handle(
    'ai:project-settings:set',
    (_event, project_id: string, patch: Partial<ProjectAiSettings>) => {
      const currentSettings = getProjectAiSettings(project_id)
      const nextSettings: ProjectAiSettings = {
        ...currentSettings,
        ...patch
      }

      if (
        patch.ai_diff_consent_granted === true &&
        !currentSettings.ai_diff_consent_granted &&
        patch.ai_diff_consent_granted_at === undefined
      ) {
        nextSettings.ai_diff_consent_granted_at = Date.now()
      }

      if (patch.ai_diff_consent_granted === false) {
        nextSettings.ai_diff_consent_granted_at = null
      }

      setProjectAiSettings(project_id, nextSettings)
      return getProjectAiSettings(project_id)
    }
  )

  ipcMain.handle('ai:auto-save-message:generate', async (_event, project_id: string) => {
    const connectionState = getAiConnectionState()
    const projectSettings = getProjectAiSettings(project_id)
    const apiKey = getAiApiKey()

    if (!connectionState.provider || !connectionState.selected_model || !apiKey) {
      return null
    }

    if (!projectSettings.auto_save_message_enabled || !projectSettings.ai_diff_consent_granted) {
      return null
    }

    const gitService = getGitService(project_id)
    const diffContext = await gitService.getStagedDiffContext()

    if (!diffContext.diff.trim()) {
      return null
    }

    return aiService.generateAutoSaveMessage({
      provider: connectionState.provider,
      model: connectionState.selected_model,
      apiKey,
      diffContext
    })
  })
}
