import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const target = 'http://localhost:8000'
const apiPrefixes = ['/auth', '/users', '/sessions', '/chat', '/connectors', '/health']

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: Object.fromEntries(apiPrefixes.map((p) => [p, { target, changeOrigin: true }])),
  },
})
