import { registerProjectsHandlers } from './projects'
import { registerPreferencesHandlers } from './preferences'
import { registerStatusHandlers } from './status'
import { registerGitHandlers } from './git'
import { registerDialogHandlers } from './dialog'
import { registerAuthHandlers } from './auth'
import { registerAIHandlers } from './ai'

export function registerIpcHandlers(): void {
  registerProjectsHandlers()
  registerPreferencesHandlers()
  registerStatusHandlers()
  registerGitHandlers()
  registerDialogHandlers()
  registerAuthHandlers()
  registerAIHandlers()
}
