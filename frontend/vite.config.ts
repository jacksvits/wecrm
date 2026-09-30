import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Каждая сборка меняет версию в sw.js — браузер видит новый SW,
// активирует его (skipWaiting + clients.claim), main.tsx ловит controllerchange
// и перезагружает вкладку со свежим бандлом
function versionServiceWorker(): Plugin {
  return {
    name: 'version-sw',
    closeBundle() {
      const swPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist/sw.js')
      if (fs.existsSync(swPath)) {
        const stamp = Date.now().toString(36)
        let src = fs.readFileSync(swPath, 'utf8')
        src = src.replace(/const CACHE_NAME = '[^']+'/, `const CACHE_NAME = 'wecrm-${stamp}'`)
        fs.writeFileSync(swPath, src)
        console.log(`[version-sw] CACHE_NAME -> wecrm-${stamp}`)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), versionServiceWorker()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
