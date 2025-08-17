import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

type User = {
  id: string
  armyNumber: string
  username: string
  email: string
  role: 'USER' | 'ADMIN' | 'MANAGER'
  createdAt?: string
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; user: User | null; error: string | null }>
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; user: User | null; error: string | null }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateArmyNumber: (armyNumber: string) => Promise<User>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const me = await apiFetch<User>('/api/me')
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const loggedIn = await apiFetch<User>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password }),
      })
      setUser(loggedIn)
      return { success: true, user: loggedIn, error: null }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.'
      return { success: false, user: null, error: errorMessage }
    }
  }

  const signup = async (username: string, email: string, password: string) => {
    try {
      const created = await apiFetch<User>('/api/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      })
      setUser(created)
      return { success: true, user: created, error: null }
    } catch (error: any) {
      const errorMessage = error.message || 'Signup failed. Please try again.'
      return { success: false, user: null, error: errorMessage }
    }
  }

  const logout = async () => {
    await apiFetch('/api/logout', { method: 'POST' })
    setUser(null)
  }

  const updateArmyNumber = async (armyNumber: string) => {
    const updated = await apiFetch<User>('/api/update-army-number', {
      method: 'PUT',
      body: JSON.stringify({ armyNumber }),
    })
    setUser(updated)
    return updated
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser, updateArmyNumber }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
