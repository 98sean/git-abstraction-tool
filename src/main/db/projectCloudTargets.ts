import { join } from 'node:path'
import Store from 'electron-store'

export interface ProjectCloudTarget {
  mode: 'none' | 'backup' | 'collaboration'
  backup: { remoteName: string; repoOwner: string; repoName: string; private: true } | null
  collaboration: {
    remoteName: string
    branchMode: 'new_branch' | 'existing_branch' | 'danger_default_branch'
    selectedBranch: string | null
  } | null
}

interface ProjectCloudTargetSchema {
  [project_id: string]: ProjectCloudTarget
}

const defaultProjectCloudTarget: ProjectCloudTarget = {
  mode: 'none',
  backup: null,
  collaboration: null
}

const storeCwd = process.env.VITEST ? join(process.cwd(), '.vitest', 'electron-store') : undefined

const store = new Store<ProjectCloudTargetSchema>({
  name: 'projectCloudTargets',
  defaults: {},
  ...(storeCwd ? { cwd: storeCwd } : {})
})

export function getProjectCloudTarget(project_id: string): ProjectCloudTarget {
  return {
    ...defaultProjectCloudTarget,
    ...(store.get(project_id) ?? {})
  }
}

export function setProjectCloudTarget(project_id: string, target: ProjectCloudTarget): void {
  store.set(project_id, target)
}

export function clearProjectCloudTarget(project_id: string): void {
  store.delete(project_id)
}
