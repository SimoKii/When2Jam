import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 등 서브경로 배포 시: BASE_PATH=/저장소이름/ npm run build
  base: process.env.BASE_PATH || '/',
})
