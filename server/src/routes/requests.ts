import { Router, Request, Response } from 'express'
import { supabase } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { AuthenticatedRequest } from '../types/index.js'

const router = Router()

async function ensureProfile(userId: string) {
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (existing) return existing
  const { data: newProfile } = await supabase
    .from('user_profiles')
    .insert({ user_id: userId })
    .select()
    .single()
  return newProfile
}

// Type guards for JSON data
function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isArray(value: any): value is any[] {
  return Array.isArray(value)
}

async function applyApprovedRequest(reqRow: any) {
  const { type, data } = reqRow
  const { userId } = data || {}
  if (!userId) return

  await ensureProfile(userId)

  switch (type) {
    case 'LEAVE': {
      // Merge into leaveData (append to requests array)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('leave')
        .eq('user_id', userId)
        .single()
      const leaveData = profile?.leave || {}
      const safeLeaveData = isObject(leaveData) ? leaveData : {}
      const requests = isArray((safeLeaveData as any).requests) ? (safeLeaveData as any).requests : []
      requests.push({ ...data.leave, approvedAt: new Date().toISOString() })
      await supabase
        .from('user_profiles')
        .update({ leave: { ...safeLeaveData, requests }, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      break
    }
    case 'OUTPASS': {
      // Merge into leaveData.outpasses
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('leave')
        .eq('user_id', userId)
        .single()
      const leaveData = profile?.leave || {}
      const safeLeaveData = isObject(leaveData) ? leaveData : {}
      const outpasses = isArray((safeLeaveData as any).outpasses) ? (safeLeaveData as any).outpasses : []
      outpasses.push({ ...data.outpass, approvedAt: new Date().toISOString() })
      await supabase
        .from('user_profiles')
        .update({ leave: { ...safeLeaveData, outpasses }, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      break
    }
    case 'SALARY': {
      // Replace/merge salaryData
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('salary')
        .eq('user_id', userId)
        .single()
      const current = profile?.salary || {}
      const safeCurrent = isObject(current) ? current : {}
      const safeSalaryData = isObject(data.salary) ? data.salary : {}
      await supabase
        .from('user_profiles')
        .update({ salary: { ...safeCurrent, ...safeSalaryData }, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      break
    }
    case 'PROFILE_UPDATE': {
      const { section, data: sectionData } = data
      const map: Record<string, string> = {
        personal: 'personal_details',
        family: 'family',
        education: 'education',
        medical: 'medical',
        others: 'others',
        leave: 'leave',
        salary: 'salary'
      }
      const column = map[section]
      if (!column) return
      await supabase
        .from('user_profiles')
        .update({ [column]: sectionData, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      break
    }
    default:
      break
  }
}

// Admin: list requests
router.get('/admin/requests', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status && String(req.query.status).toUpperCase()
    const type = req.query.type && String(req.query.type).toUpperCase()
    const where = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    }
    let query = supabase
      .from('requests')
      .select(`
        id,
        type,
        status,
        data,
        admin_remark as adminRemark,
        manager_response as managerResponse,
        created_at as createdAt,
        updated_at as updatedAt,
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
    
    const { data: requests } = await query

    // Collect all unique user IDs with proper type checking
    const userIds = [...new Set((requests || []).map((r: any) => {
      const requestData = r.data as any
      if (isObject(requestData) && typeof requestData.userId === 'string') {
        return requestData.userId
      }
      return null
    }).filter(Boolean))]
    
    // Fetch all target users in one query
    const { data: targetUsers } = userIds.length > 0 ? await supabase
      .from('users')
      .select('id, username, email, army_number as armyNumber, role')
      .in('id', userIds) : { data: [] }
    
    // Create a map for quick lookup
    const userMap = new Map((targetUsers || []).map((u: any) => [u.id, u]))
    
    // Add target user information for each request
    const requestsWithTargetUser = (requests || []).map((request: any) => ({
      ...request,
      requester: request.users,
      targetUser: (() => {
        const requestData = request.data as any
        if (isObject(requestData) && typeof requestData.userId === 'string') {
          return userMap.get(requestData.userId) || null
        }
        return null
      })()
    }))
    res.json({ ok: true, requests: requestsWithTargetUser })
  } catch (e) {
    console.error('List requests error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Admin: approve a request and apply effect
router.post('/admin/requests/:id/approve', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  try {
    const { data: request } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single()
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request not pending' })

    // Update request status immediately
    const { data: updated } = await supabase
      .from('requests')
      .update({ status: 'APPROVED' })
      .eq('id', id)
      .select()
      .single()
    
    // Apply profile updates asynchronously (don't wait for it)
    applyApprovedRequest(updated).catch(e => {
      console.error('Background profile update failed:', e)
    })

    res.json({ ok: true, request: updated })
  } catch (e) {
    console.error('Approve request error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Admin: reject a request with required remark
router.post('/admin/requests/:id/reject', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const { remark } = req.body || {}
  try {
    const { data: request } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single()
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request not pending' })
    if (!remark || typeof remark !== 'string' || remark.trim().length === 0) {
      return res.status(400).json({ error: 'Remark is required for rejection' })
    }

    const { data: updated } = await supabase
      .from('requests')
      .update({ 
        status: 'REJECTED', 
        admin_remark: remark.trim(),
        data: { 
          ...(isObject(request.data as any) ? request.data as any : {}), 
          rejectionReason: remark.trim() 
        } 
      })
      .eq('id', id)
      .select()
      .single()
    res.json({ ok: true, request: updated })
  } catch (e) {
    console.error('Reject request error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Manager: respond to admin remark and resubmit rejected request
router.post('/manager/requests/:id/resubmit', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const { response, updatedData } = req.body || {}
  try {
    const { data: request } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single()
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.status !== 'REJECTED') return res.status(400).json({ error: 'Request is not rejected' })
    if (request.requester_id !== req.auth.userId) return res.status(403).json({ error: 'Not authorized to resubmit this request' })
    if (!response || typeof response !== 'string' || response.trim().length === 0) {
      return res.status(400).json({ error: 'Response to admin remark is required' })
    }

    // Merge updated data with original data if provided
    const newData = updatedData ? { ...(isObject(request.data as any) ? request.data as any : {}), ...updatedData } : request.data

    const { data: updated } = await supabase
      .from('requests')
      .update({ 
        status: 'PENDING', 
        manager_response: response.trim(),
        data: newData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    res.json({ ok: true, request: updated })
  } catch (e) {
    console.error('Resubmit request error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

export default router
