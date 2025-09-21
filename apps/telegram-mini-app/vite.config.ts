import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/telegram-mini-app/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          telegram: ['@twa-dev/types']
        }
      }
    }
  },
  server: {
    port: 3001,
    host: true,
    open: false
  },
  preview: {
    port: 3001,
    host: true
  },
  define: {
    global: 'globalThis'
  }
})
