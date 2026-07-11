import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const docsDir = path.resolve(process.cwd(), '../docs')

export default defineConfig({
  base: '/',
  server: {
    fs: { allow: [path.resolve(process.cwd(), '..')] },
  },
  plugins: [
    react(),
    {
      name: 'serve-docs-json',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const filePath = path.join(docsDir, req.url.split('?')[0])
          try {
            if (fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath)
              if (ext === '.json') res.setHeader('Content-Type', 'application/json')
              res.end(fs.readFileSync(filePath))
              return
            }
          } catch {}
          next()
        })
      }
    }
  ],
})
