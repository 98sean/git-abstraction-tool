// WeeklyReport/main/git-weekly-service.ts
// 통합 시 src/main/git/service.ts 의 GitService 클래스에 메서드로 추가하거나
// src/main/git/weekly-service.ts 로 이동

import simpleGit, { SimpleGit } from 'simple-git'
import {
  DailyBreakdown,
  WeeklyCommit,
  WeeklyCommitFile,
  WeeklyReport,
  WeeklyReportSummary
} from '../types/weekly-report'

const COMMIT_MARKER = 'GWEEKLY:'
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── 순수 파싱 함수 (테스트 가능하도록 export) ────────────────────────────────

/**
 * `git log --format="GWEEKLY:%H<TAB>%aI<TAB>%s" --name-status` 출력을 파싱한다.
 * 반환값: hash → WeeklyCommit Map (insertions/deletions = 0, numstat로 채워야 함)
 */
export function parseNameStatus(raw: string): Map<string, WeeklyCommit> {
  const commits = new Map<string, WeeklyCommit>()
  let current: WeeklyCommit | null = null

  for (const line of raw.split('\n')) {
    if (line.startsWith(COMMIT_MARKER)) {
      // "GWEEKLY:hash\tdate\tmessage" 파싱
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

    // name-status 라인: "M\tpath", "A\tpath", "D\tpath", "R100\told\tnew"
    const parts = line.split('\t')
    const statusCode = parts[0].trim()
    if (!statusCode) continue

    const status = mapNameStatus(statusCode)
    // rename의 경우 새 경로(parts[2])를, 나머지는 parts[1]을 사용
    const path = (statusCode.startsWith('R') && parts[2] ? parts[2] : parts[1] ?? '').trim()
    if (!path) continue

    current.files.push({ path, status, insertions: 0, deletions: 0 })
  }

  return commits
}

/**
 * `git log --format="GWEEKLY:%H" --numstat` 출력을 파싱하여
 * parseNameStatus 결과 Map의 insertions/deletions를 채운다.
 */
export function mergeNumstat(commits: Map<string, WeeklyCommit>, raw: string): void {
  let currentHash = ''

  for (const line of raw.split('\n')) {
    if (line.startsWith(COMMIT_MARKER)) {
      currentHash = line.slice(COMMIT_MARKER.length).trim()
      continue
    }

    if (!currentHash || !line.trim()) continue

    // numstat 라인: "<insertions>\t<deletions>\t<path>"
    // 바이너리 파일은 "-\t-\t<path>" 형태
    const parts = line.split('\t')
    if (parts.length < 3) continue

    const insertions = parseInt(parts[0]) || 0
    const deletions = parseInt(parts[1]) || 0
    const filePath = parts[2].trim()

    const commit = commits.get(currentHash)
    if (!commit) continue

    // rename 시 numstat path가 "old => new" 형태일 수 있으므로 suffix 매칭도 시도
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
  return 'modified' // M, C, T 등
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
      else filesModified++ // modified, renamed
      totalInsertions += file.insertions
      totalDeletions += file.deletions
    }
  }

  return {
    totalCommits: commits.length,
    filesAdded,
    filesModified,
    filesDeleted,
    totalInsertions,
    totalDeletions
  }
}

export function buildDailyBreakdown(
  commits: WeeklyCommit[],
  startDate: string // YYYY-MM-DD, 월요일
): DailyBreakdown[] {
  const countByDate: Record<string, number> = {}
  for (const commit of commits) {
    const date = commit.date.slice(0, 10) // YYYY-MM-DD
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
      dayOfWeek: DAY_NAMES[d.getDay()],
      commitCount: countByDate[dateStr] ?? 0
    })
  }

  return breakdown
}

// ─── GitWeeklyService 클래스 ──────────────────────────────────────────────────

export class GitWeeklyService {
  private git: SimpleGit

  constructor(localPath: string) {
    this.git = simpleGit(localPath)
  }

  async getWeeklyLog(
    startDate: string, // YYYY-MM-DD
    endDate: string,   // YYYY-MM-DD
    projectId: string,
    projectName: string
  ): Promise<WeeklyReport> {
    const sinceArg = `${startDate} 00:00:00`
    const untilArg = `${endDate} 23:59:59`
    const formatArg = `--format=${COMMIT_MARKER}%H\t%aI\t%s`

    // Call 1: 파일 상태(추가/수정/삭제/이름변경) 조회
    const nameStatusRaw = await this.git.raw([
      'log',
      `--since=${sinceArg}`,
      `--until=${untilArg}`,
      formatArg,
      '--name-status'
    ])

    // Call 2: 줄 수(insertions/deletions) 조회
    const numstatRaw = await this.git.raw([
      'log',
      `--since=${sinceArg}`,
      `--until=${untilArg}`,
      `--format=${COMMIT_MARKER}%H`,
      '--numstat'
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
