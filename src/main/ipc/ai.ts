import { ipcMain } from 'electron'
import { generateCommitSuggestion } from '../ai/openai'
import { getGitService } from '../git'

export function registerAiHandlers(): void {
  ipcMain.handle('ai:commit-suggestion', async (_event, project_id: string) => {
    const diff = await getGitService(project_id).getStagedDiff()
    if (!diff.trim()) {
      throw new Error('There are no staged changes to summarize.')
    }
    return generateCommitSuggestion(diff)
  })
}
