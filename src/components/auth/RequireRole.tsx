import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function RequireRole({ role, children }: { role: 'USER' | 'ADMIN' | 'MANAGER'; children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    const fallback = user.role === 'ADMIN' ? '/admin-dashboard' : (user.role === 'MANAGER' ? '/manager' : '/')
    return <Navigate to={fallback} replace />
  }
  return children
}
