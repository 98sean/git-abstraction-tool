// WeeklyReport/main/ipc-weekly.ts
// 통합 시 src/main/ipc/ 폴더로 이동하고, src/main/ipc/index.ts 에서 registerWeeklyReportHandlers() 호출 추가
//
// import 경로 (통합 후):
//   import { listProjects } from '../db/projects'
//   import { GitWeeklyService } from '../git/weekly-service'
//   import { GitError } from '../git/types'

import { ipcMain } from 'electron'
import { GitWeeklyService } from './git-weekly-service'
import { WeeklyReport } from '../types/weekly-report'

// ─── 통합 전 임시 의존성 ────────────────────────────────────────────────────
// 실제 통합 시에는 아래 두 import를 삭제하고 위 주석의 경로로 대체한다.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Store = require('electron-store')
const projectsStore = new Store({ name: 'projects', defaults: { projects: [] } })

interface Project {
  project_id: string
  local_path: string
  friendly_name: string
}

function getProject(projectId: string): Project | undefined {
  const projects: Project[] = projectsStore.get('projects') ?? []
  return projects.find((p: Project) => p.project_id === projectId)
}
// ──────────────────────────────────────────────────────────────────────────────

// GitWeeklyService 인스턴스 캐시 (project_id → instance)
const weeklyServices = new Map<string, GitWeeklyService>()

function getWeeklyService(projectId: string, localPath: string): GitWeeklyService {
  if (!weeklyServices.has(projectId)) {
    weeklyServices.set(projectId, new GitWeeklyService(localPath))
  }
  return weeklyServices.get(projectId)!
}

export function registerWeeklyReportHandlers(): void {
  /**
   * git:log:weekly
   * params: { projectId: string, startDate: string (YYYY-MM-DD), endDate: string (YYYY-MM-DD) }
   * returns: { data: WeeklyReport } | { error: GitError }
   */
  ipcMain.handle(
    'git:log:weekly',
    async (
      _event,
      projectId: string,
      startDate: string,
      endDate: string
    ): Promise<{ data: WeeklyReport } | { error: { code: string; message: string; raw?: string } }> => {
      try {
        const project = getProject(projectId)
        if (!project) {
          return {
            error: {
              code: 'NOT_A_REPO',
              message: 'Project not found. Please reconnect.'
            }
          }
        }

        const service = getWeeklyService(projectId, project.local_path)
        const data = await service.getWeeklyLog(
          startDate,
          endDate,
          projectId,
          project.friendly_name
        )
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
