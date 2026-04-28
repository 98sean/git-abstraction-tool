// WeeklyReport/tests/weekly-report.test.ts
//
// 실행 방법:
//   vitest.config.ts 의 include 배열에 아래 경로 추가 후 `npm test` 실행
//   'WeeklyReport/tests/**/*.test.ts'
//
// 또는 이 파일을 src/main/git/__tests__/ 에 복사하면 기존 설정으로 바로 실행됩니다.

import { describe, it, expect } from 'vitest'
import {
  parseNameStatus,
  mergeNumstat,
  buildSummary,
  buildDailyBreakdown,
  mapNameStatus
} from '../main/git-weekly-service'

// ─── mapNameStatus ────────────────────────────────────────────────────────────

describe('mapNameStatus', () => {
  it('A → added', () => expect(mapNameStatus('A')).toBe('added'))
  it('M → modified', () => expect(mapNameStatus('M')).toBe('modified'))
  it('D → deleted', () => expect(mapNameStatus('D')).toBe('deleted'))
  it('R100 → renamed', () => expect(mapNameStatus('R100')).toBe('renamed'))
  it('R095 → renamed', () => expect(mapNameStatus('R095')).toBe('renamed'))
  it('C → modified (copy treated as modified)', () => expect(mapNameStatus('C')).toBe('modified'))
  it('T → modified (type change)', () => expect(mapNameStatus('T')).toBe('modified'))
})

// ─── parseNameStatus ──────────────────────────────────────────────────────────

describe('parseNameStatus', () => {
  const raw = [
    'GWEEKLY:abc123\t2024-01-05T10:30:00+09:00\tAdded intro',
    '',
    'M\tsrc/main.ts',
    'A\tsrc/intro.md',
    '',
    'GWEEKLY:def456\t2024-01-04T15:20:00+09:00\tFixed form',
    '',
    'D\tsrc/old.ts',
    'M\tsrc/form.ts',
    ''
  ].join('\n')

  it('두 커밋을 파싱한다', () => {
    const map = parseNameStatus(raw)
    expect(map.size).toBe(2)
  })

  it('첫 번째 커밋 메타데이터가 올바르다', () => {
    const map = parseNameStatus(raw)
    const commit = map.get('abc123')!
    expect(commit.hash).toBe('abc123')
    expect(commit.date).toBe('2024-01-05T10:30:00+09:00')
    expect(commit.message).toBe('Added intro')
  })

  it('첫 번째 커밋의 파일 수가 올바르다', () => {
    const map = parseNameStatus(raw)
    expect(map.get('abc123')!.files).toHaveLength(2)
  })

  it('파일 상태가 올바르게 매핑된다', () => {
    const map = parseNameStatus(raw)
    const files = map.get('abc123')!.files
    expect(files.find((f) => f.path === 'src/main.ts')?.status).toBe('modified')
    expect(files.find((f) => f.path === 'src/intro.md')?.status).toBe('added')
  })

  it('두 번째 커밋의 삭제 파일이 올바르다', () => {
    const map = parseNameStatus(raw)
    const files = map.get('def456')!.files
    expect(files.find((f) => f.path === 'src/old.ts')?.status).toBe('deleted')
  })

  it('rename 파일은 새 경로를 path로 사용한다', () => {
    const renameRaw = [
      'GWEEKLY:aaa111\t2024-01-06T09:00:00+09:00\tRenamed file',
      'R100\tsrc/old-name.ts\tsrc/new-name.ts'
    ].join('\n')
    const map = parseNameStatus(renameRaw)
    const files = map.get('aaa111')!.files
    expect(files[0].path).toBe('src/new-name.ts')
    expect(files[0].status).toBe('renamed')
  })

  it('빈 입력에서 빈 Map을 반환한다', () => {
    expect(parseNameStatus('')).toEqual(new Map())
  })
})

// ─── mergeNumstat ────────────────────────────────────────────────────────────

