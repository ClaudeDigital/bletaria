import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'

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
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('bletaria_user')
        localStorage.removeItem('bletaria_token')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token, user: userData } = res.data
    localStorage.setItem('bletaria_token', token)
    localStorage.setItem('bletaria_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data)
    const { token, user: userData } = res.data
    localStorage.setItem('bletaria_token', token)
    localStorage.setItem('bletaria_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('bletaria_token')
    localStorage.removeItem('bletaria_user')
    setUser(null)
  }, [])

  const updateUser = useCallback((userData) => {
    const updated = { ...user, ...userData }
    setUser(updated)
    localStorage.setItem('bletaria_user', JSON.stringify(updated))
  }, [user])

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me()
      const userData = res.data.user || res.data
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
      register,
      logout,
      updateUser,
      refreshUser,
      isAuthenticated: !!user,
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
