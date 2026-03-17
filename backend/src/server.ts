import 'dotenv/config'
import path from 'path'
import express from 'express'
import * as db from './database'
const app = require('./api')

// Serve frontend static files
const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath))

// SPA fallback: non-API routes serve index.html
app.use((req: any, res: any, next: any) => {
  if (req.path.startsWith('/api')) {
    return next()
  }
  res.sendFile(path.join(publicPath, 'index.html'))
})

const PORT = process.env.PORT || 3000

// Cleanup old games on startup and every 24 hours
const removed = db.cleanupOldGames()
if (removed > 0) console.log(`Cleaned up ${removed} old games`)
setInterval(() => {
  const r = db.cleanupOldGames()
  if (r > 0) console.log(`Cleaned up ${r} old games`)
}, 24 * 60 * 60 * 1000)

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
