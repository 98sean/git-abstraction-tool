import { join } from 'node:path'
import Store from 'electron-store'

export interface ProjectAiSettings {
  auto_save_message_enabled: boolean
  ai_diff_consent_granted: boolean
  ai_diff_consent_granted_at: number | null
}

interface ProjectAiSettingsSchema {
  [project_id: string]: ProjectAiSettings
}

const defaultProjectAiSettings: ProjectAiSettings = {
  auto_save_message_enabled: false,
  ai_diff_consent_granted: false,
  ai_diff_consent_granted_at: null
}

const storeCwd = process.env.VITEST ? join(process.cwd(), '.vitest', 'electron-store') : undefined

const store = new Store<ProjectAiSettingsSchema>({
  name: 'projectAiSettings',
  defaults: {},
  ...(storeCwd ? { cwd: storeCwd } : {})
})

export function getProjectAiSettings(project_id: string): ProjectAiSettings {
  return {
    ...defaultProjectAiSettings,
    ...(store.get(project_id) ?? {})
  }
}

export function setProjectAiSettings(project_id: string, settings: ProjectAiSettings): void {
  store.set(project_id, settings)
}

export function clearProjectAiSettings(project_id: string): void {
  store.delete(project_id)
}
