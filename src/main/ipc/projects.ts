import { ipcMain } from 'electron'
import { addProject, listProjects, removeProject, touchProject } from '../db/projects'
import { invalidateCache } from '../db/statusCache'
import { stopWatchingProject, watchProject } from '../watcher'
import { removeGitService } from '../git'

export function registerProjectForUse(local_path: string, friendly_name: string) {
  const project = addProject(local_path, friendly_name)
  watchProject(project.project_id, project.local_path)
  return project
}

export function registerProjectsHandlers(): void {
  ipcMain.handle('db:projects:list', () => {
    return listProjects()
  })

  ipcMain.handle(
    'db:projects:add',
    (_event, local_path: string, friendly_name: string) => {
      return registerProjectForUse(local_path, friendly_name)
    }
  )

  ipcMain.handle('db:projects:remove', (_event, project_id: string) => {
    stopWatchingProject(project_id)
    invalidateCache(project_id)
    removeGitService(project_id)
    removeProject(project_id)
  })

  ipcMain.handle('db:projects:touch', (_event, project_id: string) => {
    touchProject(project_id)
  })
}
