import simpleGit, { SimpleGit } from 'simple-git'
import {
  DailyBreakdown,
  WeeklyCommit,
  WeeklyCommitFile,
  WeeklyReport,
  WeeklyReportSummary
} from './types'

const COMMIT_MARKER = 'GWEEKLY:'
const DAY_NAMES_KO = ['일', '월', '화', '수', '목', '금', '토']

export function parseNameStatus(raw: string): Map<string, WeeklyCommit> {
  const commits = new Map<string, WeeklyCommit>()
  let current: WeeklyCommit | null = null

  for (const line of raw.split('\n')) {
    if (line.startsWith(COMMIT_MARKER)) {
      const body = line.slice(COMMIT_MARKER.length)
      const [hash, date, ...msgParts] = body.split('\t')
      current = {
        hash: hash.trim(),
        date: date?.trim() ?? '',
        message: msgParts.join('\t').trim(),
        files: []
      }
      commits.set(current.hash, current)
      continue
    }

    if (!current || !line.trim()) continue

    const parts = line.split('\t')
    const statusCode = parts[0].trim()
    if (!statusCode) continue

    const status = mapNameStatus(statusCode)
    const path = (statusCode.startsWith('R') && parts[2] ? parts[2] : parts[1] ?? '').trim()
    if (!path) continue

    current.files.push({ path, status, insertions: 0, deletions: 0 })
  }

  return commits
}

export function mergeNumstat(commits: Map<string, WeeklyCommit>, raw: string): void {
  let currentHash = ''

  for (const line of raw.split('\n')) {
    if (line.startsWith(COMMIT_MARKER)) {
      currentHash = line.slice(COMMIT_MARKER.length).trim()
      continue
    }

    if (!currentHash || !line.trim()) continue

    const parts = line.split('\t')
    if (parts.length < 3) continue

    const insertions = parseInt(parts[0]) || 0
    const deletions = parseInt(parts[1]) || 0
    const filePath = parts[2].trim()

    const commit = commits.get(currentHash)
    if (!commit) continue

    const file =
      commit.files.find((f) => f.path === filePath) ??
      commit.files.find((f) => filePath.endsWith(f.path) || f.path.endsWith(filePath))

    if (file) {
      file.insertions = insertions
      file.deletions = deletions
    }
  }
}

export function mapNameStatus(code: string): WeeklyCommitFile['status'] {
  if (code === 'A') return 'added'
  if (code === 'D') return 'deleted'
  if (code.startsWith('R')) return 'renamed'
  return 'modified'
}

export function buildSummary(commits: WeeklyCommit[]): WeeklyReportSummary {
  let filesAdded = 0
  let filesModified = 0
  let filesDeleted = 0
  let totalInsertions = 0
  let totalDeletions = 0

  for (const commit of commits) {
    for (const file of commit.files) {
      if (file.status === 'added') filesAdded++
      else if (file.status === 'deleted') filesDeleted++
      else filesModified++
      totalInsertions += file.insertions
      totalDeletions += file.deletions
    }
  }

  return { totalCommits: commits.length, filesAdded, filesModified, filesDeleted, totalInsertions, totalDeletions }
}

export function buildDailyBreakdown(commits: WeeklyCommit[], startDate: string): DailyBreakdown[] {
  const countByDate: Record<string, number> = {}
  for (const commit of commits) {
    const date = commit.date.slice(0, 10)
    countByDate[date] = (countByDate[date] ?? 0) + 1
  }

  const breakdown: DailyBreakdown[] = []
  const start = new Date(`${startDate}T00:00:00`)

  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    breakdown.push({
      date: dateStr,
      dayOfWeek: DAY_NAMES_KO[d.getDay()],
      commitCount: countByDate[dateStr] ?? 0
    })
  }

  return breakdown
}

export class GitWeeklyService {
  private git: SimpleGit

  constructor(localPath: string) {
    this.git = simpleGit(localPath)
  }

  async getWeeklyLog(
    startDate: string,
    endDate: string,
    projectId: string,
    projectName: string
  ): Promise<WeeklyReport> {
    const sinceArg = `${startDate} 00:00:00`
    const untilArg = `${endDate} 23:59:59`
    const formatArg = `--format=${COMMIT_MARKER}%H\t%aI\t%s`

    const nameStatusRaw = await this.git.raw([
      'log', `--since=${sinceArg}`, `--until=${untilArg}`, formatArg, '--name-status'
    ])

    const numstatRaw = await this.git.raw([
      'log', `--since=${sinceArg}`, `--until=${untilArg}`, `--format=${COMMIT_MARKER}%H`, '--numstat'
    ])

    const commitMap = parseNameStatus(nameStatusRaw)
    mergeNumstat(commitMap, numstatRaw)

    const commits = Array.from(commitMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return {
      projectId,
      projectName,
      startDate,
      endDate,
      summary: buildSummary(commits),
      dailyBreakdown: buildDailyBreakdown(commits, startDate),
      commits
    }
  }
}
