'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

export interface RegisterData {
  username: string
  password: string
  email: string
  phone: string
  role: 'user' | 'worker'
  district: string
  street: string
  address: string
  emergency_contact: string
  emergency_phone: string
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('l6_token')
    if (saved) {
      setToken(saved)
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${saved}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setUser(d.user) })
        .catch(() => localStorage.removeItem('l6_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.token) {
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('l6_token', data.token)
      return { success: true }
    }
    return { success: false, error: data.error || '登录失败' }
  }

  const register = async (regData: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData),
    })
    const data = await res.json()
    if (data.token) {
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('l6_token', data.token)
      return { success: true }
    }
    return { success: false, error: data.error || '注册失败' }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('l6_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)