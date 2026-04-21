import { join } from 'node:path'
import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'

export interface Project {
  project_id: string
  local_path: string
  friendly_name: string
  last_accessed: number
}

interface ProjectsSchema {
  projects: Project[]
}

const storeCwd = process.env.VITEST ? join(process.cwd(), '.vitest', 'electron-store') : undefined

const store = new Store<ProjectsSchema>({
  name: 'projects',
  defaults: { projects: [] },
  ...(storeCwd ? { cwd: storeCwd } : {})
})

export function listProjects(): Project[] {
  return [...store.get('projects')].sort((a, b) => b.last_accessed - a.last_accessed)
}

export function addProject(local_path: string, friendly_name: string): Project {
  const projects = store.get('projects')
  const existing = projects.find((p) => p.local_path === local_path)
  if (existing) return existing

  const project: Project = {
    project_id: uuidv4(),
    local_path,
    friendly_name,
    last_accessed: Date.now()
  }
  store.set('projects', [...projects, project])
  return project
}

export function touchProject(project_id: string): void {
  const projects = store.get('projects').map((p) =>
    p.project_id === project_id ? { ...p, last_accessed: Date.now() } : p
  )
  store.set('projects', projects)
}

export function removeProject(project_id: string): void {
  const projects = store.get('projects').filter((p) => p.project_id !== project_id)
  store.set('projects', projects)
}
