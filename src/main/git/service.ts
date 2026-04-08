import simpleGit, { SimpleGit, StatusResult } from 'simple-git'
import {
  BranchInfo,
  CommitInfo,
  FileStatus,
  FileStatusCode,
  GitStatus
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

export class GitService {
  private git: SimpleGit

  constructor(local_path: string) {
    this.git = simpleGit(local_path)
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
