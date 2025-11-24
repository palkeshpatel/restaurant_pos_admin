import { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchUserInProgressRef = useRef(false)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !hasFetchedRef.current) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else if (!token) {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    if (fetchUserInProgressRef.current || hasFetchedRef.current) {
      return // Prevent duplicate calls
    }
    
    fetchUserInProgressRef.current = true
    try {
      const response = await api.get('/auth/me')
      // Handle different response structures
      const userData = response.data.data?.user || response.data.data || response.data.user || response.data
      console.log('API Response:', response.data)
      console.log('User Data:', userData)
      setUser(userData)
      hasFetchedRef.current = true
    } catch (error) {
      console.error('Error fetching user:', error)
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      fetchUserInProgressRef.current = false
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      // Handle different response structures
      const data = response.data.data || response.data
      const token = data.token || data.access_token
      const user = data.user || data
      console.log('Login Response:', response.data)
      console.log('User from login:', user)
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