describe('mergeNumstat', () => {
  it('insertions/deletions를 올바르게 병합한다', () => {
    const nameStatusRaw = [
      'GWEEKLY:abc123\t2024-01-05T10:30:00+09:00\tAdded intro',
      'A\tsrc/intro.md',
      'M\tsrc/main.ts'
    ].join('\n')

    const numstatRaw = [
      'GWEEKLY:abc123',
      '5\t0\tsrc/intro.md',
      '3\t1\tsrc/main.ts'
    ].join('\n')

    const commits = parseNameStatus(nameStatusRaw)
    mergeNumstat(commits, numstatRaw)

    const files = commits.get('abc123')!.files
    expect(files.find((f) => f.path === 'src/intro.md')?.insertions).toBe(5)
    expect(files.find((f) => f.path === 'src/intro.md')?.deletions).toBe(0)
    expect(files.find((f) => f.path === 'src/main.ts')?.insertions).toBe(3)
    expect(files.find((f) => f.path === 'src/main.ts')?.deletions).toBe(1)
  })

  it('바이너리 파일("-\t-\tpath") 라인을 0으로 처리한다', () => {
    const nameStatusRaw = 'GWEEKLY:bbb\t2024-01-05T10:00:00+09:00\tBinary\nA\timg/photo.png'
    const numstatRaw = 'GWEEKLY:bbb\n-\t-\timg/photo.png'

    const commits = parseNameStatus(nameStatusRaw)
    mergeNumstat(commits, numstatRaw)

    const file = commits.get('bbb')!.files[0]
    expect(file.insertions).toBe(0)
    expect(file.deletions).toBe(0)
  })
})

// ─── buildSummary ─────────────────────────────────────────────────────────────

describe('buildSummary', () => {
  it('커밋이 없으면 모두 0을 반환한다', () => {
    const summary = buildSummary([])
    expect(summary.totalCommits).toBe(0)
    expect(summary.filesAdded).toBe(0)
    expect(summary.filesModified).toBe(0)
    expect(summary.filesDeleted).toBe(0)
    expect(summary.totalInsertions).toBe(0)
    expect(summary.totalDeletions).toBe(0)
  })

  it('파일 수와 줄 수를 정확히 집계한다', () => {
    const commits = [
      {
        hash: 'a',
        date: '2024-01-05T10:00:00Z',
        message: 'c1',
        files: [
          { path: 'a.ts', status: 'added' as const, insertions: 10, deletions: 0 },
          { path: 'b.ts', status: 'modified' as const, insertions: 2, deletions: 3 }
        ]
      },
      {
        hash: 'b',
        date: '2024-01-04T10:00:00Z',
        message: 'c2',
        files: [
          { path: 'c.ts', status: 'deleted' as const, insertions: 0, deletions: 5 },
          { path: 'd.ts', status: 'renamed' as const, insertions: 1, deletions: 1 }
        ]
      }
    ]

    const summary = buildSummary(commits)
    expect(summary.totalCommits).toBe(2)
    expect(summary.filesAdded).toBe(1)
    expect(summary.filesModified).toBe(2) // modified + renamed
    expect(summary.filesDeleted).toBe(1)
    expect(summary.totalInsertions).toBe(13)
    expect(summary.totalDeletions).toBe(9)
  })
})

// ─── buildDailyBreakdown ─────────────────────────────────────────────────────

describe('buildDailyBreakdown', () => {
  it('7개의 날짜 항목을 반환한다', () => {
    const result = buildDailyBreakdown([], '2024-01-01')
    expect(result).toHaveLength(7)
  })

  it('월요일부터 시작하며 요일 이름이 올바르다', () => {
    // 2024-01-01은 월요일
    const result = buildDailyBreakdown([], '2024-01-01')
    expect(result[0].dayOfWeek).toBe('월')
    expect(result[6].dayOfWeek).toBe('일')
  })

  it('날짜 범위가 올바르다', () => {
    const result = buildDailyBreakdown([], '2024-01-01')
    expect(result[0].date).toBe('2024-01-01')
    expect(result[6].date).toBe('2024-01-07')
  })

  it('커밋이 없는 날은 commitCount = 0', () => {
    const result = buildDailyBreakdown([], '2024-01-01')
    expect(result.every((d) => d.commitCount === 0)).toBe(true)
  })

  it('커밋이 있는 날의 count를 올바르게 집계한다', () => {
    const commits = [
      { hash: 'a', date: '2024-01-03T10:00:00Z', message: 'm1', files: [] },
      { hash: 'b', date: '2024-01-03T14:00:00Z', message: 'm2', files: [] },
      { hash: 'c', date: '2024-01-05T09:00:00Z', message: 'm3', files: [] }
    ]
    const result = buildDailyBreakdown(commits, '2024-01-01')

    // 2024-01-03은 result[2] (월=0, 화=1, 수=2)
    expect(result[2].commitCount).toBe(2)
    // 2024-01-05는 result[4] (금=4)
    expect(result[4].commitCount).toBe(1)
    // 나머지는 0
    expect(result[0].commitCount).toBe(0)
  })
})
