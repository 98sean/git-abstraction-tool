import { listProjects } from '../db/projects'
import { GitService } from './service'

// One GitService instance per project, reused across IPC calls
const services = new Map<string, GitService>()

export function getGitService(project_id: string): GitService {
  if (!services.has(project_id)) {
    const projects = listProjects()
    const project = projects.find((p) => p.project_id === project_id)
    if (!project) {
      throw new Error(`Project "${project_id}" not found in store.`)
    }
    console.log('[GAT] Creating GitService for path:', project.local_path)
    services.set(project_id, new GitService(project.local_path))
  }
  return services.get(project_id)!
}

export function removeGitService(project_id: string): void {
  services.delete(project_id)
}

export { GitService }
