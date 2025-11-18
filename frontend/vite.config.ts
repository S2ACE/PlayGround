// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    esbuild: {
      // 只在 production 環境移除 console
      pure: mode === 'production' ? ['console.log', 'console.debug', 'console.info'] : [],
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'https://localhost:44376',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
