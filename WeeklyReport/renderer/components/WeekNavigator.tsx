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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  const startStr = `${MONTHS[start.getMonth()]} ${start.getDate()}`
  const endStr =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}`
      : `${MONTHS[end.getMonth()]} ${end.getDate()}`

  return `${startStr} – ${endStr}, ${start.getFullYear()}`
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
      <button className="wr-nav-btn" onClick={onPrev} aria-label="Previous week">
        ‹ Prev Week
      </button>

      <div className="wr-nav-center">
        <span className="wr-date-range">{formatDateRange(startDate, endDate)}</span>
        {isCurrentWeek && <span className="wr-current-badge">This Week</span>}
      </div>

      <button
        className="wr-nav-btn"
        onClick={onNext}
        disabled={isCurrentWeek}
        aria-label="Next week"
      >
        Next Week ›
      </button>
    </div>
  )
}
