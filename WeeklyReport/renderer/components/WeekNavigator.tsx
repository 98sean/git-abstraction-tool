// WeeklyReport/renderer/components/WeekNavigator.tsx
// 주간 탐색 (이전/다음 주 버튼 + 현재 주 날짜 범위 표시)

import React from 'react'

interface Props {
  startDate: string  // YYYY-MM-DD (월요일)
  endDate: string    // YYYY-MM-DD (일요일)
  isCurrentWeek: boolean
  onPrev: () => void
  onNext: () => void
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  const startStr = `${start.getMonth() + 1}월 ${start.getDate()}일`
  const endStr =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}일`
      : `${end.getMonth() + 1}월 ${end.getDate()}일`

  return `${start.getFullYear()}년 ${startStr} – ${endStr}`
}

export function WeekNavigator({
  startDate,
  endDate,
  isCurrentWeek,
  onPrev,
  onNext
}: Props): React.JSX.Element {
  return (
    <div className="wr-navigator">
      <button className="wr-nav-btn" onClick={onPrev} aria-label="이전 주">
        ‹ 이전 주
      </button>

      <div className="wr-nav-center">
        <span className="wr-date-range">{formatDateRange(startDate, endDate)}</span>
        {isCurrentWeek && <span className="wr-current-badge">이번 주</span>}
      </div>

      <button
        className="wr-nav-btn"
        onClick={onNext}
        disabled={isCurrentWeek}
        aria-label="다음 주"
      >
        다음 주 ›
      </button>
    </div>
  )
}
