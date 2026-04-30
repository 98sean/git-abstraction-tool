import { join } from 'node:path'
import Store from 'electron-store'

export interface PreferencesSchema {
  theme: 'light' | 'dark'
  mode: 'newbie' | 'pro'
  language: 'en' | 'ko'
  auto_save_enabled: boolean
  default_save_message_template: string
}

const defaultPreferences: PreferencesSchema = {
  theme: 'light',
  mode: 'pro',
  language: 'en',
  auto_save_enabled: true,
  default_save_message_template: ''
}

const storeCwd = process.env.VITEST ? join(process.cwd(), '.vitest', 'electron-store') : undefined

const store = new Store<PreferencesSchema>({
  name: 'preferences',
  defaults: defaultPreferences,
  ...(storeCwd ? { cwd: storeCwd } : {})
})

export function getPreferences(): PreferencesSchema {
  return {
    ...defaultPreferences,
    ...store.store
  }
}

export function setPreference<K extends keyof PreferencesSchema>(
  key: K,
  value: PreferencesSchema[K]
): void {
  store.set(key, value)
}
