import { ipcMain } from 'electron'
import { ConflictHint } from '../ai/conflictAnalysis'

interface AiConflictHandlers {
  analyzeConflict: (projectId: string, filePath: string) => Promise<ConflictHint>
}

export function registerAiConflictHandlers(handlers: AiConflictHandlers): void {
  ipcMain.handle('ai:conflict:analyze', (_event, projectId: string, filePath: string) =>
    handlers.analyzeConflict(projectId, filePath)
  )
}
