import { ipcMain } from 'electron'
import { getCachedStatus, invalidateCache } from '../db/statusCache'

export function registerStatusHandlers(): void {
  ipcMain.handle('db:status:get', (_event, project_id: string) => {
    return getCachedStatus(project_id)
  })

  ipcMain.handle('db:status:invalidate', (_event, project_id: string) => {
    invalidateCache(project_id)
  })
}
