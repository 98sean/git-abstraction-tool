// WeeklyReport/preview/src/mockIpc.ts
// Electron IPC 환경이 없는 브라우저에서 window.electron을 흉내냄

import {
  DUMMY_REPORT_THIS_WEEK,
  DUMMY_REPORT_LAST_WEEK,
  DUMMY_REPORT_TWO_WEEKS_AGO,
  DUMMY_REPORT_EMPTY
} from './fixtures'
import { WeeklyReport } from '../../types/weekly-report'

// startDate 기준으로 어떤 실제 데이터를 반환할지 선택
// 이 프로젝트의 실제 커밋 분포 (UTC-7 기준):
//   2026-04-13 주 → 커밋 3개 (이번 주, 4월 13일 월요일)
//   2026-04-06 주 → 커밋 1개 (지난 주, 4월 8일 수요일)
//   2026-03-30 주 → 커밋 1개 (2주 전, 4월 2일 목요일)
//   그 이전      → 커밋 없음
function selectReport(startDate: string): WeeklyReport {
  if (startDate === '2026-04-13') return DUMMY_REPORT_THIS_WEEK
  if (startDate === '2026-04-06') return DUMMY_REPORT_LAST_WEEK
  if (startDate === '2026-03-30') return DUMMY_REPORT_TWO_WEEKS_AGO

  // 그 외 주는 날짜만 맞춘 빈 리포트 반환
  const endDate = new Date(new Date(`${startDate}T00:00:00`).getTime() + 6 * 86400000)
    .toISOString()
    .slice(0, 10)
  return { ...DUMMY_REPORT_EMPTY, startDate, endDate }
}

export function setupMockIpc(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).electron = {
    ipcRenderer: {
      invoke: async (channel: string, ...args: unknown[]) => {
        // 0.4초 지연으로 실제 IPC 응답 속도 시뮬레이션
        await new Promise((r) => setTimeout(r, 400))

        if (channel === 'git:log:weekly') {
          const [, startDate] = args as [string, string, string]
          return { data: selectReport(startDate) }
        }

        return null
      },
      on: () => {},
      removeAllListeners: () => {}
    }
  }
}
