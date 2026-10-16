import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { authAPI } from '../api'

// Backend kthen first_name/last_name; UI përdor user.name
const withName = (u) => u ? { ...u, name: u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') } : u

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('bletaria_token')
    const savedUser = localStorage.getItem('bletaria_user')
    if (token && savedUser) {
      try {
        setUser(withName(JSON.parse(savedUser)))
      } catch {
        localStorage.removeItem('bletaria_user')
        localStorage.removeItem('bletaria_token')
      }
    }
    setLoading(false)
  }, [])

  const applySession = useCallback((data) => {
    const userData = withName(data.user)
    localStorage.setItem('bletaria_token', data.token)
    localStorage.setItem('bletaria_user', JSON.stringify(userData))
    if (data.admin_token) localStorage.setItem('bletaria_admin_token', data.admin_token)
    else localStorage.removeItem('bletaria_admin_token')
    setUser(userData)
    return userData
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password })
    return applySession(res.data)
  }, [applySession])

  const demoLogin = useCallback(async (userId) => {
    const res = await api.post('/demo/login', { userId })
    return applySession(res.data)
  }, [applySession])

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data)
    return applySession(res.data)
  }, [applySession])

  const logout = useCallback(() => {
    localStorage.removeItem('bletaria_token')
    localStorage.removeItem('bletaria_user')
    localStorage.removeItem('bletaria_admin_token')
    setUser(null)
  }, [])

  const updateUser = useCallback((userData) => {
    const updated = withName({ ...user, ...userData, name: undefined })
    setUser(updated)
    localStorage.setItem('bletaria_user', JSON.stringify(updated))
  }, [user])

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me()
      const userData = withName(res.data.user || res.data)
      setUser(userData)
      localStorage.setItem('bletaria_user', JSON.stringify(userData))
    } catch {
      // Token expired or invalid
      logout()
    }
  }, [logout])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      demoLogin,
      register,
      logout,
      updateUser,
      refreshUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
