import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import managerRoutes from './routes/manager.js'
import requestsRoutes from './routes/requests.js'
import { prisma } from './db.js'

const app = express()
const PORT = Number(process.env.PORT || 5000)
const NODE_ENV = process.env.NODE_ENV || 'development'

app.use(express.json())
app.use(cookieParser())

// CORS configuration
// TODO: In production, replace 'origin: true' with specific allowed origins for security
const corsOptions = {
  origin: true, // Allow all origins temporarily - replace with specific domains in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}

app.use(cors(corsOptions))

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false })
  }
})

// Debug route to test API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    headers: req.headers
  })
})

app.use('/api', authRoutes)
app.use('/api', profileRoutes)
app.use('/api', managerRoutes)
app.use('/api', requestsRoutes)

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
  console.log(`Environment: ${NODE_ENV}`)
})
