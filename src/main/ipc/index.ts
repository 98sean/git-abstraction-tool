import { registerProjectsHandlers } from './projects'
import { registerPreferencesHandlers } from './preferences'
import { registerStatusHandlers } from './status'
import { registerGitHandlers } from './git'
import { registerDialogHandlers } from './dialog'
import { registerAuthHandlers } from './auth'
import { registerProjectSetupHandlers } from './projectSetup'
import { registerCloudHandlers } from './cloud'
import { registerAiHandlers } from './ai'
import { registerWeeklyReportHandlers } from './weekly'

export function registerIpcHandlers(): void {
  registerProjectsHandlers()
  registerPreferencesHandlers()
  registerStatusHandlers()
  registerGitHandlers()
  registerDialogHandlers()
  registerAuthHandlers()
  registerProjectSetupHandlers()
  registerCloudHandlers()
  registerAiHandlers()
  registerWeeklyReportHandlers()
}
