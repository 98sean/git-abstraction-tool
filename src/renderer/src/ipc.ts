import { GitError } from './types'

type IpcGitResult<T> = { data: T } | { error: GitError }

// For git:* channels — returns { data } | { error }
export async function invokeGit<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result = (await window.electron.ipcRenderer.invoke(channel, ...args)) as IpcGitResult<T>
  if ('error' in result) throw result.error as GitError
  return (result as { data: T }).data
}

// For db:* and dialog:* channels — returns raw value
export async function invokeDb<T>(channel: string, ...args: unknown[]): Promise<T> {
  return (await window.electron.ipcRenderer.invoke(channel, ...args)) as T
}
