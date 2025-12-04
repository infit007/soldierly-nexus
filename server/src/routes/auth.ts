import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { AuthenticatedRequest } from '../types/index.js'

const router = Router()

// Prefer Supabase service key as the JWT secret when running on Supabase.
// Falls back to JWT_SECRET for local/dev environments.
const JWT_SECRET = process.env.SUPABASE_SERVICE_KEY || process.env.JWT_SECRET || 'dev-secret'

function setAuthCookie(res: Response, payload: any) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  
  // Always use secure cookies for cross-domain requests
  res.cookie('token', token, {
    httpOnly: true,
    secure: true, // Always secure for cross-domain
    sameSite: 'none', // Required for cross-domain
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    domain: undefined, // Let browser set the domain
  })
}

router.post('/signup', async (req: Request, res: Response) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' })
  
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Generate unique army number (format: ARMY-YYYY-XXXX)
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const armyNumber = `ARMY-${year}-${randomNum}`
    
    const user = await prisma.user.create({
      data: {
        armyNumber,
        username,
        email,
        passwordHash,
        role: 'USER'
      },
      select: {
        id: true,
        armyNumber: true,
        username: true,
        email: true,
        role: true
      }
    })
    
    setAuthCookie(res, { userId: user.id, role: user.role })
    return res.json(user)
  } catch (e) {
    console.error('Signup error:', e)
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'Username or email already exists' })
    }
    return res.status(500).json({ error: 'Internal error' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body
  if (!usernameOrEmail || !password) return res.status(400).json({ error: 'Missing fields' })
  
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    })
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    
    setAuthCookie(res, { userId: user.id, role: user.role })
    return res.json({
      id: user.id,
      armyNumber: user.armyNumber,
      username: user.username,
      email: user.email,
      role: user.role
    })
  } catch (e) {
    console.error('Login error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { 
    path: '/',
    secure: true,
    sameSite: 'none'
  })
  res.json({ ok: true })
})

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = req.auth
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        armyNumber: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
    
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json(user)
  } catch (e) {
    console.error('Me error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Admin statistics endpoint
router.get('/admin/stats', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get total counts
    const totalUsers = await prisma.user.count()
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } })
    const totalRegularUsers = await prisma.user.count({ where: { role: 'USER' } })
    
    // Get current date info
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Get monthly and weekly counts
    const usersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: thisMonth } }
    })
    
    const usersThisWeek = await prisma.user.count({
      where: { createdAt: { gte: thisWeek } }
    })
    
    // Get recent registrations
    const recentRegistrations = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
    
    // Generate monthly registration data for the last 12 months
    const monthlyRegistrations = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: nextMonthStart
          }
        }
      })
      
      monthlyRegistrations.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count
      })
    }
    
    const stats = {
      totalUsers,
      totalAdmins,
      totalRegularUsers,
      usersThisMonth,
      usersThisWeek,
      recentRegistrations,
      roleDistribution: {
        USER: totalRegularUsers,
        ADMIN: totalAdmins
      },
      monthlyRegistrations
    }
    
    res.json(stats)
  } catch (e) {
    console.error('Admin stats error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Get all users with their profile data
router.get('/admin/users', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            personalDetails: true,
            family: true,
            education: true,
            medical: true,
            others: true,
            leaveData: true,
            salaryData: true,
            updatedAt: true
          }
        }
      }
    })
    
    res.json(users)
  } catch (e) {
    console.error('Get users error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Get specific user profile by ID
router.get('/admin/users/:userId', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            personalDetails: true,
            family: true,
            education: true,
            medical: true,
            others: true,
            leaveData: true,
            salaryData: true,
            updatedAt: true
          }
        }
      }
    })
    
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (e) {
    console.error('Get user error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Update army number endpoint
router.put('/update-army-number', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { armyNumber } = req.body
  if (!armyNumber) return res.status(400).json({ error: 'Army number is required' })
  
  try {
    // Check if army number is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        armyNumber,
        id: { not: req.auth.userId }
      }
    })
    
    if (existingUser) {
      return res.status(409).json({ error: 'Army number already exists' })
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: req.auth.userId },
      data: { armyNumber },
      select: {
        id: true,
        armyNumber: true,
        username: true,
        email: true,
        role: true
      }
    })
    
    res.json(updatedUser)
  } catch (e) {
    console.error('Update army number error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Sample protected routes
router.get('/admin/ping', requireAuth, requireRole('ADMIN'), (_req: AuthenticatedRequest, res: Response) => res.json({ ok: true, scope: 'admin' }))
router.get('/user/ping', requireAuth, requireRole('USER'), (_req: AuthenticatedRequest, res: Response) => res.json({ ok: true, scope: 'user' }))

export default router
