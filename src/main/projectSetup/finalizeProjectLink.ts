import { addProject, Project } from '../db/projects'
import { GitService } from '../git/service'
import { FinalizeProjectLinkDependencies, FinalizeProjectLinkInput } from './types'

export async function finalizeProjectLink(
  input: FinalizeProjectLinkInput,
  dependencies: FinalizeProjectLinkDependencies = {}
): Promise<Project> {
  const gitService = new GitService(input.localPath)
  const registerProject = dependencies.registerProject ?? addProject

  if (input.shouldInitializeGit) {
    await gitService.initRepository()
  }

  if (input.ignoreEntries.length > 0) {
    await gitService.appendIgnoreEntries(input.ignoreEntries)
  }

  return registerProject(input.localPath, input.friendlyName)
}
