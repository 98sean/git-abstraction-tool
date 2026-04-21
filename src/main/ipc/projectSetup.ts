import { ipcMain } from 'electron'
import { finalizeProjectLink } from '../projectSetup/finalizeProjectLink'
import { inspectProjectFolder } from '../projectSetup/inspectProjectFolder'
import { registerProjectForUse } from './projects'

export function registerProjectSetupHandlers(): void {
  ipcMain.handle('project-setup:inspect', (_event, localPath: string) => {
    return inspectProjectFolder(localPath)
  })

  ipcMain.handle(
    'project-setup:finalize-link',
    (_event, input: {
      localPath: string
      friendlyName: string
      shouldInitializeGit: boolean
      ignoreEntries: string[]
    }) => {
      return finalizeProjectLink(input, {
        registerProject: registerProjectForUse
      })
    }
  )
}
