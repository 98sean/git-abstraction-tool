// WeeklyReport/preview/src/fixtures.ts
// 실제 git log 기반 — 브라우저 기준 주간 범위 (UTC-7 환경, 월요일 시작)
//
// 실제 커밋 분포:
//   이번 주  2026-04-13(월) ~ 04-19(일): 3커밋 (모두 04-13 월요일)
//   지난 주  2026-04-06(월) ~ 04-12(일): 1커밋 (04-08 수요일)
//   2주 전   2026-03-30(월) ~ 04-05(일): 1커밋 (04-02 목요일)

import { WeeklyReport } from '../../types/weekly-report'

// ─── 이번 주 (2026-04-13 월 ~ 04-19 일) ──────────────────────────────────────

export const DUMMY_REPORT_THIS_WEEK: WeeklyReport = {
  projectId: 'preview-001',
  projectName: 'git-abstraction-tool',
  startDate: '2026-04-13',
  endDate:   '2026-04-19',
  summary: {
    totalCommits: 3,
    filesAdded:   19,  // 7 + 1 + 11
    filesModified: 1,  // WeeklyReport.css 수정
    filesDeleted:  0,
    totalInsertions: 1808, // 441 + 8 + 1359
    totalDeletions:    22  // WeeklyReport.css -22
  },
  dailyBreakdown: [
    { date: '2026-04-13', dayOfWeek: '월', commitCount: 3 },
    { date: '2026-04-14', dayOfWeek: '화', commitCount: 0 },
    { date: '2026-04-15', dayOfWeek: '수', commitCount: 0 },
    { date: '2026-04-16', dayOfWeek: '목', commitCount: 0 },
    { date: '2026-04-17', dayOfWeek: '금', commitCount: 0 },
    { date: '2026-04-18', dayOfWeek: '토', commitCount: 0 },
    { date: '2026-04-19', dayOfWeek: '일', commitCount: 0 }
  ],
  commits: [
    // 48c6f7d — 2026-04-13 01:33 (월)
    {
      hash: '48c6f7d',
      date: '2026-04-13T01:33:12-07:00',
      message: 'feat: add standalone browser preview for WeeklyReport dashboard',
      files: [
        { path: 'WeeklyReport/preview/index.html',          status: 'added',    insertions: 12,  deletions: 0  },
        { path: 'WeeklyReport/preview/src/App.tsx',         status: 'added',    insertions: 40,  deletions: 0  },
        { path: 'WeeklyReport/preview/src/fixtures.ts',     status: 'added',    insertions: 182, deletions: 0  },
        { path: 'WeeklyReport/preview/src/main.tsx',        status: 'added',    insertions: 15,  deletions: 0  },
        { path: 'WeeklyReport/preview/src/mockIpc.ts',      status: 'added',    insertions: 45,  deletions: 0  },
        { path: 'WeeklyReport/preview/src/preview.css',     status: 'added',    insertions: 121, deletions: 0  },
        { path: 'WeeklyReport/preview/vite.config.ts',      status: 'added',    insertions: 11,  deletions: 0  },
        { path: 'WeeklyReport/renderer/components/WeeklyReport.css', status: 'modified', insertions: 15, deletions: 22 }
      ]
    },
    // 5ce6be1 — 2026-04-13 01:27 (월)
    {
      hash: '5ce6be1',
      date: '2026-04-13T01:27:57-07:00',
      message: 'chore: add vitest config for WeeklyReport tests',
      files: [
        { path: 'WeeklyReport/vitest.config.ts', status: 'added', insertions: 8, deletions: 0 }
      ]
    },
    // c74ac7a — 2026-04-13 01:16 (월)
    {
      hash: 'c74ac7a',
      date: '2026-04-13T01:16:47-07:00',
      message: 'feat: add weekly report feature (Phase 1)',
      files: [
        { path: 'WeeklyReport/main/git-weekly-service.ts',           status: 'added', insertions: 214, deletions: 0 },
        { path: 'WeeklyReport/main/ipc-weekly.ts',                   status: 'added', insertions: 87,  deletions: 0 },
        { path: 'WeeklyReport/renderer/components/CommitList.tsx',    status: 'added', insertions: 96,  deletions: 0 },
        { path: 'WeeklyReport/renderer/components/DailyTimeline.tsx', status: 'added', insertions: 41,  deletions: 0 },
        { path: 'WeeklyReport/renderer/components/SummaryCards.tsx',  status: 'added', insertions: 50,  deletions: 0 },
        { path: 'WeeklyReport/renderer/components/WeekNavigator.tsx', status: 'added', insertions: 55,  deletions: 0 },
        { path: 'WeeklyReport/renderer/components/WeeklyReport.css',  status: 'added', insertions: 370, deletions: 0 },
        { path: 'WeeklyReport/renderer/components/WeeklyReport.tsx',  status: 'added', insertions: 71,  deletions: 0 },
        { path: 'WeeklyReport/renderer/hooks/useWeeklyReport.ts',     status: 'added', insertions: 116, deletions: 0 },
        { path: 'WeeklyReport/tests/weekly-report.test.ts',           status: 'added', insertions: 218, deletions: 0 },
        { path: 'WeeklyReport/types/weekly-report.ts',                status: 'added', insertions: 41,  deletions: 0 }
      ]
    }
  ]
}

