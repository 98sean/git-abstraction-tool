import { ipcMain } from 'electron'

interface AiManualToolHandlers {
  suggestUndo: (projectId: string, query: string) => Promise<unknown>
  generateFileInsight: (projectId: string, filePath: string) => Promise<unknown>
  reviewUntracked: (projectId: string) => Promise<unknown>
}

export function registerAiManualToolHandlers(handlers: AiManualToolHandlers): void {
  ipcMain.handle('ai:undo:suggest', (_event, projectId: string, query: string) =>
    handlers.suggestUndo(projectId, query)
  )
  ipcMain.handle('ai:file:insight', (_event, projectId: string, filePath: string) =>
    handlers.generateFileInsight(projectId, filePath)
  )
  ipcMain.handle('ai:untracked:review', (_event, projectId: string) =>
    handlers.reviewUntracked(projectId)
  )
}
