// WeeklyReport/preview/src/fixtures.ts
// 브라우저 미리보기용 더미 데이터

import { WeeklyReport } from '../../types/weekly-report'

// 현재 주 (2026-04-07 월 ~ 2026-04-13 일) 기준 더미 데이터
export const DUMMY_REPORT_THIS_WEEK: WeeklyReport = {
  projectId: 'preview-001',
  projectName: '내 소설 프로젝트',
  startDate: '2026-04-07',
  endDate:   '2026-04-13',
  summary: {
    totalCommits: 8,
    filesAdded: 4,
    filesModified: 11,
    filesDeleted: 2,
    totalInsertions: 412,
    totalDeletions: 97
  },
  dailyBreakdown: [
    { date: '2026-04-07', dayOfWeek: '월', commitCount: 2 },
    { date: '2026-04-08', dayOfWeek: '화', commitCount: 1 },
    { date: '2026-04-09', dayOfWeek: '수', commitCount: 3 },
    { date: '2026-04-10', dayOfWeek: '목', commitCount: 0 },
    { date: '2026-04-11', dayOfWeek: '금', commitCount: 2 },
    { date: '2026-04-12', dayOfWeek: '토', commitCount: 0 },
    { date: '2026-04-13', dayOfWeek: '일', commitCount: 0 }
  ],
  commits: [
    {
      hash: 'f3a91bc',
      date: '2026-04-11T17:05:00+09:00',
      message: '5장 결말 장면 대폭 수정',
      files: [
        { path: 'chapters/chapter-05.md',       status: 'modified', insertions: 82, deletions: 34 },
        { path: 'chapters/chapter-05-draft.md',  status: 'deleted',  insertions: 0,  deletions: 210 },
        { path: 'outline/story-arc.md',          status: 'modified', insertions: 15, deletions: 7  }
      ]
    },
    {
      hash: 'c7d42e1',
      date: '2026-04-11T10:30:00+09:00',
      message: '등장인물 프로필 시트 추가',
      files: [
        { path: 'characters/protagonist.md',     status: 'added',    insertions: 64, deletions: 0  },
        { path: 'characters/antagonist.md',      status: 'added',    insertions: 51, deletions: 0  },
        { path: 'characters/README.md',          status: 'modified', insertions: 8,  deletions: 2  }
      ]
    },
    {
      hash: 'b1e88a4',
      date: '2026-04-09T21:15:00+09:00',
      message: '3장 도입부 리듬 다듬기',
      files: [
        { path: 'chapters/chapter-03.md',        status: 'modified', insertions: 29, deletions: 18 }
      ]
    },
    {
      hash: 'a09f3c7',
      date: '2026-04-09T15:42:00+09:00',
      message: '세계관 설정 파일 이름 변경 및 내용 보강',
      files: [
        { path: 'world/world-building.md',       status: 'renamed',  insertions: 43, deletions: 11 },
        { path: 'world/magic-system.md',         status: 'modified', insertions: 27, deletions: 5  }
      ]
    },
    {
      hash: '98c120d',
      date: '2026-04-09T09:08:00+09:00',
      message: '플롯 타임라인 초안 작성',
      files: [
        { path: 'outline/timeline.md',           status: 'added',    insertions: 73, deletions: 0  },
        { path: 'outline/story-arc.md',          status: 'modified', insertions: 19, deletions: 8  }
      ]
    },
    {
      hash: '74be5f2',
      date: '2026-04-08T23:50:00+09:00',
      message: '6장 첫 문단 초고 작성',
      files: [
        { path: 'chapters/chapter-06.md',        status: 'added',    insertions: 38, deletions: 0  }
      ]
    },
    {
      hash: '5d3a8e9',
      date: '2026-04-07T19:22:00+09:00',
      message: '2장 대화 흐름 개선 및 오탈자 수정',
      files: [
        { path: 'chapters/chapter-02.md',        status: 'modified', insertions: 22, deletions: 10 },
        { path: 'chapters/chapter-02-notes.md',  status: 'deleted',  insertions: 0,  deletions: 45 }
      ]
    },
    {
      hash: '2c7f1a0',
      date: '2026-04-07T11:04:00+09:00',
      message: '프로젝트 폴더 구조 정리',
      files: [
        { path: 'README.md',                     status: 'modified', insertions: 31, deletions: 4  },
        { path: '.gitignore',                    status: 'modified', insertions: 10, deletions: 2  }
      ]
    }
  ]
}

// 이전 주 (2026-03-31 ~ 2026-04-06) 더미 데이터
export const DUMMY_REPORT_LAST_WEEK: WeeklyReport = {
  projectId: 'preview-001',
  projectName: '내 소설 프로젝트',
  startDate: '2026-03-31',
  endDate:   '2026-04-06',
  summary: {
    totalCommits: 3,
    filesAdded: 1,
    filesModified: 5,
    filesDeleted: 0,
    totalInsertions: 145,
    totalDeletions: 38
  },
  dailyBreakdown: [
    { date: '2026-03-31', dayOfWeek: '월', commitCount: 0 },
    { date: '2026-04-01', dayOfWeek: '화', commitCount: 1 },
    { date: '2026-04-02', dayOfWeek: '수', commitCount: 0 },
    { date: '2026-04-03', dayOfWeek: '목', commitCount: 2 },
    { date: '2026-04-04', dayOfWeek: '금', commitCount: 0 },
    { date: '2026-04-05', dayOfWeek: '토', commitCount: 0 },
    { date: '2026-04-06', dayOfWeek: '일', commitCount: 0 }
  ],
  commits: [
    {
      hash: '1a2b3c4',
      date: '2026-04-03T20:10:00+09:00',
      message: '1장 전체 퇴고 완료',
      files: [
        { path: 'chapters/chapter-01.md', status: 'modified', insertions: 58, deletions: 22 },
        { path: 'outline/story-arc.md',   status: 'modified', insertions: 12, deletions: 8  }
      ]
    },
    {
      hash: 'd5e6f7a',
      date: '2026-04-03T14:35:00+09:00',
      message: '프롤로그 추가',
      files: [
        { path: 'chapters/prologue.md',   status: 'added',    insertions: 47, deletions: 0  },
        { path: 'chapters/chapter-01.md', status: 'modified', insertions: 20, deletions: 6  }
      ]
    },
    {
      hash: 'b8c9d0e',
      date: '2026-04-01T16:00:00+09:00',
      message: '세계관 배경 메모 정리',
      files: [
        { path: 'world/world-building.md', status: 'modified', insertions: 8, deletions: 2 }
      ]
    }
  ]
}

// 빈 주 (커밋 없음)
export const DUMMY_REPORT_EMPTY: WeeklyReport = {
  projectId: 'preview-001',
  projectName: '내 소설 프로젝트',
  startDate: '2026-03-24',
  endDate:   '2026-03-30',
  summary: {
    totalCommits: 0,
    filesAdded: 0,
    filesModified: 0,
    filesDeleted: 0,
    totalInsertions: 0,
    totalDeletions: 0
  },
  dailyBreakdown: [
    { date: '2026-03-24', dayOfWeek: '월', commitCount: 0 },
    { date: '2026-03-25', dayOfWeek: '화', commitCount: 0 },
    { date: '2026-03-26', dayOfWeek: '수', commitCount: 0 },
    { date: '2026-03-27', dayOfWeek: '목', commitCount: 0 },
    { date: '2026-03-28', dayOfWeek: '금', commitCount: 0 },
    { date: '2026-03-29', dayOfWeek: '토', commitCount: 0 },
    { date: '2026-03-30', dayOfWeek: '일', commitCount: 0 }
  ],
  commits: []
}
