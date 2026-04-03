import { ipcMain, dialog, shell } from 'electron'

export function registerDialogHandlers(): void {
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // Open a URL in the user's default browser
  ipcMain.handle('shell:openExternal', (_event, url: string) => {
    shell.openExternal(url)
  })
}