// ─── 지난 주 (2026-04-06 월 ~ 04-12 일) ──────────────────────────────────────

export const DUMMY_REPORT_LAST_WEEK: WeeklyReport = {
  projectId: 'preview-001',
  projectName: 'git-abstraction-tool',
  startDate: '2026-04-06',
  endDate:   '2026-04-12',
  summary: {
    totalCommits: 1,
    filesAdded:   0,
    filesModified: 9,
    filesDeleted:  0,
    totalInsertions: 352,
    totalDeletions:   40
  },
  dailyBreakdown: [
    { date: '2026-04-06', dayOfWeek: '월', commitCount: 0 },
    { date: '2026-04-07', dayOfWeek: '화', commitCount: 0 },
    { date: '2026-04-08', dayOfWeek: '수', commitCount: 1 },
    { date: '2026-04-09', dayOfWeek: '목', commitCount: 0 },
    { date: '2026-04-10', dayOfWeek: '금', commitCount: 0 },
    { date: '2026-04-11', dayOfWeek: '토', commitCount: 0 },
    { date: '2026-04-12', dayOfWeek: '일', commitCount: 0 }
  ],
  commits: [
    // b3cf353 — 2026-04-08 15:36 (수)
    {
      hash: 'b3cf353',
      date: '2026-04-08T15:36:09-07:00',
      message: 'Enabled push and pull',
      files: [
        { path: 'src/main/git/index.ts',                                              status: 'modified', insertions: 1,   deletions: 0  },
        { path: 'src/main/git/service.ts',                                            status: 'modified', insertions: 1,   deletions: 0  },
        { path: 'src/main/ipc/auth.ts',                                               status: 'modified', insertions: 118, deletions: 4  },
        { path: 'src/main/ipc/git.ts',                                                status: 'modified', insertions: 16,  deletions: 10 },
        { path: 'src/renderer/src/App.tsx',                                           status: 'modified', insertions: 11,  deletions: 2  },
        { path: 'src/renderer/src/components/ActionPanel/ActionPanel.tsx',            status: 'modified', insertions: 15,  deletions: 2  },
        { path: 'src/renderer/src/components/ConnectGitHub/ConnectGitHub.module.css', status: 'modified', insertions: 72,  deletions: 0  },
        { path: 'src/renderer/src/components/ConnectGitHub/ConnectGitHub.tsx',        status: 'modified', insertions: 70,  deletions: 20 },
        { path: 'src/renderer/src/hooks/useAuth.ts',                                  status: 'modified', insertions: 48,  deletions: 2  }
      ]
    }
  ]
}

// ─── 2주 전 (2026-03-30 월 ~ 04-05 일) ───────────────────────────────────────

