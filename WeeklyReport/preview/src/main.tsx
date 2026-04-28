// WeeklyReport/preview/src/main.tsx
// React 마운트 전 mock IPC 설정

import { setupMockIpc } from './mockIpc'
setupMockIpc() // window.electron 를 렌더링 전에 주입

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
