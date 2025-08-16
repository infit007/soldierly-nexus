const { Router } = require('express')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = Router()

// Manager: list all users (basic info) for selection in manager tools
router.get('/manager/users', requireAuth, requireRole('MANAGER'), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' },
      select: { id: true, username: true, email: true, role: true, armyNumber: true }
    })
    res.json(users)
  } catch (e) {
    console.error('List users for manager error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Manager: fetch a specific user's profile (view-only)
router.get('/manager/users/:id/profile', requireAuth, requireRole('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, role: true, armyNumber: true }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const profile = await prisma.userProfile.findUnique({ where: { userId: id } })
    return res.json({ ...user, profile: profile || null })
  } catch (e) {
    console.error('Get user profile for manager error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Helper to create a request row
async function createRequest(requesterId, type, data) {
  return prisma.request.create({
    data: {
      type,
      data,
      requesterId,
      status: 'PENDING',
    },
    select: {
      id: true,
      type: true,
      status: true,
      data: true,
      createdAt: true,
    }
  })
}

// Manager: create Leave request for a user
router.post('/manager/requests/leave', requireAuth, requireRole('MANAGER'), async (req, res) => {
  try {
    const requesterId = req.auth.userId
    const { userId, leave } = req.body
    if (!userId || !leave) return res.status(400).json({ error: 'Missing userId or leave' })

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) return res.status(404).json({ error: 'Target user not found' })

    const request = await createRequest(requesterId, 'LEAVE', { userId, leave })
    return res.json({ ok: true, request })
  } catch (e) {
    console.error('Create leave request error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Manager: create Outpass request for a user
router.post('/manager/requests/outpass', requireAuth, requireRole('MANAGER'), async (req, res) => {
  try {
    const requesterId = req.auth.userId
    const { userId, outpass } = req.body
    if (!userId || !outpass) return res.status(400).json({ error: 'Missing userId or outpass' })

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) return res.status(404).json({ error: 'Target user not found' })

    const request = await createRequest(requesterId, 'OUTPASS', { userId, outpass })
    return res.json({ ok: true, request })
  } catch (e) {
    console.error('Create outpass request error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Manager: create Salary update request for a user
router.post('/manager/requests/salary', requireAuth, requireRole('MANAGER'), async (req, res) => {
  try {
    const requesterId = req.auth.userId
    const { userId, salary } = req.body
    if (!userId || !salary) return res.status(400).json({ error: 'Missing userId or salary' })

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
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
router.post('/manager/requests/profile-edit', requireAuth, requireRole('MANAGER'), async (req, res) => {
  try {
    const requesterId = req.auth.userId
    const { userId, section, data } = req.body
    const allowed = new Set(['personal', 'family', 'education', 'medical', 'others', 'leave', 'salary'])
    if (!userId || !section || data === undefined) return res.status(400).json({ error: 'Missing userId, section or data' })
    if (!allowed.has(section)) return res.status(400).json({ error: 'Invalid section' })

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) return res.status(404).json({ error: 'Target user not found' })

    const request = await createRequest(requesterId, 'PROFILE_UPDATE', { userId, section, data })
    return res.json({ ok: true, request })
  } catch (e) {
    console.error('Create profile update request error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Manager: list own requests
router.get('/manager/requests', requireAuth, requireRole('MANAGER'), async (req, res) => {
  try {
    const requesterId = req.auth.userId
    const status = req.query.status && String(req.query.status).toUpperCase()
    const where = { requesterId, ...(status ? { status } : {}) }
    const requests = await prisma.request.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, status: true, data: true, createdAt: true, updatedAt: true }
    })
    return res.json({ ok: true, requests })
  } catch (e) {
    console.error('List manager requests error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

module.exports = router
