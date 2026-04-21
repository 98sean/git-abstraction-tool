import React from 'react'
import { DailyBreakdown } from '../../types'

interface Props {
  breakdown: DailyBreakdown[]
}

export function DailyTimeline({ breakdown }: Props): React.JSX.Element {
  const maxCount = Math.max(...breakdown.map((d) => d.commitCount), 1)

  return (
    <div className="wr-timeline">
      <h3 className="wr-section-title">Daily Activity</h3>
      <div className="wr-timeline-bars">
        {breakdown.map((day) => {
          const heightPct = (day.commitCount / maxCount) * 100
          const isToday = day.date === new Date().toISOString().slice(0, 10)

          return (
            <div key={day.date} className={`wr-timeline-col ${isToday ? 'wr-timeline-col--today' : ''}`}>
              <span className="wr-bar-count">{day.commitCount > 0 ? day.commitCount : ''}</span>
              <div className="wr-bar-track">
                <div
                  className="wr-bar-fill"
                  style={{ height: `${heightPct}%` }}
                  aria-label={`${day.dayOfWeek} ${day.commitCount} commits`}
                />
              </div>
              <span className="wr-bar-label">{day.dayOfWeek}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
