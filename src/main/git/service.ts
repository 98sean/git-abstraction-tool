import { access, readFile, rm, writeFile } from 'node:fs/promises'
import path, { join } from 'node:path'
import simpleGit, { SimpleGit, StatusResult } from 'simple-git'
import {
  BranchCreateResult,
  BranchDeleteResult,
  BranchInfo,
  BranchMergeResult,
  CommitInfo,
  FileStatus,
  FileStatusCode,
  GitError,
  GitStatus,
  IncomingCommitInfo,
  PullConfiguredTargetInput,
  PullUpdatesPreview,
  PushConfiguredTargetInput,
  PushConfiguredTargetResult,
  RestorePreview,
  RestoreResult,
  StagedDiffContext,
  TimelineCommitInfo,
  UntrackedDeleteResult
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
    tracked_files: [],
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

interface DiffLine {
  status: string
  path: string
  sourcePath?: string
}

function parseDiffLine(line: string): DiffLine | null {
  const parts = line.split('\t')
  if (parts.length < 2) return null
  const status = parts[0]?.trim()
  if (!status) return null

  if ((status.startsWith('R') || status.startsWith('C')) && parts.length >= 3) {
    const sourcePath = (parts[1] ?? '').trim()
    const path = (parts[2] ?? '').trim()
    if (!sourcePath || !path) return null
    return {
      status,
      sourcePath,
      path
    }
  }

  const changedPath = (parts[1] ?? '').trim()
  if (!changedPath) return null
  return {
    status,
    path: changedPath
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }

  return result
}

function buildBackupBranchName(commitHash: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')

  return `gat-backup/${timestamp}-${commitHash.slice(0, 7)}`
}

function resolveProjectPath(projectRoot: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/')
  const absolute = path.resolve(projectRoot, normalized)
  const relativeToRoot = path.relative(projectRoot, absolute)

  if (!relativeToRoot || relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error('Invalid path outside project root.')
  }

  return absolute
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

  async getDefaultBranch(remoteName = 'origin'): Promise<string | null> {
    try {
      const symbolic = await this.git.raw([
        'symbolic-ref',
        '--short',
        `refs/remotes/${remoteName}/HEAD`
      ])
      const ref = symbolic.trim()
      if (!ref) return null

      const prefix = `${remoteName}/`
      if (ref.startsWith(prefix)) {
        return ref.slice(prefix.length)
      }

      const parts = ref.split('/')
      return parts[parts.length - 1] ?? null
    } catch {
      return null
    }
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

  private async deleteRemoteBranch(remoteName: string, branchName: string, token?: string): Promise<void> {
    const remote = await this.getRemoteDetails(remoteName)
    const pushUrl = remote?.push ?? null

    if (token && pushUrl?.startsWith('https://')) {
      await this.git.raw(['push', injectToken(pushUrl, token), '--delete', branchName])
      return
    }

    await this.git.raw(['push', remoteName, '--delete', branchName])
  }

  private async fetchRef(remoteName: string, branchName: string, token?: string): Promise<void> {
    const remote = await this.getRemoteDetails(remoteName)
    const fetchUrl = remote?.fetch ?? null

    if (token && fetchUrl?.startsWith('https://')) {
      await this.git.raw(['fetch', injectToken(fetchUrl, token), branchName])
      return
    }

    await this.git.fetch(remoteName, branchName)
  }

  private async hasHeadCommit(): Promise<boolean> {
    try {
      await this.git.revparse(['--verify', 'HEAD'])
      return true
    } catch {
      return false
    }
  }

  private async buildRestorePlan(commitHash: string): Promise<RestorePreview> {
    const diffRaw = await this.git.raw(['diff', '--name-status', '--find-renames', commitHash, 'HEAD'])
    const restoreSet = new Set<string>()
    const removeSet = new Set<string>()

    for (const line of diffRaw.split(/\r?\n/)) {
      const parsed = parseDiffLine(line.trim())
      if (!parsed || !parsed.path) continue

      const code = parsed.status[0]

      if (code === 'A') {
        removeSet.add(parsed.path)
        continue
      }

      if (code === 'R' || code === 'C') {
        removeSet.add(parsed.path)
        if (parsed.sourcePath) restoreSet.add(parsed.sourcePath)
        continue
      }

      restoreSet.add(parsed.path)
    }

    for (const removedPath of removeSet) {
      restoreSet.delete(removedPath)
    }

    return {
      files_to_restore: Array.from(restoreSet).sort(),
      files_to_remove: Array.from(removeSet).sort()
    }
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const listTrackedFilesPromise =
        'raw' in this.git && typeof this.git.raw === 'function'
          ? this.git.raw(['ls-files']).catch(() => '')
          : Promise.resolve('')

      const [raw, lsRaw] = await Promise.all([
        this.git.status(),
        listTrackedFilesPromise
      ])
      const tracked_files = lsRaw
        .split(/\r?\n/)
        .map(p => p.trim())
        .filter(Boolean)
      const status = parseStatus(raw)
      return { ...status, tracked_files }
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

  async previewPullUpdates(input: PullConfiguredTargetInput, limit = 20): Promise<PullUpdatesPreview> {
    try {
      await this.fetchRef(input.remoteName, input.branchName, input.token)

      const remoteRef = `${input.remoteName}/${input.branchName}`
      const currentBranch = await this.getCurrentBranchName()
      const hasHead = await this.hasHeadCommit()
      const range = hasHead ? `HEAD..${remoteRef}` : remoteRef
      const safeLimit = Math.max(1, Math.min(50, Math.floor(limit || 20)))
      const latestRemoteHash = (await this.git.revparse([remoteRef]).catch(() => '')).trim()

      const countRaw = await this.git.raw([
        'rev-list',
        '--count',
        range
      ])
      const behindCount = Number.parseInt(countRaw.trim(), 10) || 0

      if (behindCount <= 0) {
        return {
          remote_name: input.remoteName,
          branch_name: input.branchName,
          current_branch: currentBranch,
          behind_count: 0,
          latest_remote_hash: latestRemoteHash,
          commits: []
        }
      }

      const rawLog = await this.git.raw([
        'log',
        `--max-count=${safeLimit}`,
        '--date=iso-strict',
        '--pretty=format:%H%x1f%h%x1f%ad%x1f%an%x1f%s',
        range
      ])

      const commits: IncomingCommitInfo[] = rawLog
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [hash, shortHash, date, authorName, message] = line.split('\u001f')
          return {
            hash: hash ?? '',
            short_hash: shortHash ?? '',
            date: date ?? '',
            author_name: authorName ?? '',
            message: message ?? ''
          }
        })
        .filter((commit) => commit.hash && commit.short_hash)

      return {
        remote_name: input.remoteName,
        branch_name: input.branchName,
        current_branch: currentBranch,
        behind_count: behindCount,
        latest_remote_hash: latestRemoteHash,
        commits
      }
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

  async createBranch(
    name: string,
    options?: { remoteName?: string; token?: string; publishRemote?: boolean }
  ): Promise<BranchCreateResult> {
    try {
      await this.git.checkoutLocalBranch(name)

      const publishRemote = options?.publishRemote ?? false
      const remoteName = options?.remoteName?.trim() || 'origin'

      if (!publishRemote) {
        return {
          name,
          published: false,
          remote_name: null,
          publish_error: null
        }
      }

      const remote = await this.getRemoteDetails(remoteName)
      if (!remote) {
        return {
          name,
          published: false,
          remote_name: null,
          publish_error: `Remote "${remoteName}" is not configured.`
        }
      }

      try {
        await this.pushRef(remoteName, name, ['-u'], options?.token)
        return {
          name,
          published: true,
          remote_name: remoteName,
          publish_error: null
        }
      } catch (publishError) {
        const mapped = mapGitError(publishError)
        return {
          name,
          published: false,
          remote_name: remoteName,
          publish_error: mapped.message
        }
      }
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

  async mergeBranch(name: string): Promise<BranchMergeResult> {
    try {
      const targetBranch = await this.getCurrentBranchName()
      await this.git.merge([name])
      return {
        source_branch: name,
        target_branch: targetBranch
      }
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async deleteBranch(
    name: string,
    options?: { remoteName?: string; token?: string; deleteRemote?: boolean }
  ): Promise<BranchDeleteResult> {
    try {
      const remoteName = options?.remoteName?.trim() || 'origin'
      const protectedBranch = await this.getDefaultBranch(remoteName)
      if (protectedBranch && name === protectedBranch) {
        throw {
          code: 'UNKNOWN',
          message: `The "${protectedBranch}" branch is protected and cannot be deleted.`
        } satisfies GitError
      }

      await this.git.deleteLocalBranch(name, true)
      const currentBranch = await this.getCurrentBranchName()

      const deleteRemote = options?.deleteRemote ?? false

      if (!deleteRemote) {
        return {
          name,
          current_branch: currentBranch,
          local_deleted: true,
          remote_name: null,
          remote_deleted: false,
          remote_delete_error: null
        }
      }

      const remote = await this.getRemoteDetails(remoteName)
      if (!remote) {
        return {
          name,
          current_branch: currentBranch,
          local_deleted: true,
          remote_name: null,
          remote_deleted: false,
          remote_delete_error: `Remote "${remoteName}" is not configured.`
        }
      }

      try {
        await this.deleteRemoteBranch(remoteName, name, options?.token)
        return {
          name,
          current_branch: currentBranch,
          local_deleted: true,
          remote_name: remoteName,
          remote_deleted: true,
          remote_delete_error: null
        }
      } catch (remoteDeleteError) {
        const mapped = mapGitError(remoteDeleteError)
        return {
          name,
          current_branch: currentBranch,
          local_deleted: true,
          remote_name: remoteName,
          remote_deleted: false,
          remote_delete_error: mapped.message
        }
      }
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async deleteUntracked(paths: string[]): Promise<UntrackedDeleteResult> {
    try {
      const status = await this.git.status()
      const untracked = new Set(
        status.files
          .filter((file) => `${file.index}${file.working_dir}` === '??')
          .map((file) => file.path.replace(/\\/g, '/').replace(/\/+$/, ''))
      )

      let deleted = 0
      const failed: string[] = []

      for (const candidate of paths) {
        const normalized = candidate.replace(/\\/g, '/').replace(/\/+$/, '')

        if (!untracked.has(normalized)) {
          failed.push(normalized)
          continue
        }

        try {
          const absolutePath = resolveProjectPath(this.localPath, normalized)
          await rm(absolutePath, { recursive: true, force: true })
          deleted += 1
        } catch {
          failed.push(normalized)
        }
      }

      return { deleted, failed }
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

  async listTrackedFiles(): Promise<string[]> {
    try {
      const raw = await this.git.raw(['ls-files'])
      return raw.split(/\r?\n/).map(p => p.trim()).filter(Boolean)
    } catch (err) {
      console.error('[GAT] listTrackedFiles failed:', err)
      throw mapGitError(err)
    }
  }

  async init(): Promise<void> {
    try {
      await this.git.init()
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

  async getTimeline(limit = 120): Promise<TimelineCommitInfo[]> {
    try {
      const raw = await this.git.raw([
        'log',
        `--max-count=${limit}`,
        '--date=iso-strict',
        '--pretty=format:%H%x1f%h%x1f%ad%x1f%s',
        '--name-only'
      ])

      const commits: TimelineCommitInfo[] = []
      let current: TimelineCommitInfo | null = null

      for (const line of raw.split(/\r?\n/)) {
        if (!line.trim()) continue

        if (line.includes('\u001f')) {
          const [hash, short_hash, date, message] = line.split('\u001f')
          if (!hash || !short_hash || !date || message === undefined) continue

          current = {
            hash,
            short_hash,
            date,
            message,
            changed_files: []
          }
          commits.push(current)
          continue
        }

        current?.changed_files.push(line.trim())
      }

      for (const commit of commits) {
        commit.changed_files = Array.from(new Set(commit.changed_files))
      }

      return commits
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async getRestorePreview(commitHash: string): Promise<RestorePreview> {
    try {
      return await this.buildRestorePlan(commitHash)
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async restoreToCommit(commitHash: string): Promise<RestoreResult> {
    try {
      const [resolvedHash, plan] = await Promise.all([
        this.git.revparse([commitHash]),
        this.buildRestorePlan(commitHash)
      ])
      const cleanHash = resolvedHash.trim()
      const backupBranch = buildBackupBranchName(cleanHash)

      await this.git.raw(['branch', backupBranch, 'HEAD'])

      for (const group of chunk(plan.files_to_remove, 150)) {
        await this.git.raw(['rm', '-f', '--ignore-unmatch', '--', ...group])
      }

      for (const group of chunk(plan.files_to_restore, 150)) {
        await this.git.raw([
          'restore',
          `--source=${cleanHash}`,
          '--staged',
          '--worktree',
          '--',
          ...group
        ])
      }

      return {
        backup_branch: backupBranch,
        restored_files: plan.files_to_restore.length,
        removed_files: plan.files_to_remove.length
      }
    } catch (err) {
      throw mapGitError(err)
    }
  }
}
