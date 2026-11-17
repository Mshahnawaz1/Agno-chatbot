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
  build: {
    rolldownOptions: {
      output: {
        // Libraries change rarely: separate files stay cached across app deploys.
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|@tanstack)[\\/]/ },
            {
              name: 'vendor-markdown',
              test: /node_modules[\\/](react-markdown|remark-.*|rehype-.*|mdast-.*|micromark.*|hast-.*|unified|unist-.*|vfile.*|property-information|space-separated-tokens|comma-separated-tokens|decode-named-character-reference|character-entities.*|devlop|bail|trough|is-plain-obj|ccount|longest-streak|zwitch|html-url-attributes|markdown-table|estree-util-is-identifier-name|trim-lines|style-to-.*|inline-style-parser)[\\/]/,
            },
          ],
        },
      },
    },
  },
  server: {
    proxy: Object.fromEntries(apiPrefixes.map((p) => [p, { target, changeOrigin: true }])),
  },
})
