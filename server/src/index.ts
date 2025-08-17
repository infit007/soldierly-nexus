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

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://soldierly-nexus.vercel.app',
      'https://soldierly-nexus.onrender.com',
      'http://localhost:8080',
      'http://localhost:8081'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}))

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
})
