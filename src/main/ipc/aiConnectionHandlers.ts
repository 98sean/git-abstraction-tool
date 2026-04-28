import { ipcMain } from 'electron'
import { ProjectAiSettings } from '../db/projectAiSettings'
import { AiProviderName } from '../ai/types'

interface AiConnectionHandlers {
  getConnection: () => unknown
  connect: (provider: AiProviderName, apiKey: string) => Promise<unknown>
  disconnect: () => unknown
  setModel: (model: string) => unknown
  getProjectSettings: (projectId: string) => ProjectAiSettings
  setProjectSettings: (projectId: string, patch: Partial<ProjectAiSettings>) => ProjectAiSettings
}

export function registerAiConnectionHandlers(handlers: AiConnectionHandlers): void {
  ipcMain.handle('ai:connection:get', () => handlers.getConnection())
  ipcMain.handle('ai:connection:connect', (_event, provider: AiProviderName, apiKey: string) =>
    handlers.connect(provider, apiKey)
  )
  ipcMain.handle('ai:connection:disconnect', () => handlers.disconnect())
  ipcMain.handle('ai:connection:model:set', (_event, model: string) => handlers.setModel(model))
  ipcMain.handle('ai:project-settings:get', (_event, projectId: string) =>
    handlers.getProjectSettings(projectId)
  )
  ipcMain.handle(
    'ai:project-settings:set',
    (_event, projectId: string, patch: Partial<ProjectAiSettings>) =>
      handlers.setProjectSettings(projectId, patch)
  )
}
