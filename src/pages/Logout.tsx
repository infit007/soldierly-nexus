import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Logout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      await logout()
      navigate('/login', { replace: true })
    })()
  }, [logout, navigate])

  return null
}
