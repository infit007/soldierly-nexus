import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import managerRoutes from './routes/manager.js'
import requestsRoutes from './routes/requests.js'
import { supabase, testDatabaseConnection } from './db.js'

const app = express()
const PORT = Number(process.env.PORT || 5000)
const NODE_ENV = process.env.NODE_ENV || 'development'

app.use(express.json())
app.use(cookieParser())
// Required for correct trust of X-Forwarded-* headers when behind proxies (Render/Heroku/Vercel)
app.set('trust proxy', 1)

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
    console.log('🔍 Health check: Testing database connection...')
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('id').limit(1)
    if (error) {
      console.error('❌ Health check failed:', error)
      return res.status(500).json({ ok: false, error: error.message })
    }
    console.log('✅ Health check passed')
    res.json({ ok: true, database: 'connected' })
  } catch (e: any) {
    console.error('❌ Health check exception:', e)
    res.status(500).json({ ok: false, error: e?.message || 'Unknown error' })
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

// Start server and test database connection
app.listen(PORT, async () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
  console.log(`🌍 Environment: ${NODE_ENV}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Test database connection on startup
  const dbConnected = await testDatabaseConnection()
  if (!dbConnected) {
    console.error('⚠️  WARNING: Database connection test failed! The server will start but API calls may fail.')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})
