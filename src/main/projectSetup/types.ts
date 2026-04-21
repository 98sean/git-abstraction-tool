import { Project } from '../db/projects'

export interface ProjectRemote {
  name: string
  fetch: string
  push: string
}

export type ProjectWarningKind = 'large' | 'binary' | 'sensitive' | 'generated'

export interface ProjectFolderWarning {
  kind: ProjectWarningKind
  path: string
  reason: string
}

export interface ProjectFolderInspection {
  isGitRepo: boolean
  canInitialize: boolean
  remotes: ProjectRemote[]
  warnings: ProjectFolderWarning[]
  recommendedIgnoreEntries: string[]
}

export interface FinalizeProjectLinkInput {
  localPath: string
  friendlyName: string
  shouldInitializeGit: boolean
  ignoreEntries: string[]
}

export interface FinalizeProjectLinkDependencies {
  registerProject?: (localPath: string, friendlyName: string) => Project
}
