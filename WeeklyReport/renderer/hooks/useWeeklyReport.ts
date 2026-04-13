// WeeklyReport/renderer/hooks/useWeeklyReport.ts
// 통합 시 src/renderer/src/hooks/useWeeklyReport.ts 로 이동
// invokeGit 은 src/renderer/src/ipc.ts 의 것을 그대로 사용

import { useCallback, useEffect, useState } from 'react'
import { WeeklyReport } from '../../types/weekly-report'

// ─── 날짜 유틸 ────────────────────────────────────────────────────────────────

/** 주어진 날짜가 속한 주의 월요일을 반환 (YYYY-MM-DD) */
function getWeekStart(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=일, 1=월 ... 6=토
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  return d.toISOString().slice(0, 10)
}

/** 월요일 날짜 문자열로부터 해당 주 일요일을 반환 (YYYY-MM-DD) */
function getWeekEnd(mondayStr: string): string {
  const d = new Date(`${mondayStr}T00:00:00`)
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

/** N주 이전/이후의 월요일을 반환 */
function shiftWeek(mondayStr: string, weeks: number): string {
  const d = new Date(`${mondayStr}T00:00:00`)
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

// ─── IPC 헬퍼 ─────────────────────────────────────────────────────────────────
// 통합 시 src/renderer/src/ipc.ts 의 invokeGit 으로 교체

type IpcGitResult<T> = { data: T } | { error: { code: string; message: string; raw?: string } }

async function invokeWeeklyReport(
  channel: string,
  ...args: unknown[]
): Promise<WeeklyReport> {
  const result = (await window.electron.ipcRenderer.invoke(
    channel,
    ...args
  )) as IpcGitResult<WeeklyReport>
  if ('error' in result) throw result.error
  return (result as { data: WeeklyReport }).data
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseWeeklyReportReturn {
  report: WeeklyReport | null
  loading: boolean
  error: { code: string; message: string } | null
  startDate: string   // 현재 조회 중인 주의 월요일 (YYYY-MM-DD)
  endDate: string     // 현재 조회 중인 주의 일요일 (YYYY-MM-DD)
  fetchReport: () => Promise<void>
  navigatePrev: () => void
  navigateNext: () => void
  isCurrentWeek: boolean
}

export function useWeeklyReport(projectId: string | null): UseWeeklyReportReturn {
  const [startDate, setStartDate] = useState<string>(() => getWeekStart(new Date()))
  const endDate = getWeekEnd(startDate)

  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)

  const fetchReport = useCallback(async (): Promise<void> => {
    if (!projectId) {
      setReport(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await invokeWeeklyReport('git:log:weekly', projectId, startDate, endDate)
      setReport(data)
    } catch (err) {
      setError(err as { code: string; message: string })
    } finally {
      setLoading(false)
    }
  }, [projectId, startDate, endDate])

  // 프로젝트 또는 날짜 범위가 바뀔 때 자동 조회
  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const navigatePrev = useCallback(() => {
    setStartDate((prev) => shiftWeek(prev, -1))
  }, [])

  const navigateNext = useCallback(() => {
    setStartDate((prev) => shiftWeek(prev, 1))
  }, [])

  const isCurrentWeek = startDate === getWeekStart(new Date())

  return {
    report,
    loading,
    error,
    startDate,
    endDate,
    fetchReport,
    navigatePrev,
    navigateNext,
    isCurrentWeek
  }
}
