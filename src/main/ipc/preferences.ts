import { ipcMain } from 'electron'
import { PreferencesSchema, getPreferences, setPreference } from '../db/preferences'

export function registerPreferencesHandlers(): void {
  ipcMain.handle('db:preferences:get', () => {
    return getPreferences()
  })

  ipcMain.handle(
    'db:preferences:set',
    (_event, key: keyof PreferencesSchema, value: PreferencesSchema[typeof key]) => {
      setPreference(key, value)
    }
  )
}
