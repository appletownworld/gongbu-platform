import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/auth': {
        target: 'http://auth-service:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, '')
      },
      '/api/courses': {
        target: 'http://course-service:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/courses/, '')
      },
      '/api/bot': {
        target: 'http://bot-service:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bot/, '')
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
