import { Router, Request, Response } from 'express'
import { prisma } from '../db'
import { requireAuth } from '../middleware/auth'
import { AuthenticatedRequest } from '../types'

const router = Router()

// Ensure a profile row exists for the current user
async function ensureProfile(userId: string) {
  const existing = await prisma.userProfile.findUnique({ where: { userId } })
  if (existing) return existing
  return prisma.userProfile.create({ data: { userId } })
}

router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth.userId
    const profile = await prisma.userProfile.findUnique({ where: { userId } })
    return res.json(profile || {})
  } catch (e) {
    console.error('Get profile error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

router.put('/profile/personal', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth.userId
    await ensureProfile(userId)
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: { personalDetails: req.body, updatedAt: new Date() },
    })
    return res.json({ ok: true, personalDetails: updated.personalDetails })
  } catch (e) {
    console.error('Update personal error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

router.put('/profile/family', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth.userId
    await ensureProfile(userId)
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: { family: req.body, updatedAt: new Date() },
    })
    return res.json({ ok: true, family: updated.family })
  } catch (e) {
    console.error('Update family error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

router.put('/profile/education', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth.userId
    await ensureProfile(userId)
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: { education: req.body, updatedAt: new Date() },
    })
    return res.json({ ok: true, education: updated.education })
  } catch (e) {
    console.error('Update education error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

router.put('/profile/medical', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth.userId
    await ensureProfile(userId)
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: { medical: req.body, updatedAt: new Date() },
    })
    return res.json({ ok: true, medical: updated.medical })
  } catch (e) {
    console.error('Update medical error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

router.put('/profile/others', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth.userId
    await ensureProfile(userId)
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: { others: req.body, updatedAt: new Date() },
    })
    return res.json({ ok: true, others: updated.others })
  } catch (e) {
    console.error('Update others error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

router.put('/profile/leave', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth.userId
    await ensureProfile(userId)
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: { leaveData: req.body, updatedAt: new Date() },
    })
    return res.json({ ok: true, leave: updated.leaveData })
  } catch (e) {
    console.error('Update leave error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

router.put('/profile/salary', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth.userId
    await ensureProfile(userId)
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: { salaryData: req.body, updatedAt: new Date() },
    })
    return res.json({ ok: true, salary: updated.salaryData })
  } catch (e) {
    console.error('Update salary error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

export default router


