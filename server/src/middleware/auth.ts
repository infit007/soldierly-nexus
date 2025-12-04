import jwt from 'jsonwebtoken'
import { AuthenticatedRequest } from '../types'

// Shared JWT secret: use Supabase service key when available (Supabase hosting),
// otherwise fall back to JWT_SECRET for local/dev usage.
const JWT_SECRET = process.env.SUPABASE_SERVICE_KEY || process.env.JWT_SECRET || 'dev-secret'

export function requireAuth(req: any, res: any, next: any) {
  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.auth = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export function requireRole(role: string) {
  return (req: any, res: any, next: any) => {
    const auth = req.auth
    if (!auth) return res.status(401).json({ error: 'Unauthorized' })
    if (auth.role !== role) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}
