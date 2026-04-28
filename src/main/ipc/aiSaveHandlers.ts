import { ipcMain } from 'electron'

interface AiSaveHandlers {
  generateAutoSaveMessage: (projectId: string) => Promise<string | null>
  generateCommitSuggestion: (projectId: string) => Promise<unknown>
}

export function registerAiSaveHandlers(handlers: AiSaveHandlers): void {
  ipcMain.handle('ai:auto-save-message:generate', (_event, projectId: string) =>
    handlers.generateAutoSaveMessage(projectId)
  )
  ipcMain.handle('ai:commit-suggestion', (_event, projectId: string) =>
    handlers.generateCommitSuggestion(projectId)
  )
}
