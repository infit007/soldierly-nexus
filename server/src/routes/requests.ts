import { Router, Request, Response } from 'express'
import { prisma } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { AuthenticatedRequest } from '../types/index.js'

const router = Router()

async function ensureProfile(userId: string) {
  const existing = await prisma.userProfile.findUnique({ where: { userId } })
  if (existing) return existing
  return prisma.userProfile.create({ data: { userId } })
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
      const profile = await prisma.userProfile.findUnique({ where: { userId } })
      const leaveData = profile?.leaveData || {}
      const safeLeaveData = isObject(leaveData) ? leaveData : {}
      const requests = isArray((safeLeaveData as any).requests) ? (safeLeaveData as any).requests : []
      requests.push({ ...data.leave, approvedAt: new Date().toISOString() })
      await prisma.userProfile.update({
        where: { userId },
        data: { leaveData: { ...safeLeaveData, requests }, updatedAt: new Date() }
      })
      break
    }
    case 'OUTPASS': {
      // Merge into leaveData.outpasses
      const profile = await prisma.userProfile.findUnique({ where: { userId } })
      const leaveData = profile?.leaveData || {}
      const safeLeaveData = isObject(leaveData) ? leaveData : {}
      const outpasses = isArray((safeLeaveData as any).outpasses) ? (safeLeaveData as any).outpasses : []
      outpasses.push({ ...data.outpass, approvedAt: new Date().toISOString() })
      await prisma.userProfile.update({
        where: { userId },
        data: { leaveData: { ...safeLeaveData, outpasses }, updatedAt: new Date() }
      })
      break
    }
    case 'SALARY': {
      // Replace/merge salaryData
      const profile = await prisma.userProfile.findUnique({ where: { userId } })
      const current = profile?.salaryData || {}
      const safeCurrent = isObject(current) ? current : {}
      const safeSalaryData = isObject(data.salary) ? data.salary : {}
      await prisma.userProfile.update({
        where: { userId },
        data: { salaryData: { ...safeCurrent, ...safeSalaryData }, updatedAt: new Date() }
      })
      break
    }
    case 'PROFILE_UPDATE': {
      const { section, data: sectionData } = data
      const map: Record<string, string> = {
        personal: 'personalDetails',
        family: 'family',
        education: 'education',
        medical: 'medical',
        others: 'others',
        leave: 'leaveData',
        salary: 'salaryData'
      }
      const column = map[section]
      if (!column) return
      await prisma.userProfile.update({
        where: { userId },
        data: { [column]: sectionData, updatedAt: new Date() }
      })
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
    const requests = await prisma.request.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        data: true,
        createdAt: true,
        updatedAt: true,
        requester: { select: { id: true, username: true, email: true, role: true } }
      }
    })

    // Collect all unique user IDs with proper type checking
    const userIds = [...new Set(requests.map(r => {
      const requestData = r.data as any
      if (isObject(requestData) && typeof requestData.userId === 'string') {
        return requestData.userId
      }
      return null
    }).filter(Boolean))]
    
    // Fetch all target users in one query
    const targetUsers = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true, armyNumber: true, role: true }
    }) : []
    
    // Create a map for quick lookup
    const userMap = new Map(targetUsers.map(u => [u.id, u]))
    
    // Add target user information for each request
    const requestsWithTargetUser = requests.map(request => ({
      ...request,
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
    const request = await prisma.request.findUnique({ where: { id } })
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request not pending' })

    // Update request status immediately
    const updated = await prisma.request.update({ where: { id }, data: { status: 'APPROVED' } })
    
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

// Admin: reject a request with optional reason
router.post('/admin/requests/:id/reject', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const { reason } = req.body || {}
  try {
    const request = await prisma.request.findUnique({ where: { id } })
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request not pending' })

    const updated = await prisma.request.update({ 
      where: { id }, 
      data: { 
        status: 'REJECTED', 
        data: { 
          ...(isObject(request.data as any) ? request.data as any : {}), 
          rejectionReason: reason || null 
        } 
      } 
    })
    res.json({ ok: true, request: updated })
  } catch (e) {
    console.error('Reject request error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

export default router
