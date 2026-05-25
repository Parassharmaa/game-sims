import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5180,
    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/ollama/, ''),
        configure: (proxy) => {
          const t0 = new WeakMap<object, number>()
          proxy.on('proxyReq', (_proxyReq, req) => {
            t0.set(req, Date.now())
            // eslint-disable-next-line no-console
            console.log(`[ollama] → ${req.method} ${req.url}`)
            if (req.method === 'POST') {
              const chunks: Buffer[] = []
              req.on('data', (c: Buffer) => chunks.push(c))
              req.on('end', () => {
                try {
                  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
                  const msg = Array.isArray(body.messages)
                    ? body.messages[body.messages.length - 1]?.content ?? ''
                    : ''
                  // eslint-disable-next-line no-console
                  console.log(
                    `[ollama]   model=${body.model} temp=${body.temperature} last-msg: ${String(msg).slice(0, 80).replace(/\s+/g, ' ')}…`,
                  )
                } catch {
                  /* not JSON */
                }
              })
            }
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            const dt = Date.now() - (t0.get(req) ?? Date.now())
            const chunks: Buffer[] = []
            proxyRes.on('data', (c: Buffer) => chunks.push(c))
            proxyRes.on('end', () => {
              const status = proxyRes.statusCode
              const sample = Buffer.concat(chunks).toString('utf8').slice(0, 160).replace(/\s+/g, ' ')
              // eslint-disable-next-line no-console
              console.log(`[ollama] ← ${status} ${req.method} ${req.url} (${dt}ms) ${sample}`)
            })
          })
          proxy.on('error', (err, req) => {
            // eslint-disable-next-line no-console
            console.log(`[ollama] ✖ ${req.method} ${req.url}: ${err.message}`)
          })
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'dist', 'e2e/**'],
  },
})
