import Store from 'electron-store'

export interface PreferencesSchema {
  theme: 'light' | 'dark'
  auto_save_enabled: boolean
  default_save_message_template: string
}

const store = new Store<PreferencesSchema>({
  name: 'preferences',
  defaults: {
    theme: 'light',
    auto_save_enabled: true,
    default_save_message_template: ''
  }
})

export function getPreferences(): PreferencesSchema {
  return store.store
}

export function setPreference<K extends keyof PreferencesSchema>(
  key: K,
  value: PreferencesSchema[K]
): void {
  store.set(key, value)
}
