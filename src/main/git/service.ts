import { access, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import simpleGit, { SimpleGit, StatusResult } from 'simple-git'
import {
  BranchInfo,
  CommitInfo,
  FileStatus,
  FileStatusCode,
  GitError,
  GitStatus,
  PullConfiguredTargetInput,
  PushConfiguredTargetInput,
  PushConfiguredTargetResult,
  StagedDiffContext
} from './types'
import { mapGitError } from './errors'

function mapStatusCode(index: string, working: string): { code: FileStatusCode; staged: boolean } {
  const conflictCodes = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'])
  const combined = `${index}${working}`

  if (combined === '??') return { code: 'untracked', staged: false }
  if (conflictCodes.has(combined)) return { code: 'conflicted', staged: false }

  if (index !== ' ' && index !== '?') {
    if (index === 'A') return { code: 'new', staged: true }
    if (index === 'M') return { code: 'modified', staged: true }
    if (index === 'D') return { code: 'deleted', staged: true }
    if (index === 'R') return { code: 'renamed', staged: true }
  }

  if (working === 'M') return { code: 'modified', staged: false }
  if (working === 'D') return { code: 'deleted', staged: false }

  return { code: 'modified', staged: false }
}

function parseStatus(raw: StatusResult): GitStatus {
  const files: FileStatus[] = raw.files.map((file) => {
    const { code, staged } = mapStatusCode(file.index, file.working_dir)

    return {
      path: file.path,
      status: code,
      staged,
      oldPath: file.from || undefined
    }
  })

  return {
    current_branch: raw.current ?? 'HEAD',
    files,
    ahead: raw.ahead,
    behind: raw.behind,
    has_conflicts: files.some((file) => file.status === 'conflicted'),
    is_clean: raw.isClean()
  }
}

function injectToken(url: string, token: string): string {
  return url.replace(/^https:\/\//, `https://oauth2:${token}@`)
}

function buildGithubRemoteUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}.git`
}

function parseGithubRepository(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim()
  const match = trimmed.match(
    /^(?:https:\/\/(?:[^@]+@)?github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+)\/([^/]+?)(?:\.git)?$/i
  )

  if (!match) return null

  return {
    owner: match[1],
    repo: match[2]
  }
}

function buildPullRequestUrl(remoteUrl: string, branchName: string): string | null {
  const repository = parseGithubRepository(remoteUrl)
  if (!repository) return null

  return `https://github.com/${repository.owner}/${repository.repo}/compare/${encodeURIComponent(branchName)}?expand=1`
}

function isGitError(error: unknown): error is GitError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error
}

function defaultBranchProtectedError(): GitError {
  return {
    code: 'DEFAULT_BRANCH_PROTECTED',
    message: 'Default branch upload requires danger-mode confirmation.'
  }
}

export class GitService {
  private git: SimpleGit
  private localPath: string

  constructor(local_path: string, git?: SimpleGit) {
    this.localPath = local_path
    this.git = git ?? simpleGit(local_path)
  }

  async isRepository(): Promise<boolean> {
    try {
      return await this.git.checkIsRepo()
    } catch {
      return false
    }
  }

