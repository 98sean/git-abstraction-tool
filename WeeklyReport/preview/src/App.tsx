// WeeklyReport/preview/src/App.tsx
// 브라우저 미리보기 앱 — 더미 IPC + 테마 토글

import React, { useState, useEffect } from 'react'
import { WeeklyReport } from '../../renderer/components/WeeklyReport'
import './preview.css'

type Theme = 'light' | 'dark'

export default function App(): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleTheme = (): void => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }

  return (
    <div className="preview-shell">
      {/* 미리보기 전용 툴바 */}
      <div className="preview-toolbar">
        <strong>WeeklyReport 미리보기</strong>
        <span className="preview-badge">더미 데이터</span>
        <span>이전 주 / 다음 주 탐색 가능 · 로딩 지연 0.4초 시뮬레이션</span>
        <span className="preview-toolbar-spacer" />
        <button className="preview-theme-btn" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드'}
        </button>
      </div>

      {/* 실제 WeeklyReport 컴포넌트 */}
      <div className="preview-content">
        <WeeklyReport projectId="preview-001" />
      </div>
    </div>
  )
}
