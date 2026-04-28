import { ipcMain } from 'electron'

interface AiWeeklyHandlers {
  generateWeeklySummary: (projectId: string, startDate: string, endDate: string) => Promise<unknown>
}

export function registerAiWeeklyHandlers(handlers: AiWeeklyHandlers): void {
  ipcMain.handle(
    'ai:weekly:summary',
    (_event, projectId: string, startDate: string, endDate: string) =>
      handlers.generateWeeklySummary(projectId, startDate, endDate)
  )
}