  async initRepository(): Promise<void> {
    try {
      await this.git.init()
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async getRemotes(): Promise<Array<{ name: string; fetch: string; push: string }>> {
    try {
      const remotes = await this.git.getRemotes(true)
      return remotes.map((remote) => ({
        name: remote.name,
        fetch: remote.refs.fetch ?? '',
        push: remote.refs.push ?? ''
      }))
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async appendIgnoreEntries(entries: string[]): Promise<void> {
    const ignorePath = join(this.localPath, '.gitignore')
    const uniqueEntries = [...new Set(entries.map((entry) => entry.trim()).filter(Boolean))]
    if (uniqueEntries.length === 0) return

    let existingContent = ''

    try {
      await access(ignorePath)
      existingContent = await readFile(ignorePath, 'utf8')
    } catch {
      existingContent = ''
    }

    const existingEntries = new Set(
      existingContent
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
    const missingEntries = uniqueEntries.filter((entry) => !existingEntries.has(entry))

    if (missingEntries.length === 0) return

    const prefix = existingContent.length > 0 && !existingContent.endsWith('\n') ? '\n' : ''
    const nextContent = `${existingContent}${prefix}${missingEntries.join('\n')}\n`
    await writeFile(ignorePath, nextContent, 'utf8')
  }

  private async getRemoteDetails(
    remoteName: string
  ): Promise<{ name: string; fetch: string; push: string } | null> {
    const remotes = await this.getRemotes()
    return remotes.find((remote) => remote.name === remoteName) ?? null
  }

  private async ensureRemote(remoteName: string, remoteUrl: string): Promise<void> {
    const existingRemote = await this.getRemoteDetails(remoteName)

    if (!existingRemote) {
      await this.git.raw(['remote', 'add', remoteName, remoteUrl])
      return
    }

    if (existingRemote.fetch === remoteUrl && existingRemote.push === remoteUrl) {
      return
    }

    await this.git.raw(['remote', 'set-url', remoteName, remoteUrl])
  }

  private async getCurrentBranchName(): Promise<string> {
    const status = await this.git.status()
    return status.current ?? 'HEAD'
  }

  private async pushRef(
    remoteName: string,
    refspec: string,
    options: string[] = [],
    token?: string,
    remoteUrlOverride?: string
  ): Promise<void> {
    const remote = remoteUrlOverride ? null : await this.getRemoteDetails(remoteName)
    const pushUrl = remoteUrlOverride ?? remote?.push ?? null

    if (token && pushUrl?.startsWith('https://')) {
      await this.git.raw(['push', ...options, injectToken(pushUrl, token), refspec])
      return
    }

    if (options.length > 0) {
      await this.git.push(remoteName, refspec, options)
      return
    }

    await this.git.push(remoteName, refspec)
  }

  private async pullRef(remoteName: string, branchName: string, token?: string): Promise<void> {
    const remote = await this.getRemoteDetails(remoteName)
    const fetchUrl = remote?.fetch ?? null

    if (token && fetchUrl?.startsWith('https://')) {
      await this.git.raw(['pull', injectToken(fetchUrl, token), branchName])
      return
    }

    await this.git.pull(remoteName, branchName)
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const raw = await this.git.status()
      return parseStatus(raw)
    } catch (err) {
      console.error('[GAT] git.status() failed:', err)
      throw mapGitError(err)
    }
  }

  async stage(paths: string[]): Promise<void> {
    try {
      await this.git.add(paths)
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async unstage(paths: string[]): Promise<void> {
    try {
      await this.git.reset(['HEAD', '--', ...paths])
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async commit(message: string): Promise<void> {
    try {
      await this.git.commit(message)
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async pushConfiguredTarget(
    input: PushConfiguredTargetInput
  ): Promise<PushConfiguredTargetResult> {
    try {
      if (input.mode === 'backup') {
        const remoteUrl = buildGithubRemoteUrl(input.repoOwner, input.repoName)
        await this.ensureRemote(input.remoteName, remoteUrl)
        await this.pushRef(input.remoteName, 'HEAD', ['-u'], input.token, remoteUrl)

        return {
          remoteName: input.remoteName,
          branchName: await this.getCurrentBranchName(),
          prUrl: null
        }
      }

      if (input.branchMode === 'danger_default_branch' && !input.dangerConfirmed) {
        throw defaultBranchProtectedError()
      }

      if (input.branchMode === 'new_branch') {
        await this.git.checkoutLocalBranch(input.branchName)
        await this.pushRef(input.remoteName, input.branchName, ['-u'], input.token)
      } else {
        await this.pushRef(input.remoteName, input.branchName, [], input.token)
      }

      const remote = await this.getRemoteDetails(input.remoteName)
      return {
        remoteName: input.remoteName,
        branchName: input.branchName,
        prUrl:
          input.branchMode === 'danger_default_branch'
            ? null
            : buildPullRequestUrl(remote?.push ?? remote?.fetch ?? '', input.branchName)
      }
    } catch (err) {
      if (isGitError(err)) {
        throw err
      }

      throw mapGitError(err)
    }
  }

  async pullConfiguredTarget(input: PullConfiguredTargetInput): Promise<void> {
    try {
      await this.pullRef(input.remoteName, input.branchName, input.token)
    } catch (err) {
      if (isGitError(err)) {
        throw err
      }

      throw mapGitError(err)
    }
  }

  async getStagedDiffContext(): Promise<StagedDiffContext> {
    try {
      const status = await this.getStatus()
      const stagedFiles = status.files.filter((file) => file.staged)
      const diff = await this.git.diff(['--cached', '--no-ext-diff', '--minimal'])

      return {
        diff,
        files: stagedFiles.map(({ path, status: fileStatus }) => ({
          path,
          status: fileStatus
        }))
      }
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async push(token?: string): Promise<void> {
    try {
      if (token) {
        const remotes = await this.git.getRemotes(true)
        const pushUrl = remotes.find((remote) => remote.name === 'origin')?.refs?.push

        if (pushUrl?.startsWith('https://')) {
          await this.git.raw(['push', injectToken(pushUrl, token), 'HEAD'])
          return
        }
      }

      await this.git.push()
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async pull(token?: string): Promise<void> {
    try {
      if (token) {
        const remotes = await this.git.getRemotes(true)
        const fetchUrl = remotes.find((remote) => remote.name === 'origin')?.refs?.fetch

        if (fetchUrl?.startsWith('https://')) {
          await this.git.raw(['pull', injectToken(fetchUrl, token)])
          return
        }
      }

      await this.git.pull()
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async getBranches(): Promise<BranchInfo[]> {
    try {
      const summary = await this.git.branch(['-a'])
      return Object.entries(summary.branches).map(([name, branch]) => ({
        name: branch.name,
        current: branch.current,
        remote: name.startsWith('remotes/') ? name : undefined
      }))
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async createBranch(name: string): Promise<void> {
    try {
      await this.git.checkoutLocalBranch(name)
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async switchBranch(name: string): Promise<void> {
    try {
      await this.git.checkout(name)
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async revertFile(path: string): Promise<void> {
    try {
      await this.git.checkout(['HEAD', '--', path])
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async getLog(limit = 50): Promise<CommitInfo[]> {
    try {
      const log = await this.git.log({ maxCount: limit })
      return log.all.map((entry) => ({
        hash: entry.hash,
        short_hash: entry.hash.slice(0, 7),
        message: entry.message,
        author_name: entry.author_name,
        author_email: entry.author_email,
        date: entry.date
      }))
    } catch (err) {
      throw mapGitError(err)
    }
  }
}
