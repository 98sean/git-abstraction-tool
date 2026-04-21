// WeeklyReport/preview/vite.config.ts
// 실행: cd WeeklyReport/preview && ../../node_modules/.bin/vite

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // root 는 이 config 파일이 있는 디렉토리 (WeeklyReport/preview/)
  // index.html 과 src/ 가 이 디렉토리 기준으로 탐색됨
})
