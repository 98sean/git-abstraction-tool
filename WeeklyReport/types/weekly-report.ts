// WeeklyReport/types/weekly-report.ts
// 통합 시 src/renderer/src/types.ts 및 src/main/git/types.ts에 병합

export interface WeeklyCommitFile {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed'
  insertions: number
  deletions: number
}

export interface WeeklyCommit {
  hash: string
  date: string            // ISO 8601
  message: string
  files: WeeklyCommitFile[]
}

export interface WeeklyReportSummary {
  totalCommits: number
  filesAdded: number
  filesModified: number
  filesDeleted: number
  totalInsertions: number
  totalDeletions: number
}

export interface DailyBreakdown {
  date: string            // YYYY-MM-DD
  dayOfWeek: string       // 월, 화, 수, 목, 금, 토, 일
  commitCount: number
}

export interface WeeklyReport {
  projectId: string
  projectName: string
  startDate: string       // 주 시작일 (월요일), YYYY-MM-DD
  endDate: string         // 주 종료일 (일요일), YYYY-MM-DD
  summary: WeeklyReportSummary
  dailyBreakdown: DailyBreakdown[]
  commits: WeeklyCommit[] // 최신순 정렬
}
