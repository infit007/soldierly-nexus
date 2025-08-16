const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret'
    const payload = jwt.verify(token, secret)
    req.auth = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

function requireRole(role) {
  return (req, res, next) => {
    const auth = req.auth
    if (!auth) return res.status(401).json({ error: 'Unauthorized' })
    if (auth.role !== role) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

module.exports = { requireAuth, requireRole }
