import simpleGit, { SimpleGit, StatusResult } from 'simple-git'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import {
  BranchInfo,
  CommitInfo,
  FileStatus,
  FileStatusCode,
  GitStatus,
  RestorePreview,
  RestoreResult,
  TimelineCommitInfo,
  UntrackedDeleteResult
} from './types'
import { mapGitError } from './errors'

function mapStatusCode(index: string, working: string): { code: FileStatusCode; staged: boolean } {
  // Conflict codes: DD, AU, UD, UA, DU, AA, UU
  const conflictCodes = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'])
  const combined = `${index}${working}`
  if (combined === '??' ) return { code: 'untracked', staged: false }
  if (conflictCodes.has(combined)) return { code: 'conflicted', staged: false }
  if (index !== ' ' && index !== '?') {
    // Staged
    if (index === 'A') return { code: 'new', staged: true }
    if (index === 'M') return { code: 'modified', staged: true }
    if (index === 'D') return { code: 'deleted', staged: true }
    if (index === 'R') return { code: 'renamed', staged: true }
  }
  // Unstaged
  if (working === 'M') return { code: 'modified', staged: false }
  if (working === 'D') return { code: 'deleted', staged: false }
  return { code: 'modified', staged: false }
}

function parseStatus(raw: StatusResult): GitStatus {
  const files: FileStatus[] = raw.files.map((f) => {
    const { code, staged } = mapStatusCode(f.index, f.working_dir)
    return {
      path: f.path,
      status: code,
      staged,
      oldPath: f.from || undefined
    }
  })

  return {
    current_branch: raw.current ?? 'HEAD',
    files,
    tracked_files: [],
    ahead: raw.ahead,
    behind: raw.behind,
    has_conflicts: files.some((f) => f.status === 'conflicted'),
    is_clean: raw.isClean()
  }
}

// Inject a token into an HTTPS remote URL without writing to git config
function injectToken(url: string, token: string): string {
  return url.replace(/^https:\/\//, `https://oauth2:${token}@`)
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

  const path = (parts[1] ?? '').trim()
  if (!path) return null
  return {
    status,
    path
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

function buildBackupBranchName(commitHash: string): string {
  const ts = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
  return `gat-backup/${ts}-${commitHash.slice(0, 7)}`
}

function resolveProjectPath(projectRoot: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/')
  const absolute = path.resolve(projectRoot, normalized)
  const rel = path.relative(projectRoot, absolute)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Invalid path outside project root.')
  }
  return absolute
}

export class GitService {
  private git: SimpleGit
  private rootPath: string

  constructor(local_path: string) {
    this.rootPath = local_path
    this.git = simpleGit(local_path)
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
      const [raw, lsRaw] = await Promise.all([
        this.git.status(),
        this.git.raw(['ls-files']).catch(() => '')
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

  async push(token?: string): Promise<void> {
    try {
      if (token) {
        const remotes = await this.git.getRemotes(true)
        const pushUrl = remotes.find((r) => r.name === 'origin')?.refs?.push
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
        const fetchUrl = remotes.find((r) => r.name === 'origin')?.refs?.fetch
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
      return Object.entries(summary.branches).map(([name, b]) => ({
        name: b.name,
        current: b.current,
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

  async deleteBranch(name: string): Promise<void> {
    try {
      // Force-delete to make cleanup of backup/test branches predictable.
      await this.git.deleteLocalBranch(name, true)
    } catch (err) {
      throw mapGitError(err)
    }
  }

  async deleteUntracked(paths: string[]): Promise<UntrackedDeleteResult> {
    try {
      const status = await this.git.status()
      const untracked = new Set(
        status.files
          .filter((f) => `${f.index}${f.working_dir}` === '??')
          .map((f) => f.path.replace(/\\/g, '/').replace(/\/+$/, ''))
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
          const absolute = resolveProjectPath(this.rootPath, normalized)
          await rm(absolute, { recursive: true, force: true })
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

        if (current) current.changed_files.push(line.trim())
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

      for (const paths of chunk(plan.files_to_remove, 150)) {
        await this.git.raw(['rm', '-f', '--ignore-unmatch', '--', ...paths])
      }

      for (const paths of chunk(plan.files_to_restore, 150)) {
        await this.git.raw([
          'restore',
          `--source=${cleanHash}`,
          '--staged',
          '--worktree',
          '--',
          ...paths
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
