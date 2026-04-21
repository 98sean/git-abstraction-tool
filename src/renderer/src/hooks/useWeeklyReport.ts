import { useCallback, useEffect, useState } from 'react'
import { WeeklyReport } from '../types'
import { invokeGit } from '../ipc'

function getWeekStart(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  return d.toISOString().slice(0, 10)
}

function getWeekEnd(mondayStr: string): string {
  const d = new Date(`${mondayStr}T00:00:00`)
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

function shiftWeek(mondayStr: string, weeks: number): string {
  const d = new Date(`${mondayStr}T00:00:00`)
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

interface UseWeeklyReportReturn {
  report: WeeklyReport | null
  loading: boolean
  error: { code: string; message: string } | null
  startDate: string
  endDate: string
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
      const data = await invokeGit<WeeklyReport>('git:log:weekly', projectId, startDate, endDate)
      setReport(data)
    } catch (err) {
      setError(err as { code: string; message: string })
    } finally {
      setLoading(false)
    }
  }, [projectId, startDate, endDate])

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

  return { report, loading, error, startDate, endDate, fetchReport, navigatePrev, navigateNext, isCurrentWeek }
}
