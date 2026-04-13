// WeeklyReport/preview/src/mockIpc.ts
// Electron IPC 환경이 없는 브라우저에서 window.electron을 흉내냄

import {
  DUMMY_REPORT_THIS_WEEK,
  DUMMY_REPORT_LAST_WEEK,
  DUMMY_REPORT_EMPTY
} from './fixtures'

// startDate 기준으로 어떤 더미 데이터를 반환할지 선택
function selectReport(startDate: string) {
  if (startDate === '2026-04-07') return DUMMY_REPORT_THIS_WEEK
  if (startDate === '2026-03-31') return DUMMY_REPORT_LAST_WEEK
  if (startDate === '2026-03-24') return DUMMY_REPORT_EMPTY
  // 그 외 주는 빈 리포트 (날짜만 맞춰서 반환)
  return {
    ...DUMMY_REPORT_EMPTY,
    startDate,
    endDate: new Date(new Date(`${startDate}T00:00:00`).getTime() + 6 * 86400000)
      .toISOString()
      .slice(0, 10)
  }
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
      // useFileStatus 등 다른 훅의 이벤트 리스너 — 미리보기에서는 no-op
      on: () => {},
      removeAllListeners: () => {}
    }
  }
}
