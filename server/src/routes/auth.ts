import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { AuthenticatedRequest } from '../types/index.js'

const router = Router()

function setAuthCookie(res: Response, payload: any) {
  const secret = process.env.JWT_SECRET || 'dev-secret'
  const token = jwt.sign(payload, secret, { expiresIn: '7d' })
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Always use secure cookies for cross-domain requests
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction, // HTTPS in prod; HTTP allowed in dev
    sameSite: isProduction ? 'none' : 'lax', // same-origin in dev; cross-site in prod
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
    
    const { data: userData, error } = await supabase
      .from('users')
      .insert({
        army_number: armyNumber,
        username,
        email,
        password_hash: passwordHash,
        role: 'USER'
      })
      .select('id, army_number, username, email, role')
      .single()
    
    if (error) {
      console.error('Signup error:', error)
      if (error.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({ error: 'Username or email already exists' })
      }
      return res.status(500).json({ error: 'Internal error' })
    }
    
    if (!userData) {
      return res.status(500).json({ error: 'Internal error' })
    }
    
    const user = {
      id: userData.id,
      armyNumber: userData.army_number,
      username: userData.username,
      email: userData.email,
      role: userData.role
    }
    
    setAuthCookie(res, { userId: user.id, role: user.role })
    return res.json(user)
  } catch (e) {
    console.error('Signup error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body
  if (!usernameOrEmail || !password) return res.status(400).json({ error: 'Missing fields' })
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, army_number, username, email, password_hash, role')
      .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
      .limit(1)
    
    if (error) {
      console.error('Login query error:', error)
      return res.status(500).json({ error: 'Internal error' })
    }
    
    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const user = users[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    
    setAuthCookie(res, { userId: user.id, role: user.role })
    return res.json({
      id: user.id,
      armyNumber: user.army_number,
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
    const isProduction = process.env.NODE_ENV === 'production'
    const { data: user, error } = await supabase
      .from('users')
      .select('id, army_number as armyNumber, username, email, role, created_at as createdAt')
      .eq('id', auth.userId)
      .single()
    
    if (error || !user) {
      // Token refers to a missing user (probably stale) → clear it and force re-login
      res.clearCookie('token', {
        path: '/',
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      })
      return res.status(401).json({ error: 'Unauthorized' })
    }
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
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalAdmins } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN')
    
    const { count: totalRegularUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'USER')
    
    // Get current date info
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    // Get monthly and weekly counts
    const { count: usersThisMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth)
    
    const { count: usersThisWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisWeek)
    
    // Get recent registrations
    const { data: recentRegistrations } = await supabase
      .from('users')
      .select('id, username, email, role, created_at as createdAt')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Generate monthly registration data for the last 12 months
    const monthlyRegistrations = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString())
      
      monthlyRegistrations.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: count || 0
      })
    }
    
    const stats = {
      totalUsers: totalUsers || 0,
      totalAdmins: totalAdmins || 0,
      totalRegularUsers: totalRegularUsers || 0,
      usersThisMonth: usersThisMonth || 0,
      usersThisWeek: usersThisWeek || 0,
      recentRegistrations: recentRegistrations || [],
      roleDistribution: {
        USER: totalRegularUsers || 0,
        ADMIN: totalAdmins || 0
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
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, role, created_at')
      .order('created_at', { ascending: false })
    
    if (usersError) {
      console.error('Get users error:', usersError)
      return res.status(500).json({ error: 'Internal error' })
    }
    
    if (!users || users.length === 0) {
      return res.json([])
    }
    
    // Get all profiles for these users
    const userIds = users.map((u: any) => u.id)
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('user_id', userIds)
    
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]))
    
    // Transform the data to match the expected format
    const transformedUsers = users.map((user: any) => {
      const profile = profileMap.get(user.id)
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        profile: profile ? {
          personalDetails: profile.personal_details,
          family: profile.family,
          education: profile.education,
          medical: profile.medical,
          others: profile.others,
          leaveData: profile.leave,
          salaryData: profile.salary,
          updatedAt: profile.updated_at
        } : null
      }
    })
    
    res.json(transformedUsers)
  } catch (e) {
    console.error('Get users error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Get specific user profile by ID
router.get('/admin/users/:userId', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email, role, created_at')
      .eq('id', userId)
      .single()
    
    if (userError || !user) return res.status(404).json({ error: 'User not found' })
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    // Transform the data to match the expected format
    const transformedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      profile: profile ? {
        personalDetails: profile.personal_details,
        family: profile.family,
        education: profile.education,
        medical: profile.medical,
        others: profile.others,
        leaveData: profile.leave,
        salaryData: profile.salary,
        updatedAt: profile.updated_at
      } : null
    }
    
    res.json(transformedUser)
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
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('army_number', armyNumber)
      .neq('id', req.auth.userId)
      .single()
    
    if (existingUser) {
      return res.status(409).json({ error: 'Army number already exists' })
    }
    
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ army_number: armyNumber })
      .eq('id', req.auth.userId)
      .select('id, army_number as armyNumber, username, email, role')
      .single()
    
    if (error) {
      console.error('Update army number error:', error)
      return res.status(500).json({ error: 'Internal error' })
    }
    
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
