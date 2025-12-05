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
  // Treat all hosted environments (Vercel/Render/etc) as "production" for cookie policy
  const isProdLike =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RENDER)
  
  // Always use secure cookies for cross-domain requests
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProdLike, // HTTPS in prod/hosted; HTTP allowed locally
    sameSite: isProdLike ? 'none' : 'lax', // allow cross-site cookies for hosted frontend/backend on different domains
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
  console.log('🔐 Login attempt:', { usernameOrEmail: usernameOrEmail?.substring(0, 20) + '...', hasPassword: !!password })
  
  if (!usernameOrEmail || !password) {
    console.log('❌ Login failed: Missing fields')
    return res.status(400).json({ error: 'Missing fields' })
  }
  
  try {
    console.log('🔍 Querying database for user...')
    const { data: users, error } = await supabase
      .from('users')
      .select('id, army_number, username, email, password_hash, role')
      .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
      .limit(1)
    
    if (error) {
      console.error('❌ Login query error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return res.status(500).json({ error: 'Internal error', details: error.message })
    }
    
    console.log(`📊 Login query returned ${users?.length || 0} users`)
    
    if (error || !users || users.length === 0) {
      console.log('❌ Login failed: User not found')
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const user = users[0]
    console.log(`✅ User found: ${user.username} (${user.role})`)
    
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      console.log('❌ Login failed: Invalid password')
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    console.log('✅ Login successful, setting auth cookie')
    setAuthCookie(res, { userId: user.id, role: user.role })
    return res.json({
      id: user.id,
      armyNumber: user.army_number,
      username: user.username,
      email: user.email,
      role: user.role
    })
  } catch (e: any) {
    console.error('❌ Login exception:', e)
    console.error('Exception details:', {
      message: e?.message,
      stack: e?.stack
    })
    return res.status(500).json({ error: 'Internal error', details: e?.message })
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
    console.log('🔍 /api/me called for userId:', auth.userId)
    
    const isProduction = process.env.NODE_ENV === 'production'
    console.log('🔍 Querying database for user...')
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, army_number, username, email, role, created_at')
      .eq('id', auth.userId)
      .single()

    if (error) {
      console.error('❌ /api/me database error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId: auth.userId
      })
      // Token refers to a missing user (probably stale) → clear it and force re-login
      res.clearCookie('token', {
        path: '/',
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      })
      return res.status(401).json({ error: 'Unauthorized', details: error.message })
    }

    if (!user) {
      console.error('❌ /api/me: User not found for userId:', auth.userId)
      res.clearCookie('token', {
        path: '/',
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      })
      return res.status(401).json({ error: 'Unauthorized', details: 'User not found' })
    }

    // Transform snake_case to camelCase for frontend
    const transformedUser = {
      id: (user as any).id,
      armyNumber: (user as any).army_number,
      username: (user as any).username,
      email: (user as any).email,
      role: (user as any).role,
      createdAt: (user as any).created_at
    }
    
    console.log('✅ /api/me successful:', { 
      id: transformedUser.id, 
      username: transformedUser.username, 
      role: transformedUser.role 
    })
    res.json(transformedUser)
  } catch (e: any) {
    console.error('❌ /api/me exception:', e)
    console.error('Exception details:', {
      message: e?.message,
      stack: e?.stack
    })
    return res.status(500).json({ error: 'Internal error', details: e?.message })
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
    const { data: recentRegistrationsRaw } = await supabase
      .from('users')
      .select('id, username, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    const recentRegistrations = (recentRegistrationsRaw || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.created_at
    }))
    
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
    
    const { data: updatedUserRaw, error } = await supabase
      .from('users')
      .update({ army_number: armyNumber })
      .eq('id', req.auth.userId)
      .select('id, army_number, username, email, role')
      .single()
    
    if (error) {
      console.error('Update army number error:', error)
      return res.status(500).json({ error: 'Internal error' })
    }
    
    const updatedUser = {
      id: updatedUserRaw.id,
      armyNumber: updatedUserRaw.army_number,
      username: updatedUserRaw.username,
      email: updatedUserRaw.email,
      role: updatedUserRaw.role
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
