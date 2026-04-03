import { ipcMain } from 'electron'
import { clearGithubToken, hasGithubToken, setGithubToken } from '../db/credentials'

export function registerAuthHandlers(): void {
  // Set (encrypt & store) a GitHub Personal Access Token
  ipcMain.handle('auth:token:set', (_event, token: string) => {
    setGithubToken(token)
  })

  // Returns boolean — never exposes the actual token to the renderer
  ipcMain.handle('auth:token:exists', () => {
    return hasGithubToken()
  })

  // Clear stored token
  ipcMain.handle('auth:token:clear', () => {
    clearGithubToken()
  })
}
