import { ipcMain } from 'electron'
import { listProjects } from '../db/projects'
import { GitWeeklyService } from '../git/weekly-service'
import { GitError, WeeklyReport } from '../git/types'

const weeklyServices = new Map<string, GitWeeklyService>()

function getWeeklyService(projectId: string, localPath: string): GitWeeklyService {
  if (!weeklyServices.has(projectId)) {
    weeklyServices.set(projectId, new GitWeeklyService(localPath))
  }
  return weeklyServices.get(projectId)!
}

export function registerWeeklyReportHandlers(): void {
  ipcMain.handle(
    'git:log:weekly',
    async (
      _event,
      projectId: string,
      startDate: string,
      endDate: string
    ): Promise<{ data: WeeklyReport } | { error: GitError }> => {
      try {
        const project = listProjects().find((p) => p.project_id === projectId)
        if (!project) {
          return {
            error: {
              code: 'NOT_A_REPO',
              message: 'Project not found. Please reconnect.'
            }
          }
        }

        const service = getWeeklyService(projectId, project.local_path)
        const data = await service.getWeeklyLog(startDate, endDate, projectId, project.friendly_name)
        return { data }
      } catch (err: unknown) {
        const raw = (err as Error)?.message ?? String(err)
        return {
          error: {
            code: 'UNKNOWN',
            message: 'Failed to load report. Please try again.',
            raw
          }
        }
      }
    }
  )
}