export const DUMMY_REPORT_TWO_WEEKS_AGO: WeeklyReport = {
  projectId: 'preview-001',
  projectName: 'git-abstraction-tool',
  startDate: '2026-03-30',
  endDate:   '2026-04-05',
  summary: {
    totalCommits: 1,
    filesAdded:   57,
    filesModified: 0,
    filesDeleted:  0,
    totalInsertions: 10951,
    totalDeletions:      0
  },
  dailyBreakdown: [
    { date: '2026-03-30', dayOfWeek: '월', commitCount: 0 },
    { date: '2026-03-31', dayOfWeek: '화', commitCount: 0 },
    { date: '2026-04-01', dayOfWeek: '수', commitCount: 0 },
    { date: '2026-04-02', dayOfWeek: '목', commitCount: 1 },
    { date: '2026-04-03', dayOfWeek: '금', commitCount: 0 },
    { date: '2026-04-04', dayOfWeek: '토', commitCount: 0 },
    { date: '2026-04-05', dayOfWeek: '일', commitCount: 0 }
  ],
  commits: [
    // 2754509 — 2026-04-02 21:41 (목)
    {
      hash: '2754509',
      date: '2026-04-02T21:41:17-07:00',
      message: 'First draft',
      files: [
        { path: '.claude/settings.local.json',                                       status: 'added', insertions: 11,   deletions: 0 },
        { path: '.claude/skills/gat-db/SKILL.md',                                    status: 'added', insertions: 129,  deletions: 0 },
        { path: '.claude/skills/gat-ui/SKILL.md',                                    status: 'added', insertions: 106,  deletions: 0 },
        { path: '.gitignore',                                                        status: 'added', insertions: 27,   deletions: 0 },
        { path: 'README.md',                                                         status: 'added', insertions: 226,  deletions: 0 },
        { path: 'electron-builder.yml',                                              status: 'added', insertions: 44,   deletions: 0 },
        { path: 'electron.vite.config.ts',                                           status: 'added', insertions: 20,   deletions: 0 },
        { path: 'package-lock.json',                                                 status: 'added', insertions: 7656, deletions: 0 },
        { path: 'package.json',                                                      status: 'added', insertions: 39,   deletions: 0 },
        { path: 'src/main/db/credentials.ts',                                        status: 'added', insertions: 43,   deletions: 0 },
        { path: 'src/main/db/preferences.ts',                                        status: 'added', insertions: 27,   deletions: 0 },
        { path: 'src/main/db/projects.ts',                                           status: 'added', insertions: 49,   deletions: 0 },
        { path: 'src/main/db/statusCache.ts',                                        status: 'added', insertions: 32,   deletions: 0 },
        { path: 'src/main/git/__tests__/errors.test.ts',                             status: 'added', insertions: 56,   deletions: 0 },
        { path: 'src/main/git/errors.ts',                                            status: 'added', insertions: 60,   deletions: 0 },
        { path: 'src/main/git/index.ts',                                             status: 'added', insertions: 23,   deletions: 0 },
        { path: 'src/main/git/service.ts',                                           status: 'added', insertions: 180,  deletions: 0 },
        { path: 'src/main/git/types.ts',                                             status: 'added', insertions: 58,   deletions: 0 },
        { path: 'src/main/index.ts',                                                 status: 'added', insertions: 53,   deletions: 0 },
        { path: 'src/main/ipc/auth.ts',                                              status: 'added', insertions: 19,   deletions: 0 },
        { path: 'src/main/ipc/dialog.ts',                                            status: 'added', insertions: 14,   deletions: 0 },
        { path: 'src/main/ipc/git.ts',                                               status: 'added', insertions: 79,   deletions: 0 },
        { path: 'src/main/ipc/index.ts',                                             status: 'added', insertions: 15,   deletions: 0 },
        { path: 'src/main/ipc/preferences.ts',                                       status: 'added', insertions: 15,   deletions: 0 },
        { path: 'src/main/ipc/projects.ts',                                          status: 'added', insertions: 31,   deletions: 0 },
        { path: 'src/main/ipc/status.ts',                                            status: 'added', insertions: 12,   deletions: 0 },
        { path: 'src/main/watcher/index.ts',                                         status: 'added', insertions: 57,   deletions: 0 },
        { path: 'src/preload/index.d.ts',                                            status: 'added', insertions: 7,    deletions: 0 },
        { path: 'src/preload/index.ts',                                              status: 'added', insertions: 15,   deletions: 0 },
        { path: 'src/renderer/index.html',                                           status: 'added', insertions: 16,   deletions: 0 },
        { path: 'src/renderer/src/App.module.css',                                   status: 'added', insertions: 82,   deletions: 0 },
        { path: 'src/renderer/src/App.tsx',                                          status: 'added', insertions: 164,  deletions: 0 },
        { path: 'src/renderer/src/components/ActionPanel/ActionPanel.module.css',    status: 'added', insertions: 107,  deletions: 0 },
        { path: 'src/renderer/src/components/ActionPanel/ActionPanel.tsx',           status: 'added', insertions: 126,  deletions: 0 },
        { path: 'src/renderer/src/components/ConnectGitHub/ConnectGitHub.module.css',status: 'added', insertions: 93,   deletions: 0 },
        { path: 'src/renderer/src/components/ConnectGitHub/ConnectGitHub.tsx',       status: 'added', insertions: 67,   deletions: 0 },
        { path: 'src/renderer/src/components/FileManager/FileItem.tsx',              status: 'added', insertions: 49,   deletions: 0 },
        { path: 'src/renderer/src/components/FileManager/FileManager.module.css',    status: 'added', insertions: 126,  deletions: 0 },
        { path: 'src/renderer/src/components/FileManager/FileManager.tsx',           status: 'added', insertions: 96,   deletions: 0 },
        { path: 'src/renderer/src/components/Sidebar/Sidebar.module.css',            status: 'added', insertions: 125,  deletions: 0 },
        { path: 'src/renderer/src/components/Sidebar/Sidebar.tsx',                   status: 'added', insertions: 91,   deletions: 0 },
        { path: 'src/renderer/src/components/shared/Spinner.tsx',                    status: 'added', insertions: 11,   deletions: 0 },
        { path: 'src/renderer/src/components/shared/Toast.tsx',                      status: 'added', insertions: 23,   deletions: 0 },
        { path: 'src/renderer/src/components/shared/shared.module.css',              status: 'added', insertions: 58,   deletions: 0 },
        { path: 'src/renderer/src/context/AppContext.tsx',                           status: 'added', insertions: 85,   deletions: 0 },
        { path: 'src/renderer/src/env.d.ts',                                         status: 'added', insertions: 1,    deletions: 0 },
        { path: 'src/renderer/src/hooks/useAuth.ts',                                 status: 'added', insertions: 37,   deletions: 0 },
        { path: 'src/renderer/src/hooks/useFileStatus.ts',                           status: 'added', insertions: 87,   deletions: 0 },
        { path: 'src/renderer/src/hooks/useGitActions.ts',                           status: 'added', insertions: 56,   deletions: 0 },
        { path: 'src/renderer/src/hooks/usePreferences.ts',                          status: 'added', insertions: 24,   deletions: 0 },
        { path: 'src/renderer/src/hooks/useProjects.ts',                             status: 'added', insertions: 59,   deletions: 0 },
        { path: 'src/renderer/src/hooks/useToast.ts',                                status: 'added', insertions: 18,   deletions: 0 },
        { path: 'src/renderer/src/index.css',                                        status: 'added', insertions: 98,   deletions: 0 },
        { path: 'src/renderer/src/ipc.ts',                                           status: 'added', insertions: 15,   deletions: 0 },
        { path: 'src/renderer/src/main.tsx',                                         status: 'added', insertions: 10,   deletions: 0 },
        { path: 'src/renderer/src/types.ts',                                         status: 'added', insertions: 77,   deletions: 0 },
        { path: 'tsconfig.json',                                                     status: 'added', insertions: 7,    deletions: 0 },
        { path: 'tsconfig.node.json',                                                status: 'added', insertions: 14,   deletions: 0 },
        { path: 'tsconfig.web.json',                                                 status: 'added', insertions: 18,   deletions: 0 },
        { path: 'vitest.config.ts',                                                  status: 'added', insertions: 8,    deletions: 0 }
      ]
    }
  ]
}

// ─── 빈 주 (그 이전) ─────────────────────────────────────────────────────────

export const DUMMY_REPORT_EMPTY: WeeklyReport = {
  projectId: 'preview-001',
  projectName: 'git-abstraction-tool',
  startDate: '2026-03-23',
  endDate:   '2026-03-29',
  summary: { totalCommits: 0, filesAdded: 0, filesModified: 0, filesDeleted: 0, totalInsertions: 0, totalDeletions: 0 },
  dailyBreakdown: [
    { date: '2026-03-23', dayOfWeek: '월', commitCount: 0 },
    { date: '2026-03-24', dayOfWeek: '화', commitCount: 0 },
    { date: '2026-03-25', dayOfWeek: '수', commitCount: 0 },
    { date: '2026-03-26', dayOfWeek: '목', commitCount: 0 },
    { date: '2026-03-27', dayOfWeek: '금', commitCount: 0 },
    { date: '2026-03-28', dayOfWeek: '토', commitCount: 0 },
    { date: '2026-03-29', dayOfWeek: '일', commitCount: 0 }
  ],
  commits: []
}
