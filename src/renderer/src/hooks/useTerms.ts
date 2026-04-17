import { usePreferences } from './usePreferences'

export interface AppTerms {
  // Sidebar
  sidebarTitle: string
  addRepo: string
  noReposHint: string

  // FileManager toolbar
  stageAll: string
  unstageAll: string
  stagedOf: (staged: number, total: number) => string
  loadingStatus: string
  cleanTitle: string
  cleanSubtext: string

  // FileItem
  revertBtn: string
  revertTitle: string

  // ActionPanel inputs & buttons
  commitPlaceholder: (hasStaged: boolean) => string
  commitBtn: (count: number) => string
  committingBtn: string
  pushBtn: string
  pullBtn: string
  pushTitle: string
  pullTitle: string

  // ActionPanel status bar
  filesStaged: (n: number) => string
  toPush: (n: number) => string
  toPull: (n: number) => string
  conflictMsg: string

  // Toasts (used in App.tsx)
  committedToast: string
  pushedToast: string
  pulledToast: string
  repoAdded: (name: string) => string
  repoAddFailed: string
  repoRemoved: string
  repoOpenFailed: string
}

const PRO: AppTerms = {
  sidebarTitle: 'Repositories',
  addRepo: '+ Add Repository',
  noReposHint: 'No repositories yet.\nClick "Add Repository" to get started.',

  stageAll: 'Stage all',
  unstageAll: 'Unstage all',
  stagedOf: (s, t) => `${s} / ${t} staged`,
  loadingStatus: 'Loading status…',
  cleanTitle: 'Working tree clean',
  cleanSubtext: 'Nothing to commit',

  revertBtn: 'Revert',
  revertTitle: 'Revert changes to this file',

  commitPlaceholder: (hasStaged) => (hasStaged ? 'Commit message…' : 'Stage changes above to commit'),
  commitBtn: (n) => `Commit${n > 0 ? ` (${n})` : ''}`,
  committingBtn: 'Committing…',
  pushBtn: '↑ Push',
  pullBtn: '↓ Pull',
  pushTitle: 'Push commits to remote',
  pullTitle: 'Pull from remote',

  filesStaged: (n) => `${n} file${n !== 1 ? 's' : ''} staged`,
  toPush: (n) => `↑ ${n} to push`,
  toPull: (n) => `↓ ${n} to pull`,
  conflictMsg: '⚠ Merge conflict detected',

  committedToast: 'Committed successfully!',
  pushedToast: 'Pushed successfully',
  pulledToast: 'Pulled successfully',
  repoAdded: (name) => `"${name}" added successfully`,
  repoAddFailed: 'Could not open that repository. Please try again.',
  repoRemoved: 'Repository removed',
  repoOpenFailed: 'Could not open that repository. Please try again.'
}

const NEWBIE: AppTerms = {
  sidebarTitle: 'My Projects',
  addRepo: '+ Link a Project',
  noReposHint: 'No projects yet.\nClick "Link a Project" to get started.',

  stageAll: 'Select all',
  unstageAll: 'Deselect all',
  stagedOf: (s, t) => `${s} / ${t} selected`,
  loadingStatus: 'Checking for changes…',
  cleanTitle: 'Everything is saved',
  cleanSubtext: 'No unsaved changes',

  revertBtn: 'Undo',
  revertTitle: 'Undo changes to this file',

  commitPlaceholder: (hasStaged) => (hasStaged ? 'Describe your changes…' : 'Select changes above to save'),
  commitBtn: (n) => `Save Progress${n > 0 ? ` (${n})` : ''}`,
  committingBtn: 'Saving…',
  pushBtn: '↑ Upload',
  pullBtn: '↓ Get Updates',
  pushTitle: 'Upload your saved versions to cloud',
  pullTitle: 'Get latest updates from cloud',

  filesStaged: (n) => `${n} change${n !== 1 ? 's' : ''} selected`,
  toPush: (n) => `↑ ${n} to upload`,
  toPull: (n) => `↓ ${n} to download`,
  conflictMsg: '⚠ Version mismatch detected',

  committedToast: 'Saved successfully!',
  pushedToast: 'Uploaded to cloud',
  pulledToast: 'Updates downloaded',
  repoAdded: (name) => `"${name}" linked successfully`,
  repoAddFailed: 'Could not link that folder. Please try again.',
  repoRemoved: 'Project removed',
  repoOpenFailed: 'Could not link that folder. Please try again.'
}

export function useTerms(): AppTerms {
  const { preferences } = usePreferences()
  return preferences.mode === 'newbie' ? NEWBIE : PRO
}
