import { Router, Request, Response } from 'express'
import { supabase } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { AuthenticatedRequest } from '../types/index.js'

const router = Router()

// Manager: list all users (basic info) for selection in manager tools
router.get('/manager/users', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 /api/manager/users called by userId:', req.auth?.userId, 'role:', req.auth?.role)
    console.log('🔍 Querying database for all users...')
    
    const { data: usersRaw, error } = await supabase
      .from('users')
      .select('id, username, email, role, army_number')
      .order('username', { ascending: true })
    
    if (error) {
      console.error('❌ /api/manager/users database error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return res.status(500).json({ error: 'Internal error', details: error.message })
    }
    
    // Transform snake_case to camelCase for frontend
    const users = (usersRaw || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      armyNumber: u.army_number
    }))
    
    console.log(`✅ /api/manager/users successful: Found ${users.length} users`)
    res.json(users)
  } catch (e: any) {
    console.error('❌ /api/manager/users exception:', e)
    console.error('Exception details:', {
      message: e?.message,
      stack: e?.stack
    })
    res.status(500).json({ error: 'Internal error', details: e?.message })
  }
})

// Manager: fetch a specific user's profile (view-only)
router.get('/manager/users/:id/profile', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email, role, army_number')
      .eq('id', id)
      .single()
    if (userError || !userData) return res.status(404).json({ error: 'User not found' })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', id)
      .single()
    return res.json({ 
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      armyNumber: userData.army_number,
      profile: profile || null 
    })
  } catch (e) {
    console.error('Get user profile for manager error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Helper to create a request row
async function createRequest(requesterId: string, type: string, data: any) {
  const { data: request } = await supabase
    .from('requests')
    .insert({
      type,
      data,
      requester_id: requesterId,
      status: 'PENDING',
    })
    .select('id, type, status, data, created_at as createdAt')
    .single()
  return request
}

// Manager: create Leave request for a user
router.post('/manager/requests/leave', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.auth.userId
    const { userId, leave } = req.body
    if (!userId || !leave) return res.status(400).json({ error: 'Missing userId or leave' })

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    if (!user) return res.status(404).json({ error: 'Target user not found' })

    const request = await createRequest(requesterId, 'LEAVE', { userId, leave })
    return res.json({ ok: true, request })
  } catch (e) {
    console.error('Create leave request error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Manager: create Outpass request for a user
router.post('/manager/requests/outpass', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.auth.userId
    const { userId, outpass } = req.body
    if (!userId || !outpass) return res.status(400).json({ error: 'Missing userId or outpass' })

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    if (!user) return res.status(404).json({ error: 'Target user not found' })

    const request = await createRequest(requesterId, 'OUTPASS', { userId, outpass })
    return res.json({ ok: true, request })
  } catch (e) {
    console.error('Create outpass request error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Manager: create Salary update request for a user
router.post('/manager/requests/salary', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.auth.userId
    const { userId, salary } = req.body
    if (!userId || !salary) return res.status(400).json({ error: 'Missing userId or salary' })

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    if (!user) return res.status(404).json({ error: 'Target user not found' })

    const request = await createRequest(requesterId, 'SALARY', { userId, salary })
    return res.json({ ok: true, request })
  } catch (e) {
    console.error('Create salary request error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Manager: propose edits to a user's registration/profile (goes to admin approval)
// section: one of [personal, family, education, medical, others]
router.post('/manager/requests/profile-edit', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.auth.userId
    const { userId, section, data } = req.body
    const allowed = new Set(['personal', 'family', 'education', 'medical', 'others', 'leave', 'salary'])
    if (!userId || !section || data === undefined) return res.status(400).json({ error: 'Missing userId, section or data' })
    if (!allowed.has(section)) return res.status(400).json({ error: 'Invalid section' })

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    if (!user) return res.status(404).json({ error: 'Target user not found' })

    const request = await createRequest(requesterId, 'PROFILE_UPDATE', { userId, section, data })
    return res.json({ ok: true, request })
  } catch (e) {
    console.error('Create profile update request error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Manager: list all requests (managers can see all requests in the system)
router.get('/manager/requests', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const managerId = req.auth.userId
    console.log('🔍 /api/manager/requests called by manager userId:', managerId)
    
    const status = req.query.status && String(req.query.status).toUpperCase()
    const type = req.query.type && String(req.query.type).toUpperCase()
    
    // Get all requests (not filtered by requester_id - managers see all requests)
    let query = supabase
      .from('requests')
      .select(`
        id,
        type,
        status,
        data,
        admin_remark,
        manager_response,
        created_at,
        updated_at,
        requester_id,
        users!requests_requester_id_fkey (
          id,
          username,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })
    
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)
    
    const { data: requestsRaw, error } = await query
    
    if (error) {
      console.error('❌ /api/manager/requests database error:', error)
      return res.status(500).json({ error: 'Internal error', details: error.message })
    }
    
    console.log(`✅ /api/manager/requests found ${requestsRaw?.length || 0} total requests`)
    
    // Collect all unique target user IDs from request data
    const userIds = [...new Set((requestsRaw || []).map((r: any) => {
      const requestData = r.data as any
      if (requestData && typeof requestData === 'object' && typeof requestData.userId === 'string') {
        return requestData.userId
      }
      return null
    }).filter(Boolean))]
    
    // Fetch all target users in one query
    const { data: targetUsersRaw } = userIds.length > 0 ? await supabase
      .from('users')
      .select('id, username, email, army_number, role')
      .in('id', userIds) : { data: [] }
    
    // Transform snake_case to camelCase for target users
    const targetUsers = (targetUsersRaw || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      armyNumber: u.army_number,
      role: u.role
    }))
    
    // Create a map for quick lookup
    const userMap = new Map(targetUsers.map((u: any) => [u.id, u]))
    
    // Transform snake_case to camelCase and add requester/target user info
    const requests = (requestsRaw || []).map((r: any) => {
      const requestData = r.data as any
      let targetUser = null
      
      // Extract target user from request data
      if (requestData && typeof requestData === 'object' && typeof requestData.userId === 'string') {
        targetUser = userMap.get(requestData.userId) || null
      }
      
      return {
        id: r.id,
        type: r.type,
        status: r.status,
        data: r.data,
        adminRemark: r.admin_remark,
        managerResponse: r.manager_response,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        requesterId: r.requester_id,
        requester: r.users ? {
          id: r.users.id,
          username: r.users.username,
          email: r.users.email,
          role: r.users.role
        } : null,
        targetUser: targetUser
      }
    })
    
    return res.json({ ok: true, requests })
  } catch (e: any) {
    console.error('❌ /api/manager/requests exception:', e)
    return res.status(500).json({ error: 'Internal error', details: e?.message })
  }
})

export default router
