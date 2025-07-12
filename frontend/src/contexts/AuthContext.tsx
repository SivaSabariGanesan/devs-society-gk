import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../services/api'
import { getCurrentUser, setCurrentUser, removeAuthToken, setAuthToken, usersAPI } from '../services/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: User) => void
  refreshUser: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Refresh user profile from API
  const refreshUser = useCallback(async () => {
    try {
      setError(null)
      const response = await usersAPI.getProfile()
      if (response.success) {
        setCurrentUser(response.user)
        setUser(response.user)
      }
    } catch (error: any) {
      console.error('Failed to refresh user profile:', error)
      if (error.response?.status === 401) {
        // Token is invalid, logout user
        logout()
      } else {
        setError('Failed to sync profile. Please refresh the page.')
      }
    }
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = getCurrentUser()
        const token = localStorage.getItem('authToken')
        
        if (storedUser && token) {
          setUser(storedUser)
          // Try to refresh user data to ensure it's current
          try {
            await refreshUser()
          } catch (error) {
            // If refresh fails, use stored user data
            console.warn('Using cached user data, refresh failed:', error)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        removeAuthToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [refreshUser])

  const login = useCallback((userData: User, token: string) => {
    try {
      setAuthToken(token)
      setCurrentUser(userData)
      setUser(userData)
      setError(null)
    } catch (error) {
      console.error('Login error:', error)
      setError('Failed to save login information')
    }
  }, [])

  const logout = useCallback(() => {
    try {
      removeAuthToken()
      setUser(null)
      setError(null)
      
      // Redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if there's an error
      setUser(null)
      window.location.href = '/login'
    }
  }, [])

  const updateUser = useCallback((userData: User) => {
    try {
      setCurrentUser(userData)
      setUser(userData)
      setError(null)
    } catch (error) {
      console.error('Update user error:', error)
      setError('Failed to update user information')
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-refresh user profile periodically (every 5 minutes)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      refreshUser()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user, refreshUser])

  // Listen for storage changes (logout from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && !e.newValue && user) {
        // Token was removed in another tab, logout this tab too
        setUser(null)
        setError(null)
      } else if (e.key === 'user' && e.newValue && !user) {
        // User was set in another tab, login this tab too
        try {
          const userData = JSON.parse(e.newValue)
          setUser(userData)
        } catch (error) {
          console.error('Failed to parse user data from storage:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    updateUser,
    refreshUser,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 